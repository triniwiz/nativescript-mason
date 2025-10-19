use crate::utils::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, box_sizing_from_enum, display_from_enum,
    display_to_enum, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, overflow_to_enum, position_from_enum,
    position_to_enum, text_align_from_enum, text_align_to_enum,
};
use bitflags::bitflags;
use bitflags::Flags;
use taffy::geometry::Point;

use crate::style::{StateKeys, StyleKeys};
use crate::Style;
use taffy::style::{
    Display, LengthPercentage, LengthPercentageAuto, MinTrackSizingFunction, TrackSizingFunction,
};
use taffy::style_helpers::{
    FromLength, FromPercent, TaffyAuto, TaffyFitContent, TaffyMaxContent, TaffyMinContent,
};
use taffy::{
    AlignItems, CompactLength, CoreStyle, Dimension, GridContainerStyle, GridPlacement, Line,
    MaxTrackSizingFunction, NonRepeatedTrackSizingFunction, Rect, Size,
};

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
pub fn length_percentage_auto_to_format_type_value(value: LengthPercentageAuto) -> String {
    if value.is_auto() {
        return "auto".to_string();
    }
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => std::format!("{:?}", raw.value()),
        CompactLength::PERCENT_TAG => std::format!("{:?}%", raw.value()),
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
pub fn length_percentage_to_format_type_value(value: LengthPercentage) -> String {
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => std::format!("{:?}", raw.value()),
        CompactLength::PERCENT_TAG => std::format!("{:?}%", raw.value()),
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

#[inline(always)]
pub fn dimension_to_format_type_value(value: Dimension) -> String {
    if value.is_auto() {
        return "auto".to_string();
    }
    let raw = value.into_raw();
    match raw.tag() {
        CompactLength::LENGTH_TAG => std::format!("{:?}", raw.value()),
        CompactLength::PERCENT_TAG => std::format!("{:?}%", raw.value()),
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

pub(crate) fn grid_placement(t: i32, v: i16) -> GridPlacement {
    match t {
        0 => GridPlacement::Auto,
        1 => GridPlacement::Line(v.into()),
        2 => GridPlacement::Span(v.try_into().unwrap()),
        _ => panic!(),
    }
}

pub(crate) fn grid_placement_to_value(value: GridPlacement) -> (i32, i16) {
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
    style.set_inset(Rect {
        left,
        right,
        top,
        bottom,
    });
}

pub fn set_margin_lrtb(
    style: &mut Style,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    style.set_margin(Rect {
        left,
        right,
        top,
        bottom,
    });
}

pub fn set_padding_lrtb(
    style: &mut Style,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    style.set_padding(Rect {
        left,
        right,
        top,
        bottom,
    });
}

pub fn set_border_lrtb(
    style: &mut Style,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    style.set_border(Rect {
        left,
        right,
        top,
        bottom,
    });
}

pub fn set_aspect_ratio(style: &mut Style, ratio: Option<f32>) {
    style.set_aspect_ratio(ratio);
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
    style.set_display(Display::Block);
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
        style.set_display(display);
    }

    if let Some(position) = position_from_enum(position) {
        style.set_position(position);
    }

    if let Some(flex_direction) = flex_direction_from_enum(flex_direction) {
        style.set_flex_direction(flex_direction);
    }

    if let Some(flex_wrap) = flex_wrap_from_enum(flex_wrap) {
        style.set_flex_wrap(flex_wrap);
    }

    style.set_scrollbar_width(scrollbar_width);

    if let Some(overflow) = overflow_from_enum(_overflow) {
        style.set_overflow(Point {
            x: overflow,
            y: overflow,
        })
    }

    if let Some(overflow_x) = overflow_from_enum(overflow_x) {
        style.set_overflow_x(overflow_x);
    }

    if let Some(overflow_y) = overflow_from_enum(overflow_y) {
        style.set_overflow_y(overflow_y);
    }

    if align_items == -1 {
        style.set_align_items(None);
    } else if let Some(align_items) = align_items_from_enum(align_items) {
        style.set_align_items(Some(align_items));
    }

    if align_self == -1 {
        style.set_align_self(None);
    } else if let Some(align_self) = align_self_from_enum(align_self) {
        style.set_align_self(Some(align_self));
    }

    if align_content == -1 {
        style.set_align_content(None);
    } else if let Some(align_content) = align_content_from_enum(align_content) {
        style.set_align_content(Some(align_content));
    }

    if justify_items == -1 {
        style.set_justify_items(None);
    } else if let Some(justify_items) = align_items_from_enum(justify_items) {
        style.set_justify_items(Some(justify_items));
    }

    if justify_self == -1 {
        style.set_justify_self(None);
    } else if let Some(justify_self) = align_self_from_enum(justify_self) {
        style.set_justify_self(Some(justify_self));
    }

    if justify_content == -1 {
        style.set_justify_content(None);
    } else if let Some(justify_content) = justify_content_from_enum(justify_content) {
        style.set_justify_content(Some(justify_content));
    }

    style.set_inset(Rect {
        left: dimension_with_auto(inset_left_type, inset_left_value),
        top: dimension_with_auto(inset_top_type, inset_top_value),
        bottom: dimension_with_auto(inset_bottom_type, inset_bottom_value),
        right: dimension_with_auto(inset_right_type, inset_right_value),
    });

    style.set_margin(Rect {
        left: dimension_with_auto(margin_left_type, margin_left_value),
        right: dimension_with_auto(margin_right_type, margin_right_value),
        top: dimension_with_auto(margin_top_type, margin_top_value),
        bottom: dimension_with_auto(margin_bottom_type, margin_bottom_value),
    });

    style.set_padding(Rect {
        left: dimension(padding_left_type, padding_left_value),
        right: dimension(padding_right_type, padding_right_value),
        top: dimension(padding_top_type, padding_top_value),
        bottom: dimension(padding_bottom_type, padding_bottom_value),
    });

    style.set_border(Rect {
        left: dimension(border_left_type, border_left_value),
        right: dimension(border_right_type, border_right_value),
        top: dimension(border_top_type, border_top_value),
        bottom: dimension(border_bottom_type, border_bottom_value),
    });

    style.set_gap(Size {
        width: dimension(gap_row_type, gap_row_value),
        height: dimension(gap_column_type, gap_column_value),
    });
    style.set_flex_grow(flex_grow);
    style.set_flex_shrink(flex_shrink);

    style.set_flex_basis(dimension_with_auto(flex_basis_type, flex_basis_value).into());

    style.set_size(Size {
        width: dimension_with_auto(width_type, width_value).into(),
        height: dimension_with_auto(height_type, height_value).into(),
    });

    style.set_min_size(Size {
        width: dimension_with_auto(min_width_type, min_width_value).into(),
        height: dimension_with_auto(min_height_type, min_height_value).into(),
    });

    style.set_max_size(Size {
        width: dimension_with_auto(max_width_type, max_width_value).into(),
        height: dimension_with_auto(max_height_type, max_height_value).into(),
    });

    style.set_aspect_ratio(if f32::is_nan(aspect_ratio) {
        None
    } else {
        Some(aspect_ratio)
    });

    style.grid_template_rows = grid_template_rows;

    style.grid_template_columns = grid_template_columns;

    style.grid_auto_rows = grid_auto_rows;

    style.grid_auto_columns = grid_auto_columns;

    if let Some(grid_auto_flow) = grid_auto_flow_from_enum(grid_auto_flow) {
        style.set_grid_auto_flow(grid_auto_flow);
    }

    style.set_grid_row(Line {
        start: grid_placement(grid_row_start_type, grid_row_start_value),
        end: grid_placement(grid_row_end_type, grid_row_end_value),
    });

    style.set_grid_column(Line {
        start: grid_placement(grid_column_start_type, grid_column_start_value),
        end: grid_placement(grid_column_end_type, grid_column_end_value),
    });

    if let Some(text_align) = text_align_from_enum(text_align) {
        style.set_text_align(text_align);
    }

    if let Some(box_sizing) = box_sizing_from_enum(box_sizing) {
        style.set_box_sizing(box_sizing);
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
pub(crate) fn set_style_data_i16(style: &mut [u8], position: StyleKeys, value: i16) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut i16;
        *ptr = value;
    }
}

#[inline(always)]
pub(crate) fn set_style_data_i32(style: &mut [u8], position: StyleKeys, value: i32) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut i32;
        *ptr = value;
    }
}

#[inline(always)]
pub(crate) fn set_style_data_f32(style: &mut [u8], position: StyleKeys, value: f32) {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_mut_ptr().add(offset) as *mut f32;
        *ptr = value;
    }
}

#[inline(always)]
pub(crate) fn get_style_data_i16(style: &[u8], position: StyleKeys) -> i16 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const i16;
        *ptr
    }
}

#[inline(always)]
pub(crate) fn get_style_data_i32(style: &[u8], position: StyleKeys) -> i32 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const i32;
        *ptr
    }
}

#[inline(always)]
pub(crate) fn get_style_data_f32(style: &[u8], position: StyleKeys) -> f32 {
    let offset = position as usize;
    unsafe {
        let ptr = style.as_ptr().add(offset) as *const f32;
        *ptr
    }
}
