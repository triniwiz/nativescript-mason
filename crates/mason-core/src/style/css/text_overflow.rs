use parking_lot::Mutex;
use slotmap::{DefaultKey, Key, KeyData, SlotMap};
use std::sync::{Arc, LazyLock};

static TOKENS: LazyLock<Mutex<SlotMap<DefaultKey, Entry>>> =
    LazyLock::new(|| Mutex::new(SlotMap::new()));

struct Entry {
    value: Arc<str>,
    detached: bool,
}

/// The style arena owns this registration. Readers can lease its text without
/// taking the layout lock, and a generational handle makes stale reads safe.
#[derive(Debug)]
pub(crate) struct Token(DefaultKey);

impl Token {
    pub(crate) fn new(value: Arc<str>) -> Self {
        Self(TOKENS.lock().insert(Entry { value, detached: false }))
    }

    pub(crate) fn key(&self) -> u64 {
        self.0.data().as_ffi()
    }
}

impl Drop for Token {
    fn drop(&mut self) {
        TOKENS.lock().remove(self.0);
    }
}

pub fn lookup(key: u64) -> Option<Arc<str>> {
    if key == 0 {
        return None;
    }
    TOKENS.lock().get(KeyData::from_ffi(key).into()).map(|entry| Arc::clone(&entry.value))
}

/// Text-only platform nodes don't have a layout slot. Their wrapper owns the
/// registration and releases it when the node is cleared or collected.
pub fn new_detached(value: Arc<str>) -> u64 {
    TOKENS.lock().insert(Entry { value, detached: true }).data().as_ffi()
}

pub fn release_detached(key: u64) {
    let key = KeyData::from_ffi(key).into();
    let mut tokens = TOKENS.lock();
    if tokens.get(key).is_some_and(|entry| entry.detached) {
        tokens.remove(key);
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct TextOverflow {
    pub(crate) kind: u8,
    pub(crate) token: Option<Arc<str>>,
}

impl TextOverflow {
    pub fn new(kind: u8, token: Option<Arc<str>>) -> Option<Self> {
        let token = match kind {
            0 | 1 => None,
            2 | 3 => Some(token?),
            _ => return None,
        };
        Some(Self { kind, token })
    }
}
