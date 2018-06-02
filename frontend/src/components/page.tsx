import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'

const sizer = css`
  width: 100%;
  height: 100%;
  background: papayawhip;
`

const songClass = css`
  position: relative;
  background: grey;
  width: ${page.width};
  height: ${page.height};
  padding: ${page.margin.top} ${page.margin.outer} ${page.margin.top}
    ${page.margin.inner};
  margin: 0 auto;
  @media print {
    padding: 0;
  }
`

const marginDisplay = css`
  background: white;
  width: 100%;
  height: 100%;
`

const PageBreak = styled.div`
  page-break-after: always;
  @media not print {
    display: block;
    height: 30mm;
    line-height: 30mm;
  }
  @media print {
    color: transparent;
  }
`

const Page: React.SFC<{}> = ({ children }) => (
  <>
    <div className={sizer}>
      <div className={songClass}>
        <div className={marginDisplay}>{children}</div>
      </div>
    </div>
    <PageBreak>--- page break ---</PageBreak>
  </>
)
export default Page
