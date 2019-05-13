import { gql } from 'apollo-server'
import { writeBlob, rewriteBlob } from './blobs'
import latinize from 'latinize'

function sanitizeSongId(part: string) {
  return latinize(part)
    .trim()
    .replace(/ /g, '_')
    .replace(/[^a-z_0-9]/gi, '')
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
  }

  input CreateSongInput {
    author: String!
    title: String!
  }

  input SongMetadataInput {
    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String
  }

  input WriteSongInput {
    id: String!
    title: String!
    author: String!
    metadata: SongMetadataInput!
    textWithChords: String!
    # no tags here
  }

  type SongMetadata {
    fontSize: Float
    paragraphSpace: Float
    titleSpace: Float
    spotify: String
  }

  type Song {
    id: String!
    title: String!
    author: String!
    metadata: SongMetadata!
    textWithChords: String!
  }

  type Mutation {
    writeBlob(name: String!, content: String!): String
    createSong(input: CreateSongInput!): String
    writeSong(input: WriteSongInput!): Song
  }
`

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    writeBlob: (_: {}, { name, content }: { name: string; content: string }) =>
      writeBlob(name, content).then(v => JSON.stringify(v)),
    createSong: async (
      _: {},
      { input }: { input: { author: string; title: string } },
    ) => {
      const { title, author } = input
      const name = `${sanitizeSongId(title)}-${sanitizeSongId(author)}.song`
      await writeBlob(name, JSON.stringify({ title, author }))
      return name
    },
    writeSong: async (_: {}, { input: { id, ...rest } }: { input: any }) => {
      await rewriteBlob(id, JSON.stringify(rest))
      return { id, ...rest }
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
