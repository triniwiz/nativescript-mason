use crate::style::utils::{set_style_data_i32, set_style_data_u32};
use crate::style::{DisplayMode, StyleKeys};
use crate::utils::{display_mode_to_enum, display_to_enum};
use crate::Style;
use crate::PREFLIGHT_ENABLED;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::atomic::Ordering;
use taffy::Display;

// always keep aligned 4
// <style-keys:size> generated from tools/scripts/style-keys/style-keys.schema, run `npm run gen:style-keys`
pub const STYLE_BUFFER_SIZE: usize = 744;
// </style-keys:size>

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

/// A slot index (low 32 bits, below `MAX_SLOTS`) and a reuse generation (the next 8 bits).
/// The generation rejects a handle that outlived its slot's `release()`.
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct StyleHandle(u64);
impl StyleHandle {
    const INDEX_MASK: u64 = 0xFFFF_FFFF;
    const GENERATION_SHIFT: u32 = 32;

    pub const fn new(handle: Handle) -> Self {
        Self(handle as u64)
    }

    pub const fn from_raw(id: u64) -> Self {
        Self(id)
    }

    #[inline]
    fn pack(index: u32, generation: u8) -> Self {
        Self(((generation as u64) << Self::GENERATION_SHIFT) | index as u64)
    }

    #[inline]
    fn generation(self) -> u8 {
        (self.0 >> Self::GENERATION_SHIFT) as u8
    }
}

/// The most slots an arena holds; indices below 2^31 fit a signed 32-bit int on every platform.
pub const MAX_SLOTS: usize = 1 << 31;

/// The index of a new slot after `len` existing ones; panics at `MAX_SLOTS` instead of wrapping.
#[inline]
fn next_slot_index(len: usize) -> u32 {
    assert!(len < MAX_SLOTS, "style arena is full ({MAX_SLOTS} slots)");
    len as u32
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

    #[inline]
    pub fn raw(self) -> u64 {
        self.0
    }
}

/// Style slots per chunk. Chunks never move or free, so slot pointers stay valid.
pub const SLOTS_PER_CHUNK: usize = 64;
pub const CHUNK_BYTES: usize = SLOTS_PER_CHUNK * STYLE_BUFFER_SIZE;

#[repr(C, align(16))]
struct Chunk([u8; CHUNK_BYTES]);

impl std::fmt::Debug for Chunk {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Chunk({:p})", self.0.as_ptr())
    }
}

impl Chunk {
    fn new_zeroed() -> Box<Chunk> {
        let layout = std::alloc::Layout::new::<Chunk>();
        unsafe {
            let ptr = std::alloc::alloc_zeroed(layout) as *mut Chunk;
            if ptr.is_null() {
                std::alloc::handle_alloc_error(layout);
            }
            Box::from_raw(ptr)
        }
    }
}

#[derive(Debug)]
struct StyleBuffer {
    ptr: *mut u8,
    pub(crate) ref_count: u32,
    // Key this buffer was registered under in `hash_index`, if interned.
    interned_hash: Option<u64>,
}

impl StyleBuffer {
    fn new(ptr: *mut u8) -> Self {
        StyleBuffer {
            ptr,
            ref_count: 0,
            interned_hash: None,
        }
    }

    pub fn bytes(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, STYLE_BUFFER_SIZE) }
    }

    pub fn mut_bytes(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr, STYLE_BUFFER_SIZE) }
    }
}

/// Number of built-in default handles (Default, Inline, Img, Flex, Grid, List, ListItem, Button).
const NUM_DEFAULTS: usize = 8;

#[derive(Debug)]
pub struct StyleArena {
    chunks: Vec<Box<Chunk>>,
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
        let mut arena = Self {
            chunks: Vec::new(),
            buffers: Vec::with_capacity(NUM_DEFAULTS),
            free_list: Vec::new(),
            generations: Vec::with_capacity(NUM_DEFAULTS),
            hash_index: std::collections::HashMap::new(),
            default_snapshots: [[0u8; STYLE_BUFFER_SIZE]; NUM_DEFAULTS],
        };
        let default_buffer = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[default_buffer].mut_bytes();
            Style::init_default_data(data);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[default_buffer].ref_count = 1;

        let inline = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[inline].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::DISPLAY_MODE, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[inline].ref_count = 1;

        let img = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[img].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_REPLACED, 1);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::Inline),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[img].ref_count = 1;

        let flex = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[flex].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Flex),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[flex].ref_count = 1;

        let grid = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[grid].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY,
                display_to_enum(Display::Grid),
            );
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[grid].ref_count = 1;

        let list = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[list].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[list].ref_count = 1;

        let list_item = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[list_item].mut_bytes();
            Style::init_default_data(data);
            crate::style::utils::set_style_data_i8(
                data,
                StyleKeys::DISPLAY_MODE,
                display_mode_to_enum(DisplayMode::ListItem),
            );
            crate::style::utils::set_style_data_i8(data, StyleKeys::ITEM_IS_LIST_ITEM, 1);
            set_style_data_i32(data, StyleKeys::REF_COUNT, 1);
        }
        arena.buffers[list_item].ref_count = 1;

        let button = arena_push_slot(&mut arena.chunks, &mut arena.buffers, &mut arena.generations, default_data.as_ptr()) as usize;
        {
            let data = arena.buffers[button].mut_bytes();
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
        arena.buffers[button].ref_count = 1;

        // Capture pristine snapshots of each default buffer before any JS writes
        let mut default_snapshots = [[0u8; STYLE_BUFFER_SIZE]; NUM_DEFAULTS];
        default_snapshots[Handle::Default as usize].copy_from_slice(arena.buffers[default_buffer].bytes());
        default_snapshots[Handle::Inline as usize].copy_from_slice(arena.buffers[inline].bytes());
        default_snapshots[Handle::Img as usize].copy_from_slice(arena.buffers[img].bytes());
        default_snapshots[Handle::Flex as usize].copy_from_slice(arena.buffers[flex].bytes());
        default_snapshots[Handle::Grid as usize].copy_from_slice(arena.buffers[grid].bytes());
        default_snapshots[Handle::List as usize].copy_from_slice(arena.buffers[list].bytes());
        default_snapshots[Handle::ListItem as usize].copy_from_slice(arena.buffers[list_item].bytes());
        default_snapshots[Handle::Button as usize].copy_from_slice(arena.buffers[button].bytes());

        arena.default_snapshots = default_snapshots;

        if PREFLIGHT_ENABLED.load(Ordering::Relaxed) {
            arena.reset_defaults(true);
        }

        arena
    }

    /// Like `new`, but pre-sizes the slot storage for `capacity` non-default
    /// buffers to avoid `Vec` reallocation churn during bulk node creation.
    pub fn with_capacity(default_data: &[u8; STYLE_BUFFER_SIZE], capacity: usize) -> Self {
        let mut arena = Self::new(default_data);
        arena.chunks.reserve(capacity.div_ceil(SLOTS_PER_CHUNK));
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
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to ref_count"
        );
        self.buffers[handle.index()].ref_count
    }

    /// Increment reference count (for when a node copies another's handle)
    pub fn retain(&mut self, handle: StyleHandle) {
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to retain"
        );
        let buffer = &mut self.buffers[handle.index()];
        buffer.ref_count += 1;
        let ref_count = buffer.ref_count;
        set_style_data_u32(buffer.mut_bytes(), StyleKeys::REF_COUNT, ref_count);
    }

    /// Release a handle (decrement ref count, free if zero)
    pub fn release(&mut self, handle: StyleHandle) {
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to release"
        );
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
            // Remove from hash index before the slot is reused. Uses the key it was
            // interned under: the bytes may have been mutated since.
            if let Some(hash) = buf.interned_hash.take() {
                if let Some(indices) = self.hash_index.get_mut(&hash) {
                    indices.retain(|&i| i != idx as u32);
                    if indices.is_empty() {
                        self.hash_index.remove(&hash);
                    }
                }
            }
            // alloc() overwrites this slot on reuse, and the generation bump
            // below rejects stale reads in the meantime — no need to zero.
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

/// Appends a slot holding a copy of `src`'s STYLE_BUFFER_SIZE bytes; returns its index.
fn arena_push_slot(chunks: &mut Vec<Box<Chunk>>, buffers: &mut Vec<StyleBuffer>, generations: &mut Vec<u8>, src: *const u8) -> u32 {
    let idx = next_slot_index(buffers.len());
    let (chunk, slot) = (idx as usize / SLOTS_PER_CHUNK, idx as usize % SLOTS_PER_CHUNK);
    if chunk == chunks.len() {
        chunks.push(Chunk::new_zeroed());
    }
    let ptr = unsafe { chunks[chunk].0.as_mut_ptr().add(slot * STYLE_BUFFER_SIZE) };
    unsafe { std::ptr::copy_nonoverlapping(src, ptr, STYLE_BUFFER_SIZE) };
    buffers.push(StyleBuffer::new(ptr));
    generations.push(0);
    idx
}

impl StyleArena {
    /// Allocate a new buffer with the given data
    pub fn alloc(&mut self, data: &[u8; STYLE_BUFFER_SIZE]) -> StyleHandle {
        self.alloc_from(data.as_ptr())
    }

    /// Allocates a slot holding a copy of `src`'s STYLE_BUFFER_SIZE bytes; `src` must not be a free slot.
    fn alloc_from(&mut self, src: *const u8) -> StyleHandle {
        let (idx, generation) = if let Some(free_idx) = self.free_list.pop() {
            let buf = &mut self.buffers[free_idx as usize];
            unsafe { std::ptr::copy_nonoverlapping(src, buf.ptr, STYLE_BUFFER_SIZE) };
            (free_idx, self.generations[free_idx as usize])
        } else {
            (arena_push_slot(&mut self.chunks, &mut self.buffers, &mut self.generations, src), 0)
        };
        let buf = &mut self.buffers[idx as usize];
        buf.ref_count = 1;
        buf.interned_hash = None;
        set_style_data_u32(buf.mut_bytes(), StyleKeys::REF_COUNT, 1);
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
        self.buffers[handle.index()].interned_hash = Some(hash);
        self.hash_index
            .entry(hash)
            .or_insert_with(Vec::new)
            .push(handle.index() as u32);
        handle
    }

    /// Prepare for mutation - COW if shared, returns (new_handle, ptr)
    pub fn prepare_mut(&mut self, handle: StyleHandle) -> (StyleHandle, *mut u8) {
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to prepare_mut"
        );
        let idx = handle.index();

        if self.buffers[idx].ref_count == 1 {
            return (handle, self.buffers[idx].ptr);
        }

        // COW: copy the current bytes (may include JS writes) straight into the new buffer.
        let new_handle = self.alloc_from(self.buffers[idx].ptr);

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

        (new_handle, self.buffers[new_handle.index()].ptr)
    }

    /// Get read-only pointer to buffer data
    pub fn get_ptr(&self, handle: StyleHandle) -> *const u8 {
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to get_ptr"
        );
        self.buffers[handle.index()].ptr
    }

    /// FFI entry point: a stale handle returns `None`.
    pub fn get_ptr_opt(&self, handle: StyleHandle) -> Option<*const u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).map(|b| b.ptr as *const u8)
    }

    /// Get mutable pointer (caller must ensure exclusive via prepare_mut)
    pub fn get_ptr_mut(&mut self, handle: StyleHandle) -> *mut u8 {
        debug_assert!(
            self.is_current(handle),
            "stale StyleHandle passed to get_ptr_mut"
        );
        self.buffers[handle.index()].ptr
    }

    /// FFI entry point: a stale handle returns `None`.
    pub fn get_ptr_mut_opt(&mut self, handle: StyleHandle) -> Option<*mut u8> {
        if !self.is_current(handle) {
            return None;
        }
        self.buffers.get(handle.index()).map(|b| b.ptr)
    }

    /// Get read-only reference to buffer data
    pub fn get(&self, handle: StyleHandle) -> &[u8; STYLE_BUFFER_SIZE] {
        debug_assert!(self.is_current(handle), "stale StyleHandle passed to get");
        <&[u8; STYLE_BUFFER_SIZE]>::try_from(self.buffers[handle.index()].bytes()).unwrap()
    }

    /// The bytes of chunk `chunk`, or None past the last chunk.
    pub fn chunk_ptr(&mut self, chunk: usize) -> Option<*mut u8> {
        self.chunks.get_mut(chunk).map(|c| c.0.as_mut_ptr())
    }

    pub fn chunk_count(&self) -> usize {
        self.chunks.len()
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

    #[test]
    fn handle_keeps_a_31_bit_index_and_its_generation() {
        let handle = StyleHandle::pack((MAX_SLOTS - 1) as u32, 0xAB);
        assert_eq!(handle.index(), MAX_SLOTS - 1);
        assert_eq!(handle.generation(), 0xAB);
        assert_eq!(StyleHandle::from_raw(handle.raw()), handle);
        assert_eq!(StyleHandle::pack(1 << 24, 0).index(), 1 << 24, "an index past 24 bits must not wrap");
    }

    #[test]
    fn last_slot_index_fits_a_signed_32_bit_int() {
        assert_eq!(next_slot_index(MAX_SLOTS - 1), i32::MAX as u32);
    }

    #[test]
    #[should_panic(expected = "style arena is full")]
    fn a_full_arena_panics_instead_of_wrapping() {
        next_slot_index(MAX_SLOTS);
    }

    #[test]
    fn slots_never_move_when_the_arena_grows() {
        let mut arena = StyleArena::default();
        let first = arena.alloc(&[3u8; STYLE_BUFFER_SIZE]);
        let ptr = arena.get_ptr(first);
        let chunks = arena.chunk_count();
        let rest: Vec<_> = (0..SLOTS_PER_CHUNK * 3).map(|_| arena.alloc(&[0u8; STYLE_BUFFER_SIZE])).collect();
        assert!(arena.chunk_count() > chunks, "expected new chunks");
        assert_eq!(arena.get_ptr(first), ptr, "a slot moved when the arena grew");
        assert_eq!(arena.get(first)[0], 3);
        for (i, h) in rest.iter().enumerate() {
            let expected = unsafe { arena.chunk_ptr(h.index() / SLOTS_PER_CHUNK).unwrap().add((h.index() % SLOTS_PER_CHUNK) * STYLE_BUFFER_SIZE) };
            assert_eq!(arena.get_ptr(*h), expected as *const u8, "slot {i} is not at its chunk offset");
        }
    }

    #[test]
    fn slots_are_aligned_for_typed_reads() {
        let mut arena = StyleArena::default();
        for _ in 0..SLOTS_PER_CHUNK + 1 {
            let h = arena.alloc(&[0u8; STYLE_BUFFER_SIZE]);
            assert_eq!(arena.get_ptr(h) as usize % 8, 0);
        }
    }

    #[test]
    fn copy_on_write_moves_only_the_writer_and_restores_the_default() {
        let mut arena = StyleArena::default();
        arena.retain(StyleHandle::DEFAULT);
        let shared = arena.get_ptr(StyleHandle::DEFAULT);
        let pristine = *arena.get(StyleHandle::DEFAULT);
        unsafe { *(shared as *mut u8).add(100) ^= 0xFF };
        let (own, ptr) = arena.prepare_mut(StyleHandle::DEFAULT);
        assert_ne!(own, StyleHandle::DEFAULT);
        assert_ne!(ptr as *const u8, shared);
        assert_eq!(arena.get_ptr(StyleHandle::DEFAULT), shared, "the shared slot moved");
        assert_eq!(unsafe { *ptr.add(100) }, pristine[100] ^ 0xFF, "the copy lost the write");
        assert_eq!(arena.get(StyleHandle::DEFAULT)[100], pristine[100], "the default kept the write");
        let (again, ptr2) = arena.prepare_mut(own);
        assert_eq!((again, ptr2), (own, ptr), "an owned slot was copied again");
    }

    #[test]
    fn a_reused_slot_keeps_its_address() {
        let mut arena = StyleArena::default();
        let a = arena.alloc(&[1u8; STYLE_BUFFER_SIZE]);
        let ptr = arena.get_ptr(a);
        arena.release(a);
        let b = arena.alloc(&[2u8; STYLE_BUFFER_SIZE]);
        assert_eq!(b.index(), a.index());
        assert_eq!(arena.get_ptr(b), ptr);
        assert_eq!(arena.get(b)[0], 2);
    }

    #[test]
    fn chunk_ptr_covers_existing_chunks_only() {
        let mut arena = StyleArena::default();
        assert!(arena.chunk_ptr(0).is_some());
        assert!(arena.chunk_ptr(arena.chunk_count()).is_none());
    }
}
