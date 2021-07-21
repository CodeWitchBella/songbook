import { createContext, useContext, useEffect, useRef } from 'react'

const clickOutsideContext = createContext(false)
let pressOverriden = 0

export function isPressOverriden() {
  return pressOverriden > 0
}

export function useInPressOutside() {
  return useContext(clickOutsideContext)
}

export function OnPressOutside({
  onPressOutside,
  children,
}: {
  onPressOutside: (() => void) | null
  children: (
    ref: React.RefObject<HTMLDivElement>,
  ) => null | JSX.Element | readonly JSX.Element[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const handlerRef = useRef(onPressOutside)
  useEffect(() => {
    handlerRef.current = onPressOutside
    if (onPressOutside) {
      pressOverriden++
      return () => {
        setTimeout(() => {
          pressOverriden--
        }, 200)
      }
    }
    return undefined
  }, [onPressOutside])

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
