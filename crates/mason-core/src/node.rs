use crate::style::Style;
use crate::tree::{Id, TreeInner};
use crate::MeasureOutput;
use std::fmt::Debug;

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
        unsafe { objc2::rc::Retained::from_raw(ptr).map(|n| AppleNode(n)) }
    }
    pub fn set_computed_size(&mut self, width: f64, height: f64) {
        let _: () = unsafe { objc2::msg_send![&self.0, setComputedSize: width height: height] };
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
                let node = unsafe { jni::objects::JClass::from_raw(cache.node_clazz.as_raw()) };
                let _ = unsafe {
                    env.call_static_method_unchecked(
                        node,
                        cache.node_set_computed_size_id,
                        jni::signature::ReturnType::Primitive(jni::signature::Primitive::Void),
                        &[
                            jni::sys::jvalue { i: self.0 },
                            jni::sys::jvalue { f: width },
                            jni::sys::jvalue { f: height },
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
                    let result = unsafe {
                        env.call_static_method_unchecked(
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
                        )
                    };

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

        let mut merge_from = |src: &crate::style::Style, dst: &mut crate::style::Style| {
            // prepare dst for mutation
            dst.prepare_mut();
            // Background color (i32) if set in src
            if get_style_data_u8(src.data(), crate::style::StyleKeys::BACKGROUND_COLOR_STATE) != 0 {
                let v = get_style_data_i32(src.data(), crate::style::StyleKeys::BACKGROUND_COLOR);
                set_style_data_i32(dst.data_mut(), crate::style::StyleKeys::BACKGROUND_COLOR, v);
                set_style_data_u8(dst.data_mut(), crate::style::StyleKeys::BACKGROUND_COLOR_STATE, 1);
            }
            // Font color (u32)
            if get_style_data_u8(src.data(), crate::style::StyleKeys::FONT_COLOR_STATE) != 0 {
                let v = get_style_data_u32(src.data(), crate::style::StyleKeys::FONT_COLOR);
                set_style_data_u32(dst.data_mut(), crate::style::StyleKeys::FONT_COLOR, v);
                set_style_data_u8(dst.data_mut(), crate::style::StyleKeys::FONT_COLOR_STATE, 1);
            }
            // Font size (i32)
            if get_style_data_u8(src.data(), crate::style::StyleKeys::FONT_SIZE_STATE) != 0 {
                let v = get_style_data_i32(src.data(), crate::style::StyleKeys::FONT_SIZE);
                set_style_data_i32(dst.data_mut(), crate::style::StyleKeys::FONT_SIZE, v);
                set_style_data_u8(dst.data_mut(), crate::style::StyleKeys::FONT_SIZE_STATE, 1);
            }
            // Font weight (i32)
            if get_style_data_u8(src.data(), crate::style::StyleKeys::FONT_WEIGHT_STATE) != 0 {
                let v = get_style_data_i32(src.data(), crate::style::StyleKeys::FONT_WEIGHT);
                set_style_data_i32(dst.data_mut(), crate::style::StyleKeys::FONT_WEIGHT, v);
                set_style_data_u8(dst.data_mut(), crate::style::StyleKeys::FONT_WEIGHT_STATE, 1);
            }
            // Text align (u8)
            if get_style_data_u8(src.data(), crate::style::StyleKeys::TEXT_ALIGN_STATE) != 0 {
                let v = get_style_data_i8_raw(src.data(), crate::style::StyleKeys::TEXT_ALIGN as usize);
                set_style_data_i8_raw(dst.data_mut(), crate::style::StyleKeys::TEXT_ALIGN as usize, v);
                set_style_data_u8(dst.data_mut(), crate::style::StyleKeys::TEXT_ALIGN_STATE, 1);
            }
        };

        if let Some(p) = &self.pseudo_styles {
            if flags.contains(PseudoStates::HOVER) {
                if let Some(s) = &p.hover {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::ACTIVE) {
                if let Some(s) = &p.active {
                    merge_from(s, &mut result);
                }
            }
            if flags.contains(PseudoStates::FOCUS) {
                if let Some(s) = &p.focus {
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
