import { forwardRef, useMemo, useState } from 'react'
import { createContext, PropsWithChildren, useContext } from 'react'
// eslint-disable-next-line no-restricted-imports
import { Text as RNText, TextProps, View, ViewProps } from 'react-native'
import { useMediaQuery } from 'utils/utils'

export type TextRef = RNText
export const TText = forwardRef<TextRef, PropsWithChildren<TextProps>>(
  ({ style, ...rest }, ref) => {
    const dark = useDarkMode()
    return (
      <RNText
        ref={ref}
        style={[{ color: dark ? 'white' : 'black' }, style]}
        {...rest}
      />
    )
  },
)

export function TH2({ style, ...rest }: PropsWithChildren<TextProps>) {
  return (
    <TText
      style={[
        {
          fontSize: 20,
          flexDirection: 'row',
          display: 'flex',
          marginBottom: 16,
          marginTop: 32,
        },
        style,
      ]}
      {...rest}
    />
  )
}

type DarkModeSetting = 'automatic' | 'light' | 'dark'
const darkModeContext = createContext<{
  value: boolean
  setting: DarkModeSetting
  setSetting: (v: DarkModeSetting) => void
}>({ value: false, setting: 'light', setSetting: () => {} })
export function DarkModeProvider({
  children,
}: {
  children: JSX.Element | readonly JSX.Element[]
}) {
  const [setting, setSetting] = useState(() =>
    localStorage.getItem('dark-mode-setting'),
  )
  const value = useMediaQuery('(prefers-color-scheme: dark)')
  return (
    <darkModeContext.Provider
      value={useMemo(
        () => ({
          value: setting === 'automatic' ? value : setting === 'dark',
          setting: (setting as any) || 'automatic',
          setSetting: (value) => {
            setSetting(value)
            if (value === 'automatic') {
              localStorage.removeItem('dark-mode-setting')
            } else {
              localStorage.setItem('dark-mode-setting', value)
            }
          },
        }),
        [setting, value],
      )}
    >
      {children}
    </darkModeContext.Provider>
  )
}
export function useDarkModeSetting() {
  return useContext(darkModeContext)
}
export function useDarkMode() {
  return useDarkModeSetting().value
}

export function useBasicStyle() {
  const dark = useDarkMode()
  return {
    borderColor: dark ? 'white' : 'black',
    backgroundColor: dark ? 'black' : 'white',
    color: dark ? 'white' : 'black',
  }
}

export function RootView({
  children,
  style,
}: PropsWithChildren<{ style?: ViewProps['style'] }>) {
  const dark = useDarkMode()
  return (
    <View
      style={[
        { backgroundColor: dark ? 'black' : 'white', minHeight: '100%' },
        style,
      ]}
    >
      {children}
    </View>
  )
}
