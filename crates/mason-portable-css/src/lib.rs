#![cfg(target_arch = "wasm32")]

use mason_core::style::css::gradient::{double_stop_components, resolve_stop_positions};
use mason_core::style::css::length::{resolve_portable_math, PortableMathUnit};
use mason_core::style::css::transform::{portable_affine, portable_angle};
use mason_core::style::css::CssLengthResultRecord as Record;
use mason_core::style::css::{
    visit_color_functions, visit_portable_filters, visit_portable_shadows,
};

#[link(wasm_import_module = "mason_css_host")]
extern "C" {
    fn resolve_unit(value: f64, unit: *const u16, length: usize, result: *mut f64) -> i32;
    fn color_range(start: usize, end: usize);
    fn resolve_length(source: *const u16, length: usize) -> f64;
    fn shadow_record(
        x: f64,
        y: f64,
        blur: f64,
        spread: f64,
        inset: i32,
        color: *const u16,
        length: usize,
    );
    fn filter_record(
        kind: u32,
        amount_or_x: f64,
        y: f64,
        blur: f64,
        color: *const u16,
        length: usize,
    );
}

fn host_length(source: &str) -> Option<f64> {
    let source: Vec<_> = source.encode_utf16().collect();
    let value = unsafe { resolve_length(source.as_ptr(), source.len()) };
    value.is_finite().then_some(value)
}

#[no_mangle]
pub unsafe extern "C" fn css_double_stop(
    input: *const u16,
    length: usize,
    output: *mut [u32; 6],
) -> i32 {
    let Ok(input) = String::from_utf16(std::slice::from_raw_parts(input, length)) else {
        return 0;
    };
    let Some(components) = double_stop_components(&input) else {
        return 0;
    };
    let mut ranges = [0; 6];
    for (range, part) in ranges.chunks_exact_mut(2).zip(components) {
        let byte_start = part.as_ptr() as usize - input.as_ptr() as usize;
        range[0] = input[..byte_start].encode_utf16().count() as u32;
        range[1] = range[0] + part.encode_utf16().count() as u32;
    }
    output.write(ranges);
    1
}

#[no_mangle]
pub unsafe extern "C" fn css_resolve_stop_positions(records: *mut [f64; 2], count: usize) {
    let records = std::slice::from_raw_parts_mut(records, count);
    let mut positions: Vec<_> = records
        .iter()
        .map(|&[present, value]| (present != 0.).then_some(value))
        .collect();
    resolve_stop_positions(&mut positions);
    for (record, position) in records.iter_mut().zip(positions) {
        record[1] = position.unwrap();
    }
}

#[no_mangle]
pub unsafe extern "C" fn css_evaluate_affine(
    input: *const u16,
    length: usize,
    width: f64,
    height: f64,
    output: *mut [f64; 6],
) -> i32 {
    let input = String::from_utf16_lossy(std::slice::from_raw_parts(input, length));
    let Some(matrix) = portable_affine(&input, width, height, host_length) else {
        return 0;
    };
    output.write(matrix);
    1
}

#[no_mangle]
pub unsafe extern "C" fn css_angle(input: *const u16, length: usize) -> f64 {
    let input = String::from_utf16_lossy(std::slice::from_raw_parts(input, length));
    portable_angle(&input).unwrap_or(0.)
}

#[no_mangle]
pub unsafe extern "C" fn css_visit_shadows(input: *const u16, length: usize) {
    let Ok(input) = String::from_utf16(std::slice::from_raw_parts(input, length)) else {
        return;
    };
    visit_portable_shadows(&input, host_length, |[x, y, blur, spread], inset, color| {
        let color: Vec<_> = color.unwrap_or_default().encode_utf16().collect();
        shadow_record(
            x,
            y,
            blur,
            spread,
            inset.into(),
            color.as_ptr(),
            color.len(),
        );
    });
}

#[no_mangle]
pub unsafe extern "C" fn css_visit_filters(input: *const u16, length: usize) {
    let Ok(input) = String::from_utf16(std::slice::from_raw_parts(input, length)) else {
        return;
    };
    visit_portable_filters(
        &input,
        host_length,
        |kind, [amount_or_x, y, blur], color| {
            let color: Vec<_> = color.unwrap_or_default().encode_utf16().collect();
            filter_record(
                kind as u32,
                amount_or_x,
                y,
                blur,
                color.as_ptr(),
                color.len(),
            );
        },
    );
}

#[no_mangle]
pub unsafe extern "C" fn css_visit_color_functions(input: *const u16, length: usize) {
    let Ok(input) = String::from_utf16(std::slice::from_raw_parts(input, length)) else {
        return;
    };
    let mut previous_byte = 0;
    let mut previous_code_unit = 0;
    visit_color_functions(&input, |range| {
        let start = previous_code_unit + input[previous_byte..range.start].encode_utf16().count();
        let end = start + input[range.clone()].encode_utf16().count();
        color_range(start, end);
        previous_byte = range.end;
        previous_code_unit = end;
    });
}

#[no_mangle]
pub extern "C" fn css_alloc(words: usize) -> *mut u64 {
    Box::into_raw(vec![0_u64; words].into_boxed_slice()) as *mut u64
}

#[no_mangle]
pub unsafe extern "C" fn css_free(buffer: *mut u64, words: usize) {
    drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
        buffer, words,
    )));
}

#[no_mangle]
pub unsafe extern "C" fn css_math_evaluate(
    input: *const u16,
    length: usize,
    output: *mut f64,
) -> i32 {
    let Ok(input) = String::from_utf16(std::slice::from_raw_parts(input, length)) else {
        return -1;
    };
    let parsed = resolve_portable_math(&input, |value, unit| {
        let unit: Vec<u16> = unit.encode_utf16().collect();
        let mut result = 0.;
        match resolve_unit(value, unit.as_ptr(), unit.len(), &mut result) {
            1 if !result.is_nan() => Some(PortableMathUnit::Length(result)),
            2 if !result.is_nan() => Some(PortableMathUnit::Percent(result)),
            _ => None,
        }
    });
    let Some(parsed) = parsed else {
        return -1;
    };
    *output = parsed[Record::VALUE];
    parsed[Record::KIND] as i32
}
