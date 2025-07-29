#![allow(unused)]
use anyhow::{Result, anyhow};
use std::string::String;
use std::vec::Vec;

mod src {
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
}

#[derive(Debug)]
pub(crate) struct File {
    pub(crate) children: Vec<FilePortion>,
}

impl File {
    pub(crate) fn parse(src: &str) -> Result<Self> {
        let mut file: src::File = serde_json::from_str(&src)?;
        Ok(Self {
            children: match file {
                src::File::File(items) => items
                    .into_iter()
                    .map(|item| Ok(FilePortion::from_src(item)?))
                    .collect::<Result<Vec<FilePortion>>>()?,
            },
        })
    }
}

#[derive(Debug)]
pub(crate) enum FilePortion {
    Section {
        header: Option<String>,
        lines: Vec<Line>,
    },
    PageBreak,
}

impl FilePortion {
    pub(self) fn from_src(portion: src::FilePortion) -> Result<Self> {
        match portion {
            src::FilePortion::Section(contents) => {
                let header: Option<String> = match contents.get(0) {
                    Some(first) => match first {
                        src::SectionPortion::SectionStart(start) => Some(start.clone()),
                        src::SectionPortion::Line(_) => None,
                    },
                    _ => None,
                };

                Ok(Self::Section {
                    header,
                    lines: contents
                        .into_iter()
                        .filter_map(|item| -> Option<Result<Line>> {
                            match item {
                                src::SectionPortion::SectionStart(_) => None,
                                src::SectionPortion::Line(line) => Some(Line::from_src(line)),
                            }
                        })
                        .collect::<Result<Vec<Line>>>()?,
                })
            }
            src::FilePortion::PageBreak(_) => Ok(Self::PageBreak),
        }
    }
}

impl Line {
    pub(self) fn from_src(items: Vec<src::LineContent>) -> Result<Self> {
        Ok(Self(
            items
                .into_iter()
                .map(|item| -> Result<LineContent> { LineContent::from_src(item) })
                .collect::<Result<Vec<LineContent>>>()?,
        ))
    }
}

#[derive(Debug)]
pub(crate) struct Line(pub(crate) Vec<LineContent>);

#[derive(Debug)]
pub(crate) enum LineContent {
    Text(String),
    Command {
        lead: Option<String>,
        content: String,
    },
}

impl LineContent {
    pub(self) fn from_src(content: src::LineContent) -> Result<Self> {
        Ok(match content {
            src::LineContent::Text(text) => Self::Text(text),
            src::LineContent::Command(items) => {
                if items.len() == 0 {
                    return Ok(Self::Command {
                        lead: None,
                        content: "".to_owned(),
                    });
                }
                let lead = match &items[0] {
                    src::Command::CommandLead(data) => data.clone(),
                    src::Command::CommandContent(content) => {
                        return Ok(Self::Command {
                            lead: None,
                            content: content.clone(),
                        });
                    }
                };
                if items.len() == 1 {
                    return Ok(Self::Command {
                        lead: Some(lead),
                        content: "".to_owned(),
                    });
                }
                Self::Command {
                    lead: Some(lead),
                    content: match &items[1] {
                        src::Command::CommandLead(data) => {
                            return Err(anyhow!("Invalid command:: multiple leads"));
                        }
                        src::Command::CommandContent(content) => {
                            return Ok(Self::Command {
                                lead: None,
                                content: content.clone(),
                            });
                        }
                    },
                }
            }
        })
    }
}
