use parley::{LayoutContext, RangedBuilder, StyleProperty};
use songbook_grammar::Line;

use crate::data::{Item, ItemType, Layout};

/// Base em, in screenspace pixels. Every size is derived from this em unit;
/// the viewport scaling takes care of fitting the page.
const EM: f32 = 16.0;
/// Header text size as a multiple of [`EM`], independent of the song font size.
const HEADER_EM: f32 = 1.2;
/// Height of a line that carries chords, as a multiple of `fontSize` em.
const CHORD_LINE_FACTOR: f32 = 2.2;
/// Floor the chord-line height can be compressed to (as a multiple of
/// `fontSize` em) during the anti-orphan search. On chord-heavy songs this is
/// the highest-leverage lever, since almost every line pays this height.
const CHORD_LINE_FACTOR_FLOOR: f32 = 2.0;
/// Small top margin above the header, in em.
const HEADER_TOP_MARGIN: f32 = 0.75;

/// Space below the header (before the body starts), in em, when the song's
/// first rendered body line carries chords. Chord lines are already tall, so
/// a tighter gap reads better than the no-chords default below.
const HEADER_SPACE_CHORDS_EM: f32 = 0.5;
/// Space below the header, in em, when the first rendered body line has no
/// chords.
const HEADER_SPACE_NO_CHORDS_EM: f32 = 1.0;
/// Floor the header space can be compressed to (see `layout_song`'s
/// anti-orphan search) when a song's last page is nearly empty.
const HEADER_SPACE_FLOOR_EM: f32 = 0.3;
/// Gap inserted before a section, in em, when that section's first rendered
/// line carries chords.
const SECTION_GAP_CHORDS_EM: f32 = 0.7;
/// Gap inserted before a section, in em, when it has no chords.
const SECTION_GAP_NO_CHORDS_EM: f32 = 1.0;
/// Floor a section gap can be compressed to.
const SECTION_GAP_FLOOR_EM: f32 = 0.4;
/// Floor the body font can be scaled to (as a fraction of its natural size)
/// during compression. The header font is never touched.
const FONT_SCALE_FLOOR: f32 = 0.95;
/// Number of discrete steps the anti-orphan compression search tries between
/// the natural layout and the floors above, escalating header space, then
/// section gaps, then chord-line height, then font size (see `layout_song`).
const COMPRESSION_STEPS: u32 = 32;

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// Page metrics of a layout built against a fixed viewport, mirroring the
/// pagination `render_layout_into` performs in songbook-render-pdf (a page
/// break happens whenever an item's y runs `content_height` past the current
/// page's top). Used to compare compression candidates by page count.
struct PageMetrics {
    page_count: u32,
    /// How full the last page is, in `[0, 1]` of `content_height`.
    last_fill_fraction: f32,
    /// How full the second-to-last page is, in `[0, 1]`. `1.0` when there is
    /// only one page. This can be below `1.0` even though it isn't the last
    /// page: a paragraph too tall for the room left gets bumped to the next
    /// page, leaving a gap here.
    prev_fill_fraction: f32,
}
/// Font family for lyrics, tags and the header. Renderers must register their
/// regular/bold faces under this name.
pub const LYRIC_FONT_FAMILY: &str = "Cantarell";
/// Font family for chords (matching the frontend, which sets chords in Atkinson
/// Hyperlegible). Renderers must register its faces under this name.
pub const CHORD_FONT_FAMILY: &str = "Atkinson Hyperlegible";

/// Lay out the song.
///
/// The body is set at [`EM`]; the per-song `fontSize` frontmatter is ignored.
/// The header sets the title on the left and the author on the right,
/// both bold. Lines that carry chords reserve `fontSize * 2.2` em of height
/// with the chords sitting one em above the lyric baseline. Header space and
/// inter-section gaps are chosen automatically from whether the adjoining
/// body line carries chords (see [`build`]).
///
/// `viewport` is the size of the page's usable content area, used to
/// right-align the author and to flow the body across pages: a paragraph
/// that doesn't fit in the room left on the current page starts a fresh one
/// instead of the font size being shrunk. Pass `None` to leave the song as a
/// single, unpaginated flow.
///
/// When paginated with more than one page, and the last two pages' content
/// would overflow a single page by less than 20% (counting the empty space
/// already left on the second-to-last page), this also runs an anti-orphan
/// search: it
/// re-lays the song out with progressively tighter header/section spacing
/// and, as a last resort, a slightly smaller body font, and keeps the first
/// (lightest) variant that fits the song into one fewer page. If none of the
/// tried steps manage that, the natural layout is kept as is.
pub fn layout_song(
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    viewport: Option<(f64, f64)>,
    show_header: bool,
) -> Layout {
    let fm = song.frontmatter.as_ref();
    // The per-song `fontSize` frontmatter is intentionally ignored; every song
    // is laid out at the base em and only the anti-orphan search may shrink it.
    let font_px_base = EM;
    // Chords are transposed by the song's `pretranspose`.
    let transpose = fm.map(|fm| fm.pretranspose.round() as i32).unwrap_or(0);
    let title = fm.map(|fm| fm.title.as_str()).unwrap_or("");
    let author = fm.map(|fm| fm.author.as_str()).unwrap_or("");

    // The header is set at a fixed size regardless of compression (the body
    // font is the only one ever scaled down), so it only needs shaping once.
    // When `show_header` is false, no space is reserved for it at all (used by
    // renderers that draw their own title/author header outside the layout).
    let header_items = if show_header {
        measure_header(title, author, viewport, font_cx)
    } else {
        vec![]
    };

    // Text shaping (parley) only depends on the body font size, which only
    // moves in the last quarter of the compression search below; every other
    // step reuses the same shaped lines. Cache by font size so those steps
    // skip re-shaping the whole song.
    let mut measured_cache: Vec<(u32, Vec<MeasuredParagraph>)> = vec![];

    let (natural_layout, natural_metrics) = {
        let measured = get_measured(&mut measured_cache, song, font_cx, font_px_base, transpose);
        assemble(
            measured,
            &header_items,
            viewport,
            font_px_base,
            0.0,
            0.0,
            0.0,
        )
    };

    // Only paginated layouts are eligible for compression: with no viewport
    // there's no page to save a paragraph from spilling onto.
    let Some(metrics) = natural_metrics else {
        return natural_layout;
    };
    // Trigger the search when the last two pages' combined content would
    // overflow a single page by less than 10% — i.e. the empty space already
    // sitting on the second-to-last page plus the sparse last page nearly add
    // up to one free page. `(prev_fill + last_fill) - 1.0` is that overflow.
    let combined_overflow = metrics.prev_fill_fraction + metrics.last_fill_fraction - 1.0;
    if metrics.page_count <= 1 || combined_overflow >= 0.20 {
        return natural_layout;
    }

    // The last page is nearly empty (an "orphan"): search for the lightest
    // compression that removes one page. Escalate header space, then section
    // gaps, then chord-line height, then body font size — each lever gets an
    // equal quarter of the search's progress, and later levers only start once
    // earlier ones have maxed out — and take the first step that works.
    let target_pages = metrics.page_count - 1;
    for k in 1..=COMPRESSION_STEPS {
        let progress = k as f32 / COMPRESSION_STEPS as f32;
        let t_header = (progress / 0.25).clamp(0.0, 1.0);
        let t_section = ((progress - 0.25) / 0.25).clamp(0.0, 1.0);
        let t_chord = ((progress - 0.50) / 0.25).clamp(0.0, 1.0);
        let t_font = ((progress - 0.75) / 0.25).clamp(0.0, 1.0);
        let font_px = font_px_base * lerp(1.0, FONT_SCALE_FLOOR, t_font);

        let measured = get_measured(&mut measured_cache, song, font_cx, font_px, transpose);
        let (candidate, candidate_metrics) = assemble(
            measured,
            &header_items,
            viewport,
            font_px,
            t_header,
            t_section,
            t_chord,
        );
        // Viewport is `Some` here (checked above), so `assemble` always
        // returns metrics in this branch.
        let cm = candidate_metrics.unwrap();
        if cm.page_count <= target_pages {
            return candidate;
        }
    }

    natural_layout
}

/// Shape the title/author once, at their fixed header size. Never touched by
/// anti-orphan compression, so it's pulled out of the search loop entirely.
fn measure_header(
    title: &str,
    author: &str,
    viewport: Option<(f64, f64)>,
    font_cx: &mut parley::FontContext,
) -> Vec<Item> {
    let content_width = viewport.map(|(width, _)| width);
    let header_px = HEADER_EM * EM;
    let title_width = measure(title, header_px, true, font_cx);
    let author_width = measure(author, header_px, true, font_cx);
    let author_x = match content_width {
        Some(content_width) => (content_width as f32 - author_width).max(0.0),
        None => title_width + header_px,
    };
    // Baseline sits below the top margin by roughly the ascent.
    let header_baseline = HEADER_TOP_MARGIN * EM + header_px;
    let (header_ascent, header_descent) = font_metrics(header_px, true, LYRIC_FONT_FAMILY, font_cx);
    vec![
        Item {
            text: title.to_owned(),
            item_type: ItemType::Header,
            font_size: header_px,
            width: title_width,
            ascent: header_ascent,
            descent: header_descent,
            pos: (0., header_baseline),
        },
        Item {
            text: author.to_owned(),
            item_type: ItemType::Header,
            font_size: header_px,
            width: author_width,
            ascent: header_ascent,
            descent: header_descent,
            pos: (author_x, header_baseline),
        },
    ]
}

/// A paragraph's lines, shaped at a given body font size but not yet placed
/// (no vertical spacing, page flow or chord-line height applied — see
/// [`assemble`]).
struct MeasuredParagraph {
    lines: Vec<MeasuredLine>,
    /// Whether the paragraph's first line carries chords, independent of the
    /// chord-line height compression that only affects placement.
    has_chord: bool,
}

/// Fetch the song shaped at `font_px`, computing and caching it on first use.
/// Most anti-orphan compression steps only touch spacing, not font size, so
/// repeated calls at the same `font_px` are nearly always cache hits.
fn get_measured<'a>(
    cache: &'a mut Vec<(u32, Vec<MeasuredParagraph>)>,
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    font_px: f32,
    transpose: i32,
) -> &'a [MeasuredParagraph] {
    let key = font_px.to_bits();
    if let Some(pos) = cache.iter().position(|(k, _)| *k == key) {
        return &cache[pos].1;
    }
    let measured = measure_song(song, font_cx, font_px, transpose);
    cache.push((key, measured));
    &cache.last().unwrap().1
}

/// Shape every line of the song's body at `font_px`. This is the only part of
/// layout that calls into parley; everything else (spacing, page flow) is
/// cheap arithmetic done in [`assemble`] and safe to redo every compression
/// step.
fn measure_song(
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    font_px: f32,
    transpose: i32,
) -> Vec<MeasuredParagraph> {
    let mut paragraphs: Vec<MeasuredParagraph> = vec![];
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
        // itself rendered (and contributes no section gap).
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

        let mut measured_lines: Vec<MeasuredLine> = vec![];
        let mut first_line_has_chord: Option<bool> = None;
        for line in lines {
            let tag = line
                .label
                .as_deref()
                .and_then(|label| transform_tag(label, &mut verse_counter));
            if hidden {
                continue;
            }
            let measured = measure_line(line, tag, font_px, transpose, chords_off, font_cx);
            if first_line_has_chord.is_none() {
                first_line_has_chord = Some(measured.has_chord);
            }
            measured_lines.push(measured);
        }

        if hidden {
            continue;
        }

        paragraphs.push(MeasuredParagraph {
            lines: measured_lines,
            has_chord: first_line_has_chord.unwrap_or(false),
        });
    }

    paragraphs
}

/// Arrange already-shaped paragraphs into a page-flowed layout: header/section
/// spacing, chord-line height and page breaks. Pure arithmetic over the
/// [`MeasuredParagraph`]s produced by [`measure_song`] — no parley calls — so
/// it's cheap to call once per anti-orphan compression step.
fn assemble(
    measured_paragraphs: &[MeasuredParagraph],
    header_items: &[Item],
    viewport: Option<(f64, f64)>,
    font_px: f32,
    t_header: f32,
    t_section: f32,
    t_chord: f32,
) -> (Layout, Option<PageMetrics>) {
    let chord_line_factor = lerp(CHORD_LINE_FACTOR, CHORD_LINE_FACTOR_FLOOR, t_chord);
    let header_px = HEADER_EM * EM;

    let mut layout: Layout = Layout {
        font_size: font_px as f64,
        items: header_items.to_vec(),
    };

    struct Paragraph {
        items: Vec<Item>,
        height: f32,
        has_chord: bool,
    }
    let mut paragraphs: Vec<Paragraph> = Vec::with_capacity(measured_paragraphs.len());
    for mp in measured_paragraphs {
        let mut paragraph_items: Vec<Item> = vec![];
        let mut local_y = 0.0f32;
        for line in &mp.lines {
            let (mut items, line_height) = place_line(line, font_px, chord_line_factor);
            for item in &mut items {
                item.pos.1 += local_y;
            }
            local_y += line_height;
            paragraph_items.append(&mut items);
        }
        paragraphs.push(Paragraph {
            items: paragraph_items,
            height: local_y,
            has_chord: mp.has_chord,
        });
    }

    // Header space is sized off the FIRST rendered paragraph's chords; each
    // gap between section i and i+1 is sized off section i+1's chords (a gap
    // is a "coming up" cue, not a "just finished" one). Compression pulls
    // both toward their floors via `t_header`/`t_section`.
    let first_has_chord = paragraphs.first().map(|p| p.has_chord).unwrap_or(false);
    let header_space_base = if first_has_chord {
        HEADER_SPACE_CHORDS_EM
    } else {
        HEADER_SPACE_NO_CHORDS_EM
    };
    let header_space = lerp(header_space_base, HEADER_SPACE_FLOOR_EM, t_header) * EM;
    // Space consumed by the header before the body starts: the header line box
    // plus the (compressible) space below it. No header items means the
    // caller opted out of the header entirely, so no space is reserved.
    let header_height = if header_items.is_empty() {
        0.0
    } else {
        HEADER_TOP_MARGIN * EM + header_px * 1.3 + header_space
    };

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

    let n = paragraphs.len();
    for i in 0..n {
        let paragraph_height = paragraphs[i].height;

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

        for mut item in std::mem::take(&mut paragraphs[i].items) {
            item.pos.1 += y;
            body_items.push(item);
        }
        y += paragraph_height;

        // Gap before the NEXT section, sized off whether it has chords; none
        // after the last one.
        if i + 1 < n {
            let gap_base = if paragraphs[i + 1].has_chord {
                SECTION_GAP_CHORDS_EM
            } else {
                SECTION_GAP_NO_CHORDS_EM
            };
            y += lerp(gap_base, SECTION_GAP_FLOOR_EM, t_section) * EM;
        }
    }

    for mut item in body_items {
        item.pos.1 += header_height;
        layout.items.push(item);
    }

    let metrics = content_height.map(|content_height| {
        let max_y = layout
            .items
            .iter()
            .filter(|item| !item.text.trim().is_empty())
            .map(|item| item.pos.1)
            .fold(0.0f32, f32::max);
        let page_count = (max_y / content_height).floor() as u32 + 1;
        let last_fill_fraction =
            (max_y - (page_count - 1) as f32 * content_height) / content_height;
        // Fill of the second-to-last page: the lowest baseline that still lands
        // on page `page_count - 2`, measured from that page's top.
        let prev_fill_fraction = if page_count < 2 {
            1.0
        } else {
            let prev_top = (page_count - 2) as f32 * content_height;
            let prev_max_y = layout
                .items
                .iter()
                .filter(|item| !item.text.trim().is_empty())
                .map(|item| item.pos.1)
                .filter(|&y| y >= prev_top && y - prev_top <= content_height)
                .fold(prev_top, f32::max);
            (prev_max_y - prev_top) / content_height
        };
        PageMetrics {
            page_count,
            last_fill_fraction,
            prev_fill_fraction,
        }
    });

    (layout, metrics)
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

/// A line shaped at a given font size, not yet placed: text/tag items carry
/// `pos.1 == 0.0` and chord items `pos.1 == -font_px`, i.e. their offset from
/// the text baseline, since a chord always sits exactly one em above it
/// regardless of chord-line height compression. [`place_line`] turns these
/// offsets into absolute y once it knows this step's chord-line factor.
struct MeasuredLine {
    items: Vec<Item>,
    baseline: f32,
    descent: f32,
    has_chord: bool,
}

/// Shape a line's text and chords at `font_px` — the only part of laying out
/// a line that calls into parley. Vertical placement (which depends on the
/// anti-orphan search's chord-line compression) is deferred to [`place_line`]
/// so it can be redone cheaply without re-shaping.
fn measure_line(
    line: &Line,
    tag: Option<String>,
    font_px: f32,
    transpose: i32,
    hide_chords: bool,
    font_cx: &mut parley::FontContext,
) -> MeasuredLine {
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
    // Text/tag items are anchored at the text baseline (offset 0); chords
    // always sit exactly one em above it.
    let text_baseline_offset = 0.0f32;
    let chord_baseline_offset = -font_px;

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
                        ascent: baseline,
                        descent,
                        pos: (glyph_run.offset() + tag_width, text_baseline_offset),
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
        let (chord_ascent, chord_descent) =
            font_metrics(font_px, !chord.normal_weight, CHORD_FONT_FAMILY, font_cx);
        out.push(Item {
            item_type: if chord.normal_weight {
                ItemType::ChordNormal
            } else {
                ItemType::Chord
            },
            font_size: font_px,
            width: chord.width,
            ascent: chord_ascent,
            descent: chord_descent,
            pos: (chord_x[i] + tag_width, chord_baseline_offset),
            text: chord.text.clone(),
        });
    }

    // Emit the tag last so it draws over the (empty) left margin.
    if let Some(tag_text) = tag_text {
        out.push(Item {
            item_type: ItemType::Tag,
            font_size: font_px,
            width: tag_width,
            ascent: baseline,
            descent,
            pos: (0.0, text_baseline_offset),
            text: tag_text.trim_end().to_owned(),
        });
    }

    MeasuredLine {
        items: out,
        baseline,
        descent,
        has_chord,
    }
}

/// Turn a shaped line's baseline-relative item offsets into absolute
/// positions for a given chord-line height factor, and report the line's
/// total height. Pure arithmetic — no parley calls — so it's cheap to redo
/// for every anti-orphan compression step even when the shaping is cached.
fn place_line(measured: &MeasuredLine, font_px: f32, chord_line_factor: f32) -> (Vec<Item>, f32) {
    let line_height = if measured.has_chord {
        font_px * chord_line_factor
    } else {
        (measured.baseline + measured.descent).max(font_px)
    };
    // Lyrics sit at the bottom of the (taller) chord line; chords one em above.
    let text_baseline = if measured.has_chord {
        line_height - measured.descent
    } else {
        measured.baseline
    };
    let items = measured
        .items
        .iter()
        .cloned()
        .map(|mut item| {
            item.pos.1 += text_baseline;
            item
        })
        .collect();
    (items, line_height)
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

/// Baseline offset and natural line height of a plain text line, in the lyric
/// font.
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

/// An item's own ascent/descent (distance from its baseline to its natural
/// top/bottom) at a given font size, weight and family — a pure font metric,
/// independent of the text content shaped in it. See [`Item::ascent`].
fn font_metrics(
    font_px: f32,
    bold: bool,
    family: &str,
    font_cx: &mut parley::FontContext,
) -> (f32, f32) {
    let mut layout_cx = parley::LayoutContext::new();
    let text = " ";
    let mut builder = prepare_builder(&mut layout_cx, font_cx, text, font_px, family, 1.0);
    if bold {
        builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(700.0)));
    }
    let mut layout: parley::Layout<()> = builder.build(text);
    layout.break_all_lines(None);
    match layout.lines().next() {
        Some(line) => {
            let m = line.metrics();
            (m.baseline, (m.line_height - m.baseline).max(0.0))
        }
        None => (font_px, font_px * 0.3),
    }
}
