import { ParserOpts, parseSongMyFormat } from './my-format'

export type Line = {
  content: { ch: string; text: string; bold?: boolean }[]
  tag: string | null
}

export type Paragraph = Line[]

export type SongPage = Paragraph[]

export type ParsedSong = { pages: SongPage[]; continuous: boolean }

export function parseSong(
  format: 'my',
  text: string,
  opts: ParserOpts,
): ParsedSong {
  if (format === 'my') return parseSongMyFormat(text, opts)
  throw new Error('Unknown format')
}
