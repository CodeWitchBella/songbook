#![allow(unused)]

mod render_song_html;

use anyhow::Context;
use songbook_grammar::Song;
use songbook_layout::{FontSizing, LayoutEngine, RepeatedChords};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

#[wasm_bindgen]
pub fn hook() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub fn parse(song: &str) {
    let deserialized = Song::parse(&song);
    // console_log!("{deserialized:#?}");
}

/// How `jsonify`/`htmlify` callers ask for repeated sections' chords to be
/// handled: 0 keeps them, 1 drops them when that's what it takes to fit, 2
/// always drops them. Anything else keeps them.
fn repeated_chords_from(value: u8) -> RepeatedChords {
    match value {
        1 => RepeatedChords::WhenNeeded,
        2 => RepeatedChords::Always,
        _ => RepeatedChords::Keep,
    }
}

#[wasm_bindgen]
pub struct Renderer {
    pub(crate) layout_engine: LayoutEngine,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Renderer {
        Renderer {
            layout_engine: LayoutEngine::new(),
        }
    }

    #[wasm_bindgen]
    pub fn jsonify(
        self: &mut Self,
        song: &str,
        width: f64,
        height: f64,
        show_header: bool,
        ideal_font_size: f32,
        minimal_font_size: f32,
        column_gap: f32,
        repeated_chords: u8,
    ) -> JsValue {
        let parsed = Song::parse(&song).context("Song::parse failed").unwrap();
        let layout = self.layout_engine.run(
            &parsed,
            Some((width, height)),
            show_header,
            Some(FontSizing {
                ideal_font_size,
                minimal_font_size,
                column_gap,
                repeated_chords: repeated_chords_from(repeated_chords),
            }),
        );
        serde_wasm_bindgen::to_value(&layout).unwrap()
    }

    #[wasm_bindgen]
    pub fn htmlify(
        self: &mut Self,
        song: &str,
        width: f64,
        height: f64,
        show_header: bool,
        ideal_font_size: f32,
        minimal_font_size: f32,
        column_gap: f32,
        repeated_chords: u8,
    ) -> String {
        let parsed = Song::parse(&song).context("Song::parse failed").unwrap();
        let layout = self.layout_engine.run(
            &parsed,
            Some((width, height)),
            show_header,
            Some(FontSizing {
                ideal_font_size,
                minimal_font_size,
                column_gap,
                repeated_chords: repeated_chords_from(repeated_chords),
            }),
        );
        let html = render_song_html::draw(&layout)
            .context("render_song_html::draw failed")
            .unwrap();
        html
    }

    #[wasm_bindgen]
    pub fn register_fonts(self: &mut Self, data: &js_sys::Uint8Array, name: &str) {
        let mut data = data.to_vec();
        self.layout_engine.register_fonts(data, name);
    }
}
