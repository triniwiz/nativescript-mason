extern crate core;
extern crate mason_c;
use std::ffi::c_void;
use std::sync::Arc;

use itertools::izip;
use jni::{JNIEnv, NativeMethod};
use jni::JavaVM;
use jni::objects::{GlobalRef, JClass, JMethodID, JObject, JValue};
use jni::sys::{jint, jlong};
use once_cell::sync::OnceCell;
use mason_c::ffi;

use mason_core::{
    auto,
    fit_content, flex

    , length, Mason, max_content, min_content
    , NonRepeatedTrackSizingFunction
    , percent, TaffyAuto,
    TrackSizingFunction,
};
use mason_core::LengthPercentage;

mod node;
pub mod style;

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

            let mason_method_names = ["nativeInit", "nativeClear", "nativeInitWithCapacity"];

            let mason_signatures = if ret >= ANDROID_O {
                ["()J", "(J)V", "(I)J"]
            } else {
                ["!()J", "!(J)V", "!(I)J"]
            };

            let mason_methods = if ret >= ANDROID_O {
                [
                    MasonNativeInit as *mut c_void,
                    MasonNativeClear as *mut c_void,
                    MasonNativeInitWithCapacity as *mut c_void,
                ]
            } else {
                [
                    MasonNativeInitNormal as *mut c_void,
                    MasonNativeClearNormal as *mut c_void,
                    MasonNativeInitWithCapacityNormal as *mut c_void,
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
                "nativeRemoveChildren",
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
                    node::NodeNativeRemoveContext as *mut c_void,
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
                    node::NodeNativeRemoveContextNormal as *mut c_void,
                ]
            };

            let node_native_methods: Vec<NativeMethod> =
                izip!(node_method_names, node_signatures, node_methods)
                    .map(|(name, signature, method)| NativeMethod {
                        name: name.into(),
                        sig: signature.into(),
                        fn_ptr: method,
                    })
                    .collect();

            let _ = env.register_native_methods(&node_class, node_native_methods.as_slice());

            let style_class = env.find_class(STYLE_CLASS).unwrap();

            let style_method_names = ["nativeInit", "nativeDestroy"];

            let style_signatures = if ret >= ANDROID_O {
                ["()J", "(J)V"]
            } else {
                ["!()J", "!(J)V"]
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
pub extern "system" fn MasonNativeInitWithCapacity(capacity: jint) -> jlong {
    Mason::with_capacity(capacity as usize).into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitWithCapacityNormal(
    _env: JNIEnv,
    _: JClass,
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
pub extern "system" fn MasonNativeClear(taffy: jlong) {
    native_clear(taffy);
}

#[no_mangle]
pub extern "system" fn MasonNativeClearNormal(_env: JNIEnv, _: JClass, taffy: jlong) {
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
pub extern "C" fn mason_node_update_and_set_style_android(mason: i64, node: i64, style: i64) {
    ffi::node_update_and_set_style(mason as _, node as _, style as _);

    let jvm = get_java_vm().expect("JavaVM reference not found");
    let vm = jvm.attach_current_thread();
    let mut env = vm.unwrap();
    let clazz = env
        .find_class("org/nativescript/mason/masonkit/Node")
        .unwrap();
    env.call_static_method(&clazz, "requestLayout", "(J)V", &[JValue::Long(node)])
        .unwrap();
}
