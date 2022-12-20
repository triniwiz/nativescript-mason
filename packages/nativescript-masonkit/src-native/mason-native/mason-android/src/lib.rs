use std::ffi::c_void;

use jni::objects::JObject;
use jni::sys::{jint, jlong};
use jni::JNIEnv;

use ffi::AvailableSpace;
use ffi::CMasonDimension;
use ffi::CMasonDimensionType;
use ffi::CMasonRect;
use ffi::CMasonSize;
use mason_core::style::Style;
use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    justify_content_from_enum, justify_content_to_enum, position_type_from_enum,
    position_type_to_enum, Mason, Node, Size,
};
use mason_core::{Dimension, Rect};

use crate::ffi::AvailableSpaceType;

mod node;
pub mod style;

#[cxx::bridge]
pub(crate) mod ffi {

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum AvailableSpaceType {
        Definite,
        MinContent,
        MaxContent,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct AvailableSpace {
        pub(crate) value: f32,
        pub(crate) space_type: AvailableSpaceType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum CMasonDimensionType {
        Points,
        Percent,
        Auto,
        Undefined,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonDimension {
        pub value: f32,
        pub value_type: CMasonDimensionType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonRect {
        pub left: CMasonDimension,
        pub right: CMasonDimension,
        pub top: CMasonDimension,
        pub bottom: CMasonDimension,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonSize {
        pub width: CMasonDimension,
        pub height: CMasonDimension,
    }

    extern "Rust" {

        fn mason_style_set_display(style: i64, display: i32);

        fn mason_style_get_display(style: i64) -> i32;

        fn mason_style_set_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_width(style: i64) -> CMasonDimension;

        fn mason_style_set_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_height(style: i64) -> CMasonDimension;

        fn mason_node_compute(mason: i64, node: i64);

        fn mason_node_compute_min_content(mason: i64, node: i64);

        fn mason_node_compute_max_content(mason: i64, node: i64);

        fn mason_node_compute_wh(mason: i64, node: i64, width: f32, height: f32);

        fn mason_style_get_position_type(style: i64) -> i32;

        fn mason_style_set_position_type(style: i64, value: i32);

        fn mason_style_get_flex_wrap(style: i64) -> i32;

        fn mason_style_set_flex_wrap(style: i64, value: i32);

        fn mason_style_get_align_items(style: i64) -> i32;

        fn mason_style_set_align_items(style: i64, value: i32);

        fn mason_style_get_align_self(style: i64) -> i32;

        fn mason_style_set_align_self(style: i64, value: i32);

        fn mason_style_get_align_content(style: i64) -> i32;

        fn mason_style_set_align_content(style: i64, value: i32);

        fn mason_style_get_justify_content(style: i64) -> i32;

        fn mason_style_set_justify_content(style: i64, value: i32);

        fn mason_style_set_position(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_position_left(style: i64) -> CMasonDimension;

        fn mason_style_set_position_left(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_position_right(style: i64) -> CMasonDimension;

        fn mason_style_set_position_right(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_position_top(style: i64) -> CMasonDimension;

        fn mason_style_set_position_top(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_position_bottom(style: i64) -> CMasonDimension;

        fn mason_style_set_position_bottom(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_set_margin(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_margin_left(style: i64) -> CMasonDimension;

        fn mason_style_set_margin_left(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_margin_right(style: i64) -> CMasonDimension;

        fn mason_style_set_margin_right(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_margin_top(style: i64) -> CMasonDimension;

        fn mason_style_set_margin_top(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_margin_bottom(style: i64) -> CMasonDimension;

        fn mason_style_set_margin_bottom(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_set_border(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_border_left(style: i64) -> CMasonDimension;

        fn mason_style_set_border_left(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_border_right(style: i64) -> CMasonDimension;

        fn mason_style_set_border_right(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_border_top(style: i64) -> CMasonDimension;

        fn mason_style_set_border_top(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_border_bottom(style: i64) -> CMasonDimension;

        fn mason_style_set_border_bottom(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_set_flex_grow(style: i64, grow: f32);

        fn mason_style_get_flex_grow(style: i64) -> f32;

        fn mason_style_set_flex_shrink(style: i64, shrink: f32);

        fn mason_style_get_flex_shrink(style: i64) -> f32;

        fn mason_style_get_flex_basis(style: i64) -> CMasonDimension;

        fn mason_style_set_flex_basis(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_gap(style: i64) -> CMasonSize;

        fn mason_style_set_gap(
            style: i64,
            width_value: f32,
            width_type: CMasonDimensionType,
            height_value: f32,
            height_type: CMasonDimensionType,
        );

        fn mason_style_set_aspect_ratio(style: i64, ratio: f32);

        fn mason_style_get_aspect_ratio(style: i64) -> f32;

        fn mason_style_set_padding(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_padding_left(style: i64) -> CMasonDimension;

        fn mason_style_set_padding_left(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_padding_right(style: i64) -> CMasonDimension;

        fn mason_style_set_padding_right(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_padding_top(style: i64) -> CMasonDimension;

        fn mason_style_set_padding_top(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_padding_bottom(style: i64) -> CMasonDimension;

        fn mason_style_set_padding_bottom(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_flex_direction(style: i64) -> i32;

        fn mason_style_set_flex_direction(style: i64, value: i32);

        fn mason_style_get_min_width(style: i64) -> CMasonDimension;

        fn mason_style_set_min_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_min_height(style: i64) -> CMasonDimension;

        fn mason_style_set_min_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_max_width(style: i64) -> CMasonDimension;

        fn mason_style_set_max_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_max_height(style: i64) -> CMasonDimension;

        fn mason_style_set_max_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_node_update_and_set_style(mason: i64, node: i64, style: i64);

        #[allow(clippy::too_many_arguments)]
        fn mason_style_update_with_values(
            style: i64,
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
        );
    }
}

impl CMasonSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonDimensionType,
        height_value: f32,
        height_type: CMasonDimensionType,
    ) -> Self {
        Self {
            width: CMasonDimension::new(width_value, width_type),
            height: CMasonDimension::new(height_value, height_type),
        }
    }

    pub fn undefined() -> Self {
        Self {
            width: CMasonDimension::undefined(),
            height: CMasonDimension::undefined(),
        }
    }
    pub fn auto() -> Self {
        Self {
            width: CMasonDimension::auto(),
            height: CMasonDimension::auto(),
        }
    }
}

impl Into<mason_core::AvailableSpace> for AvailableSpace {
    fn into(self) -> mason_core::AvailableSpace {
        match self.space_type {
            AvailableSpaceType::Definite => mason_core::AvailableSpace::Definite(self.value),
            AvailableSpaceType::MinContent => mason_core::AvailableSpace::MinContent,
            AvailableSpaceType::MaxContent => mason_core::AvailableSpace::MaxContent,

            // making cpp happy
            _ => mason_core::AvailableSpace::MinContent,
        }
    }
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
            // making cpp happy
            _ => Dimension::Undefined,
        }
    }
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

impl From<Size<Dimension>> for CMasonSize {
    fn from(size: Size<Dimension>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

impl Into<Size<Dimension>> for CMasonSize {
    fn into(self) -> Size<Dimension> {
        Size::<Dimension>::new_with_dim(self.width.into(), self.height.into())
    }
}

pub fn mason_style_set_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_width(width.into());

        Box::leak(style);
    }
}

pub fn mason_style_get_width(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_size_width().into();

        Box::leak(style);

        width
    }
}

pub fn mason_style_set_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_height(height.into());

        Box::leak(style);
    }
}

pub fn mason_style_get_height(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_size_height().into();

        Box::leak(style);

        height
    }
}

pub fn mason_style_set_display(style: i64, display: i32) {
    if style == 0 {
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

pub fn mason_style_get_display(style: i64) -> i32 {
    if style == 0 {
        return 0;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let display = display_to_enum(style.display());

        Box::leak(style);

        display
    }
}

pub fn mason_node_compute(mason: i64, node: i64) {
    if mason == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        mason.compute(*node);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn mason_node_compute_min_content(mason: i64, node: i64) {
    if mason == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn mason_node_compute_max_content(mason: i64, node: i64) {
    if mason == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        let node = Box::from_raw(node as *mut Node);
        let size = Size::<AvailableSpace>::max_content();
        mason.compute_size(*node, size);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn mason_node_compute_wh(mason: i64, node: i64, width: f32, height: f32) {
    if mason == 0 || node == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut mason_core::Mason);
        let node = Box::from_raw(node as *mut mason_core::Node);
        mason.compute_wh(*node, width, height);
        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn mason_style_get_position_type(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let position = position_type_to_enum(style.position_type());

        Box::leak(style);

        position
    }
}

pub fn mason_style_set_position_type(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(position_type) = position_type_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_position_type(position_type);
            Box::leak(style);
        }
    }
}

pub fn mason_style_get_flex_wrap(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let wrap = flex_wrap_to_enum(style.flex_wrap());

        Box::leak(style);

        wrap
    }
}

pub fn mason_style_set_flex_wrap(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(flex_wrap) = flex_wrap_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_flex_wrap(flex_wrap);
            Box::leak(style);
        }
    }
}

fn mason_style_get_align_items(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = align_items_to_enum(style.align_items());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_align_items(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(enum_value) = align_items_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_align_items(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_get_align_self(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = align_self_to_enum(style.align_self());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_align_self(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(enum_value) = align_self_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_align_self(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_get_align_content(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = align_content_to_enum(style.align_content());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_align_content(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(enum_value) = align_content_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_align_content(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_get_justify_content(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = justify_content_to_enum(style.justify_content());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_justify_content(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(enum_value) = justify_content_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_justify_content(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_set_position(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    let position = CMasonDimension::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<Dimension>::from_dim(position.into());
    style.set_position(rect);
    Box::leak(style);
}

fn mason_style_get_position_left(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_position_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_position_left(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_position_right(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_position_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_position_right(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_position_top(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_position_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_position_top(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_position_bottom(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_position_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_position_bottom(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_position_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_margin(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    let margin = CMasonDimension::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<Dimension>::from_dim(margin.into());
    style.set_margin(rect);
    Box::leak(style);
}

fn mason_style_get_margin_left(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_left(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_right(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_right(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_top(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_top(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_bottom(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_bottom(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_border(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    let border = CMasonDimension::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<Dimension>::from_dim(border.into());
    style.set_border(rect);
    Box::leak(style);
}

fn mason_style_get_border_left(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_left(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_right(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_right(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_top(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_top(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_bottom(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_bottom(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_flex_grow(style: i64, grow: f32) {
    if style == 0 {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_grow(grow);

        Box::leak(style);
    }
}

fn mason_style_get_flex_grow(style: i64) -> f32 {
    if style == 0 {
        return f32::NAN;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_grow();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_shrink(style: i64, shrink: f32) {
    if style == 0 {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_shrink(shrink);

        Box::leak(style);
    }
}

fn mason_style_get_flex_shrink(style: i64) -> f32 {
    if style == 0 {
        return f32::NAN;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_shrink();

        Box::leak(style);

        ret
    }
}

fn mason_style_get_flex_basis(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_basis().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_basis(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_basis(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_gap(style: i64) -> CMasonSize {
    if style == 0 {
        return CMasonSize::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.gap().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_gap(
    style: i64,
    width_value: f32,
    width_type: CMasonDimensionType,
    height_value: f32,
    height_type: CMasonDimensionType,
) {
    if style == 0 {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        let size = CMasonSize::new(width_value, width_type, height_value, height_type);

        style.set_gap(size.into());

        Box::leak(style);
    }
}

fn mason_style_set_aspect_ratio(style: i64, ratio: f32) {
    if style == 0 {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_aspect_ratio(Some(ratio));

        Box::leak(style);
    }
}

fn mason_style_get_aspect_ratio(style: i64) -> f32 {
    if style == 0 {
        return f32::NAN;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.aspect_ratio().unwrap_or(f32::NAN);

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    let padding = CMasonDimension::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<Dimension>::from_dim(padding.into());
    style.set_padding(rect);
    Box::leak(style);
}

fn mason_style_get_padding_left(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_left(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_right(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_right(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_top(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_top(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_bottom(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_bottom(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_flex_direction(style: i64) -> i32 {
    if style == 0 {
        return -1;
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = flex_direction_to_enum(style.flex_direction());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_direction(style: i64, value: i32) {
    if style == 0 {
        return;
    }

    unsafe {
        if let Some(enum_value) = flex_direction_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_flex_direction(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_get_min_width(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_width().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_min_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_width(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_min_height(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_height().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_min_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_height(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_max_width(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_width().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_max_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_width(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_max_height(style: i64) -> CMasonDimension {
    if style == 0 {
        return CMasonDimension::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_height().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_max_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    if style == 0 {
        return;
    }

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_height(val.into());

        Box::leak(style);
    }
}

pub fn mason_node_update_and_set_style(mason: i64, node: i64, style: i64) {
    if mason == 0 || node == 0 || style == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);
        
        let style = Box::from_raw(style as *mut Style);

        mason.set_style(*node, *style);

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[allow(clippy::too_many_arguments)]
pub fn mason_style_update_with_values(
    style: i64,
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

#[no_mangle]
pub extern "system" fn JNI_OnLoad() -> jint {
    {
        android_logger::init_once(
            android_logger::Config::default().with_min_level(log::Level::Debug),
        );

        log::info!("Mason library loaded");
    }

    jni::sys::JNI_VERSION_1_6
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInit(
    _: JNIEnv,
    _: JObject,
) -> jlong {
    Mason::new().into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInitWithCapacity(
    _: JNIEnv,
    _: JObject,
    capacity: jint,
) -> jlong {
    Mason::with_capacity(capacity as usize).into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClear(
    _: JNIEnv,
    _: JObject,
    taffy: jlong,
) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        mason.clear();
        Box::leak(mason);
    }
}
