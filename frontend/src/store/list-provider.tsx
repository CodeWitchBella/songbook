import React, {
  useRef,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import ForageCache from './forage-cache'
import { listSongs, downloadSong } from './azure'
import { parseSongFile } from './parse-song-file'

type Unpack<T extends Promise<any>> = T extends Promise<infer V> ? V : never

const ctx = React.createContext(null as null | ForageCache<
  Unpack<ReturnType<typeof listSongs>>
>)

export const SongListProvider: React.FC<{}> = ({ children }) => {
  const ref = useRef(new ForageCache('songs', listSongs))
  return <ctx.Provider value={ref.current}>{children}</ctx.Provider>
}

export const useSongList = () => {
  const cache = useContext(ctx)
  if (!cache) throw new Error('Provider not found')

  const [value, setValue] = useState(cache.getFromCache())
  useEffect(() => {
    setValue(cache.getFromCache())
    cache.load().catch(e => {})
    return cache.subscribe(setValue)
  }, [cache, setValue])

  return value
}

const useForageCache = <T extends {}>(
  createCache: () => ForageCache<T>,
  dependencyList: React.DependencyList,
) => {
  const [value, setValue] = useState(null as null | T)

  const wishesReload = useRef(false)
  const reload = useRef(() => {
    wishesReload.current = true
  })

  useEffect(() => {
    const cache = createCache()
    reload.current = () => cache.load({ force: true })
    const cacheValue = cache.getFromCache()
    if (value !== null) {
      setValue(cacheValue)
    } else {
      cache.load({ force: wishesReload.current })
    }
    return cache.subscribe(t => setValue(t))
  }, dependencyList)

  return { value, reload: () => reload.current() }
}

export const useSong = (name: string) => {
  const { value, ...rest } = useForageCache(
    () => new ForageCache('song:' + name, () => downloadSong(name)),
    [name],
  )
  return { value: value ? parseSongFile(name, value) : null, ...rest }
}
