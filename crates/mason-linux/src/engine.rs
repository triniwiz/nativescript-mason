//! The main-thread Mason engine; measure callbacks re-enter it during a compute.

use mason_core::style::StyleKeys;
use mason_core::{Id, Layout, Mason, NodeRef};
use std::cell::UnsafeCell;

thread_local! {
    static ENGINE: UnsafeCell<Option<Box<Mason>>> = const { UnsafeCell::new(None) };
}

#[allow(clippy::mut_from_ref)]
pub fn mason() -> &'static mut Mason {
    ENGINE.with(|cell| unsafe {
        let slot = &mut *cell.get();
        let engine = slot.get_or_insert_with(|| {
            let mut engine = Box::new(Mason::new());
            engine.set_device_scale(1.0);
            engine
        });
        &mut *(engine.as_mut() as *mut Mason)
    })
}

/// Encoded measure result (width, height).
pub fn pack(width: f32, height: f32) -> i64 {
    mason_core::MeasureOutput::make(width, height)
}

pub fn layout(id: Id) -> Layout {
    mason().layout_raw(id)
}

pub fn is_root(node: &NodeRef) -> bool {
    mason()
        .get_root(node.id())
        .map_or(true, |root| root.id() == node.id())
}

/// The node's own style bytes; a shared default buffer is copied first.
pub fn style_mut(node: &NodeRef) -> &'static mut [u8] {
    let engine = mason();
    engine.prepare_mut(node);
    let (ptr, len) = engine.style_data_raw_mut(node.id());
    if ptr.is_null() {
        return &mut [];
    }
    unsafe { std::slice::from_raw_parts_mut(ptr, len) }
}

pub fn style(node: &NodeRef) -> &'static [u8] {
    let (ptr, len) = mason().style_data_raw(node.id());
    if ptr.is_null() {
        return &[];
    }
    unsafe { std::slice::from_raw_parts(ptr, len) }
}

/// Typed reads of a style buffer at `StyleKeys` offsets.
pub struct StyleView<'a>(pub &'a [u8]);

impl StyleView<'_> {
    #[inline]
    pub fn u8(&self, key: StyleKeys) -> u8 {
        self.0.get(key as usize).copied().unwrap_or(0)
    }
    #[inline]
    pub fn i8(&self, key: StyleKeys) -> i8 {
        self.u8(key) as i8
    }
    #[inline]
    fn bytes4(&self, key: StyleKeys) -> [u8; 4] {
        let at = key as usize;
        self.0
            .get(at..at + 4)
            .map_or([0; 4], |b| [b[0], b[1], b[2], b[3]])
    }
    #[inline]
    pub fn f32(&self, key: StyleKeys) -> f32 {
        f32::from_le_bytes(self.bytes4(key))
    }
    #[inline]
    pub fn i32(&self, key: StyleKeys) -> i32 {
        i32::from_le_bytes(self.bytes4(key))
    }
    #[inline]
    pub fn u32(&self, key: StyleKeys) -> u32 {
        u32::from_le_bytes(self.bytes4(key))
    }
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
