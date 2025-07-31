#![allow(unused)]

mod layout_song;
mod render_pdf;
mod render_song;
mod song_layout;
mod utils;

use anyhow::Context;
use piet::RenderContext;
use piet_web::WebRenderContext;
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use web_sys::{HtmlCanvasElement, window};

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
pub fn run(song: &str) -> Result<(), wasm_bindgen::JsError> {
    Ok(run_anyhow(song).unwrap())
    //Ok(run_anyhow(song).map_err(|e| JsError::new(&format!("{e:?}")))?)
}

fn run_anyhow(song: &str) -> anyhow::Result<()> {
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
    let song = layout_song::layout_song(&parsed)?;
    render_song::draw(&mut piet_context, &song).unwrap();
    piet_context.finish().unwrap();

    Ok(())
}
