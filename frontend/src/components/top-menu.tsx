/** @jsxImportSource @emotion/react */

import type { PropsWithChildren } from 'react'
import { useReducer } from 'react'
import { View } from 'react-native'

import { OnPressOutside } from './interactive/press-outside'
import { Burger } from './song-look/song-menu-icons'
import { useColors } from './themed'

export default function TopMenu({ children }: PropsWithChildren<{}>) {
  const [{ isOpen, wasOpen }, setOpen] = useReducer(
    (st: { isOpen: boolean; wasOpen: boolean }, action: null | false) => {
      if (action === false) return { isOpen: false, wasOpen: true }
      return { isOpen: !st.isOpen, wasOpen: true }
    },
    { isOpen: false, wasOpen: false },
  )
  const colors = useColors()
  return (
    <div className="w-10">
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
          backgroundColor: colors.background,
          color: colors.text,
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
  const colors = useColors()
  return (
    <OnPressOutside onPressOutside={visible ? onClose : null}>
      {(ref) => (
        <View
          ref={ref}
          style={{
            position: 'absolute',
            right: 4,
            marginTop: 2,

            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.borders,
            borderStyle: 'solid',

            padding: 10,

            display: visible ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          {children}
        </View>
      )}
    </OnPressOutside>
  )
}
