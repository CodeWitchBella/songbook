/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useServiceWorkerStatus } from './service-worker-status'

export default function ServiceWorkerUpdated() {
  const status = useServiceWorkerStatus()

  if (!status.updated) return null
  return (
    <div
      css={{
        position: 'absolute',
        bottom: 0,
        pointerEvents: 'none',
        '> *': { pointerEvents: 'auto' },
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        onClick={() => status.hideUpdated()}
        css={{
          backgroundColor: 'white',
          border: '1px solid black',
          textAlign: 'center',
          margin: 20,
        }}
      >
        <div css={{ fontSize: 24 }}>Nová verze</div>
        <div css={{ fontSize: 18, maxWidth: 500 }}>
          Je dostupná nová verze této aplikace. Zobrazí se až zavřete všechny
          záložky s ní. Klikněte na tuto kartu pro její skrytí.
        </div>
      </div>
    </div>
  )
}
