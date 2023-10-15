import type { PropsWithChildren, ReactNode } from 'react'
import * as page from 'utils/page'

export function SizerPage({ children }: PropsWithChildren<{}>) {
  return (
    <section className="relative flex h-[100vh] items-center justify-center">
      <div
        className="indexcss-sizer-page relative break-after-page overflow-hidden"
        style={{ padding: '1em' }}
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
