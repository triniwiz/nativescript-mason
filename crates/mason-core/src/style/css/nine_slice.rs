//! Shared value grammar for border-image and mask-border.

use super::background::{self, Image, Part};
use super::length::{Component, LiteralLength};
use super::position::Axis;
use super::{LengthContext, NineSliceInputRecord, NineSliceRecord, NineSliceSideRecord};
use cssparser::Token;

pub const LONGHAND_COUNT: usize = NineSliceInputRecord::STRIDE;

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Repeat {
    Stretch,
    Repeat,
    Round,
    Space,
}

impl Repeat {
    fn parse(word: &str) -> Option<Self> {
        match word.to_ascii_lowercase().as_str() {
            "stretch" => Some(Self::Stretch),
            "repeat" => Some(Self::Repeat),
            "round" => Some(Self::Round),
            "space" => Some(Self::Space),
            _ => None,
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Side {
    Number(f32),
    Percentage(f64),
    Length(LiteralLength),
    Math(Axis),
    Auto,
}

impl Side {
    pub fn record(&self, context: LengthContext) -> [f64; NineSliceSideRecord::STRIDE] {
        let (kind, value) = match self {
            Self::Number(value) => (0., f64::from(*value)),
            Self::Percentage(fraction) => (1., *fraction),
            Self::Length(value) => (2., f64::from(value.resolve(context, 0.))),
            Self::Math(axis) if axis.uses_percentage() => (2., 0.),
            Self::Math(axis) => (2., f64::from(axis.resolve(0., context).max(0.))),
            Self::Auto => (3., 0.),
        };
        let mut record = [0.; NineSliceSideRecord::STRIDE];
        record[NineSliceSideRecord::KIND] = kind;
        record[NineSliceSideRecord::VALUE] = value;
        record[NineSliceSideRecord::HAS_MATH] =
            f64::from(matches!(self, Self::Math(axis) if axis.uses_percentage()));
        record
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Kind {
    BorderImage,
    MaskBorder,
}

impl Kind {
    fn initials(self) -> [&'static str; LONGHAND_COUNT] {
        match self {
            Self::BorderImage => ["none", "100%", "1", "0", "stretch", ""],
            Self::MaskBorder => ["none", "0", "auto", "0", "stretch", "alpha"],
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct NineSlice {
    pub source: Option<(String, Image)>,
    pub slice: [Side; 4],
    pub width: [Side; 4],
    pub outset: [Side; 4],
    pub repeat: [Repeat; 2],
    pub fill: bool,
    pub luminance: bool,
}

impl NineSlice {
    fn initial(kind: Kind) -> Self {
        let (slice, width) = match kind {
            Kind::BorderImage => (Side::Percentage(1.), Side::Number(1.)),
            Kind::MaskBorder => (Side::Number(0.), Side::Auto),
        };
        Self {
            source: None,
            slice: std::array::from_fn(|_| slice.clone()),
            width: std::array::from_fn(|_| width.clone()),
            outset: [const { Side::Number(0.) }; 4],
            repeat: [Repeat::Stretch; 2],
            fill: false,
            luminance: false,
        }
    }

    pub fn records(
        &self,
        context: LengthContext,
    ) -> [f64; NineSliceRecord::STRIDE + 12 * NineSliceSideRecord::STRIDE] {
        let mut record = [0.; NineSliceRecord::STRIDE + 12 * NineSliceSideRecord::STRIDE];
        record[NineSliceRecord::FILL] = f64::from(self.fill);
        record[NineSliceRecord::REPEAT_X] = f64::from(self.repeat[0] as u8);
        record[NineSliceRecord::REPEAT_Y] = f64::from(self.repeat[1] as u8);
        record[NineSliceRecord::LUMINANCE] = f64::from(self.luminance);
        for (output, side) in record[NineSliceRecord::STRIDE..]
            .chunks_exact_mut(NineSliceSideRecord::STRIDE)
            .zip(self.slice.iter().chain(&self.width).chain(&self.outset))
        {
            output.copy_from_slice(&side.record(context));
        }
        record
    }

    /// A width formula whose percentage basis is the final border image area.
    pub fn width_offset(&self, index: usize) -> Option<&Axis> {
        match self.width.get(index)? {
            Side::Math(axis) if axis.uses_percentage() => Some(axis),
            _ => None,
        }
    }
}

fn word(part: Part<'_>) -> Option<&str> {
    match part {
        Part::Word(word) => Some(word),
        _ => None,
    }
}

fn is_word(part: Part<'_>, value: &str) -> bool {
    word(part).is_some_and(|word| word.eq_ignore_ascii_case(value))
}

fn parse_source(parts: &[Part<'_>], current_color: u32) -> Option<Option<(String, Image)>> {
    let [Part::Word(value)] = parts else {
        return None;
    };
    if value.eq_ignore_ascii_case("none") {
        return Some(None);
    }
    let image = background::image(value, current_color)?;
    match &image {
        Image::Gradient(None) => None,
        Image::Url(url) if url.is_empty() => None,
        _ => Some(Some(((*value).to_owned(), image))),
    }
}

fn parse_side(part: Part<'_>, group: usize) -> Option<Side> {
    let value = word(part)?;
    let component = Component::parse(value)?;
    if let Component::Math(expression, _) = &component {
        if let Some(amount) = expression.resolve_number() {
            return Some(Side::Number(amount.max(0.)));
        }
        return match group {
            NineSliceInputRecord::SLICE => expression
                .resolve_percentage()
                .map(|fraction| Side::Percentage(fraction.max(0.))),
            NineSliceInputRecord::OUTSET if expression.uses_percentage() => None,
            _ => Axis::explicit(&component).map(Side::Math),
        };
    }
    let token = component.literal()?;
    match token {
        Token::Number { value, .. } if value.is_finite() && *value >= 0. => {
            Some(Side::Number(*value))
        }
        Token::Percentage { unit_value, .. }
            if group != NineSliceInputRecord::OUTSET
                && unit_value.is_finite()
                && *unit_value >= 0. =>
        {
            Some(Side::Percentage(
                value.strip_suffix('%')?.parse::<f64>().ok()? / 100.,
            ))
        }
        Token::Dimension { .. } if group != NineSliceInputRecord::SLICE => {
            let length = LiteralLength::parse(token)?;
            (!length.is_negative()).then_some(Side::Length(length))
        }
        Token::Ident(name)
            if group == NineSliceInputRecord::WIDTH && name.eq_ignore_ascii_case("auto") =>
        {
            Some(Side::Auto)
        }
        _ => None,
    }
}

fn parse_sides(parts: &[Part<'_>], group: usize) -> Option<[Side; 4]> {
    let parsed: Vec<_> = parts.iter().map(|part| parse_side(*part, group)).collect::<Option<_>>()?;
    super::layout_shorthand::four_sides(&parsed)
}

fn parse_slice(parts: &[Part<'_>]) -> Option<([Side; 4], bool)> {
    let (sides, fill) = match parts {
        [head, rest @ ..] if is_word(*head, "fill") => (rest, true),
        [rest @ .., tail] if is_word(*tail, "fill") => (rest, true),
        _ => (parts, false),
    };
    Some((parse_sides(sides, NineSliceInputRecord::SLICE)?, fill))
}

fn parse_repeat(parts: &[Part<'_>]) -> Option<[Repeat; 2]> {
    let repeat = |part| Repeat::parse(word(part)?);
    match parts {
        [x] => Some([repeat(*x)?; 2]),
        [x, y] => Some([repeat(*x)?, repeat(*y)?]),
        _ => None,
    }
}

fn parse_mode(parts: &[Part<'_>]) -> Option<bool> {
    match parts {
        [value] if is_word(*value, "luminance") => Some(true),
        [value] if is_word(*value, "alpha") => Some(false),
        _ => None,
    }
}

fn apply_longhands(
    parts: [Option<&[Part<'_>]>; LONGHAND_COUNT],
    kind: Kind,
    current_color: u32,
    strict: bool,
) -> Option<NineSlice> {
    let [source, slice, width, outset, repeat, mode] = parts;
    let mut spec = NineSlice::initial(kind);
    // An invalid source cannot be drawn, even with valid geometry.
    if let Some(source) = source {
        spec.source = parse_source(source, current_color)?;
    }

    fn apply<T>(
        part: Option<&[Part<'_>]>,
        parse: impl FnOnce(&[Part<'_>]) -> Option<T>,
        strict: bool,
        value: &mut T,
    ) -> Option<()> {
        if let Some(part) = part {
            match parse(part) {
                Some(parsed) => *value = parsed,
                None if strict => return None,
                None => (),
            }
        }
        Some(())
    }

    let mut slice_value = (spec.slice, spec.fill);
    apply(slice, parse_slice, strict, &mut slice_value)?;
    (spec.slice, spec.fill) = slice_value;
    apply(
        width,
        |parts| parse_sides(parts, NineSliceInputRecord::WIDTH),
        strict,
        &mut spec.width,
    )?;
    apply(
        outset,
        |parts| parse_sides(parts, NineSliceInputRecord::OUTSET),
        strict,
        &mut spec.outset,
    )?;
    apply(repeat, parse_repeat, strict, &mut spec.repeat)?;
    if kind == Kind::MaskBorder {
        apply(mode, parse_mode, strict, &mut spec.luminance)?;
    }
    Some(spec)
}

pub fn parse_longhands(
    values: [&str; LONGHAND_COUNT],
    kind: Kind,
    current_color: u32,
    strict: bool,
) -> Option<NineSlice> {
    let parts = values.map(|value| {
        let value = value.trim();
        if value.is_empty() {
            None
        } else {
            Some(background::top_level_parts(value).unwrap_or_else(|| vec![Part::Comma]))
        }
    });
    apply_longhands(
        parts.each_ref().map(|part| part.as_deref()),
        kind,
        current_color,
        strict,
    )
}

fn consume<'a, 'b>(
    parts: &mut &'a [Part<'b>],
    accepts: impl Fn(Part<'b>) -> bool,
) -> &'a [Part<'b>] {
    let length = parts.iter().take_while(|part| accepts(**part)).count();
    let (head, tail) = parts.split_at(length);
    *parts = tail;
    head
}

fn shorthand_parts<'a, 'b>(
    mut rest: &'a [Part<'b>],
    kind: Kind,
) -> Option<[Option<&'a [Part<'b>]>; LONGHAND_COUNT]> {
    use NineSliceInputRecord as Field;
    if rest.is_empty() {
        return None;
    }
    let mut fields = [None; LONGHAND_COUNT];
    let is_source = |part| word(part).is_some_and(background::image_source_syntax);
    let is_repeat = |part| word(part).and_then(Repeat::parse).is_some();
    let is_slice = |part| is_word(part, "fill") || parse_side(part, Field::SLICE).is_some();
    let is_mode =
        |part| kind == Kind::MaskBorder && (is_word(part, "alpha") || is_word(part, "luminance"));
    let is_edge = |part| part == Part::Slash || is_source(part) || is_repeat(part) || is_mode(part);
    while let Some(&part) = rest.first() {
        if fields[Field::SOURCE].is_none() && is_source(part) {
            fields[Field::SOURCE] = Some(&rest[..1]);
            rest = &rest[1..];
        } else if fields[Field::REPEAT].is_none() && is_repeat(part) {
            fields[Field::REPEAT] = Some(consume(&mut rest, is_repeat));
        } else if fields[Field::MODE].is_none() && is_mode(part) {
            fields[Field::MODE] = Some(&rest[..1]);
            rest = &rest[1..];
        } else if fields[Field::SLICE].is_none() && is_slice(part) {
            fields[Field::SLICE] = Some(consume(&mut rest, is_slice));
            if let Some(tail) = rest.strip_prefix(&[Part::Slash]) {
                rest = tail;
                let width = consume(&mut rest, |part| !is_edge(part));
                if let Some(tail) = rest.strip_prefix(&[Part::Slash]) {
                    rest = tail;
                    let outset = consume(&mut rest, |part| !is_edge(part));
                    if outset.is_empty() {
                        return None;
                    }
                    fields[Field::OUTSET] = Some(outset);
                } else if width.is_empty() {
                    return None;
                }
                if !width.is_empty() {
                    fields[Field::WIDTH] = Some(width);
                }
            }
        } else {
            return None;
        }
    }
    Some(fields)
}

pub fn parse_shorthand(value: &str, kind: Kind, current_color: u32) -> Option<NineSlice> {
    let parts = background::top_level_parts(value.trim())?;
    apply_longhands(shorthand_parts(&parts, kind)?, kind, current_color, true)
}

/// Expand for cascades that address the individual longhand names.
pub fn split_shorthand(value: &str, kind: Kind) -> Option<[String; LONGHAND_COUNT]> {
    let parts = background::top_level_parts(value.trim())?;
    let fields = shorthand_parts(&parts, kind)?;
    let mut geometry = fields;
    if let Some(source) = geometry[NineSliceInputRecord::SOURCE].take() {
        let [Part::Word(value)] = source else {
            return None;
        };
        if !background::image_source_syntax(value) {
            return None;
        }
    }
    // The cascade keeps the source CSS. The resolved longhands parse the image after the cascade.
    apply_longhands(geometry, kind, 0xff000000, true)?;
    let mut result = kind.initials().map(str::to_owned);
    for (index, parts) in fields.into_iter().enumerate() {
        if let Some(parts) = parts {
            result[index] = parts
                .iter()
                .filter_map(|part| word(*part))
                .collect::<Vec<_>>()
                .join(" ");
        }
    }
    Some(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shorthand_expands_reordered_groups_and_preserves_source() {
        let source = r#"url("data:image/svg+xml,<svg><path d='M0 0,1 1'/></svg>")"#;
        let declaration = format!("repeat space fill 1 2 3 4 / / 5px {source}");
        let spec = parse_shorthand(&declaration, Kind::BorderImage, 0).unwrap();
        assert_eq!(spec.source.unwrap().0, source);
        assert_eq!(
            spec.slice,
            [
                Side::Number(1.),
                Side::Number(2.),
                Side::Number(3.),
                Side::Number(4.)
            ]
        );
        assert_eq!(spec.width, [const { Side::Number(1.) }; 4]);
        assert_eq!(spec.repeat, [Repeat::Repeat, Repeat::Space]);
        assert!(spec.fill);
        assert_eq!(
            split_shorthand(&declaration, Kind::BorderImage).unwrap(),
            [source, "fill 1 2 3 4", "1", "5px", "repeat space", ""]
        );
    }

    #[test]
    fn expanding_preserves_an_image_source_until_the_cascade_resolves_it() {
        let source = "image-set(url(a.svg) 1x, url(b.svg) 2x)";
        assert_eq!(
            split_shorthand(&format!("{source} 25% / / 4px"), Kind::MaskBorder).unwrap(),
            [source, "25%", "auto", "4px", "stretch", "alpha"]
        );
        assert!(split_shorthand("unknown-image(a.svg) 25%", Kind::MaskBorder).is_none());
    }

    #[test]
    fn math_keeps_each_geometry_groups_units() {
        let input = [
            "url(a)", "max(10%, 25%) fill", "min(25%, 30px) calc(10% + 2px)",
            "calc(1em - 10px) calc(1 + 1)", "stretch", "alpha",
        ];
        let css = format!("{} {} / {} / {}", input[0], input[1], input[2], input[3]);
        let mask = parse_longhands(input, Kind::MaskBorder, 0, true).unwrap();
        assert_eq!(parse_shorthand(&css, Kind::BorderImage, 0), Some(mask.clone()));
        assert_eq!(split_shorthand(&css, Kind::MaskBorder).unwrap(), input);
        assert_eq!(mask.slice, [const { Side::Percentage(0.25) }; 4]);
        let context = LengthContext { font_size: 20., ..LengthContext::for_scale(1.) };
        assert_eq!(mask.outset[0].record(context), [2., 10., 0.]);
        assert_eq!(mask.outset[1].record(context), [0., 2., 0.]);
        assert_eq!(mask.width[0].record(context), [2., 0., 1.]);
        assert_eq!(mask.width_offset(0).unwrap().resolve(80., context), 20.);
        assert_eq!(mask.width_offset(0).unwrap().resolve(160., context), 30.);
        assert_eq!(mask.width_offset(1).unwrap().resolve(120., context), 14.);
        assert_eq!(mask.width_offset(1).unwrap().resolve(240., context), 26.);
        assert_eq!(
            parse_shorthand("url(a) calc(0%) / calc(1 + 2)", Kind::BorderImage, 0).unwrap().slice[0],
            Side::Percentage(0.)
        );
        for value in [
            "url(a) calc(10% + 2px)",
            "url(a) calc(10% + 2)",
            "url(a) 10 / 2 / calc(0%)",
            "url(a) 10 / calc(1px + 1)",
            "url(a) 10 / calc(1px / 0)",
        ] {
            assert!(parse_shorthand(value, Kind::BorderImage, 0).is_none(), "{value}");
        }
    }

    #[test]
    fn validates_geometry_and_defaults_independently_for_mask_longhands() {
        let spec =
            parse_shorthand("url(a.svg) 10% 20 / auto 2 10% 3px", Kind::BorderImage, 0).unwrap();
        assert_eq!(
            spec.slice,
            [
                Side::Percentage(0.1),
                Side::Number(20.),
                Side::Percentage(0.1),
                Side::Number(20.)
            ]
        );
        assert_eq!(spec.width[0], Side::Auto);
        assert_eq!(spec.width[2], Side::Percentage(0.1));
        assert!(parse_shorthand("none", Kind::BorderImage, 0)
            .unwrap()
            .source
            .is_none());
        for invalid in [
            "",
            "url(a) 30 / /",
            "url(a) fill 10 fill",
            "url(a) 30 / 1 / 10%",
            "url(a) 30 luminance",
            "url(a) round round round",
            "url(a) url(b)",
            "url(a) 30 / -1px",
        ] {
            assert!(
                parse_shorthand(invalid, Kind::BorderImage, 0).is_none(),
                "{invalid}"
            );
        }
        let input = ["url(a.svg)", "10", "-1px", "10%", "round", "luminance"];
        assert!(parse_longhands(input, Kind::MaskBorder, 0, true).is_none());
        let spec = parse_longhands(input, Kind::MaskBorder, 0, false).unwrap();
        assert_eq!(spec.width, [const { Side::Auto }; 4]);
        assert_eq!(spec.outset, [const { Side::Number(0.) }; 4]);
        assert_eq!(spec.repeat, [Repeat::Round; 2]);
        assert!(spec.luminance);
    }
}
