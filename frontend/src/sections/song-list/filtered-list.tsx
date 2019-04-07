import React, { useState, useEffect } from 'react'
import { Song } from 'store/store'
import { SearchTitle, SongItem, ListContainer } from './song-list-look'
import { notNull } from '@codewitchbella/ts-utils'
import getFilteredSongList from './alg'
import SearchWorker from 'worker-loader!./worker.ts'

const getWorker = (() => {
  let worker: null | SearchWorker = null
  return function getOrCreateWorker() {
    if (!('Worker' in window)) return null
    if (!worker) worker = new SearchWorker()
    return worker!
  }
})()

const filteredToComponents = (
  showTitles: boolean,
  filtered: ReturnType<typeof getFilteredSongList> | string[],
) => {
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
  const [list, setList] = useState(
    filteredToComponents(false, songs.map(s => s.id)),
  )

  const worker = getWorker()
  useEffect(() => {
    if (worker) {
      const handler = (msg: MessageEvent) => {
        const { type, value } = msg.data
        if (type === 'setList') {
          if (value.search === search) {
            setList(filteredToComponents(!!search, value.list))
          }
        } else {
          console.warn('Unknown message type ' + type)
        }
      }
      worker.addEventListener('message', handler)
      return () => worker.removeEventListener('message', handler)
    }
    return undefined
  }, [search, worker])

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
      setList(filteredToComponents(false, songs.map(s => s.id)))
    } else if (worker) {
      worker.postMessage({ type: 'setSearch', value: search })
    } else {
      const filtered = getFilteredSongList(songs, search)

      setList(filteredToComponents(!!search, filtered))
    }
  }, [search, songs, worker])

  return <ListContainer count={list.length}>{list}</ListContainer>
}
