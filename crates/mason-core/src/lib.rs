pub use crate::tree::{Id, Tree};
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;

use parking_lot::lock_api::MappedRwLockReadGuard;
use parking_lot::{RawRwLock, RwLockReadGuard};
use slotmap::Key;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicBool, Ordering};
pub use style_atoms::Atom;

pub static PREFLIGHT_ENABLED: AtomicBool = AtomicBool::new(false);
pub use taffy::geometry::{Line, Point, Rect, Size};
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, CompactLength, Dimension,
    Display, FlexDirection, FlexWrap, Float, GridAutoFlow, GridPlacement, GridTemplateArea,
    GridTemplateComponent, GridTemplateRepetition, JustifyContent, LengthPercentage,
    LengthPercentageAuto, MaxTrackSizingFunction, MinTrackSizingFunction, Position,
    RepetitionCount, TextAlign, TrackSizingFunction,
};
pub use taffy::style_helpers::*;
pub use taffy::Layout;
pub use taffy::Overflow;
mod node;

#[cfg(target_vendor = "apple")]
use crate::node::AppleNode;

pub use crate::node::InlineSegment;
use crate::style::arena::{ArenaStats, StyleHandle, STYLE_BUFFER_SIZE};
pub use crate::style::Style;
pub use node::NodeRef;

pub mod style;
mod tree;
mod tree_inline;
pub mod utils;

#[inline]
pub(crate) fn scrollable_overflow_rect_from_size(size: Size<f32>) -> Rect<f32> {
    Rect {
        left: 0.0,
        right: size.width.max(0.0),
        top: 0.0,
        bottom: size.height.max(0.0),
    }
}

#[inline]
pub(crate) fn scrollable_overflow_size(rect: Rect<f32>) -> Size<f32> {
    Size {
        width: rect.right.max(0.0),
        height: rect.bottom.max(0.0),
    }
}

#[cfg(target_os = "android")]
pub static JVM: std::sync::OnceLock<jni::JavaVM> = std::sync::OnceLock::new();

#[cfg(target_os = "android")]
#[derive(Debug, Clone)]
pub struct JVMCache {
    pub(crate) measure_measure_id: jni::objects::JStaticMethodID,
    pub(crate) node_clazz: jni::objects::GlobalRef,
    pub(crate) node_set_computed_size_id: jni::objects::JStaticMethodID,
    pub object_manager_clazz: jni::objects::GlobalRef,
    pub object_manager_add_id: jni::objects::JStaticMethodID,
}

#[cfg(target_os = "android")]
impl JVMCache {
    pub fn new(
        node_clazz: jni::objects::GlobalRef,
        measure_measure_id: jni::objects::JStaticMethodID,
        node_set_computed_size_id: jni::objects::JStaticMethodID,
        object_manager_clazz: jni::objects::GlobalRef,
        object_manager_add_id: jni::objects::JStaticMethodID,
    ) -> Self {
        Self {
            measure_measure_id,
            node_clazz,
            node_set_computed_size_id,
            object_manager_clazz,
            object_manager_add_id,
        }
    }
}
#[cfg(target_os = "android")]
pub static JVM_CACHE: std::sync::OnceLock<JVMCache> = std::sync::OnceLock::new();

#[cfg(target_os = "android")]
use jni::sys::jint;

#[inline]
fn initialize_pseudo_style_from_base(style: &mut Style) {
    style.prepare_mut();
    let data = style.data_mut();
    data[style::StyleKeys::PSEUDO_SET_MASK_LOW as usize
        ..style::StyleKeys::PSEUDO_SET_MASK_HIGH as usize + 8]
        .fill(0);
}

/// Returns a mutable reference to `slot`, initialising it by cloning `base` if absent.
fn get_or_init_pseudo<'a>(slot: &'a mut Option<Style>, base: &Style) -> &'a mut Style {
    if slot.is_none() {
        let mut s = base.clone();
        initialize_pseudo_style_from_base(&mut s);
        *slot = Some(s);
    } else {
        slot.as_mut().unwrap().prepare_mut();
    }
    slot.as_mut().unwrap()
}

pub struct MeasureOutput;
impl MeasureOutput {
    /// Tagged quiet-NaN payloads for MinContent / MaxContent signaling.
    /// These match the Kotlin `MeasureOutput.MIN_BITS` / `MAX_BITS` constants.
    pub const MIN_BITS: u32 = 0x7FC0_0001;
    pub const MAX_BITS: u32 = 0x7FC0_0002;

    /// Packs two u32 bit patterns into an i64
    pub fn make_bits(width_bits: u32, height_bits: u32) -> i64 {
        ((width_bits as i64) << 32) | (height_bits as i64)
    }
}

impl MeasureOutput {
    pub fn make(width: f32, height: f32) -> i64 {
        let w_bits = width.to_bits();
        let h_bits = height.to_bits();
        (w_bits as i64) << 32 | (h_bits as i64)
    }

    pub fn make_i32(width: i32, height: i32) -> i64 {
        MeasureOutput::make(width as f32, height as f32)
    }

    pub fn get_width(measure_output: i64) -> f32 {
        f32::from_bits((0xFFFFFFFF & (measure_output >> 32)) as u32)
    }

    pub fn get_height(measure_output: i64) -> f32 {
        f32::from_bits((0xFFFFFFFF & measure_output) as u32)
    }
}

fn copy_output(taffy: &Tree, node: Id, output: &mut Vec<f32>) {
    // Hold a single read lock for the entire tree walk instead of acquiring
    // 2 locks per node (layout_raw + inner().children).
    let inner = taffy.inner();
    let use_rounding = inner.use_rounding;
    copy_output_inner(&inner, node, output, use_rounding);
}

fn copy_output_inner(
    inner: &crate::tree::TreeInner,
    node: Id,
    output: &mut Vec<f32>,
    use_rounding: bool,
) {
    let n = &inner.nodes[node];
    let layout = if use_rounding {
        n.final_layout
    } else {
        n.unrounded_layout
    };

    let children = inner.children.get(node);
    let len = children.map(|c| c.len()).unwrap_or(0);

    output.reserve(len * 22 + 22);

    let export_h = {
        let h = layout.size.height;
        // Promote a near-zero (degenerate) height to content_size.height when
        // the content itself is larger — avoids invisible collapsed containers.
        if h.abs() <= 1e-6 && layout.scrollable_overflow_rect.bottom > h {
            layout.scrollable_overflow_rect.bottom
        } else {
            h
        }
    };

    output.extend_from_slice(&[
        layout.order as f32,
        layout.location.x,
        layout.location.y,
        layout.size.width,
        export_h,
        layout.border.top,
        layout.border.right,
        layout.border.bottom,
        layout.border.left,
        layout.margin.top,
        layout.margin.right,
        layout.margin.bottom,
        layout.margin.left,
        layout.padding.top,
        layout.padding.right,
        layout.padding.bottom,
        layout.padding.left,
        layout.scrollable_overflow_rect.right,
        layout.scrollable_overflow_rect.bottom,
        layout.scrollbar_size.width,
        layout.scrollbar_size.height,
        len as f32,
    ]);

    if let Some(children) = children {
        for child in children {
            copy_output_inner(inner, *child, output, use_rounding);
        }
    }
}

/// Maps the float sentinel encoding used at FFI boundaries to `AvailableSpace`.
/// `-1.0` → `MinContent`, `-2.0` → `MaxContent`, any other value → `Definite`.
#[inline]
fn f32_to_available_space(v: f32) -> AvailableSpace {
    match v {
        x if x == -1.0 => AvailableSpace::MinContent,
        x if x == -2.0 => AvailableSpace::MaxContent,
        x => AvailableSpace::Definite(x),
    }
}

// todo objc layout

// static mut TREE: Lazy<Rc<RefCell<Tree>>> = Lazy::new(|| Rc::new(RefCell::new(Tree::new())));

#[derive(Debug, Clone)]
pub struct Mason(Tree);

unsafe impl Send for Mason {}

impl Default for Mason {
    fn default() -> Self {
        Self::new()
    }
}

impl Mason {
    pub fn arena_state(&self) -> ArenaStats {
        self.0.inner().style_arena.stats()
    }
    pub fn new() -> Self {
        // 128 measurably undershoots a typical real screen (the perf-audit
        // baseline scenario alone was 287 nodes) - every platform's default
        // init path (Android nativeInit, iOS mason_init, Windows) goes
        // through this constructor, so undersizing here means every app
        // pays several SlotMap/SecondaryMap doubling-reallocation events
        // during its very first layout pass. 512 comfortably covers a
        // single small-to-medium screen without materially increasing
        // memory for trivial ones (each pre-reserved slot is a few hundred
        // bytes, not the multi-KB per-node cost of an actually-populated
        // node - see Node's Style/Cache/inline_measure_cache fields).
        Self::with_capacity(512)
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    pub fn set_device_scale(&mut self, scale: f32) {
        self.0
            .inner_mut()
            .density
            .store(scale.to_bits(), Ordering::Release);
    }

    pub fn get_device_scale(&self) -> f32 {
        f32::from_bits(self.0.inner().density.load(Ordering::Acquire))
    }

    pub fn with_capacity(size: usize) -> Self {
        Self(Tree::with_capacity(size))
    }

    #[track_caller]
    pub fn create_node(&mut self) -> NodeRef {
        self.0.create_node()
    }

    #[track_caller]
    pub fn create_anonymous_node(&mut self) -> NodeRef {
        self.0.create_anonymous_node()
    }

    #[track_caller]
    pub fn create_text_node(&mut self) -> NodeRef {
        self.0.create_text_node()
    }

    #[track_caller]
    pub fn create_anonymous_text_node(&mut self) -> NodeRef {
        self.0.create_anonymous_text_node()
    }

    #[track_caller]
    pub fn create_image_node(&mut self) -> NodeRef {
        self.0.create_image_node()
    }

    #[track_caller]
    pub fn create_line_break_node(&mut self) -> NodeRef {
        self.0.create_line_break_node()
    }

    #[track_caller]
    pub fn create_list_item_node(&mut self) -> NodeRef {
        self.0.create_list_item_node()
    }

    #[track_caller]
    pub fn create_button_node(&mut self) -> NodeRef {
        self.0.create_button_node()
    }

    pub fn prepare_mut(&mut self, node: &NodeRef) {
        self.0.prepare_mut(node.id.into())
    }

    #[cfg(not(any(target_os = "android", target_vendor = "apple")))]
    #[track_caller]
    pub fn node_state_data(&mut self, node: Id) -> &[u8] {
        self.0
            .nodes()
            .get(node)
            .map(|data| unsafe {
                std::slice::from_raw_parts(data.state.as_ptr(), data.state.len())
            })
            .unwrap_or(&[])
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn node_state_data(&mut self, node: Id) -> jni::sys::jint {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| data.state_buffer)
            .unwrap_or(-1 as _)
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn node_state_data(&mut self, node: Id) -> *mut c_void {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| objc2::rc::Retained::into_raw(data.style().buffer()) as *mut c_void)
            .unwrap_or(0 as _)
    }

    #[cfg(not(any(target_os = "android", target_vendor = "apple")))]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> &[u8] {
        self.0
            .nodes()
            .get(node)
            .map(|data| {
                let (ptr, len) = data.style().raw();
                unsafe { std::slice::from_raw_parts(ptr, len) }
            })
            .unwrap_or(&[])
    }

    /// Test helper: query whether a node has its virtual bit set.
    pub fn is_node_virtual(&self, node: Id) -> bool {
        self.0
            .nodes()
            .get(node)
            .map(|n| n.is_virtual())
            .unwrap_or(false)
    }

    /// Test helper: query whether a node's style marks it as a list-item.
    pub fn is_node_list_item(&self, node: Id) -> bool {
        self.0
            .nodes()
            .get(node)
            .map(|n| n.style().get_item_is_list_item())
            .unwrap_or(false)
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> jni::sys::jint {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| data.style().buffer())
            .unwrap_or(-1 as _)
    }

    /// Return platform-specific pseudo style buffer (android: buffer id) for a node
    /// matching `flags`. Returns -1 when none available.
    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn pseudo_style_data(&mut self, node: Id, flags: u16) -> jni::sys::jint {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                node.pseudo_styles
                    .as_ref()
                    .and_then(|p| p.resolve(flags))
                    .map(|s| s.buffer())
            })
            .unwrap_or(-1 as _)
    }

    #[track_caller]
    pub fn pseudo_style_data_raw(&self, node: Id, flags: u16) -> (*const u8, usize) {
        self.0
            .nodes()
            .get(node)
            .and_then(|node| {
                node.pseudo_styles
                    .as_ref()
                    .and_then(|p| p.resolve(flags))
                    .map(|s| s.raw())
            })
            .unwrap_or((0 as _, 0))
    }

    /// Return the StyleHandle for a pseudo style (immutable) if present.
    #[track_caller]
    pub fn pseudo_style_handle(&self, node: Id, flags: u16) -> Option<u32> {
        self.0.nodes().get(node).and_then(|node| {
            node.pseudo_styles
                .as_ref()
                .and_then(|p| p.resolve(flags))
                .map(|s| s.handle.index() as u32)
        })
    }

    /// Prepare and return a mutable pseudo style buffer for `node` matching `flags`.
    /// This will create the pseudo Style slot (cloned from base style) if missing
    /// and call `prepare_mut()` on it so callers can safely mutate the raw buffer.
    #[track_caller]
    pub fn pseudo_style_data_raw_mut(&mut self, node: Id, flags: u16) -> (*mut u8, usize) {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(node::PseudoStyles::default());
                }
                node.pseudo_styles
                    .as_mut()
                    .unwrap()
                    .resolve_or_create_mut(flags, &node.style, initialize_pseudo_style_from_base)
                    .map(|s| s.raw_mut())
            })
            .unwrap_or((0 as _, 0))
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn pseudo_style_data(&self, node: Id, flags: u16) -> *mut c_void {
        self.0
            .nodes()
            .get(node)
            .and_then(|node| {
                node.pseudo_styles
                    .as_ref()
                    .and_then(|p| p.resolve(flags))
                    .map(|s| objc2::rc::Retained::into_raw(s.buffer()) as _)
            })
            .unwrap_or(0 as _)
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn pseudo_style_data_mut(&mut self, node: Id, flags: u16) -> *mut c_void {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(node::PseudoStyles::default());
                }
                node.pseudo_styles
                    .as_mut()
                    .unwrap()
                    .resolve_or_create_mut(flags, &node.style, initialize_pseudo_style_from_base)
                    .map(|s| objc2::rc::Retained::into_raw(s.buffer()) as *mut c_void)
            })
            .unwrap_or(0 as _)
    }

    /// Prepare and return the StyleHandle for a mutable pseudo style.
    /// Caller may then query `buffer_from(handle)` / `buffer_raw_mut_from(handle)`.
    #[track_caller]
    pub fn pseudo_style_handle_mut(&mut self, node: Id, flags: u16) -> Option<u32> {
        self.0.nodes_mut().get_mut(node).and_then(|node| {
            if node.pseudo_styles.is_none() {
                node.pseudo_styles = Some(crate::node::PseudoStyles::default());
            }
            node.pseudo_styles
                .as_mut()
                .unwrap()
                .resolve_or_create_mut(flags, &node.style, initialize_pseudo_style_from_base)
                .map(|s| s.handle.index() as u32)
        })
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn pseudo_style_data_mut(&mut self, node: Id, flags: u16) -> jni::sys::jint {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(crate::node::PseudoStyles::default());
                }
                node.pseudo_styles
                    .as_mut()
                    .unwrap()
                    .resolve_or_create_mut(flags, &node.style, initialize_pseudo_style_from_base)
                    .map(|s| s.buffer())
            })
            .unwrap_or(-1 as _)
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> *mut c_void {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| objc2::rc::Retained::into_raw(data.style().buffer()) as *mut c_void)
            .unwrap_or(0 as _)
    }

    #[track_caller]
    pub fn style_data_raw(&self, node: Id) -> (*const u8, usize) {
        self.0
            .nodes()
            .get(node)
            .map(|data| data.style().raw())
            .unwrap_or((0 as _, 0))
    }

    #[track_caller]
    pub fn style_data_raw_mut(&mut self, node: Id) -> (*mut u8, usize) {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| data.style_mut().raw_mut())
            .unwrap_or((0 as _, 0))
    }

    #[track_caller]
    pub fn node_state_data_raw(&self, node: Id) -> (*const u8, usize) {
        self.0
            .nodes()
            .get(node)
            .map(|data| (data.state.as_ptr(), data.state.len()))
            .unwrap_or((0 as _, 0))
    }

    #[track_caller]
    pub fn node_state_data_raw_mut(&mut self, node: Id) -> (*mut u8, usize) {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|data| (data.state.as_mut_ptr(), data.state.len()))
            .unwrap_or((0 as _, 0))
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_measure(&mut self, node: Id, measure: jni::sys::jint) {
        let has_measure = measure != -1;
        if let Some(nd) = self.0.node_data_mut().get_mut(node) {
            nd.measure = measure;
        }
        if let Some(n) = self.0.nodes_mut().get_mut(node) {
            n.has_measure = has_measure;
        }
        // measure fn changed; invalidate cached layout
        self.0.mark_dirty(node);
    }

    /// Alias for [`set_measure`]; kept for ABI compatibility.
    #[cfg(target_os = "android")]
    #[track_caller]
    #[deprecated(since = "0.0.0", note = "use set_measure instead")]
    pub fn setup(&mut self, node: Id, measure: jni::sys::jint) {
        self.set_measure(node, measure);
    }

    #[cfg(not(target_os = "android"))]
    #[track_caller]
    pub fn set_measure(
        &mut self,
        node: Id,
        measure: Option<
            extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong,
        >,
        data: *mut c_void,
    ) {
        let has_measure = measure.is_some();

        if let Some(node) = self.0.node_data_mut().get_mut(node) {
            node.measure = measure;
            node.data = data;

            // #[cfg(target_vendor = "apple")]
            // if let Some(apple_node) = AppleNode::from_ptr(data as *mut _) {
            //     node.apple_data = Some(apple_node);
            // }
        }

        if let Some(node) = self.0.nodes_mut().get_mut(node) {
            node.has_measure = has_measure;
        }
        // measure fn changed; invalidate cached layout
        self.0.mark_dirty(node);
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn set_apple_data(&mut self, node: Id, data: *mut c_void) {
        if let Some(node) = self.0.node_data_mut().get_mut(node) {
            if data.is_null() {
                node.apple_data = None;
            } else if let Some(apple_node) = AppleNode::from_ptr(data as *mut _) {
                node.apple_data = Some(apple_node);
            }
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_android_node(&mut self, node: Id, android_node: Option<jni::sys::jint>) {
        if let Some(node) = self.0.node_data_mut().get_mut(node) {
            node.android_data = android_node.map(node::AndroidNode);
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn clear_android_node(&mut self, node: Id) {
        if let Some(node) = self.0.node_data_mut().get_mut(node) {
            node.android_data = None;
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    /// Return the Android-side node id associated with `node`, if one was set.
    pub fn get_android_node(&self, node: Id) -> Option<jint> {
        if let Some(data) = self.0.node_data().get(node) {
            data.android_data.map(|n| n.0)
        } else {
            None
        }
    }

    pub fn layout(&self, node_id: Id) -> Vec<f32> {
        // Reuse a thread-local scratch buffer across calls instead of walking
        // the tree into a fresh, zero-capacity Vec every time - the walk in
        // copy_output grows the buffer incrementally as it recurses, which
        // otherwise reallocates repeatedly on every single `layout()` call.
        // The final clone is still one allocation (this fn's signature
        // returns an owned Vec), but that's one copy instead of several
        // grow-and-copy steps during the walk itself.
        thread_local! {
            static SCRATCH: std::cell::RefCell<Vec<f32>> = const { std::cell::RefCell::new(Vec::new()) };
        }
        SCRATCH.with(|scratch| {
            let mut output = scratch.borrow_mut();
            output.clear();
            copy_output(&self.0, node_id, &mut output);
            output.clone()
        })
    }

    pub fn layout_raw(&self, node_id: Id) -> Layout {
        *self.0.layout(node_id.into())
    }

    /// Return transient float rects for a container as a flat `[left, top, right, bottom, …]` vec.
    pub fn get_float_rects(&self, container_id: Id) -> Vec<f32> {
        self.0
            .get_float_rects_simple(container_id)
            .map(|rects| {
                let mut out = Vec::with_capacity(rects.len() * 4);
                for r in rects {
                    out.extend_from_slice(&[r.left, r.top, r.right, r.bottom]);
                }
                out
            })
            .unwrap_or_default()
    }

    /// Return float rects including the `node` id for each rect so callers
    /// can correlate rects with author nodes. Each entry is a tuple
    /// `(Id, left, top, right, bottom)` in engine logical units.
    pub fn get_float_rects_with_nodes(&self, container_id: Id) -> Vec<(Id, f32, f32, f32, f32)> {
        if let Some(rects) = self.0.get_float_rects(container_id) {
            rects
                .into_iter()
                .map(|r| (r.node, r.left, r.top, r.right, r.bottom))
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_float_rects_with_node_ids(&self, container_id: Id) -> Vec<(i64, i64, i64)> {
        if let Some(rects) = self.0.get_float_rects(container_id) {
            rects
                .into_iter()
                .map(|r| {
                    (
                        r.node.data().as_ffi() as i64,
                        MeasureOutput::make(r.left, r.top),
                        MeasureOutput::make(r.right, r.bottom),
                    )
                })
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn compute_layout(&mut self, node_id: Id, available_space: Size<AvailableSpace>) {
        let use_rounding = self.0.use_rounding();
        self.0
            .compute_layout(node_id.into(), available_space, use_rounding);
    }

    pub fn compute(&mut self, node_id: Id) {
        self.compute_layout(node_id, Size::max_content());
    }

    pub fn compute_min(&mut self, node_id: Id) {
        self.compute_layout(node_id, Size::min_content());
    }

    pub fn compute_wh(&mut self, node_id: Id, width: f32, height: f32) {
        let size = Size {
            width: f32_to_available_space(width),
            height: f32_to_available_space(height),
        };
        self.compute_layout(node_id, size);
    }

    #[inline]
    pub fn compute_size(&mut self, node_id: Id, size: Size<AvailableSpace>) {
        self.compute_layout(node_id, size);
    }

    pub fn append(&mut self, node_id: Id, child: Id) {
        self.0.append(node_id, child);
    }

    pub fn append_node(&mut self, node_id: Id, node_ids: &[Id]) {
        self.0.append_children(node_id, node_ids);
    }

    pub fn remove_node(&mut self, parent: Id, node: Id) -> Option<NodeRef> {
        self.0.remove(parent, node)
    }

    pub fn append_segment(&mut self, node: Id, segment: InlineSegment) {
        if let Some(data) = self.0.node_data().get(node) {
            data.inline_segments.lock().push(segment);
        }
        // segments changed; invalidate cached layout
        self.0.mark_dirty(node);
    }

    pub fn clear_segments(&mut self, node: Id) {
        if let Some(data) = self.0.node_data().get(node) {
            data.inline_segments.lock().clear();
        }
        self.0.mark_dirty(node);
    }

    pub fn set_segments(&mut self, node: Id, segments: Vec<InlineSegment>) {
        if let Some(data) = self.0.node_data().get(node) {
            *data.inline_segments.lock() = segments;
        }
        self.0.mark_dirty(node);
    }

    pub fn get_segments(&self, node: Id) -> Vec<InlineSegment> {
        self.0
            .node_data()
            .get(node)
            .map(|data| data.inline_segments.lock().clone())
            .unwrap_or_default()
    }

    pub fn set_children(&mut self, parent: Id, children: &[Id]) {
        {
            let mut tree = self.0.inner_mut();
            let mut has_children = false;
            {
                if let Some(current_children) = tree.children.get_mut(parent) {
                    if children.is_empty() && current_children.is_empty() {
                        return;
                    }
                    if current_children == children {
                        return;
                    }

                    current_children.clear();
                    current_children.extend_from_slice(children);

                    has_children = true;
                }
            }

            if has_children {
                for child in children.iter() {
                    if let Some(Some(removed)) = tree.parents.insert(*child, Some(parent)) {
                        if removed == parent {
                            continue;
                        }

                        if let Some(previous_children) = tree.children.get_mut(removed) {
                            previous_children.retain(|&id| id != *child);
                        }

                        if let Some(node) = tree.nodes.get_mut(removed) {
                            node.mark_dirty();
                        }
                    }
                }
            } else {
                tree.children.insert(parent, children.to_vec());
                for child in children.iter() {
                    if let Some(Some(removed)) = tree.parents.insert(*child, Some(parent)) {
                        if let Some(previous_children) = tree.children.get_mut(removed) {
                            previous_children.retain(|&id| id != *child);
                        }

                        if let Some(node) = tree.nodes.get_mut(removed) {
                            node.mark_dirty();
                        }
                    }
                }
            }
        }

        // The parent's child set changed (we returned early above when it didn't), so the parent's
        // cached layout — and its ancestors' — is now stale. Taffy's own `set_children` marks the
        // parent dirty for exactly this reason. Without it, a freshly-appended child inherits the
        // parent's cached layout and lands at a default 0x0 rect: a brand-new node's own mark_dirty
        // stops propagating immediately (its cache is already empty -> AlreadyEmpty), so the parent
        // is never invalidated and the root recompute reuses the stale layout.
        self.mark_dirty(parent);
    }

    pub fn add_children(&mut self, node: Id, children: &[Id]) {
        self.append_children(node, children);
    }

    pub fn append_children(&mut self, node: Id, children: &[Id]) {
        self.0.append_children(node, children)
    }

    pub fn prepend_children(&mut self, node: Id, children: &[Id]) {
        self.0.prepend_children(node, children)
    }

    pub fn print_tree(&self, node: Id) {
        self.0.print_tree(node);
    }

    pub fn add_child(&mut self, node: Id, child: Id) {
        self.append(node, child)
    }

    pub fn prepend(&mut self, node: Id, child: Id) {
        self.0.prepend(node, child)
    }

    pub fn add_child_at_index(&mut self, node: Id, child: Id, index: usize) {
        self.0.add_child_at_index(node, child, index);
    }

    pub fn replace_child_at_index(&mut self, node: Id, child: Id, index: usize) -> Option<NodeRef> {
        self.0.replace_child_at_index(node, child, index)
    }

    pub fn insert_child_before(&mut self, node: Id, child: Id, reference: Id) {
        self.0.insert_before(node, child, reference);
    }

    pub fn insert_child_after(&mut self, node: Id, child: Id, reference: Id) {
        self.0.insert_after(node, child, reference);
    }

    pub fn remove_child(&mut self, node: Id, child: Id) -> Option<NodeRef> {
        self.0.remove(node, child)
    }

    pub fn remove_child_at_index(&mut self, node: Id, index: usize) -> Option<NodeRef> {
        self.0.remove_child_at_index(node, index)
    }

    pub fn remove_children(&mut self, node: Id) {
        self.0.remove_all(node)
    }

    pub fn is_children_same(&self, node: Id, children: &[Id]) -> bool {
        self.0.is_children_same(node, children)
    }

    pub fn children(&self, node: Id) -> Vec<NodeRef> {
        self.0.children(node)
    }

    pub fn dirty(&self, node: Id) -> bool {
        self.0.dirty(node)
    }

    pub fn mark_dirty(&mut self, node: Id) {
        self.0.mark_dirty(node)
    }

    /// Set the pseudo-state bitmask for a node and mark it dirty.
    pub fn set_pseudo_states(&mut self, node: Id, flags: u16) {
        if let Some(node) = self.0.nodes_mut().get_mut(node) {
            node.set_pseudo_states(crate::node::PseudoStates::from_bits_truncate(flags));
            node.mark_dirty();
        }
    }

    /// Read the pseudo-state bitmask for a node.
    pub fn get_pseudo_states(&self, node: Id) -> u16 {
        if let Some(node) = self.0.nodes().get(node) {
            node.get_pseudo_states().bits()
        } else {
            0
        }
    }

    pub fn child_count(&self, node: Id) -> usize {
        self.0.child_count(node)
    }

    pub fn child_at_index(&self, node: Id, index: usize) -> Option<NodeRef> {
        self.0.child_at(node, index)
    }

    pub fn style(&self, node: Id) -> Option<MappedRwLockReadGuard<'_, RawRwLock, Style>> {
        RwLockReadGuard::try_map(self.0 .0.read(), |data| {
            data.nodes.get(node).map(|node| node.style())
        })
        .ok()
    }

    pub fn buffer_raw_from(&self, handle: u32) -> Option<(*const u8, usize)> {
        let reader = self.0 .0.read();
        reader
            .style_arena
            .get_ptr_opt(StyleHandle::from_raw(handle))
            .map(|buffer| (buffer, STYLE_BUFFER_SIZE))
    }

    pub fn buffer_raw_mut_from(&mut self, handle: u32) -> Option<(*mut u8, usize)> {
        let mut reader = self.0 .0.write();
        reader
            .style_arena
            .get_ptr_mut_opt(StyleHandle::from_raw(handle))
            .map(|buffer| (buffer, STYLE_BUFFER_SIZE))
    }

    #[cfg(target_vendor = "apple")]
    pub fn buffer_from(&self, handle: u32) -> Option<objc2::rc::Retained<NSMutableData>> {
        let reader = self.0 .0.read();
        reader.style_arena.buffer_opt(StyleHandle::from_raw(handle))
    }

    #[cfg(target_vendor = "apple")]
    pub fn buffer_from_ptr(&self, handle: u32) -> Option<*mut c_void> {
        let reader = self.0 .0.read();
        reader
            .style_arena
            .buffer_opt(StyleHandle::from_raw(handle))
            .map(|buffer| objc2::rc::Retained::into_raw(buffer) as *mut c_void)
    }

    #[cfg(target_os = "android")]
    pub fn buffer_from(&self, handle: u32) -> Option<jni::sys::jint> {
        let reader = self.0 .0.read();
        reader.style_arena.buffer_opt(StyleHandle::from_raw(handle))
    }

    #[cfg(target_os = "android")]
    pub fn set_handle_buffer(&mut self, handle: u32, buffer_id: i32) {
        let mut reader = self.0 .0.write();
        reader
            .style_arena
            .set_handle_buffer(StyleHandle::from_raw(handle), buffer_id);
    }

    pub fn with_style<F>(&self, node: Id, func: F)
    where
        F: FnOnce(&Style),
    {
        self.0.with_style(node, func)
    }

    pub fn with_style_mut<F>(&mut self, node: Id, func: F)
    where
        F: FnOnce(&mut Style),
    {
        self.0.with_style_mut(node, func)
    }

    /// Prepare and invoke `func` on a mutable pseudo `Style` for `node` matching `flags`.
    /// Creates the pseudo slot (cloned from base style) if absent.
    #[track_caller]
    pub fn with_pseudo_style_mut<F>(&mut self, node: Id, flags: u16, func: F)
    where
        F: FnOnce(&mut Style),
    {
        use crate::node::PseudoStates;
        let mut nodes = self.0.nodes_mut();
        let Some(node) = nodes.get_mut(node) else {
            return;
        };

        let bits = PseudoStates::from_bits_truncate(flags);
        if bits.is_empty() {
            node.style.prepare_mut();
            func(&mut node.style);
            return;
        }

        if node.pseudo_styles.is_none() {
            node.pseudo_styles = Some(crate::node::PseudoStyles::default());
        }
        let base = node.style.clone();
        let p = node.pseudo_styles.as_mut().unwrap();

        let slot = if bits.contains(PseudoStates::HOVER) {
            &mut p.hover
        } else if bits.contains(PseudoStates::ACTIVE) {
            &mut p.active
        } else if bits.contains(PseudoStates::FOCUS) {
            &mut p.focus
        } else if bits.contains(PseudoStates::DISABLED) {
            &mut p.disabled
        } else if bits.contains(PseudoStates::CHECKED) {
            &mut p.checked
        } else {
            return;
        };

        func(get_or_init_pseudo(slot, &base));
    }
    pub fn get_root(&self, node: Id) -> Option<NodeRef> {
        self.0.root(node)
    }

    pub fn reset_arena_defaults(&mut self) {
        self.0.reset_arena_defaults();
    }
}

#[doc(hidden)]
pub mod test_helpers {
    use super::Id;
    use std::sync::{Mutex, OnceLock};

    type CB = Box<dyn Fn(Id, f32, f32) + Send + Sync>;

    static CALLBACK: OnceLock<Mutex<Option<CB>>> = OnceLock::new();

    pub fn set_computed_size_callback(cb: Option<CB>) {
        let m = CALLBACK.get_or_init(|| Mutex::new(None));
        let mut guard = m.lock().unwrap();
        *guard = cb;
    }

    pub fn call_computed_size(id: Id, width: f32, height: f32) {
        if let Some(m) = CALLBACK.get() {
            if let Some(cb) = &*m.lock().unwrap() {
                cb(id, width, height);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::style::DisplayMode;
    use std::ffi::{c_float, c_longlong, c_void};

    extern "C" fn test_measure(
        _data: *const c_void,
        _known_w: c_float,
        _known_h: c_float,
        _avail_w: c_float,
        _avail_h: c_float,
    ) -> c_longlong {
        MeasureOutput::make(200.0, 20.0)
    }

    extern "C" fn test_measure_parent_text(
        _data: *const c_void,
        _known_w: c_float,
        _known_h: c_float,
        _avail_w: c_float,
        _avail_h: c_float,
    ) -> c_longlong {
        MeasureOutput::make(150.0, 12.0)
    }

    #[test]
    fn inline_text_segments_compute_size() {
        let mut mason = Mason::new();

        let parent = mason.create_text_node();
        let pid = parent.id();

        mason.set_segments(
            pid,
            vec![
                InlineSegment::Text {
                    flags: 0,
                    width: 50.0,
                    ascent: 10.0,
                    descent: 2.0,
                },
                InlineSegment::Text {
                    flags: 0,
                    width: 100.0,
                    ascent: 10.0,
                    descent: 2.0,
                },
            ],
        );

        mason.set_measure(pid, Some(test_measure_parent_text), std::ptr::null_mut());

        mason.compute(pid);
        let out = mason.layout(pid);

        let width = out[3];
        let height = out[4];

        assert!((width - 150.0).abs() < 0.001, "unexpected width: {}", width);
        assert!(
            (height - 12.0).abs() < 0.001,
            "unexpected height: {}",
            height
        );
    }

    #[test]
    fn inline_child_with_measure_function() {
        let mut mason = Mason::new();

        let parent = mason.create_text_node();
        let child = mason.create_image_node();

        let pid = parent.id();
        let cid = child.id();

        mason.set_segments(
            pid,
            vec![InlineSegment::InlineChild {
                id: Some(cid),
                baseline: 0.0,
            }],
        );

        mason.append_node(pid, &[cid]);

        mason.set_measure(cid, Some(test_measure), std::ptr::null_mut());
        mason.set_measure(pid, Some(test_measure), std::ptr::null_mut());

        mason.compute(pid);
        let pout = mason.layout(pid);
        let cout = mason.layout(cid);

        let parent_width = pout[3];
        let parent_height = pout[4];

        let child_width = cout[3];
        let child_height = cout[4];

        assert!(
            (child_width - 200.0).abs() < 0.001,
            "child width: {}",
            child_width
        );
        assert!(
            (child_height - 20.0).abs() < 0.001,
            "child height: {}",
            child_height
        );

        assert!(parent_width >= child_width - 0.001);
        assert!(parent_height >= child_height - 0.001);
    }

    #[test]
    fn root_height_with_maxcontent() {
        // simulate the Android/IOS wrapper mapping of an unconstrained spec
        // (UNSPECIFIED or AT_MOST 0) to MaxContent.  The parent should grow to
        // contain its child rather than collapsing to 0.
        let mut mason = Mason::new();
        let parent = mason.create_node();
        let child = mason.create_node();

        // child is a text leaf with intrinsic height
        mason.set_segments(
            child.id(),
            vec![InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 8.0,
                descent: 3.0,
            }],
        );

        mason.append_node(parent.id(), &[child.id()]);
        // width definite; height max-content (-2.0 sentinel)
        mason.compute_wh(parent.id(), 100.0, -2.0);

        let pout = mason.layout(parent.id());
        let parent_h = pout[4];
        assert!(
            parent_h > 0.0,
            "parent height should be positive but was {}",
            parent_h
        );
    }

    #[test]
    fn root_height_with_text_child_measure() {
        // Mimics the Android RootHeightInstrumentedTest scenario:
        // a normal View parent with a TextView child that has a measure function.
        // The measure function returns (318, 65).
        extern "C" fn text_measure(
            _data: *const c_void,
            _known_w: c_float,
            _known_h: c_float,
            _avail_w: c_float,
            _avail_h: c_float,
        ) -> c_longlong {
            MeasureOutput::make(318.0, 65.0)
        }

        let mut mason = Mason::new();
        let parent = mason.create_node();
        let child = mason.create_text_node();

        let pid = parent.id();
        let cid = child.id();

        mason.set_measure(cid, Some(text_measure), std::ptr::null_mut());
        mason.append_node(pid, &[cid]);

        // Track computed sizes for debugging
        let sizes = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
        let sizes_clone = sizes.clone();
        crate::test_helpers::set_computed_size_callback(Some(Box::new(move |id, w, h| {
            sizes_clone.lock().unwrap().push((id, w, h));
        })));

        // First: MinContent width, MaxContent height (like Android -1, -2)
        mason.compute_wh(pid, -1.0, -2.0);
        let pout = mason.layout(pid);
        let parent_h = pout[4];
        let _parent_w = pout[3];

        let cout = mason.layout(cid);
        let _child_h = cout[4];
        let _child_w = cout[3];

        // Print all computed sizes
        let computed = sizes.lock().unwrap();
        for &(_id, _w, _h) in computed.iter() {}
        drop(computed);

        assert!(
            parent_h > 0.0,
            "parent height should be positive but was {} (bits=0x{:08x})",
            parent_h,
            parent_h.to_bits()
        );

        // Cleanup callback
        crate::test_helpers::set_computed_size_callback(None);
    }

    #[test]
    fn shared_style_handle_cow() {
        let mut mason = Mason::new();

        let a = mason.create_text_node();
        let b = mason.create_text_node();
        let a_id = a.id();
        let b_id = b.id();

        mason.with_style(a_id, |s| {
            assert_eq!(s.display_mode(), DisplayMode::Inline);
        });
        mason.with_style(b_id, |s| {
            assert_eq!(s.display_mode(), DisplayMode::Inline);
        });

        mason.with_style_mut(a_id, |s| {
            s.set_display(Display::Block);
            s.set_display_mode(DisplayMode::None);
        });

        mason.with_style(a_id, |s| {
            assert_eq!(
                s.display_mode(),
                DisplayMode::None,
                "a should be None after set_display(Block)"
            );
        });

        mason.with_style(b_id, |s| {
            assert_eq!(
                s.display_mode(),
                DisplayMode::Inline,
                "b must be unchanged after mutating a"
            );
        });
    }

    #[test]
    fn inline_block_baseline_simple() {
        let mut mason = Mason::new();

        let ib = mason.create_node();
        let txt = mason.create_text_node();
        let ib_id = ib.id();
        let txt_id = txt.id();

        mason.set_segments(
            txt_id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 8.0,
                descent: 3.0,
            }],
        );

        mason.with_style_mut(ib_id, |s| {
            s.set_display_mode(crate::style::DisplayMode::Box);
        });

        mason.append_node(ib_id, &[txt_id]);
        mason.compute(ib_id);

        let child_baseline = mason.0.get_child_baseline(txt_id);
        assert!(
            child_baseline > 0.0,
            "child baseline expected >0, got {}",
            child_baseline
        );

        let baseline = mason.0.get_child_baseline(ib_id);
        assert!(
            baseline > 0.0,
            "expected positive baseline for inline-block, got {}",
            baseline
        );
    }

    #[test]
    fn inline_block_baseline_deep_descendant() {
        let mut mason = Mason::new();

        let ib = mason.create_node();
        let wrapper = mason.create_node();
        let txt = mason.create_text_node();

        let ib_id = ib.id();
        let wrapper_id = wrapper.id();
        let txt_id = txt.id();

        mason.set_segments(
            txt_id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 30.0,
                ascent: 9.0,
                descent: 4.0,
            }],
        );

        mason.with_style_mut(ib_id, |s| {
            s.set_display_mode(crate::style::DisplayMode::Box);
        });

        mason.append_node(wrapper_id, &[txt_id]);
        mason.append_node(ib_id, &[wrapper_id]);

        mason.compute(ib_id);

        let baseline = mason.0.get_child_baseline(ib_id);
        assert!(
            baseline > 0.0,
            "expected positive baseline from deep descendant, got {}",
            baseline
        );
    }

    #[test]
    fn inline_flex_baseline_simple() {
        let mut mason = Mason::new();

        let ifc = mason.create_node();
        let txt = mason.create_text_node();
        let ifc_id = ifc.id();
        let txt_id = txt.id();

        mason.set_segments(
            txt_id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 25.0,
                ascent: 7.0,
                descent: 3.0,
            }],
        );

        mason.with_style_mut(ifc_id, |s| {
            s.set_display_mode(crate::style::DisplayMode::Box);
            s.set_display(taffy::style::Display::Flex);
        });

        mason.append_node(ifc_id, &[txt_id]);
        mason.compute(ifc_id);

        let child_baseline = mason.0.get_child_baseline(txt_id);
        assert!(
            child_baseline > 0.0,
            "child baseline expected >0, got {}",
            child_baseline
        );

        let baseline = mason.0.get_child_baseline(ifc_id);
        assert!(
            baseline > 0.0,
            "expected positive baseline for inline-flex, got {}",
            baseline
        );
    }

    #[test]
    fn inline_grid_baseline_simple() {
        let mut mason = Mason::new();

        let igc = mason.create_node();
        let txt = mason.create_text_node();
        let igc_id = igc.id();
        let txt_id = txt.id();

        mason.set_segments(
            txt_id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 18.0,
                ascent: 6.0,
                descent: 2.0,
            }],
        );

        mason.with_style_mut(igc_id, |s| {
            s.set_display_mode(crate::style::DisplayMode::Box);
            s.set_display(taffy::style::Display::Grid);
        });

        mason.append_node(igc_id, &[txt_id]);
        mason.compute(igc_id);

        let child_baseline = mason.0.get_child_baseline(txt_id);
        assert!(
            child_baseline > 0.0,
            "child baseline expected >0, got {}",
            child_baseline
        );

        let baseline = mason.0.get_child_baseline(igc_id);
        assert!(
            baseline > 0.0,
            "expected positive baseline for inline-grid, got {}",
            baseline
        );
    }

    #[test]
    fn cache_invalidation_on_style_change() {
        let mut mason = Mason::new();

        let parent = mason.create_node();
        let child = mason.create_text_node();
        let pid = parent.id();
        let cid = child.id();

        mason.append_node(pid, &[cid]);

        // set simple text segments so layout does work
        mason.set_segments(
            cid,
            vec![InlineSegment::Text {
                flags: 0,
                width: 10.0,
                ascent: 5.0,
                descent: 2.0,
            }],
        );

        // First compute: should populate cache for parent
        mason.compute(pid);

        // Access internal cache state to ensure something was stored
        let inner = mason.0.inner();
        let node = inner.nodes.get(pid).unwrap();
        assert!(
            !node.cache.is_empty(),
            "expected cache to be populated after compute"
        );

        drop(inner);

        // mutate to a different value; should mark dirty and clear cache
        mason.with_style_mut(pid, |s| {
            s.set_display(taffy::style::Display::Flex);
        });

        let inner2 = mason.0.inner();
        let node2 = inner2.nodes.get(pid).unwrap();
        assert!(
            node2.cache.is_empty(),
            "expected cache to be cleared after a real style change"
        );
        drop(inner2);

        // recompute, then re-apply the same value as a no-op write
        mason.compute(pid);
        let inner3 = mason.0.inner();
        assert!(
            !inner3.nodes.get(pid).unwrap().cache.is_empty(),
            "expected cache to be populated after recompute"
        );
        drop(inner3);

        mason.with_style_mut(pid, |s| {
            s.set_display(taffy::style::Display::Flex);
        });
        let inner4 = mason.0.inner();
        assert!(
            !inner4.nodes.get(pid).unwrap().cache.is_empty(),
            "expected cache to survive a no-op style write (same value re-applied)"
        );
    }

    #[test]
    fn inline_line_breaks_height() {
        let mut mason = Mason::new();
        let parent = mason.create_node();
        let txt = mason.create_text_node();
        let pid = parent.id();
        let tid = txt.id();

        mason.append_node(pid, &[tid]);

        mason.set_segments(
            tid,
            vec![
                InlineSegment::Text {
                    flags: 0,
                    width: 50.0,
                    ascent: 10.0,
                    descent: 2.0,
                },
                InlineSegment::LineBreak,
                InlineSegment::Text {
                    flags: 0,
                    width: 30.0,
                    ascent: 8.0,
                    descent: 2.0,
                },
            ],
        );

        mason.compute(pid);
        let out = mason.layout(pid);
        let height = out[4];

        let expected = (10.0 + 2.0) + (8.0 + 2.0);
        assert!(
            (height - expected).abs() < 0.001,
            "line-break height mismatch: {} vs {}",
            height,
            expected
        );
    }

    #[test]
    fn anonymous_text_baseline() {
        let mut mason = Mason::new();

        let txt = mason.create_anonymous_text_node();
        let tid = txt.id();

        mason.set_segments(
            tid,
            vec![InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 9.0,
                descent: 3.0,
            }],
        );

        mason.compute(tid);

        let baseline = mason.0.get_child_baseline(tid);
        assert!(
            baseline > 0.0,
            "anonymous text baseline should be positive, got {}",
            baseline
        );
    }

    #[test]
    fn inline_block_overflow_hidden_baseline_zero() {
        let mut mason = Mason::new();

        let ib = mason.create_node();
        let txt = mason.create_text_node();
        let ib_id = ib.id();
        let txt_id = txt.id();

        mason.set_segments(
            txt_id,
            vec![InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 8.0,
                descent: 3.0,
            }],
        );

        mason.with_style_mut(ib_id, |s| {
            s.set_display_mode(crate::style::DisplayMode::Box);
            s.set_overflow(taffy::Point {
                x: crate::style::Overflow::Hidden,
                y: crate::style::Overflow::Hidden,
            });
        });

        mason.append_node(ib_id, &[txt_id]);
        mason.compute(ib_id);

        let baseline = mason.0.get_child_baseline(ib_id);
        assert!(
            (baseline - 0.0).abs() < 0.001,
            "expected baseline 0 for overflow:hidden, got {}",
            baseline
        );
    }

    #[test]
    fn css_whitespace_behavior_documentation() {
        // This test documents the current engine behavior for consecutive
        // text segments (spaces are represented as segments). It asserts
        // the total width equals the sum of segment widths (no automatic
        // collapsing at this layer).
        let mut mason = Mason::new();
        let parent = mason.create_node();
        let txt = mason.create_text_node();
        let pid = parent.id();
        let tid = txt.id();

        mason.append_node(pid, &[tid]);

        // Simulate: "foo  bar" as segments: 'foo'(30), ' '(5), ' '(5), 'bar'(30)
        mason.set_segments(
            tid,
            vec![
                InlineSegment::Text {
                    flags: 0,
                    width: 30.0,
                    ascent: 10.0,
                    descent: 2.0,
                },
                InlineSegment::Text {
                    flags: 0,
                    width: 5.0,
                    ascent: 0.0,
                    descent: 0.0,
                },
                InlineSegment::Text {
                    flags: 0,
                    width: 5.0,
                    ascent: 0.0,
                    descent: 0.0,
                },
                InlineSegment::Text {
                    flags: 0,
                    width: 30.0,
                    ascent: 10.0,
                    descent: 2.0,
                },
            ],
        );

        mason.compute(pid);
        let out = mason.layout(pid);
        let width = out[3];

        let expected = 30.0 + 5.0 + 5.0 + 30.0;
        assert!(
            (width - expected).abs() < 0.001,
            "whitespace width mismatch: {} vs {}",
            width,
            expected
        );
    }

    #[test]
    fn anonymous_block_wrapping() {
        // Tests that inline text before and after a block child are laid out
        // as separate line boxes surrounding the block (anonymous block
        // behavior). We assert the parent height equals sum of lines + block.
        let mut mason = Mason::new();

        let parent = mason.create_node();
        let text1 = mason.create_text_node();
        let block = mason.create_node();
        let text2 = mason.create_text_node();

        let pid = parent.id();
        let t1 = text1.id();
        let b = block.id();
        let t2 = text2.id();

        // Attach children in order: text1, block, text2
        mason.append_node(pid, &[t1, b, t2]);

        // text segments small single-line
        mason.set_segments(
            t1,
            vec![InlineSegment::Text {
                flags: 0,
                width: 20.0,
                ascent: 8.0,
                descent: 2.0,
            }],
        );
        mason.set_segments(
            t2,
            vec![InlineSegment::Text {
                flags: 0,
                width: 30.0,
                ascent: 9.0,
                descent: 3.0,
            }],
        );

        // make block have a height
        mason.with_style_mut(b, |s| {
            s.set_display(taffy::style::Display::Block);
        });

        // Ensure block child has an intrinsic size by measuring it via leaf
        mason.compute(pid);

        let out = mason.layout(pid);
        let parent_h = out[4];

        // expected: line1 height + block height + line2 height
        let line1 = 8.0 + 2.0;
        // block height read from computed layout of block
        let block_out = mason.layout(b);
        let block_h = block_out[4];
        let line2 = 9.0 + 3.0;

        let expected = line1 + block_h + line2;
        assert!(
            (parent_h - expected).abs() < 0.001,
            "anonymous block wrapping height mismatch: {} vs {}",
            parent_h,
            expected
        );
    }
}
