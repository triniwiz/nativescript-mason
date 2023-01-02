extern crate core;

use std::ffi::c_void;

use jni::JavaVM;
use jni::JNIEnv;
use jni::objects::{GlobalRef, JClass, JMethodID, JObject};
use jni::sys::{jint, jlong};
use once_cell::sync::OnceCell;

use ffi::AvailableSpace;
use ffi::CMasonDimension;
use ffi::CMasonDimensionRect;
use ffi::CMasonDimensionSize;
use ffi::CMasonDimensionType;
use ffi::CMasonGridPlacement;
use ffi::CMasonGridPlacementType;
use ffi::CMasonLengthPercentage;
use ffi::CMasonLengthPercentageAuto;
use ffi::CMasonLengthPercentageAutoRect;
use ffi::CMasonLengthPercentageAutoSize;
use ffi::CMasonLengthPercentageAutoType;
use ffi::CMasonLengthPercentageRect;
use ffi::CMasonLengthPercentageSize;
use ffi::CMasonLengthPercentageType;
use ffi::CMasonMinMax;
use mason_core::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, auto, display_from_enum, display_to_enum,
    fit_content, flex, flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum,
    flex_wrap_to_enum, grid_auto_flow_from_enum, grid_auto_flow_to_enum, GridPlacement,
    GridTrackRepetition, justify_content_from_enum, justify_content_to_enum, Mason, max_content, MaxTrackSizingFunction,
    min_content, MinTrackSizingFunction, Node, NonRepeatedTrackSizingFunction, percent,
    points, position_from_enum, position_to_enum, Size, TaffyAuto,
    TrackSizingFunction,
};
use mason_core::{Dimension, LengthPercentage, LengthPercentageAuto, Rect};
use mason_core::style::{min_max_from_values, Style};

use crate::ffi::AvailableSpaceType;

mod node;
pub mod style;

#[derive(Clone)]
pub struct MinMaxCacheItem {
    clazz: GlobalRef,
    min_type_id: JMethodID,
    min_value_id: JMethodID,
    max_type_id: JMethodID,
    max_value_id: JMethodID,
}

impl MinMaxCacheItem {
    pub fn new(
        clazz: GlobalRef,
        min_type_id: JMethodID,
        min_value_id: JMethodID,
        max_type_id: JMethodID,
        max_value_id: JMethodID,
    ) -> Self {
        Self {
            clazz,
            min_type_id,
            min_value_id,
            max_type_id,
            max_value_id,
        }
    }

    pub fn clazz(&self) -> JClass {
        JClass::from(self.clazz.as_obj())
    }
}

const MIN_MAX_CLASS: &str = "org/nativescript/mason/masonkit/MinMax";

#[derive(Clone)]
pub struct TrackSizingFunctionCacheItem {
    clazz: GlobalRef,
    single_clazz: GlobalRef,
    auto_repeat_clazz: GlobalRef,
    is_repeating: JMethodID,
    single_value_id: JMethodID,
    auto_repeat_value_id: JMethodID,
    auto_repeat_grid_track_repetition_id: JMethodID,
}

impl TrackSizingFunctionCacheItem {
    pub fn new(
        clazz: GlobalRef,
        single_clazz: GlobalRef,
        auto_repeat_clazz: GlobalRef,
        is_repeating: JMethodID,
        single_value_id: JMethodID,
        auto_repeat_value_id: JMethodID,
        auto_repeat_grid_track_repetition_id: JMethodID,
    ) -> Self {
        Self {
            clazz,
            single_clazz,
            auto_repeat_clazz,
            is_repeating,
            single_value_id,
            auto_repeat_value_id,
            auto_repeat_grid_track_repetition_id,
        }
    }

    pub fn clazz(&self) -> JClass {
        JClass::from(self.clazz.as_obj())
    }

    pub fn single_clazz(&self) -> JClass {
        JClass::from(self.single_clazz.as_obj())
    }

    pub fn auto_repeat(&self) -> JClass {
        JClass::from(self.auto_repeat_clazz.as_obj())
    }
}

const TRACK_SIZING_FUNCTION_CLASS: &str = "org/nativescript/mason/masonkit/TrackSizingFunction";
const TRACK_SIZING_FUNCTION_SINGLE_CLASS: &str =
    "org/nativescript/mason/masonkit/TrackSizingFunction$Single";
const TRACK_SIZING_FUNCTION_AUTO_REPEAT_CLASS: &str =
    "org/nativescript/mason/masonkit/TrackSizingFunction$AutoRepeat";


pub static MIN_MAX: OnceCell<MinMaxCacheItem> = OnceCell::new();

pub static TRACK_SIZING_FUNCTION: OnceCell<TrackSizingFunctionCacheItem> = OnceCell::new();

#[derive(Copy, Clone, PartialEq, Debug)]
pub struct CMasonNonRepeatedTrackSizingFunction(NonRepeatedTrackSizingFunction);

#[derive(Clone, PartialEq, Debug)]
pub struct CMasonTrackSizingFunction(TrackSizingFunction);

#[no_mangle]
pub extern "system" fn JNI_OnLoad(vm: JavaVM, _reserved: *const c_void) -> jint {
    {
        android_logger::init_once(
            android_logger::Config::default().with_min_level(log::Level::Debug),
        );

        if let Ok(env) = vm.get_env() {
            let clazz = env.find_class(MIN_MAX_CLASS).unwrap();

            let min_type = env.get_method_id(clazz, "getMinType", "()I").unwrap();
            let min_value = env.get_method_id(clazz, "getMinValue", "()F").unwrap();

            let max_type = env.get_method_id(clazz, "getMaxType", "()I").unwrap();
            let max_value = env.get_method_id(clazz, "getMaxValue", "()F").unwrap();

            MIN_MAX.get_or_init(|| {
                MinMaxCacheItem::new(
                    env.new_global_ref(clazz).unwrap(),
                    min_type,
                    min_value,
                    max_type,
                    max_value,
                )
            });

            let track_sizing_function_clazz = env.find_class(TRACK_SIZING_FUNCTION_CLASS).unwrap();
            let track_sizing_function_single_clazz =
                env.find_class(TRACK_SIZING_FUNCTION_SINGLE_CLASS).unwrap();
            let track_sizing_function_auto_repeat_clazz = env
                .find_class(TRACK_SIZING_FUNCTION_AUTO_REPEAT_CLASS)
                .unwrap();

            let is_repeating = env
                .get_method_id(track_sizing_function_clazz, "isRepeating", "()Z")
                .unwrap();

            let single_value = env
                .get_method_id(
                    track_sizing_function_single_clazz,
                    "getValue",
                    "()Lorg/nativescript/mason/masonkit/MinMax;",
                )
                .unwrap();

            let auto_repeat_value = env
                .get_method_id(
                    track_sizing_function_auto_repeat_clazz,
                    "getValue",
                    "()[Lorg/nativescript/mason/masonkit/MinMax;",
                )
                .unwrap();

            let auto_repeat_grid_track_repetition = env
                .get_method_id(
                    track_sizing_function_auto_repeat_clazz,
                    "gridTrackRepetitionNativeValue",
                    "()I",
                )
                .unwrap();

            TRACK_SIZING_FUNCTION.get_or_init(|| {
                TrackSizingFunctionCacheItem::new(
                    env.new_global_ref(track_sizing_function_clazz).unwrap(),
                    env.new_global_ref(track_sizing_function_single_clazz)
                        .unwrap(),
                    env.new_global_ref(track_sizing_function_auto_repeat_clazz)
                        .unwrap(),
                    is_repeating,
                    single_value,
                    auto_repeat_value,
                    auto_repeat_grid_track_repetition,
                )
            });
        }

        log::info!("Mason library loaded");
    }

    jni::sys::JNI_VERSION_1_6
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInit(
    _: JNIEnv,
    _: JObject,
) -> jlong {
    Mason::new().into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInitWithCapacity(
    _: JNIEnv,
    _: JObject,
    capacity: jint,
) -> jlong {
    Mason::with_capacity(capacity as usize).into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClear(
    _: JNIEnv,
    _: JObject,
    taffy: jlong,
) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let mut mason = Box::from_raw(taffy as *mut Mason);
        mason.clear();
        Box::leak(mason);
    }
}

fn mason_util_create_non_repeated_track_sizing_function_with_type_value(
    track_type: i32,
    track_value_type: i32,
    track_value: f32,
    index: isize,
    store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
) {
    let value = CMasonNonRepeatedTrackSizingFunction(match track_type {
        0 => auto(),
        1 => min_content(),
        2 => max_content(),
        3 => fit_content(match track_value_type {
            0 => LengthPercentage::Points(track_value),
            1 => LengthPercentage::Points(track_value),
            _ => panic!(),
        }),
        4 => flex(track_value),
        5 => points(track_value),
        6 => percent(track_value),
        _ => panic!(),
    });

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

fn mason_util_create_non_repeated_track_sizing_function(
    min_max: CMasonMinMax,
    index: isize,
    store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
) {
    let value = CMasonNonRepeatedTrackSizingFunction(min_max_from_values(
        min_max.min_type,
        min_max.min_value,
        min_max.max_type,
        min_max.max_value,
    ));
    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

fn mason_util_create_single_track_sizing_function(
    min_max: CMasonMinMax,
    index: isize,
    store: &mut Vec<CMasonTrackSizingFunction>,
) {
    let value = CMasonTrackSizingFunction(TrackSizingFunction::Single(min_max_from_values(
        min_max.min_type,
        min_max.min_value,
        min_max.max_type,
        min_max.max_value,
    )));

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

fn mason_util_create_auto_repeating_track_sizing_function(
    grid_track_repetition: i32,
    values: Vec<CMasonMinMax>,
    index: isize,
    store: &mut Vec<CMasonTrackSizingFunction>,
) {
    let value = CMasonTrackSizingFunction(TrackSizingFunction::AutoRepeat(
        match grid_track_repetition {
            0 => GridTrackRepetition::AutoFill,
            1 => GridTrackRepetition::AutoFit,
            _ => panic!(),
        },
        values
            .into_iter()
            .map(|min_max| {
                min_max_from_values(
                    min_max.min_type,
                    min_max.min_value,
                    min_max.max_type,
                    min_max.max_value,
                )
            })
            .collect(),
    ));

    if index < 0 {
        store.push(value);
    } else {
        store[index as usize] = value;
    }
}

#[cxx::bridge]
pub(crate) mod ffi {

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonMinMax {
        pub min_type: i32,
        pub min_value: f32,
        pub max_type: i32,
        pub max_value: f32,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum AvailableSpaceType {
        Definite,
        MinContent,
        MaxContent,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct AvailableSpace {
        pub(crate) value: f32,
        pub(crate) space_type: AvailableSpaceType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum CMasonDimensionType {
        Points,
        Percent,
        Auto,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonDimension {
        pub value: f32,
        pub value_type: CMasonDimensionType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonDimensionRect {
        pub left: CMasonDimension,
        pub right: CMasonDimension,
        pub top: CMasonDimension,
        pub bottom: CMasonDimension,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonDimensionSize {
        pub width: CMasonDimension,
        pub height: CMasonDimension,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum CMasonLengthPercentageAutoType {
        Points,
        Percent,
        Auto,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentageAuto {
        pub value: f32,
        pub value_type: CMasonLengthPercentageAutoType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentageAutoRect {
        pub left: CMasonLengthPercentageAuto,
        pub right: CMasonLengthPercentageAuto,
        pub top: CMasonLengthPercentageAuto,
        pub bottom: CMasonLengthPercentageAuto,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentageAutoSize {
        pub width: CMasonLengthPercentageAuto,
        pub height: CMasonLengthPercentageAuto,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum CMasonLengthPercentageType {
        Points,
        Percent,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentage {
        pub value: f32,
        pub value_type: CMasonLengthPercentageType,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentageRect {
        pub left: CMasonLengthPercentage,
        pub right: CMasonLengthPercentage,
        pub top: CMasonLengthPercentage,
        pub bottom: CMasonLengthPercentage,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonLengthPercentageSize {
        pub width: CMasonLengthPercentage,
        pub height: CMasonLengthPercentage,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub enum CMasonGridPlacementType {
        Auto,
        Line,
        Span,
    }

    #[derive(Copy, Clone, PartialEq, Debug)]
    pub struct CMasonGridPlacement {
        pub value: i16,
        pub value_type: CMasonGridPlacementType,
    }

    extern "Rust" {

        type CMasonNonRepeatedTrackSizingFunction;

        type CMasonTrackSizingFunction;

        fn mason_util_parse_non_repeated_track_sizing_function_value(
            value: &Vec<CMasonNonRepeatedTrackSizingFunction>,
        ) -> String;

        fn mason_util_parse_auto_repeating_track_sizing_function(
            value: &Vec<CMasonTrackSizingFunction>,
        ) -> String;

        fn mason_util_create_non_repeated_track_sizing_function(
            min_max: CMasonMinMax,
            index: isize,
            store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
        );

        fn mason_util_create_non_repeated_track_sizing_function_with_type_value(
            track_type: i32,
            track_value_type: i32,
            track_value: f32,
            index: isize,
            store: &mut Vec<CMasonNonRepeatedTrackSizingFunction>,
        );

        fn mason_util_create_single_track_sizing_function(
            min_max: CMasonMinMax,
            index: isize,
            store: &mut Vec<CMasonTrackSizingFunction>,
        );

        fn mason_util_create_auto_repeating_track_sizing_function(
            grid_track_repetition: i32,
            values: Vec<CMasonMinMax>,
            index: isize,
            store: &mut Vec<CMasonTrackSizingFunction>,
        );

        fn mason_style_set_display(style: i64, display: i32);

        fn mason_style_get_display(style: i64) -> i32;

        fn mason_style_set_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_width(style: i64) -> CMasonDimension;

        fn mason_style_set_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_height(style: i64) -> CMasonDimension;

        fn mason_node_compute(mason: i64, node: i64);

        fn mason_node_compute_min_content(mason: i64, node: i64);

        fn mason_node_compute_max_content(mason: i64, node: i64);

        fn mason_node_compute_wh(mason: i64, node: i64, width: f32, height: f32);

        fn mason_node_mark_dirty(mason: i64, node: i64);

        fn mason_node_dirty(mason: i64, node: i64) -> bool;

        fn mason_style_get_position(style: i64) -> i32;

        fn mason_style_set_position(style: i64, value: i32);

        fn mason_style_get_flex_wrap(style: i64) -> i32;

        fn mason_style_set_flex_wrap(style: i64, value: i32);

        fn mason_style_get_align_items(style: i64) -> i32;

        fn mason_style_set_align_items(style: i64, value: i32);

        fn mason_style_get_align_self(style: i64) -> i32;

        fn mason_style_set_align_self(style: i64, value: i32);

        fn mason_style_get_align_content(style: i64) -> i32;

        fn mason_style_set_align_content(style: i64, value: i32);

        fn mason_style_get_justify_content(style: i64) -> i32;

        fn mason_style_set_justify_content(style: i64, value: i32);

        fn mason_style_set_inset(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_inset_left(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_inset_left(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_inset_right(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_inset_right(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_inset_top(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_inset_top(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_inset_bottom(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_inset_bottom(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_set_margin(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_margin_left(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_margin_left(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_margin_right(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_margin_right(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_margin_top(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_margin_top(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_get_margin_bottom(style: i64) -> CMasonLengthPercentageAuto;

        fn mason_style_set_margin_bottom(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageAutoType,
        );

        fn mason_style_set_border(style: i64, value: f32, value_type: CMasonLengthPercentageType);

        fn mason_style_get_border_left(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_border_left(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_border_right(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_border_right(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_border_top(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_border_top(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_border_bottom(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_border_bottom(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_set_flex_grow(style: i64, grow: f32);

        fn mason_style_get_flex_grow(style: i64) -> f32;

        fn mason_style_set_flex_shrink(style: i64, shrink: f32);

        fn mason_style_get_flex_shrink(style: i64) -> f32;

        fn mason_style_get_flex_basis(style: i64) -> CMasonDimension;

        fn mason_style_set_flex_basis(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_gap(style: i64) -> CMasonLengthPercentageSize;

        fn mason_style_set_gap(
            style: i64,
            width_value: f32,
            width_type: CMasonLengthPercentageType,
            height_value: f32,
            height_type: CMasonLengthPercentageType,
        );

        fn mason_style_set_aspect_ratio(style: i64, ratio: f32);

        fn mason_style_get_aspect_ratio(style: i64) -> f32;

        fn mason_style_set_padding(style: i64, value: f32, value_type: CMasonLengthPercentageType);

        fn mason_style_get_padding_left(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_padding_left(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_padding_right(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_padding_right(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_padding_top(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_padding_top(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_padding_bottom(style: i64) -> CMasonLengthPercentage;

        fn mason_style_set_padding_bottom(
            style: i64,
            value: f32,
            value_type: CMasonLengthPercentageType,
        );

        fn mason_style_get_flex_direction(style: i64) -> i32;

        fn mason_style_set_flex_direction(style: i64, value: i32);

        fn mason_style_get_min_width(style: i64) -> CMasonDimension;

        fn mason_style_set_min_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_min_height(style: i64) -> CMasonDimension;

        fn mason_style_set_min_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_max_width(style: i64) -> CMasonDimension;

        fn mason_style_set_max_width(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_style_get_max_height(style: i64) -> CMasonDimension;

        fn mason_style_set_max_height(style: i64, value: f32, value_type: CMasonDimensionType);

        fn mason_node_update_and_set_style(mason: i64, node: i64, style: i64);

        fn mason_style_get_grid_auto_rows(style: i64) -> Vec<CMasonNonRepeatedTrackSizingFunction>;

        fn mason_style_set_grid_auto_rows(
            style: i64,
            value: Vec<CMasonNonRepeatedTrackSizingFunction>,
        );

        fn mason_style_get_grid_auto_columns(
            style: i64,
        ) -> Vec<CMasonNonRepeatedTrackSizingFunction>;

        fn mason_style_set_grid_auto_columns(
            style: i64,
            value: Vec<CMasonNonRepeatedTrackSizingFunction>,
        );

        fn mason_style_get_grid_auto_flow(style: i64) -> i32;

        fn mason_style_set_grid_auto_flow(style: i64, value: i32);

        fn mason_style_get_grid_column_start(style: i64) -> CMasonGridPlacement;

        fn mason_style_set_grid_column_start(style: i64, value: CMasonGridPlacement);

        fn mason_style_get_grid_column_end(style: i64) -> CMasonGridPlacement;

        fn mason_style_set_grid_column_end(style: i64, value: CMasonGridPlacement);

        fn mason_style_get_grid_row_start(style: i64) -> CMasonGridPlacement;

        fn mason_style_set_grid_row_start(style: i64, value: CMasonGridPlacement);

        fn mason_style_get_grid_row_end(style: i64) -> CMasonGridPlacement;

        fn mason_style_set_grid_row_end(style: i64, value: CMasonGridPlacement);

        fn mason_style_get_grid_template_rows(style: i64) -> Vec<CMasonTrackSizingFunction>;

        fn mason_style_set_grid_template_rows(style: i64, value: Vec<CMasonTrackSizingFunction>);

        fn mason_style_get_grid_template_columns(style: i64) -> Vec<CMasonTrackSizingFunction>;

        fn mason_style_set_grid_template_columns(style: i64, value: Vec<CMasonTrackSizingFunction>);

        #[allow(clippy::too_many_arguments)]
        fn mason_style_update_with_values(
            style: i64,
            display: i32,
            position: i32,
            direction: i32,
            flex_direction: i32,
            flex_wrap: i32,
            overflow: i32,
            align_items: i32,
            align_self: i32,
            align_content: i32,
            justify_items: i32,
            justify_self: i32,
            justify_content: i32,
            inset_left_type: i32,
            inset_left_value: f32,
            inset_right_type: i32,
            inset_right_value: f32,
            inset_top_type: i32,
            inset_top_value: f32,
            inset_bottom_type: i32,
            inset_bottom_value: f32,
            margin_left_type: i32,
            margin_left_value: f32,
            margin_right_type: i32,
            margin_right_value: f32,
            margin_top_type: i32,
            margin_top_value: f32,
            margin_bottom_type: i32,
            margin_bottom_value: f32,
            padding_left_type: i32,
            padding_left_value: f32,
            padding_right_type: i32,
            padding_right_value: f32,
            padding_top_type: i32,
            padding_top_value: f32,
            padding_bottom_type: i32,
            padding_bottom_value: f32,
            border_left_type: i32,
            border_left_value: f32,
            border_right_type: i32,
            border_right_value: f32,
            border_top_type: i32,
            border_top_value: f32,
            border_bottom_type: i32,
            border_bottom_value: f32,
            flex_grow: f32,
            flex_shrink: f32,
            flex_basis_type: i32,
            flex_basis_value: f32,
            width_type: i32,
            width_value: f32,
            height_type: i32,
            height_value: f32,
            min_width_type: i32,
            min_width_value: f32,
            min_height_type: i32,
            min_height_value: f32,
            max_width_type: i32,
            max_width_value: f32,
            max_height_type: i32,
            max_height_value: f32,
            gap_row_type: i32,
            gap_row_value: f32,
            gap_column_type: i32,
            gap_column_value: f32,
            aspect_ratio: f32,
            mut grid_auto_rows: Vec<CMasonNonRepeatedTrackSizingFunction>,
            mut grid_auto_columns: Vec<CMasonNonRepeatedTrackSizingFunction>,
            grid_auto_flow: i32,
            grid_column_start_type: i32,
            grid_column_start_value: i16,
            grid_column_end_type: i32,
            grid_column_end_value: i16,
            grid_row_start_type: i32,
            grid_row_start_value: i16,
            grid_row_end_type: i32,
            grid_row_end_value: i16,
            mut grid_template_rows: Vec<CMasonTrackSizingFunction>,
            mut grid_template_columns: Vec<CMasonTrackSizingFunction>,
        );
    }
}

impl CMasonMinMax {
    pub fn new(min_type: i32, min_value: f32, max_type: i32, max_value: f32) -> Self {
        Self {
            min_type,
            min_value,
            max_type,
            max_value,
        }
    }
}

impl CMasonDimensionSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonDimensionType,
        height_value: f32,
        height_type: CMasonDimensionType,
    ) -> Self {
        Self {
            width: CMasonDimension::new(width_value, width_type),
            height: CMasonDimension::new(height_value, height_type),
        }
    }

    pub fn auto() -> Self {
        Self {
            width: CMasonDimension::auto(),
            height: CMasonDimension::auto(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<mason_core::AvailableSpace> for AvailableSpace {
    fn into(self) -> mason_core::AvailableSpace {
        match self.space_type {
            AvailableSpaceType::Definite => mason_core::AvailableSpace::Definite(self.value),
            AvailableSpaceType::MinContent => mason_core::AvailableSpace::MinContent,
            AvailableSpaceType::MaxContent => mason_core::AvailableSpace::MaxContent,

            // making cpp happy
            _ => mason_core::AvailableSpace::MinContent,
        }
    }
}

impl CMasonDimension {
    pub fn new(value: f32, value_type: CMasonDimensionType) -> Self {
        Self { value, value_type }
    }

    pub fn auto() -> Self {
        Self {
            value: 0.,
            value_type: CMasonDimensionType::Auto,
        }
    }
}

impl From<Dimension> for CMasonDimension {
    fn from(dimension: Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Points(points) => CMasonDimension::new(points, CMasonDimensionType::Points),
            Dimension::Percent(percent) => {
                CMasonDimension::new(percent, CMasonDimensionType::Percent)
            }
        }
    }
}

impl From<&Dimension> for CMasonDimension {
    fn from(dimension: &Dimension) -> Self {
        match dimension {
            Dimension::Auto => CMasonDimension::auto(),
            Dimension::Points(points) => CMasonDimension::new(*points, CMasonDimensionType::Points),
            Dimension::Percent(percent) => {
                CMasonDimension::new(*percent, CMasonDimensionType::Percent)
            }
        }
    }
}

impl From<CMasonDimension> for Dimension {
    fn from(dimension: CMasonDimension) -> Self {
        match dimension.value_type {
            CMasonDimensionType::Auto => Dimension::Auto,
            CMasonDimensionType::Points => Dimension::Points(dimension.value),
            CMasonDimensionType::Percent => Dimension::Percent(dimension.value),
            // making cpp happy
            _ => Dimension::Points(0.),
        }
    }
}

impl From<Rect<Dimension>> for CMasonDimensionRect {
    fn from(rect: Rect<Dimension>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<Dimension>> for CMasonDimensionSize {
    fn from(size: Size<Dimension>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

impl CMasonLengthPercentageAutoSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonLengthPercentageAutoType,
        height_value: f32,
        height_type: CMasonLengthPercentageAutoType,
    ) -> Self {
        Self {
            width: CMasonLengthPercentageAuto::new(width_value, width_type),
            height: CMasonLengthPercentageAuto::new(height_value, height_type),
        }
    }

    pub fn auto() -> Self {
        Self {
            width: CMasonLengthPercentageAuto::auto(),
            height: CMasonLengthPercentageAuto::auto(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<Dimension>> for CMasonDimensionSize {
    fn into(self) -> Size<Dimension> {
        Size::<Dimension>::new_with_dim(self.width.into(), self.height.into())
    }
}

impl CMasonLengthPercentageAuto {
    pub fn new(value: f32, value_type: CMasonLengthPercentageAutoType) -> Self {
        Self { value, value_type }
    }

    pub fn auto() -> Self {
        Self {
            value: 0.,
            value_type: CMasonLengthPercentageAutoType::Auto,
        }
    }
}

impl From<LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Points(points) => {
                CMasonLengthPercentageAuto::new(points, CMasonLengthPercentageAutoType::Points)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(percent, CMasonLengthPercentageAutoType::Percent)
            }
        }
    }
}

impl From<&LengthPercentageAuto> for CMasonLengthPercentageAuto {
    fn from(value: &LengthPercentageAuto) -> Self {
        match value {
            LengthPercentageAuto::Auto => CMasonLengthPercentageAuto::auto(),
            LengthPercentageAuto::Points(points) => {
                CMasonLengthPercentageAuto::new(*points, CMasonLengthPercentageAutoType::Points)
            }
            LengthPercentageAuto::Percent(percent) => {
                CMasonLengthPercentageAuto::new(*percent, CMasonLengthPercentageAutoType::Percent)
            }
        }
    }
}

impl From<CMasonLengthPercentageAuto> for LengthPercentageAuto {
    fn from(value: CMasonLengthPercentageAuto) -> Self {
        match value.value_type {
            CMasonLengthPercentageAutoType::Auto => LengthPercentageAuto::Auto,
            CMasonLengthPercentageAutoType::Points => LengthPercentageAuto::Points(value.value),
            CMasonLengthPercentageAutoType::Percent => LengthPercentageAuto::Percent(value.value),
            // making cpp happy
            _ => LengthPercentageAuto::Points(0.),
        }
    }
}

impl From<Rect<LengthPercentageAuto>> for CMasonLengthPercentageAutoRect {
    fn from(rect: Rect<LengthPercentageAuto>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn from(size: Size<LengthPercentageAuto>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentageAuto>> for CMasonLengthPercentageAutoSize {
    fn into(self) -> Size<LengthPercentageAuto> {
        Size::<LengthPercentageAuto>::new_with_len_auto(self.width.into(), self.height.into())
    }
}

impl CMasonLengthPercentageSize {
    pub fn new(
        width_value: f32,
        width_type: CMasonLengthPercentageType,
        height_value: f32,
        height_type: CMasonLengthPercentageType,
    ) -> Self {
        Self {
            width: CMasonLengthPercentage::new(width_value, width_type),
            height: CMasonLengthPercentage::new(height_value, height_type),
        }
    }
}

impl CMasonLengthPercentage {
    pub fn new(value: f32, value_type: CMasonLengthPercentageType) -> Self {
        Self { value, value_type }
    }
}

impl From<LengthPercentage> for CMasonLengthPercentage {
    fn from(value: LengthPercentage) -> Self {
        match value {
            LengthPercentage::Points(points) => {
                CMasonLengthPercentage::new(points, CMasonLengthPercentageType::Points)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(percent, CMasonLengthPercentageType::Percent)
            }
        }
    }
}

impl From<&LengthPercentage> for CMasonLengthPercentage {
    fn from(value: &LengthPercentage) -> Self {
        match value {
            LengthPercentage::Points(points) => {
                CMasonLengthPercentage::new(*points, CMasonLengthPercentageType::Points)
            }
            LengthPercentage::Percent(percent) => {
                CMasonLengthPercentage::new(*percent, CMasonLengthPercentageType::Percent)
            }
        }
    }
}

impl From<CMasonLengthPercentage> for LengthPercentage {
    fn from(value: CMasonLengthPercentage) -> Self {
        match value.value_type {
            CMasonLengthPercentageType::Points => LengthPercentage::Points(value.value),
            CMasonLengthPercentageType::Percent => LengthPercentage::Percent(value.value),
            // making cpp happy
            _ => LengthPercentage::Points(0.),
        }
    }
}

impl From<Rect<LengthPercentage>> for CMasonLengthPercentageRect {
    fn from(rect: Rect<LengthPercentage>) -> Self {
        Self {
            left: rect.left().into(),
            right: rect.right().into(),
            top: rect.top().into(),
            bottom: rect.bottom().into(),
        }
    }
}

impl From<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn from(size: Size<LengthPercentage>) -> Self {
        Self {
            width: size.width().into(),
            height: size.height().into(),
        }
    }
}

#[allow(clippy::from_over_into)]
impl Into<Size<LengthPercentage>> for CMasonLengthPercentageSize {
    fn into(self) -> Size<LengthPercentage> {
        Size::<LengthPercentage>::new_with_len(self.width.into(), self.height.into())
    }
}

impl From<GridPlacement> for CMasonGridPlacement {
    fn from(value: GridPlacement) -> Self {
        match value {
            GridPlacement::Auto => CMasonGridPlacement {
                value: 0,
                value_type: CMasonGridPlacementType::Auto,
            },
            GridPlacement::Line(value) => CMasonGridPlacement {
                value,
                value_type: CMasonGridPlacementType::Line,
            },
            GridPlacement::Span(value) => CMasonGridPlacement {
                value: value as i16,
                value_type: CMasonGridPlacementType::Span,
            },
        }
    }
}

impl Into<GridPlacement> for CMasonGridPlacement {
    fn into(self) -> GridPlacement {
        match self.value_type {
            CMasonGridPlacementType::Auto => GridPlacement::Auto,
            CMasonGridPlacementType::Line => GridPlacement::Line(self.value),
            CMasonGridPlacementType::Span => GridPlacement::Span(self.value.try_into().unwrap()),
            // making cxx happy
            _ => GridPlacement::Auto,
        }
    }
}

pub fn assert_pointer_address(pointer: i64, pointer_type: &str) {
    assert_ne!(pointer, 0, "Invalid {:} pointer address", pointer_type);
}

fn parse_non_repeated_track_sizing_function_value(value: NonRepeatedTrackSizingFunction) -> String {
    let mut string = String::new();

    match (value.min, value.max) {
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Auto) => string.push_str("auto"),
        (MinTrackSizingFunction::MinContent, MaxTrackSizingFunction::MinContent) => {
            string.push_str("min-content")
        }
        (MinTrackSizingFunction::MaxContent, MaxTrackSizingFunction::MaxContent) => {
            string.push_str("max-content")
        }
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::FitContent(value)) => string
            .push_str(&match value {
                LengthPercentage::Points(value) => format!("fit-content({}px)", value),
                LengthPercentage::Percent(value) => format!("fit-content({}%)", value),
            }),
        (MinTrackSizingFunction::Auto, MaxTrackSizingFunction::Flex(value)) => {
            string.push_str(&format!("{}fr", value))
        }
        (min, max) => {
            string.push_str(&format!(
                "minmax({}, {})",
                match min {
                    MinTrackSizingFunction::Fixed(value) => {
                        match value {
                            LengthPercentage::Points(value) => format!("{}px", value),
                            LengthPercentage::Percent(value) => format!("{}%", value),
                        }
                    }
                    MinTrackSizingFunction::MinContent => "min-content".to_string(),
                    MinTrackSizingFunction::MaxContent => "max-content".to_string(),
                    MinTrackSizingFunction::Auto => "auto".to_string(),
                },
                match max {
                    MaxTrackSizingFunction::Fixed(value) => {
                        match value {
                            LengthPercentage::Points(value) => format!("{}px", value),
                            LengthPercentage::Percent(value) => format!("{}%", value),
                        }
                    }
                    MaxTrackSizingFunction::MinContent => "min-content".to_string(),
                    MaxTrackSizingFunction::MaxContent => "max-content".to_string(),
                    MaxTrackSizingFunction::FitContent(_) => panic!(), // invalid should not hit here
                    MaxTrackSizingFunction::Auto => "auto".to_string(),
                    MaxTrackSizingFunction::Flex(value) => format!("{}px", value),
                }
            ));
        }
    }

    string
}

fn mason_util_parse_non_repeated_track_sizing_function_value(
    value: &Vec<CMasonNonRepeatedTrackSizingFunction>,
) -> String {
    let mut ret = String::new();

    for (i, val) in value.into_iter().enumerate() {
        let parsed = parse_non_repeated_track_sizing_function_value(val.0);
        if i != 0 {
            ret.push_str(" ");
        }
        ret.push_str(parsed.as_str())
    }
    ret
}

fn mason_util_parse_auto_repeating_track_sizing_function(
    value: &Vec<CMasonTrackSizingFunction>,
) -> String {
    let mut ret = String::new();
    for (i,val) in value.into_iter().enumerate() {
        if i != 0 {
            ret.push(' ');
        }
        match &val.0 {
            TrackSizingFunction::Single(value) => {
                let parsed = parse_non_repeated_track_sizing_function_value(*value);
                ret.push_str(parsed.as_str())
            }
            TrackSizingFunction::AutoRepeat(grid_track_repetition, values) => {
                ret.push_str("repeat(");
                match *grid_track_repetition  {
                    GridTrackRepetition::AutoFill => {
                        ret.push_str("auto-fill");
                    }
                    GridTrackRepetition::AutoFit => {
                        ret.push_str("auto-fit");
                    }
                }

                for (j, inner_val) in values.iter().enumerate() {
                    let parsed = parse_non_repeated_track_sizing_function_value(*inner_val);

                    if j != 0 {
                        ret.push(' ');
                    }

                    ret.push_str(parsed.as_str())
                }

                ret.push(')');
            }
        }
    }
    ret
}

fn mason_style_get_grid_auto_rows(style: i64) -> Vec<CMasonNonRepeatedTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style
            .get_grid_auto_rows()
            .to_vec()
            .into_iter()
            .map(|v| CMasonNonRepeatedTrackSizingFunction(v))
            .collect();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_auto_rows(style: i64, value: Vec<CMasonNonRepeatedTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_auto_rows(value.into_iter().map(|v| v.0).collect());

        Box::leak(style);
    }
}

fn mason_style_get_grid_auto_columns(style: i64) -> Vec<CMasonNonRepeatedTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style
            .get_grid_auto_columns()
            .to_vec()
            .into_iter()
            .map(|v| CMasonNonRepeatedTrackSizingFunction(v))
            .collect();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_auto_columns(style: i64, value: Vec<CMasonNonRepeatedTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_auto_columns(value.into_iter().map(|v| v.0).collect());

        Box::leak(style);
    }
}

fn mason_style_get_grid_auto_flow(style: i64) -> i32 {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = grid_auto_flow_to_enum(style.get_grid_auto_flow());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_auto_flow(style: i64, value: i32) {
    assert_pointer_address(style, "style");
    unsafe {
        if let Some(value) = grid_auto_flow_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_grid_auto_flow(value);

            Box::leak(style);
        }
    }
}

fn mason_style_get_grid_column_start(style: i64) -> CMasonGridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_column_start().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_column_start(style: i64, value: CMasonGridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_column_start(value.into());

        Box::leak(style);
    }
}

fn mason_style_get_grid_column_end(style: i64) -> CMasonGridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_column_end().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_column_end(style: i64, value: CMasonGridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_column_end(value.into());

        Box::leak(style);
    }
}

fn mason_style_get_grid_row_start(style: i64) -> CMasonGridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_row_start().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_row_start(style: i64, value: CMasonGridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row_start(value.into());

        Box::leak(style);
    }
}

fn mason_style_get_grid_row_end(style: i64) -> CMasonGridPlacement {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_grid_row_end().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_row_end(style: i64, value: CMasonGridPlacement) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_row_end(value.into());

        Box::leak(style);
    }
}

fn mason_style_get_grid_template_rows(style: i64) -> Vec<CMasonTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style
            .get_grid_template_rows()
            .to_vec()
            .into_iter()
            .map(|v| CMasonTrackSizingFunction(v))
            .collect();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_template_rows(style: i64, value: Vec<CMasonTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_template_rows(value.into_iter().map(|v| v.0).collect());

        Box::leak(style);
    }
}

fn mason_style_get_grid_template_columns(style: i64) -> Vec<CMasonTrackSizingFunction> {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style
            .get_grid_template_columns()
            .to_vec()
            .into_iter()
            .map(|v| CMasonTrackSizingFunction(v))
            .collect();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_grid_template_columns(style: i64, value: Vec<CMasonTrackSizingFunction>) {
    assert_pointer_address(style, "style");
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_grid_template_columns(value.into_iter().map(|v| v.0).collect());

        Box::leak(style);
    }
}

pub fn mason_style_set_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");
    unsafe {
        let width = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_width(width.into());

        Box::leak(style);
    }
}

pub fn mason_style_get_width(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");
    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let width = style.get_size_width().into();

        Box::leak(style);

        width
    }
}

pub fn mason_style_set_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let height = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_size_height(height.into());

        Box::leak(style);
    }
}

pub fn mason_style_get_height(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let height = style.get_size_height().into();

        Box::leak(style);

        height
    }
}

pub fn mason_node_mark_dirty(mason: i64, node: i64) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        mason.mark_dirty(*node);

        Box::leak(mason);
        Box::leak(node);
    }
}

pub fn mason_node_dirty(mason: i64, node: i64) -> bool {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    unsafe {
        let mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        let dirty = mason.dirty(*node);

        Box::leak(mason);
        Box::leak(node);
        dirty
    }
}

pub fn mason_style_set_display(style: i64, display: i32) {
    mason_core::ffi::style_set_display(style as _, display)
}

pub fn mason_style_get_display(style: i64) -> i32 {
    mason_core::ffi::style_get_display(style as _)
}

pub fn mason_node_compute(mason: i64, node: i64) {
    mason_core::ffi::node_compute(mason as _ , node as _);
}

pub fn mason_node_compute_min_content(mason: i64, node: i64) {
    mason_core::ffi::node_compute_min_content(mason as _, node as _)
}

pub fn mason_node_compute_max_content(mason: i64, node: i64) {
    mason_core::ffi::node_compute_max_content(mason as _ , node as _)
}

pub fn mason_node_compute_wh(mason: i64, node: i64, width: f32, height: f32) {
   mason_core::ffi::node_compute_wh(mason as _ , node as _, width, height)
}

pub fn mason_style_get_position(style: i64) -> i32 {
    mason_core::ffi::style_get_position(style as _)
}

pub fn mason_style_set_position(style: i64, value: i32) {
    mason_core::ffi::style_set_position(style as _ , value)
}

pub fn mason_style_get_flex_wrap(style: i64) -> i32 {
    mason_core::ffi::style_get_flex_wrap(style as _)
}

pub fn mason_style_set_flex_wrap(style: i64, value: i32) {
    mason_core::ffi::style_set_flex_wrap(style as _, value)
}

fn mason_style_get_align_items(style: i64) -> i32 {
   mason_core::ffi::style_get_align_items(style as _)
}

fn mason_style_set_align_items(style: i64, value: i32) {
    mason_core::ffi::style_set_align_items(style as _, value);
}

fn mason_style_get_align_self(style: i64) -> i32 {
    mason_core::ffi::style_get_align_self(style as _)
}

fn mason_style_set_align_self(style: i64, value: i32) {
   mason_core::ffi::style_set_align_self(style as _, value)
}

fn mason_style_get_align_content(style: i64) -> i32 {
    mason_core::ffi::style_get_align_content(style as _)
}

fn mason_style_set_align_content(style: i64, value: i32) {
   mason_core::ffi::style_set_align_content(style as _ , value)
}

fn mason_style_get_justify_items(style: i64) -> i32 {
    mason_core::ffi::style_get_justify_items(style as _)
}

fn mason_style_set_justify_items(style: i64, value: i32) {
    mason_core::ffi::style_set_justify_items(style as _, value);
}

fn mason_style_get_justify_self(style: i64) -> i32 {
    mason_core::ffi::style_get_justify_self(style as _)
}

fn mason_style_set_justify_self(style: i64, value: i32) {
    mason_core::ffi::style_set_justify_self(style as _, value)
}

fn mason_style_get_justify_content(style: i64) -> i32 {
   mason_core::ffi::style_get_justify_content(style as _)
}

fn mason_style_set_justify_content(style: i64, value: i32) {
    mason_core::ffi::style_set_position(style as _, value)
}

fn mason_style_set_inset(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    let position = CMasonLengthPercentageAuto::new(value, value_type);
    let rect = Rect::<LengthPercentageAuto>::from_len_auto(position.into());
    mason_core::ffi::style_set_inset(style as _, rect);
}

fn mason_style_get_inset_left(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_inset_left(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_inset_right(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_inset_right(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_inset_top(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_inset_top(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_inset_bottom(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_inset_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_inset_bottom(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_inset_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_margin(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    let margin = CMasonLengthPercentageAuto::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<CMasonLengthPercentageAuto>::from_len_auto(margin.into());
    style.set_margin(rect);
    Box::leak(style);
}

fn mason_style_get_margin_left(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_left(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_right(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_right(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_top(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_top(style: i64, value: f32, value_type: CMasonLengthPercentageAutoType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_margin_bottom(style: i64) -> CMasonLengthPercentageAuto {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_margin_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_margin_bottom(
    style: i64,
    value: f32,
    value_type: CMasonLengthPercentageAutoType,
) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentageAuto::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_margin_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_border(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    let border = CMasonLengthPercentage::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentage>::from_len(border.into());
    style.set_border(rect);
    Box::leak(style);
}

fn mason_style_get_border_left(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_left(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_right(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_right(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_top(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_top(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_border_bottom(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_border_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_border_bottom(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_border_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_set_flex_grow(style: i64, grow: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_grow(grow);

        Box::leak(style);
    }
}

fn mason_style_get_flex_grow(style: i64) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_grow();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_shrink(style: i64, shrink: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_shrink(shrink);

        Box::leak(style);
    }
}

fn mason_style_get_flex_shrink(style: i64) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_shrink();

        Box::leak(style);

        ret
    }
}

fn mason_style_get_flex_basis(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.flex_basis().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_basis(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_flex_basis(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_gap(style: i64) -> CMasonLengthPercentageSize {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.gap().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_gap(
    style: i64,
    width_value: f32,
    width_type: CMasonLengthPercentageType,
    height_value: f32,
    height_type: CMasonLengthPercentageType,
) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        let size =
            CMasonLengthPercentageSize::new(width_value, width_type, height_value, height_type);

        style.set_gap(size.into());

        Box::leak(style);
    }
}

fn mason_style_set_aspect_ratio(style: i64, ratio: f32) {
    assert_pointer_address(style, "style");

    unsafe {
        let mut style = Box::from_raw(style as *mut Style);

        style.set_aspect_ratio(Some(ratio));

        Box::leak(style);
    }
}

fn mason_style_get_aspect_ratio(style: i64) -> f32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.aspect_ratio().unwrap_or(f32::NAN);

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    let padding = CMasonLengthPercentage::new(value, value_type);

    let mut style = unsafe { Box::from_raw(style as *mut Style) };
    let rect = Rect::<LengthPercentage>::from_len(padding.into());
    style.set_padding(rect);
    Box::leak(style);
}

fn mason_style_get_padding_left(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_left().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_left(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_left(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_right(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_right().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_right(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_right(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_top(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_top().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_top(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_top(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_padding_bottom(style: i64) -> CMasonLengthPercentage {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_padding_bottom().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_padding_bottom(style: i64, value: f32, value_type: CMasonLengthPercentageType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonLengthPercentage::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_padding_bottom(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_flex_direction(style: i64) -> i32 {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = flex_direction_to_enum(style.flex_direction());

        Box::leak(style);

        ret
    }
}

fn mason_style_set_flex_direction(style: i64, value: i32) {
    assert_pointer_address(style, "style");

    unsafe {
        if let Some(enum_value) = flex_direction_from_enum(value) {
            let mut style = Box::from_raw(style as *mut Style);

            style.set_flex_direction(enum_value);
            Box::leak(style);
        }
    }
}

fn mason_style_get_min_width(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_width().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_min_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_width(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_min_height(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_min_size_height().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_min_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_min_size_height(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_max_width(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_width().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_max_width(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_width(val.into());

        Box::leak(style);
    }
}

fn mason_style_get_max_height(style: i64) -> CMasonDimension {
    assert_pointer_address(style, "style");

    unsafe {
        let style = Box::from_raw(style as *mut Style);

        let ret = style.get_max_size_height().into();

        Box::leak(style);

        ret
    }
}

fn mason_style_set_max_height(style: i64, value: f32, value_type: CMasonDimensionType) {
    assert_pointer_address(style, "style");

    unsafe {
        let val = CMasonDimension::new(value, value_type);

        let mut style = Box::from_raw(style as *mut Style);

        style.set_max_size_height(val.into());

        Box::leak(style);
    }
}

pub fn mason_node_update_and_set_style(mason: i64, node: i64, style: i64) {
    assert_pointer_address(mason, "mason");
    assert_pointer_address(node, "node");
    assert_pointer_address(style, "style");

    unsafe {
        let mut mason = Box::from_raw(mason as *mut Mason);

        let node = Box::from_raw(node as *mut Node);

        let style = Box::from_raw(style as *mut Style);

        mason.set_style(*node, *style.clone());

        Box::leak(mason);
        Box::leak(node);
        Box::leak(style);
    }
}

#[allow(clippy::too_many_arguments)]
pub fn mason_style_update_with_values(
    style: i64,
    display: i32,
    position: i32,
    direction: i32,
    flex_direction: i32,
    flex_wrap: i32,
    overflow: i32,
    align_items: i32,
    align_self: i32,
    align_content: i32,
    justify_items: i32,
    justify_self: i32,
    justify_content: i32,
    inset_left_type: i32,
    inset_left_value: f32,
    inset_right_type: i32,
    inset_right_value: f32,
    inset_top_type: i32,
    inset_top_value: f32,
    inset_bottom_type: i32,
    inset_bottom_value: f32,
    margin_left_type: i32,
    margin_left_value: f32,
    margin_right_type: i32,
    margin_right_value: f32,
    margin_top_type: i32,
    margin_top_value: f32,
    margin_bottom_type: i32,
    margin_bottom_value: f32,
    padding_left_type: i32,
    padding_left_value: f32,
    padding_right_type: i32,
    padding_right_value: f32,
    padding_top_type: i32,
    padding_top_value: f32,
    padding_bottom_type: i32,
    padding_bottom_value: f32,
    border_left_type: i32,
    border_left_value: f32,
    border_right_type: i32,
    border_right_value: f32,
    border_top_type: i32,
    border_top_value: f32,
    border_bottom_type: i32,
    border_bottom_value: f32,
    flex_grow: f32,
    flex_shrink: f32,
    flex_basis_type: i32,
    flex_basis_value: f32,
    width_type: i32,
    width_value: f32,
    height_type: i32,
    height_value: f32,
    min_width_type: i32,
    min_width_value: f32,
    min_height_type: i32,
    min_height_value: f32,
    max_width_type: i32,
    max_width_value: f32,
    max_height_type: i32,
    max_height_value: f32,
    gap_row_type: i32,
    gap_row_value: f32,
    gap_column_type: i32,
    gap_column_value: f32,
    aspect_ratio: f32,
    mut grid_auto_rows: Vec<CMasonNonRepeatedTrackSizingFunction>,
    mut grid_auto_columns: Vec<CMasonNonRepeatedTrackSizingFunction>,
    grid_auto_flow: i32,
    grid_column_start_type: i32,
    grid_column_start_value: i16,
    grid_column_end_type: i32,
    grid_column_end_value: i16,
    grid_row_start_type: i32,
    grid_row_start_value: i16,
    grid_row_end_type: i32,
    grid_row_end_value: i16,
    mut grid_template_rows: Vec<CMasonTrackSizingFunction>,
    mut grid_template_columns: Vec<CMasonTrackSizingFunction>,
) {
    unsafe {
        let mut style = Box::from_raw(style as *mut Style);
        Style::update_from_ffi(
            &mut style,
            display,
            position,
            direction,
            flex_direction,
            flex_wrap,
            overflow,
            align_items,
            align_self,
            align_content,
            justify_items,
            justify_self,
            justify_content,
            inset_left_type,
            inset_left_value,
            inset_right_type,
            inset_right_value,
            inset_top_type,
            inset_top_value,
            inset_bottom_type,
            inset_bottom_value,
            margin_left_type,
            margin_left_value,
            margin_right_type,
            margin_right_value,
            margin_top_type,
            margin_top_value,
            margin_bottom_type,
            margin_bottom_value,
            padding_left_type,
            padding_left_value,
            padding_right_type,
            padding_right_value,
            padding_top_type,
            padding_top_value,
            padding_bottom_type,
            padding_bottom_value,
            border_left_type,
            border_left_value,
            border_right_type,
            border_right_value,
            border_top_type,
            border_top_value,
            border_bottom_type,
            border_bottom_value,
            flex_grow,
            flex_shrink,
            flex_basis_type,
            flex_basis_value,
            width_type,
            width_value,
            height_type,
            height_value,
            min_width_type,
            min_width_value,
            min_height_type,
            min_height_value,
            max_width_type,
            max_width_value,
            max_height_type,
            max_height_value,
            gap_row_type,
            gap_row_value,
            gap_column_type,
            gap_column_value,
            aspect_ratio,
            grid_auto_rows.into_iter().map(|v| v.0).collect(),
            grid_auto_columns.into_iter().map(|v| v.0).collect(),
            grid_auto_flow,
            grid_column_start_type,
            grid_column_start_value,
            grid_column_end_type,
            grid_column_end_value,
            grid_row_start_type,
            grid_row_start_value,
            grid_row_end_type,
            grid_row_end_value,
            grid_template_rows.into_iter().map(|v| v.0).collect(),
            grid_template_columns.into_iter().map(|v| v.0).collect(),
        );
        Box::leak(style);
    }
}
