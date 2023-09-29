import { useEffect, useMemo, useState } from 'react'

const key = 'continuous-mode-setting'

function deserialize(val: string | null): ContinuousModeSetting {
  if (isValidSetting(val)) return val
  return 'never' // this is the default, I'll change this eventually when any bugs are worked out
}

function isValidSetting(val: unknown): val is ContinuousModeSetting {
  return val === 'always' || val === 'never' || val === 'multipage'
}

function write(val: ContinuousModeSetting) {
  if (isValidSetting(val)) {
    localStorage.setItem(key, val)
  } else {
    localStorage.removeItem(key)
  }
}

export type ContinuousModeSetting = 'always' | 'never' | 'multipage'
export function useContinuousModeSetting() {
  const [setting, setSetting] = useState(() =>
    deserialize(localStorage.getItem(key)),
  )
  useEffect(() => {
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
    function listener(event: StorageEvent) {
      if (event.key === key) {
        const value = deserialize(event.newValue)
        setSetting(value)
      }
    }
  }, [])
  return useMemo(
    () =>
      [
        setting,
        (value: ContinuousModeSetting) => {
          setSetting(value)
          write(value)
        },
      ] as const,
    [setting],
  )
}
