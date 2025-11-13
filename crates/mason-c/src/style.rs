use std::ffi::{c_float, c_int, c_short};

use crate::{CMason, CMasonNode};
use mason_core::style::utils::min_max_from_values;
use mason_core::{
    CompactLength, Dimension, GridPlacement, LengthPercentage,
    LengthPercentageAuto, Overflow, Rect, Size, TrackSizingFunction,
};

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonMinMax {
    pub min_type: i32,
    pub min_value: f32,
    pub max_type: i32,
    pub max_value: f32,
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

impl From<TrackSizingFunction> for CMasonMinMax {
    fn from(value: TrackSizingFunction) -> Self {
        let min_type;
        let mut min_value: f32 = 0.;

        let max_type;
        let mut max_value: f32 = 0.;

        if value.min.is_auto() {
            min_type = 0;
        } else if value.min.is_min_content() {
            min_type = 1
        } else if value.min.is_max_content() {
            min_type = 2
        } else {
            let raw = value.min.into_raw();
            if raw.is_length_or_percentage() {
                if raw.uses_percentage() {
                    min_type = 4;
                } else {
                    min_type = 3;
                }
                min_value = raw.value();
            } else {
                unreachable!()
            }
        }

        if value.max.is_auto() {
            max_type = 0;
        } else if value.max.is_min_content() {
            max_type = 1
        } else if value.max.is_max_content() {
            max_type = 2
        } else {
            let raw = value.max.into_raw();
            match raw.tag() {
                CompactLength::LENGTH_TAG => {
                    max_type = 3;
                    max_value = raw.value();
                }
                CompactLength::PERCENT_TAG => {
                    max_type = 4;
                    max_value = raw.value();
                }
                CompactLength::FR_TAG => {
                    max_type = 5;
                    max_value = raw.value();
                }
                CompactLength::FIT_CONTENT_PX_TAG => {
                    max_type = 6;
                    max_value = raw.value();
                }
                CompactLength::FIT_CONTENT_PERCENT_TAG => {
                    max_type = 7;
                    max_value = raw.value();
                }
                _ => unreachable!(),
            }
        }

        CMasonMinMax::new(min_type, min_value, max_type, max_value)
    }
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
    pub value: f32,
    pub value_type: AvailableSpaceType,
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
    pub value_type: CMasonDimensionType,
    pub value: f32,
}

impl CMasonDimension {
    pub fn new(value: f32, value_type: CMasonDimensionType) -> Self {
        Self { value_type, value }
    }
}

impl Into<CMasonDimension> for Dimension {
    fn into(self) -> CMasonDimension {
        if self.is_auto() {
            CMasonDimension::auto()
        } else {
            let raw = self.into_raw();
            match raw.tag() {
                CompactLength::LENGTH_TAG => CMasonDimension::length(raw.value()),
                CompactLength::PERCENT_TAG => CMasonDimension::percent(raw.value()),
                _ => unreachable!(),
            }
        }
    }
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
    pub value_type: CMasonLengthPercentageAutoType,
    pub value: f32,
}

impl From<CMasonLengthPercentageAuto> for LengthPercentageAuto {
    fn from(value: CMasonLengthPercentageAuto) -> Self {
        match value.value_type {
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto => Self::auto(),
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints => {
                Self::length(value.value)
            }
            CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent => {
                Self::percent(value.value)
            }
        }
    }
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
    MasonLengthPercentageTypePoints,
    MasonLengthPercentageTypePercent,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonLengthPercentage {
    pub value_type: CMasonLengthPercentageType,
    pub value: f32,
}

impl From<CMasonLengthPercentage> for LengthPercentage {
    fn from(value: CMasonLengthPercentage) -> Self {
        match value.value_type {
            CMasonLengthPercentageType::MasonLengthPercentageTypePoints => {
                Self::length(value.value)
            }
            CMasonLengthPercentageType::MasonLengthPercentageTypePercent => {
                Self::percent(value.value)
            }
        }
    }
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
pub struct CMasonTrackSizingFunction(TrackSizingFunction);

#[repr(C)]
#[derive(Debug)]
pub struct CMasonTrackSizingFunctionArray {
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

impl From<Vec<CMasonMinMax>> for CMasonTrackSizingFunctionArray {
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

impl Drop for CMasonTrackSizingFunctionArray {
    fn drop(&mut self) {
        let _ = unsafe { Box::from_raw(std::slice::from_raw_parts_mut(self.array, self.length)) };
    }
}

#[no_mangle]
pub extern "C" fn mason_destroy_non_repeated_track_sizing_function_array(
    array: *mut CMasonTrackSizingFunctionArray,
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
    Repeat(i32, u16, *mut CMasonTrackSizingFunctionArray),
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

impl From<&CMasonTrackSizingFunction> for TrackSizingFunction {
    fn from(value: &CMasonTrackSizingFunction) -> Self {
        match value {
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

#[allow(clippy::from_over_into)]
impl Into<TrackSizingFunction> for CMasonMinMax {
    fn into(self) -> TrackSizingFunction {
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
        match self.value_type {
            AvailableSpaceType::Definite => mason_core::AvailableSpace::Definite(self.value),
            AvailableSpaceType::MinContent => mason_core::AvailableSpace::MinContent,
            AvailableSpaceType::MaxContent => mason_core::AvailableSpace::MaxContent,
        }
    }
}

impl CMasonDimension {
    pub fn length(value: f32) -> Self {
        Self {
            value_type: CMasonDimensionType::MasonDimensionPoints,
            value,
        }
    }
    pub fn percent(value: f32) -> Self {
        Self {
            value_type: CMasonDimensionType::MasonDimensionPercent,
            value,
        }
    }

    pub fn auto() -> Self {
        Self {
            value_type: CMasonDimensionType::MasonDimensionAuto,
            value: 0.0,
        }
    }
}

impl Into<Dimension> for CMasonDimension {
    fn into(self) -> Dimension {
        match self.value_type {
            CMasonDimensionType::MasonDimensionAuto => Dimension::auto(),
            CMasonDimensionType::MasonDimensionPoints => Dimension::length(self.value),
            CMasonDimensionType::MasonDimensionPercent => Dimension::percent(self.value),
        }
    }
}

impl From<&Dimension> for CMasonDimension {
    fn from(dimension: &Dimension) -> Self {
        if dimension.is_auto() {
            return Self::auto();
        }

        match dimension.into_raw().tag() {
            CompactLength::PERCENT_TAG => CMasonDimension::percent(dimension.value()),
            CompactLength::LENGTH_TAG => CMasonDimension::length(dimension.value()),
            _ => {
                unreachable!()
            }
        }
    }
}

impl From<Rect<Dimension>> for CMasonDimensionRect {
    fn from(rect: Rect<Dimension>) -> Self {
        Self {
            left: rect.left.into(),
            right: rect.right.into(),
            top: rect.top.into(),
            bottom: rect.bottom.into(),
        }
    }
}

impl From<Size<Dimension>> for CMasonDimensionSize {
    fn from(size: Size<Dimension>) -> Self {
        Self {
            width: size.width.into(),
            height: size.height.into(),
        }
    }
}

impl From<LengthPercentageAuto> for CMasonDimension {
    fn from(value: LengthPercentageAuto) -> Self {
        if value.is_auto() {
            return Self::auto();
        }
        let raw = value.into_raw();
        match raw.tag() {
            CompactLength::PERCENT_TAG => Self::percent(raw.value()),
            CompactLength::LENGTH_TAG => Self::length(raw.value()),
            CompactLength::AUTO_TAG => Self::auto(),
            _ => {
                unreachable!()
            }
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<LengthPercentageAuto> for CMasonDimension {
    fn into(self) -> LengthPercentageAuto {
        match self.value_type {
            CMasonDimensionType::MasonDimensionAuto => LengthPercentageAuto::auto(),
            CMasonDimensionType::MasonDimensionPoints => LengthPercentageAuto::length(self.value),
            CMasonDimensionType::MasonDimensionPercent => LengthPercentageAuto::percent(self.value),
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
        Size {
            width: self.width.into(),
            height: self.height.into(),
        }
    }
}

impl CMasonLengthPercentageAuto {
    pub fn new(value: f32, value_type: CMasonLengthPercentageAutoType) -> Self {
        Self { value, value_type }
    }

    pub fn length(value: f32) -> Self {
        Self {
            value_type: CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints,
            value,
        }
    }
    pub fn percent(value: f32) -> Self {
        Self {
            value_type: CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent,
            value,
        }
    }

    pub fn auto() -> Self {
        Self {
            value_type: CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto,
            value: 0.0,
        }
    }
}

impl From<LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: LengthPercentageAuto) -> Self {
        if value.is_auto() {
            return Self::auto();
        }

        let raw = value.into_raw();
        match raw.tag() {
            CompactLength::PERCENT_TAG => Self::percent(raw.value()),
            CompactLength::LENGTH_TAG => Self::length(raw.value()),
            CompactLength::AUTO_TAG => Self::auto(),
            _ => {
                unreachable!()
            }
        }
    }
}

impl From<&LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: &LengthPercentageAuto) -> Self {
        if value.is_auto() {
            return Self::auto();
        }

        let raw = value.into_raw();
        match raw.tag() {
            CompactLength::PERCENT_TAG => Self::percent(raw.value()),
            CompactLength::LENGTH_TAG => Self::length(raw.value()),
            CompactLength::AUTO_TAG => Self::auto(),
            _ => {
                unreachable!()
            }
        }
    }
}

impl From<Rect<LengthPercentageAuto>> for CMasonLengthPercentageAutoRect {
    fn from(rect: Rect<LengthPercentageAuto>) -> Self {
        Self {
            left: rect.left.into(),
            right: rect.right.into(),
            top: rect.top.into(),
            bottom: rect.bottom.into(),
        }
    }
}

impl From<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn from(size: Size<LengthPercentageAuto>) -> Self {
        Self {
            width: size.width.into(),
            height: size.height.into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn into(self) -> Size<LengthPercentageAuto> {
        Size {
            width: self.width.into(),
            height: self.height.into(),
        }
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
        let raw = value.into_raw();
        if raw.uses_percentage() {
            CMasonLengthPercentage::new(
                raw.value(),
                CMasonLengthPercentageType::MasonLengthPercentageTypePercent,
            )
        } else {
            CMasonLengthPercentage::new(
                raw.value(),
                CMasonLengthPercentageType::MasonLengthPercentageTypePoints,
            )
        }
    }
}

impl From<&LengthPercentage> for CMasonLengthPercentage {
    fn from(value: &LengthPercentage) -> Self {
        let raw = value.into_raw();
        if raw.uses_percentage() {
            CMasonLengthPercentage::new(
                raw.value(),
                CMasonLengthPercentageType::MasonLengthPercentageTypePercent,
            )
        } else {
            CMasonLengthPercentage::new(
                raw.value(),
                CMasonLengthPercentageType::MasonLengthPercentageTypePoints,
            )
        }
    }
}

impl From<Rect<LengthPercentage>> for CMasonLengthPercentageRect {
    fn from(rect: Rect<LengthPercentage>) -> Self {
        Self {
            left: rect.left.into(),
            right: rect.right.into(),
            top: rect.top.into(),
            bottom: rect.bottom.into(),
        }
    }
}

impl From<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn from(size: Size<LengthPercentage>) -> Self {
        Self {
            width: size.width.into(),
            height: size.height.into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn into(self) -> Size<LengthPercentage> {
        Size {
            width: self.width.into(),
            height: self.height.into(),
        }
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
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_with_values(
    mason: *mut CMason,
    node: *mut CMasonNode,
    display: c_int,
    position: c_int,
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
    gap_row_type: c_int,
    gap_row_value: c_float,
    gap_column_type: c_int,
    gap_column_value: c_float,
    aspect_ratio: c_float,
    grid_auto_rows: *mut CMasonTrackSizingFunctionArray,
    grid_auto_columns: *mut CMasonTrackSizingFunctionArray,
    grid_auto_flow: c_int,
    grid_column_start_type: c_int,
    grid_column_start_value: c_short,
    grid_column_end_type: c_int,
    grid_column_end_value: c_short,
    grid_row_start_type: c_int,
    grid_row_start_value: c_short,
    grid_row_end_type: c_int,
    grid_row_end_value: c_short,
    grid_template_rows: *mut CMasonTrackSizingFunctionArray,
    grid_template_columns: *mut CMasonTrackSizingFunctionArray,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
    text_align: i32,
    box_sizing: i32,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node);

        let grid_auto_rows = to_vec_non_repeated_track_sizing_function(grid_auto_rows);
        let grid_auto_columns = to_vec_non_repeated_track_sizing_function(grid_auto_columns);
        let grid_template_rows = to_vec_track_sizing_function(grid_template_rows);
        let grid_template_columns = to_vec_track_sizing_function(grid_template_columns);

        let style = mason_core::style::utils::from_ffi(
            display,
            position,
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
            text_align,
            box_sizing,
        );
        mason.set_style(node.0.id(), style);
    }
}

#[repr(C)]
pub struct CMasonBuffer {
    data: *mut u8,
    size: usize,
}

#[no_mangle]
pub extern "C" fn mason_style_release_style_buffer(buffer: *mut CMasonBuffer) {
    if buffer.is_null() {
        unsafe {
            let _ = Box::from_raw(buffer);
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_style_buffer(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonBuffer {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;

        let data = mason.0.style_data_raw_mut(node.0.id());

        Box::into_raw(Box::new(CMasonBuffer {
            data: data.0,
            size: data.1,
        }))
    }
}

#[cfg(target_vendor = "apple")]
#[no_mangle]
pub extern "C" fn mason_style_get_style_buffer_apple(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut std::os::raw::c_void {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut *mason;
        let node = &(*node).0;

        mason.0.style_data(node.id())
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_rows(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonTrackSizingFunctionArray {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        if let Some(style) = mason.0.style(node.0.id()) {
            let ret: Vec<CMasonMinMax> = style
                .get_grid_auto_rows()
                .iter()
                .map(|v| (*v).into())
                .collect();

            return Box::into_raw(Box::new(ret.into()));
        }
    }
    std::ptr::null_mut()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_rows(
    mason: *mut CMason,
    node: *mut CMasonNode,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

    let rows: Vec<_> = slice
        .iter()
        .map(|v| min_max_from_values((*v).min_type, v.min_value, v.max_type, v.max_value))
        .collect();

    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;

        mason.0.with_style_mut(node.0.id(), |style| {
            style.set_grid_auto_rows(rows);
        });
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_columns(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonTrackSizingFunctionArray {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        if let Some(style) = mason.0.style(node.0.id()) {
            let ret: Vec<CMasonMinMax> = style
                .get_grid_auto_columns()
                .clone()
                .into_iter()
                .map(|v| v.into())
                .collect();

            return Box::into_raw(Box::new(ret.into()));
        }
    }
    std::ptr::null_mut()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_columns(
    mason: *mut CMason,
    node: *mut CMasonNode,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

    let columns: Vec<_> = slice
        .iter()
        .map(|v| min_max_from_values((*v).min_type, v.min_value, v.max_type, v.max_value))
        .collect();

    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        mason.0.with_style_mut(node.0.id(), |style| {
            style.set_grid_auto_columns(columns);
        });
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_template_rows(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonTrackSizingFunctionArray {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        if let Some(style) = mason.0.style(node.0.id()) {
            let rows: Vec<_> = style
                .get_grid_template_rows()
                .clone()
                .into_iter()
                .map(|v| v.into())
                .collect::<Vec<CMasonTrackSizingFunction>>()
                .into();
            return Box::into_raw(Box::new(rows.into()));
        }
    }

    std::ptr::null_mut()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_template_rows(
    mason: *mut CMason,
    node: *mut CMasonNode,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        mason.0.with_style_mut(node.0.id(), |style| {
            style.set_grid_template_rows(to_vec_track_sizing_function(value));
        });
    }
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_template_columns(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut CMasonTrackSizingFunctionArray {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        if let Some(style) = mason.0.style(node.0.id()) {
            let column: Vec<_> = style
                .get_grid_template_columns()
                .clone()
                .into_iter()
                .map(|v| v.into())
                .collect::<Vec<CMasonTrackSizingFunction>>()
                .into();
            return Box::into_raw(Box::new(column.into()));
        }
    }

    std::ptr::null_mut()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_template_columns(
    mason: *mut CMason,
    node: *mut CMasonNode,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    if mason.is_null() || node.is_null() || value.is_null() {
        return;
    }
    unsafe {
        let mason = &mut *mason;
        let node = &mut *node;
        mason.0.with_style_mut(node.0.id(), |style| {
            style.set_grid_template_columns(to_vec_track_sizing_function(value));
        });
    }
}

pub fn to_vec_non_repeated_track_sizing_function(
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
                let ret: Vec<TrackSizingFunction> = if unsafe { (*(*tracks)).length == 0 } {
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

fn overflow_to_int(value: Overflow) -> i32 {
    match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
        Overflow::Clip => 3,
    }
}
