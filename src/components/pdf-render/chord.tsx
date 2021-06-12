import { Pressable, Text } from 'react-native'
import { usePDFSettings } from './pdf-settings'

const notes = [
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'],
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'B', 'H'],
]

const iterableNotes = notes.map((list) => ({
  list,
  iterable: list
    .map((note, idx) => ({ note, idx }))
    .sort((a, b) => b.note.length - a.note.length),
}))

function remainder(num: number, div: number) {
  while (num < 0) num += div
  while (num >= div) num -= div
  return num
}

function transposeChord(chord: string, transposition: number) {
  for (const list of iterableNotes) {
    for (const note of list.iterable) {
      if (chord.startsWith(note.note)) {
        return chord.replace(
          note.note,
          list.list[remainder(note.idx + transposition, list.iterable.length)],
        )
      }
    }
  }
  return chord
}

export function Chord({ children }: { children: string }) {
  const { transpose, web } = usePDFSettings()
  const onChordPress = web?.onChordPress
  return (
    <Text style={{ position: 'absolute', zIndex: 1 }}>
      {children.split(/ /).map((chord, index) => {
        const transposed = transposeChord(chord, transpose)
        return (
          <>
            {index !== 0 ? ' ' : null}
            {onChordPress ? (
              <Pressable onPress={() => onChordPress(transposed)}>
                <Text>{transposed}</Text>
              </Pressable>
            ) : (
              transposed
            )}
          </>
        )
      })}
    </Text>
  )
}
