//! CLI: turn a collection JSON (from `collections/`) into a single multi-page
//! PDF, one song after another with each song starting on a fresh page.
//!
//! Usage:
//!   render-collection <collection.json>
//!
//! The collection lists its songs by slug (see `data.songList`); each song is
//! read from `songs/<slug>.json`. The PDF is always written next to the
//! collection JSON, with the same name and a `.pdf` extension.

use std::path::{Path, PathBuf};
use std::process::ExitCode;

use serde::Deserialize;

use songbook_grammar::Song;
use songbook_render_pdf::{render_collection, setup};

/// Directory holding the fonts and per-song JSON, relative to the crate.
const SONGS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../songs");

/// Just enough of the collection response to reach the song slugs.
#[derive(Deserialize)]
struct Collection {
    data: CollectionData,
}

#[derive(Deserialize)]
struct CollectionData {
    name: String,
    #[serde(rename = "songList")]
    song_list: Vec<CollectionSong>,
}

#[derive(Deserialize)]
struct CollectionSong {
    slug: String,
    title: String,
}

fn main() -> ExitCode {
    let mut args = std::env::args().skip(1);
    let Some(input) = args.next() else {
        eprintln!("usage: render-collection <collection.json>");
        return ExitCode::FAILURE;
    };
    let input = PathBuf::from(input);
    // Always write the PDF next to the collection JSON.
    let output = input.with_extension("pdf");

    let src = match std::fs::read_to_string(&input) {
        Ok(src) => src,
        Err(err) => {
            eprintln!("failed to read {}: {err}", input.display());
            return ExitCode::FAILURE;
        }
    };

    let collection: Collection = match serde_json::from_str(&src) {
        Ok(collection) => collection,
        Err(err) => {
            eprintln!("failed to parse collection {}: {err}", input.display());
            return ExitCode::FAILURE;
        }
    };

    // Load and parse every song up front so a bad song fails loudly rather than
    // producing a silently incomplete PDF.
    let mut songs = Vec::with_capacity(collection.data.song_list.len());
    for entry in &collection.data.song_list {
        let path = Path::new(SONGS_DIR).join(format!("{}.json", entry.slug));
        let song_src = match std::fs::read_to_string(&path) {
            Ok(src) => src,
            Err(err) => {
                eprintln!(
                    "failed to read song \"{}\" ({}): {err}",
                    entry.title,
                    path.display()
                );
                return ExitCode::FAILURE;
            }
        };
        match Song::parse(&song_src) {
            Ok(song) => songs.push(song),
            Err(err) => {
                eprintln!("failed to parse song \"{}\": {err}", entry.title);
                return ExitCode::FAILURE;
            }
        }
    }

    let (fonts, mut engine) = setup(
        std::fs::read(font_path("cantarell-regular.woff2")).expect("missing regular font"),
        std::fs::read(font_path("cantarell-bold.woff2")).expect("missing bold font"),
        std::fs::read(font_path("atkinson-hyperlegible-regular.woff2"))
            .expect("missing chord regular font"),
        std::fs::read(font_path("atkinson-hyperlegible-bold.woff2"))
            .expect("missing chord bold font"),
    );

    let pdf = render_collection(&songs, &fonts, &mut engine);

    if let Err(err) = std::fs::write(&output, pdf) {
        eprintln!("failed to write {}: {err}", output.display());
        return ExitCode::FAILURE;
    }

    println!(
        "wrote {} ({} songs from \"{}\")",
        output.display(),
        songs.len(),
        collection.data.name
    );
    ExitCode::SUCCESS
}

fn font_path(name: &str) -> PathBuf {
    Path::new(SONGS_DIR).join(name)
}
