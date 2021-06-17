import * as monaco from 'monaco-editor'
import { tokenizeLine } from 'utils/song-parser/my-format'

function moveChord(dir: 'left' | 'right', ed: monaco.editor.ICodeEditor) {
  const position = ed.getPosition()
  const model = ed.getModel()
  if (!position || !model) return
  const line = model.getLineContent(position.lineNumber)
  const parsed = tokenizeLine(line)

  let chars = 0
  let i = 0
  for (; i < parsed.length; i++) {
    chars += parsed[i].value.length
    if (chars >= position.column) break
  }

  if (parsed[i].type !== 'chord') return
  const sibling = parsed[i + (dir === 'left' ? -1 : 1)]
  if (!sibling || sibling.type !== 'text') return
  const startColumn = chars - parsed[i].value.length
  if (dir === 'left') {
    model.pushEditOperations(
      [],
      [
        {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn,
            endColumn: startColumn + 1,
          },
          text: '',
        },
        {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: chars + 1,
            endColumn: chars + 1,
          },
          text: sibling.value[sibling.value.length - 1],
        },
      ],
      () => null,
    )
  } else {
    model.pushEditOperations(
      [],
      [
        {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: startColumn + 1,
            endColumn: startColumn + 1,
          },
          text: sibling.value[0],
        },
        {
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: chars + 1,
            endColumn: chars + 2,
          },
          text: '',
        },
      ],
      () => null,
    )
  }
}

export function addMoveAction(
  dir: 'left' | 'right',
  editor: monaco.editor.IStandaloneCodeEditor,
) {
  editor.addAction({
    id: 'move-chord-' + dir,
    label: 'Move chord ' + dir,
    keybindings: [
      monaco.KeyMod.CtrlCmd |
        (dir === 'left' ? monaco.KeyCode.KEY_H : monaco.KeyCode.KEY_L),
    ],

    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,

    run: (ed) => {
      moveChord(dir, ed)
    },
  })
}

function deleteChordsInLine(
  ed: monaco.editor.IStandaloneCodeEditor,
  line: string,
  range: { lineNumber: number; start: number; end: number },
) {
  const model = ed.getModel()
  if (!model) return

  const parsed = tokenizeLine(line)

  model.pushEditOperations(
    [],
    parsed
      .filter((token) => {
        if (token.type !== 'chord') return false
        if (range.start === range.end) {
          return (
            range.start >= token.index &&
            range.start <= token.index + token.value.length
          )
        }
        return (
          token.index >= range.start &&
          token.index + token.value.length <= range.end
        )
      })
      .map((token) => ({
        range: {
          startLineNumber: range.lineNumber,
          endLineNumber: range.lineNumber,
          startColumn: token.index + 1,
          endColumn: token.index + token.value.length + 1,
        },
        text: '',
      })),
    () => null,
  )
}

export function addDeleteChordAction(
  editor: monaco.editor.IStandaloneCodeEditor,
) {
  editor.addAction({
    id: 'delete-chord',
    label: 'Delete chord',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_D],

    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1.5,

    run: (ed) => {
      const selections = ed.getSelections()
      const model = ed.getModel()
      if (!selections || !model) return
      for (const selection of selections) {
        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()
        for (
          let lineNumber = startPosition.lineNumber;
          lineNumber <= endPosition.lineNumber;
          lineNumber++
        ) {
          const line = model.getLineContent(lineNumber)
          deleteChordsInLine(editor, line, {
            lineNumber,
            start:
              lineNumber === startPosition.lineNumber
                ? startPosition.column - 1
                : 0,
            end:
              lineNumber === endPosition.lineNumber
                ? endPosition.column - 1
                : line.length,
          })
        }
      }
    },
  })
}
