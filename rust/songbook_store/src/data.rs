use std::collections::HashMap;

use chrono::{DateTime, Utc};
use operational_transform::OperationSeq;
use serde::{Deserialize, Serialize};

use crate::id::Id;

#[derive(Deserialize, Serialize, Debug)]
struct DataFile {
    users: Vec<UserPublic>,
    songs: Vec<Song>,
    collections: Vec<Collection>,

    reified_local_ids: HashMap<i32, i32>,
}

#[derive(Deserialize, Serialize, Debug)]
struct Song {
    id: Id<Song>,
    slug: String,
    author: String,
    title: String,
    text: OTText,

    font_size: f32,
    pretranspose: i8,
    paragraph_space: f32,
    spotify: String,
    title_space: f32,
    extra_non_searchable: OTText,
    extra_searchable: OTText,
    editor: i32,

    last_modified: DateTime<Utc>,
    inserted_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, Debug)]
struct OTText {
    text: String,
    sequence: OperationSeq,
}

#[derive(Deserialize, Serialize, Debug)]
pub(crate) struct UserPublic {
    id: Id<UserPublic>,
    handle: String,
    name: String,
    registered_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, Debug)]
struct Collection {
    id: Id<Collection>,
    slug: String,
    name: String,
    owner: Option<Id<UserPublic>>,
    locked: bool,
    songs: Vec<Id<Song>>,

    last_modified: DateTime<Utc>,
    inserted_at: DateTime<Utc>,
}
