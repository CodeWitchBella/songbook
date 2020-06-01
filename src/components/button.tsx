import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
} from 'react-native'
import React, { PropsWithChildren } from 'react'
import Hoverable from './interactive/hoverable'

type ButtonProps = PropsWithChildren<{
  disabled?: boolean
  onPress?: (event: GestureResponderEvent) => void
  style?: StyleProp<TextStyle>
}>

export function BasicButton({
  children,
  disabled,
  onPress,
  style,
}: ButtonProps) {
  return (
    <Hoverable>
      {(hover) => (
        <TouchableOpacity disabled={disabled} onPress={onPress}>
          <Text
            style={[
              { textDecorationLine: hover ? 'underline' : 'none' },
              style,
            ]}
          >
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
