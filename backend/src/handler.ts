import config from './server-config'
import { ApolloServer } from 'apollo-server-cloud-functions'

const server = new ApolloServer({ ...config, context: src => src })

export const graphql = server.createHandler({
  cors: {
    origin: ['localhost:3000', 'https://zpevnik.skorepova.info'],
    credentials: true,
    maxAge: 3600,
  },
})
