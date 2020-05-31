/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core'
import { PropsWithChildren } from 'react'
import { useHistory, useLocation } from 'react-router'

export function BackButton({
  children,
  to = '/',
  className,
}: PropsWithChildren<{ to?: string; className?: string }>) {
  const history = useHistory()
  const location = useLocation()
  return (
    <button
      css={{
        all: 'unset',
        display: 'inline-block',
        color: 'darkblue',
        marginRight: '10px',
        textDecoration: 'underline',
        ':hover': {
          fontWeight: 'bold',
          textDecoration: 'none',
        },
        fontSize: 25,
        cursor: 'pointer',
      }}
      className={className}
      type="button"
      onClick={() => {
        if (location.state && (location.state as any).canGoBack)
          history.goBack()
        else history.push(to)
      }}
    >
      {children}
    </button>
  )
}

const float = keyframes`
	0% {
		transform: translatey(0px);
	}
	50% {
		transform: translatey(-2px);
	}
	100% {
		transform: translatey(0px);
  }
`

export function BackArrow() {
  return (
    <svg
      viewBox="0 0 5.443 4.692"
      height="13"
      css={{
        transform: 'translatey(0px)',
        ':hover': {
          animationName: float,
          animationDuration: '3s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        },
      }}
    >
      <g fill="none" stroke="#000" stroke-width=".7" stroke-linecap="round">
        <path d="M.907 2.346h4.236" />
        <path d="M2.276.3L.3 2.346l1.976 2.046" stroke-linejoin="round" />
      </g>
    </svg>
  )
}
