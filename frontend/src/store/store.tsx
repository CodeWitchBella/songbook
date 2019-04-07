import React, {
  PropsWithChildren,
  useMemo,
  useContext,
  useEffect,
  useState,
} from 'react'
import localForage from 'localforage'
import { listSongs, downloadSong } from './azure'
import { parseSongFile, ParsedSong } from './parse-song-file'

type SongData = {
  lastModified: number
} & ParsedSong

type SongBase = {
  id: string
  lastModified: number
}

type SongWithoutData = SongBase & { loading: boolean; reload: () => void }
export type Song = SongWithoutData & { data: SongData | null }
export type SongWithData = SongWithoutData & { data: SongData }

type SongStore = { list: (SongBase & { data: SongData | null })[] }

const localForageKey = 'store'

class Store {
  private songMap = new Map<string, Song>()
  private _setSong(
    id: string,
    song: {
      lastModified: number
      data?: SongData
    },
    { save = true, onChange = true } = {},
  ) {
    const prev = this.songMap.get(id)
    this.songMap.set(id, {
      lastModified: song.lastModified,
      data: song.data || (prev ? prev.data : undefined) || null,
      id,
      loading: false,
      reload: () => this._downloadSong(id),
    })

    if (onChange) this._triggerOnChange()
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
        console.log('cache', cache)
        if (cache) {
          for (const song of cache.list) {
            // do not save because we just loaded it
            this._setSong(song.id, song, { onChange: false, save: false })
          }
          this._triggerOnChange()
        }

        return listSongs()
      })
      .then(newSongs => {
        for (const song of newSongs) {
          const existing = this.songMap.get(song.id)
          if (!existing || song.lastModified !== existing.lastModified)
            this._setSong(song.id, song)
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
        this._setSong(origSong.id, {
          data: {
            ...song.data,
            lastModified: song.lastModified,
          },
          lastModified: song.lastModified,
        })
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
    console.log({ songsWithoutData, songsToUpdate })
    // this is here to first download new songs
    const songsToDownload = songsWithoutData.concat(songsToUpdate)

    // download/update songs
    for (const { id } of songsToDownload) {
      this._downloadSong(id)
    }
  }

  private _triggerOnChange() {
    setImmediate(() => this.handlers.forEach(h => h()))
  }

  listSongs() {
    return Array.from(this.songMap.values())
  }

  getSong(id: string) {
    return this.songMap.get(id)
  }

  handlers: (() => void)[] = []
  onChange(handler: () => void) {
    const v = () => handler()
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
  const [songs, setSongs] = useState(() => store.listSongs())
  useEffect(() => store.onChange(() => setSongs(store.listSongs())), [store])
  return songs
}

export function useSong(id: string) {
  const store = useStore()
  const [song, setSong] = useState(() => store.getSong(id))
  useEffect(() => store.onChange(() => setSong(store.getSong(id))), [id, store])
  return song
}
