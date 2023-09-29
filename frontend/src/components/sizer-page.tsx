/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { PropsWithChildren, ReactNode } from 'react'
import * as page from 'utils/page'
import { useBasicStyle } from './themed'

const sizer = css`
  position: relative;
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
`

const width = `calc(${page.width} - ${page.margin.inner} - ${page.margin.outer})`
const height = `calc(
    ${page.height} - ${page.margin.top} - ${page.margin.bottom} - 1px
  )`

const songClass = css`
  position: relative;

  width: ${width};
  height: ${height};
  overflow-x: hidden;
  overflow-y: hidden;
  page-break-after: always;

  box-sizing: border-box;
  padding: 1em;
  width: 100vw;
  height: ${100 / page.innerRatio}vw;
  --vh: ${1 / page.innerRatio}vw;
  --vw: 1vw;
  font-size: 3.4vw;
  @media (min-width: ${page.innerRatio * 100}vh) {
    font-size: 1.87vh;
    width: ${page.innerRatio * 100}vh;
    --vh: 1vw;
    --vw: ${page.innerRatio}vh;
    height: calc(100vh);
    margin: 0 auto;
  }
`

const marginDisplay = css`
  width: 100%;
  height: 100%;
`

export function SizerPage({ children }: PropsWithChildren<{}>) {
  return (
    <section css={sizer}>
      <div css={marginDisplay}>
        <div css={[songClass, useBasicStyle()]}>{children}</div>
      </div>
    </section>
  )
}

const remConvert = 0.9 / 3.4

export function ContinuousPage({ children }: { children: ReactNode }) {
  return (
    <div
      css={css`
        box-sizing: border-box;
        font-size: ${remConvert * 3.4}rem;
        --vh: ${remConvert / page.innerRatio}rem;
        --vw: ${remConvert}rem;
      `}
    >
      {children}
    </div>
  )
}
