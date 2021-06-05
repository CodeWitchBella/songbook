import React, {
  PropsWithChildren,
  useRef,
  useEffect,
  useState,
  useContext,
} from 'react'
import {
  StyleProp,
  TextStyle,
  GestureResponderEvent,
  Text,
  Pressable,
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

const clickOutsideContext = React.createContext(false)
let pressOverriden = 0
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
  const [hover, setHover] = useState(false)
  const inClickOutside = useContext(clickOutsideContext)

  return (
    <Pressable
      disabled={disabled}
      onPress={(event) => {
        if (disabled) return
        if (pressOverriden > 0 && !inClickOutside) return
        rest.onPress?.(event)
      }}
      // @ts-expect-error
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        alignItems: 'stretch',
        flexDirection: 'column',
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      <Text
        ref={text}
        style={[
          style,
          hover && (pressOverriden <= 0 || inClickOutside)
            ? { textDecorationLine: 'underline' }
            : null,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  )
}

export function BasicButton(props: ButtonProps) {
  if ('to' in props) return <BasicButtonLink {...props} />
  return <BasicButtonBase {...props} />
}

export function OnClickOutside({
  handler,
  children,
}: {
  handler?: null | (() => void)
  children: (ref: React.RefObject<HTMLDivElement>) => JSX.Element
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
    if (handler) {
      pressOverriden++
      return () => {
        setTimeout(() => {
          pressOverriden--
        }, 200)
      }
    }
    return undefined
  }, [handler])

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      if (handlerRef.current && !ref.current?.contains(event.target as any)) {
        event.preventDefault()
        handlerRef.current()
      }
    }
    const cfg = { capture: true, passive: false }
    document.body.addEventListener('mousedown', listener, cfg)
    document.body.addEventListener('touchstart', listener, cfg)
    return () => {
      document.body.removeEventListener('mousedown', listener)
      document.body.removeEventListener('touchstart', listener)
    }
  }, [])
  return (
    <clickOutsideContext.Provider value={true}>
      {children(ref)}
    </clickOutsideContext.Provider>
  )
}
