import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react'
import localForage from 'localforage'
import { newSong } from './fetchers'
import { createSongStore } from './store-song'
import { User } from './graphql'
import { createCollectionStore } from './store-collections'
import { GenericStore, MinItem } from './generic-store'
import Random from './mersenne-twister-19937'
import { DateTime } from 'luxon'

const settingsStorage = localForage.createInstance({ name: 'settings' })

const context = React.createContext(
  null as null | {
    store: ReturnType<typeof createSongStore>
    collections: ReturnType<typeof createCollectionStore>
    viewer: User | null
    setViewer: (v: User | null) => void
    initing: boolean
    loading: boolean
  },
)

function useCachedState<T>(key: string, initial: T | null) {
  const st = useState<T | null>(initial)
  const [v, setV] = st
  useEffect(() => {
    settingsStorage.getItem<T>(key).then((itm) => setV(itm))
  }, [key, setV])
  useEffect(() => {
    settingsStorage.setItem<T | null>(key, v)
  }, [key, v])
  return st
}

function useStable<T>(gen: () => T) {
  const ref = useRef<T | null>(null)
  if (ref.current === null) {
    ref.current = gen()
  }
  return ref.current!
}

export function StoreProvider({ children }: PropsWithChildren<{}>) {
  const [initing, setIniting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useCachedState<User>('viewer', null)
  const store = useStable(() =>
    createSongStore({ setIniting, setLoading, setViewer }),
  )

  const collections = useStable(() => createCollectionStore())

  // clear legacy song saving mechanism
  useEffect(() => {
    localForage.keys().then((keys) =>
      keys.forEach((key) => {
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
          collections,
        }),
        [store, viewer, setViewer, initing, loading, collections],
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

export function useGetRandomSong() {
  const { store } = useStoreContext()
  return useCallback(
    (currentSongId: string) => {
      const nowReal = DateTime.utc()
      const now = nowReal.get('hour') < 3 ? nowReal.minus({ day: 1 }) : nowReal
      const random = new Random(
        now.get('day') + 100 * (now.get('month') + 100 * now.get('year')),
      )
      const songs = store.readAll()
      const withRandom = songs.map((song) => ({
        song,
        number: random.random(),
      }))
      const curRandom = withRandom.find((s) => s.song.item.id === currentSongId)
      if (!curRandom) return songs[Math.floor(Math.random() * songs.length)]
      const next = withRandom.reduce((cur, t) => {
        if (t.number < curRandom.number) return cur
        if (t.song.item.id === currentSongId) return cur
        if (!cur) return t
        return cur.number < t.number ? cur : t
      }, null as null | typeof withRandom[0])
      if (next) return next.song
      return withRandom.reduce(
        (a, b) => (a === null ? b : a.number < b.number ? a : b),
        null as null | typeof withRandom[0],
      )!.song
    },
    [store],
  )
}

function useGenericStore<S extends MinItem, T>(store: GenericStore<S, T>) {
  const [list, setList] = useState(() => store.readAll())
  useEffect(() => {
    setList(store.readAll())
    return store.onChange(() => {
      setList(store.readAll())
    })
  }, [store])
  return useMemo(
    () => ({
      list,
      getById: (id: string) => {
        const song = store.readById(id)
        return song ? song.item : null
      },
      refresh: () => store.refresh(),
    }),
    [list, store],
  )
}

export function useCollectionList() {
  return useGenericStore(useStoreContext().collections)
}

export function useCollection({ slug }: { slug: string }) {
  const { collections: store } = useStoreContext()
  const [value, setValue] = useState(() => store.readBySlug(slug))
  useEffect(() => {
    setValue(store.readBySlug(slug))
    return store.onChange(() => {
      setValue(store.readBySlug(slug))
    })
  }, [slug, store])
  return useMemo(
    () => ({
      collection: value ? value.item : null,
      methods: value,
    }),
    [value],
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

function readNumPages(
  store: ReturnType<typeof useStoreContext>['store'],
  set: Set<string> | null,
) {
  if (!set) return null
  let num = 0
  for (const item of set) {
    num +=
      store.readById(item)?.item.text.split('--- page break ---').length ?? 0
  }
  return num
}

export function usePagesNum(set: Set<string> | null) {
  const { store } = useStoreContext()
  const [count, setCount] = useState(() => readNumPages(store, set))

  useEffect(() => {
    setCount(readNumPages(store, set))
    return store.onChange(() => {
      setCount(readNumPages(store, set))
    })
  }, [set, store])
  return count
}

export function useNewSong() {
  const { store } = useStoreContext()
  return async ({
    author,
    title,
    text,
    extraNonSearchable,
  }: {
    author: string
    title: string
    text?: string
    extraNonSearchable?: string
  }) => {
    const ret = await newSong({ author, title, text, extraNonSearchable })
    await store.refresh()
    return ret
  }
}

export function useViewer() {
  const { viewer, setViewer } = useStoreContext()
  return [viewer, setViewer] as const
}
