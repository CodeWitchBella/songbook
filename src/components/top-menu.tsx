/** @jsxImportSource @emotion/react */

import { PropsWithChildren, useEffect, useReducer, useRef } from 'react'
import { Burger } from './song-look/song-menu-icons'

export default function TopMenu({ children }: PropsWithChildren<{}>) {
  const [{ isOpen, wasOpen }, setOpen] = useReducer(
    (st: { isOpen: boolean; wasOpen: boolean }, action: null | false) => {
      if (action === false) return { isOpen: false, wasOpen: true }
      return { isOpen: !st.isOpen, wasOpen: true }
    },
    { isOpen: false, wasOpen: false },
  )
  return (
    <div css={{ width: 40 }}>
      <button
        aria-label="Hlavní menu"
        css={{
          all: 'unset',
          boxSizing: 'border-box',
          height: 40,
          width: 40,
          border: '1px solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          position: 'relative',
        }}
        onClick={() => setOpen(null)}
      >
        <Burger />
      </button>
      {wasOpen && (
        <MenuContent onClose={() => setOpen(false)} visible={isOpen}>
          {children}
        </MenuContent>
      )}
    </div>
  )
}

export function TopMenuItem({
  children,
  as: As = 'button',
  to,
  onClick,
  first,
}: PropsWithChildren<
  | { as?: 'button'; to?: undefined; onClick: (evt: React.MouseEvent) => void }
  | { as: 'a'; to: string; onClick?: undefined }
> & { first?: boolean }) {
  return (
    <As
      onClick={onClick}
      href={As === 'a' ? to : undefined}
      css={{
        all: 'unset',
        boxSizing: 'border-box',
        border: '1px solid',
        height: 40,
        display: 'block',
        width: '100%',
        lineHeight: '40px',
        padding: '0 20px',
        background: 'white',
        marginTop: first ? 0 : 5,
        cursor: 'pointer',
        ':hover': {
          textDecoration: 'underline',
        },
      }}
      {...(As === 'a' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </As>
  )
}

function MenuContent({
  visible,
  children,
  onClose,
}: PropsWithChildren<{
  visible: boolean
  onClose: () => void
}>) {
  return (
    <div
      ref={useOnClickOutside(visible ? onClose : undefined)}
      css={{
        position: 'absolute',
        right: 4 - 20,
        top: 50,
        padding: '0 20px 20px 20px',
        overflow: 'hidden',
      }}
    >
      <ul
        css={{
          all: 'unset',

          background: 'white',
          padding: 10,

          boxShadow: '0px 0px 12px 5px rgba(0,0,0,0.51)',
          display: visible ? 'block' : 'none',
        }}
      >
        {children}
      </ul>
    </div>
  )
}

function useOnClickOutside(handler?: null | (() => void)) {
  const ref = useRef<HTMLDivElement>(null)
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      if (handlerRef.current && !ref.current?.contains(event.target as any)) {
        event.preventDefault()
        handlerRef.current()
      }
    }
    const cfg = { capture: true, passive: false }
    document.body.addEventListener('mousedown', listener, cfg)
    document.body.addEventListener('touchstart', listener, cfg)
    document.body.addEventListener('touchend', listener, cfg)
    return () => {
      document.body.removeEventListener('mousedown', listener)
      document.body.removeEventListener('touchstart', listener)
      document.body.removeEventListener('touchend', listener)
    }
  }, [])
  return ref
}
