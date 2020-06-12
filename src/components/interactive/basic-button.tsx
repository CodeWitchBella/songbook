import React, { PropsWithChildren, useRef, useEffect } from 'react'
import {
  StyleProp,
  TextStyle,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
} from 'react-native'
import { useHistory } from 'react-router'
import { useUpdateAfterNavigate } from 'components/service-worker-status'

type ButtonPropsBase<T> = PropsWithChildren<
  {
    disabled?: boolean
    style?: StyleProp<TextStyle>
  } & T
>

type ButtonPropsNonLink = ButtonPropsBase<{
  onPress?: (event: GestureResponderEvent) => void
}>

type ButtonPropsLink = ButtonPropsBase<{ to: string }>

export type ButtonProps = ButtonPropsLink | ButtonPropsNonLink

function BasicButtonLink({ to, ...rest }: ButtonPropsLink) {
  const text = useRef<Text>(null)
  useEffect(() => {
    text.current?.setNativeProps({ style: { cursor: 'pointer' } })
  }, [])
  const history = useHistory()
  const updateAfterNavigate = useUpdateAfterNavigate()
  return (
    <BasicButtonBase
      onPress={() => {
        if (to.startsWith('http://') || to.startsWith('https://')) {
          window.open(to, '_blank', 'noopener,noreferrer')
        } else {
          updateAfterNavigate()
          history.push(to, { canGoBack: true })
        }
      }}
      {...rest}
    />
  )
}

function BasicButtonBase({
  children,
  disabled,
  style,
  ...rest
}: ButtonPropsNonLink) {
  const text = useRef<Text>(null)
  useEffect(() => {
    text.current?.setNativeProps({ style: { cursor: 'pointer' } })
  }, [])
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={
        disabled ? undefined : 'onPress' in rest ? rest.onPress : undefined
      }
      style={{
        alignItems: 'stretch',
        flexDirection: 'column',
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      <Text ref={text} style={[style]}>
        {children}
      </Text>
    </TouchableOpacity>
  )
}

export function BasicButton(props: ButtonProps) {
  if ('to' in props) return <BasicButtonLink {...props} />
  return <BasicButtonBase {...props} />
}
