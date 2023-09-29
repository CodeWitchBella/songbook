import { convertNodeRequest } from '@miniflare/http-server'
import fs from 'fs'
import http from 'http'

Object.assign(
  process.env,
  Object.fromEntries(
    fs
      .readFileSync(new URL('.dev.vars', import.meta.url), 'utf8')
      .trim()
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => !v.startsWith('#'))
      .map((v) => v.split('=')),
  ),
)

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
