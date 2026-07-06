use parley::{LayoutContext, RangedBuilder, StyleProperty};
use songbook_grammar::Line;

use crate::data::{Item, ItemType, Layout};

/// Base em, in screenspace pixels. Every size is derived from this em unit;
/// the viewport scaling takes care of fitting the page.
const EM: f32 = 16.0;
/// Header text size as a multiple of [`EM`], independent of the song font size.
const HEADER_EM: f32 = 1.2;
/// Space below the header, as a multiple of `titleSpace` em.
const TITLE_SPACE_FACTOR: f32 = 1.75;
/// Height of a line that carries chords, as a multiple of `fontSize` em.
const CHORD_LINE_FACTOR: f32 = 2.2;
/// Small top margin above the header, in em.
const HEADER_TOP_MARGIN: f32 = 0.75;
/// Font family for lyrics, tags and the header. Renderers must register their
/// regular/bold faces under this name.
pub const LYRIC_FONT_FAMILY: &str = "Cantarell";
/// Font family for chords (matching the frontend, which sets chords in Atkinson
/// Hyperlegible). Renderers must register its faces under this name.
pub const CHORD_FONT_FAMILY: &str = "Atkinson Hyperlegible";

/// Lay out the song.
///
/// The per-song `fontSize`, `paragraphSpace` and `titleSpace` frontmatter
/// values are interpreted as multiples of [`EM`]. The header sets the title on
/// the left and the author on the right, both bold. Lines that carry chords
/// reserve `fontSize * 2.2` em of height with the chords sitting one em above
/// the lyric baseline.
///
/// `viewport` is the size of the page's usable content area, used to
/// right-align the author and to flow the body across pages: a paragraph
/// that doesn't fit in the room left on the current page starts a fresh one
/// instead of the font size being shrunk. Pass `None` to leave the song as a
/// single, unpaginated flow.
pub fn layout_song(
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    viewport: Option<(f64, f64)>,
) -> Layout {
    let fm = song.frontmatter.as_ref();
    let font_px = fm.map(|fm| fm.font_size as f32).unwrap_or(1.0) * EM;
    let para_space = fm.map(|fm| fm.paragraph_space as f32).unwrap_or(1.0) * EM;
    let title_space = fm.map(|fm| fm.title_space as f32).unwrap_or(1.0) * TITLE_SPACE_FACTOR * EM;
    // Chords are transposed by the song's `pretranspose`.
    let transpose = fm.map(|fm| fm.pretranspose.round() as i32).unwrap_or(0);

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
    // Page flow bookkeeping, in body-y coordinates (i.e. before the global
    // `header_height` offset added at the end is folded back in). `page_end`
    // is where the current page runs out of room. Only the first page loses
    // `header_height` of space to the header; every later page gets the full
    // page height, matching the item-level page-splitting `render_layout_into`
    // (songbook-render-pdf/src/lib.rs) already does against the same
    // continuous y coordinate.
    let content_height = viewport.map(|(_, height)| height as f32);
    let mut page_end = content_height.map(|h| h - header_height);
    // Running verse counter, threaded across the whole song so that `S:` tags
    // render as `1.`, `2.`, ….
    let mut verse_counter = 0u32;
    // Command state threaded across the song, mirroring `parseSongMyFormat`
    // in the frontend. This renderer produces the paged (non-continuous) view,
    // so chord on/off is honoured and the `paged` variant is the one shown.
    let requested_variant = Variant::Paged;
    let mut chords_off = false;
    let mut variant = Variant::Both;

    for portion in &song.portions {
        let songbook_grammar::FilePortion::Section(lines) = portion else {
            // `PageBreak`: this renderer lays the song out as a single flow.
            continue;
        };

        // A paragraph made up entirely of `>`-commands sets state and is not
        // itself rendered (and contributes no paragraph space).
        if let Some(commands) = command_block(lines) {
            for (cmd, args) in commands {
                match cmd {
                    "chords" => match args {
                        "off" => chords_off = true,
                        "on" => chords_off = false,
                        _ => {}
                    },
                    "variant" => variant = Variant::parse(args),
                    _ => {}
                }
            }
            continue;
        }

        // Variants other than `both` that don't match the requested one hide
        // the whole paragraph (frontend blanks the parts, then drops the empty
        // paragraph). The verse counter still advances so numbering matches.
        let hidden = variant != Variant::Both && variant != requested_variant;

        let mut paragraph_items: Vec<Item> = vec![];
        let mut local_y = 0.0f32;
        for line in lines {
            let tag = line
                .label
                .as_deref()
                .and_then(|label| transform_tag(label, &mut verse_counter));
            if hidden {
                continue;
            }
            let (mut items, line_height) =
                layout_line(line, tag, font_px, transpose, chords_off, font_cx);
            for item in &mut items {
                item.pos.1 += local_y;
            }
            local_y += line_height;
            paragraph_items.append(&mut items);
        }

        if hidden {
            continue;
        }

        let paragraph_height = local_y;

        // If the paragraph doesn't fit in the room left on the current page
        // but would fit whole on a fresh page, start a new page instead of
        // shrinking (see tickets/01-multipage-flow.md). A paragraph taller
        // than a full page is left to overflow across pages; the renderer's
        // item-level page splitting still keeps it from being lost.
        if let (Some(end), Some(page_height)) = (page_end, content_height) {
            if y + paragraph_height > end && paragraph_height <= page_height {
                y = end;
                page_end = Some(end + page_height);
            }
        }

        for mut item in paragraph_items {
            item.pos.1 += y;
            body_items.push(item);
        }
        y += paragraph_height;
        // `em(paragraphSpace)` after every rendered paragraph.
        y += para_space;
    }

    for mut item in body_items {
        item.pos.1 += header_height;
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
    family: &'a str,
    display_scale: f32,
) -> RangedBuilder<'a, ()> {
    let mut builder = layout_cx.ranged_builder(font_cx, text, display_scale, false);
    builder.push_default(StyleProperty::FontSize(font_px));
    builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(400.0)));
    builder.push_default(StyleProperty::FontFamily(parley::FontFamily::Single(
        parley::FontFamilyName::Named(std::borrow::Cow::Borrowed(family)),
    )));
    builder.push_default(StyleProperty::LineHeight(
        parley::LineHeight::MetricsRelative(1.0),
    ));
    builder
}

/// Measure the advance width of a bit of text set in the given font size and
/// weight, using the lyric font family.
pub fn measure(text: &str, font_px: f32, bold: bool, font_cx: &mut parley::FontContext) -> f32 {
    measure_in(text, font_px, bold, LYRIC_FONT_FAMILY, font_cx)
}

/// Measure the advance width of text set in the given font size, weight and
/// font family.
fn measure_in(
    text: &str,
    font_px: f32,
    bold: bool,
    family: &str,
    font_cx: &mut parley::FontContext,
) -> f32 {
    let mut layout_cx = parley::LayoutContext::new();
    let mut builder = prepare_builder(&mut layout_cx, font_cx, text, font_px, family, 1.0);
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

/// Advance width *including* trailing whitespace. parley's `width()` trims
/// trailing whitespace, but the frontend flows tag/spacer whitespace as real
/// space (an `&nbsp;` after the tag, invisible spacer chords). Measure with a
/// sentinel appended and subtract it so that space survives.
fn measure_trailing(
    text: &str,
    font_px: f32,
    bold: bool,
    family: &str,
    font_cx: &mut parley::FontContext,
) -> f32 {
    if !text.starts_with(char::is_whitespace) && !text.ends_with(char::is_whitespace) {
        return measure_in(text, font_px, bold, family, font_cx);
    }
    // Sandwich the text between sentinels so parley trims neither the leading
    // nor the trailing whitespace, then subtract the two sentinels' own width.
    const SENTINEL: &str = ".";
    measure_in(
        &format!("{SENTINEL}{text}{SENTINEL}"),
        font_px,
        bold,
        family,
        font_cx,
    ) - measure_in(
        &format!("{SENTINEL}{SENTINEL}"),
        font_px,
        bold,
        family,
        font_cx,
    )
}

/// A chord/command parsed from a line, with its prefix conventions resolved:
/// `_` marks a spacer that widens the lyric flow, `^` (optionally after `_`)
/// marks a chord drawn in the normal weight rather than bold.
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

fn layout_line(
    line: &Line,
    tag: Option<String>,
    font_px: f32,
    transpose: i32,
    hide_chords: bool,
    font_cx: &mut parley::FontContext,
) -> (Vec<Item>, f32) {
    // Build the lyric flow text and collect chords in a single pass. `[*…]`
    // commands are bold inline lyric text (not chords), so they join the flow
    // and survive `chords off`; `_`/`^` leads mark spacers and normal-weight
    // chords. Chord byte offsets index into the flow text built here.
    let mut complete_text = String::new();
    let mut bold_ranges: Vec<std::ops::Range<usize>> = vec![];
    let mut chords: Vec<Chord> = vec![];
    for item in &line.content {
        match item {
            songbook_grammar::LineContent::Text(part) => complete_text.push_str(part),
            songbook_grammar::LineContent::Command { lead, content } => {
                let lead = lead.as_deref().unwrap_or("");
                // `[*X]` renders X as bold lyric text (frontend `parseLine`).
                if lead.is_empty() && content.starts_with('*') {
                    let start = complete_text.len();
                    complete_text.push_str(&content[1..]);
                    bold_ranges.push(start..complete_text.len());
                    continue;
                }
                if hide_chords {
                    continue;
                }
                // The grammar captures the `_` (spacer) and `^` (normal weight)
                // markers in the command's lead, e.g. `[_^Emi]`.
                let spacer = lead.contains('_');
                let normal_weight = lead.contains('^');
                let text = transpose_chord_line(content, transpose);
                let width = if text.is_empty() {
                    0.0
                } else if spacer {
                    // Spacers push following lyrics right by their (often
                    // all-whitespace) advance, so keep trailing space.
                    measure_trailing(&text, font_px, !normal_weight, CHORD_FONT_FAMILY, font_cx)
                } else {
                    measure_in(&text, font_px, !normal_weight, CHORD_FONT_FAMILY, font_cx)
                };
                chords.push(Chord {
                    index: complete_text.len(),
                    text,
                    width,
                    spacer,
                    normal_weight,
                });
            }
        }
    }

    // Optional tag (návěští, e.g. "R." / "1.") rendered bold at the start of
    // the line; it shifts everything after it to the right.
    let tag = tag.filter(|t| !t.is_empty());
    let tag_text = tag.as_deref().map(|t| format!("{t}\u{00a0}"));
    let tag_width = tag_text
        .as_deref()
        .map(|t| measure_trailing(t, font_px, true, LYRIC_FONT_FAMILY, font_cx))
        .unwrap_or(0.0);

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
    let mut builder = prepare_builder(
        &mut layout_cx,
        font_cx,
        &complete_text,
        font_px,
        LYRIC_FONT_FAMILY,
        1.0,
    );
    for range in &bold_ranges {
        builder.push(
            StyleProperty::FontWeight(parley::FontWeight::new(700.0)),
            range.clone(),
        );
    }
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
                    let range = glyph_run.run().text_range();
                    // A run is bold if it lies within a `[*…]` bold range.
                    let bold = bold_ranges
                        .iter()
                        .any(|r| r.start <= range.start && range.end <= r.end);
                    out.push(Item {
                        item_type: if bold {
                            ItemType::BoldText
                        } else {
                            ItemType::Text
                        },
                        font_size: font_px,
                        width: glyph_run.advance(),
                        pos: (glyph_run.offset() + tag_width, text_baseline),
                        text: complete_text[range].to_owned(),
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

/// Note names in sharp and flat spelling, indexed by semitone (Czech `H` = B
/// natural).
const SHARP_NOTES: [&str; 12] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H",
];
const FLAT_NOTES: [&str; 12] = [
    "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "B", "H",
];

fn remainder(num: i32, div: i32) -> i32 {
    ((num % div) + div) % div
}

/// Transpose a single chord token by `t` semitones, replacing its root note.
/// Match the longest note prefix in the sharp list first, then the flat list,
/// and replace it with the transposed note from the same spelling.
fn transpose_chord(chord: &str, t: i32) -> String {
    for list in [&SHARP_NOTES, &FLAT_NOTES] {
        // Indices sorted so multi-character notes (C#, Db, …) match first.
        let mut order: Vec<usize> = (0..list.len()).collect();
        order.sort_by_key(|&i| std::cmp::Reverse(list[i].len()));
        for i in order {
            if chord.starts_with(list[i]) {
                let replacement = list[remainder(i as i32 + t, list.len() as i32) as usize];
                return chord.replacen(list[i], replacement, 1);
            }
        }
    }
    chord.to_owned()
}

/// Transpose every space-separated chord in a chord string (e.g. "Emi Edim H7").
fn transpose_chord_line(chords: &str, t: i32) -> String {
    if t == 0 {
        return chords.to_owned();
    }
    chords
        .split(' ')
        .map(|c| transpose_chord(c, t))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Which of a song's variants a paragraph belongs to. `paged`/`long` blocks are
/// only shown in the matching render mode; `both` (the default) is always shown.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Variant {
    Both,
    Paged,
    Long,
}

impl Variant {
    /// Parse a `>variant …` argument, defaulting to `both` for an empty or
    /// unknown value, mirroring `handleCommand` in the frontend.
    fn parse(arg: &str) -> Self {
        match arg {
            "paged" => Variant::Paged,
            "long" => Variant::Long,
            _ => Variant::Both,
        }
    }
}

/// If every line of a paragraph is a bare `>`-command (lead `>`, no lyric text,
/// no tag), return the parsed `(command, args)` pairs; otherwise `None`. Matches
/// `parseCommands` in the frontend: a single non-command line disqualifies the
/// whole paragraph.
fn command_block(lines: &[Line]) -> Option<Vec<(&str, &str)>> {
    let mut commands = vec![];
    for line in lines {
        if line.label.is_some() || line.content.len() != 1 {
            return None;
        }
        match &line.content[0] {
            songbook_grammar::LineContent::Command {
                lead: Some(lead),
                content,
            } if lead == ">" => {
                let (cmd, args) = content.split_once(' ').unwrap_or((content, ""));
                commands.push((cmd, args));
            }
            _ => return None,
        }
    }
    Some(commands)
}

/// Rewrite a raw line label into its displayed tag: `S:` verses become the
/// running verse number (`1.`, `2.`, …), and `R`/`R1:` choruses become
/// `R.` / `R1.`.
fn transform_tag(label: &str, verse_counter: &mut u32) -> Option<String> {
    let label = label.trim();
    if label.is_empty() {
        return None;
    }
    if let Some(rest) = label.strip_prefix("S:") {
        *verse_counter += 1;
        let rest = rest.trim();
        if rest.is_empty() {
            Some(format!("{verse_counter}."))
        } else {
            Some(format!("{verse_counter}. = {rest}."))
        }
    } else if let Some(inner) = label
        .strip_prefix('R')
        .and_then(|rest| rest.strip_suffix(':'))
        .filter(|inner| inner.chars().all(|c| c.is_ascii_digit()))
    {
        Some(format!("R{inner}."))
    } else {
        Some(label.to_owned())
    }
}

/// Baseline offset and natural line height of a plain text line.
fn line_metrics(text: &str, font_px: f32, font_cx: &mut parley::FontContext) -> (f32, f32) {
    let mut layout_cx = parley::LayoutContext::new();
    let measured = if text.is_empty() { " " } else { text };
    let builder = prepare_builder(
        &mut layout_cx,
        font_cx,
        measured,
        font_px,
        LYRIC_FONT_FAMILY,
        1.0,
    );
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
