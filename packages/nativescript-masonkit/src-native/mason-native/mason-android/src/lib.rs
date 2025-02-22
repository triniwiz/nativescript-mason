extern crate core;

use std::ffi::{c_char, c_void, CString};
use std::sync::Arc;
use itertools::izip;

use jni::objects::{GlobalRef, JClass, JMethodID, JObject, JValue};
use jni::sys::{jint, jlong};
use jni::{JNIEnv, NativeMethod};
use jni::JavaVM;
use once_cell::sync::OnceCell;

use mason_core::style::{min_max_from_values, Style};
use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, auto, display_from_enum, display_to_enum,
    fit_content, flex, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, justify_content_from_enum,
    justify_content_to_enum, length, max_content, min_content, percent, position_from_enum,
    position_to_enum, GridPlacement, GridTrackRepetition, Mason, MaxTrackSizingFunction,
    MinTrackSizingFunction, Node, NonRepeatedTrackSizingFunction, Overflow, Point, Size, TaffyAuto,
    TrackSizingFunction,
};
use mason_core::{Dimension, LengthPercentage, LengthPercentageAuto, Rect};

mod node;
pub mod style;
pub mod util;

#[derive(Clone)]
pub struct MinMaxCacheItem {
    clazz: GlobalRef,
    min_type_id: JMethodID,
    min_value_id: JMethodID,
    max_type_id: JMethodID,
    max_value_id: JMethodID,
}

impl MinMaxCacheItem {
    pub fn new(
        clazz: GlobalRef,
        min_type_id: JMethodID,
        min_value_id: JMethodID,
        max_type_id: JMethodID,
        max_value_id: JMethodID,
    ) -> Self {
        Self {
            clazz,
            min_type_id,
            min_value_id,
            max_type_id,
            max_value_id,
        }
    }

    pub fn clazz(&self) -> JClass {
        let obj = unsafe { JObject::from_raw(self.clazz.as_raw()) };
        JClass::from(obj)
    }
}

const MIN_MAX_CLASS: &str = "org/nativescript/mason/masonkit/MinMax";

#[derive(Clone)]
pub struct TrackSizingFunctionCacheItem {
    clazz: GlobalRef,
    single_clazz: GlobalRef,
    auto_repeat_clazz: GlobalRef,
    is_repeating: JMethodID,
    single_value_id: JMethodID,
    auto_repeat_value_id: JMethodID,
    auto_repeat_grid_track_repetition_id: JMethodID,
    auto_repeat_grid_track_repetition_count_id: JMethodID,
}

impl TrackSizingFunctionCacheItem {
    pub fn new(
        clazz: GlobalRef,
        single_clazz: GlobalRef,
        auto_repeat_clazz: GlobalRef,
        is_repeating: JMethodID,
        single_value_id: JMethodID,
        auto_repeat_value_id: JMethodID,
        auto_repeat_grid_track_repetition_id: JMethodID,
        auto_repeat_grid_track_repetition_count_id: JMethodID,
    ) -> Self {
        Self {
            clazz,
            single_clazz,
            auto_repeat_clazz,
            is_repeating,
            single_value_id,
            auto_repeat_value_id,
            auto_repeat_grid_track_repetition_id,
            auto_repeat_grid_track_repetition_count_id,
        }
    }

    pub fn clazz(&self) -> JClass {
        let obj = unsafe { JObject::from_raw(self.clazz.as_raw()) };
        JClass::from(obj)
    }

    pub fn single_clazz(&self) -> JClass {
        let obj = unsafe { JObject::from_raw(self.single_clazz.as_raw()) };
        JClass::from(obj)
    }

    pub fn auto_repeat(&self) -> JClass {
        let obj = unsafe { JObject::from_raw(self.auto_repeat_clazz.as_raw()) };
        JClass::from(obj)
    }
}

const TRACK_SIZING_FUNCTION_CLASS: &str = "org/nativescript/mason/masonkit/TrackSizingFunction";
const TRACK_SIZING_FUNCTION_SINGLE_CLASS: &str =
    "org/nativescript/mason/masonkit/TrackSizingFunction$Single";
const TRACK_SIZING_FUNCTION_AUTO_REPEAT_CLASS: &str =
    "org/nativescript/mason/masonkit/TrackSizingFunction$AutoRepeat";

pub static MIN_MAX: OnceCell<MinMaxCacheItem> = OnceCell::new();

pub static TRACK_SIZING_FUNCTION: OnceCell<TrackSizingFunctionCacheItem> = OnceCell::new();

#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonNonRepeatedTrackSizingFunction(NonRepeatedTrackSizingFunction);

#[derive(Clone, PartialEq, Debug)]
pub struct CMasonTrackSizingFunction(TrackSizingFunction);

static mut JVM: Option<Arc<JavaVM>> = None;

fn get_java_vm() -> Option<Arc<JavaVM>> {
    unsafe { JVM.clone() }
}

const ANDROID_O: i32 = 26;

pub(crate) const BUILD_VERSION_CLASS: &str = "android/os/Build$VERSION";

const NODE_CLASS: &str = "org/nativescript/mason/masonkit/Node";
const MASON_CLASS: &str = "org/nativescript/mason/masonkit/Mason";
const STYLE_CLASS: &str = "org/nativescript/mason/masonkit/Style";

#[no_mangle]
pub extern "system" fn JNI_OnLoad(vm: JavaVM, _reserved: *const c_void) -> jint {
    {
        android_logger::init_once(android_logger::Config::default());

        if let Ok(mut env) = vm.get_env() {
            let clazz = env.find_class(BUILD_VERSION_CLASS).unwrap();

            let sdk_int_id = env.get_static_field_id(&clazz, "SDK_INT", "I").unwrap();


            let sdk_int = env.get_static_field_unchecked(
                clazz,
                sdk_int_id,
                jni::signature::JavaType::Primitive(jni::signature::Primitive::Int),
            );

            let ret = sdk_int.unwrap().i().unwrap();

            let mason_class = env.find_class(MASON_CLASS).unwrap();

            let mason_method_names = [
                "nativeInit",
                "nativeClear",
                "nativeInitWithCapacity"
            ];

            let mason_signatures = if ret >= ANDROID_O {
                [
                    "()J",
                    "(J)V",
                    "(I)J"
                ]
            } else {
                [
                    "!()J",
                    "!(J)V",
                    "!(I)J"
                ]
            };

            let mason_methods = if ret >= ANDROID_O {
                [
                    MasonNativeInit as *mut c_void,
                    MasonNativeClear as *mut c_void,
                    MasonNativeInitWithCapacity as *mut c_void
                ]
            } else {
                [
                    MasonNativeInitNormal as *mut c_void,
                    MasonNativeClearNormal as *mut c_void,
                    MasonNativeInitWithCapacityNormal as *mut c_void
                ]
            };

            let mason_native_methods: Vec<NativeMethod> =
                izip!(mason_method_names, mason_signatures, mason_methods)
                    .map(|(name, signature, method)| NativeMethod {
                        name: name.into(),
                        sig: signature.into(),
                        fn_ptr: method,
                    })
                    .collect();

            let _ = env.register_native_methods(&mason_class, mason_native_methods.as_slice());


            let node_class = env.find_class(NODE_CLASS).unwrap();

            let node_method_names = [
                "nativeDestroy",
                "nativeNewNode",
                "nativeNewNodeWithContext",
                "nativeGetChildCount",
                "nativeComputeWH",
                "nativeComputeSize",
                "nativeComputeMaxContent",
                "nativeComputeMinContent",
                "nativeCompute",
                "nativeSetStyle",
                "nativeGetChildAt",
                "nativeAddChild",
                "nativeReplaceChildAt",
                "nativeAddChildAt",
                "nativeInsertChildBefore",
                "nativeInsertChildAfter",
                "nativeDirty",
                "nativeMarkDirty",
                "nativeRemoveChildren"
            ];


            let node_signatures = if ret >= ANDROID_O {
                [
                    "(J)V",
                    "(JJ)J",
                    "(JJLjava/lang/Object;)J",
                    "(JJ)I",
                    "(JJFF)V",
                    "(JJJ)V",
                    "(JJ)V",
                    "(JJ)V",
                    "(JJ)V",
                    "(JJJ)V",
                    "(JJI)J",
                    "(JJJ)V",
                    "(JJJI)J",
                    "(JJJI)V",
                    "(JJJJ)V",
                    "(JJJJ)V",
                    "(JJ)Z",
                    "(JJ)V",
                    "(JJ)V",
                    "(JJI)J",
                    "(JJJ)J",
                    "(JJ)V",
                ]
            } else {
                [
                    "!(J)V",
                    "!(JJ)J",
                    "!(JJLjava/lang/Object;)J",
                    "!(JJ)I",
                    "!(JJFF)V",
                    "!(JJJ)V",
                    "!(JJ)V",
                    "!(JJ)V",
                    "!(JJ)V",
                    "!(JJJ)V",
                    "!(JJI)J",
                    "!(JJJ)V",
                    "!(JJJI)J",
                    "!(JJJI)V",
                    "!(JJJJ)V",
                    "!(JJJJ)V",
                    "!(JJ)Z",
                    "!(JJ)V",
                    "!(JJ)V",
                    "!(JJI)J",
                    "!(JJJ)J",
                    "!(JJ)V",
                ]
            };

            let node_methods = if ret >= ANDROID_O {
                [
                    node::NodeNativeDestroy as *mut c_void,
                    node::NodeNativeNewNode as *mut c_void,
                    node::NodeNativeNewNodeWithContext as *mut c_void,
                    node::NodeNativeGetChildCount as *mut c_void,
                    node::NodeNativeComputeWH as *mut c_void,
                    node::NodeNativeComputeSize as *mut c_void,
                    node::NodeNativeComputeMaxContent as *mut c_void,
                    node::NodeNativeComputeMinContent as *mut c_void,
                    node::NodeNativeCompute as *mut c_void,
                    node::NodeNativeSetStyle as *mut c_void,
                    node::NodeNativeGetChildAt as *mut c_void,
                    node::NodeNativeAddChild as *mut c_void,
                    node::NodeNativeReplaceChildAt as *mut c_void,
                    node::NodeNativeAddChildAt as *mut c_void,
                    node::NodeNativeInsertChildBefore as *mut c_void,
                    node::NodeNativeInsertChildAfter as *mut c_void,
                    node::NodeNativeDirty as *mut c_void,
                    node::NodeNativeMarkDirty as *mut c_void,
                    node::NodeNativeRemoveChildren as *mut c_void,
                    node::NodeNativeRemoveChildAt as *mut c_void,
                    node::NodeNativeRemoveChild as *mut c_void,
                    node::NodeNativeRemoveContext as *mut c_void
                ]
            } else {
                [
                    node::NodeNativeDestroyNormal as *mut c_void,
                    node::NodeNativeNewNodeNormal as *mut c_void,
                    node::NodeNativeNewNodeWithContext as *mut c_void,
                    node::NodeNativeGetChildCountNormal as *mut c_void,
                    node::NodeNativeComputeWHNormal as *mut c_void,
                    node::NodeNativeComputeSizeNormal as *mut c_void,
                    node::NodeNativeComputeMaxContentNormal as *mut c_void,
                    node::NodeNativeComputeMinContentNormal as *mut c_void,
                    node::NodeNativeComputeNormal as *mut c_void,
                    node::NodeNativeSetStyleNormal as *mut c_void,
                    node::NodeNativeGetChildAtNormal as *mut c_void,
                    node::NodeNativeAddChildNormal as *mut c_void,
                    node::NodeNativeReplaceChildAtNormal as *mut c_void,
                    node::NodeNativeAddChildAtNormal as *mut c_void,
                    node::NodeNativeInsertChildBeforeNormal as *mut c_void,
                    node::NodeNativeInsertChildAfterNormal as *mut c_void,
                    node::NodeNativeDirtyNormal as *mut c_void,
                    node::NodeNativeMarkDirtyNormal as *mut c_void,
                    node::NodeNativeRemoveChildrenNormal as *mut c_void,
                    node::NodeNativeRemoveChildAtNormal as *mut c_void,
                    node::NodeNativeRemoveChildNormal as *mut c_void,
                    node::NodeNativeRemoveContextNormal as *mut c_void
                ]
            };


            let node_native_methods: Vec<NativeMethod> = izip!(node_method_names, node_signatures, node_methods)
                .map(|(name, signature, method)| NativeMethod {
                    name: name.into(),
                    sig: signature.into(),
                    fn_ptr: method,
                })
                .collect();

            let _ = env.register_native_methods(&node_class, node_native_methods.as_slice());


            let style_class = env.find_class(STYLE_CLASS).unwrap();

            let style_method_names = [
                "nativeInit",
                "nativeDestroy",
            ];

            let style_signatures = if ret >= ANDROID_O {
                [
                    "()J",
                    "(J)V",
                ]
            } else {
                [
                    "!()J",
                    "!(J)V",
                ]
            };

            let style_methods = if ret >= ANDROID_O {
                [
                    style::StyleNativeInit as *mut c_void,
                    style::StyleNativeDestroy as *mut c_void,
                ]
            } else {
                [
                    style::StyleNativeInitNormal as *mut c_void,
                    style::StyleNativeDestroyNormal as *mut c_void,
                ]
            };

            let style_native_methods: Vec<NativeMethod> =
                izip!(style_method_names, style_signatures, style_methods)
                    .map(|(name, signature, method)| NativeMethod {
                        name: name.into(),
                        sig: signature.into(),
                        fn_ptr: method,
                    })
                    .collect();

            let _ = env.register_native_methods(&style_class, style_native_methods.as_slice());


            let clazz = env.find_class(MIN_MAX_CLASS).unwrap();

            let min_type = env.get_method_id(&clazz, "getMinType", "()I").unwrap();
            let min_value = env.get_method_id(&clazz, "getMinValue", "()F").unwrap();

            let max_type = env.get_method_id(&clazz, "getMaxType", "()I").unwrap();
            let max_value = env.get_method_id(&clazz, "getMaxValue", "()F").unwrap();

            MIN_MAX.get_or_init(|| {
                MinMaxCacheItem::new(
                    env.new_global_ref(clazz).unwrap(),
                    min_type,
                    min_value,
                    max_type,
                    max_value,
                )
            });

            let track_sizing_function_clazz = env.find_class(TRACK_SIZING_FUNCTION_CLASS).unwrap();
            let track_sizing_function_single_clazz =
                env.find_class(TRACK_SIZING_FUNCTION_SINGLE_CLASS).unwrap();
            let track_sizing_function_auto_repeat_clazz = env
                .find_class(TRACK_SIZING_FUNCTION_AUTO_REPEAT_CLASS)
                .unwrap();

            let is_repeating = env
                .get_method_id(&track_sizing_function_clazz, "isRepeating", "()Z")
                .unwrap();

            let single_value = env
                .get_method_id(
                    &track_sizing_function_single_clazz,
                    "getValue",
                    "()Lorg/nativescript/mason/masonkit/MinMax;",
                )
                .unwrap();

            let auto_repeat_value = env
                .get_method_id(
                    &track_sizing_function_auto_repeat_clazz,
                    "getValue",
                    "()[Lorg/nativescript/mason/masonkit/MinMax;",
                )
                .unwrap();

            let auto_repeat_grid_track_repetition = env
                .get_method_id(
                    &track_sizing_function_auto_repeat_clazz,
                    "gridTrackRepetitionNativeType",
                    "()I",
                )
                .unwrap();

            let auto_repeat_grid_track_repetition_count = env
                .get_method_id(
                    &track_sizing_function_auto_repeat_clazz,
                    "gridTrackRepetitionNativeValue",
                    "()S",
                )
                .unwrap();

            TRACK_SIZING_FUNCTION.get_or_init(|| {
                TrackSizingFunctionCacheItem::new(
                    env.new_global_ref(track_sizing_function_clazz).unwrap(),
                    env.new_global_ref(track_sizing_function_single_clazz)
                        .unwrap(),
                    env.new_global_ref(track_sizing_function_auto_repeat_clazz)
                        .unwrap(),
                    is_repeating,
                    single_value,
                    auto_repeat_value,
                    auto_repeat_grid_track_repetition,
                    auto_repeat_grid_track_repetition_count,
                )
            });
        }

        unsafe {
            JVM = Some(Arc::new(vm));
        }

        log::info!("Mason library loaded");
    }

    jni::sys::JNI_VERSION_1_6
}


#[no_mangle]
pub extern "system" fn MasonNativeInit() -> jlong {
    Mason::default().into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitNormal(_env: JNIEnv, _: JClass) -> jlong {
    Mason::default().into_raw() as jlong
}


#[no_mangle]
pub extern "system" fn MasonNativeInitWithCapacity(
    capacity: jint,
) -> jlong {
    Mason::with_capacity(capacity as usize).into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitWithCapacityNormal(
    _env: JNIEnv, _: JClass,
    capacity: jint,
) -> jlong {
    Mason::with_capacity(capacity as usize).into_raw() as jlong
}

fn native_clear(taffy: jlong) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        mason.clear();
        Box::leak(mason);
    }
}

#[no_mangle]
pub extern "system" fn MasonNativeClear(
    taffy: jlong,
) {
    native_clear(taffy);
}

#[no_mangle]
pub extern "system" fn MasonNativeClearNormal(
    _env: JNIEnv, _: JClass, taffy: jlong,
) {
    native_clear(taffy);
}

fn mason_util_create_non_repeated_track_sizing_function_with_type_value(
    track_type: i32,
    track_value: f32,
    index: isize,
    store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
) {
    let value = CMasonNonRepeatedTrackSizingFunction(match track_type {
        0 => auto(),
        1 => min_content(),
        2 => max_content(),
        3 => length(track_value),
        4 => percent(track_value),
        5 => flex(track_value),
        6 => fit_content(LengthPercentage::Length(track_value)),
        7 => fit_content(LengthPercentage::Percent(track_value)),

        _ => panic!(),
    });

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

#[no_mangle]
pub extern "C" fn mason_init() -> i64 {
    Mason::default().into_raw() as i64
}

#[no_mangle]
pub extern "C" fn mason_init_with_capacity(capacity: i32) -> i64 {
    Mason::with_capacity(capacity as usize).into_raw() as i64
}

#[no_mangle]
pub extern "C" fn mason_clear(mason: i64) {
    if mason == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);
        mason.clear();
        Box::leak(mason);
    }
}

#[no_mangle]
pub extern "C" fn mason_util_create_non_repeated_track_sizing_function(
    min_max: CMasonMinMax,
    index: isize,
    store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
) {
    let value = CMasonNonRepeatedTrackSizingFunction(min_max_from_values(
        min_max.min_type,
        min_max.min_value,
        min_max.max_type,
        min_max.max_value,
    ));
    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

#[no_mangle]
pub extern "C" fn mason_util_create_single_track_sizing_function(
    min_max: CMasonMinMax,
    index: isize,
    store: &mut Vec<CMasonTrackSizingFunction>,
) {
    let value = CMasonTrackSizingFunction(TrackSizingFunction::Single(min_max_from_values(
        min_max.min_type,
        min_max.min_value,
        min_max.max_type,
        min_max.max_value,
    )));

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

/*
#[no_mangle]
pub extern "C" fn mason_util_create_auto_repeating_track_sizing_function(
    grid_track_repetition: i32,
    grid_track_repetition_count: u16,
    values: Vec<CMasonMinMax>,
    index: isize,
    store: &mut Vec<CMasonTrackSizingFunction>,
) {
    let value = CMasonTrackSizingFunction(TrackSizingFunction::Repeat(
        match grid_track_repetition {
            0 => GridTrackRepetition::AutoFill,
            1 => GridTrackRepetition::AutoFit,
            2 => GridTrackRepetition::Count(grid_track_repetition_count),
            _ => panic!(),
        },
        values
            .into_iter()
            .map(|min_max| {
                min_max_from_values(
                    min_max.min_type,
                    min_max.min_value,
                    min_max.max_type,
                    min_max.max_value,
                )
            })
            .collect(),
    ));

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

*/


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


#[derive(Copy, Clone, PartialEq, Debug)]
pub struct AvailableSpace {
    pub(crate) value: f32,
    pub(crate) space_type: AvailableSpaceType,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub enum CMasonDimensionType {
    CMasonDimensionTypeAuto,
    CMasonDimensionTypePoints,
    CMasonDimensionTypePercent,
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
    CMasonLengthPercentageAutoTypeAuto,
    CMasonLengthPercentageAutoTypePoints,
    CMasonLengthPercentageAutoTypePercent,
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
    CMasonLengthPercentageTypePoints,
    CMasonLengthPercentageTypePercent,
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
    CMasonGridPlacementTypeAuto,
    CMasonGridPlacementTypeLine,
    CMasonGridPlacementTypeSpan,
}

#[repr(C)]
#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonGridPlacement {
    pub value: i16,
    pub value_type: CMasonGridPlacementType,
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
            value_type: CMasonDimensionType::CMasonDimensionTypeAuto,
        }
    }
}

impl From<Dimension> for CMasonDimension {
    fn from(dimension: Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Length(length) => CMasonDimension::new(length, CMasonDimensionType::CMasonDimensionTypePoints),
            Dimension::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::CMasonDimensionTypePercent)
            }
        }
    }
}

impl From<&Dimension> for CMasonDimension {
    fn from(dimension: &Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Length(points) => CMasonDimension::new(*points, CMasonDimensionType::CMasonDimensionTypePoints),
            Dimension::Percent(percent) => {
                CMasonDimension::new(*percent, CMasonDimensionType::CMasonDimensionTypePercent)
            }
        }
    }
}

impl From<CMasonDimension> for Dimension {
    fn from(dimension: CMasonDimension) -> Self {
        match dimension.value_type {
            CMasonDimensionType::CMasonDimensionTypeAuto => Dimension::Auto,
            CMasonDimensionType::CMasonDimensionTypePoints => Dimension::Length(dimension.value),
            CMasonDimensionType::CMasonDimensionTypePercent => Dimension::Percent(dimension.value),
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
            value_type: CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypeAuto,
        }
    }
}

impl From<LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Length(points) => {
                CMasonLengthPercentageAuto::new(points, CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePoints)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(percent, CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePercent)
            }
        }
    }
}

impl From<&LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: &LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Length(points) => {
                CMasonLengthPercentageAuto::new(*points, CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePoints)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(*percent, CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePercent)
            }
        }
    }
}

impl From<CMasonLengthPercentageAuto> for LengthPercentageAuto {
    fn from(value: CMasonLengthPercentageAuto) -> Self {
        match value.value_type {
            CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypeAuto => LengthPercentageAuto::Auto,
            CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePoints => LengthPercentageAuto::Length(value.value),
            CMasonLengthPercentageAutoType::CMasonLengthPercentageAutoTypePercent => LengthPercentageAuto::Percent(value.value),
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
            LengthPercentage::Length(points) => {
                CMasonLengthPercentage::new(points, CMasonLengthPercentageType::CMasonLengthPercentageTypePoints)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(percent, CMasonLengthPercentageType::CMasonLengthPercentageTypePercent)
            }
        }
    }
}

impl From<&LengthPercentage> for CMasonLengthPercentage {
    fn from(value: &LengthPercentage) -> Self {
        match value {
            LengthPercentage::Length(points) => {
                CMasonLengthPercentage::new(*points, CMasonLengthPercentageType::CMasonLengthPercentageTypePoints)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(*percent, CMasonLengthPercentageType::CMasonLengthPercentageTypePercent)
            }
        }
    }
}

impl From<CMasonLengthPercentage> for LengthPercentage {
    fn from(value: CMasonLengthPercentage) -> Self {
        match value.value_type {
            CMasonLengthPercentageType::CMasonLengthPercentageTypePoints => LengthPercentage::Length(value.value),
            CMasonLengthPercentageType::CMasonLengthPercentageTypePercent => LengthPercentage::Percent(value.value),
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
                value_type: CMasonGridPlacementType::CMasonGridPlacementTypeAuto,
            },
            GridPlacement::Line(value) => CMasonGridPlacement {
                value: value.as_i16(),
                value_type: CMasonGridPlacementType::CMasonGridPlacementTypeLine,
            },
            GridPlacement::Span(value) => CMasonGridPlacement {
                value: value as i16,
                value_type: CMasonGridPlacementType::CMasonGridPlacementTypeSpan,
            },
        }
    }
}

impl Into<GridPlacement> for CMasonGridPlacement {
    fn into(self) -> GridPlacement {
        match self.value_type {
            CMasonGridPlacementType::CMasonGridPlacementTypeAuto => GridPlacement::Auto,
            CMasonGridPlacementType::CMasonGridPlacementTypeLine => GridPlacement::Line(self.value.into()),
            CMasonGridPlacementType::CMasonGridPlacementTypeSpan => GridPlacement::Span(self.value.try_into().unwrap()),
        }
    }
}

pub fn assert_pointer_address(pointer: i64, pointer_type: &str) {
    assert_ne!(pointer, 0, "Invalid {:} pointer address", pointer_type);
}

/*
#[no_mangle]
pub extern "C" fn mason_util_parse_non_repeated_track_sizing_function_value(
    value: &[CMasonNonRepeatedTrackSizingFunction],
) -> String {
    let mut ret = String::new();

    for (i, val) in value.iter().enumerate() {
        let parsed = mason_core::ffi::parse_non_repeated_track_sizing_function_value(val.0);
        if i != 0 {
            ret.push(' ');
        }
        ret.push_str(parsed.as_ref())
    }
    ret
}
*/

/*
#[no_mangle]
pub extern "C" fn mason_util_parse_auto_repeating_track_sizing_function(
    value: &[CMasonTrackSizingFunction],
) -> String {
    let mut ret = String::new();
    for (i, val) in value.iter().enumerate() {
        if i != 0 {
            ret.push(' ');
        }
        let string = mason_core::ffi::parse_track_sizing_function_value(&val.0);
        ret.push_str(string.as_str());
    }
    ret
} */

// #[no_mangle]
// pub extern "C" fn mason_style_get_grid_auto_rows(style: i64) -> Vec<CMasonNonRepeatedTrackSizingFunction> {
//     mason_core::ffi::style_get_grid_auto_rows(style as _)
//         .into_iter()
//         .map(CMasonNonRepeatedTrackSizingFunction)
//         .collect()
// }


// #[no_mangle]
// pub extern "C" fn mason_style_set_grid_auto_rows(style: i64, value: Vec<CMasonNonRepeatedTrackSizingFunction>) {
//     mason_core::ffi::style_set_grid_auto_rows(style as _, value.into_iter().map(|v| v.0).collect())
// }


// #[no_mangle]
// pub extern "C" fn mason_style_get_grid_auto_columns(style: i64) -> Vec<CMasonNonRepeatedTrackSizingFunction> {
//     mason_core::ffi::style_get_grid_auto_columns(style as _)
//         .into_iter()
//         .map(CMasonNonRepeatedTrackSizingFunction)
//         .collect()
// }

// #[no_mangle]
// pub extern "C" fn mason_style_set_grid_auto_columns(style: i64, value: Vec<CMasonNonRepeatedTrackSizingFunction>) {
//     mason_core::ffi::style_set_grid_auto_columns(
//         style as _,
//         value.into_iter().map(|v| v.0).collect(),
//     )
// }

#[no_mangle]
pub extern "C" fn mason_style_get_grid_auto_flow(style: i64) -> i32 {
    mason_core::ffi::style_get_grid_auto_flow(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_auto_flow(style: i64, value: i32) {
    mason_core::ffi::style_set_grid_auto_flow(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_column_start(style: i64) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_column_start(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_area(
    style: i64,
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
pub extern "C" fn mason_style_set_grid_column(style: i64, start: CMasonGridPlacement, end: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_column(style as _, start.into(), end.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_column_start(style: i64, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_column_start(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_column_end(style: i64) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_column_end(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_column_end(style: i64, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_column_end(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_row_start(style: i64) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_row_start(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row(style: i64, start: CMasonGridPlacement, end: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_row(style as _, start.into(), end.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row_start(style: i64, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_row_start(style as _, value.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_grid_row_end(style: i64) -> CMasonGridPlacement {
    mason_core::ffi::style_get_grid_row_end(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_grid_row_end(style: i64, value: CMasonGridPlacement) {
    mason_core::ffi::style_set_grid_row_end(style as _, value.into())
}

// #[no_mangle]
// pub extern "C" fn mason_style_get_grid_template_rows(style: i64) -> Vec<CMasonTrackSizingFunction> {
//     mason_core::ffi::style_get_grid_template_rows(style as _)
//         .into_iter()
//         .map(CMasonTrackSizingFunction)
//         .collect()
// }

// #[no_mangle]
// pub extern "C" fn mason_style_set_grid_template_rows(style: i64, value: Vec<CMasonTrackSizingFunction>) {
//     mason_core::ffi::style_set_grid_template_rows(
//         style as _,
//         value.into_iter().map(|v| v.0).collect(),
//     )
// }

// #[no_mangle]
// pub extern "C" fn mason_style_get_grid_template_columns(style: i64) -> Vec<CMasonTrackSizingFunction> {
//     mason_core::ffi::style_get_grid_template_columns(style as _)
//         .into_iter()
//         .map(CMasonTrackSizingFunction)
//         .collect()
// }

// #[no_mangle]
// pub extern "C" fn mason_style_set_grid_template_columns(style: i64, value: Vec<CMasonTrackSizingFunction>) {
//     mason_core::ffi::style_set_grid_template_columns(
//         style as _,
//         value.into_iter().map(|v| v.0).collect(),
//     )
// }

#[no_mangle]
pub extern "C" fn mason_style_set_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    let width = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_width(style as _, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_width(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_width(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    let height = CMasonDimension::new(value, value_type);

    mason_core::ffi::style_set_height(style as _, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_height(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_height(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_node_mark_dirty(mason: i64, node: i64) {
    mason_core::ffi::node_mark_dirty(mason as _, node as _)
}

#[no_mangle]
pub extern "C" fn mason_node_dirty(mason: i64, node: i64) -> bool {
    mason_core::ffi::node_dirty(mason as _, node as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_display(style: i64, display: i32) {
    mason_core::ffi::style_set_display(style as _, display)
}

#[no_mangle]
pub extern "C" fn mason_style_get_display(style: i64) -> i32 {
    mason_core::ffi::style_get_display(style as _)
}

#[no_mangle]
pub extern "C" fn mason_node_compute(mason: i64, node: i64) {
    mason_core::ffi::node_compute(mason as _, node as _);
}

#[no_mangle]
pub extern "C" fn mason_node_compute_min_content(mason: i64, node: i64) {
    mason_core::ffi::node_compute_min_content(mason as _, node as _)
}

#[no_mangle]
pub extern "C" fn mason_node_compute_max_content(mason: i64, node: i64) {
    mason_core::ffi::node_compute_max_content(mason as _, node as _)
}

#[no_mangle]
pub extern "C" fn mason_node_compute_wh(mason: i64, node: i64, width: f32, height: f32) {
    mason_core::ffi::node_compute_wh(mason as _, node as _, width, height)
}

#[no_mangle]
pub extern "C" fn mason_style_get_position(style: i64) -> i32 {
    mason_core::ffi::style_get_position(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_position(style: i64, value: i32) {
    mason_core::ffi::style_set_position(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_wrap(style: i64) -> i32 {
    mason_core::ffi::style_get_flex_wrap(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_wrap(style: i64, value: i32) {
    mason_core::ffi::style_set_flex_wrap(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_items(style: i64) -> i32 {
    mason_core::ffi::style_get_align_items(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_items(style: i64, value: i32) {
    mason_core::ffi::style_set_align_items(style as _, value);
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_self(style: i64) -> i32 {
    mason_core::ffi::style_get_align_self(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_self(style: i64, value: i32) {
    mason_core::ffi::style_set_align_self(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_align_content(style: i64) -> i32 {
    mason_core::ffi::style_get_align_content(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_align_content(style: i64, value: i32) {
    mason_core::ffi::style_set_align_content(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_items(style: i64) -> i32 {
    mason_core::ffi::style_get_justify_items(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_items(style: i64, value: i32) {
    mason_core::ffi::style_set_justify_items(style as _, value);
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_self(style: i64) -> i32 {
    mason_core::ffi::style_get_justify_self(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_self(style: i64, value: i32) {
    mason_core::ffi::style_set_justify_self(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_justify_content(style: i64) -> i32 {
    mason_core::ffi::style_get_justify_content(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_justify_content(style: i64, value: i32) {
    mason_core::ffi::style_set_justify_content(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let inset = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset(style as _, inset.into());
}

#[allow(clippy::too_many_arguments)]
#[no_mangle]
pub extern "C" fn mason_style_set_inset_lrtb(
    style: i64,
    left_value: f32,
    left_value_type: CMasonLengthPercentageAutoType,
    right_value: f32,
    right_value_type: CMasonLengthPercentageAutoType,
    top_value: f32,
    top_value_type: CMasonLengthPercentageAutoType,
    bottom_value: f32,
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

    mason_core::ffi::style_set_inset_lrtb(style as _, left, right, top, bottom);
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_left(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_left(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_left(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_left(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_right(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_right(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_right(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_right(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_top(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_top(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_top(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_top(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_inset_bottom(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_inset_bottom(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_inset_bottom(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_inset_bottom(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let margin = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin(style as _, margin.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_left(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_left(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_left(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_left(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_right(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_right(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_right(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_right(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_top(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_top(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_top(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_top(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_margin_bottom(style: i64) -> CMasonLengthPercentageAuto {
    mason_core::ffi::style_get_margin_bottom(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_margin_bottom(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    let val = CMasonLengthPercentageAuto::new(value, value_type);
    mason_core::ffi::style_set_margin_bottom(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_border(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let border = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border(style as _, border.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_left(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_left(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_left(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_left(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_right(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_right(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_right(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_right(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_top(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_top(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_top(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_top(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_border_bottom(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_border_bottom(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_border_bottom(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_border_bottom(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_grow(style: i64, grow: f32) {
    mason_core::ffi::style_set_flex_grow(style as _, grow)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_grow(style: i64) -> f32 {
    mason_core::ffi::style_get_flex_grow(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_shrink(style: i64, shrink: f32) {
    mason_core::ffi::style_set_flex_shrink(style as _, shrink)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_shrink(style: i64) -> f32 {
    mason_core::ffi::style_get_flex_shrink(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_basis(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_flex_basis(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_basis(style: i64, value: f32, value_type: CMasonDimensionType) {
    let basis = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_flex_basis(style as _, basis.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_gap(style: i64) -> CMasonLengthPercentageSize {
    mason_core::ffi::style_get_gap(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_gap(
    style: i64,
    width_value: f32,
    width_type: CMasonLengthPercentageType,
    height_value: f32,
    height_type: CMasonLengthPercentageType,
) {
    let width = CMasonLengthPercentage::new(width_value, width_type);
    let height = CMasonLengthPercentage::new(height_value, height_type);
    mason_core::ffi::style_set_gap(style as _, width.into(), height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_set_row_gap(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let width = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_row_gap(style as _, width.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_row_gap(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_row_gap(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_column_gap(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let height = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_column_gap(style as _, height.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_column_gap(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_column_gap(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_aspect_ratio(style: i64, ratio: f32) {
    mason_core::ffi::style_set_aspect_ratio(style as _, ratio)
}

#[no_mangle]
pub extern "C" fn mason_style_get_aspect_ratio(style: i64) -> f32 {
    mason_core::ffi::style_get_aspect_ratio(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let padding = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding(style as _, padding.into());
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_left(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_left(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_left(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_left(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_right(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_right(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_right(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_right(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_top(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_top(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_top(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_top(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_padding_bottom(style: i64) -> CMasonLengthPercentage {
    mason_core::ffi::style_get_padding_bottom(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_padding_bottom(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    let val = CMasonLengthPercentage::new(value, value_type);
    mason_core::ffi::style_set_padding_bottom(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_flex_direction(style: i64) -> i32 {
    mason_core::ffi::style_get_flex_direction(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_flex_direction(style: i64, value: i32) {
    mason_core::ffi::style_set_flex_direction(style as _, value)
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_width(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_min_width(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    let val = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_min_width(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_min_height(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_min_height(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_min_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    let val = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_min_height(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_width(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_max_width(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    let val = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_max_width(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_style_get_max_height(style: i64) -> CMasonDimension {
    mason_core::ffi::style_get_max_height(style as _).into()
}

#[no_mangle]
pub extern "C" fn mason_style_set_max_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    let val = CMasonDimension::new(value, value_type);
    mason_core::ffi::style_set_max_height(style as _, val.into())
}

#[no_mangle]
pub extern "C" fn mason_node_update_and_set_style(mason: i64, node: i64, style: i64) {
    mason_core::ffi::node_update_and_set_style(mason as _, node as _, style as _);

    let jvm = get_java_vm().expect("JavaVM reference not found");
    let vm = jvm.attach_current_thread();
    let mut env = vm.unwrap();
    let clazz = env
        .find_class("org/nativescript/mason/masonkit/Node")
        .unwrap();
    env.call_static_method(&clazz, "requestLayout", "(J)V", &[JValue::Long(node)])
        .unwrap();
}

#[no_mangle]
pub extern "C" fn mason_style_set_scrollbar_width(style: i64, value: f32) {
    mason_core::ffi::style_set_scrollbar_width(style as _, value);
}

#[no_mangle]
pub extern "C" fn mason_style_get_scrollbar_width(style: i64) -> f32 {
    mason_core::ffi::style_get_scrollbar_width(style as _)
}

#[no_mangle]
pub extern "C" fn mason_style_set_overflow(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow(style as _, value);
}

fn overflow_to_int(value: Overflow) -> i32 {
    match value {
        Overflow::Visible => 0,
        Overflow::Hidden => 1,
        Overflow::Scroll => 2,
        Overflow::Clip => 3
    }
}

#[no_mangle]
pub extern "C" fn mason_style_set_overflow_x(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow_x(style as _, value);
}

#[no_mangle]
pub extern "C" fn mason_style_get_overflow_x(style: i64) -> i32 {
    overflow_to_int(mason_core::ffi::style_get_overflow_x(style as _))
}

#[no_mangle]
pub extern "C" fn mason_style_set_overflow_y(style: i64, value: i32) {
    mason_core::ffi::style_set_overflow_y(style as _, value);
}

#[no_mangle]
pub extern "C" fn mason_style_get_overflow_y(style: i64) -> i32 {
    overflow_to_int(mason_core::ffi::style_get_overflow_y(style as _))
}

/*

#[allow(clippy::too_many_arguments)]
#[no_mangle]
pub extern "C" fn mason_style_update_with_values(
    style: i64,
    display: i32,
    position: i32,
    direction: i32,
    flex_direction: i32,
    flex_wrap: i32,
    overflow: i32,
    align_items: i32,
    align_self: i32,
    align_content: i32,
    justify_items: i32,
    justify_self: i32,
    justify_content: i32,
    inset_left_type: i32,
    inset_left_value: f32,
    inset_right_type: i32,
    inset_right_value: f32,
    inset_top_type: i32,
    inset_top_value: f32,
    inset_bottom_type: i32,
    inset_bottom_value: f32,
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
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    grid_auto_rows: Vec<CMasonNonRepeatedTrackSizingFunction>,
    grid_auto_columns: Vec<CMasonNonRepeatedTrackSizingFunction>,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    grid_template_rows: Vec<CMasonTrackSizingFunction>,
    grid_template_columns: Vec<CMasonTrackSizingFunction>,
    overflow_x: i32,
    overflow_y: i32,
    scrollbar_width: f32,
) {
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
            grid_auto_rows.into_iter().map(|v| v.0).collect(),
            grid_auto_columns.into_iter().map(|v| v.0).collect(),
            grid_auto_flow,
            grid_column_start_type,
            grid_column_start_value,
            grid_column_end_type,
            grid_column_end_value,
            grid_row_start_type,
            grid_row_start_value,
            grid_row_end_type,
            grid_row_end_value,
            grid_template_rows.into_iter().map(|v| v.0).collect(),
            grid_template_columns.into_iter().map(|v| v.0).collect(),
            overflow_x,
            overflow_y,
            scrollbar_width,
        );
        Box::leak(style);
    }
}

*/