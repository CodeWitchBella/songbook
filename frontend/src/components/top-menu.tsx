/** @jsx jsx */
import { jsx } from '@emotion/core'
import { PropsWithChildren, useReducer } from 'react'
import { Link } from 'react-router-dom'
import { Burger } from './song-look/song-menu-icons'
import { useLogin } from './use-login'
import { CachedRoundImage } from './cached-round-image'
import { useHistoryChange } from './use-router'

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
  | { as?: 'button'; to?: undefined; onClick: () => void }
  | { as: 'a'; to: string; onClick?: undefined }
  | { as: typeof Link; to: string; onClick?: undefined }
> & { first?: boolean }) {
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

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

function MenuContent({
  visible,
  children,
}: PropsWithChildren<{
  visible: boolean
}>) {
  const history = useHistoryChange()
  const login = useLogin()
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
        {login.viewer ? (
          <>
            <div
              css={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 0, // top item
              }}
            >
              <CachedRoundImage src={login.viewer.picture} />
            </div>

            <TopMenuItem as={Link} to="/new">
              Přidat píseň
            </TopMenuItem>
          </>
        ) : (
          <TopMenuItem as="button" onClick={login.onClick} first>
            Přihlásit se
          </TopMenuItem>
        )}
        <TopMenuItem
          as="button"
          onClick={() => {
            history.push('/collections', { canGoBack: true })
          }}
        >
          Kolekce písní
        </TopMenuItem>
        <TopMenuItem as="a" to={googleDoc}>
          Návrhy
        </TopMenuItem>
        <TopMenuItem as={Link} to="/changelog">
          Seznam změn
        </TopMenuItem>
        {children}
        {login.viewer ? (
          <TopMenuItem as="button" onClick={login.logout}>
            Odhlásit se
          </TopMenuItem>
        ) : null}
      </ul>
    </div>
  )
}
