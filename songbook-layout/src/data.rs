#![feature(default_field_values)]

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Item {
    pub text: String,
    pub bold: bool,

    /// Advance width of the rendered text, in the same (screenspace) units as
    /// [`Item::pos`]. Used to know the item's right extent.
    pub width: f32,

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
                    bold: false,
                    width: 0.,
                    pos: (0., 32.0),
                },
                Item {
                    text: "Gmi".to_owned(),
                    bold: true,
                    width: 0.,
                    pos: (6., 16.0),
                },
                Item {
                    text: "are old".to_owned(),
                    bold: false,
                    width: 0.,
                    pos: (16., 48.0),
                },
            ],
            // page_breaks: vec![],
        }
    }
}
