import React, { Component, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
let Raven: any = null

export function Fallback({ reset }: { reset: () => void }) {
  const location = useLocation()
  const last = useRef(location)
  useEffect(() => {
    if (last.current !== location) reset()
  }, [location, reset])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-3xl">
      Něco se pokazilo
    </div>
  )
}

export default class ErrorBoundary extends Component<{
  children: React.ReactNode
}> {
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
      return <Fallback reset={this.reset} />
    }
    return this.props.children
  }
}
