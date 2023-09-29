/** @jsxImportSource @emotion/react */

// @ts-expect-error
import guitar from '@tombatossals/chords-db/lib/guitar.json'
import Chord from '@tombatossals/react-chords/lib/Chord'

import { DumbModal } from './dumb-modal'
import { TText, useColors } from './themed'

type ChordDef = {
  frets: number[]
  fingers: number[]
  baseFret: number
  barres: number[]
  midi?: number[]
}

const getChordsMap = (() => {
  console.log(guitar.chords.Csharp)
  let cache: ReturnType<typeof compute> | null = null
  return () => {
    if (!cache) cache = compute()
    return cache
  }
  function compute() {
    const map = new Map<string, readonly ChordDef[]>()
    map.set('A2', [
      {
        frets: [-1, 0, 2, 2, 0, 0],
        fingers: [0, 0, 3, 4, 0, 0],
        baseFret: 1,
        barres: [],
        midi: [45, 52, 57, 59, 64],
      },
    ])
    map.set('Fadd2', [
      {
        frets: [-1, -1, 3, 2, 1, 3],
        fingers: [0, 0, 3, 2, 1, 4],
        baseFret: 1,
        barres: [],
      },
    ])
    for (const defArr of Object.values(guitar.chords)) {
      for (const def of defArr) {
        const start = def.key
        map.set(start + def.suffix, def.positions)
        if (/^m[0-9]/.test(def.suffix)) {
          map.set(start + 'mi' + def.suffix.substring(1), def.positions)
        } else if (def.suffix === 'major') {
          map.set(start, def.positions)
        } else if (def.suffix === 'minor') {
          map.set(start + 'mi', def.positions)
          map.set(start + 'm', def.positions)
        }
      }
    }
    return map
  }
})()

export function getChordDefinition(chordIn: string) {
  const chord = chordIn
    .replace(/^B/, 'Bb')
    .replace(/^H/, 'B')
    .replace(/^As/, 'Ab')
    .replace(/^Db/, 'C#')
    .replace(/^D#/, 'Eb')
    .replace(/^Gb/, 'F#')
    .replace(/^G#/, 'Ab')
    .replace(/^A#/, 'Bb')
    .replace(/,$/, '')
  return { def: getChordsMap().get(chord)?.[0], mapped: chord }
}

const instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: 'Guitar',
  keys: [],
  tunings: {
    standard: ['E', 'A', 'D', 'G', 'B', 'E'],
  },
}

export function ChordHelp({
  close,
  chord,
}: {
  close: () => void
  chord: string
}) {
  const { def, mapped } = getChordDefinition(chord)
  const colors = useColors()
  if (!def) return null

  return (
    <DumbModal close={close}>
      <TText style={{ textAlign: 'center', fontSize: 30, fontWeight: 'bold' }}>
        {chord}
        {mapped !== chord ? ` (${mapped})` : null}
      </TText>
      <div
        css={{
          width: 300,
          backgroundColor: 'white',
          filter: colors.dark ? 'invert(1) brightness(2)' : undefined,
        }}
      >
        <Chord chord={def} instrument={instrument} />
      </div>
      <TText style={{ fontSize: 13, marginTop: 20 }}>
        Klikni kdekoli pro zavření
      </TText>
    </DumbModal>
  )
}
