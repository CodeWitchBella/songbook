import React, { useEffect, useReducer } from 'react'
import { SongList, SongListItem } from './song-list-look'
import { notNull } from '@codewitchbella/ts-utils'
import getFilteredSongList, { SearchableSong } from './alg'
// eslint-disable-next-line import/no-webpack-loader-syntax
import SearchWorker from 'workers-loader?inline&fallback=false!./worker'
import { SongType } from 'store/store-song'

const getWorker = (() => {
  let worker: null | SearchWorker = null
  return function getOrCreateWorker() {
    if (!('Worker' in window)) return null
    if (!worker) worker = new SearchWorker()
    return worker!
  }
})()

type FilteredList = ReturnType<typeof getFilteredSongList>
const filteredToComponents = (
  showTitles: boolean,
  filtered: FilteredList,
  songItem: (id: string) => { text: string; slug: string } | null,
): SongListItem[] => {
  return [
    showTitles && filtered.byTitle.length > 0
      ? { header: 'Podle názvu' }
      : null,
    ...filtered.byTitle.map(songItem),

    showTitles && filtered.byAuthor.length > 0
      ? { header: 'Podle autora' }
      : null,
    ...filtered.byAuthor.map(songItem),

    showTitles && filtered.byText.length > 0
      ? { header: 'Text obsahuje' }
      : null,
    ...filtered.byText.map(songItem),
    showTitles && filtered.byExtra.length > 0
      ? { header: 'Další související písně' }
      : null,
    ...filtered.byExtra.map(songItem),
  ].filter(notNull)
}

export default function FilteredList({
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
      text: sortByAuthor
        ? `${song.author} - ${song.title}`
        : `${song.title} - ${song.author}`,
      slug: song.slug,
    }
  }
  const [list, setList] = useReducer(
    (
      _prevState: any,
      {
        showTitles,
        ids,
        tag,
      }: { showTitles: boolean; ids: FilteredList; tag: string },
    ) => {
      //console.log(`[${tag}] Setting list to`, { showTitles, ids })
      return filteredToComponents(showTitles, ids, songItem)
    },
    null,
    (_arg: null) => {
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
            setList({ showTitles: !!search, ids: value.list, tag: 'from-sw' })
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
        tag: 'short-circuit',
      })
    } else if (worker) {
      worker.postMessage({ type: 'setSearch', value: search })
    } else {
      const filtered = getFilteredSongList(songs, search)
      setList({ showTitles: !!search, ids: filtered, tag: 'no-worker' })
    }
  }, [search, songs, worker])

  return <SongList list={list} />
}
