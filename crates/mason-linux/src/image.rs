//! Image elements and the texture cache; remote URLs are fetched by JS.

use crate::element::Element;
use crate::engine::{self, mason};
use crate::paint::{fit_rect, BoxGeometry};
use gtk::glib::translate::*;
use gtk::prelude::*;
use gtk::{gdk, gdk_pixbuf, glib, graphene};
use mason_core::style::StyleKeys;
use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::ffi::{c_char, CString};
use std::rc::Rc;

#[derive(Default)]
pub struct ImageState {
    pub src: String,
}

enum Entry {
    Ready(gdk::Texture),
    Loading(Vec<glib::WeakRef<gtk::Widget>>),
    Failed,
}

pub type UrlLoader = extern "C" fn(*const c_char);

thread_local! {
    static CACHE: RefCell<HashMap<String, Entry>> = RefCell::new(HashMap::new());
    static LOADER: Cell<Option<UrlLoader>> = const { Cell::new(None) };
}

pub fn set_loader(loader: Option<UrlLoader>) {
    LOADER.with(|l| l.set(loader));
}

fn decode_data_uri(src: &str) -> Option<glib::Bytes> {
    let (meta, data) = src.strip_prefix("data:")?.split_once(',')?;
    if meta.ends_with(";base64") {
        Some(glib::Bytes::from_owned(glib::base64_decode(data)))
    } else {
        let decoded = glib::Uri::unescape_string(data, None::<&str>)
            .map(|s| s.to_string())
            .unwrap_or_else(|| data.to_string());
        Some(glib::Bytes::from_owned(decoded.into_bytes()))
    }
}

/// Images whose declared size is over this many pixels aren't decoded (4 bytes each).
const MAX_PIXELS: i64 = 1 << 26;
/// Encoded image files over this are refused.
const MAX_FILE_BYTES: u64 = 128 << 20;

fn fits(w: i32, h: i32) -> bool {
    w > 0 && h > 0 && w as i64 * h as i64 <= MAX_PIXELS
}

/// The size an encoded image declares, read without decoding its pixels; None when gdk-pixbuf
/// doesn't know the format.
fn declared_size(bytes: &[u8]) -> Option<(i32, i32)> {
    let loader = gdk_pixbuf::PixbufLoader::new();
    let size = Rc::new(Cell::new(None));
    let seen = size.clone();
    loader.connect_size_prepared(move |loader, w, h| {
        seen.set(Some((w, h)));
        // 0x0 stops the loader before it allocates (as gdk_pixbuf_get_file_info does)
        loader.set_size(0, 0);
    });
    for chunk in bytes.chunks(64 << 10) {
        if loader.write(chunk).is_err() || size.get().is_some() {
            break;
        }
    }
    let _ = loader.close();
    size.get()
}

fn decode(bytes: &glib::Bytes) -> Option<gdk::Texture> {
    if declared_size(bytes).is_some_and(|(w, h)| !fits(w, h)) {
        return None;
    }
    gdk::Texture::from_bytes(bytes).ok()
}

/// A local image: an absolute path to a regular file (not one relative to the CWD, nor a device
/// or FIFO that never ends).
fn read_file(path: &str) -> Option<glib::Bytes> {
    let path = std::path::Path::new(path);
    if !path.is_absolute() {
        return None;
    }
    let file = std::fs::File::open(path).ok()?;
    let meta = file.metadata().ok()?;
    if !meta.is_file() || meta.len() > MAX_FILE_BYTES {
        return None;
    }
    let mut bytes = Vec::with_capacity(meta.len() as usize);
    std::io::Read::read_to_end(&mut std::io::Read::take(file, MAX_FILE_BYTES), &mut bytes).ok()?;
    Some(glib::Bytes::from_owned(bytes))
}

fn load_now(src: &str) -> Option<Result<gdk::Texture, ()>> {
    if src.starts_with("data:") {
        return Some(decode_data_uri(src).and_then(|b| decode(&b)).ok_or(()));
    }
    if src.starts_with("http://") || src.starts_with("https://") {
        return None;
    }
    let path = src.strip_prefix("file://").unwrap_or(src);
    Some(read_file(path).and_then(|b| decode(&b)).ok_or(()))
}

/// The texture for `src`, or None while it loads; `waiter` is laid out again when it arrives.
pub fn texture_for(src: &str, waiter: &gtk::Widget) -> Option<gdk::Texture> {
    if src.is_empty() {
        return None;
    }
    let cached = CACHE.with(|c| {
        let mut cache = c.borrow_mut();
        match cache.get_mut(src) {
            Some(Entry::Ready(t)) => Some(Some(t.clone())),
            Some(Entry::Loading(waiters)) => {
                waiters.push(waiter.downgrade());
                Some(None)
            }
            Some(Entry::Failed) => Some(None),
            None => None,
        }
    });
    if let Some(result) = cached {
        return result;
    }
    match load_now(src) {
        Some(Ok(texture)) => {
            CACHE.with(|c| {
                c.borrow_mut()
                    .insert(src.to_string(), Entry::Ready(texture.clone()))
            });
            Some(texture)
        }
        Some(Err(())) => {
            CACHE.with(|c| c.borrow_mut().insert(src.to_string(), Entry::Failed));
            None
        }
        None => {
            CACHE.with(|c| {
                c.borrow_mut()
                    .insert(src.to_string(), Entry::Loading(vec![waiter.downgrade()]))
            });
            match LOADER.with(|l| l.get()) {
                Some(loader) => {
                    let url = CString::new(src).unwrap_or_default();
                    loader(url.as_ptr());
                }
                None => {
                    CACHE.with(|c| c.borrow_mut().insert(src.to_string(), Entry::Failed));
                }
            }
            None
        }
    }
}

/// Bytes JS fetched for `src` (empty when the fetch failed).
pub fn texture_loaded(src: &str, bytes: &[u8]) {
    let texture = if bytes.is_empty() {
        None
    } else {
        decode(&glib::Bytes::from(bytes))
    };
    let waiters = CACHE.with(|c| {
        let mut cache = c.borrow_mut();
        let entry = match &texture {
            Some(t) => Entry::Ready(t.clone()),
            None => Entry::Failed,
        };
        match cache.insert(src.to_string(), entry) {
            Some(Entry::Loading(w)) => w,
            _ => Vec::new(),
        }
    });
    for w in waiters.into_iter().filter_map(|w| w.upgrade()) {
        if let Ok(el) = w.clone().downcast::<Element>() {
            if el.kind() == crate::element::Kind::Image {
                if let Some(node) = el.try_node() {
                    mason().mark_dirty(node.id());
                }
                el.invalidate_layout();
            }
        }
        w.queue_draw();
    }
}

pub fn init(el: &Element) {
    el.image_state_mut().replace(ImageState::default());
    let node = el.node();
    mason().set_measure(node.id(), Some(measure), el.as_ptr() as *mut _);
}

pub fn set_source(el: &Element, src: &str) {
    if let Some(state) = el.image_state_mut().as_mut() {
        if state.src == src {
            return;
        }
        state.src = src.to_string();
    }
    if let Some(node) = el.try_node() {
        mason().mark_dirty(node.id());
    }
    el.invalidate_layout();
    el.queue_draw();
}

pub fn source(el: &Element) -> String {
    el.image_state()
        .as_ref()
        .map(|s| s.src.clone())
        .unwrap_or_default()
}

fn natural(el: &Element) -> Option<(f32, f32)> {
    let src = source(el);
    texture_for(&src, el.upcast_ref()).map(|t| (t.width() as f32, t.height() as f32))
}

extern "C" fn measure(data: *const std::ffi::c_void, kw: f32, kh: f32, _aw: f32, _ah: f32) -> i64 {
    let widget: gtk::Widget = unsafe { from_glib_none(data as *mut gtk::ffi::GtkWidget) };
    let Ok(el) = widget.downcast::<Element>() else {
        return engine::pack(0.0, 0.0);
    };
    let (iw, ih) = natural(&el).unwrap_or((0.0, 0.0));
    let (w, h) = match (kw.is_nan(), kh.is_nan()) {
        (false, false) => (kw, kh),
        (false, true) => (kw, if iw > 0.0 { kw * ih / iw } else { 0.0 }),
        (true, false) => (if ih > 0.0 { kh * iw / ih } else { 0.0 }, kh),
        _ => (iw, ih),
    };
    engine::pack(w, h)
}

pub fn snapshot(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry) {
    let src = source(el);
    let Some(texture) = texture_for(&src, el.upcast_ref()) else {
        return;
    };
    let content = g.content_box();
    let rect = content.bounds().clone();
    let style = el.style();
    let fit = style.u8(StyleKeys::OBJECT_FIT) as i32;
    // object-position: percentages along the free space, px from the start
    let pos = |ty: StyleKeys, val: StyleKeys| -> Option<f32> {
        (style.u8(StyleKeys::OBJECT_POSITION_STATE) != 0).then(|| {
            if style.u8(ty) == 1 {
                style.f32(val) / 100.0
            } else {
                -style.f32(val)
            }
        })
    };
    let dest = fit_rect(
        fit,
        (1, 1),
        texture.width() as f32,
        texture.height() as f32,
        rect,
    );
    let dest = match (
        pos(
            StyleKeys::OBJECT_POSITION_X_TYPE,
            StyleKeys::OBJECT_POSITION_X_VALUE,
        ),
        pos(
            StyleKeys::OBJECT_POSITION_Y_TYPE,
            StyleKeys::OBJECT_POSITION_Y_VALUE,
        ),
    ) {
        (Some(px), Some(py)) => {
            let place = |f: f32, free: f32, start: f32| {
                if f >= 0.0 {
                    start + free * f
                } else {
                    start - f
                }
            };
            graphene::Rect::new(
                place(px, rect.width() - dest.width(), rect.x()),
                place(py, rect.height() - dest.height(), rect.y()),
                dest.width(),
                dest.height(),
            )
        }
        _ => dest,
    };
    s.push_rounded_clip(&content);
    s.append_texture(&texture, &dest);
    s.pop();
}

#[cfg(test)]
mod tests {
    use super::*;

    const PNG_1X1: &[u8] = &[
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6,
        0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 240,
        31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];
    // IHDR says 9000x9000 (324 MB decoded)
    const PNG_HUGE: &[u8] = &[
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 35, 40, 0, 0, 35, 40,
        8, 6, 0, 0, 0, 109, 213, 114, 186, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 64, 5, 0,
        0, 16, 0, 1, 57, 189, 143, 101, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ];

    #[test]
    fn declared_sizes() {
        assert_eq!(declared_size(PNG_1X1), Some((1, 1)));
        assert_eq!(declared_size(PNG_HUGE), Some((9000, 9000)));
        assert_eq!(declared_size(b"not an image"), None);
        assert!(decode(&glib::Bytes::from_static(PNG_1X1)).is_some());
        assert!(decode(&glib::Bytes::from_static(PNG_HUGE)).is_none());
    }

    #[test]
    fn local_files() {
        assert!(read_file("relative.png").is_none(), "relative to the CWD");
        assert!(read_file("/dev/zero").is_none());
        assert!(read_file("/").is_none());
        let path = std::env::temp_dir().join(format!("mason-img-{}.png", std::process::id()));
        std::fs::write(&path, PNG_1X1).unwrap();
        assert!(load_now(&format!("file://{}", path.display()))
            .unwrap()
            .is_ok());
        let _ = std::fs::remove_file(&path);
        let svg = b"<svg xmlns='http://www.w3.org/2000/svg' width='20000' height='20000'/>";
        eprintln!("svg declared size: {:?}", declared_size(svg));
    }
}
