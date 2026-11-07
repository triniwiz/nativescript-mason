//! Text runs, nested texts and inline boxes as one Pango paragraph, the text node's measure.

use crate::element::{Element, Kind};
use crate::engine::{self, mason, StyleView};
use crate::paint::{rgba, BoxGeometry};
use crate::textnode::TextNode;
use gtk::glib::translate::*;
use gtk::prelude::*;
use gtk::{glib, graphene};
use mason_core::style::StyleKeys;
use mason_core::{AvailableSpace, Size};
use std::cell::{Cell, RefCell};

const OBJECT: char = '\u{FFFC}';
const BASELINE_QUERY: f32 = -4.0;

/// Vertical writing: Some(lr) for vertical-lr, Some(false) for vertical-rl.
fn vertical(el: &Element) -> Option<bool> {
    let node = el.try_node()?;
    match mason().resolved_writing_mode(node.id()) {
        mason_core::style::WritingMode::VerticalRl => Some(false),
        mason_core::style::WritingMode::VerticalLr => Some(true),
        _ => None,
    }
}

/// A vertical layout's lines as (top, bottom) in pango units, top to bottom.
fn line_bands(layout: &pango::Layout) -> Vec<(i32, i32)> {
    let mut out = Vec::new();
    let mut iter = layout.iter();
    loop {
        out.push(iter.line_yrange());
        if !iter.next_line() {
            return out;
        }
    }
}

/// Where layout point (lx, ly) is drawn in a vertical content box: lines run right to left
/// (rl) or left to right (lr), each line top to bottom.
fn vertical_point(
    lr: bool,
    bands: &[(i32, i32)],
    content: &graphene::Rect,
    lx: f32,
    ly: f32,
) -> (f32, f32) {
    let unit = pango::SCALE as f32;
    let x = if lr {
        let ly_units = (ly * unit) as i32;
        let (y0, y1) = bands
            .iter()
            .copied()
            .find(|(a, b)| ly_units >= *a && ly_units < *b)
            .or_else(|| bands.last().copied())
            .unwrap_or((0, 0));
        content.x() + (y0 + y1) as f32 / unit - ly
    } else {
        content.x() + content.width() - ly
    };
    (x, content.y() + lx)
}

pub enum Entry {
    Run(TextNode),
    Text(Element),
    Box(gtk::Widget),
}

#[derive(Default)]
pub struct TextState {
    pub entries: Vec<Entry>,
    pub content: Option<TextNode>,
    pub font_family: String,
    pub feature_settings: String,
    pub is_button: bool,
    pub is_link: bool,
    pub is_list_item: bool,
    pub is_anonymous: bool,
    pub dims_when_pressed: bool,
    pub pressed: bool,
    /// Text it is drawn inside of, when nested.
    pub host: glib::WeakRef<Element>,
    layout: RefCell<Option<pango::Layout>>,
    layout_width: Cell<i32>,
    dirty: Cell<bool>,
    /// (byte index of the replacement char, widget, size)
    boxes: RefCell<Vec<(i32, gtk::Widget, (f32, f32))>>,
    /// Byte ranges of nested texts, outermost first, for hit testing.
    pub ranges: RefCell<Vec<(u32, u32, Element)>>,
}

pub fn init(el: &Element, button: bool) {
    let state = TextState {
        is_button: button,
        dims_when_pressed: button,
        ..Default::default()
    };
    state.dirty.set(true);
    el.text_state_mut().replace(state);
    let node = el.node();
    mason().set_measure(node.id(), Some(measure), el.as_ptr() as *mut _);
    if button {
        crate::events::attach_button(el);
    }
}

/// The outermost text this one draws inside of.
pub fn top_host(el: &Element) -> Element {
    let mut cur = el.clone();
    loop {
        let host = cur.text_state().as_ref().and_then(|t| t.host.upgrade());
        match host {
            Some(h) => cur = h,
            None => return cur,
        }
    }
}

/// Lays the paragraph out again and invalidates layout from the drawing text up.
pub fn request_rebuild(el: &Element) {
    let host = top_host(el);
    if let Some(state) = host.text_state().as_ref() {
        state.dirty.set(true);
    }
    host.invalidate_layout();
    host.queue_draw();
}

pub fn style_changed(el: &Element, _dirty: u128) {
    request_rebuild(el);
}

fn clamp(index: i32, len: usize) -> usize {
    if index < 0 || index as usize > len {
        len
    } else {
        index as usize
    }
}

fn with_state<R>(el: &Element, f: impl FnOnce(&mut TextState) -> R) -> Option<R> {
    let mut guard = el.text_state_mut();
    guard.as_mut().map(f)
}

pub fn set_run(el: &Element, run: &TextNode, index: i32) {
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Run(r) if r == run));
        let at = clamp(index, s.entries.len());
        s.entries.insert(at, Entry::Run(run.clone()));
    });
    run.set_owner(Some(el));
    request_rebuild(el);
}

pub fn remove_run(el: &Element, run: &TextNode) {
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Run(r) if r == run))
    });
    run.set_owner(None);
    request_rebuild(el);
}

pub fn clear_runs(el: &Element) {
    let entries = with_state(el, |s| std::mem::take(&mut s.entries)).unwrap_or_default();
    for e in entries {
        match e {
            Entry::Run(r) => r.set_owner(None),
            Entry::Text(t) => detach_text(&t),
            Entry::Box(b) => release_box(el, &b),
        }
    }
    request_rebuild(el);
}

fn detach_text(child: &Element) {
    if let Some(s) = child.text_state().as_ref() {
        s.host.set(None);
    }
    // its boxes live in the top host
    let boxes: Vec<gtk::Widget> = child
        .text_state()
        .as_ref()
        .map(|s| {
            s.entries
                .iter()
                .filter_map(|e| {
                    if let Entry::Box(b) = e {
                        Some(b.clone())
                    } else {
                        None
                    }
                })
                .collect()
        })
        .unwrap_or_default();
    for b in boxes {
        if b.parent().is_some() {
            b.unparent();
        }
    }
}

pub fn set_inline_text(el: &Element, child: &Element, index: i32) {
    if child == el {
        return;
    }
    if let Some(old) = child.text_state().as_ref().and_then(|s| s.host.upgrade()) {
        if &old != el {
            remove_inline_text(&old, child);
        }
    }
    if child.parent().is_some() {
        if let Some(p) = child.parent().and_then(|p| p.downcast::<Element>().ok()) {
            p.remove_child(child.upcast_ref());
        } else {
            child.unparent();
        }
    }
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Text(t) if t == child));
        let at = clamp(index, s.entries.len());
        s.entries.insert(at, Entry::Text(child.clone()));
    });
    if let Some(s) = child.text_state().as_ref() {
        s.host.set(Some(el));
    }
    adopt_boxes(&top_host(el), child);
    request_rebuild(el);
}

pub fn remove_inline_text(el: &Element, child: &Element) {
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Text(t) if t == child))
    });
    detach_text(child);
    request_rebuild(el);
}

/// Boxes of a nested text become GTK children of the text that draws them.
fn adopt_boxes(host: &Element, text: &Element) {
    let members: Vec<Entry> = text
        .text_state()
        .as_ref()
        .map(|s| {
            s.entries
                .iter()
                .filter_map(|e| match e {
                    Entry::Box(b) => Some(Entry::Box(b.clone())),
                    Entry::Text(t) => Some(Entry::Text(t.clone())),
                    _ => None,
                })
                .collect()
        })
        .unwrap_or_default();
    for m in members {
        match m {
            Entry::Box(b) => {
                if b.parent().as_ref() != Some(host.upcast_ref()) {
                    if b.parent().is_some() {
                        b.unparent();
                    }
                    b.set_parent(host);
                }
            }
            Entry::Text(t) => adopt_boxes(host, &t),
            _ => {}
        }
    }
}

pub fn set_inline_box(el: &Element, child: &gtk::Widget, index: i32) {
    if let Some(p) = child.parent() {
        if let Ok(pe) = p.clone().downcast::<Element>() {
            if !pe.kind().is_text() {
                pe.remove_child(child);
            }
        }
        if child.parent().is_some() {
            child.unparent();
        }
    }
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Box(b) if b == child));
        let at = clamp(index, s.entries.len());
        s.entries.insert(at, Entry::Box(child.clone()));
    });
    child.set_parent(&top_host(el));
    request_rebuild(el);
}

pub fn remove_inline_box(el: &Element, child: &gtk::Widget) {
    with_state(el, |s| {
        s.entries
            .retain(|e| !matches!(e, Entry::Box(b) if b == child))
    });
    release_box(el, child);
    request_rebuild(el);
}

fn release_box(el: &Element, child: &gtk::Widget) {
    let host = top_host(el);
    if child.parent().as_ref() == Some(host.upcast_ref()) {
        child.unparent();
    }
}

pub fn set_content(el: &Element, value: &str) {
    let run = with_state(el, |s| s.content.clone()).flatten();
    let run = match run {
        Some(r) => r,
        None => {
            let r = TextNode::new();
            with_state(el, |s| s.content = Some(r.clone()));
            set_run(el, &r, 0);
            r
        }
    };
    run.set_data(value);
}

pub fn content(el: &Element) -> String {
    let mut out = String::new();
    collect_plain(el, &mut out);
    out
}

fn collect_plain(el: &Element, out: &mut String) {
    if let Some(s) = el.text_state().as_ref() {
        for e in &s.entries {
            match e {
                Entry::Run(r) => {
                    if r.is_break() {
                        out.push('\n');
                    } else {
                        out.push_str(&r.data());
                    }
                }
                Entry::Text(t) => collect_plain(t, out),
                Entry::Box(_) => {}
            }
        }
    }
}

/// Text styles of an element; unset values come from the nearest element that sets them.
#[derive(Clone)]
pub struct TextStyle {
    pub color: u32,
    pub size: f32,
    pub weight: i32,
    pub italic: bool,
    pub family: String,
    pub decoration: u8,
    pub decoration_color: Option<u32>,
    pub letter_spacing: f32,
    pub line_height: Option<(u8, f32)>,
    pub white_space: u8,
    pub transform: u8,
    pub align: i8,
    pub text_overflow: u8,
    pub line_clamp: i32,
    pub indent: f32,
    pub background: u32,
    pub features: String,
}

fn ancestors(el: &Element) -> Vec<Element> {
    let mut out = vec![el.clone()];
    let mut cur = el.clone();
    loop {
        let next = cur
            .text_state()
            .as_ref()
            .and_then(|s| s.host.upgrade())
            .or_else(|| Element::mason_parent(cur.upcast_ref()));
        match next {
            Some(n) => {
                out.push(n.clone());
                cur = n;
            }
            None => return out,
        }
    }
}

pub fn resolve_style(el: &Element) -> TextStyle {
    use StyleKeys::*;
    let chain = ancestors(el);
    let styles: Vec<StyleView<'static>> = chain.iter().map(|e| e.style()).collect();
    let first = |state: StyleKeys| styles.iter().find(|s| s.u8(state) != 0);
    let own = &styles[0];
    let family = chain
        .iter()
        .find_map(|e| {
            e.text_state()
                .as_ref()
                .map(|s| s.font_family.clone())
                .filter(|f| !f.is_empty())
        })
        .unwrap_or_default();
    let features = chain
        .iter()
        .find_map(|e| {
            e.text_state()
                .as_ref()
                .map(|s| s.feature_settings.clone())
                .filter(|f| !f.is_empty())
        })
        .unwrap_or_default();
    // A percentage resolves against the nearest absolute size above it: core hands the same raw
    // percentage down the tree, so percent ancestors are skipped rather than compounded.
    let absolute = |from: usize| {
        styles[from..]
            .iter()
            .find(|s| s.u8(FONT_SIZE_STATE) != 0 && s.u8(FONT_SIZE_TYPE) != 1)
            .map_or(16.0, |s| s.f32(FONT_SIZE))
    };
    let size = match styles.iter().position(|s| s.u8(FONT_SIZE_STATE) != 0) {
        Some(i) if styles[i].u8(FONT_SIZE_TYPE) == 1 => {
            absolute(i + 1) * styles[i].f32(FONT_SIZE) / 100.0
        }
        Some(i) => styles[i].f32(FONT_SIZE),
        None => 16.0,
    };
    TextStyle {
        color: first(FONT_COLOR_STATE).map_or(0xff00_0000, |s| s.u32(FONT_COLOR)),
        size: if size > 0.0 { size } else { 16.0 },
        weight: first(FONT_WEIGHT_STATE).map_or(400, |s| s.i32(FONT_WEIGHT)),
        italic: first(FONT_STYLE_STATE).is_some_and(|s| s.i8(FONT_STYLE_TYPE) != 0),
        family,
        decoration: own.u8(DECORATION_LINE),
        decoration_color: (own.u8(DECORATION_COLOR_STATE) != 0
            && own.u32(DECORATION_COLOR) != 0xdead_beef)
            .then(|| own.u32(DECORATION_COLOR)),
        letter_spacing: first(LETTER_SPACING_STATE).map_or(0.0, |s| s.f32(LETTER_SPACING)),
        line_height: first(LINE_HEIGHT_STATE).map(|s| (s.u8(LINE_HEIGHT_TYPE), s.f32(LINE_HEIGHT))),
        white_space: first(WHITE_SPACE_STATE).map_or(0, |s| s.u8(WHITE_SPACE)),
        transform: first(TEXT_TRANSFORM_STATE).map_or(0, |s| s.u8(TEXT_TRANSFORM)),
        align: first(TEXT_ALIGN_STATE).map_or(0, |s| s.i8(TEXT_ALIGN)),
        text_overflow: own.u8(TEXT_OVERFLOW),
        line_clamp: if own.u8(LINE_CLAMP_STATE) != 0 {
            own.i32(LINE_CLAMP)
        } else {
            0
        },
        indent: if own.u8(TEXT_INDENT_STATE) != 0 {
            own.f32(TEXT_INDENT)
        } else {
            0.0
        },
        background: own.u32(BACKGROUND_COLOR),
        features,
    }
}

fn font_desc(style: &TextStyle) -> pango::FontDescription {
    let mut desc = pango::FontDescription::new();
    desc.set_family(&crate::fonts::resolve(
        &style.family,
        style.weight,
        style.italic,
    ));
    desc.set_absolute_size(style.size as f64 * pango::SCALE as f64);
    desc.set_weight(match style.weight {
        w if w <= 150 => pango::Weight::Thin,
        w if w <= 250 => pango::Weight::Ultralight,
        w if w <= 350 => pango::Weight::Light,
        w if w <= 450 => pango::Weight::Normal,
        w if w <= 550 => pango::Weight::Medium,
        w if w <= 650 => pango::Weight::Semibold,
        w if w <= 750 => pango::Weight::Bold,
        w if w <= 850 => pango::Weight::Ultrabold,
        _ => pango::Weight::Heavy,
    });
    desc.set_style(if style.italic {
        pango::Style::Italic
    } else {
        pango::Style::Normal
    });
    desc
}

fn rgb16(argb: u32) -> (u16, u16, u16, u16) {
    let c = |shift: u32| (((argb >> shift) & 0xff) as u16) * 257;
    (c(16), c(8), c(0), c(24))
}

fn insert(list: &pango::AttrList, attr: impl Into<pango::Attribute>, start: u32, end: u32) {
    let mut a: pango::Attribute = attr.into();
    a.set_start_index(start);
    a.set_end_index(end);
    list.insert(a);
}

/// Attributes of a nested element over its byte range (the host's are the layout defaults).
fn span_attrs(list: &pango::AttrList, style: &TextStyle, start: u32, end: u32, nested: bool) {
    if start >= end {
        return;
    }
    insert(
        list,
        pango::AttrFontDesc::new(&font_desc(style)),
        start,
        end,
    );
    let (r, g, b, a) = rgb16(style.color);
    insert(list, pango::AttrColor::new_foreground(r, g, b), start, end);
    if a < 0xffff {
        insert(
            list,
            pango::AttrInt::new_foreground_alpha(a.max(1)),
            start,
            end,
        );
    }
    if style.decoration & 1 != 0 {
        insert(
            list,
            pango::AttrInt::new_underline(pango::Underline::Single),
            start,
            end,
        );
    }
    if style.decoration & 2 != 0 {
        insert(
            list,
            pango::AttrInt::new_overline(pango::Overline::Single),
            start,
            end,
        );
    }
    if style.decoration & 4 != 0 {
        insert(list, pango::AttrInt::new_strikethrough(true), start, end);
    }
    if let Some(c) = style.decoration_color {
        let (r, g, b, _) = rgb16(c);
        insert(
            list,
            pango::AttrColor::new_underline_color(r, g, b),
            start,
            end,
        );
        insert(
            list,
            pango::AttrColor::new_strikethrough_color(r, g, b),
            start,
            end,
        );
        insert(
            list,
            pango::AttrColor::new_overline_color(r, g, b),
            start,
            end,
        );
    }
    if style.letter_spacing != 0.0 {
        insert(
            list,
            pango::AttrInt::new_letter_spacing((style.letter_spacing * pango::SCALE as f32) as i32),
            start,
            end,
        );
    }
    match style.transform {
        1 => insert(
            list,
            pango::AttrInt::new_text_transform(pango::TextTransform::Capitalize),
            start,
            end,
        ),
        2 => insert(
            list,
            pango::AttrInt::new_text_transform(pango::TextTransform::Uppercase),
            start,
            end,
        ),
        3 => insert(
            list,
            pango::AttrInt::new_text_transform(pango::TextTransform::Lowercase),
            start,
            end,
        ),
        _ => {}
    }
    if !style.features.is_empty() {
        insert(
            list,
            pango::AttrFontFeatures::new(&style.features),
            start,
            end,
        );
    }
    if nested && style.background >> 24 != 0 {
        let (r, g, b, a) = rgb16(style.background);
        insert(list, pango::AttrColor::new_background(r, g, b), start, end);
        if a < 0xffff {
            insert(
                list,
                pango::AttrInt::new_background_alpha(a.max(1)),
                start,
                end,
            );
        }
    }
    if let Some((kind, value)) = style.line_height {
        let px = if kind == 0 { value * style.size } else { value };
        if px > 0.0 {
            insert(
                list,
                pango::AttrInt::new_line_height_absolute((px * pango::SCALE as f32) as i32),
                start,
                end,
            );
        }
    }
}

/// Collapses white space as `white-space` asks; `prev_space` carries across runs.
fn push_text(out: &mut String, text: &str, white_space: u8, prev_space: &mut bool) {
    match white_space {
        // pre, pre-wrap, break-spaces
        1 | 2 | 5 => {
            out.push_str(text);
            *prev_space = false;
        }
        _ => {
            let keep_newlines = white_space == 3;
            for ch in text.chars() {
                if ch == '\n' && keep_newlines {
                    while out.ends_with(' ') {
                        out.pop();
                    }
                    out.push('\n');
                    *prev_space = true;
                } else if ch.is_whitespace() {
                    if !*prev_space {
                        out.push(' ');
                        *prev_space = true;
                    }
                } else {
                    out.push(ch);
                    *prev_space = false;
                }
            }
        }
    }
}

struct Built {
    text: String,
    attrs: pango::AttrList,
    boxes: Vec<(i32, gtk::Widget, (f32, f32))>,
    ranges: Vec<(u32, u32, Element)>,
}

fn box_size(widget: &gtk::Widget, avail: f32) -> (f32, f32) {
    let node = Element::child_node(widget);
    let width = if avail > 0.0 {
        AvailableSpace::Definite(avail)
    } else {
        AvailableSpace::MaxContent
    };
    if let Some(el) = widget.downcast_ref::<Element>() {
        el.compute(width, AvailableSpace::MaxContent);
    } else {
        mason().compute_size(
            node.id(),
            Size {
                width,
                height: AvailableSpace::MaxContent,
            },
        );
    }
    let l = engine::layout(node.id());
    let m = &l.margin;
    (
        l.size.width + m.left + m.right,
        l.size.height + m.top + m.bottom,
    )
}

fn build(host: &Element, avail: f32) -> Built {
    let host_style = resolve_style(host);
    let mut b = Built {
        text: String::new(),
        attrs: pango::AttrList::new(),
        boxes: Vec::new(),
        ranges: Vec::new(),
    };
    let mut prev_space = true;
    fn walk(
        el: &Element,
        style: &TextStyle,
        host_ws: u8,
        b: &mut Built,
        prev_space: &mut bool,
        avail: f32,
        nested: bool,
    ) {
        let start = b.text.len() as u32;
        let entries: Vec<Entry> = el
            .text_state()
            .as_ref()
            .map(|s| {
                s.entries
                    .iter()
                    .map(|e| match e {
                        Entry::Run(r) => Entry::Run(r.clone()),
                        Entry::Text(t) => Entry::Text(t.clone()),
                        Entry::Box(w) => Entry::Box(w.clone()),
                    })
                    .collect()
            })
            .unwrap_or_default();
        for e in entries {
            match e {
                Entry::Run(r) => {
                    if r.is_break() {
                        while b.text.ends_with(' ') && host_ws != 1 && host_ws != 2 {
                            b.text.pop();
                        }
                        b.text.push('\n');
                        *prev_space = true;
                    } else {
                        push_text(&mut b.text, &r.data(), style.white_space, prev_space);
                    }
                }
                Entry::Text(t) => {
                    let child_style = resolve_style(&t);
                    walk(&t, &child_style, host_ws, b, prev_space, avail, true);
                }
                Entry::Box(w) => {
                    if !w.is_visible() {
                        continue;
                    }
                    let index = b.text.len() as i32;
                    b.text.push(OBJECT);
                    *prev_space = false;
                    let (bw, bh) = box_size(&w, avail);
                    let logical = pango::Rectangle::new(
                        0,
                        -(bh * pango::SCALE as f32) as i32,
                        (bw * pango::SCALE as f32) as i32,
                        (bh * pango::SCALE as f32) as i32,
                    );
                    insert(
                        &b.attrs,
                        pango::AttrShape::new(&logical, &logical),
                        index as u32,
                        index as u32 + OBJECT.len_utf8() as u32,
                    );
                    b.boxes.push((index, w, (bw, bh)));
                }
            }
        }
        let end = b.text.len() as u32;
        if nested {
            span_attrs(&b.attrs, style, start, end, true);
            b.ranges.push((start, end, el.clone()));
        }
    }
    walk(
        host,
        &host_style,
        host_style.white_space,
        &mut b,
        &mut prev_space,
        avail,
        false,
    );
    // trailing collapsible space
    if !matches!(host_style.white_space, 1 | 2 | 5) {
        while b.text.ends_with(' ') {
            b.text.pop();
        }
    }
    // nested spans were pushed innermost first; outer ones must not override them
    b.ranges.reverse();
    b
}

fn configure(layout: &pango::Layout, style: &TextStyle, width: i32) {
    layout.set_font_description(Some(&font_desc(style)));
    let wraps = !matches!(style.white_space, 1 | 4);
    layout.set_width(if wraps && width >= 0 { width } else { -1 });
    // overflow-wrap: normal breaks only between words
    layout.set_wrap(pango::WrapMode::Word);
    layout.set_alignment(match style.align {
        2 => pango::Alignment::Right,
        3 => pango::Alignment::Center,
        _ => pango::Alignment::Left,
    });
    layout.set_justify(style.align == 4);
    layout.set_indent((style.indent * pango::SCALE as f32) as i32);
    let ellipsis = style.text_overflow == 1;
    if style.line_clamp > 0 {
        layout.set_ellipsize(pango::EllipsizeMode::End);
        layout.set_height(-style.line_clamp);
    } else if ellipsis && !wraps {
        layout.set_ellipsize(pango::EllipsizeMode::End);
        layout.set_height(-1);
    } else {
        layout.set_ellipsize(pango::EllipsizeMode::None);
        layout.set_height(-1);
    }
}

/// The paragraph laid out for `width` pango units (-1 unwrapped).
fn layout_for(el: &Element, width: i32, avail: f32) -> pango::Layout {
    let cached = el
        .text_state()
        .as_ref()
        .and_then(|s| (!s.dirty.get()).then(|| (s.layout.borrow().clone(), s.layout_width.get())));
    if let Some((Some(layout), cached_width)) = cached {
        if cached_width != width {
            configure(&layout, &resolve_style(el), width);
            if let Some(s) = el.text_state().as_ref() {
                s.layout_width.set(width);
            }
        }
        return layout;
    }
    let built = build(el, avail);
    let style = resolve_style(el);
    let layout = match vertical(el) {
        Some(_) => {
            // East gravity: CJK stays upright, other scripts turn sideways
            let context = el.create_pango_context();
            context.set_base_gravity(pango::Gravity::East);
            let orientation = el
                .try_node()
                .map_or(0, |n| mason().resolved_text_orientation(n.id()));
            context.set_gravity_hint(if orientation == 2 {
                pango::GravityHint::Strong
            } else {
                pango::GravityHint::Natural
            });
            pango::Layout::new(&context)
        }
        None => el.create_pango_layout(None),
    };
    let list = pango::AttrList::new();
    // host-level line height (font size etc. come from the description)
    if let Some((kind, value)) = style.line_height {
        let px = if kind == 0 { value * style.size } else { value };
        if px > 0.0 {
            insert(
                &list,
                pango::AttrInt::new_line_height_absolute((px * pango::SCALE as f32) as i32),
                0,
                u32::MAX,
            );
        }
    }
    if style.letter_spacing != 0.0 {
        insert(
            &list,
            pango::AttrInt::new_letter_spacing((style.letter_spacing * pango::SCALE as f32) as i32),
            0,
            u32::MAX,
        );
    }
    span_attrs(
        &list,
        &TextStyle {
            background: 0,
            ..style.clone()
        },
        0,
        built.text.len() as u32,
        false,
    );
    // nested spans and shapes go last so they win
    for attr in built.attrs.attributes() {
        list.insert(attr);
    }
    layout.set_text(&built.text);
    layout.set_attributes(Some(&list));
    configure(&layout, &style, width);
    if let Some(state) = el.text_state().as_ref() {
        state.layout.replace(Some(layout.clone()));
        state.layout_width.set(width);
        state.dirty.set(false);
        state.boxes.replace(built.boxes);
        state.ranges.replace(built.ranges);
    }
    layout
}

/// Lines that wrap beside floats: one layout per line at the narrowed width, drawn clipped
/// to that line (Pango has one width per layout).
#[derive(Clone)]
pub struct Band {
    layout: pango::Layout,
    /// Byte offset of the band's first character in the paragraph.
    start: usize,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    /// Lines drawn from the layout; 0 draws all (the full-width rest).
    lines: i32,
}

/// Floats of the containing block as (left, top, right, bottom, side) in this text's content box.
fn exclusions(el: &Element) -> Vec<(f32, f32, f32, f32, u8)> {
    if el.style().u8(StyleKeys::FLOAT) != 0 {
        return Vec::new();
    }
    let Some(parent) = Element::mason_parent(el.upcast_ref()) else {
        return Vec::new();
    };
    let (Some(own), Some(container)) = (el.try_node(), parent.try_node()) else {
        return Vec::new();
    };
    let raw = mason().get_float_exclusions(container.id());
    if raw.len() < 5 {
        return Vec::new();
    }
    let o = engine::layout(own.id());
    let c = engine::layout(container.id());
    let dx = o.location.x + o.border.left + o.padding.left - c.border.left - c.padding.left;
    let dy = o.location.y + o.border.top + o.padding.top - c.border.top - c.padding.top;
    raw.chunks_exact(5)
        .filter_map(|r| {
            let side = if r[4] == 1.0 {
                1
            } else if r[4] == 2.0 {
                2
            } else {
                0
            };
            // floats wholly above the text don't touch its lines
            (side != 0 && r[2] > 0.0 && r[3] > 0.0 && r[1] + r[3] - dy > 0.0).then(|| {
                (
                    r[0] - dx,
                    r[1] - dy,
                    r[0] + r[2] - dx,
                    r[1] + r[3] - dy,
                    side,
                )
            })
        })
        .collect()
}

/// The span [start, end) left free at [top, bottom) by the floats.
fn clear_span(
    floats: &[(f32, f32, f32, f32, u8)],
    width: f32,
    top: f32,
    bottom: f32,
) -> (f32, f32) {
    let (mut start, mut end) = (0.0f32, width);
    for &(l, t, r, b, side) in floats {
        if b <= top || t >= bottom {
            continue;
        }
        if side == 1 {
            start = start.max(r);
        } else {
            end = end.min(l);
        }
    }
    (start, end)
}

fn band_layout(full: &pango::Layout, start: usize, width: f32) -> pango::Layout {
    let layout = full.copy();
    let text = full.text();
    layout.set_text(&text[start..]);
    if let Some(attrs) = full.attributes() {
        let Some(attrs) = attrs.copy() else {
            return layout;
        };
        attrs.update(0, start as i32, 0);
        layout.set_attributes(Some(&attrs));
    }
    layout.set_width((width * pango::SCALE as f32) as i32);
    // only a paragraph's first line is indented
    if start > 0 {
        layout.set_indent(0);
    }
    layout
}

/// Wraps the paragraph around the containing block's floats; None when none touch it.
fn flow(el: &Element, full: &pango::Layout, width: f32) -> Option<(Vec<Band>, f32)> {
    if width <= 0.0 || full.text().is_empty() {
        return None;
    }
    let floats = exclusions(el);
    if floats.is_empty() {
        return None;
    }
    let bottom = floats.iter().fold(0.0f32, |m, f| m.max(f.3));
    let unit = pango::SCALE as f32;
    let line_height = full
        .line_readonly(0)
        .map_or(16.0, |l| l.extents().1.height() as f32 / unit);
    let total = full.text().len();
    let (mut start, mut y, mut bands) = (0usize, 0.0f32, Vec::new());
    while start < total && bands.len() < 10_000 {
        if y >= bottom {
            let layout = band_layout(full, start, width);
            let height = layout.extents().1.height() as f32 / unit;
            bands.push(Band {
                layout,
                start,
                x: 0.0,
                y,
                width,
                height,
                lines: 0,
            });
            y += height;
            break;
        }
        let (s, e) = clear_span(&floats, width, y, y + line_height);
        if e - s < 1.0 {
            // no room beside the floats here: move below the nearest one
            y = floats
                .iter()
                .filter(|f| f.1 <= y + line_height && f.3 > y)
                .fold(bottom, |m, f| m.min(f.3))
                .max(y + 1.0);
            continue;
        }
        let layout = band_layout(full, start, e - s);
        let Some(line) = layout.line_readonly(0) else {
            break;
        };
        let height = line.extents().1.height() as f32 / unit;
        let len = line_advance(&full.text(), start, line.length() as usize);
        bands.push(Band {
            layout,
            start,
            x: s,
            y,
            width: e - s,
            height,
            lines: 1,
        });
        start += len;
        y += height;
    }
    Some((bands, y))
}

/// Bytes a band's first line consumes; an empty line (at a paragraph separator, maybe
/// multi-byte like U+2029) still moves on a whole char.
fn line_advance(text: &str, start: usize, line_len: usize) -> usize {
    match line_len {
        0 => text[start..].chars().next().map_or(1, char::len_utf8),
        n => n,
    }
}

fn last_baseline(layout: &pango::Layout) -> f32 {
    let mut iter = layout.iter();
    let mut baseline = iter.baseline();
    while iter.next_line() {
        baseline = iter.baseline();
    }
    baseline as f32 / pango::SCALE as f32
}

extern "C" fn measure(data: *const std::ffi::c_void, kw: f32, kh: f32, aw: f32, _ah: f32) -> i64 {
    let widget: gtk::Widget = unsafe { from_glib_none(data as *mut gtk::ffi::GtkWidget) };
    let Ok(el) = widget.downcast::<Element>() else {
        return engine::pack(0.0, 0.0);
    };
    // a vertical container measures its text in its own transposed frame: width is the inline axis
    if aw == BASELINE_QUERY {
        let width = if kw.is_nan() {
            -1
        } else {
            (kw * pango::SCALE as f32) as i32
        };
        let layout = layout_for(&el, width, kw);
        return engine::pack(last_baseline(&layout), BASELINE_QUERY);
    }
    let (w, h) = measure_inline(&el, kw, aw, kh);
    engine::pack(w, h)
}

/// Inline and block size for a known / available inline size and a known block size.
fn measure_inline(el: &Element, kw: f32, aw: f32, kh: f32) -> (f32, f32) {
    let el = el.clone();
    let (width, avail) = if !kw.is_nan() {
        ((kw * pango::SCALE as f32).ceil() as i32, kw)
    } else if aw == -1.0 {
        (1, 0.0)
    } else if aw >= 0.0 {
        ((aw * pango::SCALE as f32).ceil() as i32, aw)
    } else {
        (-1, -1.0)
    };
    let layout = layout_for(&el, width, avail);
    // empty (or fully collapsed) text takes no line, as in a browser
    if layout.text().is_empty() {
        return (
            if kw.is_nan() { 0.0 } else { kw },
            if kh.is_nan() { 0.0 } else { kh },
        );
    }
    let (_, logical) = layout.extents();
    let unit = pango::SCALE as f32;
    let mut w = logical.width() as f32 / unit;
    if width < 0 {
        // an unwrapped line still starts at text-indent
        w += (layout.indent() as f32 / unit).max(0.0);
    }
    if aw >= 0.0 && kw.is_nan() {
        w = w.min(aw.max(0.0));
    }
    let mut h = logical.height() as f32 / unit;
    if width > 0 && vertical(&el).is_none() {
        if let Some((_, flowed)) = flow(&el, &layout, width as f32 / unit) {
            h = flowed;
        }
    }
    (
        if kw.is_nan() { w } else { kw },
        if kh.is_nan() { h } else { kh },
    )
}

pub fn allocate(el: &Element, _width: f32, _height: f32) {
    let content = el.content_box();
    let vertical = vertical(el);
    let inline = if vertical.is_some() {
        content.height()
    } else {
        content.width()
    };
    let width = (inline * pango::SCALE as f32).ceil() as i32;
    let layout = layout_for(el, width, inline);
    let bands = if vertical.is_some() {
        None
    } else {
        flow(el, &layout, inline).map(|(b, _)| b)
    };
    let lines = vertical.map(|_| line_bands(&layout)).unwrap_or_default();
    let boxes = el
        .text_state()
        .as_ref()
        .map(|s| s.boxes.borrow().clone())
        .unwrap_or_default();
    for (index, widget, (bw, bh)) in boxes {
        if widget.parent().as_ref() != Some(el.upcast_ref()) {
            continue;
        }
        let (pos, ox, oy) = index_pos(&layout, bands.as_deref(), index);
        let unit = pango::SCALE as f32;
        let (x, y) = match vertical {
            // the box's inline extent runs down the line; its right edge is the line's start
            Some(lr) => {
                let (px, py) = vertical_point(
                    lr,
                    &lines,
                    &content,
                    pos.x() as f32 / unit,
                    pos.y() as f32 / unit,
                );
                (px - bw, py)
            }
            None => (
                content.x() + ox + pos.x() as f32 / unit,
                content.y()
                    + oy
                    + pos.y() as f32 / unit
                    + (pos.height() as f32 / unit - bh).max(0.0),
            ),
        };
        let node = Element::child_node(&widget);
        let l = engine::layout(node.id());
        crate::element::allocate_widget(
            &widget,
            x + l.margin.left,
            y + l.margin.top,
            l.size.width.min(bw),
            l.size.height.min(bh),
            None,
        );
    }
}

pub fn snapshot(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry) {
    let content = g.content_box();
    let rect = content.bounds();
    let vertical = vertical(el);
    let inline = if vertical.is_some() {
        rect.height()
    } else {
        rect.width()
    };
    let width = (inline * pango::SCALE as f32).ceil() as i32;
    let layout = layout_for(el, width, inline);
    let bands = if vertical.is_some() {
        None
    } else {
        flow(el, &layout, inline).map(|(b, _)| b)
    };
    let style = resolve_style(el);
    let pressed = el
        .text_state()
        .as_ref()
        .is_some_and(|t| t.pressed && t.dims_when_pressed);
    s.save();
    match vertical {
        Some(_) => {
            // layout x runs down, layout y (line progression) leftwards
            s.translate(&graphene::Point::new(rect.x() + rect.width(), rect.y()));
            s.rotate(90.0);
        }
        None => s.translate(&graphene::Point::new(rect.x(), rect.y())),
    }
    let lr = vertical
        .unwrap_or(false)
        .then(|| (line_bands(&layout), rect.width()));
    if pressed {
        s.push_opacity(0.6);
    }
    let shadows = el.css_ref().text_shadows.clone();
    for shadow in shadows.iter().rev() {
        s.save();
        s.translate(&graphene::Point::new(shadow.dx, shadow.dy));
        if shadow.blur > 0.0 {
            s.push_blur(shadow.blur as f64);
        }
        draw_paragraph(
            s,
            &layout,
            bands.as_deref(),
            lr.as_ref(),
            &rgba(shadow.argb),
        );
        if shadow.blur > 0.0 {
            s.pop();
        }
        s.restore();
    }
    draw_paragraph(
        s,
        &layout,
        bands.as_deref(),
        lr.as_ref(),
        &rgba(style.color),
    );
    if pressed {
        s.pop();
    }
    s.restore();
    if el.text_state().as_ref().is_some_and(|t| t.is_list_item) {
        snapshot_marker(el, s, g);
    }
}

fn draw_paragraph(
    s: &gtk::Snapshot,
    layout: &pango::Layout,
    bands: Option<&[Band]>,
    lr: Option<&(Vec<(i32, i32)>, f32)>,
    color: &gtk::gdk::RGBA,
) {
    if let Some((lines, block)) = lr {
        // vertical-lr: each line moves to the mirrored place, so lines run left to right
        let unit = pango::SCALE as f32;
        for &(y0, y1) in lines {
            let (y0, y1) = (y0 as f32 / unit, y1 as f32 / unit);
            s.save();
            s.translate(&graphene::Point::new(0.0, block - y0 - y1));
            s.push_clip(&graphene::Rect::new(-1e5, y0, 2e5, y1 - y0));
            s.append_layout(layout, color);
            s.pop();
            s.restore();
        }
        return;
    }
    let Some(bands) = bands else {
        s.append_layout(layout, color);
        return;
    };
    for band in bands {
        s.save();
        s.translate(&graphene::Point::new(band.x, band.y));
        if band.lines > 0 {
            s.push_clip(&graphene::Rect::new(
                -band.x,
                0.0,
                band.width + band.x.max(0.0) + 1e4,
                band.height,
            ));
        }
        s.append_layout(&band.layout, color);
        if band.lines > 0 {
            s.pop();
        }
        s.restore();
    }
}

/// Where a byte index lands: its rectangle in the band holding it, and that band's offset.
fn index_pos(
    layout: &pango::Layout,
    bands: Option<&[Band]>,
    index: i32,
) -> (pango::Rectangle, f32, f32) {
    match bands.and_then(|b| b.iter().rev().find(|band| band.start as i32 <= index)) {
        Some(band) => (
            band.layout.index_to_pos(index - band.start as i32),
            band.x,
            band.y,
        ),
        None => (layout.index_to_pos(index), 0.0, 0.0),
    }
}

/// The text element (host or a nested one) under a point in the host's coordinates.
pub fn hit_text(host: &Element, x: f64, y: f64) -> Element {
    let content = host.content_box();
    let guard = host.text_state();
    let Some(state) = guard.as_ref() else {
        return host.clone();
    };
    let Some(layout) = state.layout.borrow().clone() else {
        return host.clone();
    };
    let (lx, ly) = match vertical(host) {
        Some(lr) => {
            let unit = pango::SCALE as f64;
            let ly = if lr {
                let px = x - content.x() as f64;
                line_bands(&layout)
                    .into_iter()
                    .find(|(a, b)| px * unit >= *a as f64 && px * unit < *b as f64)
                    .map_or(px, |(a, b)| (a + b) as f64 / unit - px)
            } else {
                (content.x() + content.width()) as f64 - x
            };
            (y - content.y() as f64, ly)
        }
        None => (x - content.x() as f64, y - content.y() as f64),
    };
    let (inside, index, _) = layout.xy_to_index(
        (lx * pango::SCALE as f64) as i32,
        (ly * pango::SCALE as f64) as i32,
    );
    if !inside {
        return host.clone();
    }
    let ranges = state.ranges.borrow();
    // innermost (shortest) range containing the index
    ranges
        .iter()
        .filter(|(s, e, _)| (*s as i32) <= index && index < *e as i32)
        .min_by_key(|(s, e, _)| e - s)
        .map_or(host.clone(), |(_, _, t)| t.clone())
}

pub fn snapshot_marker(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry) {
    let style = el.style();
    let mut kind = style.u8(StyleKeys::LIST_STYLE_TYPE);
    let parent = Element::mason_parent(el.upcast_ref());
    let ordered = parent.as_ref().is_some_and(|p| p.list_ordered());
    if style.u8(StyleKeys::LIST_STYLE_TYPE_STATE) == 0 {
        kind = if ordered { 5 } else { 2 };
    }
    if kind == 0 {
        return;
    }
    let text_style = resolve_style(el);
    let marker = match kind {
        3 => "◦".to_string(),
        4 => "▪".to_string(),
        5 => {
            let mut index = 1;
            if let Some(p) = &parent {
                let mut c = p.first_child();
                while let Some(w) = c {
                    if &w == el.upcast_ref::<gtk::Widget>() {
                        break;
                    }
                    if w.downcast_ref::<Element>().is_some_and(|e| {
                        e.kind() == Kind::Li
                            || e.text_state().as_ref().is_some_and(|t| t.is_list_item)
                    }) {
                        index += 1;
                    }
                    c = w.next_sibling();
                }
            }
            format!("{index}.")
        }
        _ => "•".to_string(),
    };
    let layout = el.create_pango_layout(Some(&marker));
    layout.set_font_description(Some(&font_desc(&text_style)));
    let (_, logical) = layout.pixel_extents();
    let content = g.content_box();
    let rect = content.bounds();
    let x = rect.x() - logical.width() as f32 - text_style.size * 0.5;
    s.save();
    s.translate(&graphene::Point::new(x, rect.y()));
    s.append_layout(&layout, &rgba(text_style.color));
    s.restore();
}

#[cfg(test)]
mod tests {
    #[test]
    fn empty_lines_advance_whole_chars() {
        let text = "x\u{2029}y";
        assert_eq!(super::line_advance(text, 1, 0), 3);
        assert_eq!(super::line_advance(text, 0, 1), 1);
        assert!(text.is_char_boundary(1 + super::line_advance(text, 1, 0)));
    }
}
