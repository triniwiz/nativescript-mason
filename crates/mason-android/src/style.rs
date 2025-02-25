use jni::objects::{JByteBuffer, JClass, JObject, JObjectArray};
use jni::signature::ReturnType;
use jni::sys::{jfloat, jint, jlong, jobjectArray, jshort};
use jni::JNIEnv;
use mason_core::style::min_max_from_values;
use mason_core::{
    CompactLength, GridTrackRepetition, Mason, NonRepeatedTrackSizingFunction, TrackSizingFunction,
};

use crate::TRACK_SIZING_FUNCTION;

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

// impl From<TrackSizingFunction> for CMasonTrackSizingFunction {
//     fn from(value: TrackSizingFunction) -> Self {
//         match value {
//             TrackSizingFunction::Single(value) => CMasonTrackSizingFunction::Single(value.into()),
//             TrackSizingFunction::Repeat(repetition, tracks) => {
//                 let mut count = 0;
//                 let rep = match repetition {
//                     GridTrackRepetition::AutoFill => 0,
//                     GridTrackRepetition::AutoFit => 1,
//                     GridTrackRepetition::Count(value) => {
//                         count = value;
//                         2
//                     }
//                 };
//
//                 CMasonTrackSizingFunction::Repeat(
//                     rep,
//                     count,
//                     Box::into_raw(Box::new(
//                         tracks
//                             .into_iter()
//                             .map(|v| v.into())
//                             .collect::<Vec<CMasonMinMax>>()
//                             .into(),
//                     )),
//                 )
//             }
//         }
//     }
// }

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

// impl From<CMasonTrackSizingFunction> for TrackSizingFunction {
//     fn from(value: CMasonTrackSizingFunction) -> Self {
//         match value {
//             CMasonTrackSizingFunction::Single(value) => {
//                 TrackSizingFunction::Single(min_max_from_values(
//                     value.min_type,
//                     value.min_value,
//                     value.max_type,
//                     value.max_value,
//                 ))
//             }
//             CMasonTrackSizingFunction::Repeat(repetition, count, tracks) => {
//                 TrackSizingFunction::Repeat(
//                     match repetition {
//                         0 => GridTrackRepetition::AutoFill,
//                         1 => GridTrackRepetition::AutoFit,
//                         2 => GridTrackRepetition::Count(count),
//                         _ => panic!(),
//                     },
//                     {
//                         let slice = unsafe {
//                             std::slice::from_raw_parts_mut((*tracks).array, (*tracks).length)
//                                 .to_vec()
//                         };
//                         slice.into_iter().map(|v| v.into()).collect()
//                     },
//                 )
//             }
//         }
//     }
// }

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
        if array.is_null() {
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
        }
    }
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
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeUpdateStyleBuffer(
    env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
    buffer: JByteBuffer,
) {
    unsafe {
        let mason = &mut *(mason as *mut Mason);
        if let Some(node) = mason.get_node_mut(node as usize) {
            match (
                env.get_direct_buffer_address(&buffer),
                env.get_direct_buffer_capacity(&buffer),
                env.new_global_ref(buffer),
            ) {
                (Ok(pointer), Ok(size), Ok(buffer)) => {
                    let style = unsafe { std::slice::from_raw_parts_mut(pointer, size) };
                    mason_core::style::init_style_buffer(style, node.style());
                    if let Some(context) = node.context_mut() {
                        context.set_style_buffer(pointer, size, buffer);
                    }
                }
                (_, _, _) => {}
            }
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Style_nativeUpdateWithValues(
    env: &mut JNIEnv,
    _: JObject,
    mason: jlong,
    node: jlong,
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
    text_align: jint,
    box_sizing: jint,
) {
    if mason == 0 || node == 1 {
        return;
    }
    let grid_auto_rows = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_rows);
    let grid_auto_columns = to_vec_non_repeated_track_sizing_function_jni(env, grid_auto_columns);
    let grid_template_rows = to_vec_track_sizing_function_jni(env, grid_template_rows);
    let grid_template_columns = to_vec_track_sizing_function_jni(env, grid_template_columns);

    unsafe {
        let mason = &mut *(mason as *mut Mason);
        if let Some(node) = mason.get_node_mut(node as usize) {
            mason_core::style::update_from_ffi(
                node.style_mut(),
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
        }
    }
}
