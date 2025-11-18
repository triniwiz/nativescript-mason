use crate::style::utils::{
    dimension_from_type_value, dimension_to_format_type_value, dimension_to_type_value,
    get_style_data_f32, get_style_data_i32, length_percentage_auto_from_type_value,
    length_percentage_auto_to_format_type_value, length_percentage_auto_to_type_value,
    length_percentage_from_type_value, length_percentage_to_format_type_value,
    length_percentage_to_type_value, set_style_data_f32, set_style_data_i32,
};
use crate::utils::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, boxing_size_from_enum, boxing_size_to_enum,
    display_from_enum, display_mode_from_enum, display_mode_to_enum, display_to_enum,
    flex_direction_from_enum, flex_direction_to_enum, flex_wrap_from_enum, flex_wrap_to_enum,
    grid_auto_flow_from_enum, grid_auto_flow_to_enum, overflow_from_enum, overflow_to_enum,
    position_from_enum, position_to_enum, text_align_from_enum, text_align_to_enum,
};
#[cfg(target_os = "android")]
use crate::JVM;
use bitflags::bitflags;
#[cfg(target_vendor = "apple")]
use objc2::AnyThread;
#[cfg(target_vendor = "apple")]
use objc2::__framework_prelude::Retained;
#[cfg(target_vendor = "apple")]
use objc2_foundation::NSMutableData;

use std::fmt::{Debug, Formatter};
use std::ops::Deref;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use style_atoms::Atom;
use taffy::prelude::{TaffyAuto, TaffyGridLine};
use taffy::{
    AbsoluteAxis, AbstractAxis, AlignContent, AlignItems, AlignSelf, BlockContainerStyle,
    BlockItemStyle, BoxGenerationMode, BoxSizing, CoreStyle, Dimension, Display, FlexDirection,
    FlexWrap, FlexboxContainerStyle, FlexboxItemStyle, GenericGridTemplateComponent, GridAutoFlow,
    GridContainerStyle, GridItemStyle, GridPlacement, GridTemplateArea, GridTemplateComponent,
    GridTemplateRepetition, JustifyContent, JustifyItems, JustifySelf, LengthPercentage,
    LengthPercentageAuto, Line, Point, Position, Rect, Size, TextAlign, TrackSizingFunction,
};

pub mod utils;

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub enum Overflow {
    #[default]
    Visible,
    Clip,
    Hidden,
    Scroll,
    Auto,
}

impl Into<taffy::style::Overflow> for Overflow {
    fn into(self) -> taffy::Overflow {
        match self {
            Overflow::Visible => taffy::Overflow::Visible,
            Overflow::Clip => taffy::Overflow::Clip,
            Overflow::Hidden => taffy::Overflow::Hidden,
            Overflow::Scroll => taffy::Overflow::Scroll,
            Overflow::Auto => taffy::Overflow::Visible,
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum DisplayMode {
    None,
    Inline,
    Box,
}

impl std::fmt::Display for DisplayMode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            DisplayMode::None => write!(f, "NONE"),
            DisplayMode::Inline => write!(f, "INLINE"),
            DisplayMode::Box => write!(f, "BOX"),
        }
    }
}

#[repr(usize)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[allow(non_camel_case_types)]
pub enum StyleKeys {
    DISPLAY = 0,
    POSITION = 4,
    DIRECTION = 8,
    FLEX_DIRECTION = 12,
    FLEX_WRAP = 16,
    OVERFLOW_X = 20,
    OVERFLOW_Y = 24,

    ALIGN_ITEMS = 28,
    ALIGN_SELF = 32,
    ALIGN_CONTENT = 36,

    JUSTIFY_ITEMS = 40,
    JUSTIFY_SELF = 44,
    JUSTIFY_CONTENT = 48,

    INSET_LEFT_TYPE = 52,
    INSET_LEFT_VALUE = 56,
    INSET_RIGHT_TYPE = 60,
    INSET_RIGHT_VALUE = 64,
    INSET_TOP_TYPE = 68,
    INSET_TOP_VALUE = 72,
    INSET_BOTTOM_TYPE = 76,
    INSET_BOTTOM_VALUE = 80,

    MARGIN_LEFT_TYPE = 84,
    MARGIN_LEFT_VALUE = 88,
    MARGIN_RIGHT_TYPE = 92,
    MARGIN_RIGHT_VALUE = 96,
    MARGIN_TOP_TYPE = 100,
    MARGIN_TOP_VALUE = 104,
    MARGIN_BOTTOM_TYPE = 108,
    MARGIN_BOTTOM_VALUE = 112,

    PADDING_LEFT_TYPE = 116,
    PADDING_LEFT_VALUE = 120,
    PADDING_RIGHT_TYPE = 124,
    PADDING_RIGHT_VALUE = 128,
    PADDING_TOP_TYPE = 132,
    PADDING_TOP_VALUE = 136,
    PADDING_BOTTOM_TYPE = 140,
    PADDING_BOTTOM_VALUE = 144,

    BORDER_LEFT_TYPE = 148,
    BORDER_LEFT_VALUE = 152,
    BORDER_RIGHT_TYPE = 156,
    BORDER_RIGHT_VALUE = 160,
    BORDER_TOP_TYPE = 164,
    BORDER_TOP_VALUE = 168,
    BORDER_BOTTOM_TYPE = 172,
    BORDER_BOTTOM_VALUE = 176,

    FLEX_GROW = 180,
    FLEX_SHRINK = 184,

    FLEX_BASIS_TYPE = 188,
    FLEX_BASIS_VALUE = 192,

    WIDTH_TYPE = 196,
    WIDTH_VALUE = 200,
    HEIGHT_TYPE = 204,
    HEIGHT_VALUE = 208,

    MIN_WIDTH_TYPE = 212,
    MIN_WIDTH_VALUE = 216,
    MIN_HEIGHT_TYPE = 220,
    MIN_HEIGHT_VALUE = 224,

    MAX_WIDTH_TYPE = 228,
    MAX_WIDTH_VALUE = 232,
    MAX_HEIGHT_TYPE = 236,
    MAX_HEIGHT_VALUE = 240,

    GAP_ROW_TYPE = 244,
    GAP_ROW_VALUE = 248,
    GAP_COLUMN_TYPE = 252,
    GAP_COLUMN_VALUE = 256,

    ASPECT_RATIO = 260,
    GRID_AUTO_FLOW = 264,
    GRID_COLUMN_START_TYPE = 268,
    GRID_COLUMN_START_VALUE = 272,
    GRID_COLUMN_END_TYPE = 276,
    GRID_COLUMN_END_VALUE = 280,
    GRID_ROW_START_TYPE = 284,
    GRID_ROW_START_VALUE = 288,
    GRID_ROW_END_TYPE = 292,
    GRID_ROW_END_VALUE = 296,
    SCROLLBAR_WIDTH = 300,
    TEXT_ALIGN = 304,
    BOX_SIZING = 308,
    OVERFLOW = 312,
    ITEM_IS_TABLE = 316,
    ITEM_IS_REPLACED = 320,
    DISPLAY_MODE = 324,
    FORCE_INLINE = 328,
    MIN_CONTENT_WIDTH = 332,
    MIN_CONTENT_HEIGHT = 336,
    MAX_CONTENT_WIDTH = 340,
    MAX_CONTENT_HEIGHT = 344,
}

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct StateKeys: u64 {
        const DISPLAY         = 1 << 0;
        const POSITION        = 1 << 1;
        const DIRECTION       = 1 << 2;
        const FLEX_DIRECTION  = 1 << 3;
        const FLEX_WRAP       = 1 << 4;
        const OVERFLOW_X      = 1 << 5;
        const OVERFLOW_Y      = 1 << 6;
        const ALIGN_ITEMS     = 1 << 7;
        const ALIGN_SELF      = 1 << 8;
        const ALIGN_CONTENT   = 1 << 9;
        const JUSTIFY_ITEMS   = 1 << 10;
        const JUSTIFY_SELF    = 1 << 11;
        const JUSTIFY_CONTENT = 1 << 12;
        const INSET           = 1 << 13;
        const MARGIN          = 1 << 14;
        const PADDING         = 1 << 15;
        const BORDER          = 1 << 16;
        const FLEX_GROW       = 1 << 17;
        const FLEX_SHRINK     = 1 << 18;
        const FLEX_BASIS      = 1 << 19;
        const SIZE            = 1 << 20;
        const MIN_SIZE        = 1 << 21;
        const MAX_SIZE        = 1 << 22;
        const GAP             = 1 << 23;
        const ASPECT_RATIO    = 1 << 24;
        const GRID_AUTO_FLOW  = 1 << 25;
        const GRID_COLUMN     = 1 << 26;
        const GRID_ROW        = 1 << 27;
        const SCROLLBAR_WIDTH = 1 << 28;
        const TEXT_ALIGN      = 1 << 29;
        const BOX_SIZING      = 1 << 30;
        const OVERFLOW        = 1 << 31;
        const ITEM_IS_TABLE   = 1 << 32;
        const ITEM_IS_REPLACED = 1 << 33;
        const DISPLAY_MODE   = 1 << 34;
        const FORCE_INLINE = 1 << 35;
        const MIN_CONTENT_WIDTH = 1 << 36;
        const MIN_CONTENT_HEIGHT = 1 << 37;
        const MAX_CONTENT_WIDTH = 1 << 38;
        const MAX_CONTENT_HEIGHT = 1 << 39;
    }
}

pub struct Style {
    raw_data: *mut u8,
    raw_data_len: usize,
    data_owned: bool,
    grid_area: Option<Atom>,
    grid_column_start: GridPlacement<Atom>,
    grid_column_end: GridPlacement<Atom>,
    grid_row_start: GridPlacement<Atom>,
    grid_row_end: GridPlacement<Atom>,
    grid_template_rows: Vec<GridTemplateComponent<Atom>>,
    grid_template_rows_raw: Option<Atom>,
    grid_template_columns: Vec<GridTemplateComponent<Atom>>,
    grid_template_columns_raw: Option<Atom>,
    grid_auto_rows: Vec<TrackSizingFunction>,
    grid_auto_rows_raw: Option<Atom>,
    grid_auto_columns: Vec<TrackSizingFunction>,
    grid_auto_columns_raw: Option<Atom>,
    pub(crate) grid_template_areas: Vec<GridTemplateArea<Atom>>,
    pub(crate) grid_template_areas_raw: Atom,
    grid_template_column_names: Vec<Vec<Atom>>,
    grid_template_row_names: Vec<Vec<Atom>>,
    #[cfg(target_os = "android")]
    pub(crate) buffer: jni::objects::GlobalRef,
    #[cfg(target_vendor = "apple")]
    pub(crate) buffer: Retained<NSMutableData>,
    pub(crate) device_scale: Option<Arc<AtomicU32>>,
}

impl Debug for Style {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let size = self.size();

        let size = DisplaySize::from(size);

        let min_size = DisplaySize::from(self.min_size());

        let max_size = DisplaySize::from(self.max_size());

        f.debug_struct("Style")
            .field("display", &self.get_display())
            .field("displayMode", &self.display_mode())
            .field("itemIsTable", &self.get_item_is_table())
            .field("itemIsReplaced", &self.get_item_is_replaced())
            .field("boxSizing", &self.get_box_sizing())
            .field("overflow", &self.get_overflow())
            .field("scrollbarWidth", &self.get_scrollbar_width())
            .field("position", &self.get_position())
            .field("size", &size)
            .field("minSize", &min_size)
            .field("maxSize", &max_size)
            .field("border", &DisplayRect::from(self.get_border()))
            .field("padding", &DisplayRect::from(self.get_padding()))
            .field("margin", &DisplayRect::from(self.get_margin()))
            .field("inset", &DisplayRect::from(self.get_inset()))
            .field("aspectRatio", &self.get_aspect_ratio())
            .field("gap", &DisplaySize::from(self.get_gap()))
            .field("alignItems", &self.get_align_items())
            .field("alignSelf", &self.get_align_self())
            .field("justifyItems", &self.get_justify_items())
            .field("justifySelf", &self.get_justify_self())
            .field("alignContent", &self.get_align_content())
            .field("justifyContent", &self.get_justify_content())
            .field("textAlign", &self.get_text_align())
            .field("flexDirection", &self.get_flex_direction())
            .field("flexWrap", &self.get_flex_wrap())
            .field("flexGrow", &self.get_flex_grow())
            .field("flexShrink", &self.get_flex_shrink())
            .field(
                "flex_basis",
                &dimension_to_format_type_value(self.get_flex_basis()),
            )
            .field("grid_area", &self.grid_area)
            .field("grid_template_areas", &self.get_grid_template_areas_css())
            .field("grid_template_rows", &self.get_grid_template_rows_css())
            .field(
                "grid_template_row_names",
                &self
                    .grid_template_row_names
                    .iter()
                    .map(|value| {
                        value
                            .iter()
                            .map(|value| value.to_string())
                            .collect::<Vec<String>>()
                    })
                    .collect::<Vec<_>>(),
            )
            .field(
                "grid_template_columns",
                &self.get_grid_template_columns_css(),
            )
            .field(
                "grid_template_column_names",
                &self
                    .grid_template_column_names
                    .iter()
                    .map(|value| {
                        value
                            .iter()
                            .map(|value| value.to_string())
                            .collect::<Vec<String>>()
                    })
                    .collect::<Vec<_>>(),
            )
            .field("grid_auto_rows", &self.get_grid_auto_rows_css())
            .field("grid_auto_columns", &self.get_grid_auto_columns_css())
            .field("grid_auto_flow", &self.grid_auto_flow())
            .field("grid_row", &self.get_grid_row_css())
            .field("grid_column", &self.get_grid_column_css())
            .finish()
    }
}

struct DisplaySize<T> {
    width: T,
    height: T,
}

impl From<Size<Dimension>> for DisplaySize<Dimension> {
    fn from(value: Size<Dimension>) -> Self {
        Self {
            width: value.width,
            height: value.height,
        }
    }
}

impl From<Size<LengthPercentage>> for DisplaySize<LengthPercentage> {
    fn from(value: Size<LengthPercentage>) -> Self {
        Self {
            width: value.width,
            height: value.height,
        }
    }
}

impl std::fmt::Display for DisplaySize<Dimension> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Size {{ width: {}, height: {} }}",
            dimension_to_format_type_value(self.width),
            dimension_to_format_type_value(self.height)
        )
    }
}

impl Debug for DisplaySize<Dimension> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl std::fmt::Display for DisplaySize<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Size {{ width: {}, height: {} }}",
            length_percentage_to_format_type_value(self.width),
            length_percentage_to_format_type_value(self.height)
        )
    }
}

impl Debug for DisplaySize<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

struct DisplayRect<T> {
    left: T,
    right: T,
    top: T,
    bottom: T,
}

impl From<Rect<LengthPercentage>> for DisplayRect<LengthPercentage> {
    fn from(value: Rect<LengthPercentage>) -> Self {
        Self {
            left: value.left,
            right: value.right,
            top: value.top,
            bottom: value.bottom,
        }
    }
}

impl std::fmt::Display for DisplayRect<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Rect {{ left: {}, right: {}, top: {}, bottom: {} }}",
            length_percentage_to_format_type_value(self.left),
            length_percentage_to_format_type_value(self.right),
            length_percentage_to_format_type_value(self.top),
            length_percentage_to_format_type_value(self.bottom),
        )
    }
}

impl Debug for DisplayRect<LengthPercentage> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl From<Rect<LengthPercentageAuto>> for DisplayRect<LengthPercentageAuto> {
    fn from(value: Rect<LengthPercentageAuto>) -> Self {
        Self {
            left: value.left,
            right: value.right,
            top: value.top,
            bottom: value.bottom,
        }
    }
}

impl std::fmt::Display for DisplayRect<LengthPercentageAuto> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Rect {{ left: {}, right: {}, top: {}, bottom: {} }}",
            length_percentage_auto_to_format_type_value(self.left),
            length_percentage_auto_to_format_type_value(self.right),
            length_percentage_auto_to_format_type_value(self.top),
            length_percentage_auto_to_format_type_value(self.bottom),
        )
    }
}

impl Debug for DisplayRect<LengthPercentageAuto> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self)
    }
}

impl std::fmt::Display for Style {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let size = self.size();

        let size = DisplaySize::from(size);

        let min_size = DisplaySize::from(self.min_size());

        let max_size = DisplaySize::from(self.max_size());

        f.debug_struct("Style")
            .field("display", &self.get_display())
            .field("displayMode", &self.display_mode())
            .field("itemIsTable", &self.get_item_is_table())
            .field("itemIsReplaced", &self.get_item_is_replaced())
            .field("boxSizing", &self.get_box_sizing())
            .field("overflow", &self.get_overflow())
            .field("scrollbarWidth", &self.get_scrollbar_width())
            .field("position", &self.get_position())
            .field("size", &size)
            .field("minSize", &min_size)
            .field("maxSize", &max_size)
            .field("border", &DisplayRect::from(self.get_border()))
            .field("padding", &DisplayRect::from(self.get_padding()))
            .field("margin", &DisplayRect::from(self.get_margin()))
            .field("inset", &DisplayRect::from(self.get_inset()))
            .field("aspectRatio", &self.get_aspect_ratio())
            .field("gap", &DisplaySize::from(self.get_gap()))
            .field("alignItems", &self.get_align_items())
            .field("alignSelf", &self.get_align_self())
            .field("justifyItems", &self.get_justify_items())
            .field("justifySelf", &self.get_justify_self())
            .field("alignContent", &self.get_align_content())
            .field("justifyContent", &self.get_justify_content())
            .field("textAlign", &self.get_text_align())
            .field("flexDirection", &self.get_flex_direction())
            .field("flexWrap", &self.get_flex_wrap())
            .field("flexGrow", &self.get_flex_grow())
            .field("flexShrink", &self.get_flex_shrink())
            .field(
                "flex_basis",
                &dimension_to_format_type_value(self.get_flex_basis()),
            )
            .field("grid_template_rows", &self.get_grid_template_rows_css())
            .field(
                "grid_template_columns",
                &self.get_grid_template_columns_css(),
            )
            .field("grid_auto_rows", &self.get_grid_auto_rows_css())
            .field("grid_auto_columns", &self.get_grid_auto_columns_css())
            .field("grid_auto_flow", &self.get_grid_auto_flow())
            .field("grid_row", &self.get_grid_row_css())
            .field("grid_column", &self.get_grid_column_css())
            .finish()
    }
}

impl Clone for Style {
    #[cfg(target_os = "android")]
    fn clone(&self) -> Self {
        let mut clone = unsafe {
            std::slice::from_raw_parts_mut(self.raw_data, self.raw_data_len)
                .to_vec()
                .into_boxed_slice()
        };
        let ptr = clone.as_mut_ptr();
        let len = clone.len();

        std::mem::forget(clone);

        let jvm = JVM.get().unwrap();

        let vm = jvm.attach_current_thread();
        let mut env = vm.unwrap();
        let db = unsafe {
            let ret = env.new_direct_byte_buffer(ptr as _, len);
            ret.unwrap()
        };
        let buffer_ref = env.new_global_ref(db).unwrap();

        Self {
            raw_data: ptr,
            raw_data_len: len,
            grid_template_rows: self.grid_template_rows.clone(),
            grid_template_rows_raw: self.grid_template_rows_raw.clone(),
            grid_template_columns: self.grid_template_columns.clone(),
            grid_template_columns_raw: self.grid_template_columns_raw.clone(),
            grid_auto_rows: self.grid_auto_rows.clone(),
            grid_auto_rows_raw: self.grid_auto_rows_raw.clone(),
            grid_auto_columns: self.grid_auto_columns.clone(),
            grid_auto_columns_raw: self.grid_auto_columns_raw.clone(),
            grid_template_areas: self.grid_template_areas.clone(),
            grid_template_areas_raw: self.grid_template_areas_raw.clone(),
            grid_template_column_names: self.grid_template_column_names.clone(),
            grid_template_row_names: self.grid_template_row_names.clone(),
            buffer: buffer_ref,
            data_owned: true,
            grid_area: self.grid_area.clone(),
            grid_column_start: self.grid_column_start.clone(),
            grid_column_end: self.grid_column_end.clone(),
            grid_row_start: self.grid_row_start.clone(),
            grid_row_end: self.grid_row_end.clone(),
            device_scale: self.device_scale.clone(),
        }
    }

    #[cfg(target_vendor = "apple")]
    fn clone(&self) -> Self {
        let clone =
            unsafe { std::slice::from_raw_parts_mut(self.raw_data, self.raw_data_len).to_vec() };
        let buffer = NSMutableData::from_vec(clone);
        let (ptr, len) = {
            let slice = unsafe { buffer.as_mut_bytes_unchecked() };
            (slice.as_mut_ptr(), slice.len())
        };

        Self {
            raw_data: ptr,
            raw_data_len: len,
            grid_template_rows: self.grid_template_rows.clone(),
            grid_template_rows_raw: self.grid_template_rows_raw.clone(),
            grid_template_columns: self.grid_template_columns.clone(),
            grid_template_columns_raw: self.grid_template_columns_raw.clone(),
            grid_auto_rows: self.grid_auto_rows.clone(),
            grid_auto_rows_raw: self.grid_auto_rows_raw.clone(),
            grid_auto_columns: self.grid_auto_columns.clone(),
            grid_auto_columns_raw: self.grid_auto_columns_raw.clone(),
            grid_template_areas: self.grid_template_areas.clone(),
            grid_template_areas_raw: self.grid_template_areas_raw.clone(),
            grid_template_column_names: self.grid_template_column_names.clone(),
            grid_template_row_names: self.grid_template_row_names.clone(),
            #[cfg(target_vendor = "apple")]
            buffer,
            data_owned: false,
            grid_area: self.grid_area.clone(),
            grid_column_start: self.grid_column_start.clone(),
            grid_column_end: self.grid_column_end.clone(),
            grid_row_start: self.grid_row_start.clone(),
            grid_row_end: self.grid_row_end.clone(),
            device_scale: self.device_scale.clone(),
        }
    }

    #[cfg(not(any(target_vendor = "apple", target_os = "android")))]
    fn clone(&self) -> Self {
        let mut clone = unsafe {
            std::slice::from_raw_parts_mut(self.raw_data, self.raw_data_len)
                .to_vec()
                .into_boxed_slice()
        };
        let ptr = clone.as_mut_ptr();
        let len = clone.len();

        std::mem::forget(clone);
        Self {
            raw_data: ptr,
            raw_data_len: len,
            grid_template_rows: self.grid_template_rows.clone(),
            grid_template_rows_raw: self.grid_template_rows_raw.clone(),
            grid_template_columns: self.grid_template_columns.clone(),
            grid_template_columns_raw: self.grid_template_columns_raw.clone(),
            grid_auto_rows: self.grid_auto_rows.clone(),
            grid_auto_rows_raw: self.grid_auto_rows_raw.clone(),
            grid_auto_columns: self.grid_auto_columns.clone(),
            grid_auto_columns_raw: self.grid_auto_columns_raw.clone(),
            grid_template_areas: self.grid_template_areas.clone(),
            grid_template_areas_raw: self.grid_template_areas_raw.clone(),
            grid_template_column_names: self.grid_template_column_names.clone(),
            grid_template_row_names: self.grid_template_row_names.clone(),
            data_owned: true,
            grid_area: self.grid_area.clone(),
            grid_column_start: self.grid_column_start.clone(),
            grid_column_end: self.grid_column_end.clone(),
            grid_row_start: self.grid_row_start.clone(),
            grid_row_end: self.grid_row_end.clone(),
            device_scale: self.device_scale.clone(),
        }
    }
}

impl Drop for Style {
    fn drop(&mut self) {
        if self.data_owned {
            let _ = unsafe {
                Box::from_raw(std::ptr::slice_from_raw_parts_mut(
                    self.raw_data,
                    self.raw_data_len,
                ))
            };
        }
    }
}

impl Style {
    pub fn get_device_scale(&self) -> f32 {
        self.device_scale
            .as_ref()
            .map(|scale| f32::from_bits(scale.load(Ordering::Acquire)))
            .unwrap_or(1f32)
    }
    fn default_data() -> Vec<u8> {
        // last item + 4 bytes
        let mut buffer = vec![0_u8; 348];

        {
            let float_slice = unsafe {
                std::slice::from_raw_parts_mut(buffer.as_mut_ptr() as *mut f32, buffer.len() / 4)
            };
            // default ratio to NAN
            float_slice[StyleKeys::ASPECT_RATIO as usize / 4] = f32::NAN;
            // default shrink to 1
            float_slice[StyleKeys::FLEX_SHRINK as usize / 4] = 1.;
        }

        let int_slice = unsafe {
            std::slice::from_raw_parts_mut(buffer.as_mut_ptr() as *mut i32, buffer.len() / 4)
        };

        int_slice[StyleKeys::DISPLAY as usize / 4] = display_to_enum(Display::Block);

        // default Normal -> -1
        int_slice[StyleKeys::ALIGN_ITEMS as usize / 4] = -1;

        int_slice[StyleKeys::ALIGN_SELF as usize / 4] = -1;

        int_slice[StyleKeys::ALIGN_CONTENT as usize / 4] = -1;

        int_slice[StyleKeys::JUSTIFY_ITEMS as usize / 4] = -1;

        int_slice[StyleKeys::JUSTIFY_SELF as usize / 4] = -1;

        int_slice[StyleKeys::JUSTIFY_CONTENT as usize / 4] = -1;

        int_slice[StyleKeys::MARGIN_LEFT_TYPE as usize / 4] = 1;

        int_slice[StyleKeys::MARGIN_TOP_TYPE as usize / 4] = 1;

        int_slice[StyleKeys::MARGIN_RIGHT_TYPE as usize / 4] = 1;

        int_slice[StyleKeys::MARGIN_BOTTOM_TYPE as usize / 4] = 1;

        int_slice[StyleKeys::PADDING_LEFT_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::PADDING_TOP_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::PADDING_RIGHT_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::PADDING_BOTTOM_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::BORDER_LEFT_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::BORDER_TOP_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::BORDER_RIGHT_TYPE as usize / 4] = 0;

        int_slice[StyleKeys::BORDER_BOTTOM_TYPE as usize / 4] = 0;

        buffer
    }

    #[cfg(target_os = "android")]
    pub fn copy_from(&mut self, other: &Style) {
        let mut copy = unsafe {
            std::slice::from_raw_parts_mut(other.raw_data, other.raw_data_len)
                .to_vec()
                .into_boxed_slice()
        };
        let _ = unsafe {
            Box::from_raw(std::slice::from_raw_parts_mut(
                self.raw_data,
                self.raw_data_len,
            ))
        };
        let ptr = copy.as_mut_ptr();
        let len = copy.len();
        self.raw_data = ptr;
        self.raw_data_len = len;
        std::mem::forget(copy);

        let jvm = JVM.get().unwrap();

        let vm = jvm.attach_current_thread();
        let mut env = vm.unwrap();
        let db = unsafe {
            let ret = env.new_direct_byte_buffer(ptr as _, len);
            ret.unwrap()
        };

        self.buffer = env.new_global_ref(db).unwrap();

        self.grid_template_rows = other.grid_template_rows.clone();
        self.grid_template_rows_raw = other.grid_template_rows_raw.clone();
        self.grid_template_columns = other.grid_template_columns.clone();
        self.grid_template_columns_raw = other.grid_template_columns_raw.clone();
        self.grid_auto_rows = other.grid_auto_rows.clone();
        self.grid_auto_rows_raw = other.grid_auto_rows_raw.clone();
        self.grid_auto_columns = other.grid_auto_columns.clone();
        self.grid_auto_columns_raw = other.grid_auto_columns_raw.clone();
        self.grid_template_areas = other.grid_template_areas.clone();
        self.grid_template_areas_raw = other.grid_template_areas_raw.clone();
        self.grid_template_column_names = other.grid_template_column_names.clone();
        self.grid_template_row_names = other.grid_template_row_names.clone();
        self.grid_area = other.grid_area.clone();
        self.grid_column_start = other.grid_column_start.clone();
        self.grid_column_end = other.grid_column_end.clone();
        self.grid_row_start = other.grid_row_start.clone();
        self.grid_row_end = other.grid_row_end.clone();
        self.device_scale = other.device_scale.clone();
    }

    #[cfg(not(any(target_vendor = "apple", target_os = "android")))]
    pub fn copy_from(&mut self, other: &Style) {
        let mut copy = unsafe {
            std::slice::from_raw_parts_mut(other.raw_data, other.raw_data_len)
                .to_vec()
                .into_boxed_slice()
        };
        let _ = unsafe {
            Box::from_raw(std::slice::from_raw_parts_mut(
                self.raw_data,
                self.raw_data_len,
            ))
        };
        self.raw_data = copy.as_mut_ptr();
        self.raw_data_len = copy.len();
        std::mem::forget(copy);

        self.grid_template_rows = other.grid_template_rows.clone();
        self.grid_template_rows_raw = other.grid_template_rows_raw.clone();
        self.grid_template_columns = other.grid_template_columns.clone();
        self.grid_template_columns_raw = other.grid_template_columns_raw.clone();
        self.grid_auto_rows = other.grid_auto_rows.clone();
        self.grid_auto_rows_raw = other.grid_auto_rows_raw.clone();
        self.grid_auto_columns = other.grid_auto_columns.clone();
        self.grid_auto_columns_raw = other.grid_auto_columns_raw.clone();
        self.grid_template_areas = other.grid_template_areas.clone();
        self.grid_template_areas_raw = other.grid_template_areas_raw.clone();
        self.grid_template_column_names = other.grid_template_column_names.clone();
        self.grid_template_row_names = other.grid_template_row_names.clone();
        self.grid_area = other.grid_area.clone();
        self.grid_column_start = other.grid_column_start.clone();
        self.grid_column_end = other.grid_column_end.clone();
        self.grid_row_start = other.grid_row_start.clone();
        self.grid_row_end = other.grid_row_end.clone();
        self.device_scale = other.device_scale.clone();
    }

    #[cfg(target_vendor = "apple")]
    pub fn copy_from(&mut self, other: &Style) {
        self.buffer = NSMutableData::dataWithData(&other.buffer);
        self.data_owned = false;
        unsafe {
            let buffer = self.buffer.as_mut_bytes_unchecked();
            self.raw_data = buffer.as_mut_ptr();
            self.raw_data_len = buffer.len();
        }

        self.grid_template_rows = other.grid_template_rows.clone();
        self.grid_template_rows_raw = other.grid_template_rows_raw.clone();
        self.grid_template_columns = other.grid_template_columns.clone();
        self.grid_template_columns_raw = other.grid_template_columns_raw.clone();
        self.grid_auto_rows = other.grid_auto_rows.clone();
        self.grid_auto_rows_raw = other.grid_auto_rows_raw.clone();
        self.grid_auto_columns = other.grid_auto_columns.clone();
        self.grid_auto_columns_raw = other.grid_auto_columns_raw.clone();
        self.grid_template_areas = other.grid_template_areas.clone();
        self.grid_template_areas_raw = other.grid_template_areas_raw.clone();
        self.grid_template_column_names = other.grid_template_column_names.clone();
        self.grid_template_row_names = other.grid_template_row_names.clone();
        self.grid_area = other.grid_area.clone();
        self.grid_column_start = other.grid_column_start.clone();
        self.grid_column_end = other.grid_column_end.clone();
        self.grid_row_start = other.grid_row_start.clone();
        self.grid_row_end = other.grid_row_end.clone();
        self.device_scale = other.device_scale.clone();
    }

    #[cfg(target_os = "android")]
    pub fn new() -> Self {
        let mut buffer = Self::default_data().into_boxed_slice();
        let ptr = buffer.as_mut_ptr();
        let len = buffer.len();
        std::mem::forget(buffer);

        let jvm = JVM.get().unwrap();

        let vm = jvm.attach_current_thread();
        let mut env = vm.unwrap();
        let db = unsafe {
            let ret = env.new_direct_byte_buffer(ptr as _, len);
            ret.unwrap()
        };

        let buffer_ref = env.new_global_ref(db).unwrap();

        Self {
            raw_data: ptr,
            raw_data_len: len,
            grid_template_rows: Default::default(),
            grid_template_rows_raw: None,
            grid_template_columns: Default::default(),
            grid_template_columns_raw: None,
            grid_auto_rows: Default::default(),
            grid_auto_rows_raw: None,
            grid_auto_columns: Default::default(),
            grid_auto_columns_raw: None,
            grid_template_areas: Default::default(),
            grid_template_areas_raw: Default::default(),
            grid_template_column_names: Default::default(),
            data_owned: true,
            grid_area: None,
            grid_column_start: Default::default(),
            grid_column_end: Default::default(),
            grid_row_start: Default::default(),
            buffer: buffer_ref,
            grid_row_end: Default::default(),
            grid_template_row_names: Default::default(),
            device_scale: None,
        }
    }

    #[cfg(target_vendor = "apple")]
    pub fn new() -> Self {
        let buffer = Self::default_data();
        let buffer = NSMutableData::from_vec(buffer);
        let raw = unsafe { buffer.as_mut_bytes_unchecked() };
        let ptr = raw.as_mut_ptr();
        let len = raw.len();
        Self {
            grid_template_rows: Default::default(),
            grid_template_rows_raw: None,
            grid_template_columns: Default::default(),
            grid_template_columns_raw: None,
            grid_auto_rows: Default::default(),
            grid_auto_rows_raw: None,
            grid_auto_columns: Default::default(),
            grid_auto_columns_raw: None,
            grid_template_areas: Default::default(),
            grid_template_areas_raw: Default::default(),
            grid_template_column_names: Default::default(),
            grid_template_row_names: Default::default(),
            #[cfg(target_vendor = "apple")]
            buffer,
            raw_data: ptr,
            raw_data_len: len,
            data_owned: false,
            grid_area: None,
            grid_column_start: Default::default(),
            grid_column_end: Default::default(),
            grid_row_start: Default::default(),
            grid_row_end: Default::default(),
            device_scale: None,
        }
    }

    #[cfg(not(any(target_os = "android", target_vendor = "apple")))]
    pub fn new() -> Self {
        let mut buffer = Self::default_data().into_boxed_slice();
        let ptr = buffer.as_mut_ptr();
        let len = buffer.len();
        std::mem::forget(buffer);

        Self {
            grid_template_rows: Default::default(),
            grid_template_rows_raw: None,
            grid_template_columns: Default::default(),
            grid_template_columns_raw: None,
            grid_auto_rows: Default::default(),
            grid_auto_rows_raw: None,
            grid_auto_columns: Default::default(),
            grid_auto_columns_raw: None,
            grid_template_areas: vec![],
            grid_template_areas_raw: Default::default(),
            grid_template_column_names: vec![],
            grid_template_row_names: vec![],
            buffer: Default::default(),
            raw_data: ptr,
            raw_data_len: len,
            data_owned: true,
            grid_area: None,
            grid_column_start: Default::default(),
            grid_column_end: Default::default(),
            grid_row_start: Default::default(),
            grid_row_end: Default::default(),
            device_scale: None,
        }
    }

    pub fn set_grid_template_areas_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_template_areas_raw = Default::default();
            self.grid_template_areas = vec![];
            if self.grid_template_rows_raw.is_none() {
                self.grid_template_rows = vec![];
            }

            if self.grid_template_columns_raw.is_none() {
                self.grid_template_columns = vec![];
            }
            return;
        }
        let areas = crate::utils::parse_grid_template_areas(value);
        if let Ok(areas) = areas {
            if areas.areas.is_empty() {
                self.grid_template_areas_raw = Default::default();
                self.grid_template_areas = vec![];

                // if self.grid_template_rows_raw.is_none() {
                //     self.grid_template_rows = vec![];
                // }
                //
                // if self.grid_template_columns_raw.is_none() {
                //     self.grid_template_columns = vec![];
                // }
            } else {
                self.grid_template_areas_raw = value.into();

                /*
                if self.grid_template_rows_raw.is_none() && areas.row_count > 0
                {
                    self.grid_template_rows =
                        vec![
                            GridTemplateComponent::Repeat(
                                GridTemplateRepetition{
                                    count: RepetitionCount::Count(areas.row_count),
                                    tracks: vec![taffy::MinMax::AUTO],
                                    line_names: vec![],
                                }
                            )
                        ];
                }

                if self.grid_template_columns_raw.is_none() && areas.column_count > 0 {
                    self.grid_template_columns =
                        vec![
                            GridTemplateComponent::Repeat(
                                GridTemplateRepetition{
                                    count: RepetitionCount::Count(areas.column_count),
                                    tracks: vec![taffy::MinMax::AUTO],
                                    line_names: vec![],
                                }
                            )
                        ];
                }



                */
                self.grid_template_areas = areas.areas;
            }
        }
    }

    #[inline]
    pub fn data(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.raw_data, self.raw_data_len) }
    }

    #[inline]
    pub fn data_mut(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.raw_data, self.raw_data_len) }
    }

    pub(crate) fn min_content(&self) -> Size<f32> {
        Size {
            width: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH),
            height: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT),
        }
    }

    pub(crate) fn set_min_content(&mut self, value: Size<f32>) {
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_WIDTH, value.width);
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_HEIGHT, value.height);
    }

    pub(crate) fn min_content_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH)
    }

    pub(crate) fn min_content_height(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT)
    }

    pub(crate) fn set_min_content_width(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_WIDTH, value)
    }

    pub(crate) fn set_min_content_height(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_HEIGHT, value)
    }

    pub(crate) fn max_content(&self) -> Size<f32> {
        Size {
            width: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH),
            height: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT),
        }
    }

    pub(crate) fn set_max_content(&mut self, value: Size<f32>) {
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_WIDTH, value.width);
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_HEIGHT, value.height);
    }

    pub(crate) fn max_content_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH)
    }

    pub(crate) fn max_content_height(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT)
    }

    pub(crate) fn set_max_content_width(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_WIDTH, value)
    }

    pub(crate) fn set_max_content_height(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_HEIGHT, value)
    }

    pub(crate) fn content_sizes(&self) -> (Size<f32>, Size<f32>) {
        (
            Size {
                width: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH),
                height: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT),
            },
            Size {
                width: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH),
                height: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT),
            },
        )
    }

    pub(crate) fn content_width_sizes(&self) -> (f32, f32) {
        (
            get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH),
            get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH),
        )
    }

    pub(crate) fn content_height_sizes(&self) -> (f32, f32) {
        (
            get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT),
            get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT),
        )
    }

    // used to force inline when text-view doesn't set a tag
    pub(crate) fn force_inline(&self) -> bool {
        get_style_data_i32(self.data(), StyleKeys::FORCE_INLINE) != 0
    }

    pub fn display_mode(&self) -> DisplayMode {
        display_mode_from_enum(get_style_data_i32(self.data(), StyleKeys::DISPLAY_MODE)).unwrap()
    }

    pub fn set_display_mode(&mut self, value: DisplayMode) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::DISPLAY_MODE,
            display_mode_to_enum(value),
        );
    }

    pub fn get_display(&self) -> Display {
        display_from_enum(get_style_data_i32(self.data(), StyleKeys::DISPLAY)).unwrap()
    }

    pub fn set_display(&mut self, value: Display) {
        set_style_data_i32(self.data_mut(), StyleKeys::DISPLAY, display_to_enum(value));
    }

    pub fn get_item_is_table(&self) -> bool {
        get_style_data_i32(self.data(), StyleKeys::ITEM_IS_TABLE) != 0
    }
    pub fn set_item_is_table(&mut self, value: bool) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::ITEM_IS_TABLE,
            if value { 1 } else { 0 },
        );
    }

    pub fn get_item_is_replaced(&self) -> bool {
        get_style_data_i32(self.data(), StyleKeys::ITEM_IS_REPLACED) != 0
    }
    pub fn set_item_is_replaced(&mut self, value: bool) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::ITEM_IS_REPLACED,
            if value { 1 } else { 0 },
        );
    }

    pub fn get_box_sizing(&self) -> BoxSizing {
        boxing_size_from_enum(get_style_data_i32(self.data(), StyleKeys::BOX_SIZING)).unwrap()
    }

    pub fn set_box_sizing(&mut self, value: BoxSizing) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::BOX_SIZING,
            boxing_size_to_enum(value),
        );
    }
    pub fn get_overflow(&self) -> Point<Overflow> {
        Point {
            x: overflow_from_enum(get_style_data_i32(self.data(), StyleKeys::OVERFLOW_X)).unwrap(),
            y: overflow_from_enum(get_style_data_i32(self.data(), StyleKeys::OVERFLOW_Y)).unwrap(),
        }
    }

    pub fn set_overflow(&mut self, value: Point<Overflow>) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::OVERFLOW_X,
            overflow_to_enum(value.x),
        );
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::OVERFLOW_Y,
            overflow_to_enum(value.y),
        );
    }

    pub fn get_overflow_x(&self) -> Overflow {
        overflow_from_enum(get_style_data_i32(self.data(), StyleKeys::OVERFLOW_X)).unwrap()
    }

    pub fn set_overflow_x(&mut self, value: Overflow) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::OVERFLOW_X,
            overflow_to_enum(value),
        )
    }

    pub fn get_overflow_y(&self) -> Overflow {
        overflow_from_enum(get_style_data_i32(self.data(), StyleKeys::OVERFLOW_Y)).unwrap()
    }

    pub fn set_overflow_y(&mut self, value: Overflow) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::OVERFLOW_Y,
            overflow_to_enum(value),
        )
    }

    pub fn get_scrollbar_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::SCROLLBAR_WIDTH)
    }

    pub fn set_scrollbar_width(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::SCROLLBAR_WIDTH, value)
    }

    pub fn get_position(&self) -> Position {
        position_from_enum(get_style_data_i32(self.data(), StyleKeys::POSITION)).unwrap()
    }

    pub fn set_position(&mut self, value: Position) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::POSITION,
            position_to_enum(value),
        )
    }

    pub fn get_inset(&self) -> Rect<LengthPercentageAuto> {
        Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::INSET_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::INSET_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::INSET_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::INSET_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_inset(&mut self, value: Rect<LengthPercentageAuto>) {
        let left = length_percentage_auto_to_type_value(value.left);
        let right = length_percentage_auto_to_type_value(value.right);
        let top = length_percentage_auto_to_type_value(value.top);
        let bottom = length_percentage_auto_to_type_value(value.bottom);

        set_style_data_i32(self.data_mut(), StyleKeys::INSET_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_LEFT_VALUE, left.1);

        set_style_data_i32(self.data_mut(), StyleKeys::INSET_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_RIGHT_VALUE, right.1);

        set_style_data_i32(self.data_mut(), StyleKeys::INSET_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_TOP_VALUE, top.1);

        set_style_data_i32(self.data_mut(), StyleKeys::INSET_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_BOTTOM_VALUE, bottom.1);
    }

    pub fn set_left_inset(&mut self, value: LengthPercentageAuto) {
        let left = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::INSET_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_LEFT_VALUE, left.1);
    }

    pub fn left_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::INSET_LEFT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_LEFT_VALUE),
        )
    }

    pub fn set_right_inset(&mut self, value: LengthPercentageAuto) {
        let right = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::INSET_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_RIGHT_VALUE, right.1);
    }

    pub fn right_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::INSET_RIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_RIGHT_VALUE),
        )
    }

    pub fn set_top_inset(&mut self, value: LengthPercentageAuto) {
        let top = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::INSET_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_TOP_VALUE, top.1);
    }

    pub fn top_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::INSET_TOP_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_TOP_VALUE),
        )
    }

    pub fn set_bottom_inset(&mut self, value: LengthPercentageAuto) {
        let bottom = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::INSET_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_BOTTOM_VALUE, bottom.1);
    }

    pub fn bottom_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::INSET_BOTTOM_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_BOTTOM_VALUE),
        )
    }

    pub fn get_margin(&self) -> Rect<LengthPercentageAuto> {
        Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MARGIN_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MARGIN_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MARGIN_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MARGIN_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_margin(&mut self, value: Rect<LengthPercentageAuto>) {
        let margin_left = length_percentage_auto_to_type_value(value.left);
        let margin_right = length_percentage_auto_to_type_value(value.right);
        let margin_top = length_percentage_auto_to_type_value(value.top);
        let margin_bottom = length_percentage_auto_to_type_value(value.bottom);

        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_LEFT_TYPE, margin_left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_LEFT_VALUE, margin_left.1);

        set_style_data_i32(
            self.data_mut(),
            StyleKeys::MARGIN_RIGHT_TYPE,
            margin_right.0,
        );
        set_style_data_f32(
            self.data_mut(),
            StyleKeys::MARGIN_RIGHT_VALUE,
            margin_right.1,
        );

        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_TOP_TYPE, margin_top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_TOP_VALUE, margin_top.1);

        set_style_data_i32(
            self.data_mut(),
            StyleKeys::MARGIN_BOTTOM_TYPE,
            margin_bottom.0,
        );
        set_style_data_f32(
            self.data_mut(),
            StyleKeys::MARGIN_BOTTOM_VALUE,
            margin_bottom.1,
        );
    }

    pub fn set_left_margin(&mut self, value: LengthPercentageAuto) {
        let left = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_LEFT_VALUE, left.1);
    }

    pub fn left_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::MARGIN_LEFT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_LEFT_VALUE),
        )
    }

    pub fn set_right_margin(&mut self, value: LengthPercentageAuto) {
        let right = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_RIGHT_VALUE, right.1);
    }

    pub fn right_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::MARGIN_RIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_RIGHT_VALUE),
        )
    }

    pub fn set_top_margin(&mut self, value: LengthPercentageAuto) {
        let top = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_TOP_VALUE, top.1);
    }

    pub fn top_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::MARGIN_TOP_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_TOP_VALUE),
        )
    }

    pub fn set_bottom_margin(&mut self, value: LengthPercentageAuto) {
        let bottom = length_percentage_auto_to_type_value(value);
        set_style_data_i32(self.data_mut(), StyleKeys::MARGIN_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_BOTTOM_VALUE, bottom.1);
    }

    pub fn bottom_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::MARGIN_BOTTOM_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_BOTTOM_VALUE),
        )
    }

    pub fn get_padding(&self) -> Rect<LengthPercentage> {
        Rect {
            left: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::PADDING_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::PADDING_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::PADDING_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::PADDING_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_padding(&mut self, value: Rect<LengthPercentage>) {
        let padding_left = length_percentage_to_type_value(value.left);
        let padding_right = length_percentage_to_type_value(value.right);
        let padding_top = length_percentage_to_type_value(value.top);
        let padding_bottom = length_percentage_to_type_value(value.bottom);

        let data = self.data_mut();

        set_style_data_i32(data, StyleKeys::PADDING_LEFT_TYPE, padding_left.0);
        set_style_data_f32(data, StyleKeys::PADDING_LEFT_VALUE, padding_left.1);

        set_style_data_i32(data, StyleKeys::PADDING_RIGHT_TYPE, padding_right.0);
        set_style_data_f32(data, StyleKeys::PADDING_RIGHT_VALUE, padding_right.1);

        set_style_data_i32(data, StyleKeys::PADDING_TOP_TYPE, padding_top.0);
        set_style_data_f32(data, StyleKeys::PADDING_TOP_VALUE, padding_top.1);

        set_style_data_i32(data, StyleKeys::PADDING_BOTTOM_TYPE, padding_bottom.0);
        set_style_data_f32(data, StyleKeys::PADDING_BOTTOM_VALUE, padding_bottom.1);
    }

    pub fn get_border(&self) -> Rect<LengthPercentage> {
        Rect {
            left: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::BORDER_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::BORDER_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::BORDER_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::BORDER_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_border(&mut self, value: Rect<LengthPercentage>) {
        let border_left = length_percentage_to_type_value(value.left);
        let border_right = length_percentage_to_type_value(value.right);
        let border_top = length_percentage_to_type_value(value.top);
        let border_bottom = length_percentage_to_type_value(value.bottom);

        let data = self.data_mut();

        set_style_data_i32(data, StyleKeys::BORDER_LEFT_TYPE, border_left.0);
        set_style_data_f32(data, StyleKeys::BORDER_LEFT_VALUE, border_left.1);

        set_style_data_i32(data, StyleKeys::BORDER_RIGHT_TYPE, border_right.0);
        set_style_data_f32(data, StyleKeys::BORDER_RIGHT_VALUE, border_right.1);

        set_style_data_i32(data, StyleKeys::BORDER_TOP_TYPE, border_top.0);
        set_style_data_f32(data, StyleKeys::BORDER_TOP_VALUE, border_top.1);

        set_style_data_i32(data, StyleKeys::BORDER_BOTTOM_TYPE, border_bottom.0);
        set_style_data_f32(data, StyleKeys::BORDER_BOTTOM_VALUE, border_bottom.1);
    }

    pub fn get_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_size(&mut self, value: Size<Dimension>) {
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i32(data, StyleKeys::WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i32(data, StyleKeys::HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::HEIGHT_VALUE, height.1);
    }

    pub fn width(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::WIDTH_TYPE),
            get_style_data_f32(self.data(), StyleKeys::WIDTH_VALUE),
        )
    }

    pub fn height(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::HEIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::HEIGHT_VALUE),
        )
    }

    pub fn set_width(&mut self, value: Dimension) {
        let data = self.data_mut();
        let width = dimension_to_type_value(value);
        set_style_data_i32(data, StyleKeys::WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::WIDTH_VALUE, width.1);
    }

    pub fn set_height(&mut self, value: Dimension) {
        let data = self.data_mut();
        let height = dimension_to_type_value(value);
        set_style_data_i32(data, StyleKeys::HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::HEIGHT_VALUE, height.1);
    }

    pub fn get_min_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MIN_WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MIN_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MIN_HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MIN_HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_min_size(&mut self, value: Size<Dimension>) {
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i32(data, StyleKeys::MIN_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MIN_WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i32(data, StyleKeys::MIN_HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::MIN_HEIGHT_VALUE, height.1);
    }

    pub fn set_min_width(&mut self, value: Dimension) {
        let data = self.data_mut();
        let width = dimension_to_type_value(value);
        set_style_data_i32(data, StyleKeys::MIN_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MIN_WIDTH_VALUE, width.1);
    }

    pub fn set_min_height(&mut self, value: Dimension) {
        let data = self.data_mut();
        let height = dimension_to_type_value(value);
        set_style_data_i32(data, StyleKeys::MIN_HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::MIN_HEIGHT_VALUE, height.1);
    }

    pub fn get_max_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MAX_WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MAX_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::MAX_HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MAX_HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_max_size(&mut self, value: Size<Dimension>) {
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i32(data, StyleKeys::MAX_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MAX_WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i32(data, StyleKeys::MAX_HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::MAX_HEIGHT_VALUE, height.1);
    }

    pub fn get_aspect_ratio(&self) -> Option<f32> {
        let ratio = get_style_data_f32(self.data(), StyleKeys::ASPECT_RATIO);
        if ratio.is_nan() {
            return None;
        }
        Some(ratio)
    }

    pub fn set_aspect_ratio(&mut self, ratio: Option<f32>) {
        let ratio = ratio.unwrap_or(f32::NAN);
        set_style_data_f32(self.data_mut(), StyleKeys::ASPECT_RATIO, ratio);
    }

    pub fn get_gap(&self) -> Size<LengthPercentage> {
        Size {
            width: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::GAP_ROW_TYPE),
                get_style_data_f32(self.data(), StyleKeys::GAP_ROW_VALUE),
            ),
            height: length_percentage_from_type_value(
                get_style_data_i32(self.data(), StyleKeys::GAP_COLUMN_TYPE),
                get_style_data_f32(self.data(), StyleKeys::GAP_COLUMN_VALUE),
            ),
        }
    }

    pub fn set_gap(&mut self, value: Size<LengthPercentage>) {
        let gap_row = length_percentage_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i32(data, StyleKeys::GAP_ROW_TYPE, gap_row.0);
        set_style_data_f32(data, StyleKeys::GAP_ROW_VALUE, gap_row.1);

        let gap_column = length_percentage_to_type_value(value.height);

        set_style_data_i32(data, StyleKeys::GAP_COLUMN_TYPE, gap_column.0);
        set_style_data_f32(data, StyleKeys::GAP_COLUMN_VALUE, gap_column.1);
    }

    pub fn get_align_items(&self) -> Option<AlignItems> {
        let value = get_style_data_i32(self.data(), StyleKeys::ALIGN_ITEMS);
        align_items_from_enum(value)
    }

    pub fn set_align_items(&mut self, value: Option<AlignItems>) {
        let align = match value {
            Some(value) => align_items_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::ALIGN_ITEMS, align);
    }

    pub fn get_align_self(&self) -> Option<AlignSelf> {
        let value = get_style_data_i32(self.data(), StyleKeys::ALIGN_SELF);
        align_self_from_enum(value)
    }

    pub fn set_align_self(&mut self, value: Option<AlignSelf>) {
        let align = match value {
            Some(value) => align_self_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::ALIGN_SELF, align);
    }

    pub fn get_align_content(&self) -> Option<AlignContent> {
        let value = get_style_data_i32(self.data(), StyleKeys::ALIGN_CONTENT);
        align_content_from_enum(value)
    }

    pub fn set_align_content(&mut self, value: Option<AlignContent>) {
        let align = match value {
            Some(value) => align_content_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::ALIGN_CONTENT, align);
    }

    pub fn get_justify_items(&self) -> Option<JustifyItems> {
        let value = get_style_data_i32(self.data(), StyleKeys::JUSTIFY_ITEMS);
        align_items_from_enum(value)
    }

    pub fn set_justify_items(&mut self, value: Option<JustifyItems>) {
        let align = match value {
            Some(value) => align_items_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::JUSTIFY_ITEMS, align);
    }

    pub fn get_justify_self(&self) -> Option<JustifySelf> {
        let value = get_style_data_i32(self.data(), StyleKeys::JUSTIFY_SELF);
        align_self_from_enum(value)
    }

    pub fn set_justify_self(&mut self, value: Option<JustifySelf>) {
        let align = match value {
            Some(value) => align_self_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::JUSTIFY_SELF, align);
    }

    pub fn get_justify_content(&self) -> Option<JustifyContent> {
        let value = get_style_data_i32(self.data(), StyleKeys::JUSTIFY_CONTENT);
        align_content_from_enum(value)
    }

    pub fn set_justify_content(&mut self, value: Option<JustifyContent>) {
        let align = match value {
            Some(value) => align_content_to_enum(value),
            None => -1,
        };
        set_style_data_i32(self.data_mut(), StyleKeys::JUSTIFY_CONTENT, align);
    }

    pub fn get_text_align(&self) -> TextAlign {
        text_align_from_enum(get_style_data_i32(self.data(), StyleKeys::TEXT_ALIGN)).unwrap()
    }

    pub fn set_text_align(&mut self, value: TextAlign) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::TEXT_ALIGN,
            text_align_to_enum(value),
        )
    }

    pub fn get_flex_direction(&self) -> FlexDirection {
        flex_direction_from_enum(get_style_data_i32(self.data(), StyleKeys::FLEX_DIRECTION))
            .unwrap()
    }

    pub fn set_flex_direction(&mut self, value: FlexDirection) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::FLEX_DIRECTION,
            flex_direction_to_enum(value),
        )
    }

    pub fn get_flex_wrap(&self) -> FlexWrap {
        flex_wrap_from_enum(get_style_data_i32(self.data(), StyleKeys::FLEX_WRAP)).unwrap()
    }

    pub fn set_flex_wrap(&mut self, value: FlexWrap) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::FLEX_WRAP,
            flex_wrap_to_enum(value),
        )
    }

    pub fn get_flex_grow(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::FLEX_GROW)
    }

    pub fn set_flex_grow(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::FLEX_GROW, value)
    }

    pub fn get_flex_shrink(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::FLEX_SHRINK)
    }

    pub fn set_flex_shrink(&mut self, value: f32) {
        set_style_data_f32(self.data_mut(), StyleKeys::FLEX_SHRINK, value)
    }

    pub fn get_flex_basis(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i32(self.data(), StyleKeys::FLEX_BASIS_TYPE),
            get_style_data_f32(self.data(), StyleKeys::FLEX_BASIS_VALUE),
        )
    }

    pub fn set_flex_basis(&mut self, value: Dimension) {
        let basis = dimension_to_type_value(value);

        let data = self.data_mut();
        set_style_data_i32(data, StyleKeys::FLEX_BASIS_TYPE, basis.0);
        set_style_data_f32(data, StyleKeys::FLEX_BASIS_VALUE, basis.1);
    }

    pub fn get_grid_auto_flow(&self) -> GridAutoFlow {
        grid_auto_flow_from_enum(get_style_data_i32(self.data(), StyleKeys::GRID_AUTO_FLOW))
            .unwrap()
    }

    pub fn set_grid_auto_flow(&mut self, value: GridAutoFlow) {
        set_style_data_i32(
            self.data_mut(),
            StyleKeys::GRID_AUTO_FLOW,
            grid_auto_flow_to_enum(value),
        )
    }

    pub(crate) fn resolve_grid_area_from_template_areas(
        &mut self,
        template_areas: &[GridTemplateArea<Atom>],
    ) {
        if let Some(name) = &self.grid_area {
            if let Some(area) = template_areas.iter().find(|a| &a.name == name) {
                // Grid lines in Taffy use 1-based indexing (CSS Grid standard)
                // But area indices are 0-based, so add 1
                self.grid_row_start = GridPlacement::from_line_index((area.row_start + 1) as i16);
                self.grid_row_end = GridPlacement::from_line_index((area.row_end + 1) as i16);
                self.grid_column_start =
                    GridPlacement::from_line_index((area.column_start + 1) as i16);
                self.grid_column_end = GridPlacement::from_line_index((area.column_end + 1) as i16);
            }
        }
    }

    pub fn get_grid_name(&self) -> Option<&str> {
        self.grid_area.as_deref()
    }

    pub fn set_grid_area<T>(&mut self, name: T)
    where
        T: Into<Atom>,
    {
        let area = name.into();
        let name = area.trim();
        if name.is_empty() {
            self.grid_row_start = GridPlacement::Auto;
            self.grid_row_end = GridPlacement::Auto;
            self.grid_column_start = GridPlacement::Auto;
            self.grid_column_end = GridPlacement::Auto;
            self.grid_area = None;
            return;
        }

        if !area.contains('/') {
            let name: Atom = name.into();
            let start = GridPlacement::NamedLine(name.clone(), 0);
            let end = GridPlacement::NamedLine(name, 0);
            self.grid_row_start = start.clone();
            self.grid_row_end = end.clone();
            self.grid_column_start = start;
            self.grid_column_end = end;
            self.grid_area = Some(area);
            return;
        }

        let value = crate::utils::parse_grid_area(area.as_ref());
        if let Ok(value) = value {
            self.grid_row_start = value.row_start;
            self.grid_row_end = value.row_end;
            self.grid_column_start = value.column_start;
            self.grid_column_end = value.column_end;

            self.grid_area = crate::utils::get_grid_area(
                Line {
                    start: self.grid_row_start.clone(),
                    end: self.grid_row_end.clone(),
                },
                Line {
                    start: self.grid_column_start.clone(),
                    end: self.grid_column_end.clone(),
                },
            )
            .map(Atom::from);
        }
    }

    pub(crate) fn reset_grid_area(&mut self) {
        self.grid_row_start = GridPlacement::Auto;
        self.grid_row_end = GridPlacement::Auto;
        self.grid_column_start = GridPlacement::Auto;
        self.grid_column_end = GridPlacement::Auto;

        self.grid_area = None;
    }

    pub fn get_grid_row(&self) -> Line<GridPlacement<Atom>> {
        Line {
            start: self.grid_row_start.clone(),
            end: self.grid_row_end.clone(),
        }
    }
    pub fn set_grid_row(&mut self, value: Line<GridPlacement<Atom>>) {
        self.grid_row_start = value.start;
        self.grid_row_end = value.end;
    }
    pub fn set_grid_row_start(&mut self, value: GridPlacement<Atom>) {
        self.grid_row_start = value;
    }
    pub fn get_grid_row_css(&self) -> Option<String> {
        crate::utils::to_line_css(&self.grid_row_start, &self.grid_row_end)
    }
    pub fn set_grid_row_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_row_start = GridPlacement::Auto;
            self.grid_row_end = GridPlacement::Auto;
        } else if let Ok(row) = crate::utils::parse_grid_placement_shorthand(value) {
            self.grid_row_start = row.0;
            self.grid_row_end = row.1;
        }
    }
    pub fn get_grid_row_start_css(&self) -> String {
        crate::utils::grid_placement_to_string(&self.grid_row_start)
    }
    pub fn set_grid_row_start_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_row_start = GridPlacement::Auto;
        } else if let Ok(start) =
            crate::utils::parse_grid_placement(value, crate::utils::StartOrEnd::Start)
        {
            self.grid_row_start = start;
        }
    }
    pub fn set_grid_row_end(&mut self, value: GridPlacement<Atom>) {
        self.grid_row_end = value;
    }
    pub fn set_grid_row_end_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_row_end = GridPlacement::Auto;
        } else if let Ok(start) =
            crate::utils::parse_grid_placement(value, crate::utils::StartOrEnd::End)
        {
            self.grid_row_end = start;
        }
    }

    pub fn get_grid_row_end_css(&self) -> String {
        crate::utils::grid_placement_to_string(&self.grid_row_end)
    }

    pub fn get_grid_column(&self) -> Line<GridPlacement<Atom>> {
        Line {
            start: self.grid_column_start.clone(),
            end: self.grid_column_end.clone(),
        }
    }

    pub fn get_grid_column_start_css(&self) -> String {
        crate::utils::grid_placement_to_string(&self.grid_column_start)
    }
    pub fn get_grid_column_end_css(&self) -> String {
        crate::utils::grid_placement_to_string(&self.grid_column_end)
    }

    pub fn get_grid_column_css(&self) -> Option<String> {
        crate::utils::to_line_css(&self.grid_column_start, &self.grid_column_end)
    }

    pub fn set_grid_column(&mut self, value: Line<GridPlacement<Atom>>) {
        self.grid_column_start = value.start;
        self.grid_column_end = value.end;
    }

    pub fn set_grid_column_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_column_start = GridPlacement::Auto;
            self.grid_column_end = GridPlacement::Auto;
        } else if let Ok(col) = crate::utils::parse_grid_placement_shorthand(value) {
            self.grid_column_start = col.0;
            self.grid_column_end = col.1;
        }
    }

    pub fn set_grid_column_start(&mut self, value: GridPlacement<Atom>) {
        self.grid_column_start = value;
    }
    pub fn set_grid_column_start_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_column_start = GridPlacement::Auto;
        } else if let Ok(start) =
            crate::utils::parse_grid_placement(value, crate::utils::StartOrEnd::Start)
        {
            self.grid_column_start = start;
        }
    }

    pub fn set_grid_column_end(&mut self, value: GridPlacement<Atom>) {
        self.grid_column_end = value;
    }
    pub fn set_grid_column_end_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_column_end = GridPlacement::Auto;
        } else if let Ok(start) =
            crate::utils::parse_grid_placement(value, crate::utils::StartOrEnd::End)
        {
            self.grid_column_end = start;
        }
    }

    pub fn set_grid_template_rows_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_template_rows = vec![];
            self.grid_template_rows_raw = None;
        } else if let Ok(template) =
            crate::utils::parse_grid_template(value, self.get_device_scale())
        {
            self.grid_template_rows = template.0;
            self.grid_template_row_names = template.1;
            self.grid_template_rows_raw = Some(Atom::from(value));
        }
    }
    pub fn set_grid_template_rows(&mut self, value: Option<Vec<GridTemplateComponent<Atom>>>) {
        self.grid_template_rows = value.unwrap_or_default()
    }

    pub fn set_grid_template_columns_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_template_columns = vec![];
            self.grid_template_columns_raw = None;
        } else if let Ok(template) =
            crate::utils::parse_grid_template(value, self.get_device_scale())
        {
            self.grid_template_columns = template.0;
            self.grid_template_column_names = template.1;
            self.grid_template_columns_raw = Some(Atom::from(value));
        }
    }
    pub fn set_grid_template_columns(&mut self, value: Option<Vec<GridTemplateComponent<Atom>>>) {
        self.grid_template_columns = value.unwrap_or_default()
    }

    pub fn set_grid_auto_rows_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_auto_rows_raw = None;
            self.grid_auto_rows = vec![];
        } else if let Ok(tracks) =
            crate::utils::parse_grid_auto_tracks(value, self.get_device_scale())
        {
            self.grid_auto_rows_raw = Some(Atom::from(value));
            self.grid_auto_rows = tracks
        }
    }

    pub fn set_grid_auto_rows(&mut self, value: Vec<TrackSizingFunction>) {
        self.grid_auto_rows = value
    }

    pub fn set_grid_auto_columns_css(&mut self, value: &str) {
        if value.is_empty() {
            self.grid_auto_columns_raw = None;
            self.grid_auto_columns = vec![];
        } else if let Ok(tracks) =
            crate::utils::parse_grid_auto_tracks(value, self.get_device_scale())
        {
            self.grid_auto_columns_raw = Some(Atom::from(value));
            self.grid_auto_columns = tracks
        }
    }

    pub fn set_grid_auto_columns(&mut self, value: Vec<TrackSizingFunction>) {
        self.grid_auto_columns = value
    }

    pub fn get_grid_template_rows(&self) -> &[GridTemplateComponent<Atom>] {
        self.grid_template_rows.as_slice()
    }

    pub fn get_grid_template_rows_css(&self) -> Option<&str> {
        self.grid_template_rows_raw.as_deref()
    }

    #[inline(always)]
    pub fn grid_template_row_names(&self) -> &[Vec<Atom>] {
        self.grid_template_row_names.deref()
    }

    #[inline(always)]
    pub fn get_grid_template_columns(&self) -> &[GridTemplateComponent<Atom>] {
        self.grid_template_columns.as_slice()
    }

    #[inline(always)]
    pub fn get_grid_template_columns_css(&self) -> Option<&str> {
        self.grid_template_columns_raw.as_deref()
    }

    #[inline(always)]
    pub fn grid_template_column_names(&self) -> &[Vec<Atom>] {
        self.grid_template_column_names.deref()
    }

    #[inline(always)]
    pub fn get_grid_auto_rows(&self) -> &[TrackSizingFunction] {
        self.grid_auto_rows.as_slice()
    }

    #[inline(always)]
    pub fn get_grid_auto_rows_css(&self) -> Option<&str> {
        self.grid_auto_rows_raw.as_deref()
    }

    #[inline(always)]
    pub fn get_grid_auto_columns(&self) -> &[TrackSizingFunction] {
        self.grid_auto_columns.as_slice()
    }

    #[inline(always)]
    pub fn get_grid_auto_columns_css(&self) -> Option<&str> {
        self.grid_auto_columns_raw.as_deref()
    }

    pub fn get_grid_template_areas(&self) -> &[GridTemplateArea<Atom>] {
        self.grid_template_areas.as_slice()
    }

    pub fn get_grid_template_areas_css(&self) -> &str {
        self.grid_template_areas_raw.as_ref()
    }

    pub fn set_grid_template_areas(&mut self, value: Vec<GridTemplateArea<Atom>>) {
        self.grid_template_areas_raw = Atom::from(crate::utils::grid_template_areas_to_string(
            value.as_slice(),
        ));
        self.grid_template_areas = value;
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn buffer(&self) -> Retained<NSMutableData> {
        self.buffer.clone()
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn buffer_raw(&self) -> *mut std::os::raw::c_void {
        Retained::into_raw(self.buffer.clone()) as *mut std::os::raw::c_void
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self) -> jni::objects::GlobalRef {
        self.buffer.clone()
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn set_buffer(&mut self, buffer: jni::objects::GlobalRef) {
        self.buffer = buffer;
    }

    pub fn raw(&self) -> (*const u8, usize) {
        (self.raw_data, self.raw_data_len)
    }

    pub fn raw_mut(&mut self) -> (*mut u8, usize) {
        (self.raw_data, self.raw_data_len)
    }
}

impl Default for Style {
    fn default() -> Self {
        Self::new()
    }
}

impl CoreStyle for Style {
    type CustomIdent = Atom;

    #[inline(always)]
    fn box_generation_mode(&self) -> BoxGenerationMode {
        match self.get_display() {
            Display::None => BoxGenerationMode::None,
            _ => BoxGenerationMode::Normal,
        }
    }
    #[inline(always)]
    fn is_block(&self) -> bool {
        matches!(self.get_display(), Display::Block)
    }

    #[inline(always)]
    fn is_compressible_replaced(&self) -> bool {
        self.get_item_is_replaced()
    }

    #[inline(always)]
    fn box_sizing(&self) -> BoxSizing {
        self.get_box_sizing()
    }

    #[inline(always)]
    fn overflow(&self) -> Point<taffy::Overflow> {
        let flow = self.get_overflow();
        Point {
            x: flow.x.into(),
            y: flow.y.into(),
        }
    }

    #[inline(always)]
    fn scrollbar_width(&self) -> f32 {
        self.get_scrollbar_width()
    }

    #[inline(always)]
    fn position(&self) -> Position {
        self.get_position()
    }
    #[inline(always)]
    fn inset(&self) -> Rect<LengthPercentageAuto> {
        self.get_inset()
    }

    #[inline(always)]
    fn size(&self) -> Size<Dimension> {
        self.get_size()
    }

    #[inline(always)]
    fn min_size(&self) -> Size<Dimension> {
        self.get_min_size()
    }

    #[inline(always)]
    fn max_size(&self) -> Size<Dimension> {
        self.get_max_size()
    }

    #[inline(always)]
    fn aspect_ratio(&self) -> Option<f32> {
        self.get_aspect_ratio()
    }

    #[inline(always)]
    fn margin(&self) -> Rect<LengthPercentageAuto> {
        self.get_margin()
    }

    #[inline(always)]
    fn padding(&self) -> Rect<LengthPercentage> {
        self.get_padding()
    }
    #[inline(always)]
    fn border(&self) -> Rect<LengthPercentage> {
        self.get_border()
    }
}

impl BlockContainerStyle for Style {
    #[inline(always)]
    fn text_align(&self) -> TextAlign {
        self.get_text_align()
    }
}

impl BlockItemStyle for Style {
    #[inline(always)]
    fn is_table(&self) -> bool {
        self.get_item_is_table()
    }
}

impl FlexboxContainerStyle for Style {
    #[inline(always)]
    fn flex_direction(&self) -> FlexDirection {
        self.get_flex_direction()
    }

    #[inline(always)]
    fn flex_wrap(&self) -> FlexWrap {
        self.get_flex_wrap()
    }

    #[inline(always)]
    fn gap(&self) -> Size<LengthPercentage> {
        self.get_gap()
    }

    #[inline(always)]
    fn align_content(&self) -> Option<AlignContent> {
        self.get_align_content()
    }

    #[inline(always)]
    fn align_items(&self) -> Option<AlignItems> {
        self.get_align_items()
    }

    #[inline(always)]
    fn justify_content(&self) -> Option<JustifyContent> {
        self.get_justify_content()
    }
}

impl FlexboxItemStyle for Style {
    #[inline(always)]
    fn flex_basis(&self) -> Dimension {
        self.get_flex_basis()
    }

    #[inline(always)]
    fn flex_grow(&self) -> f32 {
        self.get_flex_grow()
    }

    #[inline(always)]
    fn flex_shrink(&self) -> f32 {
        self.get_flex_shrink()
    }

    #[inline(always)]
    fn align_self(&self) -> Option<AlignSelf> {
        self.get_align_self()
    }
}

impl GridContainerStyle for Style {
    type Repetition<'a>
        = &'a GridTemplateRepetition<Atom>
    where
        Self: 'a;

    type TemplateTrackList<'a>
        = core::iter::Map<
        core::slice::Iter<'a, GridTemplateComponent<Atom>>,
        fn(
            &'a GridTemplateComponent<Atom>,
        ) -> GenericGridTemplateComponent<Atom, &'a GridTemplateRepetition<Atom>>,
    >
    where
        Self: 'a;

    type AutoTrackList<'a>
        = core::iter::Copied<core::slice::Iter<'a, TrackSizingFunction>>
    where
        Self: 'a;
    type TemplateLineNames<'a>
        = core::iter::Map<
        core::slice::Iter<'a, Vec<Atom>>,
        fn(&Vec<Atom>) -> core::slice::Iter<'_, Atom>,
    >
    where
        Self: 'a;

    type GridTemplateAreas<'a>
        = core::iter::Cloned<core::slice::Iter<'a, GridTemplateArea<Atom>>>
    where
        Self: 'a;

    #[inline(always)]
    fn grid_template_rows(&self) -> Option<Self::TemplateTrackList<'_>> {
        Some(
            self.grid_template_rows
                .iter()
                .map(|value| value.as_component_ref()),
        )
    }

    #[inline(always)]
    fn grid_template_columns(&self) -> Option<Self::TemplateTrackList<'_>> {
        Some(
            self.grid_template_columns
                .iter()
                .map(|value| value.as_component_ref()),
        )
    }

    #[inline(always)]
    fn grid_auto_rows(&self) -> Self::AutoTrackList<'_> {
        self.grid_auto_rows.iter().copied()
    }

    #[inline(always)]
    fn grid_auto_columns(&self) -> Self::AutoTrackList<'_> {
        self.grid_auto_columns.iter().copied()
    }

    #[inline(always)]
    fn grid_template_areas(&self) -> Option<Self::GridTemplateAreas<'_>> {
        Some(self.grid_template_areas.iter().cloned())
    }

    #[inline(always)]
    fn grid_template_column_names(&self) -> Option<Self::TemplateLineNames<'_>> {
        Some(
            self.grid_template_column_names
                .iter()
                .map(|names| names.iter()),
        )
    }

    #[inline(always)]
    fn grid_template_row_names(&self) -> Option<Self::TemplateLineNames<'_>> {
        Some(
            self.grid_template_row_names
                .iter()
                .map(|names| names.iter()),
        )
    }

    #[inline(always)]
    fn grid_auto_flow(&self) -> GridAutoFlow {
        self.get_grid_auto_flow()
    }

    #[inline(always)]
    fn gap(&self) -> Size<LengthPercentage> {
        self.get_gap()
    }

    #[inline(always)]
    fn align_content(&self) -> Option<AlignContent> {
        self.get_align_content()
    }

    #[inline(always)]
    fn justify_content(&self) -> Option<JustifyContent> {
        self.get_justify_content()
    }

    #[inline(always)]
    fn align_items(&self) -> Option<AlignItems> {
        self.get_align_items()
    }

    #[inline(always)]
    fn justify_items(&self) -> Option<AlignItems> {
        self.get_justify_items()
    }

    #[inline(always)]
    fn grid_template_tracks(&self, axis: AbsoluteAxis) -> Option<Self::TemplateTrackList<'_>> {
        match axis {
            AbsoluteAxis::Horizontal => self.grid_template_columns(),
            AbsoluteAxis::Vertical => self.grid_template_rows(),
        }
    }

    #[inline(always)]
    fn grid_align_content(&self, axis: AbstractAxis) -> AlignContent {
        match axis {
            AbstractAxis::Inline => self.get_justify_content().unwrap_or(AlignContent::Stretch),
            AbstractAxis::Block => self.get_align_content().unwrap_or(AlignContent::Stretch),
        }
    }
}

impl GridItemStyle for Style {
    #[inline(always)]
    fn grid_row(&self) -> Line<GridPlacement<Atom>> {
        self.get_grid_row()
    }

    #[inline(always)]
    fn grid_column(&self) -> Line<GridPlacement<Atom>> {
        self.get_grid_column()
    }

    #[inline(always)]
    fn align_self(&self) -> Option<AlignSelf> {
        self.get_align_self()
    }

    #[inline(always)]
    fn justify_self(&self) -> Option<AlignSelf> {
        self.get_justify_self()
    }

    #[inline(always)]
    fn grid_placement(&self, axis: AbsoluteAxis) -> Line<GridPlacement<Atom>> {
        match axis {
            AbsoluteAxis::Horizontal => self.grid_column(),
            AbsoluteAxis::Vertical => self.grid_row(),
        }
    }
}
