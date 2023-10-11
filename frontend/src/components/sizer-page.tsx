/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import type { PropsWithChildren, ReactNode } from 'react'
import * as page from 'utils/page'

import { useBasicStyle } from './themed'

const songClass = css`
  font-size: 3.4vw;
  width: 100vw;
  height: ${100 / page.innerRatio}vw;
  --vh: ${1 / page.innerRatio}vw;
  --vw: 1vw;
  @media (min-width: ${page.innerRatio * 100}vh) {
    font-size: 1.87vh;
    width: ${page.innerRatio * 100}vh;
    height: calc(100vh);
    --vh: 1vw;
    --vw: ${page.innerRatio}vh;
  }
`

export function SizerPage({ children }: PropsWithChildren<{}>) {
  return (
    <section className="relative flex h-[100vh] items-center justify-center">
      <div
        className="relative break-after-page overflow-hidden"
        style={{ padding: '1em' }}
        css={[songClass, useBasicStyle()]}
      >
        {children}
      </div>
    </section>
  )
}

const remConvert = 0.9 / 3.4

export function ContinuousPage({ children }: { children: ReactNode }) {
  return (
    <div
      style={
        {
          fontSize: remConvert * 3.4 + 'rem',
          '--vh': `${remConvert / page.innerRatio}rem`,
          '--vw': `${remConvert}rem`,
        } as any
      }
    >
      {children}
    </div>
  )
}
