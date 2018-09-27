import { withRouter, RouteComponentProps } from 'react-router'
import React from 'react'

export class ScrollToTopOnMount extends React.Component {
  componentDidMount() {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  render() {
    return null
  }
}

export const SaveScroll = withRouter(
  class SaveScrollImpl extends React.Component<RouteComponentProps<any>> {
    componentDidMount() {
      try {
        if (
          typeof sessionStorage !== 'undefined' &&
          typeof document !== 'undefined'
        ) {
          console.log(this.props.location.key)
          const val = sessionStorage.getItem(
            'scroll:' + this.props.location.key,
          )
          console.log({ val })
          if (val !== null) {
            document.getElementById('app')!.scrollTo(0, Number.parseFloat(val))
          }
        }
      } catch (e) {}
    }
    componentWillUnmount() {
      try {
        if (
          typeof sessionStorage !== 'undefined' &&
          typeof document !== 'undefined'
        ) {
          sessionStorage.setItem(
            'scroll:' + this.props.location.key,
            document.getElementById('app')!.scrollTop + '',
          )
        }
      } catch (e) {}
    }
    render() {
      return null
    }
  },
)
