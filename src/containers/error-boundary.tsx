/** @jsxImportSource @emotion/react */

import { Component, useEffect } from 'react'
import { useHistory } from 'react-router'
import { Raven } from 'utils/globals'

const Fallback = ({ reset }: { reset: () => void }) => {
  const history = useHistory()
  useEffect(() => history.listen(reset), [history, reset])
  return (
    <div
      css={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div css={{ fontSize: 30 }}>Něco se pokazilo</div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: any) {
    console.error({ error, info })
    if (Raven)
      Raven.captureException(error, {
        extra: info,
        tags: {
          errorBoundary: 'general',
        },
      })
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <Fallback reset={this.reset} />
    }
    return this.props.children
  }
}
