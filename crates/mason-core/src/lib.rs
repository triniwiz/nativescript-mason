use crate::tree::{Id, Tree};
use std::ffi::{c_float, c_longlong, c_void};
use slotmap::Key;
pub use taffy::geometry::{Line, Point, Rect, Size};
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, CompactLength, Dimension,
    Display, FlexDirection, FlexWrap, GridAutoFlow, GridPlacement, GridTrackRepetition,
    JustifyContent, LengthPercentage, LengthPercentageAuto, MaxTrackSizingFunction,
    MinTrackSizingFunction, NonRepeatedTrackSizingFunction, Position, TextAlign,
    TrackSizingFunction,
};
pub use taffy::style_helpers::*;
pub use taffy::Layout;
pub use taffy::Overflow;
use taffy::PrintTree;

mod node;

pub use crate::style::Style;
pub use node::NodeRef;

pub mod style;
mod tree;
pub mod utils;

// #[cfg(target_os = "android")]
pub static JVM: std::sync::OnceLock<jni::JavaVM> = std::sync::OnceLock::new();
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
    if let Some(children) = taffy.children.get(node) {
        let len = children.len();
        output.reserve(len * 22);

        output.push(layout.order as f32);
        output.push(layout.location.x);
        output.push(layout.location.y);
        output.push(layout.size.width);
        output.push(layout.size.height);

        output.push(layout.border.left);
        output.push(layout.border.right);
        output.push(layout.border.top);
        output.push(layout.border.bottom);

        output.push(layout.margin.left);
        output.push(layout.margin.right);
        output.push(layout.margin.top);
        output.push(layout.margin.bottom);

        output.push(layout.padding.left);
        output.push(layout.padding.right);
        output.push(layout.padding.top);
        output.push(layout.padding.bottom);

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

#[derive(Debug)]
pub struct Mason(Tree);

impl Mason {
    pub fn new() -> Self {
        Self::with_capacity(128)
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    pub fn with_capacity(size: usize) -> Self {
        Self(Tree::with_capacity(size))
    }

    #[track_caller]
    pub fn create_node(&mut self) -> NodeRef {
        self.0.create_node()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> jni::objects::GlobalRef {
        self.0.nodes.get_mut(node).unwrap().style.buffer.clone()
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn style_data(&mut self, node: Id) -> *mut c_void {
        use objc2::Message;
        self.0
            .nodes
            .get_mut(node)
            .map(|data| {
                data.style.buffer.retain();
                objc2::rc::Retained::as_ptr(&data.style.buffer) as *mut c_void
            })
            .unwrap_or(0 as _)
    }

    #[track_caller]
    pub fn style_data_raw(&self, node: Id) -> (*const u8, usize) {
        self.0
            .nodes
            .get(node)
            .map(|data| data.style.raw())
            .unwrap_or((0 as _, 0))
    }

    #[track_caller]
    pub fn style_data_raw_mut(&mut self, node: Id) -> (*mut u8, usize) {
        self.0
            .nodes
            .get_mut(node)
            .map(|data| data.style.raw_mut())
            .unwrap_or((0 as _, 0))
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn setup(&mut self, node: Id, measure: Option<jni::objects::GlobalRef>) {
        let has_measure = measure.is_some();
        if let Some(node) = self.0.node_data.get_mut(node) {
            node.measure = measure;
        }

        if let Some(node) = self.0.nodes.get_mut(node) {
            node.has_measure = has_measure;
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_measure(&mut self, node: Id, measure: Option<jni::objects::GlobalRef>) {
        let has_measure = measure.is_some();
        if let Some(node) = self.0.node_data.get_mut(node) {
            node.measure = measure;
        }

        if let Some(node) = self.0.nodes.get_mut(node) {
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
        if let Some(node) = self.0.node_data.get_mut(node) {
            node.measure = measure;
            node.data = data;
        }

        if let Some(node) = self.0.nodes.get_mut(node) {
            node.has_measure = has_measure;
        }
    }

    pub fn layout(&self, node_id: Id) -> Vec<f32> {
        let mut output = vec![];
        copy_output(&self.0, node_id, &mut output);
        output
    }

    pub fn compute_layout(&mut self, node_id: Id, available_space: Size<AvailableSpace>) {
        let use_rounding = self.0.use_rounding;
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

    pub fn set_children(&mut self, parent: Id, children: &[Id]) {
        if let Some(current_children) = self.0.children.get_mut(parent) {
            if children.is_empty() && current_children.is_empty() {
                return;
            }
            if current_children == children {
                return;
            }

            for child in current_children.iter() {
                self.0.parents.remove(*child);
            }

            current_children.clear();
            current_children.extend_from_slice(children);

            for child in children.iter() {
                self.0.parents.insert(*child, Some(parent));
            }
        } else {
            self.0.children.insert(parent, children.to_vec());
            for child in children.iter() {
                self.0.parents.insert(*child, Some(parent));
            }
        }
    }

    pub fn add_children(&mut self, node: Id, children: &[Id]) {
        self.0.append_children(node, children)
    }

    pub fn print_tree(&self, node: Id) {
        self.0.print_tree(node);
    }

    pub fn add_child(&mut self, node: Id, child: Id) {
        self.0.append(node, child)
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

    pub fn set_style(&mut self, node: Id, style: Style) {
        self.0.set_style(node, style);
    }

    pub fn style(&mut self, node: Id) -> Option<&Style> {
        self.0.nodes.get(node).map(|node| &node.style)
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
