import { convertNodeRequest } from '@miniflare/http-server'
import http from 'http'

const worker = (await import('./src/index.js')).default

// Converting Node.js http.IncomingMessage to Miniflare's Request
const server = http.createServer(async (nodeReq, nodeRes) => {
  const req = await convertNodeRequest(nodeReq)
  nodeRes.appendHeader('access-control-allow-origin', 'http://localhost:5513')
  nodeRes.setHeader('Vary', 'Origin')
  const headers = nodeReq.headers['access-control-request-headers']
  if (headers) nodeRes.setHeader('Access-Control-Allow-Headers', headers)
  nodeRes.setHeader('Access-Control-Allow-Methods', '*')
  nodeRes.setHeader('Access-Control-Max-Age', '86400')
  nodeRes.setHeader('Access-Control-Allow-Credentials', 'true')
  if (nodeReq.method === 'OPTIONS') {
    nodeRes.statusCode = 200
    nodeRes.end()
    return
  }

  const res = await worker.fetch(req.request as any, {}, {} as any)
  for (const [header, value] of res.headers.entries()) {
    nodeRes.appendHeader(header, value)
  }
  nodeRes.statusCode = res.status
  nodeRes.end(new Uint8Array(await res.arrayBuffer()))
})
server.listen(5512, () => {
  console.log('listening on http://localhost:5512')
})
