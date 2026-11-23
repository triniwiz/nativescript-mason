use super::{
    color, declarations, SvgCssDeclarationRecord as Declaration, SvgCssRuleRecord as Rule,
    SvgCssSelectorRecord as SelectorRecord, SvgPaintRecord as Paint,
};
use cssparser::{
    parse_important, AtRuleParser, CowRcStr, ParseError, Parser, ParserInput, ParserState,
    QualifiedRuleParser, StyleSheetParser, Token,
};

enum LeadingPaintUrl<'i> {
    Closed(Option<CowRcStr<'i>>, &'i str),
    Incomplete,
}

fn leading_paint_url(value: &str) -> Option<LeadingPaintUrl<'_>> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    let url = parser.expect_url().ok();
    if url.is_none()
        && !value
            .get(..4)
            .is_some_and(|prefix| prefix.eq_ignore_ascii_case("url("))
    {
        return None;
    }
    let end = parser.position().byte_index();
    Some(if value[..end].ends_with(')') {
        LeadingPaintUrl::Closed(url, &value[end..])
    } else {
        LeadingPaintUrl::Incomplete
    })
}

fn local_fragment(url: &str) -> Option<&str> {
    url.trim().strip_prefix('#').filter(|id| !id.is_empty())
}

pub(super) fn compile_url_fragment(value: &str) -> Option<String> {
    match leading_paint_url(value.trim())? {
        LeadingPaintUrl::Closed(Some(url), _) => local_fragment(&url).map(str::to_owned),
        _ => None,
    }
}

pub(super) fn compile_paint(mut value: &str) -> Option<Vec<String>> {
    let mut fields = Vec::new();
    let mut push = |kind: &str, value: String| {
        let mut record = [const { String::new() }; Paint::STRIDE];
        record[Paint::KIND] = kind.into();
        record[Paint::VALUE] = value;
        fields.extend(record);
    };
    loop {
        value = value.trim();
        match leading_paint_url(value) {
            Some(LeadingPaintUrl::Closed(url, rest)) => {
                let id = url.as_deref().and_then(local_fragment).unwrap_or_default();
                push("ref", id.into());
                value = rest;
                continue;
            }
            Some(LeadingPaintUrl::Incomplete) => push("none", String::new()),
            None if value.eq_ignore_ascii_case("none") => push("none", String::new()),
            None if value.eq_ignore_ascii_case("currentcolor") => push("currentcolor", String::new()),
            None => {
                if let Some(argb) = color::parse(value.trim_end_matches(';').trim_end(), None) {
                    push("color", argb.to_string());
                }
            }
        }
        break;
    }
    (!fields.is_empty()).then_some(fields)
}

#[test]
fn compiles_svg_paint_with_local_references_and_fallbacks() {
    assert_eq!(
        compile_paint("url('#a)b') rgb(0 128 0)").unwrap(),
        ["ref", "a)b", "color", "4278222848"],
    );
    assert_eq!(
        compile_paint("url(icon.svg#fill) URL(#fill) currentColor").unwrap(),
        ["ref", "", "ref", "fill", "currentcolor", ""],
    );
    assert_eq!(compile_paint("url(#fill").unwrap(), ["none", ""]);
    assert_eq!(compile_paint("url(#fill) invalid").unwrap(), ["ref", "fill"]);
    assert_eq!(compile_paint("transparent").unwrap(), ["color", "0"]);
    assert!(compile_paint("invalid").is_none());
    assert_eq!(
        compile_url_fragment("URL(\"#paint\") none").as_deref(),
        Some("paint"),
    );
    assert!(compile_url_fragment("url(icon.svg#fill)").is_none());
    assert!(compile_url_fragment("url(#)").is_none());
}

pub(super) fn compile_declarations(input: &str) -> Vec<String> {
    let mut fields = Vec::new();
    declarations::visit(input, |name, value| {
        let (value, important) = split_importance(value);
        if value.is_empty() {
            return;
        }
        let mut record = [const { String::new() }; Declaration::STRIDE];
        record[Declaration::NAME] = name.into();
        record[Declaration::VALUE] = value.into();
        record[Declaration::IMPORTANT] = if important { "1" } else { "0" }.into();
        fields.extend(record);
    });
    fields
}

fn split_importance(value: &str) -> (&str, bool) {
    if !value.contains('!') {
        return (value, false);
    }
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    while !parser.is_exhausted() {
        parser.skip_whitespace();
        let start = parser.position();
        if parser
            .try_parse(|parser| {
                parse_important(parser)?;
                parser.expect_exhausted()
            })
            .is_ok()
        {
            return (value[..start.byte_index()].trim_end(), true);
        }
        if parser.next().is_err() {
            break;
        }
    }
    (value, false)
}

struct Selector<'i> {
    element: Option<CowRcStr<'i>>,
    ids: Vec<CowRcStr<'i>>,
    classes: Vec<CowRcStr<'i>>,
}

fn compound_selector<'i>(parser: &mut Parser<'i, '_>) -> Result<Selector<'i>, ParseError<'i, ()>> {
    parser.skip_whitespace();
    let start = parser.state();
    let element = match parser.next()?.clone() {
        Token::Ident(name) => Some(name),
        Token::Delim('*') => None,
        _ => {
            parser.reset(&start);
            None
        }
    };
    let mut ids = Vec::new();
    let mut classes = Vec::new();
    while let Ok(token) = parser.next_including_whitespace().cloned() {
        match token {
            Token::IDHash(id) | Token::Hash(id) => ids.push(id),
            Token::Delim('.') => match parser.next_including_whitespace()?.clone() {
                Token::Ident(class) => classes.push(class),
                token => return Err(parser.new_unexpected_token_error(token)),
            },
            Token::WhiteSpace(_) if parser.is_exhausted() => break,
            token => return Err(parser.new_unexpected_token_error(token)),
        }
    }
    Ok(Selector {
        element,
        ids,
        classes,
    })
}

struct SvgStylesheet;

impl<'i> AtRuleParser<'i> for SvgStylesheet {
    type Prelude = ();
    type AtRule = (Vec<Selector<'i>>, Vec<String>);
    type Error = ();
}

impl<'i> QualifiedRuleParser<'i> for SvgStylesheet {
    type Prelude = Vec<Selector<'i>>;
    type QualifiedRule = (Vec<Selector<'i>>, Vec<String>);
    type Error = ();

    fn parse_prelude(
        &mut self,
        input: &mut Parser<'i, '_>,
    ) -> Result<Self::Prelude, ParseError<'i, Self::Error>> {
        Ok(input.parse_comma_separated_ignoring_errors(compound_selector))
    }

    fn parse_block(
        &mut self,
        selectors: Self::Prelude,
        _: &ParserState,
        body: &mut Parser<'i, '_>,
    ) -> Result<Self::QualifiedRule, ParseError<'i, Self::Error>> {
        let start = body.position();
        while body.next_including_whitespace_and_comments().is_ok() {}
        Ok((selectors, compile_declarations(body.slice_from(start))))
    }
}

pub(super) fn compile_stylesheet(input: &str) -> Vec<String> {
    let mut parser_input = ParserInput::new(input);
    let mut parser = Parser::new(&mut parser_input);
    let mut fields = Vec::new();
    for (selectors, declarations) in
        StyleSheetParser::new(&mut parser, &mut SvgStylesheet).flatten()
    {
        if selectors.is_empty() || declarations.is_empty() {
            continue;
        }

        let mut header = [const { String::new() }; Rule::STRIDE];
        header[Rule::SELECTOR_COUNT] = selectors.len().to_string();
        header[Rule::DECLARATION_COUNT] = (declarations.len() / Declaration::STRIDE).to_string();
        fields.extend(header);
        for selector in selectors {
            let mut header = [const { String::new() }; SelectorRecord::STRIDE];
            header[SelectorRecord::TYPE] = selector
                .element
                .map_or_else(String::new, |name| name.to_string());
            header[SelectorRecord::ID_COUNT] = selector.ids.len().to_string();
            header[SelectorRecord::CLASS_COUNT] = selector.classes.len().to_string();
            fields.extend(header);
            fields.extend(
                selector
                    .ids
                    .iter()
                    .chain(&selector.classes)
                    .map(ToString::to_string),
            );
        }
        fields.extend(declarations);
    }
    fields
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn svg_declarations_share_raw_values_and_recognize_top_level_importance() {
        assert_eq!(
            compile_declarations(
                r#"/* lead */ FILL: url("data:}a;b"); font-family: "a \" !important"; stroke: red !/**/ ImPorTanT /* end */; broken; opacity: .5"#
            ),
            [
                "fill",
                r#"url("data:}a;b")"#,
                "0",
                "font-family",
                r#""a \" !important""#,
                "0",
                "stroke",
                "red",
                "1",
                "opacity",
                ".5",
                "0",
            ]
        );
    }

    #[test]
    fn svg_rules_keep_selector_order_and_skip_unsupported_rules() {
        assert_eq!(
            compile_stylesheet(
                r#"@import "ignored.css"; @media screen { rect { fill: yellow } }
                /* leading comment */ rect#main.icon, g rect, .\69 con {
                    fill: url("data:}a;b"); stroke: red !important;
                }
                * { opacity: 0.5; }"#
            ),
            [
                "2",
                "2",
                "rect",
                "1",
                "1",
                "main",
                "icon",
                "",
                "0",
                "1",
                "icon",
                "fill",
                r#"url("data:}a;b")"#,
                "0",
                "stroke",
                "red",
                "1",
                "1",
                "1",
                "",
                "0",
                "0",
                "opacity",
                "0.5",
                "0",
            ]
        );
    }
}
