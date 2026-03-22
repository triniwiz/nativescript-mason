pub use crate::tree::{Id, Tree};
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;

use parking_lot::lock_api::MappedRwLockReadGuard;
use parking_lot::{RawRwLock, RwLockReadGuard};
use slotmap::{Key, KeyData, SlotMap};
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::Ordering;
pub use style_atoms::Atom;
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
    let layout = taffy.layout_raw(node);
    // (previously had a defensive clamp here; reverted to preserve raw
    // computed values so we can trace origins upstream)
    if let Some(children) = taffy.inner().children.get(node) {
        let len = children.len();
        output.reserve(len * 22);

        output.push(layout.order as f32);
        output.push(layout.location.x);
        output.push(layout.location.y);
        output.push(layout.size.width);
        // If the computed layout height is tiny (possibly from underflow or
        // an uninitialized/near-zero result) but the content_size indicates
        // a meaningful height, prefer exporting the content_size so the
        // platform receives a usable value. Do not mutate the internal
        // layout; only adjust the exported value.
        let mut export_h = layout.size.height;
        if export_h.abs() <= 1e-6 && layout.content_size.height > export_h {
             export_h = layout.content_size.height;
        }
        output.push(export_h);

        // reorder if rect constructor changes
        // Current order T,R,B,L

        output.push(layout.border.top);
        output.push(layout.border.right);
        output.push(layout.border.bottom);
        output.push(layout.border.left);

        output.push(layout.margin.top);
        output.push(layout.margin.right);
        output.push(layout.margin.bottom);
        output.push(layout.margin.left);

        output.push(layout.padding.top);
        output.push(layout.padding.right);
        output.push(layout.padding.bottom);
        output.push(layout.padding.left);

        output.push(layout.content_size.width);
        output.push(layout.content_size.height);

        output.push(layout.scrollbar_size.width);
        output.push(layout.scrollbar_size.height);

        output.push(len as f32);

        for child in children {
            copy_output(taffy, *child, output);
        }
    }
}

fn copy_output_count(taffy: &Tree, node: Id, output: &mut Vec<f32>, count: &mut usize) {
    let layout = taffy.layout(node);
    if let Some(children) = taffy.inner().children.get(node) {
        let len = children.len();
        *count += 1;
        output.reserve(len * 22);

        output.push(layout.order as f32);
        output.push(layout.location.x);
        output.push(layout.location.y);
        output.push(layout.size.width);
        output.push(layout.size.height);

        output.push(layout.border.top);
        output.push(layout.border.right);
        output.push(layout.border.bottom);
        output.push(layout.border.left);

        output.push(layout.margin.top);
        output.push(layout.margin.right);
        output.push(layout.margin.bottom);
        output.push(layout.margin.left);

        output.push(layout.padding.top);
        output.push(layout.padding.right);
        output.push(layout.padding.bottom);
        output.push(layout.padding.left);

        output.push(layout.content_size.width);
        output.push(layout.content_size.height);

        output.push(layout.scrollbar_size.width);
        output.push(layout.scrollbar_size.height);

        output.push(len as f32);

        for child in children {
            copy_output_count(taffy, *child, output, count);
        }
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
        Self::with_capacity(128)
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
        use objc2::Message;
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
                if let Some(p) = &node.pseudo_styles {
                    use crate::node::PseudoStates;
                    let bits = PseudoStates::from_bits_truncate(flags);
                    if bits.contains(PseudoStates::HOVER) {
                        if let Some(s) = &p.hover {
                            return Some(s.buffer());
                        }
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if let Some(s) = &p.active {
                            return Some(s.buffer());
                        }
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if let Some(s) = &p.focus {
                            return Some(s.buffer());
                        }
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if let Some(s) = &p.disabled {
                            return Some(s.buffer());
                        }
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if let Some(s) = &p.checked {
                            return Some(s.buffer());
                        }
                    }
                }
                None
            })
            .unwrap_or(-1 as _)
    }

    #[track_caller]
    pub fn pseudo_style_data_raw(&self, node: Id, flags: u16) -> (*const u8, usize) {
        self.0
            .nodes()
            .get(node)
            .and_then(|node| {
                if let Some(p) = &node.pseudo_styles {
                    use crate::node::PseudoStates;
                    let bits = PseudoStates::from_bits_truncate(flags);
                    if bits.contains(PseudoStates::HOVER) {
                        if let Some(s) = &p.hover {
                            return Some(s.raw());
                        }
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if let Some(s) = &p.active {
                            return Some(s.raw());
                        }
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if let Some(s) = &p.focus {
                            return Some(s.raw());
                        }
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if let Some(s) = &p.disabled {
                            return Some(s.raw());
                        }
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if let Some(s) = &p.checked {
                            return Some(s.raw());
                        }
                    }
                }
                None
            })
            .unwrap_or((0 as _, 0))
    }

        /// Return the StyleHandle for a pseudo style (immutable) if present.
        #[track_caller]
        pub fn pseudo_style_handle(&self, node: Id, flags: u16) -> Option<u32> {
            self.0
                .nodes()
                .get(node)
                .and_then(|node| {
                    if let Some(p) = &node.pseudo_styles {
                        use crate::node::PseudoStates;
                        let bits = PseudoStates::from_bits_truncate(flags);
                        if bits.contains(PseudoStates::HOVER) {
                            if let Some(s) = &p.hover {
                                return Some(s.handle.index() as u32);
                            }
                        }
                        if bits.contains(PseudoStates::ACTIVE) {
                            if let Some(s) = &p.active {
                                return Some(s.handle.index() as u32);
                            }
                        }
                        if bits.contains(PseudoStates::FOCUS) {
                            if let Some(s) = &p.focus {
                                return Some(s.handle.index() as u32);
                            }
                        }
                        if bits.contains(PseudoStates::DISABLED) {
                            if let Some(s) = &p.disabled {
                                return Some(s.handle.index() as u32);
                            }
                        }
                        if bits.contains(PseudoStates::CHECKED) {
                            if let Some(s) = &p.checked {
                                return Some(s.handle.index() as u32);
                            }
                        }
                    }
                    None
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
                use crate::node::PseudoStates;
                let bits = PseudoStates::from_bits_truncate(flags);

                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(node::PseudoStyles::default());
                }

                if let Some(p) = &mut node.pseudo_styles {
                    // choose first matching pseudo in priority order
                    if bits.contains(PseudoStates::HOVER) {
                        if p.hover.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.hover = Some(s);
                        } else {
                            p.hover.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.hover.as_mut().unwrap().raw_mut());
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if p.active.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.active = Some(s);
                        } else {
                            p.active.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.active.as_mut().unwrap().raw_mut());
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if p.focus.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.focus = Some(s);
                        } else {
                            p.focus.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.focus.as_mut().unwrap().raw_mut());
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if p.disabled.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.disabled = Some(s);
                        } else {
                            p.disabled.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.disabled.as_mut().unwrap().raw_mut());
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if p.checked.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.checked = Some(s);
                        } else {
                            p.checked.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.checked.as_mut().unwrap().raw_mut());
                    }
                }
                None
            })
            .unwrap_or((0 as _, 0))
    }

    /// Prepare and return the StyleHandle for a mutable pseudo style.
    /// Caller may then query `buffer_from(handle)` / `buffer_raw_mut_from(handle)`.
    #[track_caller]
    pub fn pseudo_style_handle_mut(&mut self, node: Id, flags: u16) -> Option<u32> {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                use crate::node::PseudoStates;
                let bits = PseudoStates::from_bits_truncate(flags);

                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(crate::node::PseudoStyles::default());
                }

                if let Some(p) = &mut node.pseudo_styles {
                    // choose first matching pseudo in priority order
                    if bits.contains(PseudoStates::HOVER) {
                        if p.hover.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.hover = Some(s);
                        } else {
                            p.hover.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.hover.as_ref().unwrap().handle.index() as u32);
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if p.active.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.active = Some(s);
                        } else {
                            p.active.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.active.as_ref().unwrap().handle.index() as u32);
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if p.focus.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.focus = Some(s);
                        } else {
                            p.focus.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.focus.as_ref().unwrap().handle.index() as u32);
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if p.disabled.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.disabled = Some(s);
                        } else {
                            p.disabled.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.disabled.as_ref().unwrap().handle.index() as u32);
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if p.checked.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.checked = Some(s);
                        } else {
                            p.checked.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.checked.as_ref().unwrap().handle.index() as u32);
                    }
                }
                None
            })
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn pseudo_style_data_mut(&mut self, node: Id, flags: u16) -> jni::sys::jint {
        self.0
            .nodes_mut()
            .get_mut(node)
            .and_then(|node| {
                use crate::node::PseudoStates;
                let bits = PseudoStates::from_bits_truncate(flags);

                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(crate::node::PseudoStyles::default());
                }

                if let Some(p) = &mut node.pseudo_styles {
                    if bits.contains(PseudoStates::HOVER) {
                        if p.hover.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.hover = Some(s);
                        } else {
                            p.hover.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.hover.as_ref().unwrap().buffer());
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if p.active.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.active = Some(s);
                        } else {
                            p.active.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.active.as_ref().unwrap().buffer());
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if p.focus.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.focus = Some(s);
                        } else {
                            p.focus.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.focus.as_ref().unwrap().buffer());
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if p.disabled.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.disabled = Some(s);
                        } else {
                            p.disabled.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.disabled.as_ref().unwrap().buffer());
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if p.checked.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.checked = Some(s);
                        } else {
                            p.checked.as_mut().unwrap().prepare_mut();
                        }
                        return Some(p.checked.as_ref().unwrap().buffer());
                    }
                }

                None
            })
            .unwrap_or(-1 as _)
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> *mut c_void {
        use objc2::Message;
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
    pub fn setup(&mut self, node: Id, measure: jni::sys::jint) {
        let has_measure = measure != -1;
        if let Some(nd) = self.0.node_data_mut().get_mut(node) {
            nd.measure = measure;
        }

        if let Some(node) = self.0.nodes_mut().get_mut(node) {
            node.has_measure = has_measure;
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_measure(&mut self, node: Id, measure: jni::sys::jint) {
        let has_measure = measure != -1;
        if let Some(nd) = self.0.node_data_mut().get_mut(node) {
            nd.measure = measure;
        }

        if let Some(node) = self.0.nodes_mut().get_mut(node) {
            node.has_measure = has_measure;
        }
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
        let mut output = vec![];
        copy_output(&self.0, node_id, &mut output);
        // Debug: emit the first node's frame (order,x,y,w,h) so we can
        // verify whether degenerate heights are produced on the native side
        // before the Vec<f32> is returned to Java. Use the crate logging
        // macros so messages appear in logcat with the existing Rust tag.
        if output.len() >= 5 {
            // Clamp tiny positive heights in the exported Vec so Java parsing
            // doesn't see tiny non-zero values that should be
            // treated as zero.
            let mut export_h = output[4];
            if export_h > 0.0 && export_h.abs() < 1e-6_f32 {
                export_h = 0.0;
                output[4] = export_h;
            }
        }

        output
    }

    pub fn layout_raw(&self, node_id: Id) -> Layout {
        *self.0.layout(node_id.into())
    }

    /// Return transient float rects for a container as a flat Vec<[left,top,right,bottom,...]>
    pub fn get_float_rects(&self, container_id: Id) -> Vec<f32> {
        if let Some(rects) = self.0.get_float_rects_simple(container_id) {
            let mut out = Vec::with_capacity(rects.len() * 4);
            for r in rects {
                out.push(r.left);
                out.push(r.top);
                out.push(r.right);
                out.push(r.bottom);
            }
            out
        } else {
            Vec::new()
        }
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
        // debug log for callers to verify the incoming floats and the
        // corresponding AvailableSpace conversions.  this helps track down
        // any mis‑mapping between the Android layer and the engine.
        #[cfg(debug_assertions)]
        {
            let width_space = if width == -1.0 {
                AvailableSpace::MinContent
            } else if width == -2.0 {
                AvailableSpace::MaxContent
            } else {
                AvailableSpace::Definite(width)
            };
            let height_space = if height == -1.0 {
                AvailableSpace::MinContent
            } else if height == -2.0 {
                AvailableSpace::MaxContent
            } else {
                AvailableSpace::Definite(height)
            };
            log::debug!(
                "compute_wh called: raw (w,h) = ({},{}) -> ({:?},{:?})",
                width,
                height,
                width_space,
                height_space
            );
        }

        let size = Size {
            width: match width {
                x if x == -1.0 => AvailableSpace::MinContent,
                x if x == -2.0 => AvailableSpace::MaxContent,
                _ => AvailableSpace::Definite(width),
            },
            height: match height {
                x if x == -1.0 => AvailableSpace::MinContent,
                x if x == -2.0 => AvailableSpace::MaxContent,
                _ => AvailableSpace::Definite(height),
            },
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
    }

    pub fn clear_segments(&mut self, node: Id) {
        if let Some(data) = self.0.node_data().get(node) {
            data.inline_segments.lock().clear();
        }
    }

    pub fn set_segments(&mut self, node: Id, segments: Vec<InlineSegment>) {
        if let Some(data) = self.0.node_data().get(node) {
            *data.inline_segments.lock() = segments;
        }
    }

    pub fn get_segments(&self, node: Id) -> Vec<InlineSegment> {
        self.0
            .node_data()
            .get(node)
            .map(|data| data.inline_segments.lock().clone())
            .unwrap_or_default()
    }

    pub fn set_children(&mut self, parent: Id, children: &[Id]) {
        let mut tree = &mut self.0 .0.write();
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
            return;
        }

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
    /// This will create the pseudo Style slot (cloned from base style) if missing
    /// and call `prepare_mut()` on it before invoking `func` so callers can safely
    /// mutate complex non-buffer data (strings/arrays) for pseudos.
    #[track_caller]
    pub fn with_pseudo_style_mut<F>(&mut self, node: Id, flags: u16, func: F)
    where
        F: FnOnce(&mut Style),
    {
        self.0
            .nodes_mut()
            .get_mut(node)
            .map(|node| {
                use crate::node::PseudoStates;
                let bits = PseudoStates::from_bits_truncate(flags);

                // When no pseudo state bits are set, apply to the base style
                if bits.is_empty() {
                    node.style.prepare_mut();
                    func(&mut node.style);
                    return;
                }

                if node.pseudo_styles.is_none() {
                    node.pseudo_styles = Some(crate::node::PseudoStyles::default());
                }

                if let Some(p) = &mut node.pseudo_styles {
                    if bits.contains(PseudoStates::HOVER) {
                        if p.hover.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.hover = Some(s);
                        } else {
                            p.hover.as_mut().unwrap().prepare_mut();
                        }
                        func(p.hover.as_mut().unwrap());
                        return;
                    }
                    if bits.contains(PseudoStates::ACTIVE) {
                        if p.active.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.active = Some(s);
                        } else {
                            p.active.as_mut().unwrap().prepare_mut();
                        }
                        func(p.active.as_mut().unwrap());
                        return;
                    }
                    if bits.contains(PseudoStates::FOCUS) {
                        if p.focus.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.focus = Some(s);
                        } else {
                            p.focus.as_mut().unwrap().prepare_mut();
                        }
                        func(p.focus.as_mut().unwrap());
                        return;
                    }
                    if bits.contains(PseudoStates::DISABLED) {
                        if p.disabled.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.disabled = Some(s);
                        } else {
                            p.disabled.as_mut().unwrap().prepare_mut();
                        }
                        func(p.disabled.as_mut().unwrap());
                        return;
                    }
                    if bits.contains(PseudoStates::CHECKED) {
                        if p.checked.is_none() {
                            let mut s = node.style.clone();
                            s.prepare_mut();
                            p.checked = Some(s);
                        } else {
                            p.checked.as_mut().unwrap().prepare_mut();
                        }
                        func(p.checked.as_mut().unwrap());
                        return;
                    }
                }
            })
            .unwrap_or(());
    }
    pub fn get_root(&self, node: Id) -> Option<NodeRef> {
        self.0.root(node)
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
        assert!(parent_h > 0.0, "parent height should be positive but was {}", parent_h);
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
        let parent_w = pout[3];
        eprintln!("compute(-1,-2): parent w={} h={} h_bits=0x{:08x}", parent_w, parent_h, parent_h.to_bits());

        let cout = mason.layout(cid);
        let child_h = cout[4];
        let child_w = cout[3];
        eprintln!("compute(-1,-2): child  w={} h={}", child_w, child_h);

        // Print all computed sizes
        let computed = sizes.lock().unwrap();
        for &(id, w, h) in computed.iter() {
            eprintln!("set_computed_size: id={:?} w={} h={} h_bits=0x{:08x}", id, w, h, h.to_bits());
        }
        drop(computed);

        assert!(parent_h > 0.0, "parent height should be positive but was {} (bits=0x{:08x})", parent_h, parent_h.to_bits());

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

        // Mutate parent style which should mark it dirty and clear its cache
        mason.with_style_mut(pid, |s| {
            s.set_display(taffy::style::Display::Block);
        });

        // After mutation, cache should be cleared
        let inner2 = mason.0.inner();
        let node2 = inner2.nodes.get(pid).unwrap();
        assert!(
            node2.cache.is_empty(),
            "expected cache to be cleared after style change"
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
        // This test documents the current engine behaviour for consecutive
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
