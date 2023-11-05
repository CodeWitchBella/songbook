use operational_transform::{OTError, OperationSeq};
use std::iter::Iterator;

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

/**
 * Sequence of changes that can be applied to a `Document`. Modifications to the
 * list of changes will make sure to remove redundant changes.
 */
#[derive(Default, Debug, PartialEq, Clone)]
pub struct ChangeSeq {
    items: Vec<KeyedChange>,
}

impl ChangeSeq {
    pub fn apply(&self, target: &mut Object) {
        for item in &self.items {
            item.apply(target);
        }
    }
}

impl ChangeSeq {
    pub(crate) fn append(&mut self, change: KeyedChange) -> Result<(), OTError> {
        match change.1 {
            Change::Set(value) => {
                self.set(&change.0, value);
                Ok(())
            }
            Change::Delete => {
                self.delete(&change.0);
                Ok(())
            }
            Change::OT(seq) => self.ot(&change.0, seq),
        }
    }

    pub(crate) fn concat(&mut self, change: &ChangeSeq) -> Result<(), OTError> {
        for item in change.items.iter() {
            self.append(item.clone())?;
        }
        Ok(())
    }

    pub fn compose(&self, other: &Self) -> Result<Self, OTError> {
        let mut out = self.clone();
        out.concat(&other)?;
        Ok(out)
    }

    /**
     * Adds a change to set a value associated to the key.
     *
     * ```
     * # use otmerge::ChangeSeq;
     * let mut seq = ChangeSeq::default();
     * seq.set("key", "value".into());
     * ```
     */
    pub fn set(&mut self, key: &str, value: Value) {
        self.items.retain(|item| *item.0 != *key);
        self.items
            .push(KeyedChange(key.to_owned(), Change::Set(value)));
    }

    /**
     * Adds a change to delete a value associated to the key.
     *
     * ```
     * # use otmerge::ChangeSeq;
     * let mut seq = ChangeSeq::default();
     * seq.delete("key");
     * ```
     */
    pub fn delete(&mut self, key: &str) {
        self.items.retain(|item| *item.0 != *key);
        self.items.push(KeyedChange(key.to_owned(), Change::Delete));
    }

    /**
     * Adds a change to apply operational-transform to a given key. The change
     * can only be applied if the value is of type string. See documentation of
     * [`operational_transform`] on how to construct the OT.
     *
     * ```
     * # use otmerge::ChangeSeq;
     * use operational_transform::OperationSeq;
     *
     * let mut seq = ChangeSeq::default();
     * let mut ot = OperationSeq::default();
     * ot.insert("abc");
     * seq.ot("key", ot);
     * ```
     */
    pub fn ot(&mut self, key: &str, seq: OperationSeq) -> Result<(), OTError> {
        // Assert the invariant that document does not contain redundant changes.
        // At least for OT.
        let mut found_ot = false;
        for i in 0..self.items.len() {
            let item = &self.items[i];
            if item.0 != key {
                continue;
            }
            if !found_ot {
                found_ot = match item.1 {
                    Change::OT(_) => true,
                    _ => false,
                };
            } else {
                // We found OT and there is another change.
                // If it's OT -> they should've been merged.
                // If it's not OT -> the OT should've been removed as it
                //   does not affect the result at all as every non-OT
                //   change is an overwrite.
                panic!("Found multiple OTs affecting the same node, or OT followed by overwrite. This is a bug.");
            }
        }

        // Find first OT change affecting the key. It should not be
        // followed by overwrite as that would violate our invariant of
        // redundant changes.
        let item = self.items.iter_mut().find_map(|item| {
            if *item.0 != *key {
                return None;
            }
            match &mut item.1 {
                Change::OT(ot) => Some(ot),
                _ => None,
            }
        });

        match item {
            Some(item) => {
                item.compose(&seq)?;
                Ok(())
            }
            None => {
                self.items
                    .push(KeyedChange(key.to_owned(), Change::OT(seq)));
                Ok(())
            }
        }
    }
}
