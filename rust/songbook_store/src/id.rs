use std::marker::PhantomData;

use serde::{Deserialize, Serialize};

/**
 * Tagged i32 to make mixing up ids slightly harder, while still providing
 * conversions to be able to do crimes.
 */
#[repr(transparent)]
#[derive(Deserialize, Serialize, Debug)]
pub(crate) struct Id<T>(i32, PhantomData<T>);

impl<T> From<i32> for Id<T> {
    fn from(value: i32) -> Self {
        Self(value, Default::default())
    }
}

impl<T> From<Id<T>> for i32 {
    fn from(val: Id<T>) -> Self {
        val.0
    }
}
