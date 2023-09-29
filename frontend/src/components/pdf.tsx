import { Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PDFRenderMultipleSongsProps } from './pdf-render/pdf-render'
import PDF, { PDFDownload } from './pdf-render/pdf-render'

export default PDF

function useDelayed<T>(v: T): T {
  const [state, setState] = useState(v)
  useEffect(() => {
    Promise.resolve().then(() => {
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
  const { t } = useTranslation()
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'generated' | 'error'
  >('idle')
  const onDone = useCallback(() => setStatus('generated'), [])

  return (
    <Suspense fallback={children(t('pdf-gen.Loading'), () => {})}>
      {useDelayed(status) === 'generating' ? (
        <PDFDownload {...props} onDone={onDone} />
      ) : null}
      {children(
        status === 'idle'
          ? t('pdf-gen.Download PDF')
          : status === 'generating'
          ? t('pdf-gen.Generating PDF')
          : status === 'error'
          ? t('pdf-gen.Something went wrong')
          : t('pdf-gen.complete'),
        () => {
          if (status === 'generating') return
          setStatus('generating')
        },
      )}
    </Suspense>
  )
}
