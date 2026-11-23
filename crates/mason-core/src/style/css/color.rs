use super::{length, LengthContext};
use csscolorparser::Color;
use cssparser::{color, Delimiter, ParseError, Parser, ParserInput, SourcePosition, Token};
use std::ops::Range;

fn is_color_function(name: &str) -> bool {
    [
        "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color",
    ]
    .iter()
    .any(|function| name.eq_ignore_ascii_case(function))
}

/// Visit complete color functions that a portable client can rewrite.
pub fn visit_color_functions(value: &str, mut visit: impl FnMut(Range<usize>)) {
    let mut input = ParserInput::new(value);
    visit_colors(&mut Parser::new(&mut input), &mut visit, 0);
}

fn visit_colors(parser: &mut Parser<'_, '_>, visit: &mut impl FnMut(Range<usize>), depth: u8) {
    while !parser.is_exhausted() {
        parser.skip_whitespace();
        let start = parser.position();
        match parser.next().cloned() {
            Ok(Token::Function(name))
                if is_color_function(&name) || name.eq_ignore_ascii_case("color-mix") =>
            {
                let body = parser.parse_nested_block(|body| {
                    Ok::<_, ParseError<'_, ()>>((contains_var(body, depth), body.position()))
                });
                if let Ok((false, end)) = body {
                    let legacy = ["rgb", "rgba", "hsl", "hsla"]
                        .iter()
                        .any(|function| name.eq_ignore_ascii_case(function));
                    if end.byte_index() < parser.position().byte_index()
                        && !(legacy && parser.slice_from(start).contains(','))
                    {
                        visit(start.byte_index()..parser.position().byte_index());
                    }
                }
            }
            Ok(Token::Function(name)) if name.eq_ignore_ascii_case("url") => {}
            Ok(
                Token::Function(_)
                | Token::ParenthesisBlock
                | Token::SquareBracketBlock
                | Token::CurlyBracketBlock,
            ) if depth < 128 => {
                let _ = parser.parse_nested_block(|body| {
                    visit_colors(body, visit, depth + 1);
                    Ok::<_, ParseError<'_, ()>>(())
                });
            }
            _ => {}
        }
    }
}

fn contains_var(parser: &mut Parser<'_, '_>, depth: u8) -> bool {
    let mut found = depth >= 128;
    while let Ok(token) = parser.next().cloned() {
        found |= match token {
            Token::Function(name) if name.eq_ignore_ascii_case("var") => true,
            Token::Function(_)
            | Token::ParenthesisBlock
            | Token::SquareBracketBlock
            | Token::CurlyBracketBlock
                if !found =>
            {
                parser
                    .parse_nested_block(|body| {
                        Ok::<_, ParseError<'_, ()>>(contains_var(body, depth + 1))
                    })
                    .unwrap_or(true)
            }
            _ => false,
        };
    }
    found
}

fn from_argb(argb: u32) -> Color {
    let [a, r, g, b] = argb.to_be_bytes();
    Color::from_rgba8(r, g, b, a)
}

fn parse_function(value: &str) -> Option<Color> {
    if !value.contains("/*") {
        return csscolorparser::parse(value).ok();
    }
    // The CSS tokenizer accepts comments between components. The color library
    // takes raw functional syntax and expects those gaps to be whitespace.
    let mut normalized = String::with_capacity(value.len());
    let mut remaining = value;
    while let Some((before, comment)) = remaining.split_once("/*") {
        normalized.push_str(before);
        normalized.push(' ');
        remaining = comment.split_once("*/")?.1;
    }
    normalized.push_str(remaining);
    csscolorparser::parse(&normalized).ok()
}

pub(super) fn parse_next(parser: &mut Parser<'_, '_>, current_color: Option<u32>) -> Option<u32> {
    let [r, g, b, a] = parse_component(parser, current_color, 0)?.to_rgba8();
    Some(u32::from_be_bytes([a, r, g, b]))
}

fn parse_color_function(parser: &mut Parser<'_, '_>, start: SourcePosition) -> Option<Color> {
    let context = LengthContext::for_scale(1.);
    let (mut normalized, tail) = parser
        .parse_nested_block(|body| {
            let mut normalized = String::new();
            let mut tail = start;
            while !body.is_exhausted() {
                body.skip_whitespace();
                let state = body.state();
                let position = body.position();
                if !length::is_math(body.next()?) {
                    continue;
                }
                body.reset(&state);
                let expression = length::parse_component(body)?;
                let value = match expression.resolve(context) {
                    Some([0., number]) => number.to_string(),
                    Some([2., fraction]) => format!("{}%", fraction * 100.),
                    _ => {
                        let angle = expression
                            .resolve_angle(context)
                            .ok_or_else(|| body.new_custom_error(()))?;
                        format!("{angle}deg")
                    }
                };
                normalized.push_str(body.slice(tail..position));
                normalized.push_str(&value);
                tail = body.position();
            }
            Ok::<_, ParseError<'_, ()>>((normalized, tail))
        })
        .ok()?;
    if normalized.is_empty() {
        return parse_function(parser.slice_from(start));
    }
    normalized.push_str(parser.slice_from(tail));
    parse_function(&normalized)
}

fn parse_component(
    parser: &mut Parser<'_, '_>,
    current_color: Option<u32>,
    depth: u8,
) -> Option<Color> {
    parser.skip_whitespace();
    let start = parser.position();
    match parser.next().ok()?.clone() {
        Token::Ident(name) if name.eq_ignore_ascii_case("currentcolor") => {
            current_color.map(from_argb)
        }
        Token::Ident(name) if name.eq_ignore_ascii_case("transparent") => {
            Some(Color::new(0., 0., 0., 0.))
        }
        Token::Ident(name) => {
            let (r, g, b) = color::parse_named_color(&name.to_ascii_lowercase()).ok()?;
            Some(Color::from_rgba8(r, g, b, 255))
        }
        Token::Hash(hash) | Token::IDHash(hash) => {
            let (r, g, b, alpha) = color::parse_hash_color(hash.as_bytes()).ok()?;
            let mut color = Color::from_rgba8(r, g, b, 255);
            color.a = alpha;
            Some(color)
        }
        Token::Function(name) if name.eq_ignore_ascii_case("color-mix") && depth < 32 => parser
            .parse_nested_block(|body| parse_mix(body, current_color, depth + 1))
            .ok(),
        Token::Function(name) if is_color_function(&name) => parse_color_function(parser, start),
        _ => None,
    }
}

#[derive(Clone, Copy, Default)]
enum HueMethod {
    #[default]
    Shorter,
    Longer,
    Increasing,
    Decreasing,
}

impl HueMethod {
    fn parse<'i>(parser: &mut Parser<'i, '_>) -> Result<Self, ParseError<'i, ()>> {
        if parser.is_exhausted() {
            return Ok(Self::Shorter);
        }
        let name = parser.expect_ident_cloned()?;
        let method = match name.to_ascii_lowercase().as_str() {
            "shorter" => Self::Shorter,
            "longer" => Self::Longer,
            "increasing" => Self::Increasing,
            "decreasing" => Self::Decreasing,
            _ => return Err(parser.new_custom_error(())),
        };
        parser.expect_ident_matching("hue")?;
        Ok(method)
    }

    fn mix(self, a: f32, b: f32, t: f32, turn: f32) -> f32 {
        let a = a.rem_euclid(turn);
        let b = b.rem_euclid(turn);
        let delta = b - a;
        let half = turn / 2.;
        let distance = match self {
            Self::Shorter if delta > half => delta - turn,
            Self::Shorter if delta < -half => delta + turn,
            Self::Longer if 0. < delta && delta < half => delta - turn,
            Self::Longer if -half < delta && delta <= 0. => delta + turn,
            Self::Increasing if delta < 0. => delta + turn,
            Self::Decreasing if delta > 0. => delta - turn,
            _ => delta,
        };
        (a + distance * t).rem_euclid(turn)
    }
}

type ToComponents = fn(&Color) -> [f32; 4];
type FromComponents = fn(f32, f32, f32, f32) -> Color;

struct MixSpace {
    to: ToComponents,
    from: FromComponents,
    hue: Option<(usize, f32, fn([f32; 4]) -> bool)>,
}

impl MixSpace {
    fn parse(name: &str) -> Option<Self> {
        let chroma_missing = |components: [f32; 4]| components[1].abs() < 0.00001;
        let w_b_missing = |components: [f32; 4]| components[1] + components[2] >= 1.;
        let tau = std::f32::consts::TAU;
        let (to, from, hue): (
            ToComponents,
            FromComponents,
            Option<(usize, f32, fn([f32; 4]) -> bool)>,
        ) = match name.to_ascii_lowercase().as_str() {
            "srgb" => (Color::to_array, Color::new, None),
            "srgb-linear" => (Color::to_linear_rgba, Color::from_linear_rgba, None),
            "display-p3" => (Color::to_display_p3, Color::from_display_p3, None),
            "display-p3-linear" => (
                Color::to_display_p3_linear,
                Color::from_display_p3_linear,
                None,
            ),
            "a98-rgb" => (Color::to_a98_rgb, Color::from_a98_rgb, None),
            "prophoto-rgb" => (Color::to_prophoto_rgb, Color::from_prophoto_rgb, None),
            "rec2020" => (Color::to_rec2020, Color::from_rec2020, None),
            "xyz" | "xyz-d65" => (Color::to_xyz_d65, Color::from_xyz_d65, None),
            "xyz-d50" => (Color::to_xyz_d50, Color::from_xyz_d50, None),
            "lab" => (Color::to_laba, Color::from_laba, None),
            "oklab" => (Color::to_oklaba, Color::from_oklaba, None),
            "lch" => (
                Color::to_lcha,
                Color::from_lcha,
                Some((2, tau, chroma_missing)),
            ),
            "oklch" => (
                Color::to_oklcha,
                Color::from_oklcha,
                Some((2, tau, chroma_missing)),
            ),
            "hsl" => (
                Color::to_hsla,
                Color::from_hsla,
                Some((0, 360., chroma_missing)),
            ),
            "hwb" => (
                Color::to_hwba,
                Color::from_hwba,
                Some((0, 360., w_b_missing)),
            ),
            _ => return None,
        };
        Some(Self { to, from, hue })
    }

    fn mix(&self, a: Color, b: Color, wa: f32, wb: f32, method: HueMethod) -> Color {
        let a = (self.to)(&a);
        let b = (self.to)(&b);
        let w = wa + wb;
        let t = wb / w;
        let aw = (1. - t) * a[3];
        let bw = t * b[3];
        let opacity = aw + bw;
        if opacity <= 0. {
            return Color::new(0., 0., 0., 0.);
        }
        let mut channels = std::array::from_fn::<_, 3, _>(|i| (a[i] * aw + b[i] * bw) / opacity);
        if let Some((i, turn, missing)) = self.hue {
            channels[i] = match (missing(a), missing(b)) {
                (true, _) => b[i],
                (_, true) => a[i],
                _ => method.mix(a[i], b[i], t, turn),
            };
        }
        (self.from)(channels[0], channels[1], channels[2], opacity * w.min(1.))
    }
}

fn mix_weight<'i>(parser: &mut Parser<'i, '_>) -> Result<f32, ParseError<'i, ()>> {
    let expression = length::parse_component(parser)?;
    match expression.resolve(LengthContext::for_scale(1.)) {
        Some([2., fraction]) => Ok(fraction as f32),
        _ => Err(parser.new_custom_error(())),
    }
}

fn parse_mix<'i>(
    parser: &mut Parser<'i, '_>,
    current_color: Option<u32>,
    depth: u8,
) -> Result<Color, ParseError<'i, ()>> {
    let (space, hue) = parser.parse_until_before(Delimiter::Comma, |part| {
        part.expect_ident_matching("in")?;
        let name = part.expect_ident_cloned()?;
        let space = MixSpace::parse(&name).ok_or_else(|| part.new_custom_error(()))?;
        let hue = if space.hue.is_some() {
            HueMethod::parse(part)?
        } else {
            HueMethod::default()
        };
        Ok((space, hue))
    })?;
    let component = |part: &mut Parser<'i, '_>| {
        let first = part.try_parse(mix_weight).ok();
        let color =
            parse_component(part, current_color, depth).ok_or_else(|| part.new_custom_error(()))?;
        let weight = first.or_else(|| part.try_parse(mix_weight).ok());
        if weight.is_some_and(|weight| !(0.0..=1.0).contains(&weight)) {
            return Err(part.new_custom_error(()));
        }
        Ok((color, weight))
    };
    parser.expect_comma()?;
    let (a, wa) = parser.parse_until_before(Delimiter::Comma, component)?;
    parser.expect_comma()?;
    let (b, wb) = component(parser)?;
    let wa = wa.unwrap_or_else(|| wb.map_or(0.5, |weight| 1. - weight));
    let wb = wb.unwrap_or(1. - wa);
    if wa + wb <= 0. {
        return Err(parser.new_custom_error(()));
    }
    Ok(space.mix(a, b, wa, wb, hue))
}

pub(super) fn parse(value: &str, current_color: Option<u32>) -> Option<u32> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let color = parse_next(&mut parser, current_color)?;
    parser.is_exhausted().then_some(color)
}

pub(super) fn expand(name: &str, value: &str) -> Option<Vec<String>> {
    let value = value.trim().trim_end_matches(';').trim();
    if name != "color-value" {
        let token = super::background::token(value)?;
        match (name, token) {
            ("color-hex", Token::Hash(_) | Token::IDHash(_)) => (),
            ("color-rgb", Token::Function(name))
                if name.eq_ignore_ascii_case("rgb") || name.eq_ignore_ascii_case("rgba") =>
            {
                ()
            }
            _ => return None,
        }
    }
    Some(vec![parse(value, None)?.to_string()])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_named_hex_functional_and_contextual_colors() {
        for (value, expected) in [
            ("ReBeccapurple", 0xff663399),
            ("#1234", 0x44112233),
            ("#10203080", 0x80102030),
            ("hsl(0.5turn 100% 50% / 50%)", 0x8000ffff),
            ("rgb(100% 0% 0% / 50%)", 0x80ff0000),
            ("rgb(calc(200 + 55) 0 0 / calc(100% / 2))", 0x80ff0000),
            ("hsl(calc(0.25turn + 90deg) 100% 50%)", 0xff00ffff),
            ("rgb(255/* red */ 0 0)", 0xffff0000),
            ("transparent", 0),
            ("color-mix(in srgb, red 25%, blue)", 0xff4000bf),
            ("color-mix(in srgb, red calc(50% / 2), blue)", 0xff4000bf),
            (
                "color-mix(in oklch, oklch(from #000 l c h / 0.04) 100%, transparent)",
                0x0a000000,
            ),
        ] {
            assert_eq!(parse(value, None), Some(expected), "{value}");
        }
        assert_eq!(parse("currentColor", Some(0xffabcdef)), Some(0xffabcdef));
        assert_eq!(parse("currentColor", None), None);
        assert_eq!(parse("red blue", None), None);
        assert_eq!(parse("oklch(nonsense)", None), None);
    }

    #[test]
    fn color_mix_normalizes_weights_and_interpolates_hue() {
        for (value, expected) in [
            ("color-mix(in srgb, 20% red, blue 20%)", 0x66800080),
            ("color-mix(in srgb, red 50%, transparent)", 0x80ff0000),
            ("color-mix(in srgb-linear, black, white)", 0xffbcbcbc),
            ("color-mix(in hsl longer hue, red, blue)", 0xff00ff00),
            (
                "color-mix(in srgb, color-mix(in srgb, red, blue), white 50%)",
                0xffbf80bf,
            ),
        ] {
            assert_eq!(parse(value, None), Some(expected), "{value}");
        }
        assert_eq!(
            parse("color-mix(in srgb, currentColor, white)", Some(0xff000000)),
            Some(0xff808080)
        );
        assert!(parse("color-mix(in srgb, red 0%, blue 0%)", None).is_none());
        assert!(parse("color-mix(in srgb, red -1%, blue)", None).is_none());
        assert!(parse("color-mix(in srgb longer hue, red, blue)", None).is_none());
    }
}
