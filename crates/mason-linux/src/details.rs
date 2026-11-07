//! `<details>` / `<summary>`: a closed details lays out only its summary.

use crate::element::{Element, ROLE_DETAILS, ROLE_SUMMARY};
use crate::events::{self, EventInit};
use gtk::prelude::*;

const HIDDEN_KEY: &str = "mason-details-hidden";

fn summary_of(details: &Element) -> Option<gtk::Widget> {
    let mut child = details.first_child();
    while let Some(c) = child {
        let view = c
            .downcast_ref::<Element>()
            .cloned()
            .or_else(|| crate::element::scroll_content(&c));
        if view.is_some_and(|v| v.role() == ROLE_SUMMARY) {
            return Some(c);
        }
        child = c.next_sibling();
    }
    None
}

fn hide_closed_content(details: &Element) {
    let closed = details.role() == ROLE_DETAILS && !details.open();
    let summary = if details.role() == ROLE_DETAILS {
        summary_of(details)
    } else {
        None
    };
    let mut child = details.first_child();
    while let Some(c) = child {
        child = c.next_sibling();
        if crate::element::is_internal(&c) {
            continue;
        }
        let hidden_here = unsafe { c.data::<bool>(HIDDEN_KEY).is_some() };
        let hide = closed && Some(&c) != summary.as_ref();
        if hide && c.is_visible() {
            c.set_visible(false);
            unsafe { c.set_data(HIDDEN_KEY, true) };
        } else if !hide && hidden_here {
            unsafe {
                let _ = c.steal_data::<bool>(HIDDEN_KEY);
            }
            c.set_visible(true);
        }
    }
    details.mark_children_dirty();
}

pub fn role_changed(el: &Element) {
    if el.role() == ROLE_SUMMARY && unsafe { el.data::<bool>("mason-summary").is_none() } {
        unsafe { el.set_data("mason-summary", true) };
        let gesture = gtk::GestureClick::new();
        let weak = el.downgrade();
        gesture.connect_released(move |_, n, _, _| {
            if n != 1 {
                return;
            }
            if let Some(summary) = weak.upgrade() {
                activate(&summary);
            }
        });
        el.add_controller(gesture);
        el.set_cursor_from_name(Some("pointer"));
    }
    hide_closed_content(el);
}

pub fn open_changed(el: &Element) {
    hide_closed_content(el);
    // the summary marker follows
    if let Some(summary) = summary_of(el) {
        summary.queue_draw();
    }
}

pub fn details_of(summary: &Element) -> Option<Element> {
    if summary.role() != ROLE_SUMMARY {
        return None;
    }
    let mut parent = summary.parent();
    if parent
        .as_ref()
        .is_some_and(|p| p.is::<gtk::Viewport>() || p.is::<gtk::ScrolledWindow>())
    {
        parent = parent.and_then(|p| p.parent());
    }
    parent
        .and_then(|p| p.downcast::<Element>().ok())
        .filter(|d| d.role() == ROLE_DETAILS)
}

fn activate(summary: &Element) {
    let Some(details) = details_of(summary) else {
        return;
    };
    let open = !details.open();
    details.set_open(open);
    events::dispatch(
        &details,
        EventInit {
            kind: "toggle".into(),
            data: if open { "open".into() } else { "closed".into() },
            ..Default::default()
        },
    );
}

pub fn child_added(el: &Element, _child: &gtk::Widget) {
    if el.role() == ROLE_DETAILS {
        hide_closed_content(el);
    }
}

pub fn sync_display(_el: &Element) {}
