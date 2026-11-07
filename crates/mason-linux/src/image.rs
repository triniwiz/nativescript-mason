//! Image elements and the texture cache; remote URLs are fetched by JS.

use crate::element::Element;
use crate::engine::{self, mason};
use crate::paint::{fit_rect, BoxGeometry};
use gtk::glib::translate::*;
use gtk::prelude::*;
use gtk::{gdk, glib, graphene};
use mason_core::style::StyleKeys;
use std::cell::{Cell, RefCell};
use std::collections::HashMap;
use std::ffi::{c_char, CString};

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

fn load_now(src: &str) -> Option<Result<gdk::Texture, ()>> {
    if src.starts_with("data:") {
        return Some(
            decode_data_uri(src)
                .and_then(|b| gdk::Texture::from_bytes(&b).ok())
                .ok_or(()),
        );
    }
    if src.starts_with("http://") || src.starts_with("https://") {
        return None;
    }
    let path = src.strip_prefix("file://").unwrap_or(src);
    Some(gdk::Texture::from_filename(path).map_err(|_| ()))
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
        gdk::Texture::from_bytes(&glib::Bytes::from(bytes)).ok()
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
