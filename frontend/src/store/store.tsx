import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
} from 'react'
import localForage from 'localforage'
import { listSongs, downloadSongsByIds, listSongsInitial } from './graphql'
import useForceUpdate from 'components/use-force-update'
import { DateTime } from 'luxon'
import { PickExcept } from '@codewitchbella/ts-utils'
import { newSong } from './fetchers'

type LongData<DT = DateTime> = {
  lastModified: DT
  text: string
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  spotify: string | null
}

type ShortData<DT = DateTime> = {
  lastModified: DT
  author: string
  title: string
}

type SongBase<DT = DateTime> = {
  id: string
  lastModified: DT
  slug: string
}

type SongWithoutData = SongBase & { loading: boolean; reload: () => void }
export type Song = SongWithoutData & {
  longData: LongData | null
  shortData: ShortData | null
}
export type SongWithShortData = SongWithoutData & {
  shortData: ShortData
  longData: LongData | null
}
export function hasShortData(song: Song): song is SongWithShortData {
  return !!song.shortData
}
export type SongWithData = SongWithoutData & {
  longData: LongData
  shortData: ShortData
}
export type SongWithDataNoReload = SongBase & {
  longData: LongData
  shortData: ShortData
}

type SongStore = {
  list: (SongBase<string> & {
    longData: LongData<string> | null
    shortData: ShortData<string> | null
  })[]
}

const localForageKey = 'store2'

function d<T>(v: T | null | undefined, f: T): T {
  return v === null || v === undefined ? f : v
}

export function longDataDefaults(meta: {
  fontSize: number | null
  paragraphSpace: number | null
  titleSpace: number | null
  spotify: string | null
  text: string
}) {
  return {
    fontSize: d<number>(meta.fontSize, 1),
    paragraphSpace: d<number>(meta.paragraphSpace, 1),
    titleSpace: d<number>(meta.titleSpace, 1),
    spotify: meta.spotify,
    text: meta.text,
  }
}

class Store {
  private songMapSlug = new Map<string, Song>()
  private songMapId = new Map<string, Song>()
  private _setSong(
    song: {
      lastModified: DateTime
      id: string
      slug: string
      shortData?: PickExcept<ShortData, 'lastModified'> & {
        lastModified?: DateTime
      }
      longData?: PickExcept<LongData, 'lastModified'> & {
        lastModified?: DateTime
      }
    },
    {
      save = true,
      ...args
    }: { save?: boolean } & (
      | { onChange: false; reason?: string }
      | { onChange: true; reason: string }),
  ) {
    const prev = this.songMapId.get(song.id)
    const v = {
      lastModified: song.lastModified,
      slug: song.slug,
      id: song.id,
      shortData: song.shortData
        ? {
            ...song.shortData,
            lastModified: song.shortData.lastModified || song.lastModified,
          }
        : prev
        ? prev.shortData
        : null,
      longData: song.longData
        ? {
            ...longDataDefaults(song.longData),
            lastModified: song.longData.lastModified || song.lastModified,
          }
        : prev
        ? prev.longData
        : null,
      loading: false,
      reload: () => this.downloadSongsByIds([song.id]),
    }
    this.songMapSlug.set(song.slug, v)
    this.songMapId.set(song.id, v)

    if (args.onChange) this._triggerOnChange(args.reason)
    if (save) this._cacheSongMap()
  }
  private _rmSong(id: string) {
    const song = this.songMapId.get(id)
    if (song) {
      this.songMapId.delete(song.id)
      this.songMapSlug.delete(song.slug)
    }
  }

  caching = false
  recache = false
  // saves song map to local forage
  private _cacheSongMap() {
    if (this.caching) {
      this.recache = true
      return
    }

    this.caching = true
    this.recache = false
    new Promise(resolve => setTimeout(resolve, 1000))
      .then(() =>
        localForage.setItem<SongStore>(localForageKey, {
          list: Array.from(this.songMapId.values()).map(song => ({
            id: song.id,
            slug: song.slug,
            shortData: song.shortData
              ? {
                  ...song.shortData,
                  lastModified: song.shortData.lastModified.toISO(),
                }
              : null,
            lastModified: song.lastModified.toISO(),
            longData: song.longData
              ? {
                  ...song.longData,
                  lastModified: song.longData.lastModified.toISO(),
                }
              : null,
          })),
        }),
      )
      .catch(e => console.error(e))
      .then(() => {
        this.caching = false
        if (this.recache) return this._cacheSongMap()
      })
  }

  private initializing = false
  private _initializingEnd() {
    this.initializing = false
    this._triggerOnChange('init end')
  }
  isInitializing() {
    return this.initializing
  }
  init() {
    localForage
      .getItem<SongStore>(localForageKey)
      .then(cache => {
        if (cache) {
          for (const song of cache.list) {
            // do not save because we just loaded it
            this._setSong(
              {
                ...song,
                lastModified: DateTime.fromISO(song.lastModified),
                longData: song.longData
                  ? {
                      ...song.longData,
                      lastModified: DateTime.fromISO(
                        song.longData.lastModified,
                      ),
                    }
                  : undefined,
                shortData: song.shortData
                  ? {
                      ...song.shortData,
                      lastModified: DateTime.fromISO(
                        song.shortData.lastModified,
                      ),
                    }
                  : undefined,
              },
              { onChange: false, save: false },
            )
          }
        }
        this.initializing = true
        this._triggerOnChange('Init start')
        if (cache) return listSongs()
        return listSongsInitial()
      })
      .then(newSongs => {
        let changed = false
        for (const id of this.songMapId.keys()) {
          if (!newSongs.some(s => s.id === id)) {
            changed = true
            this._rmSong(id)
          }
        }

        for (const song of newSongs) {
          const existing = this.songMapId.get(song.id)
          if (!existing || !song.lastModified.equals(existing.lastModified)) {
            changed = true
            this._setSong(song, {
              reason: 'new song',
              onChange: false,
              save: false,
            })
          }
        }
        if (changed) {
          this._triggerOnChange('new songs')
          this._cacheSongMap()
        }
      })
      .then(() => this._update())
      .then(() => this._initializingEnd())
      .catch(e => {
        this._initializingEnd()
        console.error(e)
      })
  }

  /*
  // triggers song loading
  private _downloadSongsBySlugs(slugs: string[]) {
    const toLoad = slugs.filter(slug => {
      const origSong = this.songMapSlug.get(slug)
      if (!origSong || origSong.loading) return false
      origSong.loading = true
      return true
    })

    if (toLoad.length > 0)
      downloadSongsBySlugs(toLoad)
        .then(songs => {
          for (const song of songs) {
            this._setSong(
              { ...song, longData: longDataDefaults(song.longData) },
              {
                onChange: true,
                reason: 'song downloaded',
              },
            )
          }
          this._cacheSongMap()
        })
        .catch(e => console.error(e))
  }
  */

  // triggers song loading
  downloadSongsByIds(ids: string[]) {
    const toLoad = ids.filter(id => {
      const origSong = this.songMapId.get(id)
      if (!origSong || origSong.loading) return false
      origSong.loading = true
      return true
    })

    if (toLoad.length > 0)
      return downloadSongsByIds(toLoad)
        .then(songs => {
          for (const song of songs) {
            this._setSong(
              { ...song, longData: longDataDefaults(song.longData) },
              {
                onChange: true,
                reason: 'song downloaded',
              },
            )
          }
          this._cacheSongMap()
        })
        .catch(e => {
          console.error(e)
        })
    else return Promise.resolve()
  }

  // only updates songs it knows should be updated
  private _update() {
    const songs = Array.from(this.songMapId.values())
    const songsToDownload = songs.filter(
      song =>
        !song.longData ||
        !song.shortData ||
        song.longData.lastModified < song.lastModified ||
        song.shortData.lastModified < song.lastModified,
    )

    // download/update songs
    return this.downloadSongsByIds(songsToDownload.map(s => s.id))
  }

  private _updateCounter = 0
  get updateCounter() {
    return this._updateCounter
  }
  private _triggerOnChange(reason: string) {
    setImmediate(() => {
      this._updateCounter += 1
      this.handlers.forEach(h => {
        if (this.handlers.includes(h)) h(reason)
      })
    })
  }

  listSongs() {
    return Array.from(this.songMapId.values())
  }

  getSongBySlug(slug: string) {
    return this.songMapSlug.get(slug)
  }

  getSongById(id: string) {
    return this.songMapId.get(id)
  }

  handlers: ((reason: string) => void)[] = []
  onChange(handler: (reason: string) => void) {
    const v = (r: string) => handler(r)
    this.handlers.push(v)
    return () => {
      this.handlers = this.handlers.filter(h => h !== v)
    }
  }
}

const context = React.createContext(null as null | Store)

export function StoreProvider({ children }: PropsWithChildren<{}>) {
  const store = useMemo(() => new Store(), [])
  useEffect(() => {
    store.init()
  }, [store])
  useEffect(() => {
    localForage.keys().then(keys =>
      keys.forEach(key => {
        if (key !== localForageKey) localForage.removeItem(key)
      }),
    )
  }, [])
  return <context.Provider value={store}>{children}</context.Provider>
}

function useStore() {
  const store = useContext(context)
  if (!store) throw new Error('No StoreProvider')
  return store
}

export function useSongList() {
  const store = useStore()
  const initialUpdateCounter = useMemo(() => store.updateCounter, [store])
  const [songs, setSongs] = useState(() => store.listSongs())
  const [initing, setIniting] = useState(store.isInitializing())
  useEffect(() => {
    if (initing !== store.isInitializing()) {
      setIniting(store.isInitializing())
    }
    if (initialUpdateCounter !== store.updateCounter) {
      setSongs(store.listSongs())
    }
    return store.onChange(reason => {
      setSongs(store.listSongs())
      setIniting(store.isInitializing())
    })
  }, [initialUpdateCounter, initing, store])
  return useMemo(() => ({ songs, initing }), [songs, initing])
}

export function useSong(param: { slug: string } | { id: string }) {
  const store = useStore()
  const forceUpdate = useForceUpdate()
  const song =
    'slug' in param
      ? store.getSongBySlug(param.slug)
      : store.getSongById(param.id)

  useEffect(() => {
    if (
      song !==
      ('slug' in param
        ? store.getSongBySlug(param.slug)
        : store.getSongById(param.id))
    )
      forceUpdate()
    return store.onChange(forceUpdate)
  }, [forceUpdate, param, song, store])
  return useMemo(() => ({ song, initing: store.isInitializing() }), [
    song,
    store,
  ])
}

export function useNewSong() {
  const store = useStore()
  return async ({ author, title }: { author: string; title: string }) => {
    const ret = await newSong({ author, title })
    await store.downloadSongsByIds([ret.id])
    return ret
  }
}
