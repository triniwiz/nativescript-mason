extern crate core;

pub use taffy::geometry::Line;
pub use taffy::geometry::*;
pub use taffy::prelude::*;
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, Dimension, Display, FlexDirection, FlexWrap, GridAutoFlow,
    GridPlacement, JustifyContent, MaxTrackSizingFunction, MinTrackSizingFunction, Overflow,
    Position,
};
pub use taffy::style_helpers::{auto, length, max_content, min_content, minmax, percent};
pub use taffy::*;

use style::Style;
pub use taffy::tree::MeasureFunc;

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

pub const fn overflow_from_enum(value: i32) -> Overflow {
    return match value {
        0 => Overflow::Visible,
        1 => Overflow::Hidden,
        2 => Overflow::Scroll,
        _ => panic!(),
    };
}

pub const fn overflow_to_enum(value: Overflow) -> i32 {
    return match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
    };
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

pub const fn display_from_enum(value: i32) -> Option<Display> {
    match value {
        0 => Some(Display::None),
        1 => Some(Display::Flex),
        2 => Some(Display::Grid),
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

pub mod ffi;
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
        let children: Vec<NodeId> = children.iter().map(|v| v.node).collect();
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
        let children: Vec<taffy::tree::NodeId> = children.iter().map(|v| v.node).collect();
        self.taffy
            .new_with_children(style.style, children.as_slice())
            .map(Node::from_taffy)
            .ok()
    }

    pub fn set_style(&mut self, node: Node, style: Style) {
        self.taffy.set_style(node.node, style.style).unwrap()
    }

    pub fn style(&self, node: Node) -> Option<Style> {
        self.taffy
            .style(node.node)
            .map(|v| Style::from_taffy(v.clone()))
            .ok()
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
        let min_size = Size::<AvailableSpace>::min_content();
        let max_size = Size::<AvailableSpace>::max_content();
        let size = taffy::geometry::Size {
            width: match width {
                x if x == -1.0 => min_size.size.width,
                x if x == -2.0 => max_size.size.width,
                _ => AvailableSpace::Definite(width),
            },
            height: match height {
                x if x == -1.0 => min_size.size.height,
                x if x == -2.0 => max_size.size.height,
                _ => AvailableSpace::Definite(height),
            },
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
        let children: Vec<taffy::tree::NodeId> = children.iter().map(|v| v.node).collect();
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
            .map(Node::from_taffy)
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

    // pub fn get_root(&self, node: Node) -> Option<Node> {
    //     let mut parent = self.taffy.parent(node.node);
    //     while parent.is_some() {
    //         parent = self.taffy.parent(parent.unwrap());
    //     }
    //     parent.map(Node::from_taffy)
    // }

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

    // pub fn measure(
    //     &self,
    //     node: Node,
    //     known_dimensions: Size<Option<f32>>,
    //     available_space: Size<AvailableSpace>,
    // ) -> Size<f32> {
    //     Size::from_taffy(self.taffy.measure_node(
    //         node.node,
    //         known_dimensions.size,
    //         available_space.into(),
    //     ))
    // }

    // pub fn needs_measure(&self, node: Node) -> bool {
    //     self.taffy.needs_measure(node.node)
    // }

    fn copy_output(taffy: &Taffy, node: taffy::tree::NodeId, output: &mut Vec<f32>) {
        let layout = taffy.layout(node).unwrap();

        let children = taffy.children(node).unwrap();

        output.reserve(children.len() * 6);

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

    pub fn new_with_dim(width: Dimension, height: Dimension) -> Size<Dimension> {
        Size::from_taffy(taffy::geometry::Size { width, height })
    }

    pub fn new_with_len(
        width: LengthPercentage,
        height: LengthPercentage,
    ) -> Size<LengthPercentage> {
        Size::from_taffy(taffy::geometry::Size { width, height })
    }

    pub fn new_with_len_auto(
        width: LengthPercentageAuto,
        height: LengthPercentageAuto,
    ) -> Size<LengthPercentageAuto> {
        Size::from_taffy(taffy::geometry::Size { width, height })
    }

    pub fn new_available_space(width: f32, height: f32) -> Size<AvailableSpace> {
        Size::from_taffy(taffy::geometry::Size {
            width: AvailableSpace::Definite(width),
            height: AvailableSpace::Definite(height),
        })
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

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Node {
    node: taffy::tree::NodeId,
}

impl Node {
    pub fn from_taffy(node: taffy::tree::NodeId) -> Self {
        Self { node }
    }
}

#[derive(Copy, Debug, Clone)]
pub struct Layout {
    layout: &'static taffy::tree::Layout,
}

impl Layout {
    pub fn from_taffy(layout: &'static taffy::tree::Layout) -> Self {
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
    pub fn from_dim(value: Dimension) -> Rect<Dimension> {
        Rect {
            rect: taffy::geometry::Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            },
        }
    }

    pub fn from_len(value: LengthPercentage) -> Rect<LengthPercentage> {
        Rect {
            rect: taffy::geometry::Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            },
        }
    }

    pub fn from_len_auto(value: LengthPercentageAuto) -> Rect<LengthPercentageAuto> {
        Rect {
            rect: taffy::geometry::Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            },
        }
    }

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
