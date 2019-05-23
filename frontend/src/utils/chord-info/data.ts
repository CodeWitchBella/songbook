// source: guitar-chord-chart.png which is in this folder
// got it from: https://truefire.com/guitar-chord-charts/

export const variants = {
  major: { notation: '', altNotations: [] },
  minor: { notation: 'm', altNotations: ['mi'] },
  sixth: { notation: '6', altNotations: [] },
  seventh: { notation: '7', altNotations: [] },
  ninth: { notation: '9', altNotations: [] },
  minor6: { notation: 'm6', altNotations: ['mi6'] },
  minor7: { notation: 'm7', altNotations: ['mi7'] },
  maj7: { notation: 'maj7', altNotations: [] },
  dim: { notation: 'dim', altNotations: [] },
  plus: { notation: '+', altNotations: [] },
  sus: { notation: 'sus', altNotations: [] },
}

function parseString(text: string) {
  if (typeof text !== 'string' || text.length !== 1)
    throw new Error(
      'Expected single character for string got ' + JSON.stringify(text),
    )
  if (text === 'x') return 'x' as const
  const number = Number.parseInt(text)
  if (!Number.isInteger(number) || number < 0)
    throw new Error('Invalid string ' + JSON.stringify(text))
  return number
}
type StringName = number | 'x'
function parseGuitarChord(
  chord: string,
): [StringName, StringName, StringName, StringName, StringName, StringName] {
  if (typeof chord !== 'string' || chord.length !== 6)
    throw new Error('Not guitar chord. Got ' + JSON.stringify(chord))
  return [
    parseString(chord[0]),
    parseString(chord[1]),
    parseString(chord[2]),
    parseString(chord[3]),
    parseString(chord[4]),
    parseString(chord[5]),
  ]
}

const interData = Object.entries({
  Ab: {
    equivalentWith: ['G#'],
    variants: {
      major: '445664',
      minor: '444664',
      sixth: '111134',
      seventh: '2111xx',
      ninth: '2131xx',
      minor6: '444xxx',
      minor7: '2011xx',
      maj7: '3111xx',
      dim: '1010xx',
      plus: '0112xx',
      sus: '4211xx',
    },
  },
  A: {
    equivalentWith: [],
    variants: {
      major: '02220x',
      minor: '01220x',
      sixth: '22220x',
      seventh: '32220x',
      ninth: '32520x',
      minor6: '21220x',
      minor7: '31220x',
      maj7: '02120x',
      dim: '2121xx',
      plus: '12230x',
      sus: '03220x',
    },
  },
  Bb: {
    equivalentWith: ['A#'],
    variants: {
      major: '13331x',
      minor: '12331x',
      sixth: '333311',
      seventh: '4333xx',
      ninth: '333533',
      minor6: '3233xx',
      minor7: '4233xx',
      maj7: 'x3231x',
      dim: '3232xx',
      plus: '2330xx',
      sus: '1433xx',
    },
  },
  B: {
    equivalentWith: ['Cb'],
    variants: {
      major: '24442x',
      minor: '23442x',
      sixth: '44422',
      seventh: '20212x',
      ninth: '22212x',
      minor6: '4244xx',
      minor7: '23242x',
      maj7: 'x4342x',
      dim: '1010xx',
      plus: '3445xx',
      sus: '2544xx',
    },
  },
  C: {
    equivalentWith: ['B#'],
    variants: {
      major: '010233',
      minor: '34553x',
      sixth: '3122xx',
      seventh: '01323x',
      ninth: '33323x',
      minor6: '3121xx',
      minor7: '3131xx',
      maj7: '00023x',
      dim: '2121xx',
      plus: '0112xx',
      sus: '3103xx',
    },
  },
  Db: {
    equivalentWith: ['C#'],
    variants: {
      major: '1213xx',
      minor: '0212xx',
      sixth: '4233xx',
      seventh: '4243xx',
      ninth: '44434x',
      minor6: '4232xx',
      minor7: '4242xx',
      maj7: '11134x',
      dim: '3232xx',
      plus: '1223xx',
      sus: '1433xx',
    },
  },
  D: {
    equivalentWith: [],
    variants: {
      major: '2320xx',
      minor: '1320xx',
      sixth: '30300x',
      seventh: '3130xx',
      ninth: '012002',
      minor6: '1020xx',
      minor7: '1120xx',
      maj7: '2220xx',
      dim: '1010xx',
      plus: '2330xx',
      sus: '3320xx',
    },
  },
  Eb: {
    equivalentWith: ['D#'],
    variants: {
      major: '3435xx',
      minor: '2434xx',
      sixth: '3131xx',
      seventh: '3231xx',
      ninth: '123111',
      minor6: '2131xx',
      minor7: '2231xx',
      maj7: '3331xx',
      dim: '2121xx',
      plus: '3001xx',
      sus: '4431xx',
    },
  },
  E: {
    equivalentWith: ['Fb'],
    variants: {
      major: '001220',
      minor: '000220',
      sixth: '021220',
      seventh: '031220',
      ninth: '201020',
      minor6: '020220',
      minor7: '000020',
      maj7: '001120',
      dim: '3232xx',
      plus: '0112xx',
      sus: '002220',
    },
  },
  F: {
    equivalentWith: ['E#'],
    variants: {
      major: '112331',
      minor: '111331',
      sixth: '1120xx',
      seventh: '112131',
      ninth: '3423xx',
      minor6: '1110xx',
      minor7: '111131',
      maj7: '0123xx',
      dim: '1010xx',
      plus: '1223xx',
      sus: '1133xx',
    },
  },
  Gb: {
    equivalentWith: ['F#'],
    variants: {
      major: '223442',
      minor: '222442',
      sixth: 'x4344x',
      seventh: '0234xx',
      ninth: '4534xx',
      minor6: '2221xx',
      minor7: '2222xx',
      maj7: '1234xx',
      dim: '2121xx',
      plus: '2334xx',
      sus: '2244xx',
    },
  },
  G: {
    equivalentWith: [],
    variants: {
      major: '30023',
      minor: '333553',
      sixth: '000023',
      seventh: '100023',
      ninth: '102003',
      minor6: '3332xx',
      minor7: '333353',
      maj7: '2345xx',
      dim: '3232xx',
      plus: '3001xx',
      sus: '3100xx',
    },
  },
}).map(([major, definition]) => ({
  major,
  equivalentWith: definition.equivalentWith,
  variants: Object.entries(definition.variants).map(([name, guitar]) => ({
    name: name,
    guitarChord: parseGuitarChord(guitar),
  })),
}))

const czechData = interData.map(chord => ({
  ...chord,
  major: chord.major === 'B' ? 'H' : chord.major === 'Bb' ? 'B' : chord.major,
  equivalentWith: chord.equivalentWith.map(name =>
    name === 'B#' ? 'H#' : name,
  ),
}))

export const data = { czech: czechData, inter: interData }
