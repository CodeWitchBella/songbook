/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { Component } from 'react'
import { Raven } from 'utils/globals'

const Fallback = () => {
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

export default class ErrorBoundary extends Component<{
  fallback?: () => React.ReactNode
}> {
  state = { hasError: false }

  componentDidCatch(error: Error, info: any) {
    console.error({ error, info })
    if (Raven)
      Raven.captureException(error, {
        extra: info,
        tags: {
          errorBoundary: 'general',
        },
      })
    if (!this.unmounted) this.setState({ hasError: true })
  }
  unmounted = false
  componentDidMount() {
    this.unmounted = true
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <Fallback />
    }
    return this.props.children
  }
}

export const errorBoundary = <T extends {}>(
  Component: React.ComponentType<T>,
): React.FC<T> => props => {
  return (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  )
}
