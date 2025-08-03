#![allow(unused)]

mod layout_song;
mod render_pdf;
mod render_song;
mod song_layout;
mod utils;
mod layout_song_naive;

use std::io::Read;

use anyhow::Context;
use bytes::Bytes;
use parley::fontique::Blob;
use parley::fontique::FallbackKey;
use parley::fontique::FontInfoOverride;
use piet::RenderContext;
use piet_web::WebRenderContext;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, window};
use woff2_patched::decode::{convert_woff2_to_ttf, is_woff2};

use songbook_grammar::Song;

use crate::song_layout::Layout;

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
    pub(crate) font_cx: parley::FontContext,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Renderer {
        Renderer {
            font_cx: parley::FontContext::new(),
        }
    }

    #[wasm_bindgen]
    pub fn run(self: &mut Self, song: &str) -> Result<(), wasm_bindgen::JsError> {
        Ok(run_anyhow(song, self).unwrap())
    }

    #[wasm_bindgen]
    pub fn register_fonts(self: &mut Self, data: &js_sys::Uint8Array, name: &str) {
        let info_override = FontInfoOverride {
            family_name: Some(name),
            width: None,
            style: None,
            weight: None,
            axes: None,
        };
        let mut data = data.to_vec();
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

        console_log!("registered: {info:?}");
    }
}

fn run_anyhow(song: &str, r: &mut Renderer) -> anyhow::Result<()> {
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
    console_log!("{parsed:?}");
    let mut font_cx = parley::FontContext::new();
    // font_cx.collection.append_generic_families(generic, families);
    let song = layout_song::layout_song(&parsed, &mut r.font_cx)?;
    render_song::draw(&mut piet_context, &song).unwrap();
    piet_context.finish().unwrap();

    Ok(())
}
