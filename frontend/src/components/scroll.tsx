import { withRouter, RouteComponentProps } from 'react-router'
import React from 'react'

function scrollTo(x: number, y: number) {
  document.getElementById('root')!.scrollTo(x, y)
}

function getYScroll() {
  return document.getElementById('root')!.scrollTop
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
          const val = sessionStorage.getItem(
            `scroll:${this.props.location.key}`,
          )
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
            `scroll:${this.props.location.key}`,
            `${getYScroll()}`,
          )
        }
      } catch (e) {}
    }
    render() {
      return null
    }
  },
)
