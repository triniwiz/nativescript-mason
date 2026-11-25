//! Line-break opportunities from the platform's ICU4C (the NDK's `libicu.so`, API 31 and later),
//! the rules and data StaticLayout breaks lines with.

use std::cell::RefCell;
use std::ffi::{c_char, c_void, CStr, CString};
use std::sync::OnceLock;

extern "C" {
    fn dlopen(filename: *const c_char, flag: i32) -> *mut c_void;
    fn dlsym(handle: *mut c_void, symbol: *const c_char) -> *mut c_void;
}

const RTLD_NOW: i32 = 2;
const UBRK_LINE: i32 = 2;
const UBRK_DONE: i32 = -1;

struct Icu {
    open: unsafe extern "C" fn(i32, *const c_char, *const u16, i32, *mut i32) -> *mut c_void,
    close: unsafe extern "C" fn(*mut c_void),
    set_text: unsafe extern "C" fn(*mut c_void, *const u16, i32, *mut i32),
    next: unsafe extern "C" fn(*mut c_void) -> i32,
}

fn icu() -> Option<&'static Icu> {
    static ICU: OnceLock<Option<Icu>> = OnceLock::new();
    ICU.get_or_init(|| unsafe {
        let lib = dlopen(c"libicu.so".as_ptr(), RTLD_NOW);
        if lib.is_null() {
            return None;
        }
        let sym = |name: &CStr| {
            let f = dlsym(lib, name.as_ptr());
            (!f.is_null()).then_some(f)
        };
        Some(Icu {
            open: std::mem::transmute(sym(c"ubrk_open")?),
            close: std::mem::transmute(sym(c"ubrk_close")?),
            set_text: std::mem::transmute(sym(c"ubrk_setText")?),
            next: std::mem::transmute(sym(c"ubrk_next")?),
        })
    })
    .as_ref()
}

thread_local! {
    static LINE_ITERATOR: RefCell<Option<(CString, *mut c_void)>> = const { RefCell::new(None) };
}

/// UTF-16 offsets, under the rules of `locale` (an ICU locale ID). `None` without ICU4C.
pub(crate) fn line_breaks(text: &[u16], locale: &CStr) -> Option<Vec<u32>> {
    let icu = icu()?;
    LINE_ITERATOR.with(|cell| unsafe {
        let mut cached = cell.borrow_mut();
        if cached
            .as_ref()
            .map_or(true, |(open, _)| open.as_c_str() != locale)
        {
            if let Some((_, it)) = cached.take() {
                (icu.close)(it);
            }
            let mut status = 0i32;
            let it = (icu.open)(UBRK_LINE, locale.as_ptr(), std::ptr::null(), 0, &mut status);
            if status > 0 || it.is_null() {
                return None;
            }
            *cached = Some((locale.to_owned(), it));
        }
        let it = cached.as_ref()?.1;
        let mut status = 0i32;
        (icu.set_text)(it, text.as_ptr(), text.len() as i32, &mut status);
        if status > 0 {
            return None;
        }
        let mut breaks = Vec::with_capacity(text.len() / 4 + 1);
        loop {
            let end = (icu.next)(it);
            if end == UBRK_DONE {
                break;
            }
            breaks.push(end as u32);
        }
        // The cached iterator outlives this call, so it must not keep pointing at `text`.
        (icu.set_text)(it, NO_TEXT.as_ptr(), 0, &mut status);
        Some(breaks)
    })
}

static NO_TEXT: [u16; 1] = [0];
