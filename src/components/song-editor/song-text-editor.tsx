/** @jsxImportSource @emotion/react */

import * as monaco from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'
import { tokenizeLine } from 'utils/song-parser/my-format'

let wasSetup = false
function setup() {
  if (wasSetup) return
  wasSetup = true
  // Register a new language
  monaco.languages.register({ id: 'song' })

  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider('song', {
    tokenizer: {
      root: [
        [/^R[0-9]:/, 'label'],
        [/\[[^\]]+\]/, 'chord'],
        [/--- page break ---/, 'page-break'],
        [/^[RS]:/, 'label'],
      ],
    },
  })

  monaco.languages.setMonarchTokensProvider('none', {
    tokenizer: {},
  })

  // Define a new theme that contains only rules that match this language
  monaco.editor.defineTheme('song-theme', {
    base: 'vs',
    inherit: false,
    colors: {},
    rules: [
      { token: 'chord', foreground: '000088', background: '00ff00' },
      { token: 'label', fontStyle: 'bold' },
      { token: 'page-break', fontStyle: 'italic bold' },
    ],
  })
}

function resetLayout(
  editor: monaco.editor.IStandaloneCodeEditor,
  el: HTMLDivElement | null,
) {
  const model = editor.getModel()
  if (model && el) {
    const height = model.getLineCount() * 19 + 30
    if (el.style.height !== height + 'px') {
      el.style.height = height + 'px'
      editor.layout({
        height: height,
        width: el.clientWidth,
      })
    }
  }
}

function useEditorFitContent(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  element: HTMLDivElement | null,
) {
  useEffect(() => {
    if (!editor) return
    resetLayout(editor, element)
    const unsub = editor.onDidChangeModelDecorations(() => {
      setImmediate(() => {
        resetLayout(editor, element)
      })
    })
    return () => {
      unsub.dispose()
    }
  }, [editor, element])
}

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

function addMoveAction(
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

export function SongTextEditor(props: {
  initialValue: string
  onChange: (v: string) => void
  language: 'song' | 'none'
}) {
  useEffect(setup)
  const element = useRef<HTMLDivElement>(null)
  const initialValue = useRef(props.initialValue)
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    const editor = monaco.editor.create(element.current!, {
      theme: 'song-theme',
      value: initialValue.current,
      language: props.language,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 5,
      lineNumbersMinChars: 0,
    })
    addMoveAction('left', editor)
    addMoveAction('right', editor)

    setEditor(editor)

    return () => {
      editor.dispose()
    }
  }, [props.language])

  const onChange = props.onChange
  useEffect(() => {
    if (!editor) return
    let timeout: ReturnType<typeof setTimeout> | null = null
    const unsub = editor.onDidChangeModelContent(() => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        onChange(editor.getModel()!.getLinesContent().join('\n'))
      }, 250)
    })
    return () => {
      unsub.dispose()
      if (timeout) clearTimeout(timeout)
    }
  }, [editor, onChange])

  useEditorFitContent(editor, element.current)

  return <div ref={element} style={{ height: 500 }} />
}
