use android_logger::Config;
use itertools::izip;
use jni::objects::{GlobalRef, JByteArray, JClass, JFieldID, JMethodID, JObject, JString};
use jni::sys::{jbyte, jbyteArray, jfloat, jfloatArray, jint, jlong};
use jni::JavaVM;
use jni::{JNIEnv, NativeMethod};
use log::LevelFilter;
#[cfg(target_os = "android")]
use mason_core::{JVMCache, JVM, JVM_CACHE};
use mason_core::style::css::gradient::{parse_gradient, Gradient, GradientKind};
use mason_core::style::css::clip_path::ClipPath;
use mason_core::style::css::mask::{parse_layers as parse_mask_layers, MaskLayer, LONGHAND_COUNT};
use mason_core::style::css::nine_slice::{self, Kind as NineSliceKind, NineSlice};
use mason_core::style::css::svg_path::parse_svg_path;
use mason_core::style::css::transform::TransformProgram;
use mason_core::style::css::background::{
    parse_layer_properties, Axis, BackgroundProgram, Image, Layer, LayerProperty,
};
use std::sync::Arc;
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
    text_flags: JFieldID,
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
        text_flags: JFieldID,
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
            text_flags,
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
            ];

            let mason_signatures = if ret >= ANDROID_O {
                ["()J", "(J)V", "(I)J", "(J)V", "(JF)V"]
            } else {
                ["!()J", "!(J)V", "!(I)J", "!(J)V", "!(JF)V"]
            };

            let mason_methods = if ret >= ANDROID_O {
                [
                    MasonNativeInit as *mut c_void,
                    MasonNativeClear as *mut c_void,
                    MasonNativeInitWithCapacity as *mut c_void,
                    MasonNativeDestroy as *mut c_void,
                    MasonNativeSetDeviceScale as *mut c_void,
                ]
            } else {
                [
                    MasonNativeInitNormal as *mut c_void,
                    MasonNativeClearNormal as *mut c_void,
                    MasonNativeInitWithCapacityNormal as *mut c_void,
                    MasonNativeDestroy as *mut c_void,
                    MasonNativeSetDeviceScaleNormal as *mut c_void,
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
                "nativeNodeLayoutInto",
                "nativeNodeGetFloatRectWithIds",
                "nativeNodeGetFloatRects",
                "nativeNodeNewText",
                "nativeNodeNewTextWithContext",
                "nativeNodeSetChildren",
                "nativeNodeSetSegments",
                "nativeNodeSetContext",
                "nativeSetAndroidNode",
                "nativeNodeNewImage",
                "nativeNodeNewImageWithContext",
                "nativeNodeNewButton",
                "nativeNodeNewButtonWithContext",
                "nativeNodeNewLineBreak",
                "nativeNodeNewLineBreakWithContext",
                "nativeNodeNewListItem",
                "nativeNodeNewListItemWithContext",
                "nativeGetStateBuffer",
                "nativeNodeSetSegmentsPacked",
                "nativeNodeComputeWithSizeAndLayoutInto",
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
                    "(JJ[F)I",
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
                    "(J)J",
                    "(JI)J",
                    "(JJ)I",
                    "(JJ[F[J[I)V",
                    "(JJFF[F)I",
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
                    "!(JJ[F)I",
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
                    "!(J)J",
                    "!(JI)J",
                    "!(JJ)I",
                    "!(JJ[F[J[I)V",
                    "!(JJFF[F)I",
                ]
            };

            let native_helper_methods = if ret >= ANDROID_O {
                [
                    node::NodeNativeDestroy as *mut c_void,
                    node::NodeNativeNewNode as *mut c_void,
                    node::NodeNativeNewNodeWithContext as *mut c_void,
                    node::NodeNativeGetChildCount as *mut c_void,
                    // FastNative (not CriticalNative) on the Java side now — these can call
                    // back into Java (see NodeMeasure::measure), so they need a real JNIEnv,
                    // hence the *Normal fn pointers even on this ANDROID_O+ branch.
                    node::NodeNativeComputeWHNormal as *mut c_void,
                    node::NodeNativeComputeSizeNormal as *mut c_void,
                    node::NodeNativeComputeMaxContentNormal as *mut c_void,
                    node::NodeNativeComputeMinContentNormal as *mut c_void,
                    node::NodeNativeComputeNormal as *mut c_void,
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
                    node::nativeLayoutInto as *mut c_void,
                    node::NativeNodeGetFloatRectWithIds as *mut c_void,
                    node::nativeGetFloatRects as *mut c_void,
                    node::NodeNativeNewTextNode as *mut c_void,
                    node::NodeNativeNewTextNodeWithContext as *mut c_void,
                    node::NodeNativeSetChildren as *mut c_void,
                    node::NodeNativeSetSegments as *mut c_void,
                    node::NodeNativeSetContext as *mut c_void,
                    node::NodeNativeSetAndroidNode as *mut c_void,
                    node::NodeNativeNewImageNode as *mut c_void,
                    node::NodeNativeNewImageNodeWithContext as *mut c_void,
                    node::NodeNativeNewButtonNode as *mut c_void,
                    node::NodeNativeNewButtonNodeWithContext as *mut c_void,
                    node::NodeNativeNewLineBreakNodeNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeWithContext as *mut c_void,
                    node::NodeNativeNewListItemNodeNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeWithContext as *mut c_void,
                    node::NodeNativeGetStateBuffer as *mut c_void,
                    node::NodeNativeSetSegmentsPacked as *mut c_void,
                    node::nativeComputeWithSizeAndLayoutInto as *mut c_void,
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
                    node::nativeLayoutInto as *mut c_void,
                    node::NativeNodeGetFloatRectWithIds as *mut c_void,
                    node::nativeGetFloatRects as *mut c_void,
                    node::NodeNativeNewTextNodeNormal as *mut c_void,
                    node::NodeNativeNewTextNodeWithContextNormal as *mut c_void,
                    node::NodeNativeSetChildren as *mut c_void,
                    node::NodeNativeSetSegments as *mut c_void,
                    node::NodeNativeSetContextNormal as *mut c_void,
                    node::NodeNativeSetAndroidNodeNormal as *mut c_void,
                    node::NodeNativeNewImageNodeNormal as *mut c_void,
                    node::NodeNativeNewImageNodeWithContextNormal as *mut c_void,
                    node::NodeNativeNewButtonNodeNormal as *mut c_void,
                    node::NodeNativeNewButtonNodeWithContextNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeNormal as *mut c_void,
                    node::NodeNativeNewLineBreakNodeWithContextNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeNormal as *mut c_void,
                    node::NodeNativeNewListItemNodeWithContextNormal as *mut c_void,
                    node::NodeNativeGetStateBuffer as *mut c_void,
                    node::NodeNativeSetSegmentsPacked as *mut c_void,
                    node::nativeComputeWithSizeAndLayoutInto as *mut c_void,
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
                "nativePrepareStyleSlot",
                "nativeStyleChunk",
                "nativeStyleSlot",
                "nativePseudoStyleSlot",
                "nativePreparePseudoSlot",
            ];

            let style_signatures = if ret >= ANDROID_O {
                [
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
                    "(JI)Ljava/nio/ByteBuffer;",
                    "(JJ)I",
                    "(JJI)I",
                    "(JJI)I",
                ]
            } else {
                [
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
                    "(JI)Ljava/nio/ByteBuffer;",
                    "(JJ)I",
                    "(JJI)I",
                    "(JJI)I",
                ]
            };

            let style_methods = if ret >= ANDROID_O {
                [
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
                    style::nativePrepareStyleSlot as *mut c_void,
                    style::nativeStyleChunk as *mut c_void,
                    style::nativeStyleSlot as *mut c_void,
                    style::nativePseudoStyleSlot as *mut c_void,
                    style::nativePreparePseudoSlot as *mut c_void,
                ]
            } else {
                [
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
                    style::nativePrepareStyleSlotNormal as *mut c_void,
                    style::nativeStyleChunk as *mut c_void,
                    style::nativeStyleSlotNormal as *mut c_void,
                    style::nativePseudoStyleSlotNormal as *mut c_void,
                    style::nativePreparePseudoSlotNormal as *mut c_void,
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

            let inline_segment_text_flags = env
                .get_field_id(&inline_segment_text_clazz, "flags", "B")
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
                    inline_segment_text_flags,
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

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeDebugStats<'a>(
    mut env: JNIEnv<'a>,
    _: JObject,
    mason: jlong,
) -> jni::objects::JLongArray<'a> {
    let mut values = [0i64; 6];
    if mason != 0 {
        unsafe {
            let mason = &*(mason as *const Mason);
            let stats = mason.arena_state();
            values = [
                mason.node_count() as i64,
                stats.total_buffers as i64,
                stats.active_buffers as i64,
                stats.shared_buffers as i64,
                stats.free_slots as i64,
                stats.buffer_memory as i64,
            ];
        }
    }
    let array = env.new_long_array(values.len() as i32).unwrap();
    let _ = env.set_long_array_region(&array, 0, &values);
    array
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeSetPreflight(
    _: JNIEnv,
    _: JObject,
    mason: jlong,
    enabled: jni::sys::jboolean,
) {
    mason_core::PREFLIGHT_ENABLED.store(enabled != 0, std::sync::atomic::Ordering::Relaxed);
    if mason == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(mason as *mut Mason);
        mason.reset_arena_defaults();
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGetPreflight(
    _: JNIEnv,
    _: JObject,
) -> jni::sys::jboolean {
    if mason_core::PREFLIGHT_ENABLED.load(std::sync::atomic::Ordering::Relaxed) {
        1
    } else {
        0
    }
}

/// User-agent default (font-size, margin) for a block text tag ("p",
/// "h1".."h6", "blockquote", "pre"), in unscaled CSS px. Callers apply their
/// own density multiplier. Returns a 5-element array
/// `[font_size, margin_top, margin_bottom, margin_left, margin_right]`, or an
/// empty array if `tag` has no UA default.
#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeUaDefaultForTag(
    mut env: JNIEnv,
    _: JClass,
    tag: JString,
) -> jfloatArray {
    let tag = crate::style::get_string_lossy(&mut env, &tag);
    let value = tag.and_then(|tag| mason_core::utils::ua_default_for_tag(&tag));
    match value {
        Some(value) => {
            let values = [
                value.font_size,
                value.margin_top,
                value.margin_bottom,
                value.margin_left,
                value.margin_right,
            ];
            match env.new_float_array(values.len() as i32) {
                Ok(array) => {
                    if let Err(_) = env.set_float_array_region(&array, 0, &values) {}
                    array.into_raw()
                }
                Err(_) => env.new_float_array(0_i32).unwrap().into_raw(),
            }
        }
        None => env.new_float_array(0_i32).unwrap().into_raw(),
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeParseCss<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    value: JString<'a>,
    kind: jint,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    current_color: jint,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::LengthContext;

    let Some(value) = crate::style::get_string_lossy(&mut env, &value) else {
        return jni::objects::JDoubleArray::default();
    };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let values = u8::try_from(kind)
        .ok()
        .and_then(|kind| mason_core::style::css::parse_css_fields(&value, context, kind, current_color as u32))
        .unwrap_or_default();
    let Ok(len) = i32::try_from(values.len()) else {
        return jni::objects::JDoubleArray::default();
    };
    let Ok(array) = env.new_double_array(len) else {
        return jni::objects::JDoubleArray::default();
    };
    if env.set_double_array_region(&array, 0, &values).is_err() {
        return jni::objects::JDoubleArray::default();
    }
    array
}


#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeSetStyleCssRecords<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    mason: jlong,
    node: jlong,
    kind: jint,
    value: JString<'a>,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    current_color: jint,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::{LengthContext, StyleRecordKind};
    let (Some(kind), Some(value)) = (
        u8::try_from(kind).ok().and_then(StyleRecordKind::from_index),
        crate::style::get_string_lossy(&mut env, &value),
    ) else { return Default::default(); };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let Some(parsed) = kind.parse(&value, context, current_color as u32) else {
        return Default::default();
    };
    let mut records: std::sync::Arc<[f64]> = parsed.into();
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            let Some(stored) = mason.set_style_css_records(node.id(), kind, records) else {
                return Default::default();
            };
            records = stored;
        } else {
            node.defer_style_css_records(kind, std::sync::Arc::clone(&records));
        }
    }
    if records.is_empty() && !kind.stores_empty() {
        return Default::default();
    }
    let result = (|| {
        let len = i32::try_from(records.len()).ok()?;
        let output = env.new_double_array(len).ok()?;
        env.set_double_array_region(&output, 0, &records).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeApplyEffectBatch<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    mason: jlong,
    node: jlong,
    input: jni::objects::JByteArray<'a>,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    current_color: jint,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::{CssEffectResultRecord as Result, EffectBatch, LengthContext, StyleRecordKind};
    let result = (|| {
        let bytes = env.convert_byte_array(input).ok()?;
        let input = std::str::from_utf8(&bytes).ok()?;
        let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
        let batch = EffectBatch::parse(input, context, current_color as u32)?;
        let output = env.new_object_array((StyleRecordKind::COUNT * Result::STRIDE) as i32,
            "java/lang/Object", JObject::null()).ok()?;
        for (kind, effect) in batch.iter() {
            let base = kind as usize * Result::STRIDE;
            let css = env.new_string(&effect.value).ok()?;
            let records = env.new_double_array(i32::try_from(effect.records.len()).ok()?).ok()?;
            env.set_double_array_region(&records, 0, &effect.records).ok()?;
            env.set_object_array_element(&output, (base + Result::VALUE) as i32, css).ok()?;
            env.set_object_array_element(&output, (base + Result::RECORDS) as i32, records).ok()?;
        }
        if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
            if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
                mason.set_style_css_effects(node.id(), &batch);
            } else {
                node.defer_style_css_effects(&batch);
            }
        }
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeFlushStyleCssRecords(
    _: JNIEnv,
    _: JClass,
    mason: jlong,
) {
    if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
        mason.flush_style_css_records();
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTransformParse(
    mut env: JNIEnv,
    _: JClass,
    value: JString,
) -> jlong {
    crate::style::get_string_lossy(&mut env, &value)
        .and_then(|value| TransformProgram::parse(&value))
        .map_or(0, |program| Box::into_raw(Box::new(Arc::new(program))) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClipPathParse(
    mut env: JNIEnv, _: JClass, value: JString,
) -> jlong {
    crate::style::get_string_lossy(&mut env, &value).and_then(|value| ClipPath::parse(&value))
        .map_or(0, |clip| Box::into_raw(Box::new(Arc::new(clip))) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClipPathRelease(
    _: JNIEnv, _: JClass, handle: jlong,
) {
    if handle != 0 { unsafe { drop(Box::from_raw(handle as *mut Arc<ClipPath>)) } }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClipPathInstall(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, mason: jlong, node: jlong,
) {
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        let clip = unsafe { (handle as *const Arc<ClipPath>).as_ref() }.cloned();
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            mason.set_style_css_clip_path(node.id(), clip);
        } else {
            node.defer_style_css_clip_path(clip);
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeSvgPathRecords<'a>(
    mut env: JNIEnv<'a>, _: JClass<'a>, input: JString<'a>,
) -> jni::objects::JDoubleArray<'a> {
    let Some(input) = crate::style::get_string_lossy(&mut env, &input) else {
        return Default::default();
    };
    let records = parse_svg_path(&input);
    let result = (|| {
        let output = env.new_double_array(i32::try_from(records.len()).ok()?).ok()?;
        env.set_double_array_region(&output, 0, &records).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClipPathRecords<'a>(
    env: JNIEnv<'a>, _: JClass<'a>, _owner: JObject<'a>, handle: jlong, scale: jfloat,
    font_size: jfloat, root_font_size: jfloat, viewport_width: jfloat, viewport_height: jfloat,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::LengthContext;
    let clip = unsafe { &*(handle as *const Arc<ClipPath>) };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let values = clip.records(context);
    let result = (|| {
        let output = env.new_double_array(i32::try_from(values.len()).ok()?).ok()?;
        env.set_double_array_region(&output, 0, &values).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClipPathOffset(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, index: jint,
) -> jlong {
    let clip = unsafe { &*(handle as *const Arc<ClipPath>) };
    paint_offset_address(clip.offset(index as usize))
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTransformIsEmpty(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) -> jni::sys::jboolean {
    u8::from(unsafe { &*(handle as *const Arc<TransformProgram>) }.is_empty())
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTransformRelease(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Arc<TransformProgram>)) }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTransformInstall(
    _: JNIEnv,
    _: JClass,
    _owner: JObject,
    handle: jlong,
    mason: jlong,
    node: jlong,
) {
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        let transform = unsafe { (handle as *const Arc<TransformProgram>).as_ref() }.cloned();
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            mason.set_style_css_transform(node.id(), transform);
        } else {
            node.defer_style_css_transform(transform);
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTransformAffine<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    width: jfloat,
    height: jfloat,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
) -> jni::objects::JFloatArray<'a> {
    use mason_core::style::css::LengthContext;
    let transform = unsafe { &*(handle as *const Arc<TransformProgram>) };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let values = transform.affine(context, width, height);
    if values.iter().any(|value| !value.is_finite()) {
        return Default::default();
    }
    let result = (|| {
        let array = env.new_float_array(values.len() as i32)?;
        env.set_float_array_region(&array, 0, &values)?;
        Ok::<_, jni::errors::Error>(array)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeFilterParse(
    mut env: JNIEnv,
    _: JClass,
    value: JString,
) -> jlong {
    use mason_core::style::css::FilterProgram;
    crate::style::get_string_lossy(&mut env, &value).map_or(0, |css| {
        Box::into_raw(Box::new(FilterProgram::parse(&css))) as jlong
    })
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeFilterRelease(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) {
    use mason_core::style::css::FilterProgram;
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut FilterProgram)); }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeFilterProject<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    current_color: jint,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::{FilterProgram, LengthContext};

    let Some(filter) = (unsafe { (handle as *const FilterProgram).as_ref() }) else {
        return Default::default();
    };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let records = filter.records(context, current_color as u32);
    let result = (|| {
        let len = i32::try_from(records.len()).ok()?;
        let output = env.new_double_array(len).ok()?;
        env.set_double_array_region(&output, 0, &records).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundLonghandParse(
    mut env: JNIEnv,
    _: JClass,
    property: JString,
    value: JString,
    allow_invalid_entries: jni::sys::jboolean,
) -> jlong {
    let (Some(property), Some(value)) = (
        crate::style::get_string_lossy(&mut env, &property),
        crate::style::get_string_lossy(&mut env, &value),
    ) else {
        return 0;
    };
    parse_layer_properties(&property, &value, allow_invalid_entries != 0)
        .map_or(0, |values| Box::into_raw(Box::new(values)) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundLonghandRelease(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Vec<LayerProperty>)) };
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundLonghandRecords<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    scale: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::LengthContext;

    let properties = unsafe { &*(handle as *const Vec<LayerProperty>) };
    let context = LengthContext {
        scale, font_size: root_font_size, root_font_size, viewport_width, viewport_height,
    };
    let records: Vec<_> = properties.iter().flat_map(|value| value.record(context)).collect();
    let result = (|| {
        let output = env.new_double_array(records.len() as i32)?;
        env.set_double_array_region(&output, 0, &records)?;
        Ok::<_, jni::errors::Error>(output)
    })();
    result.unwrap_or_default()
}

fn paint_offset_address(axis: Option<&Axis>) -> jlong {
    axis.filter(|axis| axis.has_math())
        .map_or(0, |axis| std::ptr::from_ref(axis) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundLonghandOffset(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, index: jint,
) -> jlong {
    let properties = unsafe { &*(handle as *const Vec<LayerProperty>) };
    paint_offset_address(properties.first().and_then(|value| value.offset(index as usize)))
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePaintOffsetRetain(
    _: JNIEnv, _: JClass, _owner: JObject, address: jlong,
) -> jlong {
    let axis = unsafe { &*(address as *const Axis) };
    Box::into_raw(Box::new(axis.clone())) as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePaintOffsetRelease(
    _: JNIEnv, _: JClass, handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Axis)); }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePaintOffsetResolve(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, basis: jfloat, scale: jfloat,
    font_size: jfloat, root_font_size: jfloat, viewport_width: jfloat, viewport_height: jfloat,
) -> jfloat {
    let axis = unsafe { &*(handle as *const Axis) };
    let context = mason_core::style::css::LengthContext {
        scale, font_size, root_font_size, viewport_width, viewport_height,
    };
    axis.resolve(basis, context)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePaintOffsetText<'a>(
    env: JNIEnv<'a>, _: JClass<'a>, _owner: JObject<'a>, handle: jlong, horizontal: jni::sys::jboolean,
) -> JString<'a> {
    let axis = unsafe { &*(handle as *const Axis) };
    axis.math_text(horizontal != 0).and_then(|text| env.new_string(text).ok()).unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundCreate(
    _: JNIEnv,
    _: JClass,
) -> jlong {
    Box::into_raw(Box::new(BackgroundProgram::default())) as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundParse(
    mut env: JNIEnv,
    _: JClass,
    value: JString,
    current_color: jint,
) -> jlong {
    crate::style::get_string_lossy(&mut env, &value)
        .and_then(|value| BackgroundProgram::parse(&value, current_color as u32))
        .map_or(0, |program| Box::into_raw(Box::new(program)) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundRelease(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut BackgroundProgram)) }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundInstall(
    _: JNIEnv,
    _: JClass,
    _owner: JObject,
    handle: jlong,
    mason: jlong,
    node: jlong,
) {
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        let background = unsafe { (handle as *const BackgroundProgram).as_ref() };
        let layers = background.map_or_else(|| Arc::from([]), |value| Arc::clone(value.layers()));
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            mason.set_style_css_background(node.id(), layers);
        } else {
            node.defer_style_css_background(layers);
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundReplace(
    mut env: JNIEnv,
    _: JClass,
    _owner: JObject,
    handle: jlong,
    value: JString,
    current_color: jint,
) -> jlong {
    let Some(value) = crate::style::get_string_lossy(&mut env, &value) else {
        return -2;
    };
    let background = unsafe { &mut *(handle as *mut BackgroundProgram) };
    background.replace_mobile(&value, current_color as u32)
        .map_or(-2, |color| color.map_or(-1, i64::from))
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundSetLonghand(
    mut env: JNIEnv,
    _: JClass,
    _owner: JObject,
    handle: jlong,
    property: JString,
    value: JString,
) -> jint {
    let (Some(property), Some(value)) = (
        crate::style::get_string_lossy(&mut env, &property),
        crate::style::get_string_lossy(&mut env, &value),
    ) else {
        return -1;
    };
    let background = unsafe { &mut *(handle as *mut BackgroundProgram) };
    background.set_mobile_longhand(&property, &value).map_or(-1, i32::from)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundApply<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    input: jni::objects::JByteArray<'a>,
    current_color: jint,
) -> jni::objects::JLongArray<'a> {
    use mason_core::style::css::CssBackgroundResultRecord as Result;
    let result = (|| {
        let bytes = env.convert_byte_array(input).ok()?;
        let input = std::str::from_utf8(&bytes).ok()?;
        let output = env.new_long_array(Result::STRIDE as i32).ok()?;
        let background = unsafe { &mut *(handle as *mut BackgroundProgram) };
        let fields = background.apply_mobile_batch(input, current_color as u32)?;
        env.set_long_array_region(&output, 0, &fields).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBackgroundRead<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    reused_layers: jint,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::LengthContext;

    let background = unsafe { &*(handle as *const BackgroundProgram) };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let layers = PaintSnapshot::Background(Arc::clone(background.layers()));
    read_paint_snapshot(env, layers, context, reused_layers.max(0) as usize)
}

// A projection can outlive the program that produced it. Keep the immutable
// layer array alive while Kotlin holds any of its gradient or math addresses.
enum PaintSnapshot {
    Background(Arc<[Layer]>),
    Mask(Arc<[MaskLayer]>),
}

fn read_paint_snapshot<'env>(
    mut env: JNIEnv<'env>,
    snapshot: PaintSnapshot,
    context: mason_core::style::css::LengthContext,
    reused_layers: usize,
) -> jni::objects::JObjectArray<'env> {
    use mason_core::style::css::AndroidPaintReadRecord;
    let result = (|| {
        let (output, needs_snapshot) = match &snapshot {
            PaintSnapshot::Background(layers) => paint_records(
                &mut env, layers.iter().map(|layer| (layer, [])), context, reused_layers,
            )?,
            PaintSnapshot::Mask(layers) => paint_records(
                &mut env, layers.iter().map(|layer| (&layer.paint, layer.record())), context, 0,
            )?,
        };
        if needs_snapshot {
            let snapshot = Box::new(snapshot);
            let address = std::ptr::from_ref(snapshot.as_ref()) as jlong;
            let owner = env.new_object("java/lang/Long", "(J)V", &[jni::objects::JValue::Long(address)])?;
            env.set_object_array_element(&output, AndroidPaintReadRecord::SNAPSHOT as i32, owner)?;
            let _ = Box::into_raw(snapshot);
        }
        Ok::<_, jni::errors::Error>(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativePaintSnapshotRelease(
    _: JNIEnv, _: JClass, handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut PaintSnapshot)) }
    }
}

fn paint_records<'env, 'layer, const EXTRA: usize>(
    env: &mut JNIEnv<'env>,
    layers: impl ExactSizeIterator<Item = (&'layer Layer, [f64; EXTRA])>,
    context: mason_core::style::css::LengthContext,
    reused_layers: usize,
) -> jni::errors::Result<(jni::objects::JObjectArray<'env>, bool)> {
    use mason_core::style::css::{AndroidGradientInfoRecord, AndroidPaintReadRecord as Read, BackgroundRecord};
    let count = layers.len();
    let images = env.new_object_array(count as i32, "java/lang/String", JObject::null())?;
    let mut values = Vec::with_capacity(count * (BackgroundRecord::STRIDE + EXTRA));
    let mut offsets = Vec::new();
    let mut gradients = Vec::new();
    let mut gradient_info = None;
    for (index, (layer, extra)) in layers.enumerate() {
        if index >= reused_layers {
            match &layer.image {
                Some(Image::Url(url)) => {
                    let image = env.auto_local(env.new_string(url.as_ref())?);
                    env.set_object_array_element(&images, index as i32, &image)?;
                }
                Some(Image::Gradient(Some(gradient))) => {
                    if gradient_info.is_none() {
                        gradient_info = Some(env.new_object_array(
                            (count * AndroidGradientInfoRecord::STRIDE) as i32,
                            "java/lang/String",
                            JObject::null(),
                        )?);
                    }
                    write_gradient_info(env, gradient_info.as_ref().unwrap(), index, gradient)?;
                    gradients.resize(index, 0);
                    gradients.push(std::ptr::from_ref(gradient) as jlong);
                }
                _ => {}
            }
        }
        values.extend(layer.record(context));
        values.extend(extra);
        let row = layer.offsets().map(paint_offset_address);
        if !offsets.is_empty() || row.iter().any(|address| *address != 0) {
            offsets.resize(index * row.len(), 0);
            offsets.extend(row);
        }
    }
    let records = env.new_double_array(values.len() as i32)?;
    env.set_double_array_region(&records, 0, &values)?;
    let output = env.new_object_array(Read::STRIDE as i32, "java/lang/Object", JObject::null())?;
    env.set_object_array_element(&output, Read::VALUES as i32, records)?;
    env.set_object_array_element(&output, Read::IMAGES as i32, images)?;
    if !offsets.is_empty() {
        let addresses = env.new_long_array(offsets.len() as i32)?;
        env.set_long_array_region(&addresses, 0, &offsets)?;
        env.set_object_array_element(&output, Read::OFFSETS as i32, addresses)?;
    }
    if let Some(info) = gradient_info {
        let addresses = env.new_long_array(gradients.len() as i32)?;
        env.set_long_array_region(&addresses, 0, &gradients)?;
        env.set_object_array_element(&output, Read::GRADIENTS as i32, addresses)?;
        env.set_object_array_element(&output, Read::GRADIENT_INFO as i32, info)?;
    }
    Ok((output, !offsets.is_empty() || !gradients.is_empty()))
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeMaskParse(
    mut env: JNIEnv,
    _: JClass,
    input: jni::objects::JObjectArray,
    current_color: jint,
) -> jlong {
    let result = (|| {
        if env.get_array_length(&input).ok()? as usize != LONGHAND_COUNT {
            return None;
        }
        let mut values: [String; LONGHAND_COUNT] = Default::default();
        for (index, value) in values.iter_mut().enumerate() {
            let item = JString::from(env.get_object_array_element(&input, index as i32).ok()?);
            *value = crate::style::get_string_lossy(&mut env, &item)?;
        }
        let layers = parse_mask_layers(values.each_ref().map(String::as_str), current_color as u32, true)?;
        Some(Box::into_raw(Box::new(Arc::<[MaskLayer]>::from(layers))) as jlong)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeMaskRead<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::LengthContext;
    let mask = unsafe { &*(handle as *const Arc<[MaskLayer]>) };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    read_paint_snapshot(env, PaintSnapshot::Mask(Arc::clone(mask)), context, 0)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeMaskInstall(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, mason: jlong, node: jlong,
) {
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        let mask = unsafe { (handle as *const Arc<[MaskLayer]>).as_ref() }.cloned();
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            mason.set_style_css_mask(node.id(), mask);
        } else {
            node.defer_style_css_mask(mask);
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeMaskRelease(
    _: JNIEnv, _: JClass, handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Arc<[MaskLayer]>)) }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeBorderImageParse(
    mut env: JNIEnv, _: JClass, input: JString, color: jint,
) -> jlong {
    crate::style::get_string_lossy(&mut env, &input)
        .and_then(|value| nine_slice::parse_shorthand(&value, NineSliceKind::BorderImage, color as u32))
        .filter(|value| value.source.is_some())
        .map_or(0, |value| Box::into_raw(Box::new(Arc::new(value))) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeMaskBorderParse(
    mut env: JNIEnv, _: JClass, input: jni::objects::JObjectArray, color: jint,
) -> jlong {
    let parsed = (|| {
        if env.get_array_length(&input).ok()? as usize != nine_slice::LONGHAND_COUNT {
            return None;
        }
        let mut values: [String; nine_slice::LONGHAND_COUNT] = Default::default();
        for (index, value) in values.iter_mut().enumerate() {
            let item = JString::from(env.get_object_array_element(&input, index as i32).ok()?);
            *value = crate::style::get_string_lossy(&mut env, &item)?;
        }
        nine_slice::parse_longhands(values.each_ref().map(String::as_str), NineSliceKind::MaskBorder, color as u32, true)
    })();
    parsed.filter(|value| value.source.is_some())
        .map_or(0, |value| Box::into_raw(Box::new(Arc::new(value))) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeSetTextOverflow(
    env: JNIEnv<'_>, _: JClass<'_>, mason: jlong, node: jlong, kind: jbyte, token: JByteArray<'_>,
) {
    use mason_core::style::css::text_overflow::TextOverflow;
    let Some(node) = (unsafe { (node as *const mason_core::NodeRef).as_ref() }) else { return; };
    let token = read_text_overflow_token(&env, token);
    let Some(overflow) = TextOverflow::new(kind as u8, token) else { return; };
    if let Some(mason) = unsafe { (mason as *mut mason_core::Mason).as_mut() } {
        mason.set_style_text_overflow(node.id(), overflow);
    } else {
        node.defer_style_text_overflow(overflow);
    }
}

fn read_text_overflow_token(env: &JNIEnv<'_>, token: JByteArray<'_>) -> Option<Arc<str>> {
    if token.is_null() {
        return None;
    }
    let bytes = env.convert_byte_array(token).ok()?;
    Some(Arc::from(std::str::from_utf8(&bytes).ok()?))
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeTextOverflowTokenBytes(
    env: JNIEnv<'_>, _: JClass<'_>, key: jlong,
) -> jbyteArray {
    mason_core::style::css::text_overflow::lookup(key as u64)
        .and_then(|token| env.byte_array_from_slice(token.as_bytes()).ok())
        .map_or(std::ptr::null_mut(), JByteArray::into_raw)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeDetachedTextOverflowToken(
    env: JNIEnv<'_>, _: JClass<'_>, token: JByteArray<'_>,
) -> jlong {
    read_text_overflow_token(&env, token).map_or(0, |token| {
        mason_core::style::css::text_overflow::new_detached(token) as jlong
    })
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeReleaseDetachedTextOverflowToken(
    _env: JNIEnv<'_>, _: JClass<'_>, key: jlong,
) {
    mason_core::style::css::text_overflow::release_detached(key as u64);
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_expandCssShorthand<'a>(
    mut env: JNIEnv<'a>, _: JClass<'a>, name: JString<'a>, input: JString<'a>,
) -> jni::objects::JObjectArray<'a> {
    let output = (|| {
        let name = crate::style::get_string_lossy(&mut env, &name)?;
        let value = crate::style::get_string_lossy(&mut env, &input)?;
        let values = mason_core::style::css::shorthand::expand(&name, &value)?;
        css_string_array(&mut env, values)
    })();
    output.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeCompileInlineCss<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    input: JString<'a>,
    scale: jfloat,
    font_size: jfloat,
    parent_font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    viewport_refresh: jni::sys::jboolean,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::{compile_inline_style, LengthContext};
    let Some(input) = crate::style::get_string_lossy(&mut env, &input) else { return Default::default() };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let values = compile_inline_style(&input, context, parent_font_size, viewport_refresh != 0);
    css_string_array(&mut env, values).unwrap_or_default()
}

fn css_string_array<'a>(env: &mut JNIEnv<'a>, values: Vec<String>) -> Option<jni::objects::JObjectArray<'a>> {
    let len = i32::try_from(values.len()).ok()?;
    let output = env.new_object_array(len, "java/lang/String", JObject::null()).ok()?;
    for (index, value) in values.iter().enumerate() {
        let value = env.new_string(value).ok()?;
        env.set_object_array_element(&output, index as i32, &value).ok()?;
        env.delete_local_ref(value).ok()?;
    }
    Some(output)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeCompileInlineCssReplay<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    input: JString<'a>,
    scale: jfloat,
    font_size: jfloat,
    parent_font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
    previous_font_size: jfloat,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::{compile_inline_style_replay, LengthContext};
    let Some(input) = crate::style::get_string_lossy(&mut env, &input) else { return Default::default() };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let values = compile_inline_style_replay(&input, context, parent_font_size,
        previous_font_size.is_finite().then_some(previous_font_size));
    css_string_array(&mut env, values).unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceValues<'a>(
    env: JNIEnv<'a>, _: JClass<'a>, _owner: JObject<'a>, handle: jlong, scale: jfloat,
    font_size: jfloat, root_font_size: jfloat, viewport_width: jfloat, viewport_height: jfloat,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::LengthContext;
    let spec = unsafe { &*(handle as *const Arc<NineSlice>) };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let records = spec.records(context);
    let output = (|| {
        let output = env.new_double_array(records.len() as i32).ok()?;
        env.set_double_array_region(&output, 0, &records).ok()?;
        Some(output)
    })();
    output.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceMathWidths<'a>(
    env: JNIEnv<'a>, _: JClass<'a>, _owner: JObject<'a>, handle: jlong,
    width: jfloat, height: jfloat, scale: jfloat, font_size: jfloat, root_font_size: jfloat,
    viewport_width: jfloat, viewport_height: jfloat,
) -> jni::objects::JFloatArray<'a> {
    use mason_core::style::css::LengthContext;
    let spec = unsafe { &*(handle as *const Arc<NineSlice>) };
    let context = LengthContext { scale, font_size, root_font_size, viewport_width, viewport_height };
    let sides = [height, width, height, width];
    let values: [f32; 4] = std::array::from_fn(|index|
        spec.width_offset(index).map_or(f32::NAN, |axis| axis.resolve(sides[index], context))
    );
    let result = (|| {
        let output = env.new_float_array(values.len() as i32).ok()?;
        env.set_float_array_region(&output, 0, &values).ok()?;
        Some(output)
    })();
    result.unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceSource<'a>(
    env: JNIEnv<'a>, _: JClass<'a>, _owner: JObject<'a>, handle: jlong, url_only: jni::sys::jboolean,
) -> JString<'a> {
    let spec = unsafe { &*(handle as *const Arc<NineSlice>) };
    let value = match spec.source.as_ref() {
        Some((css, _)) if url_only == 0 => css.as_str(),
        Some((_, Image::Url(url))) => url.as_ref(),
        _ => return JString::default(),
    };
    env.new_string(value).unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceGradient(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong,
) -> jlong {
    let spec = unsafe { &*(handle as *const Arc<NineSlice>) };
    match spec.source.as_ref() {
        Some((_, Image::Gradient(Some(gradient)))) => Box::into_raw(Box::new(Arc::clone(gradient))) as jlong,
        _ => 0,
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceInstall(
    _: JNIEnv, _: JClass, _owner: JObject, handle: jlong, mason: jlong, node: jlong, mask: jni::sys::jboolean,
) {
    if let Some(node) = unsafe { (node as *const NodeRef).as_ref() } {
        let spec = unsafe { (handle as *const Arc<NineSlice>).as_ref() }.cloned();
        let kind = if mask != 0 { NineSliceKind::MaskBorder } else { NineSliceKind::BorderImage };
        if let Some(mason) = unsafe { (mason as *mut Mason).as_mut() } {
            mason.set_style_css_nine_slice(node.id(), kind, spec);
        } else {
            node.defer_style_css_nine_slice(kind, spec);
        }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeNineSliceRelease(
    _: JNIEnv, _: JClass, handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Arc<NineSlice>)) }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGradientParse(
    mut env: JNIEnv,
    _: JClass,
    value: JString,
    color: jint,
) -> jlong {
    crate::style::get_string_lossy(&mut env, &value)
        .and_then(|value| parse_gradient(&value, color as u32))
        .map_or(0, |gradient| Box::into_raw(Box::new(Arc::new(gradient))) as jlong)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGradientRelease(
    _: JNIEnv,
    _: JClass,
    handle: jlong,
) {
    if handle != 0 {
        unsafe { drop(Box::from_raw(handle as *mut Arc<Gradient>)) }
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGradientInfo<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    handle: jlong,
) -> jni::objects::JObjectArray<'a> {
    use mason_core::style::css::AndroidGradientInfoRecord;
    let gradient = unsafe { &*(handle as *const Arc<Gradient>) };
    let result = (|| {
        let output = env.new_object_array(
            AndroidGradientInfoRecord::STRIDE as i32, "java/lang/String", JObject::null(),
        )?;
        write_gradient_info(&mut env, &output, 0, gradient)?;
        Ok::<_, jni::errors::Error>(output)
    })();
    result.unwrap_or_default()
}

fn write_gradient_info<'a>(
    env: &mut JNIEnv<'a>,
    output: &jni::objects::JObjectArray<'a>,
    row: usize,
    gradient: &Gradient,
) -> jni::errors::Result<()> {
    use mason_core::style::css::AndroidGradientInfoRecord as Info;
    let (space, hue) = gradient.interpolation.as_ref().map_or(("", ""), |method| {
        (method.space.as_str(), method.hue.as_deref().unwrap_or(""))
    });
    let count = gradient.stops.len().to_string();
    let mut info = [""; Info::STRIDE];
    info[Info::KIND] = match gradient.kind {
        GradientKind::Linear => "linear",
        GradientKind::Radial => "radial",
        GradientKind::Conic => "conic",
    };
    info[Info::REPEATING] = if gradient.repeating { "1" } else { "0" };
    info[Info::STOP_COUNT] = &count;
    info[Info::DIRECTION] = &gradient.direction;
    info[Info::SPACE] = space;
    info[Info::HUE] = hue;
    let start = row * Info::STRIDE;
    for (index, value) in info.into_iter().enumerate() {
        let value = env.auto_local(env.new_string(value)?);
        env.set_object_array_element(output, (start + index) as i32, &value)?;
    }
    Ok(())
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGradientStopTexts<'a>(
    mut env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
) -> jni::objects::JObjectArray<'a> {
    let gradient = unsafe { &*(handle as *const Arc<Gradient>) };
    (0..gradient.stops.len())
        .map(|index| gradient.stop_text(index))
        .collect::<Option<Vec<_>>>()
        .and_then(|stops| css_string_array(&mut env, stops))
        .unwrap_or_default()
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeGradientPaint<'a>(
    env: JNIEnv<'a>,
    _: JClass<'a>,
    _owner: JObject<'a>,
    handle: jlong,
    width: jfloat,
    height: jfloat,
    scale: jfloat,
    font_size: jfloat,
    root_font_size: jfloat,
    viewport_width: jfloat,
    viewport_height: jfloat,
) -> jni::objects::JDoubleArray<'a> {
    use mason_core::style::css::LengthContext;

    let gradient = unsafe { &*(handle as *const Arc<Gradient>) };
    let context = LengthContext {
        scale,
        font_size,
        root_font_size,
        viewport_width,
        viewport_height,
    };
    let layout = gradient.layout(width, height, context);
    let (endpoints, radii, line_length) = match gradient.kind {
        GradientKind::Linear => {
            let (endpoints, length) = layout.linear_line(width, height);
            (endpoints, [0., 0.], length)
        }
        GradientKind::Radial => {
            let [x, y] = layout.center;
            // A pixel floor avoids invalid shader radii on tiny tiles.
            let radii = layout.radii.map(|radius| radius.max(1.));
            ([x, y, 0., 0.], radii, radii[0])
        }
        GradientKind::Conic => {
            let [x, y] = layout.center;
            ([x, y, 0., 0.], [0., 0.], 0.)
        }
    };
    let mut values = Vec::with_capacity(7 + gradient.stops.len() * 2);
    values.extend(endpoints.into_iter().chain(radii).chain([layout.angle]).map(f64::from));
    values.extend(gradient.resolve_stops(line_length, context).into_iter()
        .flat_map(|(color, position)| [f64::from(color), f64::from(position)]));
    let result = (|| {
        let output = env.new_double_array(values.len() as i32)?;
        env.set_double_array_region(&output, 0, &values)?;
        Ok::<_, jni::errors::Error>(output)
    })();
    result.unwrap_or_default()
}
