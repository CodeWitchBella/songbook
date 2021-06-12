/** @jsxImportSource @emotion/react */

// @ts-expect-error
import Chord from '@tombatossals/react-chords/lib/Chord'
import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { DumbModal } from './dumb-modal'

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
        if (def.suffix === 'major') {
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
  chord,
}: {
  close: () => void
  chord: string
}) {
  const def = getChordsMap().get(chord)?.[0]
  console.log(def)
  if (!def) return null

  return (
    <DumbModal close={close}>
      <div css={{ textAlign: 'center', fontSize: 30, fontWeight: 'bold' }}>
        {chord}
      </div>
      <div css={{ width: 300 }}>
        <Chord chord={def} instrument={instrument} />
      </div>
      <div css={{ fontSize: 13, marginTop: 20 }}>
        Klikněte kdekoli pro zavření
      </div>
    </DumbModal>
  )
}
