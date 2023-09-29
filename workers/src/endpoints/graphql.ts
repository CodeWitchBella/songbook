import { renderPlaygroundPage } from '@apollographql/graphql-playground-html'
import { ApolloServer } from 'apollo-server-cloudflare'
import { graphqlCloudflare } from 'apollo-server-cloudflare/dist/cloudflareApollo'

import type { MyContext } from '../lib/context'
import serverConfig from '../lib/server-config'

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
  if (request.method === 'GET') {
    return new Response(renderPlaygroundPage({}), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }
  const response = await graphqlCloudflare(async () => ({
    ...(await server.createGraphQLServerOptions(request as any)),
    context,
  }))(request as any)
  return response as any
}
