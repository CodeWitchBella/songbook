/** @jsx jsx */
import { jsx } from '@emotion/core'
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

export const LargeInput = ({
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
  <label css={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
    <div>{label}</div>
    <input
      css={{ fontSize: 24, border: '2px solid', padding: 10 }}
      type={type}
      value={value}
      onChange={evt => {
        evt.preventDefault()
        onChange(evt.target.value)
      }}
    />
  </label>
)
