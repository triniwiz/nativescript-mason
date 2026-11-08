//! DOM-style events; GTK controllers go on the widget that draws the element.

use crate::element::Element;
use gtk::glib;
use gtk::prelude::*;
use gtk::subclass::prelude::*;
use std::cell::{Cell, RefCell};

pub type Dispatcher = extern "C" fn(i32, *mut glib::gobject_ffi::GObject);

thread_local! {
    static DISPATCHER: Cell<Option<Dispatcher>> = const { Cell::new(None) };
    static NEXT_ID: Cell<i32> = const { Cell::new(1) };
}

pub fn set_dispatcher(d: Option<Dispatcher>) {
    DISPATCHER.with(|c| c.set(d));
}

#[derive(Default, Clone)]
pub struct EventInit {
    pub kind: String,
    pub data: String,
    pub input_type: String,
    pub key: String,
    pub files: Vec<String>,
    pub bubbles: bool,
    pub cancelable: bool,
    pub repeat: bool,
    pub ctrl: bool,
    pub shift: bool,
    pub alt: bool,
    pub meta: bool,
    pub x: f64,
    pub y: f64,
    pub button: i32,
}

mod imp {
    use super::*;

    #[derive(Default)]
    pub struct Event {
        pub init: RefCell<EventInit>,
        pub target: glib::WeakRef<Element>,
        pub current: glib::WeakRef<Element>,
        pub time: Cell<f64>,
        pub default_prevented: Cell<bool>,
        pub propagation_stopped: Cell<bool>,
        pub immediate_stopped: Cell<bool>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for Event {
        const NAME: &'static str = "MasonEvent";
        type Type = super::Event;
        type ParentType = glib::Object;
    }

    impl ObjectImpl for Event {}
}

glib::wrapper! {
    pub struct Event(ObjectSubclass<imp::Event>);
}

impl Event {
    pub fn init(&self) -> std::cell::Ref<'_, EventInit> {
        self.imp().init.borrow()
    }
    pub fn target(&self) -> Option<Element> {
        self.imp().target.upgrade()
    }
    pub fn current_target(&self) -> Option<Element> {
        self.imp().current.upgrade()
    }
    pub fn time(&self) -> f64 {
        self.imp().time.get()
    }
    pub fn prevent_default(&self) {
        if self.init().cancelable {
            self.imp().default_prevented.set(true);
        }
    }
    pub fn default_prevented(&self) -> bool {
        self.imp().default_prevented.get()
    }
    pub fn stop_propagation(&self) {
        self.imp().propagation_stopped.set(true);
    }
    pub fn stop_immediate(&self) {
        self.imp().propagation_stopped.set(true);
        self.imp().immediate_stopped.set(true);
    }
    pub fn propagation_stopped(&self) -> bool {
        self.imp().propagation_stopped.get()
    }
    pub fn immediate_stopped(&self) -> bool {
        self.imp().immediate_stopped.get()
    }
}

#[derive(Default)]
pub struct Listeners {
    pub list: Vec<(String, i32)>,
    controllers: Vec<(String, gtk::EventController)>,
}

impl Listeners {
    fn has(&self, kind: &str) -> bool {
        self.list.iter().any(|(k, _)| k == kind)
    }
}

/// The Mason element chain from `el` up, nested texts through their hosts.
fn chain(el: &Element) -> Vec<Element> {
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

fn now() -> f64 {
    glib::monotonic_time() as f64 / 1000.0
}

/// Calls `current`'s listeners for the event.
fn call(event: &Event, current: &Element) {
    let Some(dispatcher) = DISPATCHER.with(|c| c.get()) else {
        return;
    };
    let kind = event.init().kind.clone();
    let ids: Vec<i32> = current
        .listeners()
        .list
        .iter()
        .filter(|(k, _)| *k == kind)
        .map(|(_, id)| *id)
        .collect();
    if ids.is_empty() {
        return;
    }
    event.imp().current.set(Some(current));
    for id in ids {
        dispatcher(id, event.upcast_ref::<glib::Object>().as_ptr());
        if event.immediate_stopped() {
            break;
        }
    }
}

/// Raises an event at `target`, bubbling through its Mason ancestors.
pub fn dispatch(target: &Element, init: EventInit) -> Event {
    let event: Event = glib::Object::new();
    let bubbles = init.bubbles;
    event.imp().init.replace(init);
    event.imp().target.set(Some(target));
    event.imp().time.set(now());
    for el in chain(target) {
        call(&event, &el);
        if !bubbles || event.propagation_stopped() {
            break;
        }
    }
    event
}

/// The widget a GTK controller for `el` goes on: a nested text is drawn by its host.
fn anchor(el: &Element) -> Element {
    if el.text_state().is_some() {
        crate::text::top_host(el)
    } else {
        el.clone()
    }
}

/// The deepest element at (x, y) in `widget`'s coordinates.
fn target_at(widget: &Element, x: f64, y: f64) -> Element {
    let mut target = widget.clone();
    if let Some(picked) = widget.pick(x, y, gtk::PickFlags::DEFAULT) {
        let mut cur = Some(picked);
        while let Some(w) = cur {
            if let Ok(el) = w.clone().downcast::<Element>() {
                target = el;
                break;
            }
            cur = w.parent();
        }
    }
    if target.text_state().is_some() {
        if let Some(p) =
            widget.compute_point(&target, &gtk::graphene::Point::new(x as f32, y as f32))
        {
            return crate::text::hit_text(&target, p.x() as f64, p.y() as f64);
        }
    }
    target
}

fn modifiers(init: &mut EventInit, state: gtk::gdk::ModifierType) {
    init.ctrl = state.contains(gtk::gdk::ModifierType::CONTROL_MASK);
    init.shift = state.contains(gtk::gdk::ModifierType::SHIFT_MASK);
    init.alt = state.contains(gtk::gdk::ModifierType::ALT_MASK);
    init.meta = state.contains(gtk::gdk::ModifierType::META_MASK)
        || state.contains(gtk::gdk::ModifierType::SUPER_MASK);
}

/// A pointer event at a point of the anchor: dispatched to `listener` when it is the target or
/// one of its ancestors; returns whether propagation was stopped.
fn pointer(
    anchor: &Element,
    listener: &Element,
    kind: &str,
    x: f64,
    y: f64,
    state: gtk::gdk::ModifierType,
    button: i32,
) -> bool {
    let target = target_at(anchor, x, y);
    let path = chain(&target);
    if !path.contains(listener) {
        return false;
    }
    let mut init = EventInit {
        kind: kind.to_string(),
        bubbles: true,
        cancelable: true,
        x,
        y,
        button,
        ..Default::default()
    };
    modifiers(&mut init, state);
    let event: Event = glib::Object::new();
    event.imp().init.replace(init);
    event.imp().target.set(Some(&target));
    event.imp().time.set(now());
    call(&event, listener);
    event.propagation_stopped()
}

const CLICK: &[&str] = &[
    "click",
    "tap",
    "dblclick",
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "touchstart",
    "touchend",
    "mason:active",
];
const MOTION: &[&str] = &[
    "pointermove",
    "mousemove",
    "touchmove",
    "pointerenter",
    "pointerleave",
    "mouseenter",
    "mouseleave",
    "pointerover",
    "pointerout",
    "mouseover",
    "mouseout",
];
const KEY: &[&str] = &["keydown", "keyup", "keypress"];
const FOCUS: &[&str] = &["focus", "blur", "focusin", "focusout"];

fn controller_group(kind: &str) -> Option<&'static str> {
    if CLICK.contains(&kind) {
        Some("click")
    } else if MOTION.contains(&kind) {
        Some("motion")
    } else if KEY.contains(&kind) {
        Some("key")
    } else if FOCUS.contains(&kind) {
        Some("focus")
    } else if kind == "wheel" || kind == "scroll" {
        Some("scroll")
    } else {
        None
    }
}

fn install(listener: &Element, group: &str) -> gtk::EventController {
    let host = anchor(listener);
    let weak_host = host.downgrade();
    let weak = listener.downgrade();
    let controller: gtk::EventController = match group {
        "click" => {
            let gesture = gtk::GestureClick::new();
            gesture.set_button(0);
            let (h, l) = (weak_host.clone(), weak.clone());
            gesture.connect_pressed(move |g, n, x, y| {
                let (Some(host), Some(el)) = (h.upgrade(), l.upgrade()) else {
                    return;
                };
                let state = g.current_event_state();
                let button = g.current_button() as i32;
                let has = |k: &str| el.listeners().has(k);
                if has("mason:active") {
                    let event = dispatch_quiet(&el, "mason:active", "1");
                    drop(event);
                }
                let mut stopped = false;
                for kind in ["pointerdown", "mousedown", "touchstart"] {
                    if has(kind) {
                        stopped |= pointer(&host, &el, kind, x, y, state, button - 1);
                    }
                }
                if n == 2 && has("dblclick") {
                    stopped |= pointer(&host, &el, "dblclick", x, y, state, button - 1);
                }
                if stopped {
                    g.set_state(gtk::EventSequenceState::Claimed);
                }
            });
            let (h, l) = (weak_host.clone(), weak.clone());
            gesture.connect_released(move |g, n, x, y| {
                let (Some(host), Some(el)) = (h.upgrade(), l.upgrade()) else {
                    return;
                };
                let state = g.current_event_state();
                let button = g.current_button() as i32;
                let has = |k: &str| el.listeners().has(k);
                if has("mason:active") {
                    dispatch_quiet(&el, "mason:active", "0");
                }
                let mut stopped = false;
                for kind in ["pointerup", "mouseup", "touchend"] {
                    if has(kind) {
                        stopped |= pointer(&host, &el, kind, x, y, state, button - 1);
                    }
                }
                if n == 1 && button == 1 {
                    for kind in ["click", "tap"] {
                        if has(kind) {
                            stopped |= pointer(&host, &el, kind, x, y, state, 0);
                        }
                    }
                }
                if stopped {
                    g.set_state(gtk::EventSequenceState::Claimed);
                }
            });
            let l = weak.clone();
            gesture.connect_cancel(move |_, _| {
                if let Some(el) = l.upgrade() {
                    if el.listeners().has("mason:active") {
                        dispatch_quiet(&el, "mason:active", "0");
                    }
                }
            });
            gesture.upcast()
        }
        "motion" => {
            let motion = gtk::EventControllerMotion::new();
            let (h, l) = (weak_host.clone(), weak.clone());
            motion.connect_motion(move |c, x, y| {
                let (Some(host), Some(el)) = (h.upgrade(), l.upgrade()) else {
                    return;
                };
                let state = c.current_event_state();
                for kind in ["pointermove", "mousemove", "touchmove"] {
                    if el.listeners().has(kind) {
                        pointer(&host, &el, kind, x, y, state, -1);
                    }
                }
            });
            let (h, l) = (weak_host.clone(), weak.clone());
            motion.connect_enter(move |c, x, y| {
                let (Some(_), Some(el)) = (h.upgrade(), l.upgrade()) else {
                    return;
                };
                let mut init = EventInit {
                    x,
                    y,
                    ..Default::default()
                };
                modifiers(&mut init, c.current_event_state());
                for kind in ["pointerenter", "mouseenter", "pointerover", "mouseover"] {
                    if el.listeners().has(kind) {
                        dispatch_one(
                            &el,
                            EventInit {
                                kind: kind.into(),
                                bubbles: kind.ends_with("over"),
                                ..init.clone()
                            },
                        );
                    }
                }
            });
            let l = weak.clone();
            motion.connect_leave(move |_| {
                let Some(el) = l.upgrade() else { return };
                for kind in ["pointerleave", "mouseleave", "pointerout", "mouseout"] {
                    if el.listeners().has(kind) {
                        dispatch_one(
                            &el,
                            EventInit {
                                kind: kind.into(),
                                bubbles: kind.ends_with("out"),
                                ..Default::default()
                            },
                        );
                    }
                }
            });
            motion.upcast()
        }
        "key" => {
            listener.set_focusable(true);
            let key = gtk::EventControllerKey::new();
            let l = weak.clone();
            key.connect_key_pressed(move |_, keyval, _, state| {
                let Some(el) = l.upgrade() else {
                    return glib::Propagation::Proceed;
                };
                let mut init = EventInit {
                    kind: "keydown".into(),
                    key: key_name(keyval),
                    bubbles: true,
                    cancelable: true,
                    ..Default::default()
                };
                modifiers(&mut init, state);
                let event = dispatch_one(&el, init.clone());
                if el.listeners().has("keypress") {
                    dispatch_one(
                        &el,
                        EventInit {
                            kind: "keypress".into(),
                            ..init
                        },
                    );
                }
                if event.default_prevented() || event.propagation_stopped() {
                    glib::Propagation::Stop
                } else {
                    glib::Propagation::Proceed
                }
            });
            let l = weak.clone();
            key.connect_key_released(move |_, keyval, _, state| {
                let Some(el) = l.upgrade() else { return };
                let mut init = EventInit {
                    kind: "keyup".into(),
                    key: key_name(keyval),
                    bubbles: true,
                    cancelable: true,
                    ..Default::default()
                };
                modifiers(&mut init, state);
                dispatch_one(&el, init);
            });
            key.upcast()
        }
        "focus" => {
            let focus = gtk::EventControllerFocus::new();
            let l = weak.clone();
            focus.connect_enter(move |_| {
                if let Some(el) = l.upgrade() {
                    for kind in ["focus", "focusin"] {
                        dispatch_one(
                            &el,
                            EventInit {
                                kind: kind.into(),
                                bubbles: kind == "focusin",
                                ..Default::default()
                            },
                        );
                    }
                }
            });
            let l = weak.clone();
            focus.connect_leave(move |_| {
                if let Some(el) = l.upgrade() {
                    for kind in ["blur", "focusout"] {
                        dispatch_one(
                            &el,
                            EventInit {
                                kind: kind.into(),
                                bubbles: kind == "focusout",
                                ..Default::default()
                            },
                        );
                    }
                }
            });
            focus.upcast()
        }
        _ => {
            let scroll =
                gtk::EventControllerScroll::new(gtk::EventControllerScrollFlags::BOTH_AXES);
            let l = weak.clone();
            scroll.connect_scroll(move |c, dx, dy| {
                let Some(el) = l.upgrade() else {
                    return glib::Propagation::Proceed;
                };
                let mut init = EventInit {
                    kind: "wheel".into(),
                    bubbles: true,
                    cancelable: true,
                    x: dx,
                    y: dy,
                    ..Default::default()
                };
                modifiers(&mut init, c.current_event_state());
                let event = dispatch_one(&el, init);
                if event.default_prevented() {
                    glib::Propagation::Stop
                } else {
                    glib::Propagation::Proceed
                }
            });
            scroll.upcast()
        }
    };
    host.add_controller(controller.clone());
    controller
}

fn key_name(keyval: gtk::gdk::Key) -> String {
    if let Some(c) = keyval.to_unicode() {
        if !c.is_control() {
            return c.to_string();
        }
    }
    let name = keyval.name().map(|n| n.to_string()).unwrap_or_default();
    match name.as_str() {
        "Return" | "KP_Enter" => "Enter".into(),
        "BackSpace" => "Backspace".into(),
        "Left" | "Right" | "Up" | "Down" => format!("Arrow{name}"),
        "Page_Up" => "PageUp".into(),
        "Page_Down" => "PageDown".into(),
        "Shift_L" | "Shift_R" => "Shift".into(),
        "Control_L" | "Control_R" => "Control".into(),
        "Alt_L" | "Alt_R" => "Alt".into(),
        "space" => " ".into(),
        _ => name,
    }
}

/// An event for `el`'s listeners only.
fn dispatch_one(el: &Element, init: EventInit) -> Event {
    let event: Event = glib::Object::new();
    event.imp().init.replace(init);
    event.imp().target.set(Some(el));
    event.imp().time.set(now());
    call(&event, el);
    event
}

fn dispatch_quiet(el: &Element, kind: &str, data: &str) -> Event {
    dispatch_one(
        el,
        EventInit {
            kind: kind.into(),
            data: data.into(),
            ..Default::default()
        },
    )
}

pub fn add_listener(el: &Element, kind: &str) -> i32 {
    let id = NEXT_ID.with(|n| {
        let id = n.get();
        n.set(id + 1);
        id
    });
    let group = controller_group(kind);
    let needs_controller =
        group.is_some_and(|g| !el.listeners().controllers.iter().any(|(k, _)| k == g));
    el.listeners().list.push((kind.to_string(), id));
    if let (true, Some(group)) = (needs_controller, group) {
        let controller = install(el, group);
        el.listeners()
            .controllers
            .push((group.to_string(), controller));
    }
    id
}

pub fn remove_listener(el: &Element, kind: &str, id: i32) -> bool {
    let mut listeners = el.listeners();
    let before = listeners.list.len();
    listeners.list.retain(|(k, i)| !(k == kind && *i == id));
    let removed = listeners.list.len() != before;
    if let Some(group) = controller_group(kind) {
        let still = listeners
            .list
            .iter()
            .any(|(k, _)| controller_group(k) == Some(group));
        if !still {
            if let Some(pos) = listeners.controllers.iter().position(|(g, _)| g == group) {
                let (_, controller) = listeners.controllers.remove(pos);
                if let Some(w) = controller.widget() {
                    w.remove_controller(&controller);
                }
            }
        }
    }
    removed
}

/// Buttons raise click (and Invoked) on a primary press-release.
pub fn attach_button(el: &Element) {
    let gesture = gtk::GestureClick::new();
    let weak = el.downgrade();
    gesture.connect_pressed(move |_, _, _, _| {
        if let Some(el) = weak.upgrade() {
            if let Some(s) = el.text_state_mut().as_mut() {
                s.pressed = true;
            }
            el.queue_draw();
        }
    });
    let weak = el.downgrade();
    gesture.connect_released(move |_, _, _, _| {
        if let Some(el) = weak.upgrade() {
            if let Some(s) = el.text_state_mut().as_mut() {
                s.pressed = false;
            }
            el.queue_draw();
            if el.listeners().has("mason:invoked") {
                dispatch_one(
                    &el,
                    EventInit {
                        kind: "mason:invoked".into(),
                        ..Default::default()
                    },
                );
            }
        }
    });
    let weak = el.downgrade();
    gesture.connect_cancel(move |_, _| {
        if let Some(el) = weak.upgrade() {
            if let Some(s) = el.text_state_mut().as_mut() {
                s.pressed = false;
            }
            el.queue_draw();
        }
    });
    el.add_controller(gesture);
    el.set_cursor_from_name(Some("pointer"));
}
