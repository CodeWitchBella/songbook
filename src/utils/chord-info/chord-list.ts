const major = mapChords([
  'C',
  ['C#', 'Db'],
  'D',
  ['D#', 'Eb'],
  'E',
  'F',
  ['F#', 'Gb'],
  'G',
  ['G#', 'Ab'],
  'A',
  ['A#', { czech: 'B', inter: 'Bb' }],
  [{ czech: 'H', inter: 'B' }],
])

const minor = suffix(['m', 'mi'])
const sixth = suffix('6')
const seventh = suffix('7')
const ninth = suffix('9')
const minor7 = suffix(['m7', 'mi7'])
const maj7 = suffix('maj7')
const dim = suffix('dim')
const plus = suffix('+')
const sus = suffix('sus')
const all = merge([
  major,
  minor,
  sixth,
  seventh,
  ninth,
  minor7,
  maj7,
  dim,
  plus,
  sus,
])

////////////////////////////////////////////////////////////////////////////////
//
//    Exports here
//
////////////////////////////////////////////////////////////////////////////////

const allChordsSet = new Set(
  [all.czech, all.inter]
    .reduce(flatReducer, [])
    .filter((item, index, arr) => arr.indexOf(item) === index),
)
export function isChord(text: string) {
  return allChordsSet.has(text)
}

////////////////////////////////////////////////////////////////////////////////
//
//    Utilities here
//
////////////////////////////////////////////////////////////////////////////////

type ChordDefSrc = (string | (string | { czech: string; inter: string })[])[]
function chordsForLang(src: ChordDefSrc, lang: 'czech' | 'inter') {
  return src.map((note) =>
    typeof note === 'string'
      ? [note]
      : note.map((chord) => (typeof chord === 'string' ? chord : chord.czech)),
  )
}
function mapChords(src: ChordDefSrc) {
  return {
    czech: chordsForLang(src, 'czech'),
    inter: chordsForLang(src, 'inter'),
  }
}

function flatReducer(a: string[], b: string | string[]) {
  return a.concat(Array.isArray(b) ? b : [b])
}

function modifiedMajor(mod: (c: string) => string | string[]) {
  return {
    czech: major.czech.map((alt) => alt.map(mod).reduce(flatReducer, [])),
    inter: major.inter.map((alt) => alt.map(mod).reduce(flatReducer, [])),
  }
}

function suffix(suf: string | string[]) {
  if (Array.isArray(suf)) return modifiedMajor((ch) => suf.map((s) => ch + s))
  return modifiedMajor((ch) => ch + suf)
}

function merge(v: ReturnType<typeof mapChords>[]) {
  return {
    czech: v
      .map((a) => a.czech)
      .map((a) => a.reduce(flatReducer, []))
      .reduce(flatReducer, []),
    inter: v
      .map((a) => a.inter)
      .map((a) => a.reduce(flatReducer, []))
      .reduce(flatReducer, []),
  }
}
