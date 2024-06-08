import { ApolloServer, HeaderMap } from '@apollo/server'

import type { MyContext } from '../lib/context.js'
import serverConfig from '../lib/graphql-server-config.js'

const getServer = (() => {
  let cache: ApolloServer
  return () => {
    if (!cache) {
      cache = new ApolloServer(serverConfig)
      cache.start()
    }
    return cache
  }
})()

export async function handleGraphql(
  request: Request,
  context: MyContext,
): Promise<Response> {
  const server = getServer()
  const response = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      body: await request.json(),
      headers: new HeaderMap(request.headers.entries()),
      search: new URL(request.url).search,
    },
    context: () => context as any,
  })
  return new Response(
    response.body.kind === 'complete' ? response.body.string : null,
  )
}
