import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'

const sizer = css`
  display: flex;
  width: 100%;
  height: 100%;
  background: papayawhip;
  justify-content: center;
  align-items: center;
`

const songClass = (scale: number) => css`
  position: relative;
  background: grey;
  width: ${page.width};
  height: ${page.height};
  padding: ${page.margin.top} ${page.margin.outer} ${page.margin.top}
    ${page.margin.inner};
  @media print {
    padding: 0;
  }
  @media not print {
    transform: scale(${scale});
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
    height: 0mm;
  }
  @media print {
    color: transparent;
  }
`

const Page: React.SFC<{}> = ({ children }) => (
  <>
    <div className={sizer}>
      <div className={songClass(1)}>
        <div className={marginDisplay}>{children}</div>
      </div>
    </div>
    <PageBreak>--- page break ---</PageBreak>
  </>
)
export default Page
