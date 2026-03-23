use crate::style::utils::{
    dimension_from_type_value, dimension_to_type_value, get_style_data_bool, get_style_data_f32,
    get_style_data_i8, get_style_data_u8, length_percentage_auto_from_type_value,
    length_percentage_auto_to_type_value, length_percentage_from_type_value,
    length_percentage_to_type_value, set_style_data_bool, set_style_data_f32, set_style_data_i32,
    set_style_data_i8, set_style_data_u32, set_style_data_u8,
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
            Overflow::Auto => taffy::Overflow::Scroll,
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

    // Contiguous types, then contiguous values per group
    INSET_LEFT_TYPE = 13,
    INSET_RIGHT_TYPE = 14,
    INSET_TOP_TYPE = 15,
    INSET_BOTTOM_TYPE = 16,
    INSET_LEFT_VALUE = 17,   // f32 (4 bytes: 17-20)
    INSET_RIGHT_VALUE = 21,  // f32 (4 bytes: 21-24)
    INSET_TOP_VALUE = 25,    // f32 (4 bytes: 25-28)
    INSET_BOTTOM_VALUE = 29, // f32 (4 bytes: 29-32)

    MARGIN_LEFT_TYPE = 33,
    MARGIN_RIGHT_TYPE = 34,
    MARGIN_TOP_TYPE = 35,
    MARGIN_BOTTOM_TYPE = 36,
    MARGIN_LEFT_VALUE = 37,   // f32 (4 bytes: 37-40)
    MARGIN_RIGHT_VALUE = 41,  // f32 (4 bytes: 41-44)
    MARGIN_TOP_VALUE = 45,    // f32 (4 bytes: 45-48)
    MARGIN_BOTTOM_VALUE = 49, // f32 (4 bytes: 49-52)

    PADDING_LEFT_TYPE = 53,
    PADDING_RIGHT_TYPE = 54,
    PADDING_TOP_TYPE = 55,
    PADDING_BOTTOM_TYPE = 56,
    PADDING_LEFT_VALUE = 57,   // f32 (4 bytes: 57-60)
    PADDING_RIGHT_VALUE = 61,  // f32 (4 bytes: 61-64)
    PADDING_TOP_VALUE = 65,    // f32 (4 bytes: 65-68)
    PADDING_BOTTOM_VALUE = 69, // f32 (4 bytes: 69-72)

    BORDER_LEFT_TYPE = 73,
    BORDER_RIGHT_TYPE = 74,
    BORDER_TOP_TYPE = 75,
    BORDER_BOTTOM_TYPE = 76,
    BORDER_LEFT_VALUE = 77,   // f32 (4 bytes: 77-80)
    BORDER_RIGHT_VALUE = 81,  // f32 (4 bytes: 81-84)
    BORDER_TOP_VALUE = 85,    // f32 (4 bytes: 85-88)
    BORDER_BOTTOM_VALUE = 89, // f32 (4 bytes: 89-92)

    FLEX_GROW = 93,   // f32 (4 bytes: 93-96)
    FLEX_SHRINK = 97, // f32 (4 bytes: 97-100)

    FLEX_BASIS_TYPE = 101,
    FLEX_BASIS_VALUE = 102, // f32 (4 bytes: 102-105)

    WIDTH_TYPE = 106,
    HEIGHT_TYPE = 107,
    WIDTH_VALUE = 108,  // f32 (4 bytes: 108-111)
    HEIGHT_VALUE = 112, // f32 (4 bytes: 112-115)

    MIN_WIDTH_TYPE = 116,
    MIN_HEIGHT_TYPE = 117,
    MIN_WIDTH_VALUE = 118,  // f32 (4 bytes: 118-121)
    MIN_HEIGHT_VALUE = 122, // f32 (4 bytes: 122-125)

    MAX_WIDTH_TYPE = 126,
    MAX_HEIGHT_TYPE = 127,
    MAX_WIDTH_VALUE = 128,  // f32 (4 bytes: 128-131)
    MAX_HEIGHT_VALUE = 132, // f32 (4 bytes: 132-135)

    GAP_ROW_TYPE = 136,
    GAP_COLUMN_TYPE = 137,
    GAP_ROW_VALUE = 138,    // f32 (4 bytes: 138-141)
    GAP_COLUMN_VALUE = 142, // f32 (4 bytes: 142-145)

    ASPECT_RATIO = 146, // f32 (4 bytes: 146-149)
    GRID_AUTO_FLOW = 150,
    GRID_COLUMN_START_TYPE = 151,
    GRID_COLUMN_END_TYPE = 152,
    GRID_ROW_START_TYPE = 153,
    GRID_ROW_END_TYPE = 154,
    GRID_COLUMN_START_VALUE = 155, // f32 (4 bytes: 155-158)
    GRID_COLUMN_END_VALUE = 159,   // f32 (4 bytes: 159-162)
    GRID_ROW_START_VALUE = 163,    // f32 (4 bytes: 163-166)
    GRID_ROW_END_VALUE = 167,      // f32 (4 bytes: 167-170)
    SCROLLBAR_WIDTH = 171,         // float (4 bytes: 171-174)
    ALIGN = 175,
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
    // 8 types (1 byte each), then 8 values (f32), then 4 exponents (f32)
    // ============================================================
    BORDER_RADIUS_TOP_LEFT_X_TYPE = 218,
    BORDER_RADIUS_TOP_LEFT_Y_TYPE = 219,
    BORDER_RADIUS_TOP_RIGHT_X_TYPE = 220,
    BORDER_RADIUS_TOP_RIGHT_Y_TYPE = 221,
    BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE = 222,
    BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE = 223,
    BORDER_RADIUS_BOTTOM_LEFT_X_TYPE = 224,
    BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE = 225,

    BORDER_RADIUS_TOP_LEFT_X_VALUE = 226, // f32 (4 bytes: 226-229)
    BORDER_RADIUS_TOP_LEFT_Y_VALUE = 230, // f32 (4 bytes: 230-233)
    BORDER_RADIUS_TOP_RIGHT_X_VALUE = 234, // f32 (4 bytes: 234-237)
    BORDER_RADIUS_TOP_RIGHT_Y_VALUE = 238, // f32 (4 bytes: 238-241)
    BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE = 242, // f32 (4 bytes: 242-245)
    BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE = 246, // f32 (4 bytes: 246-249)
    BORDER_RADIUS_BOTTOM_LEFT_X_VALUE = 250, // f32 (4 bytes: 250-253)
    BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE = 254, // f32 (4 bytes: 254-257)

    BORDER_RADIUS_TOP_LEFT_EXPONENT = 258, // f32 (4 bytes: 258-261)
    BORDER_RADIUS_TOP_RIGHT_EXPONENT = 262, // f32 (4 bytes: 262-265)
    BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT = 266, // f32 (4 bytes: 266-269)
    BORDER_RADIUS_BOTTOM_LEFT_EXPONENT = 270, // f32 (4 bytes: 270-273)

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

    // Text-related fields
    FONT_COLOR = 324,                 // u32 (4 bytes: 324-327)
    FONT_COLOR_STATE = 328,           // u8
    FONT_SIZE = 329,                  // i32 (4 bytes: 329-332)
    FONT_SIZE_TYPE = 333,             // u8
    FONT_SIZE_STATE = 334,            // u8
    FONT_WEIGHT = 335,                // i32 (4 bytes: 335-338)
    FONT_WEIGHT_STATE = 339,          // u8
    FONT_STYLE_SLANT = 340,           // i32 (4 bytes: 340-343)
    FONT_STYLE_TYPE = 344,            // u8
    FONT_STYLE_STATE = 345,           // u8
    FONT_FAMILY_STATE = 346,          // u8
    FONT_RESOLVED_DIRTY = 347,        // u8
    BACKGROUND_COLOR = 348,           // i32 (4 bytes: 348-351)
    BACKGROUND_COLOR_STATE = 352,     // u8
    BACKGROUND_COLOR_TYPE = 353,      // u8
    DECORATION_LINE = 354,            // u8
    DECORATION_LINE_STATE = 355,      // u8
    DECORATION_COLOR = 356,           // i32 (4 bytes: 356-359)
    DECORATION_COLOR_STATE = 360,     // u8
    DECORATION_STYLE = 361,           // u8
    DECORATION_STYLE_STATE = 362,     // u8
    LETTER_SPACING = 363,             // i32 (4 bytes: 363-366)
    LETTER_SPACING_STATE = 367,       // u8
    TEXT_WRAP = 368,                  // u8
    TEXT_WRAP_STATE = 369,            // u8
    WHITE_SPACE = 370,                // u8
    WHITE_SPACE_STATE = 371,          // u8
    TEXT_TRANSFORM = 372,             // u8
    TEXT_TRANSFORM_STATE = 373,       // u8
    TEXT_ALIGN = 374,                 // u8
    TEXT_ALIGN_STATE = 375,           // u8
    TEXT_JUSTIFY = 376,               // u8
    TEXT_JUSTIFY_STATE = 377,         // u8
    TEXT_INDENT = 378,                // i32 (4 bytes: 378-381)
    TEXT_INDENT_TYPE = 382,           // u8
    TEXT_INDENT_STATE = 383,          // u8
    LINE_HEIGHT = 384,                // i32 (4 bytes: 384-387)
    LINE_HEIGHT_STATE = 388,          // u8
    LINE_HEIGHT_TYPE = 389,           // u8
    DECORATION_THICKNESS = 390,       // i32 (4 bytes: 390-393)
    DECORATION_THICKNESS_STATE = 394, // u8
    TEXT_SHADOW_STATE = 395,          // u8
    TEXT_OVERFLOW = 396,              // u8
    TEXT_OVERFLOW_STATE = 397,        // u8

    // Pseudo set mask: 128-bit bitmask (two i64s) tracking which properties
    // were explicitly set on a pseudo style buffer. Uses the same bit layout
    // as StateKeys. Zero-copy: lives in the style buffer itself.
    PSEUDO_SET_MASK_LOW = 398,  // i64 (8 bytes: 398-405)
    PSEUDO_SET_MASK_HIGH = 406, // i64 (8 bytes: 406-413)

    // Platform-only (not in Rust StyleKeys but reserved):
    // FONT_VARIANT_NUMERIC = 419      // u8 (bitmask)
    // FONT_VARIANT_NUMERIC_STATE = 420 // u8

    // ============================================================
    // Transform buffer region (bytes 422-561)
    // ============================================================
    TRANSFORM_COUNT = 422,  // u8: number of inline ops (0-6)
    TRANSFORM_FLAGS = 423,  // u8: bit 0 = HAS_MATRIX, bit 1 = IS_3D
    TRANSFORM_OP_0 = 424,   // 12 bytes: type(u8) + pad(3) + a(f32) + b(f32)
    TRANSFORM_OP_1 = 436,   // 12 bytes
    TRANSFORM_OP_2 = 448,   // 12 bytes
    TRANSFORM_OP_3 = 460,   // 12 bytes
    TRANSFORM_OP_4 = 472,   // 12 bytes
    TRANSFORM_OP_5 = 484,   // 12 bytes
    TRANSFORM_MATRIX = 496, // 64 bytes: 16 x f32 (4x4 column-major matrix)
}

pub const MAX_INLINE_TRANSFORM_OPS: usize = 6;
pub const TRANSFORM_OP_SIZE: usize = 12; // bytes per op

pub const TRANSFORM_FLAG_HAS_MATRIX: u8 = 0x01;
pub const TRANSFORM_FLAG_IS_3D: u8 = 0x02;

#[repr(u8)]
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum TransformOpType {
    None = 0,
    Translate = 1,
    TranslateX = 2,
    TranslateY = 3,
    Scale = 4,
    ScaleX = 5,
    ScaleY = 6,
    Rotate = 7,
    SkewX = 8,
    SkewY = 9,
}

impl TransformOpType {
    pub fn from_u8(v: u8) -> Self {
        match v {
            1 => Self::Translate,
            2 => Self::TranslateX,
            3 => Self::TranslateY,
            4 => Self::Scale,
            5 => Self::ScaleX,
            6 => Self::ScaleY,
            7 => Self::Rotate,
            8 => Self::SkewX,
            9 => Self::SkewY,
            _ => Self::None,
        }
    }
}

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
    pub struct StateKeys: u128 {
        const DISPLAY         = 1u128 << 0;
        const POSITION        = 1u128 << 1;
        const DIRECTION       = 1u128 << 2;
        const FLEX_DIRECTION  = 1u128 << 3;
        const FLEX_WRAP       = 1u128 << 4;
        const OVERFLOW_X      = 1u128 << 5;
        const OVERFLOW_Y      = 1u128 << 6;
        const ALIGN_ITEMS     = 1u128 << 7;
        const ALIGN_SELF      = 1u128 << 8;
        const ALIGN_CONTENT   = 1u128 << 9;
        const JUSTIFY_ITEMS   = 1u128 << 10;
        const JUSTIFY_SELF    = 1u128 << 11;
        const JUSTIFY_CONTENT = 1u128 << 12;
        const INSET           = 1u128 << 13;
        const MARGIN          = 1u128 << 14;
        const PADDING         = 1u128 << 15;
        const BORDER          = 1u128 << 16;
        const FLEX_GROW       = 1u128 << 17;
        const FLEX_SHRINK     = 1u128 << 18;
        const FLEX_BASIS      = 1u128 << 19;
        const SIZE            = 1u128 << 20;
        const MIN_SIZE        = 1u128 << 21;
        const MAX_SIZE        = 1u128 << 22;
        const GAP             = 1u128 << 23;
        const ASPECT_RATIO    = 1u128 << 24;
        const GRID_AUTO_FLOW  = 1u128 << 25;
        const GRID_COLUMN     = 1u128 << 26;
        const GRID_ROW        = 1u128 << 27;
        const SCROLLBAR_WIDTH = 1u128 << 28;
        const ALIGN           = 1u128 << 29;
        const BOX_SIZING      = 1u128 << 30;
        const OVERFLOW        = 1u128 << 31;
        const ITEM_IS_TABLE   = 1u128 << 32;
        const ITEM_IS_REPLACED = 1u128 << 33;
        const DISPLAY_MODE   = 1u128 << 34;
        const FORCE_INLINE = 1u128 << 35;
        const MIN_CONTENT_WIDTH = 1u128 << 36;
        const MIN_CONTENT_HEIGHT = 1u128 << 37;
        const MAX_CONTENT_WIDTH = 1u128 << 38;
        const MAX_CONTENT_HEIGHT = 1u128 << 39;
        const BORDER_STYLE    = 1u128 << 40;
        const BORDER_RADIUS    = 1u128 << 41;
        const BORDER_COLOR    = 1u128 << 42;
        const FLOAT = 1u128 << 43;
        const CLEAR = 1u128 << 44;
        const OBJECT_FIT = 1u128 << 45;
        const Z_INDEX = 1u128 << 46;
        const LIST_STYLE_POSITION = 1u128 << 47;
        const LIST_STYLE_TYPE = 1u128 << 48;
        const _RESERVED_49 = 1u128 << 49;

        const FONT_COLOR = 1u128 << 50;
        const DECORATION_LINE = 1u128 << 51;
        const DECORATION_COLOR = 1u128 << 52;
        const TEXT_ALIGN = 1u128 << 53;
        const TEXT_JUSTIFY = 1u128 << 54;
        const BACKGROUND_COLOR = 1u128 << 55;

        const FONT_SIZE = 1u128 << 56;
        const TEXT_TRANSFORM = 1u128 << 57;
        const FONT_STYLE = 1u128 << 58;
        const FONT_STYLE_SLANT = 1u128 << 59;
        const TEXT_WRAP = 1u128 << 60;
        const TEXT_OVERFLOW = 1u128 << 61;
        const DECORATION_STYLE = 1u128 << 62;
        const WHITE_SPACE = 1u128 << 63;
        const FONT_WEIGHT = 1u128 << 64;
        const LINE_HEIGHT = 1u128 << 65;
        const VERTICAL_ALIGN_TEXT = 1u128 << 66;
        const DECORATION_THICKNESS = 1u128 << 67;
        const TEXT_SHADOWS = 1u128 << 68;
        const FONT_FAMILY = 1u128 << 69;
        const LETTER_SPACING = 1u128 << 70;
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

const DEFAULT_FONT_SIZE: i32 = 16;
const UNSET_COLOR: u32 = 0xDEADBEEF;

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
        set_style_data_u8(
            buffer,
            StyleKeys::DISPLAY,
            display_to_enum(Display::Block) as u8,
        );

        set_style_data_u8(buffer, StyleKeys::LIST_STYLE_TYPE, 2);

        set_style_data_i32(
            buffer,
            StyleKeys::FONT_WEIGHT,
            400, // normal
        );

        set_style_data_i32(buffer, StyleKeys::FONT_SIZE, DEFAULT_FONT_SIZE);

        set_style_data_u32(buffer, StyleKeys::FONT_COLOR, 0xFF000000);

        set_style_data_u32(buffer, StyleKeys::BACKGROUND_COLOR, 0);

        set_style_data_u32(buffer, StyleKeys::DECORATION_COLOR, UNSET_COLOR);

        // default ratio to NAN
        set_style_data_f32(buffer, StyleKeys::ASPECT_RATIO, f32::NAN);
        // default shrink to 1
        set_style_data_f32(buffer, StyleKeys::FLEX_SHRINK, 1.);

        /*
        set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_TOP_LEFT_EXPONENT, 1.);
        set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_TOP_RIGHT_EXPONENT, 1.);
        set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_BOTTOM_LEFT_EXPONENT, 1.);
        set_style_data_f32(buffer, StyleKeys::BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT, 1.);
        */

        unsafe {
            let src: [f32; 4] = [1., 1., 1., 1.];

            let ptr = buffer
                .as_mut_ptr()
                .add(StyleKeys::BORDER_RADIUS_TOP_LEFT_EXPONENT as usize)
                as *mut u32;

            for i in 0..4 {
                ptr.add(i).write_unaligned(src[i].to_bits().to_le());
            }
        }

        // Default font metrics

        {
            /*

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_ASCENT_OFFSET, 14.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_DESCENT_OFFSET, 4.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_X_HEIGHT_OFFSET, 7.);

            // default is zero
            // set_style_data_f32(buffer, StyleKeys::FONT_METRICS_LEADING_OFFSET, 0.);

            set_style_data_f32(buffer, StyleKeys::FONT_METRICS_CAP_HEIGHT_OFFSET, 10.);

            set_style_data_f32(buffer, StyleKeys::FIRST_BASELINE_OFFSET, f32::NAN);

            */

            let src: [u32; 5] = [
                14f32.to_bits(), // ascent
                4f32.to_bits(),  // descent
                7f32.to_bits(),  // x-height
                0f32.to_bits(),  // leading
                10f32.to_bits(), // cap height
            ];

            unsafe {
                let ptr = buffer
                    .as_mut_ptr()
                    .add(StyleKeys::FONT_METRICS_ASCENT_OFFSET as usize)
                    as *mut u32;

                ptr.add(0).write_unaligned(src[0]);
                ptr.add(1).write_unaligned(src[1]);
                ptr.add(2).write_unaligned(src[2]);
                ptr.add(3).write_unaligned(src[3]);
                ptr.add(4).write_unaligned(src[4]);
            }
        }

        set_style_data_i8(
            buffer,
            StyleKeys::OBJECT_FIT,
            object_to_enum(ObjectFit::Fill),
        );

        // Normal
        set_style_data_i8(buffer, StyleKeys::ALIGN_ITEMS, -1);
        set_style_data_i8(buffer, StyleKeys::ALIGN_SELF, -1);
        set_style_data_i8(buffer, StyleKeys::ALIGN_CONTENT, -1);

        set_style_data_i8(buffer, StyleKeys::JUSTIFY_ITEMS, -1);
        set_style_data_i8(buffer, StyleKeys::JUSTIFY_SELF, -1);
        set_style_data_i8(buffer, StyleKeys::JUSTIFY_CONTENT, -1);

        {
            let src: [i8; 4] = [1, 1, 1, 1];
            // set_style_data_i8(buffer, StyleKeys::MARGIN_LEFT_TYPE, 1);
            // set_style_data_i8(buffer, StyleKeys::MARGIN_TOP_TYPE, 1);
            // set_style_data_i8(buffer, StyleKeys::MARGIN_RIGHT_TYPE, 1);
            // set_style_data_i8(buffer, StyleKeys::MARGIN_BOTTOM_TYPE, 1);

            unsafe {
                std::ptr::copy_nonoverlapping(
                    src.as_ptr(),
                    buffer
                        .as_mut_ptr()
                        .add(StyleKeys::MARGIN_LEFT_TYPE as usize) as *mut i8,
                    4,
                );
            }
        }

        set_style_data_i8(buffer, StyleKeys::TEXT_ALIGN, 5);
        set_style_data_i8(buffer, StyleKeys::TEXT_JUSTIFY, -5);
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

        let mut ascent: f32;
        let mut descent: f32;
        let mut x_height: f32;
        let mut leading: f32;
        let mut cap_height: f32;

        /*
         // Read raw values
        let mut ascent = get_style_data_f32(data, StyleKeys::FONT_METRICS_ASCENT_OFFSET);
        let mut descent = get_style_data_f32(data, StyleKeys::FONT_METRICS_DESCENT_OFFSET);
        let mut x_height = get_style_data_f32(data, StyleKeys::FONT_METRICS_X_HEIGHT_OFFSET);
        let mut leading = get_style_data_f32(data, StyleKeys::FONT_METRICS_LEADING_OFFSET);
        let mut cap_height = get_style_data_f32(data, StyleKeys::FONT_METRICS_CAP_HEIGHT_OFFSET);
         */

        unsafe {
            let ptr = data
                .as_ptr()
                .add(StyleKeys::FONT_METRICS_ASCENT_OFFSET as usize)
                as *const u32;

            ascent = f32::from_bits(u32::from_le(ptr.add(0).read_unaligned()));
            descent = f32::from_bits(u32::from_le(ptr.add(1).read_unaligned()));
            x_height = f32::from_bits(u32::from_le(ptr.add(2).read_unaligned()));
            leading = f32::from_bits(u32::from_le(ptr.add(3).read_unaligned()));
            cap_height = f32::from_bits(u32::from_le(ptr.add(4).read_unaligned()));
        }

        // Defensive sanitization: normalize sign and replace NaN / extremely-small values
        const EPS: f32 = 1e-6;

        if ascent.is_nan() || ascent.abs() < EPS {
            ascent = FontMetrics::DEFAULT.ascent;
        }
        // Android font ascent may be negative; keep ascent positive for layout math
        if ascent <= 0.0 {
            ascent = ascent.abs();
        }

        if descent.is_nan() || descent < 0.0 || descent.abs() < EPS {
            descent = FontMetrics::DEFAULT.descent;
        }

        if x_height.is_nan() || x_height.abs() < EPS {
            x_height = FontMetrics::DEFAULT.x_height;
        }

        if leading.is_nan() || leading.abs() < EPS {
            // allow leading to be zero
            leading = FontMetrics::DEFAULT.leading;
        }

        if cap_height.is_nan() || cap_height.abs() < EPS {
            cap_height = FontMetrics::DEFAULT.cap_height;
        }

        FontMetrics {
            ascent,
            descent,
            x_height,
            leading,
            cap_height,
        }
    }

    /// Set font metrics
    pub fn set_font_metrics(&mut self, metrics: FontMetrics) {
        let data = self.data_mut();
        /*
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

        */

        let src: [f32; 5] = [
            metrics.ascent,
            metrics.descent,
            metrics.x_height,
            metrics.leading,
            metrics.cap_height,
        ];

        unsafe {
            let ptr = data
                .as_mut_ptr()
                .add(StyleKeys::FONT_METRICS_ASCENT_OFFSET as usize)
                as *mut u32;

            for i in 0..5 {
                ptr.add(i).write_unaligned(src[i].to_bits().to_le());
            }
        }
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
        let data = self.data();
        unsafe {
            let mut inset_type = [0i8; 4];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::INSET_LEFT_TYPE as usize) as *const i8,
                inset_type.as_mut_ptr(),
                4,
            );

            let ptr = data.as_ptr().add(StyleKeys::INSET_LEFT_VALUE as usize) as *const u32;

            let values = [
                f32::from_bits(ptr.add(0).read_unaligned()),
                f32::from_bits(ptr.add(1).read_unaligned()),
                f32::from_bits(ptr.add(2).read_unaligned()),
                f32::from_bits(ptr.add(3).read_unaligned()),
            ];

            Rect {
                left: length_percentage_auto_from_type_value(inset_type[0], values[0]),
                right: length_percentage_auto_from_type_value(inset_type[1], values[1]),
                top: length_percentage_auto_from_type_value(inset_type[2], values[2]),
                bottom: length_percentage_auto_from_type_value(inset_type[3], values[3]),
            }
        }
    }

    pub fn set_inset(&mut self, value: Rect<LengthPercentageAuto>) {
        self.prepare_mut();
        let (lt, lv) = length_percentage_auto_to_type_value(value.left);
        let (rt, rv) = length_percentage_auto_to_type_value(value.right);
        let (tt, tv) = length_percentage_auto_to_type_value(value.top);
        let (bt, bv) = length_percentage_auto_to_type_value(value.bottom);

        let inset_type = [lt, rt, tt, bt];
        let inset_value = [lv.to_bits(), rv.to_bits(), tv.to_bits(), bv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                inset_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::INSET_LEFT_TYPE as usize) as *mut i8,
                4,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::INSET_LEFT_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(inset_value[0]);
            ptr.add(1).write_unaligned(inset_value[1]);
            ptr.add(2).write_unaligned(inset_value[2]);
            ptr.add(3).write_unaligned(inset_value[3]);
        }
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
        let data = self.data();
        unsafe {
            let mut margin_type = [0i8; 4];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::MARGIN_LEFT_TYPE as usize) as *const i8,
                margin_type.as_mut_ptr(),
                4,
            );

            let ptr = data.as_ptr().add(StyleKeys::MARGIN_LEFT_VALUE as usize) as *const u32;

            let values = [
                f32::from_bits(ptr.add(0).read_unaligned()),
                f32::from_bits(ptr.add(1).read_unaligned()),
                f32::from_bits(ptr.add(2).read_unaligned()),
                f32::from_bits(ptr.add(3).read_unaligned()),
            ];

            Rect {
                left: length_percentage_auto_from_type_value(margin_type[0], values[0]),
                right: length_percentage_auto_from_type_value(margin_type[1], values[1]),
                top: length_percentage_auto_from_type_value(margin_type[2], values[2]),
                bottom: length_percentage_auto_from_type_value(margin_type[3], values[3]),
            }
        }
    }

    pub fn set_margin(&mut self, value: Rect<LengthPercentageAuto>) {
        self.prepare_mut();
        let (lt, lv) = length_percentage_auto_to_type_value(value.left);
        let (rt, rv) = length_percentage_auto_to_type_value(value.right);
        let (tt, tv) = length_percentage_auto_to_type_value(value.top);
        let (bt, bv) = length_percentage_auto_to_type_value(value.bottom);

        let margin_type = [lt, rt, tt, bt];
        let margin_value = [lv.to_bits(), rv.to_bits(), tv.to_bits(), bv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                margin_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::MARGIN_LEFT_TYPE as usize) as *mut i8,
                4,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::MARGIN_LEFT_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(margin_value[0]);
            ptr.add(1).write_unaligned(margin_value[1]);
            ptr.add(2).write_unaligned(margin_value[2]);
            ptr.add(3).write_unaligned(margin_value[3]);
        }
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
        let data = self.data();
        unsafe {
            let mut padding_type = [0i8; 4];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::PADDING_LEFT_TYPE as usize) as *const i8,
                padding_type.as_mut_ptr(),
                4,
            );

            let ptr = data.as_ptr().add(StyleKeys::PADDING_LEFT_VALUE as usize) as *const u32;

            let values = [
                f32::from_bits(ptr.add(0).read_unaligned()),
                f32::from_bits(ptr.add(1).read_unaligned()),
                f32::from_bits(ptr.add(2).read_unaligned()),
                f32::from_bits(ptr.add(3).read_unaligned()),
            ];

            Rect {
                left: length_percentage_from_type_value(padding_type[0], values[0]),
                right: length_percentage_from_type_value(padding_type[1], values[1]),
                top: length_percentage_from_type_value(padding_type[2], values[2]),
                bottom: length_percentage_from_type_value(padding_type[3], values[3]),
            }
        }
    }

    pub fn set_padding(&mut self, value: Rect<LengthPercentage>) {
        self.prepare_mut();

        let (lt, lv) = length_percentage_to_type_value(value.left);
        let (rt, rv) = length_percentage_to_type_value(value.right);
        let (tt, tv) = length_percentage_to_type_value(value.top);
        let (bt, bv) = length_percentage_to_type_value(value.bottom);

        let padding_type = [lt, rt, tt, bt];
        let padding_value = [lv.to_bits(), rv.to_bits(), tv.to_bits(), bv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                padding_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::PADDING_LEFT_TYPE as usize) as *mut i8,
                4,
            );

            let ptr = data
                .as_mut_ptr()
                .add(StyleKeys::PADDING_LEFT_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(padding_value[0]);
            ptr.add(1).write_unaligned(padding_value[1]);
            ptr.add(2).write_unaligned(padding_value[2]);
            ptr.add(3).write_unaligned(padding_value[3]);
        }
    }

    pub fn get_border(&self) -> Rect<LengthPercentage> {
        let data = self.data();
        unsafe {
            let mut border_type = [0i8; 4];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::BORDER_LEFT_TYPE as usize) as *const i8,
                border_type.as_mut_ptr(),
                4,
            );

            let ptr = data.as_ptr().add(StyleKeys::BORDER_LEFT_VALUE as usize) as *const u32;

            let values = [
                f32::from_bits(ptr.add(0).read_unaligned()),
                f32::from_bits(ptr.add(1).read_unaligned()),
                f32::from_bits(ptr.add(2).read_unaligned()),
                f32::from_bits(ptr.add(3).read_unaligned()),
            ];

            Rect {
                left: length_percentage_from_type_value(border_type[0], values[0]),
                right: length_percentage_from_type_value(border_type[1], values[1]),
                top: length_percentage_from_type_value(border_type[2], values[2]),
                bottom: length_percentage_from_type_value(border_type[3], values[3]),
            }
        }
    }

    pub fn set_border(&mut self, value: Rect<LengthPercentage>) {
        self.prepare_mut();
        let (lt, lv) = length_percentage_to_type_value(value.left);
        let (rt, rv) = length_percentage_to_type_value(value.right);
        let (tt, tv) = length_percentage_to_type_value(value.top);
        let (bt, bv) = length_percentage_to_type_value(value.bottom);

        let border_type = [lt, rt, tt, bt];
        let border_value = [lv.to_bits(), rv.to_bits(), tv.to_bits(), bv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                border_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::BORDER_LEFT_TYPE as usize) as *mut i8,
                4,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::BORDER_LEFT_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(border_value[0]);
            ptr.add(1).write_unaligned(border_value[1]);
            ptr.add(2).write_unaligned(border_value[2]);
            ptr.add(3).write_unaligned(border_value[3]);
        }
    }

    pub fn get_size(&self) -> Size<Dimension> {
        let data = self.data();
        unsafe {
            let mut size_type = [0i8; 2];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::WIDTH_TYPE as usize) as *const i8,
                size_type.as_mut_ptr(),
                2,
            );

            let ptr = data.as_ptr().add(StyleKeys::WIDTH_VALUE as usize) as *const u32;

            Size {
                width: dimension_from_type_value(
                    size_type[0],
                    f32::from_bits(ptr.add(0).read_unaligned()),
                ),
                height: dimension_from_type_value(
                    size_type[1],
                    f32::from_bits(ptr.add(1).read_unaligned()),
                ),
            }
        }
    }

    pub fn set_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let (wt, wv) = dimension_to_type_value(value.width);
        let (ht, hv) = dimension_to_type_value(value.height);

        let size_type = [wt, ht];
        let size_value = [wv.to_bits(), hv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                size_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::WIDTH_TYPE as usize) as *mut i8,
                2,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::WIDTH_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(size_value[0]);
            ptr.add(1).write_unaligned(size_value[1]);
        }
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
        let data = self.data();
        unsafe {
            let mut size_type = [0i8; 2];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::MIN_WIDTH_TYPE as usize) as *const i8,
                size_type.as_mut_ptr(),
                2,
            );

            let ptr = data.as_ptr().add(StyleKeys::MIN_WIDTH_VALUE as usize) as *const u32;

            Size {
                width: dimension_from_type_value(
                    size_type[0],
                    f32::from_bits(ptr.add(0).read_unaligned()),
                ),
                height: dimension_from_type_value(
                    size_type[1],
                    f32::from_bits(ptr.add(1).read_unaligned()),
                ),
            }
        }
    }

    pub fn set_min_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let (wt, wv) = dimension_to_type_value(value.width);
        let (ht, hv) = dimension_to_type_value(value.height);

        let size_type = [wt, ht];
        let size_value = [wv.to_bits(), hv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                size_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::MIN_WIDTH_TYPE as usize) as *mut i8,
                2,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::MIN_WIDTH_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(size_value[0]);
            ptr.add(1).write_unaligned(size_value[1]);
        }
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
        let data = self.data();
        unsafe {
            let mut size_type = [0i8; 2];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::MAX_WIDTH_TYPE as usize) as *const i8,
                size_type.as_mut_ptr(),
                2,
            );

            let ptr = data.as_ptr().add(StyleKeys::MAX_WIDTH_VALUE as usize) as *const u32;

            Size {
                width: dimension_from_type_value(
                    size_type[0],
                    f32::from_bits(ptr.add(0).read_unaligned()),
                ),
                height: dimension_from_type_value(
                    size_type[1],
                    f32::from_bits(ptr.add(1).read_unaligned()),
                ),
            }
        }
    }

    pub fn set_max_size(&mut self, value: Size<Dimension>) {
        self.prepare_mut();
        let (wt, wv) = dimension_to_type_value(value.width);
        let (ht, hv) = dimension_to_type_value(value.height);

        let size_type = [wt, ht];
        let size_value = [wv.to_bits(), hv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                size_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::MAX_WIDTH_TYPE as usize) as *mut i8,
                2,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::MAX_WIDTH_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(size_value[0]);
            ptr.add(1).write_unaligned(size_value[1]);
        }
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
        let data = self.data();
        unsafe {
            let mut gap_type = [0i8; 2];

            std::ptr::copy_nonoverlapping(
                data.as_ptr().add(StyleKeys::GAP_ROW_TYPE as usize) as *const i8,
                gap_type.as_mut_ptr(),
                2,
            );

            let ptr = data.as_ptr().add(StyleKeys::GAP_ROW_VALUE as usize) as *const u32;

            Size {
                width: length_percentage_from_type_value(
                    gap_type[0],
                    f32::from_bits(ptr.add(0).read_unaligned()),
                ),
                height: length_percentage_from_type_value(
                    gap_type[1],
                    f32::from_bits(ptr.add(1).read_unaligned()),
                ),
            }
        }
    }

    pub fn set_gap(&mut self, value: Size<LengthPercentage>) {
        self.prepare_mut();
        let (rt, rv) = length_percentage_to_type_value(value.width);
        let (ct, cv) = length_percentage_to_type_value(value.height);

        let gap_type = [rt, ct];
        let gap_value = [rv.to_bits(), cv.to_bits()];

        let data = self.data_mut();

        unsafe {
            std::ptr::copy_nonoverlapping(
                gap_type.as_ptr(),
                data.as_mut_ptr().add(StyleKeys::GAP_ROW_TYPE as usize) as *mut i8,
                2,
            );

            let ptr = data.as_mut_ptr().add(StyleKeys::GAP_ROW_VALUE as usize) as *mut u32;

            ptr.add(0).write_unaligned(gap_value[0]);
            ptr.add(1).write_unaligned(gap_value[1]);
        }
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
        text_align_from_enum(get_style_data_i8(self.data(), StyleKeys::ALIGN)).unwrap()
    }

    pub fn set_text_align(&mut self, value: TextAlign) {
        self.prepare_mut();
        set_style_data_i8(self.data_mut(), StyleKeys::ALIGN, text_align_to_enum(value))
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
                // The parser already stores 1-based CSS grid line indices,
                // so use them directly.
                self.grid_row_start = GridPlacement::from_line_index(area.row_start as i16);
                self.grid_row_end = GridPlacement::from_line_index(area.row_end as i16);
                self.grid_column_start =
                    GridPlacement::from_line_index(area.column_start as i16);
                self.grid_column_end = GridPlacement::from_line_index(area.column_end as i16);
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

    // ── Transform buffer helpers ────────────────────────────────────────

    #[inline]
    pub fn transform_count(&self) -> u8 {
        self.data()[StyleKeys::TRANSFORM_COUNT as usize]
    }

    #[inline]
    pub fn transform_flags(&self) -> u8 {
        self.data()[StyleKeys::TRANSFORM_FLAGS as usize]
    }

    #[inline]
    pub fn has_transform_matrix(&self) -> bool {
        (self.transform_flags() & TRANSFORM_FLAG_HAS_MATRIX) != 0
    }

    #[inline]
    pub fn is_transform_3d(&self) -> bool {
        (self.transform_flags() & TRANSFORM_FLAG_IS_3D) != 0
    }

    #[inline]
    pub fn set_transform_count(&mut self, count: u8) {
        self.data_mut()[StyleKeys::TRANSFORM_COUNT as usize] = count;
    }

    #[inline]
    pub fn set_transform_flags(&mut self, flags: u8) {
        self.data_mut()[StyleKeys::TRANSFORM_FLAGS as usize] = flags;
    }

    pub fn set_transform_op(&mut self, slot: usize, op_type: TransformOpType, a: f32, b: f32) {
        debug_assert!(slot < MAX_INLINE_TRANSFORM_OPS);
        let base = StyleKeys::TRANSFORM_OP_0 as usize + slot * TRANSFORM_OP_SIZE;
        let buf = self.data_mut();
        buf[base] = op_type as u8;
        buf[base + 1] = 0; // padding
        buf[base + 2] = 0;
        buf[base + 3] = 0;
        let a_bytes = if cfg!(target_endian = "little") {
            a.to_le_bytes()
        } else {
            a.to_be_bytes()
        };
        let b_bytes = if cfg!(target_endian = "little") {
            b.to_le_bytes()
        } else {
            b.to_be_bytes()
        };
        buf[base + 4..base + 8].copy_from_slice(&a_bytes);
        buf[base + 8..base + 12].copy_from_slice(&b_bytes);
    }

    pub fn get_transform_op(&self, slot: usize) -> (TransformOpType, f32, f32) {
        debug_assert!(slot < MAX_INLINE_TRANSFORM_OPS);
        let base = StyleKeys::TRANSFORM_OP_0 as usize + slot * TRANSFORM_OP_SIZE;
        let buf = self.data();
        let op_type = TransformOpType::from_u8(buf[base]);
        let a = if cfg!(target_endian = "little") {
            f32::from_le_bytes([buf[base + 4], buf[base + 5], buf[base + 6], buf[base + 7]])
        } else {
            f32::from_be_bytes([buf[base + 4], buf[base + 5], buf[base + 6], buf[base + 7]])
        };
        let b = if cfg!(target_endian = "little") {
            f32::from_le_bytes([buf[base + 8], buf[base + 9], buf[base + 10], buf[base + 11]])
        } else {
            f32::from_be_bytes([buf[base + 8], buf[base + 9], buf[base + 10], buf[base + 11]])
        };
        (op_type, a, b)
    }

    pub fn set_transform_matrix(&mut self, matrix: &[f32; 16]) {
        let base = StyleKeys::TRANSFORM_MATRIX as usize;
        let buf = self.data_mut();
        for (i, &val) in matrix.iter().enumerate() {
            let offset = base + i * 4;
            let bytes = if cfg!(target_endian = "little") {
                val.to_le_bytes()
            } else {
                val.to_be_bytes()
            };
            buf[offset..offset + 4].copy_from_slice(&bytes);
        }
    }

    pub fn get_transform_matrix(&self) -> [f32; 16] {
        let base = StyleKeys::TRANSFORM_MATRIX as usize;
        let buf = self.data();
        let mut matrix = [0f32; 16];
        for i in 0..16 {
            let offset = base + i * 4;
            matrix[i] = if cfg!(target_endian = "little") {
                f32::from_le_bytes([
                    buf[offset],
                    buf[offset + 1],
                    buf[offset + 2],
                    buf[offset + 3],
                ])
            } else {
                f32::from_be_bytes([
                    buf[offset],
                    buf[offset + 1],
                    buf[offset + 2],
                    buf[offset + 3],
                ])
            };
        }
        matrix
    }

    pub fn clear_transform(&mut self) {
        let buf = self.data_mut();
        // Zero the entire transform region (422-559)
        for i in StyleKeys::TRANSFORM_COUNT as usize..StyleKeys::TRANSFORM_MATRIX as usize + 64 {
            buf[i] = 0;
        }
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
