use std::ffi::{c_float, c_int, c_void};

use mason_core::style::{min_max_from_values, Style};
use mason_core::{
    Dimension, GridPlacement, GridTrackRepetition, LengthPercentage, LengthPercentageAuto,
    MaxTrackSizingFunction, MinTrackSizingFunction, NonRepeatedTrackSizingFunction, Overflow, Rect,
    Size, TrackSizingFunction,
};

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
    MasonDimensionAuto,
    MasonDimensionPoints,
    MasonDimensionPercent,
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
    MasonLengthPercentageAutoAuto,
    MasonLengthPercentageAutoPoints,
    MasonLengthPercentageAutoPercent,
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
    MasonLengthPercentagePoints,
    MasonLengthPercentagePercent,
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
    MasonGridPlacementTypeAuto,
    MasonGridPlacementTypeLine,
    MasonGridPlacementTypeSpan,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonGridPlacement {
    pub value: i16,
    pub value_type: CMasonGridPlacementType,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonNonRepeatedTrackSizingFunction(NonRepeatedTrackSizingFunction);

#[repr(C)]
#[derive(Debug)]
pub struct CMasonNonRepeatedTrackSizingFunctionArray {
    pub array: *mut CMasonMinMax,
    pub length: usize,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonOverflowType {
    Visible,
    Hidden,
    Scroll,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonOverflowPoint {
    x: CMasonOverflowType,
    y: CMasonOverflowType,
}

impl From<Vec<CMasonMinMax>> for CMasonNonRepeatedTrackSizingFunctionArray {
    fn from(value: Vec<CMasonMinMax>) -> Self {
        let mut box_slice = value.into_boxed_slice();
        let array = Self {
            array: box_slice.as_mut_ptr(),
            length: box_slice.len(),
        };
        let _ = Box::into_raw(box_slice);
        array
    }
}

impl Drop for CMasonNonRepeatedTrackSizingFunctionArray {
    fn drop(&mut self) {
        let _ = unsafe { Box::from_raw(std::slice::from_raw_parts_mut(self.array, self.length)) };
    }
}

#[no_mangle]
pub extern "C" fn mason_destroy_non_repeated_track_sizing_function_array(
    array: *mut CMasonNonRepeatedTrackSizingFunctionArray,
) {
    if array.is_null() {
        return;
    }
    let _ = unsafe { Box::from_raw(array) };
}

#[repr(C)]
#[derive(Debug)]
pub enum CMasonTrackSizingFunction {
    Single(CMasonMinMax),
    Repeat(i32, u16, *mut CMasonNonRepeatedTrackSizingFunctionArray),
}

impl Drop for CMasonTrackSizingFunction {
    fn drop(&mut self) {
        if let CMasonTrackSizingFunction::Repeat(_, _, array) = self {
            let _ = unsafe { Box::from_raw(array) };
        }
    }
}

impl From<TrackSizingFunction> for CMasonTrackSizingFunction {
    fn from(value: TrackSizingFunction) -> Self {
        match value {
            TrackSizingFunction::Single(value) => CMasonTrackSizingFunction::Single(value.into()),
            TrackSizingFunction::Repeat(repetition, tracks) => {
                let mut count = 0;
                let rep = match repetition {
                    GridTrackRepetition::AutoFill => 0,
                    GridTrackRepetition::AutoFit => 1,
                    GridTrackRepetition::Count(value) => {
                        count = value;
                        2
                    }
                };

                CMasonTrackSizingFunction::Repeat(
                    rep,
                    count,
                    Box::into_raw(Box::new(
                        tracks
                            .into_iter()
                            .map(|v| v.into())
                            .collect::<Vec<CMasonMinMax>>()
                            .into(),
                    )),
                )
            }
        }
    }
}

impl Into<TrackSizingFunction> for CMasonTrackSizingFunction {
    fn into(self) -> TrackSizingFunction {
        match &self {
            CMasonTrackSizingFunction::Single(value) => {
                TrackSizingFunction::Single(min_max_from_values(
                    value.min_type,
                    value.min_value,
                    value.max_type,
                    value.max_value,
                ))
            }
            CMasonTrackSizingFunction::Repeat(repetition, count, tracks) => {
                TrackSizingFunction::Repeat(
                    match repetition {
                        0 => GridTrackRepetition::AutoFill,
                        1 => GridTrackRepetition::AutoFit,
                        2 => GridTrackRepetition::Count(*count),
                        _ => panic!(),
                    },
                    {
                        let slice = unsafe {
                            std::slice::from_raw_parts_mut((*(*tracks)).array, (*(*tracks)).length)
                                .to_vec()
                        };
                        slice.into_iter().map(|v| v.into()).collect()
                    },
                )
            }
        }
    }
}

impl Into<TrackSizingFunction> for &CMasonTrackSizingFunction {
    fn into(self) -> TrackSizingFunction {
        match self {
            CMasonTrackSizingFunction::Single(value) => {
                TrackSizingFunction::Single(min_max_from_values(
                    value.min_type,
                    value.min_value,
                    value.max_type,
                    value.max_value,
                ))
            }
            CMasonTrackSizingFunction::Repeat(repetition, count, tracks) => {
                TrackSizingFunction::Repeat(
                    match repetition {
                        0 => GridTrackRepetition::AutoFill,
                        1 => GridTrackRepetition::AutoFit,
                        2 => GridTrackRepetition::Count(*count),
                        _ => panic!(),
                    },
                    {
                        let slice = unsafe {
                            std::slice::from_raw_parts_mut((*(*tracks)).array, (*(*tracks)).length)
                                .to_vec()
                        };
                        slice.into_iter().map(|v| v.into()).collect()
                    },
                )
            }
        }
    }
}

#[repr(C)]
#[derive(Debug)]
pub struct CMasonTrackSizingFunctionArray {
    pub array: *mut CMasonTrackSizingFunction,
    pub length: usize,
}

impl From<Vec<CMasonTrackSizingFunction>> for CMasonTrackSizingFunctionArray {
    fn from(value: Vec<CMasonTrackSizingFunction>) -> Self {
        let mut box_slice = value.into_boxed_slice();
        let array = Self {
            array: box_slice.as_mut_ptr(),
            length: box_slice.len(),
        };
        let _ = Box::into_raw(box_slice);
        array
    }
}

impl Drop for CMasonTrackSizingFunctionArray {
    fn drop(&mut self) {
        let _ = unsafe { Box::from_raw(std::slice::from_raw_parts_mut(self.array, self.length)) };
    }
}

#[no_mangle]
pub extern "C" fn mason_destroy_track_sizing_function_array(
    array: *mut CMasonTrackSizingFunctionArray,
) {
    if array.is_null() {
        return;
    }
    let _ = unsafe { Box::from_raw(array) };
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

impl From<NonRepeatedTrackSizingFunction> for CMasonMinMax {
    fn from(value: NonRepeatedTrackSizingFunction) -> Self {
        let min_type;
        let mut min_value: f32 = 0.;

        let max_type;
        let mut max_value: f32 = 0.;

        match value.min {
            MinTrackSizingFunction::Fixed(length) => match length {
                LengthPercentage::Length(points) => {
                    min_type = 3;
                    min_value = points;
                }
                LengthPercentage::Percent(percent) => {
                    min_type = 4;
                    min_value = percent;
                }
            },
            MinTrackSizingFunction::MinContent => min_type = 1,
            MinTrackSizingFunction::MaxContent => min_type = 2,
            MinTrackSizingFunction::Auto => min_type = 0,
        }

        match value.max {
            MaxTrackSizingFunction::Fixed(length) => match length {
                LengthPercentage::Length(points) => {
                    max_type = 3;
                    max_value = points;
                }
                LengthPercentage::Percent(percent) => {
                    max_type = 4;
                    max_value = percent;
                }
            },
            MaxTrackSizingFunction::MinContent => max_type = 1,
            MaxTrackSizingFunction::MaxContent => max_type = 2,
            MaxTrackSizingFunction::FitContent(fit) => match fit {
                LengthPercentage::Length(points) => {
                    max_type = 6;
                    max_value = points;
                }
                LengthPercentage::Percent(percent) => {
                    max_type = 7;
                    max_value = percent;
                }
            },
            MaxTrackSizingFunction::Auto => max_type = 0,
            MaxTrackSizingFunction::Fraction(flex) => {
                max_type = 5;
                max_value = flex;
            }
        }

        CMasonMinMax::new(min_type, min_value, max_type, max_value)
    }
}

#[allow(clippy::from_over_into)]
impl Into<NonRepeatedTrackSizingFunction> for CMasonMinMax {
    fn into(self) -> NonRepeatedTrackSizingFunction {
        min_max_from_values(self.min_type, self.min_value, self.max_type, self.max_value)
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
            value_type: CMasonDimensionType::MasonDimensionAuto,
        }
    }
}

impl From<Dimension> for CMasonDimension {
    fn from(dimension: Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Length(points) => {
                CMasonDimension::new(points, CMasonDimensionType::MasonDimensionPoints)
            }
            Dimension::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::MasonDimensionPercent)
            }
        }
    }
}

impl Into<Dimension> for CMasonDimension {
    fn into(self) -> Dimension {
        match self.value_type {
            CMasonDimensionType::MasonDimensionPoints => Dimension::Length(self.value),
            CMasonDimensionType::MasonDimensionPercent => Dimension::Percent(self.value),
            CMasonDimensionType::MasonDimensionAuto => Dimension::Auto,
        }
    }
}

impl From<&Dimension> for CMasonDimension {
    fn from(dimension: &Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Length(points) => {
                CMasonDimension::new(*points, CMasonDimensionType::MasonDimensionPoints)
            }
            Dimension::Percent(percent) => {
                CMasonDimension::new(*percent, CMasonDimensionType::MasonDimensionPercent)
            }
        }
    }
}

// impl From<CMasonDimension> for Dimension {
//     fn from(dimension: CMasonDimension) -> Self {
//         match dimension.value_type {
//             CMasonDimensionType::Auto => Dimension::Auto,
//             CMasonDimensionType::Length => Dimension::Length(dimension.value),
//             CMasonDimensionType::Percent => Dimension::Percent(dimension.value),
//             // making cpp happy
//             _ => Dimension::Length(0.),
//         }
//     }
// }

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
            LengthPercentageAuto::Length(points) => {
                CMasonDimension::new(points, CMasonDimensionType::MasonDimensionPoints)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::MasonDimensionPercent)
            }
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<LengthPercentageAuto> for CMasonDimension {
    fn into(self) -> LengthPercentageAuto {
        match self.value_type {
            CMasonDimensionType::MasonDimensionAuto => LengthPercentageAuto::Auto,
            CMasonDimensionType::MasonDimensionPoints => LengthPercentageAuto::Length(self.value),
            CMasonDimensionType::MasonDimensionPercent => LengthPercentageAuto::Percent(self.value),
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
            value_type: CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto,
        }
    }
}

impl From<LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Length(points) => CMasonLengthPercentageAuto::new(
                points,
                CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints,
            ),
            LengthPercentageAuto::Percent(percent) => CMasonLengthPercentageAuto::new(
                percent,
                CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent,
            ),
        }
    }
}

impl From<&LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: &LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Length(points) => CMasonLengthPercentageAuto::new(
                *points,
                CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints,
            ),
            LengthPercentageAuto::Percent(percent) => CMasonLengthPercentageAuto::new(
                *percent,
                CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent,
            ),
        }
    }
}

impl From<CMasonLengthPercentageAuto> for LengthPercentageAuto {
    fn from(value: CMasonLengthPercentageAuto) -> Self {
        match value.value_type {
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto => {
                LengthPercentageAuto::Auto
            }
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints => {
                LengthPercentageAuto::Length(value.value)
            }
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent => {
                LengthPercentageAuto::Percent(value.value)
            }
            // making cpp happy
            _ => LengthPercentageAuto::Length(0.),
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
            LengthPercentage::Length(points) => CMasonLengthPercentage::new(
                points,
                CMasonLengthPercentageType::MasonLengthPercentagePoints,
            ),
            LengthPercentage::Percent(percent) => CMasonLengthPercentage::new(
                percent,
                CMasonLengthPercentageType::MasonLengthPercentagePercent,
            ),
        }
    }
}

impl From<&LengthPercentage> for CMasonLengthPercentage {
    fn from(value: &LengthPercentage) -> Self {
        match value {
            LengthPercentage::Length(points) => CMasonLengthPercentage::new(
                *points,
                CMasonLengthPercentageType::MasonLengthPercentagePoints,
            ),
            LengthPercentage::Percent(percent) => CMasonLengthPercentage::new(
                *percent,
                CMasonLengthPercentageType::MasonLengthPercentagePercent,
            ),
        }
    }
}

impl From<CMasonLengthPercentage> for LengthPercentage {
    fn from(value: CMasonLengthPercentage) -> Self {
        match value.value_type {
            CMasonLengthPercentageType::MasonLengthPercentagePoints => {
                LengthPercentage::Length(value.value)
            }
            CMasonLengthPercentageType::MasonLengthPercentagePercent => {
                LengthPercentage::Percent(value.value)
            }
            // making cpp happy
            _ => LengthPercentage::Length(0.),
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
                value_type: CMasonGridPlacementType::MasonGridPlacementTypeAuto,
            },
            GridPlacement::Line(value) => CMasonGridPlacement {
                value: value.as_i16(),
                value_type: CMasonGridPlacementType::MasonGridPlacementTypeLine,
            },
            GridPlacement::Span(value) => CMasonGridPlacement {
                value: value as i16,
                value_type: CMasonGridPlacementType::MasonGridPlacementTypeSpan,
            },
        }
    }
}

impl Into<GridPlacement> for CMasonGridPlacement {
    fn into(self) -> GridPlacement {
        match self.value_type {
            CMasonGridPlacementType::MasonGridPlacementTypeAuto => GridPlacement::Auto,
            CMasonGridPlacementType::MasonGridPlacementTypeLine => {
                GridPlacement::Line(self.value.into())
            }
            CMasonGridPlacementType::MasonGridPlacementTypeSpan => {
                GridPlacement::Span(self.value.try_into().unwrap())
            }
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
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);

    mason_core::ffi::style_set_inset(style, val.into());
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_lrtb(
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonLengthPercentageAutoType,
    right_value: c_float,
    right_value_type: CMasonLengthPercentageAutoType,
    top_value: c_float,
    top_value_type: CMasonLengthPercentageAutoType,
    bottom_value: c_float,
    bottom_value_type: CMasonLengthPercentageAutoType,
) {
    let left: LengthPercentageAuto =
        CMasonLengthPercentageAuto::new(left_value, left_value_type).into();
    let right: LengthPercentageAuto =
        CMasonLengthPercentageAuto::new(right_value, right_value_type).into();
    let top: LengthPercentageAuto =
        CMasonLengthPercentageAuto::new(top_value, top_value_type).into();
    let bottom: LengthPercentageAuto =
        CMasonLengthPercentageAuto::new(bottom_value, bottom_value_type).into();

    mason_core::ffi::style_set_inset_lrtb(style, left, right, top, bottom);
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_left(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let left = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_left(style, left.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_left(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_left(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_right(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let right = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_right(style, right.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_right(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_right(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_top(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let right = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_top(style, right.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_top(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_top(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_bottom(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let right = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_bottom(style, right.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_bottom(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_bottom(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin(
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonLengthPercentageAutoType,
    right_value: c_float,
    right_value_type: CMasonLengthPercentageAutoType,
    top_value: c_float,
    top_value_type: CMasonLengthPercentageAutoType,
    bottom_value: c_float,
    bottom_value_type: CMasonLengthPercentageAutoType,
) {
    let left = CMasonLengthPercentageAuto::new(left_value, left_value_type);
    let right = CMasonLengthPercentageAuto::new(right_value, right_value_type);
    let top = CMasonLengthPercentageAuto::new(top_value, top_value_type);
    let bottom = CMasonLengthPercentageAuto::new(bottom_value, bottom_value_type);

    mason_core::ffi::style_set_margin_lrtb(
        style,
        left.into(),
        right.into(),
        top.into(),
        bottom.into(),
    )
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_left(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let left = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_left(style, left.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_left(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_left(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_right(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let right = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_right(style, right.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_right(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_right(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_top(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let top = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_top(style, top.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_top(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_top(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_bottom(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageAutoType,
) {
    let bottom = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_bottom(style, bottom.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_bottom(style: *mut c_void) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_bottom(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding(
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonLengthPercentageType,
    right_value: c_float,
    right_value_type: CMasonLengthPercentageType,
    top_value: c_float,
    top_value_type: CMasonLengthPercentageType,
    bottom_value: c_float,
    bottom_value_type: CMasonLengthPercentageType,
) {
    let left = CMasonLengthPercentage::new(left_value, left_value_type);
    let right = CMasonLengthPercentage::new(right_value, right_value_type);
    let top = CMasonLengthPercentage::new(top_value, top_value_type);
    let bottom = CMasonLengthPercentage::new(bottom_value, bottom_value_type);

    mason_core::ffi::style_set_padding_lrtb(
        style,
        left.into(),
        right.into(),
        top.into(),
        bottom.into(),
    );
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_left(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let left = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_left(style, left.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_left(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_left(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_right(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let right = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_right(style, right.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_right(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_right(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_top(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let top = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_top(style, top.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_top(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_top(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_bottom(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let bottom = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_bottom(style, bottom.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_bottom(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_bottom(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border(
    style: *mut c_void,
    left_value: c_float,
    left_value_type: CMasonLengthPercentageType,
    right_value: c_float,
    right_value_type: CMasonLengthPercentageType,
    top_value: c_float,
    top_value_type: CMasonLengthPercentageType,
    bottom_value: c_float,
    bottom_value_type: CMasonLengthPercentageType,
) {
    let left = CMasonLengthPercentage::new(left_value, left_value_type);
    let right = CMasonLengthPercentage::new(right_value, right_value_type);
    let top = CMasonLengthPercentage::new(top_value, top_value_type);
    let bottom = CMasonLengthPercentage::new(bottom_value, bottom_value_type);
    mason_core::ffi::style_set_border_lrtb(
        style,
        left.into(),
        right.into(),
        top.into(),
        bottom.into(),
    )
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_left(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let left = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_left(style, left.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_left(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_left(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_right(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let right = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_right(style, right.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_right(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_right(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_top(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let top = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_top(style, top.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_top(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_top(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_bottom(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let bottom = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_bottom(style, bottom.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_bottom(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_bottom(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_grow(style: *mut c_void, grow: c_float) {
    mason_core::ffi::style_set_flex_grow(style, grow)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_grow(style: *mut c_void) -> c_float {
    mason_core::ffi::style_get_flex_grow(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_shrink(style: *mut c_void, shrink: c_float) {
    mason_core::ffi::style_set_flex_shrink(style, shrink)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_shrink(style: *mut c_void) -> c_float {
    mason_core::ffi::style_get_flex_shrink(style)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_basis(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let basis: Dimension = CMasonDimension::new(value, value_type).into();
    mason_core::ffi::style_set_flex_basis(style, basis)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_basis(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_flex_basis(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_width(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let width = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_width(style, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_width(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_width(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_height(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let height = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_height(style, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_height(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_height(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_width(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let width = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_min_width(style, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_width(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_min_width(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_height(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let height = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_min_height(style, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_height(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_min_height(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_width(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let width = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_max_width(style, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_width(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_max_width(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_height(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonDimensionType,
) {
    let height = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_max_height(style, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_height(style: *mut c_void) -> CMasonDimension {
    mason_core::ffi::style_get_max_height(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_get_gap(style: *mut c_void) -> CMasonLengthPercentageSize {
    mason_core::ffi::style_get_gap(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap(
    style: *mut c_void,
    width_value: f32,
    width_type: CMasonLengthPercentageType,
    height_value: f32,
    height_type: CMasonLengthPercentageType,
) {
    let width = CMasonLengthPercentage::new(width_value, width_type);
    let height = CMasonLengthPercentage::new(height_value, height_type);
    mason_core::ffi::style_set_gap(style, width.into(), height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_row_gap(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let width = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_row_gap(style, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_row_gap(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_row_gap(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_column_gap(
    style: *mut c_void,
    value: c_float,
    value_type: CMasonLengthPercentageType,
) {
    let height = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_column_gap(style, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_column_gap(style: *mut c_void) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_column_gap(style).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_aspect_ratio(style: *mut c_void, ratio: c_float) {
    mason_core::ffi::style_set_aspect_ratio(style, ratio)
}

#[no_mangle]
pub extern "C" fn mason_style_get_aspect_ratio(style: *mut c_void) -> c_float {
    mason_core::ffi::style_get_aspect_ratio(style)
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_rows(
    style: *mut c_void,
) -> *mut CMasonNonRepeatedTrackSizingFunctionArray {
    let ret: Vec<CMasonMinMax> = mason_core::ffi::style_get_grid_auto_rows(style as _)
        .into_iter()
        .map(|v| v.into())
        .collect();

    Box::into_raw(Box::new(ret.into()))
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_rows(
    style: *mut c_void,
    value: *mut CMasonNonRepeatedTrackSizingFunctionArray,
) {
    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

    mason_core::ffi::style_set_grid_auto_rows(
        style as _,
        slice
            .iter()
            .map(|v| min_max_from_values((*v).min_type, v.min_value, v.max_type, v.max_value))
            .collect(),
    )
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_columns(
    style: *mut c_void,
) -> *mut CMasonNonRepeatedTrackSizingFunctionArray {
    let ret: Vec<CMasonMinMax> = mason_core::ffi::style_get_grid_auto_columns(style as _)
        .into_iter()
        .map(|v| v.into())
        .collect();

    Box::into_raw(Box::new(ret.into()))
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_columns(
    style: *mut c_void,
    value: *mut CMasonNonRepeatedTrackSizingFunctionArray,
) {
    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

    mason_core::ffi::style_set_grid_auto_columns(
        style as _,
        slice
            .iter()
            .map(|v| min_max_from_values((*v).min_type, v.min_value, v.max_type, v.max_value))
            .collect(),
    )
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_flow(style: *mut c_void) -> i32 {
    mason_core::ffi::style_get_grid_auto_flow(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_flow(style: *mut c_void, value: i32) {
    mason_core::ffi::style_set_grid_auto_flow(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_area(
    style: *mut c_void,
    row_start: CMasonGridPlacement,
    row_end: CMasonGridPlacement,
    column_start: CMasonGridPlacement,
    column_end: CMasonGridPlacement,
) {
    mason_core::ffi::style_set_grid_area(
        style as _,
        row_start.into(),
        row_end.into(),
        column_start.into(),
        column_end.into(),
    )
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_column_start(style: *mut c_void) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_column_start(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_column(
    style: *mut c_void,
    start: CMasonGridPlacement,
    end: CMasonGridPlacement,
) {
    mason_core::ffi::style_set_grid_column(style as _, start.into(), end.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_column_start(
    style: *mut c_void,
    value: CMasonGridPlacement,
) {
    mason_core::ffi::style_set_grid_column_start(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_column_end(style: *mut c_void) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_column_end(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_column_end(style: *mut c_void, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_column_end(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_row_start(style: *mut c_void) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_row_start(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row(
    style: *mut c_void,
    start: CMasonGridPlacement,
    end: CMasonGridPlacement,
) {
    mason_core::ffi::style_set_grid_row(style as _, start.into(), end.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row_start(style: *mut c_void, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_row_start(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_row_end(style: *mut c_void) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_row_end(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row_end(style: *mut c_void, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_row_end(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_template_rows(
    style: *mut c_void,
) -> *mut CMasonTrackSizingFunctionArray {
    Box::into_raw(Box::new(
        mason_core::ffi::style_get_grid_template_rows(style as _)
            .into_iter()
            .map(|v| v.into())
            .collect::<Vec<CMasonTrackSizingFunction>>()
            .into(),
    ))
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_template_rows(
    style: *mut c_void,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    unsafe {
        mason_core::ffi::style_set_grid_template_rows(
            style as _,
            to_vec_track_sizing_function(value),
        )
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_template_columns(
    style: *mut c_void,
) -> *mut CMasonTrackSizingFunctionArray {
    Box::into_raw(Box::new(
        mason_core::ffi::style_get_grid_template_columns(style as _)
            .into_iter()
            .map(|v| v.into())
            .collect::<Vec<CMasonTrackSizingFunction>>()
            .into(),
    ))
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_template_columns(
    style: *mut c_void,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    unsafe {
        mason_core::ffi::style_set_grid_template_columns(
            style as _,
            to_vec_track_sizing_function(value),
        )
    }
}

pub fn to_vec_non_repeated_track_sizing_function(
    value: *mut CMasonNonRepeatedTrackSizingFunctionArray,
) -> Vec<NonRepeatedTrackSizingFunction> {
    if value.is_null() {
        return vec![];
    }

    unsafe {
        if (*value).length == 0 {
            return vec![];
        }
    }

    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

    slice
        .iter()
        .map(|v| {
            let v = *v;
            min_max_from_values(v.min_type, v.min_value, v.max_type, v.max_value)
        })
        .collect()
}

pub unsafe fn to_vec_track_sizing_function(
    value: *mut CMasonTrackSizingFunctionArray,
) -> Vec<TrackSizingFunction> {
    if value.is_null() {
        return vec![];
    }
    unsafe {
        if (*value).length == 0 {
            return vec![];
        }
    }
    let value: &CMasonTrackSizingFunctionArray = unsafe { &*value };

    let slice: &mut [CMasonTrackSizingFunction] =
        unsafe { std::slice::from_raw_parts_mut(value.array, value.length) };

    slice
        .iter()
        .map(|v| match v {
            CMasonTrackSizingFunction::Single(value) => {
                let v = *value;
                TrackSizingFunction::Single(min_max_from_values(
                    v.min_type,
                    v.min_value,
                    v.max_type,
                    v.max_value,
                ))
            }
            CMasonTrackSizingFunction::Repeat(rep, count, tracks) => {
                let ret: Vec<NonRepeatedTrackSizingFunction> = if unsafe {
                    (*(*tracks)).length == 0
                } {
                    Vec::new()
                } else {
                    let slice = unsafe {
                        std::slice::from_raw_parts_mut((*(*tracks)).array, (*(*tracks)).length)
                    };

                    slice
                        .iter()
                        .map(|v| {
                            let v = *v;
                            min_max_from_values(v.min_type, v.min_value, v.max_type, v.max_value)
                        })
                        .collect()
                };

                TrackSizingFunction::Repeat(
                    match *rep {
                        0 => GridTrackRepetition::AutoFill,
                        1 => GridTrackRepetition::AutoFit,
                        2 => GridTrackRepetition::Count(*count),
                        _ => panic!(),
                    },
                    ret,
                )
            }
        })
        .collect::<Vec<TrackSizingFunction>>()
}

fn overflow_to_c_overflow(value: Overflow) -> CMasonOverflowType {
    match value {
        Overflow::Visible => CMasonOverflowType::Visible,
        Overflow::Hidden => CMasonOverflowType::Hidden,
        Overflow::Scroll => CMasonOverflowType::Scroll,
    }
}

pub extern "C" fn mason_style_set_scrollbar_width(style: i64, value: f32) {
    mason_core::ffi::style_set_scrollbar_width(style as _, value);
}

pub extern "C" fn mason_style_get_scrollbar_width(style: i64) -> f32 {
    mason_core::ffi::style_get_scrollbar_width(style as _)
}

pub extern "C" fn mason_style_set_overflow(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow(style as _, value);
}

pub extern "C" fn mason_style_get_overflow(style: i64) -> CMasonOverflowPoint {
    let out = mason_core::ffi::style_get_overflow(style as _);
    let val = CMasonOverflowPoint {
        x: overflow_to_c_overflow(out.x),
        y: overflow_to_c_overflow(out.y),
    };

    val
}

pub extern "C" fn mason_style_set_overflow_x(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow_x(style as _, value);
}

pub extern "C" fn mason_style_get_overflow_x(style: i64) -> CMasonOverflowType {
    overflow_to_c_overflow(mason_core::ffi::style_get_overflow_x(style as _))
}

pub extern "C" fn mason_style_set_overflow_y(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow_y(style as _, value);
}

pub extern "C" fn mason_style_get_overflow_y(style: i64) -> CMasonOverflowType {
    overflow_to_c_overflow(mason_core::ffi::style_get_overflow_y(style as _))
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
    justify_items: c_int,
    justify_self: c_int,
    justify_content: c_int,
    inset_left_type: c_int,
    inset_left_value: c_float,
    inset_right_type: c_int,
    inset_right_value: c_float,
    inset_top_type: c_int,
    inset_top_value: c_float,
    inset_bottom_type: c_int,
    inset_bottom_value: c_float,
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
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: *const CMasonTrackSizingFunctionArray,
    grid_template_columns: *const CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
) -> *mut c_void {
    let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
    let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
    let grid_template_rows = unsafe { to_vec_track_sizing_function(grid_template_rows as *mut _) };
    let grid_template_columns =
        unsafe { to_vec_track_sizing_function(grid_template_columns as *mut _) };

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
    justify_items: c_int,
    justify_self: c_int,
    justify_content: c_int,
    inset_left_type: c_int,
    inset_left_value: c_float,
    inset_right_type: c_int,
    inset_right_value: c_float,
    inset_top_type: c_int,
    inset_top_value: c_float,
    inset_bottom_type: c_int,
    inset_bottom_value: c_float,
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
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonNonRepeatedTrackSizingFunctionArray,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: *mut CMasonTrackSizingFunctionArray,
    grid_template_columns: *mut CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
) {
    let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
    let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
    let grid_template_rows = unsafe { to_vec_track_sizing_function(grid_template_rows) };
    let grid_template_columns = unsafe { to_vec_track_sizing_function(grid_template_columns) };

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
        );
        Box::leak(style);
    }
}
