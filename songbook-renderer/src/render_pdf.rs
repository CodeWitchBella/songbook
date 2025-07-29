use anyhow::Result;
use oxidize_pdf::{Document, Page, Font, Color};

use songbook_grammar::Song;

pub(crate) fn generate_pdf(song: &Song) -> Result<()> {
    // Create a new document
    let mut doc = Document::new();
    doc.set_title("My First PDF");
    doc.set_author("Rust Developer");
    
    // Create a page
    let mut page = Page::a4();

    
    // Add text
    page.text()
        .set_font(Font::Helvetica, 24.0)
        .at(50.0, 700.0)
        .write("Hello, PDF!")?;
    
    // Add graphics
    page.graphics()
        .set_fill_color(Color::rgb(0.0, 0.5, 1.0))
        .circle(300.0, 400.0, 50.0)
        .fill();
    
    // Add the page and save
    doc.add_page(page);
    doc.save("hello.pdf")?;
    
    Ok(())
}

fn render_song(song: &Song, page: &mut Page)-> Result<()> {
    
    let mut y = page.content_height();
    for portion in &song.children {
        // portion.
    }

    Ok(())
}