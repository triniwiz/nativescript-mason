//! Shared grammar for background shorthand and its layer lists.

use super::gradient::{parse_gradient, Gradient};
use super::length::{is_math, Component, LiteralLength};
pub use super::position::Axis;
use super::position::{parse_axis_position, parse_position_components};
use super::{color, BackgroundInputRecord};
use cssparser::{Parser, ParserInput, Token};
use std::sync::Arc;

#[derive(Clone, Debug, PartialEq)]
pub enum Image {
    Url(Arc<str>),
    // Preserve the image slot for a recognized function whose arguments are invalid.
    Gradient(Option<Arc<Gradient>>),
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Repeat {
    #[default]
    Repeat = 0,
    NoRepeat = 1,
    Space = 2,
    Round = 3,
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BoxKind {
    Border = 0,
    Padding = 1,
    Content = 2,
    Text = 3,
}

impl BoxKind {
    fn keyword(self) -> &'static str {
        match self {
            Self::Border => "border-box",
            Self::Padding => "padding-box",
            Self::Content => "content-box",
            Self::Text => "text",
        }
    }
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Attachment {
    #[default]
    Scroll = 0,
    Fixed = 1,
    Local = 2,
}

impl Attachment {
    fn keyword(self) -> &'static str {
        match self {
            Self::Scroll => "scroll",
            Self::Fixed => "fixed",
            Self::Local => "local",
        }
    }
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Blend {
    Normal,
    Multiply,
    Screen,
    Overlay,
    Darken,
    Lighten,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Hue,
    Saturation,
    Color,
    Luminosity,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Size {
    Contain,
    Cover,
    Explicit([Option<Axis>; 2]),
}

impl Size {
    pub fn dimensions(&self) -> [Option<&Axis>; 2] {
        match self {
            Self::Explicit(dimensions) => dimensions.each_ref().map(Option::as_ref),
            _ => [None; 2],
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum LayerProperty {
    Repeat([Repeat; 2]),
    Position([Axis; 2]),
    PositionAxis(usize, Axis),
    Size(Size),
    Origin(BoxKind),
    Clip(BoxKind),
    Attachment(Attachment),
    Blend(Blend),
    Invalid,
}

/// Fixed-width records for platform readers. Slot 0 selects the property;
/// absent offsets use NaN for the fraction. Position offsets are fractions
/// plus device pixels, using the same length context as background shorthand.
impl LayerProperty {
    pub fn offset(&self, index: usize) -> Option<&Axis> {
        match self {
            Self::Position(position) => position.get(index),
            Self::PositionAxis(_, axis) if index == 0 => Some(axis),
            Self::Size(size) => size.dimensions().get(index).copied().flatten(),
            _ => None,
        }
    }

    pub fn record(&self, context: super::LengthContext) -> [f64; 6] {
        let pair = |(fraction, pixels)| [f64::from(fraction), f64::from(pixels)];
        let offset = |value: Option<&Axis>| {
            value.map_or([f64::NAN, 0.], |value| pair(value.components(context)))
        };
        match *self {
            Self::Invalid => [-1., 0., 0., 0., 0., 0.],
            Self::Repeat([x, y]) => [0., f64::from(x as u8), f64::from(y as u8), 0., 0., 0.],
            Self::Position([ref x, ref y]) => {
                let [xf, xp] = pair(x.components(context));
                let [yf, yp] = pair(y.components(context));
                [1., xf, xp, yf, yp, 0.]
            }
            Self::PositionAxis(axis, ref value) => {
                let [f, p] = pair(value.components(context));
                [if axis == 0 { 2. } else { 3. }, f, p, 0., 0., 0.]
            }
            Self::Size(Size::Explicit(ref dimensions)) => {
                let [wf, wp] = offset(dimensions[0].as_ref());
                let [hf, hp] = offset(dimensions[1].as_ref());
                [4., 1., wf, wp, hf, hp]
            }
            Self::Size(Size::Contain) => [4., 2., 0., 0., 0., 0.],
            Self::Size(Size::Cover) => [4., 3., 0., 0., 0., 0.],
            Self::Origin(value) => [5., f64::from(value as u8), 0., 0., 0., 0.],
            Self::Clip(value) => [6., f64::from(value as u8), 0., 0., 0., 0.],
            Self::Attachment(value) => [7., f64::from(value as u8), 0., 0., 0., 0.],
            Self::Blend(value) => [8., f64::from(value as u8), 0., 0., 0., 0.],
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Layer {
    pub image: Option<Image>,
    pub color: Option<u32>,
    pub repeat: [Repeat; 2],
    pub position: [Option<Axis>; 2],
    pub size: Option<Size>,
    pub origin: BoxKind,
    pub clip: BoxKind,
    pub attachment: Attachment,
    pub blend: Blend,
}

impl Default for Layer {
    fn default() -> Self {
        Self {
            image: None,
            color: None,
            repeat: [Repeat::Repeat; 2],
            position: [None, None],
            size: None,
            origin: BoxKind::Padding,
            clip: BoxKind::Border,
            attachment: Attachment::Scroll,
            blend: Blend::Normal,
        }
    }
}

impl Layer {
    /// Offsets in position X/Y, width/height order.
    pub fn offsets(&self) -> [Option<&Axis>; 4] {
        let [width, height] = self.size.as_ref().map_or([None; 2], Size::dimensions);
        [
            self.position[0].as_ref(),
            self.position[1].as_ref(),
            width,
            height,
        ]
    }

    pub fn record(&self, context: super::LengthContext) -> [f64; super::BackgroundRecord::STRIDE] {
        use super::BackgroundRecord as Record;
        let size_kind = match self.size {
            None => 0.,
            Some(Size::Explicit(_)) => 1.,
            Some(Size::Contain) => 2.,
            Some(Size::Cover) => 3.,
        };
        let mut record = [0.; Record::STRIDE];
        record[Record::IMAGE_KIND] = match &self.image {
            Some(Image::Url(_)) => 1.,
            Some(Image::Gradient(_)) => 2.,
            None => 0.,
        };
        record[Record::COLOR] = self.color.map_or(f64::NAN, f64::from);
        record[Record::REPEAT_X] = f64::from(self.repeat[0] as u8);
        record[Record::REPEAT_Y] = f64::from(self.repeat[1] as u8);
        record[Record::ORIGIN] = f64::from(self.origin as u8);
        record[Record::CLIP] = f64::from(self.clip as u8);
        record[Record::ATTACHMENT] = f64::from(self.attachment as u8);
        record[Record::SIZE_KIND] = size_kind;
        let [x, y, width, height] = self
            .offsets()
            .map(|axis| axis.map(|axis| axis.components(context)));
        let offset = |pair: Option<(f32, f32)>| {
            pair.map_or([f64::NAN, 0.], |(fraction, pixels)| {
                [f64::from(fraction), f64::from(pixels)]
            })
        };
        [
            record[Record::POSITION_X_FRACTION],
            record[Record::POSITION_X_PIXELS],
        ] = offset(x);
        [
            record[Record::POSITION_Y_FRACTION],
            record[Record::POSITION_Y_PIXELS],
        ] = offset(y);
        [record[Record::WIDTH_FRACTION], record[Record::WIDTH_PIXELS]] = offset(width);
        [
            record[Record::HEIGHT_FRACTION],
            record[Record::HEIGHT_PIXELS],
        ] = offset(height);
        record[Record::BLEND] = f64::from(self.blend as u8);
        record
    }

    pub(super) fn apply(&mut self, value: LayerProperty) {
        use LayerProperty::*;
        match value {
            Invalid => (),
            Repeat(repeat) => self.repeat = repeat,
            Position(position) => self.position = position.map(Some),
            PositionAxis(axis, position) => self.position[axis] = Some(position),
            Size(size) => self.size = Some(size),
            Origin(origin) => self.origin = origin,
            Clip(clip) => self.clip = clip,
            Attachment(attachment) => self.attachment = attachment,
            Blend(blend) => self.blend = blend,
        }
    }
}

/// Mobile paint treats the background color as a separate fill and filters
/// out otherwise empty layers before cycling its longhands.
pub fn retain_mobile_layers(layers: &mut Arc<[Layer]>) {
    fn is_visible(layer: &Layer) -> bool {
        let image = matches!(layer.image, Some(Image::Url(_) | Image::Gradient(Some(_))));
        image
            || layer.repeat != [Repeat::Repeat; 2]
            || layer.position.iter().any(Option::is_some)
            || layer.size.is_some()
            || layer.origin != BoxKind::Padding
            || layer.clip != BoxKind::Border
            || layer.attachment != Attachment::Scroll
            || layer.blend != Blend::Normal
    }
    if layers.iter().any(|layer| !is_visible(layer)) {
        *layers = layers
            .iter()
            .filter(|layer| is_visible(layer))
            .cloned()
            .collect();
    }
}

pub fn apply_longhand(layers: &mut [Layer], values: &[LayerProperty]) {
    for (layer, value) in layers.iter_mut().zip(values.iter().cycle()) {
        layer.apply(value.clone());
    }
}

/// Retains the authored longhands for the next background or image replacement.
/// Renderers can share the current layers without copying them on installation.
#[derive(Clone, Default)]
pub struct BackgroundProgram {
    layers: Arc<[Layer]>,
    longhands: Vec<(Box<str>, Arc<[LayerProperty]>)>,
    desktop_source: Option<Arc<[Layer]>>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum BackgroundTarget {
    Mobile,
    Desktop,
}

impl BackgroundProgram {
    pub fn parse(value: &str, current_color: u32) -> Option<Self> {
        Some(Self {
            layers: parse_background(value, current_color)?.into(),
            ..Self::default()
        })
    }

    pub fn layers(&self) -> &Arc<[Layer]> {
        &self.layers
    }

    pub fn retain_mobile_layers(&mut self) {
        retain_mobile_layers(&mut self.layers);
    }

    pub fn apply(&mut self, values: &[LayerProperty]) {
        apply_longhand(Arc::make_mut(&mut self.layers), values);
    }

    /// Returns the parsed shorthand color even if the color-only layer is filtered out.
    pub fn replace_mobile(&mut self, value: &str, current_color: u32) -> Option<Option<u32>> {
        self.replace(value, current_color, BackgroundTarget::Mobile)
    }

    fn replace(
        &mut self,
        value: &str,
        current_color: u32,
        target: BackgroundTarget,
    ) -> Option<Option<u32>> {
        let mut layers: Arc<[Layer]> = parse_background(value, current_color)?.into();
        let color = layers.last().and_then(|layer| layer.color);
        if target == BackgroundTarget::Mobile {
            retain_mobile_layers(&mut layers);
            for (_, values) in &self.longhands {
                apply_longhand(Arc::make_mut(&mut layers), values);
            }
        } else {
            if layers
                .iter()
                .any(|layer| matches!(layer.image, Some(Image::Gradient(None))))
            {
                return None;
            }
            self.desktop_source = Some(Arc::clone(&layers));
        }
        self.layers = layers;
        Some(color)
    }

    /// Returns whether the change also affects the current layer list.
    pub fn set_mobile_longhand(&mut self, name: &str, value: &str) -> Option<bool> {
        self.set_longhand(name, value, BackgroundTarget::Mobile)
    }

    fn set_longhand(&mut self, name: &str, value: &str, target: BackgroundTarget) -> Option<bool> {
        let values = if value.trim().is_empty() {
            None
        } else {
            Some(parse_longhand(name, value)?)
        };

        let previous_count = self.longhands.len();
        self.longhands.retain(|(key, _)| {
            let key = key.as_ref();
            key != name && !(name == "position" && matches!(key, "position-x" | "position-y"))
        });
        let Some(values) = values else {
            return Some(
                target == BackgroundTarget::Desktop
                    && !self.layers.is_empty()
                    && previous_count != self.longhands.len(),
            );
        };
        let has_layers = !self.layers.is_empty();
        if has_layers && target == BackgroundTarget::Mobile {
            self.apply(&values);
        }
        self.longhands.push((name.into(), values.into()));
        Some(has_layers)
    }

    /// Applies the compiled declarations in order and reports which final values to publish.
    /// The input is the write record fields joined with NUL separators.
    pub fn apply_mobile_batch(
        &mut self,
        input: &str,
        initial_color: u32,
    ) -> Option<[i64; super::CssBackgroundResultRecord::STRIDE]> {
        self.apply_batch(input, initial_color, BackgroundTarget::Mobile)
    }

    pub fn apply_batch(
        &mut self,
        input: &str,
        initial_color: u32,
        target: BackgroundTarget,
    ) -> Option<[i64; super::CssBackgroundResultRecord::STRIDE]> {
        use super::{CssBackgroundResultRecord as Result, CssBackgroundWriteRecord as Write};

        let fields: Vec<_> = input.split('\0').collect();
        if fields.len() % Write::STRIDE != 0 {
            return None;
        }
        let mobile = target == BackgroundTarget::Mobile;
        if !mobile && self.desktop_source.is_none() {
            self.layers = Arc::from([Layer::default()]);
            self.desktop_source = Some(Arc::clone(&self.layers));
        }
        let mut result = [0; Result::STRIDE];
        result[Result::COLOR] = -2;
        result[Result::SHORTHAND_VALUE] = -1;
        for (index, row) in fields.chunks_exact(Write::STRIDE).enumerate() {
            let property = row[Write::PROPERTY];
            let value = row[Write::VALUE];
            match property {
                "background" | "background-image" => {
                    let shorthand = property == "background";
                    let reset = mobile && shorthand && value.is_empty();
                    let color = if reset {
                        *self = Self::default();
                        None
                    } else {
                        let current_color =
                            row[Write::CURRENT_COLOR].parse().unwrap_or(initial_color);
                        let value = if !mobile && value.is_empty() {
                            "none"
                        } else {
                            value
                        };
                        let Some(color) = self.replace(value, current_color, target) else {
                            continue;
                        };
                        color
                    };
                    result[Result::LAYERS_CHANGED] = 1;
                    result[Result::IMAGES_REPLACED] = 1;
                    result[Result::LAST_IMAGE_FROM_SHORTHAND] = i64::from(shorthand);
                    if shorthand {
                        if !reset {
                            result[Result::SHORTHAND_VALUE] =
                                (index * Write::STRIDE + Write::VALUE) as i64;
                        }
                        result[Result::SHORTHAND_RESET] = i64::from(reset);
                        if mobile || color.is_some() {
                            result[Result::COLOR] = color.map_or(-1, i64::from);
                            result[Result::COLOR_FROM_SHORTHAND] = 1;
                        }
                    } else {
                        result[Result::IMAGE_DECLARATION] = 1;
                    }
                }
                "background-color" => {
                    if let Ok(color) = value.parse::<u32>() {
                        result[Result::COLOR] = i64::from(color);
                        result[Result::COLOR_FROM_SHORTHAND] = 0;
                    }
                }
                _ => {
                    if property
                        .strip_prefix("background-")
                        .and_then(|name| self.set_longhand(name, value, target))
                        == Some(true)
                    {
                        result[Result::LAYERS_CHANGED] = 1;
                    }
                }
            }
        }
        if !mobile && result[Result::LAYERS_CHANGED] != 0 {
            self.layers = Arc::clone(self.desktop_source.as_ref().unwrap());
            for (_, values) in &self.longhands {
                apply_longhand(Arc::make_mut(&mut self.layers), values);
            }
        }
        Some(result)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum Part<'a> {
    Word(&'a str),
    Comma,
    Slash,
}

impl<'a> Part<'a> {
    pub(super) fn text(self) -> &'a str {
        match self {
            Self::Word(word) => word,
            Self::Comma => ",",
            Self::Slash => "/",
        }
    }
}

/// Scans the declaration's top level while preserving source URLs. Mason
/// accepts unencoded SVG data URLs, including nested url() and quoted text.
pub(super) fn top_level_parts(value: &str) -> Option<Vec<Part<'_>>> {
    let mut result = Vec::new();
    let mut start = None;
    let mut depth = 0usize;
    let mut quote = None;
    let mut escaped = false;
    let mut chars = value.char_indices().peekable();
    while let Some((index, ch)) = chars.next() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            start.get_or_insert(index);
            escaped = true;
            continue;
        }
        if let Some(quoted) = quote {
            if ch == quoted {
                quote = None;
            }
            continue;
        }
        if ch == '"' || ch == '\'' {
            quote = Some(ch);
        } else if ch == '(' {
            depth += 1;
        } else if ch == ')' {
            depth = depth.checked_sub(1)?;
        } else if depth == 0 && (ch.is_whitespace() || ch == '/' || ch == ',') {
            if let Some(start) = start.take() {
                result.push(Part::Word(&value[start..index]));
            }
            if ch == '/' && chars.peek().is_some_and(|&(_, next)| next == '*') {
                chars.next();
                loop {
                    if chars.next()?.1 == '*' && chars.peek().is_some_and(|&(_, next)| next == '/')
                    {
                        chars.next();
                        break;
                    }
                }
            } else if ch == '/' {
                result.push(Part::Slash);
            } else if ch == ',' {
                result.push(Part::Comma);
            }
            continue;
        }
        start.get_or_insert(index);
    }
    if depth != 0 || quote.is_some() || escaped {
        return None;
    }
    if let Some(start) = start {
        result.push(Part::Word(&value[start..]));
    }
    Some(result)
}

pub(super) fn image_source_syntax(word: &str) -> bool {
    if word.eq_ignore_ascii_case("none") {
        return true;
    }
    let Some((name, _)) = word.split_once('(') else {
        return false;
    };
    let name = name.to_ascii_lowercase();
    matches!(
        name.as_str(),
        "url" | "image-set" | "cross-fade" | "element"
    ) || matches!(
        name.strip_prefix("repeating-").unwrap_or(&name),
        "linear-gradient" | "radial-gradient" | "conic-gradient"
    )
}

pub(super) fn image(word: &str, current_color: u32) -> Option<Image> {
    let (name, args) = word.split_once('(')?;
    let args = args.strip_suffix(')')?.trim();
    match name.to_ascii_lowercase().as_str() {
        "url" => {
            let url = args
                .strip_prefix('"')
                .and_then(|s| s.strip_suffix('"'))
                .or_else(|| args.strip_prefix('\'').and_then(|s| s.strip_suffix('\'')))
                .unwrap_or(args);
            if url.len() != args.len() && url.contains('\\') {
                let mut input = ParserInput::new(args);
                let mut parser = Parser::new(&mut input);
                let url: Arc<str> = Arc::from(parser.expect_string().ok()?.as_ref());
                return parser.is_exhausted().then_some(Image::Url(url));
            }
            Some(Image::Url(Arc::from(url)))
        }
        "linear-gradient"
        | "radial-gradient"
        | "conic-gradient"
        | "repeating-linear-gradient"
        | "repeating-radial-gradient"
        | "repeating-conic-gradient" => Some(Image::Gradient(
            parse_gradient(word, current_color).map(Arc::new),
        )),
        _ => None,
    }
}

pub(super) fn token(word: &str) -> Option<Token<'_>> {
    let mut input = ParserInput::new(word);
    let mut parser = Parser::new(&mut input);
    let token = parser.next().ok()?.clone();
    parser.is_exhausted().then_some(token)
}

pub(super) enum SizeTerms<'a> {
    Contain,
    Cover,
    Dimensions([Option<&'a str>; 2]),
}

pub(super) fn size_terms<'a>(words: &[&'a str]) -> Option<SizeTerms<'a>> {
    match words {
        [word] if word.eq_ignore_ascii_case("contain") => Some(SizeTerms::Contain),
        [word] if word.eq_ignore_ascii_case("cover") => Some(SizeTerms::Cover),
        [_, ..] if words.len() <= 2 => {
            let mut dimensions = [None; 2];
            for (&word, output) in words.iter().zip(&mut dimensions) {
                *output = (!word.eq_ignore_ascii_case("auto")).then_some(word);
            }
            Some(SizeTerms::Dimensions(dimensions))
        }
        _ => None,
    }
}

fn parse_size(words: &[&str]) -> Option<Size> {
    Some(match size_terms(words)? {
        SizeTerms::Contain => Size::Contain,
        SizeTerms::Cover => Size::Cover,
        SizeTerms::Dimensions(terms) => {
            let mut dimensions = [None, None];
            for (word, output) in terms.into_iter().zip(&mut dimensions) {
                if let Some(word) = word {
                    *output = Some(Axis::explicit(&Component::parse(word)?)?);
                }
            }
            Size::Explicit(dimensions)
        }
    })
}

fn repeat(word: &str) -> Option<Repeat> {
    match word {
        "repeat" => Some(Repeat::Repeat),
        "no-repeat" => Some(Repeat::NoRepeat),
        "space" => Some(Repeat::Space),
        "round" => Some(Repeat::Round),
        _ => None,
    }
}

fn parse_repeat(words: &[&str]) -> Option<[Repeat; 2]> {
    match words {
        ["repeat-x"] => Some([Repeat::Repeat, Repeat::NoRepeat]),
        ["repeat-y"] => Some([Repeat::NoRepeat, Repeat::Repeat]),
        [one] => Some([repeat(one)?; 2]),
        [x, y] => Some([repeat(x)?, repeat(y)?]),
        _ => None,
    }
}

fn attachment(value: &str) -> Option<Attachment> {
    match value {
        "scroll" => Some(Attachment::Scroll),
        "fixed" => Some(Attachment::Fixed),
        "local" => Some(Attachment::Local),
        _ => None,
    }
}

fn box_kind(value: &str) -> Option<BoxKind> {
    match value {
        "border-box" => Some(BoxKind::Border),
        "padding-box" => Some(BoxKind::Padding),
        "content-box" => Some(BoxKind::Content),
        "text" => Some(BoxKind::Text),
        _ => None,
    }
}

fn blend(value: &str) -> Option<Blend> {
    Some(match value {
        "normal" => Blend::Normal,
        "multiply" => Blend::Multiply,
        "screen" => Blend::Screen,
        "overlay" => Blend::Overlay,
        "darken" => Blend::Darken,
        "lighten" => Blend::Lighten,
        "color-dodge" => Blend::ColorDodge,
        "color-burn" => Blend::ColorBurn,
        "hard-light" => Blend::HardLight,
        "soft-light" => Blend::SoftLight,
        "difference" => Blend::Difference,
        "exclusion" => Blend::Exclusion,
        "hue" => Blend::Hue,
        "saturation" => Blend::Saturation,
        "color" => Blend::Color,
        "luminosity" => Blend::Luminosity,
        _ => return None,
    })
}

pub fn parse_longhand(name: &str, value: &str) -> Option<Vec<LayerProperty>> {
    parse_layer_properties(name, value, false)
}

/// Masks keep the slots of invalid entries, where the renderer uses initial values.
pub fn parse_layer_properties(
    name: &str,
    value: &str,
    allow_invalid_entries: bool,
) -> Option<Vec<LayerProperty>> {
    let parts = top_level_parts(value.trim().trim_end_matches(';'))?;
    if parts.is_empty() {
        return None;
    }
    parts
        .split(|part| *part == Part::Comma)
        .filter(|part| !allow_invalid_entries || !part.is_empty())
        .map(|part| {
            parse_longhand_entry(name, part)
                .or_else(|| allow_invalid_entries.then_some(LayerProperty::Invalid))
        })
        .collect()
}

pub(super) fn parse_longhand_entry(name: &str, parts: &[Part<'_>]) -> Option<LayerProperty> {
    use LayerProperty::*;
    let words = parts
        .iter()
        .map(|part| match part {
            Part::Word(word) => Some(word.to_ascii_lowercase()),
            _ => None,
        })
        .collect::<Option<Vec<_>>>()?;
    let words: Vec<_> = words.iter().map(String::as_str).collect();
    let tokens = || {
        words
            .iter()
            .map(|word| Component::parse(word))
            .collect::<Option<Vec<_>>>()
    };
    Some(match (name, words.as_slice()) {
        ("repeat", _) => Repeat(parse_repeat(&words)?),
        ("position", [_, ..]) => Position(parse_position_components(&tokens()?)?),
        ("position-x" | "position-y", [_, ..]) => {
            let axis = usize::from(name == "position-y");
            PositionAxis(axis, parse_axis_position(&tokens()?, axis)?)
        }
        ("size", _) => Size(parse_size(&words)?),
        ("origin", [value]) if *value != "text" => Origin(box_kind(value)?),
        ("clip", [value]) => Clip(box_kind(value)?),
        ("attachment", [value]) => Attachment(attachment(value)?),
        ("blend-mode", [value]) => Blend(blend(value)?),
        _ => return None,
    })
}

#[derive(Default)]
struct LayerDeclaration<'a> {
    image: Option<&'a str>,
    color: Option<&'a str>,
    repeat: Vec<&'a str>,
    position: Vec<&'a str>,
    size: Vec<&'a str>,
    origin: Option<BoxKind>,
    clip: Option<BoxKind>,
    attachment: Option<Attachment>,
}

impl LayerDeclaration<'_> {
    fn geometry(&self) -> Option<Layer> {
        let mut layer = Layer::default();
        if !self.repeat.is_empty() {
            let lower: Vec<_> = self
                .repeat
                .iter()
                .map(|word| word.to_ascii_lowercase())
                .collect();
            let words: Vec<_> = lower.iter().map(String::as_str).collect();
            layer.repeat = parse_repeat(&words)?;
        }
        if !self.position.is_empty() {
            let tokens = self
                .position
                .iter()
                .map(|word| Component::parse(word))
                .collect::<Option<Vec<_>>>()?;
            layer.position = parse_position_components(&tokens)?.map(Some);
        }
        if !self.size.is_empty() {
            layer.size = Some(parse_size(&self.size)?);
        }
        layer.origin = self.origin.unwrap_or(BoxKind::Padding);
        layer.clip = self.clip.unwrap_or(BoxKind::Border);
        layer.attachment = self.attachment.unwrap_or_default();
        Some(layer)
    }

    fn paint(&self, current_color: u32) -> Option<Layer> {
        let mut layer = self.geometry()?;
        if let Some(source) = self
            .image
            .filter(|source| !source.eq_ignore_ascii_case("none"))
        {
            layer.image = Some(image(source, current_color)?);
        }
        if let Some(value) = self.color {
            layer.color = Some(color::parse(value, Some(current_color))?);
        }
        Some(layer)
    }

    fn longhands(&self) -> Option<[String; BackgroundInputRecord::STRIDE]> {
        self.geometry()?;
        use BackgroundInputRecord as Field;
        let mut fields = std::array::from_fn(|_| String::new());
        fields[Field::COLOR] = self.color.unwrap_or_default().to_owned();
        fields[Field::IMAGE] = self.image.unwrap_or_default().to_owned();
        fields[Field::REPEAT] = self.repeat.join(" ").to_ascii_lowercase();
        fields[Field::POSITION] = self.position.join(" ").to_ascii_lowercase();
        fields[Field::SIZE] = self.size.join(" ").to_ascii_lowercase();
        fields[Field::CLIP] = self.clip.map_or("", BoxKind::keyword).to_owned();
        fields[Field::ORIGIN] = self.origin.map_or("", BoxKind::keyword).to_owned();
        fields[Field::ATTACHMENT] = self.attachment.map_or("", Attachment::keyword).to_owned();
        Some(fields)
    }
}

fn parse_layer<'a>(parts: &[Part<'a>], last: bool) -> Option<LayerDeclaration<'a>> {
    let mut layer = LayerDeclaration::default();
    let mut after_slash = false;
    let mut box_count = 0;
    for part in parts {
        let word = match *part {
            Part::Word(word) => word,
            Part::Slash if !after_slash && !layer.position.is_empty() => {
                after_slash = true;
                continue;
            }
            _ => return None,
        };
        let lower = word.to_ascii_lowercase();
        match lower.as_str() {
            "repeat-x" | "repeat-y" | "repeat" | "no-repeat" | "space" | "round" => {
                layer.repeat.push(word);
            }
            "text" if layer.clip != Some(BoxKind::Text) && box_count < 2 => {
                layer.clip = Some(BoxKind::Text);
            }
            "auto" | "cover" | "contain" if after_slash => layer.size.push(word),
            "auto" | "cover" | "contain" | "text" => return None,
            "top" | "bottom" | "left" | "right" | "center" if !after_slash => {
                layer.position.push(word);
            }
            "top" | "bottom" | "left" | "right" | "center" => return None,
            _ if image_source_syntax(&lower) => {
                if layer.image.replace(word).is_some() {
                    return None;
                }
            }
            _ => {
                if let Some(attachment) = attachment(&lower) {
                    if layer.attachment.replace(attachment).is_some() {
                        return None;
                    }
                } else if let Some(box_kind) = box_kind(&lower) {
                    let clips_text = layer.clip == Some(BoxKind::Text);
                    if box_count == 2 || (box_count == 1 && clips_text) {
                        return None;
                    }
                    if box_count == 0 {
                        layer.origin = Some(box_kind);
                    }
                    if !clips_text {
                        layer.clip = Some(box_kind);
                    }
                    box_count += 1;
                } else if token(word)
                    .is_some_and(|token| is_math(&token) || LiteralLength::parse(&token).is_some())
                {
                    if after_slash {
                        layer.size.push(word);
                    } else {
                        layer.position.push(word);
                    }
                } else if last && layer.color.is_none() {
                    layer.color = Some(word);
                } else {
                    return None;
                }
            }
        }
    }
    if after_slash && layer.size.is_empty() {
        return None;
    }
    Some(layer)
}

fn parse_layer_list<T>(
    value: &str,
    mut convert: impl FnMut(LayerDeclaration<'_>) -> Option<T>,
) -> Option<Vec<T>> {
    let value = value.trim().trim_end_matches(';').trim_end();
    if value.is_empty() {
        return Some(Vec::new());
    }
    let parts = top_level_parts(value)?;
    let mut layers = parts.split(|part| *part == Part::Comma).peekable();
    let mut output = Vec::new();
    while let Some(parts) = layers.next() {
        if parts.is_empty() {
            return None;
        }
        output.push(convert(parse_layer(parts, layers.peek().is_none())?)?);
    }
    Some(output)
}

pub fn parse_background(value: &str, current_color: u32) -> Option<Vec<Layer>> {
    parse_layer_list(value, |layer| layer.paint(current_color))
}

/// An empty field resets the corresponding longhand in the cascade.
/// Only the final layer can supply the color.
pub fn split_shorthand(value: &str) -> Option<[String; BackgroundInputRecord::STRIDE]> {
    use BackgroundInputRecord as Field;
    let layers = parse_layer_list(value, |layer| layer.longhands())?;
    let last = layers.last()?;
    let defaults = [
        "",
        "none",
        "repeat",
        "0% 0%",
        "auto",
        "border-box",
        "padding-box",
        "scroll",
    ];
    Some(std::array::from_fn(|index| {
        if index == Field::COLOR {
            last[index].clone()
        } else if layers.iter().all(|layer| layer[index].is_empty()) {
            String::new()
        } else {
            layers
                .iter()
                .map(|layer| {
                    let value = layer[index].as_str();
                    if value.is_empty() {
                        defaults[index]
                    } else {
                        value
                    }
                })
                .collect::<Vec<_>>()
                .join(", ")
        }
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::style::css::LengthContext;

    #[test]
    fn mobile_background_remembers_longhands_without_painting_empty_layers() {
        let mut program = BackgroundProgram::default();
        assert_eq!(
            program.set_mobile_longhand("repeat", "no-repeat, round"),
            Some(false)
        );
        assert_eq!(
            program.set_mobile_longhand("position-x", "right"),
            Some(false)
        );
        assert_eq!(
            program.replace_mobile("none red", 0),
            Some(Some(0xffff0000))
        );
        assert!(program.layers().is_empty());

        assert_eq!(
            program.replace_mobile("url(a), url(b), url(c)", 0),
            Some(None)
        );
        let original = Arc::clone(program.layers());
        assert_eq!(original[0].repeat, [Repeat::NoRepeat; 2]);
        assert_eq!(original[1].repeat, [Repeat::Round; 2]);
        assert_eq!(original[2].repeat, original[0].repeat);
        assert_eq!(
            program.set_mobile_longhand("repeat", "repeat, invalid"),
            None
        );
        assert_eq!(program.replace_mobile("invalid", 0), None);
        assert!(Arc::ptr_eq(program.layers(), &original));

        assert_eq!(
            program.set_mobile_longhand("position", "left bottom"),
            Some(true)
        );
        assert_ne!(program.layers()[0].position, original[0].position);
        assert_eq!(program.set_mobile_longhand("repeat", ""), Some(false));
        assert_eq!(program.layers()[0].repeat, [Repeat::NoRepeat; 2]);
        assert_eq!(program.replace_mobile("url(replacement)", 0), Some(None));
        assert_eq!(program.layers()[0].repeat, [Repeat::Repeat; 2]);
        assert_eq!(
            program.layers()[0].position,
            parse_background("left bottom", 0).unwrap()[0].position
        );
    }

    #[test]
    fn retains_svg_urls_and_groups_layer_declarations() {
        let svg = "data:image/svg+xml,<svg a='url(#a,b)'/>";
        let css = format!("url(\"{svg}\") no-repeat right 10px bottom 25% / cover fixed content-box text, linear-gradient(red, blue) repeat-x currentColor");
        let layers = parse_background(&css, 0xff123456).unwrap();
        assert_eq!(layers[0].image, Some(Image::Url(svg.into())));
        assert_eq!(layers[0].clip, BoxKind::Text);
        assert_eq!(layers[0].origin, BoxKind::Content);
        assert_eq!(layers[0].repeat, [Repeat::NoRepeat; 2]);
        assert_eq!(layers[0].size, Some(Size::Cover));
        assert_eq!(layers[0].attachment, Attachment::Fixed);
        let ctx = LengthContext {
            scale: 2.,
            font_size: 16.,
            root_font_size: 16.,
            viewport_width: 0.,
            viewport_height: 0.,
        };
        let [x, y] = layers[0]
            .position
            .each_ref()
            .map(|axis| axis.as_ref().unwrap());
        assert_eq!(x.resolve(100., ctx), 80.);
        assert_eq!(y.resolve(200., ctx), 150.);
        let Some(Image::Gradient(Some(gradient))) = &layers[1].image else {
            panic!("Expected a parsed gradient");
        };
        assert_eq!(gradient.stops.len(), 2);
        assert_eq!(layers[1].repeat, [Repeat::Repeat, Repeat::NoRepeat]);
        assert_eq!(layers[1].color, Some(0xff123456));
    }

    #[test]
    fn handles_slashes_comments_and_nested_color_functions() {
        let layers = parse_background(
            "center/* gap */ / 25% auto url(a.png) space round rgb(0 0 255 / 50%);",
            0,
        )
        .unwrap();
        let layer = &layers[0];
        assert_eq!(layer.image, Some(Image::Url("a.png".into())));
        assert!(matches!(layer.size, Some(Size::Explicit([Some(_), None]))));
        assert_eq!(layer.color, Some(0x800000ff));
        assert_eq!(layer.repeat, [Repeat::Space, Repeat::Round]);
    }

    #[test]
    fn decodes_css_escapes_in_quoted_urls() {
        let layers = parse_background(r#"url("\3c svg> say \"hi\"")"#, 0).unwrap();
        assert_eq!(
            layers[0].image,
            Some(Image::Url(r#"<svg> say "hi""#.into()))
        );
    }

    #[test]
    fn rejects_invalid_shorthand_as_a_whole() {
        for invalid in [
            "red, none",
            "url(a.png),",
            "center /",
            "/ contain",
            "url(a.png",
            "url(a.png) none",
        ] {
            assert!(parse_background(invalid, 0).is_none(), "{invalid}");
        }
        assert_eq!(parse_background("", 0), Some(Vec::new()));
        assert_eq!(parse_background("none", 0).unwrap(), [Layer::default()]);
    }

    #[test]
    fn expands_for_the_cascade_with_only_authored_longhands() {
        for (css, expected) in [
            ("red", ["red", "", "", "", "", "", "", ""]),
            ("rgb(0, 0, 0)", ["rgb(0, 0, 0)", "", "", "", "", "", "", ""]),
            ("none", ["", "none", "", "", "", "", "", ""]),
            ("url(a.png)", ["", "url(a.png)", "", "", "", "", "", ""]),
            (
                "url(a.png) no-repeat center / cover padding-box #fff",
                [
                    "#fff",
                    "url(a.png)",
                    "no-repeat",
                    "center",
                    "cover",
                    "padding-box",
                    "padding-box",
                    "",
                ],
            ),
            (
                "#fff url(a.png) 10px 20px/5px auto fixed content-box border-box",
                [
                    "#fff",
                    "url(a.png)",
                    "",
                    "10px 20px",
                    "5px auto",
                    "border-box",
                    "content-box",
                    "fixed",
                ],
            ),
            (
                "repeat space radial-gradient(circle at 50% 50%, red, blue)",
                [
                    "",
                    "radial-gradient(circle at 50% 50%, red, blue)",
                    "repeat space",
                    "",
                    "",
                    "",
                    "",
                    "",
                ],
            ),
            (
                "linear-gradient(red, blue), url(b.png) repeat-x left top / 50% blue",
                [
                    "blue",
                    "linear-gradient(red, blue), url(b.png)",
                    "repeat, repeat-x",
                    "0% 0%, left top",
                    "auto, 50%",
                    "",
                    "",
                    "",
                ],
            ),
            (
                "url(a.png) padding-box, url(b.png)",
                [
                    "",
                    "url(a.png), url(b.png)",
                    "",
                    "",
                    "",
                    "padding-box, border-box",
                    "padding-box, padding-box",
                    "",
                ],
            ),
            (
                "linear-gradient(red, blue) text",
                ["", "linear-gradient(red, blue)", "", "", "", "text", "", ""],
            ),
            (
                "linear-gradient(red, blue) content-box text",
                [
                    "",
                    "linear-gradient(red, blue)",
                    "",
                    "",
                    "",
                    "text",
                    "content-box",
                    "",
                ],
            ),
            (
                "text content-box url(a.png)",
                ["", "url(a.png)", "", "", "", "text", "content-box", ""],
            ),
        ] {
            assert_eq!(split_shorthand(css).unwrap(), expected, "{css}");
        }
    }

    #[test]
    fn shorthand_expansion_and_paint_share_structural_errors() {
        for css in [
            "",
            "red, url(a.png)",
            "url(a) url(b)",
            "red blue",
            "url(a) / cover",
            "center /",
            "center / cover contain",
            "center / cover top",
            "url(a),",
            "no-repeat repeat-x",
            "url(a) text text",
            "url(a) padding-box content-box text",
            "url(a) padding-box padding-box text",
        ] {
            assert!(split_shorthand(css).is_none(), "{css}");
            if !css.is_empty() {
                assert!(parse_background(css, 0).is_none(), "{css}");
            }
        }
    }

    #[test]
    fn expansion_keeps_source_text_for_the_resolved_image_property() {
        let source = r#"url("data:image/svg+xml,<svg><path d='M0 0,1 1'/></svg>")"#;
        let css = format!(
            "{source} center /* position */ / contain, image-set(url(a.png) 1x) currentColor"
        );
        let fields = split_shorthand(&css).unwrap();
        assert_eq!(
            fields[BackgroundInputRecord::IMAGE],
            format!("{source}, image-set(url(a.png) 1x)")
        );
        assert_eq!(fields[BackgroundInputRecord::POSITION], "center, 0% 0%");
        assert_eq!(fields[BackgroundInputRecord::SIZE], "contain, auto");
        assert_eq!(fields[BackgroundInputRecord::COLOR], "currentColor");
    }
}
