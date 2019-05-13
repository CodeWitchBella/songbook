import React, { PropsWithChildren } from 'react'
import { css } from 'emotion'
import * as page from 'utils/page'
import { usePrintPreview } from 'containers/print-preview'

const sizer = () => css`
  @media not print {
    position: relative;
    display: flex;
    height: 100vh;
    justify-content: center;
    align-items: center;
  }
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
  overflow-y: hidden;
  page-break-after: always;

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
          box-sizing: border-box;
          padding: 1em;
          width: calc(100% - 2em);
          height: calc(100% - 2em);
          @media (min-width: ${page.innerRatio * 100}vh) {
            font-size: 1.87vh;
            width: ${page.innerRatio * 100}vh;
            height: calc(100vh);
            margin: 0 auto;
          }
          font-size: 3vw;
        `};
  }
  @media print {
    margin: ${left
      ? `0 calc(${page.margin.inner} - ${page.margin.outer}) 0 0`
      : `0 0 0 calc(${page.margin.inner} - ${page.margin.outer})`};
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

export default function Page({
  children,
  left,
}: PropsWithChildren<{ left?: boolean }>) {
  const print = usePrintPreview()
  return (
    <section className={sizer()}>
      <div className={marginDisplay(print)}>
        <div className={songClass(!!left, print)}>{children}</div>
      </div>
    </section>
  )
}
