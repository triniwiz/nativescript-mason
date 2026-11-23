//! Parsed mask layers. The image list owns the slots; other lists repeat over them.
use super::background::{self, BoxKind, Image, Layer, Part};
use super::length::LiteralLength;

pub const LONGHAND_COUNT: usize = super::MaskInputRecord::STRIDE;

// <style-keys:mask-keywords> generated from tools/scripts/style-keys/style-keys.schema
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
#[repr(u8)]
pub enum MaskClip {
    #[default]
    Border = 0,
    Padding = 1,
    Content = 2,
    NoClip = 3,
}

impl MaskClip {
    fn parse(value: &str) -> Option<Self> {
        match super::keywords::code("mask-clip", value, false)? {
            0 => Some(Self::Border),
            1 => Some(Self::Padding),
            2 => Some(Self::Content),
            3 => Some(Self::NoClip),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
#[repr(u8)]
pub enum MaskMode {
    #[default]
    MatchSource = 0,
    Alpha = 1,
    Luminance = 2,
}

impl MaskMode {
    fn parse(value: &str) -> Option<Self> {
        match super::keywords::code("mask-mode", value, false)? {
            0 => Some(Self::MatchSource),
            1 => Some(Self::Alpha),
            2 => Some(Self::Luminance),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
#[repr(u8)]
pub enum MaskComposite {
    #[default]
    Add = 0,
    Subtract = 1,
    Intersect = 2,
    Exclude = 3,
}

impl MaskComposite {
    fn parse(value: &str) -> Option<Self> {
        match super::keywords::code("mask-composite", value, false)? {
            0 => Some(Self::Add),
            1 => Some(Self::Subtract),
            2 => Some(Self::Intersect),
            3 => Some(Self::Exclude),
            _ => None,
        }
    }

    fn keyword(self) -> &'static str {
        match self {
            Self::Add => "add",
            Self::Subtract => "subtract",
            Self::Intersect => "intersect",
            Self::Exclude => "exclude",
        }
    }
}
// </style-keys:mask-keywords>

impl MaskComposite {
    fn webkit(value: &str) -> Option<Self> {
        Some(match value.to_ascii_lowercase().as_str() {
            "source-over" => Self::Add,
            "source-in" | "destination-in" => Self::Intersect,
            "source-out" => Self::Subtract,
            "xor" => Self::Exclude,
            _ => return Self::parse(value),
        })
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct MaskLayer {
    pub paint: Layer,
    pub clip: MaskClip,
    pub mode: MaskMode,
    pub composite: MaskComposite,
}

impl MaskLayer {
    fn new(image: Option<Image>) -> Self {
        Self {
            paint: Layer {
                image,
                origin: BoxKind::Border,
                ..Layer::default()
            },
            clip: MaskClip::Border,
            mode: MaskMode::MatchSource,
            composite: MaskComposite::Add,
        }
    }

    pub fn record(&self) -> [f64; super::MaskLayerRecord::STRIDE] {
        use super::MaskLayerRecord as Record;
        let mut record = [0.; Record::STRIDE];
        record[Record::CLIP] = f64::from(self.clip as u8);
        record[Record::MODE] = f64::from(self.mode as u8);
        record[Record::COMPOSITE] = f64::from(self.composite as u8);
        record
    }
}

fn apply_keywords<T: Copy>(
    layers: &mut [MaskLayer],
    input: &str,
    parse: impl Fn(&str) -> Option<T>,
    assign: impl Fn(&mut MaskLayer, T),
) {
    let Some(parts) = background::top_level_parts(input) else {
        return;
    };
    let values: Vec<_> = parts
        .split(|v| *v == Part::Comma)
        .filter(|item| !item.is_empty())
        .map(|item| match item {
            [Part::Word(word)] => parse(word),
            _ => None,
        })
        .collect();
    for (layer, value) in layers.iter_mut().zip(values.iter().copied().cycle()) {
        if let Some(value) = value {
            assign(layer, value);
        }
    }
}

/// Android historically rejects an image list with invalid entries. Other
/// renderers keep invalid image slots transparent to preserve list alignment.
pub fn parse_layers(
    [image, size, position, repeat, origin, clip, mode, composite]: [&str; LONGHAND_COUNT],
    current_color: u32,
    reject_invalid_images: bool,
) -> Option<Vec<MaskLayer>> {
    let parts = background::top_level_parts(image.trim().trim_end_matches(';'))?;
    let mut layers = Vec::new();
    for item in parts.split(|part| *part == Part::Comma) {
        let source = match item {
            [] => {
                if !reject_invalid_images {
                    continue;
                }
                Some(None)
            }
            [Part::Word(word)] if word.eq_ignore_ascii_case("none") => Some(None),
            [Part::Word(word)] => match background::image(word, current_color) {
                Some(Image::Gradient(None)) | None => None,
                image => Some(image),
            },
            _ => None,
        };
        let source = match source {
            Some(source) => source,
            None if reject_invalid_images => return None,
            None => None,
        };
        layers.push(MaskLayer::new(source));
    }
    if reject_invalid_images && layers.iter().all(|layer| layer.paint.image.is_none()) {
        return Some(Vec::new());
    }

    for (name, value) in [("size", size), ("position", position), ("repeat", repeat)] {
        if let Some(properties) = background::parse_layer_properties(name, value, true) {
            for (layer, property) in layers.iter_mut().zip(properties.into_iter().cycle()) {
                layer.paint.apply(property);
            }
        }
    }
    apply_keywords(&mut layers, origin, MaskClip::parse, |layer, origin| {
        layer.paint.origin = match origin {
            MaskClip::Border => BoxKind::Border,
            MaskClip::Padding => BoxKind::Padding,
            MaskClip::Content => BoxKind::Content,
            MaskClip::NoClip => return,
        };
    });
    apply_keywords(&mut layers, clip, MaskClip::parse, |layer, value| {
        layer.clip = value
    });
    apply_keywords(&mut layers, mode, MaskMode::parse, |layer, value| {
        layer.mode = value
    });
    apply_keywords(
        &mut layers,
        composite,
        MaskComposite::parse,
        |layer, value| layer.composite = value,
    );
    Some(layers)
}

fn word(part: Part<'_>) -> Option<&str> {
    match part {
        Part::Word(value) => Some(value),
        _ => None,
    }
}

fn webkit_box(value: &str) -> &str {
    match value.to_ascii_lowercase().as_str() {
        "border" => "border-box",
        "padding" => "padding-box",
        "content" => "content-box",
        _ => value,
    }
}

fn shorthand_keyword(value: &str, webkit: bool) -> &str {
    if !webkit {
        return value;
    }
    match MaskComposite::webkit(value) {
        Some(composite) => composite.keyword(),
        None => webkit_box(value),
    }
}

pub(super) fn webkit_longhand(value: &str, composite: bool) -> Option<String> {
    let parts = background::top_level_parts(value)?;
    let layers = parts.split(|part| *part == Part::Comma).map(|layer| {
        if composite {
            let operation = match layer {
                [Part::Word(word)] => MaskComposite::webkit(word).unwrap_or_default(),
                _ => MaskComposite::default(),
            };
            return operation.keyword().to_owned();
        }
        if let [Part::Word(word)] = layer {
            webkit_box(word).to_owned()
        } else {
            layer.iter().map(|part| part.text()).collect::<Vec<_>>().join(" ")
        }
    });
    Some(layers.collect::<Vec<_>>().join(", "))
}

fn is_length(part: Part<'_>) -> bool {
    word(part)
        .and_then(background::token)
        .and_then(|token| LiteralLength::parse(&token))
        .is_some()
}

fn is_position(part: Part<'_>) -> bool {
    word(part).is_some_and(|word| {
        matches!(
            word.to_ascii_lowercase().as_str(),
            "center" | "top" | "right" | "bottom" | "left"
        )
    }) || is_length(part)
}

fn is_size(part: Part<'_>) -> bool {
    word(part).is_some_and(|word| {
        matches!(
            word.to_ascii_lowercase().as_str(),
            "auto" | "contain" | "cover"
        )
    }) || is_length(part)
}

fn is_repeat(part: Part<'_>) -> bool {
    background::parse_longhand_entry("repeat", &[part]).is_some()
}

fn take_group<'a, 'b>(
    rest: &mut &'a [Part<'b>],
    accepts: impl Fn(Part<'b>) -> bool,
) -> &'a [Part<'b>] {
    let length = rest.iter().take_while(|part| accepts(**part)).count();
    let (head, tail) = rest.split_at(length);
    *rest = tail;
    head
}

fn expand_layer(mut rest: &[Part<'_>], webkit: bool) -> Option<[String; LONGHAND_COUNT]> {
    use super::MaskInputRecord as Field;
    if rest.is_empty() {
        return None;
    }
    let mut fields: [Option<String>; LONGHAND_COUNT] = Default::default();
    let mut box_count = 0;
    let mut no_clip = false;
    while let Some(&part) = rest.first() {
        let value = word(part)?;
        let lowercase = value.to_ascii_lowercase();
        let keyword = shorthand_keyword(&lowercase, webkit);
        if let Some(clip) = MaskClip::parse(keyword) {
            if clip == MaskClip::NoClip {
                if no_clip || box_count == 2 {
                    return None;
                }
                fields[Field::CLIP] = Some(keyword.to_owned());
                no_clip = true;
            } else {
                if box_count == 2 || (no_clip && box_count == 1) {
                    return None;
                }
                if box_count == 0 {
                    fields[Field::ORIGIN] = Some(keyword.to_owned());
                }
                if !no_clip {
                    fields[Field::CLIP] = Some(keyword.to_owned());
                }
                box_count += 1;
            }
            rest = &rest[1..];
        } else if fields[Field::POSITION].is_none() && is_position(part) {
            let group = take_group(&mut rest, is_position);
            background::parse_longhand_entry("position", group)?;
            fields[Field::POSITION] = Some(join_words(group));
            if let Some(tail) = rest.strip_prefix(&[Part::Slash]) {
                rest = tail;
                let size = take_group(&mut rest, is_size);
                background::parse_longhand_entry("size", size)?;
                fields[Field::SIZE] = Some(join_words(size));
            }
        } else if fields[Field::REPEAT].is_none() && is_repeat(part) {
            let group = take_group(&mut rest, is_repeat);
            background::parse_longhand_entry("repeat", group)?;
            fields[Field::REPEAT] = Some(join_words(group));
        } else {
            let (index, token) = if background::image_source_syntax(keyword) {
                (Field::IMAGE, value)
            } else if MaskComposite::parse(keyword).is_some() {
                (Field::COMPOSITE, keyword)
            } else if MaskMode::parse(keyword).is_some() {
                (Field::MODE, keyword)
            } else {
                return None;
            };
            if fields[index].is_some() {
                return None;
            }
            fields[index] = Some(token.to_owned());
            rest = &rest[1..];
        }
    }
    let defaults = [
        "none",
        "auto",
        "0% 0%",
        "repeat",
        "border-box",
        "border-box",
        "match-source",
        "add",
    ];
    Some(std::array::from_fn(|index| {
        fields[index]
            .take()
            .unwrap_or_else(|| defaults[index].to_owned())
    }))
}

fn join_words(parts: &[Part<'_>]) -> String {
    parts
        .iter()
        .filter_map(|part| word(*part))
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn split_shorthand(value: &str, webkit: bool) -> Option<[String; LONGHAND_COUNT]> {
    let parts = background::top_level_parts(value)?;
    let mut layers = parts.split(|part| *part == Part::Comma);
    let mut output = expand_layer(layers.next()?, webkit)?;
    for layer in layers {
        for (field, value) in output.iter_mut().zip(expand_layer(layer, webkit)?) {
            field.push_str(", ");
            field.push_str(&value);
        }
    }
    Some(output)
}

#[cfg(test)]
mod shorthand_tests {
    use super::split_shorthand;
    use crate::style::css::MaskInputRecord as Field;

    #[test]
    fn expands_defaults_boxes_and_multiple_layers() {
        assert_eq!(
            split_shorthand("url(a.svg)", false).unwrap(),
            [
                "url(a.svg)",
                "auto",
                "0% 0%",
                "repeat",
                "border-box",
                "border-box",
                "match-source",
                "add"
            ],
        );
        let parts = split_shorthand(
            "luminance subtract no-repeat center / contain padding-box content-box linear-gradient(black, transparent), url(b.svg)",
            false,
        ).unwrap();
        assert_eq!(
            parts,
            [
                "linear-gradient(black, transparent), url(b.svg)",
                "contain, auto",
                "center, 0% 0%",
                "no-repeat, repeat",
                "padding-box, border-box",
                "content-box, border-box",
                "luminance, match-source",
                "subtract, add"
            ]
        );
        let single_box = split_shorthand("url(a.svg) content-box", false).unwrap();
        assert_eq!(single_box[Field::ORIGIN], "content-box");
        assert_eq!(single_box[Field::CLIP], "content-box");
        for boxes in ["padding-box no-clip", "no-clip padding-box"] {
            let parts = split_shorthand(&format!("url(a.svg) {boxes}"), false).unwrap();
            assert_eq!(parts[Field::ORIGIN], "padding-box");
            assert_eq!(parts[Field::CLIP], "no-clip");
        }
    }

    #[test]
    fn accepts_webkit_keywords_and_preserves_image_text() {
        let value = r#"url("data:image/svg+xml,<svg><path d='M0 0,1 1'/></svg>")"#;
        let parts = split_shorthand(
            &format!("{value} no-repeat center / contain padding xor"),
            true,
        )
        .unwrap();
        assert_eq!(parts[Field::IMAGE], value);
        assert_eq!(parts[Field::ORIGIN], "padding-box");
        assert_eq!(parts[Field::COMPOSITE], "exclude");
    }

    #[test]
    fn rejects_invalid_layers_without_returning_partial_longhands() {
        for invalid in [
            "url(a.svg) red",
            "url(a.svg), ",
            "url(a.svg) url(b.svg)",
            "padding-box content-box no-clip",
            "center / cover contain",
            "top bottom",
            "repeat-x round",
        ] {
            assert!(split_shorthand(invalid, false).is_none(), "{invalid}");
        }
    }
}
