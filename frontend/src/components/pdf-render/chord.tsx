import { getChordDefinition } from "components/chord-help";
import { Fragment } from "react";
import { Pressable } from "react-native";

import { usePDFSettings } from "./pdf-settings";
import { Text } from "./primitives";

const notes = [
  ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H"],
  ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "B", "H"],
];

const iterableNotes = notes.map((list) => ({
  list,
  iterable: list
    .map((note, idx) => ({ note, idx }))
    .sort((a, b) => b.note.length - a.note.length),
}));

function remainder(num: number, div: number) {
  while (num < 0) num += div;
  while (num >= div) num -= div;
  return num;
}

function transposeChord(chord: string, transposition: number) {
  for (const list of iterableNotes) {
    for (const note of list.iterable) {
      if (chord.startsWith(note.note)) {
        return chord.replace(
          note.note,
          list.list[remainder(note.idx + transposition, list.iterable.length)]
        );
      }
    }
  }
  return chord;
}

export function Chord({
  children,
  spacer = false,
}: {
  children: string;
  spacer?: boolean;
}) {
  const { transpose, web } = usePDFSettings();
  const onChordPress = spacer ? null : web?.onChordPress;
  const normal = children.startsWith('^') || children.startsWith('_^')
  return (
    <Text
      style={[
        spacer ? { opacity: 0 } : { position: "absolute", zIndex: 1 },
        { fontWeight: normal ? "normal" : "bold", fontFamily:  "AtkinsonHyperlegible", fontStyle: "normal" },
        { marginBottom: -20 },
      ]}
    >
      {children.split(/ /).map((chord, index) => {
        const transposed = transposeChord(chord, transpose);
        return (
          <Fragment key={index}>
            {index !== 0 ? " " : null}
            {onChordPress && getChordDefinition(transposed).def ? (
              <Pressable
                onPress={() => onChordPress(transposed)}
                style={{
                  paddingHorizontal: 5,
                  marginHorizontal: -5,
                  paddingVertical: 10,
                  marginVertical: -10,
                }}
              >
                <Text>{transposed}</Text>
              </Pressable>
            ) : (
              transposed
            )}
          </Fragment>
        );
      })}
    </Text>
  );
}
