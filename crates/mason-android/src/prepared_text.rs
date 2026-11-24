use jni::objects::{JClass, JFloatArray, JString};
use jni::sys::{jboolean, jfloat, jfloatArray, jint, jlong, jstring, JNI_FALSE, JNI_TRUE};
use jni::JNIEnv;
use mason_core::prepared_text::{Flow, LineBox, LineHeight, LineMetrics, Paragraph, PreparedText};
use mason_core::{Id, Mason, NodeRef};
use std::ffi::{c_char, CStr, CString};

unsafe fn node_of<'a>(mason: jlong, node: jlong) -> Option<(&'a mut Mason, Id)> {
    if mason == 0 || node == 0 {
        return None;
    }
    Some((&mut *(mason as *mut Mason), (*(node as *mut NodeRef)).id()))
}

/// One line as PreparedLines (PreparedText.kt) reads it.
fn packed(line: &LineBox) -> [f32; 7] {
    [
        line.start as f32,
        line.end as f32,
        line.visible_end as f32,
        line.width,
        line.baseline as f32,
        line.ascent as f32,
        line.descent as f32,
    ]
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_PreparedText_nativePrepare(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
    text: JString,
    locale: JString,
    advances: JFloatArray,
    ascent: jint,
    descent: jint,
    line_height: jfloat,
    fixed_line_height: jboolean,
    min_line_height: jfloat,
    inline: jboolean,
    first_line_indent_px: jint,
    nowrap: jboolean,
    centers_vertically: jboolean,
) -> jboolean {
    let Some((mason, id)) = (unsafe { node_of(mason, node) }) else {
        return JNI_FALSE;
    };
    let Some(locale) = env
        .get_string(&locale)
        .ok()
        .and_then(|l| CString::new(String::from(l)).ok())
    else {
        return JNI_FALSE;
    };
    let raw = env.get_raw();
    let chars = unsafe {
        let len = ((**raw).GetStringLength.unwrap())(raw, text.as_raw()).max(0) as usize;
        let mut chars = vec![0u16; len];
        ((**raw).GetStringRegion.unwrap())(raw, text.as_raw(), 0, len as i32, chars.as_mut_ptr());
        chars
    };
    if env
        .get_array_length(&advances)
        .map_or(true, |n| n as usize != chars.len())
    {
        return JNI_FALSE;
    }
    let mut widths = vec![0f32; chars.len()];
    if env
        .get_float_array_region(&advances, 0, &mut widths)
        .is_err()
    {
        return JNI_FALSE;
    }
    let Some(breaks) = crate::icu_breaks::line_breaks(&chars, &locale) else {
        return JNI_FALSE;
    };
    let metrics = LineMetrics {
        ascent,
        descent,
        line_height: if fixed_line_height == JNI_TRUE {
            LineHeight::Fixed(line_height)
        } else {
            LineHeight::Normal(line_height)
        },
        min_height: min_line_height,
    };
    let flow = if inline == JNI_TRUE {
        Flow::Inline
    } else {
        Flow::Block
    };
    mason.set_prepared_text(
        id,
        Some(PreparedText::new(
            &chars,
            widths,
            &breaks,
            metrics,
            flow,
            Paragraph {
                first_line_indent_px,
                nowrap: nowrap == JNI_TRUE,
                centers_vertically: centers_vertically == JNI_TRUE,
            },
        )),
    );
    JNI_TRUE
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_PreparedText_nativeClear(
    _: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
) {
    if let Some((mason, id)) = unsafe { node_of(mason, node) } {
        mason.set_prepared_text(id, None);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_PreparedText_nativeLines(
    env: JNIEnv,
    _: JClass,
    mason: jlong,
    node: jlong,
    width: jfloat,
) -> jfloatArray {
    let Some((mason, id)) = (unsafe { node_of(mason, node) }) else {
        return std::ptr::null_mut();
    };
    let Some(lines) = mason.prepared_text_lines(id, width) else {
        return std::ptr::null_mut();
    };
    let packed: Vec<f32> = lines.iter().flat_map(packed).collect();
    let Ok(array) = env.new_float_array(packed.len() as i32) else {
        return std::ptr::null_mut();
    };
    let _ = env.set_float_array_region(&array, 0, &packed);
    array.into_raw()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_NativeHelpers_nativeSystemProperty(
    mut env: JNIEnv,
    _: JClass,
    name: JString,
) -> jstring {
    extern "C" {
        fn __system_property_get(name: *const c_char, value: *mut c_char) -> i32;
    }
    // PROP_VALUE_MAX
    let mut value = [0 as c_char; 92];
    let found = env
        .get_string(&name)
        .ok()
        .and_then(|n| CString::new(String::from(n)).ok())
        .is_some_and(|n| unsafe { __system_property_get(n.as_ptr(), value.as_mut_ptr()) } > 0);
    let value = if found {
        unsafe { CStr::from_ptr(value.as_ptr()) }
            .to_string_lossy()
            .into_owned()
    } else {
        String::new()
    };
    env.new_string(value)
        .map(|s| s.into_raw())
        .unwrap_or(std::ptr::null_mut())
}
