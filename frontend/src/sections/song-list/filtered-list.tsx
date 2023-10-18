import { notNull } from '@isbl/ts-utils'
import React, { useEffect, useReducer } from 'react'
import type { SongType } from 'store/store-song'

import type { SearchableSong } from './alg'
import getFilteredSongList from './alg'
import type { SongListItem } from './song-list-look'
import { SongListLook } from './song-list-look'

const SearchWorker = () =>
  new Worker(new URL('./worker', import.meta.url), { type: 'module' })

const getWorker = (() => {
  let worker: null | ReturnType<typeof SearchWorker> = null
  return function getOrCreateWorker() {
    if (!('Worker' in window)) return null
    if (!worker) worker = SearchWorker()
    return worker
  }
})()

type FilteredSongs = ReturnType<typeof getFilteredSongList>
const filteredToComponents = (
  showTitles: boolean,
  filtered: FilteredSongs,
  songItem: (id: string) => { text: string; slug: string } | null,
): SongListItem[] => {
  return [
    showTitles && filtered.byTitle.length > 0
      ? { header: 'title' as const }
      : null,
    ...filtered.byTitle.map(songItem),

    showTitles && filtered.byAuthor.length > 0
      ? { header: 'author' as const }
      : null,
    ...filtered.byAuthor.map(songItem),

    showTitles && filtered.byText.length > 0
      ? { header: 'text' as const }
      : null,
    ...filtered.byText.map(songItem),
    showTitles && filtered.byExtra.length > 0
      ? { header: 'other' as const }
      : null,
    ...filtered.byExtra.map(songItem),
  ].filter(notNull)
}

export function FilteredList({
  search,
  songs,
  sortByAuthor,
  getSongById,
}: {
  search: string
  songs: SongType[]
  sortByAuthor: boolean
  getSongById: (id: string) => SongType | null
}) {
  function songItem(id: string) {
    const song = getSongById(id)
    if (!song) return null
    return {
      text:
        !song.author || !song.title
          ? song.author || song.title
          : sortByAuthor
          ? `${song.author} - ${song.title}`
          : `${song.title} - ${song.author}`,
      slug: song.slug,
    }
  }
  const [list, setList] = useReducer(
    (
      _prevState: any,
      { showTitles, ids }: { showTitles: boolean; ids: FilteredSongs },
    ) => {
      return filteredToComponents(showTitles, ids, songItem)
    },
    null,
    () => {
      return filteredToComponents(
        !!search,
        getFilteredSongList(songs, search),
        songItem,
      )
    },
  )

  const worker = getWorker()
  useEffect(() => {
    if (worker) {
      const handler = (msg: MessageEvent) => {
        const { type, value } = msg.data
        if (type === 'setList') {
          if (
            value.search === search &&
            value.sourceListLength === songs.length
          ) {
            setList({ showTitles: !!search, ids: value.list })
          }
        } else {
          console.warn('Unknown message type ' + type)
        }
      }
      worker.addEventListener('message', handler)
      return () => worker.removeEventListener('message', handler)
    }
    return undefined
  }, [search, songs.length, worker])

  useEffect(() => {
    if (worker) {
      worker.postMessage({
        type: 'setSongs',
        value: songs.map<SearchableSong>((song) => ({
          text: song.text,
          author: song.author,
          id: song.id,
          extraSearchable: song.extraSearchable,
          title: song.title,
        })),
      })
    }
  }, [songs, worker])

  useEffect(() => {
    if (!search) {
      // short-circuit empty search
      setList({
        showTitles: false,
        ids: {
          byTitle: songs.map((s) => s.id),
          byAuthor: [],
          byText: [],
          byExtra: [],
        },
      })
    } else if (worker) {
      worker.postMessage({ type: 'setSearch', value: search })
    } else {
      const filtered = getFilteredSongList(songs, search)
      setList({ showTitles: !!search, ids: filtered })
    }
  }, [search, songs, worker])

  return <SongListLook list={list} />
}
