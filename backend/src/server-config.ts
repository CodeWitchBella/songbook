import { gql, UserInputError } from 'apollo-server'
import { firestore } from './firestore'
import latinize from 'latinize'
import crypto from 'crypto'
import fetch from 'node-fetch'
import { DateTime, Duration } from 'luxon'
import * as functions from 'firebase-functions'
import { notNull } from '@codewitchbella/ts-utils'
import { FieldValue } from '@google-cloud/firestore'

function sanitizeSongId(part: string) {
  return latinize(part)
    .trim()
    .replace(/ /g, '_')
    .replace(/[^a-z_0-9]/gi, '')
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Song {
    slug: String!
    author: String!
    title: String!
    text: String!

    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String

    editor: User
    insertedAt: String
  }

  type SongRecord {
    data: Song!
    id: String!
    lastModified: String!
  }

  type Query {
    hello: String
    songs(modifiedAfter: String): [SongRecord!]!
    songsBySlugs(slugs: [String!]!): [SongRecord!]!
    songsByIds(ids: [String!]!): [SongRecord!]!
    viewer: User
  }

  input CreateSongInput {
    author: String!
    title: String!
  }

  input UpdateSongInput {
    slug: String
    author: String
    title: String
    text: String

    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String
  }

  type LoginSuccess {
    user: User!
  }
  type LoginError {
    message: String!
  }
  union LoginPayload = LoginSuccess | LoginError

  type UserPicture {
    url: String!
    width: Int!
    height: Int!
  }

  type User {
    name: String!
    picture: UserPicture!
  }

  type Mutation {
    createSong(input: CreateSongInput!): SongRecord
    updateSong(id: String!, input: UpdateSongInput!): SongRecord
    fbLogin(code: String!, redirectUri: String!): LoginPayload!
    logout: String
  }
`

async function songBySlug(slug: string) {
  const { docs } = await firestore
    .collection('songs')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  if (docs.length < 1) return null
  const doc = docs[0]
  if (!doc.exists) return null
  return doc
}

async function randomID(length: number) {
  return crypto
    .randomBytes(Math.ceil((length / 3) * 2) + 1)
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromEntries(entries: [string, any][]) {
  const ret: { [key: string]: any } = {}
  for (const [k, v] of entries) {
    ret[k] = v
  }
  return ret
}

async function getViewer(req: functions.https.Request) {
  const cookies = req.get('cookie')
  if (!cookies) return null
  for (const cookie of cookies.split(';')) {
    if (cookie.startsWith('__session=')) {
      const token = cookie.replace('__session=', '').trim()
      const session = firestore.doc('sessions/' + token)
      const data = (await session.get()).data()
      if (!data) return
      return { viewer: firestore.doc(data.user), session }
    }
  }
  return null
}

function setSessionCookie(
  res: functions.Response,
  value: string,
  duration: Duration,
) {
  res.set(
    'Set-Cookie',
    `__session=${value}; Max-Age=${duration.as('seconds')}; HttpOnly; Path=/`,
  )
}

type Context = { req: functions.https.Request; res: functions.Response }
// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
    songs: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
    ) => {
      const docs = await (() => {
        if (modifiedAfter) {
          return firestore
            .collection('songs')
            .where(
              'lastModified',
              '>',
              DateTime.fromISO(modifiedAfter).toJSDate(),
            )
            .get()
        }
        return firestore.collection('songs').get()
      })()
      return docs.docs
    },
    songsByIds: async (_: {}, { ids }: { ids: string[] }) => {
      const songs = await firestore.getAll(
        ...ids.map(id => firestore.doc('songs/' + id)),
      )
      return songs.filter(snap => snap.exists)
    },
    songsBySlugs: async (_: {}, { slugs }: { slugs: string[] }) => {
      const songs = await Promise.all(slugs.map(songBySlug))
      return songs.filter(notNull)
    },
    viewer: async (_: {}, _2: {}, { req }: Context) => {
      const data = await getViewer(req)
      if (data) return (await data.viewer.get()).data()
      return null
    },
  },
  Song: {
    editor: async (src: any) => {
      if (src.editor) return (await firestore.doc(src.editor).get()).data()
      return null
    },
    insertedAt: (src: any) =>
      !src.insertedAt
        ? null
        : typeof src.insertedAt === 'string'
        ? src.insertedAt
        : DateTime.fromJSDate(src.insertedAt.toDate())
            .setZone('utc')
            .toISO(),
  },
  SongRecord: {
    data: (src: any) => src.data(),
    lastModified: (src: any) => {
      const data = src.data()
      return DateTime.fromJSDate(
        !!data.lastModified
          ? data.lastModified.toDate()
          : src.updateTime.toDate(),
      )
        .setZone('utc')
        .toISO()
    },
  },
  LoginPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  Mutation: {
    createSong: async (
      _: {},
      { input }: { input: { author: string; title: string } },
      { req }: Context,
    ) => {
      const viewer = await getViewer(req)
      if (!viewer) throw new UserInputError('Must be logged in')

      const { title, author } = input
      const slug = `${sanitizeSongId(title)}-${sanitizeSongId(author)}`
      const existing = await songBySlug(slug)
      if (existing !== null) throw new UserInputError('Song already exists')
      const doc = firestore.doc('songs/' + (await randomID(20)))
      if ((await doc.get()).exists) throw new Error('Generated coliding id')
      await doc.set({
        title,
        author,
        slug,
        text: '',
        editor: 'users/' + viewer.viewer.id,
        insertedAt: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
      })
      return await doc.get()
    },
    updateSong: async (
      _: {},
      { id, input: input }: { input: any; id: string },
    ) => {
      const doc = firestore.doc('songs/' + id)
      const prev = await doc.get()
      if (!prev.exists) throw new Error('Song does not exist')
      await doc.set({
        ...prev.data(),
        ...fromEntries(Object.entries(input).filter(([, v]) => v !== null)),
        lastModified: FieldValue.serverTimestamp(),
      })
      return doc.get()
    },
    async fbLogin(
      _: {},
      { code, redirectUri }: { code: string; redirectUri: string },
      { res }: Context,
    ) {
      const secrets = process.env.SECRETS as any
      const token:
        | {
            access_token: string
            token_type: 'bearer'
            expires_in: number
          }
        | {
            error: {
              message: string
              type: string
              code: number
              fbtrace_id: string
            }
          } = await (await fetch(
        'https://graph.facebook.com/v3.3/oauth/access_token?' +
          new URLSearchParams({
            client_id: '331272811153847',
            redirect_uri: redirectUri,
            client_secret: secrets.fb_secret,
            code,
          }).toString(),
      )).json()
      if ('error' in token) {
        return { __typename: 'LoginError', message: token.error.message }
      }
      const tokenExpiration = DateTime.utc().plus({ seconds: token.expires_in })
      const basicInfo: {
        id: string
        name: string
        email: string
      } = await (await fetch(
        'https://graph.facebook.com/v3.3/me?' +
          new URLSearchParams({
            fields: 'id,name,email',
            access_token: token.access_token,
          }).toString(),
      )).json()
      const picture: {
        data: {
          height: number
          is_silhouette: boolean
          url: string
          width: number
        }
      } = await (await fetch(
        'https://graph.facebook.com/v3.3/me/picture?' +
          new URLSearchParams({
            type: 'large',
            access_token: token.access_token,
            redirect: '0',
          }).toString(),
      )).json()

      const user = firestore.doc('users/' + basicInfo.id)
      const existingData = await (async () => {
        const d = await user.get()
        if (!d.exists) return {}
        return d.data()
      })()
      await user.set({
        ...existingData,
        fbId: basicInfo.id,
        name: basicInfo.name,
        email: basicInfo.email,
        picture: picture.data,
        fbToken: {
          token: token.access_token,
          expires: tokenExpiration.toISO(),
        },
      })

      const sessionToken = await randomID(30)
      const session = firestore.doc('sessions/' + sessionToken)
      const sessionDuration = Duration.fromObject({ months: 2 })
      await session.set({
        user: 'users/' + basicInfo.id,
        token: sessionToken,
        expires: DateTime.utc()
          .plus(sessionDuration)
          .toISO(),
      })

      setSessionCookie(res, sessionToken, sessionDuration)

      return {
        __typename: 'LoginSuccess',
        user: (await user.get()).data(),
      }
    },
    logout: async (_: {}, _2: {}, { req, res }: Context) => {
      const data = await getViewer(req)
      // make it expire
      setSessionCookie(res, '', Duration.fromObject({ second: 1 }))
      if (data) {
        await data.session.delete()
      }
      return 'Success!'
    },
  },
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  //tracing: true,
}
