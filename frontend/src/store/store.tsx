import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react'
import localForage from 'localforage'
import { listSongs, downloadSong } from './azure'
import { parseSongFile, ParsedSong } from './parse-song-file'
import useForceUpdate from 'components/use-force-update'
import { PickExcept } from '@codewitchbella/ts-utils'

type SongData = {
  lastModified: number
  metadata: ReturnType<typeof metadataDefaults>
} & PickExcept<ParsedSong, 'metadata'>

type SongBase = {
  id: string
  lastModified: number
}

type SongWithoutData = SongBase & { loading: boolean; reload: () => void }
export type Song = SongWithoutData & { data: SongData | null }
export type SongWithData = SongWithoutData & { data: SongData }

type SongStore = { list: (SongBase & { data: SongData | null })[] }

const localForageKey = 'store'

function d<T>(v: T | null, f: T): T {
  return v === null ? f : v
}

export function metadataDefaults(meta: {
  fontSize: number | null
  paragraphSpace: number | null
  titleSpace: number | null
  spotify: string | null
}) {
  return {
    fontSize: d(meta.fontSize, 1),
    paragraphSpace: d(meta.paragraphSpace, 1),
    titleSpace: d(meta.titleSpace, 1),
    spotify: meta.spotify,
  }
}

function dataSetDefaultMetadata<T extends { metadata: any }>(data: T | null) {
  if (data === null) return null
  return {
    ...data,
    metadata: metadataDefaults(data.metadata),
  }
}

class Store {
  private songMap = new Map<string, Song>()
  private _setSong(
    id: string,
    song: {
      lastModified: number
      data?: SongData
    },
    {
      save = true,
      ...args
    }: { save?: boolean } & (
      | { onChange: false; reason?: string }
      | { onChange: true; reason: string }),
  ) {
    const prev = this.songMap.get(id)
    this.songMap.set(id, {
      lastModified: song.lastModified,
      data: dataSetDefaultMetadata(
        song.data || (prev ? prev.data : undefined) || null,
      ),
      id,
      loading: false,
      reload: () => this._downloadSong(id),
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
            lastModified: song.lastModified,
            data: song.data,
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
    localForage
      .getItem<SongStore>(localForageKey)
      .then(cache => {
        if (cache) {
          for (const song of cache.list) {
            // do not save because we just loaded it
            this._setSong(song.id, song, { onChange: false, save: false })
          }
          this._triggerOnChange('init loaded from cache')
        }

        return listSongs()
      })
      .then(newSongs => {
        for (const song of newSongs) {
          const existing = this.songMap.get(song.id)
          if (!existing || song.lastModified !== existing.lastModified)
            this._setSong(song.id, song, { reason: 'new song', onChange: true })
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
  private _downloadSong(id: string) {
    const origSong = this.songMap.get(id)
    if (!origSong || origSong.loading) return
    origSong.loading = true

    downloadSong(origSong.id)
      .then(song => ({
        lastModified: song.lastModified,
        data: parseSongFile(origSong.id, song.text),
      }))
      .then(song => {
        this._setSong(
          origSong.id,
          {
            data: {
              ...song.data,
              lastModified: song.lastModified,
            },
            lastModified: song.lastModified,
          },
          { onChange: true, reason: 'song downloaded' },
        )
        this._cacheSongMap()
      })
      .catch(e => console.error(e))
  }

  // only updates songs it knows should be updated
  private _update() {
    const songs = Array.from(this.songMap.values())
    const songsWithoutData = songs.filter(song => !song.data)
    const songsToUpdate = songs.filter(
      song => song.data && song.data.lastModified < song.lastModified,
    )
    // this is here to first download new songs
    const songsToDownload = songsWithoutData.concat(songsToUpdate)

    // download/update songs
    for (const { id } of songsToDownload) {
      this._downloadSong(id)
    }
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

  getSong(id: string) {
    return this.songMap.get(id)
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

export function useSong(id: string) {
  const store = useStore()
  const forceUpdate = useForceUpdate()
  const song = store.getSong(id)

  useEffect(() => {
    if (song !== store.getSong(id)) forceUpdate()
    return store.onChange(forceUpdate)
  }, [forceUpdate, id, song, store])
  return song
}
