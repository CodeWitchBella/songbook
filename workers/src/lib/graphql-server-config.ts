import * as bcrypt from '@isbl/bcryptjs'
import { gql, UserInputError } from 'apollo-server-cloudflare'
import { and, eq, gt, gte, sql } from 'drizzle-orm'
import { DateTime, Duration } from 'luxon'

import { schema } from '../db/drizzle.js'
import type { MyContext } from './context.js'
import { randomID, slugify } from './utils.js'

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
    pretranspose: Int!

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

  input UpdateSongInput {
    slug: String
    author: String
    title: String
    text: String

    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String
    pretranspose: Int

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
    admin: Boolean!
  }

  type Collection {
    slug: String!
    name: String!
    owner: User!
    songList: [SongRecord!]!
    insertedAt: String!
    locked: Boolean!
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
    updateSong(id: String!, input: UpdateSongInput!): SongRecord
    login(email: String!, password: String!): LoginPayload!
    register(input: RegisterInput!): RegisterPayload!
    logout: String
    setHandle(handle: String!): String
    createCollection(name: String!, global: Boolean): CollectionRecord
    addToCollection(collection: String!, song: String!): String
    lockCollection(collection: String!): String
    removeFromCollection(collection: String!, song: String!): String
  }
`

async function collectionBySlug(slug: string, context: MyContext) {
  const collection = await context.db.query.collection.findFirst({
    where: eq(schema.collection.slug, slug),
  })
  return collection ?? null
}

const maxSessionDurationDays = 60

async function getViewer(context: MyContext) {
  const token = (context.sessionCookie || '').trim()
  if (!token) return null
  const sessions = await context.db
    .select()
    .from(schema.session)
    .where(
      and(
        gt(schema.session.expires, sql`CURRENT_TIMESTAMP`),
        eq(schema.session.token, token),
      ),
    )
    .innerJoin(schema.user, eq(schema.user.id, schema.session.user))
    .limit(1)
  if (sessions.length < 1) return null
  const session = sessions[0]
  if (
    DateTime.fromSQL(session.session.expires)
      .minus({ day: maxSessionDurationDays / 2 })
      .diffNow().milliseconds < 0
  ) {
    await context.db
      .update(schema.session)
      .set({
        expires: sql`CURRENT_TIMESTAMP + INTERVAL ${maxSessionDurationDays} day`,
      })
      .where(eq(schema.session.id, session.session.id))
  }
  return { viewer: session.user, session: session.session }
}

export async function getViewerCheck(context: MyContext) {
  const viewer = await getViewer(context)
  if (!viewer) throw new UserInputError('Not logged in')
  return viewer
}

export const comparePassword = (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: (_: unknown, _2: unknown, context: MyContext) =>
      'world ' + context.url,
    songs: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
      context: MyContext,
    ) => {
      if (!modifiedAfter) return await context.db.query.song.findMany()
      const docs = await context.db.query.song.findMany({
        where: (song, { gte }) => gte(song.lastModified, modifiedAfter),
      })
      return docs
    },
    deletedSongs: async (
      _: {},
      { deletedAfter }: { deletedAfter: string },
      context: MyContext,
    ) => {
      const docs = await context.db.query.deletedSong.findMany({
        where: (record, { gte }) => gte(record.deletedAt, deletedAfter),
      })
      return docs.map((d) => d.songIdString)
    },
    collections: async (
      _: {},
      { modifiedAfter }: { modifiedAfter: string | null },
      context: MyContext,
    ) => {
      if (!modifiedAfter) {
        return await context.db.query.collection.findMany({
          // query current state -> exclude deleted
          where: eq(schema.collection.deleted, 0),
        })
      }
      // query changes since -> include deleted
      const docs = await context.db.query.collection.findMany({
        where: gte(schema.collection.lastModified, modifiedAfter),
      })
      return docs
    },
    songsByIds: async (
      _: {},
      { ids }: { ids: string[] },
      context: MyContext,
    ) => {
      const list = await context.db.query.song.findMany({
        where: (record, { inArray }) => inArray(record.idString, ids),
      })
      return list
    },
    collectionsByIds: async (
      _: {},
      { ids }: { ids: string[] },
      context: MyContext,
    ) => {
      const list = await context.db.query.collection.findMany({
        where: (record, { inArray, and, eq }) =>
          and(inArray(record.idString, ids), eq(record.deleted, 0)),
      })
      return list
    },
    songsBySlugs: async (
      _: {},
      { slugs }: { slugs: string[] },
      context: MyContext,
    ) => {
      const list = await context.db.query.song.findMany({
        where: (record, { inArray }) => inArray(record.slug, slugs),
      })
      return list
    },
    viewer: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context)
      return data?.viewer ?? null
    },
  },
  Song: {
    editor: async (src: any, _: any, context: MyContext) => {
      if (src.editor) {
        return await context.db.query.user.findFirst({
          where: eq(schema.user.id, src.editor),
        })
      }
      return null
    },
    insertedAt: (src: any) => src.insertedAt || null,
    fontSize: (src: any) => coerceNumber(src.fontSize, 1),
    paragraphSpace: (src: any) => coerceNumber(src.paragraphSpace, 1),
    titleSpace: (src: any) => coerceNumber(src.titleSpace, 1),
    pretranspose: (src: any) => coerceNumber(src.pretranspose, 0),
  },
  SongRecord: {
    id: (src: any) => src.idString,
    data: (src: any) => {
      const data = src.data()
      console.log(JSON.stringify(src.data(), null, 2))
      return data
    },
    lastModified: (src: any) => src.data().lastModified,
  },
  CollectionRecord: {
    id: (src: any) => src.idString,
    lastModified: (src: any) => src.data().lastModified,
  },
  DeletableCollectionRecord: {
    __resolveType: (src: any) =>
      src.data().deleted ? 'Deleted' : 'CollectionRecord',
  },
  Collection: {
    insertedAt: (src: any) => src.insertedAt || null,
    owner: async (src: any, _: any, context: MyContext) => {
      const owner = await firestoreDoc(src.owner).get(context.loader)
      return owner?.data() ?? null
    },
    songList: async (src: any) => {
      if (src.list.length < 1) return []
      const list = await getAll(src.list)
      return list.filter(Boolean)
    },
    locked: (src: any) => !!src.locked,
  },
  LoginPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  RegisterPayload: {
    __resolveType: (src: any) => src.__typename,
  },
  User: {
    admin: (self: any) => !!self.admin,
  },
  Mutation: {
    setHandle: async (
      _: {},
      { handle }: { handle: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)

      await context.db
        .update(schema.user)
        .set({ handle })
        .where(eq(schema.user.id, viewer.id))

      await context.db.update(schema.collection).set({
        slug: sql`${slugify(handle)} || SUBSTRING_INDEX(${
          schema.collection.slug
        }, "/", -1)`,
      })
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
      const { viewer } = await getViewerCheck(context)
      if (global && !viewer.admin)
        throw new UserInputError('Only admin can create global songbooks')

      const slug =
        (global ? '' : slugify(viewer?.handle || viewer?.name) + '/') +
        slugify(requestedName)
      const existing = await context.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.collection)
        .where(eq(schema.collection.slug, slug))
      // const existing = await queryFieldEquals('collections', 'slug', slug)
      if (existing[0].count > 0)
        throw new Error('Collection with given name already exists')

      const idString = await randomID(20)
      await context.db.insert(schema.collection).values({
        idString,
        slug,
        name: requestedName,
        owner: global ? null : viewer.id,
      })
      return await context.db.query.collection.findFirst({
        where: eq(schema.collection.idString, idString),
      })
    },
    addToCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)
      const collectionSnap =
        (await firestoreDoc('collections/' + collection).get(context.loader)) ||
        (await collectionBySlug(collection))
      if (!collectionSnap) throw new UserInputError('Collection does not exist')
      if (collectionSnap.get('owner') !== viewer.id)
        throw new UserInputError('Not your collection')
      if (collectionSnap.get('locked'))
        throw new UserInputError('Collection is locked')
      const songSnap = await firestoreDoc('songs/' + song).get(context.loader)
      if (!songSnap) throw new UserInputError('Song does not exist')

      await firestoreFieldTransforms('collections/' + collectionSnap.id, [
        {
          fieldPath: 'list',
          appendMissingElements: {
            values: [{ stringValue: 'songs/' + song }],
          },
        },
        { fieldPath: 'lastModified', setToServerValue: 'REQUEST_TIME' },
      ])
      return 'Success!'
    },
    lockCollection: async (
      _: {},
      { collection }: { collection: string },
      context: MyContext,
    ) => {
      const vsrc = await getViewerCheck(context)
      const viewer = (await vsrc.viewer.get(context.loader))?.data()
      if (!viewer?.admin)
        throw new UserInputError('Only admin can lock collections')

      const collectionSnap =
        (await firestoreDoc('collections/' + collection).get(context.loader)) ||
        (await collectionBySlug(collection))
      if (!collectionSnap) throw new UserInputError('Collection does not exist')

      await collectionSnap.ref.set({ locked: true }, { merge: true })
      await firestoreFieldTransforms('collections/' + collectionSnap.id, [
        { fieldPath: 'lastModified', setToServerValue: 'REQUEST_TIME' },
      ])
      return 'Success!'
    },
    removeFromCollection: async (
      _: {},
      { song, collection }: { song: string; collection: string },
      context: MyContext,
    ) => {
      const { viewer } = await getViewerCheck(context)
      const collectionSnap =
        (await firestoreDoc('collections/' + collection).get(context.loader)) ||
        (await collectionBySlug(collection))
      if (!collectionSnap) throw new UserInputError('Collection does not exist')
      if (collectionSnap.get('owner') !== viewer.id)
        throw new UserInputError('Not your collection')
      if (collectionSnap.get('locked'))
        throw new UserInputError('Collection is locked')
      const songSnap = await firestoreDoc('songs/' + song).get(context.loader)
      if (!songSnap) throw new UserInputError('Song does not exist')

      await firestoreFieldTransforms('collections/' + collectionSnap.id, [
        {
          fieldPath: 'list',
          removeAllFromArray: { values: [{ stringValue: 'songs/' + song }] },
        },
        { fieldPath: 'lastModified', setToServerValue: 'REQUEST_TIME' },
      ])

      return 'Success!'
    },
    updateSong: async (
      _: {},
      { id, input }: { input: any; id: string },
      context: MyContext,
    ) => {
      const doc = firestoreDoc('songs/' + id)
      const prev = await doc.get(context.loader)
      if (!prev) throw new Error('Song does not exist')
      console.log(JSON.stringify(input, null, 2))
      await doc.set(
        {
          ...Object.fromEntries(
            Object.entries(input).filter(([, v]) => v !== null),
          ),
          lastModified: serverTimestamp(),
        },
        { merge: true },
      )
      console.log(
        JSON.stringify((await doc.get(context.loader))?.data(), null, 2),
      )
      return doc.get(context.loader)
    },
    async login(
      _: {},
      { email, password }: { email: string; password: string },
      context: MyContext,
    ) {
      const user = await context.db.query.user.findFirst({
        where: eq(schema.user.email, email),
      })
      if (!user) {
        return {
          __typename: 'LoginError',
          message: 'Uživatel s daným emailem nenalezen',
        }
      }

      const passwordHash = user.passwordHash
      if (!(await comparePassword(password, passwordHash))) {
        return { __typename: 'LoginError', message: 'Chybné heslo' }
      }

      await createSession(context, user.id)

      return {
        __typename: 'LoginSuccess',
        user,
      }
    },
    async register(
      _: {},
      { input }: { input: { name: string; email: string; password: string } },
      context: MyContext,
    ) {
      if (!input.name || !input.email || !input.password) {
        return {
          __typename: 'RegisterError',
          message: 'Všechna pole jsou povinná',
        }
      }
      const existing = await context.db.query.user.findFirst({
        where: eq(schema.user.email, input.email),
        columns: { id: true },
      })
      if (existing)
        return { __typename: 'RegisterError', message: 'Email je již použit' }

      await context.db.insert(schema.user).values({
        name: input.name,
        passwordHash: await hashPassword(input.password),
        email: input.email,
        handle: slugify(input.name),
      })
      const user = await context.db.query.user.findFirst({
        where: eq(schema.user.email, input.email),
      })
      if (!user) throw new Error('Insert somehow failed')
      await createSession(context, user.id)
      return {
        __typename: 'RegisterSuccess',
        user,
      }
    },
    logout: async (_: {}, _2: {}, context: MyContext) => {
      const data = await getViewer(context)
      // make it expire
      context.setSessionCookie('', Duration.fromObject({ second: 1 }))
      if (data) {
        await context.db
          .delete(schema.session)
          .where(eq(schema.session.id, data.session.id))
      }
      return 'Success!'
    },
  },
}

async function createSession(context: MyContext, userId: number) {
  const sessionToken = await randomID(30)
  await context.db.insert(schema.session).values({
    token: sessionToken,
    user: userId,
    expires: sql`CURRENT_TIMESTAMP + INTERVAL ${maxSessionDurationDays} day`,
  })
  const sessionDuration = Duration.fromObject({ months: 2 })

  context.setSessionCookie(sessionToken, sessionDuration)
}

const serverConfig = {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  //tracing: true,
}
export default serverConfig
function coerceNumber(val: any, arg1: number) {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = +val
    if (parsed.toFixed(0) === val && Number.isSafeInteger(parsed)) return parsed
  }
  return arg1
}
