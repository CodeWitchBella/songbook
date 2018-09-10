import WebSocket from 'ws'
import Automerge, { DocSet } from 'automerge'

function parseJSON(json: string) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

class Document {
  /* eslint-disable lines-between-class-members */
  name?: string
  doc: any
  docSets: any[] = []
  /* eslint-enable lines-between-class-members */

  constructor(name: string) {
    this.name = name
  }

  set(doc: any) {
    this.doc = doc
    for (const docSet of this.docSets) {
      docSet.setDoc(this.name, this.doc)
    }
    return this
  }

  addToDocSet(docSet: any) {
    docSet.setDoc(this.name, this.doc)
    this.docSets.push(docSet)
  }

  removeDocSet(docSet: any) {
    this.docSets = this.docSets.filter(set => set !== docSet)
  }

  change(fn: (doc: any) => void) {
    this.set(Automerge.change(this.doc, fn))
  }
}

const documents = {
  one: new Document('one').set(Automerge.init()),
  two: new Document('two').set(Automerge.init()),
}

export const automergeSocket = (ws: WebSocket) => {
  const docSet = new DocSet()

  const subscribedDocuments: Document[] = []

  function subscribeToDoc(doc: Document) {
    if (subscribedDocuments.includes(doc)) return
    doc.addToDocSet(docSet)
    subscribedDocuments.push(doc)
  }

  subscribeToDoc(documents.one)
  subscribeToDoc(documents.two)

  const autocon = new Automerge.Connection(docSet, (frame: any) =>
    ws.send(JSON.stringify(frame)),
  )

  autocon.open()

  ws.on('message', message => {
    const data = parseJSON(message.toString())
    if (data !== null) {
      autocon.receiveMsg(data)
    }
  })

  ws.on('close', () => {
    autocon.close()
    subscribedDocuments.forEach(doc => doc.removeDocSet(docSet))
  })
}

setInterval(() => {
  documents.one.change(doc_ => {
    const doc = doc_
    if (!doc.prop) {
      doc.prop = 1
    } else {
      doc.prop += 1
    }
  })

  documents.two.change(doc_ => {
    const doc = doc_
    if (!doc.hello) {
      doc.hello = 1
    } else {
      doc.hello *= 1.2
    }
  })
}, 1000)
