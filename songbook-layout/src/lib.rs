#![allow(unused)]

mod data;
mod layout_song;

pub use data::{Item, Layout};
use std::io::Read;

use parley::fontique::Blob;
use parley::fontique::FallbackKey;
use parley::fontique::FontInfoOverride;

use songbook_grammar::Song;

pub struct LayoutEngine {
    pub(crate) font_cx: parley::FontContext,
}

impl LayoutEngine {
    pub fn new() -> LayoutEngine {
        LayoutEngine {
            font_cx: parley::FontContext::new(),
        }
    }

    pub fn run(self: &mut Self, parsed: &Song) -> Layout {
        let layout = layout_song::layout_song(&parsed, &mut self.font_cx);
        layout
    }

    pub fn register_fonts(self: &mut Self, data: Vec<u8>, name: &str) {
        let info_override = FontInfoOverride {
            family_name: Some(name),
            width: None,
            style: None,
            weight: None,
            axes: None,
        };
        let ttf = match data.get(0..4) {
            Some(b"wOF2") => wuff::decompress_woff2(&data).unwrap(),
            Some(b"wOFF") => wuff::decompress_woff1(&data).unwrap(),
            _ => data,
        };
        let info = self
            .font_cx
            .collection
            .register_fonts(ttf.into(), Some(info_override));
    }
}
