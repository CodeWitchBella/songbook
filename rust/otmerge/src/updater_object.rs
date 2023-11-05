use std::collections::HashMap;

#[derive(Debug, PartialEq, Clone)]
#[repr(u8)]
pub enum Value {
    // We don't support nulls here. Unset the field instead.
    Invalid = 0,
    Bool(bool),
    Integer(i32),
    Float(f32),
    String(String),
    Reference(i32),
    OTString(String),
}

impl From<&str> for Value {
    fn from(value: &str) -> Self {
        Self::String(value.to_owned())
    }
}

#[derive(Debug, PartialEq, Clone, Default)]
pub struct Object {
    pub(crate) data: HashMap<String, Value>,
}
