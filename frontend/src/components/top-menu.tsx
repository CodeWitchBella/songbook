/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useState, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { Burger } from './song-look/song-menu-icons'
import { useLogin } from './use-login'

export default function TopMenu({
  sortByAuthor,
  setSortByAuthor,
}: {
  sortByAuthor: boolean
  setSortByAuthor: (v: boolean) => void
}) {
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
      {isOpen && (
        <MenuContent
          sortByAuthor={sortByAuthor}
          setSortByAuthor={setSortByAuthor}
        />
      )}
    </div>
  )
}

function MenuItem({
  children,
  as: As = 'button',
  to,
  onClick,
}: PropsWithChildren<
  | { as?: 'button'; to?: undefined; onClick: () => void }
  | { as: 'a'; to: string; onClick?: undefined }
  | { as: typeof Link; to: string; onClick?: undefined }
>) {
  return (
    <As
      onClick={onClick}
      href={As === 'a' ? to : undefined}
      to={As === 'a' ? (undefined as any) : to}
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
        marginTop: 5,
        cursor: 'pointer',
      }}
      {...(As === 'a' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </As>
  )
}

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

function MenuContent({
  sortByAuthor,
  setSortByAuthor,
}: {
  sortByAuthor: boolean
  setSortByAuthor: (v: boolean) => void
}) {
  const login = useLogin()
  return (
    <ul
      css={{
        all: 'unset',
        position: 'absolute',
        right: 4,
        top: 40,
      }}
    >
      {login.viewer ? null : (
        <MenuItem as="button" onClick={login.onClick}>
          Přihlásit se
        </MenuItem>
      )}
      <MenuItem as={Link} to="/new">
        Přidat píseň
      </MenuItem>
      <MenuItem as="a" to={googleDoc}>
        Návrhy
      </MenuItem>
      <MenuItem as={Link} to="/changelog">
        Seznam změn
      </MenuItem>
      <MenuItem as="button" onClick={() => setSortByAuthor(!sortByAuthor)}>
        Řadit podle {sortByAuthor ? 'názvu' : 'interpreta'}
      </MenuItem>
    </ul>
  )
}
