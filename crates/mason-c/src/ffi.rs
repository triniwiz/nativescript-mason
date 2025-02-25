use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_op_to_enum, align_self_to_enum, display_from_enum,
    display_to_enum, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, position_from_enum, position_to_enum,
    AvailableSpace, CompactLength, Dimension, GridPlacement, GridTrackRepetition, LengthPercentage,
    LengthPercentageAuto, Line, NonRepeatedTrackSizingFunction, Overflow, Point, Rect, Size,
    TaffyZero, TrackSizingFunction,
};
use std::borrow::Cow;

use crate::{CMason, CMasonNode, CMasonStyle};

pub fn style_set_align_items(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.align_items = None;
            } else if let Some(enum_value) = align_items_from_enum(value) {
                style.align_items = Some(enum_value);
            }
        });
    }
}

pub fn style_get_align_items(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| style.align_items.map(|value| align_items_to_enum(value)))
            .unwrap_or(-1)
    }
}

pub fn style_get_align_self(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| style.align_self.map(|value| align_self_to_enum(value)))
            .unwrap_or(-1)
    }
}

pub fn style_set_align_self(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.align_self = None;
            } else if let Some(enum_value) = align_self_from_enum(value) {
                style.align_self = Some(enum_value);
            }
        });
    }
}

pub fn style_get_align_content(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| {
                Some(if let Some(value) = style.align_content {
                    align_content_to_enum(value)
                } else {
                    -1
                })
            })
            .unwrap_or(-1)
    }
}

pub fn style_set_align_content(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.align_content = None;
            } else if let Some(enum_value) = align_content_from_enum(value) {
                style.align_content = Some(enum_value);
            }
        });
    }
}

pub fn style_set_justify_items(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.justify_items = None;
            } else if let Some(enum_value) = align_items_from_enum(value) {
                style.justify_items = Some(enum_value);
            }
        });
    }
}

pub fn style_get_justify_items(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| {
                Some(if let Some(value) = style.justify_items {
                    align_items_to_enum(value)
                } else {
                    -1
                })
            })
            .unwrap_or(-1)
    }
}

pub fn style_get_justify_self(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| {
                style.justify_self.map(|value| align_self_to_enum(value))
            })
            .unwrap_or(-1)
    }
}

pub fn style_set_justify_self(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.justify_self = None;
            } else if let Some(enum_value) = align_self_from_enum(value) {
                style.justify_self = Some(enum_value);
            }
        });
    }
}

pub fn style_get_justify_content(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| {
                style.justify_content.map(|value| justify_content_to_enum(value))
            })
            .unwrap_or(-1)
    }
}

pub fn style_set_justify_content(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if value == -1 {
                style.justify_content = None;
            } else if let Some(enum_value) = justify_content_from_enum(value) {
                style.justify_content = Some(enum_value);
            }
        });
    }
}

pub fn style_set_display(style: *mut CMasonStyle, display: i32) {
    unsafe {
        if let Some(display) = display_from_enum(display) {
            let style = &mut *style;
            style.with_mut(|style| {
                style.display = display;
            });
        }
    }
}

pub fn style_get_display(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(display_to_enum(style.display)))
            .unwrap_or(-1)
    }
}

pub fn style_get_position(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(position_to_enum(style.position)))
            .unwrap_or(-1)
    }
}

pub fn style_set_position(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(position) = position_from_enum(value) {
            let style = &mut *style;
            style.with_mut(|style| {
                style.position = position;
            });
        }
    }
}

pub fn style_set_flex_direction(style: *mut CMasonStyle, direction: i32) {
    unsafe {
        if let Some(value) = flex_direction_from_enum(direction) {
            let style = &mut *style;
            style.with_mut(|style| {
                style.flex_direction = value;
            });
        }
    }
}

pub fn style_get_flex_direction(style: *mut CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(flex_direction_to_enum(style.flex_direction)))
            .unwrap_or(-1)
    }
}

pub fn style_get_flex_wrap(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(flex_wrap_to_enum(style.flex_wrap)))
            .unwrap_or(-1)
    }
}

pub fn style_set_flex_wrap(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(flex_wrap) = flex_wrap_from_enum(value) {
            let style = &mut *style;
            style.with_mut(|style| {
                style.flex_wrap = flex_wrap;
            });
        }
    }
}

pub fn style_set_inset(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            };
            style.inset = rect;
        });
    }
}

pub fn style_set_inset_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left,
                right,
                top,
                bottom,
            };
            style.inset = rect;
        });
    }
}

pub fn style_get_inset_left(style: *mut CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.inset.left))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_inset_left(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.inset.left = value;
        });
    }
}

pub fn style_get_inset_right(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.inset.right))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_inset_right(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.inset.right = value;
        });
    }
}

pub fn style_get_inset_top(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.inset.top))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_inset_top(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.inset.top = value;
        });
    }
}

pub fn style_get_inset_bottom(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.inset.bottom))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_inset_bottom(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.inset.bottom = value;
        });
    }
}

pub fn style_set_margin(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            };
            style.margin = rect;
        });
    }
}

pub fn style_set_margin_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left,
                right,
                top,
                bottom,
            };
            style.margin = rect;
        });
    }
}

pub fn style_get_margin_left(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.margin.left))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_margin_left(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.margin.left = value;
        });
    }
}

pub fn style_get_margin_right(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.margin.right))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_margin_right(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.margin.right = value;
        });
    }
}

pub fn style_get_margin_top(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.margin.top))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_margin_top(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.margin.top = value;
        });
    }
}

pub fn style_get_margin_bottom(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.margin.bottom))
            .unwrap_or(LengthPercentageAuto::auto())
    }
}

pub fn style_set_margin_bottom(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.margin.bottom = value;
        });
    }
}

pub fn style_set_border(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            };
            style.border = rect;
        });
    }
}

pub fn style_set_border_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left,
                right,
                top,
                bottom,
            };
            style.border = rect;
        });
    }
}

pub fn style_get_border_left(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.border.left))
            .unwrap_or(LengthPercentage::length(0.0))
    }
}

pub fn style_set_border_left(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.border.left = value;
        });
    }
}

pub fn style_get_border_right(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.border.right))
            .unwrap_or(LengthPercentage::length(0.0))
    }
}

pub fn style_set_border_right(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.border.right = value;
        });
    }
}

pub fn style_get_border_top(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.border.top))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_border_top(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.border.top = value;
        });
    }
}

pub fn style_get_border_bottom(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.border.bottom))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_border_bottom(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.border.bottom = value;
        });
    }
}

pub fn style_set_flex_grow(style: *mut CMasonStyle, grow: f32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.flex_grow = grow;
        });
    }
}

pub fn style_get_flex_grow(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style);
        style.get(|style| Some(style.flex_grow)).unwrap_or(0.0)
    }
}

pub fn style_set_flex_shrink(style: *mut CMasonStyle, shrink: f32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.flex_shrink = shrink;
        });
    }
}

pub fn style_get_flex_shrink(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style);
        style.get(|style| Some(style.flex_shrink)).unwrap_or(1.)
    }
}

pub fn style_get_flex_basis(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.flex_basis))
            .unwrap_or(Dimension::ZERO)
    }
}

pub fn style_set_flex_basis(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.flex_basis = value;
        });
    }
}

pub fn style_get_gap(style: *const CMasonStyle) -> Size<LengthPercentage> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.gap))
            .unwrap_or(Size::<LengthPercentage>::ZERO)
    }
}

pub fn style_set_gap(style: *mut CMasonStyle, width: LengthPercentage, height: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| style.gap = Size { width, height });
    }
}

pub fn style_get_row_gap(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.gap.width))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_row_gap(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.gap.width = value;
        });
    }
}

pub fn style_get_column_gap(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.gap.height))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_column_gap(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.gap.height = value;
        });
    }
}

pub fn style_set_aspect_ratio(style: *mut CMasonStyle, ratio: f32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if ratio.is_nan() {
                style.aspect_ratio = None;
            } else {
                style.aspect_ratio = Some(ratio);
            }
        });
    }
}

pub fn style_get_aspect_ratio(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style);
        style.get(|style| style.aspect_ratio).unwrap_or(f32::NAN)
    }
}

pub fn style_set_padding(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left: value,
                right: value,
                top: value,
                bottom: value,
            };
            style.padding = rect;
        });
    }
}

pub fn style_set_padding_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            let rect = Rect {
                left,
                right,
                top,
                bottom,
            };
            style.padding = rect;
        });
    }
}

pub fn style_get_padding_left(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.padding.left))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_padding_left(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.padding.left = value;
        });
    }
}

pub fn style_get_padding_right(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.padding.right))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_padding_right(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.padding.right = value;
        });
    }
}

pub fn style_get_padding_top(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.padding.top))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_padding_top(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.padding.top = value;
        });
    }
}

pub fn style_get_padding_bottom(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.padding.bottom))
            .unwrap_or(LengthPercentage::ZERO)
    }
}

pub fn style_set_padding_bottom(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.padding.bottom = value;
        });
    }
}

pub fn style_get_min_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.min_size.width))
            .unwrap_or(Dimension::ZERO)
    }
}

pub fn style_set_min_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.min_size.width = value;
        });
    }
}

pub fn style_get_min_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.min_size.height))
            .unwrap_or(Dimension::ZERO)
    }
}

pub fn style_set_min_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.min_size.height = value;
        });
    }
}

pub fn style_get_max_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.max_size.width))
            .unwrap_or(Dimension::ZERO)
    }
}

pub fn style_set_max_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.max_size.width = value;
        });
    }
}

pub fn style_get_max_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.max_size.height))
            .unwrap_or(Dimension::ZERO)
    }
}

pub fn style_set_max_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.max_size.height = value;
        });
    }
}

pub fn style_get_grid_auto_rows(style: *const CMasonStyle) -> Vec<NonRepeatedTrackSizingFunction> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_auto_rows.to_vec()))
            .unwrap_or(Default::default())
    }
}

pub fn style_set_grid_auto_rows(
    style: *mut CMasonStyle,
    value: Vec<NonRepeatedTrackSizingFunction>,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_auto_rows = value;
        });
    }
}

pub fn style_get_grid_auto_columns(
    style: *const CMasonStyle,
) -> Vec<NonRepeatedTrackSizingFunction> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_auto_columns.to_vec()))
            .unwrap_or(vec![])
    }
}

pub fn style_set_grid_auto_columns(
    style: *mut CMasonStyle,
    value: Vec<NonRepeatedTrackSizingFunction>,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_auto_columns = value;
        });
    }
}

pub fn style_get_grid_auto_flow(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(grid_auto_flow_to_enum(style.grid_auto_flow)))
            .unwrap_or(-1)
    }
}

pub fn style_set_grid_auto_flow(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(value) = grid_auto_flow_from_enum(value) {
            let style = &mut *style;
            style.with_mut(|style| {
                style.grid_auto_flow = value;
            });
        }
    }
}

pub fn style_set_grid_area(
    style: *mut CMasonStyle,
    row_start: GridPlacement,
    row_end: GridPlacement,
    column_start: GridPlacement,
    column_end: GridPlacement,
) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_row = Line {
                start: row_start,
                end: row_end,
            };

            style.grid_column = Line {
                start: column_start,
                end: column_end,
            };
        });
    }
}

pub fn style_set_grid_column(style: *mut CMasonStyle, start: GridPlacement, end: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_column = Line { start, end };
        });
    }
}

pub fn style_get_grid_column_start(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_column.start))
            .unwrap_or(GridPlacement::default())
    }
}

pub fn style_set_grid_column_start(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_column.start = value;
        });
    }
}

pub fn style_get_grid_column_end(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_column.end))
            .unwrap_or(GridPlacement::default())
    }
}

pub fn style_set_grid_column_end(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_column.end = value;
        });
    }
}

pub fn style_set_grid_row(style: *mut CMasonStyle, start: GridPlacement, end: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_row = Line { start, end };
        });
    }
}

pub fn style_get_grid_row_start(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_row.start))
            .unwrap_or(GridPlacement::default())
    }
}

pub fn style_set_grid_row_start(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_row.start = value;
        });
    }
}

pub fn style_get_grid_row_end(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_row.end))
            .unwrap_or(GridPlacement::default())
    }
}

pub fn style_set_grid_row_end(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_row.end = value;
        });
    }
}

pub fn style_get_grid_template_rows(style: *const CMasonStyle) -> Vec<TrackSizingFunction> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_template_rows.to_vec()))
            .unwrap_or(vec![])
    }
}

pub fn style_set_grid_template_rows(style: *mut CMasonStyle, value: Vec<TrackSizingFunction>) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_template_rows = value;
        });
    }
}

pub fn style_get_grid_template_columns(style: *const CMasonStyle) -> Vec<TrackSizingFunction> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.grid_template_columns.to_vec()))
            .unwrap_or(vec![])
    }
}

pub fn style_set_grid_template_columns(style: *mut CMasonStyle, value: Vec<TrackSizingFunction>) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.grid_template_columns = value;
        });
    }
}

pub fn style_set_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| style.size.width = value);
    }
}

pub fn style_get_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.size.width))
            .unwrap_or(Dimension::auto())
    }
}

pub fn style_set_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.size.height = value;
        });
    }
}

pub fn style_get_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.size.height))
            .unwrap_or(Dimension::auto())
    }
}

pub fn style_set_scrollbar_width(style: *mut CMasonStyle, value: f32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            style.scrollbar_width = value;
        });
    }
}

pub fn style_get_scrollbar_width(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.scrollbar_width))
            .unwrap_or(-1.)
    }
}

pub fn style_set_overflow(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if let Some(overflow) = overflow_from_enum(value) {
                style.overflow = Point {
                    x: overflow,
                    y: overflow,
                }
            }
        });
    }
}

pub fn style_get_overflow(style: *const CMasonStyle) -> Point<Overflow> {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.overflow))
            .unwrap_or(Point::default())
    }
}

pub fn style_set_overflow_x(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if let Some(x) = overflow_from_enum(value) {
                style.overflow.x = x;
            }
        });
    }
}

pub fn style_get_overflow_x(style: *const CMasonStyle) -> Overflow {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.overflow.x))
            .unwrap_or(Overflow::default())
    }
}

pub fn style_set_overflow_y(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut *style;
        style.with_mut(|style| {
            if let Some(y) = overflow_from_enum(value) {
                style.overflow.y = y;
            }
        });
    }
}

pub fn style_get_overflow_y(style: *const CMasonStyle) -> Overflow {
    unsafe {
        let style = &(*style);
        style
            .get(|style| Some(style.overflow.y))
            .unwrap_or(Overflow::default())
    }
}

pub fn node_update_and_set_style(
    mason: *mut CMason,
    node: *const CMasonNode,
    style: *const CMasonStyle,
) {
    /*
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;

        let style = &(*style);
        style
            .get(|style| {})
            .unwrap_or(-1)

        mason.set_style(*node, style.clone());
    }
    */
}

pub fn node_compute(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        mason.compute(node);
    }
}

pub fn node_compute_min_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(node, size);
    }
}

pub fn node_compute_max_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = (*node).0;
        let size = Size::max_content();
        mason.compute_size(node, size);
    }
}

pub fn node_compute_wh(mason: *mut CMason, node: *const CMasonNode, width: f32, height: f32) {
    unsafe {
        let mason = &mut (*mason);
        let node = (*node).0;
        mason.with_mut(|mason| {
            mason.compute_wh(node, width, height);
        })
    }
}

pub fn node_mark_dirty(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = (*node).0;

        if let Some(node) = mason.get_node_mut(node_id) {
            node.mark_dirty();
        }
    }
}

pub fn node_dirty(mason: *const CMason, node: *const CMasonNode) -> bool {
    unsafe {
        let mason = &(*mason).0;

        let node_id = (*node).0;

        match mason.get_node(node_id) {
            None => false,
            Some(node) => node.dirty(),
        }
    }
}

const AUTO: &str = "auto";
const AUTO_FILL: &str = "auto-fill";
const AUTO_FIT: &str = "auto-fit";
const MIN_CONTENT: &str = "min-content";
const MAX_CONTENT: &str = "max-content";
const FIT_CONTENT: &str = "fit-content";
const MIN_MAX: &str = "minmax";
const PX_UNIT: &str = "px";
const PERCENT_UNIT: &str = "%";
const FLEX_UNIT: &str = "fr";

pub fn parse_non_repeated_track_sizing_function_value<'a>(
    value: NonRepeatedTrackSizingFunction,
) -> Cow<'a, str> {
    if value.min.is_auto() && value.max.is_auto() {
        AUTO.into()
    } else if value.min.is_min_content() && value.max.is_min_content() {
        MIN_CONTENT.into()
    } else if value.min.is_max_content() && value.max.is_max_content() {
        MAX_CONTENT.into()
    } else if value.min.is_auto() && value.max.is_fit_content() {
        let raw = value.max.into_raw();
        match raw.tag() {
            CompactLength::FIT_CONTENT_PX_TAG => {
                format!("fit-content({:.0}px)", raw.value()).into()
            }
            CompactLength::FIT_CONTENT_PERCENT_TAG => {
                format!("fit-content({:.3}%)", raw.value()).into()
            }
            _ => unreachable!(),
        }
    } else if value.min.is_auto() && value.max.is_fr() {
        let raw = value.max.into_raw();
        (raw.value().to_string() + FLEX_UNIT).into()
    } else {
        let min_raw = value.min.into_raw();
        let max_raw = value.max.into_raw();

        let min = match min_raw.tag() {
            CompactLength::AUTO_TAG => Cow::from(AUTO),
            CompactLength::MIN_CONTENT_TAG => Cow::from(MIN_CONTENT),
            CompactLength::MAX_CONTENT_TAG => Cow::from(MAX_CONTENT),
            CompactLength::LENGTH_TAG => format!("{}px", min_raw.value()).into(),
            CompactLength::PERCENT_TAG => format!("{}%", min_raw.value()).into(),
            _ => unreachable!(),
        };
        let max = match max_raw.tag() {
            CompactLength::AUTO_TAG => Cow::from(AUTO),
            CompactLength::LENGTH_TAG => format!("{}px", max_raw.value()).into(),
            CompactLength::PERCENT_TAG => format!("{}%", max_raw.value()).into(),
            CompactLength::MIN_CONTENT_TAG => Cow::from(MIN_CONTENT),
            CompactLength::MAX_CONTENT_TAG => Cow::from(MAX_CONTENT),
            CompactLength::FR_TAG => format!("{:?}fr", max_raw.value()).into(),
            _ => unreachable!(),
        };
        format!("minmax({}, {})", min, max).into()
    }
}

pub fn parse_track_sizing_function_value(value: &TrackSizingFunction) -> String {
    let mut ret = String::new();
    match value {
        TrackSizingFunction::Single(value) => {
            let parsed = parse_non_repeated_track_sizing_function_value(*value);
            ret.push_str(parsed.as_ref())
        }
        TrackSizingFunction::Repeat(grid_track_repetition, values) => {
            ret.push_str("repeat(");
            match *grid_track_repetition {
                GridTrackRepetition::AutoFill => {
                    ret.push_str("auto-fill");
                }
                GridTrackRepetition::AutoFit => {
                    ret.push_str("auto-fit");
                }
                GridTrackRepetition::Count(count) => ret.push_str(&format!("{count}")),
            }

            for (j, inner_val) in values.iter().enumerate() {
                let parsed = parse_non_repeated_track_sizing_function_value(*inner_val);

                if j != 0 {
                    ret.push(' ');
                }

                ret.push_str(parsed.as_ref())
            }

            ret.push(')');
        }
    }

    ret
}
