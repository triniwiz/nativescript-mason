use mason_core::{Mason, Node, Style};

pub mod ffi;
pub mod node;
pub mod style;
pub mod util;

#[derive(Debug)]
pub struct CMason(mason_core::Mason);

impl CMason {
    pub fn with<F>(&self, func: F)
    where
        F: FnOnce(&Mason),
    {
        func(&self.0);
    }

    pub fn with_mut<F>(&mut self, func: F)
    where
        F: FnOnce(&mut Mason),
    {
        func(&mut self.0);
    }
}

#[no_mangle]
pub extern "C" fn mason_init() -> *mut CMason {
    Box::into_raw(Box::new(CMason(Mason::new())))
}

#[no_mangle]
pub extern "C" fn mason_clear(mason: *mut CMason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        (&mut *mason).0.clear();
    }
}

#[no_mangle]
pub extern "C" fn mason_release(mason: *mut CMason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(mason);
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CMasonNode(Node);