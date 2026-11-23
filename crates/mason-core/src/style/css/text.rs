use super::{
    angle,
    background::{token, top_level_parts, Part},
    keywords,
    length::{self, LengthMode},
    CssParseKind, FontFeatureRecord, LengthContext, SvgFontPrefixRecord,
};
use cssparser::{Delimiter, ParseError, Parser, ParserInput, Token};

pub(super) fn font_families(value: &str) -> Option<Vec<String>> {
    let mut input = ParserInput::new(value);
    read_font_families(&mut Parser::new(&mut input))
}

fn read_font_families(parser: &mut Parser<'_, '_>) -> Option<Vec<String>> {
    let mut families = Vec::new();
    while !parser.is_exhausted() {
        // Keep accepting a list with empty entries, as the native adapters did.
        if parser.try_parse(|part| part.expect_comma()).is_ok() {
            continue;
        }
        let family = parser
            .parse_until_before(Delimiter::Comma, |part| {
                let first = part.next()?.clone();
                let family = match first {
                    Token::QuotedString(name) => name.to_string(),
                    Token::Ident(name) => {
                        let mut family = name.to_string();
                        while let Ok(name) = part.try_parse(|part| part.expect_ident_cloned()) {
                            family.push(' ');
                            family.push_str(&name);
                        }
                        family
                    }
                    _ => return Err(part.new_unexpected_token_error(first)),
                };
                Ok::<_, ParseError<'_, ()>>(family)
            })
            .ok()?;
        if !family.trim().is_empty() {
            families.push(family);
        }
    }
    Some(families)
}

pub(super) fn svg_font_length(value: &str, basis: f32) -> Option<f32> {
    if !basis.is_finite() || basis < 0. {
        return None;
    }
    // SVG has historically used half the current font size for an ex.
    if let Some(Token::Dimension { value, unit, .. }) = token(value) {
        if unit.eq_ignore_ascii_case("ex") {
            let amount = value * (basis / 2.);
            return amount.is_finite().then_some(amount);
        }
    }
    let context = LengthContext {
        scale: 1.,
        font_size: basis,
        root_font_size: 16.,
        viewport_width: f32::NAN,
        viewport_height: f32::NAN,
    };
    let [kind, amount] = length::resolve(value, context, LengthMode::FontSize)?;
    let amount = if kind == 2. {
        amount * f64::from(basis)
    } else {
        amount
    } as f32;
    amount.is_finite().then_some(amount)
}

pub(super) fn svg_font_size(value: &str, parent: f32) -> Option<f32> {
    if !parent.is_finite() || parent < 0. {
        return None;
    }
    let size = match token(value) {
        Some(Token::Ident(keyword)) => match keyword.to_ascii_lowercase().as_str() {
            "xx-small" => 9.,
            "x-small" => 10.,
            "small" => 13.,
            "medium" => 16.,
            "large" => 18.,
            "x-large" => 24.,
            "xx-large" => 32.,
            "xxx-large" => 48.,
            "larger" => parent * 1.2,
            "smaller" => parent / 1.2,
            _ => return None,
        },
        _ => svg_font_length(value, parent)?,
    };
    (size.is_finite() && size >= 0.).then_some(size)
}

pub(super) fn svg_font_shorthand(
    value: &str,
    parent_size: f32,
    parent_weight: i32,
) -> Option<Vec<String>> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let mut italic = false;
    let mut weight = 400;
    let size = loop {
        let part = read_font_component(&mut parser)?;
        let word = match token(part) {
            Some(Token::Ident(word)) => word.to_ascii_lowercase(),
            _ => String::new(),
        };
        match word.as_str() {
            "italic" => italic = true,
            "oblique" => {
                italic = true;
                let start = parser.state();
                let slant = read_font_component(&mut parser)
                    .and_then(token)
                    .and_then(|token| {
                        if matches!(token, Token::Dimension { .. }) {
                            angle(&token)
                        } else {
                            None
                        }
                    });
                match slant {
                    Some(deg) if (-90. ..=90.).contains(&deg) => {}
                    Some(_) => return None,
                    None => parser.reset(&start),
                }
            }
            "normal" | "small-caps" => {}
            _ if keywords::code("font-stretch", &word, false).is_some() => {}
            _ => {
                if let Some(value) = svg_font_weight(part, parent_weight) {
                    weight = value;
                } else {
                    break svg_font_size(part, parent_size)?;
                }
            }
        }
    };
    if parser.try_parse(|part| part.expect_delim('/')).is_ok() {
        let line_height = read_font_component(&mut parser)?;
        if !line_height.eq_ignore_ascii_case("normal") && svg_font_length(line_height, size)? < 0. {
            return None;
        }
    }
    let families = read_font_families(&mut parser)?;
    if families.is_empty() {
        return None;
    }
    use SvgFontPrefixRecord as Prefix;
    let mut prefix = [const { String::new() }; Prefix::STRIDE];
    prefix[Prefix::ITALIC] = u8::from(italic).to_string();
    prefix[Prefix::WEIGHT] = weight.to_string();
    prefix[Prefix::SIZE] = size.to_string();
    Some(prefix.into_iter().chain(families).collect())
}

fn read_font_component<'i>(parser: &mut Parser<'i, '_>) -> Option<&'i str> {
    parser.skip_whitespace();
    let start = parser.position();
    if matches!(parser.next().ok()?, Token::Function(_)) {
        parser
            .parse_nested_block(|contents| {
                while contents.next().is_ok() {}
                Ok::<_, ParseError<'_, ()>>(())
            })
            .ok()?;
    }
    Some(parser.slice_from(start))
}

pub(super) fn font_style_fields(value: &str) -> Option<[String; 2]> {
    let tokens = top_level_parts(value)?;
    let (name, slant) = match tokens.as_slice() {
        [Part::Word(name)] => (*name, 0),
        [Part::Word(name), Part::Word(slant)] if name.eq_ignore_ascii_case("oblique") => {
            let token = token(slant)?;
            if matches!(token, Token::Number { value, .. } if value != 0.) {
                return None;
            }
            let deg = angle(&token)?;
            if !(-90. ..=90.).contains(&deg) {
                return None;
            }
            (*name, deg.round() as i32)
        }
        _ => return None,
    };
    let code = keywords::code("font-style", name, false)?;
    Some([code.to_string(), slant.to_string()])
}

pub(super) fn font_variant_numeric(value: &str) -> i32 {
    top_level_parts(value)
        .unwrap_or_default()
        .into_iter()
        .filter_map(|part| match part {
            Part::Word(word) => keywords::code("font-variant-numeric", word, false),
            _ => None,
        })
        .fold(0, |mask, flag| mask | flag)
}

pub(super) fn font_features(value: &str) -> Option<Vec<f64>> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    if parser.is_exhausted() {
        return Some(Vec::new());
    }
    if parser.try_parse(|part| part.expect_ident_matching("normal")).is_ok() {
        return parser.is_exhausted().then(Vec::new);
    }

    let mut records = Vec::new();
    loop {
        let feature = parser.parse_until_before(Delimiter::Comma, |part| {
            let tag = match part.next()?.clone() {
                Token::QuotedString(tag) | Token::Ident(tag) => tag,
                token => return Err(part.new_unexpected_token_error(token)),
            };
            let tag: [u8; 4] = tag.as_bytes().try_into().map_err(|_| part.new_custom_error(()))?;
            if !tag.iter().all(|byte| (0x20..=0x7e).contains(byte)) {
                return Err(part.new_custom_error(()));
            }
            let value = if part.is_exhausted() {
                1
            } else {
                part.skip_whitespace();
                let start = part.position();
                match part.next()?.clone() {
                    Token::Ident(word) if word.eq_ignore_ascii_case("on") => 1,
                    Token::Ident(word) if word.eq_ignore_ascii_case("off") => 0,
                    Token::Number { int_value: Some(_), .. } => part.slice_from(start)
                        .parse::<i64>().ok().and_then(|value| u32::try_from(value).ok())
                        .ok_or_else(|| part.new_custom_error(()))?,
                    token => return Err(part.new_unexpected_token_error(token)),
                }
            };
            let mut record = [0.; FontFeatureRecord::STRIDE];
            record[FontFeatureRecord::TAG] = f64::from(u32::from_le_bytes(tag));
            record[FontFeatureRecord::VALUE] = f64::from(value);
            Ok::<_, ParseError<'_, ()>>(record)
        }).ok()?;
        records.extend(feature);
        if parser.is_exhausted() {
            return Some(records);
        }
        parser.expect_comma().ok()?;
    }
}

pub(super) fn line_clamp(value: &str) -> Option<i32> {
    match token(value)? {
        Token::Ident(name) if name.eq_ignore_ascii_case("none") => Some(0),
        Token::Number { .. } => {
            let [amount, _] = length::scalar_fields(value)?;
            let lines = amount.parse::<f64>().ok()?.trunc();
            (0. ..=f64::from(i32::MAX))
                .contains(&lines)
                .then_some(lines as i32)
        }
        _ => None,
    }
}

pub(super) fn font_weight_fields(value: &str) -> Option<[String; 2]> {
    let (weight, name) = font_weight(value, None)?;
    Some([weight.to_string(), name])
}

pub(super) fn svg_font_weight(value: &str, parent: i32) -> Option<i32> {
    font_weight(value, Some(parent)).map(|(weight, _)| weight)
}

fn font_weight(value: &str, svg_parent: Option<i32>) -> Option<(i32, String)> {
    match token(value)? {
        Token::Ident(name) => {
            let name = name.to_ascii_lowercase();
            let weight = match (name.as_str(), svg_parent) {
                ("bolder", Some(parent)) => match parent {
                    ..350 => 400,
                    350..550 => 700,
                    _ => 900,
                },
                ("lighter", Some(parent)) => match parent {
                    ..550 => 100,
                    550..750 => 400,
                    _ => 700,
                },
                ("bold" | "normal", _) | (_, None) => keywords::code("font-weight", &name, false)?,
                _ => return None,
            };
            Some((weight, name))
        }
        Token::Number { .. } => {
            let [value, _] = length::scalar_fields(value)?;
            let weight = value.parse::<f64>().ok()?;
            (1. ..=1000.)
                .contains(&weight)
                .then_some((weight as i32, String::new()))
        }
        _ => None,
    }
}

pub(super) fn font_stretch(value: &str) -> Option<i32> {
    if let Some(code) = keywords::code("font-stretch", value, false) {
        return Some(code);
    }
    let [amount, unit] = length::scalar_fields(value)?;
    let amount = amount.parse::<f64>().ok()?;
    let code = (amount * 100.).round();
    (unit == "%" && amount >= 0. && code <= f64::from(i32::MAX)).then_some(code as i32)
}

pub(super) fn font_stretch_name(code: &str) -> Option<String> {
    let code = code.parse::<i32>().ok()?;
    Some(
        keywords::font_stretch_name(code)
            .map_or_else(|| format!("{}%", f64::from(code) / 100.), str::to_owned),
    )
}

pub(super) fn resolve_length(
    value: &str,
    context: LengthContext,
    kind: CssParseKind,
) -> Option<[f64; 2]> {
    use CssParseKind::{LetterSpacing, LineHeight, TextIndent, WordSpacing};
    if matches!(kind, LineHeight | LetterSpacing | WordSpacing)
        && matches!(token(value), Some(Token::Ident(word)) if word.eq_ignore_ascii_case("normal"))
    {
        return Some(match kind {
            LineHeight => [3., 0.],
            WordSpacing => [2., 0.],
            _ => [1., 0.],
        });
    }

    let value = if kind == TextIndent {
        indent_length(value)?
    } else {
        value
    };
    let [dimension, amount] = length::resolve(value, context, LengthMode::Normal)?;
    let scale = f64::from(context.scale);
    let fields = match (kind, dimension) {
        // Absolute line heights use CSS pixels, and unitless values remain multipliers.
        (LineHeight, 0.) if amount >= 0. => [0., amount],
        (LineHeight, 1.) if amount >= 0. => [1., amount / scale],
        (LineHeight, 2.) if amount >= 0. => {
            let font_size = if context.font_size > 0. {
                context.font_size
            } else {
                context.root_font_size
            };
            [1., amount * f64::from(font_size)]
        }
        // Letter spacing and indents use device pixels in the style buffer.
        (LetterSpacing | TextIndent, 0.) => [1., amount * scale],
        (LetterSpacing | TextIndent, 1.) => [1., amount],
        (TextIndent, 2.) => [2., amount],
        // Word spacing stores lengths in device pixels and percentages in percentage points.
        (WordSpacing, 0.) => [0., amount * scale],
        (WordSpacing, 1.) => [0., amount],
        (WordSpacing, 2.) => [1., amount * 100.],
        _ => return None,
    };
    (fields[1] as f32).is_finite().then_some(fields)
}

pub(super) fn resolve_vertical_align(value: &str, context: LengthContext) -> Option<[f64; 2]> {
    if let Some(code) = keywords::code("vertical-align", value, false) {
        return Some([3., f64::from(code)]);
    }
    let [kind, amount] = length::resolve(value, context, LengthMode::Normal)?;
    match kind {
        0. if amount == 0. => Some([1., 0.]),
        1. | 2. if (amount as f32).is_finite() => Some([kind, amount]),
        _ => None,
    }
}

fn indent_length(value: &str) -> Option<&str> {
    let mut length = None;
    let mut each_line = false;
    let mut hanging = false;
    for part in top_level_parts(value)? {
        let Part::Word(word) = part else { return None };
        if word.eq_ignore_ascii_case("each-line") && !each_line {
            each_line = true;
        } else if word.eq_ignore_ascii_case("hanging") && !hanging {
            hanging = true;
        } else if length.replace(word).is_some() {
            return None;
        }
    }
    length
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn font_features_parse_css_tags_and_parameters() {
        let features = font_features(r#""liga" OFF, 'tnum', "ss01" /* selector */ +3, kern on, "cv  " 4294967295"#).unwrap();
        let expected = [(*b"liga", 0), (*b"tnum", 1), (*b"ss01", 3), (*b"kern", 1), (*b"cv  ", u32::MAX)];
        for (record, (tag, value)) in features.chunks_exact(FontFeatureRecord::STRIDE).zip(expected) {
            assert_eq!(record[FontFeatureRecord::TAG], f64::from(u32::from_le_bytes(tag)));
            assert_eq!(record[FontFeatureRecord::VALUE], f64::from(value));
        }
        assert_eq!(features.len(), expected.len() * FontFeatureRecord::STRIDE);
        assert_eq!(font_features(" /* reset */ NoRmAl"), Some(vec![]));
        for invalid in [
            "normal, 'liga'", "'ligature'", "'aéa'", "'liga' -1",
            "'liga' 4294967296", "'liga' 1.0", "'liga' on junk", "'liga',",
        ] {
            assert!(font_features(invalid).is_none(), "{invalid}");
        }
    }

    #[test]
    fn parses_font_lists_with_css_escapes_comments_and_quoted_spacing() {
        assert_eq!(
            font_families(
                r#" , "A,  B", Mukta /* comment */ Mahee, Font\20 Name, Co\,de, "O\"Brien", "#
            )
            .unwrap(),
            ["A,  B", "Mukta Mahee", "Font Name", "Co,de", r#"O"Brien"#]
        );
        assert_eq!(font_families(" , "), Some(vec![]));
        assert!(font_families("A url(b), serif").is_none());
    }

    #[test]
    fn resolves_vertical_alignment_with_schema_codes_and_device_units() {
        let context = LengthContext {
            scale: 2.,
            font_size: 20.,
            root_font_size: 16.,
            viewport_width: 400.,
            viewport_height: 800.,
        };
        for (input, expected) in [
            ("TeXt-ToP", [3., 2.]),
            ("super", [3., 7.]),
            ("-25%", [2., -0.25]),
            ("calc(-.5em + 2px)", [1., -16.]),
            ("0", [1., 0.]),
        ] {
            assert_eq!(resolve_vertical_align(input, context), Some(expected), "{input}");
        }
        assert_eq!(resolve_vertical_align("2", context), None);
        assert_eq!(resolve_vertical_align("bogus", context), None);
    }

    #[test]
    fn resolves_svg_fonts_in_parent_units_and_keeps_family_names() {
        assert_eq!(
            svg_font_shorthand(
                r#"oblique -0.125turn bolder calc(1em + 2px) / 1.5 "A, B", serif"#,
                20.,
                400,
            )
            .unwrap(),
            ["1", "700", "22", "A, B", "serif"]
        );
        assert_eq!(
            svg_font_shorthand("small-caps condensed 150%/normal serif", 10., 700).unwrap(),
            ["0", "400", "15", "serif"]
        );
        assert!(svg_font_shorthand("italic 10px / bogus serif", 16., 400).is_none());
        assert!(svg_font_shorthand("italic 10px / 1.5", 16., 400).is_none());
        assert_eq!(svg_font_size("0.5ex", 24.), Some(6.));
        assert_eq!(svg_font_length("-25%", 20.), Some(-5.));
    }

    #[test]
    fn resolves_typographic_lengths_at_their_storage_scale() {
        use CssParseKind::{LetterSpacing, LineHeight, TextIndent, WordSpacing};
        let context = LengthContext {
            scale: 2.,
            font_size: 20.,
            root_font_size: 16.,
            viewport_width: 200.,
            viewport_height: 100.,
        };
        for (value, kind, expected) in [
            ("normal", LineHeight, [3., 0.]),
            ("calc(1 + .5)", LineHeight, [0., 1.5]),
            ("150%", LineHeight, [1., 30.]),
            ("1.5em", LineHeight, [1., 30.]),
            ("-0.25rem", LetterSpacing, [1., -8.]),
            ("hanging calc(1em + 2px) each-line", TextIndent, [1., 44.]),
            ("5% hanging", TextIndent, [2., 0.05]),
            ("calc(0.25em - 2px)", WordSpacing, [0., 6.]),
            ("-25%", WordSpacing, [1., -25.]),
            ("Normal", WordSpacing, [2., 0.]),
        ] {
            assert_eq!(
                resolve_length(value, context, kind),
                Some(expected),
                "{value}"
            );
        }
        assert!(resolve_length("-1", context, LineHeight).is_none());
        assert!(resolve_length("hanging each-line", context, TextIndent).is_none());
        assert!(resolve_length("4px 5px", context, TextIndent).is_none());
        assert!(resolve_length("50% 10px", context, WordSpacing).is_none());
    }

    #[test]
    fn font_keywords_and_numbers_share_one_grammar() {
        assert_eq!(
            font_weight_fields(" bOLD "),
            Some(["700".into(), "bold".into()])
        );
        assert_eq!(font_weight_fields("550.5"), Some(["550".into(), "".into()]));
        assert!(font_weight_fields("1001").is_none());
        assert_eq!(svg_font_weight("bolder", 400), Some(700));
        assert_eq!(svg_font_weight("lighter", 700), Some(400));
        assert!(svg_font_weight("heavy", 400).is_none());
        assert_eq!(font_stretch("semi-condensed"), Some(8750));
        assert_eq!(font_stretch("87.5%"), Some(8750));
        assert_eq!(font_stretch_name("8750").as_deref(), Some("semi-condensed"));
        assert_eq!(font_stretch_name("11325").as_deref(), Some("113.25%"));
        assert!(font_stretch("87%junk").is_none());
    }

    #[test]
    fn parses_font_slants_and_numeric_variants() {
        for (input, expected) in [
            ("Normal", ["0", "0"]),
            ("italic", ["1", "0"]),
            ("oblique", ["2", "0"]),
            ("Oblique /* CSS angle */ -0.125turn", ["2", "-45"]),
        ] {
            assert_eq!(font_style_fields(input).unwrap(), expected);
        }
        for input in ["oblique 91deg", "italic 2deg", "oblique 5", "oblique 30%"] {
            assert!(font_style_fields(input).is_none(), "{input}");
        }
        assert_eq!(font_variant_numeric("normal"), 0);
        assert_eq!(
            font_variant_numeric("tabular-nums /* gap */ SLASHED-ZERO"),
            136
        );
    }
}
