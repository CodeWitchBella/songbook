/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { PropsWithChildren } from 'react'
import * as page from 'utils/page'
import { useBasicStyle } from './themed'

const sizer = () => css`
  @media not print {
    position: relative;
    display: flex;
    height: 100vh;
    justify-content: center;
    align-items: center;
  }
`

const width = `calc(${page.width} - ${page.margin.inner} - ${page.margin.outer})`
const height = `calc(
    ${page.height} - ${page.margin.top} - ${page.margin.bottom} - 1px
  )`

const songClass = (left: boolean) => css`
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

export default function SizerPage({
  children,
  left,
}: PropsWithChildren<{ left?: boolean }>) {
  return (
    <section css={sizer()}>
      <div css={marginDisplay}>
        <div css={[songClass(!!left), useBasicStyle()]}>{children}</div>
      </div>
    </section>
  )
}
