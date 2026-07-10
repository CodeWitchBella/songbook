//! WASM bindings, so the frontend can generate collection PDFs in-browser
//! with the same krilla-based renderer used by the native CLI, instead of
//! going through @react-pdf/renderer.

use wasm_bindgen::prelude::*;

use songbook_grammar::Song;

use crate::{Fonts, render_collection, setup};
use songbook_layout::LayoutEngine;

#[wasm_bindgen]
pub fn hook() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub struct Renderer {
    fonts: Fonts,
    engine: LayoutEngine,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new(
        regular: js_sys::Uint8Array,
        bold: js_sys::Uint8Array,
        chord_regular: js_sys::Uint8Array,
        chord_bold: js_sys::Uint8Array,
    ) -> Renderer {
        let (fonts, engine) = setup(
            regular.to_vec(),
            bold.to_vec(),
            chord_regular.to_vec(),
            chord_bold.to_vec(),
        );
        Renderer { fonts, engine }
    }

    /// Renders a whole collection PDF from `songs`, each entry being the JSON
    /// produced by the frontend's `song.grammar` parser (the same shape as
    /// `renderer/songs/*.json`), one song per fresh page.
    #[wasm_bindgen(js_name = renderCollection)]
    pub fn render_collection(&mut self, songs: Vec<String>) -> Result<js_sys::Uint8Array, JsError> {
        let songs = songs
            .iter()
            .map(|src| Song::parse(src).map_err(|err| JsError::new(&err.to_string())))
            .collect::<Result<Vec<Song>, JsError>>()?;

        let pdf = render_collection(&songs, &self.fonts, &mut self.engine);
        Ok(js_sys::Uint8Array::from(pdf.as_slice()))
    }
}
