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
