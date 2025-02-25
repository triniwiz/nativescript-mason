use crate::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, box_sizing_from_enum, display_from_enum,
    display_to_enum, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, overflow_to_enum, position_from_enum,
    position_to_enum, text_align_from_enum, text_align_to_enum,
};
use std::slice::SliceIndex;
use taffy::geometry::Point;
use taffy::prelude::*;
use taffy::style::{
    Display, LengthPercentage, LengthPercentageAuto, MinTrackSizingFunction, TrackSizingFunction,
};
use taffy::GridContainerStyle;

pub use taffy::style::Style;

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

pub fn set_aspect_ratio(style: &mut taffy::Style, ratio: Option<f32>) {
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
enum StyleKeys {
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
    GRID_COLUMN_END_TYPE = 274,
    GRID_COLUMN_END_VALUE = 278,
    GRID_ROW_START_TYPE = 280,
    GRID_ROW_START_VALUE = 284,
    GRID_ROW_END_TYPE = 286,
    GRID_ROW_END_VALUE = 290,
    SCROLLBAR_WIDTH = 292,
    TEXT_ALIGN = 296,
    BOX_SIZING = 300,
    OVERFLOW = 304,
    ITEM_IS_TABLE = 308,
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
) -> taffy::Style {
    let mut style = taffy::Style::default();
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
    style: &mut taffy::Style,
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

fn i16_to_bytes(value: i16) -> [u8; 2] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

fn i32_to_bytes(value: i32) -> [u8; 4] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

fn f32_to_bytes(value: f32) -> [u8; 4] {
    if cfg!(target_endian = "little") {
        value.to_le_bytes()
    } else {
        value.to_be_bytes()
    }
}

#[inline(always)]
fn set_style_data(style: &mut [u8], position: StyleKeys, value: &[u8]) {
    let offset = position as usize;
    let range = offset..offset + value.len();
    println!("position {:?}", position);
    style[range].copy_from_slice(value);
}

#[allow(clippy::too_many_arguments)]
pub fn update_style_buffer(
    style: &mut [u8],
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
    if let Some(_) = display_from_enum(display) {
        set_style_data(style, StyleKeys::DISPLAY, &i32_to_bytes(display));
    }

    if let Some(_) = position_from_enum(position) {
        set_style_data(style, StyleKeys::POSITION, &i32_to_bytes(position));
    }

    if let Some(_) = flex_direction_from_enum(flex_direction) {
        set_style_data(
            style,
            StyleKeys::FLEX_DIRECTION,
            &i32_to_bytes(flex_direction),
        );
    }

    if let Some(_) = flex_wrap_from_enum(flex_wrap) {
        set_style_data(style, StyleKeys::FLEX_WRAP, &i32_to_bytes(flex_wrap));
    }

    set_style_data(
        style,
        StyleKeys::SCROLLBAR_WIDTH,
        &f32_to_bytes(scrollbar_width),
    );

    if let Some(_) = overflow_from_enum(overflow_x) {
        set_style_data(style, StyleKeys::OVERFLOW_X, &i32_to_bytes(overflow_x));
    }

    if let Some(_) = overflow_from_enum(overflow_y) {
        set_style_data(style, StyleKeys::OVERFLOW_Y, &i32_to_bytes(overflow_y));
    }

    if align_items == -1 {
        set_style_data(style, StyleKeys::ALIGN_ITEMS, &i32_to_bytes(-1));
    } else if let Some(_) = align_items_from_enum(align_items) {
        set_style_data(style, StyleKeys::ALIGN_ITEMS, &i32_to_bytes(align_items));
    }

    if align_self == -1 {
        set_style_data(style, StyleKeys::ALIGN_SELF, &i32_to_bytes(-1));
    } else if let Some(_) = align_self_from_enum(align_self) {
        set_style_data(style, StyleKeys::ALIGN_SELF, &i32_to_bytes(align_self));
    }

    if align_content == -1 {
        set_style_data(style, StyleKeys::ALIGN_CONTENT, &i32_to_bytes(-1));
    } else if let Some(_) = align_content_from_enum(align_content) {
        set_style_data(
            style,
            StyleKeys::ALIGN_CONTENT,
            &i32_to_bytes(align_content),
        );
    }

    if justify_items == -1 {
        set_style_data(style, StyleKeys::JUSTIFY_ITEMS, &i32_to_bytes(-1));
    } else if let Some(_) = align_items_from_enum(justify_items) {
        set_style_data(
            style,
            StyleKeys::JUSTIFY_ITEMS,
            &i32_to_bytes(justify_items),
        );
    }

    if justify_self == -1 {
        set_style_data(style, StyleKeys::JUSTIFY_SELF, &i32_to_bytes(-1));
    } else if let Some(_) = align_self_from_enum(justify_self) {
        set_style_data(style, StyleKeys::JUSTIFY_SELF, &i32_to_bytes(justify_self));
    }

    if justify_content == -1 {
        set_style_data(style, StyleKeys::JUSTIFY_CONTENT, &i32_to_bytes(-1));
    } else if let Some(_) = justify_content_from_enum(justify_content) {
        set_style_data(
            style,
            StyleKeys::JUSTIFY_CONTENT,
            &i32_to_bytes(justify_content),
        );
    }

    set_style_data(
        style,
        StyleKeys::INSET_LEFT_TYPE,
        &i32_to_bytes(inset_left_type),
    );
    set_style_data(
        style,
        StyleKeys::INSET_LEFT_VALUE,
        &f32_to_bytes(inset_left_value),
    );

    set_style_data(
        style,
        StyleKeys::INSET_RIGHT_TYPE,
        &i32_to_bytes(inset_right_type),
    );
    set_style_data(
        style,
        StyleKeys::INSET_RIGHT_VALUE,
        &f32_to_bytes(inset_right_value),
    );

    set_style_data(
        style,
        StyleKeys::INSET_TOP_TYPE,
        &i32_to_bytes(inset_top_type),
    );
    set_style_data(
        style,
        StyleKeys::INSET_TOP_VALUE,
        &f32_to_bytes(inset_top_value),
    );

    set_style_data(
        style,
        StyleKeys::INSET_BOTTOM_TYPE,
        &i32_to_bytes(inset_bottom_type),
    );
    set_style_data(
        style,
        StyleKeys::INSET_BOTTOM_VALUE,
        &f32_to_bytes(inset_bottom_value),
    );

    /*

    style.margin = taffy::geometry::Rect {
        left: dimension_with_auto(margin_left_type, margin_left_value),
        right: dimension_with_auto(margin_right_type, margin_right_value),
        top: dimension_with_auto(margin_top_type, margin_top_value),
        bottom: dimension_with_auto(margin_bottom_type, margin_bottom_value),
    };

    style.padding = taffy::geometry::Rect {
        left: dimension(padding_left_type, padding_left_value),
        right: dimension(padding_right_type, padding_right_value),
        top: dimension(padding_top_type, padding_top_value),
        bottom: dimension(padding_bottom_type, padding_bottom_value),
    };

    style.border = taffy::geometry::Rect {
        left: dimension(border_left_type, border_left_value),
        right: dimension(border_right_type, border_right_value),
        top: dimension(border_top_type, border_top_value),
        bottom: dimension(border_bottom_type, border_bottom_value),
    };

    style.gap = taffy::geometry::Size {
        width: dimension(gap_row_type, gap_row_value),
        height: dimension(gap_column_type, gap_column_value),
    };
    */

    set_style_data(style, StyleKeys::FLEX_GROW, &f32_to_bytes(flex_grow));
    set_style_data(style, StyleKeys::FLEX_SHRINK, &f32_to_bytes(flex_shrink));

    /*
    style.flex_basis = dimension_with_auto(flex_basis_type, flex_basis_value).into();

    style.size = taffy::geometry::Size {
        width: dimension_with_auto(width_type, width_value).into(),
        height: dimension_with_auto(height_type, height_value).into(),
    };

    style.min_size = taffy::geometry::Size {
        width: dimension_with_auto(min_width_type, min_width_value).into(),
        height: dimension_with_auto(min_height_type, min_height_value).into(),
    };

    style.max_size = taffy::geometry::Size {
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

    */
}

pub fn init_style_buffer(style: &mut [u8], current: &taffy::Style) {
    set_style_data(
        style,
        StyleKeys::DISPLAY,
        &i32_to_bytes(display_to_enum(current.display)),
    );

    set_style_data(
        style,
        StyleKeys::POSITION,
        &i32_to_bytes(position_to_enum(current.position)),
    );

    set_style_data(
        style,
        StyleKeys::FLEX_DIRECTION,
        &i32_to_bytes(flex_direction_to_enum(current.flex_direction)),
    );

    set_style_data(
        style,
        StyleKeys::FLEX_WRAP,
        &i32_to_bytes(flex_wrap_to_enum(current.flex_wrap)),
    );

    set_style_data(
        style,
        StyleKeys::SCROLLBAR_WIDTH,
        &f32_to_bytes(current.scrollbar_width),
    );

    set_style_data(
        style,
        StyleKeys::OVERFLOW_X,
        &i32_to_bytes(overflow_to_enum(current.overflow.x)),
    );
    set_style_data(
        style,
        StyleKeys::OVERFLOW_Y,
        &i32_to_bytes(overflow_to_enum(current.overflow.y)),
    );

    match current.align_items {
        None => {
            set_style_data(style, StyleKeys::ALIGN_ITEMS, &i32_to_bytes(-1));
        }
        Some(align_items) => {
            set_style_data(
                style,
                StyleKeys::ALIGN_ITEMS,
                &i32_to_bytes(align_items_to_enum(align_items)),
            );
        }
    }

    match current.align_self {
        None => {
            set_style_data(style, StyleKeys::ALIGN_SELF, &i32_to_bytes(-1));
        }
        Some(align_self) => {
            set_style_data(
                style,
                StyleKeys::ALIGN_SELF,
                &i32_to_bytes(align_self_to_enum(align_self)),
            );
        }
    }

    match current.align_content {
        None => {
            set_style_data(style, StyleKeys::ALIGN_CONTENT, &i32_to_bytes(-1));
        }
        Some(align_content) => {
            set_style_data(
                style,
                StyleKeys::ALIGN_CONTENT,
                &i32_to_bytes(align_content_to_enum(align_content)),
            );
        }
    }

    match current.justify_items {
        None => {
            set_style_data(style, StyleKeys::JUSTIFY_ITEMS, &i32_to_bytes(-1));
        }
        Some(justify_items) => {
            set_style_data(
                style,
                StyleKeys::JUSTIFY_ITEMS,
                &i32_to_bytes(align_items_to_enum(justify_items)),
            );
        }
    }

    match current.justify_self {
        None => {
            set_style_data(style, StyleKeys::JUSTIFY_SELF, &i32_to_bytes(-1));
        }
        Some(justify_self) => {
            set_style_data(
                style,
                StyleKeys::JUSTIFY_SELF,
                &i32_to_bytes(align_self_to_enum(justify_self)),
            );
        }
    }

    match current.justify_content {
        None => {
            set_style_data(style, StyleKeys::JUSTIFY_CONTENT, &i32_to_bytes(-1));
        }
        Some(justify_content) => {
            set_style_data(
                style,
                StyleKeys::JUSTIFY_CONTENT,
                &i32_to_bytes(justify_content_to_enum(justify_content)),
            );
        }
    }

    let left = length_percentage_auto_to_type_value(current.inset.left);
    let right = length_percentage_auto_to_type_value(current.inset.right);
    let top = length_percentage_auto_to_type_value(current.inset.top);
    let bottom = length_percentage_auto_to_type_value(current.inset.bottom);

    set_style_data(style, StyleKeys::INSET_LEFT_TYPE, &i32_to_bytes(left.0));
    set_style_data(style, StyleKeys::INSET_LEFT_VALUE, &f32_to_bytes(left.1));

    set_style_data(style, StyleKeys::INSET_RIGHT_TYPE, &i32_to_bytes(right.0));
    set_style_data(style, StyleKeys::INSET_RIGHT_VALUE, &f32_to_bytes(right.1));

    set_style_data(style, StyleKeys::INSET_TOP_TYPE, &i32_to_bytes(top.0));
    set_style_data(style, StyleKeys::INSET_TOP_VALUE, &f32_to_bytes(top.1));

    set_style_data(style, StyleKeys::INSET_BOTTOM_TYPE, &i32_to_bytes(bottom.0));
    set_style_data(
        style,
        StyleKeys::INSET_BOTTOM_VALUE,
        &f32_to_bytes(bottom.1),
    );

    let margin_left = length_percentage_auto_to_type_value(current.margin.left);
    let margin_right = length_percentage_auto_to_type_value(current.margin.right);
    let margin_top = length_percentage_auto_to_type_value(current.margin.top);
    let margin_bottom = length_percentage_auto_to_type_value(current.margin.bottom);

    set_style_data(
        style,
        StyleKeys::MARGIN_LEFT_TYPE,
        &i32_to_bytes(margin_left.0),
    );
    set_style_data(
        style,
        StyleKeys::MARGIN_LEFT_VALUE,
        &f32_to_bytes(margin_left.1),
    );

    set_style_data(
        style,
        StyleKeys::MARGIN_RIGHT_TYPE,
        &i32_to_bytes(margin_right.0),
    );
    set_style_data(
        style,
        StyleKeys::MARGIN_RIGHT_VALUE,
        &f32_to_bytes(margin_right.1),
    );

    set_style_data(
        style,
        StyleKeys::MARGIN_TOP_TYPE,
        &i32_to_bytes(margin_top.0),
    );
    set_style_data(
        style,
        StyleKeys::MARGIN_TOP_VALUE,
        &f32_to_bytes(margin_top.1),
    );

    set_style_data(
        style,
        StyleKeys::MARGIN_BOTTOM_TYPE,
        &i32_to_bytes(margin_bottom.0),
    );
    set_style_data(
        style,
        StyleKeys::MARGIN_BOTTOM_VALUE,
        &f32_to_bytes(margin_bottom.1),
    );

    let border_left = length_percentage_to_type_value(current.border.left);
    let border_right = length_percentage_to_type_value(current.border.right);
    let border_top = length_percentage_to_type_value(current.border.top);
    let border_bottom = length_percentage_to_type_value(current.border.bottom);

    set_style_data(
        style,
        StyleKeys::BORDER_LEFT_TYPE,
        &i32_to_bytes(border_left.0),
    );
    set_style_data(
        style,
        StyleKeys::BORDER_LEFT_VALUE,
        &f32_to_bytes(border_left.1),
    );

    set_style_data(
        style,
        StyleKeys::BORDER_RIGHT_TYPE,
        &i32_to_bytes(border_right.0),
    );
    set_style_data(
        style,
        StyleKeys::BORDER_RIGHT_VALUE,
        &f32_to_bytes(border_right.1),
    );

    set_style_data(
        style,
        StyleKeys::BORDER_TOP_TYPE,
        &i32_to_bytes(border_top.0),
    );
    set_style_data(
        style,
        StyleKeys::BORDER_TOP_VALUE,
        &f32_to_bytes(border_top.1),
    );

    set_style_data(
        style,
        StyleKeys::BORDER_BOTTOM_TYPE,
        &i32_to_bytes(border_bottom.0),
    );
    set_style_data(
        style,
        StyleKeys::BORDER_BOTTOM_VALUE,
        &f32_to_bytes(border_bottom.1),
    );

    set_style_data(
        style,
        StyleKeys::FLEX_GROW,
        &f32_to_bytes(current.flex_grow),
    );

    set_style_data(
        style,
        StyleKeys::FLEX_SHRINK,
        &f32_to_bytes(current.flex_shrink),
    );

    let flex_basis = dimension_to_type_value(current.flex_basis);

    set_style_data(
        style,
        StyleKeys::FLEX_BASIS_TYPE,
        &i32_to_bytes(flex_basis.0),
    );
    set_style_data(
        style,
        StyleKeys::FLEX_BASIS_VALUE,
        &f32_to_bytes(flex_basis.1),
    );

    let min_width = dimension_to_type_value(current.min_size.width);

    set_style_data(style, StyleKeys::MIN_WIDTH_TYPE, &i32_to_bytes(min_width.0));
    set_style_data(
        style,
        StyleKeys::MIN_WIDTH_VALUE,
        &f32_to_bytes(min_width.1),
    );

    let min_height = dimension_to_type_value(current.min_size.height);

    set_style_data(
        style,
        StyleKeys::MIN_HEIGHT_TYPE,
        &i32_to_bytes(min_height.0),
    );
    set_style_data(
        style,
        StyleKeys::MIN_HEIGHT_VALUE,
        &f32_to_bytes(min_height.1),
    );

    let width = dimension_to_type_value(current.size.width);

    set_style_data(style, StyleKeys::WIDTH_TYPE, &i32_to_bytes(width.0));
    set_style_data(style, StyleKeys::WIDTH_VALUE, &f32_to_bytes(width.1));

    let height = dimension_to_type_value(current.size.height);

    set_style_data(style, StyleKeys::HEIGHT_TYPE, &i32_to_bytes(height.0));
    set_style_data(style, StyleKeys::HEIGHT_VALUE, &f32_to_bytes(height.1));

    let max_width = dimension_to_type_value(current.max_size.width);

    set_style_data(style, StyleKeys::MAX_WIDTH_TYPE, &i32_to_bytes(max_width.0));
    set_style_data(
        style,
        StyleKeys::MAX_WIDTH_VALUE,
        &f32_to_bytes(max_width.1),
    );

    let max_height = dimension_to_type_value(current.max_size.height);

    set_style_data(
        style,
        StyleKeys::MAX_HEIGHT_TYPE,
        &i32_to_bytes(max_height.0),
    );
    set_style_data(
        style,
        StyleKeys::MAX_HEIGHT_VALUE,
        &f32_to_bytes(max_height.1),
    );

    let gap_row = length_percentage_to_type_value(current.gap.width);

    set_style_data(style, StyleKeys::GAP_ROW_TYPE, &i32_to_bytes(gap_row.0));
    set_style_data(style, StyleKeys::GAP_ROW_VALUE, &f32_to_bytes(gap_row.1));

    let gap_column = length_percentage_to_type_value(current.gap.height);

    set_style_data(
        style,
        StyleKeys::GAP_COLUMN_TYPE,
        &i32_to_bytes(gap_column.0),
    );
    set_style_data(
        style,
        StyleKeys::GAP_COLUMN_VALUE,
        &f32_to_bytes(gap_column.1),
    );

    set_style_data(
        style,
        StyleKeys::GAP_COLUMN_VALUE,
        &f32_to_bytes(gap_column.1),
    );

    set_style_data(
        style,
        StyleKeys::GRID_AUTO_FLOW,
        &i32_to_bytes(grid_auto_flow_to_enum(current.grid_auto_flow)),
    );

    let grid_column_start = grid_placement_to_value(current.grid_column.start);
    set_style_data(
        style,
        StyleKeys::GRID_COLUMN_START_TYPE,
        &i32_to_bytes(grid_column_start.0),
    );

    set_style_data(
        style,
        StyleKeys::GRID_COLUMN_START_VALUE,
        &i16_to_bytes(grid_column_start.1),
    );

    let grid_column_end = grid_placement_to_value(current.grid_column.end);
    set_style_data(
        style,
        StyleKeys::GRID_COLUMN_END_TYPE,
        &i32_to_bytes(grid_column_end.0),
    );

    set_style_data(
        style,
        StyleKeys::GRID_COLUMN_END_VALUE,
        &i16_to_bytes(grid_column_end.1),
    );

    let grid_row_start = grid_placement_to_value(current.grid_row.start);
    set_style_data(
        style,
        StyleKeys::GRID_ROW_START_TYPE,
        &i32_to_bytes(grid_row_start.0),
    );

    set_style_data(
        style,
        StyleKeys::GRID_ROW_START_VALUE,
        &i16_to_bytes(grid_row_start.1),
    );

    let grid_row_end = grid_placement_to_value(current.grid_row.end);
    set_style_data(
        style,
        StyleKeys::GRID_ROW_END_TYPE,
        &i32_to_bytes(grid_row_end.0),
    );

    set_style_data(
        style,
        StyleKeys::GRID_ROW_END_VALUE,
        &i16_to_bytes(grid_row_end.1),
    );

    set_style_data(
        style,
        StyleKeys::TEXT_ALIGN,
        &i32_to_bytes(text_align_to_enum(current.text_align)),
    );
}
