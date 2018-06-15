import { Delta, DeltaOperation } from 'utils/quill-delta'

export type Line = {
  content: { ch: string; text: string }[]
  tag: string | null
}
function parseLine(
  line_: string,
  pCounter: number,
  { convertTags }: { convertTags: boolean },
): Line & { pCounter: number } {
  let line = line_.trim()
  const content: { ch: string; text: string }[] = []
  let tag: string | null = null

  let first = true

  const rreg = /^R([0-9]?):/
  const rmatch = rreg.exec(line)
  if (line.startsWith('S:')) {
    tag = 'S:'
    line = line.substring(2)
    const match = /^[0-9]+/.exec(line)
    if (match) {
      line = line.substring(match[0].length)
      tag += match[0]
    }
    line = line.trim()
  } else if (rmatch) {
    tag = `R${rmatch[1]}${convertTags ? '.' : ':'}`
    line = line.replace(rreg, '').trim()
  }

  if (!line.includes('[')) {
    content.push({ ch: '', text: line })
  } else {
    let counter = 0
    while (line !== '') {
      counter += 1
      if (counter > 100) break

      if (first && line.startsWith('[')) {
        first = false
        line = line.substring(1)
      }

      let ch = ''
      if (first) {
        first = false
      } else {
        const idxCh = line.indexOf(']')
        ch = line.substring(0, idxCh)
        line = line.substring(idxCh + 1)
      }

      let idx = line.indexOf('[')
      idx = idx < 0 ? line.length : idx
      const text = line.substring(0, idx)
      line = line.substring(idx + 1)
      content.push({ text, ch })
    }
  }
  return { content, tag, pCounter: pCounter + (isVerse(tag) ? 1 : 0) }
}

function isVerse(tag?: string | null): tag is string {
  if (!tag) return false
  return tag.startsWith('S:')
}

function verseToText(tag: string, pCounter: number) {
  if (tag.length === 2) return `${pCounter}.`
  return `${pCounter}. = ${tag.substring(2)}.`
}

export type Paragraph = Line[]
function parseParagraph(
  p: string,
  pCounterInit: number,
  { convertTags }: { convertTags: boolean },
): { p: Paragraph; pCounter: number } {
  let pCounter = pCounterInit
  return {
    p: p
      .trim()
      .split('\n')
      .map(l => {
        const { content, tag, pCounter: n } = parseLine(l, pCounter, {
          convertTags,
        })
        pCounter = n
        return {
          content,
          tag: isVerse(tag) && convertTags ? verseToText(tag, pCounter) : tag,
        }
      }),
    pCounter,
  }
}

function parsePage(
  song: string,
  pCounterInit: number,
  { convertTags }: { convertTags: boolean },
): { page: Paragraph[]; pCounter: number } {
  let pCounter = pCounterInit
  return {
    page: song
      .trim()
      .split(/\n\n+/)
      .map(l => {
        const ret = parseParagraph(l, pCounter, { convertTags })
        pCounter = ret.pCounter
        return ret.p
      }),
    pCounter,
  }
}

export function parseSong(
  song: string,
  { convertTags = true }: { convertTags?: boolean } = {},
): Paragraph[][] {
  let pCounter = 0
  return song
    .trim()
    .split('--- page break ---')
    .map(page => {
      const ret = parsePage(page, pCounter, { convertTags })
      pCounter = ret.pCounter
      return ret.page
    })
}

export function parseSongToDelta(song: string): Delta {
  const delta: DeltaOperation[] = []
  for (const page of parseSong(song, { convertTags: false })) {
    for (const paragraph of page) {
      for (const line of paragraph) {
        let withChord = 0
        if (line.tag) {
          delta.push({ insert: line.tag, attributes: { tag: true } })
        }
        for (const part of line.content) {
          if (part.ch) {
            withChord += 1
            if (part.ch[0] === '_') {
              delta.push({
                insert: part.ch.substring(1),
                attributes: { spaceChord: true },
              })
            } else {
              delta.push({ insert: part.ch, attributes: { chord: true } })
            }
          }
          delta.push({ insert: part.text })
        }
        delta.push({
          insert: '\n',
          attributes: { withChord },
        })
      }
      delta.push({ insert: '\n' })
    }
    delta.push({ insert: '\n', attributes: { pageSplit: true } })
  }
  return new Delta(delta)
}

export function stringifySongFromDelta(song: Delta): string {
  if (!song.ops) return ''
  let ret = ''
  for (const op of song.ops) {
    if (!op.insert) throw new Error('Unknown delta value')
    const attr = op.attributes || {}
    if (attr.tag) {
      ret += `${op.insert} `
    } else if (attr.chord) {
      ret += `[${op.insert}]`
    } else if (attr.spaceChord) {
      ret += `[_${op.insert}]`
    } else {
      ret += op.insert
    }
  }
  return ret
}
