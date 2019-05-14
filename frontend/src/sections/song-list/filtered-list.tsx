import React, { useEffect, useReducer } from 'react'
import { Song } from 'store/store'
import { SearchTitle, SongItem, ListContainer } from './song-list-look'
import { notNull } from '@codewitchbella/ts-utils'
import getFilteredSongList from './alg'
// eslint-disable-next-line import/no-webpack-loader-syntax
import SearchWorker from 'workers-loader?inline&fallback=false!./worker'

const getWorker = (() => {
  let worker: null | SearchWorker = null
  return function getOrCreateWorker() {
    if (!('Worker' in window)) return null
    if (!worker) worker = new SearchWorker()
    return worker!
  }
})()

type FilteredList = ReturnType<typeof getFilteredSongList>
const filteredToComponents = (showTitles: boolean, filtered: FilteredList) => {
  if (Array.isArray(filtered)) {
    return filtered.map(s => <SongItem key={s} id={s} />)
  }

  return [
    showTitles && filtered.byTitle.length > 0 ? (
      <SearchTitle key="title">Podle názvu</SearchTitle>
    ) : null,
    ...filtered.byTitle.map(s => <SongItem key={s} id={s} />),

    showTitles && filtered.byAuthor.length > 0 ? (
      <SearchTitle key="author">Podle autora</SearchTitle>
    ) : null,
    ...filtered.byAuthor.map(s => <SongItem key={s} id={s} />),

    showTitles && filtered.byText.length > 0 ? (
      <SearchTitle key="text">Text obsahuje</SearchTitle>
    ) : null,
    ...filtered.byText.map(s => <SongItem key={s} id={s} />),
  ].filter(notNull)
}

export default function FilteredList({
  search,
  songs,
}: {
  search: string
  songs: Song[]
}) {
  const [list, setList] = useReducer(
    (
      _prevState,
      {
        showTitles,
        ids,
        tag,
      }: { showTitles: boolean; ids: FilteredList; tag: string },
    ) => {
      console.log(`[${tag}] Setting list to`, { showTitles, ids })
      return filteredToComponents(showTitles, ids)
    },
    null,
    (_arg: null) => {
      const ids = {
        byTitle: songs.map(s => s.id),
        byAuthor: [],
        byText: [],
      }
      console.log('Initial set list to', { showTitles: false, ids })
      return filteredToComponents(false, ids)
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
        value: songs.map(song => ({
          data: song.data,
          id: song.id,
          lastModified: song.lastModified,
          loading: song.loading,
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
          byTitle: songs.map(s => s.id),
          byAuthor: [],
          byText: [],
        },
        tag: 'short-circuit',
      })
    } else if (worker) {
      console.log('Posting search to SW', JSON.stringify(search))
      worker.postMessage({ type: 'setSearch', value: search })
    } else {
      const filtered = getFilteredSongList(songs, search)
      setList({ showTitles: !!search, ids: filtered, tag: 'no-worker' })
    }
  }, [search, songs, worker])

  return <ListContainer count={list.length}>{list}</ListContainer>
}
