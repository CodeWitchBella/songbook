import {
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
} from 'react-native'
import React, { PropsWithChildren, useRef, useEffect } from 'react'
import Hoverable from './interactive/hoverable'
import { useHistory } from 'react-router'

type ButtonProps = PropsWithChildren<
  {
    disabled?: boolean

    style?: StyleProp<TextStyle>
    hoverStyle?: StyleProp<TextStyle>
  } & (
    | { onPress: (event: GestureResponderEvent) => void }
    | { to: string }
    | {}
  )
>

export function BasicButton({
  children,
  disabled,
  style,
  hoverStyle = { textDecorationLine: 'underline' },
  ...rest
}: ButtonProps) {
  const text = useRef<Text>(null)
  useEffect(() => {
    text.current?.setNativeProps({ style: { cursor: 'pointer' } })
  }, [])
  const history = useHistory()
  return (
    <Hoverable>
      {(hover) => (
        <TouchableOpacity
          disabled={disabled}
          onPress={
            disabled
              ? undefined
              : 'onPress' in rest
              ? rest.onPress
              : 'to' in rest
              ? () => {
                  if (
                    rest.to.startsWith('http://') ||
                    rest.to.startsWith('https://')
                  ) {
                    window.open(rest.to, '_blank', 'noopener,noreferrer')
                  } else {
                    history.push(rest.to, { canGoBack: true })
                  }
                }
              : undefined
          }
          style={{
            alignItems: 'stretch',
            flexDirection: 'column',
            justifyContent: 'center',
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

export function ListButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        {
          borderWidth: 1,
          borderColor: 'black',
          borderStyle: 'solid',
          backgroundColor: 'white',
          padding: 10,
          fontSize: 15,

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
