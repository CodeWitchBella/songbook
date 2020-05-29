import { gql, UserInputError } from 'apollo-server'
import { firestore } from './_firestore'
import latinize from 'latinize'
import crypto from 'crypto'
import { DateTime, Duration } from 'luxon'
import { notNull } from '@codewitchbella/ts-utils'
import { FieldValue } from '@google-cloud/firestore'
import * as bcrypt from 'bcryptjs'
import { MyContext } from './_context'

function slugify(part: string) {
  return latinize(part)
    .replace(/[^a-z_0-9]/gi, ' ')
    .trim()
    .replace(/ +/g, '-')
    .toLowerCase()
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Song {
    slug: String!
    author: String!
    title: String!
    text: String!

    fontSize: Float!
    paragraphSpace: Float!
    titleSpace: Float!
    spotify: String

    extraSearchable: String
    extraNonSearchable: String

    editor: User
    insertedAt: String
  }

  type SongRecord {
    data: Song!
    id: String!
    lastModified: String!
  }

  type Deleted {
    id: String!
  }

  type Query {
    hello: String
    songs(modifiedAfter: String): [SongRecord!]!
    deletedSongs(deletedAfter: String!): [String!]!
    songsBySlugs(slugs: [String!]!): [SongRecord!]!
    songsByIds(ids: [String!]!): [SongRecord!]!
    viewer: User
    collections(modifiedAfter: String): [DeletableCollectionRecord!]!
    collectionsByIds(ids: [String!]!): [CollectionRecord!]!
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

    extraSearchable: String
    extraNonSearchable: String
  }

  type LoginSuccess {
    user: User!
  }
  type LoginError {
    message: String!
  }
  union LoginPayload = LoginSuccess | LoginError

  type RegisterSuccess {
    user: User!
  }
  type RegisterError {
    message: String!
  }
  union RegisterPayload = RegisterSuccess | RegisterError

  type UserPicture {
    url: String!
    width: Int!
    height: Int!
  }

  type User {
    name: String!
    picture: UserPicture
    handle: String
  }

  type Collection {
    slug: String!
    name: String!
    owner: User!
    songList: [SongRecord!]!
    insertedAt: String!
  }

  type CollectionRecord {
    data: Collection!
    id: String!
    lastModified: String!
  }

  union DeletableCollectionRecord = CollectionRecord | Deleted

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  type Mutation {
    createSong(input: CreateSongInput!): SongRecord
    updateSong(id: String!, input: UpdateSongInput!): SongRecord
    login(email: String!, password: String!): LoginPayload!
    register(input: RegisterInput!): RegisterPayload!
    logout: String
    setHandle(handle: String!): String
    createCollection(name: String!, global: Boolean): CollectionRecord
    addToCollection(collection: String!, song: String!): String
    removeFromCollection(collection: String!, song: String!): String
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

async function getViewer(context: MyContext) {
  const token = (context.sessionCookie || '').trim()
  if (!token) return
  const session = firestore.doc('sessions/' + token)
  const data = (await session.get()).data()
  if (!data) return
  return { viewer: firestore.doc(data.user), session }
}

async function getViewerCheck(context: MyContext) {
  const viewer = await getViewer(context)
  if (!viewer) throw new UserInputError('Not logged in')
  return viewer
}

function whereModifiedAfter(path: string, modifiedAfter: string | null) {
  const ref = firestore.collection(path)
  if (modifiedAfter) {
    return ref
      .where('lastModified', '>', DateTime.fromISO(modifiedAfter).toJSDate())
      .get()
  }
  return ref.where('deleted', '==', false).get()
}

export const comparePassword = (password: string, hash: string) => {
  return new Promise<boolean>((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

export const hashPassword = (password: string): Promise<string> => {
  return new Promise((res, rej) =>
    bcrypt.genSalt(10, (err, salt) => {
      if (err) rej(err)
      else {
        bcrypt.hash(password, salt, (err2, hash) => {
          if (err2) rej(err2)
          else res(hash)
        })
      }
    }),
  )
}

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
    songs: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
    ) => {
      const docs = await whereModifiedAfter('songs', modifiedAfter)
      return docs.docs
    },
    deletedSongs: async (_: {}, { deletedAfter }: { deletedAfter: string }) => {
      const docs = await whereModifiedAfter('deletedSongs', deletedAfter)
      return docs.docs.map((d) => d.id)
    },
    collections: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
    ) => {
      const docs = await whereModifiedAfter('collections', modifiedAfter)
      return docs.docs
    },
    songsByIds: async (_: {}, { ids }: { ids: string[] }) => {
      const songs = await firestore.getAll(
        ...ids.map((id) => firestore.doc('songs/' + id)),
      )
      return songs.filter((snap) => snap.exists)
    },
    collectionsByIds: async (_: {}, { ids }: { ids: string[] }) => {
      const songs = await firestore.getAll(
        ...ids.map((id) => firestore.doc('collections/' + id)),
      )
      return songs.filter((snap) => snap.exists)
    },
    songsBySlugs: async (_: {}, { slugs }: { slugs: string[] }) => {
      const songs = await Promise.all(slugs.map(songBySlug))
      return songs.filter(notNull)
    },
    viewer: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context)
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
        : DateTime.fromJSDate(src.insertedAt.toDate()).setZone('utc').toISO(),
    fontSize: (src: any) =>
      typeof src.fontSize === 'number' ? src.fontSize : 1,
    paragraphSpace: (src: any) =>
      typeof src.paragraphSpace === 'number' ? src.paragraphSpace : 1,
    titleSpace: (src: any) =>
      typeof src.titleSpace === 'number' ? src.titleSpace : 1,
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
  CollectionRecord: {
    lastModified: (src: any) => {
      const data = src.data()
      return DateTime.fromJSDate(data.lastModified.toDate())
        .setZone('utc')
        .toISO()
    },
  },
  DeletableCollectionRecord: {
    __resolveType: (src: any) =>
      src.data().deleted ? 'Deleted' : 'CollectionRecord',
  },
  Collection: {
    insertedAt: (src: any) =>
      DateTime.fromJSDate(src.insertedAt.toDate()).setZone('utc').toISO(),
    owner: async (src: any) => {
      const owner = await firestore.doc(src.owner).get()
      return owner.data()
    },
    songList: async (src: any) => {
      return src.list.length < 1
        ? []
        : firestore.getAll(...src.list.map((id: string) => firestore.doc(id)))
    },
  },
  LoginPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  Mutation: {
    setHandle: async (
      _: {},
      { handle }: { handle: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)

      await viewer.set({ handle }, { merge: true })
      const collections = await firestore
        .collection('collections')
        .where('owner', '==', 'users/' + viewer.id)
        .get()
      await Promise.all(
        collections.docs
          .filter((doc) => !doc.get('global'))
          .map((doc) =>
            doc.ref.set(
              {
                slug: slugify(handle) + '/' + slugify(doc.get('name')),
                lastModified: FieldValue.serverTimestamp(),
              },
              { merge: true },
            ),
          ),
      )
      return 'success'
    },
    createCollection: async (
      _: {},
      {
        name: requestedName,
        global = false,
      }: { name: string; global: boolean },
      context: MyContext,
    ) => {
      const vsrc = await getViewerCheck(context)
      const viewer = await vsrc.viewer.get()
      if (global && !viewer.get('admin'))
        throw new UserInputError('Only admin can create global songbooks')

      const slug =
        (global
          ? ''
          : slugify(viewer.get('handle') || viewer.get('name')) + '/') +
        slugify(requestedName)
      const existing = await firestore
        .collection('collections')
        .where('slug', '==', slug)
        .select('slug')
        .limit(1)
        .get()
      if (existing.docs.length > 0)
        throw new Error('Collection with given name already exists')

      const doc = firestore.doc('collections/' + (await randomID(20)))
      await doc.set({
        name: requestedName,
        owner: 'users/' + viewer.id,
        insertedAt: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
        global,
        slug,
        deleted: false,
        list: [],
      })
      return doc.get()
    },
    addToCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)
      const collectionRef = firestore.doc('collections/' + collection)
      const collectionSnap = await collectionRef.get()
      if (collectionSnap.get('owner') !== 'users/' + viewer.id)
        throw new UserInputError('Not your collection')
      const songSnap = await firestore.doc('songs/' + song).get()
      if (!songSnap.exists) throw new UserInputError('Song does not exist')

      await collectionRef.set(
        {
          list: FieldValue.arrayUnion('songs/' + song),
          lastModified: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      return 'Success!'
    },
    removeFromCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)
      const collectionRef = firestore.doc('collections/' + collection)
      const collectionSnap = await collectionRef.get()
      if (collectionSnap.get('owner') !== 'users/' + viewer.id)
        throw new UserInputError('Not your collection')
      const songSnap = await firestore.doc('songs/' + song).get()
      if (!songSnap.exists) throw new UserInputError('Song does not exist')

      await collectionRef.set(
        {
          list: FieldValue.arrayRemove('songs/' + song),
          lastModified: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      return 'Success!'
    },
    createSong: async (
      _: {},
      { input }: { input: { author: string; title: string } },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)

      const { title, author } = input
      const slug = slugify(`${title}-${author}`)
      const existing = await songBySlug(slug)
      if (existing !== null) throw new UserInputError('Song already exists')
      const doc = firestore.doc('songs/' + (await randomID(20)))
      if ((await doc.get()).exists) throw new Error('Generated coliding id')
      await doc.set({
        title,
        author,
        slug,
        text: '',
        editor: 'users/' + viewer.id,
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
      await doc.set(
        {
          ...fromEntries(Object.entries(input).filter(([, v]) => v !== null)),
          lastModified: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      return doc.get()
    },
    async login(
      _: {},
      { email, password }: { email: string; password: string },
      context: MyContext,
    ) {
      const user = await firestore
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()
      const doc = user.docs[0]
      if (!doc) {
        return {
          __typename: 'LoginError',
          message: 'Uživatel s daným emailem nenalezen',
        }
      }

      const passwordHash = doc.get('passwordHash')
      if (!passwordHash) {
        doc.ref.set(
          { passwordHash: await hashPassword(password) },
          { merge: true },
        )
      } else {
        if (!(await comparePassword(password, passwordHash))) {
          return { __typename: 'LoginError', message: 'Chybné heslo' }
        }
      }

      await createSession(context, doc.id)

      return {
        __typename: 'LoginSuccess',
        user: await doc.data(),
      }
    },
    async register(
      _: {},
      { input }: { input: { name: string; email: string; password: string } },
      context: MyContext,
    ) {
      if (!input.name || !input.email || !input.password)
        return {
          __typename: 'RegisterError',
          message: 'Všechna pole jsou povinná',
        }
      const user = await firestore
        .collection('users')
        .where('email', '==', input.email)
        .limit(1)
        .get()
      if (user.docs.length > 0)
        return { __typename: 'RegisterError', message: 'Email je již použit' }
      const id = await randomID(30)
      const doc = firestore.doc('users/' + id)
      await doc.set({
        name: input.name,
        passwordHash: await hashPassword(input.password),
        email: input.email,
      })
      await createSession(context, id)
      return {
        __typename: 'RegisterSuccess',
        user: (await doc.get()).data(),
      }
    },
    logout: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context)
      // make it expire
      context.setSessionCookie('', Duration.fromObject({ second: 1 }))
      if (data) {
        await data.session.delete()
      }
      return 'Success!'
    },
  },
}

async function createSession(context: MyContext, id: string) {
  const sessionToken = await randomID(30)
  const session = firestore.doc('sessions/' + sessionToken)
  const sessionDuration = Duration.fromObject({ months: 2 })
  await session.set({
    user: 'users/' + id,
    token: sessionToken,
    expires: DateTime.utc().plus(sessionDuration).toISO(),
  })

  context.setSessionCookie(sessionToken, sessionDuration)
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  //tracing: true,
}
