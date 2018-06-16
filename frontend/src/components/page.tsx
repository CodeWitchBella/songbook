import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'
import { PrintPreview, PrintPreviewToggle } from 'containers/print-preview'

const sizer = (print: boolean) => css`
  @media not print {
    position: relative;
    display: flex;
    width: 100%;
    height: 100vh;
    justify-content: center;
    align-items: center;
  }
  background: papayawhip;
`

const width = `calc(${page.width} - ${page.margin.inner} - ${
  page.margin.outer
})`
const height = `calc(
    ${page.height} - ${page.margin.top} - ${page.margin.bottom} - 1px
  )`

const songClass = (left: boolean, print: boolean) => css`
  position: relative;
  background: white;

  width: ${width};
  height: ${height};
  overflow-x: hidden;
  overflow-y: visible;
  page-break-after: always;

  @media not print {
    ${print
      ? css`
          margin: ${left
            ? `${page.margin.top} ${page.margin.outer} ${page.margin.bottom}
    ${page.margin.inner}`
            : `${page.margin.top} ${page.margin.inner} ${page.margin.bottom}
    ${page.margin.outer}`};
        `
      : css`
          padding: 1em;
          width: calc(100% - 2em);
          height: calc(100% - 2em);
          @media (min-width: ${page.innerRatio * 100}vh) {
            font-size: 1.9vh;
            width: ${page.innerRatio * 100}vh;
            height: calc(100vh - 2em);
            margin: 0 auto;
          }
          font-size: 3vw;
        `};
  }
  @media print {
    margin: ${left
      ? `0 0 0 calc(${page.margin.inner} - ${page.margin.outer})`
      : `0 calc(${page.margin.inner} - ${page.margin.outer}) 0 0`};
  }
`

const marginDisplay = (print: boolean) =>
  print
    ? css`
        background: lightgrey;
      `
    : css`
        @media not print {
          width: 100%;
          height: 100%;
        }
      `

const Page: React.SFC<{ left?: boolean }> = ({ children, left }) => (
  <PrintPreview>
    {print => (
      <section className={sizer(print)}>
        <div className={marginDisplay(print)}>
          <div className={songClass(!!left, print)}>{children}</div>
        </div>
      </section>
    )}
  </PrintPreview>
)
export default Page
