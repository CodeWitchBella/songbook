import { convertNodeRequest } from '@miniflare/http-server'
import http from 'http'

import { env } from './drizzle.js'

Object.assign(process.env, env)
globalThis.isInNodejs = true

const worker = (await import('./src/index.js')).default

// Converting Node.js http.IncomingMessage to Miniflare's Request
const server = http.createServer(async (nodeReq, nodeRes) => {
  const req = await convertNodeRequest(nodeReq)
  const res = await worker.fetch(req.request as any, {}, {})
  for (const [header, value] of res.headers.entries()) {
    nodeRes.appendHeader(header, value)
  }
  nodeRes.statusCode = res.status
  nodeRes.end(new Uint8Array(await res.arrayBuffer()))
})
server.listen(5512, () => {
  console.log('listening on http://localhost:5512')
})
