import { TText } from './themed'

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
    <TText style={{ fontSize: 16 }}>{label}: </TText>
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
