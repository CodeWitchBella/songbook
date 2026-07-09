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
use songbook_render_pdf::{render_song, setup};

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

    let (fonts, mut engine) = setup(
        std::fs::read(font_path("cantarell-regular.woff2")).expect("missing regular font"),
        std::fs::read(font_path("cantarell-bold.woff2")).expect("missing bold font"),
        std::fs::read(font_path("atkinson-hyperlegible-regular.woff2"))
            .expect("missing chord regular font"),
        std::fs::read(font_path("atkinson-hyperlegible-bold.woff2"))
            .expect("missing chord bold font"),
    );

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
