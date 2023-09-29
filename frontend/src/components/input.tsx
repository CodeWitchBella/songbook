/** @jsxImportSource @emotion/react */

import { TText, useBasicStyle, useColors } from './themed'

const Input = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => any
  type?: string
}) => {
  const colors = useColors()
  return (
    <label>
      <TText style={{ fontSize: 16 }}>{label}: </TText>
      <input
        type={type}
        value={value}
        css={{
          background: colors.inputBackground,
          color: colors.text,
          padding: '3px 7px',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colors.borders,
        }}
        onChange={(evt) => {
          evt.preventDefault()
          onChange(evt.target.value)
        }}
      />
    </label>
  )
}

export default Input

export function LargeInput({
  label,
  value,
  onChange,
  type = 'text',
  disabled,
  name,
}: {
  label: string
  value: string
  onChange: (v: string) => any
  type?: string
  disabled?: boolean
  name?: string
}) {
  return (
    <label css={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
      <TText style={{ fontSize: 16 }}>{label}</TText>
      <input
        css={[
          useBasicStyle(),
          {
            fontSize: 24,
            borderWidth: '1px',
            borderStyle: 'solid',
            padding: 10,
          },
        ]}
        type={type}
        value={value}
        onChange={(evt) => {
          evt.preventDefault()
          onChange(evt.target.value)
        }}
        disabled={disabled}
        name={name}
      />
    </label>
  )
}
