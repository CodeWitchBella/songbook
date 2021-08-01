import { RootView, TText } from 'components/themed'
import { Component, useEffect } from 'react'
import { useHistory } from 'react-router'
let Raven: any = null

function Fallback({ reset }: { reset: () => void }) {
  const history = useHistory()
  useEffect(() => history.listen(reset), [history, reset])
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
      return <Fallback reset={this.reset} />
    }
    return this.props.children
  }
}
