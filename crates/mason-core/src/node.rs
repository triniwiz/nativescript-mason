use crate::style::Style;
use crate::tree::{Id, TreeInner};
use crate::MeasureOutput;
use std::fmt::Debug;
use log::warn;

#[cfg(target_vendor = "apple")]
use objc2::runtime::NSObject;

use parking_lot::{Mutex, RwLock};
use slotmap::SecondaryMap;
use std::sync::Arc;
use taffy::{AvailableSpace, Cache, ClearState, Layout, Size};

use crate::style::arena::{StyleArena, StyleHandle};
use crate::style::utils::{
    get_style_data_i8_raw, set_style_data_i8_raw, get_style_data_u32, set_style_data_u32,
    get_style_data_i32, set_style_data_i32, get_style_data_u8, set_style_data_u8,
};
#[cfg(target_os = "android")]
use crate::{JVM, JVM_CACHE};

#[cfg(target_vendor = "apple")]
#[derive(Debug, Clone)]
pub struct AppleNode(objc2::rc::Retained<NSObject>);

#[cfg(target_vendor = "apple")]
impl AppleNode {
    pub fn from_ptr(ptr: *mut NSObject) -> Option<Self> {
        unsafe { objc2::rc::Retained::from_raw(ptr).map(AppleNode) }
    }
    pub fn set_computed_size(&mut self, width: f64, height: f64) {
        let _: () = unsafe { objc2::msg_send![&self.0, setComputedSize: width, height: height] };
    }
    pub fn computed_width(&self) -> f64 {
        unsafe { objc2::msg_send![&self.0, computedWidth] }
    }

    pub fn computed_height(&self) -> f64 {
        unsafe { objc2::msg_send![&self.0, computedHeight] }
    }
}

#[cfg(target_os = "android")]
#[derive(Debug, Clone, Copy)]
pub struct AndroidNode(pub(crate) jni::sys::jint);

#[cfg(target_os = "android")]
impl AndroidNode {
    pub fn set_computed_size(&self, width: f32, height: f32) {
        if let Some(jvm) = crate::JVM.get() {
            let vm = jvm.attach_current_thread();
            let mut env = vm.unwrap();
            if let Some(cache) = crate::JVM_CACHE.get() {
                // Capture raw bit-patterns and subnormal status for diagnostics.
                let width_bits = width.to_bits();
                let height_bits = height.to_bits();
                let is_subnormal = height.is_subnormal();
                warn!(
                    "AndroidNode.set_computed_size raw node={} width={} height={} width_bits=0x{:08x} height_bits=0x{:08x} is_subnormal={}",
                    self.0,
                    width,
                    height,
                    width_bits,
                    height_bits,
                    is_subnormal
                );

                let mut clamped_height = height;
                // Clamp very small positive heights to zero to avoid visual
                // glitches caused by tiny non-zero floats originating in
                // native layout math or rounding.
                if clamped_height > 0.0 && clamped_height.abs() < 1e-6_f32 {
                    warn!(
                        "AndroidNode.clamp tiny height node={} orig={} -> 0.0",
                        self.0, clamped_height
                    );
                    clamped_height = 0.0;
                }

                let node = unsafe { jni::objects::JClass::from_raw(cache.node_clazz.as_raw()) };
                let _ = unsafe {
                    warn!("AndroidNode.set_computed_size node={} w={} h={}", self.0, width, clamped_height);
                    env.call_static_method_unchecked(
                        node,
                        cache.node_set_computed_size_id,
                        jni::signature::ReturnType::Primitive(jni::signature::Primitive::Void),
                        &[
                            jni::sys::jvalue { i: self.0 },
                            jni::sys::jvalue { f: width },
                            jni::sys::jvalue { f: clamped_height },
                        ],
                    )
                };
            }
        }
    }
    pub fn computed_width(&self) -> f32 {
        0f32
    }

    pub fn computed_height(&self) -> f32 {
        0f32
    }
}

#[derive(Debug)]
pub struct NodeMeasure {
    #[cfg(not(target_os = "android"))]
    pub(crate) data: *mut std::os::raw::c_void,
    #[cfg(target_os = "android")]
    pub(crate) measure: jni::sys::jint,
    #[cfg(not(target_os = "android"))]
    pub(crate) measure: Option<
        extern "C" fn(
            *const std::os::raw::c_void,
            std::os::raw::c_float,
            std::os::raw::c_float,
            std::os::raw::c_float,
            std::os::raw::c_float,
        ) -> std::os::raw::c_longlong,
    >,
}

impl NodeMeasure {
    #[cfg(target_os = "android")]
    pub fn measure(
        &self,
        known_dimensions: taffy::Size<Option<f32>>,
        available_space: taffy::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
        // If no JVM measure context is registered (measure == -1), avoid calling
        // into Java and return the known dimensions or zero fallback.
        if self.measure < 0 {
            return known_dimensions.map(|v| v.unwrap_or(0.0));
        }

        match crate::JVM.get() {
            Some(jvm) => {
                let vm = jvm.attach_current_thread();
                let mut env = vm.unwrap();

                if let Some(cache) = crate::JVM_CACHE.get() {
                    let node = unsafe { jni::objects::JClass::from_raw(cache.node_clazz.as_raw()) };
                    // Trace inputs to the JVM measure call for auditing.
                    let packed_known = MeasureOutput::make(
                        known_dimensions.width.unwrap_or(f32::NAN),
                        known_dimensions.height.unwrap_or(f32::NAN),
                    );
                    let packed_avail = MeasureOutput::make(
                        match available_space.width {
                            AvailableSpace::MinContent => -1.,
                            AvailableSpace::MaxContent => -2.,
                            AvailableSpace::Definite(value) => value,
                        },
                        match available_space.height {
                            AvailableSpace::MinContent => -1.,
                            AvailableSpace::MaxContent => -2.,
                            AvailableSpace::Definite(value) => value,
                        },
                    );

                    let result = unsafe {
                        env.call_static_method_unchecked(
                            node,
                            cache.measure_measure_id,
                            jni::signature::ReturnType::Primitive(jni::signature::Primitive::Long),
                            &[
                                jni::sys::jvalue { i: self.measure },
                                jni::sys::jvalue { j: packed_known },
                                jni::sys::jvalue { j: packed_avail },
                            ],
                        )
                    };

                    return match result {
                        Ok(result) => {
                            let size = result.j().unwrap_or_default();
                            let width = MeasureOutput::get_width(size);
                            let height = MeasureOutput::get_height(size);
                            
                            Size { width, height }
                        }
                        Err(e) => {
                            known_dimensions.map(|v| v.unwrap_or(0.0))
                        }
                    };
                }

                known_dimensions.map(|v| v.unwrap_or(0.0))
            }
            _ => known_dimensions.map(|v| v.unwrap_or(0.0)),
        }
    }

    #[cfg(not(target_os = "android"))]
    pub fn measure(
        &self,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> Size<f32> {
        match self.measure.as_ref() {
            None => Size {
                width: known_dimensions.width.unwrap_or_default(),
                height: known_dimensions.height.unwrap_or_default(),
            },
            Some(measure) => {
                let measure_data = self.data;
                let available_space_width = match available_space.width {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let available_space_height = match available_space.height {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let size = measure(
                    measure_data,
                    known_dimensions.width.unwrap_or(f32::NAN),
                    known_dimensions.height.unwrap_or(f32::NAN),
                    available_space_width,
                    available_space_height,
                );

                let width = MeasureOutput::get_width(size);
                let height = MeasureOutput::get_height(size);

                Size { width, height }
            }
        }
    }
}

#[derive(Clone, Debug)]
pub enum InlineSegment {
    Text {
        width: f32,
        ascent: f32,
        descent: f32,
        flags: u8,
    },
    InlineChild {
        id: Option<Id>,
        baseline: f32,
    },
    /// Explicit line break (e.g. <br>)
    LineBreak,
}

#[derive(Debug)]
pub struct NodeData {
    pub(crate) inline_segments: Mutex<Vec<InlineSegment>>,
    #[cfg(not(target_os = "android"))]
    pub(crate) data: *mut std::os::raw::c_void,
    #[cfg(target_vendor = "apple")]
    pub apple_data: Option<AppleNode>,
    #[cfg(target_os = "android")]
    pub(crate) android_data: Option<AndroidNode>,
    #[cfg(target_os = "android")]
    pub(crate) measure: jni::sys::jint,
    #[cfg(not(target_os = "android"))]
    pub(crate) measure: Option<
        extern "C" fn(
            *const std::os::raw::c_void,
            std::os::raw::c_float,
            std::os::raw::c_float,
            std::os::raw::c_float,
            std::os::raw::c_float,
        ) -> std::os::raw::c_longlong,
    >,
}

impl NodeData {
    pub fn inline_segments(&self) -> parking_lot::MutexGuard<'_, Vec<InlineSegment>> {
        self.inline_segments.lock()
    }

    pub fn set_inline_segments(&self, segments: Vec<InlineSegment>) {
        *self.inline_segments.lock() = segments;
    }

    #[cfg(target_os = "android")]
    pub(crate) fn new() -> Self {
        unsafe {
            Self {
                measure: -1,
                android_data: None,
                inline_segments: Mutex::new(vec![]),
            }
        }
    }

    #[cfg(not(target_os = "android"))]
    pub(crate) fn new() -> Self {
        unsafe {
            Self {
                data: 0 as _,
                #[cfg(target_vendor = "apple")]
                apple_data: None,
                measure: None,
                inline_segments: Mutex::new(vec![]),
            }
        }
    }

    #[cfg(target_os = "android")]
    pub fn measure(
        &self,
        known_dimensions: taffy::Size<Option<f32>>,
        available_space: taffy::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
        match crate::JVM.get() {
            Some(jvm) => {
                let vm = jvm.attach_current_thread();
                let mut env = vm.unwrap();

                if let Some(cache) = crate::JVM_CACHE.get() {
                    unsafe {
                        let node = unsafe {
                            jni::objects::JClass::from_raw(cache.node_clazz.clone().as_raw())
                        };
                        let result = env.call_static_method_unchecked(
                            node,
                            cache.measure_measure_id,
                            jni::signature::ReturnType::Primitive(jni::signature::Primitive::Long),
                            &[
                                jni::sys::jvalue { i: self.measure },
                                jni::sys::jvalue {
                                    j: MeasureOutput::make(
                                        known_dimensions.width.unwrap_or(f32::NAN),
                                        known_dimensions.height.unwrap_or(f32::NAN),
                                    ),
                                },
                                jni::sys::jvalue {
                                    j: MeasureOutput::make(
                                        match available_space.width {
                                            AvailableSpace::MinContent => -1.,
                                            AvailableSpace::MaxContent => -2.,
                                            AvailableSpace::Definite(value) => value,
                                        },
                                        match available_space.height {
                                            AvailableSpace::MinContent => -1.,
                                            AvailableSpace::MaxContent => -2.,
                                            AvailableSpace::Definite(value) => value,
                                        },
                                    ),
                                },
                            ],
                        );

                        return match result {
                            Ok(result) => {
                                let size = result.j().unwrap_or_default();
                                let width = MeasureOutput::get_width(size);
                                let height = MeasureOutput::get_height(size);

                                Size { width, height }
                            }
                            Err(_) => known_dimensions.map(|v| v.unwrap_or(0.0)),
                        };
                    }
                }

                known_dimensions.map(|v| v.unwrap_or(0.0))
            }
            _ => known_dimensions.map(|v| v.unwrap_or(0.0)),
        }
    }

    #[cfg(not(target_os = "android"))]
    pub fn measure(
        &self,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> Size<f32> {
        match self.measure.as_ref() {
            None => Size {
                width: known_dimensions.width.unwrap_or_default(),
                height: known_dimensions.height.unwrap_or_default(),
            },
            Some(measure) => {
                let measure_data = self.data;
                let available_space_width = match available_space.width {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let available_space_height = match available_space.height {
                    AvailableSpace::MinContent => -1.,
                    AvailableSpace::MaxContent => -2.,
                    AvailableSpace::Definite(value) => value,
                };

                let size = measure(
                    measure_data,
                    known_dimensions.width.unwrap_or(f32::NAN),
                    known_dimensions.height.unwrap_or(f32::NAN),
                    available_space_width,
                    available_space_height,
                );

                let width = MeasureOutput::get_width(size);
                let height = MeasureOutput::get_height(size);

                Size { width, height }
            }
        }
    }

    // copy measure
    pub(crate) fn copy_measure(&self) -> NodeMeasure {
        NodeMeasure {
            #[cfg(not(target_os = "android"))]
            data: self.data,
            #[cfg(not(target_os = "android"))]
            measure: self.measure,
            #[cfg(target_os = "android")]
            measure: self.measure,
        }
    }
}

impl Default for NodeData {
    fn default() -> Self {
        Self::new()
    }
}

bitflags::bitflags! {
    #[derive(Default, Debug, Copy, Clone)]
    pub struct PseudoStates: u16 {
        const HOVER         = 1 << 0;
        const ACTIVE        = 1 << 1;
        const FOCUS         = 1 << 2;
        const FOCUS_WITHIN  = 1 << 3;
        const FOCUS_VISIBLE = 1 << 4;
        const ENABLED       = 1 << 5;
        const DISABLED      = 1 << 6;
        const CHECKED       = 1 << 7;
    }
}

#[derive(Debug, Default, Clone)]
pub struct PseudoStyles {
    pub hover: Option<crate::style::Style>,
    pub active: Option<crate::style::Style>,
    pub focus: Option<crate::style::Style>,
    pub disabled: Option<crate::style::Style>,
    pub checked: Option<crate::style::Style>,
}

/*
#[derive(Default, Debug, Clone)]
pub struct PseudoStyles {
    pub hover: std::cell::LazyCell<Style>,
    pub active: std::cell::LazyCell<Style>,
    pub focus: std::cell::LazyCell<Style>,
    pub disabled: std::cell::LazyCell<Style>,
    pub checked: std::cell::LazyCell<Style>,
}
*/

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum NodeType {
    Normal,
    Text,
    Image,
    LineBreak,
}

#[repr(usize)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[allow(non_camel_case_types)]
pub enum NodeStateKeys {
    IS_NODE_DIRTY = 0,
    IS_VIRTUAL = 1,
    IS_MUTABLE = 2,
    // two bytes reserved for pseudo state bitmask (u16)
    PSEUDO_FLAGS_LOW = 3,
    PSEUDO_FLAGS_HIGH = 4,
}

pub const NODE_STATE_BUFFER_SIZE: usize = 5;

#[derive(Debug, Clone)]
pub struct Node {
    pub(crate) style: Style,
    pub(crate) cache: Cache,
    pub(crate) unrounded_layout: Layout,
    pub(crate) final_layout: Layout,
    pub(crate) guard: Arc<()>,
    pub(crate) has_measure: bool,
    pub(crate) type_: NodeType,
    pub(crate) is_anonymous: bool,
    pub(crate) state: [u8; NODE_STATE_BUFFER_SIZE],
    // optional per-node pseudo styles (hover/active/focus/disabled/checked)
    pub(crate) pseudo_styles: Option<PseudoStyles>,
    #[cfg(target_os = "android")]
    pub(crate) state_buffer: jni::sys::jint,
}

impl Node {
    pub fn new(arena: *mut StyleArena) -> Self {
        Self {
            style: Style::new(arena),
            cache: Default::default(),
            unrounded_layout: Default::default(),
            final_layout: Default::default(),
            guard: Default::default(),
            has_measure: false,
            type_: NodeType::Normal,
            is_anonymous: false,
            state: [0u8; NODE_STATE_BUFFER_SIZE],
            pseudo_styles: None,
            #[cfg(target_os = "android")]
            state_buffer: -1,
        }
    }

    pub fn new_with_handle(arena: *mut StyleArena, handle: StyleHandle) -> Self {
        Self {
            style: Style::new_with_handle(arena, handle),
            cache: Default::default(),
            unrounded_layout: Default::default(),
            final_layout: Default::default(),
            guard: Default::default(),
            has_measure: false,
            type_: NodeType::Normal,
            is_anonymous: false,
            state: [0u8; NODE_STATE_BUFFER_SIZE],
            pseudo_styles: None,
            #[cfg(target_os = "android")]
            state_buffer: -1,
        }
    }

    /// Attach a pseudo `Style` to this node for the given pseudo state.
    /// The `style` should have been created with the same arena as the node.
    pub fn set_pseudo_style(&mut self, state: PseudoStates, style: Style) {
        if self.pseudo_styles.is_none() {
            self.pseudo_styles = Some(PseudoStyles::default())
        }
        if let Some(p) = &mut self.pseudo_styles {
            if state.contains(PseudoStates::HOVER) {
                p.hover = Some(style.clone());
            }
            if state.contains(PseudoStates::ACTIVE) {
                p.active = Some(style.clone());
            }
            if state.contains(PseudoStates::FOCUS) {
                p.focus = Some(style.clone());
            }
            if state.contains(PseudoStates::DISABLED) {
                p.disabled = Some(style.clone());
            }
            if state.contains(PseudoStates::CHECKED) {
                p.checked = Some(style.clone());
            }
        }
    }

    /// Return the attached `Style` for the given pseudo `state`, if any.
    /// If `state` contains multiple flags, the first matching pseudo style
    /// is returned in the priority order: HOVER, ACTIVE, FOCUS, DISABLED, CHECKED.
    pub fn get_pseudo_style(&self, state: PseudoStates) -> Option<Style> {
        if let Some(p) = &self.pseudo_styles {
            if state.contains(PseudoStates::HOVER) {
                if let Some(s) = &p.hover {
                    return Some(s.clone());
                }
            }
            if state.contains(PseudoStates::ACTIVE) {
                if let Some(s) = &p.active {
                    return Some(s.clone());
                }
            }
            if state.contains(PseudoStates::FOCUS) {
                if let Some(s) = &p.focus {
                    return Some(s.clone());
                }
            }
            if state.contains(PseudoStates::DISABLED) {
                if let Some(s) = &p.disabled {
                    return Some(s.clone());
                }
            }
            if state.contains(PseudoStates::CHECKED) {
                if let Some(s) = &p.checked {
                    return Some(s.clone());
                }
            }
        }

        None
    }

    pub fn style(&self) -> &Style {
        &self.style
    }

    pub fn style_mut(&mut self) -> &mut Style {
        self.style.prepare_mut();
        &mut self.style
    }

    // don't mutable the raw buffer w/o calling prepare_mut
    pub(crate) fn inner_style_mut(&mut self) -> &mut Style {
        &mut self.style
    }

    pub(crate) fn set_node_state(&mut self, value: bool) {
        set_style_data_i8_raw(
            self.state.as_mut_slice(),
            NodeStateKeys::IS_NODE_DIRTY as usize,
            if value { 1 } else { 0 },
        );
    }

    #[inline(always)]
    pub fn is_virtual(&self) -> bool {
        get_style_data_i8_raw(self.state.as_slice(), NodeStateKeys::IS_VIRTUAL as usize) != 0
    }

    #[inline(always)]
    pub fn is_mutable(&self) -> bool {
        get_style_data_i8_raw(self.state.as_slice(), NodeStateKeys::IS_MUTABLE as usize) != 0
    }

    pub fn mark_dirty(&mut self) -> ClearState {
        self.set_node_state(true);
        self.cache.clear()
    }

    #[inline]
    pub fn is_text_container(&self) -> bool {
        self.type_ == NodeType::Text
    }

    #[inline]
    pub fn is_image(&self) -> bool {
        self.type_ == NodeType::Image
    }

    #[inline]
    pub fn is_list(&self) -> bool {
        self.style.get_item_is_list()
    }

    #[inline]
    pub fn is_list_item(&self) -> bool {
        self.style.get_item_is_list_item()
    }

    #[inline]
    pub fn is_line_container(&self) -> bool {
        self.type_ == NodeType::LineBreak
    }

    #[inline]
    pub fn get_is_virtual(&self) -> bool {
        get_style_data_i8_raw(self.state.as_slice(), NodeStateKeys::IS_VIRTUAL as usize) != 0
    }
    #[inline]
    pub fn set_is_virtual(&mut self, value: bool) {
        set_style_data_i8_raw(
            self.state.as_mut_slice(),
            NodeStateKeys::IS_VIRTUAL as usize,
            if value { 1 } else { 0 },
        );
    }

    #[inline]
    pub fn get_pseudo_states(&self) -> PseudoStates {
        let low = self.state[NodeStateKeys::PSEUDO_FLAGS_LOW as usize];
        let high = self.state[NodeStateKeys::PSEUDO_FLAGS_HIGH as usize];
        let bits = u16::from_ne_bytes([low, high]);
        PseudoStates::from_bits_truncate(bits)
    }

    #[inline]
    pub fn set_pseudo_states(&mut self, flags: PseudoStates) {
        let bytes = flags.bits().to_ne_bytes();
        self.state[NodeStateKeys::PSEUDO_FLAGS_LOW as usize] = bytes[0];
        self.state[NodeStateKeys::PSEUDO_FLAGS_HIGH as usize] = bytes[1];
    }

    pub fn compute_style(&self) -> Style {
        let mut result = self.style.clone();
        if self.is_text_container() && result.is_inline() {
            result.set_size(Size::auto());
        }

        // Merge pseudo styles (if attached) for commonly-used properties.
        let flags = self.get_pseudo_states();

        // Merge helper: for each property with a STATE byte, if SET in src, copy to dst.
        // Also checks the pseudo set bitmask for layout properties without STATE bytes.
        let mut merge_from = |src: &crate::style::Style, dst: &mut crate::style::Style| {
            dst.prepare_mut();
            use crate::style::StyleKeys;

            // Read the pseudo set bitmask from the source buffer
            let src_data = src.data();
            let pseudo_set_low = i64::from_ne_bytes(
                src_data[StyleKeys::PSEUDO_SET_MASK_LOW as usize..StyleKeys::PSEUDO_SET_MASK_LOW as usize + 8]
                    .try_into().unwrap_or([0u8; 8])
            ) as u64;
            let pseudo_set_high = i64::from_ne_bytes(
                src_data[StyleKeys::PSEUDO_SET_MASK_HIGH as usize..StyleKeys::PSEUDO_SET_MASK_HIGH as usize + 8]
                    .try_into().unwrap_or([0u8; 8])
            ) as u64;
            let pseudo_set = (pseudo_set_high as u128) << 64 | pseudo_set_low as u128;

            // Helper: check if a StateKeys flag is set in the pseudo bitmask
            macro_rules! is_pseudo_set {
                ($flag:expr) => {
                    (pseudo_set & $flag.bits()) != 0
                };
            }

            // Helper: copy a raw byte range from src to dst
            macro_rules! copy_range {
                ($start:expr, $end:expr) => {
                    dst.data_mut()[$start..$end].copy_from_slice(&src.data()[$start..$end]);
                };
            }

            // Helper: merge an i32 (4-byte) property via STATE byte
            macro_rules! merge_i32 {
                ($val:expr, $state:expr) => {
                    if get_style_data_u8(src.data(), $state) != 0 {
                        let v = get_style_data_i32(src.data(), $val);
                        set_style_data_i32(dst.data_mut(), $val, v);
                        set_style_data_u8(dst.data_mut(), $state, 1);
                    }
                };
            }

            // Helper: merge a u8 (1-byte) property
            macro_rules! merge_u8 {
                ($val:expr, $state:expr) => {
                    if get_style_data_u8(src.data(), $state) != 0 {
                        let v = get_style_data_i8_raw(src.data(), $val as usize);
                        set_style_data_i8_raw(dst.data_mut(), $val as usize, v);
                        set_style_data_u8(dst.data_mut(), $state, 1);
                    }
                };
            }

            // Background color (i32 + type byte)
            if get_style_data_u8(src.data(), StyleKeys::BACKGROUND_COLOR_STATE) != 0 {
                let v = get_style_data_i32(src.data(), StyleKeys::BACKGROUND_COLOR);
                set_style_data_i32(dst.data_mut(), StyleKeys::BACKGROUND_COLOR, v);
                set_style_data_u8(dst.data_mut(), StyleKeys::BACKGROUND_COLOR_STATE, 1);
                let t = get_style_data_i8_raw(src.data(), StyleKeys::BACKGROUND_COLOR_TYPE as usize);
                set_style_data_i8_raw(dst.data_mut(), StyleKeys::BACKGROUND_COLOR_TYPE as usize, t);
            }

            // Font color (i32)
            merge_i32!(StyleKeys::FONT_COLOR, StyleKeys::FONT_COLOR_STATE);

            // Font size (i32 + type byte)
            if get_style_data_u8(src.data(), StyleKeys::FONT_SIZE_STATE) != 0 {
                let v = get_style_data_i32(src.data(), StyleKeys::FONT_SIZE);
                set_style_data_i32(dst.data_mut(), StyleKeys::FONT_SIZE, v);
                set_style_data_u8(dst.data_mut(), StyleKeys::FONT_SIZE_STATE, 1);
                let t = get_style_data_i8_raw(src.data(), StyleKeys::FONT_SIZE_TYPE as usize);
                set_style_data_i8_raw(dst.data_mut(), StyleKeys::FONT_SIZE_TYPE as usize, t);
            }

            // Font weight (i32)
            merge_i32!(StyleKeys::FONT_WEIGHT, StyleKeys::FONT_WEIGHT_STATE);

            // Font style (i32 slant + type byte)
            if get_style_data_u8(src.data(), StyleKeys::FONT_STYLE_STATE) != 0 {
                let v = get_style_data_i32(src.data(), StyleKeys::FONT_STYLE_SLANT);
                set_style_data_i32(dst.data_mut(), StyleKeys::FONT_STYLE_SLANT, v);
                set_style_data_u8(dst.data_mut(), StyleKeys::FONT_STYLE_STATE, 1);
                let t = get_style_data_i8_raw(src.data(), StyleKeys::FONT_STYLE_TYPE as usize);
                set_style_data_i8_raw(dst.data_mut(), StyleKeys::FONT_STYLE_TYPE as usize, t);
            }

            // Font family (state only — family stored externally)
            if get_style_data_u8(src.data(), StyleKeys::FONT_FAMILY_STATE) != 0 {
                set_style_data_u8(dst.data_mut(), StyleKeys::FONT_FAMILY_STATE, 1);
            }

            // Text align (u8)
            merge_u8!(StyleKeys::TEXT_ALIGN, StyleKeys::TEXT_ALIGN_STATE);

            // Text justify (u8)
            merge_u8!(StyleKeys::TEXT_JUSTIFY, StyleKeys::TEXT_JUSTIFY_STATE);

            // Text transform (u8)
            merge_u8!(StyleKeys::TEXT_TRANSFORM, StyleKeys::TEXT_TRANSFORM_STATE);

            // Text wrap (u8)
            merge_u8!(StyleKeys::TEXT_WRAP, StyleKeys::TEXT_WRAP_STATE);

            // White space (u8)
            merge_u8!(StyleKeys::WHITE_SPACE, StyleKeys::WHITE_SPACE_STATE);

            // Decoration line (u8)
            merge_u8!(StyleKeys::DECORATION_LINE, StyleKeys::DECORATION_LINE_STATE);

            // Decoration color (i32)
            merge_i32!(StyleKeys::DECORATION_COLOR, StyleKeys::DECORATION_COLOR_STATE);

            // Decoration style (u8)
            merge_u8!(StyleKeys::DECORATION_STYLE, StyleKeys::DECORATION_STYLE_STATE);

            // Decoration thickness (i32)
            merge_i32!(StyleKeys::DECORATION_THICKNESS, StyleKeys::DECORATION_THICKNESS_STATE);

            // Letter spacing (i32)
            merge_i32!(StyleKeys::LETTER_SPACING, StyleKeys::LETTER_SPACING_STATE);

            // Text indent (i32 + type byte)
            if get_style_data_u8(src.data(), StyleKeys::TEXT_INDENT_STATE) != 0 {
                let v = get_style_data_i32(src.data(), StyleKeys::TEXT_INDENT);
                set_style_data_i32(dst.data_mut(), StyleKeys::TEXT_INDENT, v);
                set_style_data_u8(dst.data_mut(), StyleKeys::TEXT_INDENT_STATE, 1);
                let t = get_style_data_i8_raw(src.data(), StyleKeys::TEXT_INDENT_TYPE as usize);
                set_style_data_i8_raw(dst.data_mut(), StyleKeys::TEXT_INDENT_TYPE as usize, t);
            }

            // Line height (i32 + type byte)
            if get_style_data_u8(src.data(), StyleKeys::LINE_HEIGHT_STATE) != 0 {
                let v = get_style_data_i32(src.data(), StyleKeys::LINE_HEIGHT);
                set_style_data_i32(dst.data_mut(), StyleKeys::LINE_HEIGHT, v);
                set_style_data_u8(dst.data_mut(), StyleKeys::LINE_HEIGHT_STATE, 1);
                let t = get_style_data_i8_raw(src.data(), StyleKeys::LINE_HEIGHT_TYPE as usize);
                set_style_data_i8_raw(dst.data_mut(), StyleKeys::LINE_HEIGHT_TYPE as usize, t);
            }

            // Text shadow (state only — shadows stored externally)
            if get_style_data_u8(src.data(), StyleKeys::TEXT_SHADOW_STATE) != 0 {
                set_style_data_u8(dst.data_mut(), StyleKeys::TEXT_SHADOW_STATE, 1);
            }

            // List style position (u8)
            merge_u8!(StyleKeys::LIST_STYLE_POSITION, StyleKeys::LIST_STYLE_POSITION_STATE);

            // List style type (u8)
            merge_u8!(StyleKeys::LIST_STYLE_TYPE, StyleKeys::LIST_STYLE_TYPE_STATE);

            // --- Bitmask-based merge for properties without STATE bytes ---
            // These use the pseudo set mask to detect explicit overrides.
            use crate::style::StateKeys as SK;

            // Border colors (4 x u32, no STATE bytes)
            if is_pseudo_set!(SK::BORDER_COLOR) {
                copy_range!(202, 218); // BORDER_LEFT_COLOR..BORDER_BOTTOM_COLOR (16 bytes)
            }

            // Border radius (4 corners, each 14 bytes = 56 bytes total)
            if is_pseudo_set!(SK::BORDER_RADIUS) {
                copy_range!(218, 274); // All border radius fields
            }

            // Border styles (4 x u8)
            if is_pseudo_set!(SK::BORDER_STYLE) {
                copy_range!(198, 202); // BORDER_LEFT_STYLE..BORDER_BOTTOM_STYLE
            }

            // --- Single-byte enum properties ---
            if is_pseudo_set!(SK::DISPLAY) {
                copy_range!(0, 1); // DISPLAY
            }
            if is_pseudo_set!(SK::POSITION) {
                copy_range!(1, 2); // POSITION
            }
            if is_pseudo_set!(SK::DIRECTION) {
                copy_range!(2, 3); // DIRECTION
            }
            if is_pseudo_set!(SK::FLEX_DIRECTION) {
                copy_range!(3, 4); // FLEX_DIRECTION
            }
            if is_pseudo_set!(SK::FLEX_WRAP) {
                copy_range!(4, 5); // FLEX_WRAP
            }
            if is_pseudo_set!(SK::OVERFLOW_X) {
                copy_range!(5, 6); // OVERFLOW_X
            }
            if is_pseudo_set!(SK::OVERFLOW_Y) {
                copy_range!(6, 7); // OVERFLOW_Y
            }
            if is_pseudo_set!(SK::ALIGN_ITEMS) {
                copy_range!(7, 8); // ALIGN_ITEMS
            }
            if is_pseudo_set!(SK::ALIGN_SELF) {
                copy_range!(8, 9); // ALIGN_SELF
            }
            if is_pseudo_set!(SK::ALIGN_CONTENT) {
                copy_range!(9, 10); // ALIGN_CONTENT
            }
            if is_pseudo_set!(SK::JUSTIFY_ITEMS) {
                copy_range!(10, 11); // JUSTIFY_ITEMS
            }
            if is_pseudo_set!(SK::JUSTIFY_SELF) {
                copy_range!(11, 12); // JUSTIFY_SELF
            }
            if is_pseudo_set!(SK::JUSTIFY_CONTENT) {
                copy_range!(12, 13); // JUSTIFY_CONTENT
            }

            // --- Type+value pair properties ---
            if is_pseudo_set!(SK::INSET) {
                copy_range!(13, 33); // INSET_LEFT through INSET_BOTTOM (4 sides x 5 bytes)
            }
            if is_pseudo_set!(SK::MARGIN) {
                copy_range!(33, 53); // MARGIN_LEFT through MARGIN_BOTTOM
            }
            if is_pseudo_set!(SK::PADDING) {
                copy_range!(53, 73); // PADDING_LEFT through PADDING_BOTTOM
            }
            if is_pseudo_set!(SK::BORDER) {
                copy_range!(73, 93); // BORDER_LEFT through BORDER_BOTTOM (widths)
            }
            if is_pseudo_set!(SK::FLEX_GROW) {
                copy_range!(93, 97); // FLEX_GROW (f32)
            }
            if is_pseudo_set!(SK::FLEX_SHRINK) {
                copy_range!(97, 101); // FLEX_SHRINK (f32)
            }
            if is_pseudo_set!(SK::FLEX_BASIS) {
                copy_range!(101, 106); // FLEX_BASIS_TYPE + FLEX_BASIS_VALUE
            }
            if is_pseudo_set!(SK::SIZE) {
                copy_range!(106, 116); // WIDTH + HEIGHT (type+value each)
            }
            if is_pseudo_set!(SK::MIN_SIZE) {
                copy_range!(116, 126); // MIN_WIDTH + MIN_HEIGHT
            }
            if is_pseudo_set!(SK::MAX_SIZE) {
                copy_range!(126, 136); // MAX_WIDTH + MAX_HEIGHT
            }
            if is_pseudo_set!(SK::GAP) {
                copy_range!(136, 146); // GAP_ROW + GAP_COLUMN
            }
            if is_pseudo_set!(SK::ASPECT_RATIO) {
                copy_range!(146, 150); // ASPECT_RATIO (f32)
            }
            if is_pseudo_set!(SK::GRID_AUTO_FLOW) {
                copy_range!(150, 151); // GRID_AUTO_FLOW
            }
            if is_pseudo_set!(SK::GRID_COLUMN) {
                copy_range!(151, 161); // GRID_COLUMN_START + GRID_COLUMN_END
            }
            if is_pseudo_set!(SK::GRID_ROW) {
                copy_range!(161, 171); // GRID_ROW_START + GRID_ROW_END
            }
            if is_pseudo_set!(SK::SCROLLBAR_WIDTH) {
                copy_range!(171, 175); // SCROLLBAR_WIDTH (f32)
            }
            if is_pseudo_set!(SK::ALIGN) {
                copy_range!(175, 176); // ALIGN
            }
            if is_pseudo_set!(SK::BOX_SIZING) {
                copy_range!(176, 177); // BOX_SIZING
            }
            if is_pseudo_set!(SK::OVERFLOW) {
                copy_range!(177, 178); // OVERFLOW
            }
            if is_pseudo_set!(SK::ITEM_IS_TABLE) {
                copy_range!(178, 179);
            }
            if is_pseudo_set!(SK::ITEM_IS_REPLACED) {
                copy_range!(179, 180);
            }
            if is_pseudo_set!(SK::DISPLAY_MODE) {
                copy_range!(180, 181);
            }
            if is_pseudo_set!(SK::FORCE_INLINE) {
                copy_range!(181, 182);
            }
            if is_pseudo_set!(SK::MIN_CONTENT_WIDTH) {
                copy_range!(182, 186); // f32
            }
            if is_pseudo_set!(SK::MIN_CONTENT_HEIGHT) {
                copy_range!(186, 190); // f32
            }
            if is_pseudo_set!(SK::MAX_CONTENT_WIDTH) {
                copy_range!(190, 194); // f32
            }
            if is_pseudo_set!(SK::MAX_CONTENT_HEIGHT) {
                copy_range!(194, 198); // f32
            }

            // Float, Clear, Object Fit
            if is_pseudo_set!(SK::FLOAT) {
                copy_range!(274, 275);
            }
            if is_pseudo_set!(SK::CLEAR) {
                copy_range!(275, 276);
            }
            if is_pseudo_set!(SK::OBJECT_FIT) {
                copy_range!(276, 277);
            }

            // Z-Index
            if is_pseudo_set!(SK::Z_INDEX) {
                copy_range!(310, 314); // f32
            }

            // List style
            if is_pseudo_set!(SK::LIST_STYLE_POSITION) {
                copy_range!(316, 317);
            }
            if is_pseudo_set!(SK::LIST_STYLE_TYPE) {
                copy_range!(317, 318);
            }
        };

        // CSS specificity order: later entries override earlier ones.
        // :active overrides :focus, :focus overrides :hover.
        if let Some(p) = &self.pseudo_styles {
            if flags.contains(PseudoStates::HOVER) {
                if let Some(s) = &p.hover {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::FOCUS) {
                if let Some(s) = &p.focus {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::ACTIVE) {
                if let Some(s) = &p.active {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::DISABLED) {
                if let Some(s) = &p.disabled {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::CHECKED) {
                if let Some(s) = &p.checked {
                    merge_from(s, &mut result);
                }
            }
        }

        result
    }
}

#[derive(Debug, Clone)]
pub struct NodeRef {
    pub(crate) id: Id,
    pub(crate) guard: Arc<()>,
    pub(crate) tree: Arc<RwLock<TreeInner>>,
    pub(crate) deferred_cleanup: Arc<Mutex<Vec<Id>>>,
    pub(crate) node_data: Arc<RwLock<SecondaryMap<Id, NodeData>>>,
}

unsafe impl Send for NodeRef {}

impl NodeRef {
    pub fn id(&self) -> Id {
        self.id
    }
}

impl PartialEq for NodeRef {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

/// Drain deferred node removals. Must be called when no read/write lock
/// is held on the tree (e.g. before `compute_layout`).
pub(crate) fn drain_deferred_cleanup(
    tree: &Arc<RwLock<TreeInner>>,
    deferred: &Arc<Mutex<Vec<Id>>>,
    node_data: &Arc<RwLock<SecondaryMap<Id, NodeData>>>,
) {
    let ids: Vec<Id> = {
        let mut queue = deferred.lock();
        if queue.is_empty() {
            return;
        }
        queue.drain(..).collect()
    };
    let mut tree = tree.write();
    let mut nd = node_data.write();
    for id in ids {
        let has_parent = tree.parents.get(id).map(|p| p.is_some()).unwrap_or(false);
        let has_children = tree
            .children
            .get(id)
            .map(|children| !children.is_empty())
            .unwrap_or(false);
        if !has_parent && !has_children {
            if let Some(node) = tree.nodes.remove(id) {
                let _ = id;
                tree.style_arena.release(node.style.handle);
            }
            nd.remove(id);
        }
    }
}

impl Drop for NodeRef {
    fn drop(&mut self) {
        // 2 = this ref + default ref
        if Arc::strong_count(&self.guard) == 2 {
            // Try non-blocking write lock first to avoid deadlocking with
            // concurrent read locks held by the layout algorithm.
            if let Some(mut tree) = self.tree.try_write() {
                let has_parent = tree
                    .parents
                    .get(self.id)
                    .map(|p| p.is_some())
                    .unwrap_or(false);
                let has_children = tree
                    .children
                    .get(self.id)
                    .map(|children| !children.is_empty())
                    .unwrap_or(false);
                if !has_parent && !has_children {
                    if let Some(node) = tree.nodes.remove(self.id) {
                            let _ = self.id;
                            tree.style_arena.release(node.style.handle);
                    }
                    if let Some(mut nd) = self.node_data.try_write() {
                        nd.remove(self.id);
                    }
                }
            } else {
                // Lock is contended — defer cleanup to avoid deadlock.
                    self.deferred_cleanup.lock().push(self.id);
            }
        }
    }
}
