// @ts-check
import { Repo } from '@automerge/automerge-repo'
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket'
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs'
import express from 'express'
import fs from 'fs'
import os from 'os'
import { WebSocketServer } from 'ws'

const dir = 'data'
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

var hostname = os.hostname()

const wss = new WebSocketServer({ noServer: true })

const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT) : 3030
const app = express()
app.use(express.static('public'))

const config = {
  network: [new NodeWSServerAdapter(wss)],
  storage: new NodeFSStorageAdapter(dir),
  peerId:
    `storage-server-${hostname}` as import('@automerge/automerge-repo').PeerId,
  // Since this is a server, we don't share generously — meaning we only sync documents they already
  // know about and can ask for by ID.
  sharePolicy: async () => false,
}
const serverRepo = new Repo(config)

app.get('/', (req, res) => {
  res.send(`👍 @automerge/example-sync-server is running`)
})

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

server.on('upgrade', (request, connection, head) => {
  wss.handleUpgrade(request, connection, head, (webSocket) => {
    wss.emit('connection', webSocket, request)
  })
})

function close() {
  wss.close()
  server.close()
}
