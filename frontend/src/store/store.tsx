import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
} from 'react'
import localForage from 'localforage'
import { listSongs, downloadSongs } from './graphql'
import useForceUpdate from 'components/use-force-update'
import { DateTime } from 'luxon'
import { PickExcept } from '@codewitchbella/ts-utils'

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
  slug: string
  author: string
  title: string
}

type SongBase<DT = DateTime> = {
  id: string
  lastModified: DT
  shortData: ShortData<DT>
}

type SongWithoutData = SongBase & { loading: boolean; reload: () => void }
export type Song = SongWithoutData & { longData: LongData | null }
export type SongWithData = SongWithoutData & { longData: LongData }
export type SongWithDataNoReload = SongBase & { longData: LongData }

type SongStore = {
  list: (SongBase<string> & { longData: LongData<string> | null })[]
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
  private songMap = new Map<string, Song>()
  private _setSong(
    song: {
      lastModified: DateTime
      shortData: PickExcept<ShortData, 'lastModified'> & {
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
    const slug = song.shortData.slug
    const prev = this.songMap.get(slug)
    this.songMap.set(slug, {
      lastModified: song.lastModified,
      shortData: {
        ...song.shortData,
        lastModified: song.shortData.lastModified || song.lastModified,
      },
      longData: song.longData
        ? {
            ...longDataDefaults(song.longData),
            lastModified: song.longData.lastModified || song.lastModified,
          }
        : prev
        ? prev.longData
        : null,
      id: slug,
      loading: false,
      reload: () => this._downloadSongs([song.shortData.slug]),
    })

    if (args.onChange) this._triggerOnChange(args.reason)
    if (save) this._cacheSongMap()
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
          list: Array.from(this.songMap.values()).map(song => ({
            id: song.id,
            shortData: {
              ...song.shortData,
              lastModified: song.shortData.lastModified.toISO(),
            },
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

  loading = true
  init() {
    localForage.removeItem('store')

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
                shortData: {
                  ...song.shortData,
                  lastModified: DateTime.fromISO(song.shortData.lastModified),
                },
              },
              { onChange: false, save: false },
            )
          }
          this._triggerOnChange('init loaded from cache')
        }

        return listSongs()
      })
      .then(newSongs => {
        for (const song of newSongs) {
          const existing = this.songMap.get(song.id)
          if (!existing || !song.lastModified.equals(existing.lastModified))
            this._setSong(song, { reason: 'new song', onChange: true })
        }
      })
      .then(() => {
        this._update()
      })
      .catch(e => {
        console.error(e)
      })
  }

  // triggers song loading
  private _downloadSongs(slugs: string[]) {
    const toLoad = slugs.filter(slug => {
      const origSong = this.songMap.get(slug)
      if (!origSong || origSong.loading) return false
      origSong.loading = true
      return true
    })

    if (toLoad.length > 0)
      downloadSongs(toLoad)
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

  // only updates songs it knows should be updated
  private _update() {
    const songs = Array.from(this.songMap.values())
    const songsWithoutLongData = songs.filter(song => !song.longData)
    const songsToUpdate = songs.filter(
      song => song.longData && song.longData.lastModified < song.lastModified,
    )
    // this is here to first download new songs
    const songsToDownload = songsWithoutLongData.concat(songsToUpdate)

    // download/update songs
    this._downloadSongs(songsToDownload.map(s => s.shortData.slug))
  }

  private _updateCounter = 0
  get updateCounter() {
    return this._updateCounter
  }
  private _triggerOnChange(reason: string) {
    setImmediate(() => {
      this._updateCounter += 1
      this.handlers.forEach(h => h(reason))
    })
  }

  listSongs() {
    return Array.from(this.songMap.values())
  }

  getSong(slug: string) {
    return this.songMap.get(slug)
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
  useEffect(() => {
    if (initialUpdateCounter !== store.updateCounter) {
      console.log(
        'Updating useSongList. Reason: update between initial and useEffect',
      )
      setSongs(store.listSongs())
    }
    return store.onChange(reason => {
      console.log('Updating useSongList. Reason:', reason)
      setSongs(store.listSongs())
    })
  }, [initialUpdateCounter, store])
  return songs
}

export function useSong(slug: string) {
  const store = useStore()
  const forceUpdate = useForceUpdate()
  const song = store.getSong(slug)

  useEffect(() => {
    if (song !== store.getSong(slug)) forceUpdate()
    return store.onChange(forceUpdate)
  }, [forceUpdate, slug, song, store])
  return song
}
