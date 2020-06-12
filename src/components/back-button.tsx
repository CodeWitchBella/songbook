/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core'
import { PropsWithChildren } from 'react'
import { useHistory, useLocation } from 'react-router'
import { BasicButton } from 'components/interactive/basic-button'
import { StyleProp, TextStyle } from 'react-native'
import { useUpdateAfterNavigate } from './service-worker-status'

export function BackButton({
  children,
  to = '/',
  style,
}: PropsWithChildren<{ to?: string; style?: StyleProp<TextStyle> }>) {
  const history = useHistory()
  const location = useLocation()
  const updateAfterNavigate = useUpdateAfterNavigate()
  return (
    <BasicButton
      style={[
        {
          color: 'darkblue',
          marginRight: '10px',
          textDecorationLine: 'underline',
        },
        style,
      ]}
      onPress={() => {
        const canGoBack = location.state && (location.state as any).canGoBack
        updateAfterNavigate()
        if (canGoBack) {
          history.go(typeof canGoBack === 'number' ? -canGoBack : -1)
        } else {
          const location = history.location
          history.replace(to)
          history.push(
            location.pathname + location.search + location.hash,
            location.state,
          )
          history.go(-1)
        }
      }}
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
