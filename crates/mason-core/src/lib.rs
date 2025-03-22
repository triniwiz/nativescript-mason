use crate::style::StyleKeys;
use std::cell::{Ref, RefCell, RefMut};
use std::os::raw::{c_float, c_longlong, c_void};
use std::rc::{Rc, Weak};
use std::sync::atomic::{AtomicUsize, Ordering};
pub use taffy::geometry::{Line, Point, Rect, Size};
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, BoxSizing, CompactLength, Dimension,
    Display, FlexDirection, FlexWrap, GridAutoFlow, GridPlacement, GridTrackRepetition,
    JustifyContent, LengthPercentage, LengthPercentageAuto, MaxTrackSizingFunction,
    MinTrackSizingFunction, NonRepeatedTrackSizingFunction, Position, Style, TextAlign,
    TrackSizingFunction,
};
pub use taffy::style_helpers::*;
pub use taffy::Layout;
pub use taffy::NodeId;
pub use taffy::Overflow;
use taffy::{TaffyTree, TraversePartialTree};

pub mod style;
pub mod utils;

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

#[derive(Debug, Clone)]
pub struct Node {
    id: NodeId,
    guard: Rc<()>,
    mason: Weak<RefCell<MasonInner>>,
}

impl PartialEq for Node {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }

    fn ne(&self, other: &Self) -> bool {
        self.id != other.id
    }
}

impl Node {
    pub fn id(&self) -> NodeId {
        self.id
    }
}

impl Drop for Node {
    fn drop(&mut self) {
        if Rc::strong_count(&self.guard) <= 2 {
            if let Some(mason) = self.mason.upgrade() {
                let mut mason = mason.borrow_mut();
                let mut tree = mason.tree_mut();
                if tree.parent(self.id).is_none() {
                    let _ = tree.remove(self.id);
                }
            }
        }
    }
}

#[derive(Debug)]
pub struct NodeContextInner {
    #[cfg(not(target_os = "android"))]
    data: *mut c_void,
    #[cfg(target_os = "android")]
    jvm: Option<jni::JavaVM>,
    #[cfg(target_os = "android")]
    measure: Option<jni::objects::GlobalRef>,
    #[cfg(not(target_os = "android"))]
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
    style: StyleContext,
    guard: Rc<()>,
}

impl NodeContextInner {
    #[cfg(not(target_os = "android"))]
    pub fn new(
        data: *mut c_void,
        measure: Option<
            extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong,
        >,
    ) -> NodeContextInner {
        Self {
            data,
            measure,
            style: StyleContext::new(),
            guard: Rc::new(()),
        }
    }

    #[cfg(target_os = "android")]
    pub fn new(jvm: Option<jni::JavaVM>, measure: Option<jni::objects::GlobalRef>) -> Self {
        Self {
            jvm,
            measure,
            style: StyleContext::new(),
            guard: Rc::new(()),
        }
    }

    #[cfg(target_os = "android")]
    pub fn set_jvm(&mut self, jvm: Option<jni::JavaVM>) {
        self.jvm = jvm;
    }
}

#[derive(Debug, Clone)]
pub struct NodeContext(Rc<RefCell<NodeContextInner>>);

#[derive(Debug)]
pub struct StyleContext {
    #[cfg(target_os = "android")]
    buffer: Option<jni::objects::GlobalRef>,
    style_data: Box<[u8]>,
}

fn copy_output(taffy: &TaffyTree<NodeContext>, node: NodeId, output: &mut Vec<f32>) {
    if let Ok(layout) = taffy.layout(node) {
        if let Ok(children) = taffy.children(node) {
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
                copy_output(taffy, child, output);
            }
        }
    }
}

impl StyleContext {
    pub fn new() -> Self {
        let mut data = vec![0u8; StyleKeys::ITEM_IS_TABLE as usize + 4];
        data.shrink_to_fit();

        Self {
            #[cfg(target_os = "android")]
            buffer: None,
            // last item + 4 bytes
            style_data: data.into_boxed_slice(),
        }
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self) -> Option<jni::objects::GlobalRef> {
        self.buffer.clone()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_buffer(&mut self, buffer: Option<jni::objects::GlobalRef>) {
        self.buffer = buffer;
    }

    pub fn data(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.style_data.as_ptr(), self.style_data.len()) }
    }

    pub fn data_mut(&mut self) -> &mut [u8] {
        unsafe {
            std::slice::from_raw_parts_mut(self.style_data.as_mut_ptr(), self.style_data.len())
        }
    }
}

impl NodeContext {
    #[cfg(not(target_os = "android"))]
    pub fn new(
        data: *mut c_void,
        measure: Option<
            extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong,
        >,
    ) -> Self {
        Self(Rc::new(RefCell::new(NodeContextInner::new(data, measure))))
    }

    pub fn style_data(&self) -> Ref<StyleContext> {
        Ref::map(self.0.borrow(), |ctx| &ctx.style)
    }

    pub fn style_data_mut(&self) -> RefMut<StyleContext> {
        RefMut::map(self.0.borrow_mut(), |ctx| &mut ctx.style)
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_jvm(&mut self, jvm: Option<jni::JavaVM>) {
        let mut inner = self.0.borrow_mut();
        inner.jvm = jvm;
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn jvm(&self) -> Option<Ref<jni::JavaVM>> {
        Ref::filter_map(self.0.borrow(), |ctx| ctx.jvm.as_ref()).ok()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self) -> Option<jni::objects::GlobalRef> {
        self.0.borrow().style.buffer()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn new(
        env: &mut jni::JNIEnv,
        jvm: Option<jni::JavaVM>,
        measure: Option<jni::objects::GlobalRef>,
    ) -> Self {
        let ret = Self(Rc::new(RefCell::new(NodeContextInner::new(jvm, measure))));
        {
            let mut context = ret.0.borrow_mut();
            let ptr = context.style.style_data.as_mut_ptr();
            let len = context.style.style_data.len();
            let db = unsafe { env.new_direct_byte_buffer(ptr, len).unwrap() };
            context.style.buffer = Some(env.new_global_ref(db).unwrap());
        }
        ret
    }

    #[cfg(target_os = "android")]
    fn measure(
        &self,
        known_dimensions: taffy::Size<Option<f32>>,
        available_space: taffy::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
        let context = self.0.borrow();
        match (context.measure.as_ref(), context.jvm.as_ref()) {
            (Some(measure), Some(jvm)) => {
                let vm = jvm.attach_current_thread();
                let mut env = vm.unwrap();
                let result = env.call_method(
                    measure.as_obj(),
                    "measure",
                    "(JJ)J",
                    &[
                        jni::objects::JValue::from(MeasureOutput::make(
                            known_dimensions.width.unwrap_or(f32::NAN),
                            known_dimensions.height.unwrap_or(f32::NAN),
                        )),
                        jni::objects::JValue::from(MeasureOutput::make(
                            match available_space.width {
                                AvailableSpace::MinContent => -1.,
                                AvailableSpace::MaxContent => -2.,
                                AvailableSpace::Definite(value) => value,
                            },
                            match available_space.height {
                                AvailableSpace::MinContent => -1.,
                                AvailableSpace::MaxContent => -2.,
                                AvailableSpace::Definite(value) => value,
                            },
                        )),
                    ],
                );

                match result {
                    Ok(result) => {
                        let size = result.j().unwrap_or_default();
                        let width = MeasureOutput::get_width(size);
                        let height = MeasureOutput::get_height(size);

                        Size { width, height }
                    }
                    Err(_) => known_dimensions.map(|v| v.unwrap_or(0.0)),
                }
            }
            _ => known_dimensions.map(|v| v.unwrap_or(0.0)),
        }
    }

    #[cfg(not(target_os = "android"))]
    pub fn measure(
        &self,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> Size<f32> {
        let context = self.0.borrow();

        match context.measure.as_ref() {
            None => Size {
                width: known_dimensions.width.unwrap_or_default(),
                height: known_dimensions.height.unwrap_or_default(),
            },
            Some(measure) => {
                let measure_data = context.data;
                let available_space_width = match available_space.width {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let available_space_height = match available_space.height {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let size = measure(
                    measure_data,
                    known_dimensions.width.unwrap_or(f32::NAN),
                    known_dimensions.height.unwrap_or(f32::NAN),
                    available_space_width,
                    available_space_height,
                );

                let width = MeasureOutput::get_width(size);
                let height = MeasureOutput::get_height(size);

                Size { width, height }
            }
        }
    }
}

fn measure_function(
    known_dimensions: Size<Option<f32>>,
    available_space: Size<AvailableSpace>,
    node_id: NodeId,
    context: Option<&mut NodeContext>,
    _style: &Style,
) -> Size<f32> {
    if let Size {
        width: Some(width),
        height: Some(height),
    } = known_dimensions
    {
        return Size { width, height };
    }

    match context {
        None => Size::zero(),
        Some(data) => data.measure(known_dimensions, available_space),
    }
}

#[derive(Debug)]
struct MasonInner {
    pub(crate) id: usize,
    pub(crate) tree: TaffyTree<NodeContext>,
}

impl MasonInner {
    pub fn tree(&self) -> &TaffyTree<NodeContext> {
        &self.tree
    }

    pub fn tree_mut(&mut self) -> &mut TaffyTree<NodeContext> {
        &mut self.tree
    }
}
#[derive(Debug, Clone)]
pub struct Mason(Rc<RefCell<MasonInner>>);

impl Mason {
    pub fn tree(&self) -> Ref<TaffyTree<NodeContext>> {
        Ref::map(self.0.borrow(), |inner| &inner.tree)
    }

    pub fn tree_mut(&self) -> RefMut<TaffyTree<NodeContext>> {
        RefMut::map(self.0.borrow_mut(), |inner| &mut inner.tree)
    }
    pub fn new() -> Self {
        Self::with_capacity(128)
    }

    pub fn clear(&mut self) {
        self.tree_mut().clear();
    }

    pub fn with_capacity(size: usize) -> Self {
        static ID_GENERATOR: AtomicUsize = AtomicUsize::new(1);

        let id = ID_GENERATOR.fetch_add(1, Ordering::SeqCst);

        Self(Rc::new(RefCell::new(MasonInner {
            id,
            tree: TaffyTree::with_capacity(size),
        })))
    }

    pub fn id(&self) -> usize {
        self.0.borrow().id
    }

    pub fn get_node_context(&self, node: &Node) -> Option<Ref<NodeContext>> {
        Ref::filter_map(self.0.borrow(), |inner| {
            inner.tree.get_node_context(node.id)
        })
        .ok()
    }

    #[track_caller]
    pub fn get_node_context_mut(&mut self, node: &Node) -> Option<RefMut<NodeContext>> {
        RefMut::filter_map(self.0.borrow_mut(), |inner| {
            inner.tree.get_node_context_mut(node.id)
        })
        .ok()
    }

    #[track_caller]
    pub fn create_node(&mut self, context: Option<NodeContext>) -> Node {
        let mut tree = self.tree_mut();
        let mut style = Style::default();
        style.display = Display::Block;
        tree.new_leaf(style.clone())
            .map(|node_id| {
                let ctx = context.unwrap_or_else(|| {
                    NodeContext(Rc::new(RefCell::new(NodeContextInner {
                        #[cfg(not(target_os = "android"))]
                        data: std::ptr::null_mut(),
                        #[cfg(target_os = "android")]
                        jvm: None,
                        measure: None,
                        style: StyleContext::new(),
                        guard: Rc::new(()),
                    })))
                });

                {
                    let mut style_data = ctx.style_data_mut();
                    style::sync_style_buffer(style_data.data_mut(), &style)
                }

                let guard = ctx.0.borrow().guard.clone();

                let _ = tree.set_node_context(node_id, Some(ctx));

                Node {
                    id: node_id,
                    guard,
                    mason: Rc::downgrade(&self.0),
                }
            })
            .unwrap()
    }

    pub fn set_node_context(&mut self, node: &Node, context: NodeContext) {
        let mut tree = self.tree_mut();
        let _ = tree.set_node_context(node.id, Some(context));
    }

    pub fn layout(&self, node: &Node) -> Vec<f32> {
        let mut output = vec![];
        let tree = self.tree();
        copy_output(&tree, node.id, &mut output);
        output
    }

    pub fn compute_layout(&mut self, node: &Node, available_space: Size<AvailableSpace>) {
        let mut tree = self.tree_mut();
        let _ = tree.compute_layout_with_measure(node.id, available_space, measure_function);
    }

    pub fn compute(&mut self, node: &Node) {
        self.compute_layout(node, Size::max_content());
    }

    pub fn compute_min(&mut self, node: &Node) {
        self.compute_layout(node, Size::min_content());
    }

    pub fn compute_wh(&mut self, node: &Node, width: f32, height: f32) {
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

        self.compute_layout(node, size);
    }

    pub fn compute_size(&mut self, node: &Node, size: Size<AvailableSpace>) {
        self.compute_layout(node, size);
    }

    pub fn append_node(&mut self, node: &Node, appended_node_ids: &[NodeId]) {
        let mut tree = self.tree_mut();
        for child_id in appended_node_ids {
            let _ = tree.add_child(node.id, *child_id);
        }
    }

    pub fn remove_node(&mut self, node: &Node) -> Option<Node> {
        let mut tree = self.tree_mut();
        let guard = match tree.get_node_context_mut(node.id) {
            None => Rc::new(()),
            Some(context) => {
                let mut context = context.0.borrow_mut();
                context.guard.clone()
            }
        };
        tree.remove(node.id)
            .map(|node_id| Node {
                id: node_id,
                mason: Rc::downgrade(&self.0),
                guard,
            })
            .ok()
    }

    pub fn set_children(&mut self, node: &Node, children: &[NodeId]) {
        let mut tree = self.tree_mut();
        let children: Vec<NodeId> = children.to_vec();
        let _ = tree.set_children(node.id, children.as_slice());
    }

    pub fn add_children(&mut self, node: &Node, children: &[NodeId]) {
        self.append_node(node, children)
    }

    pub fn print_tree(&mut self, node: &Node) {
        let mut tree = self.tree_mut();
        tree.print_tree(node.id);
    }

    pub fn add_child(&mut self, node: &Node, child: &Node) {
        self.append_node(node, &[child.id])
    }

    pub fn add_child_at_index(&mut self, node: &Node, child: &Node, index: usize) {
        let mut tree = self.tree_mut();
        let _ = tree.insert_child_at_index(node.id, index, child.id);
    }

    pub fn insert_child_before(&mut self, node: &Node, child: &Node, reference: &Node) {
        let mut tree = self.tree_mut();
        if let Ok(children) = tree.children(node.id) {
            if let Some(position) = children.iter().position(|v| *v == reference.id) {
                let _ = tree.insert_child_at_index(node.id, position, child.id);
            }
        }
    }

    pub fn insert_child_after(&mut self, node: &Node, child: &Node, reference: &Node) {
        let mut tree = self.tree_mut();
        if let Ok(children) = tree.children(node.id) {
            if let Some(position) = children.iter().position(|v| *v == reference.id) {
                let new_position = position + 1;
                if new_position == children.len() {
                    let _ = tree.add_child(node.id, child.id);
                } else {
                    let _ = tree.insert_child_at_index(node.id, new_position, child.id);
                }
            }
        }
    }

    pub fn replace_child_at_index(
        &mut self,
        node: &Node,
        child: &Node,
        index: usize,
    ) -> Option<Node> {
        let mut tree = self.tree_mut();

        tree.replace_child_at_index(node.id, index, child.id)
            .map(|child_id| {
                let guard = match tree.get_node_context(node.id) {
                    None => Rc::new(()),
                    Some(context) => {
                        let context = context.0.borrow();
                        context.guard.clone()
                    }
                };

                Node {
                    id: child_id,
                    mason: Rc::downgrade(&self.0),
                    guard,
                }
            })
            .ok()
    }

    pub fn remove_child(&mut self, node: &Node, child: &Node) -> Option<Node> {
        let mut tree = self.tree_mut();

        tree.remove_child(node.id, child.id)
            .map(|child_id| {
                let guard = match tree.get_node_context(node.id) {
                    None => Rc::new(()),
                    Some(context) => {
                        let context = context.0.borrow();
                        context.guard.clone()
                    }
                };

                Node {
                    id: child_id,
                    mason: Rc::downgrade(&self.0),
                    guard,
                }
            })
            .ok()
    }

    pub fn remove_child_at_index(&mut self, node: &Node, index: usize) -> Option<Node> {
        let mut tree = self.tree_mut();
        tree.remove_child_at_index(node.id, index)
            .map(|child_id| {
                let guard = match tree.get_node_context(child_id) {
                    None => Rc::new(()),
                    Some(context) => {
                        let context = context.0.borrow();
                        context.guard.clone()
                    }
                };

                Node {
                    id: child_id,
                    mason: Rc::downgrade(&self.0),
                    guard,
                }
            })
            .ok()
    }

    pub fn remove_children(&mut self, node: &Node) {
        let mut tree = self.tree_mut();
        let _ = tree.remove_children_range(node.id, 0..);
    }

    pub fn is_children_same(&self, node: &Node, children: &[NodeId]) -> bool {
        let tree = self.tree();
        if tree.child_count(node.id) != children.len() {
            return false;
        }
        tree.child_ids(node.id)
            .zip(children.iter())
            .all(|(node, id)| node == *id)
    }

    pub fn children(&self, node: &Node) -> Vec<Node> {
        let tree = self.tree();

        tree.children(node.id)
            .map(|nodes| {
                nodes
                    .into_iter()
                    .map(|id| {
                        let guard = match tree.get_node_context(id) {
                            None => Rc::new(()),
                            Some(context) => {
                                let context = context.0.borrow();
                                context.guard.clone()
                            }
                        };

                        Node {
                            id,
                            mason: Rc::downgrade(&self.0),
                            guard,
                        }
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn dirty(&self, node: &Node) -> bool {
        let tree = self.tree();
        tree.dirty(node.id).unwrap_or(false)
    }

    pub fn mark_dirty(&mut self, node: &Node) {
        let mut tree = self.tree_mut();
        let _ = tree.mark_dirty(node.id);
    }

    pub fn child_count(&self, node: &Node) -> usize {
        let tree = self.tree();
        tree.child_count(node.id)
    }

    pub fn child_at_index(&self, node: &Node, index: usize) -> Option<Node> {
        let tree = self.tree();
        tree.child_at_index(node.id, index)
            .map(|node_id| {
                let guard = match tree.get_node_context(node_id) {
                    None => Rc::new(()),
                    Some(context) => {
                        let context = context.0.borrow();
                        context.guard.clone()
                    }
                };

                Node {
                    id: node_id,
                    mason: Rc::downgrade(&self.0),
                    guard,
                }
            })
            .ok()
    }

    pub fn set_style(&mut self, node: &Node, style: Style) {
        self.set_style_sync_buffer(node, style, true);
    }

    pub fn set_style_sync_buffer(&mut self, node: &Node, style: Style, sync_buffer: bool) {
        if sync_buffer {
            if let Some(context) = self.get_node_context_mut(node) {
                let mut context = context.style_data_mut();
                style::sync_style_buffer(context.data_mut(), &style);
            }
        }
        let mut tree = self.tree_mut();
        let _ = tree.set_style(node.id, style);
    }

    pub fn style(&self, node: &Node) -> Option<Ref<Style>> {
        let tree = self.tree();
        Ref::filter_map(tree, |tree| tree.style(node.id).ok()).ok()
    }

    // cloning the current style for now
    pub fn with_style_mut<F>(&self, node: &Node, func: F)
    where
        F: FnOnce(&mut Style),
    {
        let mut tree = self.tree_mut();
        let style = tree.style(node.id).ok().cloned();
        if let Some(mut style) = style {
            func(&mut style);
            let _ = tree.set_style(node.id, style);
        }
    }

    pub fn get_root(&self, node: &Node) -> Option<Node> {
        let tree = self.tree();
        let mut parent = None;
        let mut next = tree.parent(node.id);
        while next.is_some() {
            let next_value = tree.parent(next.unwrap());
            if next_value.is_none() {
                parent = next;
            }
            next = next_value;
        }

        parent.map(|node_id| {
            let guard = match tree.get_node_context(node_id) {
                None => Rc::new(()),
                Some(context) => {
                    let context = context.0.borrow();
                    context.guard.clone()
                }
            };

            Node {
                id: node_id,
                mason: Rc::downgrade(&self.0),
                guard,
            }
        })
    }
}
