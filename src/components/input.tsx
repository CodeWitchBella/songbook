/** @jsxImportSource @emotion/react */

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

export const LargeInput = ({
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
}) => (
  <label css={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
    <div>{label}</div>
    <input
      css={{ fontSize: 24, border: '1px solid', padding: 10 }}
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
