import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
} from 'react-native'
import React, { PropsWithChildren, useRef, useEffect } from 'react'
import Hoverable from './interactive/hoverable'

type ButtonProps = PropsWithChildren<{
  disabled?: boolean
  onPress?: (event: GestureResponderEvent) => void
  style?: StyleProp<TextStyle>
  hoverStyle?: StyleProp<TextStyle>
}>

export function BasicButton({
  children,
  disabled,
  onPress,
  style,
  hoverStyle = { textDecorationLine: 'underline' },
}: ButtonProps) {
  const text = useRef<Text>(null)
  useEffect(() => {
    text.current?.setNativeProps({ style: { cursor: 'pointer' } })
  }, [])
  return (
    <Hoverable>
      {(hover) => (
        <TouchableOpacity
          disabled={disabled}
          onPress={onPress}
          style={{
            alignItems: 'stretch',
            flexDirection: 'row',
            display: 'flex',
          }}
        >
          <Text ref={text} style={[hover ? hoverStyle : null, style]}>
            {children}
          </Text>
        </TouchableOpacity>
      )}
    </Hoverable>
  )
}

export function PrimaryButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        {
          borderWidth: 2,
          borderColor: 'black',
          borderStyle: 'solid',
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 30,
          fontSize: 20,

          textAlign: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </BasicButton>
  )
}
