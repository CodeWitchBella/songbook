use krilla::Document;
use krilla::color::rgb;
use krilla::geom::Point;
use krilla::page::PageSettings;
use krilla::paint::{Fill, Paint};
use krilla::text::{Font, TextDirection};

use songbook_grammar::Song;
use songbook_layout::{ItemType, Layout, LayoutEngine};

pub struct Fonts {
    regular: Font,
    bold: Font,
    chord_regular: Font,
    chord_bold: Font,
}

impl Fonts {
    /// `regular`/`bold` are the lyric font (Cantarell); `chord_regular`/
    /// `chord_bold` are the chord font (Atkinson Hyperlegible), matching the
    /// frontend.
    pub fn new(
        regular: Vec<u8>,
        bold: Vec<u8>,
        chord_regular: Vec<u8>,
        chord_bold: Vec<u8>,
    ) -> Self {
        Self {
            regular: load_font(regular),
            bold: load_font(bold),
            chord_regular: load_font(chord_regular),
            chord_bold: load_font(chord_bold),
        }
    }
}

fn load_font(data: Vec<u8>) -> Font {
    let ttf = songbook_layout::decompress_font(data);
    Font::new(ttf.into(), 0).expect("failed to parse font")
}

/// Build a [`Fonts`] and a matching [`LayoutEngine`] from the four font blobs.
///
/// The layout engine measures text with parley, so it needs the same fonts
/// registered under the families it looks up: lyrics/tags/header in the lyric
/// family, chords in the chord family.
pub fn setup(
    regular: Vec<u8>,
    bold: Vec<u8>,
    chord_regular: Vec<u8>,
    chord_bold: Vec<u8>,
) -> (Fonts, LayoutEngine) {
    let fonts = Fonts::new(
        regular.clone(),
        bold.clone(),
        chord_regular.clone(),
        chord_bold.clone(),
    );

    let mut engine = LayoutEngine::new();
    engine.register_fonts(regular, songbook_layout::LYRIC_FONT_FAMILY);
    engine.register_fonts(bold, songbook_layout::LYRIC_FONT_FAMILY);
    engine.register_fonts(chord_regular, songbook_layout::CHORD_FONT_FAMILY);
    engine.register_fonts(chord_bold, songbook_layout::CHORD_FONT_FAMILY);

    (fonts, engine)
}

const MARGIN: f32 = 28.0;
const PAGE_WIDTH: f32 = 595.28;
const PAGE_HEIGHT: f32 = 841.89;

fn chord_fill() -> Fill {
    Fill {
        paint: Paint::from(rgb::Color::new(0x99, 0x33, 0x00)),
        ..Fill::default()
    }
}

pub fn render_song(song: &Song, fonts: &Fonts, engine: &mut LayoutEngine) -> Vec<u8> {
    let layout = layout_song(song, engine);
    render_layout(&layout, fonts)
}

/// Render a whole collection: each song is laid out independently and starts on
/// a fresh page, and all their pages are concatenated into one PDF.
pub fn render_collection(songs: &[Song], fonts: &Fonts, engine: &mut LayoutEngine) -> Vec<u8> {
    let mut document = Document::new();
    for song in songs {
        let layout = layout_song(song, engine);
        render_layout_into(&mut document, &layout, fonts);
    }
    document.finish().expect("failed to finish PDF")
}

/// Lay out a single song against the A4 content area.
fn layout_song(song: &Song, engine: &mut LayoutEngine) -> Layout {
    let content_width = (PAGE_WIDTH - 2.0 * MARGIN) as f64;
    let content_height = (PAGE_HEIGHT - 2.0 * MARGIN) as f64;
    engine.run(song, Some((content_width, content_height)))
}

/// Render an already computed [`Layout`] into PDF bytes across A4 pages.
pub fn render_layout(layout: &Layout, fonts: &Fonts) -> Vec<u8> {
    let mut document = Document::new();
    render_layout_into(&mut document, layout, fonts);
    document.finish().expect("failed to finish PDF")
}

/// Append a laid-out song to `document`, starting it on a fresh page and
/// flowing its items across as many A4 pages as needed.
fn render_layout_into(document: &mut Document, layout: &Layout, fonts: &Fonts) {
    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;

    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();
    let mut page_top = 0.0_f32;

    for item in &layout.items {
        if item.text.trim().is_empty() {
            continue;
        }

        let y = item.pos.1;

        // Advance to the page this item's baseline lands on.
        while y - page_top > content_height {
            surface.finish();
            page.finish();
            page = document.start_page_with(page_settings());
            surface = page.surface();
            page_top += content_height;
        }

        let (font, fill) = match item.item_type {
            ItemType::Chord => (fonts.chord_bold.clone(), chord_fill()),
            ItemType::ChordNormal => (fonts.chord_regular.clone(), chord_fill()),
            ItemType::Header | ItemType::Tag => (fonts.bold.clone(), Fill::default()),
            ItemType::Text => (fonts.regular.clone(), Fill::default()),
            ItemType::BoldText => (fonts.bold.clone(), Fill::default()),
        };

        surface.set_fill(Some(fill));
        surface.draw_text(
            Point::from_xy(item.pos.0 + MARGIN, y - page_top + MARGIN),
            font,
            item.font_size,
            &item.text,
            false,
            TextDirection::Auto,
        );
    }

    surface.finish();
    page.finish();
}

fn page_settings() -> PageSettings {
    PageSettings::from_wh(PAGE_WIDTH, PAGE_HEIGHT).unwrap()
}
