use crate::style::utils::{set_style_data_i32, set_style_data_u32};
use crate::style::{DisplayMode, StyleKeys};
use crate::utils::{display_mode_to_enum, display_to_enum};
use crate::Style;
use crate::PREFLIGHT_ENABLED;
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::atomic::Ordering;
use taffy::Display;

// always keep aligned 4
pub const STYLE_BUFFER_SIZE: usize = 596;

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
    Button,
}

/// Packs a slot index (low 24 bits) and a reuse generation (high 8 bits).
/// The generation rejects a handle from before a `release()` once its slot
/// is reused — raw handles cross the FFI boundary as plain integers and can
/// outlive the node that produced them.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct StyleHandle(u32);
impl StyleHandle {
    const INDEX_BITS: u32 = 24;
    const INDEX_MASK: u32 = (1 << Self::INDEX_BITS) - 1;

    pub const fn new(handle: Handle) -> Self {
        Self(handle as u32)
    }

    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }

    #[inline]
    fn pack(index: u32, generation: u8) -> Self {
        Self(((generation as u32) << Self::INDEX_BITS) | (index & Self::INDEX_MASK))
    }

    #[inline]
    fn generation(self) -> u8 {
        (self.0 >> Self::INDEX_BITS) as u8
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
    pub const DEFAULT_BUTTON: Self = StyleHandle::new(Handle::Button);

    #[inline]
    pub fn index(self) -> usize {
        (self.0 & Self::INDEX_MASK) as usize
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

/// Number of built-in default handles (Default, Inline, Img, Flex, Grid, List, ListItem, Button).
const NUM_DEFAULTS: usize = 8;

#[derive(Debug)]
pub struct StyleArena {
    buffers: Vec<StyleBuffer>,
    free_list: Vec<u32>,
    /// Reuse generation per slot, parallel to `buffers`; bumped in `release`.
    generations: Vec<u8>,
    /// Hash index from buffer content hash → buffer indices for O(1) intern lookup
    hash_index: std::collections::HashMap<u64, Vec<u32>>,
    /// Pristine copies of each default buffer, used to restore them after COW
    /// when JS writes may have corrupted the shared buffer before prepare_mut.
    default_snapshots: [[u8; STYLE_BUFFER_SIZE]; NUM_DEFAULTS],
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

        let mut button = StyleBuffer::new(default_data);
        {
            let data = button.mut_bytes();
            Style::init_default_data(data);
            // CSS spec: button { display: inline-block; text-align: center; box-sizing: border-box }
            crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN, 3);
            crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN_STATE, 1);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::Box),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        button.ref_count = 1;

        // Capture pristine snapshots of each default buffer before any JS writes
        let mut default_snapshots = [[0u8; STYLE_BUFFER_SIZE]; NUM_DEFAULTS];
        default_snapshots[Handle::Default as usize].copy_from_slice(default_buffer.bytes());
        default_snapshots[Handle::Inline as usize].copy_from_slice(inline.bytes());
        default_snapshots[Handle::Img as usize].copy_from_slice(img.bytes());
        default_snapshots[Handle::Flex as usize].copy_from_slice(flex.bytes());
        default_snapshots[Handle::Grid as usize].copy_from_slice(grid.bytes());
        default_snapshots[Handle::List as usize].copy_from_slice(list.bytes());
        default_snapshots[Handle::ListItem as usize].copy_from_slice(list_item.bytes());
        default_snapshots[Handle::Button as usize].copy_from_slice(button.bytes());

        let mut arena = Self {
            buffers: vec![
                default_buffer,
                inline,
                img,
                flex,
                grid,
                list,
                list_item,
                button,
            ],
            free_list: Vec::new(),
            generations: vec![0u8; NUM_DEFAULTS],
            hash_index: std::collections::HashMap::new(),
            default_snapshots,
        };

        if PREFLIGHT_ENABLED.load(Ordering::Relaxed) {
            arena.reset_defaults(true);
        }

        arena
    }

    /// Like `new`, but pre-sizes the slot storage for `capacity` non-default
    /// buffers to avoid `Vec` reallocation churn during bulk node creation.
    pub fn with_capacity(default_data: &[u8; STYLE_BUFFER_SIZE], capacity: usize) -> Self {
        let mut arena = Self::new(default_data);
        arena.buffers.reserve(capacity);
        arena.generations.reserve(capacity);
        arena.free_list.reserve(capacity);
        arena.hash_index.reserve(capacity);
        arena
    }

    /// Whether `handle`'s slot hasn't been freed and reused since. FFI call
    /// sites must check this; internal callers use `debug_assert!` instead.
    #[inline]
    fn is_current(&self, handle: StyleHandle) -> bool {
        self.generations
            .get(handle.index())
            .is_some_and(|&g| g == handle.generation())
    }

    #[inline]
    fn is_default_index(idx: usize) -> bool {
        idx < NUM_DEFAULTS
    }

    /// Restore a default buffer to its pristine state.
    /// Called after COW to undo any JS writes that leaked into the shared buffer.
    fn restore_default(&mut self, idx: usize) {
        let snapshot = &self.default_snapshots[idx];
        let buf = &mut self.buffers[idx];
        let ref_count = buf.ref_count;
        buf.mut_bytes().copy_from_slice(snapshot);
        // Re-stamp the current (decremented) ref_count
        set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
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
            Handle::Button => StyleHandle::DEFAULT_BUTTON,
        }
    }

    /// Get the reference count for a handle
    pub fn ref_count(&self, handle: StyleHandle) -> u32 {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to ref_count");
        self.buffers[handle.index()].ref_count
    }

    /// Increment reference count (for when a node copies another's handle)
    pub fn retain(&mut self, handle: StyleHandle) {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to retain");
        let buffer = &mut self.buffers[handle.index()];
        buffer.ref_count += 1;
        let ref_count = buffer.ref_count;
        set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
    }

    /// Release a handle (decrement ref count, free if zero)
    pub fn release(&mut self, handle: StyleHandle) {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to release");
        if matches!(
            handle,
            StyleHandle::DEFAULT
                | StyleHandle::DEFAULT_INLINE
                | StyleHandle::DEFAULT_IMG
                | StyleHandle::DEFAULT_FLEX
                | StyleHandle::DEFAULT_GRID
                | StyleHandle::DEFAULT_LIST
                | StyleHandle::DEFAULT_LIST_ITEM
                | StyleHandle::DEFAULT_BUTTON
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
        if buf.ref_count == 0 {
            // Already freed — guard against double-release
            return;
        }
        buf.ref_count -= 1;
        let ref_count = buf.ref_count;

        set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);

        if buf.ref_count == 0 {
            // Remove from hash index before the slot is reused
            let hash =
                Self::hash_buffer(<&[u8; STYLE_BUFFER_SIZE]>::try_from(buf.bytes()).unwrap());
            if let Some(indices) = self.hash_index.get_mut(&hash) {
                indices.retain(|&i| i != idx as u32);
                if indices.is_empty() {
                    self.hash_index.remove(&hash);
                }
            }
            // alloc() overwrites this slot on reuse, and the generation bump
            // below rejects stale reads in the meantime — no need to zero.
            #[cfg(target_os = "android")]
            {
                buf.buffer = -1;
            }
            self.generations[idx] = self.generations[idx].wrapping_add(1);
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

    pub fn apply_preflight(&mut self) {
        self.reset_defaults(true);
    }

    pub fn remove_preflight(&mut self) {
        self.reset_defaults(false);
    }

    fn reset_defaults(&mut self, preflight: bool) {
        let zero = [0u8; STYLE_BUFFER_SIZE];

        let init_base: fn(&mut [u8]) = if preflight {
            Style::init_preflight_base_data
        } else {
            Style::init_default_data
        };

        {
            let ref_count = self.buffers[Handle::Default as usize].ref_count;
            let data = self.buffers[Handle::Default as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Default as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::Inline as usize].ref_count;
            let data = self.buffers[Handle::Inline as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::DISPLAY_MODE, 1);
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Inline as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::Img as usize].ref_count;
            let data = self.buffers[Handle::Img as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_REPLACED, 1);
            if preflight {
                crate::style::utils::set_style_data_i8(
                    data,
                    StyleKeys::DISPLAY,
                    display_to_enum(Display::Block),
                );
                crate::style::utils::set_style_data_i8(data, StyleKeys::DISPLAY_MODE, 0);
            } else {
                crate::style::utils::set_style_data_i8(
                    data,
                    StyleKeys::DISPLAY_MODE,
                    display_mode_to_enum(DisplayMode::Inline),
                );
            }
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Img as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::Flex as usize].ref_count;
            let data = self.buffers[Handle::Flex as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Flex),
            );
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Flex as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::Grid as usize].ref_count;
            let data = self.buffers[Handle::Grid as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Grid),
            );
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Grid as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::List as usize].ref_count;
            let data = self.buffers[Handle::List as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST, 1);
            if preflight {
                crate::style::utils::set_style_data_u8(data, StyleKeys::LIST_STYLE_TYPE, 0);
            }
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::List as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::ListItem as usize].ref_count;
            let data = self.buffers[Handle::ListItem as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::ListItem),
            );
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST_ITEM, 1);
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::ListItem as usize].copy_from_slice(data);
        }

        {
            let ref_count = self.buffers[Handle::Button as usize].ref_count;
            let data = self.buffers[Handle::Button as usize].mut_bytes();
            data.copy_from_slice(&zero);
            init_base(data);
            if preflight {
                crate::style::utils::set_style_data_i8(
                    data,
                    StyleKeys::DISPLAY_MODE,
                    display_mode_to_enum(DisplayMode::Box),
                );
                crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN, 3);
                crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN_STATE, 1);
            } else {
                crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN, 3);
                crate::style::utils::set_style_data_i8(data, StyleKeys::TEXT_ALIGN_STATE, 1);
                crate::style::utils::set_style_data_i8(
                    data,
                    StyleKeys::DISPLAY_MODE,
                    display_mode_to_enum(DisplayMode::Box),
                );
            }
            set_style_data_u32(data, StyleKeys::REF_COUNT, ref_count);
            self.default_snapshots[Handle::Button as usize].copy_from_slice(data);
        }
    }
}

#[cfg(target_vendor = "apple")]
impl StyleArena {
    #[track_caller]
    pub fn buffer(&self, handle: StyleHandle) -> objc2::rc::Retained<NSMutableData> {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to buffer");
        self.buffers[handle.index()].buffer()
    }

    /// FFI entry point: a stale handle returns `None` instead of aliasing
    /// the slot's new occupant (Swift may hold `handle` past a `release()`).
    #[track_caller]
    pub fn buffer_opt(&self, handle: StyleHandle) -> Option<objc2::rc::Retained<NSMutableData>> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).map(|b| b.buffer())
    }

    /// Allocate a new buffer with the given data
    pub fn alloc(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let (idx, generation) = if let Some(free_idx) = self.free_list.pop() {
            let buf = &mut self.buffers[free_idx as usize];
            buf.ref_count = 1;
            buf.buffer.set_bytes(data);
            set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, 1);
            (free_idx, self.generations[free_idx as usize])
        } else {
            let idx = self.buffers.len() as u32;
            let mut buffer = StyleBuffer::new(data);
            buffer.ref_count = 1;
            set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, 1);
            self.buffers.push(buffer);
            self.generations.push(0);
            (idx, 0)
        };

        StyleHandle::pack(idx, generation)
    }

    /// Intern: find an existing identical buffer or allocate a new one
    pub fn intern(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let hash = Self::hash_buffer(data);

        // O(1) lookup via hash index instead of O(n) linear scan
        if let Some(indices) = self.hash_index.get(&hash) {
            for &idx in indices {
                let buf = &mut self.buffers[idx as usize];
                if buf.ref_count > 0 && buf.bytes() == data {
                    buf.ref_count += 1;
                    let ref_count = buf.ref_count;
                    set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
                    return StyleHandle::pack(idx, self.generations[idx as usize]);
                }
            }
        }

        let handle = self.alloc(data);
        self.hash_index
            .entry(hash)
            .or_insert_with(Vec::new)
            .push(handle.index() as u32);
        handle
    }

    /// Prepare for mutation - COW if shared, returns (new_handle, ptr)
    pub fn prepare_mut(&mut self, handle: StyleHandle) -> (StyleHandle, *mut u8) {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to prepare_mut");
        let idx = handle.index();

        if self.buffers[idx].ref_count == 1 {
            let ptr = self.buffers[idx].mut_bytes().as_mut_ptr();
            return (handle, ptr);
        }

        // COW: capture current data (may include JS writes — correct for new
        // buffer) as a stack array, not a heap-allocated Vec.
        let data: [u8; STYLE_BUFFER_SIZE] = self.buffers[idx].bytes().try_into().unwrap();

        {
            let current = &mut self.buffers[idx];
            current.ref_count -= 1;
            let ref_count = current.ref_count;
            set_style_data_u32(current.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
        }

        // Restore the default buffer to its pristine state so future views
        // sharing this handle don't inherit stale JS writes.
        if Self::is_default_index(idx) {
            self.restore_default(idx);
        }

        let new_handle = self.alloc(&data);
        let ptr = self.buffers[new_handle.index()].mut_bytes().as_mut_ptr();
        (new_handle, ptr)
    }

    /// Get read-only pointer to buffer data
    pub fn get_ptr(&self, handle: StyleHandle) -> *const u8 {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get_ptr");
        self.buffers[handle.index()].bytes().as_ptr()
    }

    /// FFI entry point — see `buffer_opt` for why a stale handle returns `None`.
    pub fn get_ptr_opt(&self, handle: StyleHandle) -> Option<*const u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).map(|b| b.bytes().as_ptr())
    }

    /// Get mutable pointer (caller must ensure exclusive via prepare_mut)
    pub fn get_ptr_mut(&mut self, handle: StyleHandle) -> *mut u8 {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get_ptr_mut");
        self.buffers[handle.index()].mut_bytes().as_mut_ptr()
    }

    /// FFI entry point — see `buffer_opt` for why a stale handle returns `None`.
    pub fn get_ptr_mut_opt(&mut self, handle: StyleHandle) -> Option<*mut u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers
            .get_mut(handle.index())
            .map(|b| b.mut_bytes().as_mut_ptr())
    }

    /// Get read-only reference to buffer data
    pub fn get(&self, handle: StyleHandle) -> &[u8; STYLE_BUFFER_SIZE] {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get");
        <&[u8; STYLE_BUFFER_SIZE]>::try_from(self.buffers[handle.index()].bytes()).unwrap()
    }
}

#[cfg(not(target_vendor = "apple"))]
impl StyleArena {
    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self, handle: StyleHandle) -> jni::sys::jint {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to buffer");
        self.buffers[handle.index()].buffer()
    }

    /// FFI entry point: a stale handle returns `None` instead of aliasing
    /// the slot's new occupant (Kotlin may hold `handle` past a `release()`).
    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer_opt(&self, handle: StyleHandle) -> Option<jni::sys::jint> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).and_then(|b| {
            let id = b.buffer();
            if id >= 0 {
                Some(id)
            } else {
                None
            }
        })
    }

    /// Allocate a new buffer with the given data
    pub fn alloc(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let (idx, generation) = if let Some(free_idx) = self.free_list.pop() {
            let buf = &mut self.buffers[free_idx as usize];
            buf.data.copy_from_slice(data);
            buf.ref_count = 1;
            set_style_data_u32(buf.data.as_mut_slice(), StyleKeys::REF_COUNT, 1);
            (free_idx, self.generations[free_idx as usize])
        } else {
            let idx = self.buffers.len() as u32;
            let mut buffer = StyleBuffer::new(data);
            buffer.ref_count = 1;
            set_style_data_u32(buffer.data.as_mut_slice(), StyleKeys::REF_COUNT, 1);
            self.buffers.push(buffer);
            self.generations.push(0);
            (idx, 0)
        };

        StyleHandle::pack(idx, generation)
    }

    /// Intern: find an existing identical buffer or allocate a new one
    pub fn intern(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        let hash = Self::hash_buffer(data);

        // O(1) lookup via hash index instead of O(n) linear scan
        if let Some(indices) = self.hash_index.get(&hash) {
            for &idx in indices {
                let buf = &mut self.buffers[idx as usize];
                if buf.ref_count > 0 && buf.data.as_ref() == data {
                    buf.ref_count += 1;
                    set_style_data_u32(
                        buf.data.as_mut_slice(),
                        StyleKeys::REF_COUNT,
                        buf.ref_count,
                    );
                    return StyleHandle::pack(idx, self.generations[idx as usize]);
                }
            }
        }

        let handle = self.alloc(data);
        self.hash_index
            .entry(hash)
            .or_insert_with(Vec::new)
            .push(handle.index() as u32);
        handle
    }

    /// Prepare for mutation - COW if shared, returns (new_handle, ptr)
    pub fn prepare_mut(&mut self, handle: StyleHandle) -> (StyleHandle, *mut u8) {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to prepare_mut");
        let idx = handle.index();

        if self.buffers[idx].ref_count == 1 {
            let ptr = self.buffers[idx].data.as_mut_ptr();
            return (handle, ptr);
        }

        // COW: capture current data (may include JS writes — correct for new buffer)
        let data = *self.buffers[idx].data;

        {
            let current = &mut self.buffers[idx];
            current.ref_count -= 1;
            let ref_count = current.ref_count;
            set_style_data_u32(current.data.as_mut_slice(), StyleKeys::REF_COUNT, ref_count);
        }

        // Restore the default buffer to its pristine state so future views
        // sharing this handle don't inherit stale JS writes.
        if Self::is_default_index(idx) {
            self.restore_default(idx);
        }

        let new_handle = self.alloc(&data);
        let ptr = self.buffers[new_handle.index()].data.as_mut_ptr();
        (new_handle, ptr)
    }

    /// Get read-only pointer to buffer data
    pub fn get_ptr(&self, handle: StyleHandle) -> *const u8 {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get_ptr");
        self.buffers[handle.index()].data.as_ptr()
    }

    /// FFI entry point — see `buffer_opt` for why a stale handle returns `None`.
    pub fn get_ptr_opt(&self, handle: StyleHandle) -> Option<*const u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).map(|b| b.data.as_ptr())
    }

    /// Get mutable pointer (caller must ensure exclusive via prepare_mut)
    pub fn get_ptr_mut(&mut self, handle: StyleHandle) -> *mut u8 {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get_ptr_mut");
        self.buffers[handle.index()].data.as_mut_ptr()
    }

    /// FFI entry point — see `buffer_opt` for why a stale handle returns `None`.
    pub fn get_ptr_mut_opt(&mut self, handle: StyleHandle) -> Option<*mut u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers
            .get_mut(handle.index())
            .map(|b| b.data.as_mut_ptr())
    }

    /// Get read-only reference to buffer data
    pub fn get(&self, handle: StyleHandle) -> &[u8; STYLE_BUFFER_SIZE] {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get");
        &self.buffers[handle.index()].data
    }

    /// FFI entry point — a stale `handle` (see `buffer_opt`) is a no-op
    /// rather than attaching the buffer id to the wrong slot.
    #[cfg(target_os = "android")]
    pub(crate) fn set_handle_buffer(&mut self, handle: StyleHandle, buffer_id: i32) {
        if !self.is_current(handle) {
            return;
        }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn released_slot_reuse_invalidates_stale_handle() {
        let mut arena = StyleArena::default();
        let data = [0u8; STYLE_BUFFER_SIZE];

        let a = arena.alloc(&data);
        arena.release(a);
        // Slot `a` is now free; the next alloc reuses it with a bumped generation.
        let b = arena.alloc(&data);

        assert_eq!(a.index(), b.index(), "expected the freed slot to be reused");
        assert_ne!(
            a, b,
            "handles into the same reused slot must differ by generation"
        );
        assert!(!arena.is_current(a), "stale handle must be rejected");
        assert!(arena.is_current(b), "freshly issued handle must be valid");

        // FFI accessors must refuse the stale handle, not alias the new occupant.
        assert!(arena.get_ptr_opt(a).is_none());
        assert!(arena.get_ptr_opt(b).is_some());
    }

    #[test]
    fn intern_hit_stamps_the_slots_current_generation() {
        let mut arena = StyleArena::default();
        let mut data = [7u8; STYLE_BUFFER_SIZE];
        // alloc() always stamps REF_COUNT = 1 into the buffer after copying
        // `data` in, so a byte-for-byte re-match requires the same stamp.
        set_style_data_u32(&mut data, StyleKeys::REF_COUNT, 1);

        // Bump some slot's generation past 0 by freeing and reusing it, then
        // have intern() land a fresh allocation of `data` on that same slot.
        let filler = arena.alloc(&[1u8; STYLE_BUFFER_SIZE]);
        arena.release(filler);
        let a = arena.intern(&data);
        assert_eq!(a.index(), filler.index(), "expected the freed slot reused");
        assert!(arena.is_current(a));

        // The hash-index hit path must stamp the slot's real generation,
        // not fabricate generation 0.
        let b = arena.intern(&data);
        assert_eq!(
            a, b,
            "intern() hit must reproduce the slot's actual generation"
        );
        assert!(arena.is_current(b));
    }
}
