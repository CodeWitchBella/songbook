import React from 'react'
import { hot } from 'react-hot-loader'
import Print from 'sections/print/print'
import { injectGlobal, css } from 'react-emotion'
import { document } from 'utils/globals'

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  @page {
    size: 105mm 148mm;
    margin: 2cm;
  }
`

const body = css`
  @media print {
    & {
      width: 105mm;
      height: 148mm;
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

class PrintRoute extends React.Component {
  componentDidMount() {
    bodyHtml(el => el.classList.add(body))
  }
  componentDidUnmount() {
    bodyHtml(el => el.classList.remove(body))
  }
  render() {
    return (
      <div>
        <Print />
      </div>
    )
  }
}
export default hot(module)(PrintRoute)
