use std::any::Any;

use anyhow::Result;
use parley::{FontContext, StyleProperty};
use songbook_grammar::{Line, Song};

use crate::{
    console_log,
    song_layout::{Item, Layout},
};

const FONT_SIZE: f64 = 16.;
const SECTION_SPACE: f64 = 24.;
const LINE_SPACE: f64 = 4.;

pub fn layout_song(song: &Song, font_cx: &mut parley::FontContext) -> Result<Layout> {
    let mut layout: Layout = Layout {
        font_size: FONT_SIZE,
        items: Default::default(),
    };
    let mut y = 0.;
    for portion in &song.portions {
        match portion {
            songbook_grammar::FilePortion::Section { header, lines } => {
                for line in lines {
                    let mut data = layout_line(line, y, font_cx)?;
                    console_log!("{data:?}");
                    y += data.1 + LINE_SPACE;
                    layout.items.append(&mut data.0);
                }
            }
            songbook_grammar::FilePortion::PageBreak => {}
        }
        y += SECTION_SPACE;
    }

    Ok(layout)
}

fn collect_text(line: &Line) -> String {
    let mut text = String::new();
    for item in &line.0 {
        // TODO: this should take into account label (S: R:,...)
        // /návěští/
        match item {
            songbook_grammar::LineContent::Text(part) => text.push_str(&part),
            songbook_grammar::LineContent::Command { lead, content } => {}
        }
    }
    text
}

fn layout_line(line: &Line, y: f64, font_cx: &mut parley::FontContext) -> Result<(Vec<Item>, f64)> {
    let mut out_vec: Vec<Item> = vec![];
    let mut layout_cx = parley::LayoutContext::new();

    const DISPLAY_SCALE: f32 = 1.0; // TODO: make sure that coordinates are in pixel space
    let mut complete_text = collect_text(line);
    let mut builder = layout_cx.ranged_builder(font_cx, &complete_text, DISPLAY_SCALE, true);

    // Set default styles that apply to the entire layout
    builder.push_default(StyleProperty::FontSize(FONT_SIZE as f32));
    builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(400.0)));
    // font_cx.collection.
    builder.push_default(StyleProperty::FontStack(parley::FontStack::Single(
        parley::FontFamily::Named(std::borrow::Cow::Borrowed("atkinson-hyperlegible")),
    )));
    // let mut i = 0;
    // for item in &line.0 {
    //     match item {
    //         songbook_grammar::LineContent::Text(part) => {
    //             i += part.len();
    //         }
    //         songbook_grammar::LineContent::Command { lead, content } => {
    //             out_vec.push(Item {
    //                 bold: true,
    //                 pos: (0., 0.),
    //                 text: content.clone(),
    //             });
    //             builder.push_inline_box(parley::InlineBox {
    //                 id: out_vec.len() as u64,
    //                 index: i,
    //                 width: 0.0,
    //                 height: (FONT_SIZE * 2.) as f32,
    //             });
    //         }
    //     }
    // }

    // Build the builder into a Layout
    let cloned = complete_text.clone();
    console_log!("{}", complete_text);
    let mut layout: parley::Layout<()> = builder.build(&cloned);

    // Run line-breaking and alignment on the Layout
    layout.break_all_lines(Some(250.));
    // layout.align(
    //     MAX_WIDTH,
    //     parley::Alignment::Start,
    //     parley::AlignmentOptions::default(),
    // );

    // Inspect computed layout (see examples for more details)
    let width = layout.width();
    let height = layout.height();
    let full_width = layout.full_width();
    console_log!("{width}x{height}; {full_width}");
    for line in layout.lines() {
        console_log!("{:?}", line.text_range());
        for item in line.items() {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    console_log!("glyph_run");
                    let item = Item {
                        bold: false,
                        pos: (glyph_run.offset(), glyph_run.baseline()),
                        text: complete_text[glyph_run.run().text_range()].to_owned(),
                    };
                    console_log!("{item:?}");
                    out_vec.push(item);
                }
                parley::PositionedLayoutItem::InlineBox(inline_box) => {
                    let command = &mut out_vec[(inline_box.id - 1) as usize];
                    command.pos = (inline_box.x, inline_box.y);
                    console_log!("inline_box");
                    // Render the inline box
                }
            };
        }
    }
    return Ok((out_vec, 32.));
}
