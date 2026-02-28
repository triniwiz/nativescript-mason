use crate::style::utils::{
    dimension_from_type_value, dimension_to_type_value, get_style_data_bool, get_style_data_f32,
    get_style_data_i8, get_style_data_u8, length_percentage_auto_from_type_value,
    length_percentage_auto_to_type_value, length_percentage_from_type_value,
    length_percentage_to_type_value, set_style_data_bool, set_style_data_f32, set_style_data_i8,
    set_style_data_u8,
};
use crate::utils::{
    align_content_from_enum, align_content_to_enum, align_items_from_enum, align_items_to_enum,
    align_self_from_enum, align_self_to_enum, boxing_size_from_enum, boxing_size_to_enum,
    clear_from_enum, clear_to_enum, display_from_enum, display_mode_from_enum,
    display_mode_to_enum, display_to_enum, flex_direction_from_enum, flex_direction_to_enum,
    flex_wrap_from_enum, flex_wrap_to_enum, float_from_enum, float_to_enum,
    grid_auto_flow_from_enum, grid_auto_flow_to_enum, object_to_enum, overflow_from_enum,
    overflow_to_enum, position_from_enum, position_to_enum, text_align_from_enum,
    text_align_to_enum,
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

use crate::style::arena::{StyleArena, StyleHandle, STYLE_BUFFER_SIZE};
use std::fmt::{Debug, Formatter};
use std::ops::Deref;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use style_atoms::Atom;
use taffy::prelude::TaffyGridLine;
use taffy::{
    AbsoluteAxis, AbstractAxis, AlignContent, AlignItems, AlignSelf, BlockContainerStyle,
    BlockItemStyle, BoxGenerationMode, BoxSizing, Clear, CoreStyle, Dimension, Display,
    FlexDirection, FlexWrap, FlexboxContainerStyle, FlexboxItemStyle, Float,
    GenericGridTemplateComponent, GridAutoFlow, GridContainerStyle, GridItemStyle, GridPlacement,
    GridTemplateArea, GridTemplateComponent, GridTemplateRepetition, JustifyContent, JustifyItems,
    JustifySelf, LengthPercentage, LengthPercentageAuto, Line, Point, Position, Rect, Size,
    TextAlign, TrackSizingFunction,
};

pub mod arena;
pub mod debug;
pub mod style_guard;
pub mod utils;

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub enum ListStylePosition {
    #[default]
    Outside,
    Inside,
}

impl std::fmt::Display for ListStylePosition {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ListStylePosition::Outside => write!(f, "outside"),
            ListStylePosition::Inside => write!(f, "inside"),
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Debug, Default)]
pub enum BorderStyle {
    #[default]
    None,
    Hidden,
    Dotted,
    Dashed,
    Solid,
    Double,
    Groove,
    Ridge,
    Inset,
    Outset,
}

impl std::fmt::Display for BorderStyle {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            BorderStyle::None => write!(f, "none"),
            BorderStyle::Hidden => write!(f, "hidden"),
            BorderStyle::Dotted => write!(f, "dotted"),
            BorderStyle::Dashed => write!(f, "dashed"),
            BorderStyle::Solid => write!(f, "solid"),
            BorderStyle::Double => write!(f, "double"),
            BorderStyle::Groove => write!(f, "groove"),
            BorderStyle::Ridge => write!(f, "ridge"),
            BorderStyle::Inset => write!(f, "inset"),
            BorderStyle::Outset => write!(f, "outset"),
        }
    }
}

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
    ListItem,
}

impl std::fmt::Display for DisplayMode {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            DisplayMode::None => write!(f, "NONE"),
            DisplayMode::Inline => write!(f, "INLINE"),
            DisplayMode::Box => write!(f, "BOX"),
            DisplayMode::ListItem => write!(f, "LIST-ITEM"),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Default)]
pub enum ObjectFit {
    Contain,
    Cover,
    #[default]
    Fill,
    None,
    ScaleDown,
}

impl std::fmt::Display for ObjectFit {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ObjectFit::Contain => write!(f, "container"),
            ObjectFit::Cover => write!(f, "cover"),
            ObjectFit::Fill => write!(f, "fill"),
            ObjectFit::None => write!(f, "none"),
            ObjectFit::ScaleDown => write!(f, "scale-down"),
        }
    }
}

// Add to your style module

/// Font metrics for text layout and vertical alignment
#[derive(Clone, Copy, Debug, Default, PartialEq)]
#[repr(C)]
pub struct FontMetrics {
    /// Distance from baseline to top of tallest glyph (positive value)
    pub ascent: f32,
    /// Distance from baseline to bottom of lowest glyph (positive value)
    pub descent: f32,
    /// Height of lowercase 'x' (used for middle alignment)
    pub x_height: f32,
    /// Leading (extra space between lines)
    pub leading: f32,
    /// Cap height (height of capital letters)
    pub cap_height: f32,
}

impl FontMetrics {
    pub const NONE: Self = Self {
        ascent: 0.0,
        descent: 0.0,
        x_height: 0.0,
        leading: 0.0,
        cap_height: 0.0,
    };

    /// Default metrics approximating a 16px system font
    pub const DEFAULT: Self = Self {
        ascent: 14.0,
        descent: 4.0,
        x_height: 7.0,
        leading: 0.0,
        cap_height: 10.0,
    };

    pub fn new(ascent: f32, descent: f32) -> Self {
        Self {
            ascent,
            descent,
            x_height: if ascent > 0.0 { ascent * 0.5 } else { 0.0 },
            leading: 0.0,
            cap_height: if ascent > 0.0 { ascent * 0.7 } else { 0.0 },
        }
    }

    pub fn with_full_metrics(
        ascent: f32,
        descent: f32,
        x_height: f32,
        leading: f32,
        cap_height: f32,
    ) -> Self {
        Self {
            ascent,
            descent,
            x_height: if x_height > 0.0 {
                x_height
            } else if ascent > 0.0 {
                ascent * 0.5
            } else {
                0.0
            },
            leading,
            cap_height: if cap_height > 0.0 {
                cap_height
            } else if ascent > 0.0 {
                ascent * 0.7
            } else {
                0.0
            },
        }
    }

    /// Total line height (ascent + descent + leading)
    #[inline]
    pub fn line_height(&self) -> f32 {
        self.ascent + self.descent + self.leading
    }

    /// Check if metrics are set (non-zero)
    #[inline]
    pub fn is_set(&self) -> bool {
        self.ascent > 0.0 || self.descent > 0.0
    }

    /// Get metrics or default if not set
    #[inline]
    pub fn or_default(self) -> Self {
        if self.is_set() {
            self
        } else {
            Self::DEFAULT
        }
    }

    /// Get the baseline position from top of a single line of text
    /// This is the ascent value
    #[inline]
    pub fn baseline_from_top(&self) -> f32 {
        self.ascent
    }

    /// Get the baseline position from bottom of a single line of text
    /// This is the descent value
    #[inline]
    pub fn baseline_from_bottom(&self) -> f32 {
        self.descent
    }
}

/// Vertical alignment mode for inline items
#[derive(Clone, Copy, Debug, Default, PartialEq)]
#[repr(u8)]
pub enum VerticalAlign {
    /// Align to text baseline
    #[default]
    Baseline = 0,
    /// Align top of element with top of line box
    Top = 1,
    /// Align top of element with top of parent's font
    TextTop = 2,
    /// Align middle of element with baseline + half x-height
    Middle = 3,
    /// Align bottom of element with bottom of line box
    Bottom = 4,
    /// Align bottom of element with bottom of parent's font
    TextBottom = 5,
    /// Subscript alignment (lowered)
    Sub = 6,
    /// Superscript alignment (raised)
    Super = 7,
}

/// Vertical alignment with optional length/percent offset
#[derive(Clone, Copy, Debug, Default, PartialEq)]
#[repr(C)]
pub struct VerticalAlignValue {
    pub align: VerticalAlign,
    /// Offset value (used when align is Length or Percent mode)
    /// For baseline: positive = up, negative = down
    pub offset: f32,
    /// If true, offset is percentage of line-height; otherwise pixels
    pub is_percent: bool,
}

impl VerticalAlignValue {
    pub const BASELINE: Self = Self {
        align: VerticalAlign::Baseline,
        offset: 0.0,
        is_percent: false,
    };
    pub const TOP: Self = Self {
        align: VerticalAlign::Top,
        offset: 0.0,
        is_percent: false,
    };
    pub const MIDDLE: Self = Self {
        align: VerticalAlign::Middle,
        offset: 0.0,
        is_percent: false,
    };
    pub const BOTTOM: Self = Self {
        align: VerticalAlign::Bottom,
        offset: 0.0,
        is_percent: false,
    };
    pub const TEXT_TOP: Self = Self {
        align: VerticalAlign::TextTop,
        offset: 0.0,
        is_percent: false,
    };
    pub const TEXT_BOTTOM: Self = Self {
        align: VerticalAlign::TextBottom,
        offset: 0.0,
        is_percent: false,
    };
    pub const SUB: Self = Self {
        align: VerticalAlign::Sub,
        offset: 0.0,
        is_percent: false,
    };
    pub const SUPER: Self = Self {
        align: VerticalAlign::Super,
        offset: 0.0,
        is_percent: false,
    };

    pub fn length(offset: f32) -> Self {
        Self {
            align: VerticalAlign::Baseline,
            offset,
            is_percent: false,
        }
    }

    pub fn percent(offset: f32) -> Self {
        Self {
            align: VerticalAlign::Baseline,
            offset,
            is_percent: true,
        }
    }
}

impl std::fmt::Display for VerticalAlignValue {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        if self.is_percent {
            return write!(f, "{:?}%", self.offset * 100.0);
        }
        if self.offset > 0. {
            return write!(f, "{:?}px", self.offset);
        }
        match self.align {
            VerticalAlign::Baseline => write!(f, "baseline"),
            VerticalAlign::Sub => write!(f, "sub"),
            VerticalAlign::Super => write!(f, "super"),
            VerticalAlign::Top => write!(f, "top"),
            VerticalAlign::TextTop => write!(f, "text-top"),
            VerticalAlign::Middle => write!(f, "middle"),
            VerticalAlign::Bottom => write!(f, "bottom"),
            VerticalAlign::TextBottom => write!(f, "text-bottom"),
        }
    }
}

#[repr(usize)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[allow(non_camel_case_types)]
pub enum StyleKeys {
    DISPLAY = 0,
    POSITION = 1,
    DIRECTION = 2,
    FLEX_DIRECTION = 3,
    FLEX_WRAP = 4,
    OVERFLOW_X = 5,
    OVERFLOW_Y = 6,

    ALIGN_ITEMS = 7,
    ALIGN_SELF = 8,
    ALIGN_CONTENT = 9,

    JUSTIFY_ITEMS = 10,
    JUSTIFY_SELF = 11,
    JUSTIFY_CONTENT = 12,

    INSET_LEFT_TYPE = 13,
    INSET_LEFT_VALUE = 14, // float (4 bytes: 14-17)
    INSET_RIGHT_TYPE = 18,
    INSET_RIGHT_VALUE = 19, // float (4 bytes: 19-22)
    INSET_TOP_TYPE = 23,
    INSET_TOP_VALUE = 24, // float (4 bytes: 24-27)
    INSET_BOTTOM_TYPE = 28,
    INSET_BOTTOM_VALUE = 29, // float (4 bytes: 29-32)

    MARGIN_LEFT_TYPE = 33,
    MARGIN_LEFT_VALUE = 34, // float (4 bytes: 34-37)
    MARGIN_RIGHT_TYPE = 38,
    MARGIN_RIGHT_VALUE = 39, // float (4 bytes: 39-42)
    MARGIN_TOP_TYPE = 43,
    MARGIN_TOP_VALUE = 44, // float (4 bytes: 44-47)
    MARGIN_BOTTOM_TYPE = 48,
    MARGIN_BOTTOM_VALUE = 49, // float (4 bytes: 49-52)

    PADDING_LEFT_TYPE = 53,
    PADDING_LEFT_VALUE = 54, // float (4 bytes: 54-57)
    PADDING_RIGHT_TYPE = 58,
    PADDING_RIGHT_VALUE = 59, // float (4 bytes: 59-62)
    PADDING_TOP_TYPE = 63,
    PADDING_TOP_VALUE = 64, // float (4 bytes: 64-67)
    PADDING_BOTTOM_TYPE = 68,
    PADDING_BOTTOM_VALUE = 69, // float (4 bytes: 69-72)

    BORDER_LEFT_TYPE = 73,
    BORDER_LEFT_VALUE = 74, // float (4 bytes: 74-77)
    BORDER_RIGHT_TYPE = 78,
    BORDER_RIGHT_VALUE = 79, // float (4 bytes: 79-82)
    BORDER_TOP_TYPE = 83,
    BORDER_TOP_VALUE = 84, // float (4 bytes: 84-87)
    BORDER_BOTTOM_TYPE = 88,
    BORDER_BOTTOM_VALUE = 89, // float (4 bytes: 89-92)

    FLEX_GROW = 93,   // float (4 bytes: 93-96)
    FLEX_SHRINK = 97, // float (4 bytes: 97-100)

    FLEX_BASIS_TYPE = 101,
    FLEX_BASIS_VALUE = 102, // float (4 bytes: 102-105)

    WIDTH_TYPE = 106,
    WIDTH_VALUE = 107, // float (4 bytes: 107-110)
    HEIGHT_TYPE = 111,
    HEIGHT_VALUE = 112, // float (4 bytes: 112-115)

    MIN_WIDTH_TYPE = 116,
    MIN_WIDTH_VALUE = 117, // float (4 bytes: 117-120)
    MIN_HEIGHT_TYPE = 121,
    MIN_HEIGHT_VALUE = 122, // float (4 bytes: 122-125)

    MAX_WIDTH_TYPE = 126,
    MAX_WIDTH_VALUE = 127, // float (4 bytes: 127-130)
    MAX_HEIGHT_TYPE = 131,
    MAX_HEIGHT_VALUE = 132, // float (4 bytes: 132-135)

    GAP_ROW_TYPE = 136,
    GAP_ROW_VALUE = 137, // float (4 bytes: 137-140)
    GAP_COLUMN_TYPE = 141,
    GAP_COLUMN_VALUE = 142, // float (4 bytes: 142-145)

    ASPECT_RATIO = 146, // float (4 bytes: 146-149)
    GRID_AUTO_FLOW = 150,
    GRID_COLUMN_START_TYPE = 151,
    GRID_COLUMN_START_VALUE = 152, // float (4 bytes: 152-155)
    GRID_COLUMN_END_TYPE = 156,
    GRID_COLUMN_END_VALUE = 157, // float (4 bytes: 157-160)
    GRID_ROW_START_TYPE = 161,
    GRID_ROW_START_VALUE = 162, // float (4 bytes: 162-165)
    GRID_ROW_END_TYPE = 166,
    GRID_ROW_END_VALUE = 167, // float (4 bytes: 167-170)
    SCROLLBAR_WIDTH = 171,    // float (4 bytes: 171-174)
    TEXT_ALIGN = 175,
    BOX_SIZING = 176,
    OVERFLOW = 177,
    ITEM_IS_TABLE = 178,
    ITEM_IS_REPLACED = 179,
    DISPLAY_MODE = 180,
    FORCE_INLINE = 181,
    MIN_CONTENT_WIDTH = 182,  // float (4 bytes: 182-185)
    MIN_CONTENT_HEIGHT = 186, // float (4 bytes: 186-189)
    MAX_CONTENT_WIDTH = 190,  // float (4 bytes: 190-193)
    MAX_CONTENT_HEIGHT = 194, // float (4 bytes: 194-197)

    // ----------------------------
    // Border Style (per side)
    // ----------------------------
    BORDER_LEFT_STYLE = 198,
    BORDER_RIGHT_STYLE = 199,
    BORDER_TOP_STYLE = 200,
    BORDER_BOTTOM_STYLE = 201,

    // ----------------------------
    // Border Color (per side)
    // ----------------------------
    BORDER_LEFT_COLOR = 202,   // u32 (4 bytes: 202-205)
    BORDER_RIGHT_COLOR = 206,  // u32 (4 bytes: 206-209)
    BORDER_TOP_COLOR = 210,    // u32 (4 bytes: 210-213)
    BORDER_BOTTOM_COLOR = 214, // u32 (4 bytes: 214-217)

    // ============================================================
    // Border Radius (elliptical + squircle exponent)
    // Each corner = 5 fields (12 bytes total):
    //   x_type (1), x_value (4), y_type (1), y_value (4), exponent (4)
    // ============================================================

    // ----------------------------
    // Top-left corner (12 bytes)
    // ----------------------------
    BORDER_RADIUS_TOP_LEFT_X_TYPE = 218,
    BORDER_RADIUS_TOP_LEFT_X_VALUE = 219, // float (4 bytes: 219-222)
    BORDER_RADIUS_TOP_LEFT_Y_TYPE = 223,
    BORDER_RADIUS_TOP_LEFT_Y_VALUE = 224, // float (4 bytes: 224-227)
    BORDER_RADIUS_TOP_LEFT_EXPONENT = 228, // float (4 bytes: 228-231)

    // ----------------------------
    // Top-right corner
    // ----------------------------
    BORDER_RADIUS_TOP_RIGHT_X_TYPE = 232,
    BORDER_RADIUS_TOP_RIGHT_X_VALUE = 233, // float (4 bytes: 233-236)
    BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 237,
    BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238, // float (4 bytes: 238-241)
    BORDER_RADIUS_TOP_RIGHT_EXPONENT = 242, // float (4 bytes: 242-245)

    // ----------------------------
    // Bottom-right corner
    // ----------------------------
    BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 246,
    BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 247, // float (4 bytes: 247-250)
    BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 251,
    BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 252, // float (4 bytes: 252-255)
    BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 256, // float (4 bytes: 256-259)

    // ----------------------------
    // Bottom-left corner
    // ----------------------------
    BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 260,
    BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 261, // float (4 bytes: 261-264)
    BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 265,
    BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 266, // float (4 bytes: 266-269)
    BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270, // float (4 bytes: 270-273)

    // ----------------------------
    // Float
    // ----------------------------
    FLOAT = 274,
    CLEAR = 275,

    // ----------------------------
    // Object Fit
    // ----------------------------
    OBJECT_FIT = 276,

    FONT_METRICS_ASCENT_OFFSET = 277,     // float (4 bytes: 277-280)
    FONT_METRICS_DESCENT_OFFSET = 281,    // float (4 bytes: 281-284)
    FONT_METRICS_X_HEIGHT_OFFSET = 285,   // float (4 bytes: 285-288)
    FONT_METRICS_LEADING_OFFSET = 289,    // float (4 bytes: 289-292)
    FONT_METRICS_CAP_HEIGHT_OFFSET = 293, // float (4 bytes: 293-296)
    VERTICAL_ALIGN_OFFSET_OFFSET = 297,   // float (4 bytes: 297-300)
    VERTICAL_ALIGN_IS_PERCENT_OFFSET = 301,
    VERTICAL_ALIGN_ENUM_OFFSET = 302, // float (4 bytes: 302-305)
    FIRST_BASELINE_OFFSET = 306,      // float (4 bytes: 306-309)
    Z_INDEX = 310,                    // float (4 bytes: 310-313)
    ITEM_IS_LIST = 314,
    ITEM_IS_LIST_ITEM = 315,
    LIST_STYLE_POSITION = 316,
    LIST_STYLE_TYPE = 317,
    LIST_STYLE_POSITION_STATE = 318,
    LIST_STYLE_TYPE_STATE = 319,
    REF_COUNT = 320, // (4 bytes: 320- 324)
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
        const BORDER_STYLE    = 1 << 40;
        const BORDER_RADIUS    = 1 << 41;
        const BORDER_COLOR    = 1 << 42;
        const FLOAT = 1 << 43;
        const CLEAR = 1 << 44;
        const OBJECT_FIT = 1 << 45;
        const VERTICAL_ALIGN = 1 << 46;
    }
}

pub struct Style {
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
    pub(crate) device_scale: Option<Arc<AtomicU32>>,
    raw: *mut u8,
    arena: *mut StyleArena,
    pub(crate) handle: StyleHandle,
}

impl Clone for Style {
    fn clone(&self) -> Self {
        let arena = unsafe { &mut *self.arena };
        arena.retain(self.handle);
        Self {
            arena,
            raw: self.raw,
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
            grid_area: self.grid_area.clone(),
            grid_column_start: self.grid_column_start.clone(),
            grid_column_end: self.grid_column_end.clone(),
            grid_row_start: self.grid_row_start.clone(),
            grid_row_end: self.grid_row_end.clone(),
            device_scale: self.device_scale.clone(),
            handle: self.handle,
        }
    }
}

impl Drop for Style {
    fn drop(&mut self) {
        let arena = unsafe { &mut *self.arena };
        arena.release(self.handle)
    }
}

#[allow(clippy::not_unsafe_ptr_arg_deref)]
impl Style {
    pub fn prepare_mut(&mut self) {
        let arena = unsafe { &mut *self.arena };
        let (handle, raw) = arena.prepare_mut(self.handle);
        if handle != self.handle {
            self.raw = raw;
            self.handle = handle;
        }
    }

    #[inline(always)]
    pub fn is_inline(&self) -> bool {
        if self.force_inline() {
            return true;
        }
        let mode = get_style_data_i8(self.data(), StyleKeys::DISPLAY_MODE);
        matches!(mode, 1 | 2)
    }
    pub fn get_device_scale(&self) -> f32 {
        self.device_scale
            .as_ref()
            .map(|scale| f32::from_bits(scale.load(Ordering::Acquire)))
            .unwrap_or(1f32)
    }
    fn default_data() -> Vec<u8> {
        // last item + 4 bytes
        let mut buffer = vec![0_u8; STYLE_BUFFER_SIZE];
        Self::init_default_data(buffer.as_mut_slice());
        buffer
    }

    pub(crate) fn init_default_data(buffer: &mut [u8]) {
        buffer[StyleKeys::LIST_STYLE_TYPE as usize] = 2;

        {
            set_style_data_f32(buffer, StyleKeys::ASPECT_RATIO, f32::NAN);

            // default ratio to NAN
            set_style_data_f32(buffer, StyleKeys::ASPECT_RATIO, f32::NAN);
            // default shrink to 1
            set_style_data_f32(buffer, StyleKeys::FLEX_SHRINK, 1.);

            set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_TOP_LEFT_EXPONENT, 1.);
            set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1.);
            set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1.);
            set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1.);

            // Default font metrics

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_ASCENT_OFFSET, 14.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_DESCENT_OFFSET, 4.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_X_HEIGHT_OFFSET, 7.);

            // default is zero
            // set_style_data_f32(buffer, StyleKeys::FONT_METRICS_LEADING_OFFSET, 0.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_CAP_HEIGHT_OFFSET, 10.);

            set_style_data_f32(buffer, StyleKeys::FIRST_BASELINE_OFFSET, f32::NAN);
        }

        let int_slice =
            unsafe { std::slice::from_raw_parts_mut(buffer.as_mut_ptr() as *mut i8, buffer.len()) };

        int_slice[StyleKeys::OBJECT_FIT as usize] = object_to_enum(ObjectFit::Fill);

        int_slice[StyleKeys::DISPLAY as usize] = display_to_enum(Display::Block);

        // default Normal -> -1
        int_slice[StyleKeys::ALIGN_ITEMS as usize] = -1;

        int_slice[StyleKeys::ALIGN_SELF as usize] = -1;

        int_slice[StyleKeys::ALIGN_CONTENT as usize] = -1;

        int_slice[StyleKeys::JUSTIFY_ITEMS as usize] = -1;

        int_slice[StyleKeys::JUSTIFY_SELF as usize] = -1;

        int_slice[StyleKeys::JUSTIFY_CONTENT as usize] = -1;

        int_slice[StyleKeys::MARGIN_LEFT_TYPE as usize] = 1;

        int_slice[StyleKeys::MARGIN_TOP_TYPE as usize] = 1;

        int_slice[StyleKeys::MARGIN_RIGHT_TYPE as usize] = 1;

        int_slice[StyleKeys::MARGIN_BOTTOM_TYPE as usize] = 1;

        int_slice[StyleKeys::PADDING_LEFT_TYPE as usize] = 0;

        int_slice[StyleKeys::PADDING_TOP_TYPE as usize] = 0;

        int_slice[StyleKeys::PADDING_RIGHT_TYPE as usize] = 0;

        int_slice[StyleKeys::PADDING_BOTTOM_TYPE as usize] = 0;

        int_slice[StyleKeys::BORDER_LEFT_TYPE as usize] = 0;

        int_slice[StyleKeys::BORDER_TOP_TYPE as usize] = 0;

        int_slice[StyleKeys::BORDER_RIGHT_TYPE as usize] = 0;

        int_slice[StyleKeys::BORDER_BOTTOM_TYPE as usize] = 0;
    }

    pub fn new(arena: *mut StyleArena) -> Self {
        let arena = unsafe { &mut *arena };
        Style::new_with_handle(arena, arena.get_default())
    }

    pub fn new_with_handle(arena: *mut StyleArena, handle: StyleHandle) -> Self {
        let arena = unsafe { &mut *arena };
        arena.retain(handle);
        let raw = arena.get_ptr_mut(handle);
        Self {
            arena,
            raw,
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
            grid_area: None,
            grid_column_start: Default::default(),
            grid_column_end: Default::default(),
            grid_row_start: Default::default(),
            grid_row_end: Default::default(),
            device_scale: None,
            handle,
        }
    }

    /// Get font metrics
    pub fn font_metrics(&self) -> FontMetrics {
        let data = self.data();
        FontMetrics {
            ascent: get_style_data_f32(data, StyleKeys::FONT_METRICS_ASCENT_OFFSET),
            descent: get_style_data_f32(data, StyleKeys::FONT_METRICS_DESCENT_OFFSET),
            x_height: get_style_data_f32(data, StyleKeys::FONT_METRICS_X_HEIGHT_OFFSET),
            leading: get_style_data_f32(data, StyleKeys::FONT_METRICS_LEADING_OFFSET),
            cap_height: get_style_data_f32(data, StyleKeys::FONT_METRICS_CAP_HEIGHT_OFFSET),
        }
    }

    /// Set font metrics
    pub fn set_font_metrics(&mut self, metrics: FontMetrics) {
        let data = self.data_mut();
        set_style_data_f32(data, StyleKeys::FONT_METRICS_ASCENT_OFFSET, metrics.ascent);
        set_style_data_f32(
            data,
            StyleKeys::FONT_METRICS_DESCENT_OFFSET,
            metrics.descent,
        );
        set_style_data_f32(
            data,
            StyleKeys::FONT_METRICS_X_HEIGHT_OFFSET,
            metrics.x_height,
        );
        set_style_data_f32(
            data,
            StyleKeys::FONT_METRICS_LEADING_OFFSET,
            metrics.leading,
        );
        set_style_data_f32(
            data,
            StyleKeys::FONT_METRICS_CAP_HEIGHT_OFFSET,
            metrics.cap_height,
        );
    }

    /// Set font metrics from individual values
    pub fn set_font_metrics_values(
        &mut self,
        ascent: f32,
        descent: f32,
        x_height: f32,
        leading: f32,
        cap_height: f32,
    ) {
        self.set_font_metrics(FontMetrics::with_full_metrics(
            ascent, descent, x_height, leading, cap_height,
        ));
    }

    /// Get vertical alignment
    pub fn vertical_align(&self) -> VerticalAlignValue {
        let align = self.get_vertical_align_enum();
        let data = self.data();
        VerticalAlignValue {
            align,
            offset: get_style_data_f32(data, StyleKeys::VERTICAL_ALIGN_OFFSET_OFFSET),
            is_percent: get_style_data_bool(data, StyleKeys::VERTICAL_ALIGN_IS_PERCENT_OFFSET),
        }
    }

    /// Set vertical alignment
    pub fn set_vertical_align(&mut self, value: VerticalAlignValue) {
        self.prepare_mut();
        self.set_vertical_align_enum(value.align);
        let data = self.data_mut();
        set_style_data_f32(data, StyleKeys::VERTICAL_ALIGN_OFFSET_OFFSET, value.offset);
        set_style_data_bool(
            data,
            StyleKeys::VERTICAL_ALIGN_IS_PERCENT_OFFSET,
            value.is_percent,
        );
    }

    /// Get first baseline (offset from top of element)
    pub fn first_baseline(&self) -> Option<f32> {
        let value = get_style_data_f32(self.data(), StyleKeys::FIRST_BASELINE_OFFSET);
        if value.is_nan() || value < 0.0 {
            None
        } else {
            Some(value)
        }
    }

    /// Set first baseline
    pub fn set_first_baseline(&mut self, baseline: Option<f32>) {
        self.prepare_mut();
        set_style_data_f32(
            self.data_mut(),
            StyleKeys::FIRST_BASELINE_OFFSET,
            baseline.unwrap_or(f32::NAN),
        );
    }

    fn get_vertical_align_enum(&self) -> VerticalAlign {
        match get_style_data_u8(self.data(), StyleKeys::VERTICAL_ALIGN_ENUM_OFFSET) {
            0 => VerticalAlign::Baseline,
            1 => VerticalAlign::Top,
            2 => VerticalAlign::TextTop,
            3 => VerticalAlign::Middle,
            4 => VerticalAlign::Bottom,
            5 => VerticalAlign::TextBottom,
            6 => VerticalAlign::Sub,
            7 => VerticalAlign::Super,
            _ => VerticalAlign::Baseline,
        }
    }

    fn set_vertical_align_enum(&mut self, align: VerticalAlign) {
        self.prepare_mut();
        set_style_data_u8(
            self.data_mut(),
            StyleKeys::VERTICAL_ALIGN_ENUM_OFFSET,
            align as u8,
        );
    }

    pub fn get_float(&self) -> Float {
        float_from_enum(get_style_data_i8(self.data(), StyleKeys::FLOAT))
            .expect("Internal misuse: float enum out of range (expected 0–2)")
    }
    pub fn set_float(&mut self, value: Float) {
        self.prepare_mut();
        set_style_data_i8(self.data_mut(), StyleKeys::FLOAT, float_to_enum(value))
    }
    pub fn get_clear(&self) -> Clear {
        clear_from_enum(get_style_data_i8(self.data(), StyleKeys::CLEAR))
            .expect("Internal misuse: clear enum out of range (expected 0–3)")
    }
    pub fn set_clear(&mut self, value: Clear) {
        self.prepare_mut();
        set_style_data_i8(self.data_mut(), StyleKeys::CLEAR, clear_to_enum(value))
    }

    pub fn set_grid_template_areas_css(&mut self, value: &str) {
        self.prepare_mut();
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
        unsafe { std::slice::from_raw_parts(self.raw, STYLE_BUFFER_SIZE) }
    }

    #[inline]
    pub fn data_mut(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.raw, STYLE_BUFFER_SIZE) }
    }

    pub fn min_content(&self) -> Size<f32> {
        Size {
            width: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH),
            height: get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT),
        }
    }

    pub fn set_min_content(&mut self, value: Size<f32>) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_WIDTH, value.width);
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_HEIGHT, value.height);
    }

    pub fn min_content_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_WIDTH)
    }

    pub fn min_content_height(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MIN_CONTENT_HEIGHT)
    }

    pub fn set_min_content_width(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_WIDTH, value)
    }

    pub fn set_min_content_height(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::MIN_CONTENT_HEIGHT, value)
    }

    pub fn max_content(&self) -> Size<f32> {
        Size {
            width: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH),
            height: get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT),
        }
    }

    pub fn set_max_content(&mut self, value: Size<f32>) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_WIDTH, value.width);
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_HEIGHT, value.height);
    }

    pub fn max_content_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_WIDTH)
    }

    pub fn max_content_height(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::MAX_CONTENT_HEIGHT)
    }

    pub fn set_max_content_width(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::MAX_CONTENT_WIDTH, value)
    }

    pub fn set_max_content_height(&mut self, value: f32) {
        self.prepare_mut();
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
        get_style_data_i8(self.data(), StyleKeys::FORCE_INLINE) != 0
    }

    pub fn display_mode(&self) -> DisplayMode {
        display_mode_from_enum(get_style_data_i8(self.data(), StyleKeys::DISPLAY_MODE)).unwrap()
    }

    pub fn set_display_mode(&mut self, value: DisplayMode) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::DISPLAY_MODE,
            display_mode_to_enum(value),
        );
    }

    pub fn get_display(&self) -> Display {
        display_from_enum(get_style_data_i8(self.data(), StyleKeys::DISPLAY)).unwrap()
    }

    pub fn set_display(&mut self, value: Display) {
        self.prepare_mut();
        set_style_data_i8(self.data_mut(), StyleKeys::DISPLAY, display_to_enum(value));
        set_style_data_i8(self.data_mut(), StyleKeys::DISPLAY_MODE, 0);
    }

    pub fn get_item_is_table(&self) -> bool {
        get_style_data_i8(self.data(), StyleKeys::ITEM_IS_TABLE) != 0
    }
    pub fn set_item_is_table(&mut self, value: bool) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::ITEM_IS_TABLE,
            if value { 1 } else { 0 },
        );
    }

    pub fn get_item_is_replaced(&self) -> bool {
        get_style_data_i8(self.data(), StyleKeys::ITEM_IS_REPLACED) != 0
    }
    pub fn set_item_is_replaced(&mut self, value: bool) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::ITEM_IS_REPLACED,
            if value { 1 } else { 0 },
        );
    }

    pub fn get_box_sizing(&self) -> BoxSizing {
        boxing_size_from_enum(get_style_data_i8(self.data(), StyleKeys::BOX_SIZING)).unwrap()
    }

    pub fn set_box_sizing(&mut self, value: BoxSizing) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::BOX_SIZING,
            boxing_size_to_enum(value),
        );
    }
    pub fn get_overflow(&self) -> Point<Overflow> {
        Point {
            x: overflow_from_enum(get_style_data_i8(self.data(), StyleKeys::OVERFLOW_X)).unwrap(),
            y: overflow_from_enum(get_style_data_i8(self.data(), StyleKeys::OVERFLOW_Y)).unwrap(),
        }
    }

    pub fn set_overflow(&mut self, value: Point<Overflow>) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::OVERFLOW_X,
            overflow_to_enum(value.x),
        );
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::OVERFLOW_Y,
            overflow_to_enum(value.y),
        );
    }

    pub fn get_overflow_x(&self) -> Overflow {
        overflow_from_enum(get_style_data_i8(self.data(), StyleKeys::OVERFLOW_X)).unwrap()
    }

    pub fn set_overflow_x(&mut self, value: Overflow) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::OVERFLOW_X,
            overflow_to_enum(value),
        )
    }

    pub fn get_overflow_y(&self) -> Overflow {
        overflow_from_enum(get_style_data_i8(self.data(), StyleKeys::OVERFLOW_Y)).unwrap()
    }

    pub fn set_overflow_y(&mut self, value: Overflow) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::OVERFLOW_Y,
            overflow_to_enum(value),
        )
    }

    pub fn get_scrollbar_width(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::SCROLLBAR_WIDTH)
    }

    pub fn set_scrollbar_width(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::SCROLLBAR_WIDTH, value)
    }

    pub fn get_position(&self) -> Position {
        position_from_enum(get_style_data_i8(self.data(), StyleKeys::POSITION)).unwrap()
    }

    pub fn set_position(&mut self, value: Position) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::POSITION,
            position_to_enum(value),
        )
    }

    pub fn get_inset(&self) -> Rect<LengthPercentageAuto> {
        Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::INSET_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::INSET_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::INSET_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::INSET_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::INSET_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_inset(&mut self, value: Rect<LengthPercentageAuto>) {
        self.prepare_mut();
        let left = length_percentage_auto_to_type_value(value.left);
        let right = length_percentage_auto_to_type_value(value.right);
        let top = length_percentage_auto_to_type_value(value.top);
        let bottom = length_percentage_auto_to_type_value(value.bottom);

        set_style_data_i8(self.data_mut(), StyleKeys::INSET_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_LEFT_VALUE, left.1);

        set_style_data_i8(self.data_mut(), StyleKeys::INSET_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_RIGHT_VALUE, right.1);

        set_style_data_i8(self.data_mut(), StyleKeys::INSET_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_TOP_VALUE, top.1);

        set_style_data_i8(self.data_mut(), StyleKeys::INSET_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_BOTTOM_VALUE, bottom.1);
    }

    pub fn set_left_inset(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let left = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::INSET_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_LEFT_VALUE, left.1);
    }

    pub fn left_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::INSET_LEFT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_LEFT_VALUE),
        )
    }

    pub fn set_right_inset(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let right = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::INSET_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_RIGHT_VALUE, right.1);
    }

    pub fn right_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::INSET_RIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_RIGHT_VALUE),
        )
    }

    pub fn set_top_inset(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let top = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::INSET_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_TOP_VALUE, top.1);
    }

    pub fn top_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::INSET_TOP_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_TOP_VALUE),
        )
    }

    pub fn set_bottom_inset(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let bottom = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::INSET_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::INSET_BOTTOM_VALUE, bottom.1);
    }

    pub fn bottom_inset(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::INSET_BOTTOM_TYPE),
            get_style_data_f32(self.data(), StyleKeys::INSET_BOTTOM_VALUE),
        )
    }

    pub fn get_margin(&self) -> Rect<LengthPercentageAuto> {
        Rect {
            left: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MARGIN_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_LEFT_VALUE),
            ),
            right: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MARGIN_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_RIGHT_VALUE),
            ),
            top: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MARGIN_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_TOP_VALUE),
            ),
            bottom: length_percentage_auto_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MARGIN_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MARGIN_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_margin(&mut self, value: Rect<LengthPercentageAuto>) {
        self.prepare_mut();
        let margin_left = length_percentage_auto_to_type_value(value.left);
        let margin_right = length_percentage_auto_to_type_value(value.right);
        let margin_top = length_percentage_auto_to_type_value(value.top);
        let margin_bottom = length_percentage_auto_to_type_value(value.bottom);

        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_LEFT_TYPE, margin_left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_LEFT_VALUE, margin_left.1);

        set_style_data_i8(
            self.data_mut(),
            StyleKeys::MARGIN_RIGHT_TYPE,
            margin_right.0,
        );
        set_style_data_f32(
            self.data_mut(),
            StyleKeys::MARGIN_RIGHT_VALUE,
            margin_right.1,
        );

        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_TOP_TYPE, margin_top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_TOP_VALUE, margin_top.1);

        set_style_data_i8(
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
        self.prepare_mut();
        let left = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_LEFT_TYPE, left.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_LEFT_VALUE, left.1);
    }

    pub fn left_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::MARGIN_LEFT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_LEFT_VALUE),
        )
    }

    pub fn set_right_margin(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let right = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_RIGHT_TYPE, right.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_RIGHT_VALUE, right.1);
    }

    pub fn right_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::MARGIN_RIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_RIGHT_VALUE),
        )
    }

    pub fn set_top_margin(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let top = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_TOP_TYPE, top.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_TOP_VALUE, top.1);
    }

    pub fn top_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::MARGIN_TOP_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_TOP_VALUE),
        )
    }

    pub fn set_bottom_margin(&mut self, value: LengthPercentageAuto) {
        self.prepare_mut();
        let bottom = length_percentage_auto_to_type_value(value);
        set_style_data_i8(self.data_mut(), StyleKeys::MARGIN_BOTTOM_TYPE, bottom.0);
        set_style_data_f32(self.data_mut(), StyleKeys::MARGIN_BOTTOM_VALUE, bottom.1);
    }

    pub fn bottom_margin(&self) -> LengthPercentageAuto {
        length_percentage_auto_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::MARGIN_BOTTOM_TYPE),
            get_style_data_f32(self.data(), StyleKeys::MARGIN_BOTTOM_VALUE),
        )
    }

    pub fn get_padding(&self) -> Rect<LengthPercentage> {
        Rect {
            left: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::PADDING_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::PADDING_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::PADDING_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::PADDING_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::PADDING_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_padding(&mut self, value: Rect<LengthPercentage>) {
        self.prepare_mut();
        let padding_left = length_percentage_to_type_value(value.left);
        let padding_right = length_percentage_to_type_value(value.right);
        let padding_top = length_percentage_to_type_value(value.top);
        let padding_bottom = length_percentage_to_type_value(value.bottom);

        let data = self.data_mut();

        set_style_data_i8(data, StyleKeys::PADDING_LEFT_TYPE, padding_left.0);
        set_style_data_f32(data, StyleKeys::PADDING_LEFT_VALUE, padding_left.1);

        set_style_data_i8(data, StyleKeys::PADDING_RIGHT_TYPE, padding_right.0);
        set_style_data_f32(data, StyleKeys::PADDING_RIGHT_VALUE, padding_right.1);

        set_style_data_i8(data, StyleKeys::PADDING_TOP_TYPE, padding_top.0);
        set_style_data_f32(data, StyleKeys::PADDING_TOP_VALUE, padding_top.1);

        set_style_data_i8(data, StyleKeys::PADDING_BOTTOM_TYPE, padding_bottom.0);
        set_style_data_f32(data, StyleKeys::PADDING_BOTTOM_VALUE, padding_bottom.1);
    }

    pub fn get_border(&self) -> Rect<LengthPercentage> {
        Rect {
            left: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::BORDER_LEFT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_LEFT_VALUE),
            ),
            right: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::BORDER_RIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_RIGHT_VALUE),
            ),
            top: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::BORDER_TOP_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_TOP_VALUE),
            ),
            bottom: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::BORDER_BOTTOM_TYPE),
                get_style_data_f32(self.data(), StyleKeys::BORDER_BOTTOM_VALUE),
            ),
        }
    }

    pub fn set_border(&mut self, value: Rect<LengthPercentage>) {
        self.prepare_mut();
        let border_left = length_percentage_to_type_value(value.left);
        let border_right = length_percentage_to_type_value(value.right);
        let border_top = length_percentage_to_type_value(value.top);
        let border_bottom = length_percentage_to_type_value(value.bottom);

        let data = self.data_mut();

        set_style_data_i8(data, StyleKeys::BORDER_LEFT_TYPE, border_left.0);
        set_style_data_f32(data, StyleKeys::BORDER_LEFT_VALUE, border_left.1);

        set_style_data_i8(data, StyleKeys::BORDER_RIGHT_TYPE, border_right.0);
        set_style_data_f32(data, StyleKeys::BORDER_RIGHT_VALUE, border_right.1);

        set_style_data_i8(data, StyleKeys::BORDER_TOP_TYPE, border_top.0);
        set_style_data_f32(data, StyleKeys::BORDER_TOP_VALUE, border_top.1);

        set_style_data_i8(data, StyleKeys::BORDER_BOTTOM_TYPE, border_bottom.0);
        set_style_data_f32(data, StyleKeys::BORDER_BOTTOM_VALUE, border_bottom.1);
    }

    pub fn get_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i8(data, StyleKeys::WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i8(data, StyleKeys::HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::HEIGHT_VALUE, height.1);
    }

    pub fn width(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::WIDTH_TYPE),
            get_style_data_f32(self.data(), StyleKeys::WIDTH_VALUE),
        )
    }

    pub fn height(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::HEIGHT_TYPE),
            get_style_data_f32(self.data(), StyleKeys::HEIGHT_VALUE),
        )
    }

    pub fn set_width(&mut self, value: Dimension) {
        self.prepare_mut();
        let data = self.data_mut();
        let width = dimension_to_type_value(value);
        set_style_data_i8(data, StyleKeys::WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::WIDTH_VALUE, width.1);
    }

    pub fn set_height(&mut self, value: Dimension) {
        self.prepare_mut();
        let data = self.data_mut();
        let height = dimension_to_type_value(value);
        set_style_data_i8(data, StyleKeys::HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::HEIGHT_VALUE, height.1);
    }

    pub fn get_min_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MIN_WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MIN_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MIN_HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MIN_HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_min_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i8(data, StyleKeys::MIN_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MIN_WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i8(data, StyleKeys::MIN_HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::MIN_HEIGHT_VALUE, height.1);
    }

    pub fn set_min_width(&mut self, value: Dimension) {
        self.prepare_mut();
        let data = self.data_mut();
        let width = dimension_to_type_value(value);
        set_style_data_i8(data, StyleKeys::MIN_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MIN_WIDTH_VALUE, width.1);
    }

    pub fn set_min_height(&mut self, value: Dimension) {
        self.prepare_mut();
        let data = self.data_mut();
        let height = dimension_to_type_value(value);
        set_style_data_i8(data, StyleKeys::MIN_HEIGHT_TYPE, height.0);
        set_style_data_f32(data, StyleKeys::MIN_HEIGHT_VALUE, height.1);
    }

    pub fn get_max_size(&self) -> Size<Dimension> {
        Size {
            width: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MAX_WIDTH_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MAX_WIDTH_VALUE),
            ),
            height: dimension_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::MAX_HEIGHT_TYPE),
                get_style_data_f32(self.data(), StyleKeys::MAX_HEIGHT_VALUE),
            ),
        }
    }

    pub fn set_max_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let width = dimension_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i8(data, StyleKeys::MAX_WIDTH_TYPE, width.0);
        set_style_data_f32(data, StyleKeys::MAX_WIDTH_VALUE, width.1);

        let height = dimension_to_type_value(value.height);

        set_style_data_i8(data, StyleKeys::MAX_HEIGHT_TYPE, height.0);
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
        self.prepare_mut();
        let ratio = ratio.unwrap_or(f32::NAN);
        set_style_data_f32(self.data_mut(), StyleKeys::ASPECT_RATIO, ratio);
    }

    pub fn get_gap(&self) -> Size<LengthPercentage> {
        Size {
            width: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::GAP_ROW_TYPE),
                get_style_data_f32(self.data(), StyleKeys::GAP_ROW_VALUE),
            ),
            height: length_percentage_from_type_value(
                get_style_data_i8(self.data(), StyleKeys::GAP_COLUMN_TYPE),
                get_style_data_f32(self.data(), StyleKeys::GAP_COLUMN_VALUE),
            ),
        }
    }

    pub fn set_gap(&mut self, value: Size<LengthPercentage>) {
        self.prepare_mut();
        let gap_row = length_percentage_to_type_value(value.width);

        let data = self.data_mut();
        set_style_data_i8(data, StyleKeys::GAP_ROW_TYPE, gap_row.0);
        set_style_data_f32(data, StyleKeys::GAP_ROW_VALUE, gap_row.1);

        let gap_column = length_percentage_to_type_value(value.height);

        set_style_data_i8(data, StyleKeys::GAP_COLUMN_TYPE, gap_column.0);
        set_style_data_f32(data, StyleKeys::GAP_COLUMN_VALUE, gap_column.1);
    }

    pub fn get_align_items(&self) -> Option<AlignItems> {
        let value = get_style_data_i8(self.data(), StyleKeys::ALIGN_ITEMS);
        align_items_from_enum(value)
    }

    pub fn set_align_items(&mut self, value: Option<AlignItems>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_items_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::ALIGN_ITEMS, align);
    }

    pub fn get_align_self(&self) -> Option<AlignSelf> {
        let value = get_style_data_i8(self.data(), StyleKeys::ALIGN_SELF);
        align_self_from_enum(value)
    }

    pub fn set_align_self(&mut self, value: Option<AlignSelf>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_self_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::ALIGN_SELF, align);
    }

    pub fn get_align_content(&self) -> Option<AlignContent> {
        let value = get_style_data_i8(self.data(), StyleKeys::ALIGN_CONTENT);
        align_content_from_enum(value)
    }

    pub fn set_align_content(&mut self, value: Option<AlignContent>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_content_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::ALIGN_CONTENT, align);
    }

    pub fn get_justify_items(&self) -> Option<JustifyItems> {
        let value = get_style_data_i8(self.data(), StyleKeys::JUSTIFY_ITEMS);
        align_items_from_enum(value)
    }

    pub fn set_justify_items(&mut self, value: Option<JustifyItems>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_items_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::JUSTIFY_ITEMS, align);
    }

    pub fn get_justify_self(&self) -> Option<JustifySelf> {
        let value = get_style_data_i8(self.data(), StyleKeys::JUSTIFY_SELF);
        align_self_from_enum(value)
    }

    pub fn set_justify_self(&mut self, value: Option<JustifySelf>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_self_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::JUSTIFY_SELF, align);
    }

    pub fn get_justify_content(&self) -> Option<JustifyContent> {
        let value = get_style_data_i8(self.data(), StyleKeys::JUSTIFY_CONTENT);
        align_content_from_enum(value)
    }

    pub fn set_justify_content(&mut self, value: Option<JustifyContent>) {
        self.prepare_mut();
        let align = match value {
            Some(value) => align_content_to_enum(value),
            None => -1,
        };
        set_style_data_i8(self.data_mut(), StyleKeys::JUSTIFY_CONTENT, align);
    }

    pub fn get_text_align(&self) -> TextAlign {
        text_align_from_enum(get_style_data_i8(self.data(), StyleKeys::TEXT_ALIGN)).unwrap()
    }

    pub fn set_text_align(&mut self, value: TextAlign) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::TEXT_ALIGN,
            text_align_to_enum(value),
        )
    }

    pub fn get_flex_direction(&self) -> FlexDirection {
        flex_direction_from_enum(get_style_data_i8(self.data(), StyleKeys::FLEX_DIRECTION)).unwrap()
    }

    pub fn set_flex_direction(&mut self, value: FlexDirection) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::FLEX_DIRECTION,
            flex_direction_to_enum(value),
        )
    }

    pub fn get_flex_wrap(&self) -> FlexWrap {
        flex_wrap_from_enum(get_style_data_i8(self.data(), StyleKeys::FLEX_WRAP)).unwrap()
    }

    pub fn set_flex_wrap(&mut self, value: FlexWrap) {
        self.prepare_mut();
        set_style_data_i8(
            self.data_mut(),
            StyleKeys::FLEX_WRAP,
            flex_wrap_to_enum(value),
        )
    }

    pub fn get_flex_grow(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::FLEX_GROW)
    }

    pub fn set_flex_grow(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::FLEX_GROW, value)
    }

    pub fn get_flex_shrink(&self) -> f32 {
        get_style_data_f32(self.data(), StyleKeys::FLEX_SHRINK)
    }

    pub fn set_flex_shrink(&mut self, value: f32) {
        self.prepare_mut();
        set_style_data_f32(self.data_mut(), StyleKeys::FLEX_SHRINK, value)
    }

    pub fn get_flex_basis(&self) -> Dimension {
        dimension_from_type_value(
            get_style_data_i8(self.data(), StyleKeys::FLEX_BASIS_TYPE),
            get_style_data_f32(self.data(), StyleKeys::FLEX_BASIS_VALUE),
        )
    }

    pub fn set_flex_basis(&mut self, value: Dimension) {
        self.prepare_mut();
        let basis = dimension_to_type_value(value);

        let data = self.data_mut();
        set_style_data_i8(data, StyleKeys::FLEX_BASIS_TYPE, basis.0);
        set_style_data_f32(data, StyleKeys::FLEX_BASIS_VALUE, basis.1);
    }

    pub fn get_grid_auto_flow(&self) -> GridAutoFlow {
        grid_auto_flow_from_enum(get_style_data_i8(self.data(), StyleKeys::GRID_AUTO_FLOW)).unwrap()
    }

    pub fn set_grid_auto_flow(&mut self, value: GridAutoFlow) {
        self.prepare_mut();
        set_style_data_i8(
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

    pub fn get_item_is_list(&self) -> bool {
        get_style_data_u8(self.data(), StyleKeys::ITEM_IS_LIST) != 0
    }
    pub fn set_item_is_list(&mut self, value: bool) {
        self.prepare_mut();
        set_style_data_u8(
            self.data_mut(),
            StyleKeys::ITEM_IS_LIST,
            if value { 1 } else { 0 },
        );
    }

    pub fn get_item_is_list_item(&self) -> bool {
        get_style_data_u8(self.data(), StyleKeys::ITEM_IS_LIST_ITEM) != 0
    }
    pub fn set_item_is_list_item(&mut self, value: bool) {
        self.prepare_mut();
        set_style_data_u8(
            self.data_mut(),
            StyleKeys::ITEM_IS_LIST_ITEM,
            if value { 1 } else { 0 },
        );
    }

    #[cfg(target_vendor = "apple")]
    #[track_caller]
    pub fn buffer(&self) -> Retained<NSMutableData> {
        let area = unsafe { &*self.arena };
        area.buffer(self.handle)
    }

    #[cfg(target_os = "android")]
    #[track_caller]
    pub fn buffer(&self) -> jni::sys::jint {
        let area = unsafe { &*self.arena };
        area.buffer(self.handle)
    }

    pub fn raw(&self) -> (*const u8, usize) {
        (self.raw, STYLE_BUFFER_SIZE)
    }

    pub fn raw_mut(&mut self) -> (*mut u8, usize) {
        (self.raw, STYLE_BUFFER_SIZE)
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

    #[inline(always)]
    fn float(&self) -> Float {
        self.get_float()
    }

    #[inline(always)]
    fn clear(&self) -> Clear {
        self.get_clear()
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
