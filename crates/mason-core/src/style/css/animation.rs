use super::{
    background::{size_terms, token, top_level_parts, Part, SizeTerms},
    length::token_value,
    position::{edge, simple_position_order},
    CssAnimationComponentRecord as Field, CssAnimationLayerRecord as Layer,
};
use cssparser::Token;

enum Term<'a> {
    Number(f64, String),
    Keyword(&'a str),
}

impl<'a> Term<'a> {
    fn parse(text: &'a str, token: Option<Token<'a>>) -> Self {
        token
            .and_then(|token| token_value(token, text))
            .map_or(Self::Keyword(text), |(number, unit)| {
                Self::Number(number, unit)
            })
    }

    fn percent(value: f64) -> Self {
        Self::Number(value, "%".into())
    }

    fn fields(self) -> [String; Field::STRIDE] {
        let mut fields = [const { String::new() }; Field::STRIDE];
        match self {
            Self::Number(number, unit) => {
                fields[Field::KIND] = "number".into();
                fields[Field::VALUE] = number.to_string();
                fields[Field::UNIT] = unit;
            }
            Self::Keyword(keyword) => {
                fields[Field::KIND] = "keyword".into();
                fields[Field::VALUE] = keyword.into();
            }
        }
        fields
    }
}

fn position<'a>(words: &[&'a str]) -> Option<[Term<'a>; 2]> {
    // Edge-offset values still animate discretely.
    if !(1..=2).contains(&words.len()) {
        return None;
    }
    let tokens: Vec<_> = words.iter().map(|&word| (word, token(word))).collect();
    let side = |(_, term): &(&str, Option<Token<'_>>)| term.as_ref().and_then(edge);
    let ordered = simple_position_order(&tokens, |term| side(term).map(|(axis, _)| axis))?;
    Some(ordered.map(|term| {
        let Some((word, token)) = term else {
            return Term::percent(50.);
        };
        if let Some((_, axis)) = token.as_ref().and_then(edge) {
            return Term::percent(f64::from(axis.fraction) * 100.);
        }
        if matches!(token, Some(Token::Ident(name)) if name.eq_ignore_ascii_case("center")) {
            return Term::percent(50.);
        }
        Term::parse(word, token.clone())
    }))
}

fn push_layer<'a>(
    fields: &mut Vec<String>,
    terms: impl IntoIterator<Item = Term<'a>, IntoIter: ExactSizeIterator>,
) {
    let terms = terms.into_iter();
    let mut header = [const { String::new() }; Layer::STRIDE];
    header[Layer::COMPONENT_COUNT] = terms.len().to_string();
    fields.extend(header);
    fields.extend(terms.flat_map(Term::fields));
}

pub(super) fn compile(input: &str, is_position: bool) -> Option<Vec<String>> {
    let parts = top_level_parts(input)?;
    let mut fields = Vec::new();
    for layer in parts.split(|part| *part == Part::Comma) {
        let words: Vec<_> = layer
            .iter()
            .map(|part| match part {
                Part::Word(word) => Some(*word),
                _ => None,
            })
            .collect::<Option<_>>()?;
        if is_position {
            push_layer(&mut fields, position(&words)?);
        } else {
            match size_terms(&words)? {
                SizeTerms::Cover => push_layer(&mut fields, [Term::Keyword("cover")]),
                SizeTerms::Contain => push_layer(&mut fields, [Term::Keyword("contain")]),
                SizeTerms::Dimensions(words) => push_layer(
                    &mut fields,
                    words.map(|term| {
                        term.map_or(Term::Keyword("auto"), |word| Term::parse(word, token(word)))
                    }),
                ),
            }
        }
    }
    Some(fields)
}

#[test]
fn compiles_animation_layers_with_authored_units_and_exact_decimal_values() {
    assert_eq!(
        compile("top right, 10.0000001PX, 2.5em 0", true).unwrap(),
        [
            "2",
            "number",
            "100",
            "%",
            "number",
            "0",
            "%",
            "2",
            "number",
            "10.0000001",
            "px",
            "number",
            "50",
            "%",
            "2",
            "number",
            "2.5",
            "em",
            "number",
            "0",
            ""
        ],
    );
    assert_eq!(
        compile("10px, COVER, auto calc(10px + 2%)", false).unwrap(),
        [
            "2",
            "number",
            "10",
            "px",
            "keyword",
            "auto",
            "",
            "1",
            "keyword",
            "cover",
            "",
            "2",
            "keyword",
            "auto",
            "",
            "keyword",
            "calc(10px + 2%)",
            ""
        ],
    );
    assert!(compile("left 5px bottom 10px", true).is_none());
    assert!(compile("0%,", true).is_none());
}
