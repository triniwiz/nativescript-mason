use std::ffi::{c_float, c_int, c_void};

use mason_core::style::Style;
use mason_core::{align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum, align_self_from_enum, align_self_to_enum, display_from_enum, display_to_enum, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum, justify_content_from_enum, justify_content_to_enum, position_from_enum, position_to_enum, Dimension, Rect, Size, LengthPercentageAuto, LengthPercentage, GridPlacement};

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonMinMax {
    pub min_type: i32,
    pub min_value: f32,
    pub max_type: i32,
    pub max_value: f32,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum AvailableSpaceType {
    Definite,
    MinContent,
    MaxContent,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct AvailableSpace {
    pub(crate) value: f32,
    pub(crate) space_type: AvailableSpaceType,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonDimensionType {
    Points,
    Percent,
    Auto,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonDimension {
    pub value: f32,
    pub value_type: CMasonDimensionType,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonDimensionRect {
    pub left: CMasonDimension,
    pub right: CMasonDimension,
    pub top: CMasonDimension,
    pub bottom: CMasonDimension,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonDimensionSize {
    pub width: CMasonDimension,
    pub height: CMasonDimension,
}


#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonLengthPercentageAutoType {
    Points,
    Percent,
    Auto,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentageAuto {
    pub value: f32,
    pub value_type: CMasonLengthPercentageAutoType,
}


#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentageAutoRect {
    pub left: CMasonLengthPercentageAuto,
    pub right: CMasonLengthPercentageAuto,
    pub top: CMasonLengthPercentageAuto,
    pub bottom: CMasonLengthPercentageAuto,
}


#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentageAutoSize {
    pub width: CMasonLengthPercentageAuto,
    pub height: CMasonLengthPercentageAuto,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonLengthPercentageType {
    Points,
    Percent,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentage {
    pub value: f32,
    pub value_type: CMasonLengthPercentageType,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentageRect {
    pub left: CMasonLengthPercentage,
    pub right: CMasonLengthPercentage,
    pub top: CMasonLengthPercentage,
    pub bottom: CMasonLengthPercentage,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentageSize {
    pub width: CMasonLengthPercentage,
    pub height: CMasonLengthPercentage,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonGridPlacementType {
    Auto,
    Line,
    Span,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonGridPlacement {
    pub value: i16,
    pub value_type: CMasonGridPlacementType,
}



impl CMasonMinMax {
    pub fn new(min_type: i32, min_value: f32, max_type: i32, max_value: f32) -> Self {
        Self {
            min_type,
            min_value,
            max_type,
            max_value,
        }
    }
}

impl CMasonDimensionSize {
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

    pub fn auto() -> Self {
        Self {
            width: CMasonDimension::auto(),
            height: CMasonDimension::auto(),
        }
    }
}

#[allow(clippy::from_over_into)]
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
            CMasonDimensionType::Auto => Dimension::Auto,
            CMasonDimensionType::Points => Dimension::Points(dimension.value),
            CMasonDimensionType::Percent => Dimension::Percent(dimension.value),
            // making cpp happy
            _ => Dimension::Points(0.),
        }
    }
}

impl From<Rect<Dimension>> for CMasonDimensionRect {
    fn from(rect: Rect<Dimension>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<Dimension>> for CMasonDimensionSize {
    fn from(size: Size<Dimension>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

impl From<LengthPercentageAuto> for CMasonDimension {
    fn from(value: LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonDimension::auto(),
            LengthPercentageAuto::Points(points) => {
                CMasonDimension::new(points, CMasonDimensionType::Points)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::Percent)
            }
        }
    }
}


#[allow(clippy::from_over_into)]
impl Into<LengthPercentageAuto> for CMasonDimension {
    fn into(self) -> LengthPercentageAuto {
        match self.value_type {
            CMasonDimensionType::Auto => LengthPercentageAuto::Auto,
            CMasonDimensionType::Points=>  LengthPercentageAuto::Points(self.value),
            CMasonDimensionType::Percent => LengthPercentageAuto::Percent(self.value)
        }
    }
}



impl CMasonLengthPercentageAutoSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonLengthPercentageAutoType,
        height_value: f32,
        height_type: CMasonLengthPercentageAutoType,
    ) -> Self {
        Self {
            width: CMasonLengthPercentageAuto::new(width_value, width_type),
            height: CMasonLengthPercentageAuto::new(height_value, height_type),
        }
    }

    pub fn auto() -> Self {
        Self {
            width: CMasonLengthPercentageAuto::auto(),
            height: CMasonLengthPercentageAuto::auto(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<Dimension>> for CMasonDimensionSize {
    fn into(self) -> Size<Dimension> {
        Size::<Dimension>::new_with_dim(self.width.into(), self.height.into())
    }
}

impl CMasonLengthPercentageAuto {
    pub fn new(value: f32, value_type: CMasonLengthPercentageAutoType) -> Self {
        Self { value, value_type }
    }

    pub fn auto() -> Self {
        Self {
            value: 0.,
            value_type: CMasonLengthPercentageAutoType::Auto,
        }
    }
}

impl From<LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Points(points) => {
                CMasonLengthPercentageAuto::new(points, CMasonLengthPercentageAutoType::Points)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(percent, CMasonLengthPercentageAutoType::Percent)
            }
        }
    }
}

impl From<&LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: &LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Points(points) => {
                CMasonLengthPercentageAuto::new(*points, CMasonLengthPercentageAutoType::Points)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(*percent, CMasonLengthPercentageAutoType::Percent)
            }
        }
    }
}

impl From<CMasonLengthPercentageAuto> for LengthPercentageAuto {
    fn from(value: CMasonLengthPercentageAuto) -> Self {
        match value.value_type {
            CMasonLengthPercentageAutoType::Auto => LengthPercentageAuto::Auto,
            CMasonLengthPercentageAutoType::Points => LengthPercentageAuto::Points(value.value),
            CMasonLengthPercentageAutoType::Percent => LengthPercentageAuto::Percent(value.value),
            // making cpp happy
            _ => LengthPercentageAuto::Points(0.),
        }
    }
}

impl From<Rect<LengthPercentageAuto>> for CMasonLengthPercentageAutoRect {
    fn from(rect: Rect<LengthPercentageAuto>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn from(size: Size<LengthPercentageAuto>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn into(self) -> Size<LengthPercentageAuto> {
        Size::<LengthPercentageAuto>::new_with_len_auto(self.width.into(), self.height.into())
    }
}

impl CMasonLengthPercentageSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonLengthPercentageType,
        height_value: f32,
        height_type: CMasonLengthPercentageType,
    ) -> Self {
        Self {
            width: CMasonLengthPercentage::new(width_value, width_type),
            height: CMasonLengthPercentage::new(height_value, height_type),
        }
    }
}

impl CMasonLengthPercentage {
    pub fn new(value: f32, value_type: CMasonLengthPercentageType) -> Self {
        Self { value, value_type }
    }
}

impl From<LengthPercentage> for CMasonLengthPercentage {
    fn from(value: LengthPercentage) -> Self {
        match value {
            LengthPercentage::Points(points) => {
                CMasonLengthPercentage::new(points, CMasonLengthPercentageType::Points)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(percent, CMasonLengthPercentageType::Percent)
            }
        }
    }
}

impl From<&LengthPercentage> for CMasonLengthPercentage {
    fn from(value: &LengthPercentage) -> Self {
        match value {
            LengthPercentage::Points(points) => {
                CMasonLengthPercentage::new(*points, CMasonLengthPercentageType::Points)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(*percent, CMasonLengthPercentageType::Percent)
            }
        }
    }
}

impl From<CMasonLengthPercentage> for LengthPercentage {
    fn from(value: CMasonLengthPercentage) -> Self {
        match value.value_type {
            CMasonLengthPercentageType::Points => LengthPercentage::Points(value.value),
            CMasonLengthPercentageType::Percent => LengthPercentage::Percent(value.value),
            // making cpp happy
            _ => LengthPercentage::Points(0.),
        }
    }
}

impl From<Rect<LengthPercentage>> for CMasonLengthPercentageRect {
    fn from(rect: Rect<LengthPercentage>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn from(size: Size<LengthPercentage>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn into(self) -> Size<LengthPercentage> {
        Size::<LengthPercentage>::new_with_len(self.width.into(), self.height.into())
    }
}

impl From<GridPlacement> for CMasonGridPlacement {
    fn from(value: GridPlacement) -> Self {
        match value {
            GridPlacement::Auto => CMasonGridPlacement {
                value: 0,
                value_type: CMasonGridPlacementType::Auto,
            },
            GridPlacement::Line(value) => CMasonGridPlacement {
                value,
                value_type: CMasonGridPlacementType::Line,
            },
            GridPlacement::Span(value) => CMasonGridPlacement {
                value: value as i16,
                value_type: CMasonGridPlacementType::Span,
            },
        }
    }
}

impl Into<GridPlacement> for CMasonGridPlacement {
    fn into(self) -> GridPlacement {
        match self.value_type {
            CMasonGridPlacementType::Auto => GridPlacement::Auto,
            CMasonGridPlacementType::Line => GridPlacement::Line(self.value),
            CMasonGridPlacementType::Span => GridPlacement::Span(self.value.try_into().unwrap()),
            // making cxx happy
            _ => GridPlacement::Auto,
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
    mason_core::ffi::style_get_display(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_display(style: *mut c_void, display: c_int) {
    mason_core::ffi::style_set_display(style, display);
}

#[no_mangle]
pub extern "C" fn mason_style_set_position(style: *mut c_void, position: c_int) {
    mason_core::ffi::style_set_position(style, position);
}

#[no_mangle]
pub extern "C" fn mason_style_get_position(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_position(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_direction(_style: *mut c_void, _direction: c_int) {
    // todo
}

#[no_mangle]
pub extern "C" fn mason_style_get_direction(_style: *mut c_void) -> c_int {
    // todo
    0
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_direction(style: *mut c_void, direction: c_int) {
    mason_core::ffi::style_set_flex_direction(style, direction)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_direction(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_flex_direction(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_wrap(style: *mut c_void, wrap: c_int) {
    mason_core::ffi::style_set_flex_wrap(style, wrap)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_wrap(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_flex_wrap(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_overflow(_style: *mut c_void, _overflow: c_int) {
    // todo
}

#[no_mangle]
pub extern "C" fn mason_style_get_overflow(_style: *mut c_void) -> c_int {
    // todo
    0
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_items(style: *mut c_void, align: c_int) {
    mason_core::ffi::style_set_align_items(style, align)
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_items(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_align_items(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_self(style: *mut c_void, align: c_int) {
    mason_core::ffi::style_set_align_self(style, align)
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_self(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_align_self(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_content(style: *mut c_void, align: c_int) {
    mason_core::ffi::style_set_align_content(style, align)
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_content(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_align_content(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_items(style: *mut c_void, align: c_int) {
    mason_core::ffi::style_set_justify_items(style, align)
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_items(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_justify_items(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_self(style: *mut c_void, align: c_int) {
    mason_core::ffi::style_set_justify_self(style, align)
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_self(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_justify_self(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_content(style: *mut c_void, justify: c_int) {
    mason_core::ffi::style_set_justify_content(style, justify)
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_content(style: *mut c_void) -> c_int {
    mason_core::ffi::style_get_justify_content(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset(
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
) {
    let left: LengthPercentageAuto = CMasonDimension::new(left_value, left_value_type).into();
    let right: LengthPercentageAuto = CMasonDimension::new(right_value, right_value_type).into();
    let top: LengthPercentageAuto = CMasonDimension::new(top_value, top_value_type).into();
    let bottom: LengthPercentageAuto = CMasonDimension::new(bottom_value, bottom_value_type).into();


    mason_core::ffi::style_set_inset_lrtb(style, left, right, top, bottom);
}

#[no_mangle]
pub extern "C" fn mason_style_set_position_left(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonDimensionType,
    right_value: c_float,
    right_value_type: CMasonDimensionType,
    top_value: c_float,
    top_value_type: CMasonDimensionType,
    bottom_value: c_float,
    bottom_value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
pub extern "C" fn mason_style_get_gap(style: *mut c_void) -> CMasonSize {
    if style.is_null() {
        return CMasonSize::undefined();
    }

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.gap().into();

        Box::leak(style);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap(
    style: *mut c_void,
    width_value: f32,
    width_type: CMasonDimensionType,
    height_value: f32,
    height_type: CMasonDimensionType,
) {
    if style.is_null() {
        return;
    }

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        let size = CMasonSize::new(width_value, width_type, height_value, height_type);

        style.set_gap(size.into());

        Box::leak(style);
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap_width(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
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
pub extern "C" fn mason_style_set_aspect_ratio(style: *mut c_void, ratio: c_float) {
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
