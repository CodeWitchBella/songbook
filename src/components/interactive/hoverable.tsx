import { isHoverEnabled } from './hover-state'
import React, { useState } from 'react'

export default function Hoverable({
  children,
  onHoverIn,
  onHoverOut,
}: {
  onHoverIn?: () => void
  onHoverOut?: () => void
  children: ((hovered: boolean) => JSX.Element) | JSX.Element
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [showHover, setShowHover] = useState(false)

  const _handleMouseEnter = () => {
    if (isHoverEnabled() && !isHovered) {
      onHoverIn?.()
      setIsHovered(true)
    }
  }

  const _handleMouseLeave = () => {
    if (isHovered) {
      onHoverOut?.()
      setIsHovered(false)
    }
  }

  const _handleGrant = () => setShowHover(false)

  const _handleRelease = () => setShowHover(true)

  const child =
    typeof children === 'function' ? children(showHover && isHovered) : children

  return React.cloneElement(React.Children.only(child), {
    onMouseEnter: _handleMouseEnter,
    onMouseLeave: _handleMouseLeave,
    // prevent hover showing while responder
    onResponderGrant: _handleGrant,
    onResponderRelease: _handleRelease,
    // if child is Touchable
    onPressIn: _handleGrant,
    onPressOut: _handleRelease,
  })
}
