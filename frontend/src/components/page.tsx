import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'
import { PrintPreview, PrintPreviewToggle } from 'containers/print-preview'

const sizer = (print: boolean) => css`
  @media not print {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
  background: papayawhip;
`

const songClass = (left: boolean, print: boolean) => css`
  position: relative;
  background: white;

  width: calc(${page.width} - ${page.margin.inner} - ${page.margin.outer});
  height: calc(${page.height} - ${page.margin.top} - ${page.margin.bottom});
  overflow-x: hidden;

  @media not print {
    ${print
      ? css`
          margin: ${left
            ? `${page.margin.top} ${page.margin.inner} ${page.margin.bottom}
    ${page.margin.outer}`
            : `${page.margin.top} ${page.margin.outer} ${page.margin.bottom}
    ${page.margin.inner}`};
        `
      : css`
          padding: 1em;
          width: calc(100% - 2em);
          height: calc(100% - 2em);
          font-size: 3vw;
        `};
  }
  @media print {
    margin: 0;
  }
`

const breakAfter = css`
  page-break-after: always;
`

const marginDisplay = (print: boolean) =>
  print
    ? css`
        background: grey;
      `
    : css`
        @media not print {
          width: 100%;
          height: 100%;
        }
      `

const previewToggle = css`
  @media not print {
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 2;
  }
  @media print {
    display: none;
  }
`
const PreviewToggle = () => (
  <PrintPreviewToggle>
    {toggle => (
      <button className={previewToggle} onClick={toggle}>
        Togle print preview
      </button>
    )}
  </PrintPreviewToggle>
)

const Page: React.SFC<{ left?: boolean }> = ({ children, left }) => (
  <PrintPreview>
    {print => (
      <div className={sizer(print)}>
        <PreviewToggle />
        <div className={marginDisplay(print)}>
          <div className={songClass(!!left, print)}>
            {children}
            <div className={breakAfter} />
          </div>
        </div>
      </div>
    )}
  </PrintPreview>
)
export default Page
