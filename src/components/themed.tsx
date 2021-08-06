import { forwardRef } from 'react'
import { PropsWithChildren } from 'react'
// eslint-disable-next-line no-restricted-imports
import { Text as RNText, TextProps, View, ViewProps } from 'react-native'
import { useDarkModeSetting } from './dark-mode'

const colors = {
  dark: {
    background: '#121212',
    text: 'white',
    borders: 'white',
    dark: true,
    inputBackground: '#111',
  },
  light: {
    background: 'white',
    text: 'black',
    borders: 'black',
    dark: false,
    inputBackground: 'white',
  },
}
export function getColors(dark: boolean) {
  return dark ? colors.dark : colors.light
}

export function useColors() {
  return getColors(useDarkModeSetting().value)
}

export type TextRef = RNText
export const TText = forwardRef<TextRef, PropsWithChildren<TextProps>>(
  ({ style, ...rest }, ref) => {
    const colors = useColors()
    return (
      <RNText
        ref={ref}
        style={[
          {
            color: colors.text,
            fontFamily: 'inherit',
            fontWeight: '400' as any,
          },
          style,
        ]}
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

export function TH3({ style, ...rest }: PropsWithChildren<TextProps>) {
  return (
    <TText
      style={[
        {
          display: 'flex',
          fontSize: 16,
          marginBottom: 8,
          marginTop: 16,
          fontWeight: 'bold',
        },
        style,
      ]}
      {...rest}
    />
  )
}

export function TP({ children, ...rest }: PropsWithChildren<TextProps>) {
  return (
    <View style={{ marginTop: 8 }}>
      <TText {...rest}>
        <TText>
          <View style={{ width: 8 }} />
        </TText>
        {children}
      </TText>
    </View>
  )
}

export function useBasicStyle() {
  const colors = useColors()
  return {
    borderColor: colors.borders,
    backgroundColor: colors.background,
    color: colors.text,
  }
}

export function RootView({
  children,
  style,
}: PropsWithChildren<{ style?: ViewProps['style'] }>) {
  const colors = useColors()
  return (
    <View
      style={[{ backgroundColor: colors.background, minHeight: '100%' }, style]}
    >
      {children}
    </View>
  )
}
