import latinize from 'utils/latinize'

export type SearchableSong = {
  author: string
  title: string
  text: string
  extraSearchable: string | null
  id: string
}

function toComparable(text: string) {
  return latinize(text.toLocaleLowerCase())
}
const searchSong = (
  text: string,
  field: 'author' | 'title' | 'text' | 'extraSearchable',
) => (song: SearchableSong) => {
  if (!text) return true
  return toComparable(text)
    .split(' ')
    .map(t => t.trim())
    .filter(t => t)
    .every(t => toComparable(song[field] || '').includes(t))
}

export default function getFilteredSongList(
  songs: SearchableSong[],
  search: string,
) {
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
  byText.forEach(s => {
    used.add(s.id)
  })

  const byExtra = search
    ? songs
        .filter(searchSong(search, 'extraSearchable'))
        .filter(s => !used.has(s.id))
    : []

  return {
    byTitle: byTitle.map(s => s.id),
    byAuthor: byAuthor.map(s => s.id),
    byText: byText.map(s => s.id),
    byExtra: byExtra.map(s => s.id),
  }
}
