#![allow(unused)]

mod data;
mod layout_song;

pub use data::{Item, Layout};
use std::io::Read;

use bytes::Bytes;
use parley::fontique::Blob;
use parley::fontique::FallbackKey;
use parley::fontique::FontInfoOverride;
use woff2_patched::decode::{convert_woff2_to_ttf, is_woff2};

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
        let info = if is_woff2(&data) {
            let mut bytes: Bytes = data.into();
            let ttf = convert_woff2_to_ttf(&mut bytes).unwrap();
            self.font_cx
                .collection
                .register_fonts(ttf.into(), Some(info_override))
        } else {
            self.font_cx
                .collection
                .register_fonts(data.to_vec().into(), Some(info_override))
        };
    }
}
