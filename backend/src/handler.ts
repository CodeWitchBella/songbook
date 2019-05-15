//import { ApolloServer } from 'apollo-server-azure-functions'
//import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import config from './server-config'
import { ApolloServer, gql } from 'apollo-server-cloud-functions'

const server = new ApolloServer(config)

//const handler = server.createHandler({
//  cors: {
//    origin: [
//      'http://localhost:3000',
//      // everything else is missing here, because it is configured through GUI
//    ],
//    credentials: true,
//    maxAge: 3600,
//  },
//})
export const httpTrigger = server.createHandler({
  cors: {
    origin: ['localhost:3000', 'https://zpevnik.skorepova.info'],
    credentials: true,
    maxAge: 3600,
  },
})
