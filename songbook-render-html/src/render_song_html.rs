use std::collections::HashMap;

use anyhow::anyhow;

use songbook_grammar::Song;
use songbook_layout::{ItemType, Layout};

pub fn draw(song: &Layout) -> anyhow::Result<String> {
    let mut out: String = Default::default();
    out.push_str(r#"<div style="width:100%;max-width:65ch;height:100%;position:relative;font-family:Cantarell">"#);
    out.push_str(r#"<template shadowrootmode="open">"#);
    out.push_str(r#"<style>button{font-weight:bold;user-select:none;cursor:pointer;padding:0;background:unset;border:unset}</style>"#);
    for item in song.items.iter() {
        let bold = matches!(item.item_type, ItemType::Chord | ItemType::Header);
        if bold {
            out.push_str(r#"<button style=""#);
        } else {
            out.push_str(r#"<div style=""#);
        }
        out.push_str(&format!(
            r#"position:absolute;left:{}px;top:{}px;">"#,
            item.pos.0, item.pos.1
        ));
        out.push_str(&item.text);
        if bold {
            out.push_str(r#"</button>"#);
        } else {
            out.push_str(r#"</div>"#);
        }
    }
    out.push_str(r#"</template>"#);
    out.push_str("</div>");

    Ok(out)
}
