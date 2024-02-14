use std::borrow::Cow;

use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, overflow_from_enum, position_from_enum, position_to_enum,
    AvailableSpace, Dimension, GridPlacement, GridTrackRepetition, LengthPercentage,
    LengthPercentageAuto, Line, MaxTrackSizingFunction, MinTrackSizingFunction,
    NonRepeatedTrackSizingFunction, Overflow, Point, Rect, Size, TrackSizingFunction,
};

use crate::{CMason, CMasonNode, CMasonStyle};

pub fn style_set_align_items(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_align_items(None);
        } else if let Some(enum_value) = align_items_from_enum(value) {
            style.set_align_items(Some(enum_value));
        }
    }
}

pub fn style_get_align_items(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.align_items() {
            align_items_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_get_align_self(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.align_self() {
            align_self_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_set_align_self(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_align_self(None);
        } else if let Some(enum_value) = align_self_from_enum(value) {
            style.set_align_self(Some(enum_value));
        }
    }
}

pub fn style_get_align_content(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.align_content() {
            align_content_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_set_align_content(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_align_content(None);
        } else if let Some(enum_value) = align_content_from_enum(value) {
            style.set_align_content(Some(enum_value));
        }
    }
}

pub fn style_set_justify_items(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_justify_items(None);
        } else if let Some(enum_value) = align_items_from_enum(value) {
            style.set_justify_items(Some(enum_value));
        }
    }
}

pub fn style_get_justify_items(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.justify_items() {
            align_items_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_get_justify_self(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.justify_self() {
            align_self_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_set_justify_self(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_justify_self(None);
        } else if let Some(enum_value) = align_self_from_enum(value) {
            style.set_justify_self(Some(enum_value));
        }
    }
}

pub fn style_get_justify_content(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        if let Some(value) = style.justify_content() {
            justify_content_to_enum(value)
        } else {
            -1
        }
    }
}

pub fn style_set_justify_content(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        if value == -1 {
            style.set_justify_content(None);
        } else if let Some(enum_value) = justify_content_from_enum(value) {
            style.set_justify_content(Some(enum_value));
        }
    }
}

pub fn style_set_display(style: *mut CMasonStyle, display: i32) {
    unsafe {
        if let Some(display) = display_from_enum(display) {
            let style = &mut (*style).0;

            style.set_display(display);
        }
    }
}

pub fn style_get_display(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        display_to_enum(style.display())
    }
}

pub fn style_get_position(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        position_to_enum(style.position())
    }
}

pub fn style_set_position(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(position) = position_from_enum(value) {
            let style = &mut (*style).0;
            style.set_position(position);
        }
    }
}

pub fn style_set_flex_direction(style: *mut CMasonStyle, direction: i32) {
    unsafe {
        if let Some(value) = flex_direction_from_enum(direction) {
            let style = &mut (*style).0;
            style.set_flex_direction(value);
        }
    }
}

pub fn style_get_flex_direction(style: *mut CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        flex_direction_to_enum(style.flex_direction())
    }
}

pub fn style_get_flex_wrap(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;
        flex_wrap_to_enum(style.flex_wrap())
    }
}

pub fn style_set_flex_wrap(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(flex_wrap) = flex_wrap_from_enum(value) {
            let style = &mut (*style).0;

            style.set_flex_wrap(flex_wrap);
        }
    }
}

pub fn style_set_inset(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    let style = unsafe { &mut (*style).0};
    let rect = Rect::<LengthPercentageAuto>::from_len_auto(value);
    style.set_inset(rect);
}

pub fn style_set_inset_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    let style = unsafe { &mut (*style).0};
    style.set_inset_lrtb(left, right, top, bottom);
}

pub fn style_get_inset_left(style: *mut CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_inset_left();

        ret
    }
}

pub fn style_set_inset_left(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_inset_left(value);
    }
}

pub fn style_get_inset_right(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_inset_right();

        ret
    }
}

pub fn style_set_inset_right(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_inset_right(value);
    }
}

pub fn style_get_inset_top(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_inset_top();

        ret
    }
}

pub fn style_set_inset_top(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_inset_top(value);
    }
}

pub fn style_get_inset_bottom(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_inset_bottom();

        ret
    }
}

pub fn style_set_inset_bottom(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_inset_bottom(value);
    }
}

pub fn style_set_margin(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    let style = unsafe { &mut (*style).0 };
    let rect = Rect::<LengthPercentageAuto>::from_len_auto(value);
    style.set_margin(rect);
}

pub fn style_set_margin_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentageAuto,
    right: LengthPercentageAuto,
    top: LengthPercentageAuto,
    bottom: LengthPercentageAuto,
) {
    let style = unsafe { &mut (*style).0 };
    style.set_margin_lrtb(left, right, top, bottom);
}

pub fn style_get_margin_left(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        style.get_margin_left()
    }
}

pub fn style_set_margin_left(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_margin_left(value);
    }
}

pub fn style_get_margin_right(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        style.get_margin_right()
    }
}

pub fn style_set_margin_right(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_margin_right(value);
    }
}

pub fn style_get_margin_top(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        style.get_margin_top()
    }
}

pub fn style_set_margin_top(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_margin_top(value);
    }
}

pub fn style_get_margin_bottom(style: *const CMasonStyle) -> LengthPercentageAuto {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_margin_bottom();

        ret
    }
}

pub fn style_set_margin_bottom(style: *mut CMasonStyle, value: LengthPercentageAuto) {
    unsafe {
        let style = &mut (*style).0;

        style.set_margin_bottom(value);
    }
}

pub fn style_set_border(style: *mut CMasonStyle, value: LengthPercentage) {
    let style = unsafe { &mut (*style).0 };
    let rect = Rect::<LengthPercentage>::from_len(value);
    style.set_border(rect);
}

pub fn style_set_border_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    let style = unsafe { &mut (*style).0 };
    style.set_border_lrtb(left, right, top, bottom);
}

pub fn style_get_border_left(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_border_left();

        ret
    }
}

pub fn style_set_border_left(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_border_left(value);
    }
}

pub fn style_get_border_right(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_border_right();

        ret
    }
}

pub fn style_set_border_right(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_border_right(value);
    }
}

pub fn style_get_border_top(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_border_top();

        ret
    }
}

pub fn style_set_border_top(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_border_top(value);
    }
}

pub fn style_get_border_bottom(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_border_bottom();

        ret
    }
}

pub fn style_set_border_bottom(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_border_bottom(value);
    }
}

pub fn style_set_flex_grow(style: *mut CMasonStyle, grow: f32) {
    unsafe {
        let style = &mut (*style).0;

        style.set_flex_grow(grow);
    }
}

pub fn style_get_flex_grow(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style).0;

        let ret = style.flex_grow();

        ret
    }
}

pub fn style_set_flex_shrink(style: *mut CMasonStyle, shrink: f32) {
    unsafe {
        let style = &mut (*style).0;

        style.set_flex_shrink(shrink);
    }
}

pub fn style_get_flex_shrink(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style).0;

        let ret = style.flex_shrink();

        ret
    }
}

pub fn style_get_flex_basis(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        let ret = style.flex_basis();

        ret
    }
}

pub fn style_set_flex_basis(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_flex_basis(value);
    }
}

pub fn style_get_gap(style: *const CMasonStyle) -> Size<LengthPercentage> {
    unsafe {
        let style = &(*style).0;

        let ret = style.gap();

        ret
    }
}

pub fn style_set_gap(style: *mut CMasonStyle, width: LengthPercentage, height: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        let size = Size::<LengthPercentage>::new_with_len(width, height);

        style.set_gap(size);
    }
}

pub fn style_get_row_gap(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_row_gap();

        ret
    }
}

pub fn style_set_row_gap(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_row_gap(value);
    }
}

pub fn style_get_column_gap(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_column_gap();

        ret
    }
}

pub fn style_set_column_gap(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_column_gap(value);
    }
}

pub fn style_set_aspect_ratio(style: *mut CMasonStyle, ratio: f32) {
    unsafe {
        let style = &mut (*style).0;

        if ratio.is_nan() {
            style.set_aspect_ratio(None);
        } else {
            style.set_aspect_ratio(Some(ratio));
        }
    }
}

pub fn style_get_aspect_ratio(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style).0;

        let ret = style.aspect_ratio().unwrap_or(f32::NAN);

        ret
    }
}

pub fn style_set_padding(style: *mut CMasonStyle, value: LengthPercentage) {
    let style = unsafe { &mut (*style).0 };
    let rect = Rect::<LengthPercentage>::from_len(value);
    style.set_padding(rect);
}

pub fn style_set_padding_lrtb(
    style: *mut CMasonStyle,
    left: LengthPercentage,
    right: LengthPercentage,
    top: LengthPercentage,
    bottom: LengthPercentage,
) {
    let style = unsafe { &mut (*style).0 };
    style.set_padding_lrtb(left, right, top, bottom);
}

pub fn style_get_padding_left(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_padding_left();

        ret
    }
}

pub fn style_set_padding_left(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_padding_left(value);
    }
}

pub fn style_get_padding_right(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_padding_right();

        ret
    }
}

pub fn style_set_padding_right(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_padding_right(value);
    }
}

pub fn style_get_padding_top(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_padding_top();

        ret
    }
}

pub fn style_set_padding_top(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_padding_top(value);
    }
}

pub fn style_get_padding_bottom(style: *const CMasonStyle) -> LengthPercentage {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_padding_bottom();

        ret
    }
}

pub fn style_set_padding_bottom(style: *mut CMasonStyle, value: LengthPercentage) {
    unsafe {
        let style = &mut (*style).0;

        style.set_padding_bottom(value);
    }
}

pub fn style_get_min_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_min_size_width();

        ret
    }
}

pub fn style_set_min_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_min_size_width(value);
    }
}

pub fn style_get_min_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_min_size_height();

        ret
    }
}

pub fn style_set_min_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_min_size_height(value);
    }
}

pub fn style_get_max_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_max_size_width();

        ret
    }
}

pub fn style_set_max_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_max_size_width(value);
    }
}

pub fn style_get_max_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_max_size_height();

        ret
    }
}

pub fn style_set_max_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_max_size_height(value);
    }
}

pub fn style_get_grid_auto_rows(style: *const CMasonStyle) -> Vec<NonRepeatedTrackSizingFunction> {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_grid_auto_rows().to_vec();

        ret
    }
}

pub fn style_set_grid_auto_rows(
    style: *mut CMasonStyle,
    value: Vec<NonRepeatedTrackSizingFunction>,
) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_auto_rows(value);
    }
}

pub fn style_get_grid_auto_columns(
    style: *const CMasonStyle,
) -> Vec<NonRepeatedTrackSizingFunction> {
    unsafe {
        let style = &(*style).0;

        let ret = style.get_grid_auto_columns().to_vec();

        ret
    }
}

pub fn style_set_grid_auto_columns(
    style: *mut CMasonStyle,
    value: Vec<NonRepeatedTrackSizingFunction>,
) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_auto_columns(value);
    }
}

pub fn style_get_grid_auto_flow(style: *const CMasonStyle) -> i32 {
    unsafe {
        let style = &(*style).0;

        grid_auto_flow_to_enum(style.get_grid_auto_flow())
    }
}

pub fn style_set_grid_auto_flow(style: *mut CMasonStyle, value: i32) {
    unsafe {
        if let Some(value) = grid_auto_flow_from_enum(value) {
            let style = &mut (*style).0;

            style.set_grid_auto_flow(value);
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
        let style = &mut (*style).0;

        style.set_grid_row(Line {
            start: row_start,
            end: row_end,
        });

        style.set_grid_column(Line {
            start: column_start,
            end: column_end,
        });
    }
}

pub fn style_set_grid_column(style: *mut CMasonStyle, start: GridPlacement, end: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_column(Line { start, end });
    }
}

pub fn style_get_grid_column_start(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style).0;

        style.get_grid_column_start()
    }
}

pub fn style_set_grid_column_start(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_column_start(value);
    }
}

pub fn style_get_grid_column_end(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style).0;

        style.get_grid_column_end()
    }
}

pub fn style_set_grid_column_end(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_column_end(value);
    }
}

pub fn style_set_grid_row(style: *mut CMasonStyle, start: GridPlacement, end: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_row(Line { start, end });
    }
}

pub fn style_get_grid_row_start(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style).0;

        style.get_grid_row_start()
    }
}

pub fn style_set_grid_row_start(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_row_start(value);
    }
}

pub fn style_get_grid_row_end(style: *const CMasonStyle) -> GridPlacement {
    unsafe {
        let style = &(*style).0;

        style.get_grid_row_end()
    }
}

pub fn style_set_grid_row_end(style: *mut CMasonStyle, value: GridPlacement) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_row_end(value);
    }
}

pub fn style_get_grid_template_rows(style: *const CMasonStyle) -> Vec<TrackSizingFunction> {
    unsafe {
        let style = &(*style).0;

        style.get_grid_template_rows().to_vec()
    }
}

pub fn style_set_grid_template_rows(style: *mut CMasonStyle, value: Vec<TrackSizingFunction>) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_template_rows(value);
    }
}

pub fn style_get_grid_template_columns(style: *const CMasonStyle) -> Vec<TrackSizingFunction> {
    unsafe {
        let style = &(*style).0;

        style.get_grid_template_columns().to_vec()
    }
}

pub fn style_set_grid_template_columns(style: *mut CMasonStyle, value: Vec<TrackSizingFunction>) {
    unsafe {
        let style = &mut (*style).0;

        style.set_grid_template_columns(value);
    }
}

pub fn style_set_width(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_size_width(value);
    }
}

pub fn style_get_width(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        style.get_size_width()
    }
}

pub fn style_set_height(style: *mut CMasonStyle, value: Dimension) {
    unsafe {
        let style = &mut (*style).0;

        style.set_size_height(value);
    }
}

pub fn style_get_height(style: *const CMasonStyle) -> Dimension {
    unsafe {
        let style = &(*style).0;

        style.get_size_height()
    }
}

pub fn style_set_scrollbar_width(style: *mut CMasonStyle, value: f32) {
    unsafe {
        let style = &mut (*style).0;

        style.set_scrollbar_width(value);
    }
}

pub fn style_get_scrollbar_width(style: *const CMasonStyle) -> f32 {
    unsafe {
        let style = &(*style).0;

        style.get_scrollbar_width()
    }
}

pub fn style_set_overflow(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;
        style.set_overflow(Point::new(overflow_from_enum(value), overflow_from_enum(value)).into());
    }
}

pub fn style_get_overflow(style: *const CMasonStyle) -> Point<Overflow> {
    unsafe {
        let style = &(*style).0;

        Point::from_taffy(style.get_overflow())
    }
}

pub fn style_set_overflow_x(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;

        style.set_overflow_x(overflow_from_enum(value));
    }
}

pub fn style_get_overflow_x(style: *const CMasonStyle) -> Overflow {
    unsafe {
        let style = &(*style).0;

        let overflow = style.get_overflow_x();

        overflow
    }
}

pub fn style_set_overflow_y(style: *mut CMasonStyle, value: i32) {
    unsafe {
        let style = &mut (*style).0;

        style.set_overflow_y(overflow_from_enum(value));
    }
}

pub fn style_get_overflow_y(style: *const CMasonStyle) -> Overflow {
    unsafe {
        let style = &(*style).0;

        style.get_overflow_y()
    }
}

pub fn node_update_and_set_style(
    mason: *mut CMason,
    node: *const CMasonNode,
    style: *const CMasonStyle,
) {
    unsafe {
        let mason = &mut (*mason).0;

        let node = &(*node).0;

        let style = &(*style).0;

        mason.set_style(*node, style.clone());
    }
}

pub fn node_compute(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute(*node);
    }
}

pub fn node_compute_min_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(*node, size);
    }
}

pub fn node_compute_max_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
    }
}

pub fn node_compute_wh(mason: *mut CMason, node: *const CMasonNode, width: f32, height: f32) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute_wh(*node, width, height);
    }
}

pub fn node_mark_dirty(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;

        let node = &(*node).0;

        mason.mark_dirty(*node);
    }
}

pub fn node_dirty(mason: *const CMason, node: *const CMasonNode) -> bool {
    unsafe {
        let mason = &(*mason).0;

        let node = &(*node).0;

        mason.dirty(*node)
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
    match (value.min, value.max) {
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Auto) => AUTO.into(),
        (MinTrackSizingFunction::MinContent, MaxTrackSizingFunction::MinContent) => {
            MIN_CONTENT.into()
        }
        (MinTrackSizingFunction::MaxContent, MaxTrackSizingFunction::MaxContent) => {
            MAX_CONTENT.into()
        }
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::FitContent(value)) => match value {
            LengthPercentage::Length(value) => {
                format!("{}({:.0}{})", FIT_CONTENT, value, PX_UNIT).into()
            }
            LengthPercentage::Percent(value) => {
                format!("{}({:.3}{})", FIT_CONTENT, value, PERCENT_UNIT).into()
            }
        },
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Fraction(value)) => {
            (value.to_string() + FLEX_UNIT).into()
        }
        (min, max) => {
            format!(
                "{}({}, {})",
                MIN_MAX,
                Cow::from(match min {
                    MinTrackSizingFunction::Fixed(value) => {
                        return match value {
                            LengthPercentage::Length(value) => format!("{}{}", value, PX_UNIT),
                            LengthPercentage::Percent(value) => {
                                format!("{}{}", value, PERCENT_UNIT)
                            }
                        }
                        .into();
                    }
                    MinTrackSizingFunction::MinContent => MIN_CONTENT,
                    MinTrackSizingFunction::MaxContent => MAX_CONTENT,
                    MinTrackSizingFunction::Auto => AUTO,
                }),
                Cow::from(match max {
                    MaxTrackSizingFunction::Fixed(value) => {
                        return match value {
                            LengthPercentage::Length(value) => format!("{}{}", value, PX_UNIT),
                            LengthPercentage::Percent(value) => {
                                format!("{}{}", value, PERCENT_UNIT)
                            }
                        }
                        .into();
                    }
                    MaxTrackSizingFunction::MinContent => MIN_CONTENT,
                    MaxTrackSizingFunction::MaxContent => MAX_CONTENT,
                    MaxTrackSizingFunction::FitContent(_) => panic!(), // invalid should not hit here
                    MaxTrackSizingFunction::Auto => AUTO,
                    MaxTrackSizingFunction::Fraction(value) => {
                        return format!("{value}{}", FLEX_UNIT).into();
                    }
                })
            )
            .into()
        }
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
                    ret.push_str(AUTO_FILL);
                }
                GridTrackRepetition::AutoFit => {
                    ret.push_str(AUTO_FIT);
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
