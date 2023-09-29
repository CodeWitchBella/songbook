import { handleCreateSong } from './endpoints/create-song'
import { handleGraphql } from './endpoints/graphql'
import { handleImport } from './endpoints/import'
import { handleReleases } from './endpoints/releases'
import { forward } from './forward'
import type { MyContext } from './lib/context'
import { contextPair } from './lib/context'

globalThis.setImmediate = undefined as any

async function handleRequest(
  request: Request,
  env: {},
  ctx: ExecutionContext,
  createContext: () => MyContext,
): Promise<Response> {
  try {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api')) url.pathname = url.pathname.slice(4)
    if (url.pathname === '/hello') return new Response('World')
    if (url.pathname === '/graphql')
      return await handleGraphql(request, createContext())
    if (url.pathname === '/ultimate-guitar' || url.pathname === '/import')
      return await handleImport(request)
    if (url.pathname === '/releases') return await handleReleases(request, ctx)
    if (request.method === 'POST' && url.pathname === '/song')
      return await handleCreateSong(request, createContext())
    if (url.pathname === '/beacon.min.js')
      return await forward(
        request,
        'https://static.cloudflareinsights.com/beacon.min.js',
      )
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    if (err instanceof Response) return err
    console.error(err.stack)
    return new Response(err.stack, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}

const worker = {
  async fetch(
    request: Request,
    env: {},
    ctx: ExecutionContext,
  ): Promise<Response> {
    const { createContext, finishContext } = contextPair(request)
    const res = await handleRequest(request, env, ctx, createContext)
    finishContext(res)
    return res
  },
}
export default worker
