use krilla::Document;
use krilla::color::rgb;
use krilla::geom::Point;
use krilla::page::PageSettings;
use krilla::paint::{Fill, Paint};
use krilla::text::{Font, TextDirection};

use songbook_grammar::Song;
use songbook_layout::{Layout, LayoutEngine};

pub struct Fonts {
    regular: Font,
    bold: Font,
}

impl Fonts {
    pub fn new(regular: Vec<u8>, bold: Vec<u8>) -> Self {
        Self {
            regular: load_font(regular),
            bold: load_font(bold),
        }
    }
}

fn load_font(data: Vec<u8>) -> Font {
    let ttf = songbook_layout::decompress_font(data);
    Font::new(ttf.into(), 0).expect("failed to parse font")
}

const MARGIN: f32 = 28.0;
const PAGE_WIDTH: f32 = 419.53;
const PAGE_HEIGHT: f32 = 595.28;

fn chord_fill() -> Fill {
    Fill {
        paint: Paint::from(rgb::Color::new(0x99, 0x33, 0x00)),
        ..Fill::default()
    }
}

pub fn render_song(song: &Song, fonts: &Fonts, engine: &mut LayoutEngine) -> Vec<u8> {
    let layout = engine.run(song);
    render_layout(&layout, fonts)
}

/// Render an already computed [`Layout`] into PDF bytes across A5 pages.
pub fn render_layout(layout: &Layout, fonts: &Fonts) -> Vec<u8> {
    // Usable content box on each page.
    let content_width = PAGE_WIDTH - 2.0 * MARGIN;
    let content_height = PAGE_HEIGHT - 2.0 * MARGIN;

    // Shrink the whole song so it fits on a single A5 page in both dimensions.
    // We only ever scale down — a song that already fits keeps its natural size.
    let (max_right, max_bottom) = layout
        .items
        .iter()
        .fold((0.0_f32, 0.0_f32), |(r, b), item| {
            ((item.pos.0 + item.width).max(r), item.pos.1.max(b))
        });
    let scale_axis = |avail: f32, extent: f32| if extent > 0.0 { avail / extent } else { 1.0 };
    let scale = scale_axis(content_width, max_right)
        .min(scale_axis(content_height, max_bottom))
        .min(1.0);
    let font_size = layout.font_size as f32 * scale;

    let mut document = Document::new();

    // Walk items in layout order, opening a new A5 page whenever the next item
    // would fall past the bottom margin of the current one.
    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();
    let mut page_top = 0.0_f32;

    for item in &layout.items {
        if item.text.trim().is_empty() {
            continue;
        }

        let y = item.pos.1 * scale;

        // Advance to the page this item's baseline lands on.
        while y - page_top > content_height {
            surface.finish();
            page.finish();
            page = document.start_page_with(page_settings());
            surface = page.surface();
            page_top += content_height;
        }

        let (font, fill) = if item.bold {
            (fonts.bold.clone(), chord_fill())
        } else {
            (fonts.regular.clone(), Fill::default())
        };

        surface.set_fill(Some(fill));
        surface.draw_text(
            Point::from_xy(item.pos.0 * scale + MARGIN, y - page_top + MARGIN),
            font,
            font_size,
            &item.text,
            false,
            TextDirection::Auto,
        );
    }

    surface.finish();
    page.finish();
    document.finish().expect("failed to finish PDF")
}

fn page_settings() -> PageSettings {
    PageSettings::from_wh(PAGE_WIDTH, PAGE_HEIGHT).unwrap()
}
