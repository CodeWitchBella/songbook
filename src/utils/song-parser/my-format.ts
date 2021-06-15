import { Line, Paragraph } from './song-parser'

export function tokenizeLine(line_: string) {
  type Type = 'whitespace' | 'tag' | 'text' | 'chord'
  const ret: { type: Type; value: string }[] = []

  let line = line_

  function modifyAndPush(type: Type, length: number) {
    if (length === 0) return
    const value = line.substring(0, length)
    if (type === 'text' && ret[ret.length - 1].type === 'text') {
      // merge text nodes
      ret[ret.length - 1].value += value
    } else {
      ret.push({ type, value })
    }
    line = line.substring(length)
  }
  modifyAndPush('whitespace', line.length - line.trimStart().length)

  const rreg = /^(R[0-9]?:|S:[0-9]*)/
  const rmatch = rreg.exec(line)
  if (rmatch) {
    modifyAndPush('tag', rmatch[0].length)
  }

  let counter = 0
  while (line !== '') {
    counter += 1
    if (counter > 100) break

    const start = line.indexOf('[')
    if (start < 0) {
      modifyAndPush('text', line.length)
    } else if (start === 0) {
      const idx = line.indexOf(']')
      if (idx < 0) {
        modifyAndPush('text', line.length)
      } else {
        modifyAndPush('chord', idx + 1)
      }
    } /* start > 0 */ else {
      modifyAndPush('text', start)
    }
  }
  return ret
}

export function detokenize(tokens: ReturnType<typeof tokenizeLine>) {
  return tokens.map((t) => t.value).join('')
}

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
