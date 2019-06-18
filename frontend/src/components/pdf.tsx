/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { useState, useCallback } from 'react'
import { PDFRenderMultipleSongsProps } from './pdf-render'

const PDF = React.lazy(() =>
  import(/* webpackChunkName: "components_pdf-render" */ './pdf-render'),
)
export default PDF

const PDFDownload = React.lazy(() =>
  import(/* webpackChunkName: "components_pdf-render" */ './pdf-render').then(
    v => ({ default: v.PDFDownload }),
  ),
)

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
    <>
      {status === 'generating' ? (
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
          if (status !== 'idle' && status !== 'error') return
          setStatus('generating')
        },
      )}
    </>
  )
}
