/** @jsxImportSource @emotion/react */

// @ts-expect-error
import Chord from '@tombatossals/react-chords/lib/Chord'
import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { DumbModal } from './dumb-modal'
import { TText, useDarkMode } from './themed'

type ChordDef = typeof guitar['chords']['A'][0]['positions'][0]

const getChordsMap = (() => {
  let cache: ReturnType<typeof compute> | null = null
  return () => {
    if (!cache) cache = compute()
    return cache
  }
  function compute() {
    const map = new Map<string, readonly ChordDef[]>()
    for (const [start, defArr] of Object.entries(guitar.chords)) {
      for (const def of defArr) {
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
  chord: chordIn,
}: {
  close: () => void
  chord: string
}) {
  const chord = chordIn.replace(/^B/, 'Bb').replace(/^H/, 'B')
  const def = getChordsMap().get(chord)?.[0]
  const dark = useDarkMode()
  if (!def) return null

  return (
    <DumbModal close={close}>
      <TText style={{ textAlign: 'center', fontSize: 30, fontWeight: 'bold' }}>
        {chordIn}
        {chordIn !== chord ? ` (${chord})` : null}
      </TText>
      <div
        css={{
          width: 300,
          backgroundColor: 'white',
          filter: dark ? 'invert(1) brightness(2)' : undefined,
        }}
      >
        <Chord chord={def} instrument={instrument} />
      </div>
      <TText style={{ fontSize: 13, marginTop: 20 }}>
        Klikněte kdekoli pro zavření
      </TText>
    </DumbModal>
  )
}
