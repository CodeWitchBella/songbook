use operational_transform::OperationSeq;

use crate::updater_object::*;

#[derive(Debug, PartialEq, Clone)]
pub(crate) enum Change {
    Set(Value),
    Delete,
    OT(OperationSeq),
}

impl Change {
    fn apply(&self, target: &mut Value) {
        match self {
            Change::Set(value) => *target = value.clone(),
            Change::Delete => panic!("This should be handled level above"),
            Change::OT(_) => todo!(),
        }
    }
}

#[derive(Debug, PartialEq, Clone)]
pub(crate) struct KeyedChange(String, Change);

impl KeyedChange {
    fn apply(&self, target: &mut Object) {
        if let Change::Delete = self.1 {
            target.data.remove(&self.0);
        } else {
            match target.data.get_mut(&self.0) {
                Some(r) => self.1.apply(r),
                None => {
                    let mut r = Value::Invalid;
                    self.1.apply(&mut r);
                    if r != Value::Invalid {
                        target.data.insert(self.0.clone(), r);
                    }
                }
            }

            //self.1.apply(&mut value);
        }
    }
}

#[derive(Default, Debug, PartialEq, Clone)]
pub(crate) struct ChangeSeq {
    items: Vec<KeyedChange>,
}

impl ChangeSeq {
    fn apply(&self, target: &mut Object) {
        for item in &self.items {
            item.apply(target);
        }
    }
}

impl ChangeSeq {
    pub(crate) fn append(&mut self, change: KeyedChange) {
        match change.1 {
            Change::Set(_) => {
                self.items.retain(|item| *item.0 != *change.0);
                self.items.push(change);
            }
            Change::Delete => {
                self.items.retain(|item| *item.0 != *change.0);
                self.items.push(change);
            }
            Change::OT(_) => todo!(),
        }
    }

    pub(crate) fn concat(&mut self, change: ChangeSeq) {
        for item in change.items {
            self.append(item);
        }
    }

    pub(crate) fn set(&mut self, key: &str, value: Value) {
        self.append(KeyedChange(key.to_owned(), Change::Set(value)));
    }

    pub(crate) fn delete(&mut self, key: &str) {
        self.append(KeyedChange(key.to_owned(), Change::Delete));
    }
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
    let mut a2 = a.clone();
    a2.concat(b);
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
