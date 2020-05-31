import { Line, Paragraph } from './song-parser'

function parseLine(
  line_: string,
  pCounter: number,
): Line & { pCounter: number } {
  let line = line_.trim()
  const content: Line['content'] = []
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
    tag = `R${rmatch[1]}.`
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

      if (ch.startsWith('*')) {
        if (ch.length > 1)
          content.push({ text: ch.substring(1), ch: '', bold: true })
        content.push({ text: text, ch: '' })
      } else {
        content.push({ text, ch })
      }
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

function parseParagraph(
  p: string,
  pCounterInit: number,
): { p: Paragraph; pCounter: number } {
  let pCounter = pCounterInit
  return {
    p: p
      .trim()
      .split('\n')
      .map((l) => {
        const { content, tag, pCounter: n } = parseLine(l, pCounter)
        pCounter = n
        return {
          content,
          tag: isVerse(tag) ? verseToText(tag, pCounter) : tag,
        }
      }),
    pCounter,
  }
}

function parsePage(
  song: string,
  pCounterInit: number,
): { page: Paragraph[]; pCounter: number } {
  let pCounter = pCounterInit
  return {
    page: song
      .trim()
      .split(/\n\n+/)
      .map((l) => {
        const ret = parseParagraph(l, pCounter)
        pCounter = ret.pCounter
        return ret.p
      }),
    pCounter,
  }
}

export function parseSongMyFormat(song: string): Paragraph[][] {
  let pCounter = 0
  return song
    .trim()
    .split('--- page break ---')
    .map((page) => {
      const ret = parsePage(page, pCounter)
      pCounter = ret.pCounter
      return ret.page
    })
}
