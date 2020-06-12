import React from 'react'
import { BasicButton, ButtonProps } from './basic-button'
export type { ButtonProps } from './basic-button'

export function PrimaryButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        {
          borderWidth: 2,
          borderColor: 'black',
          borderStyle: 'solid',
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 30,
          fontSize: 20,

          textAlign: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </BasicButton>
  )
}
