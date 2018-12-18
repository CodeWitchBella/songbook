import React from 'react'

export type Props = {
  song: {
    author: string
    title: string
    textWithChords: string
    metadata: {
      fontSize: number | null
      paragraphSpace: number | null
      titleSpace: number | null
    }
    id: string
  }
}

class PDF extends React.Component<Props, any> {
  state: any = {}
  promise: any

  render() {
    if (!this.promise) {
      this.promise = import(/* webpackChunkName: "components_pdf-render" */ './pdf-render').then(
        v => this.setState({ v: v.default }),
      )
      return null
    }
    if (!this.state.v) {
      return null
    }
    return <this.state.v {...this.props} />
  }
}
export default PDF
