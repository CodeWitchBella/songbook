import { useDarkMode } from 'utils/utils'

export function useBasicStyle() {
  const dark = useDarkMode()
  return {
    borderColor: dark ? 'white' : 'black',
    backgroundColor: dark ? 'black' : 'white',
    color: dark ? 'white' : 'black',
  }
}
