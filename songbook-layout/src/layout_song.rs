use std::any::Any;

use parley::{layout, FontContext, LayoutContext, RangedBuilder, StyleProperty};
use songbook_grammar::{Line, Song};

use crate::{
    data::{Item, Layout},
};

const FONT_SIZE: f64 = 16.;
const SECTION_SPACE: f64 = 24.;

pub fn layout_song(song: &Song, font_cx: &mut parley::FontContext) -> Layout {
    let mut layout: Layout = Layout {
        font_size: FONT_SIZE,
        items: Default::default(),
    };
    let mut y = 0.;
    for portion in &song.portions {
        match portion {
            songbook_grammar::FilePortion::Section (lines) => {
                for line in lines {
                    let mut data = layout_line(line, y, font_cx);
                    for item in &mut data.0 {
                        item.pos.1 += y as f32;
                    }
                    y += data.1;
                    layout.items.append(&mut data.0);
                }
            }
            songbook_grammar::FilePortion::PageBreak => {}
        }
        y += SECTION_SPACE;
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

fn prepare_builder<'a>(layout_cx: &'a mut LayoutContext<()>, font_cx: &'a mut parley::FontContext, text: &'a str, display_scale: f32) -> RangedBuilder<'a, ()> {
    let mut builder = layout_cx.ranged_builder(font_cx, &text, display_scale, false);

    // Set default styles that apply to the entire layout
    builder.push_default(StyleProperty::FontSize(FONT_SIZE as f32));
    builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(400.0)));
    // font_cx.collection.
    builder.push_default(StyleProperty::FontStack(parley::FontStack::Single(
        parley::FontFamily::Named(std::borrow::Cow::Borrowed("Cantarell")),
    )));
    builder.push_default(StyleProperty::LineHeight(parley::LineHeight::MetricsRelative(1.0)));

    builder
}

fn layout_line(line: &Line, y: f64, font_cx: &mut parley::FontContext) -> (Vec<Item>, f64) {
    let mut out_vec: Vec<Item> = vec![];
    let mut layout_cx = parley::LayoutContext::new();

    const DISPLAY_SCALE: f32 = 1.0; // TODO: make sure that coordinates are in pixel space
    let mut complete_text = collect_text(line);
    let max_width = None;//Some(250.);


    let cloned = complete_text.clone();
    let mut layout_no_box = prepare_builder(&mut layout_cx, font_cx, &complete_text, DISPLAY_SCALE).build(cloned);
    layout_no_box.break_all_lines(None);
    let nobox_first_line = layout_no_box.lines().nth(0).unwrap(); // TODO: graceful
    let nobox_metrics = nobox_first_line.metrics();

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
                    pos: (0., 0.),
                    text: content.clone(),
                });
                builder.push_inline_box(parley::InlineBox {
                    id: out_vec.len() as u64,
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
                        pos: (glyph_run.offset(), glyph_run.baseline()),
                        text: complete_text[glyph_run.run().text_range()].to_owned(),
                    };
                    // console_log!("{item:?}");
                    out_vec.push(item);
                }
                parley::PositionedLayoutItem::InlineBox(inline_box) => {
                    let command = &mut out_vec[(inline_box.id - 1) as usize];
                    command.pos = (inline_box.x, inline_box.y + inline_box.height - nobox_metrics.baseline);
                    // console_log!("inline_box");
                    // Render the inline box
                }
            };
        }
    }
    return (out_vec, layout.height() as f64);
}
