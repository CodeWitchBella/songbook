import React, { useEffect } from 'react'
import { Global, css } from '@emotion/core'

export default function OutlineHandler() {
  useEffect(() => {
    const handleFirstTab = (e: any) => {
      if (e.keyCode === 9) {
        document.body.classList.add('keyboard')
        window.removeEventListener('keydown', handleFirstTab)
      }
    }
    window.addEventListener('keydown', handleFirstTab)
    return () => {
      document.body.classList.remove('keyboard')
      window.removeEventListener('keydown', handleFirstTab)
    }
  })

  return (
    <Global
      styles={css`
        /* a subtle focus style for keyboard-input elements */
        *:focus {
          outline: 1px solid #aaa;
        }

        /* no focus style for non-keyboard-inputs elements */
        button:focus,
        select:focus {
          outline: none;
        }

        /* and for keyboard users, override everything with
           a Big Blue Border when focused on any element */
        body.keyboard *:focus {
          outline: 2px solid #7aacfe !important; /* for non-webkit browsers */
          outline: 5px auto -webkit-focus-ring-color !important;
        }
      `}
    />
  )
}
