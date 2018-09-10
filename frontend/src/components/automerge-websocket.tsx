import React from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import Automerge, { DocSet } from 'automerge'

export default class AutomergeWebSocket extends React.Component<
  {
    children: () => React.ReactNode
    docs: string[]
  },
  { [key: string]: any }
> {
  state = {}
  render() {
    return <pre>{JSON.stringify(this.state, null, 2)}</pre>
  }

  ws?: ReconnectingWebSocket

  componentDidMount() {
    if (typeof WebSocket !== 'undefined') {
      const port = window.location.port
      const ws = new ReconnectingWebSocket(
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
          window.location.hostname
        }${port ? `:${port}` : ''}/automerge`,
      )
      this.ws = ws

      const docSet = new DocSet()

      docSet.registerHandler((docId: string, doc: any) => {
        this.setState({ [docId]: doc })
      })

      const autocon = new Automerge.Connection(docSet, (frame: any) => {
        ws.send(JSON.stringify(frame))
      })

      ws.addEventListener('message', msg => {
        const data = JSON.parse(msg.data)
        autocon.receiveMsg(data)
      })

      ws.addEventListener('open', () => {
        autocon.open()
        ws.send(JSON.stringify({ action: 'register', docs: this.props.docs }))
      })
      ws.addEventListener('close', () => {
        autocon.close()
        if ((ws as any)._shouldReconnect) (ws as any)._connect()
      })
      ws.addEventListener('error', evt => console.log('error', evt))
    }
  }

  componentWillUnmount() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
