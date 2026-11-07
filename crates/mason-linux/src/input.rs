//! `<input>` / `<textarea>`: a bare GTK control in the content box.

use crate::element::{mark_internal, Element};
use crate::engine::{self, mason};
use crate::events::{self, EventInit};
use crate::text::resolve_style;
use gtk::gdk;
use gtk::glib::translate::*;
use gtk::prelude::*;
use std::cell::{Cell, RefCell};

pub const TEXT: i32 = 0;
pub const BUTTON: i32 = 1;
pub const CHECKBOX: i32 = 2;
pub const PASSWORD: i32 = 4;
pub const RADIO: i32 = 6;
pub const NUMBER: i32 = 7;
pub const RANGE: i32 = 8;
pub const COLOR: i32 = 11;
pub const FILE: i32 = 12;
pub const SUBMIT: i32 = 13;
pub const RESET: i32 = 19;

pub struct InputState {
    pub kind: Cell<i32>,
    pub area: bool,
    pub control: RefCell<Option<gtk::Widget>>,
    /// The editable inside: GtkEntry or GtkTextView.
    value: RefCell<String>,
    placeholder: RefCell<String>,
    placeholder_color: Cell<Option<u32>>,
    pub checked: Cell<bool>,
    pub appearance_none: Cell<bool>,
    pub multiple: Cell<bool>,
    pub accept: RefCell<String>,
    pub rows: Cell<i32>,
    pub cols: Cell<i32>,
    pub max_length: Cell<i32>,
    font_family: RefCell<String>,
    css: gtk::CssProvider,
    class: String,
    /// Set while the value is written from JS, so no input event fires.
    quiet: Cell<bool>,
}

thread_local! {
    static NEXT_ID: Cell<u32> = const { Cell::new(1) };
}

impl InputState {
    pub fn dispose(&self) {
        if let Some(display) = gdk::Display::default() {
            gtk::style_context_remove_provider_for_display(&display, &self.css);
        }
    }

    pub fn value(&self) -> String {
        self.value.borrow().clone()
    }

    /// Fonts, colors and the bare look of text controls.
    pub fn style_changed(&self, el: &Element) {
        let style = resolve_style(el);
        let c = style.color;
        let color = format!(
            "rgba({},{},{},{:.3})",
            (c >> 16) & 0xff,
            (c >> 8) & 0xff,
            c & 0xff,
            (c >> 24) as f32 / 255.0
        );
        let family = {
            let f = self.font_family.borrow();
            if f.is_empty() {
                style.family.clone()
            } else {
                f.clone()
            }
        };
        let family = if family.is_empty() {
            "sans-serif".to_string()
        } else {
            family
        };
        let kind = self.kind.get();
        let bare = self.area
            || !matches!(kind, CHECKBOX | RADIO | RANGE | COLOR)
            || self.appearance_none.get();
        let mut css = format!(
            ".{cls}, .{cls} text, .{cls} textview, .{cls} textview text, .{cls} label {{ color: {color}; font-family: {family}; font-size: {size}px; font-weight: {weight}; font-style: {italic}; }}\n",
            cls = self.class,
            size = style.size,
            weight = style.weight,
            italic = if style.italic { "italic" } else { "normal" },
        );
        if bare {
            css += &format!(
                ".{cls}, .{cls} > *, .{cls} textview, .{cls} textview text {{ background: none; border: none; box-shadow: none; outline: none; padding: 0; margin: 0; min-height: 0; min-width: 0; }}\n",
                cls = self.class
            );
        }
        if let Some(pc) = self.placeholder_color.get() {
            css += &format!(
                ".{cls} text placeholder {{ color: rgba({},{},{},{:.3}); }}\n",
                (pc >> 16) & 0xff,
                (pc >> 8) & 0xff,
                pc & 0xff,
                (pc >> 24) as f32 / 255.0,
                cls = self.class
            );
        }
        self.css.load_from_data(&css);
    }
}

fn control_for(kind: i32, area: bool) -> gtk::Widget {
    if area {
        let view = gtk::TextView::new();
        view.set_wrap_mode(gtk::WrapMode::WordChar);
        let scroller = gtk::ScrolledWindow::new();
        scroller.set_policy(gtk::PolicyType::Never, gtk::PolicyType::Automatic);
        scroller.set_child(Some(&view));
        return scroller.upcast();
    }
    match kind {
        CHECKBOX => gtk::CheckButton::new().upcast(),
        RADIO => gtk::CheckButton::new().upcast(),
        RANGE => gtk::Scale::with_range(gtk::Orientation::Horizontal, 0.0, 100.0, 1.0).upcast(),
        COLOR => gtk::ColorButton::new().upcast(),
        BUTTON | SUBMIT | RESET | FILE => gtk::Button::new().upcast(),
        _ => {
            let entry = gtk::Entry::new();
            entry.set_has_frame(false);
            match kind {
                PASSWORD => entry.set_visibility(false),
                NUMBER => entry.set_input_purpose(gtk::InputPurpose::Number),
                3 => entry.set_input_purpose(gtk::InputPurpose::Email),
                9 => entry.set_input_purpose(gtk::InputPurpose::Phone),
                10 => entry.set_input_purpose(gtk::InputPurpose::Url),
                _ => {}
            }
            entry.upcast()
        }
    }
}

fn text_view(control: &gtk::Widget) -> Option<gtk::TextView> {
    control
        .downcast_ref::<gtk::ScrolledWindow>()?
        .child()?
        .downcast::<gtk::TextView>()
        .ok()
}

pub fn init(el: &Element, area: bool) {
    let id = NEXT_ID.with(|n| {
        let id = n.get();
        n.set(id + 1);
        id
    });
    let state = InputState {
        kind: Cell::new(TEXT),
        area,
        control: RefCell::new(None),
        value: RefCell::new(String::new()),
        placeholder: RefCell::new(String::new()),
        placeholder_color: Cell::new(None),
        checked: Cell::new(false),
        appearance_none: Cell::new(false),
        multiple: Cell::new(false),
        accept: RefCell::new(String::new()),
        rows: Cell::new(2),
        cols: Cell::new(20),
        max_length: Cell::new(-1),
        font_family: RefCell::new(String::new()),
        css: gtk::CssProvider::new(),
        class: format!("mason-input-{id}"),
        quiet: Cell::new(false),
    };
    if let Some(display) = gdk::Display::default() {
        gtk::style_context_add_provider_for_display(
            &display,
            &state.css,
            gtk::STYLE_PROVIDER_PRIORITY_APPLICATION + 1,
        );
    }
    el.input_state_mut().replace(state);
    rebuild_control(el);
    let node = el.node();
    mason().set_measure(node.id(), Some(measure), el.as_ptr() as *mut _);
}

fn rebuild_control(el: &Element) {
    let (kind, area) = match el.input_state().as_ref() {
        Some(s) => (s.kind.get(), s.area),
        None => return,
    };
    if let Some(old) = el
        .input_state()
        .as_ref()
        .and_then(|s| s.control.borrow_mut().take())
    {
        old.unparent();
    }
    let control = control_for(kind, area);
    mark_internal(&control);
    if let Some(s) = el.input_state().as_ref() {
        control.add_css_class(&s.class);
        s.control.replace(Some(control.clone()));
    }
    control.set_parent(el);
    wire(el, &control, kind, area);
    apply_value(el);
    if let Some(s) = el.input_state().as_ref() {
        s.style_changed(el);
    }
    el.invalidate_layout();
}

fn emit(el: &Element, kind: &str, data: String) {
    let quiet = el.input_state().as_ref().is_some_and(|s| s.quiet.get());
    if quiet {
        return;
    }
    events::dispatch(
        el,
        EventInit {
            kind: kind.to_string(),
            data,
            bubbles: true,
            cancelable: false,
            ..Default::default()
        },
    );
}

fn wire(el: &Element, control: &gtk::Widget, kind: i32, area: bool) {
    let weak = el.downgrade();
    if area {
        if let Some(view) = text_view(control) {
            let w = weak.clone();
            view.buffer().connect_changed(move |buffer| {
                let Some(el) = w.upgrade() else { return };
                let text = buffer
                    .text(&buffer.start_iter(), &buffer.end_iter(), false)
                    .to_string();
                if let Some(s) = el.input_state().as_ref() {
                    s.value.replace(text.clone());
                }
                emit(&el, "input", text);
                el.invalidate_layout();
            });
        }
        return;
    }
    if let Some(entry) = control.downcast_ref::<gtk::Entry>() {
        let w = weak.clone();
        entry.connect_changed(move |entry| {
            let Some(el) = w.upgrade() else { return };
            let text = entry.text().to_string();
            if let Some(s) = el.input_state().as_ref() {
                s.value.replace(text.clone());
            }
            emit(&el, "input", text);
        });
        let w = weak.clone();
        entry.connect_activate(move |entry| {
            if let Some(el) = w.upgrade() {
                emit(&el, "change", entry.text().to_string());
            }
        });
        return;
    }
    if let Some(check) = control.downcast_ref::<gtk::CheckButton>() {
        let w = weak.clone();
        check.connect_toggled(move |check| {
            let Some(el) = w.upgrade() else { return };
            let checked = check.is_active();
            if kind == RADIO && !checked {
                return;
            }
            if let Some(s) = el.input_state().as_ref() {
                s.checked.set(checked);
            }
            emit(
                &el,
                "input",
                if checked { "on".into() } else { String::new() },
            );
            emit(
                &el,
                "change",
                if checked { "on".into() } else { String::new() },
            );
        });
        return;
    }
    if let Some(scale) = control.downcast_ref::<gtk::Scale>() {
        let w = weak.clone();
        scale.connect_value_changed(move |scale| {
            let Some(el) = w.upgrade() else { return };
            let v = format!("{}", scale.value());
            if let Some(s) = el.input_state().as_ref() {
                s.value.replace(v.clone());
            }
            emit(&el, "input", v.clone());
            emit(&el, "change", v);
        });
        return;
    }
    if let Some(button) = control.downcast_ref::<gtk::ColorButton>() {
        let w = weak.clone();
        button.connect_color_set(move |button| {
            let Some(el) = w.upgrade() else { return };
            let c = button.rgba();
            let v = format!(
                "#{:02x}{:02x}{:02x}",
                (c.red() * 255.0) as u8,
                (c.green() * 255.0) as u8,
                (c.blue() * 255.0) as u8
            );
            if let Some(s) = el.input_state().as_ref() {
                s.value.replace(v.clone());
            }
            emit(&el, "input", v.clone());
            emit(&el, "change", v);
        });
        return;
    }
    if let Some(button) = control.downcast_ref::<gtk::Button>() {
        let w = weak.clone();
        button.connect_clicked(move |button| {
            let Some(el) = w.upgrade() else { return };
            if kind == FILE {
                open_file_chooser(&el, button.upcast_ref());
            } else {
                events::dispatch(
                    &el,
                    EventInit {
                        kind: "click".into(),
                        bubbles: true,
                        cancelable: true,
                        ..Default::default()
                    },
                );
            }
        });
    }
}

fn open_file_chooser(el: &Element, anchor: &gtk::Widget) {
    let window = anchor.root().and_then(|r| r.downcast::<gtk::Window>().ok());
    let chooser = gtk::FileChooserNative::new(
        None,
        window.as_ref(),
        gtk::FileChooserAction::Open,
        None,
        None,
    );
    let multiple = el.input_state().as_ref().is_some_and(|s| s.multiple.get());
    chooser.set_select_multiple(multiple);
    let weak = el.downgrade();
    chooser.connect_response(move |chooser, response| {
        let Some(el) = weak.upgrade() else { return };
        if response == gtk::ResponseType::Accept {
            let files = chooser.files();
            let mut paths = Vec::new();
            for i in 0..files.n_items() {
                if let Some(path) = files
                    .item(i)
                    .and_then(|f| f.downcast::<gtk::gio::File>().ok())
                    .and_then(|f| f.path())
                {
                    paths.push(path.to_string_lossy().to_string());
                }
            }
            let value = paths.first().cloned().unwrap_or_default();
            if let Some(s) = el.input_state().as_ref() {
                s.value.replace(value.clone());
            }
            events::dispatch(
                &el,
                EventInit {
                    kind: "input".into(),
                    data: value.clone(),
                    files: paths.clone(),
                    bubbles: true,
                    ..Default::default()
                },
            );
            events::dispatch(
                &el,
                EventInit {
                    kind: "change".into(),
                    data: value,
                    files: paths,
                    bubbles: true,
                    ..Default::default()
                },
            );
        }
        chooser.destroy();
    });
    chooser.show();
}

/// Writes the state into the control without raising input events.
fn apply_value(el: &Element) {
    let snapshot = el.input_state().as_ref().and_then(|s| {
        let control = s.control.borrow().clone()?;
        s.quiet.set(true);
        Some((
            control,
            s.value.borrow().clone(),
            s.placeholder.borrow().clone(),
            s.max_length.get(),
            s.checked.get(),
            s.kind.get(),
        ))
    });
    let Some((control, value, placeholder, max_length, checked, kind)) = snapshot else {
        return;
    };
    if let Some(view) = text_view(&control) {
        let buffer = view.buffer();
        if buffer.text(&buffer.start_iter(), &buffer.end_iter(), false) != value {
            buffer.set_text(&value);
        }
    } else if let Some(entry) = control.downcast_ref::<gtk::Entry>() {
        if entry.text() != value {
            entry.set_text(&value);
        }
        entry.set_placeholder_text(Some(&placeholder));
        entry.set_max_length(max_length.max(0));
    } else if let Some(check) = control.downcast_ref::<gtk::CheckButton>() {
        check.set_active(checked);
    } else if let Some(scale) = control.downcast_ref::<gtk::Scale>() {
        if let Ok(v) = value.parse::<f64>() {
            scale.set_value(v);
        }
    } else if let Some(button) = control.downcast_ref::<gtk::ColorButton>() {
        if let Ok(c) = gdk::RGBA::parse(&value) {
            button.set_rgba(&c);
        }
    } else if let Some(button) = control.downcast_ref::<gtk::Button>() {
        let label = if !value.is_empty() {
            value
        } else {
            match kind {
                SUBMIT => "Submit".into(),
                RESET => "Reset".into(),
                FILE => "Choose File".into(),
                _ => String::new(),
            }
        };
        button.set_label(&label);
    }
    if let Some(s) = el.input_state().as_ref() {
        s.quiet.set(false);
    }
}

pub fn set_kind(el: &Element, kind: i32) {
    let changed = el
        .input_state()
        .as_ref()
        .is_some_and(|s| s.kind.replace(kind) != kind);
    if changed {
        rebuild_control(el);
    }
}

pub fn kind(el: &Element) -> i32 {
    el.input_state().as_ref().map_or(0, |s| s.kind.get())
}

pub fn set_value(el: &Element, value: &str) {
    if let Some(s) = el.input_state().as_ref() {
        s.value.replace(value.to_string());
    }
    apply_value(el);
}

pub fn value(el: &Element) -> String {
    el.input_state()
        .as_ref()
        .map(|s| s.value())
        .unwrap_or_default()
}

pub fn set_placeholder(el: &Element, value: &str) {
    if let Some(s) = el.input_state().as_ref() {
        s.placeholder.replace(value.to_string());
    }
    apply_value(el);
    el.invalidate_layout();
}

pub fn placeholder(el: &Element) -> String {
    el.input_state()
        .as_ref()
        .map(|s| s.placeholder.borrow().clone())
        .unwrap_or_default()
}

pub fn set_checked(el: &Element, value: bool) {
    if let Some(s) = el.input_state().as_ref() {
        s.checked.set(value);
    }
    apply_value(el);
}

pub fn set_appearance_none(el: &Element, value: bool) {
    if let Some(s) = el.input_state().as_ref() {
        s.appearance_none.set(value);
        s.style_changed(el);
    }
    el.queue_draw();
}

pub fn set_placeholder_color(el: &Element, argb: Option<u32>) {
    if let Some(s) = el.input_state().as_ref() {
        s.placeholder_color.set(argb);
        s.style_changed(el);
    }
}

pub fn set_font_family(el: &Element, family: &str) {
    if let Some(s) = el.input_state().as_ref() {
        s.font_family.replace(family.to_string());
        s.style_changed(el);
    }
    el.invalidate_layout();
}

pub fn set_int(el: &Element, which: &str, value: i32) {
    if let Some(s) = el.input_state().as_ref() {
        match which {
            "rows" => s.rows.set(value.max(1)),
            "cols" => s.cols.set(value.max(1)),
            _ => s.max_length.set(value),
        }
    }
    apply_value(el);
    el.invalidate_layout();
}

pub fn allocate(el: &Element, _width: f32, _height: f32) {
    let control = el
        .input_state()
        .as_ref()
        .and_then(|s| s.control.borrow().clone());
    let Some(control) = control else { return };
    let content = el.content_box();
    let (_, nat_h, ..) = control.measure(gtk::Orientation::Vertical, content.width() as i32);
    let area = el.input_state().as_ref().is_some_and(|s| s.area);
    // single-line controls center in their box
    let h = if area {
        content.height()
    } else {
        (nat_h as f32).min(content.height().max(nat_h as f32))
    };
    let y = if area {
        content.y()
    } else {
        content.y() + ((content.height() - h) / 2.0).max(0.0)
    };
    crate::element::allocate_widget(&control, content.x(), y, content.width(), h, None);
}

extern "C" fn measure(data: *const std::ffi::c_void, kw: f32, kh: f32, _aw: f32, _ah: f32) -> i64 {
    let widget: gtk::Widget = unsafe { from_glib_none(data as *mut gtk::ffi::GtkWidget) };
    let Ok(el) = widget.downcast::<Element>() else {
        return engine::pack(0.0, 0.0);
    };
    let guard = el.input_state();
    let Some(s) = guard.as_ref() else {
        return engine::pack(0.0, 0.0);
    };
    let Some(control) = s.control.borrow().clone() else {
        return engine::pack(0.0, 0.0);
    };
    let style = resolve_style(&el);
    let (_, nat_w, ..) = control.measure(gtk::Orientation::Horizontal, -1);
    let char_w = style.size * 0.5;
    let line_h = (style.size * 1.2).ceil();
    let (w, h) = if s.area {
        (s.cols.get() as f32 * char_w, s.rows.get() as f32 * line_h)
    } else {
        match s.kind.get() {
            CHECKBOX | RADIO => (style.size.max(13.0), style.size.max(13.0)),
            RANGE => (129.0, style.size.max(16.0)),
            COLOR => (50.0, 27.0),
            BUTTON | SUBMIT | RESET | FILE => {
                let (_, nat_h, ..) = control.measure(gtk::Orientation::Vertical, -1);
                (nat_w as f32, nat_h as f32)
            }
            _ => (20.0 * char_w, line_h),
        }
    };
    engine::pack(
        if kw.is_nan() { w } else { kw },
        if kh.is_nan() { h } else { kh },
    )
}

pub fn focus(el: &Element) {
    if let Some(control) = el
        .input_state()
        .as_ref()
        .and_then(|s| s.control.borrow().clone())
    {
        control.grab_focus();
    }
}
