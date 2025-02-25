use std::ffi::{c_char, CString};

use mason_core::{
    auto, fit_content, flex, length, max_content, min_content, percent, LengthPercentage,
    LengthPercentageAuto, NonRepeatedTrackSizingFunction,
};

use crate::ffi;
use crate::style::CMasonMinMax;
use crate::style::CMasonNonRepeatedTrackSizingFunctionArray;
use crate::style::CMasonTrackSizingFunctionArray;

#[inline]
pub fn get_length_auto_value(value: LengthPercentageAuto) -> (f32, f32) {
    if value.is_auto() {
        return (0.0, 0.0);
    }

    let raw = value.into_raw();

    if raw.is_length_or_percentage() {
        return if raw.uses_percentage() {
            (2., raw.value())
        } else {
            (1., raw.value())
        };
    }

    (-1., 0.)
}

#[inline]
pub fn get_length_value(value: LengthPercentageAuto) -> (f32, f32) {
    let raw = value.into_raw();

    if raw.is_length_or_percentage() {
        return if raw.uses_percentage() {
            (2., raw.value())
        } else {
            (1., raw.value())
        };
    }

    (-1., 0.)
}

#[no_mangle]
pub extern "C" fn mason_util_create_non_repeated_track_sizing_function_with_type_value(
    track_type: i32,
    track_value: f32,
) -> CMasonMinMax {
    let value: NonRepeatedTrackSizingFunction = match track_type {
        0 => auto(),
        1 => min_content(),
        2 => max_content(),
        3 => length(track_value),
        4 => percent(track_value),
        5 => flex(track_value),
        6 => fit_content(LengthPercentage::length(track_value)),
        7 => fit_content(LengthPercentage::percent(track_value)),
        _ => panic!(),
    };

    value.into()
}

#[no_mangle]
pub extern "C" fn mason_util_parse_non_repeated_track_sizing_function(
    value: *mut CMasonNonRepeatedTrackSizingFunctionArray,
) -> *mut c_char {
    let mut ret = String::new();

    if !value.is_null() {
        let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };

        for (i, val) in slice.iter().enumerate() {
            let value: NonRepeatedTrackSizingFunction = (*val).into();
            let parsed = ffi::parse_non_repeated_track_sizing_function_value(value);
            if i != 0 {
                ret.push(' ');
            }
            ret.push_str(parsed.as_ref())
        }
    }
    if ret.is_empty() {
        return std::ptr::null_mut();
    }
    CString::new(ret).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn mason_util_parse_auto_repeating_track_sizing_function(
    value: *mut CMasonTrackSizingFunctionArray,
) -> *mut c_char {
    let mut ret = String::new();
    let slice = unsafe { std::slice::from_raw_parts_mut((*value).array, (*value).length) };
    for (i, val) in slice.iter().enumerate() {
        if i != 0 {
            ret.push(' ');
        }
        let value = &val.into();

        let string = ffi::parse_track_sizing_function_value(value);
        ret.push_str(string.as_str());
    }

    if ret.is_empty() {
        return std::ptr::null_mut();
    }
    CString::new(ret).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn mason_util_destroy_string(string: *mut c_char) {
    if string.is_null() {
        return;
    }
    let _ = unsafe { CString::from_raw(string) };
}
