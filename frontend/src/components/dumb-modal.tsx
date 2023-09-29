/** @jsxImportSource @emotion/react */

import { View } from 'react-native'

import { useColors } from './themed'

export function DumbModal({
  close,
  children,
}: {
  close: () => void
  children: JSX.Element | readonly JSX.Element[]
}) {
  const colors = useColors()
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
        background: colors.dark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
        pointerEvents: 'all',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={close}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          backgroundColor: colors.background,
          borderColor: colors.borders,
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        {children}
      </View>
    </button>
  )
}
