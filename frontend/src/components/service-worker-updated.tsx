/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useServiceWorkerStatus } from './service-worker-status'

export default function ServiceWorkerUpdated() {
  const { updated, hideUpdated } = useServiceWorkerStatus()

  if (!updated) return null
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
        onClick={() => hideUpdated()}
        css={{
          backgroundColor: 'white',
          border: '1px solid black',
          textAlign: 'center',
          margin: 20,
          padding: 10,
        }}
      >
        <div css={{ fontSize: 24 }}>Nová verze</div>
        <div css={{ fontSize: 18, maxWidth: 500 }}>
          Je dostupná nová verze této aplikace. Zobrazí se až zavřeš všechny
          záložky s ní. Klikni na tuto kartu pro její skrytí. Alternativně můžeš
          stisknout tlačítko níže.
        </div>
        <button
          type="button"
          css={{
            all: 'unset',
            marginTop: 10,
            fontSize: 18,
            padding: '5px 15px',
            border: '1px solid black',
            borderRadius: 15,
            cursor: 'pointer',
            ':hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => {
            ;(updated as any).messageSW({ type: 'SKIP_WAITING' })
          }}
        >
          Restartovat aplikaci
        </button>
      </div>
    </div>
  )
}
