/** @jsxImportSource @emotion/react */
import { keyframes } from '@emotion/react'
import { BasicButton } from 'components/interactive/basic-button'
import type { PropsWithChildren } from 'react'
import type { TextStyle } from 'react-native'
import { useLocation, useNavigate } from 'react-router'

import { useUpdateAfterNavigate } from './service-worker-status'
import type { TStyleProp } from './themed'

export function useGoBack(to = '/') {
  const navigate = useNavigate()
  const location = useLocation()
  const updateAfterNavigate = useUpdateAfterNavigate()
  return () => {
    const canGoBack = location.state && (location.state as any).canGoBack
    updateAfterNavigate()
    if (canGoBack) {
      navigate(typeof canGoBack === 'number' ? -canGoBack : -1)
    } else {
      navigate(to, { replace: true })
      navigate(location.pathname + location.search + location.hash, {
        state: location.state,
      })
      navigate(-1)
    }
  }
}

export function BackButton({
  children,
  to = '/',
  style,
}: PropsWithChildren<{ to?: string; style?: TStyleProp<TextStyle> }>) {
  return (
    <BasicButton
      style={[
        {
          marginRight: '10px',
          textDecorationLine: 'underline',
        },
        style,
      ]}
      onPress={useGoBack(to)}
    >
      {children}
    </BasicButton>
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

export function BackArrow({ height }: { height?: number | string }) {
  return (
    <svg
      viewBox="0 0 5.443 4.692"
      height={height ?? '13'}
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
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth=".7"
        strokeLinecap="round"
      >
        <path d="M.907 2.346h4.236" />
        <path d="M2.276.3L.3 2.346l1.976 2.046" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
