/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/core'
import { PropsWithChildren, useReducer } from 'react'
import { Burger } from './song-look/song-menu-icons'

export default function TopMenu({ children }: PropsWithChildren<{}>) {
  const [{ isOpen, wasOpen }, setOpen] = useReducer(
    (st: { isOpen: boolean; wasOpen: boolean }, _action: null) => {
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
      {wasOpen && <MenuContent visible={isOpen}>{children}</MenuContent>}
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
}: PropsWithChildren<{
  visible: boolean
}>) {
  return (
    <div
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
