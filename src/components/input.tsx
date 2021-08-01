/** @jsxImportSource @emotion/react */

import { TText, useDarkMode } from './themed'

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
}) => (
  <label>
    {label}:{' '}
    <input
      type={type}
      value={value}
      css={{
        background: '#eee',
        color: 'black',
        padding: '3px 7px',
      }}
      onChange={(evt) => {
        evt.preventDefault()
        onChange(evt.target.value)
      }}
    />
  </label>
)

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
  const dark = useDarkMode()
  return (
    <label css={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
      <TText style={{ fontSize: 16 }}>{label}</TText>
      <input
        css={{
          fontSize: 24,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'currentColor',
          color: dark ? 'white' : 'black',
          background: dark ? 'black' : 'white',

          padding: 10,
        }}
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
