//! Renders the collection title page, reproducing the "Songbook title page
//! design" mock (see `Downloads/Songbook title page design/`): a starry
//! night-sky gradient, a crescent moon, a mountain skyline with lit
//! windows, the "Zpěvník" / "Velmor" headings, and the Brehoni badge —
//! traced from the mock's actual rendered layout (its saved inline styles
//! don't always match what it actually paints; a headless-browser
//! screenshot does) rather than from the collection's own data, since the
//! mock's camp/subtitle/year text isn't part of the collection JSON.

use krilla::Document;
use krilla::color::rgb;
use krilla::geom::{Path, PathBuilder, Point, Rect};
use krilla::num::NormalizedF32;
use krilla::paint::{Fill, Paint, RadialGradient, SpreadMethod, Stop};
use krilla::text::{Font, TextDirection};
use skrifa::MetadataProvider;
use skrifa::instance::{LocationRef, Size};

use crate::{Fonts, PAGE_HEIGHT, PAGE_WIDTH, page_settings};

/// Deterministic pseudo-random float in `[0, 1)`, matching the `Math.sin`
/// trick used by the reference design so the star field looks the same
/// every time it's rendered.
fn pseudo_rand(seed: f32) -> f32 {
    let x = seed.sin() * 10000.0;
    x - x.floor()
}

/// Append a circle (four cubic bezier arcs) to an in-progress path.
fn add_circle(pb: &mut PathBuilder, cx: f32, cy: f32, r: f32) {
    const KAPPA: f32 = 0.5522847498;
    let k = r * KAPPA;
    pb.move_to(cx + r, cy);
    pb.cubic_to(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
    pb.cubic_to(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
    pb.cubic_to(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
    pb.cubic_to(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
    pb.close();
}

/// Build a filled circle path via four cubic bezier arcs.
fn circle_path(cx: f32, cy: f32, r: f32) -> Path {
    let mut pb = PathBuilder::new();
    add_circle(&mut pb, cx, cy, r);
    pb.finish().expect("circle path is non-empty")
}

/// Append a rounded rectangle (corner radius `r`) to an in-progress path.
fn add_rounded_rect(pb: &mut PathBuilder, x: f32, y: f32, w: f32, h: f32, r: f32) {
    const KAPPA: f32 = 0.5522847498;
    let k = r * KAPPA;
    pb.move_to(x + r, y);
    pb.line_to(x + w - r, y);
    pb.cubic_to(x + w - r + k, y, x + w, y + r - k, x + w, y + r);
    pb.line_to(x + w, y + h - r);
    pb.cubic_to(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h);
    pb.line_to(x + r, y + h);
    pb.cubic_to(x + r - k, y + h, x, y + h - r + k, x, y + h - r);
    pb.line_to(x, y + r);
    pb.cubic_to(x, y + r - k, x + r - k, y, x + r, y);
    pb.close();
}

fn solid_fill(color: (u8, u8, u8), opacity: f32) -> Fill {
    Fill {
        paint: Paint::from(rgb::Color::new(color.0, color.1, color.2)),
        opacity: NormalizedF32::new(opacity).unwrap_or(NormalizedF32::ONE),
        ..Fill::default()
    }
}

/// Real glyph advance width for one character, in points at `font_size`,
/// read from the font's own `hmtx` metrics via skrifa — used instead of a
/// guessed average so letter-spaced headings (which draw one glyph at a
/// time) sit exactly like normal shaped text would, with each glyph's own
/// width rather than a uniform stand-in.
fn glyph_advance(font_ref: &skrifa::FontRef, c: char, font_size: f32) -> f32 {
    let Some(gid) = font_ref.charmap().map(c) else {
        return font_size * 0.5;
    };
    font_ref
        .glyph_metrics(Size::new(font_size), LocationRef::default())
        .advance_width(gid)
        .unwrap_or(font_size * 0.5)
}

/// Draw `text` centered on `center_x`, with `spacing` extra points inserted
/// between each character (CSS `letter-spacing`), one `draw_text` call per
/// character since krilla has no built-in tracking.
fn draw_letter_spaced_centered(
    surface: &mut krilla::surface::Surface,
    center_x: f32,
    baseline_y: f32,
    font: &Font,
    font_data: &[u8],
    font_size: f32,
    text: &str,
    spacing: f32,
    fill: Fill,
) {
    draw_letter_spaced_centered_with_fallback(
        surface, center_x, baseline_y, font, font_data, None, font_size, text, spacing, fill,
    );
}

/// Like [`draw_letter_spaced_centered`], but characters the primary `font`
/// doesn't have a glyph for are drawn with `fallback` instead — mirroring
/// the reference design's CSS `font-family: 'Almendra SC', serif`, where
/// the browser silently falls back per-character for glyphs the display
/// font (which only covers plain Latin) is missing.
fn draw_letter_spaced_centered_with_fallback(
    surface: &mut krilla::surface::Surface,
    center_x: f32,
    baseline_y: f32,
    font: &Font,
    font_data: &[u8],
    fallback: Option<(&Font, &[u8], &std::collections::HashSet<char>)>,
    font_size: f32,
    text: &str,
    spacing: f32,
    fill: Fill,
) {
    let font_ref = skrifa::FontRef::new(font_data).expect("valid font data");
    let fallback_ref = fallback.map(|(f, data, s)| {
        (
            f,
            skrifa::FontRef::new(data).expect("valid fallback font data"),
            s,
        )
    });

    let chars: Vec<char> = text.chars().collect();
    let char_widths: Vec<f32> = chars
        .iter()
        .map(|c| match &fallback_ref {
            Some((_, fb_ref, supported)) if !supported.contains(c) => {
                glyph_advance(fb_ref, *c, font_size)
            }
            _ => glyph_advance(&font_ref, *c, font_size),
        })
        .collect();
    let total_width: f32 =
        char_widths.iter().sum::<f32>() + spacing * (chars.len().max(1) - 1) as f32;

    surface.set_fill(Some(fill));
    let mut x = center_x - total_width / 2.0;
    for (c, w) in chars.iter().zip(char_widths.iter()) {
        let glyph_font = match &fallback_ref {
            Some((fallback_font, _, supported)) if !supported.contains(c) => *fallback_font,
            _ => font,
        };
        surface.draw_text(
            Point::from_xy(x, baseline_y),
            glyph_font.clone(),
            font_size,
            &c.to_string(),
            false,
            TextDirection::Auto,
        );
        x += w + spacing;
    }
}

/// Read the set of Unicode codepoints a TTF/OTF's `cmap` table maps to a
/// glyph (format 4 subtables only, which covers ordinary BMP fonts like the
/// display serif used on the title page). Used to decide, per character,
/// whether to fall back to a different font — see
/// [`draw_letter_spaced_centered_with_fallback`].
fn cmap_supported_chars(font_data: &[u8]) -> std::collections::HashSet<char> {
    let mut chars = std::collections::HashSet::new();
    let read_u16 = |off: usize| -> u16 { u16::from_be_bytes([font_data[off], font_data[off + 1]]) };
    let read_u32 =
        |off: usize| -> u32 { u32::from_be_bytes(font_data[off..off + 4].try_into().unwrap()) };

    let num_tables = read_u16(4) as usize;
    let mut cmap_offset = None;
    for i in 0..num_tables {
        let rec = 12 + i * 16;
        if &font_data[rec..rec + 4] == b"cmap" {
            cmap_offset = Some(read_u32(rec + 8) as usize);
            break;
        }
    }
    let Some(cmap_off) = cmap_offset else {
        return chars;
    };

    let num_subtables = read_u16(cmap_off + 2) as usize;
    let mut best_subtable = None;
    for i in 0..num_subtables {
        let rec = cmap_off + 4 + i * 8;
        let platform_id = read_u16(rec);
        let encoding_id = read_u16(rec + 2);
        let sub_off = cmap_off + read_u32(rec + 4) as usize;
        if read_u16(sub_off) != 4 {
            continue;
        }
        if platform_id == 3 && encoding_id == 1 {
            best_subtable = Some(sub_off);
            break;
        }
        best_subtable.get_or_insert(sub_off);
    }
    let Some(sub_off) = best_subtable else {
        return chars;
    };

    let seg_count = read_u16(sub_off + 6) as usize / 2;
    let end_codes = sub_off + 14;
    let start_codes = end_codes + seg_count * 2 + 2;
    let id_deltas = start_codes + seg_count * 2;
    let id_range_offsets = id_deltas + seg_count * 2;

    for i in 0..seg_count {
        let end = read_u16(end_codes + i * 2) as u32;
        let start = read_u16(start_codes + i * 2) as u32;
        if start == 0xFFFF && end == 0xFFFF {
            continue;
        }
        let delta = read_u16(id_deltas + i * 2);
        let range_offset = read_u16(id_range_offsets + i * 2);
        for c in start..=end {
            let gid = if range_offset == 0 {
                (c as u16).wrapping_add(delta)
            } else {
                let addr =
                    id_range_offsets + i * 2 + range_offset as usize + (c - start) as usize * 2;
                if addr + 2 > font_data.len() {
                    continue;
                }
                let raw = read_u16(addr);
                if raw == 0 { 0 } else { raw.wrapping_add(delta) }
            };
            if gid != 0 {
                if let Some(ch) = char::from_u32(c) {
                    chars.insert(ch);
                }
            }
        }
    }
    chars
}

/// Render the title page, reproducing the "Songbook title page design" mock
/// exactly: same texts, positions (scaled from the mock's 559x794 canvas to
/// our A4 page), sizes and colors. The heading/story-title font in the mock
/// (Almendra SC) matches the mock exactly, same as the browser's own
/// `font-family: 'Almendra SC', serif` — glyphs it doesn't have (a few
/// Czech precomposed letters) fall back to a serif substitute, same as a
/// browser would.
pub(crate) fn render_title_page(document: &mut Document, _collection_title: &str, _fonts: &Fonts) {
    // Display font for "Zpěvník" / "Velmor": the mock's actual Almendra SC,
    // loaded from its full upstream TTF (not a Google Fonts webfont
    // subset). That font only ever shipped a plain-Latin glyph set (see
    // its METADATA.pb: `subsets: "latin"`, no "latin-ext"), so a few Czech
    // letters like "ě" fall back to Marcellus SC, a similar small-caps
    // display serif with full Czech coverage — mirroring the mock's own
    // CSS fallback chain (`'Almendra SC', serif`).
    let display_font_data: &[u8] = include_bytes!("../../songs/almendra-sc-regular.ttf");
    let display_font =
        Font::new(display_font_data.to_vec().into(), 0).expect("failed to parse Almendra SC");
    let display_font_coverage = cmap_supported_chars(display_font_data);
    let display_fallback_font_data: &[u8] = include_bytes!("../../songs/marcellus-sc-regular.ttf");
    let display_fallback_font = Font::new(display_fallback_font_data.to_vec().into(), 0)
        .expect("failed to parse Marcellus SC");

    // Nunito for everything else. Variable font, used at its default
    // (regular) weight since krilla doesn't support picking a named
    // instance.
    let nunito_font_data: &[u8] = include_bytes!("../../songs/nunito-variable.ttf");
    // Bold weight for everything set in Nunito on this page (the display
    // headings "Zpěvník"/"Velmor" use Almendra SC and are left untouched).
    let nunito_font = Font::new_variable(
        nunito_font_data.to_vec().into(),
        0,
        &[(krilla::text::Tag::new(b"wght"), 700.0)],
    )
    .expect("failed to parse Nunito");

    // Scale factors from the mock's 559x794 reference canvas to our A4 page.
    let sx = PAGE_WIDTH / 559.0;
    let sy = PAGE_HEIGHT / 794.0;
    let px = |x: f32| x * sx;
    let py = |y: f32| y * sy;
    // Baseline sits below a CSS `top` by roughly the font's cap-height.
    let baseline = |top: f32, font_size: f32| py(top) + font_size * 0.8;

    let mut page = document.start_page_with(page_settings());
    let mut surface = page.surface();

    let cream = (0xf6, 0xec, 0xc9);
    let gold = (0xc9, 0xb8, 0x78);
    let pale_blue = (0x9f, 0xb0, 0xe0);
    let bg_deep = (0x0f, 0x16, 0x38);
    let bg_mid = (0x1a, 0x25, 0x57);
    let bg_light = (0x2c, 0x3f, 0x82);
    let tower_color = (0x14, 0x1b, 0x40);

    // Background: a radial gradient, brighter near the top, echoing the
    // mock's `radial-gradient(ellipse at 50% 18%, ...)`.
    let bg_rect = Rect::from_xywh(0.0, 0.0, PAGE_WIDTH, PAGE_HEIGHT).unwrap();
    let mut bg_path_builder = PathBuilder::new();
    bg_path_builder.push_rect(bg_rect);
    let bg_path = bg_path_builder.finish().unwrap();
    let gradient = RadialGradient {
        fx: PAGE_WIDTH / 2.0,
        fy: PAGE_HEIGHT * 0.18,
        fr: 0.0,
        cx: PAGE_WIDTH / 2.0,
        cy: PAGE_HEIGHT * 0.18,
        cr: PAGE_HEIGHT * 0.95,
        transform: Default::default(),
        spread_method: SpreadMethod::Pad,
        stops: vec![
            Stop {
                offset: NormalizedF32::new(0.0).unwrap(),
                color: rgb::Color::new(bg_light.0, bg_light.1, bg_light.2).into(),
                opacity: NormalizedF32::ONE,
            },
            Stop {
                offset: NormalizedF32::new(0.55).unwrap(),
                color: rgb::Color::new(bg_mid.0, bg_mid.1, bg_mid.2).into(),
                opacity: NormalizedF32::ONE,
            },
            Stop {
                offset: NormalizedF32::new(1.0).unwrap(),
                color: rgb::Color::new(bg_deep.0, bg_deep.1, bg_deep.2).into(),
                opacity: NormalizedF32::ONE,
            },
        ],
        anti_alias: true,
    };
    surface.set_fill(Some(Fill {
        paint: Paint::from(gradient),
        opacity: NormalizedF32::ONE,
        ..Fill::default()
    }));
    surface.draw_path(&bg_path);

    // Stars, scattered across the top ~180px of the mock's 559x794 canvas.
    for i in 0..40 {
        let x = px(pseudo_rand(i as f32 * 3.1) * 559.0);
        let y = py(pseudo_rand(i as f32 * 7.7 + 1.0) * 180.0);
        let size = px(1.0 + pseudo_rand(i as f32 * 5.3 + 2.0) * 2.0);
        let op = 0.4 + pseudo_rand(i as f32 * 2.2 + 3.0) * 0.6;
        surface.set_fill(Some(solid_fill(cream, op)));
        surface.draw_path(&circle_path(x, y, size / 2.0));
    }

    // Moon (`.moon`, 96x96, rendered center at left 303.5 top 79) with its
    // "bite" disc (`.moonbite`, 96x96, rendered center at left 247.5 top
    // 103) overlapping its lower-left — measured from the mock's actual
    // rendered layout (its saved inline styles don't match what it
    // actually paints; a headless-browser screenshot does).
    let moon_r = px(48.0);
    let moon_cx = px(303.5);
    let moon_cy = py(79.0);
    surface.set_fill(Some(solid_fill(cream, 1.0)));
    surface.draw_path(&circle_path(moon_cx, moon_cy, moon_r));
    let moonbite_cx = px(247.5);
    let moonbite_cy = py(103.0);
    surface.set_fill(Some(solid_fill(bg_mid, 1.0)));
    surface.draw_path(&circle_path(moonbite_cx, moonbite_cy, moon_r));

    let center_x = PAGE_WIDTH / 2.0;

    // .eyebrow { top:186; font-size:13; letter-spacing:6; color:#c9b878;
    // uppercase } — "Letní tábor Brehoni"
    draw_letter_spaced_centered(
        &mut surface,
        center_x,
        baseline(186.0, px(13.0)),
        &nunito_font,
        nunito_font_data,
        px(13.0),
        "LETNÍ TÁBOR BREHONI",
        px(6.0),
        solid_fill(gold, 1.0),
    );

    // .zpevnik { top:222; font-size:52; letter-spacing:3; color:#f6ecc9 }
    draw_letter_spaced_centered_with_fallback(
        &mut surface,
        center_x,
        baseline(222.0, px(52.0)),
        &display_font,
        display_font_data,
        Some((
            &display_fallback_font,
            display_fallback_font_data,
            &display_font_coverage,
        )),
        px(52.0),
        "Zpêvník",
        px(3.0),
        solid_fill(cream, 1.0),
    );

    // .divider { top:300; width:180; height:2 }
    let divider_y = py(300.0);
    let divider_half_w = px(90.0);
    let mut divider_pb = PathBuilder::new();
    divider_pb.push_rect(
        Rect::from_xywh(
            center_x - divider_half_w,
            divider_y,
            divider_half_w * 2.0,
            py(2.0),
        )
        .unwrap(),
    );
    surface.set_fill(Some(solid_fill(gold, 1.0)));
    surface.draw_path(&divider_pb.finish().unwrap());

    // .storytitle { top:326; font-size:64; letter-spacing:2; color:#f6ecc9 }
    draw_letter_spaced_centered(
        &mut surface,
        center_x,
        baseline(326.0, px(64.0)),
        &display_font,
        display_font_data,
        px(64.0),
        "Velmor",
        px(2.0),
        solid_fill(cream, 1.0),
    );

    // .subtitle { top:404; font-size:19; italic bold; letter-spacing:1;
    // color:#e7cf8f }
    let honey = (0xe7, 0xcf, 0x8f);
    draw_letter_spaced_centered(
        &mut surface,
        center_x,
        baseline(404.0, px(19.0)),
        &nunito_font,
        nunito_font_data,
        px(19.0),
        "Stíny a tajemství",
        px(1.0),
        solid_fill(honey, 1.0),
    );

    // .year { top:452; font-size:15; letter-spacing:3; color:#9fb0e0 }
    draw_letter_spaced_centered(
        &mut surface,
        center_x,
        baseline(452.0, px(15.0)),
        &nunito_font,
        nunito_font_data,
        px(15.0),
        "2026",
        px(3.0),
        solid_fill(pale_blue, 1.0),
    );

    // .footline { top:486 (measured); font-size:11; letter-spacing:4;
    // color:#8a9bd4; uppercase } — "Brehoni"
    let footline_blue = (0x8a, 0x9b, 0xd4);
    draw_letter_spaced_centered(
        &mut surface,
        center_x,
        baseline(486.0, px(11.0)),
        &nunito_font,
        nunito_font_data,
        px(11.0),
        "BREHONI",
        px(4.0),
        solid_fill(footline_blue, 1.0),
    );

    // Mountain skyline (`.skyline`, bottom 150px tall) with lit windows.
    let skyline_top = py(794.0 - 150.0);
    let peaks: &[(f32, f32)] = &[
        (0.0, 0.35),
        (0.14, 0.55),
        (0.24, 0.42),
        (0.36, 0.75),
        (0.5, 0.5),
        (0.63, 0.85),
        (0.78, 0.6),
        (0.9, 0.78),
        (1.0, 0.45),
    ];
    let mut sky_pb = PathBuilder::new();
    sky_pb.move_to(0.0, PAGE_HEIGHT);
    for (fx, fh) in peaks.iter() {
        let x = fx * PAGE_WIDTH;
        let y = skyline_top + (1.0 - fh) * (PAGE_HEIGHT - skyline_top);
        sky_pb.line_to(x, y);
    }
    sky_pb.line_to(PAGE_WIDTH, PAGE_HEIGHT);
    sky_pb.close();
    surface.set_fill(Some(solid_fill(tower_color, 1.0)));
    surface.draw_path(&sky_pb.finish().unwrap());

    for i in 0..24 {
        let fx = pseudo_rand(i as f32 * 4.4 + 9.0);
        let x = fx * PAGE_WIDTH;
        let peak_h = {
            // Roughly follow the skyline shape so windows land inside it.
            let seg = (fx * (peaks.len() as f32 - 1.0)).floor() as usize;
            let seg = seg.min(peaks.len() - 2);
            let (x0, h0) = peaks[seg];
            let (x1, h1) = peaks[seg + 1];
            let t = ((fx - x0) / (x1 - x0)).clamp(0.0, 1.0);
            h0 + (h1 - h0) * t
        };
        let base_y = skyline_top + (1.0 - peak_h) * (PAGE_HEIGHT - skyline_top);
        let y = base_y + pseudo_rand(i as f32 * 1.7 + 20.0) * (PAGE_HEIGHT - base_y) * 0.8 + 6.0;
        surface.set_fill(Some(solid_fill(gold, 0.55)));
        let mut win_pb = PathBuilder::new();
        win_pb.push_rect(Rect::from_xywh(x, y, px(2.6), px(2.6)).unwrap());
        surface.draw_path(&win_pb.finish().unwrap());
    }

    // Logo mark (`.logo`, 44x44, rendered top-left at 498.5, 729 — like the
    // moons, the mock's saved inline style doesn't match its actual
    // rendered position, so this is measured from the real layout):
    // `assets/brehoni-logo.svg` — a rounded navy square (rx 20 in its
    // 100x100 viewBox) with a white triquetra knot, stroke-width 9.741,
    // traced directly from the SVG's path data below.
    let logo_size = px(44.0);
    let logo_x = px(498.5);
    // Keep the logo's margin from the right edge equal to its margin from
    // the bottom edge (the mock's own layout has an uneven 17.6pt/22.1pt
    // gap here).
    let logo_margin = PAGE_WIDTH - (logo_x + logo_size);
    let logo_y = PAGE_HEIGHT - logo_size - logo_margin;
    let logo_navy = (0x26, 0x3a, 0x78);
    let logo_scale = logo_size / 100.0;

    let mut badge_pb = PathBuilder::new();
    add_rounded_rect(
        &mut badge_pb,
        logo_x,
        logo_y,
        logo_size,
        logo_size,
        20.0 * logo_scale,
    );
    surface.set_fill(Some(solid_fill(logo_navy, 1.0)));
    surface.draw_path(&badge_pb.finish().unwrap());

    // Triquetra path, traced from the SVG's `d` attribute (a single closed
    // cubic-bezier path in a 100x100 viewBox), scaled/offset into the badge.
    let svg_pt = |x: f32, y: f32| Point::from_xy(logo_x + x * logo_scale, logo_y + y * logo_scale);
    let mut knot_pb = PathBuilder::new();
    let m = svg_pt(34.080, 45.270);
    knot_pb.move_to(m.x, m.y);
    let cubic = |pb: &mut PathBuilder, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32| {
        let p1 = svg_pt(x1, y1);
        let p2 = svg_pt(x2, y2);
        let p = svg_pt(x, y);
        pb.cubic_to(p1.x, p1.y, p2.x, p2.y, p.x, p.y);
    };
    cubic(&mut knot_pb, 34.080, 65.557, 50.844, 82.003, 71.524, 82.003);
    cubic(&mut knot_pb, 77.383, 82.003, 83.159, 80.654, 87.900, 78.901);
    cubic(&mut knot_pb, 86.295, 60.282, 69.888, 45.068, 50.025, 45.068);
    cubic(&mut knot_pb, 30.165, 45.068, 13.759, 60.278, 12.150, 78.898);
    cubic(&mut knot_pb, 16.890, 80.654, 22.667, 82.002, 28.526, 82.003);
    cubic(&mut knot_pb, 49.206, 82.003, 65.970, 65.557, 65.970, 45.271);
    cubic(&mut knot_pb, 65.970, 32.885, 59.607, 21.333, 50.025, 14.545);
    cubic(&mut knot_pb, 40.443, 21.333, 34.080, 32.885, 34.080, 45.271);
    knot_pb.close();

    surface.set_fill(None);
    surface.set_stroke(Some(krilla::paint::Stroke {
        paint: Paint::from(rgb::Color::new(0xff, 0xff, 0xff)),
        width: 9.741 * logo_scale,
        ..Default::default()
    }));
    surface.draw_path(&knot_pb.finish().unwrap());
    surface.set_stroke(None);

    surface.finish();
    page.finish();
}
