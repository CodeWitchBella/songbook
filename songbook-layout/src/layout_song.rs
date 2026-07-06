use std::any::Any;

use parley::{FontContext, LayoutContext, RangedBuilder, StyleProperty, layout};
use songbook_grammar::{Line, Song};

use crate::data::{Item, Layout};

const FONT_SIZE: f64 = 16.;
const SECTION_SPACE: f64 = 24.;
const HEADER_FONT_SIZE: f64 = 20.;
const HEADER_SPACE: f64 = 16.;

/// Lay out the song, including a header with the title on the left and the
/// author on the right at the top of the page.
///
/// `viewport` is the size of the page's usable content area, used to
/// right-align the author and to shrink the body (but not the header) to
/// fit. Pass `None` to leave the song at its natural size.
pub fn layout_song(
    song: &Song,
    font_cx: &mut parley::FontContext,
    viewport: Option<(f64, f64)>,
) -> Layout {
    let mut layout: Layout = Layout {
        font_size: FONT_SIZE,
        items: Default::default(),
    };

    let content_width = viewport.map(|(width, _)| width);
    let title = song
        .frontmatter
        .as_ref()
        .map(|fm| fm.title.as_str())
        .unwrap_or("");
    let author = song
        .frontmatter
        .as_ref()
        .map(|fm| fm.author.as_str())
        .unwrap_or("");
    let title_width = measure_text_width(title, HEADER_FONT_SIZE as f32, font_cx);
    let author_width = measure_text_width(author, HEADER_FONT_SIZE as f32, font_cx);
    let author_x = match content_width {
        Some(content_width) => (content_width as f32 - author_width).max(0.0),
        None => title_width + HEADER_FONT_SIZE as f32,
    };
    layout.items.push(Item {
        text: title.to_owned(),
        bold: true,
        is_header: true,
        font_size: HEADER_FONT_SIZE as f32,
        width: title_width,
        pos: (0., HEADER_FONT_SIZE as f32),
    });
    layout.items.push(Item {
        text: author.to_owned(),
        bold: false,
        is_header: true,
        font_size: HEADER_FONT_SIZE as f32,
        width: author_width,
        pos: (author_x, HEADER_FONT_SIZE as f32),
    });

    let header_height = HEADER_FONT_SIZE + HEADER_SPACE;

    let mut body_items: Vec<Item> = vec![];
    let mut y = 0.0;
    for portion in &song.portions {
        match portion {
            songbook_grammar::FilePortion::Section(lines) => {
                for line in lines {
                    let mut data = layout_line(line, y, font_cx);
                    for item in &mut data.0 {
                        item.pos.1 += y as f32;
                    }
                    y += data.1;
                    body_items.append(&mut data.0);
                }
            }
            songbook_grammar::FilePortion::PageBreak => {}
        }
        y += SECTION_SPACE;
    }

    let scale = match viewport {
        Some((width, height)) => {
            let (max_right, max_bottom) =
                body_items.iter().fold((0.0_f32, 0.0_f32), |(r, b), item| {
                    ((item.pos.0 + item.width).max(r), item.pos.1.max(b))
                });
            let avail_height = (height - header_height).max(0.0);
            let scale_axis = |avail: f64, extent: f32| {
                if extent > 0.0 {
                    avail as f32 / extent
                } else {
                    1.0
                }
            };
            scale_axis(width, max_right)
                .min(scale_axis(avail_height, max_bottom))
                .min(1.0)
        }
        None => 1.0,
    };

    for mut item in body_items {
        item.pos.0 *= scale;
        item.pos.1 = item.pos.1 * scale + header_height as f32;
        item.width *= scale;
        item.font_size *= scale;
        layout.items.push(item);
    }

    layout
}

fn collect_text(line: &Line) -> String {
    let mut text = String::new();
    for item in &line.content {
        // TODO: this should take into account label (S: R:,...)
        // /návěští/
        match item {
            songbook_grammar::LineContent::Text(part) => text.push_str(&part),
            songbook_grammar::LineContent::Command { lead, content } => {}
        }
    }
    text
}

fn prepare_builder<'a>(
    layout_cx: &'a mut LayoutContext<()>,
    font_cx: &'a mut parley::FontContext,
    text: &'a str,
    display_scale: f32,
) -> RangedBuilder<'a, ()> {
    let mut builder = layout_cx.ranged_builder(font_cx, &text, display_scale, false);

    // Set default styles that apply to the entire layout
    builder.push_default(StyleProperty::FontSize(FONT_SIZE as f32));
    builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(400.0)));
    // font_cx.collection.
    builder.push_default(StyleProperty::FontFamily(parley::FontFamily::Single(
        parley::FontFamilyName::Named(std::borrow::Cow::Borrowed("Cantarell")),
    )));
    builder.push_default(StyleProperty::LineHeight(
        parley::LineHeight::MetricsRelative(1.0),
    ));

    builder
}

/// Measure the advance width of a bit of text set in the given font size.
pub fn measure_text_width(text: &str, font_size: f32, font_cx: &mut parley::FontContext) -> f32 {
    let mut layout_cx = parley::LayoutContext::new();
    let mut builder = prepare_builder(&mut layout_cx, font_cx, text, 1.0);
    builder.push_default(StyleProperty::FontSize(font_size));
    let mut layout: parley::Layout<()> = builder.build(text);
    layout.break_all_lines(None);
    layout.width()
}

/// Measure the advance width of a bit of (bold) chord text.
fn measure_width(text: &str, font_cx: &mut parley::FontContext) -> f32 {
    let mut layout_cx = parley::LayoutContext::new();
    let mut builder = prepare_builder(&mut layout_cx, font_cx, text, 1.0);
    let mut layout: parley::Layout<()> = builder.build(text);
    layout.break_all_lines(None);
    layout.width()
}

fn layout_line(line: &Line, y: f64, font_cx: &mut parley::FontContext) -> (Vec<Item>, f64) {
    let mut out_vec: Vec<Item> = vec![];
    let mut layout_cx = parley::LayoutContext::new();

    const DISPLAY_SCALE: f32 = 1.0; // TODO: make sure that coordinates are in pixel space
    let mut complete_text = collect_text(line);
    let max_width = None; //Some(250.);

    let cloned = complete_text.clone();
    let mut layout_no_box =
        prepare_builder(&mut layout_cx, font_cx, &complete_text, DISPLAY_SCALE).build(cloned);
    layout_no_box.break_all_lines(None);
    let nobox_first_line = layout_no_box.lines().nth(0).unwrap(); // TODO: graceful
    let nobox_metrics = nobox_first_line.metrics();

    // Pre-measure chord widths, since `font_cx` is borrowed by the builder below.
    let mut chord_widths = line
        .content
        .iter()
        .filter_map(|item| match item {
            songbook_grammar::LineContent::Command { content, .. } => {
                Some(measure_width(content, font_cx))
            }
            _ => None,
        })
        .collect::<Vec<_>>()
        .into_iter();

    let mut builder = prepare_builder(&mut layout_cx, font_cx, &complete_text, DISPLAY_SCALE);

    let mut i = 0;
    for item in &line.content {
        match item {
            songbook_grammar::LineContent::Text(part) => {
                i += part.len();
            }
            songbook_grammar::LineContent::Command { lead, content } => {
                out_vec.push(Item {
                    bold: true,
                    is_header: false,
                    font_size: FONT_SIZE as f32,
                    pos: (0., 0.),
                    width: chord_widths.next().unwrap_or(0.0),
                    text: content.clone(),
                });
                builder.push_inline_box(parley::InlineBox {
                    id: out_vec.len() as u64,
                    kind: parley::InlineBoxKind::InFlow,
                    index: i,
                    width: 0.0,
                    height: (nobox_metrics.line_height + nobox_metrics.baseline) as f32,
                });
            }
        }
    }

    // Build the builder into a Layout
    let cloned = complete_text.clone();
    let mut layout: parley::Layout<()> = builder.build(&cloned);

    // Run line-breaking and alignment on the Layout

    layout.break_all_lines(max_width);

    // Inspect computed layout (see examples for more details)
    let width = layout.width();

    let height = layout.height();
    let full_width = layout.full_width();
    for line in layout.lines() {
        for item in line.items() {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    let item = Item {
                        bold: false,
                        is_header: false,
                        font_size: FONT_SIZE as f32,
                        width: glyph_run.advance(),
                        pos: (glyph_run.offset(), glyph_run.baseline()),
                        text: complete_text[glyph_run.run().text_range()].to_owned(),
                    };
                    // console_log!("{item:?}");
                    out_vec.push(item);
                }
                parley::PositionedLayoutItem::InlineBox(inline_box) => {
                    let command = &mut out_vec[(inline_box.id - 1) as usize];
                    command.pos = (
                        inline_box.x,
                        inline_box.y + inline_box.height - nobox_metrics.baseline,
                    );
                    // console_log!("inline_box");
                    // Render the inline box
                }
            };
        }
    }
    return (out_vec, layout.height() as f64);
}
