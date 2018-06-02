import React from 'react'
import { hot } from 'react-hot-loader'
import Print from 'sections/print/print'
import { injectGlobal, css } from 'react-emotion'
import { document } from 'utils/globals'
import * as page from 'utils/page'

const { margin } = page

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  @page {
    size: ${page.width} ${page.height};
    :left {
      margin: ${margin.top} ${margin.inner} ${margin.top} ${margin.outer};
    }
    :right {
      margin: ${margin.top} ${margin.outer} ${margin.top} ${margin.inner};
    }
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
  }
  componentWillUnmount() {
    bodyHtml(el => el.classList.remove(body))
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
