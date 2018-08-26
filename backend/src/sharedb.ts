import WebSocket from 'ws'
import ShareDB from 'sharedb'
import WebSocketJSONStream from 'websocket-json-stream'

const docFetch = (doc: ShareDB.Doc) =>
  new Promise((res, rej) => doc.fetch(err => (err ? rej(err) : res())))

const docCreate = (doc: ShareDB.Doc, data: any) =>
  new Promise((res, rej) => doc.create(data, err => (err ? rej(err) : res())))

export async function register(wss: WebSocket.Server) {
  const share = new ShareDB()

  const connection = share.connect()
  const doc = connection.get('example', 'counter')
  await docFetch(doc)
  if (doc.type === null) {
    await docCreate(doc, { numClicks: 0 })
  }
  console.log(doc)

  await wss.on('connection', (ws, req) => {
    if (req.url !== '/sharedb') return

    const stream = new WebSocketJSONStream(ws)
    share.listen(stream)
  })
}
