import React from 'react'
import { hot } from 'react-hot-loader'
import Print from 'sections/print/print'
import { injectGlobal, css } from 'react-emotion'
import { document, window } from 'utils/globals'
import * as page from 'utils/page'
import PreviewToggle from 'components/preview-toggle'

const { margin } = page

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  @page {
    size: ${page.width} ${page.height};
    margin: ${margin.top} ${margin.outer} ${margin.bottom} ${margin.outer};
  }
`

const body = css`
  @media print {
    & {
      width: ${page.width};
      height: ${page.height};
    }
  }
`

const appScroll = css`
  scroll-snap-type: mandatory;

  scroll-snap-destination: 0% 100%;
  scroll-snap-points-y: repeat(100%);
`

function bodyHtml(cb: (el: Element) => void) {
  if (document) {
    const list = document.querySelectorAll('body, html')
    for (let i = 0; i < list.length; i += 1) {
      const item = list.item(i)
      cb(item)
    }
  }
}

class PrintRoute extends React.Component<{ tag: string }> {
  componentDidMount() {
    bodyHtml(el => el.classList.add(body))
    if (document) {
      document.getElementById('app')!.classList.add(appScroll)
    }
  }
  componentWillUnmount() {
    bodyHtml(el => el.classList.remove(body))
    if (document) {
      document.getElementById('app')!.classList.remove(appScroll)
    }
  }
  render() {
    return (
      <div
        css={`
          position: relative;
        `}
      >
        <Print tag={this.props.tag} />
        <PreviewToggle />
      </div>
    )
  }
}
export default hot(module)(PrintRoute)
