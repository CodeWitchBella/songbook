#![allow(unused)]

use anyhow::Result;
use serde::Deserialize;
use std::string::String;
use std::vec::Vec;

/// Top-level wrapper produced by `parseSong` in `song-parse.ts`: the optional
/// JSON frontmatter alongside the grammar-parsed file tree.
#[derive(Deserialize)]
pub(super) struct ParsedSong {
    pub(super) frontmatter: Option<super::Frontmatter>,
    pub(super) file: File,
}

#[derive(Deserialize)]
pub(super) enum File {
    File(Vec<FilePortion>),
}

#[derive(Deserialize)]
pub(super) enum FilePortion {
    Section(Vec<SectionPortion>),
    PageBreak(String),
}

#[derive(Deserialize)]
pub(super) enum SectionPortion {
    Line(Vec<LineContent>),
}

#[derive(Deserialize)]
pub(super) enum LineContent {
    LineLabel(String),
    Text(String),
    Command(Vec<Command>),
}

#[derive(Deserialize)]
pub(super) enum Command {
    CommandLead(String),
    CommandContent(String),
}
