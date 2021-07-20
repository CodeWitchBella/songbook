import { useBasicStyle } from '../use-basic-style'
import { BasicButton, ButtonProps } from './basic-button'
export type { ButtonProps } from './basic-button'

export function PrimaryButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        useBasicStyle(),
        {
          borderWidth: 2,
          borderStyle: 'solid',
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
