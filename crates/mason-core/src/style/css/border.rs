//! Shared border shorthand grammar and projections for the cascade and native style setters.

use super::background::{token, top_level_parts, Part};
use super::layout_shorthand::{four_sides, is_length};
use super::{color, keywords, length, BorderComponentsRecord, BorderSideComponentsRecord, LengthContext};
use cssparser::{Parser, ParserInput, Token};

fn style_keyword(value: &str) -> bool {
    style_code(value).is_some()
}

fn style_code(value: &str) -> Option<i32> {
    keywords::code("border-style", value, false)
}

fn width_keyword(value: &str) -> Option<&'static str> {
    match value {
        "thin" => Some("1"),
        "medium" => Some("3"),
        "thick" => Some("5"),
        _ => None,
    }
}

fn combined_width<'a>(word: &'a str, lower: &str) -> Option<&'a str> {
    if let Some(width) = width_keyword(lower) {
        return Some(width);
    }
    match token(word) {
        Some(Token::Number { .. } | Token::Dimension { .. } | Token::Percentage { .. }) => {
            Some(word)
        }
        Some(Token::Function(name))
            if matches!(
                name.to_ascii_lowercase().as_str(),
                "calc" | "min" | "max" | "clamp"
            ) =>
        {
            Some(word)
        }
        _ => None,
    }
}

#[derive(Default)]
struct Border<'a> {
    widths: Vec<&'a str>,
    style: Option<String>,
    color: Option<&'a str>,
}

impl<'a> Border<'a> {
    fn parse(value: &'a str, max_widths: usize) -> Option<Self> {
        let mut border = Self::default();
        let parts = top_level_parts(value)?;
        if parts.is_empty() {
            return None;
        }
        for part in parts {
            let Part::Word(word) = part else { return None };
            let lower = word.to_ascii_lowercase();
            if style_keyword(&lower) {
                if border.style.replace(lower).is_some() {
                    return None;
                }
            } else if let Some(width) = combined_width(word, &lower) {
                if border.widths.len() == max_widths {
                    return None;
                }
                border.widths.push(width);
            } else if border.color.replace(word).is_some() {
                return None;
            }
        }
        Some(border)
    }

    fn cascade(self, per_side: bool) -> Vec<String> {
        let color = self
            .color
            .filter(|word| !word.eq_ignore_ascii_case("currentcolor"))
            .unwrap_or("black");
        let style = self.style.as_deref().unwrap_or("solid");
        let widths = if matches!(style, "none" | "hidden") {
            ["0"; 4]
        } else {
            four_sides(&self.widths).unwrap_or(["3"; 4])
        };
        if per_side {
            return [widths[0], style, color].map(str::to_owned).to_vec();
        }
        widths
            .into_iter()
            .chain([style; 4])
            .chain([color; 4])
            .map(str::to_owned)
            .collect()
    }

    /// Direct style setters have their own defaults for omitted fields.
    fn components(self, per_side: bool) -> Vec<String> {
        let widths = four_sides(&self.widths).unwrap_or([""; 4]);
        let end = if per_side {
            BorderSideComponentsRecord::STYLE
        } else {
            BorderComponentsRecord::STYLE
        };
        let mut fields = widths[..end]
            .iter()
            .map(|&width| width.to_owned())
            .collect::<Vec<_>>();
        fields.push(
            self.style
                .as_deref()
                .and_then(style_code)
                .map(|code| code.to_string())
                .unwrap_or_default(),
        );
        fields.push(color_field(
            self.color.and_then(|css| color::parse(css, None)),
        ));
        fields
    }
}

fn color_field(color: Option<u32>) -> String {
    color.map(|argb| argb.to_string()).unwrap_or_default()
}

fn edge_words(value: &str) -> Option<Vec<&str>> {
    top_level_parts(value)?
        .into_iter()
        .filter_map(|part| match part {
            Part::Word(word) => Some(Some(word)),
            Part::Comma => None,
            _ => Some(None),
        })
        .collect()
}

fn expand_edges(value: &str, pair: bool, accepts: impl Fn(&str) -> bool) -> Option<Vec<String>> {
    let words = edge_words(value)?;
    if !words.iter().all(|word| accepts(word)) {
        return None;
    }
    if pair {
        let ends = match words.as_slice() {
            [a] => [*a, *a],
            [a, b] => [*a, *b],
            _ => return None,
        };
        return Some(ends.map(str::to_owned).to_vec());
    }
    Some(four_sides(&words)?.map(str::to_owned).to_vec())
}

fn radius_axes<'a, 'i>(parts: &'a [Part<'i>]) -> Option<(&'a [Part<'i>], Option<&'a [Part<'i>]>)> {
    let mut groups = parts.split(|part| *part == Part::Slash);
    let horizontal = groups.next()?;
    let vertical = groups.next();
    groups.next().is_none().then_some((horizontal, vertical))
}

fn radius_words<'i, T>(parts: &[Part<'i>], parse: impl Fn(&'i str) -> Option<T>) -> Option<Vec<T>> {
    parts
        .iter()
        .filter_map(|part| match *part {
            Part::Word(word) => Some(parse(word)),
            Part::Comma => None,
            _ => Some(None),
        })
        .collect()
}

fn expand_radii(value: &str, separate_axes: bool) -> Option<Vec<String>> {
    let parts = top_level_parts(value)?;
    let (horizontal, vertical) = radius_axes(&parts)?;
    let corners = |parts| four_sides(&radius_words(parts, |word| is_length(word).then_some(word))?);
    let h = corners(horizontal)?;
    let v = match vertical {
        Some(parts) => corners(parts)?,
        None if !separate_axes => return Some(h.map(str::to_owned).into()),
        None => h,
    };
    if separate_axes {
        Some(h.into_iter().chain(v).map(str::to_owned).collect())
    } else {
        Some(h.into_iter().zip(v).map(|(h, v)| format!("{h} {v}")).collect())
    }
}

pub(super) fn resolve_radii(value: &str, context: LengthContext, corner: bool) -> Option<Vec<f64>> {
    let parts = top_level_parts(value.trim().trim_end_matches(';'))?;
    let parse = |word| length::resolve_box_length(word, context, true);
    if corner {
        let pairs = radius_words(&parts, parse)?;
        let axes = match pairs.as_slice() {
            [h] => [*h, *h],
            [h, v] => [*h, *v],
            _ => return None,
        };
        return Some(axes.into_iter().flatten().collect());
    }
    let (horizontal, vertical) = radius_axes(&parts)?;
    let h = four_sides(&radius_words(horizontal, parse)?)?;
    let v = match vertical {
        Some(parts) => four_sides(&radius_words(parts, parse)?)?,
        None => h,
    };
    Some(h.into_iter().chain(v).flatten().collect())
}

fn corner_exponent(value: &str) -> Option<f32> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let exponent = match parser.next().ok()?.clone() {
        Token::Ident(keyword) => match keyword.to_ascii_lowercase().as_str() {
            "round" => 1.0,
            "squircle" => 2.0,
            "bevel" => 0.0,
            "scoop" => -1.0,
            "square" => f32::INFINITY,
            "notch" => f32::NEG_INFINITY,
            _ => return None,
        },
        Token::Function(name) if name.eq_ignore_ascii_case("superellipse") => parser
            .parse_nested_block(|body| {
                match length::Component::read(body)? {
                    length::Component::Literal(Token::Number { value, .. }) => Ok(value),
                    length::Component::Literal(Token::Ident(keyword)) if keyword.eq_ignore_ascii_case("infinity") => Ok(f32::INFINITY),
                    length::Component::Literal(Token::Ident(keyword)) if keyword.eq_ignore_ascii_case("-infinity") => Ok(f32::NEG_INFINITY),
                    length::Component::Math(expression, _) => expression.resolve_number().ok_or_else(|| body.new_custom_error(())),
                    length::Component::Literal(token) => Err(body.new_unexpected_token_error(token)),
                }
            })
            .ok()?,
        _ => return None,
    };
    parser.is_exhausted().then_some(exponent)
}

pub(super) fn expand_corner_shape(value: &str, single: bool) -> Option<Vec<String>> {
    let value = value.trim().trim_end_matches(';').trim();
    let lowered = value.to_ascii_lowercase();
    let exponents = if matches!(
        lowered.as_str(),
        "" | "initial" | "unset" | "revert" | "none"
    ) {
        vec![1.0]
    } else {
        top_level_parts(value)?
            .into_iter()
            .map(|part| match part {
                Part::Word(word) => corner_exponent(word),
                _ => None,
            })
            .collect::<Option<Vec<_>>>()?
    };
    let fields = match (single, exponents.as_slice()) {
        (true, [exponent]) => std::slice::from_ref(exponent).to_vec(),
        (true, _) => return None,
        (false, _) => four_sides(&exponents)?.to_vec(),
    };
    Some(
        fields
            .into_iter()
            .map(|value| match value {
                f32::INFINITY => "Infinity".to_owned(),
                f32::NEG_INFINITY => "-Infinity".to_owned(),
                _ => value.to_string(),
            })
            .collect(),
    )
}

pub(super) fn expand(name: &str, value: &str) -> Option<Vec<String>> {
    let value = value.trim().trim_end_matches(';');
    match name {
        "border" => Some(Border::parse(value, 4)?.cascade(false)),
        "border-top"
        | "border-right"
        | "border-bottom"
        | "border-left"
        | "border-block-start"
        | "border-block-end"
        | "border-inline-start"
        | "border-inline-end" => Some(Border::parse(value, 1)?.cascade(true)),
        "border-inline" | "border-block" => {
            let side = Border::parse(value, 1)?.cascade(true);
            Some(side.iter().cloned().chain(side.clone()).collect())
        }
        "border-components" => Some(Border::parse(value, 4)?.components(false)),
        "border-side-components" => Some(Border::parse(value, 1)?.components(true)),
        "border-radius" => expand_radii(value, false),
        "border-radius-components" => expand_radii(value, true),
        "border-corner-radius" => expand_edges(value, true, is_length),
        "border-width" | "border-inline-width" | "border-block-width" => {
            expand_edges(value, name != "border-width", |word| {
                width_keyword(&word.to_ascii_lowercase()).is_some() || is_length(word)
            })
        }
        "border-color" | "border-inline-color" | "border-block-color" => {
            expand_edges(value, name != "border-color", |_| true)
        }
        "border-color-values" => {
            let colors = edge_words(value)?
                .into_iter()
                .map(|word| color::parse(word, None))
                .collect::<Vec<_>>();
            Some(four_sides(&colors)?.map(color_field).into())
        }
        "border-style" | "border-inline-style" | "border-block-style" => {
            expand_edges(value, name != "border-style", |word| {
                style_keyword(&word.to_ascii_lowercase())
            })
        }
        "border-style-values" => {
            let codes = edge_words(value)?
                .into_iter()
                .map(style_code)
                .collect::<Option<Vec<_>>>()?;
            Some(four_sides(&codes)?.map(|code| code.to_string()).into())
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::{expand, expand_corner_shape, resolve_radii, LengthContext};

    #[test]
    fn projects_both_axes_and_reuses_omitted_corners() {
        let context = LengthContext {
            scale: 2.,
            font_size: 20.,
            root_font_size: 16.,
            viewport_width: 400.,
            viewport_height: 800.,
        };
        assert_eq!(
            resolve_radii("calc(100% / 2) 10dppx / 2 1em;", context, false).unwrap(),
            [2., 0.5, 1., 10., 2., 0.5, 1., 10., 1., 4., 1., 40., 1., 4., 1., 40.]
        );
        assert_eq!(
            resolve_radii("max(10vw, 3pt) 25%", context, true).unwrap(),
            [1., 80., 2., 0.25]
        );
        assert_eq!(
            resolve_radii("1e30px", context, true).unwrap(),
            [1., 19998., 1., 19998.]
        );
        for invalid in ["", "4px /", "4px / 2px / 1px", "1 2 3 4 5", "1px foo"] {
            assert!(resolve_radii(invalid, context, false).is_none(), "{invalid}");
        }
        assert!(resolve_radii("1px / 2px", context, true).is_none());
        assert!(resolve_radii("1px 2px 3px", context, true).is_none());
    }

    #[test]
    fn preserves_corner_shape_keywords_and_superellipse_parameters() {
        for (value, expected) in [
            ("round", "1"),
            ("squircle", "2"),
            ("bevel", "0"),
            ("scoop", "-1"),
            ("notch", "-Infinity"),
            ("square", "Infinity"),
            ("superellipse( 1.5 )", "1.5"),
            ("superellipse(-2e0)", "-2"),
            ("superellipse(clamp(-2, calc(1 + 2), 2))", "2"),
            ("SUPERELLIPSE(-infinity)", "-Infinity"),
            ("superellipse(infinity)", "Infinity"),
            ("unset", "1"),
        ] {
            assert_eq!(expand_corner_shape(value, true).unwrap(), [expected]);
        }
        assert_eq!(
            expand_corner_shape("notch square round", false).unwrap(),
            ["-Infinity", "Infinity", "1", "Infinity"]
        );
        assert_eq!(
            expand_corner_shape("round bevel scoop squircle", false).unwrap(),
            ["1", "0", "-1", "2"]
        );
        assert_eq!(
            expand_corner_shape("bevel scoop", false).unwrap(),
            ["0", "-1", "0", "-1"]
        );
        assert_eq!(expand_corner_shape("", false).unwrap(), ["1"; 4]);
        for invalid in [
            "superellipse",
            "superellipse(1",
            "superellipse(nan)",
            "superellipse(1%)",
            "superellipse(calc(1px + 2px))",
            "superellipse(1 2)",
            "round wobbly",
            "round round round round round",
            "round,square",
        ] {
            assert!(expand_corner_shape(invalid, false).is_none(), "{invalid}");
        }
        assert!(expand_corner_shape("round bevel", true).is_none());
    }

    #[test]
    fn border_shorthand_preserves_legacy_defaults_and_hidden_widths() {
        for (css, expected) in [
            ("1px solid red", ["1px", "solid", "red"]),
            ("red 2rem dashed", ["2rem", "dashed", "red"]),
            ("thin dotted", ["1", "dotted", "black"]),
            ("rgb(0, 0, 255) thick", ["5", "solid", "rgb(0, 0, 255)"]),
            (
                "calc(1px + 0.1rem) solid #fff",
                ["calc(1px + 0.1rem)", "solid", "#fff"],
            ),
            ("0", ["0", "solid", "black"]),
            ("none", ["0", "none", "black"]),
            ("2px hidden blue", ["0", "hidden", "blue"]),
            ("1px solid currentcolor", ["1px", "solid", "black"]),
        ] {
            assert_eq!(expand("border-bottom", css).unwrap(), expected);
        }
        for invalid in ["", "1px 2px solid", "solid dashed", "red blue", "1px / 2px"] {
            assert!(expand("border-top", invalid).is_none());
        }
        assert_eq!(
            expand("border", "1px 2px solid red").unwrap(),
            [
                "1px", "2px", "1px", "2px", "solid", "solid", "solid", "solid", "red", "red",
                "red", "red"
            ]
        );
        assert!(expand("border", "1px 2px 3px 4px 5px").is_none());
        assert_eq!(
            expand("border-inline", "thick dashed").unwrap(),
            ["5", "dashed", "black", "5", "dashed", "black"]
        );
        assert_eq!(
            expand("border-components", "none").unwrap(),
            ["", "", "", "", "0", ""]
        );
        assert_eq!(
            expand("border-side-components", "3px").unwrap(),
            ["3px", "", ""]
        );
        assert_eq!(
            expand("border-side-components", "#10203080 dashed 3px").unwrap(),
            ["3px", "3", "2148540464"]
        );
    }

    #[test]
    fn expands_border_groups_and_radius_axes_with_nested_functions() {
        assert_eq!(
            expand("border-width", "thin 2px medium").unwrap(),
            ["thin", "2px", "medium", "2px"]
        );
        assert_eq!(
            expand("border-inline-width", "thin 2px").unwrap(),
            ["thin", "2px"]
        );
        assert_eq!(
            expand("border-style", "solid none dashed").unwrap(),
            ["solid", "none", "dashed", "none"]
        );
        assert_eq!(expand("border-block-style", "solid").unwrap(), ["solid"; 2]);
        assert_eq!(
            expand("border-color", "#fff hsl(0 0% 0% / 50%) blue").unwrap(),
            ["#fff", "hsl(0 0% 0% / 50%)", "blue", "hsl(0 0% 0% / 50%)"]
        );
        assert_eq!(
            expand("border-color-values", "white hsl(0 0% 0% / 50%) nonsense").unwrap(),
            ["4294967295", "2147483648", "", "2147483648"]
        );
        assert_eq!(
            expand("border-radius", "1px 2px 3px 4px / 5px 6px 7px").unwrap(),
            ["1px 5px", "2px 6px", "3px 7px", "4px 6px"]
        );
        assert_eq!(expand("border-radius", "50%").unwrap(), ["50%"; 4]);
        assert_eq!(
            expand("border-radius-components", "calc(100% / 2) / 2px").unwrap(),
            [
                "calc(100% / 2)",
                "calc(100% / 2)",
                "calc(100% / 2)",
                "calc(100% / 2)",
                "2px",
                "2px",
                "2px",
                "2px"
            ]
        );
        assert_eq!(
            expand("border-corner-radius", "10px").unwrap(),
            ["10px", "10px"]
        );
        for invalid in [
            "",
            "1px 2px 3px 4px 5px",
            "10px /",
            "/ 10px",
            "1px / 2px / 3px",
            "red",
        ] {
            assert!(expand("border-radius", invalid).is_none());
        }
        assert!(expand("border-width", "toString").is_none());
        assert!(expand("border-style", "solid 1px").is_none());
        assert_eq!(
            expand("border-style-values", "SOLID /* sides */ dashed dotted").unwrap(),
            ["4", "3", "2", "3"]
        );
        assert!(expand("border-style-values", "solid invalid").is_none());
        assert!(expand("border-color", "red / blue").is_none());
    }
}
