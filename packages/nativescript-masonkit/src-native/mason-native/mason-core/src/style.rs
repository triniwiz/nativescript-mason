use taffy::style::{
    AlignContent, AlignItems, AlignSelf, Dimension, Display, FlexDirection, FlexWrap,
    JustifyContent, PositionType,
};

use crate::{Rect, Size};

#[derive(Copy, Clone, PartialEq, Debug, Default)]
pub struct Style {
    pub(crate) style: taffy::style::Style,
}

const fn dimension(t: i32, v: f32) -> Dimension {
    match t {
        0 => Dimension::Points(v),
        1 => Dimension::Percent(v),
        2 => Dimension::Undefined,
        3 => Dimension::Auto,
        _ => panic!(),
    }
}

impl Style {
    #[allow(clippy::too_many_arguments)]
    pub fn from_ffi(
        display: i32,
        position_type: i32,
        direction: i32,
        flex_direction: i32,
        flex_wrap: i32,
        overflow: i32,
        align_items: i32,
        align_self: i32,
        align_content: i32,
        justify_content: i32,
        position_left_type: i32,
        position_left_value: f32,
        position_right_type: i32,
        position_right_value: f32,
        position_top_type: i32,
        position_top_value: f32,
        position_bottom_type: i32,
        position_bottom_value: f32,
        margin_left_type: i32,
        margin_left_value: f32,
        margin_right_type: i32,
        margin_right_value: f32,
        margin_top_type: i32,
        margin_top_value: f32,
        margin_bottom_type: i32,
        margin_bottom_value: f32,
        padding_left_type: i32,
        padding_left_value: f32,
        padding_right_type: i32,
        padding_right_value: f32,
        padding_top_type: i32,
        padding_top_value: f32,
        padding_bottom_type: i32,
        padding_bottom_value: f32,
        border_left_type: i32,
        border_left_value: f32,
        border_right_type: i32,
        border_right_value: f32,
        border_top_type: i32,
        border_top_value: f32,
        border_bottom_type: i32,
        border_bottom_value: f32,
        flex_grow: f32,
        flex_shrink: f32,
        flex_basis_type: i32,
        flex_basis_value: f32,
        width_type: i32,
        width_value: f32,
        height_type: i32,
        height_value: f32,
        min_width_type: i32,
        min_width_value: f32,
        min_height_type: i32,
        min_height_value: f32,
        max_width_type: i32,
        max_width_value: f32,
        max_height_type: i32,
        max_height_value: f32,
        flex_gap_width_type: i32,
        flex_gap_width_value: f32,
        flex_gap_height_type: i32,
        flex_gap_height_value: f32,
        aspect_ratio: f32,
    ) -> Self {
        Style::from_taffy(taffy::style::Style {
            display: match display {
                0 => Display::Flex,
                1 => Display::None,
                _ => panic!(),
            },

            position_type: match position_type {
                0 => PositionType::Relative,
                1 => PositionType::Absolute,
                _ => panic!(),
            },

            /* direction: match direction {
                0 => Direction::Inherit,
                1 => Direction::LTR,
                2 => Direction::RTL,
                _ => panic!(),
            }, */
            flex_direction: match flex_direction {
                0 => FlexDirection::Row,
                1 => FlexDirection::Column,
                2 => FlexDirection::RowReverse,
                3 => FlexDirection::ColumnReverse,
                _ => panic!(),
            },

            flex_wrap: match flex_wrap {
                0 => FlexWrap::NoWrap,
                1 => FlexWrap::Wrap,
                2 => FlexWrap::WrapReverse,
                _ => panic!(),
            },

            /*
            overflow: match overflow {
                0 => Overflow::Visible,
                1 => Overflow::Hidden,
                2 => Overflow::Scroll,
                _ => panic!(),
            },
            */
            align_items: match align_items {
                0 => AlignItems::FlexStart,
                1 => AlignItems::FlexEnd,
                2 => AlignItems::Center,
                3 => AlignItems::Baseline,
                4 => AlignItems::Stretch,
                _ => panic!(),
            },

            align_self: match align_self {
                0 => AlignSelf::Auto,
                1 => AlignSelf::FlexStart,
                2 => AlignSelf::FlexEnd,
                3 => AlignSelf::Center,
                4 => AlignSelf::Baseline,
                5 => AlignSelf::Stretch,
                _ => panic!(),
            },

            align_content: match align_content {
                0 => AlignContent::FlexStart,
                1 => AlignContent::FlexEnd,
                2 => AlignContent::Center,
                3 => AlignContent::Stretch,
                4 => AlignContent::SpaceBetween,
                5 => AlignContent::SpaceAround,
                6 => AlignContent::SpaceEvenly,
                _ => panic!(),
            },

            justify_content: match justify_content {
                0 => JustifyContent::FlexStart,
                1 => JustifyContent::FlexEnd,
                2 => JustifyContent::Center,
                3 => JustifyContent::SpaceBetween,
                4 => JustifyContent::SpaceAround,
                5 => JustifyContent::SpaceEvenly,
                _ => panic!(),
            },

            position: taffy::geometry::Rect {
                left: dimension(position_left_type, position_left_value),
                top: dimension(position_top_type, position_top_value),
                bottom: dimension(position_bottom_type, position_bottom_value),
                right: dimension(position_right_type, position_right_value),
            },

            margin: taffy::geometry::Rect {
                left: dimension(margin_left_type, margin_left_value),
                right: dimension(margin_right_type, margin_right_value),
                top: dimension(margin_top_type, margin_top_value),
                bottom: dimension(margin_bottom_type, margin_bottom_value),
            },

            padding: taffy::geometry::Rect {
                left: dimension(padding_left_type, padding_left_value),
                right: dimension(padding_right_type, padding_right_value),
                top: dimension(padding_top_type, padding_top_value),
                bottom: dimension(padding_bottom_type, padding_bottom_value),
            },

            border: taffy::geometry::Rect {
                left: dimension(border_left_type, border_left_value),
                right: dimension(border_right_type, border_right_value),
                top: dimension(border_top_type, border_top_value),
                bottom: dimension(border_bottom_type, border_bottom_value),
            },

            gap: taffy::geometry::Size {
                width: dimension(flex_gap_width_type, flex_gap_width_value),
                height: dimension(flex_gap_height_type, flex_gap_height_value),
            },
            flex_grow,
            flex_shrink,

            flex_basis: dimension(flex_basis_type, flex_basis_value),

            size: taffy::geometry::Size {
                width: dimension(width_type, width_value),
                height: dimension(height_type, height_value),
            },

            min_size: taffy::geometry::Size {
                width: dimension(min_width_type, min_width_value),
                height: dimension(min_height_type, min_height_value),
            },

            max_size: taffy::geometry::Size {
                width: dimension(max_width_type, max_width_value),
                height: dimension(max_height_type, max_height_value),
            },

            aspect_ratio: if f32::is_nan(aspect_ratio) {
                None
            } else {
                Some(aspect_ratio)
            },
        })
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_from_ffi(
        style: &mut Style,
        display: i32,
        position_type: i32,
        direction: i32,
        flex_direction: i32,
        flex_wrap: i32,
        overflow: i32,
        align_items: i32,
        align_self: i32,
        align_content: i32,
        justify_content: i32,
        position_left_type: i32,
        position_left_value: f32,
        position_right_type: i32,
        position_right_value: f32,
        position_top_type: i32,
        position_top_value: f32,
        position_bottom_type: i32,
        position_bottom_value: f32,
        margin_left_type: i32,
        margin_left_value: f32,
        margin_right_type: i32,
        margin_right_value: f32,
        margin_top_type: i32,
        margin_top_value: f32,
        margin_bottom_type: i32,
        margin_bottom_value: f32,
        padding_left_type: i32,
        padding_left_value: f32,
        padding_right_type: i32,
        padding_right_value: f32,
        padding_top_type: i32,
        padding_top_value: f32,
        padding_bottom_type: i32,
        padding_bottom_value: f32,
        border_left_type: i32,
        border_left_value: f32,
        border_right_type: i32,
        border_right_value: f32,
        border_top_type: i32,
        border_top_value: f32,
        border_bottom_type: i32,
        border_bottom_value: f32,
        flex_grow: f32,
        flex_shrink: f32,
        flex_basis_type: i32,
        flex_basis_value: f32,
        width_type: i32,
        width_value: f32,
        height_type: i32,
        height_value: f32,
        min_width_type: i32,
        min_width_value: f32,
        min_height_type: i32,
        min_height_value: f32,
        max_width_type: i32,
        max_width_value: f32,
        max_height_type: i32,
        max_height_value: f32,
        flex_gap_width_type: i32,
        flex_gap_width_value: f32,
        flex_gap_height_type: i32,
        flex_gap_height_value: f32,
        aspect_ratio: f32,
    ) {
        style.style.display = match display {
            0 => Display::Flex,
            1 => Display::None,
            _ => panic!(),
        };

        style.style.position_type = match position_type {
            0 => PositionType::Relative,
            1 => PositionType::Absolute,
            _ => panic!(),
        };

        /* direction: match direction {
            0 => Direction::Inherit,
            1 => Direction::LTR,
            2 => Direction::RTL,
            _ => panic!(),
        }, */

        style.style.flex_direction = match flex_direction {
            0 => FlexDirection::Row,
            1 => FlexDirection::Column,
            2 => FlexDirection::RowReverse,
            3 => FlexDirection::ColumnReverse,
            _ => panic!(),
        };

        style.style.flex_wrap = match flex_wrap {
            0 => FlexWrap::NoWrap,
            1 => FlexWrap::Wrap,
            2 => FlexWrap::WrapReverse,
            _ => panic!(),
        };

        /*
        overflow: match overflow {
            0 => Overflow::Visible,
            1 => Overflow::Hidden,
            2 => Overflow::Scroll,
            _ => panic!(),
        },
        */

        style.style.align_items = match align_items {
            0 => AlignItems::FlexStart,
            1 => AlignItems::FlexEnd,
            2 => AlignItems::Center,
            3 => AlignItems::Baseline,
            4 => AlignItems::Stretch,
            _ => panic!(),
        };

        style.style.align_self = match align_self {
            0 => AlignSelf::Auto,
            1 => AlignSelf::FlexStart,
            2 => AlignSelf::FlexEnd,
            3 => AlignSelf::Center,
            4 => AlignSelf::Baseline,
            5 => AlignSelf::Stretch,
            _ => panic!(),
        };

        style.style.align_content = match align_content {
            0 => AlignContent::FlexStart,
            1 => AlignContent::FlexEnd,
            2 => AlignContent::Center,
            3 => AlignContent::Stretch,
            4 => AlignContent::SpaceBetween,
            5 => AlignContent::SpaceAround,
            6 => AlignContent::SpaceEvenly,
            _ => panic!(),
        };

        style.style.justify_content = match justify_content {
            0 => JustifyContent::FlexStart,
            1 => JustifyContent::FlexEnd,
            2 => JustifyContent::Center,
            3 => JustifyContent::SpaceBetween,
            4 => JustifyContent::SpaceAround,
            5 => JustifyContent::SpaceEvenly,
            _ => panic!(),
        };

        style.style.position = taffy::geometry::Rect {
            left: dimension(position_left_type, position_left_value),
            top: dimension(position_top_type, position_top_value),
            bottom: dimension(position_bottom_type, position_bottom_value),
            right: dimension(position_right_type, position_right_value),
        };

        style.style.margin = taffy::geometry::Rect {
            left: dimension(margin_left_type, margin_left_value),
            right: dimension(margin_right_type, margin_right_value),
            top: dimension(margin_top_type, margin_top_value),
            bottom: dimension(margin_bottom_type, margin_bottom_value),
        };

        style.style.padding = taffy::geometry::Rect {
            left: dimension(padding_left_type, padding_left_value),
            right: dimension(padding_right_type, padding_right_value),
            top: dimension(padding_top_type, padding_top_value),
            bottom: dimension(padding_bottom_type, padding_bottom_value),
        };

        style.style.border = taffy::geometry::Rect {
            left: dimension(border_left_type, border_left_value),
            right: dimension(border_right_type, border_right_value),
            top: dimension(border_top_type, border_top_value),
            bottom: dimension(border_bottom_type, border_bottom_value),
        };

        style.style.gap = taffy::geometry::Size {
            width: dimension(flex_gap_width_type, flex_gap_width_value),
            height: dimension(flex_gap_height_type, flex_gap_height_value),
        };
        style.style.flex_grow = flex_grow;
        style.style.flex_shrink = flex_shrink;

        style.style.flex_basis = dimension(flex_basis_type, flex_basis_value);

        style.style.size = taffy::geometry::Size {
            width: dimension(width_type, width_value),
            height: dimension(height_type, height_value),
        };

        style.style.min_size = taffy::geometry::Size {
            width: dimension(min_width_type, min_width_value),
            height: dimension(min_height_type, min_height_value),
        };

        style.style.max_size = taffy::geometry::Size {
            width: dimension(max_width_type, max_width_value),
            height: dimension(max_height_type, max_height_value),
        };

        style.style.aspect_ratio = if f32::is_nan(aspect_ratio) {
            None
        } else {
            Some(aspect_ratio)
        };
    }

    pub fn from_taffy(style: taffy::style::Style) -> Self {
        Self { style }
    }

    pub fn into_raw(self) -> *mut Style {
        Box::into_raw(Box::new(self))
    }

    pub fn display(&self) -> Display {
        self.style.display
    }

    pub fn set_display(&mut self, display: Display) {
        self.style.display = display;
    }

    pub fn position_type(&self) -> PositionType {
        self.style.position_type
    }

    pub fn set_position_type(&mut self, position_type: PositionType) {
        self.style.position_type = position_type;
    }

    pub fn flex_direction(&self) -> FlexDirection {
        self.style.flex_direction
    }

    pub fn set_flex_direction(&mut self, flex_direction: FlexDirection) {
        self.style.flex_direction = flex_direction;
    }

    pub fn flex_wrap(&self) -> FlexWrap {
        self.style.flex_wrap
    }

    pub fn set_flex_wrap(&mut self, wrap: FlexWrap) {
        self.style.flex_wrap = wrap;
    }

    pub fn align_items(&self) -> AlignItems {
        self.style.align_items
    }

    pub fn set_align_items(&mut self, align: AlignItems) {
        self.style.align_items = align
    }

    pub fn align_self(&self) -> AlignSelf {
        self.style.align_self
    }

    pub fn set_align_self(&mut self, align: AlignSelf) {
        self.style.align_self = align
    }

    pub fn align_content(&self) -> AlignContent {
        self.style.align_content
    }

    pub fn set_align_content(&mut self, align: AlignContent) {
        self.style.align_content = align
    }

    pub fn justify_content(&self) -> JustifyContent {
        self.style.justify_content
    }

    pub fn set_justify_content(&mut self, justify: JustifyContent) {
        self.style.justify_content = justify
    }

    pub fn position(&self) -> Rect<Dimension> {
        Rect::from_taffy(self.style.position)
    }

    pub fn set_position(&mut self, position: Rect<Dimension>) {
        self.style.position = position.rect
    }

    pub fn margin(&self) -> Rect<Dimension> {
        Rect::from_taffy(self.style.margin)
    }

    pub fn set_margin(&mut self, margin: Rect<Dimension>) {
        self.style.margin = margin.rect;
    }

    pub fn padding(&self) -> Rect<Dimension> {
        Rect::from_taffy(self.style.padding)
    }

    pub fn set_padding(&mut self, padding: Rect<Dimension>) {
        self.style.padding = padding.rect;
    }

    pub fn border(&self) -> Rect<Dimension> {
        Rect::from_taffy(self.style.border)
    }

    pub fn set_border(&mut self, border: Rect<Dimension>) {
        self.style.border = border.rect;
    }

    pub fn flex_grow(&self) -> f32 {
        self.style.flex_grow
    }

    pub fn set_flex_grow(&mut self, grow: f32) {
        self.style.flex_grow = grow;
    }

    pub fn flex_shrink(&self) -> f32 {
        self.style.flex_shrink
    }

    pub fn set_flex_shrink(&mut self, shrink: f32) {
        self.style.flex_shrink = shrink;
    }

    pub fn flex_basis(&self) -> Dimension {
        self.style.flex_basis
    }

    pub fn set_flex_basis(&mut self, basis: Dimension) {
        self.style.flex_basis = basis;
    }

    pub fn size(&self) -> Size<Dimension> {
        Size::from_taffy(self.style.size)
    }

    pub fn set_size(&mut self, size: Size<Dimension>) {
        self.style.size = size.size
    }

    pub fn min_size(&self) -> Size<Dimension> {
        Size::from_taffy(self.style.min_size)
    }

    pub fn set_min_size(&mut self, min: Size<Dimension>) {
        self.style.min_size = min.size
    }

    pub fn max_size(&self) -> Size<Dimension> {
        Size::from_taffy(self.style.max_size)
    }

    pub fn set_max_size(&mut self, size: Size<Dimension>) {
        self.style.max_size = size.size;
    }

    pub fn aspect_ratio(&self) -> Option<f32> {
        self.style.aspect_ratio
    }

    pub fn set_aspect_ratio(&mut self, ratio: Option<f32>) {
        match ratio {
            None => {
                self.style.aspect_ratio = None;
            }
            Some(value) => {
                self.style.aspect_ratio = if f32::is_nan(value) {
                    None
                } else {
                    Some(value)
                }
            }
        }
    }
}
