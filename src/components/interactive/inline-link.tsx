import { TextRef, TText, useColors } from 'components/themed'
import { PropsWithChildren, useRef, useState } from 'react'
import { TextStyle } from 'react-native'
import { useLinkOnPress } from './basic-button'
import { isPressOverriden, useInPressOutside } from './press-outside'

export function InlineLink({
  children,
  style,
  to,
}: PropsWithChildren<{
  style?: TextStyle
  to: string
}>) {
  const [hover, setHover] = useState<readonly [number, number] | null>(null)
  const inPressOutside = useInPressOutside()
  const ref = useRef<TextRef>(null)

  return (
    <TText
      ref={ref}
      style={[
        {
          borderColor: useColors().borders,
          textDecorationLine: 'underline',
        },
        style,
        hover && (!isPressOverriden() || inPressOutside)
          ? {
              fontStyle: 'italic',
              lineHeight: hover[1] - 1,
              paddingRight: 0.3,
            }
          : null,
      ]}
      onPress={useLinkOnPress(to)}
      // @ts-expect-error
      href={to}
      onMouseEnter={() => {
        ref.current?.measure((x, y, width, height) => {
          setHover([width, height])
        })
      }}
      onMouseLeave={() => setHover(null)}
    >
      {children}
    </TText>
  )
}
