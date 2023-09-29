import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from 'utils/utils'

const key = 'dark-mode-setting'

function deserialize(val: string | null): DarkModeSetting {
  if (val === 'light' || val === 'dark') return val
  return 'automatic'
}

function write(val: DarkModeSetting) {
  if (val === 'light' || val === 'dark') localStorage.setItem(key, val)
  else localStorage.removeItem(key)
}

function apply(value: DarkModeSetting) {
  document.documentElement.classList.remove('dark', 'light', 'automatic')
  document.documentElement.classList.add(value)
}

type DarkModeSetting = 'automatic' | 'light' | 'dark'
const darkModeContext = createContext<{
  value: boolean
  setting: DarkModeSetting
  setSetting: (v: DarkModeSetting) => void
}>({ value: false, setting: 'light', setSetting: () => {} })
export function DarkModeProvider({
  children,
}: {
  children: JSX.Element | readonly JSX.Element[]
}) {
  const [setting, setSetting] = useState(() =>
    deserialize(localStorage.getItem(key)),
  )
  const value = useMediaQuery('(prefers-color-scheme: dark)')
  useEffect(() => {
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
    function listener(event: StorageEvent) {
      if (event.key === key) {
        const value = deserialize(event.newValue)
        setSetting(value)
        apply(value)
      }
    }
  }, [])
  return (
    <darkModeContext.Provider
      value={useMemo(
        () => ({
          value: setting === 'automatic' ? value : setting === 'dark',
          setting,
          setSetting: (value) => {
            setSetting(value)
            apply(value)
            write(value)
          },
        }),
        [setting, value],
      )}
    >
      {children}
    </darkModeContext.Provider>
  )
}
export function useDarkModeSetting() {
  return useContext(darkModeContext)
}
