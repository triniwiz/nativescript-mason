pub mod ffi;
pub mod node;
pub mod style;
pub mod util;

pub struct CMason(mason_core::Mason);

#[derive(Clone, PartialEq, Debug, Default)]
pub struct CMasonStyle(mason_core::Style);

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct CMasonNode(mason_core::Node);

impl From<mason_core::Node> for CMasonNode {
    fn from(value: mason_core::Node) -> Self {
        Self(value)
    }
}

impl From<&mason_core::Node> for CMasonNode {
    fn from(value: &mason_core::Node) -> Self {
        Self(*value)
    }
}

impl From<&mut mason_core::Node> for CMasonNode {
    fn from(value: &mut mason_core::Node) -> Self {
        Self(*value)
    }
}

impl Default for CMason {
    fn default() -> Self {
        Self(mason_core::Mason::default())
    }
}

impl CMason {
    pub fn into_raw(self) -> *mut Self {
        Box::into_raw(Box::new(self))
    }

    pub fn with_capacity(capacity: usize) -> Self {
        Self(mason_core::Mason::with_capacity(capacity))
    }

    pub fn clear(&mut self) {
        self.0.clear()
    }
}

#[no_mangle]
pub extern "C" fn mason_init() -> *mut CMason {
    CMason::default().into_raw()
}

#[no_mangle]
pub extern "C" fn mason_init_with_capacity(capacity: usize) -> *mut CMason {
    CMason::with_capacity(capacity).into_raw()
}

#[no_mangle]
pub extern "C" fn mason_destroy(mason: *mut CMason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(mason);
    }
}

#[no_mangle]
pub extern "C" fn mason_clear(mason: *mut CMason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        mason.clear();
    }
}
