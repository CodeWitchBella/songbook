/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { useState, useCallback, Suspense, useEffect } from 'react'
import { PDFRenderMultipleSongsProps } from './pdf-render/pdf-render'

const PDF = React.lazy(() =>
  import(
    /* webpackChunkName: "components_pdf-render" */ './pdf-render/pdf-render'
  ),
)
export default PDF

const PDFDownload = React.lazy(() =>
  import(
    /* webpackChunkName: "components_pdf-render" */ './pdf-render/pdf-render'
  ).then(v => ({ default: v.PDFDownload })),
)

function useDelayed<T>(v: T): T {
  const [state, setState] = useState(v)
  useEffect(() => {
    setImmediate(() => {
      setState(v)
    })
  }, [v])
  return state
}

export function DownloadPDF({
  children,
  ...props
}: PDFRenderMultipleSongsProps & {
  children: (status: string, onClick: () => void) => JSX.Element
}) {
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'generated' | 'error'
  >('idle')
  const onDone = useCallback(() => setStatus('generated'), [])

  return (
    <Suspense fallback={children('Načítám generátor...', () => {})}>
      {useDelayed(status) === 'generating' ? (
        <PDFDownload {...props} onDone={onDone} />
      ) : null}
      {children(
        status === 'idle'
          ? 'Stáhnout PDF'
          : status === 'generating'
          ? 'Generuji PDF...'
          : status === 'error'
          ? 'Nastala chyba'
          : 'Hotovo!',
        () => {
          if (status === 'generating') return
          setStatus('generating')
        },
      )}
    </Suspense>
  )
}
