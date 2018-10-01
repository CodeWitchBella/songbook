import { withRouter, RouteComponentProps } from 'react-router'
import React from 'react'

function scrollTo(x: number, y: number) {
  document.getElementById('app')!.scrollTo(x, y)
}

function getYScroll() {
  return document.getElementById('app')!.scrollTop
}

export class ScrollToTopOnMount extends React.Component {
  componentDidMount() {
    try {
      if (typeof document !== 'undefined') scrollTo(0, 0)
    } catch (e) {}
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
            scrollTo(0, Number.parseFloat(val))
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
            getYScroll() + '',
          )
        }
      } catch (e) {}
    }
    render() {
      return null
    }
  },
)
