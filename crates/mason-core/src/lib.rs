pub use crate::tree::{Id, Tree};
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;

use parking_lot::lock_api::MappedRwLockReadGuard;
use parking_lot::{RawRwLock, RwLockReadGuard};
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::Ordering;
pub use style_atoms::Atom;
pub use taffy::geometry::{Line, Point, Rect, Size};
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, CompactLength, Dimension,
    Display, FlexDirection, FlexWrap, GridAutoFlow, GridPlacement, GridTemplateArea,
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

pub struct MeasureOutput;

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
    let layout = taffy.layout(node);
    if let Some(children) = taffy.inner().children.get(node) {
        let len = children.len();
        output.reserve(len * 22);

        output.push(layout.order as f32);
        output.push(layout.location.x);
        output.push(layout.location.y);
        output.push(layout.size.width);
        output.push(layout.size.height);

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
        let mut tree = self.0.inner_mut();
        if let Some(node) = tree.node_data.get_mut(node) {
            node.measure = measure;
        }

        if let Some(node) = tree.nodes.get_mut(node) {
            node.has_measure = has_measure;
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_measure(&mut self, node: Id, measure: jni::sys::jint) {
        let has_measure = measure != -1;
        let mut tree = self.0.inner_mut();
        if let Some(node) = tree.node_data.get_mut(node) {
            node.measure = measure;
        }

        if let Some(node) = tree.nodes.get_mut(node) {
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

    pub fn layout(&self, node_id: Id) -> Vec<f32> {
        let mut output = vec![];
        copy_output(&self.0, node_id, &mut output);
        output
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
        if let Some(data) = self.0.node_data_mut().get_mut(node) {
            data.inline_segments.push(segment);
        }
    }

    pub fn clear_segments(&mut self, node: Id) {
        if let Some(data) = self.0.node_data_mut().get_mut(node) {
            data.inline_segments.clear();
        }
    }

    pub fn set_segments(&mut self, node: Id, segments: Vec<InlineSegment>) {
        if let Some(data) = self.0.node_data_mut().get_mut(node) {
            data.inline_segments = segments;
        }
    }

    pub fn get_segments(&self, node: Id) -> MappedRwLockReadGuard<'_, RawRwLock, [InlineSegment]> {
        RwLockReadGuard::map(self.0 .0.read(), |data| {
            data.node_data
                .get(node)
                .map(|data| data.inline_segments.as_slice())
                .unwrap_or(&[])
        })
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
    pub fn get_root(&self, node: Id) -> Option<NodeRef> {
        self.0.root(node)
    }
}
