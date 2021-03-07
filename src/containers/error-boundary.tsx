/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { Component, ErrorInfo } from 'react'
import { Raven } from '../utils/globals'
import { __RouterContext, RouteComponentProps } from 'react-router'

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
  context!: RouteComponentProps

  static contextType = __RouterContext

  state: State = { errorKey: noError }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.errorKey && props.errorKey !== state.errorKey) {
      return { errorKey: noError }
    }
    return state
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorKey: this.props.errorKey })
    if (Raven) {
      Raven.captureException(error, {
        extra: errorInfo,
        tags: {
          errorBoundary: 'general',
        },
      })
    }
  }

  render() {
    if (this.props.errorKey !== this.state.errorKey) {
      return <>{this.props.children}</>
    }
    const { fallback = <DefaultFallback /> } = this.props
    return fallback
  }
}
