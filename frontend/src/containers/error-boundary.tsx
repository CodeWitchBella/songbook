import React from 'react'
import { Raven } from 'utils/globals'

export default class ErrorBoundary extends React.Component<{
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
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback ? this.props.fallback() : null
    }
    return this.props.children
  }
}
