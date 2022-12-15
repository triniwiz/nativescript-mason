extern crate core;

pub use taffy::layout::AvailableSpace;
pub use taffy::node::Measurable;
pub use taffy::node::MeasureFunc;
pub use taffy::prelude::*;
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, Dimension, Display, FlexDirection, FlexWrap,
    JustifyContent, PositionType,
};

pub const fn align_content_from_enum(value : i32) -> Option<AlignContent> {
    match value {
        0 => Some(AlignContent::FlexStart),
        1 => Some(AlignContent::FlexEnd),
        2 => Some(AlignContent::Center),
        3 => Some(AlignContent::Stretch),
        4 => Some(AlignContent::SpaceBetween),
        5 => Some(AlignContent::SpaceAround),
        6 => Some(AlignContent::SpaceEvenly),
        _ => None,
    }
}

pub const fn align_content_to_enum(value: AlignContent) -> i32 {
    match value {
        AlignContent::FlexStart => 0,
        AlignContent::FlexEnd => 1,
        AlignContent::Center => 2,
        AlignContent::Stretch => 3,
        AlignContent::SpaceBetween => 4,
        AlignContent::SpaceEvenly => 5,
        AlignContent::SpaceAround => 6
    }
}

pub const fn align_items_from_enum(value : i32) -> Option<AlignItems> {
    match value {
        0 => Some(AlignItems::FlexStart),
        1 => Some(AlignItems::FlexEnd),
        2 => Some(AlignItems::Center),
        3 => Some(AlignItems::Baseline),
        4 => Some(AlignItems::Stretch),
        _ => None,
    }
}

pub const fn align_items_to_enum(value: AlignItems) -> i32 {
    match value {
        AlignItems::FlexStart => 0,
        AlignItems::FlexEnd => 1,
        AlignItems::Center => 2,
        AlignItems::Baseline => 3,
        AlignItems::Stretch => 4
    }
}

pub const fn align_self_from_enum(value : i32) -> Option<AlignSelf> {
    match value {
        0 => Some(AlignSelf::Auto),
        1 => Some(AlignSelf::FlexStart),
        2 => Some(AlignSelf::FlexEnd),
        3 => Some(AlignSelf::Center),
        4 => Some(AlignSelf::Baseline),
        5 => Some(AlignSelf::Stretch),
        _ => None,
    }
}

pub const fn align_self_to_enum(value: AlignSelf) -> i32 {
    match value {
        AlignSelf::Auto => 0,
        AlignSelf::FlexStart => 1,
        AlignSelf::FlexEnd => 2,
        AlignSelf::Center => 3,
        AlignSelf::Baseline => 4,
        AlignSelf::Stretch => 5
    }
}

pub const fn display_from_enum(value : i32) -> Option<Display> {
    match value {
        0 => Some(Display::Flex),
        1 => Some(Display::None),
        _ => None,
    }
}

pub const fn display_to_enum(value: Display) -> i32 {
    match value {
        Display::Flex => 0,
        Display::None => 1,
    }
}

pub const fn flex_direction_from_enum(value : i32) -> Option<FlexDirection> {
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

pub const fn flex_wrap_from_enum(value : i32) -> Option<FlexWrap> {
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

pub const fn justify_content_from_enum(value : i32) -> Option<JustifyContent> {
    match value {
        0 => Some(JustifyContent::FlexStart),
        1 => Some(JustifyContent::FlexEnd),
        2 => Some(JustifyContent::Center),
        3 => Some(JustifyContent::SpaceBetween),
        4 => Some(JustifyContent::SpaceAround),
        5 => Some(JustifyContent::SpaceEvenly),
        _ => None,
    }
}

pub const fn justify_content_to_enum(value: JustifyContent) -> i32 {
    match value {
        JustifyContent::FlexStart => 0,
        JustifyContent::FlexEnd => 1,
        JustifyContent::Center => 2,
        JustifyContent::SpaceBetween => 3,
        JustifyContent::SpaceAround => 4,
        JustifyContent::SpaceEvenly => 5,
    }
}

pub const fn position_type_from_enum(value : i32) -> Option<PositionType> {
    match value {
        0 => Some(PositionType::Relative),
        1 => Some(PositionType::Absolute),
        _ => None,
    }
}

pub const fn position_type_to_enum(value: PositionType) -> i32 {
    match value {
        PositionType::Relative => 0,
        PositionType::Absolute => 1,
    }
}


use style::Style;

pub mod style;

pub struct MeasureOutput {}

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

#[derive(Default)]
pub struct Mason {
    pub(crate) taffy: Taffy,
}

impl Mason {
    pub fn new() -> Self {
        Default::default()
    }

    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            taffy: Taffy::with_capacity(capacity),
        }
    }

    pub fn into_raw(self) -> *mut Mason {
        Box::into_raw(Box::new(self))
    }

    pub fn new_node(&mut self, style: Style) -> Option<Node> {
        self.taffy.new_leaf(style.style).map(Node::from_taffy).ok()
    }

    pub fn is_children_same(&self, node: Node, children: &[Node]) -> bool {
        let children: Vec<taffy::node::Node> = children.iter().map(|v| v.node).collect();
        self.taffy
            .children(node.node)
            .map(|v| v == children)
            .unwrap_or(false)
    }

    pub fn new_node_with_measure_func(
        &mut self,
        style: Style,
        measure: MeasureFunc,
    ) -> Option<Node> {
        self.taffy
            .new_leaf_with_measure(style.style, measure)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn new_node_with_children(&mut self, style: Style, children: &[Node]) -> Option<Node> {
        let children: Vec<taffy::node::Node> = children.iter().map(|v| v.node).collect();
        self.taffy
            .new_with_children(style.style, children.as_slice())
            .map(Node::from_taffy)
            .ok()
    }

    pub fn set_style(&mut self, node: Node, style: Style) {
        self.taffy.set_style(node.node, style.style).unwrap()
    }

    pub fn clear(&mut self) {
        self.taffy.clear();
    }

    pub fn compute(&mut self, node: Node) {
        let _ = self
            .taffy
            .compute_layout(node.node, taffy::geometry::Size::MAX_CONTENT);
    }

    pub fn compute_wh(&mut self, node: Node, width: f32, height: f32) {
        let size = taffy::geometry::Size {
            width: AvailableSpace::Definite(width),
            height: AvailableSpace::Definite(height),
        };
        let _ = self.taffy.compute_layout(node.node, size);
    }

    pub fn compute_size(&mut self, node: Node, size: Size<AvailableSpace>) {
        let _ = self.taffy.compute_layout(node.node, size.size);
    }

    pub fn child_count(&self, node: Node) -> usize {
        self.taffy.child_count(node.node).unwrap_or_default()
    }

    pub fn child_at_index(&self, node: Node, index: usize) -> Option<Node> {
        self.taffy
            .child_at_index(node.node, index)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn set_children(&mut self, node: Node, children: &[Node]) {
        let children: Vec<taffy::node::Node> = children.iter().map(|v| v.node).collect();
        let _ = self.taffy.set_children(node.node, children.as_slice()).ok();
    }

    pub fn add_children(&mut self, node: Node, children: &[Node]) {
        for child in children.iter() {
            let _ = self.taffy.add_child(node.node, child.node).ok();
        }
    }

    pub fn add_child(&mut self, node: Node, child: Node) {
        self.taffy.add_child(node.node, child.node).unwrap()
    }

    pub fn add_child_at_index(&mut self, node: Node, child: Node, index: usize) {
        let count = self.taffy.child_count(node.node).unwrap_or_default();

        if index >= count {
            return;
        }

        let mut children = self.taffy.children(node.node).unwrap();

        children.insert(index, child.node);

        self.taffy.set_children(node.node, &children).unwrap();
    }

    pub fn insert_child_before(&mut self, node: Node, child: Node, reference_node: Node) {
        let mut children = self.taffy.children(node.node).unwrap();
        if let Some(position) = children.iter().position(|v| *v == reference_node.node) {
            children.insert(position, child.node);
            self.taffy.set_children(node.node, &children).unwrap();
        }
    }

    pub fn insert_child_after(&mut self, node: Node, child: Node, reference_node: Node) {
        let mut children = self.taffy.children(node.node).unwrap();
        if let Some(position) = children.iter().position(|v| *v == reference_node.node) {
            let new_position = position + 1;
            if new_position == children.len() {
                children.push(child.node);
            } else {
                children.insert(new_position, child.node);
            }

            self.taffy.set_children(node.node, &children).unwrap();
        }
    }

    pub fn replace_child_at_index(
        &mut self,
        node: Node,
        child: Node,
        index: usize,
    ) -> Option<Node> {
        self.taffy
            .replace_child_at_index(node.node, index, child.node)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn remove_child(&mut self, node: Node, child: Node) -> Option<Node> {
        self.taffy
            .remove_child(node.node, child.node)
            .map(|v| {
                assert_eq!(v, child.node);
                child
            })
            .ok()
    }

    pub fn remove_child_at_index(&mut self, node: Node, index: usize) -> Option<Node> {
        self.taffy
            .remove_child_at_index(node.node, index)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn remove_children(&mut self, node: Node) {
        if self.taffy.child_count(node.node).unwrap_or_default() == 0 {
            return;
        }
        println!("has {}" , self.taffy.child_count(node.node).unwrap_or_default());
        let _ = self.taffy.remove(node.node);
    }

    pub fn is_node_same(&self, first: Node, second: Node) -> bool {
        first == second
    }

    pub fn dirty(&self, node: Node) -> bool {
        self.taffy.dirty(node.node).unwrap_or_default()
    }

    pub fn mark_dirty(&mut self, node: Node) {
        self.taffy.mark_dirty(node.node).unwrap()
    }

    pub fn get_root(&self, node: Node) -> Option<Node> {
        let mut parent = self.taffy.parent(node.node);
        while parent.is_some() {
            parent = self.taffy.parent(parent.unwrap());
        }
        parent.map(Node::from_taffy)
    }

    pub fn set_measure_func(&mut self, node: Node, measure: Option<MeasureFunc>) {
        self.taffy.set_measure(node.node, measure).unwrap()
    }

    pub fn children(&self, node: Node) -> Option<Vec<Node>> {
        self.taffy
            .children(node.node)
            .map(|v| v.into_iter().map(Node::from_taffy).collect())
            .ok()
    }

    pub fn layout(&self, node: Node) -> Vec<f32> {
        let mut output = vec![];
        Mason::copy_output(&self.taffy, node.node, &mut output);
        output
    }

    fn copy_output(taffy: &Taffy, node: taffy::node::Node, output: &mut Vec<f32>) {
        let layout = taffy.layout(node).unwrap();

        let children = taffy.children(node).unwrap();

        output.push(layout.order as f32);
        output.push(layout.location.x);
        output.push(layout.location.y);
        output.push(layout.size.width);
        output.push(layout.size.height);

        output.push(children.len() as f32);

        for child in &children {
            Mason::copy_output(taffy, *child, output);
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Size<T> {
    size: taffy::geometry::Size<T>,
}

impl<T> From<taffy::geometry::Size<T>> for Size<T> {
    fn from(size: taffy::geometry::Size<T>) -> Self {
        Size::from_taffy(size)
    }
}

impl<T> From<Size<T>> for taffy::geometry::Size<T> {
    fn from(size: Size<T>) -> Self {
        size.size
    }
}

impl<T> Size<T> {
    pub fn from_taffy(size: taffy::geometry::Size<T>) -> Self {
        Self { size }
    }

    pub fn from_wh(width: AvailableSpace, height: AvailableSpace) -> Size<AvailableSpace> {
        Size::from_taffy(taffy::geometry::Size { width, height })
    }

    pub fn new(width: f32, height: f32) -> Size<f32> {
        Size::from_taffy(taffy::geometry::Size { width, height })
    }

    pub fn new_available_space(width: f32, height: f32) -> Size<AvailableSpace> {
        Size::from_taffy(taffy::geometry::Size {
            width: AvailableSpace::Definite(width),
            height: AvailableSpace::Definite(height),
        })
    }

    pub fn undefined_dimension() -> Size<Dimension> {
        Size {
            size: taffy::geometry::Size::UNDEFINED,
        }
    }

    pub fn min_content() -> Size<AvailableSpace> {
        Size {
            size: taffy::geometry::Size::MIN_CONTENT,
        }
    }

    pub fn max_content() -> Size<AvailableSpace> {
        Size {
            size: taffy::geometry::Size::MAX_CONTENT,
        }
    }

    pub fn width(&self) -> &T {
        &self.size.width
    }

    pub fn height(&self) -> &T {
        &self.size.height
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Node {
    node: taffy::node::Node,
}

impl Node {
    pub fn from_taffy(node: taffy::node::Node) -> Self {
        Self { node }
    }
}

#[derive(Copy, Debug, Clone)]
pub struct Layout {
    layout: &'static taffy::layout::Layout,
}

impl Layout {
    pub fn from_taffy(layout: &'static taffy::layout::Layout) -> Self {
        Self { layout }
    }

    pub fn order(&self) -> u32 {
        self.layout.order
    }

    pub fn size(&self) -> Size<f32> {
        Size::from_taffy(self.layout.size)
    }

    pub fn location(&self) -> Point<f32> {
        Point::from_taffy(self.layout.location)
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Point<T> {
    point: taffy::geometry::Point<T>,
}

impl<T> Point<T> {
    pub fn from_taffy(point: taffy::geometry::Point<T>) -> Self {
        Self { point }
    }

    pub fn x(&self) -> &T {
        &self.point.x
    }

    pub fn y(&self) -> &T {
        &self.point.y
    }
}

#[derive(Copy, Clone, PartialEq, Debug)]
pub struct Rect<T> {
    rect: taffy::geometry::Rect<T>,
}

impl<T> Rect<T> {
    pub fn from_taffy(rect: taffy::geometry::Rect<T>) -> Self {
        Self { rect }
    }

    pub fn left(&self) -> &T {
        &self.rect.left
    }

    pub fn top(&self) -> &T {
        &self.rect.top
    }

    pub fn bottom(&self) -> &T {
        &self.rect.bottom
    }

    pub fn right(&self) -> &T {
        &self.rect.right
    }
}