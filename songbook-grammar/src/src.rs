#![allow(unused)]

use anyhow::Result;
use serde::Deserialize;
use std::string::String;
use std::vec::Vec;

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
    SectionStart(String),
    Line(Vec<LineContent>),
}

#[derive(Deserialize)]
pub(super) enum LineContent {
    Text(String),
    Command(Vec<Command>),
}

#[derive(Deserialize)]
pub(super) enum Command {
    CommandLead(String),
    CommandContent(String),
}
