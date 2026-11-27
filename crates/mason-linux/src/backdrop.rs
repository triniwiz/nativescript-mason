//! backdrop-filter: the layout root records what it paints without backdrop elements, and each
//! backdrop element draws that recording, filtered, under itself.

use crate::css::Filter;
use crate::element::Element;
use crate::paint::{self, BoxGeometry};
use gtk::prelude::*;
use gtk::{glib, graphene, gsk};
use std::cell::{Cell, RefCell};

thread_local! {
    static ELEMENTS: RefCell<Vec<glib::WeakRef<Element>>> = const { RefCell::new(Vec::new()) };
    static RECORDING: Cell<bool> = const { Cell::new(false) };
    static SOURCES: RefCell<Vec<(glib::WeakRef<Element>, gsk::RenderNode)>> = const { RefCell::new(Vec::new()) };
}

pub fn register(el: &Element, has: bool) {
    ELEMENTS.with(|list| {
        let mut list = list.borrow_mut();
        list.retain(|w| w.upgrade().is_some_and(|e| &e != el));
        if has {
            list.push(el.downgrade());
        }
    });
}

/// Whether `el` draws a backdrop or holds one that does.
pub fn involved(el: &Element) -> bool {
    ELEMENTS.with(|list| {
        list.borrow()
            .iter()
            .filter_map(|w| w.upgrade())
            .any(|e| &e == el || e.is_ancestor(el))
    })
}

/// While recording, backdrop elements leave themselves out.
pub fn skip(el: &Element) -> bool {
    RECORDING.with(|r| r.get()) && !el.css_ref().backdrop.is_empty()
}

fn root_of(el: &Element) -> Element {
    let mut root = el.clone();
    while let Some(p) = Element::mason_parent(root.upcast_ref()) {
        root = p;
    }
    root
}

/// What GTK paints under the root, in the root's coordinates: each ancestor's CSS background and
/// border, then its children before the branch holding the root (GTK's cached nodes).
#[allow(deprecated)]
fn behind_root(root: &Element, s: &gtk::Snapshot) {
    let mut chain: Vec<gtk::Widget> = Vec::new();
    let mut cur = root.parent();
    while let Some(w) = cur {
        cur = w.parent();
        chain.push(w);
    }
    let mut path_child: gtk::Widget = root.clone().upcast();
    let mut steps: Vec<(gtk::Widget, gtk::Widget)> = Vec::new();
    for ancestor in &chain {
        steps.push((ancestor.clone(), path_child.clone()));
        path_child = ancestor.clone();
    }
    for (ancestor, branch) in steps.into_iter().rev() {
        let Some(m) = ancestor.compute_transform(root) else {
            continue;
        };
        s.save();
        s.transform_matrix(&m);
        let (w, h) = (ancestor.width() as f64, ancestor.height() as f64);
        s.render_background(&ancestor.style_context(), 0.0, 0.0, w, h);
        s.render_frame(&ancestor.style_context(), 0.0, 0.0, w, h);
        let mut child = ancestor.first_child();
        while let Some(c) = child {
            if c == branch {
                break;
            }
            if c.is_visible() && c.is_child_visible() {
                ancestor.snapshot_child(&c, s);
            }
            child = c.next_sibling();
        }
        s.restore();
    }
}

pub fn record(root: &Element, g: &BoxGeometry) {
    if !involved(root) {
        return;
    }
    let recorded = gtk::Snapshot::new();
    behind_root(root, &recorded);
    RECORDING.with(|r| r.set(true));
    paint::paint_box(root, &recorded, g);
    RECORDING.with(|r| r.set(false));
    let node = recorded.to_node();
    SOURCES.with(|sources| {
        let mut sources = sources.borrow_mut();
        sources.retain(|(w, _)| w.upgrade().is_some_and(|r| &r != root));
        if let Some(node) = node {
            sources.push((root.downgrade(), node));
        }
    });
}

pub fn paint(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry, filters: &[Filter]) {
    if RECORDING.with(|r| r.get()) {
        return;
    }
    let root = root_of(el);
    let Some(node) = SOURCES.with(|sources| {
        sources
            .borrow()
            .iter()
            .find(|(w, _)| w.upgrade().as_ref() == Some(&root))
            .map(|(_, n)| n.clone())
    }) else {
        return;
    };
    let Some(m) = el.compute_transform(&root) else {
        return;
    };
    let Some(inverse) = m.inverse() else { return };
    // only what the blur can reach is drawn
    let reach = filters
        .iter()
        .map(|f| {
            if let Filter::Blur(sigma) = f {
                sigma * 3.0
            } else {
                0.0
            }
        })
        .fold(0.0f32, f32::max);
    let bounds = m.transform_bounds(&graphene::Rect::new(0.0, 0.0, g.w, g.h));
    let area = graphene::Rect::new(
        bounds.x() - reach,
        bounds.y() - reach,
        bounds.width() + reach * 2.0,
        bounds.height() + reach * 2.0,
    );
    s.push_rounded_clip(&g.border_box());
    s.save();
    s.transform_matrix(&inverse);
    let pushes = paint::push_filters(s, filters);
    s.push_clip(&area);
    s.append_node(&node);
    s.pop();
    for _ in 0..pushes {
        s.pop();
    }
    s.restore();
    s.pop();
}
