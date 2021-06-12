/** @jsxImportSource @emotion/react */

export function DumbModal({
  close,
  children,
}: {
  close: () => void
  children: JSX.Element | readonly JSX.Element[]
}) {
  return (
    <button
      type="button"
      css={{
        all: 'unset',
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.7)',
        pointerEvents: 'all',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={close}
    >
      <div
        css={{
          boxShadow: '10px 10px 36px -8px rgba(0,0,0,0.75)',
          padding: '20px 10px',
          background: 'white',
          fontSize: 18,
        }}
      >
        {children}
      </div>
    </button>
  )
}
