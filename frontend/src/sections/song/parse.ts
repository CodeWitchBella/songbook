export type Line = {
  content: { ch: string; text: string }[]
  tag: string | null
}
function parseLine(
  line_: string,
  pCounter: number,
): Line & { pCounter: number } {
  let line = line_.trim()
  const content: { ch: string; text: string }[] = []
  let tag: string | null = null

  let first = true

  if (line.startsWith('S:')) {
    tag = 'S:'
    line = line.substring(2).trim()
  } else if (line.startsWith('R:')) {
    tag = 'R:'
    line = line.substring(2).trim()
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
  return { content, tag, pCounter: pCounter + (tag === 'S:' ? 1 : 0) }
}

export type Paragraph = Line[]
function parseParagraph(
  p: string,
  pCounterInit: number,
): { p: Paragraph; pCounter: number } {
  let pCounter = pCounterInit
  return {
    p: p
      .trim()
      .split('\n')
      .map(l => {
        const { content, tag, pCounter: n } = parseLine(l, pCounter)
        pCounter = n
        return { content, tag: tag === 'S:' ? `${pCounter}.` : tag }
      }),
    pCounter,
  }
}

export function parseSong(song: string): Paragraph[] {
  let counter = 0
  return song
    .trim()
    .split(/\n\n+/)
    .map(l => {
      const ret = parseParagraph(l, counter)
      counter = ret.pCounter
      return ret.p
    })
}
