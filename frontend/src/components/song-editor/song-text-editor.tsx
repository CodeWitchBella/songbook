import { useColors } from 'components/themed'
import * as monaco from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'

import { addDeleteChordAction, addMoveAction } from './song-editor-actions'

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
  monaco.editor.defineTheme('song-theme-dark', {
    base: 'vs-dark',
    inherit: true,
    colors: {},
    rules: [
      { token: 'chord', foreground: '8888ff', background: 'ff88ff' },
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
      Promise.resolve().then(() => {
        resetLayout(editor, element)
      })
    })
    return () => {
      unsub.dispose()
    }
  }, [editor, element])
}

export function SongTextEditor(props: {
  initialValue: string
  onChange: (v: string) => void
  language: 'song' | 'none'
}) {
  const { dark } = useColors()
  const initialDark = useRef(dark)
  useEffect(setup)
  const element = useRef<HTMLDivElement>(null)
  const initialValue = useRef(props.initialValue)
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    const editor = monaco.editor.create(element.current!, {
      theme: initialDark.current ? 'song-theme-dark' : 'song-theme',
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
    addDeleteChordAction(editor)

    setEditor(editor)

    return () => {
      editor.dispose()
    }
  }, [props.language])

  useEffect(() => {
    editor?.updateOptions({ theme: dark ? 'song-theme-dark' : 'song-theme' })
  }, [dark, editor])

  const onChange = useLastRef(props.onChange)
  useEffect(() => {
    if (!editor) return
    const model = editor.getModel()
    if (!model) return

    let timeout: ReturnType<typeof setTimeout> | null = null
    const unsub = model.onDidChangeContent((event) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        timeout = null
        onChange.current(model.getValue(monaco.editor.EndOfLinePreference.LF))
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

function useLastRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
