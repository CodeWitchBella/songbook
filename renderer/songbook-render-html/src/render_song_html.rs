use std::collections::HashMap;

use anyhow::anyhow;

use songbook_grammar::Song;
use songbook_layout::{ItemType, Layout};

pub fn draw(song: &Layout) -> anyhow::Result<String> {
    let mut out: String = Default::default();
    out.push_str(r#"<div style="width:100%;max-width:65ch;height:100%;position:relative;font-family:Cantarell">"#);
    out.push_str(r#"<template shadowrootmode="open">"#);
    // Chord color comes from the `--chord-color` custom property (set in
    // frontend/src/index.css), which inherits across the shadow boundary in
    // every browser; light mode matches songbook-render-pdf's chord_fill()
    // (`#993300`), dark mode matches origin/main's PDF dark chord color, from
    // frontend/src/components/themed.tsx (`#EE0`).
    out.push_str(r#"<style>button{font-weight:bold;user-select:none;cursor:pointer;padding:0;background:unset;border:unset;color:var(--chord-color,#930)}</style>"#);
    // Callers that pass `show_header: false` to `LayoutEngine::run` get a
    // layout with no header items at all, so this loop never sees
    // `ItemType::Header` in that case; they draw their own title/author
    // header separately (see WasmSongLook).
    for item in song.items.iter() {
        // Chords stay interactive (buttons); everything else is a plain div.
        let interactive = matches!(item.item_type, ItemType::Chord | ItemType::ChordNormal);
        if interactive {
            out.push_str(r#"<button style=""#);
        } else {
            out.push_str(r#"<div style=""#);
        }
        let weight = if item.item_type.is_bold() {
            "bold"
        } else {
            "normal"
        };
        let font_family = if interactive {
            "Atkinson Hyperlegible"
        } else {
            "Cantarell"
        };
        // `item.pos.1` is the text baseline (see `Item::pos`'s doc comment),
        // but a `<div>`/`<button>` is anchored at its own top edge, with the
        // baseline sitting `ascent` below that. Shift `top` up by `ascent` and
        // pin `line-height` to the item's own natural ascent+descent (rather
        // than inheriting the host page's line-height, which crosses the
        // shadow boundary since it's an inherited CSS property) so the glyph
        // baseline lands back exactly at `item.pos.1`.
        out.push_str(&format!(
            r#"position:absolute;left:{}px;top:{}px;line-height:{}px;font-size:{}px;font-weight:{};font-family:'{}';white-space:pre;">"#,
            item.pos.0,
            item.pos.1 - item.ascent,
            item.ascent + item.descent,
            item.font_size,
            weight,
            font_family
        ));
        out.push_str(&item.text);
        if interactive {
            out.push_str(r#"</button>"#);
        } else {
            out.push_str(r#"</div>"#);
        }
    }
    out.push_str(r#"</template>"#);
    out.push_str("</div>");

    Ok(out)
}
