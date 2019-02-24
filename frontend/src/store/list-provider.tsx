import React, { useRef, useContext, useEffect, useState } from 'react'
import ForageCache from './forage-cache'
import { listSongs } from './azure'

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
