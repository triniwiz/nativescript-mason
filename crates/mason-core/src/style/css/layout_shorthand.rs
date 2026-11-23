//! Layout shorthand expansion for the CSS cascade and native HTML.

use super::background::{token, top_level_parts, Part};
use super::keywords;
use cssparser::Token;

pub(super) fn expand(name: &str, value: &str) -> Option<Vec<String>> {
    let accepts_commas = matches!(
        name,
        "gap"
            | "grid-gap"
            | "margin"
            | "padding"
            | "inset"
            | "margin-inline"
            | "margin-block"
            | "padding-inline"
            | "padding-block"
            | "inset-inline"
            | "inset-block"
    );
    let words = top_level_parts(value)?
        .into_iter()
        .filter_map(|part| match part {
            Part::Word(word) => Some(Some(word)),
            Part::Comma if accepts_commas => None,
            _ => Some(None),
        })
        .collect::<Option<Vec<_>>>()?;
    let words = words.as_slice();
    match name {
        "overflow" => pair(words, |word| {
            keywords::code("overflow", word, false).is_some()
        })
        .map(owned),
        "flex-flow" => flex_flow(words).map(owned),
        "flex" => flex(words).map(owned),
        "gap" | "grid-gap" => pair(words, |word| word == "normal" || is_length(word)).map(owned),
        "place-items" | "place-content" | "place-self" => place(words),
        "margin" | "inset" => sides(words, length_or_auto).map(owned),
        "padding" => sides(words, is_box_length).map(owned),
        "margin-inline" | "margin-block" | "inset-inline" | "inset-block" => {
            pair(words, length_or_auto).map(owned)
        }
        "padding-inline" | "padding-block" => pair(words, is_box_length).map(owned),
        _ => None,
    }
}

fn owned<const N: usize>(words: [&str; N]) -> Vec<String> {
    words.into_iter().map(str::to_owned).collect()
}

pub(super) fn is_length(word: &str) -> bool {
    matches!(
        token(word),
        Some(
            Token::Number { .. }
                | Token::Dimension { .. }
                | Token::Percentage { .. }
                | Token::Function(_)
        )
    )
}

fn length_or_auto(word: &str) -> bool {
    word.eq_ignore_ascii_case("auto") || is_box_length(word)
}

fn is_box_length(word: &str) -> bool {
    match token(word) {
        Some(Token::Dimension { unit, .. }) => matches!(
            unit.to_ascii_lowercase().as_str(),
            "px" | "dip"
                | "dppx"
                | "rem"
                | "em"
                | "pt"
                | "pc"
                | "cm"
                | "mm"
                | "q"
                | "in"
                | "vw"
                | "vh"
                | "vmin"
                | "vmax"
        ),
        Some(Token::Number { .. } | Token::Percentage { .. } | Token::Function(_)) => true,
        _ => false,
    }
}

fn pair<'a>(words: &[&'a str], accepts: impl Fn(&str) -> bool) -> Option<[&'a str; 2]> {
    match words {
        [a] if accepts(a) => Some([a, a]),
        [a, b] if accepts(a) && accepts(b) => Some([a, b]),
        _ => None,
    }
}

fn sides<'a>(words: &[&'a str], accepts: impl Fn(&str) -> bool) -> Option<[&'a str; 4]> {
    if !words.iter().all(|word| accepts(word)) {
        return None;
    }
    four_sides(words)
}

pub(super) fn four_sides<T: Clone>(words: &[T]) -> Option<[T; 4]> {
    let expanded = match words {
        [a] => [a, a, a, a],
        [a, b] => [a, b, a, b],
        [a, b, c] => [a, b, c, b],
        [a, b, c, d] => [a, b, c, d],
        _ => return None,
    };
    Some(expanded.map(T::clone))
}

fn flex_flow<'a>(words: &[&'a str]) -> Option<[&'a str; 2]> {
    let mut direction = "";
    let mut wrap = "";
    for &word in words {
        if direction.is_empty() && keywords::code("flex-direction", word, false).is_some() {
            direction = word;
        } else if wrap.is_empty() && keywords::code("flex-wrap", word, false).is_some() {
            wrap = word;
        } else {
            return None;
        }
    }
    (!words.is_empty()).then_some([direction, wrap])
}

fn is_factor(word: &str) -> bool {
    matches!(token(word), Some(Token::Number { value, .. }) if value.is_finite() && !word.starts_with('-'))
}

fn is_basis(word: &str) -> bool {
    matches!(
        word,
        "auto" | "content" | "min-content" | "max-content" | "fit-content"
    ) || (!word.starts_with('-') && is_length(word))
}

fn take_factors<'a, 'b>(words: &mut &'a [&'b str]) -> &'a [&'b str] {
    let count = words
        .iter()
        .take(2)
        .take_while(|word| is_factor(word))
        .count();
    let (factors, rest) = words.split_at(count);
    *words = rest;
    factors
}

fn flex<'a>(words: &[&'a str]) -> Option<[&'a str; 3]> {
    match words {
        [] => return None,
        [word] if word.eq_ignore_ascii_case("none") => return Some(["0", "0", "auto"]),
        [word] if word.eq_ignore_ascii_case("auto") => return Some(["1", "1", "auto"]),
        [word] if word.eq_ignore_ascii_case("initial") => return Some(["0", "1", "auto"]),
        _ => (),
    }
    let mut rest = words;
    let mut factors = take_factors(&mut rest);
    // Callers keep their existing implicit basis: a percentage in the CSS
    // cascade and a zero length in native HTML.
    let mut basis = "";
    if let Some((&word, tail)) = rest.split_first() {
        if !is_basis(word) {
            return None;
        }
        basis = word;
        rest = tail;
    }
    if factors.is_empty() {
        factors = take_factors(&mut rest);
    }
    if !rest.is_empty() {
        return None;
    }
    Some([
        factors.first().copied().unwrap_or("1"),
        factors.get(1).copied().unwrap_or("1"),
        basis,
    ])
}

fn place(words: &[&str]) -> Option<Vec<String>> {
    fn take_alignment(words: &mut &[&str]) -> Option<String> {
        let (&first, rest) = words.split_first()?;
        *words = rest;
        if matches!(first, "safe" | "unsafe" | "first" | "last") {
            if let Some((&second, rest)) = words.split_first() {
                *words = rest;
                return Some(format!("{first} {second}"));
            }
        }
        Some(first.to_owned())
    }

    let mut rest = words;
    let align = take_alignment(&mut rest)?;
    let justify = take_alignment(&mut rest).unwrap_or_else(|| align.clone());
    rest.is_empty().then_some(vec![align, justify])
}

#[cfg(test)]
mod tests {
    use super::expand;

    fn check<const N: usize>(name: &str, cases: &[(&str, [&str; N])], invalid: &[&str]) {
        for (value, expected) in cases {
            assert_eq!(
                expand(name, value).unwrap().as_slice(),
                expected,
                "{name}: {value}"
            );
        }
        for value in invalid {
            assert!(expand(name, value).is_none(), "{name}: {value}");
        }
    }

    #[test]
    fn flex_and_flex_flow_use_cascade_order_and_defaults() {
        check(
            "flex",
            &[
                ("none", ["0", "0", "auto"]),
                ("auto", ["1", "1", "auto"]),
                ("initial", ["0", "1", "auto"]),
                ("2", ["2", "1", ""]),
                ("0", ["0", "1", ""]),
                ("2 3", ["2", "3", ""]),
                ("10px", ["1", "1", "10px"]),
                ("content", ["1", "1", "content"]),
                ("2 10%", ["2", "1", "10%"]),
                ("2 3 4rem", ["2", "3", "4rem"]),
                ("1 1 0", ["1", "1", "0"]),
                ("10px 2 3", ["2", "3", "10px"]),
                (
                    "2/* grow */ calc(100% - 10px)",
                    ["2", "1", "calc(100% - 10px)"],
                ),
            ],
            &[
                "1 2 3 4",
                "10px 20px",
                "grow",
                "-1",
                "1 10px 2",
                "1 auto auto",
            ],
        );
        check(
            "flex-flow",
            &[
                ("row", ["row", ""]),
                ("wrap", ["", "wrap"]),
                ("column wrap-reverse", ["column", "wrap-reverse"]),
                ("nowrap row-reverse", ["row-reverse", "nowrap"]),
            ],
            &[
                "row column",
                "wrap nowrap",
                "diagonal",
                "row wrap column",
                "",
            ],
        );
    }

    #[test]
    fn expands_layout_axes_without_breaking_nested_lengths() {
        check(
            "overflow",
            &[
                ("hidden", ["hidden", "hidden"]),
                ("hidden scroll", ["hidden", "scroll"]),
                ("auto clip", ["auto", "clip"]),
            ],
            &["sideways", "hidden scroll auto", "hidden, scroll"],
        );
        check(
            "gap",
            &[
                ("10px", ["10px", "10px"]),
                ("1rem 5%", ["1rem", "5%"]),
                ("normal 2", ["normal", "2"]),
                ("calc(1px + 2px) 4px", ["calc(1px + 2px)", "4px"]),
            ],
            &["1px 2px 3px", "wide", "1px / 2px"],
        );
        check("grid-gap", &[("4px 8px", ["4px", "8px"])], &[]);
        check(
            "place-items",
            &[
                ("center", ["center", "center"]),
                ("start end", ["start", "end"]),
                ("safe center stretch", ["safe center", "stretch"]),
                ("last baseline", ["last baseline", "last baseline"]),
            ],
            &["", "a b c"],
        );
    }

    #[test]
    fn expands_physical_and_logical_sides_in_css_order() {
        check(
            "margin",
            &[
                ("auto", ["auto"; 4]),
                ("1px -2%", ["1px", "-2%", "1px", "-2%"]),
                ("0, 4px, 16%", ["0", "4px", "16%", "4px"]),
            ],
            &["1 2 3 4 5", "unknown", ""],
        );
        check(
            "padding",
            &[("1 2 3 4", ["1", "2", "3", "4"])],
            &["auto", "0 / 1"],
        );
        check(
            "inset",
            &[("4px auto", ["4px", "auto", "4px", "auto"])],
            &["4px invalid"],
        );
        check(
            "margin-inline",
            &[("auto 1px", ["auto", "1px"])],
            &["1 2 3"],
        );
        check("padding-block", &[("2px", ["2px", "2px"])], &["auto"]);
        check("inset-inline", &[("auto 0", ["auto", "0"])], &[]);
    }
}
