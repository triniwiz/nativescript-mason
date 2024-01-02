use std::ffi::{c_float, c_int, c_void};
use jni::objects::{JClass, JObject, JObjectArray};
use jni::signature::ReturnType;
use jni::sys::{jfloat, jfloatArray, jint, jlong, jobjectArray, jshort};
use jni::JNIEnv;

use mason_core::style::{dimension_with_auto, min_max_from_values, Style};
use mason_core::{align_content_from_enum, display_from_enum, Dimension, GridTrackRepetition, LengthPercentageAuto, NonRepeatedTrackSizingFunction, TrackSizingFunction, MinTrackSizingFunction, LengthPercentage, MaxTrackSizingFunction};

use crate::TRACK_SIZING_FUNCTION;

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


#[repr(C)]
#[derive(Debug)]
pub struct CMasonNonRepeatedTrackSizingFunctionArray {
    pub array: *mut CMasonMinMax,
    pub length: usize,
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_rows(
    style: i64,
) -> *mut CMasonNonRepeatedTrackSizingFunctionArray {
    let ret: Vec<CMasonMinMax> = mason_core::ffi::style_get_grid_auto_rows(style as _)
        .into_iter()
        .map(|v| v.into())
        .collect();

    Box::into_raw(Box::new(ret.into()))
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


#[no_mangle]
pub extern "C" fn mason_destroy_track_sizing_function_array(
    array: *mut CMasonTrackSizingFunctionArray,
) {
    if array.is_null() {
        return;
    }
    let _ = unsafe { Box::from_raw(array) };
}


#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_columns(
    style: i64,
) -> *mut CMasonNonRepeatedTrackSizingFunctionArray {
    let ret: Vec<CMasonMinMax> = mason_core::ffi::style_get_grid_auto_columns(style as _)
        .into_iter()
        .map(|v| v.into())
        .collect();

    Box::into_raw(Box::new(ret.into()))
}


#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_rows(
    style: i64,
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
pub extern "C" fn mason_style_set_grid_auto_columns(
    style: i64,
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
pub extern "C" fn mason_style_get_grid_template_rows(
    style: i64,
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
pub extern "C" fn mason_style_get_grid_template_columns(
    style: i64,
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
pub extern "C" fn mason_style_set_grid_template_rows(
    style: i64,
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
pub extern "C" fn mason_style_set_grid_template_columns(
    style: i64,
    value: *mut CMasonTrackSizingFunctionArray,
) {
    unsafe {
        mason_core::ffi::style_set_grid_template_columns(
            style as _,
            to_vec_track_sizing_function(value),
        )
    }
}

#[no_mangle]
pub extern "C" fn mason_style_update_with_values(
    style: i64,
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


#[no_mangle]
pub extern "system" fn StyleNativeDestroy(
    style: jlong,
) {
    if style == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(style as *mut Style);
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeDestroyNormal(
    _env: JNIEnv, _: JClass, style: jlong,
) {
    if style == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(style as *mut Style);
    }
}

#[no_mangle]
pub extern "system" fn StyleNativeInit() -> jlong {
    let mut style: Style = Style::default();
    style.set_align_content(align_content_from_enum(0));
    style.set_flex_basis(Dimension::Auto);
    style.set_flex_grow(0.0);
    style.set_flex_shrink(0.0);
    style.into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn StyleNativeInitNormal(
    _env: JNIEnv, _: JClass,
) -> jlong {
    let mut style: Style = Style::default();
    style.set_align_content(align_content_from_enum(0));
    style.set_flex_basis(Dimension::Auto);
    style.set_flex_grow(0.0);
    style.set_flex_shrink(0.0);
    style.into_raw() as jlong
}

pub(crate) const JAVA_INT_TYPE: ReturnType = ReturnType::Primitive(jni::signature::Primitive::Int);
pub(crate) const JAVA_SHORT_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Short);
pub(crate) const JAVA_FLOAT_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Float);
pub(crate) const JAVA_BOOLEAN_TYPE: ReturnType =
    ReturnType::Primitive(jni::signature::Primitive::Boolean);
pub(crate) const JAVA_OBJECT_TYPE: ReturnType = ReturnType::Object;
pub(crate) const JAVA_ARRAY_TYPE: ReturnType = ReturnType::Array;

pub(crate) fn to_vec_non_repeated_track_sizing_function_jni(
    env: &mut JNIEnv,
    array: jobjectArray,
) -> Vec<NonRepeatedTrackSizingFunction> {
    unsafe {
        return if array.is_null() {
            vec![]
        } else {
            let array = JObjectArray::from_raw(array);
            let len = env.get_array_length(&array).unwrap_or_default();
            if len == 0 {
                return vec![];
            }

            let mut ret = Vec::with_capacity(len as usize);

            let min_max = crate::MIN_MAX.get().unwrap();

            for i in 0..len {
                let object = env.get_object_array_element(&array, i).unwrap();
                let min_type = env
                    .call_method_unchecked(&object, min_max.min_type_id, JAVA_INT_TYPE, &[])
                    .unwrap();
                let min_value = env
                    .call_method_unchecked(&object, min_max.min_value_id, JAVA_FLOAT_TYPE, &[])
                    .unwrap();
                let max_type = env
                    .call_method_unchecked(&object, min_max.max_type_id, JAVA_INT_TYPE, &[])
                    .unwrap();
                let max_value = env
                    .call_method_unchecked(&object, min_max.max_value_id, JAVA_FLOAT_TYPE, &[])
                    .unwrap();
                ret.push(min_max_from_values(
                    min_type.i().unwrap(),
                    min_value.f().unwrap(),
                    max_type.i().unwrap(),
                    max_value.f().unwrap(),
                ));
            }
            ret
        };
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

pub(crate) fn to_vec_track_sizing_function_jni(
    env: &mut JNIEnv,
    array: jobjectArray,
) -> Vec<TrackSizingFunction> {
    if !array.is_null() {
        let array = unsafe { JObjectArray::from_raw(array) };
        let len = env.get_array_length(&array).unwrap_or_default();

        if len == 0 {
            return vec![];
        }

        let mut ret = Vec::with_capacity(len as usize);

        let track_sizing = TRACK_SIZING_FUNCTION.get().unwrap();

        let min_max = crate::MIN_MAX.get().unwrap();

        unsafe {
            for i in 0..len {
                let object = env.get_object_array_element(&array, i).unwrap();

                let is_repeating = env
                    .call_method_unchecked(
                        &object,
                        track_sizing.is_repeating,
                        JAVA_BOOLEAN_TYPE,
                        &[],
                    )
                    .unwrap()
                    .z()
                    .unwrap();

                if is_repeating {
                    let auto_repeat_grid_track_repetition = env
                        .call_method_unchecked(
                            &object,
                            track_sizing.auto_repeat_grid_track_repetition_id,
                            JAVA_INT_TYPE,
                            &[],
                        )
                        .unwrap()
                        .i()
                        .unwrap();

                    let auto_repeat_grid_track_repetition_count = env
                        .call_method_unchecked(
                            &object,
                            track_sizing.auto_repeat_grid_track_repetition_count_id,
                            JAVA_SHORT_TYPE,
                            &[],
                        )
                        .unwrap()
                        .s()
                        .unwrap();

                    let auto_repeat_value = env
                        .call_method_unchecked(
                            &object,
                            track_sizing.auto_repeat_value_id,
                            JAVA_ARRAY_TYPE,
                            &[],
                        )
                        .unwrap();

                    let auto_repeat_value_array =
                        JObjectArray::from(auto_repeat_value.l().unwrap());

                    let repeating_len = env
                        .get_array_length(&auto_repeat_value_array)
                        .unwrap_or_default();

                    let mut repeat_ret = Vec::with_capacity(repeating_len as usize);

                    for j in 0..repeating_len {
                        let repeat_object = env
                            .get_object_array_element(&auto_repeat_value_array, j)
                            .unwrap();

                        let min_type = env
                            .call_method_unchecked(
                                &repeat_object,
                                min_max.min_type_id,
                                JAVA_INT_TYPE,
                                &[],
                            )
                            .unwrap();

                        let min_value = env
                            .call_method_unchecked(
                                &repeat_object,
                                min_max.min_value_id,
                                JAVA_FLOAT_TYPE,
                                &[],
                            )
                            .unwrap();

                        let max_type = env
                            .call_method_unchecked(
                                &repeat_object,
                                min_max.max_type_id,
                                JAVA_INT_TYPE,
                                &[],
                            )
                            .unwrap();

                        let max_value = env
                            .call_method_unchecked(
                                repeat_object,
                                min_max.max_value_id,
                                JAVA_FLOAT_TYPE,
                                &[],
                            )
                            .unwrap();

                        repeat_ret.push(min_max_from_values(
                            min_type.i().unwrap(),
                            min_value.f().unwrap(),
                            max_type.i().unwrap(),
                            max_value.f().unwrap(),
                        ));
                    }

                    ret.push(TrackSizingFunction::Repeat(
                        match auto_repeat_grid_track_repetition {
                            0 => GridTrackRepetition::AutoFill,
                            1 => GridTrackRepetition::AutoFit,
                            2 => GridTrackRepetition::Count(
                                auto_repeat_grid_track_repetition_count as u16,
                            ),
                            _ => panic!(),
                        },
                        repeat_ret,
                    ));
                } else {
                    let single_value = env
                        .call_method_unchecked(
                            object,
                            track_sizing.single_value_id,
                            JAVA_OBJECT_TYPE,
                            &[],
                        )
                        .unwrap()
                        .l()
                        .unwrap();

                    let min_type = env
                        .call_method_unchecked(
                            &single_value,
                            min_max.min_type_id,
                            JAVA_INT_TYPE,
                            &[],
                        )
                        .unwrap();

                    let min_value = env
                        .call_method_unchecked(
                            &single_value,
                            min_max.min_value_id,
                            JAVA_FLOAT_TYPE,
                            &[],
                        )
                        .unwrap();

                    let max_type = env
                        .call_method_unchecked(
                            &single_value,
                            min_max.max_type_id,
                            JAVA_INT_TYPE,
                            &[],
                        )
                        .unwrap();

                    let max_value = env
                        .call_method_unchecked(
                            single_value,
                            min_max.max_value_id,
                            JAVA_FLOAT_TYPE,
                            &[],
                        )
                        .unwrap();

                    ret.push(TrackSizingFunction::Single(min_max_from_values(
                        min_type.i().unwrap(),
                        min_value.f().unwrap(),
                        max_type.i().unwrap(),
                        max_value.f().unwrap(),
                    )));
                }
            }
        }

        return ret;
    }

    vec![]
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

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeInitWithValues(
    env: &mut JNIEnv,
    _: JObject,
    display: jint,
    position: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_items: jint,
    justify_self: jint,
    justify_content: jint,
    inset_left_type: jint,
    inset_left_value: jfloat,
    inset_right_type: jint,
    inset_right_value: jfloat,
    inset_top_type: jint,
    inset_top_value: jfloat,
    inset_bottom_type: jint,
    inset_bottom_value: jfloat,
    margin_left_type: jint,
    margin_left_value: jfloat,
    margin_right_type: jint,
    margin_right_value: jfloat,
    margin_top_type: jint,
    margin_top_value: jfloat,
    margin_bottom_type: jint,
    margin_bottom_value: jfloat,
    padding_left_type: jint,
    padding_left_value: jfloat,
    padding_right_type: jint,
    padding_right_value: jfloat,
    padding_top_type: jint,
    padding_top_value: jfloat,
    padding_bottom_type: jint,
    padding_bottom_value: jfloat,
    border_left_type: jint,
    border_left_value: jfloat,
    border_right_type: jint,
    border_right_value: jfloat,
    border_top_type: jint,
    border_top_value: jfloat,
    border_bottom_type: jint,
    border_bottom_value: jfloat,
    flex_grow: jfloat,
    flex_shrink: jfloat,
    flex_basis_type: jint,
    flex_basis_value: jfloat,
    width_type: jint,
    width_value: jfloat,
    height_type: jint,
    height_value: jfloat,
    min_width_type: jint,
    min_width_value: jfloat,
    min_height_type: jint,
    min_height_value: jfloat,
    max_width_type: jint,
    max_width_value: jfloat,
    max_height_type: jint,
    max_height_value: jfloat,
    gap_row_type: jint,
    gap_row_value: jfloat,
    gap_column_type: jint,
    gap_column_value: jfloat,
    aspect_ratio: jfloat,
    grid_auto_rows: jobjectArray,
    grid_auto_columns: jobjectArray,
    grid_auto_flow: jint,
    grid_column_start_type: jint,
    grid_column_start_value: jshort,
    grid_column_end_type: jint,
    grid_column_end_value: jshort,
    grid_row_start_type: jint,
    grid_row_start_value: jshort,
    grid_row_end_type: jint,
    grid_row_end_value: jshort,
    grid_template_rows: jobjectArray,
    grid_template_columns: jobjectArray,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
) -> jlong {
    let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
    let grid_auto_columns = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
    let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
    let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

    Box::into_raw(Box::new(Style::from_ffi(
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
    ))) as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeUpdateWithValues(
    env: &mut JNIEnv,
    _: JObject,
    style: jlong,
    display: jint,
    position: jint,
    direction: jint,
    flex_direction: jint,
    flex_wrap: jint,
    overflow: jint,
    align_items: jint,
    align_self: jint,
    align_content: jint,
    justify_items: jint,
    justify_self: jint,
    justify_content: jint,
    inset_left_type: jint,
    inset_left_value: jfloat,
    inset_right_type: jint,
    inset_right_value: jfloat,
    inset_top_type: jint,
    inset_top_value: jfloat,
    inset_bottom_type: jint,
    inset_bottom_value: jfloat,
    margin_left_type: jint,
    margin_left_value: jfloat,
    margin_right_type: jint,
    margin_right_value: jfloat,
    margin_top_type: jint,
    margin_top_value: jfloat,
    margin_bottom_type: jint,
    margin_bottom_value: jfloat,
    padding_left_type: jint,
    padding_left_value: jfloat,
    padding_right_type: jint,
    padding_right_value: jfloat,
    padding_top_type: jint,
    padding_top_value: jfloat,
    padding_bottom_type: jint,
    padding_bottom_value: jfloat,
    border_left_type: jint,
    border_left_value: jfloat,
    border_right_type: jint,
    border_right_value: jfloat,
    border_top_type: jint,
    border_top_value: jfloat,
    border_bottom_type: jint,
    border_bottom_value: jfloat,
    flex_grow: jfloat,
    flex_shrink: jfloat,
    flex_basis_type: jint,
    flex_basis_value: jfloat,
    width_type: jint,
    width_value: jfloat,
    height_type: jint,
    height_value: jfloat,
    min_width_type: jint,
    min_width_value: jfloat,
    min_height_type: jint,
    min_height_value: jfloat,
    max_width_type: jint,
    max_width_value: jfloat,
    max_height_type: jint,
    max_height_value: jfloat,
    gap_row_type: jint,
    gap_row_value: jfloat,
    gap_column_type: jint,
    gap_column_value: jfloat,
    aspect_ratio: jfloat,
    grid_auto_rows: jobjectArray,
    grid_auto_columns: jobjectArray,
    grid_auto_flow: jint,
    grid_column_start_type: jint,
    grid_column_start_value: jshort,
    grid_column_end_type: jint,
    grid_column_end_value: jshort,
    grid_row_start_type: jint,
    grid_row_start_value: jshort,
    grid_row_end_type: jint,
    grid_row_end_value: jshort,
    grid_template_rows: jobjectArray,
    grid_template_columns: jobjectArray,
    overflow_x: jint,
    overflow_y: jint,
    scrollbar_width: jfloat,
) {
    let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
    let grid_auto_columns = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
    let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
    let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        Style::update_from_ffi(
            &mut style,
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
        );
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeGetSize(
    env: JNIEnv,
    _: JObject,
    style: jlong,
) -> jfloatArray {
    if style == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let style: Box<Style> = Box::from_raw(style as *mut Style);

        let size_width = style.get_size_width().into();
        let size_height = style.get_size_height().into();

        let mut output = vec![0.0, 0.0, 0.0, 0.0];

        match size_width {
            Dimension::Auto => {
                output[0] = 0.0;
                output[1] = 0.0;
            }
            Dimension::Length(points) => {
                output[0] = 1.0;
                output[1] = points;
            }
            Dimension::Percent(percent) => {
                output[0] = 2.0;
                output[1] = percent;
            }
        }

        match size_height {
            Dimension::Auto => {
                output[2] = 0.0;
                output[3] = 0.0;
            }
            Dimension::Length(points) => {
                output[2] = 1.0;
                output[3] = points;
            }
            Dimension::Percent(percent) => {
                output[2] = 2.0;
                output[3] = percent;
            }
        }

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(style);

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeGetMargins(
    env: JNIEnv,
    _: JObject,
    style: jlong,
) -> jfloatArray {
    if style == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let style: Box<Style> = Box::from_raw(style as *mut Style);

        let top = style.get_margin_top();
        let left = style.get_margin_left();
        let bottom = style.get_margin_bottom();
        let right = style.get_margin_right();

        let mut output = vec![0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

        match top {
            LengthPercentageAuto::Auto => {
                output[0] = 0.0;
                output[1] = 0.0;
            }
            LengthPercentageAuto::Length(points) => {
                output[0] = 1.0;
                output[1] = points;
            }
            LengthPercentageAuto::Percent(percent) => {
                output[0] = 2.0;
                output[1] = percent;
            }
        }

        match left {
            LengthPercentageAuto::Auto => {
                output[2] = 0.0;
                output[3] = 0.0;
            }
            LengthPercentageAuto::Length(points) => {
                output[2] = 1.0;
                output[3] = points;
            }
            LengthPercentageAuto::Percent(percent) => {
                output[2] = 2.0;
                output[3] = percent;
            }
        }

        match bottom {
            LengthPercentageAuto::Auto => {
                output[4] = 0.0;
                output[5] = 0.0;
            }
            LengthPercentageAuto::Length(points) => {
                output[4] = 1.0;
                output[5] = points;
            }
            LengthPercentageAuto::Percent(percent) => {
                output[4] = 2.0;
                output[5] = percent;
            }
        }

        match right {
            LengthPercentageAuto::Auto => {
                output[6] = 0.0;
                output[7] = 0.0;
            }
            LengthPercentageAuto::Length(points) => {
                output[6] = 1.0;
                output[7] = points;
            }
            LengthPercentageAuto::Percent(percent) => {
                output[6] = 2.0;
                output[7] = percent;
            }
        }

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        Box::leak(style);

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeSetSize(
    _: JNIEnv,
    _: JObject,
    style: jlong,
    width_type: jint,
    width: jfloat,
    height_type: jint,
    height: jfloat,
) {
    if style == 0 {
        return;
    }
    unsafe {
        let mut style: Box<Style> = Box::from_raw(style as *mut Style);
        Style::set_size_width(&mut style, dimension_with_auto(width_type, width).into());
        Style::set_size_height(&mut style, dimension_with_auto(height_type, height).into());
        Box::leak(style);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeSetDisplay(
    _: JNIEnv,
    _: JObject,
    style: jlong,
    display: jint,
) {
    if style == 0 {
        return;
    }
    unsafe {
        let mut style: Box<Style> = Box::from_raw(style as *mut Style);
        Style::set_display(&mut style, display_from_enum(display).unwrap());
        Box::leak(style);
    }
}
