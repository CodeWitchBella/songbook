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
/// `fontSize` em). On chord-heavy songs this is the highest-leverage lever,
/// since almost every line pays this height.
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
/// Floor the header space can be compressed to.
const HEADER_SPACE_FLOOR_EM: f32 = 0.3;
/// Gap inserted before a section, in em, when that section's first rendered
/// line carries chords.
const SECTION_GAP_CHORDS_EM: f32 = 0.7;
/// Gap inserted before a section, in em, when it has no chords.
const SECTION_GAP_NO_CHORDS_EM: f32 = 1.0;
/// Floor a section gap can be compressed to.
const SECTION_GAP_FLOOR_EM: f32 = 0.4;
/// Number of discrete steps the compression search tries between the natural
/// layout and the floors above, escalating header space, then section gaps,
/// then chord-line height (see [`compression_at`]).
const COMPRESSION_STEPS: u32 = 16;

/// How far above the ideal size the body font may be grown, as a multiple of
/// it.
const MAX_GROWTH: f32 = 3.0;
/// Granularity of the font size search, in px.
const FONT_SEARCH_STEP_PX: f32 = 0.5;

/// How the body font size is chosen. Without one (`None` in [`layout_song`])
/// the song is set at the fixed base [`EM`] and long lines always wrap to the
/// content width — the behaviour every renderer had before auto-fit.
#[derive(Clone, Copy, Debug)]
pub struct FontSizing {
    /// The size the body is set at when the song fits at it, in px. It's only
    /// grown beyond this when the song still fits with its spacing untouched
    /// and no line wrapped, and only shrunk below it once compressing spacing
    /// is no longer enough.
    pub ideal_font_size: f32,
    /// The smallest size the body is shrunk to, in px. At this size long lines
    /// wrap and the song spills onto as many pages as it needs.
    pub minimal_font_size: f32,
    /// Gutter the caller leaves between columns, in px. Pages are packed side
    /// by side into the viewport's width, so a song only counts as not fitting
    /// once it needs more pages than fit as columns — laying it out in two
    /// columns is preferred over shrinking the text.
    pub column_gap: f32,
    /// What to do with the chords of a section that plays the same chords as
    /// an earlier one.
    pub repeated_chords: RepeatedChords,
}

/// What becomes of the chords over a section that plays the same chords as an
/// earlier one (see [`chord_pattern`]). Dropping them saves the room the chord
/// lines take, and costs the player nothing as long as that earlier section is
/// on the same screen to read them off — which is a precondition in either
/// mode that drops them (see [`hideable_repeats`]).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RepeatedChords {
    /// Every section keeps its chords; only the font size and spacing give way.
    Keep,
    /// Repeats drop their chords when that's what it takes to fit — after
    /// tightening the spacing has been tried, and gladly in exchange for a
    /// bigger font.
    WhenNeeded,
    /// Repeats never show chords, whether or not the song would have fitted
    /// with them.
    Always,
}

impl RepeatedChords {
    /// Whether to try laying the song out with the repeats' chords kept, then
    /// dropped, or only one of the two.
    ///
    /// `concessions` says whether this size is one the song may give something
    /// up for — false above the ideal size, where growing the text is only
    /// worth it if nothing is sacrificed. Dropping chords to make a *larger*
    /// font fit is exactly such a sacrifice, so [`RepeatedChords::WhenNeeded`]
    /// keeps them there and settles for the smaller size that shows them.
    /// [`RepeatedChords::Always`] isn't fitting the song at all — it's how the
    /// reader wants repeats set — so it drops them at any size.
    fn passes(self, concessions: bool) -> &'static [bool] {
        match self {
            RepeatedChords::Keep => &[false],
            RepeatedChords::WhenNeeded if concessions => &[false, true],
            RepeatedChords::WhenNeeded => &[false],
            RepeatedChords::Always => &[true],
        }
    }
}

impl Default for FontSizing {
    fn default() -> Self {
        FontSizing {
            ideal_font_size: EM,
            minimal_font_size: EM * 0.85,
            column_gap: 48.0,
            repeated_chords: RepeatedChords::Keep,
        }
    }
}

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// How hard the `k`-th compression step squeezes each of the levers, as
/// `(header space, section gaps, chord-line height)` fractions of the way from
/// the natural spacing to its floor. Each lever gets an equal third of the
/// search's progress and later ones only start once earlier ones have maxed
/// out, so step 0 is the natural layout and every step after it is strictly
/// tighter. The font size is never a lever here — that's the outer search in
/// [`pick_font_size`].
fn compression_at(k: u32) -> (f32, f32, f32) {
    let progress = k as f32 / COMPRESSION_STEPS as f32;
    (
        (progress / 0.34).clamp(0.0, 1.0),
        ((progress - 0.33) / 0.34).clamp(0.0, 1.0),
        ((progress - 0.66) / 0.34).clamp(0.0, 1.0),
    )
}
/// Font family for lyrics, tags and the header. Renderers must register their
/// regular/bold faces under this name.
pub const LYRIC_FONT_FAMILY: &str = "Cantarell";
/// Font family for chords (matching the frontend, which sets chords in Atkinson
/// Hyperlegible). Renderers must register its faces under this name.
pub const CHORD_FONT_FAMILY: &str = "Atkinson Hyperlegible";

/// Lay out the song.
///
/// With `sizing` given (and a viewport to fit into) the body font is chosen by
/// [`pick_font_size`]. Without it the body is set at [`EM`]. The per-song
/// `fontSize` frontmatter is ignored either way.
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
/// Once the size is settled, a paginated layout that still doesn't fit is run
/// through the compression search: progressively tighter header/section
/// spacing and chord-line height (see [`compression_at`]), keeping the first
/// (lightest) variant that does fit. If none of the tried steps manage that,
/// the natural layout is kept as is and the song simply spills over.
pub fn layout_song(
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    viewport: Option<(f64, f64)>,
    show_header: bool,
    sizing: Option<FontSizing>,
) -> Layout {
    let fm = song.frontmatter.as_ref();
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

    // Shaped lines for the sizes the search tries. Compression never touches
    // the font size, so every compression step at a size reuses one entry —
    // see [`MeasureCache`] for how sizes share a single parley pass.
    let mut measured_cache = MeasureCache::default();

    let content_width = viewport.map(|(width, _)| width as f32);
    // Lines only ever wrap at the minimal size — above it a too-wide line is
    // dealt with by shrinking the font instead. Without a sizing policy they
    // always wrap to the content width (the behaviour every renderer had
    // before auto-fit).
    let wrap_width = |font_px: f32| -> Option<f32> {
        match sizing {
            None => content_width,
            Some(sizing) if font_px <= sizing.minimal_font_size => content_width,
            Some(_) => None,
        }
    };

    // Fit the body to the viewport, unless the caller opted out of auto-fit or
    // there's no page to fit into. `row_budget` is how many rows of columns the
    // song is allowed to take — one, unless it can't be squeezed into one even
    // at its smallest (see [`pick_font_size`]).
    let (font_px, row_budget) = match (sizing, viewport) {
        (Some(sizing), Some(_)) => pick_font_size(
            sizing,
            &mut measured_cache,
            song,
            font_cx,
            &header_items,
            viewport,
            transpose,
            &wrap_width,
        ),
        _ => (EM, 1),
    };

    let measured = measured_cache.get(song, font_cx, font_px, transpose, wrap_width(font_px));
    best_layout_at(
        measured,
        &header_items,
        viewport,
        font_px,
        sizing,
        // Tighter spacing, and dropped repeat chords, are what fitting at or
        // below the ideal size may cost; a size grown past it has to fit as it
        // is.
        sizing.is_none_or(|sizing| font_px <= sizing.ideal_font_size),
        row_budget,
    )
    .map(|(layout, _)| layout)
    // A line wider than the viewport even at the minimal size (an unbreakable
    // long word, say) leaves nothing that fits; lay it out naturally and let
    // it overflow.
    .unwrap_or_else(|| {
        assemble(
            measured,
            &header_items,
            viewport,
            font_px,
            0.0,
            0.0,
            0.0,
            &[],
        )
        .0
    })
}

/// Lay the song out at `font_px`, giving ground until it takes at most
/// `row_budget` rows of columns, and return that layout with the rows it takes.
///
/// What it's willing to give up, in order: nothing, then spacing, and finally
/// — under [`RepeatedChords::WhenNeeded`] — the chords of sections that repeat
/// an earlier one. Chords go last, so a song only loses them when squeezing
/// the spacing genuinely wasn't enough. Both are concessions to fitting, so
/// both are off (`allow_concessions`) above the ideal size, where a bigger
/// font is only worth having if it costs nothing. Under
/// [`RepeatedChords::Always`] the chords are gone from the start at any size
/// and the rest is fitted around that.
///
/// When nothing gets there the fewest-rows attempt is returned instead, and
/// `None` when a line is wider than the viewport, which neither lever can fix
/// and only a smaller font can.
fn best_layout_at(
    measured: &[MeasuredParagraph],
    header_items: &[Item],
    viewport: Option<(f64, f64)>,
    font_px: f32,
    sizing: Option<FontSizing>,
    allow_concessions: bool,
    row_budget: u32,
) -> Option<(Layout, u32)> {
    let steps = if allow_concessions {
        COMPRESSION_STEPS
    } else {
        0
    };
    let mut best: Option<(Layout, u32)> = None;
    for &hide_repeats in repeated_chords(sizing).passes(allow_concessions) {
        for k in 0..=steps {
            let (t_header, t_section, t_chord) = compression_at(k);
            let (layout, pages) = if hide_repeats {
                assemble_hiding_repeats(
                    measured,
                    header_items,
                    viewport,
                    font_px,
                    (t_header, t_section, t_chord),
                    sizing,
                )
            } else {
                let (layout, pages, _) = assemble(
                    measured,
                    header_items,
                    viewport,
                    font_px,
                    t_header,
                    t_section,
                    t_chord,
                    &[],
                );
                (layout, pages)
            };
            if let Some((width, _)) = viewport {
                if content_right_extent(&layout) > width as f32 {
                    return None;
                }
            }
            let rows = match pages {
                // Unpaginated: there's nothing to overflow.
                None => 1,
                Some(pages) => pages.div_ceil(column_count(&layout, viewport, sizing)),
            };
            if rows <= row_budget {
                return Some((layout, rows));
            }
            if best.as_ref().is_none_or(|(_, best_rows)| rows < *best_rows) {
                best = Some((layout, rows));
            }
        }
    }
    best
}

/// How this layout treats the chords over repeated sections. Callers without
/// a sizing policy (the PDF and canvas renderers) keep every chord.
fn repeated_chords(sizing: Option<FontSizing>) -> RepeatedChords {
    sizing.map_or(RepeatedChords::Keep, |sizing| sizing.repeated_chords)
}

/// How many times the hidden-chord set is allowed to be revised before the
/// layout is taken as it stands. Each round only ever gives chords back, so it
/// settles quickly; the cap is just a guard.
const HIDE_RESOLUTION_ROUNDS: usize = 8;

/// Assemble with the chords of repeated sections dropped wherever that's
/// allowed — that is, wherever the reader can still see them on an earlier
/// copy of the same section on the same screen.
///
/// Which sections may lose their chords depends on where they land, and where
/// they land depends on which ones lost their chords, so this settles the two
/// against each other: hide every repeat, see where everything ended up, give
/// the chords back to any repeat whose earlier copy turns out to be on another
/// screen, and go round again until nothing changes.
fn assemble_hiding_repeats(
    measured: &[MeasuredParagraph],
    header_items: &[Item],
    viewport: Option<(f64, f64)>,
    font_px: f32,
    compression: (f32, f32, f32),
    sizing: Option<FontSizing>,
) -> (Layout, Option<u32>) {
    let (t_header, t_section, t_chord) = compression;
    let mut hidden: Vec<bool> = measured
        .iter()
        .map(|paragraph| paragraph.repeat_of.is_some() && paragraph.has_chord)
        .collect();
    let mut assembled = assemble(
        measured,
        header_items,
        viewport,
        font_px,
        t_header,
        t_section,
        t_chord,
        &hidden,
    );
    for _ in 0..HIDE_RESOLUTION_ROUNDS {
        if !hideable_repeats(
            measured,
            &assembled.0,
            &assembled.2,
            viewport,
            sizing,
            &mut hidden,
        ) {
            break;
        }
        assembled = assemble(
            measured,
            header_items,
            viewport,
            font_px,
            t_header,
            t_section,
            t_chord,
            &hidden,
        );
    }
    (assembled.0, assembled.1)
}

/// Narrow `hidden` down to the repeats that may really do without their chords:
/// the ones whose chords are still on screen somewhere else. A screen is a row
/// of columns, so a matching section one column to the left is fine and one on
/// the next screenful is not.
///
/// The copy to read the chords off is the nearest earlier identical section
/// that kept its own — following the chain back, since a repeat of a repeat
/// can still fall back on the original. Returns whether anything changed.
fn hideable_repeats(
    measured: &[MeasuredParagraph],
    layout: &Layout,
    paragraph_pages: &[u32],
    viewport: Option<(f64, f64)>,
    sizing: Option<FontSizing>,
    hidden: &mut [bool],
) -> bool {
    let columns = column_count(layout, viewport, sizing);
    let row_of = |i: usize| paragraph_pages.get(i).copied().unwrap_or(0) / columns;
    let mut changed = false;
    for i in 0..hidden.len() {
        if !hidden[i] {
            continue;
        }
        // Walk back to the copy that still shows the chords.
        let mut source = measured[i].repeat_of;
        while let Some(j) = source {
            if !hidden[j] {
                break;
            }
            source = measured[j].repeat_of;
        }
        let on_screen = source.is_some_and(|j| row_of(j) == row_of(i));
        if !on_screen {
            hidden[i] = false;
            changed = true;
        }
    }
    changed
}

/// How many pages the caller can place side by side as columns before the song
/// wraps onto another row: the viewport's width divided by the widest line in
/// `layout` (which is how wide a column has to be), plus the gutter between
/// columns. Always at least one, and always one for callers that don't pack
/// pages into columns at all (`sizing` of `None`).
///
/// This is deliberately conservative — the caller sizes each column to its own
/// page's content, so pages narrower than the widest one may well leave room
/// for a further column.
fn column_count(layout: &Layout, viewport: Option<(f64, f64)>, sizing: Option<FontSizing>) -> u32 {
    let (Some((width, _)), Some(sizing)) = (viewport, sizing) else {
        return 1;
    };
    let column_width = content_right_extent(layout).max(1.0);
    let gap = sizing.column_gap;
    (((width as f32 + gap) / (column_width + gap)).floor() as i64).clamp(1, u32::MAX as i64) as u32
}

/// How far right the song's body reaches, in px. The header is excluded: it's
/// set at a fixed size the body's fitting can't do anything about.
fn content_right_extent(layout: &Layout) -> f32 {
    layout
        .items
        .iter()
        .filter(|item| item.item_type != ItemType::Header)
        .map(|item| item.pos.0 + item.width)
        .fold(0.0f32, f32::max)
}

/// Pick the body font size, on a half-pixel grid running from the user's
/// minimal size up to [`MAX_GROWTH`] times their ideal one, along with the row
/// budget it was chosen against.
///
/// A size fits when no line is wider than the viewport and the song's pages
/// fit within the budgeted rows of columns (see [`column_count`]) — running a
/// song into two columns beats shrinking it. Above the ideal size that has to
/// hold with the song's natural spacing, since growing the text is only worth
/// it when nothing is given up for it; at or below the ideal size compressed
/// spacing counts as fitting too, so the font only shrinks once squeezing the
/// gaps is no longer enough.
///
/// The budget is one row, unless the song can't be squeezed into one row even
/// at its minimal size — then it's however many rows it needs down there, and
/// the search grows the font back up to fill them as far as it can. So a song
/// that has to spill onto a second screenful uses that screenful properly
/// instead of being left tiny and half empty.
///
/// The tests only get harder as the font grows, so the predicate is monotone
/// and a binary search finds the largest size that passes; the minimal size
/// always passes by construction (it's what the budget was measured at) and is
/// where long lines are finally allowed to wrap.
#[allow(clippy::too_many_arguments)]
fn pick_font_size(
    sizing: FontSizing,
    cache: &mut MeasureCache,
    song: &songbook_grammar::Song,
    font_cx: &mut parley::FontContext,
    header_items: &[Item],
    viewport: Option<(f64, f64)>,
    transpose: i32,
    wrap_width: &dyn Fn(f32) -> Option<f32>,
) -> (f32, u32) {
    // Rows the song takes at `font_px`, with the lightest compression that
    // reaches `row_budget`; `None` when a line is too wide to fit at all.
    let rows_at = |cache: &mut MeasureCache,
                   font_cx: &mut parley::FontContext,
                   font_px: f32,
                   row_budget: u32| {
        let measured = cache.get(song, font_cx, font_px, transpose, wrap_width(font_px));
        best_layout_at(
            measured,
            header_items,
            viewport,
            font_px,
            Some(sizing),
            font_px <= sizing.ideal_font_size,
            row_budget,
        )
        .map(|(_, rows)| rows)
    };

    let grid = |i: u32| (i as f32) * FONT_SEARCH_STEP_PX;
    let index = |px: f32| (px / FONT_SEARCH_STEP_PX).round().max(1.0) as u32;
    let mut lo = index(sizing.minimal_font_size);
    let mut hi = index(sizing.ideal_font_size * MAX_GROWTH).max(lo);

    // What the song needs at its smallest is the budget everything else is
    // measured against: one row when it can be made to fit, more when even the
    // minimal size can't manage that.
    let row_budget = rows_at(cache, font_cx, grid(lo), 1).unwrap_or(1);

    // `lo` fits by construction (it's what the budget was just measured at).
    while lo < hi {
        let mid = lo + (hi - lo).div_ceil(2);
        let fits = rows_at(cache, font_cx, grid(mid), row_budget).is_some_and(|r| r <= row_budget);
        if fits {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    (grid(lo), row_budget)
}

/// Shape the title/author once, at their fixed header size. Never touched by
/// compression or the size search, so it's pulled out of both entirely.
fn measure_header(
    title: &str,
    author: &str,
    viewport: Option<(f64, f64)>,
    font_cx: &mut parley::FontContext,
) -> Vec<Item> {
    let content_width = viewport.map(|(width, _)| width);
    let header_px = HEADER_EM * EM;
    let mut shaper = Shaper::new(font_cx, header_px);
    let title_width = shaper.width(title, LYRIC_FONT_FAMILY, true);
    let author_width = shaper.width(author, LYRIC_FONT_FAMILY, true);
    let author_x = match content_width {
        Some(content_width) => (content_width as f32 - author_width).max(0.0),
        None => title_width + header_px,
    };
    // Baseline sits below the top margin by roughly the ascent.
    let header_baseline = HEADER_TOP_MARGIN * EM + header_px;
    let (header_ascent, header_descent) = shaper.face_metrics(LYRIC_FONT_FAMILY, true);
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
    /// Index of the nearest earlier paragraph of the same kind playing the
    /// same chords, if any — the section a player can read this one's chords
    /// off (see [`chord_pattern`]).
    repeat_of: Option<usize>,
}

/// Size the unwrapped reference pass is shaped at. Nothing about it is
/// special — it's just where [`MeasureCache`] measures the song once.
const REFERENCE_FONT_PX: f32 = EM;

/// The song shaped at the sizes the search has asked for.
///
/// Shaping is by far the most expensive part of laying a song out, and the
/// size search asks for a handful of sizes while every compression step at a
/// size reuses one. Two things keep the parley calls down to (almost always)
/// a single pass:
///
/// - Results are memoised per (size, wrap width).
/// - Without wrapping, shaping at one size is shaping at every size: glyph
///   advances and font metrics are defined in font units and scaled by the
///   size, with no hinting or rounding in between, so a size's measurements
///   are exactly the reference pass's times the ratio of the sizes. Only a
///   wrapped size has to be shaped for real, because where its lines break
///   depends on the size.
#[derive(Default)]
struct MeasureCache {
    /// The unwrapped pass at [`REFERENCE_FONT_PX`], scaled to serve any other
    /// unwrapped size.
    reference: Option<Vec<MeasuredParagraph>>,
    /// Ready-to-use results, keyed by the bit patterns of the font size and
    /// the wrap width.
    by_size: Vec<((u32, Option<u32>), Vec<MeasuredParagraph>)>,
}

impl MeasureCache {
    fn get(
        &mut self,
        song: &songbook_grammar::Song,
        font_cx: &mut parley::FontContext,
        font_px: f32,
        transpose: i32,
        wrap_width: Option<f32>,
    ) -> &[MeasuredParagraph] {
        let key = (font_px.to_bits(), wrap_width.map(f32::to_bits));
        if let Some(pos) = self.by_size.iter().position(|(k, _)| *k == key) {
            return &self.by_size[pos].1;
        }
        let measured = match wrap_width {
            Some(width) => measure_song(song, font_cx, font_px, transpose, Some(width)),
            None => {
                let reference = self.reference.get_or_insert_with(|| {
                    measure_song(song, font_cx, REFERENCE_FONT_PX, transpose, None)
                });
                scale_song(reference, font_px / REFERENCE_FONT_PX)
            }
        };
        self.by_size.push((key, measured));
        &self.by_size.last().unwrap().1
    }
}

/// A shaped song at a different size: see [`MeasureCache`] for why simply
/// scaling it is exact.
fn scale_song(paragraphs: &[MeasuredParagraph], factor: f32) -> Vec<MeasuredParagraph> {
    paragraphs
        .iter()
        .map(|paragraph| MeasuredParagraph {
            has_chord: paragraph.has_chord,
            repeat_of: paragraph.repeat_of,
            lines: paragraph
                .lines
                .iter()
                .map(|line| MeasuredLine {
                    baseline: line.baseline * factor,
                    descent: line.descent * factor,
                    has_chord: line.has_chord,
                    items: line
                        .items
                        .iter()
                        .map(|item| Item {
                            text: item.text.clone(),
                            item_type: item.item_type.clone(),
                            font_size: item.font_size * factor,
                            width: item.width * factor,
                            ascent: item.ascent * factor,
                            descent: item.descent * factor,
                            pos: (item.pos.0 * factor, item.pos.1 * factor),
                        })
                        .collect(),
                })
                .collect(),
        })
        .collect()
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
    content_width: Option<f32>,
) -> Vec<MeasuredParagraph> {
    // One shaper for the whole pass: its scratch buffers and per-face metrics
    // are the same for every line, so they're built once here.
    let mut shaper = Shaper::new(font_cx, font_px);
    let mut paragraphs: Vec<MeasuredParagraph> = vec![];
    // Chord pattern of each rendered paragraph, so a later section playing the
    // same thing can point back at it (see [`MeasuredParagraph::repeat_of`]).
    let mut patterns: Vec<Option<String>> = vec![];
    // Running verse counter, threaded across the whole song so that `S:` tags
    // render as `1.`, `2.`, ….
    let mut verse_counter = 0u32;
    for portion in &song.portions {
        let songbook_grammar::FilePortion::Section(lines) = portion;

        // A paragraph made up entirely of `>`-commands is control text, not
        // song text: it isn't rendered and contributes no section gap. The
        // commands themselves are ignored — every verse is set with its
        // chords, whatever the song asks for.
        if command_block(lines) {
            continue;
        }

        let pattern = chord_pattern(lines);
        let repeat_of = pattern.as_ref().and_then(|pattern| {
            patterns
                .iter()
                .rposition(|earlier| earlier.as_ref() == Some(pattern))
        });
        patterns.push(pattern);

        let mut measured_lines: Vec<MeasuredLine> = vec![];
        let mut first_line_has_chord: Option<bool> = None;
        for line in lines {
            let tag = line
                .label
                .as_deref()
                .and_then(|label| transform_tag(label, &mut verse_counter));
            let measured = measure_line(line, tag, transpose, content_width, &mut shaper);
            if first_line_has_chord.is_none() {
                first_line_has_chord = measured.first().map(|l| l.has_chord);
            }
            measured_lines.extend(measured);
        }

        paragraphs.push(MeasuredParagraph {
            lines: measured_lines,
            has_chord: first_line_has_chord.unwrap_or(false),
            repeat_of,
        });
    }

    paragraphs
}

/// Arrange already-shaped paragraphs into a page-flowed layout: header/section
/// spacing, chord-line height and page breaks. Pure arithmetic over the
/// [`MeasuredParagraph`]s produced by [`measure_song`] — no parley calls — so
/// it's cheap to call once per compression step. Returns the layout and, for a
/// paginated one, how many pages it takes.
fn assemble(
    measured_paragraphs: &[MeasuredParagraph],
    header_items: &[Item],
    viewport: Option<(f64, f64)>,
    font_px: f32,
    t_header: f32,
    t_section: f32,
    t_chord: f32,
    hidden_chords: &[bool],
) -> (Layout, Option<u32>, Vec<u32>) {
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
    for (i, mp) in measured_paragraphs.iter().enumerate() {
        let hide_chords = hidden_chords.get(i).copied().unwrap_or(false);
        let mut paragraph_items: Vec<Item> = vec![];
        let mut local_y = 0.0f32;
        for line in &mp.lines {
            let (mut items, line_height) =
                place_line(line, font_px, chord_line_factor, hide_chords);
            for item in &mut items {
                item.pos.1 += local_y;
            }
            local_y += line_height;
            paragraph_items.append(&mut items);
        }
        paragraphs.push(Paragraph {
            items: paragraph_items,
            height: local_y,
            has_chord: mp.has_chord && !hide_chords,
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
    // A chord sits `font_px` above its lyric's baseline, which can carry its
    // *rendered* box above the paragraph's nominal (local_y = 0) top — no
    // section gap or header space is reserved above a paragraph that opens a
    // page, so that overhang would otherwise poke above y = 0 (or above the
    // page-break boundary for later pages), landing it visually at the
    // bottom of the previous page. Pad the space above any paragraph that
    // starts a page by however far its own items reach above its local top.
    let top_overhang = |paragraph: &Paragraph| -> f32 {
        paragraph
            .items
            .iter()
            .map(|item| item.ascent - item.pos.1)
            .fold(0.0f32, f32::max)
    };
    let header_height = header_height + paragraphs.first().map(top_overhang).unwrap_or(0.0);

    let mut body_items: Vec<Item> = vec![];
    // Which page each paragraph starts on, for callers that care where a
    // section ended up relative to another (see [`hideable_repeats`]).
    let mut paragraph_pages: Vec<u32> = Vec::with_capacity(paragraphs.len());
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
                y = end + top_overhang(&paragraphs[i]);
                page_end = Some(end + page_height);
            }
        }

        paragraph_pages.push(match content_height {
            Some(page_height) => ((y + header_height) / page_height).floor() as u32,
            None => 0,
        });
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

    // How many pages this lands on, mirroring the pagination
    // `render_layout_into` performs in songbook-render-pdf (a page break
    // happens whenever an item's y runs `content_height` past the current
    // page's top).
    let page_count = content_height.map(|content_height| {
        let max_y = layout
            .items
            .iter()
            .filter(|item| !item.text.trim().is_empty())
            .map(|item| item.pos.1)
            .fold(0.0f32, f32::max);
        (max_y / content_height).floor() as u32 + 1
    });

    (layout, page_count, paragraph_pages)
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

/// The four font faces a song is set in: the two families in both weights.
const FACES: usize = 4;

fn face_slot(family: &str, bold: bool) -> usize {
    (if family == CHORD_FONT_FAMILY { 2 } else { 0 }) + usize::from(bold)
}

/// Everything a [`measure_song`] pass needs to shape text at one font size,
/// with the per-face constants it would otherwise re-derive for every line and
/// every chord worked out once:
///
/// - parley's [`LayoutContext`], which owns the shaping scratch buffers, so
///   they're allocated once for the whole song rather than per measurement.
/// - each face's ascent/descent, a pure font metric that's identical for every
///   item set in that face at this size but costs a shaping call to look up.
/// - each face's sentinel width, the correction [`Shaper::width_with_space`]
///   applies to keep whitespace that parley would trim.
struct Shaper<'a> {
    font_cx: &'a mut parley::FontContext,
    layout_cx: LayoutContext<()>,
    font_px: f32,
    metrics: [Option<(f32, f32)>; FACES],
    sentinels: [Option<f32>; FACES],
    /// Widths of the standalone strings measured through [`Shaper::width`] —
    /// chords, above all, and a song repeats the same handful of them from
    /// verse to verse.
    widths: std::collections::HashMap<(usize, String), f32>,
}

/// Sentinel character used to keep parley from trimming leading and trailing
/// whitespace off a measurement (see [`Shaper::width_with_space`]).
const SENTINEL: &str = ".";

impl<'a> Shaper<'a> {
    fn new(font_cx: &'a mut parley::FontContext, font_px: f32) -> Self {
        Shaper {
            font_cx,
            layout_cx: LayoutContext::new(),
            font_px,
            metrics: [None; FACES],
            sentinels: [None; FACES],
            widths: std::collections::HashMap::new(),
        }
    }

    /// Shape `text` on its own and hand the finished layout to `f`.
    fn shape<T>(
        &mut self,
        text: &str,
        family: &str,
        bold: bool,
        f: impl FnOnce(&parley::Layout<()>) -> T,
    ) -> T {
        let mut layout: parley::Layout<()> = {
            let mut builder = prepare_builder(
                &mut self.layout_cx,
                self.font_cx,
                text,
                self.font_px,
                family,
                1.0,
            );
            if bold {
                builder.push_default(StyleProperty::FontWeight(parley::FontWeight::new(700.0)));
            }
            builder.build(text)
        };
        layout.break_all_lines(None);
        f(&layout)
    }

    /// Advance width of `text` set in the given face, memoised: songs repeat
    /// the same chords over and over, and shaping one is far dearer than
    /// looking it up.
    fn width(&mut self, text: &str, family: &str, bold: bool) -> f32 {
        let key = (face_slot(family, bold), text.to_owned());
        if let Some(width) = self.widths.get(&key) {
            return *width;
        }
        let width = self.shape(text, family, bold, |layout| layout.width());
        self.widths.insert(key, width);
        width
    }

    /// Advance width *including* leading and trailing whitespace. parley's
    /// `width()` trims it, but the frontend flows tag/spacer whitespace as real
    /// space (an `&nbsp;` after the tag, invisible spacer chords), so measure
    /// the text sandwiched between sentinels and take their own width back off.
    fn width_with_space(&mut self, text: &str, family: &str, bold: bool) -> f32 {
        if !text.starts_with(char::is_whitespace) && !text.ends_with(char::is_whitespace) {
            return self.width(text, family, bold);
        }
        let sandwiched = self.width(&format!("{SENTINEL}{text}{SENTINEL}"), family, bold);
        sandwiched - self.sentinel_width(family, bold)
    }

    fn sentinel_width(&mut self, family: &str, bold: bool) -> f32 {
        if let Some(width) = self.sentinels[face_slot(family, bold)] {
            return width;
        }
        let width = self.width(&format!("{SENTINEL}{SENTINEL}"), family, bold);
        self.sentinels[face_slot(family, bold)] = Some(width);
        width
    }

    /// A face's own ascent and descent (distance from a glyph's baseline to its
    /// natural top/bottom) at this pass's font size. Independent of the text
    /// shaped in it, so it's looked up once per face. See [`Item::ascent`].
    fn face_metrics(&mut self, family: &str, bold: bool) -> (f32, f32) {
        if let Some(metrics) = self.metrics[face_slot(family, bold)] {
            return metrics;
        }
        let font_px = self.font_px;
        let metrics = self.shape(" ", family, bold, |layout| match layout.lines().next() {
            Some(line) => {
                let m = line.metrics();
                (m.baseline, (m.line_height - m.baseline).max(0.0))
            }
            None => (font_px, font_px * 0.3),
        });
        self.metrics[face_slot(family, bold)] = Some(metrics);
        metrics
    }
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
/// the chord-line compression) is deferred to [`place_line`]
/// so it can be redone cheaply without re-shaping.
fn measure_line(
    line: &Line,
    tag: Option<String>,
    transpose: i32,
    content_width: Option<f32>,
    shaper: &mut Shaper,
) -> Vec<MeasuredLine> {
    let font_px = shaper.font_px;
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
                    shaper.width_with_space(&text, CHORD_FONT_FAMILY, !normal_weight)
                } else {
                    shaper.width(&text, CHORD_FONT_FAMILY, !normal_weight)
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
        .map(|t| shaper.width_with_space(t, LYRIC_FONT_FAMILY, true))
        .unwrap_or(0.0);

    // Metrics of the plain lyric line, used to place every wrapped visual
    // line's baseline (constant across wraps: same font/size throughout).
    let (baseline, descent) = shaper.face_metrics(LYRIC_FONT_FAMILY, false);
    // Text/tag items are anchored at the text baseline (offset 0); chords
    // always sit exactly one em above it.
    let text_baseline_offset = 0.0f32;
    let chord_baseline_offset = -font_px;

    // Lay out the lyric text, inserting zero-width (or spacer-width) inline
    // boxes so parley reports the x anchor of each chord.
    let mut builder = prepare_builder(
        &mut shaper.layout_cx,
        shaper.font_cx,
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
    // Only spacer chords get a real inline box: they need to push the lyric
    // flow right by their own width. A zero-width box for an ordinary chord
    // would still give parley a break opportunity right after it (but not
    // before it), so a long following word can strand the chord at the end
    // of the earlier line instead of carrying it down to the word it's
    // anchored to. Ordinary chords are instead placed afterwards by locating
    // their anchor directly in the wrapped glyph runs (see below).
    for (i, chord) in chords.iter().enumerate() {
        if !chord.spacer {
            continue;
        }
        builder.push_inline_box(parley::InlineBox {
            id: i as u64,
            kind: parley::InlineBoxKind::InFlow,
            index: chord.index.min(complete_text.len()),
            width: chord.width,
            height: 0.0,
        });
    }
    let mut text_layout: parley::Layout<()> = builder.build(&complete_text);
    // Constrain to the available width (minus the tag reserved on the first
    // visual line) so long lines wrap instead of overflowing the page. With
    // no known width (unpaginated callers), keep the line unconstrained.
    let wrap_width = content_width.map(|w| (w - tag_width).max(font_px));
    text_layout.break_all_lines(wrap_width);

    // Where each chord is anchored: which visual (wrapped) line it landed on,
    // and its x within that line (raw box-local x, before the tag/line
    // `x_offset` folded in when items are emitted below).
    let mut chord_x = vec![0.0f32; chords.len()];
    let mut chord_line = vec![0usize; chords.len()];
    // One entry per visual line produced by wrapping.
    let mut line_items: Vec<Vec<Item>> = vec![];
    for (li, pline) in text_layout.lines().enumerate() {
        let mut items: Vec<Item> = vec![];
        // Only the first visual line has the tag reserving space before it.
        let x_offset = if li == 0 { tag_width } else { 0.0 };
        for item in pline.items() {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    let range = glyph_run.run().text_range();
                    // A run is bold if it lies within a `[*…]` bold range.
                    let bold = bold_ranges
                        .iter()
                        .any(|r| r.start <= range.start && range.end <= r.end);
                    items.push(Item {
                        item_type: if bold {
                            ItemType::BoldText
                        } else {
                            ItemType::Text
                        },
                        font_size: font_px,
                        width: glyph_run.advance(),
                        ascent: baseline,
                        descent,
                        pos: (glyph_run.offset() + x_offset, text_baseline_offset),
                        text: complete_text[range].to_owned(),
                    });
                }
                parley::PositionedLayoutItem::InlineBox(inline_box) => {
                    chord_x[inline_box.id as usize] = inline_box.x;
                    chord_line[inline_box.id as usize] = li;
                }
            }
        }
        line_items.push(items);
    }
    if line_items.is_empty() {
        line_items.push(vec![]);
    }

    // Place ordinary (non-spacer) chords by locating their anchor byte offset
    // as an actual text cluster: a chord anchored at (or right before) a
    // cluster glues to that cluster's line and exact visual x, so it always
    // travels with whichever word it precedes rather than being left behind
    // on the line above, and lands exactly at the start of that word (no
    // re-shaping a substring in isolation, which can drift from the real
    // shaped position by a subpixel or two due to kerning/context).
    for (i, chord) in chords.iter().enumerate() {
        if chord.spacer || chord.text.is_empty() {
            continue;
        }
        let idx = chord.index.min(complete_text.len());
        // Prefer the cluster starting at (or containing) idx, so the chord
        // sits at the start of the word it precedes. If idx is past the end
        // of the text (nothing follows the chord), anchor right after the
        // last cluster instead.
        let placement = parley::Cluster::from_byte_index(&text_layout, idx)
            .map(|cluster| {
                (
                    cluster.path().line_index(),
                    cluster.visual_offset().unwrap_or(0.0),
                )
            })
            .or_else(|| {
                idx.checked_sub(1)
                    .and_then(|prev| parley::Cluster::from_byte_index(&text_layout, prev))
                    .map(|cluster| {
                        let x = cluster.visual_offset().unwrap_or(0.0) + cluster.advance();
                        (cluster.path().line_index(), x)
                    })
            });
        if let Some((line_index, x)) = placement {
            chord_line[i] = line_index;
            chord_x[i] = x;
        }
    }

    // Emit each visible chord above the lyrics, on whichever visual line its
    // anchor word ended up wrapped to.
    for (i, chord) in chords.iter().enumerate() {
        if chord.text.is_empty() {
            continue;
        }
        let (chord_ascent, chord_descent) =
            shaper.face_metrics(CHORD_FONT_FAMILY, !chord.normal_weight);
        let li = chord_line[i];
        let x_offset = if li == 0 { tag_width } else { 0.0 };
        line_items[li].push(Item {
            item_type: if chord.normal_weight {
                ItemType::ChordNormal
            } else {
                ItemType::Chord
            },
            font_size: font_px,
            width: chord.width,
            ascent: chord_ascent,
            descent: chord_descent,
            pos: (chord_x[i] + x_offset, chord_baseline_offset),
            text: chord.text.clone(),
        });
    }

    // Emit the tag last (on the first visual line only) so it draws over the
    // (empty) left margin.
    if let Some(tag_text) = tag_text {
        line_items[0].push(Item {
            item_type: ItemType::Tag,
            font_size: font_px,
            width: tag_width,
            ascent: baseline,
            descent,
            pos: (0.0, text_baseline_offset),
            text: tag_text.trim_end().to_owned(),
        });
    }

    // Whether each visual line carries at least one visible chord (a wrapped
    // continuation may or may not, depending on where its chords landed).
    let mut has_chord_per_line = vec![false; line_items.len()];
    for (i, chord) in chords.iter().enumerate() {
        if !chord.text.is_empty() {
            has_chord_per_line[chord_line[i]] = true;
        }
    }

    line_items
        .into_iter()
        .zip(has_chord_per_line)
        .map(|(items, has_chord)| MeasuredLine {
            items,
            baseline,
            descent,
            has_chord,
        })
        .collect()
}

/// Turn a shaped line's baseline-relative item offsets into absolute
/// positions for a given chord-line height factor, and report the line's
/// total height. Pure arithmetic — no parley calls — so it's cheap to redo
/// for every compression step even when the shaping is cached.
fn place_line(
    measured: &MeasuredLine,
    font_px: f32,
    chord_line_factor: f32,
    hide_chords: bool,
) -> (Vec<Item>, f32) {
    // Dropping the chords also drops the tall chord line they sat on, which is
    // the whole point: it's worth roughly a line of text per line of lyrics.
    let has_chord = measured.has_chord && !hide_chords;
    let line_height = if has_chord {
        font_px * chord_line_factor
    } else {
        (measured.baseline + measured.descent).max(font_px)
    };
    // Lyrics sit at the bottom of the (taller) chord line; chords one em above.
    let text_baseline = if has_chord {
        line_height - measured.descent
    } else {
        measured.baseline
    };
    let items = measured
        .items
        .iter()
        .filter(|item| !hide_chords || !item.item_type.is_chord())
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

/// A section's chord pattern: what kind of section it is, plus the chords it
/// carries, line by line. Two sections with the same pattern are playing the
/// same thing, so the second one's chords tell the player nothing the first
/// didn't — which is what makes them droppable, even where the words differ.
///
/// The kind is the letter part of the label (`S:` verses, `R:`/`R1:`
/// choruses), so a chorus is never taken to repeat a verse. `None` means the
/// section carries no chords at all: nothing to drop, and nothing another
/// section could be read off.
fn chord_pattern(lines: &[Line]) -> Option<String> {
    let mut pattern = String::new();
    let mut any_chord = false;
    for line in lines {
        if let Some(label) = &line.label {
            pattern.extend(label.chars().filter(|c| c.is_alphabetic()));
            pattern.push('\u{1}');
        }
        for item in &line.content {
            let songbook_grammar::LineContent::Command { lead, content } = item else {
                continue;
            };
            let lead = lead.as_deref().unwrap_or("");
            // What counts is what's actually played: `[*…]` is bold lyric text,
            // `[^…]` an annotation like `N.C.` rather than a chord, and an
            // empty chord (a bare `[_ ]` spacer, say) draws nothing. The `_`
            // spacer marker itself says where a chord sits, not what it is, so
            // it's ignored and `[_Emi]` matches a plain `[Emi]`.
            if (lead.is_empty() && content.starts_with('*'))
                || lead.contains('^')
                || content.trim().is_empty()
            {
                continue;
            }
            pattern.push('\u{2}');
            pattern.push_str(content.trim());
            any_chord = true;
        }
        pattern.push('\n');
    }
    // Trailing empty lines say nothing about what's played: a section ending
    // in a whitespace-only line (which the grammar keeps as a line rather than
    // a separator) plays the same as one that doesn't.
    pattern.truncate(pattern.trim_end().len());
    any_chord.then_some(pattern)
}

/// Whether every line of a paragraph is a bare `>`-command (lead `>`, no lyric
/// text, no tag), which makes the paragraph control text rather than song text.
/// Matches `parseCommands` in the frontend: a single non-command line
/// disqualifies the whole paragraph.
fn command_block(lines: &[Line]) -> bool {
    lines.iter().all(|line| {
        line.label.is_none()
            && line.content.len() == 1
            && matches!(
                &line.content[0],
                songbook_grammar::LineContent::Command { lead: Some(lead), .. } if lead == ">"
            )
    })
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
