import React from 'react'
import { BasicButton, ButtonProps } from './basic-button'

export function ListButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        {
          borderWidth: 1,
          borderColor: 'black',
          borderStyle: 'solid',
          backgroundColor: 'white',
          padding: 10,
          fontSize: 15,

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
