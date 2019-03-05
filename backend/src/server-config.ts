import { gql } from 'apollo-server'
import { writeBlob } from './blobs'

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
  }
  type Mutation {
    writeBlob(name: String!, content: String!): String
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
  },
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  tracing: true,
}
