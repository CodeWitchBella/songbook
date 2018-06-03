import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'

const sizer = css`
  @media not print {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
  background: papayawhip;
`

const songClass = (left: boolean) => css`
  position: relative;
  background: white;

  width: calc(${page.width} - ${page.margin.inner} - ${page.margin.outer});
  height: calc(${page.height} - ${page.margin.top} - ${page.margin.bottom});

  margin: ${left
    ? `${page.margin.top} ${page.margin.inner} ${page.margin.bottom}
    ${page.margin.outer}`
    : `${page.margin.top} ${page.margin.outer} ${page.margin.bottom}
    ${page.margin.inner}`};
  @media print {
    margin: 0;
  }
`

const breakAfter = css`
  page-break-after: always;
`

const marginDisplay = css`
  background: grey;
`

const Page: React.SFC<{ left?: boolean }> = ({ children, left }) => (
  <>
    <div className={sizer}>
      <div className={marginDisplay}>
        <div className={songClass(!!left)}>
          {children}
          <div className={breakAfter} />
        </div>
      </div>
    </div>
  </>
)
export default Page
