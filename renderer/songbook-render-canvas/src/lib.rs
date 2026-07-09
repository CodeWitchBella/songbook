#![allow(unused)]

mod render_song;
mod utils;

use std::io::Read;

use anyhow::Context;
use bytes::Bytes;
use piet::RenderContext;
use piet_web::WebRenderContext;
use songbook_layout::Layout;
use songbook_layout::LayoutEngine;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, window};

use songbook_grammar::Song;

#[wasm_bindgen]
pub fn hook() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

#[wasm_bindgen]
pub fn parse(song: &str) {
    let deserialized = Song::parse(&song);
    // console_log!("{deserialized:#?}");
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
    pub fn run(self: &mut Self, song: &str) -> Result<(), wasm_bindgen::JsError> {
        let parsed = Song::parse(&song).context("Song::parse failed").unwrap();
        let layout = self.layout_engine.run(&parsed, None);
        Ok(run_anyhow(song, self, &layout).unwrap())
    }

    #[wasm_bindgen]
    pub fn register_fonts(self: &mut Self, data: &js_sys::Uint8Array, name: &str) {
        let mut data = data.to_vec();
        self.layout_engine.register_fonts(data, name);
    }
}

fn run_anyhow(song: &str, r: &mut Renderer, layout: &Layout) -> anyhow::Result<()> {
    let window = window().unwrap();
    let canvas = window
        .document()
        .unwrap()
        .get_element_by_id("canvas")
        .unwrap()
        .dyn_into::<HtmlCanvasElement>()
        .unwrap();
    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    // let sample = samples::get::<WebRenderContext>(SAMPLE_PICTURE_NO).unwrap();
    let dpr = window.device_pixel_ratio();
    canvas.set_width((canvas.offset_width() as f64 * dpr) as u32);
    canvas.set_height((canvas.offset_height() as f64 * dpr) as u32);
    let _ = context.scale(dpr, dpr);

    let mut piet_context = WebRenderContext::new(context, window);

    let parsed = Song::parse(&song).context("Song::parse failed")?;
    // console_log!("{parsed:?}");
    let mut font_cx = parley::FontContext::new();
    render_song::draw(&mut piet_context, &layout).unwrap();
    piet_context.finish().unwrap();

    Ok(())
}
