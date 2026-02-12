use android_logger::Config;
use itertools::izip;
use jni::objects::{GlobalRef, JClass, JFieldID, JMethodID, JObject};
use jni::signature::ReturnType;
use jni::sys::{jfloat, jint, jlong};
use jni::JavaVM;
use jni::{JNIEnv, NativeMethod};
use log::LevelFilter;
#[cfg(target_os = "android")]
use mason_core::{JVMCache, JVM, JVM_CACHE};
use mason_core::{Mason, NodeRef};
use once_cell::sync::OnceCell;
use std::ffi::c_void;

mod node;
pub mod style;

const INLINE_SEGMENT_CLASS: &str = "org/nativescript/mason/masonkit/InlineSegment";

const INLINE_SEGMENT_TEXT_CLASS: &str = "org/nativescript/mason/masonkit/InlineSegment$Text";

const INLINE_SEGMENT_INLINE_CHILD_CLASS: &str =
    "org/nativescript/mason/masonkit/InlineSegment$InlineChild";

const MEASURE_JNI_CLASS: &str = "org/nativescript/mason/masonkit/MeasureFuncImpl";

const NODE_CLASS: &str = "org/nativescript/mason/masonkit/Node";

const OBJECT_MANAGER_CLASS: &str = "org/nativescript/mason/masonkit/ObjectManager";

#[derive(Clone)]
pub struct InlineSegmentCacheItem {
    clazz: GlobalRef,
    text_clazz: GlobalRef,
    kind: JFieldID,
    inline_child_clazz: GlobalRef,
    text_width: JFieldID,
    text_ascent: JFieldID,
    text_descent: JFieldID,
    inline_node_ptr: JFieldID,
    inline_child_descent: JFieldID,
}

impl InlineSegmentCacheItem {
    pub fn new(
        clazz: GlobalRef,
        text_clazz: GlobalRef,
        inline_child_clazz: GlobalRef,
        kind: JFieldID,
        text_width: JFieldID,
        text_ascent: JFieldID,
        text_descent: JFieldID,
        inline_node_ptr: JFieldID,
        inline_child_descent: JFieldID,
    ) -> Self {
        Self {
            clazz,
            text_clazz,
            inline_child_clazz,
            kind,
            text_width,
            text_ascent,
            text_descent,
            inline_node_ptr,
            inline_child_descent,
        }
    }

    pub fn clazz(&self) -> JClass<'_> {
        let obj = unsafe { JObject::from_raw(self.clazz.as_raw()) };
        JClass::from(obj)
    }

    pub fn text(&self) -> JClass<'_> {
        let obj = unsafe { JObject::from_raw(self.text_clazz.as_raw()) };
        JClass::from(obj)
    }

    pub fn inline_child(&self) -> JClass<'_> {
        let obj = unsafe { JObject::from_raw(self.inline_child_clazz.as_raw()) };
        JClass::from(obj)
    }
}

pub static INLINE_SEGMENT: OnceCell<InlineSegmentCacheItem> = OnceCell::new();

const ANDROID_O: i32 = 26;

pub(crate) const BUILD_VERSION_CLASS: &str = "android/os/Build$VERSION";

const NATIVE_HELPERS_CLASS: &str = "org/nativescript/mason/masonkit/NativeHelpers";
const MASON_CLASS: &str = "org/nativescript/mason/masonkit/Mason";
const STYLE_CLASS: &str = "org/nativescript/mason/masonkit/Style";

#[no_mangle]
pub unsafe extern "system" fn JNI_OnLoad(vm: JavaVM, _reserved: *const c_void) -> jint {
    {
        android_logger::init_once(Config::default().with_max_level(LevelFilter::Info));

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
                "nativeInitWithCapacity",
                "nativeDestroy",
                "nativeSetDeviceScale",
                "nativeGetBuffer",
            ];

            let mason_signatures = if ret >= ANDROID_O {
                ["()J", "(J)V", "(I)J", "(J)V", "(JF)V", "(JI)I"]
            } else {
                ["!()J", "!(J)V", "!(I)J", "!(J)V", "!(JF)V", "!(JI)I"]
            };

            let mason_methods = if ret >= ANDROID_O {
                [
                    MasonNativeInit as *mut c_void,
                    MasonNativeClear as *mut c_void,
                    MasonNativeInitWithCapacity as *mut c_void,
                    MasonNativeDestroy as *mut c_void,
                    MasonNativeSetDeviceScale as *mut c_void,
                    MasonNativeGetBuffer as *mut c_void,
                ]
            } else {
                [
                    MasonNativeInitNormal as *mut c_void,
                    MasonNativeClearNormal as *mut c_void,
                    MasonNativeInitWithCapacityNormal as *mut c_void,
                    MasonNativeDestroy as *mut c_void,
                    MasonNativeSetDeviceScaleNormal as *mut c_void,
                    MasonNativeGetBuffer as *mut c_void,
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

            let native_helper_class = env.find_class(NATIVE_HELPERS_CLASS).unwrap();

            let native_helper_method_names = [
                "nativeNodeDestroy",
                "nativeNodeNew",
                "nativeNodeNewWithContext",
                "nativeNodeGetChildCount",
                "nativeNodeComputeWH",
                "nativeNodeComputeSize",
                "nativeNodeComputeMaxContent",
                "nativeNodeComputeMinContent",
                "nativeNodeCompute",
                "nativeNodeGetChildAt",
                "nativeNodeAddChild",
                "nativeNodeReplaceChildAt",
                "nativeNodeAddChildAt",
                "nativeNodeInsertChildBefore",
                "nativeNodeInsertChildAfter",
                "nativeNodeDirty",
                "nativeNodeMarkDirty",
                "nativeNodeRemoveChildren",
                "nativeNodeRemoveChildAt",
                "nativeNodeRemoveChild",
                "nativeNodeRemoveContext",
                "nativeNodeComputeWithSizeAndLayout",
                "nativeNodeGetChildren",
                "nativeNodeLayout",
                "nativeNodeNewText",
                "nativeNodeNewTextWithContext",
                "nativeNodeSetChildren",
                "nativeNodeSetSegments",
                "nativeNodeSetContext",
                "nativeSetAndroidNode",
                "nativeNodeNewImage",
                "nativeNodeNewImageWithContext",
                "nativeNodeNewLineBreak",
                "nativeNodeNewLineBreakWithContext",
                "nativeNodeNewListItem",
                "nativeNodeNewListItemWithContext",
                "nativeGetStateBuffer",
            ];

            let native_helper_signatures = if ret >= ANDROID_O {
                [
                    "(J)V",
                    "(JZ)J",
                    "(JIZ)J",
                    "(JJ)I",
                    "(JJFF)V",
                    "(JJJ)V",
                    "(JJ)V",
                    "(JJ)V",
                    "(JJ)V",
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
                    "(JJFF)[F",
                    "(JJ)[J",
                    "(JJ)[F",
                    "(JZ)J",
                    "(JIZ)J",
                    "(JJ[J)V",
                    "(JJ[Lorg/nativescript/mason/masonkit/InlineSegment;)V",
                    "(JJI)V",
                    "(JJI)V",
                    "(J)J",
                    "(JI)J",
                    "(J)J",
                    "(JI)J",
                    "(J)J",
                    "(JI)J",
                    "(JJ)I",
                ]
            } else {
                [
                    "!(J)V",
                    "!(JZ)J",
                    "!(JIZ)J",
                    "!(JJ)I",
                    "!(JJFF)V",
                    "!(JJJ)V",
                    "!(JJ)V",
                    "!(JJ)V",
                    "!(JJ)V",
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
                    "!(JJFF)[F",
                    "!(JJ)[J",
                    "!(JJ)[F",
                    "!(JZ)J",
                    "!(JIZ)J",
                    "!(JJ[J)V",
                    "!(JJ[Lorg/nativescript/mason/masonkit/InlineSegment;)V",
                    "!(JJI)V",
                    "!(JJI)V",
                    "!(J)J",
                    "!(JI)J",
                    "!(J)J",
                    "!(JI)J",
                    "!(J)J",
                    "!(JI)J",
                    "!(JJ)I",
                ]
            };

            let native_helper_methods = if ret >= ANDROID_O {
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
                    node::nativeComputeWithSizeAndLayout as *mut c_void,
                    node::nativeGetChildren as *mut c_void,
                    node::nativeLayout as *mut c_void,
                    node::NodeNativeNewTextNode as *mut c_void,
                    node::NodeNativeNewTextNodeWithContext as *mut c_void,
                    node::NodeNativeSetChildren as *mut c_void,
                    node::NodeNativeSetSegments as *mut c_void,
                    node::NodeNativeSetContext as *mut c_void,
                    node::NodeNativeSetAndroidNode as *mut c_void,
                    node::NodeNativeNewImageNode as *mut c_void,
                    node::NodeNativeNewImageNodeWithContext as *mut c_void,
                    node::NodeNativeNewLineBreakNodeNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeWithContext as *mut c_void,
                    node::NodeNativeNewListItemNodeNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeWithContext as *mut c_void,
                    node::NodeNativeGetStateBuffer as *mut c_void,
                ]
            } else {
                [
                    node::NodeNativeDestroyNormal as *mut c_void,
                    node::NodeNativeNewNodeNormal as *mut c_void,
                    node::NodeNativeNewNodeWithContextNormal as *mut c_void,
                    node::NodeNativeGetChildCountNormal as *mut c_void,
                    node::NodeNativeComputeWHNormal as *mut c_void,
                    node::NodeNativeComputeSizeNormal as *mut c_void,
                    node::NodeNativeComputeMaxContentNormal as *mut c_void,
                    node::NodeNativeComputeMinContentNormal as *mut c_void,
                    node::NodeNativeComputeNormal as *mut c_void,
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
                    node::nativeComputeWithSizeAndLayout as *mut c_void,
                    node::nativeGetChildren as *mut c_void,
                    node::nativeLayout as *mut c_void,
                    node::NodeNativeNewTextNodeNormal as *mut c_void,
                    node::NodeNativeNewTextNodeWithContextNormal as *mut c_void,
                    node::NodeNativeSetChildren as *mut c_void,
                    node::NodeNativeSetSegments as *mut c_void,
                    node::NodeNativeSetContextNormal as *mut c_void,
                    node::NodeNativeSetAndroidNodeNormal as *mut c_void,
                    node::NodeNativeNewImageNodeNormal as *mut c_void,
                    node::NodeNativeNewImageNodeWithContextNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeWithContextNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeWithContextNormal as *mut c_void,
                    node::NodeNativeGetStateBuffer as *mut c_void,
                ]
            };

            let node_native_methods: Vec<NativeMethod> = izip!(
                native_helper_method_names,
                native_helper_signatures,
                native_helper_methods
            )
            .map(|(name, signature, method)| NativeMethod {
                name: name.into(),
                sig: signature.into(),
                fn_ptr: method,
            })
            .collect();

            let _ =
                env.register_native_methods(&native_helper_class, node_native_methods.as_slice());

            let style_class = env.find_class(STYLE_CLASS).unwrap();

            let style_method_names = [
                "nativeGetStyleBuffer",
                "nativeGetGridArea",
                "nativeGetGridTemplateAreas",
                "nativeGetGridAutoRows",
                "nativeGetGridAutoColumns",
                "nativeGetGridColumn",
                "nativeGetGridColumnStart",
                "nativeGetGridColumnEnd",
                "nativeGetGridRow",
                "nativeGetGridRowStart",
                "nativeGetGridRowEnd",
                "nativeGetGridTemplateRows",
                "nativeGetGridTemplateColumns",
                "nativePrepareMut",
            ];

            let style_signatures = if ret >= ANDROID_O {
                [
                    "(JJ)I",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)Ljava/lang/String;",
                    "(JJ)I",
                ]
            } else {
                [
                    "!(JJ)I",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "!(JJ)Ljava/lang/String;",
                    "(JJ)I",
                ]
            };

            let style_methods = if ret >= ANDROID_O {
                [
                    style::nativeGetStyleBuffer as *mut c_void,
                    style::StyleNativeGetGridArea as *mut c_void,
                    style::StyleNativeGetGridTemplateAreas as *mut c_void,
                    style::StyleNativeGetGridAutoRows as *mut c_void,
                    style::StyleNativeGetGridAutoColumns as *mut c_void,
                    style::StyleNativeGetGridColumn as *mut c_void,
                    style::StyleNativeGetGridColumnStart as *mut c_void,
                    style::StyleNativeGetGridColumnEnd as *mut c_void,
                    style::StyleNativeGetGridRow as *mut c_void,
                    style::StyleNativeGetGridRowStart as *mut c_void,
                    style::StyleNativeGetGridRowEnd as *mut c_void,
                    style::StyleNativeGetGridTemplateRows as *mut c_void,
                    style::StyleNativeGetGridTemplateColumns as *mut c_void,
                    style::nativePrepareMut as *mut c_void,
                ]
            } else {
                [
                    style::nativeGetStyleBuffer as *mut c_void,
                    style::StyleNativeGetGridArea as *mut c_void,
                    style::StyleNativeGetGridTemplateAreas as *mut c_void,
                    style::StyleNativeGetGridAutoRows as *mut c_void,
                    style::StyleNativeGetGridAutoColumns as *mut c_void,
                    style::StyleNativeGetGridColumn as *mut c_void,
                    style::StyleNativeGetGridColumnStart as *mut c_void,
                    style::StyleNativeGetGridColumnEnd as *mut c_void,
                    style::StyleNativeGetGridRow as *mut c_void,
                    style::StyleNativeGetGridRowStart as *mut c_void,
                    style::StyleNativeGetGridRowEnd as *mut c_void,
                    style::StyleNativeGetGridTemplateRows as *mut c_void,
                    style::StyleNativeGetGridTemplateColumns as *mut c_void,
                    style::nativePrepareMut as *mut c_void,
                ]
            };

            let style_native_methods: Vec<NativeMethod> =
                izip!(style_method_names, style_signatures, style_methods)
                    .map(
                        |(name, signature, method): (&str, &str, *mut c_void)| NativeMethod {
                            name: name.into(),
                            sig: signature.into(),
                            fn_ptr: method,
                        },
                    )
                    .collect();

            let _ = env.register_native_methods(&style_class, style_native_methods.as_slice());

            let inline_segment_clazz = env.find_class(INLINE_SEGMENT_CLASS).unwrap();
            let inline_segment_text_clazz = env.find_class(INLINE_SEGMENT_TEXT_CLASS).unwrap();
            let inline_segment_inline_child_clazz =
                env.find_class(INLINE_SEGMENT_INLINE_CHILD_CLASS).unwrap();

            let inline_segment_kind = env
                .get_field_id(&inline_segment_clazz, "kind", "I")
                .unwrap();

            let inline_segment_text_width = env
                .get_field_id(&inline_segment_text_clazz, "width", "F")
                .unwrap();

            let inline_segment_text_ascent = env
                .get_field_id(&inline_segment_text_clazz, "ascent", "F")
                .unwrap();

            let inline_segment_text_descent = env
                .get_field_id(&inline_segment_text_clazz, "descent", "F")
                .unwrap();

            let inline_segment_inline_child_node_ptr = env
                .get_field_id(&inline_segment_inline_child_clazz, "nodePtr", "J")
                .unwrap();

            let inline_segment_inline_child_descent = env
                .get_field_id(&inline_segment_inline_child_clazz, "descent", "F")
                .unwrap();

            INLINE_SEGMENT.get_or_init(|| {
                InlineSegmentCacheItem::new(
                    env.new_global_ref(inline_segment_clazz).unwrap(),
                    env.new_global_ref(inline_segment_text_clazz).unwrap(),
                    env.new_global_ref(inline_segment_inline_child_clazz)
                        .unwrap(),
                    inline_segment_kind,
                    inline_segment_text_width,
                    inline_segment_text_ascent,
                    inline_segment_text_descent,
                    inline_segment_inline_child_node_ptr,
                    inline_segment_inline_child_descent,
                )
            });

            let object_manager_clazz = env.find_class(OBJECT_MANAGER_CLASS).unwrap();

            let node_clazz = env.find_class(NODE_CLASS).unwrap();

            let measure_id = env
                .get_static_method_id(&node_clazz, "measure", "(IJJ)J")
                .unwrap();

            let set_computed_size_id = env
                .get_static_method_id(&node_clazz, "setComputedSize", "(IFF)V")
                .unwrap();

            let object_manager_add_id = env
                .get_static_method_id(&object_manager_clazz, "addItem", "(Ljava/lang/Object;)I")
                .unwrap();

            JVM_CACHE.get_or_init(|| {
                JVMCache::new(
                    env.new_global_ref(node_clazz).unwrap(),
                    measure_id,
                    set_computed_size_id,
                    env.new_global_ref(object_manager_clazz).unwrap(),
                    object_manager_add_id,
                )
            });
        }

        let _ = vm.attach_current_thread_permanently();
        JVM.get_or_init(|| vm);

        log::info!("Mason library loaded");
    }

    jni::sys::JNI_VERSION_1_6
}

#[no_mangle]
pub extern "system" fn MasonNativeInit() -> jlong {
    Box::into_raw(Box::new(Mason::new())) as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitNormal(_env: JNIEnv, _: JClass) -> jlong {
    Box::into_raw(Box::new(Mason::new())) as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitWithCapacity(capacity: jint) -> jlong {
    Box::into_raw(Box::new(Mason::with_capacity(capacity as usize))) as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeInitWithCapacityNormal(
    _env: JNIEnv,
    _: JClass,
    capacity: jint,
) -> jlong {
    Box::into_raw(Box::new(Mason::with_capacity(capacity as usize))) as jlong
}

#[no_mangle]
pub extern "system" fn MasonNativeGetBuffer(
    mut env: JNIEnv,
    _: JClass,
    mason: jlong,
    handle: jint,
) -> jint {
    if mason == 0 {
        return -1;
    }

    match handle.try_into() {
        Ok(handle) => {
            unsafe {
                let mut mason = &mut *(mason as *mut Mason);
                let buffer = mason.buffer_from(handle).unwrap_or(-1);

                // try to create the buffer if it's valid
                if buffer == -1 {
                    if let Some((ptr, len)) = mason.buffer_raw_mut_from(handle) {
                        return match env.new_direct_byte_buffer(ptr as _, len) {
                            Ok(buffer) => match mason_core::JVM_CACHE.get() {
                                Some(cache) => {
                                    let manager = unsafe {
                                        JClass::from_raw(cache.object_manager_clazz.as_raw())
                                    };
                                    let result = unsafe {
                                        env.call_static_method_unchecked(
                                            manager,
                                            cache.object_manager_add_id,
                                            ReturnType::Primitive(jni::signature::Primitive::Int),
                                            &[jni::sys::jvalue {
                                                l: buffer.into_raw(),
                                            }],
                                        )
                                    };

                                    return match result {
                                        Ok(result) => {
                                            let ret = result.i().unwrap_or(-1);
                                            mason.set_handle_buffer(handle, ret);
                                             ret
                                        }
                                        Err(_) => -1,
                                    }
                                }
                                None => -1,
                            },
                            Err(_) => -1,
                        }
                    }
                }

                buffer
            }
        }
        Err(_) => return -1,
    }
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

fn native_set_device_scale(taffy: jlong, scale: jfloat) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        mason.set_device_scale(scale);
        Box::leak(mason);
    }
}

#[no_mangle]
pub extern "system" fn MasonNativeSetDeviceScale(taffy: jlong, scale: jfloat) {
    native_set_device_scale(taffy, scale);
}

#[no_mangle]
pub extern "system" fn MasonNativeSetDeviceScaleNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    scale: jfloat,
) {
    native_set_device_scale(taffy, scale);
}

#[inline(always)]
fn mason_release(taffy: jlong) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(taffy as *mut Mason);
    }
}

#[no_mangle]
pub extern "system" fn MasonNativeDestroy(taffy: jlong) {
    mason_release(taffy);
}

#[no_mangle]
pub extern "system" fn MasonNativeDestroyNormal(_env: JNIEnv, _: JClass, taffy: jlong) {
    mason_release(taffy);
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePrintTree(
    _: JNIEnv,
    _: JObject,
    mason: jlong,
    node: jlong,
) {
    if mason == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &*(mason as *const Mason);
        let node = &*(node as *const NodeRef);
        mason.print_tree(node.id());
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePrintArenaStats(
    _: JNIEnv,
    _: JObject,
    mason: jlong,
) {
    if mason == 0 {
        return;
    }
    unsafe {
        let mason = &*(mason as *const Mason);
        let stats = mason.arena_state();

        log::info!("Arena stats: {:#?}", stats);
    }
}
