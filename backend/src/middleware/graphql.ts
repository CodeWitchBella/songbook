import * as server from 'apollo-server-express'
import { getContext, getSchema } from '../graphql/graphql'

export const graphiql = server.graphiqlExpress({ endpointURL: '/graphql' })
export const graphql = server.graphqlExpress(async req => {
  if (!req) throw new Error('req is falsy')
  const context = getContext(req)
  const schema = getSchema()
  return {
    context: await context,
    schema: await schema,
  }
})
