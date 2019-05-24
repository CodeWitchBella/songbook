import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
} from 'react'
import localForage from 'localforage'
import { newSong } from './fetchers'
import { createSongStore } from './store-song'
import { User } from './graphql'

const settingsStorage = localForage.createInstance({ name: 'settings' })

const context = React.createContext(null as null | {
  store: ReturnType<typeof createSongStore>
  viewer: User | null
  setViewer: (v: User | null) => void
  initing: boolean
  loading: boolean
})

function useCachedState<T>(key: string, initial: T | null) {
  const st = useState<T | null>(initial)
  const [v, setV] = st
  useEffect(() => {
    settingsStorage.getItem<T>(key).then(itm => setV(itm))
  }, [key, setV])
  useEffect(() => {
    settingsStorage.setItem<T | null>(key, v)
  }, [key, v])
  return st
}

export function StoreProvider({ children }: PropsWithChildren<{}>) {
  const [initing, setIniting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useCachedState<User>('viewer', null)
  const store = useMemo(
    () => createSongStore({ setIniting, setLoading, setViewer }),
    [setViewer],
  )

  // clear legacy song saving mechanism
  useEffect(() => {
    localForage.keys().then(keys =>
      keys.forEach(key => {
        localForage.removeItem(key)
      }),
    )
  }, [])
  return (
    <context.Provider
      value={useMemo(
        () => ({
          store,
          viewer,
          setViewer,
          initing,
          loading,
        }),
        [store, viewer, setViewer, initing, loading],
      )}
    >
      {children}
    </context.Provider>
  )
}

function useStoreContext() {
  const store = useContext(context)
  if (!store) throw new Error('No StoreProvider')
  return store
}

export function useSongList() {
  const { store, initing, loading } = useStoreContext()
  const [songs, setSongs] = useState(() => store.readAll())
  useEffect(() => {
    setSongs(store.readAll())
    return store.onChange(() => {
      setSongs(store.readAll())
    })
  }, [initing, store])
  return useMemo(
    () => ({
      songs,
      initing,
      loading,
      getSongById: (id: string) => {
        const song = store.readById(id)
        return song ? song.item : null
      },
    }),
    [songs, initing, loading, store],
  )
}

function getSongFromStore(
  store: ReturnType<typeof useStoreContext>['store'],
  param: { slug: string } | { id: string },
) {
  return 'slug' in param
    ? store.readBySlug(param.slug)
    : store.readById(param.id)
}

export function useSong(param: { slug: string } | { id: string }) {
  const { store, initing } = useStoreContext()
  const [song, setSong] = useState(() => getSongFromStore(store, param))

  useEffect(() => {
    setSong(getSongFromStore(store, param))
    return store.onChange(() => {
      setSong(getSongFromStore(store, param))
    })
  }, [param, song, store])
  return useMemo(
    () => ({ song: song ? song.item : null, initing, methods: song }),
    [initing, song],
  )
}

export function useNewSong() {
  const { store } = useStoreContext()
  return async ({ author, title }: { author: string; title: string }) => {
    const ret = await newSong({ author, title })
    await store.refresh()
    return ret
  }
}

export function useViewer() {
  const { viewer, setViewer } = useStoreContext()
  return [viewer, setViewer] as const
}
