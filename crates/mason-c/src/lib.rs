use mason_core::{Mason, NodeRef};
use std::ffi::{c_int, c_void};

pub mod ffi;
pub mod node;
pub mod style;
pub mod util;

#[derive(Debug)]
pub struct CMason(Mason);

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

#[no_mangle]
pub extern "C" fn mason_print_tree(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &*mason;
        let node = &*node;
        mason.0.print_tree(node.0.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_set_device_scale(mason: *mut CMason, scale: f32) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let mason = &mut *mason;
        mason.0.set_device_scale(scale);
    }
}

#[cfg(target_vendor = "apple")]
#[no_mangle]
pub extern "C" fn mason_get_buffer(mason: *mut CMason, handle: c_int) -> *mut c_void {
    if mason.is_null() {
        return 0 as _;
    }

    match handle.try_into() {
        Ok(handle) => unsafe {
            let mason = &mut *(mason as *mut Mason);
            mason.buffer_from_ptr(handle).unwrap_or(0 as _)
        },
        Err(_) => 0 as _,
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct CMasonNode(NodeRef);
