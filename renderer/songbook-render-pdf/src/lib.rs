use krilla::Document;
use krilla::color::rgb;
use krilla::geom::Point;
use krilla::page::PageSettings;
use krilla::paint::{Fill, Paint};
use krilla::text::{Font, TextDirection};

use songbook_grammar::Song;
use songbook_layout::{ItemType, Layout, LayoutEngine};

use title_page::render_title_page;

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

pub(crate) const MARGIN: f32 = 28.0;
/// Horizontal margins for booklet mode: both bigger than the non-booklet
/// `MARGIN` (so pages don't feel cramped after being scaled down and printed
/// two-up), with the side that ends up at the center fold (the
/// "inner"/gutter margin) bigger still, so text doesn't get lost in the
/// binding.
pub(crate) const MARGIN_OUTER: f32 = MARGIN;
pub(crate) const MARGIN_INNER: f32 = MARGIN * 1.5;
pub(crate) const PAGE_WIDTH: f32 = 595.28;
pub(crate) const PAGE_HEIGHT: f32 = 841.89;

/// The left-edge margin for a page at (0-based) `page_index` in the final
/// document. In booklet mode, source page `page_index` ends up on the right
/// half of a sheet (its left edge at the center fold) when `page_index` is
/// even, and on the left half (its right edge at the fold) when odd — see
/// `booklet::booklet_pairs`. So even pages get their bigger margin on the
/// left, odd pages get it on the right (i.e. a smaller left margin).
fn left_margin(booklet: bool, page_index: usize) -> f32 {
    if !booklet {
        return MARGIN;
    }
    if page_index % 2 == 0 {
        MARGIN_INNER
    } else {
        MARGIN_OUTER
    }
}

fn chord_fill() -> Fill {
    Fill {
        paint: Paint::from(rgb::Color::new(0x99, 0x33, 0x00)),
        ..Fill::default()
    }
}

pub fn render_song(song: &Song, fonts: &Fonts, engine: &mut LayoutEngine) -> Vec<u8> {
    let layout = layout_song(song, engine, false);
    render_layout(&layout, fonts)
}

/// Render a whole collection: a title page, then each song laid out
/// independently and starting on a fresh page, followed by a table of
/// contents.
pub fn render_collection(
    collection_title: &str,
    songs: &[Song],
    fonts: &Fonts,
    engine: &mut LayoutEngine,
) -> Vec<u8> {
    render_collection_with(
        collection_title,
        songs,
        fonts,
        engine,
        false,
        false,
        |_, _, _| {},
    )
}

/// Like [`render_collection`], but calls `on_song(index, layout_time, render_time)`
/// after each song is laid out and rendered, so callers can report per-song timing.
///
/// If `skip_content` is set, song pages are not actually rendered into the
/// document (only the title page and table of contents are) — the page
/// count each song would have used is still computed, so the TOC page
/// numbers come out the same. Useful for quickly debugging TOC layout.
pub fn render_collection_with(
    collection_title: &str,
    songs: &[Song],
    fonts: &Fonts,
    engine: &mut LayoutEngine,
    skip_content: bool,
    booklet: bool,
    mut on_song: impl FnMut(usize, std::time::Duration, std::time::Duration),
) -> Vec<u8> {
    let mut document = Document::new();

    render_title_page(&mut document, collection_title, fonts);
    let mut page_number = 1usize;
    // 0-based index of the next page to be rendered into `document`; the
    // title page took index 0.
    let mut page_index = 1usize;

    let mut toc_entries = Vec::with_capacity(songs.len());
    for (index, song) in songs.iter().enumerate() {
        let layout_start = web_time::Instant::now();
        let layout = layout_song(song, engine, booklet);
        let layout_elapsed = layout_start.elapsed();

        let render_start = web_time::Instant::now();
        let pages_used = if skip_content {
            count_pages(&layout)
        } else {
            render_layout_into(&mut document, &layout, fonts, booklet, page_index)
        };
        let render_elapsed = render_start.elapsed();

        let (title, author) = song
            .frontmatter
            .as_ref()
            .map(|f| (f.title.clone(), f.author.clone()))
            .unwrap_or_default();
        toc_entries.push((title, author, page_number));
        page_number += pages_used;
        page_index += pages_used;

        on_song(index, layout_elapsed, render_elapsed);
    }

    render_toc_pages(&mut document, &toc_entries, fonts, booklet, page_index);

    document.finish().expect("failed to finish PDF")
}

/// Render the table of contents in two columns: each song gets two rows (the
/// bold title, then the author below it), with the page number to the left,
/// flowing across as many pages as needed.
fn render_toc_pages(
    document: &mut Document,
    entries: &[(String, String, usize)],
    fonts: &Fonts,
    booklet: bool,
    start_index: usize,
) {
    const LINE_HEIGHT: f32 = 14.0;
    const AUTHOR_LINE_HEIGHT: f32 = LINE_HEIGHT * 0.90;
    const ENTRY_SPACING: f32 = LINE_HEIGHT / 4.0;
    const ENTRY_HEIGHT: f32 = LINE_HEIGHT + AUTHOR_LINE_HEIGHT + ENTRY_SPACING;
    const LINE_SIZE: f32 = 11.0;
    const NUMBER_WIDTH: f32 = 24.0;
    const COLUMN_GAP: f32 = 20.0;

    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;
    let margins_sum = if booklet {
        MARGIN_OUTER + MARGIN_INNER
    } else {
        2.0 * MARGIN
    };
    let column_width = (PAGE_WIDTH - margins_sum - COLUMN_GAP) / 2.0;

    let mut page_index = start_index;
    let columns_for = |left: f32| [left, left + column_width + COLUMN_GAP];
    let mut columns = columns_for(left_margin(booklet, page_index));

    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();
    surface.set_fill(Some(Fill::default()));

    let mut column = 0usize;
    let mut y = 0.0_f32;

    for (title, author, page_number) in entries {
        if y + ENTRY_HEIGHT > content_height {
            column += 1;
            y = 0.0;
            if column >= columns.len() {
                surface.finish();
                page.finish();
                page_index += 1;
                columns = columns_for(left_margin(booklet, page_index));
                page = document.start_page_with(page_settings());
                surface = page.surface();
                surface.set_fill(Some(Fill::default()));
                column = 0;
            }
        }

        let x = columns[column];

        surface.draw_text(
            Point::from_xy(x, y + MARGIN),
            fonts.regular.clone(),
            LINE_SIZE,
            &page_number.to_string(),
            false,
            TextDirection::Auto,
        );
        surface.draw_text(
            Point::from_xy(x + NUMBER_WIDTH, y + MARGIN),
            fonts.bold.clone(),
            LINE_SIZE,
            title,
            false,
            TextDirection::Auto,
        );
        surface.draw_text(
            Point::from_xy(x + NUMBER_WIDTH, y + MARGIN + AUTHOR_LINE_HEIGHT),
            fonts.regular.clone(),
            LINE_SIZE,
            author,
            false,
            TextDirection::Auto,
        );
        y += ENTRY_HEIGHT;
    }

    surface.finish();
    page.finish();
}

/// Lay out a single song against the A4 content area.
fn layout_song(song: &Song, engine: &mut LayoutEngine, booklet: bool) -> Layout {
    let content_width = if booklet {
        PAGE_WIDTH - MARGIN_OUTER - MARGIN_INNER
    } else {
        PAGE_WIDTH - 2.0 * MARGIN
    } as f64;
    let content_height = (PAGE_HEIGHT - 2.0 * MARGIN) as f64;
    engine.run(song, Some((content_width, content_height)))
}

/// Render an already computed [`Layout`] into PDF bytes across A4 pages.
pub fn render_layout(layout: &Layout, fonts: &Fonts) -> Vec<u8> {
    let mut document = Document::new();
    render_layout_into(&mut document, layout, fonts, false, 0);
    document.finish().expect("failed to finish PDF")
}

/// Compute how many A4 pages [`render_layout_into`] would use for `layout`,
/// without actually drawing anything into a document.
fn count_pages(layout: &Layout) -> usize {
    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;
    let mut page_top = 0.0_f32;
    let mut page_count = 1usize;

    for item in &layout.items {
        if item.text.trim().is_empty() {
            continue;
        }

        let y = item.pos.1;
        while y - page_top > content_height {
            page_top += content_height;
            page_count += 1;
        }
    }

    page_count
}

/// Append a laid-out song to `document`, starting it on a fresh page and
/// flowing its items across as many A4 pages as needed. Returns the number
/// of pages it used.
fn render_layout_into(
    document: &mut Document,
    layout: &Layout,
    fonts: &Fonts,
    booklet: bool,
    start_index: usize,
) -> usize {
    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;

    let mut page_index = start_index;
    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();
    let mut page_top = 0.0_f32;
    let mut page_count = 1usize;

    for item in &layout.items {
        if item.text.trim().is_empty() {
            continue;
        }

        let y = item.pos.1;

        // Advance to the page this item's baseline lands on.
        while y - page_top > content_height {
            surface.finish();
            page.finish();
            page_index += 1;
            page = document.start_page_with(page_settings());
            surface = page.surface();
            page_top += content_height;
            page_count += 1;
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
            Point::from_xy(
                item.pos.0 + left_margin(booklet, page_index),
                y - page_top + MARGIN,
            ),
            font,
            item.font_size,
            &item.text,
            false,
            TextDirection::Auto,
        );
    }

    surface.finish();
    page.finish();
    page_count
}

pub(crate) fn page_settings() -> PageSettings {
    PageSettings::from_wh(PAGE_WIDTH, PAGE_HEIGHT).unwrap()
}

mod booklet;
mod title_page;
mod wasm;
pub use booklet::impose_booklet;
pub use wasm::Renderer;
