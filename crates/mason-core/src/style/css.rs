//! CSS value parsing shared by the platform style adapters.

use cssparser::{Parser, ParserInput, Token};

mod animation;
pub mod background;
mod border;
pub mod clip_path;
mod color;
mod declarations;
mod effects;
mod decoration;
pub mod gradient;
pub mod grid;
mod layout_shorthand;
mod keywords;
pub mod length;
pub(crate) mod layout_length;
pub mod mask;
pub mod nine_slice;
pub mod shorthand;
mod svg_css;
pub mod svg_path;
mod svg_values;
mod position;
mod text;
pub mod text_overflow;
pub mod transform;

pub use declarations::compile_inline_style;
pub use declarations::compile_inline_style_replay;
pub use effects::EffectBatch;
pub use color::visit_color_functions;

/// Parses a value into the packed numeric fields shared by the native adapters.
pub fn parse_css_fields(input: &str, context: LengthContext, kind: u8, color: u32) -> Option<Vec<f64>> {
    use CssParseKind::*;
    let kind = CssParseKind::from_index(kind)?;
    match kind {
        Shadows => Some(parse_shadows(input, context, color).into_iter().flat_map(|shadow| shadow.packed()).collect()),
        Filters => Some(parse_filters(input, context, color).into_iter().flat_map(|filter| filter.packed()).collect()),
        TransformOrigin | ObjectPosition => position::resolve_position(input, context, kind == TransformOrigin).map(Vec::from),
        LineHeight | LetterSpacing | TextIndent | WordSpacing => text::resolve_length(input, context, kind).map(Vec::from),
        VerticalAlign => text::resolve_vertical_align(input, context).map(Vec::from),
        Length => length::resolve(input, context, length::LengthMode::Normal).map(Vec::from),
        FontSize => length::resolve(input, context, length::LengthMode::FontSize).map(Vec::from),
        ClampLength => length::resolve(input, context, length::LengthMode::ClampScalar).map(Vec::from),
        Dimension | LengthAuto => length::resolve_dimension(input, context, kind == Dimension).map(Vec::from),
        BorderRadius | BorderCornerRadius => border::resolve_radii(input, context, kind == BorderCornerRadius),
        SvgNumberList => Some(svg_values::number_list(input)),
        SvgTransform => svg_values::transform(input).map(Vec::from),
        SvgLength => svg_values::length(input).map(Vec::from),
        SvgLengthList => Some(svg_values::length_list(input)),
        SvgOpacity => svg_values::opacity(input).map(|value| vec![value]),
        SvgAngle => svg_values::angle(input).map(|value| vec![value]),
        SvgAspectRatio => Some(Vec::from(svg_values::aspect_ratio(input))),
        SvgNumber => svg_values::number(input).map(|value| vec![value]),
        SvgDashArray => Some(svg_values::dash_array(input)),
    }
}

// <style-keys:records> generated from tools/scripts/style-keys/style-keys.schema
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum StyleRecordKind {
    BoxShadow = 0,
    TextShadow = 1,
    Filter = 2,
    BackdropFilter = 3,
    FontFeatures = 4,
}

impl StyleRecordKind {
    pub const COUNT: usize = 5;

    pub fn from_index(value: u8) -> Option<Self> {
        match value {
            0 => Some(Self::BoxShadow),
            1 => Some(Self::TextShadow),
            2 => Some(Self::Filter),
            3 => Some(Self::BackdropFilter),
            4 => Some(Self::FontFeatures),
            _ => None,
        }
    }

    pub(crate) const fn revision_key(self) -> super::StyleKeys {
        match self {
            Self::BoxShadow => super::StyleKeys::BOX_SHADOW_REVISION,
            Self::TextShadow => super::StyleKeys::TEXT_SHADOW_REVISION,
            Self::Filter => super::StyleKeys::FILTER_REVISION,
            Self::BackdropFilter => super::StyleKeys::BACKDROP_FILTER_REVISION,
            Self::FontFeatures => super::StyleKeys::FONT_FEATURES_REVISION,
        }
    }

    pub(crate) const fn has_byte_revision(self) -> bool {
        matches!(self, Self::FontFeatures)
    }

    pub(crate) const fn stride(self) -> usize {
        match self {
            Self::BoxShadow => ShadowRecord::STRIDE,
            Self::TextShadow => ShadowRecord::STRIDE,
            Self::Filter => FilterRecord::STRIDE,
            Self::BackdropFilter => FilterRecord::STRIDE,
            Self::FontFeatures => FontFeatureRecord::STRIDE,
        }
    }
}

pub struct ShadowRecord;
impl ShadowRecord {
    pub const STRIDE: usize = 6;
    pub const X: usize = 0;
    pub const Y: usize = 1;
    pub const BLUR: usize = 2;
    pub const SPREAD: usize = 3;
    pub const COLOR: usize = 4;
    pub const INSET: usize = 5;
}

pub struct FilterRecord;
impl FilterRecord {
    pub const STRIDE: usize = 5;
    pub const KIND: usize = 0;
    pub const AMOUNT_OR_X: usize = 1;
    pub const Y: usize = 2;
    pub const BLUR: usize = 3;
    pub const COLOR: usize = 4;
}

pub struct FontFeatureRecord;
impl FontFeatureRecord {
    pub const STRIDE: usize = 2;
    pub const TAG: usize = 0;
    pub const VALUE: usize = 1;
}

pub struct BackgroundRecord;
impl BackgroundRecord {
    pub const STRIDE: usize = 17;
    pub const IMAGE_KIND: usize = 0;
    pub const COLOR: usize = 1;
    pub const REPEAT_X: usize = 2;
    pub const REPEAT_Y: usize = 3;
    pub const ORIGIN: usize = 4;
    pub const CLIP: usize = 5;
    pub const ATTACHMENT: usize = 6;
    pub const SIZE_KIND: usize = 7;
    pub const POSITION_X_FRACTION: usize = 8;
    pub const POSITION_X_PIXELS: usize = 9;
    pub const POSITION_Y_FRACTION: usize = 10;
    pub const POSITION_Y_PIXELS: usize = 11;
    pub const WIDTH_FRACTION: usize = 12;
    pub const WIDTH_PIXELS: usize = 13;
    pub const HEIGHT_FRACTION: usize = 14;
    pub const HEIGHT_PIXELS: usize = 15;
    pub const BLEND: usize = 16;
}

pub struct BackgroundOffsetsRecord;
impl BackgroundOffsetsRecord {
    pub const STRIDE: usize = 4;
    pub const POSITION_X: usize = 0;
    pub const POSITION_Y: usize = 1;
    pub const WIDTH: usize = 2;
    pub const HEIGHT: usize = 3;
}

pub struct BackgroundInputRecord;
impl BackgroundInputRecord {
    pub const STRIDE: usize = 8;
    pub const COLOR: usize = 0;
    pub const IMAGE: usize = 1;
    pub const REPEAT: usize = 2;
    pub const POSITION: usize = 3;
    pub const SIZE: usize = 4;
    pub const CLIP: usize = 5;
    pub const ORIGIN: usize = 6;
    pub const ATTACHMENT: usize = 7;
}

pub struct BorderComponentsRecord;
impl BorderComponentsRecord {
    pub const STRIDE: usize = 6;
    pub const TOP: usize = 0;
    pub const RIGHT: usize = 1;
    pub const BOTTOM: usize = 2;
    pub const LEFT: usize = 3;
    pub const STYLE: usize = 4;
    pub const COLOR: usize = 5;
}

pub struct BorderSideComponentsRecord;
impl BorderSideComponentsRecord {
    pub const STRIDE: usize = 3;
    pub const WIDTH: usize = 0;
    pub const STYLE: usize = 1;
    pub const COLOR: usize = 2;
}

pub struct BorderRadiiRecord;
impl BorderRadiiRecord {
    pub const STRIDE: usize = 8;
    pub const HORIZONTAL_TOP_LEFT: usize = 0;
    pub const HORIZONTAL_TOP_RIGHT: usize = 1;
    pub const HORIZONTAL_BOTTOM_RIGHT: usize = 2;
    pub const HORIZONTAL_BOTTOM_LEFT: usize = 3;
    pub const VERTICAL_TOP_LEFT: usize = 4;
    pub const VERTICAL_TOP_RIGHT: usize = 5;
    pub const VERTICAL_BOTTOM_RIGHT: usize = 6;
    pub const VERTICAL_BOTTOM_LEFT: usize = 7;
}

pub struct ClipPathRecord;
impl ClipPathRecord {
    pub const STRIDE: usize = 7;
    pub const KIND: usize = 0;
    pub const BOX: usize = 1;
    pub const EVEN_ODD: usize = 2;
    pub const RADIUS_X_KIND: usize = 3;
    pub const RADIUS_Y_KIND: usize = 4;
    pub const HAS_POSITION: usize = 5;
    pub const HAS_MATH: usize = 6;
}

pub struct SvgPathRecord;
impl SvgPathRecord {
    pub const STRIDE: usize = 8;
    pub const KIND: usize = 0;
    pub const VERTEX_END: usize = 1;
    pub const X1: usize = 2;
    pub const Y1: usize = 3;
    pub const X2: usize = 4;
    pub const Y2: usize = 5;
    pub const X: usize = 6;
    pub const Y: usize = 7;
}

pub struct MaskLayerRecord;
impl MaskLayerRecord {
    pub const STRIDE: usize = 3;
    pub const CLIP: usize = 0;
    pub const MODE: usize = 1;
    pub const COMPOSITE: usize = 2;
}

pub struct MaskInputRecord;
impl MaskInputRecord {
    pub const STRIDE: usize = 8;
    pub const IMAGE: usize = 0;
    pub const SIZE: usize = 1;
    pub const POSITION: usize = 2;
    pub const REPEAT: usize = 3;
    pub const ORIGIN: usize = 4;
    pub const CLIP: usize = 5;
    pub const MODE: usize = 6;
    pub const COMPOSITE: usize = 7;
}

pub struct NineSliceInputRecord;
impl NineSliceInputRecord {
    pub const STRIDE: usize = 6;
    pub const SOURCE: usize = 0;
    pub const SLICE: usize = 1;
    pub const WIDTH: usize = 2;
    pub const OUTSET: usize = 3;
    pub const REPEAT: usize = 4;
    pub const MODE: usize = 5;
}

pub struct NineSliceRecord;
impl NineSliceRecord {
    pub const STRIDE: usize = 4;
    pub const FILL: usize = 0;
    pub const REPEAT_X: usize = 1;
    pub const REPEAT_Y: usize = 2;
    pub const LUMINANCE: usize = 3;
}

pub struct NineSliceSideRecord;
impl NineSliceSideRecord {
    pub const STRIDE: usize = 3;
    pub const KIND: usize = 0;
    pub const VALUE: usize = 1;
    pub const HAS_MATH: usize = 2;
}

pub struct TextDecorationRecord;
impl TextDecorationRecord {
    pub const STRIDE: usize = 4;
    pub const LINE: usize = 0;
    pub const STYLE: usize = 1;
    pub const COLOR: usize = 2;
    pub const THICKNESS: usize = 3;
}

pub struct CssLengthResultRecord;
impl CssLengthResultRecord {
    pub const STRIDE: usize = 2;
    pub const KIND: usize = 0;
    pub const VALUE: usize = 1;
}

pub struct CssPositionResultRecord;
impl CssPositionResultRecord {
    pub const STRIDE: usize = 4;
    pub const X_TYPE: usize = 0;
    pub const X_VALUE: usize = 1;
    pub const Y_TYPE: usize = 2;
    pub const Y_VALUE: usize = 3;
}

pub struct CssDeclarationHeaderRecord;
impl CssDeclarationHeaderRecord {
    pub const STRIDE: usize = 3;
    pub const NAME: usize = 0;
    pub const VALUE: usize = 1;
    pub const FIELD_COUNT: usize = 2;
}

pub struct CssInlineReplayRecord;
impl CssInlineReplayRecord {
    pub const STRIDE: usize = 3;
    pub const VIEWPORT_DEPENDENT: usize = 0;
    pub const FONT_DEPENDENT: usize = 1;
    pub const FONT_SIZE: usize = 2;
}

pub struct CssBackgroundWriteRecord;
impl CssBackgroundWriteRecord {
    pub const STRIDE: usize = 3;
    pub const PROPERTY: usize = 0;
    pub const VALUE: usize = 1;
    pub const CURRENT_COLOR: usize = 2;
}

pub struct CssBackgroundResultRecord;
impl CssBackgroundResultRecord {
    pub const STRIDE: usize = 8;
    pub const LAYERS_CHANGED: usize = 0;
    pub const IMAGES_REPLACED: usize = 1;
    pub const IMAGE_DECLARATION: usize = 2;
    pub const SHORTHAND_VALUE: usize = 3;
    pub const COLOR: usize = 4;
    pub const COLOR_FROM_SHORTHAND: usize = 5;
    pub const LAST_IMAGE_FROM_SHORTHAND: usize = 6;
    pub const SHORTHAND_RESET: usize = 7;
}

pub struct CssEffectWriteRecord;
impl CssEffectWriteRecord {
    pub const STRIDE: usize = 3;
    pub const PROPERTY: usize = 0;
    pub const VALUE: usize = 1;
    pub const CURRENT_COLOR: usize = 2;
}

pub struct CssEffectResultRecord;
impl CssEffectResultRecord {
    pub const STRIDE: usize = 2;
    pub const VALUE: usize = 0;
    pub const RECORDS: usize = 1;
}

pub struct CssMaskWriteRecord;
impl CssMaskWriteRecord {
    pub const STRIDE: usize = 2;
    pub const SLOT: usize = 0;
    pub const VALUE: usize = 1;
}

pub struct CssBorderResultRecord;
impl CssBorderResultRecord {
    pub const STRIDE: usize = 10;
    pub const TOP_KIND: usize = 0;
    pub const TOP_VALUE: usize = 1;
    pub const RIGHT_KIND: usize = 2;
    pub const RIGHT_VALUE: usize = 3;
    pub const BOTTOM_KIND: usize = 4;
    pub const BOTTOM_VALUE: usize = 5;
    pub const LEFT_KIND: usize = 6;
    pub const LEFT_VALUE: usize = 7;
    pub const STYLE: usize = 8;
    pub const COLOR: usize = 9;
}

pub struct CssBorderSideResultRecord;
impl CssBorderSideResultRecord {
    pub const STRIDE: usize = 4;
    pub const KIND: usize = 0;
    pub const VALUE: usize = 1;
    pub const STYLE: usize = 2;
    pub const COLOR: usize = 3;
}

pub struct GradientInterpolationRecord;
impl GradientInterpolationRecord {
    pub const STRIDE: usize = 3;
    pub const DIRECTION: usize = 0;
    pub const SPACE: usize = 1;
    pub const HUE: usize = 2;
}

pub struct AndroidPaintReadRecord;
impl AndroidPaintReadRecord {
    pub const STRIDE: usize = 6;
    pub const VALUES: usize = 0;
    pub const IMAGES: usize = 1;
    pub const OFFSETS: usize = 2;
    pub const GRADIENTS: usize = 3;
    pub const GRADIENT_INFO: usize = 4;
    pub const SNAPSHOT: usize = 5;
}

pub struct AndroidGradientInfoRecord;
impl AndroidGradientInfoRecord {
    pub const STRIDE: usize = 6;
    pub const KIND: usize = 0;
    pub const REPEATING: usize = 1;
    pub const STOP_COUNT: usize = 2;
    pub const DIRECTION: usize = 3;
    pub const SPACE: usize = 4;
    pub const HUE: usize = 5;
}

pub struct SvgFontPrefixRecord;
impl SvgFontPrefixRecord {
    pub const STRIDE: usize = 3;
    pub const ITALIC: usize = 0;
    pub const WEIGHT: usize = 1;
    pub const SIZE: usize = 2;
}

pub struct SvgCssDeclarationRecord;
impl SvgCssDeclarationRecord {
    pub const STRIDE: usize = 3;
    pub const NAME: usize = 0;
    pub const VALUE: usize = 1;
    pub const IMPORTANT: usize = 2;
}

pub struct SvgCssSelectorRecord;
impl SvgCssSelectorRecord {
    pub const STRIDE: usize = 3;
    pub const TYPE: usize = 0;
    pub const ID_COUNT: usize = 1;
    pub const CLASS_COUNT: usize = 2;
}

pub struct SvgCssRuleRecord;
impl SvgCssRuleRecord {
    pub const STRIDE: usize = 2;
    pub const SELECTOR_COUNT: usize = 0;
    pub const DECLARATION_COUNT: usize = 1;
}

pub struct SvgPaintRecord;
impl SvgPaintRecord {
    pub const STRIDE: usize = 2;
    pub const KIND: usize = 0;
    pub const VALUE: usize = 1;
}

pub struct CssAnimationLayerRecord;
impl CssAnimationLayerRecord {
    pub const STRIDE: usize = 1;
    pub const COMPONENT_COUNT: usize = 0;
}

pub struct CssAnimationComponentRecord;
impl CssAnimationComponentRecord {
    pub const STRIDE: usize = 3;
    pub const KIND: usize = 0;
    pub const VALUE: usize = 1;
    pub const UNIT: usize = 2;
}

pub struct SvgLengthComponentsRecord;
impl SvgLengthComponentsRecord {
    pub const STRIDE: usize = 2;
    pub const LENGTH: usize = 0;
    pub const PERCENT: usize = 1;
}

pub struct SvgAffineRecord;
impl SvgAffineRecord {
    pub const STRIDE: usize = 6;
    pub const A: usize = 0;
    pub const B: usize = 1;
    pub const C: usize = 2;
    pub const D: usize = 3;
    pub const X: usize = 4;
    pub const Y: usize = 5;
}

pub struct SvgAspectRatioRecord;
impl SvgAspectRatioRecord {
    pub const STRIDE: usize = 4;
    pub const ALIGN_X: usize = 0;
    pub const ALIGN_Y: usize = 1;
    pub const UNIFORM: usize = 2;
    pub const SLICE: usize = 3;
}

#[repr(u8)]
#[derive(Clone, Copy, Debug)]
pub enum FilterKind {
    Blur = 0,
    Brightness = 1,
    Contrast = 2,
    Saturate = 3,
    HueRotate = 4,
    Invert = 5,
    Opacity = 6,
    Sepia = 7,
    Grayscale = 8,
    DropShadow = 9,
}

impl FilterKind {
    fn from_name(name: &str) -> Option<Self> {
        match name.to_ascii_lowercase().as_str() {
            "blur" => Some(Self::Blur),
            "brightness" => Some(Self::Brightness),
            "contrast" => Some(Self::Contrast),
            "saturate" => Some(Self::Saturate),
            "hue-rotate" => Some(Self::HueRotate),
            "invert" => Some(Self::Invert),
            "opacity" => Some(Self::Opacity),
            "sepia" => Some(Self::Sepia),
            "grayscale" => Some(Self::Grayscale),
            "drop-shadow" => Some(Self::DropShadow),
            _ => None,
        }
    }

    fn from_index(value: u8) -> Option<Self> {
        match value {
            0 => Some(Self::Blur),
            1 => Some(Self::Brightness),
            2 => Some(Self::Contrast),
            3 => Some(Self::Saturate),
            4 => Some(Self::HueRotate),
            5 => Some(Self::Invert),
            6 => Some(Self::Opacity),
            7 => Some(Self::Sepia),
            8 => Some(Self::Grayscale),
            9 => Some(Self::DropShadow),
            _ => None,
        }
    }
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum CssParseKind {
    Shadows = 0,
    Filters = 1,
    Length = 2,
    FontSize = 3,
    ClampLength = 4,
    TransformOrigin = 5,
    ObjectPosition = 6,
    LineHeight = 7,
    LetterSpacing = 8,
    TextIndent = 9,
    WordSpacing = 10,
    VerticalAlign = 11,
    Dimension = 12,
    LengthAuto = 13,
    BorderRadius = 14,
    BorderCornerRadius = 15,
    SvgNumberList = 16,
    SvgTransform = 17,
    SvgLength = 18,
    SvgLengthList = 19,
    SvgOpacity = 20,
    SvgAngle = 21,
    SvgAspectRatio = 22,
    SvgNumber = 23,
    SvgDashArray = 24,
}

impl CssParseKind {
    fn from_index(value: u8) -> Option<Self> {
        match value {
            0 => Some(Self::Shadows),
            1 => Some(Self::Filters),
            2 => Some(Self::Length),
            3 => Some(Self::FontSize),
            4 => Some(Self::ClampLength),
            5 => Some(Self::TransformOrigin),
            6 => Some(Self::ObjectPosition),
            7 => Some(Self::LineHeight),
            8 => Some(Self::LetterSpacing),
            9 => Some(Self::TextIndent),
            10 => Some(Self::WordSpacing),
            11 => Some(Self::VerticalAlign),
            12 => Some(Self::Dimension),
            13 => Some(Self::LengthAuto),
            14 => Some(Self::BorderRadius),
            15 => Some(Self::BorderCornerRadius),
            16 => Some(Self::SvgNumberList),
            17 => Some(Self::SvgTransform),
            18 => Some(Self::SvgLength),
            19 => Some(Self::SvgLengthList),
            20 => Some(Self::SvgOpacity),
            21 => Some(Self::SvgAngle),
            22 => Some(Self::SvgAspectRatio),
            23 => Some(Self::SvgNumber),
            24 => Some(Self::SvgDashArray),
            _ => None,
        }
    }
}
// </style-keys:records>

// <style-keys:mask-slots> generated from tools/scripts/style-keys/style-keys.schema
pub(crate) const MASK_CLIP_PATH_SLOT: usize = 14;

pub(crate) fn mask_style_slot(name: &str) -> Option<usize> {
    match name {
        "mask-image" => Some(0),
        "mask-size" => Some(1),
        "mask-position" => Some(2),
        "mask-repeat" => Some(3),
        "mask-origin" => Some(4),
        "mask-clip" => Some(5),
        "mask-mode" => Some(6),
        "mask-composite" => Some(7),
        "clip-path" => Some(14),
        "mask-border-source" => Some(8),
        "mask-border-slice" => Some(9),
        "mask-border-width" => Some(10),
        "mask-border-outset" => Some(11),
        "mask-border-repeat" => Some(12),
        "mask-border-mode" => Some(13),
        _ => None,
    }
}
// </style-keys:mask-slots>

impl StyleRecordKind {
    pub fn parse(self, value: &str, context: LengthContext, current_color: u32) -> Option<Vec<f64>> {
        Some(match self {
            Self::BoxShadow | Self::TextShadow => parse_shadows(value, context, current_color)
                .into_iter()
                .flat_map(Shadow::packed)
                .collect(),
            Self::Filter | Self::BackdropFilter => parse_filters(value, context, current_color)
                .into_iter()
                .flat_map(Filter::packed)
                .collect(),
            Self::FontFeatures => return text::font_features(value),
        })
    }

    // An explicitly empty font feature list ("normal") overrides inherited features.
    pub fn stores_empty(self) -> bool {
        self == Self::FontFeatures
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct LengthContext {
    pub scale: f32,
    pub font_size: f32,
    pub root_font_size: f32,
    pub viewport_width: f32,
    pub viewport_height: f32,
}

impl LengthContext {
    pub(crate) fn for_scale(scale: f32) -> Self {
        Self { scale, font_size: 0., root_font_size: 16., viewport_width: 0., viewport_height: 0. }
    }

    fn resolve_factor(self, unit: &str) -> f64 {
        let scale = f64::from(self.scale);
        let root = f64::from(self.root_font_size);
        let width = f64::from(self.viewport_width);
        let height = f64::from(self.viewport_height);
        match unit {
            "dppx" => 1.,
            "em" => {
                let em = if self.font_size > 0. { f64::from(self.font_size) } else { root };
                em * scale
            }
            "rem" => root * scale,
            "vw" => width * scale / 100.,
            "vh" => height * scale / 100.,
            "vmin" => width.min(height) * scale / 100.,
            "vmax" => width.max(height) * scale / 100.,
            "pt" => scale * (96. / 72.),
            "pc" => scale * 16.,
            "in" => scale * 96.,
            "cm" => scale * (96. / 2.54),
            "mm" => scale * (96. / 25.4),
            "q" => scale * (96. / 101.6),
            _ => scale,
        }
    }

    fn resolve(self, value: f32, unit: &str) -> Option<f32> {
        let resolved = (f64::from(value) * self.resolve_factor(unit)) as f32;
        resolved.is_finite().then_some(resolved)
    }
}

fn number(token: &Token<'_>) -> Option<f32> {
    let value = match token {
        Token::Number { value, .. } => *value,
        Token::Percentage { unit_value, .. } => *unit_value,
        _ => return None,
    };
    value.is_finite().then_some(value)
}

fn angle(token: &Token<'_>) -> Option<f32> {
    let value = match token {
        Token::Dimension { value, unit, .. } => (f64::from(*value) * angle_factor(unit)?) as f32,
        Token::Number { value, .. } => *value,
        _ => return None,
    };
    value.is_finite().then_some(value)
}

fn angle_factor(unit: &str) -> Option<f64> {
    Some(match unit.to_ascii_lowercase().as_str() {
        "deg" => 1.,
        "grad" => 0.9,
        "rad" => 180. / std::f64::consts::PI,
        "turn" => 360.,
        _ => return None,
    })
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Shadow {
    pub x: f32,
    pub y: f32,
    pub blur: f32,
    pub spread: f32,
    pub color: u32,
    pub inset: bool,
}

impl Shadow {
    pub fn packed(self) -> [f64; ShadowRecord::STRIDE] {
        let mut record = [0.; ShadowRecord::STRIDE];
        record[ShadowRecord::X] = self.x.into();
        record[ShadowRecord::Y] = self.y.into();
        record[ShadowRecord::BLUR] = self.blur.into();
        record[ShadowRecord::SPREAD] = self.spread.into();
        record[ShadowRecord::COLOR] = self.color.into();
        record[ShadowRecord::INSET] = u8::from(self.inset).into();
        record
    }
}

#[derive(Debug)]
enum EffectLength {
    Literal(length::LiteralLength),
    Math(Box<length::Expression>),
}

impl EffectLength {
    fn read<'i>(
        parser: &mut Parser<'i, '_>,
        start: &cssparser::ParserState,
        token: &Token<'i>,
    ) -> Result<Option<Self>, cssparser::ParseError<'i, ()>> {
        if length::is_math(token) {
            parser.reset(start);
            return Ok(Some(Self::Math(Box::new(length::parse_component(parser)?))));
        }
        Ok(length::LiteralLength::parse(token).map(Self::Literal))
    }

    const ZERO: Self = Self::Literal(length::LiteralLength::ZERO);

    fn resolve(&self, context: LengthContext) -> Option<f32> {
        let value = match self {
            Self::Literal(length) => return Some(length.components(context).1),
            Self::Math(expression) => match expression.resolve(context)? {
                [0., amount] => amount * f64::from(context.scale),
                [1., amount] => amount,
                // Effect lengths have no percentage basis.
                [2., _] => 0.,
                _ => return None,
            },
        } as f32;
        value.is_finite().then_some(value)
    }
}

#[derive(Debug)]
struct ShadowDefinition<L, C> {
    lengths: [L; 4],
    color: Option<C>,
    inset: bool,
}

impl ShadowDefinition<EffectLength, u32> {
    fn resolve(&self, context: LengthContext, current_color: u32) -> Option<Shadow> {
        let [x, y, blur, spread] = &self.lengths;
        Some(Shadow {
            x: x.resolve(context)?,
            y: y.resolve(context)?,
            blur: blur.resolve(context)?.max(0.),
            spread: spread.resolve(context)?,
            color: self.color.unwrap_or(current_color),
            inset: self.inset,
        })
    }
}

pub fn parse_shadows(value: &str, context: LengthContext, current_color: u32) -> Vec<Shadow> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    parse_native_shadow_list(&mut parser)
        .into_iter()
        .filter_map(|shadow| shadow.resolve(context, current_color))
        .collect()
}

fn parse_native_shadow_list(
    parser: &mut Parser<'_, '_>,
) -> Vec<ShadowDefinition<EffectLength, u32>> {
    parse_shadow_list(
        parser,
        || EffectLength::ZERO,
        |length, _, _| Some(length),
        read_shadow_color,
    )
}

fn read_shadow_color(parser: &mut Parser<'_, '_>) -> Result<Option<u32>, ()> {
    if parser
        .try_parse(|parser| parser.expect_ident_matching("currentcolor"))
        .is_ok()
    {
        return Ok(None);
    }
    color::parse_next(parser, None).map(Some).ok_or(())
}

/// Return the same shadow components as the native parser, with source colors and client units.
pub fn visit_portable_shadows(
    value: &str,
    resolve_length: impl Fn(&str) -> Option<f64>,
    mut visit: impl FnMut([f64; 4], bool, Option<&str>),
) {
    let mut input = ParserInput::new(value);
    for shadow in parse_shadow_list(
        &mut Parser::new(&mut input),
        || 0.,
        |length, source, token| portable_effect_length(length, source, token, &resolve_length),
        read_portable_shadow_color,
    ) {
        let [x, y, blur, spread] = shadow.lengths;
        visit([x, y, blur.max(0.), spread], shadow.inset, shadow.color);
    }
}

fn portable_effect_length(
    length: EffectLength,
    source: &str,
    token: Token<'_>,
    resolve_length: &impl Fn(&str) -> Option<f64>,
) -> Option<f64> {
    resolve_length(source)
        .filter(|value| value.is_finite())
        .or_else(|| match length {
            EffectLength::Literal(_) => length::token_value(token, source).map(|(value, _)| value),
            EffectLength::Math(_) => length.resolve(LengthContext::for_scale(1.)).map(f64::from),
        })
}

fn read_portable_shadow_color<'i>(parser: &mut Parser<'i, '_>) -> Result<Option<&'i str>, ()> {
    let start = parser.position();
    match parser.next().map_err(|_| ())? {
        Token::Function(_) => {
            parser
                .parse_nested_block(|body| {
                    while body.next_including_whitespace_and_comments().is_ok() {}
                    Ok::<_, cssparser::ParseError<'_, ()>>(())
                })
                .map_err(|_| ())?;
        }
        Token::Ident(_) | Token::Hash(_) | Token::IDHash(_) => {}
        _ => return Err(()),
    }
    Ok(Some(parser.slice_from(start)))
}

fn parse_shadow_list<'i, L, C>(
    parser: &mut Parser<'i, '_>,
    default_length: impl Fn() -> L,
    mut length_value: impl FnMut(EffectLength, &'i str, Token<'i>) -> Option<L>,
    mut color_value: impl FnMut(&mut Parser<'i, '_>) -> Result<Option<C>, ()>,
) -> Vec<ShadowDefinition<L, C>> {
    parser
        .parse_comma_separated::<_, _, ()>(|layer| {
            let mut lengths = std::array::from_fn(|_| default_length());
            let mut count = 0;
            let mut valid = true;
            let mut inset = false;
            let mut color = None;
            loop {
                layer.skip_whitespace();
                let state = layer.state();
                let start = layer.position();
                let Ok(token) = layer.next().cloned() else {
                    break;
                };
                let length = match EffectLength::read(layer, &state, &token) {
                    Ok(length) => length,
                    Err(_) => {
                        valid = false;
                        layer.reset(&state);
                        let _ = layer.next();
                        continue;
                    }
                };
                if let Some(length) = length {
                    if count < lengths.len() {
                        if let Some(value) = length_value(length, layer.slice_from(start), token) {
                            lengths[count] = value;
                        } else {
                            valid = false;
                        }
                        count += 1;
                    }
                } else if matches!(&token, Token::Ident(name) if name.eq_ignore_ascii_case("inset"))
                {
                    inset = true;
                } else {
                    layer.reset(&state);
                    if let Ok(parsed) = layer.try_parse(&mut color_value) {
                        color = parsed;
                    } else {
                        let _ = layer.next();
                    }
                }
            }
            Ok((valid && count >= 2).then_some(ShadowDefinition {
                lengths,
                color,
                inset,
            }))
        })
        .unwrap_or_default()
        .into_iter()
        .flatten()
        .collect()
}

pub struct Filter {
    pub kind: FilterKind,
    // For a drop shadow: x, y, CSS blur radius, ARGB. For other filters: amount.
    pub args: [f64; 4],
}

impl Filter {
    pub fn packed(self) -> [f64; FilterRecord::STRIDE] {
        let [amount_or_x, y, blur, color] = self.args;
        let mut record = [0.; FilterRecord::STRIDE];
        record[FilterRecord::KIND] = f64::from(self.kind as u8);
        record[FilterRecord::AMOUNT_OR_X] = amount_or_x;
        record[FilterRecord::Y] = y;
        record[FilterRecord::BLUR] = blur;
        record[FilterRecord::COLOR] = color;
        record
    }

    pub fn from_record(record: &[f64]) -> Option<Self> {
        let record = <&[f64; FilterRecord::STRIDE]>::try_from(record).ok()?;
        let code = record[FilterRecord::KIND];
        let kind = FilterKind::from_index(code as u8)?;
        (code == f64::from(kind as u8)).then_some(Self {
            kind,
            args: [
                record[FilterRecord::AMOUNT_OR_X],
                record[FilterRecord::Y],
                record[FilterRecord::BLUR],
                record[FilterRecord::COLOR],
            ],
        })
    }
}

#[derive(Debug)]
enum FilterOperation<L, C> {
    Blur(L),
    Amount(FilterKind, f64),
    MathAmount(FilterKind, Box<length::Expression>),
    DropShadow(ShadowDefinition<L, C>),
}

/// A parsed filter chain with CSS lengths and currentColor retained for drawing.
pub struct FilterProgram(Box<[FilterOperation<EffectLength, u32>]>);

impl FilterProgram {
    pub fn parse(value: &str) -> Self {
        Self(
            parse_filter_list(
                value,
                || EffectLength::ZERO,
                |length, _, _| Some(length),
                read_shadow_color,
                |kind, token, _| {
                    if matches!(kind, FilterKind::HueRotate) {
                        angle(&token).map(f64::from)
                    } else {
                        number(&token).map(f64::from)
                    }
                },
            )
            .into_boxed_slice(),
        )
    }

    pub fn resolve(
        &self,
        context: LengthContext,
        current_color: u32,
    ) -> impl Iterator<Item = Filter> + '_ {
        self.0.iter().filter_map(move |operation| {
            let (kind, args) = match operation {
                FilterOperation::Blur(length) => (
                    FilterKind::Blur,
                    [length.resolve(context)?.max(0.).into(), 0., 0., 0.],
                ),
                FilterOperation::Amount(kind, value) => (*kind, [*value, 0., 0., 0.]),
                FilterOperation::MathAmount(kind, expression) => (
                    *kind,
                    [
                        resolve_filter_amount(*kind, expression, context)?,
                        0.,
                        0.,
                        0.,
                    ],
                ),
                FilterOperation::DropShadow(shadow) => {
                    let shadow = shadow.resolve(context, current_color)?;
                    (
                        FilterKind::DropShadow,
                        [
                            shadow.x.into(),
                            shadow.y.into(),
                            shadow.blur.into(),
                            shadow.color.into(),
                        ],
                    )
                }
            };
            Some(Filter { kind, args })
        })
    }

    pub fn records(&self, context: LengthContext, current_color: u32) -> Vec<f64> {
        self.resolve(context, current_color)
            .flat_map(Filter::packed)
            .collect()
    }
}

fn resolve_filter_amount(
    kind: FilterKind,
    expression: &length::Expression,
    context: LengthContext,
) -> Option<f64> {
    if matches!(kind, FilterKind::HueRotate) {
        expression.resolve_angle(context)
    } else {
        expression.resolve_ratio(context)
    }
}

fn parse_filter_list<'i, L, C>(
    value: &'i str,
    default_length: impl Fn() -> L,
    mut length_value: impl FnMut(EffectLength, &'i str, Token<'i>) -> Option<L>,
    mut color_value: impl FnMut(&mut Parser<'i, '_>) -> Result<Option<C>, ()>,
    literal_amount: impl Fn(FilterKind, Token<'i>, &'i str) -> Option<f64>,
) -> Vec<FilterOperation<L, C>> {
    use FilterKind::*;
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let mut filters = Vec::new();
    while let Ok(token) = parser.next().cloned() {
        let Token::Function(name) = token else {
            continue;
        };
        let Some(kind) = FilterKind::from_name(&name) else {
            continue;
        };
        let operation = parser.parse_nested_block(|body| {
            if matches!(kind, DropShadow) {
                return Ok(parse_shadow_list(
                    body,
                    &default_length,
                    &mut length_value,
                    &mut color_value,
                )
                .into_iter()
                .next()
                .map(FilterOperation::DropShadow));
            }
            body.skip_whitespace();
            let state = body.state();
            let start = body.position();
            let token = body.next().ok().cloned();
            let operation = match (kind, token) {
                (Blur, Some(token)) => {
                    if let Some(length) = EffectLength::read(body, &state, &token)? {
                        length_value(length, body.slice_from(start), token)
                            .map(FilterOperation::Blur)
                    } else {
                        Some(FilterOperation::Blur(default_length()))
                    }
                }
                (Blur, None) => Some(FilterOperation::Blur(default_length())),
                (_, Some(ref token)) if length::is_math(token) => {
                    body.reset(&state);
                    Some(FilterOperation::MathAmount(
                        kind,
                        Box::new(length::parse_component(body)?),
                    ))
                }
                (_, token) => {
                    let default = if matches!(kind, HueRotate) { 0. } else { 1. };
                    let amount =
                        token.and_then(|token| literal_amount(kind, token, body.slice_from(start)));
                    Some(FilterOperation::Amount(kind, amount.unwrap_or(default)))
                }
            };
            Ok::<_, cssparser::ParseError<'_, ()>>(operation)
        });
        if let Ok(Some(operation)) = operation {
            filters.push(operation);
        }
    }
    filters
}

/// Visit filter operations with source colors and client lengths for portable callers.
pub fn visit_portable_filters(
    value: &str,
    resolve_length: impl Fn(&str) -> Option<f64>,
    mut visit: impl FnMut(FilterKind, [f64; 3], Option<&str>),
) {
    let context = LengthContext::for_scale(1.);
    for operation in parse_filter_list(
        value,
        || 0.,
        |length, source, token| portable_effect_length(length, source, token, &resolve_length),
        read_portable_shadow_color,
        |kind, token, source| {
            let (value, unit) = length::token_value(token, source)?;
            match (kind, unit.as_str()) {
                (_, "") => Some(value),
                (FilterKind::HueRotate, _) => Some(value * angle_factor(&unit)?),
                (_, "%") => Some(value / 100.),
                _ => None,
            }
        },
    ) {
        match operation {
            FilterOperation::Blur(length) => {
                visit(FilterKind::Blur, [length.max(0.), 0., 0.], None)
            }
            FilterOperation::DropShadow(shadow) => {
                let [x, y, blur, _] = shadow.lengths;
                visit(FilterKind::DropShadow, [x, y, blur.max(0.)], shadow.color);
            }
            FilterOperation::Amount(kind, amount) => visit(kind, [amount, 0., 0.], None),
            FilterOperation::MathAmount(kind, expression) => {
                if let Some(amount) = resolve_filter_amount(kind, &expression, context) {
                    visit(kind, [amount, 0., 0.], None);
                }
            }
        }
    }
}

pub fn parse_filters(value: &str, context: LengthContext, current_color: u32) -> Vec<Filter> {
    FilterProgram::parse(value)
        .resolve(context, current_color)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const CONTEXT: LengthContext = LengthContext {
        scale: 3.,
        font_size: 20.,
        root_font_size: 16.,
        viewport_width: 400.,
        viewport_height: 800.,
    };

    #[test]
    fn filter_program_resolves_lengths_and_current_color_without_the_source() {
        let value = String::from(
            "blur(calc(1em / 2)) drop-shadow(2px 3dppx max(1rem, 2px) currentColor)",
        );
        let program = FilterProgram::parse(&value);
        drop(value);
        let first = program.records(CONTEXT, 0xff123456);
        assert_eq!(
            first,
            [0., 30., 0., 0., 0., 9., 6., 3., 48., 0xff123456u32 as f64]
        );
        let next = LengthContext {
            scale: 1.,
            font_size: 18.,
            root_font_size: 10.,
            ..CONTEXT
        };
        let second = program.records(next, 0xffabcdef);
        assert_eq!(
            second,
            [0., 9., 0., 0., 0., 9., 2., 3., 10., 0xffabcdefu32 as f64]
        );
    }

    #[test]
    fn effect_math_uses_the_shared_grammar_and_skips_invalid_operations() {
        let filters = parse_filters(
            concat!(
                "blur(calc(1px / 0)) opacity(clamp(25%, 100% - 20%, 90%)) ",
                "brightness(calc(50% - 50%)) contrast(calc(2px + 1px)) ",
                "hue-rotate(calc(0.25turn - 10deg)) ",
                "drop-shadow(calc(1vw - 2px) min(1rem, 3px) rgb(calc(200 + 55) 0 0))",
            ),
            CONTEXT,
            0,
        );
        let packed: Vec<_> = filters.into_iter().map(Filter::packed).collect();
        assert_eq!(packed, [
            [6., 0.8, 0., 0., 0.],
            [1., 0., 0., 0., 0.],
            [4., 80., 0., 0., 0.],
            [9., 6., 9., 0., f64::from(0xffff0000u32)],
        ]);
        let shadows = parse_shadows(
            "1px 2px calc(1px + ) red, 1px 2px calc(1px + 5%) red, max(2px, 1px) calc(1 + 2) blue",
            CONTEXT,
            0,
        );
        assert_eq!(shadows.len(), 1);
        assert_eq!(shadows[0].packed(), [6., 9., 0., 0., f64::from(0xff0000ffu32), 0.]);
    }

    #[test]
    fn shadow_layers_keep_nested_colors_and_resolve_lengths() {
        let got = parse_shadows(
            "inset 2em 7dppx -5px 1rem rgb(100% 0% 0% / 50%), bad, 2vw 1vh HSL(120, 100%, 50%)",
            CONTEXT,
            0xff000000,
        );
        assert_eq!(
            got,
            [
                Shadow {
                    x: 120.,
                    y: 7.,
                    blur: 0.,
                    spread: 48.,
                    color: 0x80ff0000,
                    inset: true
                },
                Shadow {
                    x: 24.,
                    y: 24.,
                    blur: 0.,
                    spread: 0.,
                    color: 0xff00ff00,
                    inset: false
                },
            ]
        );
    }

    #[test]
    fn shadows_keep_color_precision_and_allow_clear() {
        let got = parse_shadows(
            "1px 2px #12345678, 2px 1px currentcolor",
            CONTEXT,
            0x0102abcd,
        );
        assert_eq!(got[0].color, 0x78123456);
        assert_eq!(got[1].color, 0x0102abcd);
        assert!(parse_shadows("none", CONTEXT, 0).is_empty());
        assert!(parse_shadows("", CONTEXT, 0).is_empty());
    }

    #[test]
    fn filter_chain_preserves_order_and_uses_the_shadow_grammar() {
        let filters = parse_filters(
            "opacity(50%) blur(1em) ignored(2px) drop-shadow(#33669980 1px 2px 4px) hue-rotate(.25turn)",
            CONTEXT,
            0xff000000,
        );
        let packed: Vec<_> = filters.into_iter().map(Filter::packed).collect();
        assert_eq!(
            packed,
            [
                [6., 0.5, 0., 0., 0.],
                [0., 60., 0., 0., 0.],
                [9., 3., 6., 12., f64::from(0x80336699u32)],
                [4., 90., 0., 0., 0.],
            ]
        );
    }

    #[test]
    fn transform_order_and_relative_units_survive_projection() {
        let matrix = |css| transform::TransformProgram::parse(css).unwrap().matrix(CONTEXT, 300., 150.);
        let translate_then_rotate = matrix("translateX(10px) rotate(90deg)");
        assert!((translate_then_rotate[12] - 30.).abs() < 1e-5);
        assert!(translate_then_rotate[13].abs() < 1e-5);
        // UIKit recognizes a 2D transform only if its z axis is exactly unchanged.
        assert_eq!(&translate_then_rotate[8..12], &[0., 0., 1., 0.]);

        let rotate_then_translate = matrix("rotate(.25turn) translateX(10px)");
        assert!(rotate_then_translate[12].abs() < 1e-5);
        assert!((rotate_then_translate[13] - 30.).abs() < 1e-5);

        let lengths = matrix("translate(-50%, 2em) translate(10vw, 7dppx)");
        assert_eq!(&lengths[12..14], &[-30., 127.]);
    }

    #[test]
    fn transform_math_reuses_the_live_box_and_unit_context() {
        use transform::TransformProgram;

        let input = "translate(calc(50% - 10px), min(25%, 20px))";
        let program = TransformProgram::parse(input).unwrap();
        assert!(program.uses_box_size());
        assert_eq!(program.source(), input);
        assert_eq!(program.affine(CONTEXT, 300., 150.), [1., 0., 0., 1., 120., 37.5]);
        assert_eq!(program.affine(CONTEXT, 500., 40.), [1., 0., 0., 1., 220., 10.]);

        let program = TransformProgram::parse("matrix(calc(2 * 1), 0, 0, 1, calc(1em / 2), 7) scaleY(calc(50% + .5))").unwrap();
        assert!(!program.uses_box_size());
        assert_eq!(program.affine(CONTEXT, 0., 0.), [2., 0., 0., 1., 30., 21.]);
        let context = LengthContext { font_size: 30., ..CONTEXT };
        assert_eq!(program.affine(context, 0., 0.), [2., 0., 0., 1., 45., 21.]);

        let program = TransformProgram::parse("rotate3d(calc(1 - 1), 0, 1, calc(.5turn - 90deg))").unwrap();
        let [a, b, c, d, _, _] = program.affine(CONTEXT, 0., 0.);
        assert!(a.abs() < 1e-5 && d.abs() < 1e-5);
        assert_eq!([b, c], [1., -1.]);
    }

    #[test]
    fn transform_rejects_invalid_operations_and_distinguishes_clear() {
        use transform::TransformProgram;

        for invalid in [
            "translate(10px) bogus(1)",
            "rotate(10px)",
            "rotate(calc(10px))",
            "translateZ(10%)",
            "translateZ(calc(0%))",
            "translateX(calc(10px / 0))",
            "matrix(1, 0, 0, 1, calc(50%), 0)",
            "scale(1, 2, 3)",
            "garbage",
        ] {
            assert_eq!(TransformProgram::parse(invalid), None, "{invalid}");
        }
        assert!(TransformProgram::parse("none").unwrap().is_empty());
        assert!(TransformProgram::parse("").unwrap().is_empty());
    }
}
