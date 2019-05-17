import latinize from 'utils/latinize'
import { Song } from 'store/store'

function toComparable(text: string) {
  return latinize(text.toLocaleLowerCase())
}
const searchSong = (text: string, field: 'author' | 'title' | 'text') => (
  s: Song,
) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => {
      if (field === 'text')
        return !!s.longData && toComparable(s.longData.text).includes(t)
      return toComparable(s.shortData[field]).includes(t)
    })
}

export default function getFilteredSongList(songs: Song[], search: string) {
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
    ? songs.filter(searchSong(search, 'text')).filter(s => !used.has(s.id))
    : []

  return {
    byTitle: byTitle.map(s => s.id),
    byAuthor: byAuthor.map(s => s.id),
    byText: byText.map(s => s.id),
  }
}
