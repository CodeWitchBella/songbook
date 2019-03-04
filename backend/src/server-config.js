import { gql } from 'apollo-server'

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
  }
`

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => 'world',
  },
}

export default {
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  tracing: true,
}
