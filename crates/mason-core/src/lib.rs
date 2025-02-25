use slab::Slab;
use std::ffi::{c_float, c_longlong, c_void};
use std::ops::Deref;
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
pub use taffy::Overflow;
pub use taffy::TaffyTree;
use taffy::{
    compute_block_layout, compute_cached_layout, compute_flexbox_layout, compute_grid_layout,
    compute_hidden_layout, compute_leaf_layout, compute_root_layout, print_tree, round_layout,
    Cache, CacheTree, CoreStyle, NodeId, PrintTree,
};

pub const fn box_sizing_from_enum(value: i32) -> Option<BoxSizing> {
    match value {
        0 => Some(BoxSizing::BorderBox),
        1 => Some(BoxSizing::ContentBox),
        _ => None,
    }
}

pub const fn box_sizing_to_enum(value: BoxSizing) -> i32 {
    match value {
        BoxSizing::BorderBox => 0,
        BoxSizing::ContentBox => 1,
    }
}

pub const fn text_align_from_enum(value: i32) -> Option<TextAlign> {
    match value {
        0 => Some(TextAlign::Auto),
        1 => Some(TextAlign::LegacyLeft),
        2 => Some(TextAlign::LegacyRight),
        3 => Some(TextAlign::LegacyCenter),
        _ => None,
    }
}
pub const fn text_align_to_enum(value: TextAlign) -> i32 {
    match value {
        TextAlign::Auto => 0,
        TextAlign::LegacyLeft => 1,
        TextAlign::LegacyRight => 2,
        TextAlign::LegacyCenter => 3,
    }
}

pub const fn align_content_from_enum(value: i32) -> Option<AlignContent> {
    match value {
        0 => Some(AlignContent::Start),
        1 => Some(AlignContent::End),
        2 => Some(AlignContent::Center),
        3 => Some(AlignContent::Stretch),
        4 => Some(AlignContent::SpaceBetween),
        5 => Some(AlignContent::SpaceAround),
        6 => Some(AlignContent::SpaceEvenly),
        7 => Some(AlignContent::FlexStart),
        8 => Some(AlignContent::FlexEnd),
        _ => None,
    }
}

pub const fn align_content_to_enum(value: AlignContent) -> i32 {
    match value {
        AlignContent::Start => 0,
        AlignContent::End => 1,
        AlignContent::Center => 2,
        AlignContent::Stretch => 3,
        AlignContent::SpaceBetween => 4,
        AlignContent::SpaceEvenly => 5,
        AlignContent::SpaceAround => 6,
        AlignContent::FlexStart => 7,
        AlignContent::FlexEnd => 8,
    }
}

pub const fn align_items_from_enum(value: i32) -> Option<AlignItems> {
    match value {
        0 => Some(AlignItems::Start),
        1 => Some(AlignItems::End),
        2 => Some(AlignItems::Center),
        3 => Some(AlignItems::Baseline),
        4 => Some(AlignItems::Stretch),
        5 => Some(AlignItems::FlexStart),
        6 => Some(AlignItems::FlexEnd),
        _ => None,
    }
}

pub const fn overflow_from_enum(value: i32) -> Option<Overflow> {
    match value {
        0 => Some(Overflow::Visible),
        1 => Some(Overflow::Hidden),
        2 => Some(Overflow::Scroll),
        3 => Some(Overflow::Visible),
        _ => None,
    }
}

pub const fn overflow_to_enum(value: Overflow) -> i32 {
    match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
        Overflow::Clip => 3,
    }
}

pub const fn align_items_to_enum(value: AlignItems) -> i32 {
    match value {
        AlignItems::Start => 0,
        AlignItems::End => 1,
        AlignItems::Center => 2,
        AlignItems::Baseline => 3,
        AlignItems::Stretch => 4,
        AlignItems::FlexStart => 5,
        AlignItems::FlexEnd => 6,
    }
}

pub const fn align_self_from_enum(value: i32) -> Option<AlignSelf> {
    match value {
        0 => Some(AlignSelf::Start),
        1 => Some(AlignSelf::End),
        2 => Some(AlignSelf::Center),
        3 => Some(AlignSelf::Baseline),
        4 => Some(AlignSelf::Stretch),
        5 => Some(AlignSelf::FlexStart),
        6 => Some(AlignSelf::FlexEnd),
        _ => None,
    }
}

pub const fn align_self_to_enum(value: AlignSelf) -> i32 {
    match value {
        AlignSelf::Start => 0,
        AlignSelf::End => 1,
        AlignSelf::Center => 2,
        AlignSelf::Baseline => 3,
        AlignSelf::Stretch => 4,
        AlignSelf::FlexStart => 5,
        AlignSelf::FlexEnd => 6,
    }
}

pub const fn align_self_op_to_enum(value: Option<AlignSelf>) -> Option<i32> {
    match value {
        None => None,
        Some(value) => Some(match value {
            AlignSelf::Start => 0,
            AlignSelf::End => 1,
            AlignSelf::Center => 2,
            AlignSelf::Baseline => 3,
            AlignSelf::Stretch => 4,
            AlignSelf::FlexStart => 5,
            AlignSelf::FlexEnd => 6,
        }),
    }
}

pub const fn display_from_enum(value: i32) -> Option<Display> {
    match value {
        0 => Some(Display::None),
        1 => Some(Display::Flex),
        2 => Some(Display::Grid),
        3 => Some(Display::Block),
        _ => None,
    }
}

pub const fn display_to_enum(value: Display) -> i32 {
    match value {
        Display::None => 0,
        Display::Flex => 1,
        Display::Grid => 2,
        Display::Block => 3,
    }
}

pub const fn flex_direction_from_enum(value: i32) -> Option<FlexDirection> {
    match value {
        0 => Some(FlexDirection::Row),
        1 => Some(FlexDirection::Column),
        2 => Some(FlexDirection::RowReverse),
        3 => Some(FlexDirection::ColumnReverse),
        _ => None,
    }
}

pub const fn flex_direction_to_enum(value: FlexDirection) -> i32 {
    match value {
        FlexDirection::Row => 0,
        FlexDirection::Column => 1,
        FlexDirection::RowReverse => 2,
        FlexDirection::ColumnReverse => 3,
    }
}

pub const fn flex_wrap_from_enum(value: i32) -> Option<FlexWrap> {
    match value {
        0 => Some(FlexWrap::NoWrap),
        1 => Some(FlexWrap::Wrap),
        2 => Some(FlexWrap::WrapReverse),
        _ => None,
    }
}

pub const fn flex_wrap_to_enum(value: FlexWrap) -> i32 {
    match value {
        FlexWrap::NoWrap => 0,
        FlexWrap::Wrap => 1,
        FlexWrap::WrapReverse => 2,
    }
}

pub const fn justify_content_from_enum(value: i32) -> Option<JustifyContent> {
    match value {
        0 => Some(JustifyContent::Start),
        1 => Some(JustifyContent::End),
        2 => Some(JustifyContent::Center),
        3 => Some(JustifyContent::Stretch),
        4 => Some(JustifyContent::SpaceBetween),
        5 => Some(JustifyContent::SpaceAround),
        6 => Some(JustifyContent::SpaceEvenly),
        7 => Some(JustifyContent::FlexStart),
        8 => Some(JustifyContent::FlexEnd),
        _ => None,
    }
}

pub const fn justify_content_to_enum(value: JustifyContent) -> i32 {
    match value {
        JustifyContent::Start => 0,
        JustifyContent::End => 1,
        JustifyContent::Center => 2,
        JustifyContent::Stretch => 3,
        JustifyContent::SpaceBetween => 4,
        JustifyContent::SpaceAround => 5,
        JustifyContent::SpaceEvenly => 6,
        JustifyContent::FlexStart => 7,
        JustifyContent::FlexEnd => 8,
    }
}

pub const fn position_from_enum(value: i32) -> Option<Position> {
    match value {
        0 => Some(Position::Relative),
        1 => Some(Position::Absolute),
        _ => None,
    }
}

pub const fn position_to_enum(value: Position) -> i32 {
    match value {
        Position::Relative => 0,
        Position::Absolute => 1,
    }
}

pub const fn grid_auto_flow_from_enum(value: i32) -> Option<GridAutoFlow> {
    match value {
        0 => Some(GridAutoFlow::Row),
        1 => Some(GridAutoFlow::Column),
        2 => Some(GridAutoFlow::RowDense),
        3 => Some(GridAutoFlow::ColumnDense),
        _ => None,
    }
}

pub const fn grid_auto_flow_to_enum(value: GridAutoFlow) -> i32 {
    match value {
        GridAutoFlow::Row => 0,
        GridAutoFlow::Column => 1,
        GridAutoFlow::RowDense => 2,
        GridAutoFlow::ColumnDense => 3,
    }
}

pub mod style;

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

#[derive(Debug, Copy, Clone, PartialEq)]
#[allow(dead_code)]
pub enum NodeKind {
    Element,
    Text,
    Custom,
}

impl From<i32> for NodeKind {
    #[track_caller]
    fn from(value: i32) -> Self {
        match value {
            0 => NodeKind::Element,
            1 => NodeKind::Text,
            2 => NodeKind::Custom,
            _ => unreachable!(),
        }
    }
}

#[derive(Debug)]
pub struct Mason {
    pub(crate) id: usize,
    pub(crate) nodes: Box<Slab<Node>>,
}

impl PrintTree for Mason {
    fn get_debug_label(&self, node_id: NodeId) -> &'static str {
        match unsafe { Mason::node_from_id(&self, node_id).kind } {
            NodeKind::Element => "ELEMENT",
            NodeKind::Text => "TEXT",
            NodeKind::Custom => "CUSTOM",
        }
    }

    fn get_final_layout(&self, node_id: NodeId) -> &Layout {
        unsafe { &Mason::node_from_id(&self, node_id).final_layout }
    }
}

impl Mason {
    pub fn new() -> Self {
        Self::with_capacity(32)
    }

    pub fn clear(&mut self) {
        for node in self.nodes.iter_mut() {
            node.1.children.clear();
            node.1.parent = None;
            let _ = node.1.cache.clear();
        }
        self.nodes.clear();
    }

    pub fn with_capacity(size: usize) -> Self {
        static ID_GENERATOR: AtomicUsize = AtomicUsize::new(1);

        let id = ID_GENERATOR.fetch_add(1, Ordering::SeqCst);

        Self {
            id,
            nodes: Box::new(Slab::with_capacity(size)),
        }
    }

    fn node_from_id(&self, node_id: NodeId) -> &Node {
        &self.nodes[node_id.into()]
    }
    fn node_from_id_mut(&mut self, node_id: NodeId) -> &mut Node {
        &mut self.nodes[node_id.into()]
    }

    pub fn id(&self) -> usize {
        self.id
    }

    pub fn tree(&self) -> &Slab<Node> {
        &self.nodes
    }

    pub fn get_node(&self, node_id: usize) -> Option<&Node> {
        self.nodes.get(node_id)
    }

    pub fn get_node_mut(&mut self, node_id: usize) -> Option<&mut Node> {
        self.nodes.get_mut(node_id)
    }

    pub fn create_node(&mut self, kind: NodeKind) -> usize {
        self.create_node_with_context(kind, None)
    }

    pub fn create_node_with_context(
        &mut self,
        kind: NodeKind,
        context: Option<NodeContext>,
    ) -> usize {
        let tree_ptr = self.nodes.as_mut() as *mut Slab<Node>;
        let entry = self.nodes.vacant_entry();
        let id = entry.key();

        let mut style = Style::default();
        style.display = Display::Block;

        let node = Node {
            tree: tree_ptr,
            id,
            kind,
            cache: Cache::new(),
            final_layout: Layout::with_order(0),
            unrounded_layout: Layout::with_order(0),
            context,
            parent: None,
            children: vec![],
            style,
            use_rounding: false,
        };

        entry.insert(node);

        id
    }

    pub fn set_node_context(&mut self, node_id: usize, context: Option<NodeContext>) {
        self.nodes[node_id].context = context;
    }

    pub fn layout(&self, node_id: usize) -> Vec<f32> {
        let mut output = vec![];
        if let Some(node) = self.nodes.get(node_id) {
            Mason::copy_output(node, &mut output);
        }
        output
    }

    fn copy_output(node: &Node, output: &mut Vec<f32>) {
        let layout = if node.use_rounding {
            &node.final_layout
        } else {
            &node.unrounded_layout
        };

        let children = &node.children;
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

        for child_id in children {
            unsafe {
                if let Some(child) = (&*node.tree).get(*child_id) {
                    Mason::copy_output(child, output);
                }
            }
        }
    }

    pub fn compute_layout(&mut self, node_id: usize, available_space: Size<AvailableSpace>) {
        let id = NodeId::from(node_id);
        compute_root_layout(self, id, available_space);
        if self.nodes[node_id].use_rounding {
            round_layout(self, id)
        }
    }

    pub fn compute(&mut self, node_id: usize) {
        self.compute_layout(node_id, Size::max_content());
    }

    pub fn compute_min(&mut self, node_id: usize) {
        self.compute_layout(node_id, Size::min_content());
    }

    pub fn compute_wh(&mut self, node_id: usize, width: f32, height: f32) {
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

    pub fn compute_size(&mut self, node_id: usize, size: Size<AvailableSpace>) {
        self.compute_layout(node_id, size);
    }

    pub fn child_count(&self, node_id: usize) -> usize {
        self.nodes[node_id].children.len()
    }

    pub fn append_node(&mut self, node_id: usize, appended_node_ids: &[usize]) {
        let node = &mut self.nodes[node_id];
        if let Some(parent_id) = node.parent {
            self.nodes[parent_id]
                .children
                .extend_from_slice(appended_node_ids);
        }

        // Update parent values
        for child_id in appended_node_ids {
            let child = &mut self.nodes[*child_id];
            if let Some(parent_id) = child.parent {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != *child_id);
            }
            self.nodes[*child_id].parent = Some(self.id);
        }

        self.nodes[node_id]
            .children
            .extend_from_slice(appended_node_ids);
    }

    pub fn remove_node(&mut self, node_id: usize) {
        let node = &mut self.nodes[node_id];

        // Update child_idx values
        if let Some(parent_id) = node.parent.take() {
            let parent = &mut self.nodes[parent_id];
            parent.children.retain(|id| *id != node_id);
        }
    }

    pub fn set_children(&mut self, node_id: usize, children: &[usize]) {
        for child_id in children {
            let parent = self.nodes[*child_id].parent;
            // Update child_idx values
            if let Some(parent_id) = parent {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != node_id);
            }

            self.nodes[*child_id].parent = Some(self.id);
        }

        let node = &mut self.nodes[node_id];
        node.children.clear();
        node.children.extend_from_slice(children);
    }

    pub fn add_children(&mut self, node_id: usize, children: &[usize]) {
        self.append_node(node_id, children)
    }

    pub fn print_tree(&self, node_id: usize) {
        print_tree(self, NodeId::from(node_id));
    }

    pub fn add_child(&mut self, node_id: usize, child_id: usize) {
        self.append_node(node_id, &[child_id])
    }

    pub fn add_child_at_index(&mut self, node_id: usize, child_id: usize, index: usize) {
        let len = self.nodes[node_id].children.len();
        if index < len {
            let child = &mut self.nodes[child_id];
            if let Some(parent_id) = child.parent.take() {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != child_id);
            }
            self.nodes[node_id].children.insert(index, child_id);
        }
    }

    pub fn insert_child_before(&mut self, node_id: usize, child_id: usize, reference_node: usize) {
        let node = &self.nodes[node_id];
        if let Some(position) = node.children.iter().position(|v| *v == reference_node) {
            let parent = self.nodes[child_id].parent;
            if let Some(parent_id) = parent {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != child_id);
            }
            self.nodes[node_id].children.insert(position, child_id);
        }
    }

    pub fn insert_child_after(&mut self, node_id: usize, child_id: usize, reference_node: usize) {
        let node = &self.nodes[node_id];
        let len = node.children.len();
        if let Some(position) = node.children.iter().position(|v| *v == reference_node) {
            let parent = self.nodes[child_id].parent;
            if let Some(parent_id) = parent {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != child_id);
            }

            let new_position = position + 1;
            if new_position == len {
                self.nodes[node_id].children.push(child_id);
            } else {
                self.nodes[node_id].children.insert(new_position, child_id);
            }
        }
    }

    pub fn replace_child_at_index(
        &mut self,
        node_id: usize,
        child_id: usize,
        index: usize,
    ) -> Option<usize> {
        if index < self.nodes[node_id].children.len() {
            let parent = self.nodes[child_id].parent;
            if let Some(parent_id) = parent {
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != child_id);
            }

            let id = std::mem::replace(&mut self.nodes[node_id].children[index], child_id);

            return Some(id);
        }
        None
    }

    pub fn remove_child(&mut self, node_id: usize, child_id: usize) -> Option<usize> {
        let node = &mut self.nodes[node_id];

        if let Some(parent_id) = node.parent.take() {
            if parent_id == self.id {
                // Update child_idx values
                let parent = &mut self.nodes[parent_id];
                parent.children.retain(|id| *id != child_id);
                parent.parent = None;
                return Some(child_id);
            } else {
                node.parent = Some(parent_id);
            }
        }
        None
    }

    pub fn remove_child_at_index(&mut self, node_id: usize, index: usize) -> Option<usize> {
        let node = &mut self.nodes[node_id];
        if index < node.children.len() {
            let id = node.children.remove(index);
            let child = &mut self.nodes[id];
            child.parent = None;
            return Some(id);
        }

        None
    }

    pub fn remove_children(&mut self, node_id: usize) {
        if self.nodes[node_id].children.is_empty() {
            return;
        }
        let children = std::mem::replace(&mut self.nodes[node_id].children, Vec::new());
        for child_id in children.iter() {
            self.nodes[*child_id].parent = None;
        }
        self.nodes[node_id].children.clear();
        self.nodes[node_id].cache.clear();
    }

    pub fn is_node_same(&self, first: &Node, second: &Node) -> bool {
        first.id == second.id
    }

    pub fn is_children_same(&self, node_id: usize, children: &[usize]) -> bool {
        let node = &self.nodes[node_id];
        if node.children.len() != children.len() {
            return false;
        }
        children
            .iter()
            .zip(children.iter())
            .all(|(node, id)| *node == *id)
    }

    pub fn children(&self, node_id: usize) -> &[usize] {
        let node = &self.nodes[node_id];
        node.children.as_slice()
    }
}

#[derive(Debug, PartialEq)]
pub struct Node {
    kind: NodeKind,
    tree: *mut Slab<Node>,
    id: usize,
    parent: Option<usize>,
    style: Style,
    children: Vec<usize>,
    final_layout: Layout,
    unrounded_layout: Layout,
    cache: Cache,
    context: Option<NodeContext>,
    use_rounding: bool,
}

impl Node {
    pub fn id(&self) -> usize {
        self.id
    }
    pub fn tree(&self) -> &Slab<Node> {
        unsafe { &*self.tree }
    }

    #[track_caller]
    pub fn with(&self, id: usize) -> &Node {
        self.tree().get(id).unwrap()
    }

    pub fn rounded(&self) -> bool {
        self.use_rounding
    }

    pub fn set_rounded(&mut self, rounded: bool) {
        self.use_rounding = rounded;
    }

    pub fn child_count(&self) -> usize {
        self.children.len()
    }

    pub fn is_children_same(&self, children: &[usize]) -> bool {
        if self.children.len() != children.len() {
            return false;
        }
        self.children
            .iter()
            .zip(children.iter())
            .all(|(node, id)| *node == *id)
    }

    pub fn child_at_index(&self, index: usize) -> Option<usize> {
        self.children.get(index).map(|id| *id)
    }

    pub fn set_style(&mut self, style: taffy::Style) {
        // todo verify if each style owner needs to be unique
        self.style = style;
        self.cache.clear();
    }

    pub fn style(&self) -> &taffy::Style {
        &self.style
    }

    pub fn style_mut(&mut self) -> &mut taffy::Style {
        &mut self.style
    }

    pub fn dirty(&self) -> bool {
        self.cache.is_empty()
    }

    pub fn mark_dirty(&mut self) {
        self.cache.clear();
    }

    pub fn get_root(&self) -> Option<Node> {
        // let mut parent = None;
        // let mut next = self.inner.borrow();
        // while next.is_some() {
        //     let next_value = self.taffy.parent(next.unwrap());
        //     if next_value.is_none() {
        //         parent = next;
        //     }
        //     next = next_value;
        // }
        // parent.map(|node| Node::from_taffy(node, self.taffy.get_node_context(node).is_some()))
        None
    }

    pub fn set_node_context(&mut self, context: Option<NodeContext>) {
        self.context = context;
    }

    pub fn context(&self) -> Option<&NodeContext> {
        self.context.as_ref()
    }

    pub fn context_mut(&mut self) -> Option<&mut NodeContext> {
        self.context.as_mut()
    }

    pub fn children(&self) -> &[usize] {
        self.children.as_ref()
    }
}

pub struct ChildIter<'a>(std::slice::Iter<'a, usize>);
impl Iterator for ChildIter<'_> {
    type Item = NodeId;
    fn next(&mut self) -> Option<Self::Item> {
        self.0.next().map(|id| NodeId::from(*id))
    }
}

impl taffy::TraversePartialTree for Mason {
    type ChildIter<'a> = ChildIter<'a>;

    fn child_ids(&self, node_id: NodeId) -> Self::ChildIter<'_> {
        ChildIter(self.node_from_id(node_id).children.iter())
    }

    fn child_count(&self, node_id: NodeId) -> usize {
        self.node_from_id(node_id).children.len()
    }

    fn get_child_id(&self, node_id: NodeId, index: usize) -> NodeId {
        NodeId::from(self.node_from_id(node_id).children[index])
    }
}

impl taffy::LayoutPartialTree for Mason {
    type CoreContainerStyle<'a> = &'a taffy::Style;

    fn get_core_container_style(&self, node_id: NodeId) -> Self::CoreContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn resolve_calc_value(&self, _val: u64, _basis: f32) -> f32 {
        0.0
    }

    fn set_unrounded_layout(&mut self, node_id: NodeId, layout: &Layout) {
        self.node_from_id_mut(node_id).unrounded_layout = *layout
    }

    fn compute_child_layout(
        &mut self,
        node_id: NodeId,
        inputs: taffy::tree::LayoutInput,
    ) -> taffy::tree::LayoutOutput {
        compute_cached_layout(self, node_id, inputs, |parent, node_id, inputs| {
            let node = parent.node_from_id_mut(node_id);
            match node.kind {
                NodeKind::Element => match node.style.display {
                    Display::Block => compute_block_layout(parent, node_id, inputs),
                    Display::Flex => compute_flexbox_layout(parent, node_id, inputs),
                    Display::Grid => compute_grid_layout(parent, node_id, inputs),
                    Display::None => compute_hidden_layout(parent, node_id),
                },
                NodeKind::Text | NodeKind::Custom => compute_leaf_layout(
                    inputs,
                    &node.style,
                    |_val, _basis| 0.0,
                    |known_dimensions, available_space| {
                        node.context
                            .as_ref()
                            .map(|context| context.measure(known_dimensions, available_space))
                            .unwrap_or(Size {
                                width: 0.,
                                height: 0.,
                            })
                    },
                ),
            }
        })
    }
}

impl CacheTree for Mason {
    fn cache_get(
        &self,
        node_id: NodeId,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
        run_mode: taffy::RunMode,
    ) -> Option<taffy::LayoutOutput> {
        self.node_from_id(node_id)
            .cache
            .get(known_dimensions, available_space, run_mode)
    }

    fn cache_store(
        &mut self,
        node_id: NodeId,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
        run_mode: taffy::RunMode,
        layout_output: taffy::LayoutOutput,
    ) {
        self.node_from_id_mut(node_id).cache.store(
            known_dimensions,
            available_space,
            run_mode,
            layout_output,
        )
    }

    fn cache_clear(&mut self, node_id: NodeId) {
        self.node_from_id_mut(node_id).cache.clear();
    }
}

impl taffy::LayoutFlexboxContainer for Mason {
    type FlexboxContainerStyle<'a> = &'a taffy::Style;

    type FlexboxItemStyle<'a> = &'a taffy::Style;

    fn get_flexbox_container_style(&self, node_id: NodeId) -> Self::FlexboxContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_flexbox_child_style(&self, child_node_id: NodeId) -> Self::FlexboxItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }
}

impl taffy::LayoutGridContainer for Mason {
    type GridContainerStyle<'a> = &'a taffy::Style;

    type GridItemStyle<'a> = &'a taffy::Style;

    fn get_grid_container_style(&self, node_id: NodeId) -> Self::GridContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_grid_child_style(&self, child_node_id: NodeId) -> Self::GridItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }
}

impl taffy::LayoutBlockContainer for Mason {
    type BlockContainerStyle<'a> = &'a taffy::Style;

    type BlockItemStyle<'a> = &'a taffy::Style;

    fn get_block_container_style(&self, node_id: NodeId) -> Self::BlockContainerStyle<'_> {
        &self.node_from_id(node_id).style
    }

    fn get_block_child_style(&self, child_node_id: NodeId) -> Self::BlockItemStyle<'_> {
        &self.node_from_id(child_node_id).style
    }
}

impl taffy::TraverseTree for Mason {}

impl taffy::RoundTree for Mason {
    fn get_unrounded_layout(&self, node_id: NodeId) -> &Layout {
        &self.node_from_id(node_id).unrounded_layout
    }

    fn set_final_layout(&mut self, node_id: NodeId, layout: &Layout) {
        self.node_from_id_mut(node_id).final_layout = *layout;
    }
}

#[cfg(not(target_os = "android"))]
#[derive(Debug, PartialEq)]
pub struct NodeContext {
    data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
}

#[derive(Debug)]
pub struct StyleContext {
    #[cfg(target_os = "android")]
    buffer: Option<jni::objects::GlobalRef>,
    data: *mut u8,
    size: usize,
}

impl StyleContext {
    pub fn new() -> Self {
        Self {
            #[cfg(target_os = "android")]
            buffer: None,
            data: std::ptr::null_mut(),
            size: 0,
        }
    }

    pub fn data(&self) -> &[u8] {
        if self.size == 0 {
            return &[];
        }
        unsafe { std::slice::from_raw_parts(self.data, self.size) }
    }

    pub fn data_mut(&self) -> &mut [u8] {
        if self.size == 0 {
            return &mut [];
        }
        unsafe { std::slice::from_raw_parts_mut(self.data, self.size) }
    }

    pub fn data_as_f32(&self) -> Option<&[f32]> {
        if self.size == 0 {
            return Some(&[]);
        }
        if self.size % 4 != 0 {
            return None;
        }
        unsafe {
            Some(std::slice::from_raw_parts(
                self.data as *const f32,
                self.size / 4,
            ))
        }
    }

    pub fn data_mut_as_f32(&self) -> Option<&mut [f32]> {
        if self.size == 0 {
            return Some(&mut []);
        }
        if self.size % 4 != 0 {
            return None;
        }
        unsafe {
            Some(std::slice::from_raw_parts_mut(
                self.data as *mut f32,
                self.size / 4,
            ))
        }
    }

    #[cfg(target_os = "android")]
    pub fn set_buffer(&mut self, buffer: jni::objects::GlobalRef, data: *mut u8, size: usize) {
        self.buffer = Some(buffer);
        self.data = data;
        self.size = size;
    }

    #[cfg(target_os = "android")]
    pub fn remove_buffer(&mut self) {
        self.buffer = None;
        self.data = std::ptr::null_mut();
        self.size = 0;
    }
}

#[cfg(target_os = "android")]
#[derive(Debug)]
pub struct NodeContext {
    jvm: jni::JavaVM,
    measure: jni::objects::GlobalRef,
    style_buffer: StyleContext,
}

#[cfg(target_os = "android")]
impl PartialEq for NodeContext {
    fn eq(&self, other: &Self) -> bool {
        self.measure.as_obj().eq(other.measure.as_obj())
    }

    fn ne(&self, other: &Self) -> bool {
        !self.measure.as_obj().eq(other.measure.as_obj())
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
        Self { data, measure }
    }

    #[cfg(target_os = "android")]
    pub fn new(jvm: jni::JavaVM, measure: jni::objects::GlobalRef) -> Self {
        Self {
            jvm,
            measure,
            style_buffer: StyleContext::new(),
        }
    }

    #[cfg(target_os = "android")]
    pub fn set_style_buffer(
        &mut self,
        data: *mut u8,
        size: usize,
        buffer: jni::objects::GlobalRef,
    ) {
        self.style_buffer.set_buffer(buffer, data, size);
    }
    #[cfg(target_os = "android")]
    fn measure(
        &self,
        known_dimensions: taffy::Size<Option<f32>>,
        available_space: taffy::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
        let vm = self.jvm.attach_current_thread();
        let mut env = vm.unwrap();
        let result = env.call_method(
            self.measure.as_obj(),
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

    #[cfg(not(target_os = "android"))]
    pub fn measure(
        &self,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> Size<f32> {
        match self.measure.as_ref() {
            None => known_dimensions.map(|v| v.unwrap_or(0.0)),
            Some(measure) => {
                let measure_data = self.data;
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
