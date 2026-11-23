//! Expansion for cascades that address properties by their longhand names.

use super::{
    animation, background, border, color, declarations, decoration, gradient, keywords, layout_shorthand, length, mask, nine_slice,
    svg_css, text,
};

pub fn expand(name: &str, value: &str) -> Option<Vec<String>> {
    if let Some(property) = name.strip_prefix("keyword:") {
        return Some(vec![keywords::code(property, value, false)?.to_string()]);
    }
    if let Some(property) = name.strip_prefix("html-keyword:") {
        return Some(vec![keywords::code(property, value, true)?.to_string()]);
    }
    if let Some(parent) = name.strip_prefix("svg-font-weight:") {
        return Some(vec![text::svg_font_weight(value, parent.parse().ok()?)?.to_string()]);
    }
    if let Some(parent) = name.strip_prefix("svg-font-size:") {
        return Some(vec![text::svg_font_size(value, parent.parse().ok()?)?.to_string()]);
    }
    if let Some(basis) = name.strip_prefix("svg-font-spacing:") {
        let spacing = if value.eq_ignore_ascii_case("normal") {
            0.
        } else {
            text::svg_font_length(value, basis.parse().ok()?)?
        };
        return Some(vec![spacing.to_string()]);
    }
    if let Some(context) = name.strip_prefix("svg-font:") {
        let (size, weight) = context.split_once(':')?;
        return text::svg_font_shorthand(value, size.parse().ok()?, weight.parse().ok()?);
    }
    match name {
        "html-declarations" => Some(declarations::compile(value)),
        "svg-css-declarations" => Some(svg_css::compile_declarations(value)),
        "svg-css-stylesheet" => Some(svg_css::compile_stylesheet(value)),
        "svg-paint" => svg_css::compile_paint(value),
        "svg-url-fragment" => svg_css::compile_url_fragment(value).map(|id| vec![id]),
        "animation-position-list" => animation::compile(value, true),
        "animation-size-list" => animation::compile(value, false),
        "tokenize" => Some(
            background::top_level_parts(value)?
                .into_iter()
                .map(|part| part.text().into())
                .collect(),
        ),
        "webkit-mask-composite-list" => mask::webkit_longhand(value, true).map(|value| vec![value]),
        "webkit-mask-box-list" => mask::webkit_longhand(value, false).map(|value| vec![value]),
        "viewport-dependent" => declarations::uses_viewport_units(value).then(|| vec!["1".into()]),
        "background" => background::split_shorthand(value).map(Vec::from),
        "gradient-interpolation" => gradient::interpolation_fields(value).map(Vec::from),
        "mask" => mask::split_shorthand(value, false).map(Vec::from),
        "-webkit-mask" => mask::split_shorthand(value, true).map(Vec::from),
        "mask-border" | "-webkit-mask-box-image" => {
            nine_slice::split_shorthand(value, nine_slice::Kind::MaskBorder).map(Vec::from)
        }
        "grid-row" | "grid-column" => crate::utils::expand_grid_placement(value, 2),
        "grid-area" => crate::utils::expand_grid_placement(value, 4),
        "list-style" => list_style(value).map(Vec::from),
        "color-value" | "color-hex" | "color-rgb" => color::expand(name, value),
        "length-value" => length::scalar_fields(value).map(Vec::from),
        "length-prefix" => length::scalar_prefix(value).map(Vec::from),
        "aspect-ratio" => aspect_ratio(value).map(|ratio| vec![ratio]),
        "touch-action" => Some(vec![keywords::touch_action(value).to_string()]),
        "font-family" => text::font_families(value),
        "font-weight" => text::font_weight_fields(value).map(Vec::from),
        "font-style" => text::font_style_fields(value).map(Vec::from),
        "font-variant-numeric" => Some(vec![text::font_variant_numeric(value).to_string()]),
        "font-stretch" => text::font_stretch(value).map(|code| vec![code.to_string()]),
        "font-stretch-name" => text::font_stretch_name(value).map(|name| vec![name]),
        "line-clamp" | "-webkit-line-clamp" => text::line_clamp(value).map(|lines| vec![lines.to_string()]),
        "corner-shape" => border::expand_corner_shape(value, false),
        "corner-shape-top-left"
        | "corner-shape-top-right"
        | "corner-shape-bottom-right"
        | "corner-shape-bottom-left"
        | "corner-shape-value" => border::expand_corner_shape(value, true),
        "text-decoration"
        | "text-decoration-line"
        | "text-decoration-style"
        | "text-decoration-color"
        | "text-decoration-thickness" => decoration::expand(name, value),
        name if name.starts_with("border") => border::expand(name, value),
        _ => layout_shorthand::expand(name, value),
    }
}

fn aspect_ratio(value: &str) -> Option<String> {
    use cssparser::{Parser, ParserInput};

    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let auto = parser.try_parse(|p| p.expect_ident_matching("auto")).is_ok();
    if auto && parser.is_exhausted() {
        return Some(String::new());
    }

    let width = parser.expect_number().ok()?;
    let height = if parser.try_parse(|p| p.expect_delim('/')).is_ok() {
        parser.expect_number().ok()?
    } else {
        1.
    };
    if !auto {
        let _ = parser.try_parse(|p| p.expect_ident_matching("auto"));
    }
    parser.expect_exhausted().ok()?;
    if !width.is_finite() || !height.is_finite() || width <= 0. || height <= 0. {
        return None;
    }
    let ratio = width / height;
    (ratio.is_finite() && ratio > 0.).then(|| ratio.to_string())
}

fn list_style(value: &str) -> Option<[String; 2]> {
    use background::Part;

    let mut marker = None;
    let mut position = None;
    let mut image = false;
    let mut nones = 0;
    for part in background::top_level_parts(value)? {
        let Part::Word(word) = part else { return None };
        let lower = word.to_ascii_lowercase();
        match lower.as_str() {
            "none" => nones += 1,
            "inside" | "outside" if position.is_none() => position = Some(lower),
            "inside" | "outside" => return None,
            _ if background::image_source_syntax(word) => {
                if image {
                    return None;
                }
                image = true;
            }
            _ if marker.is_none() => marker = Some(lower),
            _ => return None,
        }
    }
    if nones > usize::from(marker.is_none()) + usize::from(!image)
        || (nones == 0 && marker.is_none() && position.is_none() && !image)
    {
        return None;
    }
    let marker = marker.unwrap_or_else(|| if nones > 0 { "none" } else { "disc" }.to_owned());
    Some([marker, position.unwrap_or_else(|| "outside".to_owned())])
}

#[cfg(test)]
mod tests {
    use super::expand;

    #[test]
    fn line_clamp_aliases_accept_none_and_bound_line_counts() {
        for name in ["line-clamp", "-webkit-line-clamp"] {
            for (value, expected) in [
                (" /* reset */ NoNe ", "0"),
                ("3.8", "3"),
                ("2147483647", "2147483647"),
            ] {
                assert_eq!(expand(name, value).unwrap(), [expected], "{name}: {value}");
            }
            for value in ["", "-1", "2147483648", "3px", "3 4", "calc(1 + 2)"] {
                assert!(expand(name, value).is_none(), "{name}: {value}");
            }
        }
    }

    #[test]
    fn resolves_text_options_and_combines_touch_action_axes() {
        for (name, input, expected) in [
            ("keyword:text-combine-upright", "DiGiTs /* count */ +4", "4"),
            ("keyword:text-combine-upright", "digits 2.0", "2"),
            ("keyword:text-spacing-trim", " TRIM-BOTH ", "4"),
            ("touch-action", "", "7"),
            ("touch-action", "MANIPULATION", "7"),
            ("touch-action", "pan-x /* y */ pan-up pinch-zoom", "7"),
            ("touch-action", "auto pan-left unknown", "1"),
            ("touch-action", "none", "0"),
        ] {
            assert_eq!(expand(name, input).unwrap(), [expected], "{name}: {input}");
        }
        assert!(expand("keyword:text-combine-upright", "digits 5").is_none());
    }

    #[test]
    fn aspect_ratio_parses_a_number_pair_or_auto() {
        for (input, expected) in [
            ("auto", ""),
            ("1.5", "1.5"),
            ("3/2", "1.5"),
            ("AUTO 3 /* width */ / 2", "1.5"),
            ("3 / 2 auto", "1.5"),
        ] {
            assert_eq!(expand("aspect-ratio", input).unwrap(), [expected]);
        }
        for input in ["", "0", "2/0", "-1 / -2", "2 / 3 / 4", "1px", "auto 2 auto"] {
            assert!(expand("aspect-ratio", input).is_none(), "{input}");
        }
    }

    #[test]
    fn list_style_preserves_marker_defaults_and_none_slots() {
        for (value, expected) in [
            ("none", ["none", "outside"]),
            ("square", ["square", "outside"]),
            ("inside", ["disc", "inside"]),
            ("decimal inside", ["decimal", "inside"]),
            ("outside circle", ["circle", "outside"]),
            ("inside lower-roman", ["lower-roman", "inside"]),
            ("none inside", ["none", "inside"]),
            ("none none", ["none", "outside"]),
            ("square none", ["square", "outside"]),
            ("url(a.png) circle", ["circle", "outside"]),
            ("url(a.png)", ["disc", "outside"]),
            ("url(a.png) none", ["none", "outside"]),
            ("square url(a.png) inside", ["square", "inside"]),
            ("Upper-Roman", ["upper-roman", "outside"]),
        ] {
            assert_eq!(expand("list-style", value).unwrap(), expected, "{value}");
        }
        for invalid in [
            "",
            "inside outside",
            "disc square",
            "none none none",
            "square none none",
            "url(a) url(b)",
            "disc, square",
        ] {
            assert!(expand("list-style", invalid).is_none(), "{invalid}");
        }
    }

    #[test]
    fn grid_expansion_preserves_named_lines_and_typed_omission_rules() {
        for (input, expected) in [
            ("main", ["main", "main"]),
            ("2", ["2", "auto"]),
            ("main 2", ["main 2", "auto"]),
            ("span 2", ["span 2", "auto"]),
            ("auto", ["auto", "auto"]),
            ("span main", ["span main", "auto"]),
            (r#""path/name""#, [r#""path/name""#; 2]),
        ] {
            assert_eq!(expand("grid-row", input).unwrap(), expected);
        }
        for (input, expected) in [
            ("a", ["a"; 4]),
            ("a / b", ["a", "b", "a", "b"]),
            ("a / b / c", ["a", "b", "c", "b"]),
            ("2", ["2", "auto", "auto", "auto"]),
            ("1 / 2", ["1", "2", "auto", "auto"]),
        ] {
            assert_eq!(expand("grid-area", input).unwrap(), expected);
        }
        assert!(expand("grid-column", "1 / 2 / 3").is_none());
        assert!(expand("grid-column", "1 / ").is_none());
    }
}
