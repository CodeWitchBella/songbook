use parley::{LayoutContext, RangedBuilder, StyleProperty};
use songbook_grammar::Line;

use crate::data::{Item, ItemType, Layout};

/// Base em, in screenspace pixels. The reference frontend derives every size
/// from an `em` unit (`pdf-settings.tsx`); here we anchor that em to a fixed
/// pixel value and let the viewport scaling take care of fitting the page.
const EM: f32 = 16.0;
/// Header text is `em(1.2)` in the reference, independent of the song font
/// size.
const HEADER_EM: f32 = 1.2;
/// Space below the header is `em(titleSpace * 1.75)` in the reference.
const TITLE_SPACE_FACTOR: f32 = 1.75;
/// A line that carries chords is `em(fontSize * 2.2)` tall in the reference.
const CHORD_LINE_FACTOR: f32 = 2.2;
/// Small top margin above the header (`marginTop: em(0.75)`).
const HEADER_TOP_MARGIN: f32 = 0.75;

/// Lay out the song, mirroring the geometry decisions of the `../songbook`
/// frontend (`components/pdf-render`).
///
/// The per-song `fontSize`, `paragraphSpace` and `titleSpace` frontmatter
/// values are interpreted as multiples of [`EM`], exactly like the reference's
/// `em()` helper. The header sets the title on the left and the author on the
/// right, both bold. Lines that carry chords reserve `fontSize * 2.2` em of
/// height with the chords sitting one em above the lyric baseline.
///
/// `viewport` is the size of the page's usable content area, used to
/// right-align the author and to shrink the body (but not the header) to fit.
/// Pass `None` to leave the song at its natural size.
pub fn layout_song(
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    viewport: Option<(f64, f64)>,
) -> Layout {
    let fm = song.frontmatter.as_ref();
    let font_px = fm.map(|fm| fm.font_size as f32).unwrap_or(1.0) * EM;
    let para_space = fm.map(|fm| fm.paragraph_space as f32).unwrap_or(1.0) * EM;
    let title_space = fm.map(|fm| fm.title_space as f32).unwrap_or(1.0) * TITLE_SPACE_FACTOR * EM;

    let mut layout: Layout = Layout {
        font_size: font_px as f64,
        items: Default::default(),
    };

    // --- Header -----------------------------------------------------------
    let content_width = viewport.map(|(width, _)| width);
    let title = fm.map(|fm| fm.title.as_str()).unwrap_or("");
    let author = fm.map(|fm| fm.author.as_str()).unwrap_or("");
    let header_px = HEADER_EM * EM;
    let title_width = measure(title, header_px, true, font_cx);
    let author_width = measure(author, header_px, true, font_cx);
    let author_x = match content_width {
        Some(content_width) => (content_width as f32 - author_width).max(0.0),
        None => title_width + header_px,
    };
    // Baseline sits below the top margin by roughly the ascent.
    let header_baseline = HEADER_TOP_MARGIN * EM + header_px;
    layout.items.push(Item {
        text: title.to_owned(),
        item_type: ItemType::Header,
        font_size: header_px,
        width: title_width,
        pos: (0., header_baseline),
    });
    layout.items.push(Item {
        text: author.to_owned(),
        item_type: ItemType::Header,
        font_size: header_px,
        width: author_width,
        pos: (author_x, header_baseline),
    });
    // Space consumed by the header before the body starts: the header line box
    // plus the configured space below it.
    let header_height = HEADER_TOP_MARGIN * EM + header_px * 1.3 + title_space;

    // --- Body -------------------------------------------------------------
    let mut body_items: Vec<Item> = vec![];
    let mut y = 0.0f32;
    for portion in &song.portions {
        match portion {
            songbook_grammar::FilePortion::Section(lines) => {
                for line in lines {
                    let (mut items, line_height) = layout_line(line, font_px, font_cx);
                    for item in &mut items {
                        item.pos.1 += y;
                    }
                    y += line_height;
                    body_items.append(&mut items);
                }
            }
            songbook_grammar::FilePortion::PageBreak => {}
        }
        // The reference emits `em(paragraphSpace)` after every paragraph.
        y += para_space;
    }

    // --- Scale the body to fit the viewport -------------------------------
    let scale = match viewport {
        Some((width, height)) => {
            let (max_right, max_bottom) =
                body_items.iter().fold((0.0_f32, 0.0_f32), |(r, b), item| {
                    ((item.pos.0 + item.width).max(r), item.pos.1.max(b))
                });
            let avail_height = (height - header_height as f64).max(0.0);
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
        item.pos.1 = item.pos.1 * scale + header_height;
        item.width *= scale;
        item.font_size *= scale;
        layout.items.push(item);
    }

    layout
}

/// The concatenated lyric text of a line (chords/commands contribute no text).
fn collect_text(line: &Line) -> String {
    let mut text = String::new();
    for item in &line.content {
        if let songbook_grammar::LineContent::Text(part) = item {
            text.push_str(part);
        }
    }
    text
}

fn prepare_builder<'a>(
    layout_cx: &'a mut LayoutContext<()>,
    font_cx: &'a mut parley::FontContext,
    text: &'a str,
    font_px: f32,
    display_scale: f32,
) -> RangedBuilder<'a, ()> {
    let mut builder = layout_cx.ranged_builder(font_cx, text, display_scale, false);
    builder.push_default(StyleProperty::FontSize(font_px));
    builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(400.0)));
    builder.push_default(StyleProperty::FontFamily(parley::FontFamily::Single(
        parley::FontFamilyName::Named(std::borrow::Cow::Borrowed("Cantarell")),
    )));
    builder.push_default(StyleProperty::LineHeight(
        parley::LineHeight::MetricsRelative(1.0),
    ));
    builder
}

/// Measure the advance width of a bit of text set in the given font size and
/// weight.
pub fn measure(text: &str, font_px: f32, bold: bool, font_cx: &mut parley::FontContext) -> f32 {
    let mut layout_cx = parley::LayoutContext::new();
    let mut builder = prepare_builder(&mut layout_cx, font_cx, text, font_px, 1.0);
    if bold {
        builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(700.0)));
    }
    let mut layout: parley::Layout<()> = builder.build(text);
    layout.break_all_lines(None);
    layout.width()
}

/// Kept for callers that measure plain text at a size.
pub fn measure_text_width(text: &str, font_size: f32, font_cx: &mut parley::FontContext) -> f32 {
    measure(text, font_size, false, font_cx)
}

/// A chord/command parsed from a line, with the reference's prefix conventions
/// resolved: `_` marks a spacer that widens the lyric flow, `^` (optionally
/// after `_`) marks a chord drawn in the normal weight rather than bold.
struct Chord {
    /// Byte offset into the lyric text at which the chord is anchored.
    index: usize,
    /// Visible chord text with the `_`/`^` prefix stripped.
    text: String,
    /// Advance width of the visible chord text.
    width: f32,
    /// `_`-prefixed chords push the following lyrics to the right.
    spacer: bool,
    /// `^`-prefixed chords are drawn in the normal weight.
    normal_weight: bool,
}

fn layout_line(line: &Line, font_px: f32, font_cx: &mut parley::FontContext) -> (Vec<Item>, f32) {
    let complete_text = collect_text(line);

    // Optional tag (návěští, e.g. "R:" / "S:") rendered bold at the start of
    // the line; it shifts everything after it to the right.
    let tag = line.label.as_deref().filter(|t| !t.is_empty());
    let tag_text = tag.map(|t| format!("{t}\u{00a0}"));
    let tag_width = tag_text
        .as_deref()
        .map(|t| measure(t, font_px, true, font_cx))
        .unwrap_or(0.0);

    // Collect the chords in order, resolving their prefixes and measuring the
    // visible text at the appropriate weight.
    let mut chords: Vec<Chord> = vec![];
    {
        let mut index = 0usize;
        for item in &line.content {
            match item {
                songbook_grammar::LineContent::Text(part) => index += part.len(),
                songbook_grammar::LineContent::Command { content, .. } => {
                    let spacer = content.starts_with('_');
                    let rest = content.strip_prefix('_').unwrap_or(content);
                    let normal_weight = rest.starts_with('^');
                    let text = rest.trim_start_matches('^').to_owned();
                    let width = if text.is_empty() {
                        0.0
                    } else {
                        measure(&text, font_px, !normal_weight, font_cx)
                    };
                    chords.push(Chord {
                        index,
                        text,
                        width,
                        spacer,
                        normal_weight,
                    });
                }
            }
        }
    }

    let has_chord = chords.iter().any(|c| !c.text.is_empty());

    // Metrics of the plain lyric line, used to place the baseline.
    let (baseline, natural_height) = line_metrics(&complete_text, font_px, font_cx);
    let descent = (natural_height - baseline).max(0.0);
    let line_height = if has_chord {
        font_px * CHORD_LINE_FACTOR
    } else {
        natural_height.max(font_px)
    };
    // Lyrics sit at the bottom of the (taller) chord line; chords one em above.
    let text_baseline = if has_chord {
        line_height - descent
    } else {
        baseline
    };
    let chord_baseline = text_baseline - font_px;

    let mut out: Vec<Item> = vec![];

    // Lay out the lyric text, inserting zero-width (or spacer-width) inline
    // boxes so parley reports the x anchor of each chord.
    let mut layout_cx = parley::LayoutContext::new();
    let mut builder = prepare_builder(&mut layout_cx, font_cx, &complete_text, font_px, 1.0);
    for (i, chord) in chords.iter().enumerate() {
        builder.push_inline_box(parley::InlineBox {
            id: i as u64,
            kind: parley::InlineBoxKind::InFlow,
            index: chord.index.min(complete_text.len()),
            width: if chord.spacer { chord.width } else { 0.0 },
            height: 0.0,
        });
    }
    let mut text_layout: parley::Layout<()> = builder.build(&complete_text);
    text_layout.break_all_lines(None);

    // Where each chord is anchored horizontally.
    let mut chord_x = vec![0.0f32; chords.len()];
    for pline in text_layout.lines() {
        for item in pline.items() {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    out.push(Item {
                        item_type: ItemType::Text,
                        font_size: font_px,
                        width: glyph_run.advance(),
                        pos: (glyph_run.offset() + tag_width, text_baseline),
                        text: complete_text[glyph_run.run().text_range()].to_owned(),
                    });
                }
                parley::PositionedLayoutItem::InlineBox(inline_box) => {
                    chord_x[inline_box.id as usize] = inline_box.x;
                }
            }
        }
    }

    // Emit the visible chords above the lyrics.
    for (i, chord) in chords.iter().enumerate() {
        if chord.text.is_empty() {
            continue;
        }
        out.push(Item {
            item_type: if chord.normal_weight {
                ItemType::ChordNormal
            } else {
                ItemType::Chord
            },
            font_size: font_px,
            width: chord.width,
            pos: (chord_x[i] + tag_width, chord_baseline),
            text: chord.text.clone(),
        });
    }

    // Emit the tag last so it draws over the (empty) left margin.
    if let Some(tag_text) = tag_text {
        out.push(Item {
            item_type: ItemType::Tag,
            font_size: font_px,
            width: tag_width,
            pos: (0.0, text_baseline),
            text: tag_text.trim_end().to_owned(),
        });
    }

    (out, line_height)
}

/// Baseline offset and natural line height of a plain text line.
fn line_metrics(text: &str, font_px: f32, font_cx: &mut parley::FontContext) -> (f32, f32) {
    let mut layout_cx = parley::LayoutContext::new();
    let measured = if text.is_empty() { " " } else { text };
    let builder = prepare_builder(&mut layout_cx, font_cx, measured, font_px, 1.0);
    let mut layout: parley::Layout<()> = builder.build(measured);
    layout.break_all_lines(None);
    match layout.lines().next() {
        Some(line) => {
            let m = line.metrics();
            (m.baseline, m.line_height)
        }
        None => (font_px, font_px * 1.3),
    }
}
