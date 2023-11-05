use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{data::UserPublic, id::Id};

#[derive(Deserialize, Serialize, Debug)]
struct User {
    public: UserPublic,
    internal: UserInternal,
}

#[derive(Deserialize, Serialize, Debug)]
struct UserInternal {
    admin: bool,
    email: String,
    password_hash: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct Session {
    user: Id<UserPublic>,
    token: String,
    validity_start: DateTime<Utc>,
}
