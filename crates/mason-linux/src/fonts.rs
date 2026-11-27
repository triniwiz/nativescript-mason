//! Fonts through @nativescript/font-manager (libfontmanager.so): CSS families resolve to what Pango
//! loads, and text lays out again when faces load.

use std::ffi::{c_char, c_void, CStr, CString};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Once;

type ChangedFn = extern "C" fn(reason: i32, face: *mut c_void, user_data: *mut c_void);

#[link(name = "fontmanager")]
extern "C" {
    fn fm_resolve_family(families: *const c_char, weight: i32, italic: bool) -> *const c_char;
    fn fm_face_set_add_changed_listener(callback: ChangedFn, user_data: *mut c_void) -> i32;
}

/// The family Pango should load for a CSS font-family list.
pub fn resolve(families: &str, weight: i32, italic: bool) -> String {
    let Ok(list) = CString::new(families) else {
        return "sans-serif".into();
    };
    // interned by font-manager, never freed
    let family = unsafe { fm_resolve_family(list.as_ptr(), weight, italic) };
    if family.is_null() {
        return "sans-serif".into();
    }
    unsafe { CStr::from_ptr(family) }
        .to_string_lossy()
        .into_owned()
}

static PENDING: AtomicBool = AtomicBool::new(false);

/// Any thread; one relayout per main loop turn however many faces load.
extern "C" fn changed(_reason: i32, _face: *mut c_void, _user_data: *mut c_void) {
    if !PENDING.swap(true, Ordering::AcqRel) {
        gtk::glib::MainContext::default().invoke(|| {
            PENDING.store(false, Ordering::Release);
            crate::ffi::relayout_text();
        });
    }
}

pub fn watch() {
    static ONCE: Once = Once::new();
    ONCE.call_once(|| unsafe {
        fm_face_set_add_changed_listener(changed, std::ptr::null_mut());
    });
}
