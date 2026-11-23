use super::background::{token, top_level_parts, Part};
use super::color;
use super::TextDecorationRecord as Record;
use crate::style::UNSET_COLOR;
use cssparser::Token;

fn line_keyword(word: &str) -> Option<u8> {
    match word {
        "none" => Some(0),
        "underline" => Some(1),
        "overline" => Some(2),
        "line-through" => Some(4),
        "spelling-error" => Some(8),
        "grammar-error" => Some(16),
        _ => None,
    }
}

fn line_bits(value: &str) -> Option<u8> {
    let mut words = top_level_parts(value)?.into_iter().peekable();
    words.peek()?;
    let mut mask = 0;
    for part in words {
        let Part::Word(word) = part else { return None };
        let bits = line_keyword(&word.to_ascii_lowercase())?;
        if bits >= 8 {
            return Some(bits);
        }
        mask |= bits;
    }
    Some(mask)
}

fn line_style(word: &str) -> Option<u8> {
    match word {
        "solid" => Some(0),
        "double" => Some(1),
        "dotted" => Some(2),
        "dashed" => Some(3),
        "wavy" => Some(4),
        _ => None,
    }
}

/// An empty result represents auto thickness. The adapter supplies the element's
/// length context when resolving an explicit CSS length.
fn thickness(word: &str) -> Option<&str> {
    match token(word)? {
        Token::Ident(name)
            if name.eq_ignore_ascii_case("auto") || name.eq_ignore_ascii_case("from-font") =>
        {
            Some("")
        }
        Token::Number { value, .. } | Token::Dimension { value, .. } if value.is_finite() => {
            Some(word)
        }
        Token::Percentage { unit_value, .. } if unit_value.is_finite() => Some(word),
        Token::Function(name)
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

fn parse(value: &str) -> Option<[String; Record::STRIDE]> {
    let mut mask = 0;
    let mut solo = None;
    let mut style = 0;
    let mut argb = UNSET_COLOR;
    let mut stroke = "";
    for part in top_level_parts(value)? {
        let Part::Word(word) = part else { return None };
        let lower = word.to_ascii_lowercase();
        if let Some(bits) = line_keyword(&lower) {
            if bits >= 8 {
                solo = Some(bits);
            } else {
                mask |= bits;
            }
        } else if let Some(kind) = line_style(&lower) {
            style = kind;
        } else if let Some(color) = color::parse(word, Some(UNSET_COLOR)) {
            argb = color;
        } else {
            stroke = thickness(word)?;
        }
    }
    let mut fields = [const { String::new() }; Record::STRIDE];
    fields[Record::LINE] = solo.unwrap_or(mask).to_string();
    fields[Record::STYLE] = style.to_string();
    fields[Record::COLOR] = argb.to_string();
    fields[Record::THICKNESS] = stroke.to_owned();
    Some(fields)
}

pub(super) fn expand(name: &str, value: &str) -> Option<Vec<String>> {
    let value = value.trim().trim_end_matches(';').trim();
    let field = match name {
        "text-decoration" => return Some(parse(value)?.into()),
        "text-decoration-line" => line_bits(value)?.to_string(),
        "text-decoration-style" => line_style(&value.to_ascii_lowercase())?.to_string(),
        "text-decoration-color" => color::parse(value, Some(UNSET_COLOR))?.to_string(),
        "text-decoration-thickness" => thickness(value)?.to_owned(),
        _ => return None,
    };
    Some(vec![field])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decoration_shorthand_parses_fields_in_any_order() {
        let fields = parse("2px dashed #00ff00 overline").unwrap();
        assert_eq!(fields, ["2", "3", "4278255360", "2px"]);
        let fields = parse("rgba(0, 0, 255, 50%) line-through underline calc(1em + 2px)").unwrap();
        assert_eq!(fields, ["5", "0", "2147483903", "calc(1em + 2px)"]);
        assert_eq!(parse("none currentcolor auto"), parse(""));
        assert_eq!(parse("red 2px from-font").unwrap()[Record::THICKNESS], "");
        assert!(parse("underline bogus").is_none());
        assert!(parse("currentcolor, underline").is_none());
        assert!(parse("overline rgb(1, 2, 3").is_none());
    }

    #[test]
    fn decoration_longhands_share_the_shorthand_grammar() {
        assert_eq!(line_bits("line-through underline"), Some(5));
        assert_eq!(line_bits("underline grammar-error"), Some(16));
        assert_eq!(line_bits("spelling-error"), Some(8));
        assert_eq!(line_bits("sideways"), None);
        assert_eq!(line_bits(""), None);
        assert_eq!(line_style("wavy"), Some(4));
        assert_eq!(
            color::parse("currentColor", Some(UNSET_COLOR)),
            Some(UNSET_COLOR)
        );
        assert_eq!(
            color::parse("#ff000080", Some(UNSET_COLOR)),
            Some(0x80ff0000)
        );
        assert_eq!(thickness("from-font"), Some(""));
        assert_eq!(thickness("0.5em"), Some("0.5em"));
        assert_eq!(thickness("2px 3px"), None);
        assert_eq!(thickness("wobbly(5px)"), None);
    }
}
