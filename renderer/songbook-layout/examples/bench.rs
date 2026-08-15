//! Time the layout of every song in `songs/`, auto-fitted to a phone-sized
//! viewport — i.e. what the frontend does on every render.
//! Usage: cargo run --release -p songbook-layout --example bench
use songbook_grammar::Song;
use songbook_layout::{CHORD_FONT_FAMILY, FontSizing, LYRIC_FONT_FAMILY, LayoutEngine};

const SONGS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../songs");

fn main() {
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

    let mut songs = vec![];
    for entry in std::fs::read_dir(SONGS_DIR).unwrap() {
        let path = entry.unwrap().path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let src = std::fs::read_to_string(&path).unwrap();
            if let Ok(song) = Song::parse(&src) {
                songs.push((path.file_name().unwrap().to_owned(), song));
            }
        }
    }
    songs.sort_by(|a, b| a.0.cmp(&b.0));

    // Each scenario exercises a different branch of the size search: a phone
    // where songs mostly shrink, a narrow strip where they bottom out at the
    // minimal size and wrap, and a wide window where they grow past the ideal
    // size into several columns.
    let scenarios: [(&str, (f64, f64), FontSizing); 3] = [
        ("phone   ", (388.0, 740.0), FontSizing::default()),
        (
            "narrow  ",
            (220.0, 480.0),
            FontSizing {
                minimal_font_size: 8.0,
                ..FontSizing::default()
            },
        ),
        ("wide    ", (1350.0, 840.0), FontSizing::default()),
    ];

    for (label, viewport, sizing) in scenarios {
        let mut slowest: Vec<(u128, String, f64)> = vec![];
        let start = std::time::Instant::now();
        for (name, song) in &songs {
            let one = std::time::Instant::now();
            let layout = engine.run(song, Some(viewport), false, false, Some(sizing));
            slowest.push((
                one.elapsed().as_micros(),
                name.to_string_lossy().into_owned(),
                layout.font_size,
            ));
        }
        let total = start.elapsed();
        slowest.sort_by(|a, b| b.0.cmp(&a.0));
        let (worst, worst_name, _) = &slowest[0];
        println!(
            "{label} {:>5.1} ms/song   worst {:>5.1} ms ({worst_name})   sizes {:.1}–{:.1} px",
            total.as_secs_f64() * 1000.0 / songs.len() as f64,
            *worst as f64 / 1000.0,
            slowest.iter().map(|s| s.2).fold(f64::INFINITY, f64::min),
            slowest.iter().map(|s| s.2).fold(0.0, f64::max),
        );
    }
}
