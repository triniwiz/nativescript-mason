
use crate::style::{Style, StyleKeys};
use crate::tree::Id;
use crate::MeasureOutput;
use std::rc::Rc;
use taffy::{AvailableSpace, Cache, ClearState, Layout, Size};

#[cfg(target_os = "android")]
use crate::JVM;

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
                let result = env.call_method(
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
                );

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

#[derive(Debug)]
pub struct NodeData {
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
    >
}

impl NodeData {
    #[cfg(target_os = "android")]
    pub(crate) fn new() -> Self {
        unsafe {
            Self {
                measure: None,
            }
        }
    }

    #[cfg(not(target_os = "android"))]
    pub(crate) fn new() -> Self {
        unsafe {
            Self {
                data: 0 as _,
                measure: None,
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
                let result = env.call_method(
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
                );

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
            measure: self.measure.clone(),
        }
    }
}

impl Default for NodeData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone)]
pub struct Node {
    pub(crate) style: Style,
    pub(crate) cache: Cache,
    pub(crate) unrounded_layout: Layout,
    pub(crate) final_layout: Layout,
    pub(crate) guard: Rc<()>,
    pub(crate) has_measure: bool,
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
        }
    }

    pub fn mark_dirty(&mut self) -> ClearState {
        self.cache.clear()
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
