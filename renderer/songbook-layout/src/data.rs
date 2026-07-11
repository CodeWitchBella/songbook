#![feature(default_field_values)]

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum ItemType {
    /// Lyric text, drawn in the normal weight.
    Text,
    /// `*`-prefixed inline lyric text, drawn bold (frontend `[*…]`).
    BoldText,
    /// A chord, drawn bold and interactive.
    Chord,
    /// A `^`-prefixed chord, interactive but drawn in the normal weight.
    ChordNormal,
    /// The title/author header, drawn bold.
    Header,
    /// A line tag / návěští (e.g. "R:", "S:"), drawn bold.
    Tag,
}

impl ItemType {
    /// Whether items of this kind are drawn in a bold weight.
    pub fn is_bold(&self) -> bool {
        matches!(
            self,
            ItemType::Chord | ItemType::Header | ItemType::Tag | ItemType::BoldText
        )
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Item {
    pub text: String,
    pub item_type: ItemType,

    /// Font size this item was laid out at, in the same units as
    /// [`Layout::font_size`]. The header is set in a different size than the
    /// body, so it's carried per-item rather than assumed from the layout.
    pub font_size: f32,

    /// Advance width of the rendered text, in the same (screenspace) units as
    /// [`Item::pos`]. Used to know the item's right extent.
    pub width: f32,

    /// This item's own font ascent and descent (distance from the glyph's
    /// natural top/bottom to the baseline at `pos.1`), at its rendered font,
    /// size and weight. `canvas`/`pdf` renderers draw directly at the
    /// baseline and don't need this; the HTML renderer's `<div>`s are
    /// top-anchored, so it uses these to convert `pos.1` (a baseline) into a
    /// CSS `top` and matching `line-height` that puts the glyph baseline back
    /// at `pos.1` instead of at the div's top edge.
    pub ascent: f32,
    pub descent: f32,

    /// Signifies the position of the text on the page.
    ///
    /// The coordinate system is in screenspace - topleft is (0,0)
    /// x goes to the right, y goes down (ie. the <canvas> not PDF way)
    ///
    /// The text is the drawn above this point - baseline is exactly at y,
    /// the text runs to the right from this spot.
    ///
    /// Other way to put it: If you draw line to the right from this pos,
    /// it will be an underline for the text.
    ///
    /// X marks the spot
    /// ```plain
    ///  _          _ _
    ///  | |__   ___| | | ___
    ///  | '_ \ / _ \ | |/ _ \
    ///  | | | |  __/ | | (_) |
    /// \/_| |_|\___|_|_|\___/
    /// /\
    /// ```
    pub pos: (f32, f32),
}

// pub(crate) struct PageBreak {
//     /// where in the layout the page break starts
//     pub pos: f32,
//     /// how much space should be skipped after the page break before rendering the next one
//     pub gap: f32,
// }

#[derive(Default, Serialize)]
pub struct Layout {
    pub font_size: f64,
    pub items: Vec<Item>,
    // pub page_breaks: Vec<PageBreak>,
}

impl Layout {
    pub(crate) fn sample() -> Self {
        Self {
            font_size: 16.,
            items: vec![
                Item {
                    text: "When the gays".to_owned(),
                    item_type: ItemType::Text,
                    font_size: 16.,
                    width: 0.,
                    ascent: 13.,
                    descent: 3.,
                    pos: (0., 32.0),
                },
                Item {
                    text: "Gmi".to_owned(),
                    item_type: ItemType::Chord,
                    font_size: 16.,
                    width: 0.,
                    ascent: 13.,
                    descent: 3.,
                    pos: (6., 16.0),
                },
                Item {
                    text: "are old".to_owned(),
                    item_type: ItemType::Text,
                    font_size: 16.,
                    width: 0.,
                    ascent: 13.,
                    descent: 3.,
                    pos: (16., 48.0),
                },
            ],
            // page_breaks: vec![],
        }
    }
}
