import { TText, useDarkMode } from 'components/themed'
import { PropsWithChildren, useState } from 'react'
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
  const [hover, setHover] = useState(false)
  const inPressOutside = useInPressOutside()

  return (
    <TText
      style={[
        {
          borderColor: useDarkMode() ? 'white' : 'black',
          textDecorationLine: 'underline',
        },
        style,
        hover && (!isPressOverriden() || inPressOutside)
          ? { fontStyle: 'italic' }
          : null,
      ]}
      onPress={useLinkOnPress(to)}
      // @ts-expect-error
      href={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </TText>
  )
}
