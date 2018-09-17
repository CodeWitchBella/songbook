import React from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import AutomergeClient from 'automerge-client'

function textToString(text: any) {
  let ret = ''
  for (const ch of text) {
    ret += ch
  }
  return ret
}

function stringifyDoc(doc: any) {
  const ret: { [key: string]: any } = {}
  for (const [k, v] of Object.entries(doc)) {
    if (['title', 'textWithChords', 'author'].includes(k)) {
      ret[k] = textToString(v)
    } else {
      ret[k] = v
    }
  }
  return ret
}

export default class AutomergeWebSocket extends React.Component<
  {
    children: () => React.ReactNode
    docs: string[]
  },
  { [key: string]: any }
> {
  state = {}
  render() {
    const state: { [key: string]: any } = {}
    for (const [k, v] of Object.entries(this.state)) {
      state[k] = stringifyDoc(v)
    }
    return <pre>{JSON.stringify(state, null, 2)}</pre>
  }
  socket?: ReconnectingWebSocket

  componentDidMount() {
    const port = window.location.port
    const socket = new ReconnectingWebSocket(
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
        window.location.hostname
      }${port ? `:${port}` : ''}/automerge`,
    )
    this.socket = socket
    const automergeClient = new AutomergeClient({
      socket,
      savedData: (() => {
        try {
          return localStorage.getItem('automerge')
        } catch (e) {
          return undefined
        }
      })(),
      save: (data: string) => {
        try {
          localStorage.setItem('automerge', data)
        } catch (e) {
          console.error(e)
        }
      },
      onChange: (id: string, doc: any) => this.setState({ [id]: doc }),
    })
    ;(window as any).automergeClient = automergeClient

    socket.addEventListener('close', () => {
      if ((socket as any)._shouldReconnect) (socket as any)._connect()
    })
  }

  componentWillUnmount() {
    if (this.socket) this.socket.close()
    ;(window as any).automergeClient = null
  }
}
