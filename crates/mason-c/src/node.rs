use std::ffi::{c_float, c_longlong, c_void};

use crate::{CMason, CMasonNode};
use mason_core::{InlineSegment, Size};

#[repr(C)]
pub enum AvailableSpace {
    Definite(f32),
    MinContent,
    MaxContent,
}

#[allow(clippy::from_over_into)]
impl Into<mason_core::AvailableSpace> for AvailableSpace {
    fn into(self) -> mason_core::AvailableSpace {
        match self {
            AvailableSpace::Definite(value) => mason_core::AvailableSpace::Definite(value),
            AvailableSpace::MinContent => mason_core::AvailableSpace::MinContent,
            AvailableSpace::MaxContent => mason_core::AvailableSpace::MaxContent,
        }
    }
}

#[repr(C)]
pub struct NodeArray {
    pub array: *mut *mut c_void,
    pub length: usize,
}

impl Default for NodeArray {
    fn default() -> Self {
        Self {
            array: std::ptr::null_mut(),
            length: 0,
        }
    }
}

#[repr(C)]
#[derive(Clone)]
pub struct CMasonInlineTextSegment {
    width: f32,
    ascent: f32,
    descent: f32,
}

#[repr(C)]
#[derive(Clone)]
pub struct CMasonInlineChildSegment {
    node: *const CMasonNode,
    descent: f32,
}

#[repr(C)]
pub enum CMasonSegment {
    Text(CMasonInlineTextSegment),
    InlineChild(CMasonInlineChildSegment),
}

impl From<&CMasonSegment> for InlineSegment {
    fn from(segment: &CMasonSegment) -> Self {
        match segment {
            CMasonSegment::Text(text) => InlineSegment::Text {
                width: text.width,
                ascent: text.ascent,
                descent: text.descent,
            },
            CMasonSegment::InlineChild(child) => {
                let id = if child.node.is_null() {
                    None
                } else {
                    unsafe {
                        let node = &*child.node;
                        Some(node.0.id())
                    }
                };

                InlineSegment::InlineChild {
                    id,
                    baseline: child.descent,
                }
            }
        }
    }
}

impl Into<InlineSegment> for CMasonSegment {
    fn into(self) -> InlineSegment {
        match self {
            CMasonSegment::Text(text) => InlineSegment::Text {
                width: text.width,
                ascent: text.ascent,
                descent: text.descent,
            },
            CMasonSegment::InlineChild(child) => {
                let id = if child.node.is_null() {
                    None
                } else {
                    unsafe {
                        let node = &*child.node;
                        Some(node.0.id())
                    }
                };

                InlineSegment::InlineChild {
                    id,
                    baseline: child.descent,
                }
            }
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_segments(
    mason: *mut CMason,
    node: *mut CMasonNode,
    segments: *mut CMasonSegment,
    segments_len: usize,
) {
    if mason.is_null() || node.is_null() || segments.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let segments = std::slice::from_raw_parts(segments, segments_len)
            .iter()
            .map(|segment| segment.into())
            .collect::<Vec<InlineSegment>>();
        mason.set_segments(node.id(), segments);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_clear_segments(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.clear_segments(node.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_is_equal(node_a: *mut CMasonNode, node_b: *mut CMasonNode) -> bool {
    if node_a.is_null() || node_b.is_null() {
        return false;
    }

    let a = unsafe { Box::from_raw(node_a) };

    let b = unsafe { Box::from_raw(node_b) };

    let ret = a == b;

    Box::leak(a);
    Box::leak(b);

    ret
}

#[no_mangle]
pub extern "C" fn mason_node_array_destroy(array: *mut NodeArray) {
    if array.is_null() {
        return;
    }
    let array = unsafe { &mut *array };
    if !array.array.is_null() {
        let mut buf = unsafe {
            Vec::from_raw_parts(
                array.array as *mut *mut CMasonNode,
                array.length,
                array.length,
            )
        };
        let _: Vec<_> = buf
            .iter_mut()
            .map(|v| {
                let a = *v;
                unsafe { Box::from_raw(a) }
            })
            .collect();
    }
}

#[no_mangle]
pub extern "C" fn mason_node_destroy(node: *mut CMasonNode) {
    if node.is_null() {
        return;
    }
    unsafe {
        let _ = Box::from_raw(node);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node(mason: *mut CMason) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        Box::into_raw(Box::new(CMasonNode(mason.create_node())))
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_new_node_with_context(
    mason: *mut CMason,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mason = &mut (*mason).0;

        let node_id = mason.create_node();

        mason.set_measure(node_id.id(), measure, measure_data);

        Box::into_raw(Box::new(CMasonNode(node_id)))
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_node_with_children(
    mason: *mut CMason,
    children: *mut *mut CMasonNode,
    children_size: usize,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        let node_id = mason.create_node();
        mason.set_children(node_id.id(), &data);

        Box::into_raw(Box::new(CMasonNode(node_id)))
    }
}




#[no_mangle]
pub extern "C" fn mason_node_new_text_node(mason: *mut CMason) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        Box::into_raw(Box::new(CMasonNode(mason.create_text_node())))
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_new_text_node_with_context(
    mason: *mut CMason,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }

    unsafe {
        let mason = &mut (*mason).0;

        let node_id = mason.create_text_node();

        mason.set_measure(node_id.id(), measure, measure_data);

        Box::into_raw(Box::new(CMasonNode(node_id)))
    }
}

#[no_mangle]
pub extern "C" fn mason_node_new_text_node_with_children(
    mason: *mut CMason,
    children: *mut *mut CMasonNode,
    children_size: usize,
) -> *mut CMasonNode {
    if mason.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        let node_id = mason.create_text_node();
        mason.set_children(node_id.id(), &data);

        Box::into_raw(Box::new(CMasonNode(node_id)))
    }
}

#[no_mangle]
pub extern "C" fn mason_node_layout(
    mason: *mut CMason,
    node: *mut CMasonNode,
    layout: extern "C" fn(*const c_float) -> *mut c_void,
) -> *mut c_void {
    if mason.is_null() || node.is_null() {
        return layout(std::ptr::null_mut());
    }
    unsafe {
        let mason = &(*mason).0;
        let node = &(*node).0;

        let output = mason.layout(node.id());

        layout(output.as_ptr())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_wh(
    mason: *mut CMason,
    node: *mut CMasonNode,
    width: c_float,
    height: c_float,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute_wh(node.id(), width, height);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_size(
    mason: *mut CMason,
    node: *mut CMasonNode,
    width: AvailableSpace,
    height: AvailableSpace,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute_size(
            node.id(),
            Size::<mason_core::AvailableSpace> {
                width: width.into(),
                height: height.into(),
            },
        );
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_max_content(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::max_content();
        mason.compute_size(node.id(), size);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute_min_content(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::min_content();
        mason.compute_size(node.id(), size);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_compute(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute(node.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = &(*node).0;

        match mason.child_at_index(node_id.id(), index) {
            None => std::ptr::null_mut(),
            Some(id) => Box::into_raw(Box::new(CMasonNode(id))),
        }
    }
}

#[no_mangle]
pub extern "C" fn mason_node_set_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = &(*node).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        mason.set_children(node_id.id(), &data);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        if children_size == 0 {
            return;
        }

        let mason = &mut (*mason).0;
        let node_id = &(*node).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        mason.add_children(node_id.id(), &data);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_prepend_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        if children_size == 0 {
            return;
        }

        let mason = &mut (*mason).0;
        let node_id = &(*node).0;

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        mason.prepend_children(node_id.id(), &data);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_prepend(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let child = &(*child).0;

        mason.prepend(node.id(), child.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let child = &(*child).0;

        mason.add_child(node.id(), child.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_replace_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        let child_id = &(*child).0;

        let ret = mason
            .replace_child_at_index(node_id.id(), child_id.id(), index)
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut);

        ret
    }
}

#[no_mangle]
pub extern "C" fn mason_node_add_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    index: usize,
) {
    if mason.is_null() || node.is_null() || child.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        let child_id = &(*child).0;
        mason.add_child_at_index(node_id.id(), child_id.id(), index);
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_before(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    reference: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        let child_id = &(*child).0;
        let reference_id = &(*reference).0;
        mason.insert_child_before(node_id.id(), child_id.id(), reference_id.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_insert_child_after(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
    reference: *mut CMasonNode,
) {
    if mason.is_null() || node.is_null() || child.is_null() || reference.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        let child_id = &(*child).0;
        let reference_id = &(*reference).0;
        mason.insert_child_after(node_id.id(), child_id.id(), reference_id.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_dirty(mason: *mut CMason, node: *mut CMasonNode) -> bool {
    if mason.is_null() || node.is_null() {
        return false;
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = &(*node).0;

        mason.dirty(node_id.id())
    }
}

#[no_mangle]
pub extern "C" fn mason_node_mark_dirty(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason);
        let node_id = &(*node).0;

        mason.0.mark_dirty(node_id.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_is_children_same(
    mason: *mut CMason,
    node: *mut CMasonNode,
    children: *const *mut CMasonNode,
    children_size: usize,
) -> bool {
    unsafe {
        let mason = &(*mason).0;
        let node_id = &(*node).0;

        if children_size != mason.child_count(node_id.id()) {
            return false;
        }

        let data = std::slice::from_raw_parts(children, children_size);

        let data: Vec<_> = data
            .iter()
            .map(|v| {
                let node = &*(*v);
                node.0.id()
            })
            .collect();

        mason.is_children_same(node_id.id(), &data)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_children(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = &(*node).0;

        mason.remove_children(node_id.id());
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child_at(
    mason: *mut CMason,
    node: *mut CMasonNode,
    index: usize,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;

        mason
            .remove_child_at_index(node_id.id(), index)
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_remove_child(
    mason: *mut CMason,
    node: *mut CMasonNode,
    child: *mut CMasonNode,
) -> *mut CMasonNode {
    if mason.is_null() || node.is_null() || child.is_null() {
        return std::ptr::null_mut();
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        let child_id = &(*child).0;

        mason
            .remove_child(node_id.id(), child_id.id())
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .unwrap_or_else(std::ptr::null_mut)
    }
}

#[no_mangle]
pub extern "C" fn mason_node_get_children(
    mason: *mut CMason,
    node: *mut CMasonNode,
) -> *mut NodeArray {
    if mason.is_null() || node.is_null() {
        return Box::into_raw(Box::new(Default::default()));
    }
    unsafe {
        let mason = &(*mason).0;
        let node_id = &&(*node).0;

        let buf = mason
            .children(node_id.id())
            .into_iter()
            .map(|v| Box::into_raw(Box::new(CMasonNode(v))))
            .collect::<Vec<_>>();

        let mut buf = buf.into_boxed_slice();
        let len = buf.len();
        let ret = NodeArray {
            array: buf.as_mut_ptr() as *mut *mut c_void,
            length: len,
        };
        Box::leak(buf);

        Box::into_raw(Box::new(ret))
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_set_context(
    mason: *mut CMason,
    node: *mut CMasonNode,
    measure_data: *mut c_void,
    measure: Option<extern "C" fn(*const c_void, c_float, c_float, c_float, c_float) -> c_longlong>,
) {
    if mason.is_null() || node.is_null() {
        return;
    }

    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node).0;
        mason.set_measure(node_id.id(), measure, measure_data);
    }
}

#[cfg(not(target_os = "android"))]
#[no_mangle]
pub extern "C" fn mason_node_remove_context(mason: *mut CMason, node: *mut CMasonNode) {
    if mason.is_null() || node.is_null() {
        return;
    }
    unsafe {
        let mason = &mut (*mason).0;
        let node_id = &(*node);
        mason.set_measure(node_id.0.id(), None, 0 as _);
    }
}
