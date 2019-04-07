import React, { useCallback, useState, useEffect } from 'react'
import { Song } from 'store/store'
import latinize from 'utils/latinize'
import { SearchTitle, SongItem, ListContainer } from './song-list-look'
import { notNull } from '@codewitchbella/ts-utils'

function toComparable(text: string) {
  return latinize(text.toLocaleLowerCase())
}
const searchSong = (
  text: string,
  field: 'author' | 'title' | 'textWithChords',
) => (s: Song) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => !!s.data && toComparable(s.data[field]).includes(t))
}

export default function FilteredList({
  search,
  songs,
}: {
  search: string
  songs: Song[]
}) {
  const getList = useCallback(() => {
    const used = new Set<string>()
    const byTitle = songs.filter(searchSong(search, 'title'))
    byTitle.forEach(s => {
      used.add(s.id)
    })

    const byAuthor = search
      ? songs.filter(searchSong(search, 'author')).filter(s => !used.has(s.id))
      : []
    byAuthor.forEach(s => {
      used.add(s.id)
    })

    const byText = search
      ? songs
          .filter(searchSong(search, 'textWithChords'))
          .filter(s => !used.has(s.id))
      : []

    const showTitles = byAuthor.length + byText.length > 0

    return [
      showTitles && byTitle.length > 0 ? (
        <SearchTitle key="title">Podle názvu</SearchTitle>
      ) : null,
      ...byTitle.map(s => <SongItem key={s.id} id={s.id} />),

      showTitles && byAuthor.length > 0 ? (
        <SearchTitle key="author">Podle autora</SearchTitle>
      ) : null,
      ...byAuthor.map(s => <SongItem key={s.id} id={s.id} />),

      showTitles && byText.length > 0 ? (
        <SearchTitle key="text">Text obsahuje</SearchTitle>
      ) : null,
      ...byText.map(s => <SongItem key={s.id} id={s.id} />),
    ].filter(notNull)
  }, [search, songs])

  const [list, setList] = useState(getList)
  useEffect(() => {
    setList(getList())
  }, [getList])

  return <ListContainer count={list.length}>{list}</ListContainer>
}
