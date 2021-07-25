import { forwardRef } from 'react'
import { PropsWithChildren } from 'react'
// eslint-disable-next-line no-restricted-imports
import { Text as RNText, TextProps, View, ViewProps } from 'react-native'
import { useDarkMode } from './dark-mode'
export { useDarkMode } from './dark-mode'

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
