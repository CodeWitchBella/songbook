import { ApolloServer } from 'apollo-server-azure-functions'
import config from './server-config'

const server = new ApolloServer(config)

/*export default */ server.createHandler({
  cors: {
    origin: ['http://localhost:3000', 'https://zpevnik.skorepova.info'],
    credentials: true,
    maxAge: 3600,
  },
})

import { AzureFunction, Context, HttpRequest } from '@azure/functions'

const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest,
): Promise<void> {
  context.log('HTTP trigger function processed a request.')
  const name = req.query.name || (req.body && req.body.name)

  if (name) {
    context.res = {
      // status: 200, /* Defaults to 200 */
      body: 'Hello ' + (req.query.name || req.body.name),
    }
  } else {
    context.res = {
      status: 400,
      body: 'Please pass a name on the query string or in the request body',
    }
  }
}

export default httpTrigger
