//! Booklet ("2-up saddle stitch") imposition: takes an already-rendered PDF
//! and re-pages it so that each output sheet holds two source pages, scaled
//! to half size and placed side by side with no gap, in an order such that
//! folding the whole stack of sheets in half down the middle produces the
//! pages in reading order (a standard nested-signature booklet, the same
//! ordering the frontend's `PDFBookletDouble` uses).
use std::sync::Arc;

use krilla::Document;
use krilla::geom::{Size, Transform};
use krilla::page::PageSettings;
use krilla::pdf::{Pdf, PdfDocument};

use crate::{PAGE_HEIGHT, PAGE_WIDTH};

/// Re-impose `pdf_bytes` (a PDF this crate rendered) as a booklet.
///
/// Each output page is a full A4 sheet in landscape (`PAGE_HEIGHT` wide,
/// `PAGE_WIDTH` tall), holding two source pages scaled down by half and
/// placed left/right with no padding or margin. Print double-sided with
/// "flip on short edge" (the
/// usual duplex setting for landscape booklet imposition) and fold the
/// whole stack in half down the middle; the nested sheets come out in
/// reading order.
pub fn impose_booklet(pdf_bytes: Vec<u8>) -> Vec<u8> {
    let pdf = Arc::new(Pdf::new(pdf_bytes).expect("re-parsing our own rendered PDF"));
    let page_count = pdf.pages().len();
    let source = PdfDocument::new(pdf);

    // The sheet is a full A4 (landscape): its long edge (`PAGE_HEIGHT`, the
    // source page's height) becomes the sheet's width, split in two so each
    // half keeps the source page's aspect ratio and comes out A5-sized.
    let sheet_width = PAGE_HEIGHT;
    let sheet_height = PAGE_WIDTH;
    let half_size = Size::from_wh(sheet_width / 2.0, sheet_height).expect("non-zero half size");

    let mut document = Document::new();
    for (left, right) in booklet_pairs(page_count) {
        let mut page =
            document.start_page_with(PageSettings::from_wh(sheet_width, sheet_height).unwrap());
        let mut surface = page.surface();

        if let Some(idx) = left {
            surface.draw_pdf_page(&source, half_size, idx);
        }
        if let Some(idx) = right {
            surface.push_transform(&Transform::from_translate(sheet_width / 2.0, 0.0));
            surface.draw_pdf_page(&source, half_size, idx);
            surface.pop();
        }

        surface.finish();
        page.finish();
    }

    document.finish().expect("failed to finish booklet PDF")
}

/// Compute the (left, right) source page indices for each output sheet face,
/// in the order the faces should be printed/stacked.
///
/// `page_count` source pages are padded with blanks (`None`) up to a
/// multiple of 4, since every folded sheet needs exactly 4 source pages (a
/// front-left/front-right and back-left/back-right). For `N` (padded) pages,
/// sheet `i`'s front face is `(N-1-2i, 2i)` and its back face is
/// `(2i+1, N-2-2i)`; walking the remaining page list from both ends
/// alternately produces exactly that sequence.
fn booklet_pairs(page_count: usize) -> Vec<(Option<usize>, Option<usize>)> {
    if page_count == 0 {
        return Vec::new();
    }

    let padded = page_count.div_ceil(4) * 4;
    let mut pages: Vec<Option<usize>> = (0..padded)
        .map(|i| if i < page_count { Some(i) } else { None })
        .collect();

    let mut pairs = Vec::with_capacity(padded / 2);
    while !pages.is_empty() {
        let last = pages.pop().unwrap();
        let first = pages.remove(0);
        pairs.push((last, first));

        if pages.is_empty() {
            break;
        }
        let first = pages.remove(0);
        let last = pages.pop().unwrap();
        pairs.push((first, last));
    }
    pairs
}

#[cfg(test)]
mod tests {
    use super::booklet_pairs;

    #[test]
    fn four_pages_one_sheet() {
        assert_eq!(
            booklet_pairs(4),
            vec![(Some(3), Some(0)), (Some(1), Some(2))]
        );
    }

    #[test]
    fn eight_pages_two_sheets() {
        assert_eq!(
            booklet_pairs(8),
            vec![
                (Some(7), Some(0)),
                (Some(1), Some(6)),
                (Some(5), Some(2)),
                (Some(3), Some(4)),
            ]
        );
    }

    #[test]
    fn pads_to_multiple_of_four() {
        // 5 source pages -> padded to 8, with blanks for the missing 3.
        assert_eq!(
            booklet_pairs(5),
            vec![
                (None, Some(0)),
                (Some(1), None),
                (None, Some(2)),
                (Some(3), Some(4)),
            ]
        );
    }
}
