use anyhow::Result;
use songbook_grammar::{Line, Song};

use crate::song_layout::{Item, Layout};

const FONT_SIZE:f64=16.;
const SECTION_SPACE:f64=24.;
const LINE_SPACE: f64= 4.;

pub fn layout_song(song: &Song) -> Result<Layout> {
    let mut layout: Layout = Layout {
        font_size: FONT_SIZE,
        items: Default::default(),
    };
    let mut y = 0.;
    for portion in &song.portions {

        match portion {
            songbook_grammar::FilePortion::Section { header, lines } => {
                for line in lines {
                    let mut data = layout_line(line, y)?;
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

fn layout_line(line: &Line, y: f64) -> Result<(Vec<Item>, f64)> {
    let mut vec = vec![];
    let mut x = 0.;

    let mut y_off = 16.0;
    for part in &line.0 {
        match part {
            songbook_grammar::LineContent::Text(_) => {},
            songbook_grammar::LineContent::Command { lead, content } => {
                y_off *= 2.;
                break;
            },
        }
    }

    for part in &line.0 {
        let bold = match part {
            songbook_grammar::LineContent::Text(_) => false,
            songbook_grammar::LineContent::Command { lead, content } => {
                lead.as_ref().map_or(true, |text| !text.contains("^"))
            }
        };
        let text = match part {
            songbook_grammar::LineContent::Text(text) => text,
            songbook_grammar::LineContent::Command { lead: _, content } => content,
        }
        .clone();
        let yy = match part {
            songbook_grammar::LineContent::Text(_) => y+y_off,
            songbook_grammar::LineContent::Command { .. } => y+y_off-16.,
        };

        let w = (text.len() as f64) * 8.; // TODO: non-monospace text
        vec.push(Item {
            bold,
            pos: (x as f32, yy as f32),
            text,
        });
        if let songbook_grammar::LineContent::Text(_) = part {
            x += w;
        }
    }
    return Ok((vec, y_off));
}