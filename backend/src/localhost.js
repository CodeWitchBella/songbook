import { ApolloServer } from 'apollo-server'
import config from './server-config'

const server = new ApolloServer(config)
server.listen(3000)
