import { forwardRef } from 'react'
import { PropsWithChildren } from 'react'
import {
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
  TextProps,
  TextStyle,
  View,
  ViewProps,
} from 'react-native'
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

type TStyleProp<T> = undefined | T | TStyleProp<T>[]
type TTextProps = Omit<TextProps, 'style'> & {
  style?: TStyleProp<TextStyle & { fontSize?: string | number }>
}

// performs deep array mapping and makes sure there is no extra allocation if
// mapping function does not change anything
// anys are inevitable in this case because there is no way to actually type this
// if this were a professional software I would write tests for this but :meh:
function mapStyle<In, Out>(
  style: TStyleProp<In>,
  mapper: (v: In) => Out,
): TStyleProp<Out> {
  if (!Array.isArray(style)) return mapper(style as any)

  let result: any | undefined = undefined
  let i = 0
  for (const item of style as any) {
    ++i
    const out = mapper(item)
    if (!result && out !== item) result = style.slice(0, i)
    if (result) result.push(out)
  }
  return result || style
}

export type TextRef = RNText
export const TText = forwardRef<TextRef, TTextProps>(
  ({ style, ...rest }, ref) => {
    const colors = useColors()
    const fixedStyle = mapStyle(
      style,
      (v): TextStyle =>
        typeof v === 'object' && v?.fontSize
          ? { ...v, fontSize: +v.fontSize }
          : v,
    )
    return (
      <RNText
        ref={ref}
        style={[
          {
            color: colors.text,
            fontFamily: 'inherit',
            fontWeight: '400' as any,
          },
          fixedStyle,
        ]}
        {...rest}
      />
    )
  },
)

export function TH2({ style, ...rest }: TTextProps) {
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

export function TH3({ style, ...rest }: TTextProps) {
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

export function TP({ children, ...rest }: TTextProps) {
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
