import type { TFunction } from 'react-i18next'
import { getGraphqlUrl } from 'store/graphql'

export async function songDataFromLink(
  link: string,
  t: TFunction<'translation'>,
) {
  const ug = link.startsWith('https://tabs.ultimate-guitar.com/tab/')
  const supermusic =
    link.startsWith('https://supermusic.cz') ||
    link.startsWith('https://supermusic.sk')
  if (
    !ug &&
    !supermusic &&
    !link.startsWith('https://akordy.kytary.cz/song/') &&
    !link.startsWith('https://pisnicky-akordy.cz/')
  ) {
    const services = t('create.{{a}}, or {{b}}', {
      replace: {
        a: 'pisnicky-akordy.cz, ultimate guitar, supermusic',
        b: 'akordy.kytary.cz',
      },
    })
    return t('create.Links other than {{services}} are not supported', {
      replace: { services },
    })
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
    ug,
    author,
    title,
    text,
    link: link,
  }
}
type NotString<T> = T extends string ? never : T
export type IntermediateSongData = NotString<
  Awaited<ReturnType<typeof songDataFromLink>>
>

export function convertToSong(songData: IntermediateSongData): {
  author: string
  title: string
  text: string
  extraNonSearchable: string
} {
  return {
    author: songData.author,
    title: songData.title,
    text: songData.ug
      ? convertUltimateGuitarBody(songData.text)
      : songData.text,
    extraNonSearchable: songData.link + '\n',
  }
}

const entities: { [key: string]: string } = {
  '&quot;': '"',
  '&laquo;': '«',
  '&raquo;': '»',
  '&ndash;': '–',
  '&mdash;': '—',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&sbquo;': '‚',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&bdquo;': '„',
  '&hellip;': '…',
  '&prime;': '′',
  '&Prime;': '″',
}
function replaceHtmlEntities(text: string) {
  return text.replace(
    /&[a-z]+;/g,
    (substring) => entities[substring] || substring,
  )
}

function convertUltimateGuitarBody(text: string) {
  const lines = replaceHtmlEntities(text)
    .replace(/\r\n/g, '\n')
    .replace(/\[\/?tab\]/g, '')
    .split('\n')
    .reverse()
  let retLines: string[] = []
  while (lines.length > 0) {
    const line = lines.pop()!
    if (line.trim().startsWith('[ch]')) {
      const text = lines[lines.length - 1]
      if (!text || text.trim().startsWith('[ch]')) {
        retLines.push(spliceLines(line, ''))
      } else {
        lines.pop()
        retLines.push(spliceLines(line, text))
      }
    } else {
      retLines.push(line)
    }
  }
  return retLines
    .join('\n')
    .replace(/\] +\[/g, ' ')
    .replace(/\[Chorus\] *\n*/gi, 'R: ')
    .replace(/\[Verse( [0-9]+)?\] *\n*/gi, 'S: ')
    .replace(/\[(Interlude|Outro|Bridge|Intro)\] *\n*/gi, '[*$1] ')
}

function spliceLines(chordText: string, text: string) {
  const chords = parseChordLine(tokenizeChordLine(chordText)).reverse()
  text = text.padEnd(chords[0]?.index ?? 0, ' ')
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
