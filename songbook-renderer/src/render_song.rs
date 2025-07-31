use std::collections::HashMap;

use piet::{
    Color, Error, FontFamily, ImageFormat, InterpolationMode, RenderContext, Text, TextAttribute,
    TextLayout, TextLayoutBuilder,
};
use parley::{
    Alignment, AlignmentOptions, FontContext, FontWeight, GlyphRun, InlineBox, Layout, LayoutContext, LineHeight, PositionedLayoutItem, StyleProperty
};
use songbook_grammar::Song;

const RED_ALPHA: Color = Color::rgba8(0x80, 0x00, 0x00, 0xC0);

pub fn draw(rc: &mut impl RenderContext) -> Result<(), Error> {
    rc.clear(None, Color::WHITE);

    let georgia = rc.text().font_family("Georgia").ok_or(Error::MissingFont)?;

    let layout = rc
        .text()
        .new_text_layout("Hello there!")
        .font(georgia, 48.0)
        .default_attribute(TextAttribute::TextColor(RED_ALPHA))
        .build()?;

    // let w: f64 = layout.size().width;
    rc.draw_text(&layout, (80.0, 10.0));

    Ok(())
}

type Brush = ();

fn get_command_text_box(lead: Option<&str>, text: &str, font_cx: &mut FontContext, layout_cx: &mut LayoutContext<Brush>) -> (f32, f32) {
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
    for portion in song.children.iter() {
        match portion {
            songbook_grammar::FilePortion::Section { header, lines } => {
                for line in lines.iter() {
                    for content in line.0.iter() {
                        if let songbook_grammar::LineContent::Command{lead, content} = content {

                        }
                        match content {
                            songbook_grammar::LineContent::Text(_) => {},
                            songbook_grammar::LineContent::Command { lead, content } => {
                                let sz = get_command_text_box(lead.as_deref(), &content, &mut font_cx, &mut layout_cx);
                                
                            },
                        }
                    }
                }
            },
            songbook_grammar::FilePortion::PageBreak => {},
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
        index: 5,
        width: 50.0,
        height: 50.0,
    });

    // Build the builder into a Layout
    let mut layout: Layout<()> = builder.build(&TEXT);

    // Run line-breaking and alignment on the Layout
    const MAX_WIDTH: Option<f32> = Some(100.0);
    layout.break_all_lines(MAX_WIDTH);
    layout.align(MAX_WIDTH, Alignment::Start, AlignmentOptions::default());

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

fn render_glyph_run(run: &GlyphRun<Brush>){

}
