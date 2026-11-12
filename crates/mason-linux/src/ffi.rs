//! The C ABI the JS facade (native.linux.ts) calls through generated metadata.

use crate::css;
use crate::element::{dirty_mask, foreign_leaf, Element, Kind};
use crate::engine::{self, mason};
use crate::events;
use crate::textnode::TextNode;
use gtk::glib::translate::*;
use gtk::prelude::*;
use gtk::{ffi as gffi, glib};
use mason_c::{CMason, CMasonNode};
use mason_core::style::StyleKeys;
use std::cell::RefCell;
use std::ffi::{c_char, CStr, CString};

type W = *mut gffi::GtkWidget;

thread_local! {
    static RETURNED: RefCell<CString> = RefCell::new(CString::default());
}

unsafe fn string(p: *const c_char) -> String {
    if p.is_null() {
        String::new()
    } else {
        CStr::from_ptr(p).to_string_lossy().into_owned()
    }
}

/// Valid until the next string returned from here.
fn ret(value: String) -> *const c_char {
    RETURNED.with(|r| {
        *r.borrow_mut() = CString::new(value.replace('\0', "")).unwrap_or_default();
        r.borrow().as_ptr()
    })
}

unsafe fn widget(p: W) -> Option<gtk::Widget> {
    (!p.is_null()).then(|| from_glib_none(p))
}

unsafe fn element(p: W) -> Option<Element> {
    Element::from_ptr(p)
}

fn node_ptr(node: mason_core::NodeRef) -> CMasonNode {
    CMasonNode::from_ref(node)
}

fn mason_ptr() -> *mut CMason {
    mason() as *mut mason_core::Mason as *mut CMason
}

/// Adopts GTK once the app (core) has initialized it.
#[no_mangle]
pub extern "C" fn mason_gtk_init() -> bool {
    if !gtk::is_initialized() && unsafe { gffi::gtk_is_initialized() } != 0 {
        unsafe { gtk::set_initialized() };
    }
    let ready = gtk::is_initialized();
    if ready {
        crate::fonts::watch();
    }
    ready
}

#[no_mangle]
pub extern "C" fn mason_gtk_scratch() -> *mut f32 {
    crate::element::scratch_ptr()
}

#[no_mangle]
pub extern "C" fn mason_gtk_style_size() -> i32 {
    mason_core::style::arena::STYLE_BUFFER_SIZE as i32
}

#[no_mangle]
pub extern "C" fn mason_gtk_get_preflight() -> bool {
    mason_c::mason_get_preflight()
}

#[no_mangle]
pub extern "C" fn mason_gtk_set_preflight(enabled: bool) {
    mason_c::mason_set_preflight(mason_ptr(), enabled);
}

#[no_mangle]
pub extern "C" fn mason_gtk_set_foreign_measure(cb: Option<crate::element::ForeignMeasure>) {
    crate::element::set_foreign_measure(cb);
}

#[no_mangle]
pub extern "C" fn mason_gtk_set_foreign_layout(cb: Option<crate::element::ForeignLayout>) {
    crate::element::set_foreign_layout(cb);
}

#[no_mangle]
pub extern "C" fn mason_gtk_set_event_dispatcher(cb: Option<events::Dispatcher>) {
    events::set_dispatcher(cb);
}

#[no_mangle]
pub extern "C" fn mason_gtk_set_url_loader(cb: Option<crate::image::UrlLoader>) {
    crate::image::set_loader(cb);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_texture_loaded(url: *const c_char, data: *const u8, len: usize) {
    let bytes = if data.is_null() {
        &[][..]
    } else {
        std::slice::from_raw_parts(data, len)
    };
    crate::image::texture_loaded(&string(url), bytes);
}

#[no_mangle]
pub extern "C" fn mason_gtk_element_new(kind: i32) -> W {
    mason_gtk_init();
    let el = Element::new(Kind::from_i32(kind));
    el.upcast::<gtk::Widget>().into_glib_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_element_kind(el: W) -> i32 {
    element(el).map_or(-1, |e| e.kind() as i32)
}

/// A vertical GtkScrolledWindow around a Mason element.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_scroll_new(content: W) -> W {
    mason_gtk_init();
    let Some(content) = widget(content) else {
        return std::ptr::null_mut();
    };
    let scrolled = gtk::ScrolledWindow::new();
    scrolled.set_policy(gtk::PolicyType::Never, gtk::PolicyType::Automatic);
    scrolled.set_propagate_natural_height(false);
    scrolled.set_child(Some(&content));
    // Mason reports sizes as natural ones (minimum 0), so the viewport must scroll by those.
    // Horizontally it doesn't scroll: a natural width (max-content) wider than the window
    // would be allocated anyway and clipped, instead of the content fitting the window.
    if let Some(viewport) = scrolled
        .child()
        .and_then(|c| c.downcast::<gtk::Viewport>().ok())
    {
        viewport.set_vscroll_policy(gtk::ScrollablePolicy::Natural);
        viewport.set_hscroll_policy(gtk::ScrollablePolicy::Minimum);
    }
    scrolled.upcast::<gtk::Widget>().into_glib_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_style_values(el: W) -> *mut u8 {
    let Some(el) = element(el) else {
        return std::ptr::null_mut();
    };
    engine::style_mut(&el.node()).as_mut_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_foreign_style_values(w: W) -> *mut u8 {
    let Some(w) = widget(w) else {
        return std::ptr::null_mut();
    };
    engine::style_mut(&foreign_leaf(&w)).as_mut_ptr()
}

/// The shared default style bytes (read-only use).
#[no_mangle]
pub extern "C" fn mason_gtk_default_style() -> *mut u8 {
    mason_c::mason_default_style_ptr(mason_ptr())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_sync_style(el: W, d0: i32, d1: i32, d2: i32, d3: i32) {
    if let Some(el) = element(el) {
        el.style_synced(dirty_mask(d0, d1, d2, d3));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_sync_foreign_style(w: W, d0: i32, d1: i32, d2: i32, d3: i32) {
    let Some(w) = widget(w) else { return };
    if dirty_mask(d0, d1, d2, d3) & crate::element::LAYOUT_KEYS == 0 {
        return;
    }
    let leaf = foreign_leaf(&w);
    mason().mark_dirty(leaf.id());
    if let Some(parent) = Element::mason_parent(&w) {
        parent.invalidate_layout();
    }
}

/// Inserts `child` at `index` among the element's children (-1 appends).
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_reparent_child(parent: W, child: W, index: i32) {
    let (Some(parent), Some(child)) = (element(parent), widget(child)) else {
        return;
    };
    parent.insert_child(&child, index);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_remove_child(parent: W, child: W) {
    let (Some(parent), Some(child)) = (element(parent), widget(child)) else {
        return;
    };
    if parent.kind().is_text() {
        crate::text::remove_inline_box(&parent, &child);
    } else {
        parent.remove_child(&child);
    }
}

/// Percentage width / height of a non-Mason child, as a 0-1 fraction (NaN clears).
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_set_percent_size(w: W, horizontal: bool, fraction: f32) {
    let Some(w) = widget(w) else { return };
    let leaf = foreign_leaf(&w);
    let style = engine::style_mut(&leaf);
    let (ty, val) = if horizontal {
        (StyleKeys::WIDTH_TYPE, StyleKeys::WIDTH_VALUE)
    } else {
        (StyleKeys::HEIGHT_TYPE, StyleKeys::HEIGHT_VALUE)
    };
    if fraction.is_nan() {
        style[ty as usize] = 0;
    } else {
        style[ty as usize] = 2;
        style[val as usize..val as usize + 4].copy_from_slice(&fraction.to_le_bytes());
    }
    mason().mark_dirty(leaf.id());
    if let Some(parent) = Element::mason_parent(&w) {
        parent.invalidate_layout();
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_invalidate(el: W) {
    if let Some(el) = element(el) {
        el.invalidate_layout();
    }
}

/// Measures for NativeScript specs; the size goes to scratch[0..2].
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_measure(el: W, width_spec: i32, height_spec: i32) {
    let Some(el) = element(el) else { return };
    let (w, h) = el.measure_specs(width_spec, height_spec);
    crate::element::SCRATCH.with(|s| {
        let mut s = s.borrow_mut();
        s[0] = w;
        s[1] = h;
    });
}

/// The element's border box from its last layout into scratch[0..4] (x, y, w, h).
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_layout(el: W) {
    let Some(el) = element(el) else { return };
    let l = engine::layout(el.node().id());
    crate::element::SCRATCH.with(|s| {
        let mut s = s.borrow_mut();
        s[0] = l.location.x;
        s[1] = l.location.y;
        s[2] = l.size.width;
        s[3] = l.size.height;
    });
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_print_tree(el: W) {
    if let Some(el) = element(el) {
        mason().print_tree(el.node().id());
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_add_event_listener(el: W, kind: *const c_char) -> i32 {
    element(el).map_or(0, |e| events::add_listener(&e, &string(kind)))
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_remove_event_listener(
    el: W,
    kind: *const c_char,
    id: i32,
) -> bool {
    element(el).is_some_and(|e| events::remove_listener(&e, &string(kind), id))
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_element_from_point(el: W, x: f32, y: f32) -> W {
    let Some(el) = element(el) else {
        return std::ptr::null_mut();
    };
    let Some(picked) = el.pick(x as f64, y as f64, gtk::PickFlags::DEFAULT) else {
        return std::ptr::null_mut();
    };
    let mut cur = Some(picked);
    while let Some(w) = cur {
        if w.is::<Element>() {
            return w.as_ptr();
        }
        cur = w.parent();
    }
    std::ptr::null_mut()
}

/// Event fields: 0 type, 1 data, 2 inputType, 3 key, 4 files ("\n"-joined).
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_event_string(
    ev: *mut glib::gobject_ffi::GObject,
    which: i32,
) -> *const c_char {
    let ev: glib::Object = from_glib_none(ev);
    let Ok(ev) = ev.downcast::<events::Event>() else {
        return ret(String::new());
    };
    let init = ev.init();
    ret(match which {
        0 => init.kind.clone(),
        1 => init.data.clone(),
        2 => init.input_type.clone(),
        3 => init.key.clone(),
        _ => init.files.join("\n"),
    })
}

/// Event numbers: 0 bubbles, 1 cancelable, 2 time, 3 defaultPrevented, 4 propagationStopped,
/// 5 immediatePropagationStopped, 6 repeat, 7 ctrl, 8 shift, 9 alt, 10 meta, 11 x, 12 y, 13 button.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_event_number(
    ev: *mut glib::gobject_ffi::GObject,
    which: i32,
) -> f64 {
    let ev: glib::Object = from_glib_none(ev);
    let Ok(ev) = ev.downcast::<events::Event>() else {
        return 0.0;
    };
    let b = |v: bool| if v { 1.0 } else { 0.0 };
    let init = ev.init();
    match which {
        0 => b(init.bubbles),
        1 => b(init.cancelable),
        2 => ev.time(),
        3 => b(ev.default_prevented()),
        4 => b(ev.propagation_stopped()),
        5 => b(ev.immediate_stopped()),
        6 => b(init.repeat),
        7 => b(init.ctrl),
        8 => b(init.shift),
        9 => b(init.alt),
        10 => b(init.meta),
        11 => init.x,
        12 => init.y,
        13 => init.button as f64,
        _ => 0.0,
    }
}

/// 0 target, 1 currentTarget.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_event_target(
    ev: *mut glib::gobject_ffi::GObject,
    which: i32,
) -> W {
    let ev: glib::Object = from_glib_none(ev);
    let Ok(ev) = ev.downcast::<events::Event>() else {
        return std::ptr::null_mut();
    };
    let target = if which == 0 {
        ev.target()
    } else {
        ev.current_target()
    };
    target.map_or(std::ptr::null_mut(), |t| {
        t.upcast_ref::<gtk::Widget>().as_ptr()
    })
}

/// 0 preventDefault, 1 stopPropagation, 2 stopImmediatePropagation.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_event_call(ev: *mut glib::gobject_ffi::GObject, which: i32) {
    let ev: glib::Object = from_glib_none(ev);
    let Ok(ev) = ev.downcast::<events::Event>() else {
        return;
    };
    match which {
        0 => ev.prevent_default(),
        1 => ev.stop_propagation(),
        _ => ev.stop_immediate(),
    }
}

fn scroller_of(el: &Element) -> Option<gtk::ScrolledWindow> {
    let mut cur = el.parent();
    for _ in 0..2 {
        let w = cur?;
        if let Ok(s) = w.clone().downcast::<gtk::ScrolledWindow>() {
            return Some(s);
        }
        cur = w.parent();
    }
    None
}

/// 0 scrollLeft, 1 scrollTop, 2 scrollWidth, 3 scrollHeight, 4 clientWidth, 5 clientHeight.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_scroll_metric(el: W, which: i32) -> f64 {
    let Some(el) = element(el) else { return 0.0 };
    if crate::scroll::active(&el) {
        let (x, y) = crate::scroll::offset(&el);
        let (cw, ch) = crate::scroll::client_size(&el);
        let (mx, my) = crate::scroll::max_offset(&el);
        return match which {
            0 => x as f64,
            1 => y as f64,
            2 => cw + mx,
            3 => ch + my,
            4 => cw,
            _ => ch,
        };
    }
    let scroller = scroller_of(&el);
    let (h, v) = scroller.as_ref().map_or((None, None), |s| {
        (Some(s.hadjustment()), Some(s.vadjustment()))
    });
    let (ew, eh) = el.scroll_extent();
    let (bw, bh) = el.layout_size();
    match which {
        0 => h.map_or(0.0, |a| a.value()),
        1 => v.map_or(0.0, |a| a.value()),
        2 => ew as f64,
        3 => eh as f64,
        4 => h.map_or(bw as f64, |a| a.page_size()),
        _ => v.map_or(bh as f64, |a| a.page_size()),
    }
}

/// NaN keeps an axis.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_scroll_to(el: W, left: f64, top: f64, _smooth: bool) {
    let Some(el) = element(el) else { return };
    if crate::scroll::active(&el) {
        crate::scroll::scroll_to(&el, left, top);
        return;
    }
    let Some(s) = scroller_of(&el) else { return };
    if !left.is_nan() {
        s.hadjustment().set_value(left);
    }
    if !top.is_nan() {
        s.vadjustment().set_value(top);
    }
}

/// block / inline: 0 start, 1 center, 2 end, 3 nearest.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_scroll_into_view(el: W, block: i32, inline: i32, _smooth: bool) {
    let Some(el) = element(el) else { return };
    // block / inline: 0 start, 1 center, 2 end, 3 nearest
    let target = |value: f64, page: f64, start: f64, size: f64, mode: i32| match mode {
        1 => start - (page - size) / 2.0,
        2 => start + size - page,
        3 if start >= value && start + size <= value + page => value,
        3 if start < value => start,
        3 => start + size - page,
        _ => start,
    };
    let mut cur = el.parent();
    while let Some(w) = cur {
        if let Some(scroller) = w
            .downcast_ref::<Element>()
            .filter(|e| crate::scroll::active(e))
        {
            if let Some(b) = el.compute_bounds(scroller) {
                let (ox, oy) = crate::scroll::offset(scroller);
                let (cw, ch) = crate::scroll::client_size(scroller);
                let [bt, _, _, bl] = crate::paint::BoxGeometry::of(scroller).border;
                // bounds are in the scroller's (scrolled) coordinates
                let y = target(
                    oy as f64,
                    ch,
                    b.y() as f64 - bt as f64 + oy as f64,
                    b.height() as f64,
                    block,
                );
                let x = target(
                    ox as f64,
                    cw,
                    b.x() as f64 - bl as f64 + ox as f64,
                    b.width() as f64,
                    inline,
                );
                crate::scroll::scroll_to(scroller, x, y);
            }
        } else if let Ok(s) = w.clone().downcast::<gtk::ScrolledWindow>() {
            if let Some(child) = s.child() {
                if let Some(b) = el.compute_bounds(&child) {
                    let (v, h) = (s.vadjustment(), s.hadjustment());
                    v.set_value(target(
                        v.value(),
                        v.page_size(),
                        b.y() as f64,
                        b.height() as f64,
                        block,
                    ));
                    h.set_value(target(
                        h.value(),
                        h.page_size(),
                        b.x() as f64,
                        b.width() as f64,
                        inline,
                    ));
                }
            }
        }
        cur = w.parent();
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_set_role(el: W, role: i32) {
    if let Some(el) = element(el) {
        el.set_role(role);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_role(el: W) -> i32 {
    element(el).map_or(0, |e| e.role())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_set_open(el: W, open: bool) {
    if let Some(el) = element(el) {
        el.set_open(open);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_open(el: W) -> bool {
    element(el).is_some_and(|e| e.open())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_details(el: W) -> W {
    element(el)
        .and_then(|e| crate::details::details_of(&e))
        .map_or(std::ptr::null_mut(), |d| {
            d.upcast_ref::<gtk::Widget>().as_ptr()
        })
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_list_set_ordered(el: W, ordered: bool) {
    if let Some(el) = element(el) {
        el.set_list_ordered(ordered);
        el.queue_draw();
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_list_ordered(el: W) -> bool {
    element(el).is_some_and(|e| e.list_ordered())
}

#[no_mangle]
#[allow(clippy::too_many_arguments)]
pub unsafe extern "C" fn mason_gtk_update_grid(
    el: W,
    auto_rows: *const c_char,
    auto_columns: *const c_char,
    column: *const c_char,
    column_start: *const c_char,
    column_end: *const c_char,
    row: *const c_char,
    row_start: *const c_char,
    row_end: *const c_char,
    template_rows: *const c_char,
    template_columns: *const c_char,
    area: *const c_char,
    template_areas: *const c_char,
) {
    let Some(el) = element(el) else { return };
    let mut node = node_ptr(el.node());
    mason_c::style::mason_style_update_non_buffer_data(
        mason_ptr(),
        &mut node,
        auto_rows,
        auto_columns,
        column,
        column_start,
        column_end,
        row,
        row_start,
        row_end,
        template_rows,
        template_columns,
        area,
        template_areas,
    );
    el.invalidate_layout();
}

/// 0 area, 1 templateAreas, 2 autoRows, 3 autoColumns, 4 column, 5 columnStart, 6 columnEnd,
/// 7 row, 8 rowStart, 9 rowEnd, 10 templateRows, 11 templateColumns.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_grid_css(el: W, which: i32) -> *const c_char {
    use mason_c::style::*;
    let Some(el) = element(el) else {
        return ret(String::new());
    };
    let mut node = node_ptr(el.node());
    let m = mason_ptr();
    let n: *mut CMasonNode = &mut node;
    let raw = match which {
        0 => mason_style_get_grid_area_css(m, n),
        1 => mason_style_get_grid_template_areas_css(m, n),
        2 => mason_style_get_grid_auto_rows_css(m, n),
        3 => mason_style_get_grid_auto_columns_css(m, n),
        4 => mason_style_get_grid_column_css(m, n),
        5 => mason_style_get_grid_column_start_css(m, n),
        6 => mason_style_get_grid_column_end_css(m, n),
        7 => mason_style_get_grid_row_css(m, n),
        8 => mason_style_get_grid_row_start_css(m, n),
        9 => mason_style_get_grid_row_end_css(m, n),
        10 => mason_style_get_grid_template_rows_css(m, n),
        _ => mason_style_get_grid_template_columns_css(m, n),
    };
    if raw.is_null() {
        return ret(String::new());
    }
    let value = CString::from_raw(raw).to_string_lossy().into_owned();
    ret(value)
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_content(el: W, value: *const c_char) {
    if let Some(el) = element(el) {
        crate::text::set_content(&el, &string(value));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_content(el: W) -> *const c_char {
    ret(element(el)
        .map(|e| crate::text::content(&e))
        .unwrap_or_default())
}

/// Text, Input and TextArea font families.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_set_font_family(el: W, family: *const c_char) {
    let Some(el) = element(el) else { return };
    let family = string(family);
    if el.kind().is_text() {
        if let Some(s) = el.text_state_mut().as_mut() {
            s.font_family = family;
        }
        crate::text::request_rebuild(&el);
    } else if el.input_state().is_some() {
        crate::input::set_font_family(&el, &family);
    }
}

unsafe fn text_node(p: *mut glib::gobject_ffi::GObject) -> Option<TextNode> {
    if p.is_null() {
        return None;
    }
    let o: glib::Object = from_glib_none(p);
    o.downcast::<TextNode>().ok()
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_run(
    el: W,
    run: *mut glib::gobject_ffi::GObject,
    index: i32,
) {
    if let (Some(el), Some(run)) = (element(el), text_node(run)) {
        crate::text::set_run(&el, &run, index);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_remove_run(el: W, run: *mut glib::gobject_ffi::GObject) {
    if let (Some(el), Some(run)) = (element(el), text_node(run)) {
        crate::text::remove_run(&el, &run);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_clear_runs(el: W) {
    if let Some(el) = element(el) {
        crate::text::clear_runs(&el);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_inline_text(el: W, child: W, index: i32) {
    if let (Some(el), Some(child)) = (element(el), element(child)) {
        crate::text::set_inline_text(&el, &child, index);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_remove_inline_text(el: W, child: W) {
    if let (Some(el), Some(child)) = (element(el), element(child)) {
        crate::text::remove_inline_text(&el, &child);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_inline_box(el: W, child: W, index: i32) {
    if let (Some(el), Some(child)) = (element(el), widget(child)) {
        crate::text::set_inline_box(&el, &child, index);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_remove_inline_box(el: W, child: W) {
    if let (Some(el), Some(child)) = (element(el), widget(child)) {
        crate::text::remove_inline_box(&el, &child);
    }
}

/// 0 anonymous, 1 link, 2 list item, 3 dims when pressed, 4 button (read-only).
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_flag(el: W, which: i32, value: bool) {
    let Some(el) = element(el) else { return };
    let link = {
        let mut guard = el.text_state_mut();
        let Some(s) = guard.as_mut() else { return };
        match which {
            0 => s.is_anonymous = value,
            1 => s.is_link = value,
            2 => s.is_list_item = value,
            3 => s.dims_when_pressed = value,
            _ => {}
        }
        which == 1 && value
    };
    if link {
        el.set_cursor_from_name(Some("pointer"));
    }
    el.queue_draw();
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_flag(el: W, which: i32) -> bool {
    let Some(el) = element(el) else { return false };
    let guard = el.text_state();
    let Some(s) = guard.as_ref() else {
        return false;
    };
    match which {
        0 => s.is_anonymous,
        1 => s.is_link,
        2 => s.is_list_item,
        3 => s.dims_when_pressed,
        _ => s.is_button,
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_shadow(el: W, spec: *const c_char) {
    if let Some(el) = element(el) {
        el.css().text_shadows = css::parse_shadows(&string(spec));
        el.queue_draw();
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_set_feature_settings(el: W, value: *const c_char) {
    let Some(el) = element(el) else { return };
    let value = string(value);
    let features = if value.trim() == "normal" {
        String::new()
    } else {
        value.replace('"', "").replace('\'', "")
    };
    if let Some(s) = el.text_state_mut().as_mut() {
        s.feature_settings = features;
    }
    crate::text::request_rebuild(&el);
}

#[no_mangle]
pub extern "C" fn mason_gtk_text_node_new() -> *mut glib::gobject_ffi::GObject {
    TextNode::new().upcast::<glib::Object>().into_glib_ptr()
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_node_set_data(
    run: *mut glib::gobject_ffi::GObject,
    data: *const c_char,
) {
    if let Some(run) = text_node(run) {
        run.set_data(&string(data));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_node_data(
    run: *mut glib::gobject_ffi::GObject,
) -> *const c_char {
    ret(text_node(run).map(|r| r.data()).unwrap_or_default())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_text_node_set_break(
    run: *mut glib::gobject_ffi::GObject,
    value: bool,
) {
    if let Some(run) = text_node(run) {
        run.set_break(value);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_image_set_source(el: W, src: *const c_char) {
    if let Some(el) = element(el) {
        crate::image::set_source(&el, &string(src));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_image_source(el: W) -> *const c_char {
    ret(element(el)
        .map(|e| crate::image::source(&e))
        .unwrap_or_default())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_type(el: W, kind: i32) {
    if let Some(el) = element(el) {
        crate::input::set_kind(&el, kind);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_type(el: W) -> i32 {
    element(el).map_or(0, |e| crate::input::kind(&e))
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_value(el: W, value: *const c_char) {
    if let Some(el) = element(el) {
        crate::input::set_value(&el, &string(value));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_value(el: W) -> *const c_char {
    ret(element(el)
        .map(|e| crate::input::value(&e))
        .unwrap_or_default())
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_placeholder(el: W, value: *const c_char) {
    if let Some(el) = element(el) {
        crate::input::set_placeholder(&el, &string(value));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_placeholder(el: W) -> *const c_char {
    ret(element(el)
        .map(|e| crate::input::placeholder(&e))
        .unwrap_or_default())
}

/// 0 checked, 1 appearance none, 2 multiple.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_flag(el: W, which: i32, value: bool) {
    let Some(el) = element(el) else { return };
    match which {
        0 => crate::input::set_checked(&el, value),
        1 => crate::input::set_appearance_none(&el, value),
        _ => {
            if let Some(s) = el.input_state().as_ref() {
                s.multiple.set(value);
            }
        }
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_flag(el: W, which: i32) -> bool {
    let Some(el) = element(el) else { return false };
    let guard = el.input_state();
    let Some(s) = guard.as_ref() else {
        return false;
    };
    match which {
        0 => s.checked.get(),
        1 => s.appearance_none.get(),
        _ => s.multiple.get(),
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_accept(el: W, value: *const c_char) {
    if let Some(el) = element(el) {
        if let Some(s) = el.input_state().as_ref() {
            s.accept.replace(string(value));
        }
    }
}

/// 0 rows, 1 cols, 2 maxLength.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_int(el: W, which: i32, value: i32) {
    if let Some(el) = element(el) {
        crate::input::set_int(
            &el,
            ["rows", "cols", "max"][which.clamp(0, 2) as usize],
            value,
        );
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_int(el: W, which: i32) -> i32 {
    let Some(el) = element(el) else { return 0 };
    let guard = el.input_state();
    let Some(s) = guard.as_ref() else { return 0 };
    match which {
        0 => s.rows.get(),
        1 => s.cols.get(),
        _ => s.max_length.get(),
    }
}

/// `argb` >> 24 == 0 with `clear` resets it.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_set_placeholder_color(el: W, argb: u32, clear: bool) {
    if let Some(el) = element(el) {
        crate::input::set_placeholder_color(&el, (!clear).then_some(argb));
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_input_focus(el: W) {
    if let Some(el) = element(el) {
        crate::input::focus(&el);
    }
}

fn css_changed(el: &Element, layout: bool) {
    if layout {
        if let Some(p) = el.parent() {
            p.queue_allocate();
        }
    }
    el.queue_draw();
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_clear_background(el: W) {
    if let Some(el) = element(el) {
        el.css().brush = None;
        css_changed(&el, false);
    }
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_linear_gradient(
    el: W,
    angle: f64,
    corner_x: i32,
    corner_y: i32,
    stops: *const c_char,
    _interpolation: *const c_char,
) {
    let Some(el) = element(el) else { return };
    let corner = (corner_x != 0 || corner_y != 0).then_some((corner_x as f32, corner_y as f32));
    el.css().brush = Some(css::Image::Linear {
        angle: angle as f32,
        corner,
        stops: css::parse_stops(&string(stops)),
        repeating: false,
    });
    css_changed(&el, false);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_radial_gradient(
    el: W,
    cx: f64,
    cy: f64,
    rx: f64,
    ry: f64,
    stops: *const c_char,
    _interpolation: *const c_char,
) {
    let Some(el) = element(el) else { return };
    el.css().brush = Some(css::Image::Radial {
        center: (cx as f32, cy as f32),
        radius: (rx as f32, ry as f32),
        stops: css::parse_stops(&string(stops)),
        repeating: false,
    });
    css_changed(&el, false);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_background_image(
    el: W,
    src: *const c_char,
    fit: i32,
    align_x: i32,
    align_y: i32,
) {
    let Some(el) = element(el) else { return };
    {
        let mut c = el.css();
        c.brush = Some(css::Image::Url { src: string(src) });
        c.brush_fit = fit;
        c.brush_align = (align_x, align_y);
    }
    css_changed(&el, false);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_set_layers(el: W, spec: *const c_char) {
    let Some(el) = element(el) else { return };
    el.css().layers = css::parse_layers(&string(spec));
    css_changed(&el, false);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_set_box_shadow(el: W, spec: *const c_char) {
    let Some(el) = element(el) else { return };
    el.css().shadows = css::parse_shadows(&string(spec));
    css_changed(&el, false);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_set_filter(el: W, spec: *const c_char, backdrop: bool) {
    let Some(el) = element(el) else { return };
    let filters = css::parse_filters(&string(spec));
    if backdrop {
        crate::backdrop::register(&el, !filters.is_empty());
        el.css().backdrop = filters;
    } else {
        el.css().filters = filters;
    }
    css_changed(&el, false);
}

/// mask-* / clip-path (0) or border-image (1) JSON.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_set_mask(el: W, which: i32, spec: *const c_char) {
    let Some(el) = element(el) else { return };
    if which == 0 {
        el.css().mask = crate::mask::parse_mask(&string(spec));
    } else {
        el.css().border_image = crate::mask::parse_border_image(&string(spec));
    }
    css_changed(&el, false);
}

#[no_mangle]
#[allow(clippy::too_many_arguments)]
pub unsafe extern "C" fn mason_gtk_css_set_transforms(
    el: W,
    sx: f64,
    sy: f64,
    angle: f64,
    tx: f64,
    ty: f64,
    ox: f64,
    oy: f64,
) {
    let Some(el) = element(el) else { return };
    el.css().transforms = Some(css::Transforms {
        scale: (sx, sy),
        angle,
        translate: (tx, ty),
        origin: (ox, oy),
    });
    css_changed(&el, true);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_apply_transform(
    el: W,
    m11: f64,
    m12: f64,
    m21: f64,
    m22: f64,
    dx: f64,
    dy: f64,
) {
    let Some(el) = element(el) else { return };
    el.css().matrix = Some([m11, m12, m21, m22, dx, dy]);
    css_changed(&el, true);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_clear_transform(el: W) {
    let Some(el) = element(el) else { return };
    el.css().matrix = None;
    css_changed(&el, true);
}

#[no_mangle]
pub unsafe extern "C" fn mason_gtk_css_set_transform_origin(el: W, x: f64, y: f64) {
    let Some(el) = element(el) else { return };
    el.css().matrix_origin = (x, y);
    css_changed(&el, true);
}

#[link(name = "fontconfig")]
extern "C" {
    fn FcConfigGetCurrent() -> *mut std::ffi::c_void;
    fn FcConfigAppFontAddDir(config: *mut std::ffi::c_void, dir: *const c_char) -> i32;
}

#[link(name = "pangoft2-1.0")]
extern "C" {
    fn pango_fc_font_map_config_changed(fontmap: *mut std::ffi::c_void);
}

#[link(name = "pangocairo-1.0")]
extern "C" {
    fn pango_cairo_font_map_get_default() -> *mut std::ffi::c_void;
}

/// Makes the fonts in `dir` (the app's fonts folder) resolvable by family name.
#[no_mangle]
pub unsafe extern "C" fn mason_gtk_register_fonts(dir: *const c_char) -> bool {
    if dir.is_null() || FcConfigAppFontAddDir(FcConfigGetCurrent(), dir) == 0 {
        return false;
    }
    let fontmap = pango_cairo_font_map_get_default();
    if !fontmap.is_null() {
        pango_fc_font_map_config_changed(fontmap);
    }
    true
}

/// Fonts were added outside font-manager (fontconfig): every text lays out again.
#[no_mangle]
pub extern "C" fn mason_gtk_fonts_changed() {
    relayout_text();
}

pub fn relayout_text() {
    fn walk(widget: &gtk::Widget) {
        if let Some(el) = widget.downcast_ref::<Element>() {
            if el.kind().is_text() {
                crate::text::request_rebuild(el);
            } else if el.input_state().is_some() {
                el.invalidate_layout();
            }
        }
        let mut child = widget.first_child();
        while let Some(c) = child {
            walk(&c);
            child = c.next_sibling();
        }
    }
    for window in gtk::Window::list_toplevels() {
        walk(&window);
    }
}
