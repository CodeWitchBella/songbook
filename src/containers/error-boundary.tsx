/** @jsx jsx */
import { jsx } from '@emotion/react'
import React, { Component, ErrorInfo } from 'react'

const Raven: any = undefined

function DefaultFallback() {
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

// NOTE: we check strict equality of errorKeys and this is a way to make sure
// that no passed value equals default
const noError = {}
type State = { errorKey: any }
type Props = { errorKey?: any; fallback?: JSX.Element | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { errorKey: noError }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.errorKey && props.errorKey !== state.errorKey) {
      return { errorKey: noError }
    }
    return state
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorKey: this.props.errorKey })
    Raven?.captureException(error, {
      extra: errorInfo,
      tags: {
        errorBoundary: 'general',
      },
    })
  }

  render() {
    if (this.props.errorKey !== this.state.errorKey) {
      return <>{this.props.children}</>
    }
    const { fallback = <DefaultFallback /> } = this.props
    return fallback
  }
}
