import { createContext, PropsWithChildren, useContext } from 'react'
// eslint-disable-next-line no-restricted-imports
import { Text as RNText, TextProps, View, ViewProps } from 'react-native'
import { useMediaQuery } from 'utils/utils'

export function TText({ style, ...rest }: PropsWithChildren<TextProps>) {
  const dark = useDarkMode()
  return (
    <RNText style={[{ color: dark ? 'white' : 'black' }, style]} {...rest} />
  )
}

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

const darkModeContext = createContext(false)
export function DarkModeProvider({
  children,
}: {
  children: JSX.Element | readonly JSX.Element[]
}) {
  return (
    <darkModeContext.Provider
      value={useMediaQuery('(prefers-color-scheme: dark)')}
    >
      {children}
    </darkModeContext.Provider>
  )
}

export function useDarkMode() {
  return useContext(darkModeContext)
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
