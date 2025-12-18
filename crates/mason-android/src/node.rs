use crate::style::{JAVA_FLOAT_TYPE, JAVA_INT_TYPE, JAVA_LONG_TYPE};
use crate::INLINE_SEGMENT;
use jni::objects::{JClass, JObject, JObjectArray, JPrimitiveArray, ReleaseMode};
use jni::sys::{
    jboolean, jfloat, jfloatArray, jint, jlong, jlongArray, jobject, jobjectArray, JNI_FALSE,
    JNI_TRUE,
};
use jni::JNIEnv;
use mason_core::{AvailableSpace, Id, InlineSegment, Mason, NodeRef, Size};

#[no_mangle]
pub extern "system" fn NodeNativeDestroy(node: jlong) {
    if node == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node as *mut NodeRef);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeDestroyNormal(_env: JNIEnv, _: JClass, node: jlong) {
    if node == 0 {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node as *mut NodeRef);
    }
}

fn native_new_node(taffy: jlong, is_anonymous: jboolean) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        Box::into_raw(Box::new(if is_anonymous == JNI_TRUE {
            mason.create_anonymous_node()
        } else {
            mason.create_node()
        })) as jlong
    }
}

fn native_new_text_node(taffy: jlong, is_anonymous: jboolean) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        Box::into_raw(Box::new(if is_anonymous == JNI_TRUE {
            mason.create_anonymous_text_node()
        } else {
            mason.create_text_node()
        })) as jlong
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNode(taffy: jlong, is_anonymous: jboolean) -> jlong {
    native_new_node(taffy, is_anonymous)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    is_anonymous: jboolean,
) -> jlong {
    native_new_node(taffy, is_anonymous)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeWithContext(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    measure: JObject,
    is_anonymous: jboolean,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    let measure = env.new_global_ref(measure).unwrap();
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = if is_anonymous == JNI_TRUE {
            mason.create_anonymous_node()
        } else {
            mason.create_node()
        };

        mason.setup(node.id(), Some(measure));

        Box::into_raw(Box::new(node)) as jlong
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeNewNodeWithChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    children: jlongArray,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = mason.create_node();

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let data: Vec<_> =
                    std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len())
                        .iter()
                        .map(|v| (*(*v as *mut NodeRef)).id())
                        .collect();

                mason.append_node(node.id(), data.as_slice());
            }
            Err(_) => {}
        };

        Box::into_raw(Box::new(node)) as jlong
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewTextNode(taffy: jlong, is_anonymous: jboolean) -> jlong {
    native_new_text_node(taffy, is_anonymous)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewTextNodeNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    is_anonymous: jboolean,
) -> jlong {
    native_new_text_node(taffy, is_anonymous)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewTextNodeWithContext(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    measure: JObject,
    is_anonymous: jboolean,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    let measure = env.new_global_ref(measure).unwrap();
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = if is_anonymous == JNI_TRUE {
            mason.create_anonymous_text_node()
        } else {
            mason.create_text_node()
        };

        mason.setup(node.id(), Some(measure));

        Box::into_raw(Box::new(node)) as jlong
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeNewTextNodeWithChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    children: jlongArray,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = mason.create_text_node();

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let data: Vec<_> =
                    std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len())
                        .iter()
                        .map(|v| (*(*v as *mut NodeRef)).id())
                        .collect();

                mason.append_node(node.id(), data.as_slice());
            }
            Err(_) => {}
        };

        Box::into_raw(Box::new(node)) as jlong
    }
}

fn native_get_child_count(taffy: jlong, node: jlong) -> jint {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mason = &*(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let count = mason.child_count(node.id()) as jint;

        count
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildCount(taffy: jlong, node: jlong) -> jint {
    native_get_child_count(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildCountNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jint {
    native_get_child_count(taffy, node)
}

#[no_mangle]
pub extern "system" fn nativeLayout(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let output = mason.layout(node.id());
        let size = output.len();
        match env.new_float_array(size as i32) {
            Ok(array) => {
                if let Err(_) = env.set_float_array_region(&array, 0, output.as_slice()) {}
                array.into_raw()
            }
            Err(_) => env.new_float_array(0_i32).unwrap().into_raw(),
        }
    }
}

fn native_compute_wh(taffy: jlong, node: jlong, width: jfloat, height: jfloat) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.compute_wh(node.id(), width, height);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeWH(
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) {
    native_compute_wh(taffy, node, width, height)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeWHNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) {
    native_compute_wh(taffy, node, width, height)
}

fn native_compute_size(taffy: jlong, node: jlong, size: jlong) {
    if taffy == 0 || node == 0 || size == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let size = Box::from_raw(size as *mut Size<AvailableSpace>);
        let node = &*(node as *mut NodeRef);
        mason.compute_size(node.id(), *size);

        Box::leak(size);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeSize(taffy: jlong, node: jlong, size: jlong) {
    native_compute_size(taffy, node, size)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeSizeNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    size: jlong,
) {
    native_compute_size(taffy, node, size)
}

fn native_compute_max_content(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.compute(node.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMaxContent(taffy: jlong, node: jlong) {
    native_compute_max_content(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMaxContentNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute_max_content(taffy, node)
}

fn native_compute_min_content(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.compute_min(node.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMinContent(taffy: jlong, node: jlong) {
    native_compute_min_content(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeMinContentNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute_min_content(taffy, node)
}

fn native_compute(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.compute(node.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeCompute(taffy: jlong, node: jlong) {
    native_compute(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeComputeNormal(
    _env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) {
    native_compute(taffy, node)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeComputeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.compute(node.id());

        let output = mason.layout(node.id());

        let size = output.len();
        let result = env.new_float_array(size as i32).unwrap();

        if size > 0 {
            env.set_float_array_region(&result, 0, output.as_slice())
                .unwrap();
        }

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn nativeComputeWithSizeAndLayout(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) -> jfloatArray {
    if taffy == 0 || node == 0 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);

        mason.compute_wh(node.id(), width, height);

        let output = mason.layout(node.id());
        match env.new_float_array(output.len() as i32) {
            Ok(array) => {
                env.set_float_array_region(&array, 0, output.as_slice())
                    .unwrap();
                array.into_raw()
            }
            Err(_) => env.new_float_array(0_i32).unwrap().into_raw(),
        }
    }
}

fn native_get_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        match mason.child_at_index(node.id(), index as usize) {
            None => 0,
            Some(node) => Box::into_raw(Box::new(node)) as jlong,
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildAt(taffy: jlong, node: jlong, index: jint) -> jlong {
    native_get_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeGetChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    index: jint,
) -> jlong {
    native_get_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeSetChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<_> = data.iter().map(|v| (*(*v as *mut NodeRef)).id()).collect();
            drop(array);
            mason.set_children(node.id(), data.as_slice());
        }
        drop(children);
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeAddChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);

        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<_> = data.iter().map(|v| (*(*v as *mut NodeRef)).id()).collect();
            mason.add_children(node.id(), data.as_slice());
        };
    }
}

fn native_add_child(taffy: jlong, node: jlong, child: jlong) {
    if taffy == 0 || node == 0 || child == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        mason.add_child(node.id(), child.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChild(taffy: jlong, node: jlong, child: jlong) {
    native_add_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
) {
    native_add_child(taffy, node, child)
}

fn native_replace_child_at(taffy: jlong, node: jlong, child: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 || child == 0 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        let ret = mason
            .replace_child_at_index(node.id(), child.id(), index as usize)
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_default();

        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeReplaceChildAt(
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) -> jlong {
    native_replace_child_at(taffy, node, child, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeReplaceChildAtNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) -> jlong {
    native_replace_child_at(taffy, node, child, index)
}

fn native_add_child_at(taffy: jlong, node: jlong, child: jlong, index: jint) {
    if taffy == 0 || node == 0 || child == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        mason.add_child_at_index(node.id(), child.id(), index as usize);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildAt(taffy: jlong, node: jlong, child: jlong, index: jint) {
    native_add_child_at(taffy, node, child, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeAddChildAtNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) {
    native_add_child_at(taffy, node, child, index)
}

fn native_insert_child_before(taffy: jlong, node: jlong, child: jlong, reference: jlong) {
    if taffy == 0 || node == 0 || child == 0 || reference == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        let reference = &*(reference as *mut NodeRef);
        mason.insert_child_before(node.id(), child.id(), reference.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildBefore(
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_before(taffy, node, child, reference)
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildBeforeNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_before(taffy, node, child, reference)
}

fn native_insert_child_after(taffy: jlong, node: jlong, child: jlong, reference: jlong) {
    if taffy == 0 || node == 0 || child == 0 || reference == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        let reference = &*(reference as *mut NodeRef);
        mason.insert_child_after(node.id(), child.id(), reference.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildAfter(
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_after(taffy, node, child, reference)
}

#[no_mangle]
pub extern "system" fn NodeNativeInsertChildAfterNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_after(taffy, node, child, reference)
}

fn native_dirty(taffy: jlong, node: jlong) -> jboolean {
    if taffy == 0 || node == 0 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);

        if mason.dirty(node.id()) {
            return JNI_TRUE;
        }
    }

    JNI_FALSE
}

#[no_mangle]
pub extern "system" fn NodeNativeDirty(taffy: jlong, node: jlong) -> jboolean {
    native_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeDirtyNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jboolean {
    native_dirty(taffy, node)
}

fn native_mark_dirty(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.mark_dirty(node.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirty(taffy: jlong, node: jlong) {
    native_mark_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirtyNormal(_: JNIEnv, _: JClass, taffy: jlong, node: jlong) {
    native_mark_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeIsChildrenSame(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) -> jboolean {
    if taffy == 0 || node == 0 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        let ret = match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let size = array.len();
                if mason.child_count(node.id()) != size {
                    return JNI_TRUE;
                }
                let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, size);
                let data: Vec<_> = data.iter().map(|v| (*(*v as *mut NodeRef)).id()).collect();

                if mason.is_children_same(node.id(), data.as_slice()) {
                    return JNI_TRUE;
                }
                JNI_FALSE
            }
            Err(_) => JNI_FALSE,
        };

        ret
    }
}

fn native_remove_children(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.remove_children(node.id());
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildren(taffy: jlong, node: jlong) {
    native_remove_children(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildrenNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_children(taffy, node)
}

fn native_remove_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == 0 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);

        let ret = mason
            .remove_child_at_index(node.id(), index as usize)
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .unwrap_or_default();

        ret
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildAt(taffy: jlong, node: jlong, index: jint) -> jlong {
    native_remove_child_at(taffy, node, index)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildAtNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    index: jint,
) -> jlong {
    native_remove_child_at(taffy, node, index)
}

fn native_remove_child(taffy: jlong, node: jlong, child: jlong) -> jlong {
    if taffy == 0 || node == 0 || child == 0 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let child = &*(child as *mut NodeRef);
        match mason.remove_child(node.id(), child.id()) {
            None => 0,
            Some(value) => Box::into_raw(Box::new(value)) as jlong,
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChild(taffy: jlong, node: jlong, child: jlong) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn nativeGetChildren(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jlongArray {
    if taffy == 0 || node == 0 {
        return env.new_long_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let children = mason.children(node.id());

        let array = env.new_long_array(children.len() as i32).unwrap();
        let buf: Vec<jlong> = children
            .into_iter()
            .map(|v| Box::into_raw(Box::new(v)) as jlong)
            .collect();
        env.set_long_array_region(&array, 0, buf.as_slice())
            .unwrap();

        array.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeSetContext(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    measure: JObject,
) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        let measure = if measure.is_null() {
            None
        } else {
            Some(env.new_global_ref(measure).unwrap())
        };

        mason.set_measure(node.id(), measure);
    }
}

fn native_remove_context(taffy: jlong, node: jlong) {
    if taffy == 0 || node == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let node = &*(node as *mut NodeRef);
        mason.set_measure(node.id(), None);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContext(taffy: jlong, node: jlong) {
    native_remove_context(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContextNormal(
    _: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_context(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeSetChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jlongArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = &*(node as *mut NodeRef);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let data: Vec<_> =
                    std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len())
                        .iter()
                        .map(|v| (*(*v as *mut NodeRef)).id())
                        .collect();

                mason.set_children(node.id(), data.as_slice());
            }
            Err(_) => {}
        };
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeSetSegments(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    children: jobjectArray,
) {
    if taffy == 0 || node == 0 {
        return;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = &*(node as *mut NodeRef);

        let inline_segment = INLINE_SEGMENT.get().unwrap();

        let children = JObjectArray::from_raw(children);
        let count = env.get_array_length(&children).unwrap_or_default();
        let mut child: Vec<InlineSegment> = vec![];
        for i in 0..count {
            if let Ok(segment) = env.get_object_array_element(&children, i) {
                let kind = env
                    .get_field_unchecked(&segment, inline_segment.kind, JAVA_INT_TYPE)
                    .and_then(|v| v.i())
                    .unwrap_or(-1);
                match kind {
                    0 => {
                        let width = env
                            .get_field_unchecked(
                                &segment,
                                inline_segment.text_width,
                                JAVA_FLOAT_TYPE,
                            )
                            .and_then(|v| v.f())
                            .unwrap_or(0f32);

                        let ascent = env
                            .get_field_unchecked(
                                &segment,
                                inline_segment.text_ascent,
                                JAVA_FLOAT_TYPE,
                            )
                            .and_then(|v| v.f())
                            .unwrap_or(0f32);

                        let descent = env
                            .get_field_unchecked(
                                &segment,
                                inline_segment.text_descent,
                                JAVA_FLOAT_TYPE,
                            )
                            .and_then(|v| v.f())
                            .unwrap_or(0f32);

                        child.push(InlineSegment::Text {
                            width,
                            ascent,
                            descent,
                        });
                    }
                    1 => {
                        let id = env
                            .get_field_unchecked(
                                &segment,
                                inline_segment.inline_node_ptr,
                                JAVA_LONG_TYPE,
                            )
                            .and_then(|v| v.j())
                            .unwrap_or(0i64);

                        let descent = env
                            .get_field_unchecked(
                                &segment,
                                inline_segment.inline_child_descent,
                                JAVA_FLOAT_TYPE,
                            )
                            .and_then(|v| v.f())
                            .unwrap_or(0f32);

                        let mut child_id: Option<Id> = None;
                        if id != 0 {
                            let node = &*(id as *mut NodeRef);
                            child_id = Some(node.id());
                        }

                        child.push(InlineSegment::InlineChild {
                            id: child_id,
                            baseline: descent,
                        });
                    }
                    _ => {}
                }
            }
        }

        mason.set_segments(node.id(), child);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeSetAndroidNode(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    android_node: jobject,
) {
    if taffy == 0 || node == 0 {
        return;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = &*(node as *mut NodeRef);

        if android_node.is_null() {
            mason.clear_android_node(node.id());
        } else {
            let object = JObject::from_raw(android_node);
            let instance = env.new_global_ref(object).unwrap();
            mason.set_android_node(node.id(), instance);
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewImageNode(taffy: jlong) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        Box::into_raw(Box::new(mason.create_image_node())) as jlong
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewImageNodeNormal(_: JNIEnv, _: JClass, taffy: jlong) -> jlong {
    if taffy == 0 {
        return 0;
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        Box::into_raw(Box::new(mason.create_image_node())) as jlong
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewImageNodeWithContext(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    measure: JObject,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    let measure = env.new_global_ref(measure).unwrap();
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let node = mason.create_image_node();

        mason.setup(node.id(), Some(measure));

        Box::into_raw(Box::new(node)) as jlong
    }
}
