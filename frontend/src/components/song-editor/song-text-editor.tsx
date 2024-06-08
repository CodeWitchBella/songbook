import {
  cursorSyntaxLeft,
  deleteCharBackward,
  selectSyntaxRight,
  simplifySelection,
} from "@codemirror/commands";
import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, Tag } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import type { EditorView, Extension } from "@uiw/react-codemirror";
import CodeMirror, {
  EditorSelection,
  keymap,
  Transaction,
} from "@uiw/react-codemirror";
import { useColors } from "components/themed";
import { useMemo } from "react";

// @ts-expect-error
import { parser } from "./song.grammar";

const t = {
  SectionStart: Tag.define(),
  File: Tag.define(),
  Chord: Tag.define(),
  PageBreak: Tag.define(),
};

const mkTheme = (dark: boolean) =>
  createTheme({
    theme: "light",
    settings: {
      background: dark ? "#1f1f1f" : "#ffffff",
      backgroundImage: "",
      foreground: dark ? "#d4d4d4" : "#000000",
      caret: dark ? "#d4d4d4" : "#AEAFAD",
      selection: dark ? "#264f78" : "#D6D6D6",
      selectionMatch: dark ? "#343a40" : "#EDEDED",
      gutterBackground: dark ? "#1f1f1f" : "#ffffff",
      gutterForeground: dark ? "#a1a1a1" : "#000000",
      gutterBorder: dark ? "#333333" : "#dddddd",
      gutterActiveForeground: "",
      lineHighlight: dark ? "#ffffff08" : "#00000008",
    },
    styles: [
      {
        tag: t.SectionStart,
        class: dark ? "text-green-300 font-black" : "text-green-800 font-black",
      },
      {
        tag: t.PageBreak,
        class: dark ? "text-green-300 font-black" : "text-green-800 font-black",
      },
      {
        tag: t.Chord,
        class: dark
          ? "text-blue-300 font-semibold"
          : "text-blue-800 font-semibold",
      },
    ],
  });

function songLang() {
  let parserWithMetadata = parser.configure({
    props: [styleTags(t)],
  });

  const exampleLanguage = LRLanguage.define({
    parser: parserWithMetadata,
    languageData: {},
  });

  return new LanguageSupport(exampleLanguage, [songExtension()]);
}

function songExtension(): Extension {
  return keymap.of([
    // Not Mod-h as Cmd-h by default hides the window, so we allow the usage of both
    { key: "Ctrl-h", run: moveLeft },
    { key: "Cmd-h", run: moveLeft },
    { key: "Ctrl-l", run: moveRight },
    { key: "Cmd-l", run: moveRight },
  ]);
  // this needs to be refactored to not break all the rules but it works
  function moveLeft(target: EditorView): boolean {
    cursorSyntaxLeft(target);
    selectSyntaxRight(target);
    const sel = target.state.selection.asSingle();
    const start = sel.ranges[0].from;
    const char = target.state.doc.slice(start - 1, start);
    if (char) {
      target.dispatch(
        target.state.update({
          changes: [
            { from: sel.ranges[0].to, insert: char },
            { from: start - 1, to: start },
          ],
        }),
      );
    }
    return true;
  }

  // this needs to be refactored to not break all the rules but it works
  function moveRight(target: EditorView): boolean {
    cursorSyntaxLeft(target);
    selectSyntaxRight(target);
    const sel = target.state.selection.asSingle();
    const end = sel.ranges[0].to;
    const char = target.state.doc.slice(end, end + 1);
    console.log({ char });
    if (char) {
      target.dispatch(
        target.state.update({
          changes: [
            { from: sel.ranges[0].from, insert: char },
            { from: end, to: end + 1 },
          ],
        }),
      );
    }
    return true;
  }
}

export function SongTextEditor(props: {
  initialValue: string;
  onChange: (v: string) => void;
  language: "song" | "none";
}) {
  const { dark } = useColors();

  return (
    <CodeMirror
      className="text-base"
      theme={useMemo(() => mkTheme(dark), [dark])}
      value={props.initialValue}
      onChange={(v) => props.onChange(v)}
      extensions={useMemo(() => [songLang()], [])}
    />
  );
}
