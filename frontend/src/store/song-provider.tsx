import ForageCache from './forage-cache'
import React, {
  useReducer,
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from 'react'
import { downloadSong } from './azure'
import { parseSongFile } from './parse-song-file'
import { useSongList } from './list-provider'

type Unpack<T> = T extends Promise<infer R> ? R : never

const ctx = React.createContext(
  (key: string): ForageCache<Unpack<ReturnType<typeof downloadSong>>> => {
    throw new Error('SongProvider not found')
  },
)

export const SongProvider: React.FC<{}> = ({ children }) => {
  const map = useRef(
    new Map<string, ForageCache<{ lastModified: number; text: string }>>(),
  )

  const getCache = useCallback(
    (name: string) => {
      if (!map.current.has(name)) {
        map.current.set(
          name,
          new ForageCache('song:' + name, () => downloadSong(name)),
        )
      }
      return map.current.get(name)!
    },
    [map],
  )

  return <ctx.Provider value={getCache}>{children}</ctx.Provider>
}

const useForageCache = <T extends {}>(cache: ForageCache<T>) => {
  const [state, setValue] = useState(cache.getFromCache())

  const wishesReload = useRef(false)
  const reload = useRef(() => {
    wishesReload.current = true
  })

  useEffect(() => {
    reload.current = () => cache.load({ force: true })
    const cacheValue = cache.getFromCache()
    if (cacheValue !== null) {
      setValue(cacheValue)
    } else {
      cache.load({ force: wishesReload.current })
    }
    return cache.subscribe(t => setValue(t))
  }, [cache])

  return { value: state, reload: () => reload.current() }
}

export const useSong = (name: string, lastModified?: number) => {
  const getCache = useContext(ctx)
  const { value, ...rest } = useForageCache(getCache(name))
  useEffect(() => {
    if (lastModified && value && value.lastModified < lastModified) {
      rest.reload()
    }
  }, [value, lastModified])
  return { value: value ? parseSongFile(name, value.text) : null, ...rest }
}

export const suspendUntilInitialized = () => {
  const list = useSongList()
  const getCache = useContext(ctx)

  let uninitializedCaches = (list || [])
    .map(s => getCache(s.name))
    .filter(c => !c.initialized)

  if (uninitializedCaches.length > 0) {
    throw new Promise(resolve => {
      for (const cache of uninitializedCaches) {
        // eslint-disable-next-line no-loop-func
        const unsub = cache.subscribe(() => {
          if (cache.initialized) {
            unsub()
            uninitializedCaches = uninitializedCaches.filter(c => c !== cache)
            if (uninitializedCaches.length === 0) {
              resolve()
            }
          }
        })
      }
    })
  }
}
