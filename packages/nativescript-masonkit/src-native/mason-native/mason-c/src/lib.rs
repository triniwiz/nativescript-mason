use std::ffi::{c_float, c_longlong, c_void};

use mason_core::Mason;

pub mod node;
pub mod style;
pub mod util;

#[no_mangle]
pub extern "C" fn mason_init() -> *mut Mason {
    Mason::default().into_raw()
}

#[no_mangle]
pub extern "C" fn mason_init_with_capacity(capacity: usize) -> *mut Mason {
    Mason::with_capacity(capacity).into_raw()
}

#[no_mangle]
pub extern "C" fn mason_destroy(mason: *mut Mason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(mason);
    }
}

#[no_mangle]
pub extern "C" fn mason_clear(mason: *mut Mason) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason);
        mason.clear();
        Box::leak(mason);
    }
}
