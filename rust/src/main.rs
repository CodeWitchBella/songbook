#![allow(dead_code)]
use updater_change::ChangeSeq;

mod data;
mod id;
mod server_only;
mod updater_change;
mod updater_object;

fn main() {
    let mut changes = ChangeSeq::default();
    changes.set("abc", "def".into());
    changes.delete("abc");

    println!("changes: {changes:?}");
}

/*
 * TODO:
 *  - replace OTError with more specific error
 *  - remove allow(dead_code)
 */
