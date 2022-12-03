use std::ffi::{c_float, c_int, c_void};

use mason_core::style::Style;
use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    justify_content_from_enum, justify_content_to_enum, position_type_from_enum,
    position_type_to_enum, Dimension, Rect,
};

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonDimensionType {
    Points,
    Percent,
    Auto,
    Undefined,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonDimension {
    pub value: f32,
    pub value_type: CMasonDimensionType,
}

impl CMasonDimension {
    pub fn new(value: f32, value_type: CMasonDimensionType) -> Self {
        Self { value, value_type }
    }

    pub fn undefined() -> Self {
        Self {
            value: 0.,
            value_type: CMasonDimensionType::Undefined,
        }
    }
    pub fn auto() -> Self {
        Self {
            value: 0.,
            value_type: CMasonDimensionType::Auto,
        }
    }
}

impl From<Dimension> for CMasonDimension {
    fn from(dimension: Dimension) -> Self {
        match dimension {
            Dimension::Undefined => CMasonDimension::undefined(),
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Points(points) => CMasonDimension::new(points, CMasonDimensionType::Points),
            Dimension::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::Percent)
            }
        }
    }
}

impl From<&Dimension> for CMasonDimension {
    fn from(dimension: &Dimension) -> Self {
        match dimension {
            Dimension::Undefined => CMasonDimension::undefined(),
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Points(points) => CMasonDimension::new(*points, CMasonDimensionType::Points),
            Dimension::Percent(percent) => {
                CMasonDimension::new(*percent, CMasonDimensionType::Percent)
            }
        }
    }
}

impl From<CMasonDimension> for Dimension {
    fn from(dimension: CMasonDimension) -> Self {
        match dimension.value_type {
            CMasonDimensionType::Undefined => Dimension::Undefined,
            CMasonDimensionType::Auto => Dimension::Auto,
            CMasonDimensionType::Points => Dimension::Points(dimension.value),
            CMasonDimensionType::Percent => Dimension::Percent(dimension.value),
        }
    }
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonRect {
    pub left: CMasonDimension,
    pub right: CMasonDimension,
    pub top: CMasonDimension,
    pub bottom: CMasonDimension,
}

impl From<Rect<Dimension>> for CMasonRect {
    fn from(rect: Rect<Dimension>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_init() -> *mut c_void {
    Style::default().into_raw() as _
}

#[no_mangle]
pub extern "C" fn mason_style_destroy(style: *mut c_void) {
    if style.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(style as *mut Style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_display(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let display = display_to_enum(style.display());

        Box::leak(style);

        display
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_display(display: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(display) = display_from_enum(display) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_display(display);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_type(position_type: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(position_type) = position_type_from_enum(position_type) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_position_type(position_type);

            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_position_type(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = position_type_to_enum(style.position_type());

        Box::leak(style);

        position
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_direction(_direction: c_int, _style: *mut c_void) {
    // todo
}

#[no_mangle]
pub extern "C" fn mason_style_get_direction(_style: *mut c_void) -> c_int {
    // todo
    0
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_direction(direction: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = flex_direction_from_enum(direction) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_flex_direction(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_direction(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = flex_direction_to_enum(style.flex_direction());

        Box::leak(style);

        position
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_wrap(wrap: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = flex_wrap_from_enum(wrap) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_flex_wrap(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_wrap(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = flex_wrap_to_enum(style.flex_wrap());

        Box::leak(style);

        position
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_overflow(_overflow: c_int, _style: *mut c_void) {
    // todo
}

#[no_mangle]
pub extern "C" fn mason_style_get_overflow(_style: *mut c_void) -> c_int {
    // todo
    0
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_items(align: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = align_items_from_enum(align) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_align_items(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_items(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let align = align_items_to_enum(style.align_items());

        Box::leak(style);

        align
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_self(align: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = align_self_from_enum(align) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_align_self(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_self(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let align = align_self_to_enum(style.align_self());

        Box::leak(style);

        align
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_content(align: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = align_content_from_enum(align) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_align_content(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_content(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let align = align_content_to_enum(style.align_content());

        Box::leak(style);

        align
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_content(justify: c_int, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        if let Some(value) = justify_content_from_enum(justify) {
            let mut style = Box::from_raw(style as *mut Style);
            style.set_justify_content(value);
            Box::leak(style);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_content(style: *mut c_void) -> c_int {
    if style.is_null() {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let justify = justify_content_to_enum(style.justify_content());

        Box::leak(style);

        justify
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position(
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(left_value, left_value_type);
        let right = CMasonDimension::new(right_value, right_value_type);
        let top = CMasonDimension::new(top_value, top_value_type);
        let bottom = CMasonDimension::new(bottom_value, bottom_value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_lrtb(left.into(), right.into(), top.into(), bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_left(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_left(left.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_position_left(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.position().left().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_right(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let right = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_right(right.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_position_right(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.position().right().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_top(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let top = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_top(top.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_position_top(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let top = style.position().top().into();

        Box::leak(style);

        top
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_bottom(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let bottom = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_bottom(bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_position_bottom(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let bottom = style.position().bottom().into();

        Box::leak(style);

        bottom
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin(
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(left_value, left_value_type);
        let right = CMasonDimension::new(right_value, right_value_type);
        let top = CMasonDimension::new(top_value, top_value_type);
        let bottom = CMasonDimension::new(bottom_value, bottom_value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_lrtb(left.into(), right.into(), top.into(), bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_left(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_left(left.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_left(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.margin().left().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_right(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let right = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_right(right.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_right(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.margin().right().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_top(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let top = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_top(top.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_top(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let top = style.margin().top().into();

        Box::leak(style);

        top
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_bottom(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let bottom = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_bottom(bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_bottom(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let bottom = style.margin().bottom().into();

        Box::leak(style);

        bottom
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding(
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(left_value, left_value_type);
        let right = CMasonDimension::new(right_value, right_value_type);
        let top = CMasonDimension::new(top_value, top_value_type);
        let bottom = CMasonDimension::new(bottom_value, bottom_value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_lrtb(left.into(), right.into(), top.into(), bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_left(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_left(left.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_left(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.padding().left().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_right(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let right = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_right(right.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_right(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.padding().right().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_top(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let top = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_top(top.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_top(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let top = style.padding().top().into();

        Box::leak(style);

        top
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_bottom(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let bottom = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_bottom(bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_bottom(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let bottom = style.padding().bottom().into();

        Box::leak(style);

        bottom
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_border(
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(left_value, left_value_type);
        let right = CMasonDimension::new(right_value, right_value_type);
        let top = CMasonDimension::new(top_value, top_value_type);
        let bottom = CMasonDimension::new(bottom_value, bottom_value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_lrtb(left.into(), right.into(), top.into(), bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_left(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let left = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_left(left.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_left(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.border().left().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_right(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let right = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_right(right.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_right(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let left = style.border().right().into();

        Box::leak(style);

        left
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_top(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let top = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_top(top.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_top(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let top = style.border().top().into();

        Box::leak(style);

        top
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_bottom(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let bottom = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_bottom(bottom.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_bottom(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let bottom = style.border().bottom().into();

        Box::leak(style);

        bottom
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_grow(style: *mut c_void, grow: c_float) {
    if style.is_null() {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_grow(grow);

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_grow(style: *mut c_void) -> c_float {
    if style.is_null() {
        return 0.;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let grow = style.flex_grow();

        Box::leak(style);

        grow
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_shrink(style: *mut c_void, shrink: c_float) {
    if style.is_null() {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_shrink(shrink);

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_shrink(style: *mut c_void) -> c_float {
    if style.is_null() {
        return 0.;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let shrink = style.flex_shrink();

        Box::leak(style);

        shrink
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_basis(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let basis = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_basis(basis.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_basis(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let basis = style.flex_basis().into();

        Box::leak(style);

        basis
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_width(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_width(width.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_width(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_size_width().into();

        Box::leak(style);

        width
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_height(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_height(height.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_height(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_size_height().into();

        Box::leak(style);

        height
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_width(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_width(width.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_width(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_min_size_width().into();

        Box::leak(style);

        width
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_height(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_height(height.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_height(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_min_size_height().into();

        Box::leak(style);

        height
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_width(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_width(width.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_width(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_max_size_width().into();

        Box::leak(style);

        width
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_height(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_height(height.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_height(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_max_size_height().into();

        Box::leak(style);

        height
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap_width(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_gap_width(width.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_gap_width(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_gap_width().into();

        Box::leak(style);

        width
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap_height(
    value: c_float,
    value_type: CMasonDimensionType,
    style: *mut c_void,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_gap_height(height.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_gap_height(style: *mut c_void) -> CMasonDimension {
    if style.is_null() {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_gap_height().into();

        Box::leak(style);

        height
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_aspect_ratio(ratio: c_float, style: *mut c_void) {
    if style.is_null() {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        if ratio.is_nan() {
            style.set_aspect_ratio(None);
        } else {
            style.set_aspect_ratio(Some(ratio));
        }

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_aspect_ratio(style: *mut c_void) -> c_float {
    if style.is_null() {
        return f32::NAN;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ratio = style.aspect_ratio().unwrap_or(f32::NAN);

        Box::leak(style);

        ratio
    }
}

#[no_mangle]
pub extern "C" fn mason_style_init_with_values(
    display: c_int,
    position_type: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_content: c_int,
    position_left_type: c_int,
    position_left_value: c_float,
    position_right_type: c_int,
    position_right_value: c_float,
    position_top_type: c_int,
    position_top_value: c_float,
    position_bottom_type: c_int,
    position_bottom_value: c_float,
    margin_left_type: c_int,
    margin_left_value: c_float,
    margin_right_type: c_int,
    margin_right_value: c_float,
    margin_top_type: c_int,
    margin_top_value: c_float,
    margin_bottom_type: c_int,
    margin_bottom_value: c_float,
    padding_left_type: c_int,
    padding_left_value: c_float,
    padding_right_type: c_int,
    padding_right_value: c_float,
    padding_top_type: c_int,
    padding_top_value: c_float,
    padding_bottom_type: c_int,
    padding_bottom_value: c_float,
    border_left_type: c_int,
    border_left_value: c_float,
    border_right_type: c_int,
    border_right_value: c_float,
    border_top_type: c_int,
    border_top_value: c_float,
    border_bottom_type: c_int,
    border_bottom_value: c_float,
    flex_grow: c_float,
    flex_shrink: c_float,
    flex_basis_type: c_int,
    flex_basis_value: c_float,
    width_type: c_int,
    width_value: c_float,
    height_type: c_int,
    height_value: c_float,
    min_width_type: c_int,
    min_width_value: c_float,
    min_height_type: c_int,
    min_height_value: c_float,
    max_width_type: c_int,
    max_width_value: c_float,
    max_height_type: c_int,
    max_height_value: c_float,
    flex_gap_width_type: c_int,
    flex_gap_width_value: c_float,
    flex_gap_height_type: c_int,
    flex_gap_height_value: c_float,
    aspect_ratio: c_float,
) -> *mut c_void {
    Box::into_raw(Box::new(Style::from_ffi(
        display,
        position_type,
        direction,
        flex_direction,
        flex_wrap,
        overflow,
        align_items,
        align_self,
        align_content,
        justify_content,
        position_left_type,
        position_left_value,
        position_right_type,
        position_right_value,
        position_top_type,
        position_top_value,
        position_bottom_type,
        position_bottom_value,
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
        flex_gap_width_type,
        flex_gap_width_value,
        flex_gap_height_type,
        flex_gap_height_value,
        aspect_ratio,
    ))) as *mut c_void
}

#[no_mangle]
pub extern "C" fn mason_style_update_with_values(
    style: *mut c_void,
    display: c_int,
    position_type: c_int,
    direction: c_int,
    flex_direction: c_int,
    flex_wrap: c_int,
    overflow: c_int,
    align_items: c_int,
    align_self: c_int,
    align_content: c_int,
    justify_content: c_int,
    position_left_type: c_int,
    position_left_value: c_float,
    position_right_type: c_int,
    position_right_value: c_float,
    position_top_type: c_int,
    position_top_value: c_float,
    position_bottom_type: c_int,
    position_bottom_value: c_float,
    margin_left_type: c_int,
    margin_left_value: c_float,
    margin_right_type: c_int,
    margin_right_value: c_float,
    margin_top_type: c_int,
    margin_top_value: c_float,
    margin_bottom_type: c_int,
    margin_bottom_value: c_float,
    padding_left_type: c_int,
    padding_left_value: c_float,
    padding_right_type: c_int,
    padding_right_value: c_float,
    padding_top_type: c_int,
    padding_top_value: c_float,
    padding_bottom_type: c_int,
    padding_bottom_value: c_float,
    border_left_type: c_int,
    border_left_value: c_float,
    border_right_type: c_int,
    border_right_value: c_float,
    border_top_type: c_int,
    border_top_value: c_float,
    border_bottom_type: c_int,
    border_bottom_value: c_float,
    flex_grow: c_float,
    flex_shrink: c_float,
    flex_basis_type: c_int,
    flex_basis_value: c_float,
    width_type: c_int,
    width_value: c_float,
    height_type: c_int,
    height_value: c_float,
    min_width_type: c_int,
    min_width_value: c_float,
    min_height_type: c_int,
    min_height_value: c_float,
    max_width_type: c_int,
    max_width_value: c_float,
    max_height_type: c_int,
    max_height_value: c_float,
    flex_gap_width_type: c_int,
    flex_gap_width_value: c_float,
    flex_gap_height_type: c_int,
    flex_gap_height_value: c_float,
    aspect_ratio: c_float,
) {
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        Style::update_from_ffi(
            &mut style,
            display,
            position_type,
            direction,
            flex_direction,
            flex_wrap,
            overflow,
            align_items,
            align_self,
            align_content,
            justify_content,
            position_left_type,
            position_left_value,
            position_right_type,
            position_right_value,
            position_top_type,
            position_top_value,
            position_bottom_type,
            position_bottom_value,
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
            flex_gap_width_type,
            flex_gap_width_value,
            flex_gap_height_type,
            flex_gap_height_value,
            aspect_ratio,
        );
        Box::leak(style);
    }
}
