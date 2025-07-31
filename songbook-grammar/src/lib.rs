use anyhow::{Result, anyhow, bail};
use std::string::String;
use std::vec::Vec;

mod grammar_src;

#[derive(Debug)]
pub struct Song {
    pub portions: Vec<FilePortion>,
}

impl Song {
    pub fn parse(src: &str) -> Result<Self> {
        let file = match serde_json::from_str::<grammar_src::File>(&src) {
            Ok(val) => val,
            Err(err) => bail!("{err}"),
        };
        Ok(Self {
            portions: match file {
                grammar_src::File::File(items) => items
                    .into_iter()
                    .map(|item| Ok(FilePortion::from_src(item)?))
                    .collect::<Result<Vec<FilePortion>>>()?,
            },
        })
    }
}

#[derive(Debug)]
pub enum FilePortion {
    Section {
        header: Option<String>,
        lines: Vec<Line>,
    },
    PageBreak,
}

impl FilePortion {
    pub(self) fn from_src(portion: grammar_src::FilePortion) -> Result<Self> {
        match portion {
            grammar_src::FilePortion::Section(contents) => {
                let header: Option<String> = match contents.get(0) {
                    Some(first) => match first {
                        grammar_src::SectionPortion::SectionStart(start) => Some(start.clone()),
                        grammar_src::SectionPortion::Line(_) => None,
                    },
                    _ => None,
                };

                Ok(Self::Section {
                    header,
                    lines: contents
                        .into_iter()
                        .filter_map(|item| -> Option<Result<Line>> {
                            match item {
                                grammar_src::SectionPortion::SectionStart(_) => None,
                                grammar_src::SectionPortion::Line(line) => {
                                    Some(Line::from_src(line))
                                }
                            }
                        })
                        .collect::<Result<Vec<Line>>>()?,
                })
            }
            grammar_src::FilePortion::PageBreak(_) => Ok(Self::PageBreak),
        }
    }
}

impl Line {
    pub(self) fn from_src(items: Vec<grammar_src::LineContent>) -> Result<Self> {
        Ok(Self(
            items
                .into_iter()
                .map(|item| -> Result<LineContent> { LineContent::from_src(item) })
                .collect::<Result<Vec<LineContent>>>()?,
        ))
    }
}

#[derive(Debug)]
pub struct Line(pub Vec<LineContent>);

#[derive(Debug)]
pub enum LineContent {
    Text(String),
    Command {
        lead: Option<String>,
        content: String,
    },
}

impl LineContent {
    pub(self) fn from_src(content: grammar_src::LineContent) -> Result<Self> {
        Ok(match content {
            grammar_src::LineContent::Text(text) => Self::Text(text),
            grammar_src::LineContent::Command(items) => {
                if items.len() == 0 {
                    return Ok(Self::Command {
                        lead: None,
                        content: "".to_owned(),
                    });
                }
                let lead = match &items[0] {
                    grammar_src::Command::CommandLead(data) => data.clone(),
                    grammar_src::Command::CommandContent(content) => {
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
                        grammar_src::Command::CommandLead(_) => {
                            return Err(anyhow!("Invalid command:: multiple leads"));
                        }
                        grammar_src::Command::CommandContent(content) => content.clone(),
                    },
                }
            }
        })
    }
}
