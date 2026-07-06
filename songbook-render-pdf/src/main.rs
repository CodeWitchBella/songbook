//! CLI: turn a song JSON (from `songs/`) into a PDF.
//!
//! Usage:
//!   render-pdf <input.json> [output.pdf]
//!
//! If no output path is given it defaults to the input path with a `.pdf`
//! extension.

use std::path::{Path, PathBuf};
use std::process::ExitCode;

use songbook_grammar::Song;
use songbook_layout::LayoutEngine;
use songbook_render_pdf::{Fonts, render_song};

/// Directory holding the fonts, relative to the crate.
const SONGS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../songs");

fn main() -> ExitCode {
    let mut args = std::env::args().skip(1);
    let Some(input) = args.next() else {
        eprintln!("usage: render-pdf <input.json> [output.pdf]");
        return ExitCode::FAILURE;
    };
    let input = PathBuf::from(input);
    let output = args
        .next()
        .map(PathBuf::from)
        .unwrap_or_else(|| input.with_extension("pdf"));

    let src = match std::fs::read_to_string(&input) {
        Ok(src) => src,
        Err(err) => {
            eprintln!("failed to read {}: {err}", input.display());
            return ExitCode::FAILURE;
        }
    };

    let song = match Song::parse(&src) {
        Ok(song) => song,
        Err(err) => {
            eprintln!("failed to parse {}: {err}", input.display());
            return ExitCode::FAILURE;
        }
    };

    let regular =
        std::fs::read(font_path("cantarell-regular.woff2")).expect("missing regular font");
    let bold = std::fs::read(font_path("cantarell-bold.woff2")).expect("missing bold font");

    let fonts = Fonts::new(regular.clone(), bold.clone());

    // The layout engine measures text with parley, so it needs the same fonts
    // registered under the "Cantarell" family it looks up.
    let mut engine = LayoutEngine::new();
    engine.register_fonts(regular, "Cantarell");
    engine.register_fonts(bold, "Cantarell");

    let pdf = render_song(&song, &fonts, &mut engine);

    if let Err(err) = std::fs::write(&output, pdf) {
        eprintln!("failed to write {}: {err}", output.display());
        return ExitCode::FAILURE;
    }

    println!("wrote {}", output.display());
    ExitCode::SUCCESS
}

fn font_path(name: &str) -> PathBuf {
    Path::new(SONGS_DIR).join(name)
}
