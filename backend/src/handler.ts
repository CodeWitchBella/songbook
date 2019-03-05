import { ApolloServer } from 'apollo-server-azure-functions'
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import config from './server-config'

const server = new ApolloServer(config)

const handler = server.createHandler({
  cors: {
    origin: ['http://localhost:3000', 'https://zpevnik.skorepova.info'],
    credentials: true,
    maxAge: 3600,
  },
})
const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest,
): Promise<void> {
  return new Promise((resolve, reject) =>
    handler(
      {
        ...context,
        done: ((err, v) => {
          if (err) reject(err)
          else {
            context.res = v
            resolve()
          }
        }) as typeof context.done,
      } as any,
      req as any,
    ),
  )
}
export default httpTrigger
