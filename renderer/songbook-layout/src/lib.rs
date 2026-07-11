#![allow(unused)]

mod data;
mod layout_song;

pub use data::{Item, ItemType, Layout};
pub use layout_song::{CHORD_FONT_FAMILY, LYRIC_FONT_FAMILY};
use std::io::Read;

/// Decompress a font blob into raw TTF/OTF bytes, sniffing woff1/woff2 by their
/// magic number and passing through anything already uncompressed.
pub fn decompress_font(data: Vec<u8>) -> Vec<u8> {
    match data.get(0..4) {
        Some(b"wOF2") => wuff::decompress_woff2(&data).unwrap(),
        Some(b"wOFF") => wuff::decompress_woff1(&data).unwrap(),
        _ => data,
    }
}

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

    /// Lay out the song. `viewport` is the usable content area of the target
    /// page; pass `None` for renderers without a fixed page size. `show_header`
    /// controls whether space is reserved for a title/author header at all;
    /// pass `false` for renderers that draw their own header outside the
    /// layout. `continuous` enables chords over every verse instead of
    /// honouring `[> chords off]`.
    pub fn run(
        self: &mut Self,
        parsed: &Song,
        viewport: Option<(f64, f64)>,
        show_header: bool,
        continuous: bool,
    ) -> Layout {
        let layout = layout_song::layout_song(
            &parsed,
            &mut self.font_cx,
            viewport,
            show_header,
            continuous,
        );
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
        let ttf = decompress_font(data);
        let info = self
            .font_cx
            .collection
            .register_fonts(ttf.into(), Some(info_override));
    }
}
