//! `MasonElement`: the GTK widget behind every Mason element; the layout root computes the tree.

use crate::engine::{self, mason, StyleView};
use crate::{
    css::CssState, events::Listeners, image::ImageState, input::InputState, paint, text::TextState,
};
use gtk::glib::translate::*;
use gtk::prelude::*;
use gtk::subclass::prelude::*;
use gtk::{glib, graphene, gsk};
use mason_core::style::StyleKeys;
use mason_core::{AvailableSpace, Id, NodeRef, Size};
use std::cell::{Cell, RefCell};

#[repr(i32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum Kind {
    #[default]
    View = 0,
    Text = 1,
    Image = 2,
    Button = 3,
    Li = 4,
    Br = 5,
    List = 6,
    Input = 7,
    TextArea = 8,
}

impl Kind {
    pub fn from_i32(v: i32) -> Kind {
        match v {
            1 => Kind::Text,
            2 => Kind::Image,
            3 => Kind::Button,
            4 => Kind::Li,
            5 => Kind::Br,
            6 => Kind::List,
            7 => Kind::Input,
            8 => Kind::TextArea,
            _ => Kind::View,
        }
    }

    pub fn is_text(self) -> bool {
        matches!(self, Kind::Text | Kind::Button)
    }
}

/// `<details>` / `<summary>` roles, as View.Role on Windows.
pub const ROLE_DETAILS: i32 = 1;
pub const ROLE_SUMMARY: i32 = 2;

mod imp {
    use super::*;

    #[derive(Default)]
    pub struct Element {
        pub kind: Cell<Kind>,
        pub node: RefCell<Option<NodeRef>>,
        pub children_dirty: Cell<bool>,
        /// Size the last root compute ran at.
        pub computed_for: Cell<(f32, f32)>,
        pub role: Cell<i32>,
        pub open: Cell<bool>,
        pub css: RefCell<CssState>,
        pub text: RefCell<Option<TextState>>,
        pub image: RefCell<Option<ImageState>>,
        pub input: RefCell<Option<InputState>>,
        pub listeners: RefCell<Listeners>,
        pub list_ordered: Cell<bool>,
        pub scroll: RefCell<Option<crate::scroll::ScrollState>>,
        /// Size of the last allocation, and whether a `mason:layout` is queued for it.
        pub allocated: Cell<(i32, i32)>,
        pub layout_pending: Cell<bool>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for Element {
        const NAME: &'static str = "MasonElement";
        type Type = super::Element;
        type ParentType = gtk::Widget;
    }

    impl ObjectImpl for Element {
        fn dispose(&self) {
            let obj = self.obj();
            if let Some(input) = self.input.borrow_mut().take() {
                input.dispose();
            }
            while let Some(child) = obj.first_child() {
                child.unparent();
            }
            if let Some(node) = self.node.borrow_mut().take() {
                mason().set_measure(node.id(), None, std::ptr::null_mut());
            }
        }
    }

    impl WidgetImpl for Element {
        fn request_mode(&self) -> gtk::SizeRequestMode {
            gtk::SizeRequestMode::HeightForWidth
        }

        fn measure(&self, orientation: gtk::Orientation, for_size: i32) -> (i32, i32, i32, i32) {
            let natural = self.obj().measure_natural(orientation, for_size);
            (0, natural.ceil().max(0.0) as i32, -1, -1)
        }

        fn size_allocate(&self, width: i32, height: i32, _baseline: i32) {
            let obj = self.obj();
            obj.allocate_children(width as f32, height as f32);
            crate::events::notify_layout(&obj, width, height);
        }

        fn contains(&self, x: f64, y: f64) -> bool {
            self.parent_contains(x, y) && crate::mask::clip_contains(&self.obj(), x, y)
        }

        fn snapshot(&self, snapshot: &gtk::Snapshot) {
            paint::snapshot_element(&self.obj(), snapshot);
        }
    }
}

glib::wrapper! {
    pub struct Element(ObjectSubclass<imp::Element>)
        @extends gtk::Widget,
        @implements gtk::Buildable, gtk::ConstraintTarget;
}

const LEAF_KEY: &str = "mason-leaf";

impl Element {
    pub fn new(kind: Kind) -> Element {
        let obj: Element = glib::Object::new();
        let imp = obj.imp();
        imp.kind.set(kind);
        let engine = mason();
        let node = match kind {
            Kind::Text | Kind::Button => engine.create_text_node(),
            Kind::Image => engine.create_image_node(),
            Kind::Li => engine.create_list_item_node(),
            Kind::Br => engine.create_line_break_node(),
            _ => engine.create_node(),
        };
        imp.node.replace(Some(node));
        obj.set_overflow(gtk::Overflow::Visible);
        match kind {
            Kind::Text | Kind::Button => crate::text::init(&obj, kind == Kind::Button),
            Kind::Image => crate::image::init(&obj),
            Kind::Input | Kind::TextArea => crate::input::init(&obj, kind == Kind::TextArea),
            _ => {}
        }
        obj
    }

    pub fn kind(&self) -> Kind {
        self.imp().kind.get()
    }

    pub fn node(&self) -> NodeRef {
        self.imp()
            .node
            .borrow()
            .clone()
            .expect("disposed Mason element")
    }

    pub fn try_node(&self) -> Option<NodeRef> {
        self.imp().node.borrow().clone()
    }

    /// The node's id without cloning the `NodeRef` (and its Arcs), for per-frame reads.
    pub fn node_id(&self) -> Option<Id> {
        self.imp().node.borrow().as_ref().map(NodeRef::id)
    }

    // Measure, allocate and paint call this per element; borrowing skips the NodeRef's Arc clones.
    pub fn style(&self) -> StyleView<'static> {
        StyleView(self.imp().node.borrow().as_ref().map_or(&[][..], engine::style))
    }

    pub fn from_widget(widget: &gtk::Widget) -> Option<Element> {
        widget.downcast_ref::<Element>().cloned()
    }

    /// The element for a raw widget pointer handed over by JS.
    pub unsafe fn from_ptr(ptr: *mut gtk::ffi::GtkWidget) -> Option<Element> {
        if ptr.is_null() {
            return None;
        }
        let widget: gtk::Widget = from_glib_none(ptr);
        widget.downcast::<Element>().ok()
    }

    /// The nearest Mason element above this widget.
    pub fn mason_parent(widget: &gtk::Widget) -> Option<Element> {
        let mut cur = widget.parent();
        while let Some(w) = cur {
            if let Ok(el) = w.clone().downcast::<Element>() {
                return Some(el);
            }
            cur = w.parent();
        }
        None
    }

    pub fn is_layout_root(&self) -> bool {
        self.imp().node.borrow().as_ref().map_or(true, engine::is_root)
    }

    pub fn css(&self) -> std::cell::RefMut<'_, CssState> {
        self.imp().css.borrow_mut()
    }

    pub fn css_ref(&self) -> std::cell::Ref<'_, CssState> {
        self.imp().css.borrow()
    }

    pub fn text_state(&self) -> std::cell::Ref<'_, Option<TextState>> {
        self.imp().text.borrow()
    }

    pub fn text_state_mut(&self) -> std::cell::RefMut<'_, Option<TextState>> {
        self.imp().text.borrow_mut()
    }

    pub fn image_state(&self) -> std::cell::Ref<'_, Option<ImageState>> {
        self.imp().image.borrow()
    }

    pub fn image_state_mut(&self) -> std::cell::RefMut<'_, Option<ImageState>> {
        self.imp().image.borrow_mut()
    }

    pub fn input_state(&self) -> std::cell::Ref<'_, Option<InputState>> {
        self.imp().input.borrow()
    }

    pub fn input_state_mut(&self) -> std::cell::RefMut<'_, Option<InputState>> {
        self.imp().input.borrow_mut()
    }

    pub fn scroll_state(&self) -> std::cell::Ref<'_, Option<crate::scroll::ScrollState>> {
        self.imp().scroll.borrow()
    }

    pub fn scroll_state_mut(&self) -> std::cell::RefMut<'_, Option<crate::scroll::ScrollState>> {
        self.imp().scroll.borrow_mut()
    }

    pub fn listeners(&self) -> std::cell::RefMut<'_, Listeners> {
        self.imp().listeners.borrow_mut()
    }

    pub fn role(&self) -> i32 {
        self.imp().role.get()
    }

    pub fn set_role(&self, role: i32) {
        self.imp().role.set(role);
        crate::details::role_changed(self);
    }

    pub fn open(&self) -> bool {
        self.imp().open.get()
    }

    pub fn set_open(&self, open: bool) {
        if self.imp().open.replace(open) != open {
            crate::details::open_changed(self);
        }
    }

    pub fn set_list_ordered(&self, ordered: bool) {
        self.imp().list_ordered.set(ordered);
    }

    pub fn list_ordered(&self) -> bool {
        self.imp().list_ordered.get()
    }

    /// The Mason node a GTK child stands for: an element's own, or a leaf measured through GTK
    /// (or JS, for NativeScript views) for any other widget.
    pub fn child_node(child: &gtk::Widget) -> NodeRef {
        if let Some(el) = child.downcast_ref::<Element>() {
            return el.node();
        }
        if let Some(scrolled) = scroll_content(child) {
            return scrolled.node();
        }
        foreign_leaf(child)
    }

    pub fn mark_children_dirty(&self) {
        self.imp().children_dirty.set(true);
        self.invalidate_layout();
    }

    /// Mirrors visible GTK children into the node's children.
    pub fn sync_children(&self) {
        if !self.imp().children_dirty.replace(false) || self.kind().is_text() {
            return;
        }
        let Some(node) = self.try_node() else { return };
        let mut ids = Vec::new();
        let mut child = self.first_child();
        while let Some(c) = child {
            if c.is_visible() && !is_internal(&c) {
                ids.push(Element::child_node(&c).id());
            }
            child = c.next_sibling();
        }
        let engine = mason();
        if !engine.is_children_same(node.id(), &ids) {
            engine.set_children(node.id(), &ids);
        }
    }

    /// Syncs children of every element in this subtree that changed.
    fn sync_tree(widget: &gtk::Widget) {
        if let Some(el) = widget.downcast_ref::<Element>() {
            el.sync_children();
        }
        let mut child = widget.first_child();
        while let Some(c) = child {
            Element::sync_tree(&c);
            child = c.next_sibling();
        }
    }

    pub fn insert_child(&self, child: &gtk::Widget, index: i32) {
        let target: gtk::Widget = self.clone().upcast();
        if child.parent().as_ref() == Some(&target) {
            child.unparent();
        } else if child.parent().is_some() {
            if let Some(old) = child.parent().and_then(|p| p.downcast::<Element>().ok()) {
                old.remove_child(child);
            } else {
                child.unparent();
            }
        }
        let mut sibling = self.first_child();
        let mut i = 0;
        while let Some(s) = sibling.clone() {
            if is_internal(&s) {
                sibling = s.next_sibling();
                continue;
            }
            if index >= 0 && i == index {
                break;
            }
            i += 1;
            sibling = s.next_sibling();
        }
        match sibling {
            Some(s) if index >= 0 => child.insert_before(self, Some(&s)),
            _ => {
                // after the last child that isn't internal chrome
                let last = last_regular_child(self);
                child.insert_after(self, last.as_ref());
            }
        }
        if let Some(el) = child.downcast_ref::<Element>() {
            el.invalidate_layout();
        }
        self.mark_children_dirty();
        crate::details::child_added(self, child);
    }

    pub fn remove_child(&self, child: &gtk::Widget) {
        let target: gtk::Widget = self.clone().upcast();
        if child.parent().as_ref() != Some(&target) {
            return;
        }
        child.unparent();
        if let Some(node) = self.try_node() {
            let child_node = Element::child_node(child);
            mason().remove_child(node.id(), child_node.id());
        }
        self.mark_children_dirty();
    }

    /// Marks the node dirty and asks GTK to lay out again from the topmost element.
    pub fn invalidate_layout(&self) {
        if let Some(node) = self.try_node() {
            mason().mark_dirty(node.id());
        }
        self.queue_resize();
        let mut cur = Element::mason_parent(self.upcast_ref());
        while let Some(p) = cur {
            p.queue_resize();
            cur = Element::mason_parent(p.upcast_ref());
        }
    }

    /// Computes the tree under this root for the given space.
    pub fn compute(&self, width: AvailableSpace, height: AvailableSpace) {
        let Some(node) = self.try_node() else { return };
        Element::sync_tree(self.upcast_ref());
        mason().compute_size(node.id(), Size { width, height });
        let layout = engine::layout(node.id());
        self.imp()
            .computed_for
            .set((layout.size.width, layout.size.height));
    }

    fn compute_if_needed(&self, width: f32, height: f32) {
        let Some(node) = self.try_node() else { return };
        let (cw, ch) = self.imp().computed_for.get();
        if mason().dirty(node.id()) || (cw - width).abs() > 0.5 || (ch - height).abs() > 0.5 {
            self.compute(
                AvailableSpace::Definite(width),
                AvailableSpace::Definite(height),
            );
        }
    }

    /// Size of this element's border box from the last layout.
    pub fn layout_size(&self) -> (f32, f32) {
        self.node_id().map_or((0.0, 0.0), |id| {
            let l = engine::layout(id);
            (l.size.width, l.size.height)
        })
    }

    /// Border box grown to hold the scrollable overflow.
    pub fn scroll_extent(&self) -> (f32, f32) {
        let Some(id) = self.node_id() else {
            return (0.0, 0.0);
        };
        let l = engine::layout(id);
        let o = &l.scrollable_overflow_rect;
        // the overflow rect starts at the padding box corner and includes the end padding
        let w = l.border.left + o.right + l.border.right;
        let h = l.border.top + o.bottom + l.border.bottom;
        (l.size.width.max(w), l.size.height.max(h))
    }

    fn measure_natural(&self, orientation: gtk::Orientation, for_size: i32) -> f32 {
        if !self.is_layout_root() {
            let (w, h) = if self.parent().is_some_and(|p| p.is::<gtk::Viewport>()) {
                self.scroll_extent()
            } else {
                self.layout_size()
            };
            return if orientation == gtk::Orientation::Horizontal {
                w
            } else {
                h
            };
        }
        // A root sized by GTK (a scroller's viewport, a plain GTK container).
        let scrolled = self.parent().is_some_and(|p| p.is::<gtk::Viewport>());
        if orientation == gtk::Orientation::Horizontal {
            self.compute(AvailableSpace::MaxContent, AvailableSpace::MaxContent);
            self.layout_size().0
        } else {
            let width = if for_size >= 0 {
                AvailableSpace::Definite(for_size as f32)
            } else {
                AvailableSpace::MaxContent
            };
            self.compute(width, AvailableSpace::MaxContent);
            // a scroller's content reports everything it can scroll to
            if scrolled {
                self.scroll_extent().1
            } else {
                self.layout_size().1
            }
        }
    }

    /// Measures a root for NativeScript's measure specs; returns the border box size.
    pub fn measure_specs(&self, width_spec: i32, height_spec: i32) -> (f32, f32) {
        fn space(spec: i32) -> (AvailableSpace, Option<f32>) {
            let mode = (spec as u32) >> 30;
            let size = (spec & 0x3fff_ffff) as f32;
            match mode {
                1 => (AvailableSpace::Definite(size), Some(size)),
                2 => (AvailableSpace::Definite(size), None),
                _ => (AvailableSpace::MaxContent, None),
            }
        }
        let (w, exact_w) = space(width_spec);
        let (h, exact_h) = space(height_spec);
        if self.is_layout_root() {
            self.compute(w, h);
        }
        let (lw, lh) = self.layout_size();
        (exact_w.unwrap_or(lw), exact_h.unwrap_or(lh))
    }

    fn allocate_children(&self, width: f32, height: f32) {
        if self.is_layout_root() {
            self.compute_if_needed(width, height);
        }
        match self.kind() {
            Kind::Text | Kind::Button => crate::text::allocate(self, width, height),
            Kind::Input | Kind::TextArea => crate::input::allocate(self, width, height),
            _ => {}
        }
        if self.kind().is_text() {
            return;
        }
        crate::scroll::sync(self);
        let (ox, oy) = crate::scroll::offset(self);
        // children wholly outside a clipping box can't be hit
        let viewport = self.overflow_clips().then(|| {
            let [t, r, b, l] = crate::paint::BoxGeometry::of(self).border;
            graphene::Rect::new(l, t, (width - l - r).max(0.0), (height - t - b).max(0.0))
        });
        let mut child = self.first_child();
        while let Some(c) = child {
            child = c.next_sibling();
            if !c.is_visible() || is_internal(&c) {
                continue;
            }
            let node = Element::child_node(&c);
            let mut l = engine::layout(node.id());
            l.location.x -= ox;
            l.location.y -= oy;
            if let (Some(view), true) = (&viewport, c.is::<Element>()) {
                let frame =
                    graphene::Rect::new(l.location.x, l.location.y, l.size.width, l.size.height);
                c.set_can_target(frame.intersection(view).is_some());
            }
            let transform = c
                .downcast_ref::<Element>()
                .and_then(|el| el.css_ref().transform(l.size.width, l.size.height));
            if !c.is::<Element>() {
                // NativeScript lays its own views out in the frame Mason gave them
                if let Some(cb) = FOREIGN_LAYOUT.with(|f| f.get()) {
                    cb(
                        c.as_ptr(),
                        l.location.x,
                        l.location.y,
                        l.size.width,
                        l.size.height,
                    );
                }
            }
            allocate_widget(
                &c,
                l.location.x,
                l.location.y,
                l.size.width,
                l.size.height,
                transform,
            );
        }
    }

    pub fn content_box(&self) -> graphene::Rect {
        let Some(node) = self.try_node() else {
            return graphene::Rect::zero();
        };
        let l = engine::layout(node.id());
        let x = l.border.left + l.padding.left;
        let y = l.border.top + l.padding.top;
        graphene::Rect::new(
            x,
            y,
            (l.size.width - x - l.border.right - l.padding.right).max(0.0),
            (l.size.height - y - l.border.bottom - l.padding.bottom).max(0.0),
        )
    }

    pub fn style_synced(&self, dirty: u128) {
        crate::details::sync_display(self);
        if self.kind().is_text() {
            crate::text::style_changed(self, dirty);
        }
        if let Some(input) = self.input_state().as_ref() {
            input.style_changed(self);
        }
        if dirty & LAYOUT_KEYS != 0 {
            self.invalidate_layout();
        } else {
            self.queue_draw();
        }
        if let Some(p) = self.parent() {
            // text children paint with their host
            if p.downcast_ref::<Element>()
                .is_some_and(|e| e.kind().is_text())
            {
                p.queue_draw();
            }
        }
    }

    pub fn overflow_clips(&self) -> bool {
        let s = self.style();
        s.u8(StyleKeys::OVERFLOW_X) != 0 || s.u8(StyleKeys::OVERFLOW_Y) != 0
    }
}

/// StateKeys bits that change layout (Windows' kLayoutKeys).
pub const LAYOUT_KEYS: u128 = {
    const fn range(first: u32, last: u32) -> u128 {
        let mut m = 0u128;
        let mut i = first;
        while i <= last {
            m |= 1u128 << i;
            i += 1;
        }
        m
    }
    range(0, 39)
        | range(43, 44)
        | range(47, 49)
        | range(53, 54)
        | range(56, 61)
        | range(63, 66)
        | range(69, 71)
        | range(73, 75)
        | range(77, 127)
};

pub fn dirty_mask(d0: i32, d1: i32, d2: i32, d3: i32) -> u128 {
    (d0 as u32 as u128)
        | ((d1 as u32 as u128) << 32)
        | ((d2 as u32 as u128) << 64)
        | ((d3 as u32 as u128) << 96)
}

/// Chrome a widget owns (an input's entry, a text's link overlay): never a Mason child.
pub fn is_internal(widget: &gtk::Widget) -> bool {
    unsafe { widget.data::<bool>("mason-internal").is_some() }
}

pub fn mark_internal(widget: &gtk::Widget) {
    unsafe { widget.set_data("mason-internal", true) };
}

fn last_regular_child(el: &Element) -> Option<gtk::Widget> {
    let mut last = None;
    let mut child = el.first_child();
    while let Some(c) = child {
        if !is_internal(&c) {
            last = Some(c.clone());
        }
        child = c.next_sibling();
    }
    last
}

/// A GtkScrolledWindow around a Mason element (a scroll element): the element's node stands in
/// for the scroller in its parent's tree.
pub fn scroll_content(widget: &gtk::Widget) -> Option<Element> {
    let scrolled = widget.downcast_ref::<gtk::ScrolledWindow>()?;
    let child = scrolled.child()?;
    if let Ok(el) = child.clone().downcast::<Element>() {
        return Some(el);
    }
    child
        .downcast::<gtk::Viewport>()
        .ok()?
        .child()?
        .downcast::<Element>()
        .ok()
}

pub fn allocate_widget(
    child: &gtk::Widget,
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    transform: Option<gsk::Transform>,
) {
    // GTK wants a measure before every allocation, and at least the minimum size.
    let (min_w, ..) = child.measure(gtk::Orientation::Horizontal, -1);
    let width = (w.round() as i32).max(min_w).max(0);
    let (min_h, ..) = child.measure(gtk::Orientation::Vertical, width);
    let height = (h.round() as i32).max(min_h).max(0);
    let mut t = gsk::Transform::new().translate(&graphene::Point::new(x, y));
    if let Some(extra) = transform {
        t = t.transform(Some(&extra));
    }
    child.allocate(width, height, -1, Some(t));
}

pub type ForeignMeasure = extern "C" fn(*mut gtk::ffi::GtkWidget, f32, f32, f32, f32) -> bool;
pub type ForeignLayout = extern "C" fn(*mut gtk::ffi::GtkWidget, f32, f32, f32, f32);

thread_local! {
    static FOREIGN_MEASURE: Cell<Option<ForeignMeasure>> = const { Cell::new(None) };
    static FOREIGN_LAYOUT: Cell<Option<ForeignLayout>> = const { Cell::new(None) };
    pub static SCRATCH: RefCell<[f32; 16]> = const { RefCell::new([0.0; 16]) };
}

pub fn set_foreign_measure(cb: Option<ForeignMeasure>) {
    FOREIGN_MEASURE.with(|c| c.set(cb));
}

pub fn set_foreign_layout(cb: Option<ForeignLayout>) {
    FOREIGN_LAYOUT.with(|c| c.set(cb));
}

/// The scratch floats JS reads results from and writes measure answers into.
pub fn scratch_ptr() -> *mut f32 {
    SCRATCH.with(|s| s.as_ptr() as *mut f32)
}

extern "C" fn foreign_measure(
    data: *const std::ffi::c_void,
    kw: f32,
    kh: f32,
    aw: f32,
    ah: f32,
) -> i64 {
    let widget: gtk::Widget = unsafe { from_glib_none(data as *mut gtk::ffi::GtkWidget) };
    if !kw.is_nan() && !kh.is_nan() {
        return engine::pack(kw, kh);
    }
    // NativeScript views measure through core (JS); plain GTK widgets through GTK.
    if let Some(cb) = FOREIGN_MEASURE.with(|c| c.get()) {
        if cb(widget.as_ptr(), kw, kh, aw, ah) {
            let (w, h) = SCRATCH.with(|s| {
                let s = s.borrow();
                (s[0], s[1])
            });
            return engine::pack(
                if kw.is_nan() { w } else { kw },
                if kh.is_nan() { h } else { kh },
            );
        }
    }
    let (_, nat_w, ..) = widget.measure(gtk::Orientation::Horizontal, -1);
    let mut w = nat_w as f32;
    if !kw.is_nan() {
        w = kw;
    } else if aw >= 0.0 {
        w = w.min(aw);
    } else if aw == -1.0 {
        let (min_w, ..) = widget.measure(gtk::Orientation::Horizontal, -1);
        w = min_w as f32;
    }
    let h = if kh.is_nan() {
        let (_, nat_h, ..) = widget.measure(gtk::Orientation::Vertical, w.ceil() as i32);
        nat_h as f32
    } else {
        kh
    };
    engine::pack(w, h)
}

/// The leaf node standing for a non-Mason child; lives as long as the widget.
pub fn foreign_leaf(widget: &gtk::Widget) -> NodeRef {
    unsafe {
        if let Some(leaf) = widget.data::<NodeRef>(LEAF_KEY) {
            return leaf.as_ref().clone();
        }
    }
    let engine = mason();
    let leaf = engine.create_node();
    // The widget outlives its leaf: the qdata (and the measure with it) goes when it's finalized.
    engine.set_measure(leaf.id(), Some(foreign_measure), widget.as_ptr() as *mut _);
    unsafe { widget.set_data(LEAF_KEY, leaf.clone()) };
    leaf
}
