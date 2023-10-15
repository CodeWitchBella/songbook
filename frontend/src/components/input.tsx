import { TText } from './themed'

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => any
  type?: string
}) {
  return (
    <label>
      <TText style={{ fontSize: 16 }}>{label}: </TText>
      <input
        type={type}
        value={value}
        className="border border-current bg-transparent px-2 py-0.5"
        onChange={(evt) => {
          evt.preventDefault()
          onChange(evt.target.value)
        }}
      />
    </label>
  )
}

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
    <label className="flex flex-col gap-1">
      <div>{label}</div>
      <input
        className="border border-current bg-transparent px-3 py-2 text-2xl"
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
