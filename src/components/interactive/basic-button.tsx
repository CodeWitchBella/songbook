import { PropsWithChildren, useState } from 'react'
import {
  StyleProp,
  TextStyle,
  GestureResponderEvent,
  Pressable,
} from 'react-native'
import { useNavigate } from 'react-router'
import { useUpdateAfterNavigate } from 'components/service-worker-status'
import { TText, useColors } from 'components/themed'
import { isPressOverriden, useInPressOutside } from './press-outside'
import { useCallback } from 'react'

type ButtonPropsBase<T> = PropsWithChildren<
  {
    disabled?: boolean
    style?: StyleProp<TextStyle>
  } & T
>

type ButtonPropsNonLink = ButtonPropsBase<{
  onPress?: (event: GestureResponderEvent) => void
}>

type ButtonPropsLink = ButtonPropsBase<{ to: string; replace?: boolean }>

export type ButtonProps = ButtonPropsLink | ButtonPropsNonLink

export function useLinkOnPress(
  to: string,
  { replace = false }: { replace?: boolean } = {},
) {
  const navigate = useNavigate()
  const updateAfterNavigate = useUpdateAfterNavigate()
  return useCallback(
    (event?: { preventDefault?: () => any }) => {
      event?.preventDefault?.()
      if (to.startsWith('http://') || to.startsWith('https://')) {
        window.open(to, '_blank', 'noopener,noreferrer')
      } else {
        updateAfterNavigate()
        navigate(to, { state: { canGoBack: true }, replace })
      }
    },
    [navigate, replace, to, updateAfterNavigate],
  )
}

function BasicButtonBase({
  children,
  disabled,
  style,
  ...rest
}: ButtonPropsNonLink & { href?: string }) {
  const [hover, setHover] = useState(false)
  const inPressOutside = useInPressOutside()

  return (
    <Pressable
      disabled={disabled}
      onPress={(event) => {
        event.preventDefault()
        if (disabled) return
        if (isPressOverriden() && !inPressOutside) return
        rest.onPress?.(event)
      }}
      style={{
        alignItems: 'stretch',
        flexDirection: 'column',
        justifyContent: 'center',
        display: 'flex',
      }}
      // @ts-expect-error
      href={rest.href}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
    >
      <TText
        style={[
          { borderColor: useColors().borders },
          style,
          hover && (!isPressOverriden() || inPressOutside)
            ? { textDecorationLine: 'underline' }
            : null,
        ]}
      >
        {children}
      </TText>
    </Pressable>
  )
}

function BasicButtonLink({ to, replace, ...rest }: ButtonPropsLink) {
  return (
    <BasicButtonBase
      onPress={useLinkOnPress(to, { replace })}
      href={to}
      {...rest}
    />
  )
}

export function BasicButton(props: ButtonProps) {
  if ('to' in props) return <BasicButtonLink {...props} />
  return <BasicButtonBase {...props} />
}
