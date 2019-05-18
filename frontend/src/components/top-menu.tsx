/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useState, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { Burger } from './song-look/song-menu-icons'

export default function TopMenu() {
  const [isOpen, setOpen] = useState(false)
  return (
    <div css={{ width: 40 }}>
      <button
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
        onClick={() => setOpen(v => !v)}
      >
        <Burger />
      </button>
      {isOpen && <MenuContent />}
    </div>
  )
}

function MenuItem({
  children,
  as: As = 'li',
  to,
}: PropsWithChildren<
  | { as?: 'li'; to?: undefined }
  | { as: 'a'; to: string }
  | { as: typeof Link; to: string }
>) {
  return (
    <As
      href={As === 'a' ? to : undefined}
      to={As === 'a' ? (undefined as any) : to}
      css={{
        all: 'unset',
        boxSizing: 'border-box',
        border: '1px solid',
        height: 40,
        display: 'block',
        lineHeight: '40px',
        padding: '0 20px',
        background: 'white',
        marginTop: 5,
      }}
      {...(As === 'a' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </As>
  )
}

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

function MenuContent() {
  return (
    <ul
      css={{
        all: 'unset',
        position: 'absolute',
        right: 4,
        top: 40,
      }}
    >
      <MenuItem
        as="a"
        to={
          'https://www.facebook.com/v3.3/dialog/oauth?' +
          new URLSearchParams({
            client_id: '331272811153847',
            redirect_uri: 'https://zpevnik.skorepova.info/login/fb',
            state: 'abc',
            scope: 'email',
          }).toString()
        }
      >
        Přihlásit se
      </MenuItem>
      <MenuItem as={Link} to="/new">
        Přidat píseň
      </MenuItem>
      <MenuItem as="a" to={googleDoc}>
        Návrhy
      </MenuItem>
      <MenuItem as={Link} to="/changelog">
        Seznam změn
      </MenuItem>
    </ul>
  )
}
