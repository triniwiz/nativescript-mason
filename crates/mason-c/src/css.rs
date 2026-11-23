use mason_core::style::css::background::{
    parse_layer_properties, parse_longhand, Axis, BackgroundProgram, BackgroundTarget, Image, Layer, LayerProperty, Size,
};
use mason_core::style::css::gradient::Gradient;
use mason_core::style::css::clip_path::ClipPath;
use mason_core::style::css::mask::{parse_layers as parse_mask_layers, MaskLayer, LONGHAND_COUNT};
use mason_core::style::css::nine_slice::{self, Kind as NineSliceKind, NineSlice};
use mason_core::style::css::svg_path::parse_svg_path;
use mason_core::style::css::transform::TransformProgram;
use mason_core::style::css::{
    EffectBatch, FilterProgram, LengthContext, StyleRecordKind,
};
use std::ffi::{c_char, CStr, CString};
use std::ptr;
use std::sync::Arc;

#[repr(C)]
pub struct CMasonCssValues {
    pub values: *const f64,
    pub len: usize,
}

impl CMasonCssValues {
    fn from_vec(values: Vec<f64>) -> Self {
        let values = values.into_boxed_slice();
        let len = values.len();
        Self {
            values: Box::into_raw(values) as *const f64,
            len,
        }
    }
}

/// Parse a CSS shadow list (kind 0), filter chain (kind 1), length (kinds 2–4), transform origin (5), object position (6), line height (7), letter spacing (8), text indent (9), or word spacing (10). Release the returned
/// values with mason_css_values_release. See mason_core::style::css for record layouts.
///
/// # Safety
/// input must be null or a valid NUL-terminated C string.
#[no_mangle]
pub unsafe extern "C" fn mason_css_parse(
    input: *const c_char,
    kind: u8,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    current_color: u32,
) -> CMasonCssValues {
    let empty = CMasonCssValues {
        values: ptr::null(),
        len: 0,
    };
    if input.is_null() {
        return empty;
    }
    let Ok(input) = CStr::from_ptr(input).to_str() else {
        return empty;
    };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let values =
        mason_core::style::css::parse_css_fields(input, context, kind, current_color).unwrap_or_default();
    if values.is_empty() {
        return empty;
    }
    CMasonCssValues::from_vec(values)
}

/// # Safety
/// values must be an unreleased result of an API returning owned CMasonCssValues.
#[no_mangle]
pub unsafe extern "C" fn mason_css_values_release(values: CMasonCssValues) {
    if !values.values.is_null() {
        let allocation = ptr::slice_from_raw_parts_mut(values.values.cast_mut(), values.len);
        drop(Box::from_raw(allocation));
    }
}

/// Applies the sparse grid batch in source order.
/// # Safety
/// Handles are null or matching live Mason and node handles. Input points to input.len valid bytes.
#[no_mangle]
pub unsafe extern "C" fn mason_css_apply_grid(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    input: CMasonCssText,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) {
    let (Some(mason), Some(node)) = (mason.as_mut(), node.as_ref()) else { return };
    if input.len == 0 || input.bytes.is_null() { return; }
    let Ok(input) = std::str::from_utf8(std::slice::from_raw_parts(input.bytes, input.len)) else { return };
    mason.0.with_style_mut(node.0.id().into(), |style| {
        let context = LengthContext { scale: style.get_device_scale(), font_size, root_font_size, viewport_width, viewport_height };
        mason_core::style::css::grid::apply_grid_writes(style, input, context);
    });
}

/// Stores one parsed layout value on the node's style.
/// # Safety
/// The handles must be null or refer to the same live tree. Non-null strings must be NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_apply_layout_length(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    property: *const c_char,
    value: *const c_char,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> bool {
    mason_css_apply_layout_length_for_state(mason, node, 0, property, value, font_size, root_font_size, viewport_width, viewport_height)
}

/// Stores one parsed layout value on the base or pseudo style.
/// # Safety
/// The handles must be null or refer to the same live tree. Non-null strings must be NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_apply_layout_length_for_state(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    flags: u16,
    property: *const c_char,
    value: *const c_char,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> bool {
    let (Some(mason), Some(node)) = (mason.as_mut(), node.as_ref()) else { return false };
    if property.is_null() || value.is_null() {
        return false;
    }
    let (Ok(property), Ok(value)) = (CStr::from_ptr(property).to_str(), CStr::from_ptr(value).to_str()) else {
        return false;
    };
    let context = LengthContext { scale: 1., font_size, root_font_size, viewport_width, viewport_height };
    mason.0.set_node_css_layout_length(node.0.id(), flags, property, value, context)
}

/// Returns the authored expression. Release the result with `mason_util_destroy_string`.
/// # Safety
/// The handles must be null or refer to the same live tree. The property must be null or NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_copy_layout_length(
    mason: *const crate::CMason,
    node: *const crate::CMasonNode,
    property: *const c_char,
) -> *mut c_char {
    mason_css_copy_layout_length_for_state(mason, node, 0, property)
}

/// Returns the authored base or pseudo expression. Release the result with `mason_util_destroy_string`.
/// # Safety
/// The handles must be null or refer to the same live tree. The property must be null or NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_copy_layout_length_for_state(
    mason: *const crate::CMason,
    node: *const crate::CMasonNode,
    flags: u16,
    property: *const c_char,
) -> *mut c_char {
    let (Some(mason), Some(node)) = (mason.as_ref(), node.as_ref()) else { return ptr::null_mut() };
    if property.is_null() {
        return ptr::null_mut();
    }
    let Ok(property) = CStr::from_ptr(property).to_str() else { return ptr::null_mut() };
    let value = mason.0.node_css_layout_length(node.0.id(), flags, property);
    value.and_then(|value| CString::new(value).ok()).map_or(ptr::null_mut(), CString::into_raw)
}

pub struct CMasonCssRecordsOwner(Arc<[f64]>);

#[repr(C)]
pub struct CMasonStyleRecords {
    pub values: *const f64,
    pub len: usize,
    owner: *mut CMasonCssRecordsOwner,
}

impl From<Option<Arc<[f64]>>> for CMasonStyleRecords {
    fn from(records: Option<Arc<[f64]>>) -> Self {
        match records {
            Some(records) => Self {
                values: records.as_ptr(),
                len: records.len(),
                owner: Box::into_raw(Box::new(CMasonCssRecordsOwner(records))),
            },
            None => Self {
                values: ptr::null(),
                len: 0,
                owner: ptr::null_mut(),
            },
        }
    }
}

/// Parse and store a style list. The style schema defines the record IDs.
/// The result keeps the immutable records alive independently of the style slot.
///
/// # Safety
/// Mason and node must be live matching handles. Pass only a node to defer
/// installation until after layout, or pass two null handles for a detached result.
/// Input is valid NUL-terminated CSS.
#[no_mangle]
pub unsafe extern "C" fn mason_css_set_style_records(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    kind: u8,
    input: *const c_char,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    current_color: u32,
) -> CMasonStyleRecords {
    let Some(kind) = StyleRecordKind::from_index(kind) else {
        return None.into();
    };
    let Ok(css) = CStr::from_ptr(input).to_str() else {
        return None.into();
    };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let Some(records) = kind.parse(css, context, current_color) else {
        return None.into();
    };
    install_style_records(mason, node, kind, records)
}

unsafe fn install_style_records(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    kind: StyleRecordKind,
    records: Vec<f64>,
) -> CMasonStyleRecords {
    let records: Arc<[f64]> = records.into();
    if let Some(node) = node.as_ref() {
        if let Some(mason) = mason.as_mut() {
            return mason.0.set_style_css_records(node.0.id(), kind, records).into();
        }
        node.0.defer_style_css_records(kind, Arc::clone(&records));
    }
    (kind.stores_empty() || !records.is_empty()).then_some(records).into()
}

/// Install deferred paint records after the tree lock has been released.
///
/// # Safety
/// Mason must be a live handle, outside a layout callback.
#[no_mangle]
pub unsafe extern "C" fn mason_css_flush_style_records(mason: *mut crate::CMason) {
    if let Some(mason) = mason.as_mut() {
        mason.0.flush_style_css_records();
    }
}

pub struct CMasonCssFilter(Arc<FilterProgram>);

/// # Safety
/// input is null or valid NUL-terminated CSS. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_filter_parse(input: *const c_char) -> *mut CMasonCssFilter {
    if input.is_null() {
        return ptr::null_mut();
    }
    CStr::from_ptr(input)
        .to_str()
        .ok()
        .map_or(ptr::null_mut(), |css| {
            Box::into_raw(Box::new(CMasonCssFilter(Arc::new(FilterProgram::parse(css)))))
        })
}

pub struct CMasonCssEffects(EffectBatch);

#[repr(C)]
#[derive(Default)]
pub struct CMasonCssEffectView {
    pub value: CMasonCssText,
    pub values: *const f64,
    pub len: usize,
    pub current_color: u32,
    pub present: bool,
    pub filter: *mut CMasonCssFilter,
}

/// Parse and install an ordered effect batch. Pass only the node to defer or
/// two null handles for a detached projection.
/// # Safety
/// Mason and node are null or matching live handles. Input points to input.len valid bytes.
#[no_mangle]
pub unsafe extern "C" fn mason_css_effect_batch_apply(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    input: CMasonCssText,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    current_color: u32,
) -> *mut CMasonCssEffects {
    if input.len == 0 || input.bytes.is_null() {
        return ptr::null_mut();
    }
    let Ok(input) = std::str::from_utf8(std::slice::from_raw_parts(input.bytes, input.len)) else {
        return ptr::null_mut();
    };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let Some(batch) = EffectBatch::parse(input, context, current_color) else {
        return ptr::null_mut();
    };
    if let Some(node) = node.as_ref() {
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_effects(node.0.id(), &batch);
        } else {
            node.0.defer_style_css_effects(&batch);
        }
    }
    Box::into_raw(Box::new(CMasonCssEffects(batch)))
}

/// The view borrows strings and numeric records. Release a returned filter handle separately.
/// # Safety
/// Batch is a live handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_effect_batch_get(
    batch: *const CMasonCssEffects,
    kind: u8,
) -> CMasonCssEffectView {
    let Some(effect) = StyleRecordKind::from_index(kind).and_then(|kind| (*batch).0.get(kind)) else {
        return CMasonCssEffectView::default();
    };
    CMasonCssEffectView {
        value: effect.value.as_str().into(),
        values: effect.records.as_ptr(),
        len: effect.records.len(),
        current_color: effect.current_color,
        present: true,
        filter: effect.filter.as_ref().map_or(ptr::null_mut(), |program| {
            Box::into_raw(Box::new(CMasonCssFilter(Arc::clone(program))))
        }),
    }
}

/// # Safety
/// Batch is null or an owned effect batch.
#[no_mangle]
pub unsafe extern "C" fn mason_css_effect_batch_release(batch: *mut CMasonCssEffects) {
    if !batch.is_null() {
        drop(Box::from_raw(batch));
    }
}

/// # Safety
/// filter is null or an unreleased filter handle returned by this API.
#[no_mangle]
pub unsafe extern "C" fn mason_css_filter_release(filter: *mut CMasonCssFilter) {
    if !filter.is_null() {
        drop(Box::from_raw(filter));
    }
}

/// Resolve a parsed filter for the current units and color. Optional style
/// pointers install the resulting records into that style's filter slot.
///
/// # Safety
/// filter is null or a live handle. Mason and node are matching live handles.
/// Pass only the node to defer installation, or two null handles for a detached
/// projection. Release the returned records once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_filter_project(
    filter: *const CMasonCssFilter,
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    backdrop: bool,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    current_color: u32,
) -> CMasonStyleRecords {
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let records = filter
        .as_ref()
        .map_or_else(Vec::new, |filter| filter.0.records(context, current_color));
    let kind = if backdrop {
        StyleRecordKind::BackdropFilter
    } else {
        StyleRecordKind::Filter
    };
    install_style_records(mason, node, kind, records)
}

/// # Safety
/// The record owner must be an unreleased result from mason_css_set_style_records.
#[no_mangle]
pub unsafe extern "C" fn mason_css_style_records_release(records: CMasonStyleRecords) {
    if !records.owner.is_null() {
        let CMasonCssRecordsOwner(_records) = *Box::from_raw(records.owner);
    }
}

/// Project an existing CSS filter list for the Windows compositor. Release the
/// returned string with mason_util_destroy_string.
///
/// # Safety
/// records is null or points to a live view of filter or backdrop-filter records.
/// Its values must remain valid for the duration of the call.
#[no_mangle]
pub unsafe extern "C" fn mason_css_windows_filter_spec(
    records: *const CMasonStyleRecords,
) -> *mut c_char {
    use mason_core::style::css::{Filter, FilterRecord};
    let Some(records) = records.as_ref() else {
        return ptr::null_mut();
    };
    if records.len == 0 {
        return ptr::null_mut();
    }
    let values = std::slice::from_raw_parts(records.values, records.len);
    let spec = crate::css_filter::windows_filter_spec(
        values
            .chunks_exact(FilterRecord::STRIDE)
            .filter_map(Filter::from_record),
    );
    std::ffi::CString::new(spec).map_or(ptr::null_mut(), std::ffi::CString::into_raw)
}

pub struct CMasonCssTransform(Arc<TransformProgram>);

/// Parse a CSS transform list. Invalid and empty lists return null.
///
/// # Safety
/// Input is null or a valid NUL-terminated C string. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_parse(input: *const c_char) -> *mut CMasonCssTransform {
    if input.is_null() {
        return ptr::null_mut();
    }
    CStr::from_ptr(input)
        .to_str()
        .ok()
        .and_then(TransformProgram::parse)
        .filter(|program| !program.is_empty())
        .map_or(ptr::null_mut(), |program| {
            Box::into_raw(Box::new(CMasonCssTransform(Arc::new(program))))
        })
}

/// # Safety
/// Transform is null or an unreleased transform handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_release(transform: *mut CMasonCssTransform) {
    if !transform.is_null() {
        drop(Box::from_raw(transform));
    }
}

/// # Safety
/// Transform must be a live handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_uses_box_size(transform: *const CMasonCssTransform) -> bool {
    (*transform).0.uses_box_size()
}

/// # Safety
/// Mason and node must be matching live handles. Pass only the node during
/// layout. Transform must be a live handle, or null to clear the property.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_install(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    transform: *const CMasonCssTransform,
) {
    if let Some(node) = node.as_ref() {
        let transform = transform.as_ref().map(|handle| Arc::clone(&handle.0));
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_transform(node.0.id(), transform);
        } else {
            node.0.defer_style_css_transform(transform);
        }
    }
}

/// Compose the stored list for the current border box and units.
///
/// # Safety
/// Transform must be a live handle. Output must point to sixteen writable
/// floats in column-major order.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_matrix(
    transform: *const CMasonCssTransform,
    width: f32,
    height: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    output: *mut f32,
) -> bool {
    let context = LengthContext { scale: 1., font_size, root_font_size, viewport_width, viewport_height };
    let matrix = (*transform).0.matrix(context, width, height);
    if matrix.iter().any(|value| !value.is_finite()) {
        return false;
    }
    ptr::copy_nonoverlapping(matrix.as_ptr(), output, matrix.len());
    true
}

/// Install and project a transform onto the element's plane for a 2D
/// compositor. Reuse the style's parsed list when its input is unchanged.
///
/// # Safety
/// input must be null or a valid NUL-terminated C string. output must be null
/// or a pointer to six writable floats. Mason and node must be matching live
/// handles or both null for a detached projection.
#[no_mangle]
pub unsafe extern "C" fn mason_css_transform_affine(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    input: *const c_char,
    width: f32,
    height: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    output: *mut f32,
) -> bool {
    if input.is_null() || output.is_null() {
        return false;
    }
    let Ok(input) = CStr::from_ptr(input).to_str() else {
        return false;
    };
    let transform = |stored: Option<Arc<TransformProgram>>| {
        stored.filter(|program| program.source() == input)
            .or_else(|| TransformProgram::parse(input).filter(|program| !program.is_empty()).map(Arc::new))
    };
    let program = if let (Some(mason), Some(node)) = (mason.as_mut(), node.as_ref()) {
        let id = node.0.id();
        let mut stored = None;
        mason.0.with_style(id, |style| stored = style.css_transform());
        let program = transform(stored);
        mason.0.set_style_css_transform(id, program.clone());
        program
    } else {
        transform(None)
    };
    let Some(program) = program else {
        return false;
    };
    let context = LengthContext {
        scale: 1.,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let affine = program.affine(context, width, height);
    if affine.iter().any(|value| !value.is_finite()) {
        return false;
    }
    ptr::copy_nonoverlapping(affine.as_ptr(), output, affine.len());
    true
}

pub struct CMasonCssClipPath(Arc<ClipPath>);

/// # Safety
/// Input is null or a valid NUL-terminated C string. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_clip_path_parse(input: *const c_char) -> *mut CMasonCssClipPath {
    if input.is_null() {
        return ptr::null_mut();
    }
    CStr::from_ptr(input)
        .to_str()
        .ok()
        .and_then(ClipPath::parse)
        .map_or(ptr::null_mut(), |clip| Box::into_raw(Box::new(CMasonCssClipPath(Arc::new(clip)))))
}

/// # Safety
/// Clip path is null or an unreleased handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_clip_path_release(clip: *mut CMasonCssClipPath) {
    if !clip.is_null() {
        drop(Box::from_raw(clip));
    }
}

/// # Safety
/// Mason and node must be matching live handles. Pass only the node during
/// layout. Clip must be a live handle, or null to clear the property.
#[no_mangle]
pub unsafe extern "C" fn mason_css_clip_path_install(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    clip: *const CMasonCssClipPath,
) {
    if let Some(node) = node.as_ref() {
        let clip = clip.as_ref().map(|clip| Arc::clone(&clip.0));
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_clip_path(node.0.id(), clip);
        } else {
            node.0.defer_style_css_clip_path(clip);
        }
    }
}

/// # Safety
/// Clip must be a live handle. Release records with mason_css_values_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_clip_path_records(
    clip: *const CMasonCssClipPath,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> CMasonCssValues {
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    CMasonCssValues::from_vec((*clip).0.records(context))
}

/// Get a retained math value for a clip-path length pair in projection order.
/// # Safety
/// Clip must be live. Release a non-null result with mason_css_paint_offset_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_clip_path_offset(
    clip: *const CMasonCssClipPath,
    index: usize,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> *mut CMasonCssPaintOffset {
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    (*clip).0.offset(index).map_or(ptr::null_mut(), |axis| CMasonCssPaintOffset::own(axis, context))
}

/// # Safety
/// Input is null or a valid NUL-terminated string. Release the returned
/// absolute SVG path records with mason_css_values_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_svg_path_records(input: *const c_char) -> CMasonCssValues {
    let values = if input.is_null() {
        Vec::new()
    } else {
        CStr::from_ptr(input).to_str().map_or_else(|_| Vec::new(), parse_svg_path)
    };
    CMasonCssValues::from_vec(values)
}

pub struct CMasonCssGradient(Arc<Gradient>);

#[repr(C)]
#[derive(Default)]
pub struct CMasonCssText {
    pub bytes: *const u8,
    pub len: usize,
}

impl From<&str> for CMasonCssText {
    fn from(value: &str) -> Self {
        Self {
            bytes: value.as_ptr(),
            len: value.len(),
        }
    }
}

pub struct CMasonCssShorthandOwner {
    _strings: Vec<String>,
    fields: Box<[CMasonCssText]>,
}

#[repr(C)]
pub struct CMasonCssShorthand {
    pub data: *const CMasonCssText,
    pub len: usize,
    pub owner: *mut CMasonCssShorthandOwner,
}

impl CMasonCssShorthand {
    const EMPTY: Self = Self { data: ptr::null(), len: 0, owner: ptr::null_mut() };

    fn from_strings(strings: Vec<String>) -> Self {
        let fields = strings.iter().map(|value| CMasonCssText::from(value.as_str())).collect();
        let owner = Box::new(CMasonCssShorthandOwner { _strings: strings, fields });
        Self { data: owner.fields.as_ptr(), len: owner.fields.len(), owner: Box::into_raw(owner) }
    }
}

/// Install a typed text-overflow value, or enqueue it when called during layout.
///
/// # Safety
/// Node and non-null Mason must be live matching handles. Token points to
/// `len` valid UTF-8 bytes and may be null when its length is zero.
#[no_mangle]
pub unsafe extern "C" fn mason_css_text_overflow_set(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    kind: u8,
    token: CMasonCssText,
) {
    use mason_core::style::css::text_overflow::TextOverflow;
    let Some(node) = node.as_ref() else { return; };
    let token = if kind >= 2 {
        let Some(text) = read_css_text(&token) else { return; };
        Some(Arc::from(text))
    } else {
        None
    };
    let Some(overflow) = TextOverflow::new(kind, token) else { return; };
    if let Some(mason) = mason.as_mut() {
        mason.0.set_style_text_overflow(node.0.id(), overflow);
    } else {
        node.0.defer_style_text_overflow(overflow);
    }
}

unsafe fn read_css_text(text: &CMasonCssText) -> Option<&str> {
    if text.len == 0 {
        return Some("");
    }
    if text.bytes.is_null() {
        return None;
    }
    std::str::from_utf8(std::slice::from_raw_parts(text.bytes, text.len)).ok()
}

/// # Safety
/// Text points to `len` bytes or has length zero. Release a returned token once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_text_overflow_detached(text: CMasonCssText) -> u64 {
    read_css_text(&text).map_or(0, |value| mason_core::style::css::text_overflow::new_detached(Arc::from(value)))
}

#[no_mangle]
pub extern "C" fn mason_css_text_overflow_release_detached(key: u64) {
    mason_core::style::css::text_overflow::release_detached(key);
}

/// Copy the UTF-8 text for a style token. Release any non-null owner once.
#[no_mangle]
pub extern "C" fn mason_css_text_overflow_token(key: u64) -> CMasonCssShorthand {
    mason_core::style::css::text_overflow::lookup(key).map_or(CMasonCssShorthand::EMPTY, |text| {
        CMasonCssShorthand::from_strings(vec![text.to_string()])
    })
}

/// Expand a supported shorthand into CSS text in its longhand order.
///
/// # Safety
/// Both inputs must be valid NUL-terminated strings. Release a non-null owner once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_shorthand_expand(
    name: *const c_char,
    value: *const c_char,
) -> CMasonCssShorthand {
    if name.is_null() || value.is_null() {
        return CMasonCssShorthand::EMPTY;
    }
    let (Ok(name), Ok(value)) = (CStr::from_ptr(name).to_str(), CStr::from_ptr(value).to_str()) else {
        return CMasonCssShorthand::EMPTY;
    };
    let Some(strings) = mason_core::style::css::shorthand::expand(name, value) else {
        return CMasonCssShorthand::EMPTY;
    };
    CMasonCssShorthand::from_strings(strings)
}

/// Compile an ordered inline declaration list with the element's unit context.
///
/// # Safety
/// The input must be null or a valid NUL-terminated string. Release the returned owner once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_compile_inline(
    input: *const c_char,
    scale: f32,
    font_size: f32,
    parent_font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    viewport_refresh: bool,
) -> CMasonCssShorthand {
    if input.is_null() {
        return CMasonCssShorthand::EMPTY;
    }
    let Ok(input) = CStr::from_ptr(input).to_str() else {
        return CMasonCssShorthand::EMPTY;
    };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    CMasonCssShorthand::from_strings(mason_core::style::css::compile_inline_style(
        input, context, parent_font_size, viewport_refresh,
    ))
}

/// Compile inline CSS with a dependency header for viewport replay. Pass NaN
/// as previous_font_size when applying the declaration list for the first time.
/// # Safety
/// The input must be null or a valid NUL-terminated string. Release the returned owner once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_compile_inline_replay(
    input: *const c_char,
    scale: f32,
    font_size: f32,
    parent_font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    previous_font_size: f32,
) -> CMasonCssShorthand {
    if input.is_null() {
        return CMasonCssShorthand::EMPTY;
    }
    let Ok(input) = CStr::from_ptr(input).to_str() else {
        return CMasonCssShorthand::EMPTY;
    };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    CMasonCssShorthand::from_strings(mason_core::style::css::compile_inline_style_replay(
        input, context, parent_font_size, previous_font_size.is_finite().then_some(previous_font_size),
    ))
}

/// # Safety
/// Owner is null or an unreleased result from a function returning CMasonCssShorthand.
#[no_mangle]
pub unsafe extern "C" fn mason_css_shorthand_release(owner: *mut CMasonCssShorthandOwner) {
    if !owner.is_null() {
        drop(Box::from_raw(owner));
    }
}

#[repr(C)]
pub struct CMasonCssGradientInfo {
    /// 0 = linear, 1 = radial, 2 = conic.
    pub kind: u8,
    pub repeating: bool,
    pub stop_count: usize,
    pub direction: CMasonCssText,
    pub space: CMasonCssText,
    pub hue: CMasonCssText,
}

#[repr(C)]
pub struct CMasonCssGradientStop {
    pub color: u32,
    pub position: f32,
}

/// # Safety
/// Input is null or a valid NUL-terminated string. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_gradient_parse(
    input: *const c_char,
    current_color: u32,
) -> *mut CMasonCssGradient {
    if input.is_null() {
        return ptr::null_mut();
    }
    let Ok(value) = CStr::from_ptr(input).to_str() else {
        return ptr::null_mut();
    };
    mason_core::style::css::gradient::parse_gradient(value, current_color)
        .map_or(ptr::null_mut(), |value| {
            Box::into_raw(Box::new(CMasonCssGradient(Arc::new(value))))
        })
}

/// # Safety
/// Gradient is null or an owned handle from mason_css_gradient_parse.
#[no_mangle]
pub unsafe extern "C" fn mason_css_gradient_release(gradient: *mut CMasonCssGradient) {
    if !gradient.is_null() {
        drop(Box::from_raw(gradient));
    }
}

/// # Safety
/// Gradient must be a live handle. Text slices in the result borrow the handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_gradient_info(
    gradient: *const CMasonCssGradient,
) -> CMasonCssGradientInfo {
    use mason_core::style::css::gradient::GradientKind;
    let value = &(*gradient).0;
    let (space, hue) = value.interpolation.as_ref().map_or(("", ""), |method| {
        (method.space.as_str(), method.hue.as_deref().unwrap_or(""))
    });
    CMasonCssGradientInfo {
        kind: match value.kind {
            GradientKind::Linear => 0,
            GradientKind::Radial => 1,
            GradientKind::Conic => 2,
        },
        repeating: value.repeating,
        stop_count: value.stops.len(),
        direction: value.direction.as_str().into(),
        space: space.into(),
        hue: hue.into(),
    }
}

/// Resolve gradient stops into a buffer sized from mason_css_gradient_info.
/// line_length and scale must use the same output unit.
///
/// # Safety
/// Gradient must be a live handle. Output points to at least stop_count writable records.
#[no_mangle]
pub unsafe extern "C" fn mason_css_gradient_resolve(
    gradient: *const CMasonCssGradient,
    line_length: f32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    output: *mut CMasonCssGradientStop,
) {
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    for (index, (color, position)) in (*gradient)
        .0
        .resolve_stops(line_length, context)
        .into_iter()
        .enumerate()
    {
        output
            .add(index)
            .write(CMasonCssGradientStop { color, position });
    }
}

#[repr(C)]
pub struct CMasonCssGradientLayout {
    pub angle: f32,
    pub corner_x: f32,
    pub corner_y: f32,
    pub center_x: f32,
    pub center_y: f32,
    pub radius_x: f32,
    pub radius_y: f32,
}

/// # Safety
/// Gradient must be a live handle. Width, height and scale use the same output unit.
#[no_mangle]
pub unsafe extern "C" fn mason_css_gradient_layout(
    gradient: *const CMasonCssGradient,
    width: f32,
    height: f32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> CMasonCssGradientLayout {
    let layout = (*gradient).0.layout(
        width,
        height,
        LengthContext {
            scale,
            font_size,
            root_font_size,
            viewport_width,
            viewport_height,
        },
    );
    CMasonCssGradientLayout {
        angle: layout.angle,
        corner_x: layout.corner[0],
        corner_y: layout.corner[1],
        center_x: layout.center[0],
        center_y: layout.center[1],
        radius_x: layout.radii[0],
        radius_y: layout.radii[1],
    }
}

pub struct CMasonCssBackground {
    layers: Box<[CMasonCssBackgroundLayer]>,
    context: LengthContext,
    program: BackgroundProgram,
}

impl CMasonCssBackground {
    fn project(&mut self) {
        self.layers = self.program.layers().iter()
            .map(|layer| CMasonCssBackgroundLayer::project(layer, self.context))
            .collect();
    }

    fn apply_longhand(&mut self, values: &[LayerProperty]) {
        self.program.apply(values);
        self.project();
    }

    fn project_mobile(&mut self, scale: f32, font_size: f32, width: f32, height: f32) {
        self.context = LengthContext {
            scale,
            font_size,
            root_font_size: font_size,
            viewport_width: width,
            viewport_height: height,
        };
        self.project();
    }
}

pub struct CMasonCssBackgroundLonghand(Box<[LayerProperty]>);

/// # Safety
/// Both text inputs must be valid NUL-terminated strings. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_longhand_parse(
    property: *const c_char,
    value: *const c_char,
    allow_invalid_entries: bool,
) -> *mut CMasonCssBackgroundLonghand {
    let (Ok(property), Ok(value)) = (
        CStr::from_ptr(property).to_str(),
        CStr::from_ptr(value).to_str(),
    ) else {
        return ptr::null_mut();
    };
    parse_layer_properties(property, value, allow_invalid_entries).map_or(
        ptr::null_mut(),
        |values| {
            Box::into_raw(Box::new(CMasonCssBackgroundLonghand(
                values.into_boxed_slice(),
            )))
        },
    )
}

/// Resolve a parsed longhand to six-number records. Release the result with
/// mason_css_values_release.
///
/// # Safety
/// longhand must be a live handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_longhand_records(
    longhand: *const CMasonCssBackgroundLonghand,
    scale: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> CMasonCssValues {
    let context = LengthContext {
        scale,
        font_size: root_font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let longhand = &*longhand;
    CMasonCssValues::from_vec(
        longhand
            .0
            .iter()
            .flat_map(|value| value.record(context))
            .collect(),
    )
}

/// # Safety
/// longhand is null or an unreleased handle from mason_css_background_longhand_parse.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_longhand_release(
    longhand: *mut CMasonCssBackgroundLonghand,
) {
    if !longhand.is_null() {
        drop(Box::from_raw(longhand));
    }
}

#[derive(Clone)]
pub struct CMasonCssPaintOffset {
    axis: Axis,
    context: LengthContext,
}

impl CMasonCssPaintOffset {
    fn own(axis: &Axis, context: LengthContext) -> *mut Self {
        if !axis.has_math() {
            return ptr::null_mut();
        }
        Box::into_raw(Box::new(Self { axis: axis.clone(), context }))
    }
}

/// Get a retained math offset from a standalone parsed longhand.
/// # Safety
/// The longhand must be live. Release a non-null result with mason_css_paint_offset_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_longhand_offset(
    longhand: *const CMasonCssBackgroundLonghand,
    index: usize,
    scale: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> *mut CMasonCssPaintOffset {
    let context = LengthContext {
        scale, font_size: root_font_size, root_font_size, viewport_width, viewport_height,
    };
    (*longhand).0.first().and_then(|value| value.offset(index))
        .map_or(ptr::null_mut(), |axis| CMasonCssPaintOffset::own(axis, context))
}

/// # Safety
/// The offset must be a live program borrowed from a paint record. Release the result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_paint_offset_retain(
    offset: *const CMasonCssPaintOffset,
) -> *mut CMasonCssPaintOffset {
    Box::into_raw(Box::new((*offset).clone()))
}

/// # Safety
/// The offset is null or an owned handle. Borrowed paint record pointers are released by Rust.
#[no_mangle]
pub unsafe extern "C" fn mason_css_paint_offset_release(offset: *mut CMasonCssPaintOffset) {
    if !offset.is_null() {
        drop(Box::from_raw(offset));
    }
}

/// Resolve against a size or the free space after laying out a tile.
/// Pass a zero scale to use the record's original unit context.
/// # Safety
/// The offset must be live.
#[no_mangle]
pub unsafe extern "C" fn mason_css_paint_offset_resolve(
    offset: *const CMasonCssPaintOffset,
    basis: f32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> f32 {
    let offset = &*offset;
    let context = if scale > 0. {
        LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height }
    } else {
        offset.context
    };
    offset.axis.resolve(basis, context)
}

/// # Safety
/// The offset must be live. Release a non-null result with mason_util_destroy_string.
#[no_mangle]
pub unsafe extern "C" fn mason_css_paint_offset_text(
    offset: *const CMasonCssPaintOffset,
    horizontal: bool,
) -> *mut c_char {
    (*offset).axis.math_text(horizontal)
        .and_then(|text| std::ffi::CString::new(text).ok())
        .map_or(ptr::null_mut(), std::ffi::CString::into_raw)
}

#[repr(C)]
#[derive(Default)]
pub struct CMasonCssOffset {
    pub fraction: f32,
    pub pixels: f32,
    pub present: bool,
    /// Borrowed for the lifetime of this record.
    pub math: *const CMasonCssPaintOffset,
}

impl CMasonCssOffset {
    fn project(axis: Option<&Axis>, context: LengthContext) -> Self {
        let Some(axis) = axis else { return Self::default(); };
        let (fraction, pixels) = axis.components(context);
        Self { fraction, pixels, present: true, math: CMasonCssPaintOffset::own(axis, context) }
    }
}

impl Drop for CMasonCssOffset {
    fn drop(&mut self) {
        unsafe { mason_css_paint_offset_release(self.math.cast_mut()); }
    }
}

#[repr(C)]
pub struct CMasonCssBackgroundLayer {
    /// 0 = no image, 1 = URL, 2 = CSS gradient.
    pub image_kind: u8,
    pub image: CMasonCssText,
    pub has_color: bool,
    pub color: u32,
    pub repeat_x: u8,
    pub repeat_y: u8,
    pub position_x: CMasonCssOffset,
    pub position_y: CMasonCssOffset,
    /// 0 = omitted, 1 = explicit, 2 = contain, 3 = cover.
    pub size_kind: u8,
    pub width: CMasonCssOffset,
    pub height: CMasonCssOffset,
    pub origin: u8,
    pub clip: u8,
    pub attachment: u8,
    pub blend: u8,
}

impl CMasonCssBackgroundLayer {
    fn project(layer: &Layer, context: LengthContext) -> Self {
        let (image_kind, url) = match &layer.image {
            Some(Image::Url(url)) => (1, url.as_ref()),
            Some(Image::Gradient(_)) => (2, ""),
            None => (0, ""),
        };
        let [position_x, position_y, width, height] = layer.offsets().map(|axis| CMasonCssOffset::project(axis, context));
        let size_kind = match layer.size {
            None => 0,
            Some(Size::Explicit(_)) => 1,
            Some(Size::Contain) => 2,
            Some(Size::Cover) => 3,
        };
        Self {
            image_kind,
            image: url.into(),
            has_color: layer.color.is_some(),
            color: layer.color.unwrap_or_default(),
            repeat_x: layer.repeat[0] as u8,
            repeat_y: layer.repeat[1] as u8,
            position_x,
            position_y,
            size_kind,
            width,
            height,
            origin: layer.origin as u8,
            clip: layer.clip as u8,
            attachment: layer.attachment as u8,
            blend: layer.blend as u8,
        }
    }
}

#[repr(C)]
pub struct CMasonCssBackgroundLayers {
    pub data: *const CMasonCssBackgroundLayer,
    pub count: usize,
}

pub struct CMasonCssMask {
    source: Arc<[MaskLayer]>,
    layers: Box<[CMasonCssMaskLayer]>,
}

#[repr(C)]
pub struct CMasonCssMaskLayer {
    pub paint: CMasonCssBackgroundLayer,
    pub clip: u8,
    pub mode: u8,
    pub composite: u8,
}

#[repr(C)]
pub struct CMasonCssMaskLayers {
    pub data: *const CMasonCssMaskLayer,
    pub count: usize,
}

/// Parse the eight mask layer longhands in image, size, position, repeat,
/// origin, clip, mode, composite order. Invalid image slots remain transparent.
///
/// # Safety
/// Input must point to eight null or valid NUL-terminated string pointers.
/// Release a non-null result with mason_css_mask_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_parse(
    input: *const *const c_char,
    current_color: u32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> *mut CMasonCssMask {
    let mut values = [""; LONGHAND_COUNT];
    for (value, &input) in values.iter_mut().zip(std::slice::from_raw_parts(input, LONGHAND_COUNT)) {
        if !input.is_null() {
            let Ok(css) = CStr::from_ptr(input).to_str() else { return ptr::null_mut(); };
            *value = css;
        }
    }
    let Some(parsed) = parse_mask_layers(values, current_color, false) else { return ptr::null_mut(); };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let layers = parsed.iter().map(|layer| CMasonCssMaskLayer {
        paint: CMasonCssBackgroundLayer::project(&layer.paint, context),
        clip: layer.clip as u8,
        mode: layer.mode as u8,
        composite: layer.composite as u8,
    }).collect();
    Box::into_raw(Box::new(CMasonCssMask { source: parsed.into(), layers }))
}

/// # Safety
/// Mask must be a live handle. The result borrows the layers and image strings.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_layers(mask: *const CMasonCssMask) -> CMasonCssMaskLayers {
    let mask = &*mask;
    CMasonCssMaskLayers { data: mask.layers.as_ptr(), count: mask.layers.len() }
}

/// # Safety
/// Mask must be a live handle. Release a non-null result with mason_css_gradient_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_gradient(mask: *const CMasonCssMask, index: usize) -> *mut CMasonCssGradient {
    let mask = &*mask;
    match mask.source.get(index).and_then(|layer| layer.paint.image.as_ref()) {
        Some(Image::Gradient(Some(gradient))) => Box::into_raw(Box::new(CMasonCssGradient(Arc::clone(gradient)))),
        _ => ptr::null_mut(),
    }
}

/// # Safety
/// Mason and node must be matching live handles. Pass only a node during a
/// layout pass. Mask must be a live handle, or null to clear the layers.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_install(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    mask: *const CMasonCssMask,
) {
    if let Some(node) = node.as_ref() {
        let layers = mask.as_ref().map(|mask| Arc::clone(&mask.source));
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_mask(node.0.id(), layers);
        } else {
            node.0.defer_style_css_mask(layers);
        }
    }
}

/// # Safety
/// Mask is null or an unreleased handle from mason_css_mask_parse.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_release(mask: *mut CMasonCssMask) {
    if !mask.is_null() {
        drop(Box::from_raw(mask));
    }
}

pub struct CMasonCssNineSlice(Arc<NineSlice>);

/// Parse the border-image shorthand. A valid declaration with no image still returns a handle.
///
/// # Safety
/// Input must be a valid NUL-terminated string. Release the result with mason_css_nine_slice_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_border_image_parse(
    input: *const c_char,
    color: u32,
) -> *mut CMasonCssNineSlice {
    let Some(value) = input.as_ref().and_then(|_| CStr::from_ptr(input).to_str().ok()) else {
        return ptr::null_mut();
    };
    nine_slice::parse_shorthand(value, NineSliceKind::BorderImage, color)
        .map_or(ptr::null_mut(), |spec| Box::into_raw(Box::new(CMasonCssNineSlice(Arc::new(spec)))))
}

/// Parse mask-border longhands in source, slice, width, outset, repeat, mode order.
///
/// # Safety
/// Input must point to six null or valid NUL-terminated string pointers.
/// Release the result with mason_css_nine_slice_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_mask_border_parse(
    input: *const *const c_char,
    color: u32,
) -> *mut CMasonCssNineSlice {
    if input.is_null() {
        return ptr::null_mut();
    }
    let mut values = [""; nine_slice::LONGHAND_COUNT];
    for (value, &input) in values.iter_mut().zip(std::slice::from_raw_parts(input, nine_slice::LONGHAND_COUNT)) {
        if !input.is_null() {
            let Ok(css) = CStr::from_ptr(input).to_str() else { return ptr::null_mut() };
            *value = css;
        }
    }
    nine_slice::parse_longhands(values, NineSliceKind::MaskBorder, color, false)
        .map_or(ptr::null_mut(), |spec| Box::into_raw(Box::new(CMasonCssNineSlice(Arc::new(spec)))))
}

/// # Safety
/// Spec is null or a live handle. Release returned values with mason_css_values_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_values(
    spec: *const CMasonCssNineSlice,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> CMasonCssValues {
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let values = spec.as_ref().map_or_else(Vec::new, |spec| spec.0.records(context).to_vec());
    CMasonCssValues::from_vec(values)
}

/// Get a retained width formula, indexed in top/right/bottom/left order.
/// # Safety
/// Spec is null or a live handle. Release a non-null result with mason_css_paint_offset_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_width_offset(
    spec: *const CMasonCssNineSlice,
    index: usize,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> *mut CMasonCssPaintOffset {
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    spec.as_ref().and_then(|spec| spec.0.width_offset(index))
        .map_or(ptr::null_mut(), |axis| CMasonCssPaintOffset::own(axis, context))
}

/// # Safety
/// Spec is null or a live handle. The returned source declaration borrows from the spec.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_source(spec: *const CMasonCssNineSlice) -> CMasonCssText {
    spec.as_ref().and_then(|spec| spec.0.source.as_ref())
        .map_or("".into(), |(source, _)| source.as_str().into())
}

/// # Safety
/// Spec is null or a live handle. The returned URL borrows from the spec.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_url(spec: *const CMasonCssNineSlice) -> CMasonCssText {
    match spec.as_ref().and_then(|spec| spec.0.source.as_ref()) {
        Some((_, Image::Url(url))) => url.as_ref().into(),
        _ => "".into(),
    }
}

/// # Safety
/// Spec is null or a live handle. Release the result with mason_css_gradient_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_gradient(spec: *const CMasonCssNineSlice) -> *mut CMasonCssGradient {
    match spec.as_ref().and_then(|spec| spec.0.source.as_ref()) {
        Some((_, Image::Gradient(Some(gradient)))) => Box::into_raw(Box::new(CMasonCssGradient(Arc::clone(gradient)))),
        _ => ptr::null_mut(),
    }
}

/// # Safety
/// Mason and node must be matching live handles. Pass only a node during a
/// layout pass. Spec must be a live handle or null to clear this group.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_install(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    spec: *const CMasonCssNineSlice,
    mask: bool,
) {
    if let Some(node) = node.as_ref() {
        let value = spec.as_ref().map(|spec| Arc::clone(&spec.0));
        let kind = if mask { NineSliceKind::MaskBorder } else { NineSliceKind::BorderImage };
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_nine_slice(node.0.id(), kind, value);
        } else {
            node.0.defer_style_css_nine_slice(kind, value);
        }
    }
}

/// # Safety
/// Spec is null or an unreleased handle from a nine-slice parse function.
#[no_mangle]
pub unsafe extern "C" fn mason_css_nine_slice_release(spec: *mut CMasonCssNineSlice) {
    if !spec.is_null() {
        drop(Box::from_raw(spec));
    }
}

/// Creates an empty background. Release the result once.
#[no_mangle]
pub extern "C" fn mason_css_background_create() -> *mut CMasonCssBackground {
    Box::into_raw(Box::new(CMasonCssBackground {
        layers: Box::new([]),
        context: LengthContext {
            scale: 1.,
            font_size: 0.,
            root_font_size: 0.,
            viewport_width: 0.,
            viewport_height: 0.,
        },
        program: BackgroundProgram::default(),
    }))
}

/// # Safety
/// Input is null or a valid NUL-terminated string. Release a non-null result once.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_parse(
    input: *const c_char,
    current_color: u32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> *mut CMasonCssBackground {
    if input.is_null() {
        return ptr::null_mut();
    }
    let Ok(value) = CStr::from_ptr(input).to_str() else {
        return ptr::null_mut();
    };
    let Some(program) = BackgroundProgram::parse(value, current_color) else {
        return ptr::null_mut();
    };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let mut value = Box::new(CMasonCssBackground {
        layers: Box::new([]),
        context,
        program,
    });
    value.project();
    Box::into_raw(value)
}

/// Replace the layers, retaining authored mobile longhands.
/// Returns the ARGB shorthand color, -1 for no color, or -2 for invalid input.
/// # Safety
/// Background is a live exclusive handle and input is NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_mobile_replace(
    background: *mut CMasonCssBackground,
    input: *const c_char,
    current_color: u32,
    scale: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> i64 {
    let background = &mut *background;
    let Some(color) = CStr::from_ptr(input).to_str().ok()
        .and_then(|value| background.program.replace_mobile(value, current_color))
    else {
        return -2;
    };
    background.project_mobile(scale, root_font_size, viewport_width, viewport_height);
    color.map_or(-1, i64::from)
}

/// Save an authored longhand. Returns -1 for invalid input, 0 if only the
/// saved longhands changed, and 1 if the current layers were also updated.
/// # Safety
/// Background is a live exclusive handle and text inputs are NUL-terminated.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_mobile_set_longhand(
    background: *mut CMasonCssBackground,
    property: *const c_char,
    value: *const c_char,
    scale: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
) -> i32 {
    let (Ok(property), Ok(value)) = (CStr::from_ptr(property).to_str(), CStr::from_ptr(value).to_str()) else {
        return -1;
    };
    let background = &mut *background;
    match background.program.set_mobile_longhand(property, value) {
        None => -1,
        Some(false) => 0,
        Some(true) => {
            background.project_mobile(scale, root_font_size, viewport_width, viewport_height);
            1
        }
    }
}

/// Applies a UTF-8 batch of background declarations and writes the final update fields.
/// # Safety
/// Background is a live exclusive handle. Input points to input.len valid bytes.
/// Result points to result_len writable i64s and does not overlap the input or handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_mobile_apply(
    background: *mut CMasonCssBackground,
    input: CMasonCssText,
    current_color: u32,
    scale: f32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    result: *mut i64,
    result_len: usize,
) -> bool {
    use mason_core::style::css::CssBackgroundResultRecord as Result;
    if result_len != Result::STRIDE || input.len == 0 || input.bytes.is_null() {
        return false;
    }
    let Ok(input) = std::str::from_utf8(std::slice::from_raw_parts(input.bytes, input.len)) else {
        return false;
    };
    let background = &mut *background;
    let Some(fields) = background.program.apply_mobile_batch(input, current_color) else {
        return false;
    };
    if fields[Result::LAYERS_CHANGED] != 0 {
        background.context = LengthContext {
            scale, font_size, root_font_size, viewport_width, viewport_height,
        };
        background.project();
    }
    std::slice::from_raw_parts_mut(result, result_len).copy_from_slice(&fields);
    true
}

/// Applies a desktop background batch, returning a new snapshot for the renderer.
/// # Safety
/// Previous is null or a live background handle. Input points to input.len valid bytes.
/// Result points to result_len writable i64s and does not overlap the input or previous handle.
/// Release a non-null result with mason_css_background_release.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_desktop_update(
    previous: *const CMasonCssBackground,
    input: CMasonCssText,
    current_color: u32,
    font_size: f32,
    root_font_size: f32,
    viewport_width: f32,
    viewport_height: f32,
    result: *mut i64,
    result_len: usize,
) -> *mut CMasonCssBackground {
    use mason_core::style::css::CssBackgroundResultRecord as Result;
    if result_len != Result::STRIDE || input.len == 0 || input.bytes.is_null() {
        return ptr::null_mut();
    }
    let Ok(input) = std::str::from_utf8(std::slice::from_raw_parts(input.bytes, input.len)) else {
        return ptr::null_mut();
    };
    let mut program = previous.as_ref().map_or_else(BackgroundProgram::default, |old| old.program.clone());
    let Some(fields) = program.apply_batch(input, current_color, BackgroundTarget::Desktop) else {
        return ptr::null_mut();
    };
    let mut background = Box::new(CMasonCssBackground {
        layers: Box::new([]),
        context: LengthContext { scale: 1., font_size, root_font_size, viewport_width, viewport_height },
        program,
    });
    background.project();
    std::slice::from_raw_parts_mut(result, result_len).copy_from_slice(&fields);
    Box::into_raw(background)
}

/// Apply one longhand, cycling its values across layers. Invalid lists leave
/// all the layers unchanged.
///
/// # Safety
/// Background is an exclusively owned live handle. Text inputs are valid
/// NUL-terminated strings. Prior borrows of the layer records must end first.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_set_longhand(
    background: *mut CMasonCssBackground,
    property: *const c_char,
    value: *const c_char,
) -> bool {
    let (Ok(property), Ok(value)) = (
        CStr::from_ptr(property).to_str(),
        CStr::from_ptr(value).to_str(),
    ) else {
        return false;
    };
    let Some(values) = parse_longhand(property, value) else {
        return false;
    };
    (*background).apply_longhand(&values);
    true
}

/// # Safety
/// Both handles must be live. End any borrowed layer reads before applying a longhand.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_apply_longhand(
    background: *mut CMasonCssBackground,
    longhand: *const CMasonCssBackgroundLonghand,
) {
    (*background).apply_longhand(&(*longhand).0);
}

/// # Safety
/// Background must be a live handle. End any borrowed layer reads first.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_retain_mobile_layers(background: *mut CMasonCssBackground) {
    let background = &mut *background;
    background.program.retain_mobile_layers();
    background.project();
}

/// Shares a parsed layer's stops with a renderer. Release a non-null result
/// once with mason_css_gradient_release.
///
/// # Safety
/// Background must be a live handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_gradient(
    background: *const CMasonCssBackground,
    index: usize,
) -> *mut CMasonCssGradient {
    let background = &*background;
    match background.program.layers().get(index).and_then(|layer| layer.image.as_ref()) {
        Some(Image::Gradient(Some(gradient))) => {
            Box::into_raw(Box::new(CMasonCssGradient(Arc::clone(gradient))))
        }
        _ => ptr::null_mut(),
    }
}

/// # Safety
/// Mason and node must be matching live handles. Pass only a node during a
/// layout pass. Background must be a live handle, or null to clear the layers.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_install(
    mason: *mut crate::CMason,
    node: *const crate::CMasonNode,
    background: *const CMasonCssBackground,
) {
    if let Some(node) = node.as_ref() {
        let layers = background.as_ref().map_or_else(|| Arc::from([]), |value| Arc::clone(value.program.layers()));
        if let Some(mason) = mason.as_mut() {
            mason.0.set_style_css_background(node.0.id(), layers);
        } else {
            node.0.defer_style_css_background(layers);
        }
    }
}

/// # Safety
/// Background must be a live handle. The result borrows its layers and image strings.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_layers(
    background: *const CMasonCssBackground,
) -> CMasonCssBackgroundLayers {
    let background = &*background;
    CMasonCssBackgroundLayers {
        data: background.layers.as_ptr(),
        count: background.layers.len(),
    }
}

/// # Safety
/// Background is null or an owned background handle.
#[no_mangle]
pub unsafe extern "C" fn mason_css_background_release(background: *mut CMasonCssBackground) {
    if !background.is_null() {
        drop(Box::from_raw(background));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CString;

    #[test]
    fn layout_length_crosses_the_c_boundary_without_losing_its_percentage() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let parent = mason.0.create_node();
        let child = crate::CMasonNode(mason.0.create_node());
        mason.0.with_style_mut(parent.id(), |style| {
            style.set_display(mason_core::Display::Flex);
            style.set_flex_direction(mason_core::FlexDirection::Column);
            style.set_width(mason_core::Dimension::length(120.));
        });
        mason.0.append_node(parent.id(), &[child.0.id()]);
        unsafe {
            assert!(mason_css_apply_layout_length(
                &mut mason, &child, c"width".as_ptr(), c"calc(100% - 12px)".as_ptr(), 16., 16., 0., 0.,
            ));
            assert!(!mason_css_apply_layout_length(
                &mut mason, &child, c"width".as_ptr(), c"calc(100% - )".as_ptr(), 16., 16., 0., 0.,
            ));
            let css = mason_css_copy_layout_length(&mason, &child, c"width".as_ptr());
            assert!(!css.is_null());
            assert_eq!(CStr::from_ptr(css), c"calc(100% - 12px)");
            crate::util::mason_util_destroy_string(css);
            assert!(mason_css_apply_layout_length_for_state(
                &mut mason, &child, 1, c"width".as_ptr(), c"calc(50% + 2px)".as_ptr(), 16., 16., 0., 0.,
            ));
            let css = mason_css_copy_layout_length_for_state(&mason, &child, 1, c"width".as_ptr());
            assert!(!css.is_null());
            assert_eq!(CStr::from_ptr(css), c"calc(50% + 2px)");
            crate::util::mason_util_destroy_string(css);
        }
        mason.0.compute_wh(parent.id(), 120., 200.);
        assert_eq!(mason.0.layout_raw(child.0.id()).size.width, 108.);
        mason.0.set_pseudo_states(child.0.id(), 1);
        mason.0.compute_wh(parent.id(), 120., 200.);
        assert_eq!(mason.0.layout_raw(child.0.id()).size.width, 62.);
    }

    #[test]
    fn deferred_effect_batch_keeps_its_records_and_filter_after_release() {
        use mason_core::style::css::FilterRecord;

        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        unsafe {
            let batch = mason_css_effect_batch_apply(
                ptr::null_mut(), &node, "filter\0drop-shadow(1em 2px currentColor)\0".into(),
                1., 16., 16., 0., 0., 0xff123456,
            );
            assert!(!batch.is_null());
            let effect = mason_css_effect_batch_get(batch, StyleRecordKind::Filter as u8);
            assert!(effect.present && !effect.filter.is_null());
            let values = effect.values;
            mason_css_effect_batch_release(batch);

            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| {
                let records = style.css_records(StyleRecordKind::Filter).unwrap();
                assert_eq!(records.as_ptr(), values);
                assert_eq!(records[FilterRecord::COLOR], f64::from(0xff123456u32));
                assert!(style.css_records(StyleRecordKind::BoxShadow).is_none());
            });
            let projected = mason_css_filter_project(
                effect.filter, ptr::null_mut(), ptr::null(), false, 1., 24., 16., 0., 0., 0xffabcdef,
            );
            mason_css_filter_release(effect.filter);
            let records = std::slice::from_raw_parts(projected.values, projected.len);
            assert_eq!(records[FilterRecord::AMOUNT_OR_X], 24.);
            assert_eq!(records[FilterRecord::COLOR], f64::from(0xffabcdefu32));
            mason_css_style_records_release(projected);
        }
    }

    #[test]
    fn shorthand_boundary_keeps_longhand_order_and_unicode_values() {
        unsafe fn values(fields: &CMasonCssShorthand) -> Vec<&str> {
            std::slice::from_raw_parts(fields.data, fields.len).iter().map(|field| {
                std::str::from_utf8(std::slice::from_raw_parts(field.bytes, field.len)).unwrap()
            }).collect()
        }
        unsafe {
            let mask = mason_css_shorthand_expand(c"-webkit-mask".as_ptr(), c"url(é.svg) center / contain padding xor".as_ptr());
            assert!(!mask.owner.is_null());
            assert_eq!(values(&mask), [
                "url(é.svg)", "contain", "center", "repeat", "padding-box", "padding-box", "match-source", "exclude",
            ]);
            mason_css_shorthand_release(mask.owner);

            let border = mason_css_shorthand_expand(c"-webkit-mask-box-image".as_ptr(), c"url(é.svg) 25% / / 4px".as_ptr());
            assert!(!border.owner.is_null());
            assert_eq!(values(&border), ["url(é.svg)", "25%", "auto", "4px", "stretch", "alpha"]);
            mason_css_shorthand_release(border.owner);

            let background = mason_css_shorthand_expand(c"background".as_ptr(), c"url(é.svg) center / cover red".as_ptr());
            assert!(!background.owner.is_null());
            assert_eq!(values(&background), ["red", "url(é.svg)", "", "center", "cover", "", "", ""]);
            mason_css_shorthand_release(background.owner);

            let invalid = mason_css_shorthand_expand(c"mask-border".as_ptr(), c"url(a.svg) fill 30 fill".as_ptr());
            assert!(invalid.owner.is_null());
            assert_eq!(invalid.len, 0);
        }
    }

    #[test]
    fn image_borders_retain_independent_rust_values_and_project_units() {
        use mason_core::style::css::{NineSliceRecord as Layout, NineSliceSideRecord as Side};
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let border = mason_css_border_image_parse(c"url(a) 10% / 1em auto".as_ptr(), 0xff000000);
            assert!(!border.is_null());
            let inputs = [c"linear-gradient(currentColor, transparent)", c"0 fill", c"", c"2vw", c"repeat", c"luminance"].map(CStr::as_ptr);
            let mask = mason_css_mask_border_parse(inputs.as_ptr(), 0xff123456);
            assert!(!mask.is_null());
            let values = mason_css_nine_slice_values(border, 2., 18., 16., 400., 800.);
            let rows = std::slice::from_raw_parts(values.values, values.len);
            assert_eq!(&rows[Layout::STRIDE..Layout::STRIDE + Side::STRIDE], &[1., 0.1, 0.]);
            let width = Layout::STRIDE + 4 * Side::STRIDE;
            assert_eq!(&rows[width..width + 2 * Side::STRIDE], &[2., 36., 0., 3., 0., 0.]);
            mason_css_values_release(values);

            let border_value = Arc::clone(&(*border).0);
            let mask_value = Arc::clone(&(*mask).0);
            mason_css_nine_slice_install(&mut mason, &node, border, false);
            mason_css_nine_slice_install(ptr::null_mut(), &node, mask, true);
            mason_css_nine_slice_release(border);
            mason_css_nine_slice_release(mask);
            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| {
                assert!(Arc::ptr_eq(&border_value, &style.css_nine_slice(NineSliceKind::BorderImage).unwrap()));
                assert!(Arc::ptr_eq(&mask_value, &style.css_nine_slice(NineSliceKind::MaskBorder).unwrap()));
            });
            mason.0.with_style(sibling.id(), |style| {
                assert!(style.css_nine_slice(NineSliceKind::BorderImage).is_none());
                assert!(style.css_nine_slice(NineSliceKind::MaskBorder).is_none());
            });
            mason_css_nine_slice_install(&mut mason, &node, ptr::null(), false);
            mason.0.with_style(node.0.id(), |style| {
                assert!(style.css_nine_slice(NineSliceKind::BorderImage).is_none());
                assert!(style.css_nine_slice(NineSliceKind::MaskBorder).is_some());
            });
        }
    }

    #[test]
    fn image_border_width_survives_its_css_handle() {
        unsafe {
            let spec = mason_css_border_image_parse(
                c"url(a) max(10%, 25%) / min(25%, 30px) / calc(1em - 10px)".as_ptr(), 0,
            );
            assert!(!spec.is_null());
            let width = mason_css_nine_slice_width_offset(spec, 0, 2., 20., 16., 0., 0.);
            assert!(!width.is_null());
            assert!(mason_css_nine_slice_width_offset(spec, 4, 2., 20., 16., 0., 0.).is_null());
            mason_css_nine_slice_release(spec);
            assert_eq!(mason_css_paint_offset_resolve(width, 160., 0., 0., 0., 0., 0.), 40.);
            assert_eq!(mason_css_paint_offset_resolve(width, 320., 0., 0., 0., 0., 0.), 60.);
            mason_css_paint_offset_release(width);
        }
    }

    #[test]
    fn mask_longhands_keep_transparent_slots_and_share_rust_storage() {
        let inputs = [
            c"none, url(\"a,b.svg\"), linear-gradient(currentColor, transparent)",
            c"contain, 100% auto",
            c"right 10px bottom",
            c"no-repeat",
            c"padding-box, view-box",
            c"no-clip, content-box",
            c"luminance",
            c"add, subtract",
        ].map(CStr::as_ptr);
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let mask = mason_css_mask_parse(inputs.as_ptr(), 0xff123456, 2., 20., 16., 400., 800.);
            assert!(!mask.is_null());
            let rows = mason_css_mask_layers(mask);
            let rows = std::slice::from_raw_parts(rows.data, rows.count);
            assert_eq!(rows.iter().map(|l| l.paint.image_kind).collect::<Vec<_>>(), [0, 1, 2]);
            assert_eq!(rows.iter().map(|l| l.paint.size_kind).collect::<Vec<_>>(), [2, 1, 2]);
            assert_eq!(rows.iter().map(|l| l.clip).collect::<Vec<_>>(), [3, 2, 3]);
            assert_eq!(rows[1].composite, 1);
            assert_eq!(rows[2].paint.repeat_y, 1);
            assert_eq!(rows[2].paint.position_x.pixels, -20.);
            let gradient = mason_css_mask_gradient(mask, 2);
            let gradient_data = &(*gradient).0;
            assert_eq!(gradient_data.stops[0].color, 0xff123456);
            mason_css_mask_install(ptr::null_mut(), &node, mask);
            mason_css_mask_release(mask);
            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| {
                let layers = style.css_mask().unwrap();
                match &layers[2].paint.image {
                    Some(Image::Gradient(Some(stored))) => assert!(Arc::ptr_eq(stored, gradient_data)),
                    _ => panic!("expected the stored mask gradient"),
                }
            });
            mason.0.with_style(sibling.id(), |style| assert!(style.css_mask().is_none()));
            mason_css_mask_install(&mut mason, &node, ptr::null());
            mason.0.with_style(node.0.id(), |style| assert!(style.css_mask().is_none()));
            mason_css_gradient_release(gradient);
        }
    }

    #[test]
    fn clip_path_records_are_kept_by_the_style_and_cleared_independently() {
        use mason_core::style::css::ClipPathRecord;
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let clip = mason_css_clip_path_parse(c"padding-box circle(20% at right 10px bottom 5px)".as_ptr());
            assert!(!clip.is_null());
            let records = mason_css_clip_path_records(clip, 2., 16., 16., 0., 0.);
            let data = std::slice::from_raw_parts(records.values, records.len);
            assert_eq!(data[ClipPathRecord::HAS_POSITION], 1.);
            assert_eq!(data[ClipPathRecord::HAS_MATH], 0.);
            assert_eq!(&data[ClipPathRecord::STRIDE..ClipPathRecord::STRIDE + 4], &[1., -20., 1., -10.]);
            let stored = Arc::clone(&(*clip).0);
            mason_css_clip_path_install(std::ptr::null_mut(), &node, clip);
            mason_css_clip_path_release(clip);
            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| {
                assert!(Arc::ptr_eq(&stored, &style.css_clip_path().unwrap()));
            });
            mason.0.with_style(sibling.id(), |style| assert!(style.css_clip_path().is_none()));
            mason_css_clip_path_install(&mut mason, &node, std::ptr::null());
            mason.0.with_style(node.0.id(), |style| assert!(style.css_clip_path().is_none()));
            mason_css_values_release(records);
        }
    }

    #[test]
    fn retained_clip_math_resolves_against_each_reference_box() {
        use mason_core::style::css::ClipPathRecord;
        unsafe {
            let clip = mason_css_clip_path_parse(
                c"circle(min(25%, 30px) at right calc(25% + 2px) bottom 10px)".as_ptr(),
            );
            assert!(!clip.is_null());
            let records = mason_css_clip_path_records(clip, 2., 16., 16., 0., 0.);
            let header = std::slice::from_raw_parts(records.values, ClipPathRecord::STRIDE);
            assert_eq!(header[ClipPathRecord::HAS_MATH], 1.);
            let x = mason_css_clip_path_offset(clip, 0, 2., 16., 16., 0., 0.);
            let radius = mason_css_clip_path_offset(clip, 2, 2., 16., 16., 0., 0.);
            assert!(!x.is_null() && !radius.is_null());
            assert!(mason_css_clip_path_offset(clip, 1, 2., 16., 16., 0., 0.).is_null());
            mason_css_clip_path_release(clip);
            mason_css_values_release(records);
            let resolve = |value, basis| mason_css_paint_offset_resolve(value, basis, 0., 0., 0., 0., 0.);
            assert_eq!((resolve(x, 160.), resolve(radius, 160.)), (116., 40.));
            assert_eq!((resolve(x, 320.), resolve(radius, 320.)), (236., 60.));
            mason_css_paint_offset_release(x);
            mason_css_paint_offset_release(radius);
        }
    }

    #[test]
    fn css_path_and_svg_data_return_the_same_commands() {
        use mason_core::style::css::{ClipPathRecord, SvgPathRecord};
        unsafe {
            let path = c"M0 0 Q5 10 10 0 T20 0 Z";
            let clip = mason_css_clip_path_parse(c"path(evenodd, 'M0 0 Q5 10 10 0 T20 0 Z')".as_ptr());
            assert!(!clip.is_null());
            let css = mason_css_clip_path_records(clip, 2., 16., 16., 0., 0.);
            let svg = mason_css_svg_path_records(path.as_ptr());
            let css_rows = std::slice::from_raw_parts(css.values, css.len);
            let svg_rows = std::slice::from_raw_parts(svg.values, svg.len);
            assert_eq!(css_rows[ClipPathRecord::EVEN_ODD], 1.);
            assert_eq!(&css_rows[ClipPathRecord::STRIDE..], svg_rows);
            assert_eq!(svg_rows[SvgPathRecord::STRIDE * 2 + SvgPathRecord::X1], 15.);
            assert_eq!(svg_rows[SvgPathRecord::STRIDE * 2 + SvgPathRecord::Y1], -10.);
            assert!(mason_css_clip_path_parse(c"path('')".as_ptr()).is_null());
            mason_css_clip_path_release(clip);
            mason_css_values_release(css);
            mason_css_values_release(svg);
        }
    }

    #[test]
    fn transform_projection_reuses_the_style_program_on_resize() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let input = c"translateX(calc(25% - 2px)) matrix(1,0,0,1,6,2) translateY(1em)";
            let mut output = [0.; 6];
            let mut read = |mason: &mut crate::CMason, width, css: &CStr| {
                mason_css_transform_affine(
                    mason, &node, css.as_ptr(), width, 40., 12., 16., 0., 0., output.as_mut_ptr(),
                ).then_some(output)
            };
            assert_eq!(read(&mut mason, 100., input), Some([1., 0., 0., 1., 29., 14.]));
            let mut stored = None;
            mason.0.with_style(node.0.id(), |style| stored = style.css_transform());
            let stored = stored.unwrap();
            assert!(stored.uses_box_size());
            assert_eq!(read(&mut mason, 200., input), Some([1., 0., 0., 1., 54., 14.]));
            mason.0.with_style(node.0.id(), |style| {
                assert!(Arc::ptr_eq(&stored, &style.css_transform().unwrap()));
            });
            mason.0.with_style(sibling.id(), |style| assert!(style.css_transform().is_none()));
            assert_eq!(read(&mut mason, 200., c"none"), None);
            mason.0.with_style(node.0.id(), |style| assert!(style.css_transform().is_none()));
        }
    }

    #[test]
    fn windows_projects_the_stored_filter_chain_in_order() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        unsafe {
            let records = mason_css_set_style_records(
                &mut mason,
                &node,
                StyleRecordKind::Filter as u8,
                c"blur(calc(1px + 2px)) opacity(calc(.25 + .25)) drop-shadow(1px 2px max(4px, 2px) red)".as_ptr(),
                1.,
                16.,
                16.,
                0.,
                0.,
                0,
            );
            let backdrop = mason_css_set_style_records(
                &mut mason,
                &node,
                StyleRecordKind::BackdropFilter as u8,
                c"brightness(calc(80% - 20%))".as_ptr(),
                1.,
                16.,
                16.,
                0.,
                0.,
                0,
            );
            assert_eq!(records.len, 15);
            assert_eq!(backdrop.len, 5);
            let projected = mason_css_windows_filter_spec(&records);
            let spec = CStr::from_ptr(projected).to_str().unwrap();
            assert!(spec.starts_with("b,3.000000;m,"));
            assert!(spec.ends_with(";d,1.000000,2.000000,2.000000,4294901760"));
            mason.0.with_style(node.0.id(), |style| {
                assert_eq!(
                    style.css_records(StyleRecordKind::Filter).unwrap().len(),
                    15
                );
                assert_eq!(
                    style
                        .css_records(StyleRecordKind::BackdropFilter)
                        .unwrap()
                        .len(),
                    5
                );
            });
            crate::util::mason_util_destroy_string(projected);
            mason_css_style_records_release(records);
            mason_css_style_records_release(backdrop);
        }
    }

    #[test]
    fn a_shadow_snapshot_survives_the_style_being_cleared() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let first = mason_css_set_style_records(
                &mut mason,
                &node,
                StyleRecordKind::BoxShadow as u8,
                c"1px 2px red".as_ptr(),
                2.,
                16.,
                16.,
                0.,
                0.,
                0,
            );
            let cleared = mason_css_set_style_records(
                &mut mason,
                &node,
                StyleRecordKind::BoxShadow as u8,
                c"none".as_ptr(),
                2.,
                16.,
                16.,
                0.,
                0.,
                0,
            );
            assert_eq!(cleared.len, 0);
            assert_eq!(
                std::slice::from_raw_parts(first.values, first.len),
                &[2., 4., 0., 0., 0xffff0000u32 as f64, 0.]
            );
            mason.0.with_style(node.0.id(), |style| {
                assert!(style.css_records(StyleRecordKind::BoxShadow).is_none())
            });
            mason.0.with_style(sibling.id(), |style| {
                assert!(style.css_records(StyleRecordKind::BoxShadow).is_none())
            });
            mason_css_style_records_release(first);
            mason_css_style_records_release(cleared);
        }
    }

    #[test]
    fn font_features_keep_explicit_normal_and_reject_invalid_writes() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        let kind = StyleRecordKind::FontFeatures;
        let mut set = |css: &CStr| unsafe {
            mason_css_set_style_records(&mut mason, &node, kind as u8, css.as_ptr(), 1., 0., 0., 0., 0., 0)
        };
        let first = set(c"'liga' off");
        let invalid = set(c"'liga' -1");
        assert!(invalid.values.is_null());
        let normal = set(c"normal");
        assert!(!normal.values.is_null());
        assert_eq!(normal.len, 0);
        let tag = f64::from(u32::from_le_bytes(*b"liga"));
        unsafe {
            assert_eq!(std::slice::from_raw_parts(first.values, first.len), &[tag, 0.]);
            mason_css_style_records_release(first);
            mason_css_style_records_release(normal);
        }
        mason.0.with_style(node.0.id(), |style| assert!(style.css_records(kind).unwrap().is_empty()));
        mason.0.with_style(sibling.id(), |style| assert!(style.css_records(kind).is_none()));
    }

    #[test]
    fn deferred_styles_keep_the_last_records_and_clear_existing_groups() {
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        unsafe {
            let previous = install_style_records(
                &mut mason, &node, StyleRecordKind::BoxShadow, vec![1., 0., 0., 0., 0., 0.],
            );
            let replacement = install_style_records(
                ptr::null_mut(), &node, StyleRecordKind::TextShadow, vec![2., 0., 0., 0., 0., 0.],
            );
            let _ = install_style_records(
                ptr::null_mut(), &node, StyleRecordKind::BoxShadow, Vec::new(),
            );
            mason.0.with_style(node.0.id(), |style| {
                assert!(style.css_records(StyleRecordKind::BoxShadow).is_some());
                assert!(style.css_records(StyleRecordKind::TextShadow).is_none());
            });
            let replacement_ptr = replacement.values;
            mason_css_style_records_release(replacement);
            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| {
                assert!(style.css_records(StyleRecordKind::BoxShadow).is_none());
                let text = style.css_records(StyleRecordKind::TextShadow).unwrap();
                assert_eq!(text.as_ptr(), replacement_ptr);
                assert_eq!(text[0], 2.);
            });
            assert_eq!(*previous.values, 1.);
            mason_css_style_records_release(previous);
        }
    }

    #[test]
    fn background_math_survives_its_layer_snapshot() {
        unsafe {
            let css = c"url(tiles.png) right min(10%, 2em) bottom calc(10% + 2px) / clamp(10px, 50%, 4em) auto";
            let background = mason_css_background_parse(css.as_ptr(), 0, 2., 20., 16., 0., 0.);
            assert!(!background.is_null());
            let rows = mason_css_background_layers(background);
            assert_eq!(rows.count, 1);
            let layer = &*rows.data;
            assert!(!layer.width.math.is_null() && !layer.position_x.math.is_null());
            assert!(!layer.height.present);
            let width = mason_css_paint_offset_retain(layer.width.math);
            let x = mason_css_paint_offset_retain(layer.position_x.math);
            mason_css_background_release(background);
            let resolve = |offset, basis| mason_css_paint_offset_resolve(offset, basis, 0., 0., 0., 0., 0.);
            assert_eq!(resolve(width, 240.), 120.);
            assert_eq!(resolve(width, 400.), 160.);
            assert_eq!(resolve(x, 240. - resolve(width, 240.)), 108.);
            assert_eq!(resolve(x, 400. - resolve(width, 400.)), 216.);
            assert_eq!(mason_css_paint_offset_resolve(width, 400., 2., 30., 16., 0., 0.), 200.);
            let text = mason_css_paint_offset_text(x, true);
            assert_eq!(CStr::from_ptr(text).to_bytes(), b"right min(10%, 2em)");
            crate::util::mason_util_destroy_string(text);
            mason_css_paint_offset_release(x);
            mason_css_paint_offset_release(width);
        }
    }

    #[test]
    fn a_gradient_keeps_its_stops_after_the_input_string_is_released() {
        let input = CString::new("linear-gradient(to right, red calc(50% - 10px), blue)").unwrap();
        unsafe {
            let handle = mason_css_gradient_parse(input.as_ptr(), 0);
            drop(input);
            assert!(!handle.is_null());
            let info = mason_css_gradient_info(handle);
            assert_eq!(info.stop_count, 2);
            assert_eq!(
                std::slice::from_raw_parts(info.direction.bytes, info.direction.len),
                b"to right"
            );
            let mut stops = [
                CMasonCssGradientStop {
                    color: 0,
                    position: 0.,
                },
                CMasonCssGradientStop {
                    color: 0,
                    position: 0.,
                },
            ];
            mason_css_gradient_resolve(handle, 200., 2., 16., 16., 0., 0., stops.as_mut_ptr());
            assert_eq!(stops[0].color, 0xffff0000);
            assert_eq!(stops[0].position, 0.4);
            assert_eq!(stops[1].position, 1.);
            mason_css_gradient_resolve(handle, 100., 2., 16., 16., 0., 0., stops.as_mut_ptr());
            assert_eq!(stops[0].position, 0.3);
            mason_css_gradient_release(handle);
        }
    }

    #[test]
    fn desktop_background_keeps_overrides_and_old_render_snapshots() {
        use mason_core::style::css::CssBackgroundResultRecord as Result;

        let update = |previous, input: &str| {
            let mut result = [0; Result::STRIDE];
            let snapshot = unsafe {
                mason_css_background_desktop_update(
                    previous, input.into(), 0xff000000, 20., 16., 0., 0.,
                    result.as_mut_ptr(), result.len(),
                )
            };
            assert!(!snapshot.is_null());
            (snapshot, result)
        };
        let (pending, _) = update(ptr::null(), &["background-repeat", "round", ""].join("\0"));
        let (first, result) = update(pending, &[
            "background", "url(a.png) space red", "",
            "background-image", "url(b.png) no-repeat", "",
            "background", "linear-gradient(invalid)", "",
            "background-size", "2em auto", "",
        ].join("\0"));
        assert_eq!(result[Result::COLOR], 0xffff0000);
        assert_eq!(result[Result::LAYERS_CHANGED], 1);
        let (second, reset) = update(first, &["background-repeat", "", ""].join("\0"));
        assert_eq!(reset[Result::IMAGES_REPLACED], 0);
        unsafe {
            let first_layer = &*mason_css_background_layers(first).data;
            let second_layer = &*mason_css_background_layers(second).data;
            assert_eq!(first_layer.repeat_x, 3);
            assert_eq!(second_layer.repeat_x, 1);
            assert_eq!(second_layer.width.pixels, 40.);
            assert_eq!(std::slice::from_raw_parts(second_layer.image.bytes, second_layer.image.len), b"b.png");
            for snapshot in [pending, first, second] {
                mason_css_background_release(snapshot);
            }
        }
    }

    #[test]
    fn background_snapshot_owns_layers_and_cycles_longhands_atomically() {
        let input = CString::new("url(a.png), linear-gradient(currentColor, blue), none").unwrap();
        let mut mason = crate::CMason(mason_core::Mason::new());
        let node = crate::CMasonNode(mason.0.create_node());
        let sibling = mason.0.create_node();
        unsafe {
            let bg = mason_css_background_parse(input.as_ptr(), 0xff123456, 2., 16., 16., 0., 0.);
            drop(input);
            assert!(!bg.is_null());
            let gradient = mason_css_background_gradient(bg, 1);
            assert!(!gradient.is_null());
            let gradient_value = &(*gradient).0;
            assert_eq!(gradient_value.stops[0].color, 0xff123456);
            assert!(mason_css_background_set_longhand(
                bg,
                c"repeat".as_ptr(),
                c"Round, no-repeat".as_ptr()
            ));
            assert!(mason_css_background_set_longhand(
                bg,
                c"position-x".as_ptr(),
                c"right 5px".as_ptr()
            ));
            assert!(mason_css_background_set_longhand(
                bg,
                c"clip".as_ptr(),
                c"text, padding-box".as_ptr()
            ));
            assert!(!mason_css_background_set_longhand(
                bg,
                c"repeat".as_ptr(),
                c"repeat, bogus".as_ptr()
            ));
            let layers = mason_css_background_layers(bg);
            let layers = std::slice::from_raw_parts(layers.data, layers.count);
            assert_eq!(
                layers.iter().map(|l| l.repeat_x).collect::<Vec<_>>(),
                [3, 1, 3]
            );
            assert_eq!(layers.iter().map(|l| l.clip).collect::<Vec<_>>(), [3, 1, 3]);
            assert_eq!(layers[2].position_x.pixels, -10.);
            assert_eq!(
                std::slice::from_raw_parts(layers[0].image.bytes, layers[0].image.len),
                b"a.png"
            );
            mason_css_background_install(&mut mason, &node, bg);
            mason_css_background_release(bg);
            let mut snapshot = None;
            mason.0.with_style(node.0.id(), |style| snapshot = style.css_background());
            let snapshot = snapshot.unwrap();
            let Some(Image::Gradient(Some(stored_gradient))) = &snapshot[1].image else {
                panic!("Expected the gradient on the style");
            };
            assert!(Arc::ptr_eq(stored_gradient, gradient_value));
            assert_eq!(snapshot[0].repeat[0] as u8, 3);
            mason.0.with_style(sibling.id(), |style| assert!(style.css_background().is_none()));
            mason_css_background_install(ptr::null_mut(), &node, ptr::null());
            mason.0.with_style(node.0.id(), |style| assert!(style.css_background().is_some()));
            mason_css_flush_style_records(&mut mason);
            mason.0.with_style(node.0.id(), |style| assert!(style.css_background().is_none()));
            assert_eq!(mason_css_gradient_info(gradient).stop_count, 2);
            mason_css_gradient_release(gradient);
        }
    }

    #[test]
    fn background_longhands_preserve_units_and_invalid_mask_slots() {
        let input = CString::new("right 5px, invalid, 20%").unwrap();
        unsafe {
            let property = c"position-x".as_ptr();
            assert!(mason_css_background_longhand_parse(property, input.as_ptr(), false).is_null());
            let list = mason_css_background_longhand_parse(property, input.as_ptr(), true);
            drop(input);
            assert!(!list.is_null());
            for scale in [1., 3.] {
                let records = mason_css_background_longhand_records(list, scale, 16., 0., 0.);
                let values = std::slice::from_raw_parts(records.values, records.len);
                assert_eq!(&values[0..3], &[2., 1., -5. * f64::from(scale)]);
                assert_eq!(values[6], -1.);
                assert_eq!(values[12], 2.);
                assert!((values[13] - 0.2).abs() < 1e-7);
                mason_css_values_release(records);
            }
            mason_css_background_longhand_release(list);
        }
    }
}
