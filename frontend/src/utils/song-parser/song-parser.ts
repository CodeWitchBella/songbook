import { parseSongMyFormat } from './my-format'

export type Line = {
  content: { ch: string; text: string }[]
  tag: string | null
}

export type Paragraph = Line[]

export type SongPage = Paragraph[]

export type ParsedSong = SongPage[]

export function parseSong(format: 'my', text: string): ParsedSong {
  if (format === 'my') return parseSongMyFormat(text)
  throw new Error('Unknown format')
}
