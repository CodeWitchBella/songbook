import { Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

export const repo = new Repo({
  // TODO: proper connection handling
  network: [new BrowserWebSocketClientAdapter('ws://localhost:3030')],
  storage: new IndexedDBStorageAdapter('automerge-repo-songbook'),
})
