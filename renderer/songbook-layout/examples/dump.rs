//! Dump the laid-out items of a song JSON for inspection.
//! Usage: cargo run -p songbook-layout --example dump -- songs/foo.json [--fit [percent]]
//! `--fit` auto-fits the body font to the page instead of setting it at the
//! fixed base em, optionally with the minimal size at `percent` of the ideal
//! one (default 85).
use songbook_grammar::Song;
use songbook_layout::{CHORD_FONT_FAMILY, FontSizing, LYRIC_FONT_FAMILY, LayoutEngine};

const SONGS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../songs");

fn main() {
    let input = std::env::args().nth(1).expect("usage: dump <input.json>");
    let src = std::fs::read_to_string(&input).unwrap();
    let song = Song::parse(&src).unwrap();

    let mut engine = LayoutEngine::new();
    for (f, family) in [
        ("cantarell-regular.woff2", LYRIC_FONT_FAMILY),
        ("cantarell-bold.woff2", LYRIC_FONT_FAMILY),
        ("atkinson-hyperlegible-regular.woff2", CHORD_FONT_FAMILY),
        ("atkinson-hyperlegible-bold.woff2", CHORD_FONT_FAMILY),
    ] {
        let data = std::fs::read(format!("{SONGS_DIR}/{f}")).unwrap();
        engine.register_fonts(data, family);
    }

    // `--fit N`: auto-fit with the minimal size at N% of the ideal one.
    let mut args = std::env::args();
    let minimal_ratio = args
        .find(|arg| arg == "--fit")
        .and(args.next())
        .and_then(|arg| arg.parse::<f32>().ok());
    let sizing = std::env::args()
        .any(|arg| arg == "--fit")
        .then(|| FontSizing {
            minimal_font_size: 16.0 * minimal_ratio.unwrap_or(85.0) / 100.0,
            ..FontSizing::default()
        });
    let layout = engine.run(&song, Some((363.53, 539.28)), true, false, sizing);
    println!("font size: {}", layout.font_size);
    for item in &layout.items {
        println!(
            "{:>8.1},{:>7.1}  {:<12} {:?}",
            item.pos.0,
            item.pos.1,
            format!("{:?}", item.item_type),
            item.text
        );
    }
}
