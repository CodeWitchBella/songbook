import { RootView, TText } from 'components/themed'
import React, { Component, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
let Raven: any = null

function Fallback({ reset }: { reset: () => void }) {
  const location = useLocation()
  const last = useRef(location)
  useEffect(() => {
    if (last.current !== location) reset()
  }, [location, reset])
  return (
    <RootView
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TText style={{ fontSize: 30 }}>Něco se pokazilo</TText>
    </RootView>
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
