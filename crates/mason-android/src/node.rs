use jni::objects::{JClass, JObject, JPrimitiveArray, ReleaseMode};
use jni::sys::{jboolean, jfloat, jfloatArray, jint, jlong, jlongArray, JNI_FALSE, JNI_TRUE};
use jni::JNIEnv;

use mason_core::{AvailableSpace, Mason, NodeContext, NodeKind, Size};

#[no_mangle]
pub extern "system" fn NodeNativeDestroy(node: jlong) {
    if node == -1 {
        return;
    }
    unsafe {
        // let _ = Box::from_raw(node as *mut Node);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeDestroyNormal(_env: JNIEnv, _: JClass, node: jlong) {
    if node == -1 {
        return;
    }
    unsafe {
        //  let _ = Box::from_raw(node as *mut Node);
    }
}

fn native_new_node(taffy: jlong, kind: jint) -> jlong {
    let kind = NodeKind::try_from(kind);
    match kind {
        Ok(kind) => {
            if taffy == 0 {
                return 0;
            }

            unsafe {
                let mason = &mut *(taffy as *mut Mason);
                mason.create_node(kind) as jlong
            }
        }
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNode(taffy: jlong, kind: jint) -> jlong {
    native_new_node(taffy, kind)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    kind: jint,
) -> jlong {
    native_new_node(taffy, kind)
}

#[no_mangle]
pub extern "system" fn NodeNativeNewNodeWithContext(
    env: JNIEnv,
    _: JClass,
    taffy: jlong,
    kind: jint,
    measure: JObject,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    let kind = NodeKind::try_from(kind);

    match kind {
        Ok(kind) => {
            let measure = env.new_global_ref(measure).unwrap();
            unsafe {
                let mason = &mut *(taffy as *mut Mason);

                let jvm = env.get_java_vm().unwrap();

                let context = NodeContext::new(jvm, measure);
                log::info!("????");

                mason.create_node_with_context(kind, Some(context)) as jlong
            }
        }
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeNewNodeWithChildren(
    mut env: JNIEnv,
    _: JClass,
    taffy: jlong,
    kind: jint,
    children: jlongArray,
) -> jlong {
    if taffy == 0 {
        return 0;
    }

    let kind = NodeKind::try_from(kind);
    match kind {
        Ok(kind) => unsafe {
            let mason = &mut *(taffy as *mut Mason);
            let node_id = mason.create_node(kind);

            let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
            let ret = match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
                Ok(array) => {
                    let data: Vec<usize> =
                        std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len())
                            .iter()
                            .map(|v| *v as usize)
                            .collect();

                    mason.append_node(node_id, data.as_slice());

                    node_id as jlong
                }
                Err(_) => node_id as jlong,
            };

            ret
        },
        Err(_) => 0,
    }
}

fn native_get_child_count(taffy: jlong, node: jlong) -> jint {
    if taffy == 0 || node == -1 {
        return 0;
    }
    unsafe {
        let mason = &*(taffy as *mut Mason);

        let count = mason.child_count(node as usize) as jint;

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
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeLayout(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jfloatArray {
    if taffy == 0 || node == -1 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let output = mason.layout(node as usize);
        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        result.into_raw()
    }
}

fn native_compute_wh(taffy: jlong, node: jlong, width: jfloat, height: jfloat) {
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.compute_wh(node as usize, width, height);
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
    if taffy == 0 || node == -1 || size == 0 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let size = Box::from_raw(size as *mut Size<AvailableSpace>);
        mason.compute_size(node as usize, *size);

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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.compute(node as usize);
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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.compute_min(node as usize);
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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.compute(node as usize);
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
    if taffy == 0 || node == -1 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.compute(node as usize);

        let output = mason.layout(node as usize);

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        result.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeComputeWithSizeAndLayout(
    env: &mut JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    width: jfloat,
    height: jfloat,
) -> jfloatArray {
    if taffy == 0 || node == -1 {
        return env.new_float_array(0_i32).unwrap().into_raw();
    }

    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.compute_wh(node as usize, width, height);

        let output = mason.layout(node as usize);

        let result = env.new_float_array(output.len() as i32).unwrap();
        env.set_float_array_region(&result, 0, &output).unwrap();

        result.into_raw()
    }
}

// -1 is as null here
fn native_get_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == -1 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let ret = if let Some(node) = mason.get_node(node as usize) {
            match node.child_at_index(index as usize) {
                None => -1,
                Some(value) => value as jlong,
            }
        } else {
            -1
        };

        ret
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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<usize> = data.iter().map(|v| *v as usize).collect();
            drop(array);
            mason.set_children(node as usize, data.as_slice());
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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);

        if let Ok(array) = env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, array.len());
            let data: Vec<usize> = data.iter().map(|v| *v as usize).collect();
            mason.add_children(node as usize, data.as_slice());
        };
    }
}

fn native_add_child(taffy: jlong, node: jlong, child: jlong) {
    if taffy == 0 || node == -1 || child == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.add_child(node as usize, child as usize);
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
    if taffy == 0 || node == -1 || child == -1 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let ret = mason
            .replace_child_at_index(node as usize, child as usize, index as usize)
            .map(|v| v as jlong)
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
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    index: jint,
) -> jlong {
    native_replace_child_at(taffy, node, child, index)
}

fn native_add_child_at(taffy: jlong, node: jlong, child: jlong, index: jint) {
    if taffy == 0 || node == -1 || child == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.add_child_at_index(node as usize, child as usize, index as usize);
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
    if taffy == 0 || node == -1 || child == -1 || reference == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.insert_child_before(node as usize, child as usize, reference as usize);
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
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_before(taffy, node, child, reference)
}

fn native_insert_child_after(taffy: jlong, node: jlong, child: jlong, reference: jlong) {
    if taffy == 0 || node == -1 || child == -1 || reference == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.insert_child_after(node as usize, child as usize, reference as usize);
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
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
    reference: jlong,
) {
    native_insert_child_after(taffy, node, child, reference)
}

fn native_dirty(taffy: jlong, node: jlong) -> jboolean {
    if taffy == 0 || node == -1 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let ret = match mason.get_node(node as usize) {
            None => false,
            Some(node) => node.dirty(),
        };

        if ret {
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
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) -> jboolean {
    native_dirty(taffy, node)
}

fn native_mark_dirty(taffy: jlong, node: jlong) {
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        if let Some(node) = mason.get_node_mut(node as usize) {
            node.mark_dirty();
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirty(taffy: jlong, node: jlong) {
    native_mark_dirty(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeMarkDirtyNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
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
    if taffy == 0 || node == -1 {
        return JNI_FALSE;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let children: JPrimitiveArray<jlong> = JPrimitiveArray::from_raw(children);
        let ret = match env.get_array_elements_critical(&children, ReleaseMode::NoCopyBack) {
            Ok(array) => {
                let size = array.len();
                if mason.child_count(node as usize) != size {
                    return JNI_TRUE;
                }
                let data = std::slice::from_raw_parts_mut(array.as_ptr() as *mut jlong, size);
                let data: Vec<usize> = data.iter().map(|v| *v as usize).collect();

                if mason.is_children_same(node as usize, data.as_slice()) {
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
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        mason.remove_children(node as usize);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildren(taffy: jlong, node: jlong) {
    native_remove_children(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildrenNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_children(taffy, node)
}

fn native_remove_child_at(taffy: jlong, node: jlong, index: jint) -> jlong {
    if taffy == 0 || node == -1 {
        return 0;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let ret = mason
            .remove_child_at_index(node as usize, index as usize)
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
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    index: jint,
) -> jlong {
    native_remove_child_at(taffy, node, index)
}

fn native_remove_child(taffy: jlong, node: jlong, child: jlong) -> jlong {
    if taffy == 0 || node == -1 || child == -1 {
        return -1;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        match mason.remove_child(node as usize, child as usize) {
            None => -1,
            Some(value) => value as jlong,
        }
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChild(taffy: jlong, node: jlong, child: jlong) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveChildNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
    child: jlong,
) -> jlong {
    native_remove_child(taffy, node, child)
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeGetChildren(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
) -> jlongArray {
    if taffy == 0 || node == -1 {
        return env.new_long_array(0_i32).unwrap().into_raw();
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);

        let children = mason.children(node as usize);

        let array = env.new_long_array(children.len() as i32).unwrap();
        let buf: Vec<jlong> = children.iter().map(|v| *v as jlong).collect();
        env.set_long_array_region(&array, 0, &buf).unwrap();

        array.into_raw()
    }
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Node_nativeSetContext(
    env: JNIEnv,
    _: JObject,
    taffy: jlong,
    node: jlong,
    measure: JObject,
) {
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        let measure = env.new_global_ref(measure).unwrap();
        let jvm = env.get_java_vm().unwrap();
        let context = NodeContext::new(jvm, measure);
        mason.set_node_context(node as usize, Some(context));
    }
}

fn native_remove_context(taffy: jlong, node: jlong) {
    if taffy == 0 || node == -1 {
        return;
    }
    unsafe {
        let mason = &mut *(taffy as *mut Mason);
        mason.set_node_context(node as usize, None);
    }
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContext(taffy: jlong, node: jlong) {
    native_remove_context(taffy, node)
}

#[no_mangle]
pub extern "system" fn NodeNativeRemoveContextNormal(
    _env: JNIEnv,
    _: JClass,
    taffy: jlong,
    node: jlong,
) {
    native_remove_context(taffy, node)
}
