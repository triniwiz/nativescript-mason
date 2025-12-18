use crate::style::Style;
use crate::tree::Id;
use crate::MeasureOutput;

#[cfg(target_vendor = "apple")]
use objc2::runtime::NSObject;

use std::rc::Rc;
use taffy::{AvailableSpace, Cache, ClearState, Layout, Size};

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
#[derive(Debug, Clone)]
pub struct AndroidNode(pub(crate) jni::objects::GlobalRef);

#[cfg(target_os = "android")]
impl AndroidNode {
    pub fn set_computed_size(&mut self, width: f32, height: f32) {
        if let Some(jvm) = crate::JVM.get() {
            let vm = jvm.attach_current_thread();
            let mut env = vm.unwrap();
            match crate::JVM_CACHE.get() {
                Some(cache) => unsafe {
                    _ = env.call_method_unchecked(
                        self.0.as_obj(),
                        cache.node_set_computed_size_id,
                        jni::signature::ReturnType::Primitive(jni::signature::Primitive::Void),
                        &[
                            jni::sys::jvalue { f: width },
                            jni::sys::jvalue { f: height },
                        ],
                    );
                },
                _ => {
                    _ = env.call_method(
                        self.0.as_obj(),
                        "setComputedSize",
                        "(FF)V",
                        &[
                            jni::objects::JValue::from(width),
                            jni::objects::JValue::from(height),
                        ],
                    );
                }
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
    pub(crate) measure: Option<jni::objects::GlobalRef>,
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
        match (self.measure.as_ref(), crate::JVM.get()) {
            (Some(measure), Some(jvm)) => {
                let vm = jvm.attach_current_thread();
                let mut env = vm.unwrap();

                let result = match crate::JVM_CACHE.get() {
                    Some(cache) => unsafe {
                        env.call_method_unchecked(
                            measure.as_obj(),
                            cache.measure_measure_id,
                            jni::signature::ReturnType::Primitive(jni::signature::Primitive::Long),
                            &[
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
                    },
                    _ => env.call_method(
                        measure.as_obj(),
                        "measure",
                        "(JJ)J",
                        &[
                            jni::objects::JValue::from(MeasureOutput::make(
                                known_dimensions.width.unwrap_or(f32::NAN),
                                known_dimensions.height.unwrap_or(f32::NAN),
                            )),
                            jni::objects::JValue::from(MeasureOutput::make(
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
                            )),
                        ],
                    ),
                };

                match result {
                    Ok(result) => {
                        let size = result.j().unwrap_or_default();
                        let width = MeasureOutput::get_width(size);
                        let height = MeasureOutput::get_height(size);

                        Size { width, height }
                    }
                    Err(_) => known_dimensions.map(|v| v.unwrap_or(0.0)),
                }
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
}

#[derive(Debug)]
pub struct NodeData {
    pub(crate) inline_segments: Vec<InlineSegment>,
    #[cfg(not(target_os = "android"))]
    pub(crate) data: *mut std::os::raw::c_void,
    #[cfg(target_vendor = "apple")]
    pub apple_data: Option<AppleNode>,
    #[cfg(target_os = "android")]
    pub android_data: Option<AndroidNode>,
    #[cfg(target_os = "android")]
    pub(crate) measure: Option<jni::objects::GlobalRef>,
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
    pub fn inline_segments(&self) -> &[InlineSegment] {
        self.inline_segments.as_slice()
    }

    pub fn set_inline_segments(&mut self, segments: Vec<InlineSegment>) {
        self.inline_segments = segments;
    }

    #[cfg(target_os = "android")]
    pub(crate) fn new() -> Self {
        unsafe {
            Self {
                measure: None,
                android_data: None,
                inline_segments: vec![],
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
                inline_segments: vec![],
            }
        }
    }

    #[cfg(target_os = "android")]
    pub fn measure(
        &self,
        known_dimensions: taffy::Size<Option<f32>>,
        available_space: taffy::Size<AvailableSpace>,
    ) -> taffy::geometry::Size<f32> {
        match (self.measure.as_ref(), crate::JVM.get()) {
            (Some(measure), Some(jvm)) => {
                let vm = jvm.attach_current_thread();
                let mut env = vm.unwrap();
                let result = match crate::JVM_CACHE.get() {
                    Some(cache) => unsafe {
                        env.call_method_unchecked(
                            measure.as_obj(),
                            cache.measure_measure_id,
                            jni::signature::ReturnType::Primitive(jni::signature::Primitive::Long),
                            &[
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
                    },
                    _ => env.call_method(
                        measure.as_obj(),
                        "measure",
                        "(JJ)J",
                        &[
                            jni::objects::JValue::from(MeasureOutput::make(
                                known_dimensions.width.unwrap_or(f32::NAN),
                                known_dimensions.height.unwrap_or(f32::NAN),
                            )),
                            jni::objects::JValue::from(MeasureOutput::make(
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
                            )),
                        ],
                    ),
                };
                match result {
                    Ok(result) => {
                        let size = result.j().unwrap_or_default();
                        let width = MeasureOutput::get_width(size);
                        let height = MeasureOutput::get_height(size);

                        Size { width, height }
                    }
                    Err(_) => known_dimensions.map(|v| v.unwrap_or(0.0)),
                }
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
            measure: self.measure.clone(),
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
}
#[derive(Debug, Clone)]
pub struct Node {
    pub(crate) style: Style,
    pub(crate) cache: Cache,
    pub(crate) unrounded_layout: Layout,
    pub(crate) final_layout: Layout,
    pub(crate) guard: Rc<()>,
    pub(crate) has_measure: bool,
    pub(crate) type_: NodeType,
    pub(crate) is_anonymous: bool,
    // pub(crate) pseudo_states: PseudoStates,
    // pub(crate) pseudo_styles: PseudoStyles
}

impl Node {
    pub fn new() -> Self {
        Self {
            style: Style::default(),
            cache: Default::default(),
            unrounded_layout: Default::default(),
            final_layout: Default::default(),
            guard: Default::default(),
            has_measure: false,
            type_: NodeType::Normal,
            is_anonymous: false,
        }
    }

    pub fn mark_dirty(&mut self) -> ClearState {
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

    pub fn compute_style(&self) -> Style {
        let mut result = self.style.clone();
        if self.is_text_container() && result.is_inline() {
            result.set_size(Size::auto());
        }

        // let flags = node.pseudo_flags;
        //
        // if flags.contains(PseudoStateFlags::HOVER) {
        //     if let Some(s) = &node.pseudo_styles.hover {
        //         result.merge(s);
        //     }
        // }
        //
        // if flags.contains(PseudoStateFlags::ACTIVE) {
        //     if let Some(s) = &node.pseudo_styles.active {
        //         result.merge(s);
        //     }
        // }
        //
        // if flags.contains(PseudoStateFlags::FOCUS) {
        //     if let Some(s) = &node.pseudo_styles.focus {
        //         result.merge(s);
        //     }
        // }
        //
        // if flags.contains(PseudoStateFlags::DISABLED) {
        //     if let Some(s) = &node.pseudo_styles.disabled {
        //         result.merge(s);
        //     }
        // }
        //
        // if flags.contains(PseudoStateFlags::CHECKED) {
        //     if let Some(s) = &node.pseudo_styles.checked {
        //         result.merge(s);
        //     }
        // }

        result
    }
}

#[derive(Debug, Clone)]
pub struct NodeRef {
    pub(crate) id: Id,
    pub(crate) guard: Rc<()>,
}

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
