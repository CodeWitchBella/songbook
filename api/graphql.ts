import config from './src/_server-config'
import { ApolloServer } from 'apollo-server-micro'
import type { NowRequest, NowResponse } from '@now/node'

const server = new ApolloServer({
  ...config,
  context: (src) => src,
  playground: {
    endpoint: '/api/graphql',
  },
})

const handler = server.createHandler()

export default (req: NowRequest, res: NowResponse) => {
  return handler(req, res)
}
