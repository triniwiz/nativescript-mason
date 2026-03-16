use crate::style::utils::{set_style_data_i32, set_style_data_u32};
use crate::style::{DisplayMode, StyleKeys};
use crate::utils::{display_mode_to_enum, display_to_enum};
use crate::Style;
#[cfg(target_vendor = "apple")]
use objc2::AllocAnyThread;
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use taffy::Display;

pub const STYLE_BUFFER_SIZE: usize = 424;

#[repr(u32)]
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum Handle {
    Default = 0,
    Inline,
    Img,
    Flex,
    Grid,
    List,
    ListItem,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct StyleHandle(u32);
impl StyleHandle {
    pub const fn new(handle: Handle) -> Self {
        Self(handle as u32)
    }

    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }
}

impl StyleHandle {
    pub const DEFAULT: Self = StyleHandle::new(Handle::Default);
    pub const DEFAULT_INLINE: Self = StyleHandle::new(Handle::Inline);
    pub const DEFAULT_IMG: Self = StyleHandle::new(Handle::Img);
    pub const DEFAULT_FLEX: Self = StyleHandle::new(Handle::Flex);
    pub const DEFAULT_GRID: Self = StyleHandle::new(Handle::Grid);
    pub const DEFAULT_LIST: Self = StyleHandle::new(Handle::List);
    pub const DEFAULT_LIST_ITEM: Self = StyleHandle::new(Handle::ListItem);

    #[inline]
    pub fn index(self) -> usize {
        self.0 as usize
    }
}

#[derive(Debug)]
struct StyleBuffer {
    #[cfg(target_vendor = "apple")]
    buffer: objc2::rc::Retained<NSMutableData>,
    #[cfg(target_os = "android")]
    buffer: jni::sys::jint,
    #[cfg(not(target_vendor = "apple"))]
    data: Box<[u8; STYLE_BUFFER_SIZE]>,
    pub(crate) ref_count: u32,
}

impl StyleBuffer {
    #[cfg(target_vendor = "apple")]
    pub fn new(data: &[u8; STYLE_BUFFER_SIZE]) -> Self {
        let buffer = NSMutableData::from_vec(data.to_vec());
        StyleBuffer {
            ref_count: 0,
            buffer,
        }
    }

    #[cfg(target_vendor = "apple")]
    pub fn bytes(&self) -> &[u8] {
        unsafe { self.buffer.as_bytes_unchecked() }
    }

    #[cfg(not(target_vendor = "apple"))]
    pub fn bytes(&self) -> &[u8] {
        self.data.as_slice()
    }

    #[cfg(target_vendor = "apple")]
    pub fn mut_bytes(&mut self) -> &mut [u8] {
        unsafe { self.buffer.as_mut_bytes_unchecked() }
    }

    #[cfg(not(target_vendor = "apple"))]
    pub fn mut_bytes(&mut self) -> &mut [u8] {
        self.data.as_mut_slice()
    }

    #[cfg(target_os = "android")]
    pub fn new(data: &[u8; STYLE_BUFFER_SIZE]) -> Self {
        let data = Box::new(*data);
        StyleBuffer {
            data,
            ref_count: 0,
            buffer: -1,
        }
    }

    #[cfg(not(any(target_vendor = "apple", target_os = "android")))]
    pub fn new(data: &[u8; STYLE_BUFFER_SIZE]) -> Self {
        let data = Box::new(*data);
        StyleBuffer { data, ref_count: 0 }
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn buffer(&self) -> objc2::rc::Retained<NSMutableData> {
        self.buffer.clone()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self) -> jni::sys::jint {
        self.buffer
    }
}

#[derive(Debug)]
pub struct StyleArena {
    buffers: Vec<StyleBuffer>,
    free_list: Vec<u32>,
}

impl Default for StyleArena {
    fn default() -> Self {
        Self::new(&[0u8; STYLE_BUFFER_SIZE])
    }
}

impl StyleArena {
    pub fn new(default_data: &[u8; STYLE_BUFFER_SIZE]) -> Self {
        let mut default_buffer = StyleBuffer::new(default_data);
        {
            let data = default_buffer.mut_bytes();
            Style::init_default_data(data);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        default_buffer.ref_count = 1;

        let mut inline = StyleBuffer::new(default_data);
        {
            let data = inline.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::DISPLAY_MODE, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        inline.ref_count = 1;

        let mut img = StyleBuffer::new(default_data);
        {
            let data = img.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_REPLACED, 1);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::Inline),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        img.ref_count = 1;

        let mut flex = StyleBuffer::new(default_data);
        {
            let data = flex.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Flex),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        flex.ref_count = 1;

        let mut grid = StyleBuffer::new(default_data);
        {
            let data = grid.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Grid),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        grid.ref_count = 1;

        let mut list = StyleBuffer::new(default_data);
        {
            let data = list.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        list.ref_count = 1;

        let mut list_item = StyleBuffer::new(default_data);
        {
            let data = list_item.mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::ListItem),
            );
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST_ITEM, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        list_item.ref_count = 1;

        Self {
            buffers: vec![default_buffer, inline, img, flex, grid, list, list_item],
            free_list: Vec::new(),
        }
    }

    /// Get a handle to the default style (shared by all unstyled nodes)
    pub fn get_default(&mut self) -> StyleHandle {
        let buffer = &mut self.buffers[Handle::Default as usize];
        buffer.ref_count += 1;
        let ref_count = buffer.ref_count;
        set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
        StyleHandle::DEFAULT
    }

    pub fn get_handle(&mut self, handle: Handle) -> StyleHandle {
        let buffer = &mut self.buffers[handle as usize];
        buffer.ref_count += 1;
        let ref_count = buffer.ref_count;
        set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
        match handle {
            Handle::Default => StyleHandle::DEFAULT,
            Handle::Inline => StyleHandle::DEFAULT_INLINE,
            Handle::Img => StyleHandle::DEFAULT_IMG,
            Handle::Flex => StyleHandle::DEFAULT_FLEX,
            Handle::Grid => StyleHandle::DEFAULT_GRID,
            Handle::List => StyleHandle::DEFAULT_LIST,
            Handle::ListItem => StyleHandle::DEFAULT_LIST_ITEM,
        }
    }

    /// Get the reference count for a handle
    pub fn ref_count(&self, handle: StyleHandle) -> u32 {
        self.buffers[handle.index()].ref_count
    }

    /// Increment reference count (for when a node copies another's handle)
    pub fn retain(&mut self, handle: StyleHandle) {
        let buffer = &mut self.buffers[handle.index()];
        buffer.ref_count += 1;
        let ref_count = buffer.ref_count;
        set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
    }

    /// Release a handle (decrement ref count, free if zero)
    pub fn release(&mut self, handle: StyleHandle) {
        if matches!(
            handle,
            StyleHandle::DEFAULT
                | StyleHandle::DEFAULT_INLINE
                | StyleHandle::DEFAULT_IMG
                | StyleHandle::DEFAULT_FLEX
                | StyleHandle::DEFAULT_GRID
                | StyleHandle::DEFAULT_LIST
                | StyleHandle::DEFAULT_LIST_ITEM
        ) {
            let idx = handle.index();
            let buf = &mut self.buffers[idx];
            if buf.ref_count > 1 {
                buf.ref_count = buf.ref_count.saturating_sub(1);
                let ref_count = buf.ref_count;
                set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
            }
            return; // defaults are immortal
        }
        let idx = handle.index();
        let buf = &mut self.buffers[idx];
        buf.ref_count = buf.ref_count.saturating_sub(1);
        let ref_count = buf.ref_count;

        set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);

        if buf.ref_count == 0 {
            self.free_list.push(idx as u32);
        }
    }

    pub(crate) fn hash_buffer(data: &[u8; STYLE_BUFFER_SIZE]) -> u64 {
        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        hasher.finish()
    }


    pub fn stats(&self) -> ArenaStats {
        let active = self.buffers.iter().filter(|b| b.ref_count > 0).count();
        let shared = self.buffers.iter().filter(|b| b.ref_count > 1).count();
        let total_refs: u32 = self.buffers.iter().map(|b| b.ref_count).sum();

        ArenaStats {
            total_buffers: self.buffers.len(),
            active_buffers: active,
            shared_buffers: shared,
            total_refs: total_refs as usize,
            free_slots: self.free_list.len(),
            buffer_memory: active * STYLE_BUFFER_SIZE,
        }
    }
}

#[cfg(target_vendor = "apple")]
impl StyleArena {

    #[track_caller]
    pub fn buffer(&self, handle: StyleHandle) -> objc2::rc::Retained<NSMutableData> {
        self.buffers[handle.index()].buffer()
    }

    #[track_caller]
    pub fn buffer_opt(&self, handle: StyleHandle) -> Option<objc2::rc::Retained<NSMutableData>> {
        self.buffers.get(handle.index()).map(|b| b.buffer())
    }


    /// Allocate a new buffer with the given data
    pub fn alloc(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let idx = if let Some(free_idx) = self.free_list.pop() {
            let buf = &mut self.buffers[free_idx as usize];
            buf.ref_count = 1;
            buf.buffer.set_bytes(data);
            set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, 1);
            free_idx
        } else {
            let idx = self.buffers.len() as u32;
            let mut buffer = StyleBuffer::new(data);
            buffer.ref_count = 1;
            set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, 1);
            self.buffers.push(buffer);
            idx
        };

        StyleHandle(idx)
    }

    /// Intern: find an existing identical buffer or allocate a new one
    pub fn intern(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let hash = Self::hash_buffer(data);

        for (idx, buf) in self.buffers.iter_mut().enumerate() {
            if buf.ref_count > 0
                && Self::hash_buffer(<&[u8; STYLE_BUFFER_SIZE]>::try_from(buf.bytes()).unwrap()) == hash
                && buf.bytes() == data
            {
                buf.ref_count += 1;
                let ref_count = buf.ref_count;

                set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);

                return StyleHandle(idx as u32);
            }
        }

        self.alloc(data)
    }

    /// Prepare for mutation - COW if shared, returns (new_handle, ptr)
    pub fn prepare_mut(&mut self, handle: StyleHandle) -> (StyleHandle, *mut u8) {
        let idx = handle.index();

        if self.buffers[idx].ref_count == 1 {
            let ptr = self.buffers[idx].mut_bytes().as_mut_ptr();
            return (handle, ptr);
        }


        {
            let current = &mut self.buffers[idx];
            current.ref_count -= 1;
            let ref_count = current.ref_count;
            set_style_data_u32(current.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
        }

        // todo clean up

        let new_handle = {
            // COW: clone to new buffer
            let data = self.buffers[idx].bytes().to_vec();
            self.alloc(<&[u8; STYLE_BUFFER_SIZE]>::try_from(data.as_slice()).unwrap())
        };
        let ptr = self.buffers[new_handle.index()].mut_bytes().as_mut_ptr();
        (new_handle, ptr)
    }

    /// Get read-only pointer to buffer data
    pub fn get_ptr(&self, handle: StyleHandle) -> *const u8 {
        self.buffers[handle.index()].bytes().as_ptr()
    }

    pub fn get_ptr_opt(&self, handle: StyleHandle) -> Option<*const u8> {
        self.buffers.get(handle.index()).map(|b| b.bytes().as_ptr())
    }

    /// Get mutable pointer (caller must ensure exclusive via prepare_mut)
    pub fn get_ptr_mut(&mut self, handle: StyleHandle) -> *mut u8 {
        self.buffers[handle.index()].mut_bytes().as_mut_ptr()
    }


    pub fn get_ptr_mut_opt(&mut self, handle: StyleHandle) -> Option<*mut u8> {
        self.buffers
            .get_mut(handle.index())
            .map(|b| b.mut_bytes().as_mut_ptr())
    }

    /// Get read-only reference to buffer data
    pub fn get(&self, handle: StyleHandle) -> &[u8; STYLE_BUFFER_SIZE] {
        <&[u8; STYLE_BUFFER_SIZE]>::try_from(self.buffers[handle.index()].bytes()).unwrap()
    }
}


#[cfg(target_os = "android")]
impl StyleArena {
    #[track_caller]
    pub fn buffer(&self, handle: StyleHandle) -> jni::sys::jint {
        self.buffers[handle.index()].buffer()
    }

    #[track_caller]
    pub fn buffer_opt(&self, handle: StyleHandle) -> Option<jni::sys::jint> {
        self.buffers.get(handle.index()).map(|b| b.buffer())
    }

    /// Allocate a new buffer with the given data

    pub fn alloc(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let idx = if let Some(free_idx) = self.free_list.pop() {
            let buf = &mut self.buffers[free_idx as usize];
            buf.data.copy_from_slice(data);
            buf.ref_count = 1;
            set_style_data_u32(buf.data.as_mut_slice(), StyleKeys::REF_COUNT, 1);
            free_idx
        } else {
            let idx = self.buffers.len() as u32;
            let mut buffer = StyleBuffer::new(data);
            buffer.ref_count = 1;
            set_style_data_u32(buffer.data.as_mut_slice(), StyleKeys::REF_COUNT, 1);
            self.buffers.push(buffer);
            idx
        };

        StyleHandle(idx)
    }

    /// Intern: find an existing identical buffer or allocate a new one
    pub fn intern(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let hash = Self::hash_buffer(data);

        for (idx, buf) in self.buffers.iter_mut().enumerate() {
            if buf.ref_count > 0
                && Self::hash_buffer(&buf.data) == hash
                && buf.data.as_ref() == data
            {
                buf.ref_count += 1;

                set_style_data_u32(buf.data.as_mut_slice(), StyleKeys::REF_COUNT, buf.ref_count);

                return StyleHandle(idx as u32);
            }
        }

        self.alloc(data)
    }


    /// Prepare for mutation - COW if shared, returns (new_handle, ptr)
    pub fn prepare_mut(&mut self, handle: StyleHandle) -> (StyleHandle, *mut u8) {
        let idx = handle.index();

        if self.buffers[idx].ref_count == 1 {
            let ptr = self.buffers[idx].data.as_mut_ptr();
            return (handle, ptr);
        }

        // COW: clone to new buffer
        let data = *self.buffers[idx].data;

        {
            let current = &mut self.buffers[idx];
            current.ref_count -= 1;
            let ref_count = current.ref_count;
            set_style_data_u32(current.data.as_mut_slice(), StyleKeys::REF_COUNT, ref_count);
        }

        let new_handle = self.alloc(&data);
        let ptr = self.buffers[new_handle.index()].data.as_mut_ptr();
        (new_handle, ptr)
    }

    /// Get read-only pointer to buffer data
    pub fn get_ptr(&self, handle: StyleHandle) -> *const u8 {
        self.buffers[handle.index()].data.as_ptr()
    }

    pub fn get_ptr_opt(&self, handle: StyleHandle) -> Option<*const u8> {
        self.buffers.get(handle.index()).map(|b| b.data.as_ptr())
    }

    /// Get mutable pointer (caller must ensure exclusive via prepare_mut)
    pub fn get_ptr_mut(&mut self, handle: StyleHandle) -> *mut u8 {
        self.buffers[handle.index()].data.as_mut_ptr()
    }

    pub fn get_ptr_mut_opt(&mut self, handle: StyleHandle) -> Option<*mut u8> {
        self.buffers
            .get_mut(handle.index())
            .map(|b| b.data.as_mut_ptr())
    }

    /// Get read-only reference to buffer data
    pub fn get(&self, handle: StyleHandle) -> &[u8; STYLE_BUFFER_SIZE] {
        &self.buffers[handle.index()].data
    }

    pub(crate) fn set_handle_buffer(&mut self, handle: StyleHandle, buffer_id: i32) {
        if let Some(data) = self.buffers.get_mut(handle.index()) {
            if data.buffer != -1 {
                return;
            }
            data.buffer = buffer_id;
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct ArenaStats {
    pub total_buffers: usize,
    pub active_buffers: usize,
    pub shared_buffers: usize,
    pub total_refs: usize,
    pub free_slots: usize,
    pub buffer_memory: usize,
}
