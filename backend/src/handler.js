import { ApolloServer } from 'apollo-server-azure-functions'
import config from './server-config'

const server = new ApolloServer(config)

export const graphqlHandler = server.createHandler({
  cors: {
    origin: ['http://localhost:3000', 'https://zpevnik.skorepova.info'],
    credentials: true,
    maxAge: 3600,
  },
})
