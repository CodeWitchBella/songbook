import React from 'react'

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => any
}) => (
  <label>
    {label}:{' '}
    <input
      value={value}
      onChange={evt => {
        evt.preventDefault()
        onChange(evt.target.value)
      }}
    />
  </label>
)

export default Input
