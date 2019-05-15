import { gql, UserInputError } from 'apollo-server'
import { firestore } from './firestore'
import latinize from 'latinize'
import crypto from 'crypto'

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
  }

  type SongRecord {
    data: Song!
    id: String!
    lastModified: String!
  }

  type Query {
    hello: String
    songs: [SongRecord!]!
    songBySlug(slug: String!): SongRecord
    songById(id: String!): SongRecord
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

  type Mutation {
    createSong(input: CreateSongInput!): SongRecord
    updateSong(id: String!, input: UpdateSongInput!): SongRecord
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

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
    songs: async () => {
      const docs = await firestore.collection('songs').listDocuments()
      return Promise.all(docs.map(doc => doc.get()))
    },
    songById: async (_: {}, { id }: { id: string }) => {
      const doc = await firestore.doc('songs/' + id).get()
      if (doc.exists) return doc
      return null
    },
    songBySlug: (_: {}, { slug }: { slug: string }) => songBySlug(slug),
  },
  SongRecord: {
    data: (src: any) => src.data(),
    lastModified: (src: any) => src.updateTime.toDate().toISOString(),
  },
  Mutation: {
    createSong: async (
      _: {},
      { input }: { input: { author: string; title: string } },
    ) => {
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
      const w = await doc.set({
        ...prev.data(),
        ...fromEntries(Object.entries(input).filter(([, v]) => v !== null)),
      })
      return doc.get()
    },
  },
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  tracing: true,
}
