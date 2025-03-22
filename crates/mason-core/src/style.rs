use crate::utils::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, box_sizing_from_enum, display_from_enum,
    display_to_enum, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, overflow_to_enum, position_from_enum,
    position_to_enum, text_align_from_enum, text_align_to_enum,
};
use bitflags::{bitflags, Flags};
use std::i16;
use std::slice::SliceIndex;
use taffy::geometry::Point;
use taffy::prelude::*;
use taffy::style::{
    Display, LengthPercentage, LengthPercentageAuto, MinTrackSizingFunction, TrackSizingFunction,
};
use taffy::GridContainerStyle;

use log::log;
pub use taffy::style::Style;

#[inline(always)]
#[track_caller]
pub fn length_percentage_auto_from_type_value(value_type: i32, value: f32) -> LengthPercentageAuto {
    match value_type {
        0 => LengthPercentageAuto::auto(),
        1 => LengthPercentageAuto::length(value),
        2 => LengthPercentageAuto::percent(value),
        _ => unreachable!(),
    }
}

#[inline(always)]
pub fn length_percentage_auto_to_type_value(value: LengthPercentageAuto) -> (i32, f32) {
    if value.is_auto() {
        return (0, 0.0);
    }
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => (1, raw.value()),
        CompactLength::PERCENT_TAG => (2, raw.value()),
        _ => unreachable!(),
    }
}

#[inline(always)]
pub fn length_percentage_to_type_value(value: LengthPercentage) -> (i32, f32) {
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => (0, raw.value()),
        CompactLength::PERCENT_TAG => (1, raw.value()),
        _ => unreachable!(),
    }
}

#[inline(always)]
#[track_caller]
pub fn length_percentage_from_type_value(value_type: i32, value: f32) -> LengthPercentage {
    match value_type {
        0 => LengthPercentage::length(value),
        1 => LengthPercentage::percent(value),
        _ => unreachable!(),
    }
}

#[inline(always)]
#[track_caller]
pub fn dimension_from_type_value(value_type: i32, value: f32) -> Dimension {
    // todo handle calc when supported
    match value_type {
        0 => Dimension::auto(),
        1 => Dimension::length(value),
        2 => Dimension::percent(value),
        _ => unreachable!(),
    }
}

#[inline(always)]
pub fn dimension_to_type_value(value: Dimension) -> (i32, f32) {
    if value.is_auto() {
        return (0, 0.0);
    }
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => (1, raw.value()),
        CompactLength::PERCENT_TAG => (2, raw.value()),
        _ => unreachable!(),
    }
}

pub const fn dimension_with_auto(t: i32, v: f32) -> LengthPercentageAuto {
    match t {
        0 => LengthPercentageAuto::AUTO,
        1 => LengthPercentageAuto::length(v),
        2 => LengthPercentageAuto::percent(v),
        _ => panic!(),
    }
}

const fn dimension(t: i32, v: f32) -> LengthPercentage {
    match t {
        0 => LengthPercentage::length(v),
        1 => LengthPercentage::percent(v),
        _ => panic!(),
    }
}

pub fn min_max_from_values(
    min_type: i32,
    min_value: f32,
    max_type: i32,
    max_value: f32,
) -> NonRepeatedTrackSizingFunction {
    NonRepeatedTrackSizingFunction {
        min: match min_type {
            0 => MinTrackSizingFunction::AUTO,
            1 => MinTrackSizingFunction::MIN_CONTENT,
            2 => MinTrackSizingFunction::MAX_CONTENT,
            3 => MinTrackSizingFunction::from_length(min_value),
            4 => MinTrackSizingFunction::from_percent(min_value),
            _ => panic!(),
        },
        max: match max_type {
            0 => MaxTrackSizingFunction::AUTO,
            1 => MaxTrackSizingFunction::MIN_CONTENT,
            2 => MaxTrackSizingFunction::MAX_CONTENT,
            3 => MaxTrackSizingFunction::from_length(max_value),
            4 => MaxTrackSizingFunction::from_percent(max_value),
            5 => MaxTrackSizingFunction::fr(max_value),
            6 => MaxTrackSizingFunction::fit_content(LengthPercentage::length(max_value)),
            7 => MaxTrackSizingFunction::fit_content(LengthPercentage::percent(max_value)),
            _ => panic!(),
        },
    }
}

fn grid_placement(t: i32, v: i16) -> GridPlacement {
    match t {
        0 => GridPlacement::Auto,
        1 => GridPlacement::Line(v.into()),
        2 => GridPlacement::Span(v.try_into().unwrap()),
        _ => panic!(),
    }
}

fn grid_placement_to_value(value: GridPlacement) -> (i32, i16) {
    match value {
        GridPlacement::Auto => (0, 0),
        GridPlacement::Line(line) => (1, line.as_i16()),
        GridPlacement::Span(span) => (2, span as i16),
    }
}

pub fn set_inset_lrtb(
    style: &mut Style,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    style.inset.left = left;
    style.inset.right = right;
    style.inset.top = top;
    style.inset.bottom = bottom;
}

pub fn set_margin_lrtb(
    style: &mut Style,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    style.margin.left = left;
    style.margin.right = right;
    style.margin.top = top;
    style.margin.bottom = bottom;
}

pub fn set_padding_lrtb(
    style: &mut taffy::Style,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    style.padding.left = left;
    style.padding.right = right;
    style.padding.top = top;
    style.padding.bottom = bottom;
}

pub fn set_border_lrtb(
    style: &mut taffy::Style,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    style.border.left = left;
    style.border.right = right;
    style.border.top = top;
    style.border.bottom = bottom;
}

pub fn set_aspect_ratio(style: &mut Style, ratio: Option<f32>) {
    style.aspect_ratio = match ratio {
        None => None,
        Some(value) => {
            if f32::is_nan(value) {
                None
            } else {
                Some(value)
            }
        }
    }
}

#[repr(usize)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[allow(non_camel_case_types)]
pub enum StyleKeys {
    DISPLAY = 0,
    POSITION = 4,
    DIRECTION = 8,
    FLEX_DIRECTION = 12,
    FLEX_WRAP = 16,
    OVERFLOW_X = 20,
    OVERFLOW_Y = 24,

    ALIGN_ITEMS = 28,
    ALIGN_SELF = 32,
    ALIGN_CONTENT = 36,

    JUSTIFY_ITEMS = 40,
    JUSTIFY_SELF = 44,
    JUSTIFY_CONTENT = 48,

    INSET_LEFT_TYPE = 52,
    INSET_LEFT_VALUE = 56,
    INSET_RIGHT_TYPE = 60,
    INSET_RIGHT_VALUE = 64,
    INSET_TOP_TYPE = 68,
    INSET_TOP_VALUE = 72,
    INSET_BOTTOM_TYPE = 76,
    INSET_BOTTOM_VALUE = 80,

    MARGIN_LEFT_TYPE = 84,
    MARGIN_LEFT_VALUE = 88,
    MARGIN_RIGHT_TYPE = 92,
    MARGIN_RIGHT_VALUE = 96,
    MARGIN_TOP_TYPE = 100,
    MARGIN_TOP_VALUE = 104,
    MARGIN_BOTTOM_TYPE = 108,
    MARGIN_BOTTOM_VALUE = 112,

    PADDING_LEFT_TYPE = 116,
    PADDING_LEFT_VALUE = 120,
    PADDING_RIGHT_TYPE = 124,
    PADDING_RIGHT_VALUE = 128,
    PADDING_TOP_TYPE = 132,
    PADDING_TOP_VALUE = 136,
    PADDING_BOTTOM_TYPE = 140,
    PADDING_BOTTOM_VALUE = 144,

    BORDER_LEFT_TYPE = 148,
    BORDER_LEFT_VALUE = 152,
    BORDER_RIGHT_TYPE = 156,
    BORDER_RIGHT_VALUE = 160,
    BORDER_TOP_TYPE = 164,
    BORDER_TOP_VALUE = 168,
    BORDER_BOTTOM_TYPE = 172,
    BORDER_BOTTOM_VALUE = 176,

    FLEX_GROW = 180,
    FLEX_SHRINK = 184,

    FLEX_BASIS_TYPE = 188,
    FLEX_BASIS_VALUE = 192,

    WIDTH_TYPE = 196,
    WIDTH_VALUE = 200,
    HEIGHT_TYPE = 204,
    HEIGHT_VALUE = 208,

    MIN_WIDTH_TYPE = 212,
    MIN_WIDTH_VALUE = 216,
    MIN_HEIGHT_TYPE = 220,
    MIN_HEIGHT_VALUE = 224,

    MAX_WIDTH_TYPE = 228,
    MAX_WIDTH_VALUE = 232,
    MAX_HEIGHT_TYPE = 236,
    MAX_HEIGHT_VALUE = 240,

    GAP_ROW_TYPE = 244,
    GAP_ROW_VALUE = 248,
    GAP_COLUMN_TYPE = 252,
    GAP_COLUMN_VALUE = 256,

    ASPECT_RATIO = 260,
    GRID_AUTO_FLOW = 264,
    GRID_COLUMN_START_TYPE = 268,
    GRID_COLUMN_START_VALUE = 272,
    GRID_COLUMN_END_TYPE = 276,
    GRID_COLUMN_END_VALUE = 280,
    GRID_ROW_START_TYPE = 284,
    GRID_ROW_START_VALUE = 288,
    GRID_ROW_END_TYPE = 292,
    GRID_ROW_END_VALUE = 296,
    SCROLLBAR_WIDTH = 300,
    TEXT_ALIGN = 304,
    BOX_SIZING = 308,
    OVERFLOW = 312,
    ITEM_IS_TABLE = 316,
}

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct StateKeys: u64 {
       const DISPLAY         = 1 << 0;
        const POSITION        = 1 << 1;
        const DIRECTION       = 1 << 2;
        const FLEX_DIRECTION  = 1 << 3;
        const FLEX_WRAP       = 1 << 4;
        const OVERFLOW_X      = 1 << 5;
        const OVERFLOW_Y      = 1 << 6;
        const ALIGN_ITEMS     = 1 << 7;
        const ALIGN_SELF      = 1 << 8;
        const ALIGN_CONTENT   = 1 << 9;
        const JUSTIFY_ITEMS   = 1 << 10;
        const JUSTIFY_SELF    = 1 << 11;
        const JUSTIFY_CONTENT = 1 << 12;
        const INSET           = 1 << 13;
        const MARGIN          = 1 << 14;
        const PADDING         = 1 << 15;
        const BORDER          = 1 << 16;
        const FLEX_GROW       = 1 << 17;
        const FLEX_SHRINK     = 1 << 18;
        const FLEX_BASIS      = 1 << 19;
        const SIZE            = 1 << 20;
        const MIN_SIZE        = 1 << 21;
        const MAX_SIZE        = 1 << 22;
        const GAP             = 1 << 23;
        const ASPECT_RATIO    = 1 << 24;
        const GRID_AUTO_FLOW  = 1 << 25;
        const GRID_COLUMN     = 1 << 26;
        const GRID_ROW        = 1 << 27;
        const SCROLLBAR_WIDTH = 1 << 28;
        const TEXT_ALIGN      = 1 << 29;
        const BOX_SIZING      = 1 << 30;
        const OVERFLOW        = 1 << 31;
        const ITEM_IS_TABLE   = 1 << 32;
    }
}

#[allow(clippy::too_many_arguments)]
pub fn from_ffi(
    display: i32,
    position: i32,
    _direction: i32,
    flex_direction: i32,
    flex_wrap: i32,
    _overflow: i32,
    align_items: i32,
    align_self: i32,
    align_content: i32,
    justify_items: i32,
    justify_self: i32,
    justify_content: i32,
    inset_left_type: i32,
    inset_left_value: f32,
    inset_right_type: i32,
    inset_right_value: f32,
    inset_top_type: i32,
    inset_top_value: f32,
    inset_bottom_type: i32,
    inset_bottom_value: f32,
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
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: Vec<NonRepeatedTrackSizingFunction>,
    grid_auto_columns: Vec<NonRepeatedTrackSizingFunction>,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: Vec<TrackSizingFunction>,
    grid_template_columns: Vec<TrackSizingFunction>,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
) -> Style {
    let mut style = Style::default();
    style.display = Display::Block;
    update_from_ffi(
        &mut style,
        display,
        position,
        _direction,
        flex_direction,
        flex_wrap,
        _overflow,
        align_items,
        align_self,
        align_content,
        justify_items,
        justify_self,
        justify_content,
        inset_left_type,
        inset_left_value,
        inset_right_type,
        inset_right_value,
        inset_top_type,
        inset_top_value,
        inset_bottom_type,
        inset_bottom_value,
        margin_left_type,
        margin_left_value,
        margin_right_type,
        margin_right_value,
        margin_top_type,
        margin_top_value,
        margin_bottom_type,
        margin_bottom_value,
        padding_left_type,
        padding_left_value,
        padding_right_type,
        padding_right_value,
        padding_top_type,
        padding_top_value,
        padding_bottom_type,
        padding_bottom_value,
        border_left_type,
        border_left_value,
        border_right_type,
        border_right_value,
        border_top_type,
        border_top_value,
        border_bottom_type,
        border_bottom_value,
        flex_grow,
        flex_shrink,
        flex_basis_type,
        flex_basis_value,
        width_type,
        width_value,
        height_type,
        height_value,
        min_width_type,
        min_width_value,
        min_height_type,
        min_height_value,
        max_width_type,
        max_width_value,
        max_height_type,
        max_height_value,
        gap_row_type,
        gap_row_value,
        gap_column_type,
        gap_column_value,
        aspect_ratio,
        grid_auto_rows,
        grid_auto_columns,
        grid_auto_flow,
        grid_column_start_type,
        grid_column_start_value,
        grid_column_end_type,
        grid_column_end_value,
        grid_row_start_type,
        grid_row_start_value,
        grid_row_end_type,
        grid_row_end_value,
        grid_template_rows,
        grid_template_columns,
        overflow_x,
        overflow_y,
        scrollbar_width,
        text_align,
        box_sizing,
    );

    style
}

#[allow(clippy::too_many_arguments)]
pub fn update_from_ffi(
    style: &mut Style,
    display: i32,
    position: i32,
    _direction: i32,
    flex_direction: i32,
    flex_wrap: i32,
    _overflow: i32,
    align_items: i32,
    align_self: i32,
    align_content: i32,
    justify_items: i32,
    justify_self: i32,
    justify_content: i32,
    inset_left_type: i32,
    inset_left_value: f32,
    inset_right_type: i32,
    inset_right_value: f32,
    inset_top_type: i32,
    inset_top_value: f32,
    inset_bottom_type: i32,
    inset_bottom_value: f32,
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
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: Vec<NonRepeatedTrackSizingFunction>,
    grid_auto_columns: Vec<NonRepeatedTrackSizingFunction>,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: Vec<TrackSizingFunction>,
    grid_template_columns: Vec<TrackSizingFunction>,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
) {
    if let Some(display) = display_from_enum(display) {
        style.display = display;
    }

    if let Some(position) = position_from_enum(position) {
        style.position = position;
    }

    if let Some(flex_direction) = flex_direction_from_enum(flex_direction) {
        style.flex_direction = flex_direction;
    }

    if let Some(flex_wrap) = flex_wrap_from_enum(flex_wrap) {
        style.flex_wrap = flex_wrap;
    }

    style.scrollbar_width = scrollbar_width;

    if let Some(overflow) = overflow_from_enum(_overflow) {
        style.overflow = Point {
            x: overflow,
            y: overflow,
        }
    }

    if let Some(overflow_x) = overflow_from_enum(overflow_x) {
        style.overflow.x = overflow_x;
    }

    if let Some(overflow_y) = overflow_from_enum(overflow_y) {
        style.overflow.y = overflow_y;
    }

    if align_items == -1 {
        style.align_items = None;
    } else if let Some(align_items) = align_items_from_enum(align_items) {
        style.align_items = Some(align_items);
    }

    if align_self == -1 {
        style.align_self = None;
    } else if let Some(align_self) = align_self_from_enum(align_self) {
        style.align_self = Some(align_self);
    }

    if align_content == -1 {
        style.align_content = None;
    } else if let Some(align_content) = align_content_from_enum(align_content) {
        style.align_content = Some(align_content);
    }

    if justify_items == -1 {
        style.justify_items = None;
    } else if let Some(justify_items) = align_items_from_enum(justify_items) {
        style.justify_items = Some(justify_items);
    }

    if justify_self == -1 {
        style.justify_self = None;
    } else if let Some(justify_self) = align_self_from_enum(justify_self) {
        style.justify_self = Some(justify_self);
    }

    if justify_content == -1 {
        style.justify_content = None;
    } else if let Some(justify_content) = justify_content_from_enum(justify_content) {
        style.justify_content = Some(justify_content);
    }

    style.inset = Rect {
        left: dimension_with_auto(inset_left_type, inset_left_value),
        top: dimension_with_auto(inset_top_type, inset_top_value),
        bottom: dimension_with_auto(inset_bottom_type, inset_bottom_value),
        right: dimension_with_auto(inset_right_type, inset_right_value),
    };

    style.margin = Rect {
        left: dimension_with_auto(margin_left_type, margin_left_value),
        right: dimension_with_auto(margin_right_type, margin_right_value),
        top: dimension_with_auto(margin_top_type, margin_top_value),
        bottom: dimension_with_auto(margin_bottom_type, margin_bottom_value),
    };

    style.padding = Rect {
        left: dimension(padding_left_type, padding_left_value),
        right: dimension(padding_right_type, padding_right_value),
        top: dimension(padding_top_type, padding_top_value),
        bottom: dimension(padding_bottom_type, padding_bottom_value),
    };

    style.border = Rect {
        left: dimension(border_left_type, border_left_value),
        right: dimension(border_right_type, border_right_value),
        top: dimension(border_top_type, border_top_value),
        bottom: dimension(border_bottom_type, border_bottom_value),
    };

    style.gap = Size {
        width: dimension(gap_row_type, gap_row_value),
        height: dimension(gap_column_type, gap_column_value),
    };
    style.flex_grow = flex_grow;
    style.flex_shrink = flex_shrink;

    style.flex_basis = dimension_with_auto(flex_basis_type, flex_basis_value).into();

    style.size = Size {
        width: dimension_with_auto(width_type, width_value).into(),
        height: dimension_with_auto(height_type, height_value).into(),
    };

    style.min_size = Size {
        width: dimension_with_auto(min_width_type, min_width_value).into(),
        height: dimension_with_auto(min_height_type, min_height_value).into(),
    };

    style.max_size = Size {
        width: dimension_with_auto(max_width_type, max_width_value).into(),
        height: dimension_with_auto(max_height_type, max_height_value).into(),
    };

    style.aspect_ratio = if f32::is_nan(aspect_ratio) {
        None
    } else {
        Some(aspect_ratio)
    };

    style.grid_template_rows = grid_template_rows;

    style.grid_template_columns = grid_template_columns;

    style.grid_auto_rows = grid_auto_rows;

    style.grid_auto_columns = grid_auto_columns;

    if let Some(grid_auto_flow) = grid_auto_flow_from_enum(grid_auto_flow) {
        style.grid_auto_flow = grid_auto_flow;
    }

    style.grid_row = Line {
        start: grid_placement(grid_row_start_type, grid_row_start_value),
        end: grid_placement(grid_row_end_type, grid_row_end_value),
    };

    style.grid_column = Line {
        start: grid_placement(grid_column_start_type, grid_column_start_value),
        end: grid_placement(grid_column_end_type, grid_column_end_value),
    };

    if let Some(text_align) = text_align_from_enum(text_align) {
        style.text_align = text_align;
    }

    if let Some(box_sizing) = box_sizing_from_enum(box_sizing) {
        style.box_sizing = box_sizing;
    }
}

#[inline(always)]
fn i16_to_bytes(value: i16) -> [u8; 2] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

#[inline(always)]
fn i16_from_bytes(value: [u8; 2]) -> i16 {
    if cfg!(target_endian = "little") {
        i16::from_le_bytes(value)
    } else {
        i16::from_be_bytes(value)
    }
}

#[inline(always)]
fn i32_to_bytes(value: i32) -> [u8; 4] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

#[inline(always)]
fn i32_from_bytes(value: [u8; 4]) -> i32 {
    if cfg!(target_endian = "little") {
        i32::from_le_bytes(value)
    } else {
        i32::from_be_bytes(value)
    }
}

#[inline(always)]
fn f32_to_bytes(value: f32) -> [u8; 4] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

#[inline(always)]
fn f32_from_bytes(value: [u8; 4]) -> f32 {
    if cfg!(target_endian = "little") {
        f32::from_le_bytes(value)
    } else {
        f32::from_be_bytes(value)
    }
}

#[inline(always)]
fn set_style_data(style: &mut [u8], position: StyleKeys, value: &[u8]) {
    let offset = position as usize;
    let range = offset..offset + value.len();
    style[range].copy_from_slice(value);
}

#[inline(always)]
fn set_style_data_i16(style: &mut [u8], position: StyleKeys, value: i16) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut i16;
        *ptr = value;
    }
}

#[inline(always)]
fn set_style_data_i32(style: &mut [u8], position: StyleKeys, value: i32) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut i32;
        *ptr = value;
    }
}

#[inline(always)]
fn set_style_data_f32(style: &mut [u8], position: StyleKeys, value: f32) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut f32;
        *ptr = value;
    }
}

#[inline(always)]
fn get_style_data_i16(style: &[u8], position: StyleKeys) -> i16 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const i16;
        *ptr
    }
}

#[inline(always)]
fn get_style_data_i32(style: &[u8], position: StyleKeys) -> i32 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const i32;
        *ptr
    }
}

#[inline(always)]
fn get_style_data_f32(style: &[u8], position: StyleKeys) -> f32 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const f32;
        *ptr
    }
}

pub fn sync_style_buffer(style: &mut [u8], current: &Style) {
    set_style_data_i32(style, StyleKeys::DISPLAY, display_to_enum(current.display));

    set_style_data_i32(
        style,
        StyleKeys::POSITION,
        position_to_enum(current.position),
    );

    set_style_data_i32(
        style,
        StyleKeys::FLEX_DIRECTION,
        flex_direction_to_enum(current.flex_direction),
    );

    set_style_data_i32(
        style,
        StyleKeys::FLEX_WRAP,
        flex_wrap_to_enum(current.flex_wrap),
    );

    set_style_data_f32(style, StyleKeys::SCROLLBAR_WIDTH, current.scrollbar_width);

    set_style_data_i32(
        style,
        StyleKeys::OVERFLOW_X,
        overflow_to_enum(current.overflow.x),
    );
    set_style_data_i32(
        style,
        StyleKeys::OVERFLOW_Y,
        overflow_to_enum(current.overflow.y),
    );
    set_style_data_i32(
        style,
        StyleKeys::ALIGN_ITEMS,
        match current.align_items {
            None => -1,
            Some(align_items) => align_items_to_enum(align_items),
        },
    );

    set_style_data_i32(
        style,
        StyleKeys::ALIGN_SELF,
        match current.align_self {
            None => -1,
            Some(align_self) => align_self_to_enum(align_self),
        },
    );

    set_style_data_i32(
        style,
        StyleKeys::ALIGN_CONTENT,
        match current.align_content {
            None => -1,
            Some(align_content) => align_content_to_enum(align_content),
        },
    );

    set_style_data_i32(
        style,
        StyleKeys::JUSTIFY_ITEMS,
        match current.justify_items {
            None => -1,
            Some(justify_items) => align_items_to_enum(justify_items),
        },
    );

    set_style_data_i32(
        style,
        StyleKeys::JUSTIFY_SELF,
        match current.justify_self {
            None => -1,
            Some(justify_self) => align_self_to_enum(justify_self),
        },
    );

    set_style_data_i32(
        style,
        StyleKeys::JUSTIFY_CONTENT,
        match current.justify_content {
            None => -1,
            Some(justify_content) => justify_content_to_enum(justify_content),
        },
    );

    let left = length_percentage_auto_to_type_value(current.inset.left);
    let right = length_percentage_auto_to_type_value(current.inset.right);
    let top = length_percentage_auto_to_type_value(current.inset.top);
    let bottom = length_percentage_auto_to_type_value(current.inset.bottom);

    set_style_data_i32(style, StyleKeys::INSET_LEFT_TYPE, left.0);
    set_style_data_f32(style, StyleKeys::INSET_LEFT_VALUE, left.1);

    set_style_data_i32(style, StyleKeys::INSET_RIGHT_TYPE, right.0);
    set_style_data_f32(style, StyleKeys::INSET_RIGHT_VALUE, right.1);

    set_style_data_i32(style, StyleKeys::INSET_TOP_TYPE, top.0);
    set_style_data_f32(style, StyleKeys::INSET_TOP_VALUE, top.1);

    set_style_data_i32(style, StyleKeys::INSET_BOTTOM_TYPE, bottom.0);
    set_style_data_f32(style, StyleKeys::INSET_BOTTOM_VALUE, bottom.1);

    let margin_left = length_percentage_auto_to_type_value(current.margin.left);
    let margin_right = length_percentage_auto_to_type_value(current.margin.right);
    let margin_top = length_percentage_auto_to_type_value(current.margin.top);
    let margin_bottom = length_percentage_auto_to_type_value(current.margin.bottom);

    set_style_data_i32(style, StyleKeys::MARGIN_LEFT_TYPE, margin_left.0);
    set_style_data_f32(style, StyleKeys::MARGIN_LEFT_VALUE, margin_left.1);

    set_style_data_i32(style, StyleKeys::MARGIN_RIGHT_TYPE, margin_right.0);
    set_style_data_f32(style, StyleKeys::MARGIN_RIGHT_VALUE, margin_right.1);

    set_style_data_i32(style, StyleKeys::MARGIN_TOP_TYPE, margin_top.0);
    set_style_data_f32(style, StyleKeys::MARGIN_TOP_VALUE, margin_top.1);

    set_style_data_i32(style, StyleKeys::MARGIN_BOTTOM_TYPE, margin_bottom.0);
    set_style_data_f32(style, StyleKeys::MARGIN_BOTTOM_VALUE, margin_bottom.1);

    let border_left = length_percentage_to_type_value(current.border.left);
    let border_right = length_percentage_to_type_value(current.border.right);
    let border_top = length_percentage_to_type_value(current.border.top);
    let border_bottom = length_percentage_to_type_value(current.border.bottom);

    set_style_data_i32(style, StyleKeys::BORDER_LEFT_TYPE, border_left.0);
    set_style_data_f32(style, StyleKeys::BORDER_LEFT_VALUE, border_left.1);

    set_style_data_i32(style, StyleKeys::BORDER_RIGHT_TYPE, border_right.0);
    set_style_data_f32(style, StyleKeys::BORDER_RIGHT_VALUE, border_right.1);

    set_style_data_i32(style, StyleKeys::BORDER_TOP_TYPE, border_top.0);
    set_style_data_f32(style, StyleKeys::BORDER_TOP_VALUE, border_top.1);

    set_style_data_i32(style, StyleKeys::BORDER_BOTTOM_TYPE, border_bottom.0);
    set_style_data_f32(style, StyleKeys::BORDER_BOTTOM_VALUE, border_bottom.1);

    let padding_left = length_percentage_to_type_value(current.padding.left);
    let padding_right = length_percentage_to_type_value(current.padding.right);
    let padding_top = length_percentage_to_type_value(current.padding.top);
    let padding_bottom = length_percentage_to_type_value(current.padding.bottom);

    set_style_data_i32(style, StyleKeys::PADDING_LEFT_TYPE, padding_left.0);
    set_style_data_f32(style, StyleKeys::PADDING_LEFT_VALUE, padding_left.1);

    set_style_data_i32(style, StyleKeys::PADDING_RIGHT_TYPE, padding_right.0);
    set_style_data_f32(style, StyleKeys::PADDING_RIGHT_VALUE, padding_right.1);

    set_style_data_i32(style, StyleKeys::PADDING_TOP_TYPE, padding_top.0);
    set_style_data_f32(style, StyleKeys::PADDING_TOP_VALUE, padding_top.1);

    set_style_data_i32(style, StyleKeys::PADDING_BOTTOM_TYPE, padding_bottom.0);
    set_style_data_f32(style, StyleKeys::PADDING_BOTTOM_VALUE, padding_bottom.1);

    set_style_data_f32(style, StyleKeys::FLEX_GROW, current.flex_grow);

    set_style_data_f32(style, StyleKeys::FLEX_SHRINK, current.flex_shrink);

    let flex_basis = dimension_to_type_value(current.flex_basis);

    set_style_data_i32(style, StyleKeys::FLEX_BASIS_TYPE, flex_basis.0);
    set_style_data_f32(style, StyleKeys::FLEX_BASIS_VALUE, flex_basis.1);

    let min_width = dimension_to_type_value(current.min_size.width);

    set_style_data_i32(style, StyleKeys::MIN_WIDTH_TYPE, min_width.0);
    set_style_data_f32(style, StyleKeys::MIN_WIDTH_VALUE, min_width.1);

    let min_height = dimension_to_type_value(current.min_size.height);

    set_style_data_i32(style, StyleKeys::MIN_HEIGHT_TYPE, min_height.0);
    set_style_data_f32(style, StyleKeys::MIN_HEIGHT_VALUE, min_height.1);

    let width = dimension_to_type_value(current.size.width);

    set_style_data_i32(style, StyleKeys::WIDTH_TYPE, width.0);
    set_style_data_f32(style, StyleKeys::WIDTH_VALUE, width.1);

    let height = dimension_to_type_value(current.size.height);

    set_style_data_i32(style, StyleKeys::HEIGHT_TYPE, height.0);
    set_style_data_f32(style, StyleKeys::HEIGHT_VALUE, height.1);

    let max_width = dimension_to_type_value(current.max_size.width);

    set_style_data_i32(style, StyleKeys::MAX_WIDTH_TYPE, max_width.0);
    set_style_data_f32(style, StyleKeys::MAX_WIDTH_VALUE, max_width.1);

    let max_height = dimension_to_type_value(current.max_size.height);

    set_style_data_i32(style, StyleKeys::MAX_HEIGHT_TYPE, max_height.0);
    set_style_data_f32(style, StyleKeys::MAX_HEIGHT_VALUE, max_height.1);

    let gap_row = length_percentage_to_type_value(current.gap.width);

    set_style_data_i32(style, StyleKeys::GAP_ROW_TYPE, gap_row.0);
    set_style_data_f32(style, StyleKeys::GAP_ROW_VALUE, gap_row.1);

    let gap_column = length_percentage_to_type_value(current.gap.height);

    set_style_data_i32(style, StyleKeys::GAP_COLUMN_TYPE, gap_column.0);

    set_style_data_f32(style, StyleKeys::GAP_COLUMN_VALUE, gap_column.1);

    set_style_data_i32(
        style,
        StyleKeys::GRID_AUTO_FLOW,
        grid_auto_flow_to_enum(current.grid_auto_flow),
    );

    let grid_column_start = grid_placement_to_value(current.grid_column.start);
    set_style_data_i32(
        style,
        StyleKeys::GRID_COLUMN_START_TYPE,
        grid_column_start.0,
    );

    set_style_data_i16(
        style,
        StyleKeys::GRID_COLUMN_START_VALUE,
        grid_column_start.1,
    );

    let grid_column_end = grid_placement_to_value(current.grid_column.end);
    set_style_data_i32(style, StyleKeys::GRID_COLUMN_END_TYPE, grid_column_end.0);

    set_style_data_i16(style, StyleKeys::GRID_COLUMN_END_VALUE, grid_column_end.1);

    let grid_row_start = grid_placement_to_value(current.grid_row.start);
    set_style_data_i32(style, StyleKeys::GRID_ROW_START_TYPE, grid_row_start.0);

    set_style_data_i16(style, StyleKeys::GRID_ROW_START_VALUE, grid_row_start.1);

    let grid_row_end = grid_placement_to_value(current.grid_row.end);
    set_style_data_i32(style, StyleKeys::GRID_ROW_END_TYPE, grid_row_end.0);

    set_style_data_i16(style, StyleKeys::GRID_ROW_END_VALUE, grid_row_end.1);

    set_style_data_i32(
        style,
        StyleKeys::TEXT_ALIGN,
        text_align_to_enum(current.text_align),
    );
}

pub fn sync_node_style_with_buffer(style: &[u8], state: u64, current: &mut Style) {
    let keys = StateKeys::from_bits_truncate(state);
    if keys.contains(StateKeys::DISPLAY) {
        if let Some(display) = display_from_enum(get_style_data_i32(style, StyleKeys::DISPLAY)) {
            current.display = display;
        }
    }

    if keys.contains(StateKeys::POSITION) {
        if let Some(position) = position_from_enum(get_style_data_i32(style, StyleKeys::POSITION)) {
            current.position = position;
        }
    }

    if keys.contains(StateKeys::FLEX_DIRECTION) {
        if let Some(direction) =
            flex_direction_from_enum(get_style_data_i32(style, StyleKeys::FLEX_DIRECTION))
        {
            current.flex_direction = direction;
        }
    }

    if keys.contains(StateKeys::FLEX_WRAP) {
        if let Some(wrap) = flex_wrap_from_enum(get_style_data_i32(style, StyleKeys::FLEX_WRAP)) {
            current.flex_wrap = wrap;
        }
    }

    if keys.contains(StateKeys::SCROLLBAR_WIDTH) {
        current.scrollbar_width = get_style_data_f32(style, StyleKeys::SCROLLBAR_WIDTH);
    }

    if keys.contains(StateKeys::OVERFLOW_X) {
        if let Some(flow) = overflow_from_enum(get_style_data_i32(style, StyleKeys::OVERFLOW_X)) {
            current.overflow.x = flow;
        }
    }

    if keys.contains(StateKeys::OVERFLOW_Y) {
        if let Some(flow) = overflow_from_enum(get_style_data_i32(style, StyleKeys::OVERFLOW_Y)) {
            current.overflow.y = flow;
        }
    }

    if keys.contains(StateKeys::ALIGN_ITEMS) {
        current.align_items =
            align_items_from_enum(get_style_data_i32(style, StyleKeys::ALIGN_ITEMS));
    }

    if keys.contains(StateKeys::ALIGN_SELF) {
        current.align_self = align_self_from_enum(get_style_data_i32(style, StyleKeys::ALIGN_SELF));
    }

    if keys.contains(StateKeys::ALIGN_CONTENT) {
        current.align_content =
            align_content_from_enum(get_style_data_i32(style, StyleKeys::ALIGN_CONTENT));
    }

    if keys.contains(StateKeys::JUSTIFY_ITEMS) {
        current.justify_items =
            align_items_from_enum(get_style_data_i32(style, StyleKeys::JUSTIFY_ITEMS));
    }

    if keys.contains(StateKeys::JUSTIFY_SELF) {
        current.justify_self =
            align_self_from_enum(get_style_data_i32(style, StyleKeys::JUSTIFY_SELF));
    }

    if keys.contains(StateKeys::JUSTIFY_CONTENT) {
        current.justify_content =
            justify_content_from_enum(get_style_data_i32(style, StyleKeys::JUSTIFY_CONTENT));
    }

    if keys.contains(StateKeys::INSET) {
        current.inset = Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::INSET_LEFT_TYPE),
                get_style_data_f32(style, StyleKeys::INSET_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::INSET_RIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::INSET_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::INSET_TOP_TYPE),
                get_style_data_f32(style, StyleKeys::INSET_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::INSET_BOTTOM_TYPE),
                get_style_data_f32(style, StyleKeys::INSET_BOTTOM_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::MARGIN) {
        current.margin = Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::MARGIN_LEFT_TYPE),
                get_style_data_f32(style, StyleKeys::MARGIN_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::MARGIN_RIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::MARGIN_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::MARGIN_TOP_TYPE),
                get_style_data_f32(style, StyleKeys::MARGIN_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i32(style, StyleKeys::MARGIN_BOTTOM_TYPE),
                get_style_data_f32(style, StyleKeys::MARGIN_BOTTOM_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::BORDER) {
        current.border = Rect {
            left: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::BORDER_LEFT_TYPE),
                get_style_data_f32(style, StyleKeys::BORDER_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::BORDER_RIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::BORDER_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::BORDER_TOP_TYPE),
                get_style_data_f32(style, StyleKeys::BORDER_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::BORDER_BOTTOM_TYPE),
                get_style_data_f32(style, StyleKeys::BORDER_BOTTOM_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::PADDING) {
        current.padding = Rect {
            left: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::PADDING_LEFT_TYPE),
                get_style_data_f32(style, StyleKeys::PADDING_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::PADDING_RIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::PADDING_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::PADDING_TOP_TYPE),
                get_style_data_f32(style, StyleKeys::PADDING_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::PADDING_BOTTOM_TYPE),
                get_style_data_f32(style, StyleKeys::PADDING_BOTTOM_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::FLEX_GROW) {
        current.flex_grow = get_style_data_f32(style, StyleKeys::FLEX_GROW);
    }

    if keys.contains(StateKeys::FLEX_SHRINK) {
        current.flex_shrink = get_style_data_f32(style, StyleKeys::FLEX_SHRINK);
    }

    if keys.contains(StateKeys::FLEX_BASIS) {
        current.flex_basis = dimension_from_type_value(
            get_style_data_i32(style, StyleKeys::FLEX_BASIS_TYPE),
            get_style_data_f32(style, StyleKeys::FLEX_BASIS_VALUE),
        )
    }

    if keys.contains(StateKeys::MIN_SIZE) {
        current.min_size = Size {
            width: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::MIN_WIDTH_TYPE),
                get_style_data_f32(style, StyleKeys::MIN_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::MIN_HEIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::MIN_HEIGHT_VALUE),
            ),
        }
    }

    if keys.contains(StateKeys::SIZE) {
        current.size = Size {
            width: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::WIDTH_TYPE),
                get_style_data_f32(style, StyleKeys::WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::HEIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::HEIGHT_VALUE),
            ),
        }
    }

    if keys.contains(StateKeys::MAX_SIZE) {
        current.max_size = Size {
            width: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::MAX_WIDTH_TYPE),
                get_style_data_f32(style, StyleKeys::MAX_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(style, StyleKeys::MAX_HEIGHT_TYPE),
                get_style_data_f32(style, StyleKeys::MAX_HEIGHT_VALUE),
            ),
        }
    }

    if keys.contains(StateKeys::GAP) {
        current.gap = Size {
            width: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::GAP_ROW_TYPE),
                get_style_data_f32(style, StyleKeys::GAP_ROW_VALUE),
            ),
            height: length_percentage_from_type_value(
                get_style_data_i32(style, StyleKeys::GAP_COLUMN_TYPE),
                get_style_data_f32(style, StyleKeys::GAP_COLUMN_VALUE),
            ),
        }
    }

    if keys.contains(StateKeys::GRID_AUTO_FLOW) {
        if let Some(flow) =
            grid_auto_flow_from_enum(get_style_data_i32(style, StyleKeys::GRID_AUTO_FLOW))
        {
            current.grid_auto_flow = flow;
        }
    }

    if keys.contains(StateKeys::GRID_ROW) {
        current.grid_row = Line {
            start: grid_placement(
                get_style_data_i32(style, StyleKeys::GRID_ROW_START_TYPE),
                get_style_data_i16(style, StyleKeys::GRID_ROW_START_VALUE),
            ),
            end: grid_placement(
                get_style_data_i32(style, StyleKeys::GRID_ROW_END_TYPE),
                get_style_data_i16(style, StyleKeys::GRID_ROW_END_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::GRID_COLUMN) {
        current.grid_column = Line {
            start: grid_placement(
                get_style_data_i32(style, StyleKeys::GRID_COLUMN_START_TYPE),
                get_style_data_i16(style, StyleKeys::GRID_COLUMN_START_VALUE),
            ),
            end: grid_placement(
                get_style_data_i32(style, StyleKeys::GRID_COLUMN_END_TYPE),
                get_style_data_i16(style, StyleKeys::GRID_COLUMN_END_VALUE),
            ),
        };
    }

    if keys.contains(StateKeys::TEXT_ALIGN) {
        if let Some(align) = text_align_from_enum(get_style_data_i32(style, StyleKeys::TEXT_ALIGN))
        {
            current.text_align = align;
        }
    }
}
