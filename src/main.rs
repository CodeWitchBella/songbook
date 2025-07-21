use oxidize_pdf::{Document, Page, Font, Color, Result};

fn main() -> Result<()>{
    println!("Hello, world!");

    // Create a new document
    let mut doc = Document::new();
    doc.set_title("My PDF");

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

    // Save the document
    doc.add_page(page);
    doc.save("output.pdf")?;
    Ok(())
}
