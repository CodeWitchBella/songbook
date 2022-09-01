import { ContinuousModeSetting } from 'components/continuous-mode'
import { Line, Paragraph } from './song-parser'

export function tokenizeLine(line_: string) {
  type Type = 'whitespace' | 'tag' | 'text' | 'chord'
  const ret: { type: Type; value: string; index: number }[] = []

  let line = line_
  let index = 0

  function modifyAndPush(type: Type, length: number) {
    if (length === 0) return
    const value = line.substring(0, length)
    if (
      type === 'text' &&
      ret.length > 0 &&
      ret[ret.length - 1].type === 'text'
    ) {
      // merge text nodes
      ret[ret.length - 1].value += value
    } else {
      ret.push({ type, value, index })
    }
    index += length
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

export type ParserOpts = {
  continuous: ContinuousModeSetting
}
export function parseSongMyFormat(
  song: string,
  opts: ParserOpts,
): { pages: Paragraph[][]; continuous: boolean } {
  let pCounter = 0
  const pages = song
    .trim()
    .split('--- page break ---')
    .map((page) => {
      const ret = parsePage(page, pCounter)
      pCounter = ret.pCounter
      return ret.page
    })
  let chordsOff = false
  let variant: 'paged' | 'both' | 'long' = 'both'

  const continuous =
    opts.continuous === 'always' ||
    (opts.continuous === 'multipage' && pages.length > 1)
  const requestedVariant = continuous ? 'long' : 'paged'

  function handleCommand(cmd: string, args: readonly string[]) {
    if (cmd === 'chords') {
      if (!continuous) {
        chordsOff =
          args[0] === 'off' ? true : args[0] === 'on' ? false : chordsOff
      }
    } else if (cmd === 'variant') {
      if (!args[0]) variant = 'both'
      else if (['paged', 'both', 'long'].includes(args[0]))
        variant = args[0] as any
    }
  }

  for (const page of pages) {
    for (let paragraphI = 0; paragraphI < page.length; ++paragraphI) {
      const paragraph = page[paragraphI]!
      const commands = parseCommands(paragraph)
      if (commands.length) {
        for (const command of commands) {
          handleCommand(command.cmd, command.args)
        }
        page.splice(paragraphI, 1)
        paragraphI--
        continue
      }

      for (const line of paragraph) {
        for (const part of line.content) {
          if (part.ch && chordsOff) part.ch = ''
          if (variant !== 'both' && variant !== requestedVariant) {
            part.ch = ''
            part.text = ''
          }
        }
        if (variant !== 'both' && variant !== requestedVariant) {
          line.tag = null
        }
      }
    }
  }
  return {
    pages: pages.map((page) =>
      // remove empty paragraphs
      page.filter((paragraph) => !isParagraphEmpty(paragraph)),
    ),
    continuous,
  }
}

function isParagraphEmpty(paragraph: Paragraph) {
  for (const line of paragraph) {
    if (line.tag) return false
    for (const part of line.content) {
      if (part.ch || part.text) return false
    }
  }
  return true
}

function parseCommands(paragraph: Paragraph) {
  const commands: { cmd: string; args: string[] }[] = []
  for (const line of paragraph) {
    if (!line.tag && line.content.length === 1) {
      const part = line.content[0]!

      if (part.ch.startsWith('>') && !part.text) {
        const [cmd, ...args] = part.ch.slice(1).split(' ')
        commands.push({ cmd, args })
        continue
      }
    }
    return []
  }
  return commands
}
