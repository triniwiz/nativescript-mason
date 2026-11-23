use super::background::{token, top_level_parts, Part};
use cssparser::Token;

pub(super) fn code(property: &str, value: &str, native_html: bool) -> Option<i32> {
    let value = value.trim();
    if let Some(result) = lookup(property, value, native_html) {
        return Some(result);
    }
    // Most values are already canonical. Tokenize the rest so comments,
    // case, and spacing have the same treatment as compound CSS values.
    if !value.contains(|c: char| c.is_ascii_uppercase() || c.is_whitespace() || c == '/') {
        return None;
    }
    let words = top_level_parts(value)?
        .into_iter()
        .map(|part| match part {
            Part::Word(word) => Some(word),
            _ => None,
        })
        .collect::<Option<Vec<_>>>()?;
    if let ("text-combine-upright", [name, count]) = (property, words.as_slice()) {
        if name.eq_ignore_ascii_case("digits") {
            let Some(Token::Number { value, .. }) = token(count) else { return None };
            return lookup(property, &format!("digits {value}"), native_html);
        }
    }
    lookup(property, &words.join(" ").to_ascii_lowercase(), native_html)
}

pub(super) fn touch_action(value: &str) -> i32 {
    let Some(parts) = top_level_parts(value) else { return 0 };
    match parts.as_slice() {
        [] => lookup("touch-action", "auto", false).unwrap_or_default(),
        [Part::Word(word)] => code("touch-action", word, false).unwrap_or_default(),
        _ => parts.into_iter().fold(0, |flags, part| {
            let Part::Word(word) = part else { return flags };
            match code("touch-action", word, false) {
                Some(bit @ (1 | 2 | 4)) => flags | bit,
                _ => flags,
            }
        }),
    }
}

// <style-keys:keywords> generated from tools/scripts/style-keys/style-keys.schema
fn lookup(property: &str, value: &str, native_html: bool) -> Option<i32> {
    match property {
        "align-items" | "align-self" | "justify-items" | "justify-self" => match value {
            "normal" => Some(-1),
            "start" => Some(0),
            "end" => Some(1),
            "center" => Some(2),
            "baseline" => Some(3),
            "stretch" => Some(4),
            "flex-start" if native_html => Some(0),
            "flex-start" => Some(5),
            "flex-end" if native_html => Some(1),
            "flex-end" => Some(6),
            _ => None,
        },
        "align-content" | "justify-content" => match value {
            "normal" => Some(-1),
            "start" => Some(0),
            "end" => Some(1),
            "center" => Some(2),
            "stretch" => Some(3),
            "space-between" => Some(4),
            "space-around" => Some(5),
            "space-evenly" => Some(6),
            "flex-start" if native_html => Some(0),
            "flex-start" => Some(7),
            "flex-end" if native_html => Some(1),
            "flex-end" => Some(8),
            _ => None,
        },
        "border-style" => match value {
            "none" => Some(0),
            "hidden" => Some(1),
            "dotted" => Some(2),
            "dashed" => Some(3),
            "solid" => Some(4),
            "double" => Some(5),
            "groove" => Some(6),
            "ridge" => Some(7),
            "inset" => Some(8),
            "outset" => Some(9),
            _ => None,
        },
        "box-sizing" => match value {
            "border-box" => Some(0),
            "content-box" => Some(1),
            _ => None,
        },
        "clear" => match value {
            "none" => Some(0),
            "left" => Some(1),
            "right" => Some(2),
            "both" => Some(3),
            _ => None,
        },
        "direction" => match value {
            "inherit" => Some(0),
            "ltr" => Some(1),
            "rtl" => Some(2),
            _ => None,
        },
        "display" => match value {
            "none" => Some(0),
            "flex" => Some(1),
            "grid" => Some(2),
            "block" => Some(3),
            "inline" => Some(4),
            "inline-block" => Some(5),
            "inline-flex" => Some(6),
            "inline-grid" => Some(7),
            _ => None,
        },
        "flex-direction" => match value {
            "row" => Some(0),
            "column" => Some(1),
            "row-reverse" => Some(2),
            "column-reverse" => Some(3),
            _ => None,
        },
        "flex-wrap" => match value {
            "nowrap" => Some(0),
            "no-wrap" => Some(0),
            "wrap" => Some(1),
            "wrap-reverse" => Some(2),
            "balance" => Some(3),
            "balance-reverse" => Some(4),
            _ => None,
        },
        "float" => match value {
            "none" => Some(0),
            "left" => Some(1),
            "right" => Some(2),
            _ => None,
        },
        "font-stretch" => match value {
            "ultra-condensed" => Some(5000),
            "extra-condensed" => Some(6250),
            "condensed" => Some(7500),
            "semi-condensed" => Some(8750),
            "normal" => Some(10000),
            "semi-expanded" => Some(11250),
            "expanded" => Some(12500),
            "extra-expanded" => Some(15000),
            "ultra-expanded" => Some(20000),
            _ => None,
        },
        "font-style" => match value {
            "normal" => Some(0),
            "italic" => Some(1),
            "oblique" => Some(2),
            _ => None,
        },
        "font-variant-numeric" => match value {
            "normal" => Some(0),
            "lining-nums" => Some(1),
            "oldstyle-nums" => Some(2),
            "proportional-nums" => Some(4),
            "tabular-nums" => Some(8),
            "diagonal-fractions" => Some(16),
            "stacked-fractions" => Some(32),
            "ordinal" => Some(64),
            "slashed-zero" => Some(128),
            _ => None,
        },
        "font-weight" => match value {
            "thin" => Some(100),
            "ultralight" => Some(200),
            "light" => Some(300),
            "normal" => Some(400),
            "medium" => Some(500),
            "semibold" => Some(600),
            "bold" => Some(700),
            "heavy" => Some(800),
            "black" => Some(900),
            _ => None,
        },
        "grid-auto-flow" => match value {
            "row" => Some(0),
            "column" => Some(1),
            "dense" => Some(2),
            "row dense" => Some(2),
            "dense row" => Some(2),
            "column dense" => Some(3),
            "dense column" => Some(3),
            _ => None,
        },
        "hyphens" => match value {
            "manual" => Some(0),
            "none" => Some(1),
            "auto" => Some(2),
            _ => None,
        },
        "list-style-position" => match value {
            "outside" => Some(0),
            "inside" => Some(1),
            _ => None,
        },
        "list-style-type" => match value {
            "none" => Some(0),
            "custom" if native_html => None,
            "custom" => Some(1),
            "disc" => Some(2),
            "circle" => Some(3),
            "square" => Some(4),
            "decimal" => Some(5),
            _ => None,
        },
        "mask-clip" => match value {
            "border-box" => Some(0),
            "margin-box" => Some(0),
            "fill-box" => Some(0),
            "stroke-box" => Some(0),
            "view-box" => Some(0),
            "padding-box" => Some(1),
            "content-box" => Some(2),
            "no-clip" => Some(3),
            _ => None,
        },
        "mask-composite" => match value {
            "add" => Some(0),
            "subtract" => Some(1),
            "intersect" => Some(2),
            "exclude" => Some(3),
            _ => None,
        },
        "mask-mode" => match value {
            "match-source" => Some(0),
            "alpha" => Some(1),
            "luminance" => Some(2),
            _ => None,
        },
        "object-fit" => match value {
            "contain" => Some(0),
            "cover" => Some(1),
            "fill" => Some(2),
            "none" => Some(3),
            "scale-down" => Some(4),
            _ => None,
        },
        "overflow" | "overflow-x" | "overflow-y" => match value {
            "visible" => Some(0),
            "hidden" => Some(1),
            "scroll" => Some(2),
            "clip" => Some(3),
            "auto" => Some(4),
            _ => None,
        },
        "position" => match value {
            "static" => Some(0),
            "relative" => Some(1),
            "absolute" => Some(2),
            "fixed" => Some(3),
            "sticky" => Some(4),
            _ => None,
        },
        "text-align" => match value {
            "left" => Some(1),
            "right" => Some(2),
            "center" => Some(3),
            "justify" => Some(4),
            "start" => Some(5),
            "end" => Some(6),
            _ => None,
        },
        "text-combine-upright" => match value {
            "none" => Some(0),
            "all" => Some(1),
            "digits 2" => Some(2),
            "digits" => Some(2),
            "digits 3" => Some(3),
            "digits 4" => Some(4),
            _ => None,
        },
        "text-justify" => match value {
            "none" => Some(-1),
            "auto" => Some(0),
            "inter-word" => Some(1),
            "inter-character" => Some(2),
            "distribute" => Some(3),
            _ => None,
        },
        "text-orientation" => match value {
            "mixed" => Some(0),
            "upright" => Some(1),
            "sideways" => Some(2),
            "sideways-right" => Some(2),
            _ => None,
        },
        "text-overflow" => match value {
            "clip" => Some(0),
            "ellipsis" => Some(1),
            _ => None,
        },
        "text-spacing-trim" => match value {
            "normal" => Some(0),
            "space-all" => Some(1),
            "space-first" => Some(2),
            "trim-start" => Some(3),
            "trim-both" => Some(4),
            "trim-all" => Some(5),
            "auto" => Some(6),
            _ => None,
        },
        "text-transform" => match value {
            "none" => Some(0),
            "capitalize" => Some(1),
            "uppercase" => Some(2),
            "lowercase" => Some(3),
            _ => None,
        },
        "text-wrap" => match value {
            "wrap" => Some(0),
            "nowrap" => Some(1),
            "balance" => Some(2),
            "pretty" if native_html => Some(3),
            "pretty" => Some(0),
            "stable" if native_html => None,
            "stable" => Some(0),
            _ => None,
        },
        "touch-action" => match value {
            "auto" => Some(7),
            "none" => Some(0),
            "manipulation" => Some(7),
            "pan-x" => Some(1),
            "pan-left" => Some(1),
            "pan-right" => Some(1),
            "pan-y" => Some(2),
            "pan-up" => Some(2),
            "pan-down" => Some(2),
            "pinch-zoom" => Some(4),
            _ => None,
        },
        "unicode-bidi" => match value {
            "normal" => Some(0),
            "embed" => Some(1),
            "bidi-override" => Some(2),
            "isolate" => Some(3),
            "isolate-override" => Some(4),
            "plaintext" => Some(5),
            _ => None,
        },
        "vertical-align" => match value {
            "baseline" => Some(0),
            "top" => Some(1),
            "text-top" => Some(2),
            "middle" => Some(3),
            "bottom" => Some(4),
            "text-bottom" => Some(5),
            "sub" => Some(6),
            "super" => Some(7),
            _ => None,
        },
        "visibility" => match value {
            "visible" => Some(0),
            "hidden" => Some(1),
            "collapse" => Some(2),
            _ => None,
        },
        "white-space" => match value {
            "normal" => Some(0),
            "pre" => Some(1),
            "pre-wrap" => Some(2),
            "pre-line" => Some(3),
            "nowrap" => Some(4),
            "break-spaces" => Some(5),
            _ => None,
        },
        "writing-mode" => match value {
            "horizontal-tb" => Some(0),
            "vertical-rl" => Some(1),
            "vertical-lr" => Some(2),
            _ => None,
        },
        _ => None,
    }
}

pub(super) fn font_stretch_name(code: i32) -> Option<&'static str> {
    match code {
        5000 => Some("ultra-condensed"),
        6250 => Some("extra-condensed"),
        7500 => Some("condensed"),
        8750 => Some("semi-condensed"),
        10000 => Some("normal"),
        11250 => Some("semi-expanded"),
        12500 => Some("expanded"),
        15000 => Some("extra-expanded"),
        20000 => Some("ultra-expanded"),
        _ => None,
    }
}
// </style-keys:keywords>

#[cfg(test)]
mod tests {
    use super::code;

    #[test]
    fn keyword_codes_preserve_signed_enums_aliases_and_html_values() {
        assert_eq!(code("align-items", " NORMAL ", false), Some(-1));
        assert_eq!(code("justify-self", "flex-end", false), Some(6));
        assert_eq!(code("justify-self", "flex-end", true), Some(1));
        assert_eq!(code("align-content", "flex-start", false), Some(7));
        assert_eq!(code("align-content", "flex-start", true), Some(0));
        assert_eq!(code("text-wrap", "pretty", false), Some(0));
        assert_eq!(code("text-wrap", "pretty", true), Some(3));
        assert_eq!(code("list-style-type", "custom", true), None);
        assert_eq!(code("flex-wrap", "no-wrap", false), Some(0));
        assert_eq!(
            code("grid-auto-flow", "COLUMN /* gap */  Dense", false),
            Some(3)
        );
        assert_eq!(code("grid-auto-flow", "dense row", true), Some(2));
        assert_eq!(code("grid-auto-flow", "row column", false), None);
        assert_eq!(code("grid-auto-flow", "dense / row", false), None);
        assert_eq!(code("position", "static unrelated", false), None);
    }
}
