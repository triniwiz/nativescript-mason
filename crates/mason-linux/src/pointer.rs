//! DOM pointer events from GTK's raw button, motion and touch events, and CSS pointer-events.
//!
//! A legacy controller on each element with pointer listeners sees the events that reach it; the
//! first one to see an event raises it at the element under the pointer and it bubbles from there.

use crate::element::Element;
use crate::events::{self, Event, EventInit};
use gtk::gdk;
use gtk::glib;
use gtk::glib::translate::IntoGlib;
use gtk::prelude::*;
use std::cell::{Cell, RefCell};
use std::collections::HashMap;

pub const TYPES: &[&str] = &[
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "pointerover",
    "pointerout",
    "pointerenter",
    "pointerleave",
    "gotpointercapture",
    "lostpointercapture",
];

const MOUSE_ID: i32 = 1;

struct Pointer {
    id: i32,
    kind: &'static str,
    primary: bool,
    target: glib::WeakRef<Element>,
    capture: glib::WeakRef<Element>,
    pending: Option<glib::WeakRef<Element>>,
    client: (f64, f64),
    buttons: i32,
    cancelled: bool,
}

impl Pointer {
    fn new(id: i32, kind: &'static str, primary: bool) -> Self {
        Self {
            id,
            kind,
            primary,
            target: glib::WeakRef::new(),
            capture: glib::WeakRef::new(),
            pending: None,
            client: (f64::NAN, f64::NAN),
            buttons: 0,
            cancelled: false,
        }
    }
}

/// One input sample: window coordinates plus what the event carried.
#[derive(Clone, Default)]
struct Sample {
    x: f64,
    y: f64,
    button: i32,
    buttons: i32,
    pressure: f64,
    ctrl: bool,
    shift: bool,
    alt: bool,
    meta: bool,
}

thread_local! {
    static POINTERS: RefCell<HashMap<i32, Pointer>> = RefCell::new(HashMap::new());
    static SEQUENCES: RefCell<HashMap<usize, i32>> = RefCell::new(HashMap::new());
    static NEXT_TOUCH: Cell<i32> = const { Cell::new(2) };
    static LAST: Cell<(usize, u32, i32)> = const { Cell::new((0, 0, -1)) };
    static HOVER_GEN: Cell<u64> = const { Cell::new(0) };
}

/// The controllers raising pointer events for `listener`, on the widget that draws it.
pub fn install(host: &Element) -> Vec<gtk::EventController> {
    let legacy = gtk::EventControllerLegacy::new();
    legacy.connect_event(|c, event| {
        if let Some(widget) = c.widget() {
            handle(&widget, event);
        }
        glib::Propagation::Proceed
    });
    let motion = gtk::EventControllerMotion::new();
    motion.connect_leave(|_| hover_ended());
    host.add_controller(legacy.clone());
    host.add_controller(motion.clone());
    vec![legacy.upcast(), motion.upcast()]
}

fn first_sight(event: &gdk::Event) -> bool {
    let key = (
        event.as_ptr() as usize,
        event.time(),
        event.event_type().into_glib(),
    );
    LAST.with(|l| {
        if l.get() == key {
            false
        } else {
            l.set(key);
            true
        }
    })
}

fn dom_button(gdk_button: u32) -> i32 {
    match gdk_button {
        1 => 0,
        2 => 1,
        3 => 2,
        8 => 3,
        9 => 4,
        _ => 0,
    }
}

fn button_bit(gdk_button: u32) -> i32 {
    match gdk_button {
        1 => 1,
        3 => 2,
        2 => 4,
        8 => 8,
        9 => 16,
        _ => 0,
    }
}

fn held_buttons(state: gdk::ModifierType) -> i32 {
    let mut buttons = 0;
    if state.contains(gdk::ModifierType::BUTTON1_MASK) {
        buttons |= 1;
    }
    if state.contains(gdk::ModifierType::BUTTON3_MASK) {
        buttons |= 2;
    }
    if state.contains(gdk::ModifierType::BUTTON2_MASK) {
        buttons |= 4;
    }
    buttons
}

fn sample(event: &gdk::Event, x: f64, y: f64) -> Sample {
    let state = event.modifier_state();
    Sample {
        x,
        y,
        button: -1,
        buttons: held_buttons(state),
        pressure: event.axis(gdk::AxisUse::Pressure).unwrap_or(0.5),
        ctrl: state.contains(gdk::ModifierType::CONTROL_MASK),
        shift: state.contains(gdk::ModifierType::SHIFT_MASK),
        alt: state.contains(gdk::ModifierType::ALT_MASK),
        meta: state.contains(gdk::ModifierType::META_MASK)
            || state.contains(gdk::ModifierType::SUPER_MASK),
    }
}

fn device_kind(event: &gdk::Event) -> &'static str {
    let pen = event
        .device_tool()
        .map(|t| {
            matches!(
                t.tool_type(),
                gdk::DeviceToolType::Pen | gdk::DeviceToolType::Eraser
            )
        })
        .unwrap_or(false);
    if pen {
        "pen"
    } else {
        "mouse"
    }
}

/// The event's position in its native widget (the window), and that widget.
fn window_point(widget: &gtk::Widget, event: &gdk::Event) -> Option<(gtk::Widget, f64, f64)> {
    let (x, y) = event.position()?;
    let native = widget.native()?;
    let (sx, sy) = native.surface_transform();
    Some((native.upcast(), x - sx, y - sy))
}

/// The element under a point of the window: what's picked there, or the nested text drawn there.
fn target_at(window: &gtk::Widget, x: f64, y: f64) -> Option<Element> {
    let picked = window.pick(x, y, gtk::PickFlags::DEFAULT)?;
    let mut cur = Some(picked);
    let mut target = None;
    while let Some(w) = cur {
        if let Ok(el) = w.clone().downcast::<Element>() {
            target = Some(el);
            break;
        }
        cur = w.parent();
    }
    let mut target = target?;
    if target.text_state().is_some() {
        if let Some(p) = window.compute_point(&target, &gtk::graphene::Point::new(x as f32, y as f32)) {
            target = crate::text::hit_text(&target, p.x() as f64, p.y() as f64);
        }
    }
    let mut node = Some(target);
    while let Some(el) = node.clone() {
        if el.pointer_events() != 1 {
            return Some(el);
        }
        node = events::parent(&el);
    }
    None
}

fn handle(widget: &gtk::Widget, event: &gdk::Event) {
    use gdk::EventType as T;
    let kind = event.event_type();
    if !matches!(
        kind,
        T::ButtonPress
            | T::ButtonRelease
            | T::MotionNotify
            | T::TouchBegin
            | T::TouchUpdate
            | T::TouchEnd
            | T::TouchCancel
    ) {
        return;
    }
    if !first_sight(event) {
        return;
    }
    let Some((window, x, y)) = window_point(widget, event) else {
        return;
    };
    let hit = || target_at(&window, x, y);
    match kind {
        T::ButtonPress | T::ButtonRelease => {
            let Some(button) = event.downcast_ref::<gdk::ButtonEvent>().map(|b| b.button()) else {
                return;
            };
            let device = device_kind(event);
            let id = if device == "mouse" { MOUSE_ID } else { 2 };
            let mut s = sample(event, x, y);
            let before = s.buttons;
            let pressed = kind == T::ButtonPress;
            s.buttons = if pressed {
                before | button_bit(button)
            } else {
                before & !button_bit(button)
            };
            s.button = dom_button(button);
            if pressed && before == 0 {
                begin(id, device);
                down(id, s, hit(), &window);
            } else if !pressed && s.buttons == 0 {
                up(id, s, hit, &window);
            } else {
                // Another button on a pointer already down: a pointermove, as in the DOM.
                movement(id, s, hit, &window, true);
            }
        }
        T::MotionNotify => {
            let device = device_kind(event);
            let id = if device == "mouse" { MOUSE_ID } else { 2 };
            let s = sample(event, x, y);
            HOVER_GEN.with(|g| g.set(g.get() + 1));
            if !POINTERS.with(|p| p.borrow().contains_key(&id)) {
                begin(id, device);
            }
            movement(id, s, hit, &window, false);
        }
        _ => {
            let key = event.event_sequence().as_ptr() as usize;
            let mut s = sample(event, x, y);
            match kind {
                T::TouchBegin => {
                    let id = NEXT_TOUCH.with(|n| {
                        let id = n.get();
                        n.set(id + 1);
                        id
                    });
                    SEQUENCES.with(|m| m.borrow_mut().insert(key, id));
                    s.button = 0;
                    s.buttons = 1;
                    begin(id, "touch");
                    down(id, s, hit(), &window);
                }
                T::TouchUpdate => {
                    if let Some(id) = SEQUENCES.with(|m| m.borrow().get(&key).copied()) {
                        s.buttons = 1;
                        movement(id, s, hit, &window, false);
                    }
                }
                T::TouchEnd => {
                    if let Some(id) = SEQUENCES.with(|m| m.borrow_mut().remove(&key)) {
                        s.button = 0;
                        s.buttons = 0;
                        up(id, s, hit, &window);
                    }
                }
                _ => {
                    if let Some(id) = SEQUENCES.with(|m| m.borrow_mut().remove(&key)) {
                        cancel(id);
                    }
                }
            }
        }
    }
}

fn begin(id: i32, kind: &'static str) {
    POINTERS.with(|p| {
        let mut p = p.borrow_mut();
        if let Some(existing) = p.get_mut(&id) {
            if existing.kind == kind && kind != "touch" {
                existing.cancelled = false;
                return;
            }
        }
        let primary = kind == "mouse" || !p.values().any(|o| o.kind == kind);
        p.insert(id, Pointer::new(id, kind, primary));
    });
}

fn with_pointer<R>(id: i32, f: impl FnOnce(&mut Pointer) -> R) -> Option<R> {
    POINTERS.with(|p| p.borrow_mut().get_mut(&id).map(f))
}

fn end(id: i32) {
    POINTERS.with(|p| p.borrow_mut().remove(&id));
}

fn down(id: i32, s: Sample, target: Option<Element>, window: &gtk::Widget) {
    let Some(init) = build(id, "pointerdown", &s) else {
        return;
    };
    retarget(id, target.clone(), &init, Some(window));
    let direct = with_pointer(id, |p| p.kind != "mouse").unwrap_or(false);
    if direct {
        // Touch and pen are captured to their target, as if setPointerCapture ran before pointerdown.
        if let Some(t) = &target {
            with_pointer(id, |p| p.pending = Some(t.downgrade()));
        }
    }
    fire(target.as_ref(), init, Some(window));
}

fn movement(id: i32, s: Sample, hit: impl FnOnce() -> Option<Element>, window: &gtk::Widget, chord: bool) {
    let skip = with_pointer(id, |p| p.cancelled || (!chord && p.client == (s.x, s.y))).unwrap_or(true);
    if skip {
        return;
    }
    let Some(init) = build(id, "pointermove", &s) else {
        return;
    };
    process_pending(id, &init, Some(window));
    let (captured, mouse) = with_pointer(id, |p| (p.capture.upgrade().is_some(), p.kind == "mouse")).unwrap_or((false, false));
    if !captured && mouse {
        retarget(id, hit(), &init, Some(window));
    }
    fire(current(id).as_ref(), init, Some(window));
}

fn up(id: i32, s: Sample, hit: impl FnOnce() -> Option<Element>, window: &gtk::Widget) {
    let Some((cancelled, kind)) = with_pointer(id, |p| (p.cancelled, p.kind)) else {
        return;
    };
    if cancelled {
        if kind == "mouse" {
            with_pointer(id, |p| p.cancelled = false);
        } else {
            end(id);
        }
        return;
    }
    let Some(init) = build(id, "pointerup", &s) else {
        return;
    };
    process_pending(id, &init, Some(window));
    let captured = with_pointer(id, |p| p.capture.upgrade().is_some()).unwrap_or(false);
    if !captured && kind == "mouse" {
        retarget(id, hit(), &init, Some(window));
    }
    fire(current(id).as_ref(), init.clone(), Some(window));
    release(id, &init, Some(window));
    if kind != "mouse" {
        retarget(id, None, &init, Some(window));
        end(id);
    }
}

fn cancel(id: i32) {
    let Some((cancelled, x, y)) = with_pointer(id, |p| (p.cancelled, p.client.0, p.client.1)) else {
        return;
    };
    if cancelled {
        return;
    }
    with_pointer(id, |p| p.cancelled = true);
    let s = Sample {
        x,
        y,
        ..Default::default()
    };
    let Some(init) = build(id, "pointercancel", &s) else {
        return;
    };
    fire(current(id).as_ref(), init.clone(), None);
    release(id, &init, None);
    retarget(id, None, &init, None);
    end(id);
}

/// The mouse left an element with pointer listeners. Settled on idle: it may have only moved to another one.
fn hover_ended() {
    let generation = HOVER_GEN.with(|g| {
        g.set(g.get() + 1);
        g.get()
    });
    glib::idle_add_local_once(move || {
        if HOVER_GEN.with(|g| g.get()) != generation {
            return;
        }
        let Some((buttons, x, y)) = with_pointer(MOUSE_ID, |p| (p.buttons, p.client.0, p.client.1)) else {
            return;
        };
        if buttons != 0 {
            return;
        }
        let s = Sample {
            x,
            y,
            ..Default::default()
        };
        if let Some(init) = build(MOUSE_ID, "pointerout", &s) {
            retarget(MOUSE_ID, None, &init, None);
        }
        end(MOUSE_ID);
    });
}

fn current(id: i32) -> Option<Element> {
    with_pointer(id, |p| p.capture.upgrade().or_else(|| p.target.upgrade())).flatten()
}

fn build(id: i32, kind: &str, s: &Sample) -> Option<EventInit> {
    with_pointer(id, |p| {
        // Bubbled here, so reported as not bubbling: a host framework's DOM shim re-dispatching
        // it must not bubble it again.
        let mut init = EventInit {
            kind: kind.to_string(),
            bubbles: false,
            cancelable: matches!(
                kind,
                "pointerdown" | "pointermove" | "pointerup" | "pointerover" | "pointerout"
            ),
            ctrl: s.ctrl,
            shift: s.shift,
            alt: s.alt,
            meta: s.meta,
            button: s.button,
            buttons: s.buttons,
            pointer_id: p.id,
            pointer_type: p.kind.to_string(),
            is_primary: p.primary,
            client_x: s.x,
            client_y: s.y,
            x: s.x,
            y: s.y,
            pressure: if s.buttons == 0 { 0.0 } else { s.pressure },
            width: 1.0,
            height: 1.0,
            ..Default::default()
        };
        if !p.client.0.is_nan() && !s.x.is_nan() {
            init.movement_x = s.x - p.client.0;
            init.movement_y = s.y - p.client.1;
        }
        if !s.x.is_nan() {
            p.client = (s.x, s.y);
        }
        p.buttons = s.buttons;
        init
    })
}

fn with_offset(mut init: EventInit, target: &Element, window: Option<&gtk::Widget>) -> EventInit {
    if let Some(window) = window {
        let p = gtk::graphene::Point::new(init.client_x as f32, init.client_y as f32);
        if let Some(local) = window.compute_point(target, &p) {
            init.offset_x = local.x() as f64;
            init.offset_y = local.y() as f64;
        }
    }
    init
}

/// Raises the event at `target` and bubbles it through its Mason ancestors.
fn fire(target: Option<&Element>, init: EventInit, window: Option<&gtk::Widget>) {
    let Some(target) = target else {
        return;
    };
    let event = events::make(target, with_offset(init, target, window));
    for el in events::chain(target) {
        events::call(&event, &el);
        if event.propagation_stopped() {
            break;
        }
    }
}

fn related(kind: &str, from: &EventInit, related: Option<&Element>) -> EventInit {
    let mut init = from.clone();
    init.kind = kind.to_string();
    init.cancelable = kind == "pointerover" || kind == "pointerout";
    init.related = related.map(|r| r.downgrade()).unwrap_or_default();
    init
}

fn retarget(id: i32, target: Option<Element>, from: &EventInit, window: Option<&gtk::Widget>) {
    let Some(old) = with_pointer(id, |p| {
        let old = p.target.upgrade();
        p.target.set(target.as_ref());
        old
    }) else {
        return;
    };
    if old == target {
        return;
    }
    let old_chain = old.as_ref().map(events::chain).unwrap_or_default();
    let new_chain = target.as_ref().map(events::chain).unwrap_or_default();
    if let Some(old) = &old {
        fire(Some(old), related("pointerout", from, target.as_ref()), window);
        for el in &old_chain {
            if new_chain.contains(el) {
                break;
            }
            if el.has_listener("pointerleave") {
                events::dispatch_one(el, with_offset(related("pointerleave", from, target.as_ref()), el, window));
            }
        }
    }
    if let Some(t) = &target {
        fire(Some(t), related("pointerover", from, old.as_ref()), window);
        for el in new_chain.iter().rev() {
            if old_chain.contains(el) || !el.has_listener("pointerenter") {
                continue;
            }
            events::dispatch_one(el, with_offset(related("pointerenter", from, old.as_ref()), el, window));
        }
    }
}

fn process_pending(id: i32, from: &EventInit, window: Option<&gtk::Widget>) {
    let Some(Some(pending)) = with_pointer(id, |p| p.pending.take()) else {
        return;
    };
    let next = pending.upgrade();
    let previous = with_pointer(id, |p| p.capture.upgrade()).flatten();
    if next == previous {
        return;
    }
    with_pointer(id, |p| p.capture.set(next.as_ref()));
    if let Some(previous) = &previous {
        fire(Some(previous), related("lostpointercapture", from, None), window);
    }
    if let Some(next) = &next {
        fire(Some(next), related("gotpointercapture", from, None), window);
        retarget(id, Some(next.clone()), from, window);
    }
}

fn release(id: i32, from: &EventInit, window: Option<&gtk::Widget>) {
    let previous = with_pointer(id, |p| {
        p.pending = None;
        let previous = p.capture.upgrade();
        p.capture.set(None);
        previous
    })
    .flatten();
    if let Some(previous) = previous {
        fire(Some(&previous), related("lostpointercapture", from, None), window);
    }
}

pub fn set_capture(el: &Element, id: i32) -> bool {
    with_pointer(id, |p| {
        if p.kind == "mouse" && p.buttons == 0 {
            return false;
        }
        p.pending = Some(el.downgrade());
        true
    })
    .unwrap_or(false)
}

pub fn release_capture(el: &Element, id: i32) {
    if has_capture(el, id) {
        with_pointer(id, |p| p.pending = Some(glib::WeakRef::new()));
    }
}

pub fn has_capture(el: &Element, id: i32) -> bool {
    with_pointer(id, |p| {
        let current = match &p.pending {
            Some(pending) => pending.upgrade(),
            None => p.capture.upgrade(),
        };
        current.as_ref() == Some(el)
    })
    .unwrap_or(false)
}

/// pointerover/out/enter/leave: the element the pointer came from or went to.
pub fn related_target(event: &Event) -> Option<Element> {
    event.init().related.upgrade()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::element::Kind;

    thread_local! {
        static NAMES: RefCell<HashMap<i32, String>> = RefCell::new(HashMap::new());
        static LOG: RefCell<Vec<String>> = RefCell::new(Vec::new());
        static ELEMENTS: RefCell<Vec<(Element, &'static str)>> = RefCell::new(Vec::new());
    }

    extern "C" fn record(_id: i32, ev: *mut glib::gobject_ffi::GObject) {
        let ev: glib::Object = unsafe { glib::translate::from_glib_none(ev) };
        let ev = ev.downcast::<Event>().unwrap();
        let name = ev
            .target()
            .and_then(|t| ELEMENTS.with(|e| e.borrow().iter().find(|(el, _)| *el == t).map(|(_, n)| *n)))
            .unwrap_or("?");
        LOG.with(|l| l.borrow_mut().push(format!("{}:{}", ev.init().kind, name)));
    }

    /// root with children a and b; every pointer event reaching root is logged.
    fn tree() -> (Element, Element, Element) {
        gtk::init().expect("gtk");
        events::set_dispatcher(Some(record));
        let root = Element::new(Kind::View);
        let a = Element::new(Kind::View);
        let b = Element::new(Kind::View);
        a.set_parent(&root);
        b.set_parent(&root);
        ELEMENTS.with(|e| *e.borrow_mut() = vec![(root.clone(), "root"), (a.clone(), "a"), (b.clone(), "b")]);
        for kind in TYPES {
            let id = events::add_listener(&root, kind);
            NAMES.with(|n| n.borrow_mut().insert(id, kind.to_string()));
        }
        LOG.with(|l| l.borrow_mut().clear());
        POINTERS.with(|p| p.borrow_mut().clear());
        (root, a, b)
    }

    fn log() -> Vec<String> {
        LOG.with(|l| l.borrow().clone())
    }

    fn at(x: f64, y: f64, buttons: i32) -> Sample {
        Sample {
            x,
            y,
            button: 0,
            buttons,
            pressure: 0.5,
            ..Default::default()
        }
    }

    #[test]
    fn pointer_sequences() {
        let (root, a, b) = tree();
        let window: gtk::Widget = root.clone().upcast();

        // A touch: boundary events, implicit capture, and its end.
        begin(7, "touch");
        down(7, at(75.0, 75.0, 1), Some(b.clone()), &window);
        movement(7, Sample { button: -1, ..at(20.0, 20.0, 1) }, || Some(a.clone()), &window, false);
        up(7, at(20.0, 20.0, 0), || Some(a.clone()), &window);
        assert_eq!(
            log(),
            [
                "pointerover:b", "pointerenter:root", "pointerdown:b", "gotpointercapture:b",
                "pointermove:b", "pointerup:b", "lostpointercapture:b", "pointerout:b", "pointerleave:root"
            ]
        );

        // A mouse follows what's under it until captured.
        LOG.with(|l| l.borrow_mut().clear());
        begin(MOUSE_ID, "mouse");
        down(MOUSE_ID, at(10.0, 10.0, 1), Some(a.clone()), &window);
        movement(MOUSE_ID, at(80.0, 80.0, 1), || Some(b.clone()), &window, false);
        assert!(set_capture(&root, MOUSE_ID));
        assert!(has_capture(&root, MOUSE_ID));
        movement(MOUSE_ID, at(90.0, 90.0, 1), || Some(a.clone()), &window, false);
        up(MOUSE_ID, at(90.0, 90.0, 0), || Some(a.clone()), &window);
        let moves: Vec<String> = log().into_iter().filter(|e| !e.contains("enter") && !e.contains("leave")).collect();
        assert_eq!(
            moves,
            [
                "pointerover:a", "pointerdown:a", "pointerout:a", "pointerover:b", "pointermove:b",
                "gotpointercapture:root", "pointerout:b", "pointerover:root", "pointermove:root",
                "pointerup:root", "lostpointercapture:root"
            ]
        );
        // A released mouse button can't be captured.
        assert!(!set_capture(&root, MOUSE_ID));

        // A cancelled touch ends with pointercancel and its boundary events.
        LOG.with(|l| l.borrow_mut().clear());
        begin(8, "touch");
        down(8, at(5.0, 5.0, 1), Some(a.clone()), &window);
        cancel(8);
        assert_eq!(log()[log().len() - 3..], ["pointercancel:a", "pointerout:a", "pointerleave:root"]);
        assert!(!POINTERS.with(|p| p.borrow().contains_key(&8)));

        // pointer-events: none leaves the element out of hit testing (children are picked first).
        b.set_pointer_events(1);
        assert!(!b.contains(1.0, 1.0));
        assert_eq!(target_at_element(&b), Some(root.clone()));
    }

    fn target_at_element(el: &Element) -> Option<Element> {
        let mut node = Some(el.clone());
        while let Some(e) = node.clone() {
            if e.pointer_events() != 1 {
                return Some(e);
            }
            node = events::parent(&e);
        }
        None
    }
}
