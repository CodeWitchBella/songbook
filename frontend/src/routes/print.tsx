import React from 'react'
import { hot } from 'react-hot-loader'
import Print from 'sections/print/print'
import { injectGlobal, css } from 'react-emotion'
import { document, window } from 'utils/globals'
import * as page from 'utils/page'

const { margin } = page

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  @page {
    size: ${page.width} ${page.height};
    margin: ${margin.top} ${margin.inner} ${margin.bottom} ${margin.outer};
  }

  @page:left {
    margin: ${margin.top} ${margin.inner} ${margin.bottom} ${margin.outer};
  }
  @page:right {
    margin: ${margin.top} ${margin.outer} ${margin.bottom} ${margin.inner};
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

const bodyOnly = css`
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
      document.body.classList.add(bodyOnly)
    }
  }
  componentWillUnmount() {
    bodyHtml(el => el.classList.remove(body))
    if (document) {
      document.body.classList.remove(bodyOnly)
    }
  }
  render() {
    return (
      <div>
        <Print tag={this.props.tag} />
      </div>
    )
  }
}
export default hot(module)(PrintRoute)
