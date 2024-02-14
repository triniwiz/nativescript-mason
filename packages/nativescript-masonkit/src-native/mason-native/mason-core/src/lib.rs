extern crate core;

use std::ffi::{c_float, c_longlong, c_void};

use taffy::{NodeId, TraversePartialTree};
pub use taffy::geometry::Line;
pub use taffy::Overflow;
pub use taffy::style::{
    AlignContent, AlignItems, AlignSelf, AvailableSpace, Dimension, Display, FlexDirection,
    FlexWrap, GridAutoFlow, GridPlacement, GridTrackRepetition, JustifyContent, LengthPercentage,
    LengthPercentageAuto, MaxTrackSizingFunction, MinTrackSizingFunction,
    NonRepeatedTrackSizingFunction, Position, TrackSizingFunction,
};
pub use taffy::style_helpers::*;

pub use style::Style;

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
    match value {
        0 => Overflow::Visible,
        1 => Overflow::Hidden,
        2 => Overflow::Scroll,
        3 => Overflow::Clip,
        _ => panic!(),
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

#[cfg(not(target_os = "android"))]
pub struct NodeContext {
    data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
}

#[cfg(target_os = "android")]
pub struct NodeContext {
    jvm: jni::JavaVM,
    measure: jni::objects::GlobalRef,
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
        Self { jvm, measure }
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
                Size::<f32>::new(width, height).into()
            }
            Err(_) => known_dimensions.map(|v| v.unwrap_or(0.0)),
        }
    }

    #[cfg(not(target_os = "android"))]
    pub fn measure(
        &self,
        known_dimensions: taffy::geometry::Size<Option<f32>>,
        available_space: taffy::geometry::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
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

                Size::<f32>::new(width, height).into()
            }
        }
    }
}

pub struct Mason {
    pub(crate) taffy: taffy::TaffyTree<NodeContext>,
}

impl Default for Mason {
    fn default() -> Self {
        Self::with_capacity(128)
    }
}

impl Mason {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            taffy: taffy::TaffyTree::with_capacity(capacity),
        }
    }

    pub fn into_raw(self) -> *mut Mason {
        Box::into_raw(Box::new(self))
    }

    pub fn new_node(&mut self, style: Style) -> Option<Node> {
        self.taffy.new_leaf(style.style).map(Node::from_taffy).ok()
    }

    pub fn new_node_with_context(&mut self, style: Style, context: NodeContext) -> Option<Node> {
        self.taffy
            .new_leaf_with_context(style.style, context)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn is_children_same(&self, node: Node, children: &[Node]) -> bool {
        let children: Vec<NodeId> = children.iter().map(|v| v.node).collect();
        self.taffy
            .children(node.node)
            .map(|v| v == children)
            .unwrap_or(false)
    }

    pub fn new_node_with_children(&mut self, style: Style, children: &[Node]) -> Option<Node> {
        let children: Vec<NodeId> = children.iter().map(|v| v.node).collect();
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
        let _ = self.taffy.compute_layout_with_measure(
            node.node,
            taffy::geometry::Size::max_content(),
            |known_dimensions, available_space, _node_id, node_context| match node_context {
                None => known_dimensions.unwrap_or(taffy::Size {
                    width: f32::NAN,
                    height: f32::NAN,
                }),
                Some(context) => context.measure(known_dimensions, available_space),
            },
        );
    }

    pub fn compute_wh(&mut self, node: Node, width: f32, height: f32) {
        let size = taffy::geometry::Size {
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

        let _ = self.taffy.compute_layout_with_measure(
            node.node,
            size,
            |known_dimensions, available_space, _node_id, node_context| match node_context {
                None => known_dimensions.unwrap_or(taffy::Size {
                    width: f32::NAN,
                    height: f32::NAN,
                }),
                Some(context) => context.measure(known_dimensions, available_space),
            },
        );
    }

    pub fn compute_size(&mut self, node: Node, size: Size<AvailableSpace>) {
        let _ = self.taffy.compute_layout_with_measure(
            node.node,
            size.size,
            |known_dimensions, available_space, _node_id, node_context| match node_context {
                None => known_dimensions.unwrap_or(taffy::Size {
                    width: f32::NAN,
                    height: f32::NAN,
                }),
                Some(context) => context.measure(known_dimensions, available_space),
            },
        );
    }

    pub fn child_count(&self, node: Node) -> usize {
        self.taffy.child_count(node.node)
    }

    pub fn child_at_index(&self, node: Node, index: usize) -> Option<Node> {
        self.taffy
            .child_at_index(node.node, index)
            .map(Node::from_taffy)
            .ok()
    }

    pub fn set_children(&mut self, node: Node, children: &[Node]) {
        let children: Vec<NodeId> = children.iter().map(|v| v.node).collect();
        let _ = self.taffy.set_children(node.node, children.as_slice()).ok();
    }

    pub fn add_children(&mut self, node: Node, children: &[Node]) {
        for child in children.iter() {
            let _ = self.taffy.add_child(node.node, child.node).ok();
        }
    }

    pub fn add_child(&mut self, node: Node, child: Node) {
        let _ = self.taffy.add_child(node.node, child.node);
    }

    pub fn add_child_at_index(&mut self, node: Node, child: Node, index: usize) {
        let _ = self
            .taffy
            .insert_child_at_index(node.node, index, child.node);
    }

    pub fn insert_child_before(&mut self, node: Node, child: Node, reference_node: Node) {
        if let Ok(children) = self.taffy.children(node.node) {
            if let Some(position) = children.iter().position(|v| *v == reference_node.node) {
                let _ = self
                    .taffy
                    .insert_child_at_index(node.node, position, child.node);
            }
        }
    }

    pub fn insert_child_after(&mut self, node: Node, child: Node, reference_node: Node) {
        let children = self.taffy.children(node.node).unwrap();
        if let Some(position) = children.iter().position(|v| *v == reference_node.node) {
            let new_position = position + 1;
            if new_position == children.len() {
                let _ = self.taffy.add_child(node.node, child.node);
            } else {
                let _ = self
                    .taffy
                    .insert_child_at_index(node.node, new_position, child.node);
            }
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
        let _ = self.taffy.set_children(node.node, &[]);
    }

    pub fn is_node_same(&self, first: Node, second: Node) -> bool {
        first.node == second.node
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

    pub fn set_node_context(&mut self, node: Node, context: Option<NodeContext>) {
        let _ = self.taffy.set_node_context(node.node, context);
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

    fn copy_output(taffy: &taffy::TaffyTree<NodeContext>, node: NodeId, output: &mut Vec<f32>) {
        if let Ok(layout) = taffy.layout(node) {
            if let Ok(children) = taffy.children(node) {
                let len = children.len();
                output.reserve(len * 6);

                output.push(layout.order as f32);
                output.push(layout.location.x);
                output.push(layout.location.y);
                output.push(layout.size.width);
                output.push(layout.size.height);

                output.push(len as f32);

                for child in children {
                    Mason::copy_output(taffy, child, output);
                }
            }
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
            size: taffy::geometry::Size::min_content(),
        }
    }

    pub fn max_content() -> Size<AvailableSpace> {
        Size {
            size: taffy::geometry::Size::max_content(),
        }
    }

    pub fn width(&self) -> &T {
        &self.size.width
    }

    pub fn height(&self) -> &T {
        &self.size.height
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct Node {
    node: NodeId,
}

impl Node {
    pub fn from_taffy(node: NodeId) -> Self {
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

#[derive(Debug, Copy, Clone, PartialEq, Eq, Default)]
pub struct Point<T> {
    point: taffy::geometry::Point<T>,
}

impl<T> Into<taffy::geometry::Point<T>> for Point<T> {
    fn into(self) -> taffy::Point<T> {
        self.point
    }
}

impl<T> Point<T> {
    pub fn new(x: T, y: T) -> Point <T> {
        Self { point: taffy::geometry::Point { x, y } }
    }
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
