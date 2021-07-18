import { getGraphqlUrl } from 'store/graphql'

export async function songFromLink(
  link: string,
): Promise<
  | string
  | { author: string; title: string; text: string; extraNonSearchable: string }
> {
  const ug = link.startsWith('https://tabs.ultimate-guitar.com/tab/')
  const supermusic =
    link.startsWith('https://supermusic.cz') ||
    link.startsWith('https://supermusic.sk')
  if (
    !ug &&
    !supermusic &&
    !link.startsWith('https://akordy.kytary.cz/song/')
  ) {
    return 'Jiné odkazy než ultimate guitar, supermusic nebo akordy.kytary.cz nejsou podporované'
  }
  const url = new URL('import', getGraphqlUrl())
  url.searchParams.set('url', link)
  const res = await fetch(url.toString())
  const json = await res.json()
  const { title, author, text } = json
  if (!text) {
    console.warn(json)
    return 'Něco se pokazilo'
  }
  return {
    author,
    title,
    text: ug ? convertUltimateGuitarBody(text) : text,
    extraNonSearchable: link + '\n',
  }
}

function convertUltimateGuitarBody(text: string) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\[\/?tab\]/g, '')
    .split('\n')
    .reverse()
  let retLines: string[] = []
  while (lines.length > 0) {
    const line = lines.pop()!
    if (line.trim().startsWith('[ch]') && lines.length > 0) {
      const text = lines.pop()!
      retLines.push(spliceLines(line, text))
    } else {
      retLines.push(line)
    }
  }
  return retLines
    .join('\n')
    .replace(/\[Chorus\] *\n*/gi, 'R: ')
    .replace(/\[Verse( [0-9]+)?\] *\n*/gi, 'S: ')
}

function spliceLines(chordText: string, text: string) {
  const chords = parseChordLine(tokenizeChordLine(chordText)).reverse()
  for (const chord of chords) {
    text = `${text.substring(0, chord.index)}[${chord.text}]${text.substring(
      chord.index,
    )}`
  }

  return text
}

function tokenizeChordLine(line: string) {
  let ret: string[] = []
  while (line.length > 0) {
    const idx1 = line.indexOf('[ch]')
    const idx2 = line.indexOf('[/ch]')
    const idx =
      idx1 !== -1 && idx2 !== -1 ? Math.min(idx1, idx2) : Math.max(idx1, idx2)
    if (idx === -1) {
      ret.push(line)
      line = ''
    } else if (idx === 0) {
      const end = line.indexOf(']')
      ret.push(line.substring(0, end + 1))
      line = line.substring(end + 1)
    } else {
      ret.push(line.substring(0, idx))
      line = line.substring(idx)
    }
  }
  return ret
}

function parseChordLine(tokens: string[]) {
  let state = 'default' as 'default' | 'chord'
  let ret: { text: string; index: number }[] = []
  let index = 0
  for (const token of tokens) {
    if (token === '[ch]') {
      state = 'chord'
      continue
    }
    if (token === '[/ch]') {
      state = 'default'
      continue
    }
    if (state === 'chord') ret.push({ text: token, index })
    index += token.length
  }
  return ret
}
