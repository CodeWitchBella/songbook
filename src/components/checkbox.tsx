import React from 'react'

const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => any
}) => (
  <label>
    {label}:{' '}
    <input
      type="checkbox"
      checked={checked}
      onChange={(evt) => {
        onChange(evt.target.checked)
      }}
    />
  </label>
)

export default Checkbox
