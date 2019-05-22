import { parseSongMyFormat } from './my-format'

export type Line = {
  content: { ch: string; text: string }[]
  tag: string | null
}

export type Paragraph = Line[]

export function parseSong(format: 'my', text: string) {
  if (format === 'my') return parseSongMyFormat(text)
  throw new Error('Unknown format')
}
