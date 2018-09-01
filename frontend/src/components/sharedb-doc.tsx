import sharedb, { Doc } from 'sharedb/lib/client'
import React from 'react'

let socket: WebSocket
let connection: sharedb.Connection

type State<T> = { data: T | null; doc: Doc | null }
export default class ShareDBDoc<T> extends React.Component<
  {
    children: (state: State<T>) => React.ReactNode
    collection: string
    id: string
  },
  State<T>
> {
  state = { data: null, doc: null }
  doc?: Doc

  render() {
    return this.props.children(this.state)
  }

  onChange = () => {
    if (this.doc) this.setState({ data: this.doc.data, doc: this.doc })
  }

  componentDidMount() {
    if (!socket)
      socket = new WebSocket(
        `ws${window.location.protocol === 'https:' ? 's' : ''}://${
          window.location.host
        }/sharedb`,
      )
    if (!connection) connection = new sharedb.Connection(socket)
    this.doc = connection.get(this.props.collection, this.props.id)
    this.doc.subscribe(this.onChange)
    this.doc.on('op', this.onChange)
  }
}