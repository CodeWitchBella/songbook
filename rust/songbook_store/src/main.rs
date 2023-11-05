use otmerge::ChangeSeq;

mod data;
mod id;
mod server_only;

fn main() {
    let mut changes = ChangeSeq::default();
    changes.set("abc", "def".into());
    changes.delete("abc");

    println!("changes: {changes:?}");
}
