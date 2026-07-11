use std::collections::HashMap;

use anyhow::anyhow;
use parley::{
    Alignment, AlignmentOptions, FontContext, FontWeight, GlyphRun, InlineBox, Layout,
    LayoutContext, LineHeight, PositionedLayoutItem, StyleProperty,
};
use piet::{
    Color, Error, FontFamily, ImageFormat, InterpolationMode, RenderContext, Text, TextAttribute,
    TextLayout, TextLayoutBuilder, kurbo::Line,
};
use songbook_grammar::Song;
use songbook_layout::ItemType;

const RED_ALPHA: Color = Color::rgba8(0x80, 0x00, 0x00, 0xC0);

pub fn draw(rc: &mut impl RenderContext, song: &songbook_layout::Layout) -> anyhow::Result<()> {
    rc.clear(None, Color::WHITE);

    let font = rc
        .text()
        .font_family("Cantarell")
        .ok_or(anyhow!("Missing font"))?;

    for item in song.items.iter() {
        let layout = rc
            .text()
            .new_text_layout(item.text.clone())
            .font(font.clone(), item.font_size as f64)
            .default_attribute(TextAttribute::Weight(piet::FontWeight::new(
                if item.item_type.is_bold() { 600 } else { 400 },
            )))
            // .default_attribute(TextAttribute::TextColor(RED_ALPHA))
            .build()
            .map_err(|err| anyhow!(format!("{err:?}")))?;

        let metric = layout
            .line_metric(0)
            .ok_or_else(|| anyhow!("Couldn't get line metric"))?;

        rc.draw_text(&layout, (item.pos.0, item.pos.1 - (metric.baseline as f32)));

        // rc.stroke(
        //     Line::new(item.pos, (item.pos.0 + 10., item.pos.1)),
        //     &RED_ALPHA,
        //     1.0,
        // );
    }

    Ok(())
}

type Brush = ();

fn get_command_text_box(
    lead: Option<&str>,
    text: &str,
    font_cx: &mut FontContext,
    layout_cx: &mut LayoutContext<Brush>,
) -> (f32, f32) {
    // Create a `RangedBuilder` or a `TreeBuilder`, which are used to construct a `Layout`.
    const DISPLAY_SCALE: f32 = 1.0;
    let mut builder = layout_cx.ranged_builder(font_cx, &text, DISPLAY_SCALE, true);

    // Set default styles that apply to the entire layout
    builder.push_default(StyleProperty::FontSize(16.0));
    builder.push_default(StyleProperty::FontWeight(FontWeight::new(600.0)));

    // Build the builder into a Layout
    let layout: Layout<Brush> = builder.build(&text);

    (layout.width(), layout.height())
}

fn render_text(song: &Song) {
    // Create a FontContext (font database) and LayoutContext (scratch space).
    // These are both intended to be constructed rarely (perhaps even once per app):
    let mut font_cx = FontContext::new();
    let mut layout_cx = LayoutContext::new();

    // step1: figure out all the command sizing
    let mut map: HashMap<u64, (f64, f64)> = Default::default();
    for portion in song.portions.iter() {
        match portion {
            songbook_grammar::FilePortion::Section(lines) => {
                for line in lines.iter() {
                    for content in line.content.iter() {
                        match content {
                            songbook_grammar::LineContent::Text(_) => {}
                            songbook_grammar::LineContent::Command { lead, content } => {
                                let sz = get_command_text_box(
                                    lead.as_deref(),
                                    &content,
                                    &mut font_cx,
                                    &mut layout_cx,
                                );
                                println!("sz: {sz:?}");
                            }
                        }
                    }
                }
            }
        }
    }

    // Create a `RangedBuilder` or a `TreeBuilder`, which are used to construct a `Layout`.
    const DISPLAY_SCALE: f32 = 1.0;
    const TEXT: &str = "Lorem Ipsum...";
    let mut builder = layout_cx.ranged_builder(&mut font_cx, &TEXT, DISPLAY_SCALE, true);

    // Set default styles that apply to the entire layout
    builder.push_default(StyleProperty::FontSize(16.0));

    // Set a style that applies to the first 4 characters
    builder.push(StyleProperty::FontWeight(FontWeight::new(600.0)), 0..4);

    // Add a box to be laid out inline with the text
    builder.push_inline_box(InlineBox {
        id: 0,
        kind: parley::InlineBoxKind::InFlow,
        index: 5,
        width: 50.0,
        height: 50.0,
    });

    // Build the builder into a Layout
    let mut layout: Layout<()> = builder.build(&TEXT);

    // Run line-breaking and alignment on the Layout
    const MAX_WIDTH: Option<f32> = Some(100.0);
    layout.break_all_lines(MAX_WIDTH);
    layout.align(Alignment::Start, AlignmentOptions::default());

    // Inspect computed layout (see examples for more details)
    let width = layout.width();
    let height = layout.height();
    for line in layout.lines() {
        for item in line.items() {
            match item {
                PositionedLayoutItem::GlyphRun(glyph_run) => {
                    render_glyph_run(&glyph_run);
                    // Render the glyph run
                }
                PositionedLayoutItem::InlineBox(_inline_box) => {
                    // Render the inline box
                }
            };
        }
    }
}

fn render_glyph_run(run: &GlyphRun<Brush>) {}
