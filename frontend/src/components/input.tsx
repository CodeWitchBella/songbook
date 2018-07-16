import React from 'react'

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
      onChange={evt => {
        evt.preventDefault()
        onChange(evt.target.value)
      }}
    />
  </label>
)

export default Input
