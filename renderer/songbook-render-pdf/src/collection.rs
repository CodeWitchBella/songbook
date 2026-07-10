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
use std::time::Instant;

use icu_collator::{Collator, CollatorBorrowed, options::CollatorOptions};
use icu_locale_core::locale;
use serde::Deserialize;

use songbook_grammar::Song;
use songbook_render_pdf::{impose_booklet, render_collection_with, setup};

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
    let mut args = std::env::args().skip(1).peekable();
    let toc_only = matches!(args.peek().map(String::as_str), Some("--toc-only"));
    if toc_only {
        args.next();
    }
    let booklet = matches!(args.peek().map(String::as_str), Some("--booklet"));
    if booklet {
        args.next();
    }
    let Some(input) = args.next() else {
        eprintln!("usage: render-collection [--toc-only] [--booklet] <collection.json>");
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

    let mut collection: Collection = match serde_json::from_str(&src) {
        Ok(collection) => collection,
        Err(err) => {
            eprintln!("failed to parse collection {}: {err}", input.display());
            return ExitCode::FAILURE;
        }
    };

    let sort_start = Instant::now();
    let collator: CollatorBorrowed =
        Collator::try_new(locale!("cs").into(), CollatorOptions::default())
            .expect("Czech collation data is compiled in");
    collection
        .data
        .song_list
        .sort_by(|a, b| collator.compare(&a.title, &b.title));
    let sort_elapsed = sort_start.elapsed();

    // Load and parse every song up front so a bad song fails loudly rather than
    // producing a silently incomplete PDF.
    let parse_start = Instant::now();
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
    let parse_elapsed = parse_start.elapsed();

    let setup_start = Instant::now();
    let (fonts, mut engine) = setup(
        std::fs::read(font_path("cantarell-regular.woff2")).expect("missing regular font"),
        std::fs::read(font_path("cantarell-bold.woff2")).expect("missing bold font"),
        std::fs::read(font_path("atkinson-hyperlegible-regular.woff2"))
            .expect("missing chord regular font"),
        std::fs::read(font_path("atkinson-hyperlegible-bold.woff2"))
            .expect("missing chord bold font"),
    );
    let setup_elapsed = setup_start.elapsed();

    let render_start = Instant::now();
    let pdf = render_collection_with(
        &collection.data.name,
        &songs,
        &fonts,
        &mut engine,
        toc_only,
        booklet,
        |index, layout, render| {
            eprintln!(
                "  song {:>3}: layout {:>7.1?}, render {:>7.1?}  \"{}\"",
                index + 1,
                layout,
                render,
                collection.data.song_list[index].title,
            );
        },
    );
    let render_elapsed = render_start.elapsed();

    let pdf = if booklet { impose_booklet(pdf) } else { pdf };

    let write_start = Instant::now();
    if let Err(err) = std::fs::write(&output, pdf) {
        eprintln!("failed to write {}: {err}", output.display());
        return ExitCode::FAILURE;
    }
    let write_elapsed = write_start.elapsed();

    println!(
        "wrote {} ({} songs from \"{}\")",
        output.display(),
        songs.len(),
        collection.data.name
    );
    eprintln!(
        "timings: sort {:.1?}, parse {:.1?}, setup {:.1?}, render {:.1?}, write {:.1?}, total {:.1?}",
        sort_elapsed,
        parse_elapsed,
        setup_elapsed,
        render_elapsed,
        write_elapsed,
        sort_elapsed + parse_elapsed + setup_elapsed + render_elapsed + write_elapsed,
    );
    ExitCode::SUCCESS
}

fn font_path(name: &str) -> PathBuf {
    Path::new(SONGS_DIR).join(name)
}
