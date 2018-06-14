import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import latinize from 'latinize'
import { songs, songDir } from './resolvers'

type NewSongInput = {
  author: string
  title: string
  textWithChords: string
  tags: string[]
  metadata: SongMetadataInput
}

type EditSongInput = {
  id: string
  author?: string
  title?: string
  textWithChords?: string
  tags?: string[]
  metadata?: SongMetadataInput
}

type SongMetadataInput = {
  audio?: string
  fontSize?: number
  paragraphSpace?: number
  titleSpace?: number
}

type InferReturnType<T extends (...arg: any[]) => any> = T extends (
  ...arg: any[]
) => infer R
  ? R
  : null

type ArrayItem<T extends any[]> = T extends (infer R)[] ? R : null

type Song = ArrayItem<InferReturnType<typeof songs.get>>

function addOther(tags: string[]) {
  if (tags.filter(t => t !== 'new' && t !== 'todo' && t).length > 0) return tags
  return [...tags, 'o']
}

function serializeSong(song: Song): string {
  const metadata = JSON.stringify(song.metadata)
  return `${song.author}
${song.title}
${addOther(song.tags).join(',')}
${metadata === '{}' ? '' : metadata}

${song.textWithChords}
`
}

function sanitizeSongId(part: string) {
  return latinize(part)
    .trim()
    .replace(/ /g, '_')
    .replace(/[^a-z_0-9]/gi, '')
}

function saveSong(song: Song): Promise<void> {
  return promisify(fs.writeFile)(
    path.join(songDir, `${song.id}.song`),
    serializeSong(song),
    'utf-8',
  )
}

const Mutation = {
  newSong: (
    _: {},
    { song }: { song: NewSongInput },
  ): Promise<string | null> | string | null => {
    const id = `${sanitizeSongId(song.title)}-${sanitizeSongId(song.author)}`
    const origSong = songs.get().find(s => s.id === id)
    if (origSong) return null

    if (!song.tags.includes('new')) {
      song.tags.push('new')
    }

    return saveSong({ id, ...song })
      .then(() => id)
      .catch(e => {
        console.error(e)
        return null
      })
  },
  editSong: (
    _: {},
    { song }: { song: EditSongInput },
  ): Promise<boolean> | boolean => {
    const origSong = songs.get().find(s => s.id === song.id)
    if (!origSong) return false
    return saveSong({
      ...origSong,
      ...song,
      metadata: { ...origSong.metadata, ...song.metadata },
    })
      .then(() => true)
      .catch(e => {
        console.error(e)
        return false
      })
  },
}
export default Mutation
