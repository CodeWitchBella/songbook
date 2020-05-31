/** @jsx jsx */
import { jsx } from '@emotion/core'
import { PropsWithChildren } from 'react'
import { useHistory, useLocation } from 'react-router'

export function BackButton({ children }: PropsWithChildren<{}>) {
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
      }}
      type="button"
      onClick={() => {
        if (location.state && (location.state as any).canGoBack)
          history.goBack()
        else history.push('/')
      }}
    >
      {children}
    </button>
  )
}
