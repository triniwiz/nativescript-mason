//! overflow: scroll / auto on Mason elements: the element offsets its children itself, with wheel,
//! touchpad (kinetic) and touch-drag input and overlay indicators.

use crate::element::Element;
use crate::events::{self, EventInit};
use crate::paint::BoxGeometry;
use gtk::prelude::*;
use gtk::{glib, graphene, gsk};
use mason_core::style::StyleKeys;
use std::cell::Cell;

const SCROLL: u8 = 2;
const AUTO: u8 = 4;
const INDICATOR_MS: i64 = 900;

pub struct ScrollState {
    x: Cell<f64>,
    y: Cell<f64>,
    /// Monotonic time of the last scroll, for the indicators.
    last: Cell<i64>,
    velocity: Cell<(f64, f64)>,
    ticking: Cell<bool>,
    drag_origin: Cell<(f64, f64)>,
    controllers: Vec<gtk::EventController>,
}

/// Axes the element scrolls: (horizontal, vertical). A `<scroll>` content element scrolls through
/// its GtkScrolledWindow instead.
fn axes(el: &Element) -> (bool, bool) {
    if el.parent().is_some_and(|p| p.is::<gtk::Viewport>()) {
        return (false, false);
    }
    let s = el.style();
    let scrolls = |v: u8| v == SCROLL || v == AUTO;
    (
        scrolls(s.u8(StyleKeys::OVERFLOW_X)),
        scrolls(s.u8(StyleKeys::OVERFLOW_Y)),
    )
}

pub fn active(el: &Element) -> bool {
    el.scroll_state().is_some()
}

pub fn offset(el: &Element) -> (f32, f32) {
    el.scroll_state()
        .as_ref()
        .map_or((0.0, 0.0), |s| (s.x.get() as f32, s.y.get() as f32))
}

/// Largest offsets: the scrollable overflow beyond the padding box.
pub fn max_offset(el: &Element) -> (f64, f64) {
    let (ew, eh) = el.scroll_extent();
    let (w, h) = el.layout_size();
    ((ew - w).max(0.0) as f64, (eh - h).max(0.0) as f64)
}

/// Padding box size: what the user sees of the content.
pub fn client_size(el: &Element) -> (f64, f64) {
    let g = BoxGeometry::of(el);
    let [t, r, b, l] = g.border;
    ((g.w - l - r).max(0.0) as f64, (g.h - t - b).max(0.0) as f64)
}

/// Creates or drops the scrolling state as the overflow style says; called on allocation.
pub fn sync(el: &Element) {
    let (h, v) = axes(el);
    let has = el.scroll_state().is_some();
    if (h || v) == has {
        if has {
            // content may have shrunk
            let (mx, my) = max_offset(el);
            if let Some(s) = el.scroll_state().as_ref() {
                s.x.set(s.x.get().clamp(0.0, mx));
                s.y.set(s.y.get().clamp(0.0, my));
            }
        }
        return;
    }
    if has {
        if let Some(state) = el.scroll_state_mut().take() {
            for c in state.controllers {
                el.remove_controller(&c);
            }
        }
        return;
    }
    let controllers = vec![wheel(el), touch_drag(el)];
    for c in &controllers {
        el.add_controller(c.clone());
    }
    el.scroll_state_mut().replace(ScrollState {
        x: Cell::new(0.0),
        y: Cell::new(0.0),
        last: Cell::new(0),
        velocity: Cell::new((0.0, 0.0)),
        ticking: Cell::new(false),
        drag_origin: Cell::new((0.0, 0.0)),
        controllers,
    });
}

/// Moves the content; returns whether it moved. NaN keeps an axis.
pub fn scroll_to(el: &Element, x: f64, y: f64) -> bool {
    let (mx, my) = max_offset(el);
    let (h, v) = axes(el);
    let moved = {
        let guard = el.scroll_state();
        let Some(s) = guard.as_ref() else {
            return false;
        };
        let nx = if x.is_nan() || !h {
            s.x.get()
        } else {
            x.clamp(0.0, mx)
        };
        let ny = if y.is_nan() || !v {
            s.y.get()
        } else {
            y.clamp(0.0, my)
        };
        let moved = (nx - s.x.get()).abs() > 0.01 || (ny - s.y.get()).abs() > 0.01;
        s.x.set(nx);
        s.y.set(ny);
        if moved {
            s.last.set(glib::monotonic_time() / 1000);
        }
        moved
    };
    if moved {
        el.queue_allocate();
        el.queue_draw();
        // hide the indicators once scrolling stops
        let weak = el.downgrade();
        glib::timeout_add_local_once(
            std::time::Duration::from_millis(INDICATOR_MS as u64 + 50),
            move || {
                if let Some(el) = weak.upgrade() {
                    el.queue_draw();
                }
            },
        );
        events::dispatch(
            el,
            EventInit {
                kind: "scroll".into(),
                ..Default::default()
            },
        );
    }
    moved
}

pub fn scroll_by(el: &Element, dx: f64, dy: f64) -> bool {
    let (x, y) = offset(el);
    scroll_to(el, x as f64 + dx, y as f64 + dy)
}

/// GtkScrolledWindow's step: the page size to the power 2/3.
fn step(el: &Element) -> (f64, f64) {
    let (w, h) = client_size(el);
    (w.max(1.0).powf(2.0 / 3.0), h.max(1.0).powf(2.0 / 3.0))
}

fn wheel(el: &Element) -> gtk::EventController {
    let c = gtk::EventControllerScroll::new(
        gtk::EventControllerScrollFlags::BOTH_AXES | gtk::EventControllerScrollFlags::KINETIC,
    );
    let weak = el.downgrade();
    c.connect_scroll(move |_, dx, dy| {
        let Some(el) = weak.upgrade() else {
            return glib::Propagation::Proceed;
        };
        stop_kinetic(&el);
        let (sx, sy) = step(&el);
        // an element that can't move further lets its parent scroll
        if scroll_by(&el, dx * sx, dy * sy) {
            glib::Propagation::Stop
        } else {
            glib::Propagation::Proceed
        }
    });
    let weak = el.downgrade();
    c.connect_decelerate(move |_, vx, vy| {
        if let Some(el) = weak.upgrade() {
            let (sx, sy) = step(&el);
            start_kinetic(&el, vx * sx, vy * sy);
        }
    });
    c.upcast()
}

fn touch_drag(el: &Element) -> gtk::EventController {
    let drag = gtk::GestureDrag::new();
    drag.set_touch_only(true);
    let weak = el.downgrade();
    drag.connect_drag_begin(move |_, _, _| {
        if let Some(el) = weak.upgrade() {
            stop_kinetic(&el);
            let (x, y) = offset(&el);
            if let Some(s) = el.scroll_state().as_ref() {
                s.drag_origin.set((x as f64, y as f64));
            }
        }
    });
    let weak = el.downgrade();
    drag.connect_drag_update(move |g, dx, dy| {
        if let Some(el) = weak.upgrade() {
            let origin = el
                .scroll_state()
                .as_ref()
                .map_or((0.0, 0.0), |s| s.drag_origin.get());
            if scroll_to(&el, origin.0 - dx, origin.1 - dy) {
                g.set_state(gtk::EventSequenceState::Claimed);
            }
        }
    });
    drag.upcast()
}

fn stop_kinetic(el: &Element) {
    if let Some(s) = el.scroll_state().as_ref() {
        s.velocity.set((0.0, 0.0));
    }
}

fn start_kinetic(el: &Element, vx: f64, vy: f64) {
    let start = {
        let guard = el.scroll_state();
        let Some(s) = guard.as_ref() else { return };
        s.velocity.set((vx, vy));
        !s.ticking.replace(true)
    };
    if !start {
        return;
    }
    let last = Cell::new(0i64);
    el.add_tick_callback(move |widget, clock| {
        let Ok(el) = widget.clone().downcast::<Element>() else {
            return glib::ControlFlow::Break;
        };
        let now = clock.frame_time();
        let dt = if last.get() == 0 {
            1.0 / 60.0
        } else {
            (now - last.get()) as f64 / 1_000_000.0
        };
        last.set(now);
        let (vx, vy) = el
            .scroll_state()
            .as_ref()
            .map_or((0.0, 0.0), |s| s.velocity.get());
        let moved = scroll_by(&el, vx * dt, vy * dt);
        // exponential friction
        let k = (-4.0 * dt).exp();
        let (vx, vy) = (vx * k, vy * k);
        let done = !moved || vx.hypot(vy) < 10.0;
        if let Some(s) = el.scroll_state().as_ref() {
            s.velocity.set(if done { (0.0, 0.0) } else { (vx, vy) });
            if done {
                s.ticking.set(false);
            }
        }
        if done {
            glib::ControlFlow::Break
        } else {
            glib::ControlFlow::Continue
        }
    });
}

/// Overlay indicators while the content moves.
pub fn snapshot_indicators(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry) {
    let Some(last) = el.scroll_state().as_ref().map(|st| st.last.get()) else {
        return;
    };
    if glib::monotonic_time() / 1000 - last > INDICATOR_MS {
        return;
    }
    let (x, y) = offset(el);
    let (mx, my) = max_offset(el);
    let (cw, ch) = client_size(el);
    let [bt, br, bb, bl] = g.border;
    let color = gtk::gdk::RGBA::new(0.0, 0.0, 0.0, 0.45);
    let thickness = 4.0f32;
    let bar = |rect: graphene::Rect| {
        let r = thickness / 2.0;
        s.push_rounded_clip(&gsk::RoundedRect::new(
            rect,
            graphene::Size::new(r, r),
            graphene::Size::new(r, r),
            graphene::Size::new(r, r),
            graphene::Size::new(r, r),
        ));
        s.append_color(&color, &rect);
        s.pop();
    };
    if my > 0.0 && ch > 0.0 {
        let len = (ch * ch / (ch + my)).max(24.0) as f32;
        let pos = bt + ((ch as f32 - len) * (y / my as f32)).max(0.0);
        bar(graphene::Rect::new(
            g.w - br - thickness - 2.0,
            pos,
            thickness,
            len,
        ));
    }
    if mx > 0.0 && cw > 0.0 {
        let len = (cw * cw / (cw + mx)).max(24.0) as f32;
        let pos = bl + ((cw as f32 - len) * (x / mx as f32)).max(0.0);
        bar(graphene::Rect::new(
            pos,
            g.h - bb - thickness - 2.0,
            len,
            thickness,
        ));
    }
}
