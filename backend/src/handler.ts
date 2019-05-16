import config from './server-config'
import { ApolloServer } from 'apollo-server-cloud-functions'

const server = new ApolloServer({ ...config, context: src => src })

export const graphql = (req, res) => {
  res.set('Access-Control-Allow-Credentials', 'true')
  return server.createHandler({
    cors: {
      origin: ['http://localhost:3000', 'https://zpevnik.skorepova.info'],
      credentials: true,
      maxAge: 3600,
    },
  })(req, res)
}
