use krilla::Document;
use krilla::color::rgb;
use krilla::geom::{Point, Transform};
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

pub(crate) const MARGIN: f32 = 42.0;
/// Horizontal margins for booklet mode: both bigger than the non-booklet
/// `MARGIN` (so pages don't feel cramped after being scaled down and printed
/// two-up), with the side that ends up at the center fold (the
/// "inner"/gutter margin) bigger still, so text doesn't get lost in the
/// binding.
pub(crate) const MARGIN_OUTER: f32 = MARGIN;
pub(crate) const MARGIN_INNER: f32 = MARGIN * 2.0;
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

/// The right-edge margin for a page at (0-based) `page_index`, mirroring
/// [`left_margin`] (the gutter/inner margin is always on the opposite side
/// from the left one).
fn right_margin(booklet: bool, page_index: usize) -> f32 {
    if !booklet {
        return MARGIN;
    }
    if page_index % 2 == 0 {
        MARGIN_OUTER
    } else {
        MARGIN_INNER
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

const PAGE_NUMBER_SIZE: f32 = 20.0;
/// Distance from the bottom edge of the sheet to the page number's baseline.
const PAGE_NUMBER_BOTTOM: f32 = 30.0;
/// Rough average digit width as a fraction of font size, used to center the
/// page number without a real text-measurement pass (digits are close enough
/// to equal-width in the lyric font that this looks centered).
const DIGIT_WIDTH_RATIO: f32 = 0.56;

/// Draw the page number in the bottom-right corner of the current page,
/// right-aligned to the same margin the content uses on that side (which
/// alternates in booklet mode).
fn draw_page_number(
    surface: &mut krilla::surface::Surface,
    fonts: &Fonts,
    booklet: bool,
    page_index: usize,
    number: usize,
) {
    let text = number.to_string();
    let width = text.len() as f32 * PAGE_NUMBER_SIZE * DIGIT_WIDTH_RATIO;
    let right_margin = right_margin(booklet, page_index);
    surface.set_fill(Some(Fill::default()));
    surface.draw_text(
        Point::from_xy(
            PAGE_WIDTH - right_margin - width,
            PAGE_HEIGHT - PAGE_NUMBER_BOTTOM,
        ),
        fonts.regular.clone(),
        PAGE_NUMBER_SIZE,
        &text,
        false,
        TextDirection::Auto,
    );
}

const SPINE_LABEL: &str = "Brehoni 2026";
const SPINE_LABEL_SIZE: f32 = 12.0;
/// Same rough equal-width approximation as [`DIGIT_WIDTH_RATIO`], tuned for
/// the mix of letters in [`SPINE_LABEL`] rather than digits.
const SPINE_LABEL_WIDTH_RATIO: f32 = 0.55;
/// Minimum clearance (in points) required between the label's vertical band
/// and the page-relative y position of any other item on the page, on top
/// of the label's own text width, before we consider it "too close" and
/// suppress the label.
const SPINE_LABEL_MIN_GAP: f32 = 24.0;
/// Minimum horizontal clearance (in points) an item's right edge must keep
/// from the margin the label sits in, before it counts toward "too close".
/// Items are laid out within the content width and normally never reach the
/// margin at all, so this only catches ones that run unusually wide (e.g. a
/// long header line).
const SPINE_LABEL_HORIZONTAL_GAP: f32 = 20.0;

/// Lazily loads and caches the Shantell Sans font used for the spine label,
/// independent of the [`Fonts`] the rest of the document uses.
fn spine_label_font() -> &'static Font {
    static FONT: std::sync::OnceLock<Font> = std::sync::OnceLock::new();
    FONT.get_or_init(|| {
        let data: &[u8] = include_bytes!("../../songs/shantell-sans-regular.woff2");
        load_font(data.to_vec())
    })
}

/// Draw "Brehoni 2026" rotated 90 degrees clockwise, centered in the
/// right-edge margin of a "left" page (odd page number) — unless another
/// item on the page both falls close to the label's vertical band and
/// reaches close to the margin horizontally, in which case it's skipped
/// entirely rather than risk overlapping content.
fn draw_spine_label(
    surface: &mut krilla::surface::Surface,
    booklet: bool,
    page_index: usize,
    page_number: usize,
    items: &[(f32, f32)],
) {
    if page_number % 2 == 0 {
        return;
    }

    let text_width = SPINE_LABEL.len() as f32 * SPINE_LABEL_SIZE * SPINE_LABEL_WIDTH_RATIO;
    let half_span = text_width / 2.0;
    let center_y = PAGE_HEIGHT / 2.0;
    let band_top = center_y - half_span - SPINE_LABEL_MIN_GAP;
    let band_bottom = center_y + half_span + SPINE_LABEL_MIN_GAP;

    let right_margin = right_margin(booklet, page_index);
    let margin_edge_x = PAGE_WIDTH - right_margin;

    let too_close = items.iter().any(|&(y, right_edge_x)| {
        let y = y + MARGIN;
        let vertically_close = y >= band_top && y <= band_bottom;
        let horizontally_close = right_edge_x >= margin_edge_x - SPINE_LABEL_HORIZONTAL_GAP;
        vertically_close && horizontally_close
    });
    if too_close {
        return;
    }

    // Flush with the same margin line the page's content is right-aligned
    // to (like `draw_page_number`), rather than centered in the margin band.
    let pivot_x = PAGE_WIDTH - right_margin - SPINE_LABEL_SIZE / 2.0;
    // The pivot is the top (first-drawn) end of the label; text flows
    // "downward" (toward the page bottom) after rotation, so offsetting it
    // above center by half the label's width centers the whole label on the
    // page.
    let pivot_y = center_y - half_span;

    surface.push_transform(&Transform::from_rotate_at(90.0, pivot_x, pivot_y));
    surface.set_fill(Some(Fill::default()));
    surface.draw_text(
        Point::from_xy(pivot_x, pivot_y),
        spine_label_font().clone(),
        SPINE_LABEL_SIZE,
        SPINE_LABEL,
        false,
        TextDirection::Auto,
    );
    surface.pop();
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

    // Lay out every song up front so its page count is known before deciding
    // render order (see `reorder_for_spreads`).
    let mut layouts = Vec::with_capacity(songs.len());
    let mut layout_times = Vec::with_capacity(songs.len());
    for song in songs {
        let layout_start = web_time::Instant::now();
        layouts.push(layout_song(song, engine, booklet));
        layout_times.push(layout_start.elapsed());
    }
    let pages_used: Vec<usize> = layouts.iter().map(count_pages).collect();
    let order = reorder_for_spreads(&pages_used);

    let mut toc_entries = Vec::with_capacity(songs.len());
    for index in order {
        let song = &songs[index];
        let layout = &layouts[index];

        let render_start = web_time::Instant::now();
        let pages = if skip_content {
            pages_used[index]
        } else {
            render_layout_into(
                &mut document,
                layout,
                fonts,
                booklet,
                page_index,
                page_number,
            )
        };
        let render_elapsed = render_start.elapsed();

        let (title, author) = song
            .frontmatter
            .as_ref()
            .map(|f| (f.title.clone(), f.author.clone()))
            .unwrap_or_default();
        toc_entries.push((title, author, page_number));
        page_number += pages;
        page_index += pages;

        on_song(index, layout_times[index], render_elapsed);
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
    engine.run(song, Some((content_width, content_height)), true, false)
}

/// Render an already computed [`Layout`] into PDF bytes across A4 pages.
pub fn render_layout(layout: &Layout, fonts: &Fonts) -> Vec<u8> {
    let mut document = Document::new();
    render_layout_into(&mut document, layout, fonts, false, 0, 1);
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

/// Reorder song indices so a multi-page song doesn't start on the second
/// half of a page spread (page numbers `2k-1` and `2k` face each other when
/// the book is opened). A song starting on an even page number begins
/// mid-spread, so its own pages never share a spread — pull a later
/// single-page song forward to take that page instead, when one is
/// available, so the multi-page song starts fresh at the next spread.
fn reorder_for_spreads(pages_used: &[usize]) -> Vec<usize> {
    let mut order: Vec<usize> = (0..pages_used.len()).collect();
    let mut page_number = 1usize;
    let mut i = 0;
    while i < order.len() {
        if pages_used[order[i]] > 1 && page_number % 2 == 0 {
            if let Some(swap_with) = (i + 1..order.len()).find(|&j| pages_used[order[j]] == 1) {
                order.swap(i, swap_with);
            }
        }
        page_number += pages_used[order[i]];
        i += 1;
    }
    order
}

/// Append a laid-out song to `document`, starting it on a fresh page and
/// flowing its items across as many A4 pages as needed. Returns the number
/// of pages it used.
///
/// `first_page_number` is the number printed on the first page this call
/// draws (it then counts up by one per page) — kept separate from
/// `start_index` (which only drives margin alternation) since the two can
/// diverge, e.g. the collection's unnumbered title page shifts them apart.
fn render_layout_into(
    document: &mut Document,
    layout: &Layout,
    fonts: &Fonts,
    booklet: bool,
    start_index: usize,
    first_page_number: usize,
) -> usize {
    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;

    let mut page_index = start_index;
    let mut page_number = first_page_number;
    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();
    draw_page_number(&mut surface, fonts, booklet, page_index, page_number);
    let mut page_top = 0.0_f32;
    let mut page_count = 1usize;
    let mut page_items: Vec<(f32, f32)> = Vec::new();

    for item in &layout.items {
        if item.text.trim().is_empty() {
            continue;
        }

        let y = item.pos.1;

        // Advance to the page this item's baseline lands on.
        while y - page_top > content_height {
            draw_spine_label(&mut surface, booklet, page_index, page_number, &page_items);
            surface.finish();
            page.finish();
            page_index += 1;
            page_number += 1;
            page = document.start_page_with(page_settings());
            surface = page.surface();
            draw_page_number(&mut surface, fonts, booklet, page_index, page_number);
            page_top += content_height;
            page_count += 1;
            page_items.clear();
        }
        let right_edge_x = item.pos.0 + left_margin(booklet, page_index) + item.width;
        page_items.push((y - page_top, right_edge_x));

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

    draw_spine_label(&mut surface, booklet, page_index, page_number, &page_items);
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

#[cfg(test)]
mod reorder_tests {
    use super::reorder_for_spreads;

    #[test]
    fn keeps_order_when_nothing_splits_a_spread() {
        // 1,1,1,1: every song starts on an odd page number already.
        assert_eq!(reorder_for_spreads(&[1, 1, 1, 1]), vec![0, 1, 2, 3]);
    }

    #[test]
    fn pulls_a_single_page_song_forward_to_avoid_a_split() {
        // song0 (1 page) -> page 1. song1 (2 pages) would start at page 2
        // (even), splitting itself across two spreads. song2 is single-page,
        // so it should be pulled forward to take page 2, letting song1 start
        // fresh at page 3.
        assert_eq!(reorder_for_spreads(&[1, 2, 1]), vec![0, 2, 1]);
    }

    #[test]
    fn leaves_split_when_no_single_page_song_is_available() {
        assert_eq!(reorder_for_spreads(&[1, 2, 2]), vec![0, 1, 2]);
    }

    #[test]
    fn matches_first_spread_example() {
        // First two songs, both single-page, share the first spread (pages
        // 1 and 2) without any reordering.
        assert_eq!(reorder_for_spreads(&[1, 1, 3, 1]), vec![0, 1, 2, 3]);
    }
}
