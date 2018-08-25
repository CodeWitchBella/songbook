import { ApolloServer } from 'apollo-server-express'
import * as express from 'express'
import { getContext, getSchema } from '../graphql/graphql'

export async function register(app: express.Express) {
  const server = new ApolloServer({
    schema: await getSchema(),
    context: ({ req }: any) => getContext(req),
  })
  server.applyMiddleware({ app })
}
