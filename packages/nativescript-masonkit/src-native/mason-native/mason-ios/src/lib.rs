use std::ffi::c_void;

use mason_core::Mason;

pub mod node;
pub mod style;
pub mod util;

#[no_mangle]
pub extern "C" fn mason_init() -> *mut c_void {
    Mason::new().into_raw() as *mut c_void
}

#[no_mangle]
pub extern "C" fn mason_init_with_capacity(capacity: usize) -> *mut c_void {
    Mason::with_capacity(capacity).into_raw() as *mut c_void
}

#[no_mangle]
pub extern "C" fn mason_destroy(mason: *mut c_void) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(mason as *mut Mason);
    }
}

#[no_mangle]
pub extern "C" fn mason_clear(mason: *mut c_void) {
    if mason.is_null() {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        mason.clear();
        Box::leak(mason);
    }
}

