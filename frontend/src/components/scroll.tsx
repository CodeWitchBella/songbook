import React from 'react'

function scrollTo(x: number, y: number) {
  document.getElementById('root')!.scrollTo(x, y)
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
