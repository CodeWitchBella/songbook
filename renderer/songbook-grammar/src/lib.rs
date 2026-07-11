use anyhow::{Result, anyhow, bail};
use serde::Deserialize;
use std::string::String;
use std::vec::Vec;

mod grammar_src;

/// Typed shape of the optional JSON frontmatter. Mirrors the `Song<DT>` record
/// with dates deserialized as strings (ISO). The `editor` field is omitted.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Frontmatter {
    pub slug: String,
    pub id: String,
    pub last_modified: String,
    pub text: String,
    pub spotify: Option<String>,
    pub pretranspose: f64,
    pub inserted_at: Option<String>,
    pub author: String,
    pub title: String,
    pub extra_searchable: Option<String>,
    pub extra_non_searchable: Option<String>,
}

#[derive(Debug)]
pub struct Song {
    /// Optional JSON frontmatter extracted from the top of the `.song` file.
    pub frontmatter: Option<Frontmatter>,
    pub portions: Vec<FilePortion>,
}

impl Song {
    pub fn parse(src: &str) -> Result<Self> {
        let parsed = match serde_json::from_str::<grammar_src::ParsedSong>(&src) {
            Ok(val) => val,
            Err(err) => bail!("{err}"),
        };
        Ok(Self {
            frontmatter: parsed.frontmatter,
            portions: match parsed.file {
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
    Section(Vec<Line>),
}

impl FilePortion {
    pub(self) fn from_src(portion: grammar_src::FilePortion) -> Result<Self> {
        match portion {
            grammar_src::FilePortion::Section(contents) => Ok(Self::Section(
                contents
                    .into_iter()
                    .filter_map(|item| -> Option<Result<Line>> {
                        match item {
                            grammar_src::SectionPortion::Line(line) => Some(Line::from_src(line)),
                        }
                    })
                    .collect::<Result<Vec<Line>>>()?,
            )),
        }
    }
}

impl Line {
    pub(self) fn from_src(items: Vec<grammar_src::LineContent>) -> Result<Self> {
        let label: Option<String> = match items.get(0) {
            Some(first) => match first {
                grammar_src::LineContent::LineLabel(label) => Some(label.clone()),
                _ => None,
            },
            _ => None,
        };

        Ok(Self {
            label,
            content: items
                .into_iter()
                .filter_map(|item| -> Option<Result<LineContent>> {
                    match LineContent::from_src(item) {
                        Ok(val) => match val {
                            Some(val) => Some(Ok(val)),
                            None => None,
                        },
                        Err(err) => Some(Err(err)),
                    }
                })
                .collect::<Result<Vec<LineContent>>>()?,
        })
    }
}

#[derive(Debug)]
pub struct Line {
    pub label: Option<String>,
    pub content: Vec<LineContent>,
}

#[derive(Debug)]
pub enum LineContent {
    Text(String),
    Command {
        lead: Option<String>,
        content: String,
    },
}

impl LineContent {
    pub(self) fn from_src(content: grammar_src::LineContent) -> Result<Option<Self>> {
        Ok(match content {
            grammar_src::LineContent::Text(text) => Some(Self::Text(text)),
            grammar_src::LineContent::Command(items) => {
                if items.len() == 0 {
                    return Ok(Some(Self::Command {
                        lead: None,
                        content: "".to_owned(),
                    }));
                }
                let lead = match &items[0] {
                    grammar_src::Command::CommandLead(data) => data.clone(),
                    grammar_src::Command::CommandContent(content) => {
                        return Ok(Some(Self::Command {
                            lead: None,
                            content: content.clone(),
                        }));
                    }
                };
                if items.len() == 1 {
                    return Ok(Some(Self::Command {
                        lead: Some(lead),
                        content: "".to_owned(),
                    }));
                }
                Some(Self::Command {
                    lead: Some(lead),
                    content: match &items[1] {
                        grammar_src::Command::CommandLead(_) => {
                            return Err(anyhow!("Invalid command:: multiple leads"));
                        }
                        grammar_src::Command::CommandContent(content) => content.clone(),
                    },
                })
            }
            grammar_src::LineContent::LineLabel(_) => None,
        })
    }
}
