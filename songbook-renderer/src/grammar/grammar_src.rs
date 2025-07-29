#![allow(unused)]

use anyhow::Result;
use facet;
use std::string::String;
use std::vec::Vec;

#[derive(facet::Facet)]
#[repr(u8)]
pub(super) enum File {
    File(Vec<FilePortion>),
}

#[derive(facet::Facet)]
#[repr(u8)]
pub(super) enum FilePortion {
    Section(Vec<SectionPortion>),
    PageBreak(String),
}

#[derive(facet::Facet)]
#[repr(u8)]
pub(super) enum SectionPortion {
    SectionStart(String),
    Line(Vec<LineContent>),
}

#[derive(facet::Facet)]
#[repr(u8)]
pub(super) enum LineContent {
    Text(String),
    Command(Vec<Command>),
}

#[derive(facet::Facet)]
#[repr(u8)]
pub(super) enum Command {
    CommandLead(String),
    CommandContent(String),
}
