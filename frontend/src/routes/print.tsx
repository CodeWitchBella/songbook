import { css, Global } from '@emotion/core'
import React from 'react'
import Print from 'sections/print/print'
import * as page from 'utils/page'
import PreviewToggle from 'components/preview-toggle'
import styled from '@emotion/styled'

const { margin } = page

// eslint-disable-next-line no-unused-expressions
const pageCss = css`
  @page {
    size: ${page.width} ${page.height};
    margin: ${margin.top} ${margin.outer} ${margin.bottom} ${margin.outer};
  }
`

const body = css`
  @media print {
    body,
    html {
      width: ${page.width};
      height: ${page.height};
    }
  }
`

const appScroll = css`
  #root {
    scroll-snap-type: mandatory;

    scroll-snap-destination: 0% 100%;
    scroll-snap-points-y: repeat(100%);
  }
`

const Relative = styled.div`
  position: relative;
`

class PrintRoute extends React.Component<{ tag: string }> {
  render() {
    return (
      <Relative>
        <Global styles={[pageCss, appScroll, body]} />
        <Print tag={this.props.tag} />
        <PreviewToggle />
      </Relative>
    )
  }
}
export default PrintRoute
