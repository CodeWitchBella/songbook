use otmerge::{ChangeSeq, Object};

#[test]
fn delete_removes_previous() {
    let mut a = ChangeSeq::default();
    a.set("key", "value".into());
    a.delete("key");
    let mut b = ChangeSeq::default();
    b.delete("key");
    assert_eq!(a, b);

    // but is not equal to empty change (ChangeSeq does not assume previous state)
    let c = ChangeSeq::default();
    assert_ne!(a, c);
}

/**
 * Applies changes to the doc and asserts that applying the changes is equivalent
 * to concating the changes and applying the result.
 */
#[cfg(test)]
fn test_orderings(doc: Object, a: ChangeSeq, b: ChangeSeq) -> Object {
    let mut doc1 = doc.clone();
    a.apply(&mut doc1);
    b.apply(&mut doc1);

    let mut doc2 = doc.clone();
    let a2 = a.compose(&b).unwrap();
    a2.apply(&mut doc2);
    assert_eq!(doc1, doc2);

    return doc1;
}

#[test]
fn apply() {
    let mut a = ChangeSeq::default();
    a.set("key", "value".into());
    let mut b = ChangeSeq::default();
    b.delete("key");

    let obj = test_orderings(Default::default(), a, b);

    assert_eq!(obj, Object::default());
}

#[test]
fn setting_overrides() {
    let mut a = ChangeSeq::default();
    a.set("key", "value".into());
    a.set("key", "another".into());
    let mut b = ChangeSeq::default();
    b.set("key", "another".into());
    assert_eq!(a, b);
}
