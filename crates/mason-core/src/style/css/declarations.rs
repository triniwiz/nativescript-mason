use super::{
    background::token,
    border,
    keywords,
    length::{self, resolve_box_length as box_length, LengthMode},
    position, shorthand, text, CssDeclarationHeaderRecord as Header, CssParseKind, LengthContext,
};
use cssparser::{Parser, ParserInput, Token};
use std::collections::HashSet;

struct Declaration {
    name: String,
    value: String,
    fields: Vec<String>,
}

/// Compiles the ordered declarations in an inline style. Keep the original
/// value for adapters resolving context-dependent values or replaying viewport units.
pub(super) fn compile(input: &str) -> Vec<String> {
    let mut declarations = parse(input);
    for declaration in declarations.iter_mut().filter(|entry| entry.name == "border-radius") {
        declaration.fields = shorthand::expand("border-radius-components", &declaration.value).unwrap_or_default();
    }
    pack(declarations)
}

pub fn compile_inline_style(
    input: &str,
    context: LengthContext,
    parent_font_size: f32,
    viewport_refresh: bool,
) -> Vec<String> {
    compile_inline(input, context, parent_font_size, viewport_refresh, None, false)
}

/// Prefixes inline declarations with the dependencies and resolved font size
/// needed by the platform's parent-first replay.
pub fn compile_inline_style_replay(
    input: &str,
    context: LengthContext,
    parent_font_size: f32,
    previous_font_size: Option<f32>,
) -> Vec<String> {
    compile_inline(input, context, parent_font_size, previous_font_size.is_some(), previous_font_size, true)
}

fn compile_inline(
    input: &str,
    mut context: LengthContext,
    parent_font_size: f32,
    viewport_refresh: bool,
    previous_font_size: Option<f32>,
    include_dependencies: bool,
) -> Vec<String> {
    use super::CssInlineReplayRecord as Replay;
    let mut declarations = parse(input);
    let font_context = LengthContext {
        font_size: parent_font_size,
        ..context
    };
    let mut font_uses_viewport = false;
    for declaration in declarations
        .iter_mut()
        .filter(|entry| entry.name == "font-size")
    {
        if let Some([kind, amount]) =
            length::resolve(&declaration.value, font_context, LengthMode::FontSize)
        {
            let amount = if kind == 1. {
                amount / f64::from(context.scale)
            } else {
                amount
            };
            if (amount as f32).is_finite() {
                declaration.fields = numeric_fields([if kind == 2. { 2. } else { 0. }, amount]);
                context.font_size = (if kind == 2. {
                    amount * f64::from(parent_font_size)
                } else {
                    amount
                }) as f32;
                context.font_size = context.font_size.max(0.);
                if viewport_refresh && previous_font_size.is_none() {
                    font_uses_viewport = uses_viewport_units(&declaration.value);
                }
            }
        }
    }
    let dependencies: Vec<_> = if viewport_refresh || include_dependencies {
        declarations.iter().map(declaration_dependencies).collect()
    } else {
        Vec::new()
    };
    let viewport_dependent = dependencies.iter().any(|uses| uses.viewport);
    let font_dependent = dependencies.iter().any(|uses| uses.font);
    if viewport_refresh {
        let font_size_changes = previous_font_size.map_or(font_uses_viewport, |previous| previous != context.font_size);
        let affected: HashSet<_> = declarations
            .iter()
            .zip(dependencies)
            .filter(|(_, uses)| uses.viewport || font_size_changes && uses.font)
            .map(|(entry, _)| property_group(&entry.name).to_owned())
            .collect();
        // Color declarations supply the authored currentColor for paint batches.
        // Keep them until the batches have captured that context.
        declarations.retain(|entry| entry.name == "color" || affected.contains(property_group(&entry.name)));
    }
    for declaration in &mut declarations {
        resolve_fields(declaration, context);
    }
    coalesce_background(&mut declarations, context.font_size);
    coalesce_effects(&mut declarations, context.font_size);
    coalesce_masks(&mut declarations);
    if viewport_refresh {
        declarations.retain(|entry| entry.name != "color");
    }
    let mut output = Vec::new();
    if include_dependencies {
        let mut fields = [const { String::new() }; Replay::STRIDE];
        fields[Replay::VIEWPORT_DEPENDENT] = u8::from(viewport_dependent).to_string();
        fields[Replay::FONT_DEPENDENT] = u8::from(font_dependent).to_string();
        fields[Replay::FONT_SIZE] = context.font_size.to_string();
        output.extend(fields);
    }
    pack_into(&mut output, declarations);
    output
}

fn numeric_fields(values: impl IntoIterator<Item = f64>) -> Vec<String> {
    values.into_iter().map(|value| value.to_string()).collect()
}

fn parse(input: &str) -> Vec<Declaration> {
    let mut fields = Vec::new();
    visit(input, |name, value| normalize(name, value, &mut fields));
    fields
}

pub(super) fn visit(input: &str, mut visit: impl FnMut(&str, &str)) {
    let mut start = 0;
    let mut colon = None;
    let mut quote = None;
    let mut parentheses = 0usize;
    let mut blocks = 0usize;
    let mut chars = input.char_indices().peekable();
    while let Some((index, ch)) = chars.next() {
        if ch == '\\' {
            chars.next();
            continue;
        }
        if let Some(quoted) = quote {
            if ch == quoted {
                quote = None;
            }
            continue;
        }
        match ch {
            '/' if chars.peek().is_some_and(|&(_, next)| next == '*') => {
                chars.next();
                let mut closed = false;
                while let Some((_, ch)) = chars.next() {
                    if ch == '*' && chars.peek().is_some_and(|&(_, next)| next == '/') {
                        chars.next();
                        closed = true;
                        break;
                    }
                }
                if !closed {
                    return;
                }
            }
            '"' | '\'' => quote = Some(ch),
            '(' => parentheses += 1,
            ')' => parentheses = parentheses.saturating_sub(1),
            '[' | '{' if parentheses == 0 => blocks += 1,
            ']' | '}' if parentheses == 0 => blocks = blocks.saturating_sub(1),
            ':' if parentheses == 0 && blocks == 0 && colon.is_none() => colon = Some(index),
            ';' if parentheses == 0 && blocks == 0 => {
                declaration(input, start, colon.take(), index, &mut visit);
                start = index + 1;
            }
            _ => {}
        }
    }
    if quote.is_none() && parentheses == 0 && blocks == 0 {
        declaration(input, start, colon, input.len(), &mut visit);
    }
}

fn declaration(
    input: &str,
    start: usize,
    colon: Option<usize>,
    end: usize,
    visit: &mut impl FnMut(&str, &str),
) {
    let Some(colon) = colon else { return };
    let Some(Token::Ident(name)) = token(&input[start..colon]) else {
        return;
    };
    let value = input[colon + 1..end].trim();
    if !value.is_empty() {
        visit(&name.to_ascii_lowercase(), value);
    }
}

fn normalize(name: &str, value: &str, out: &mut Vec<Declaration>) {
    // These shorthands replay their longhands in declaration order.
    let longhands: &[&str] = match name {
        "place-items" => &["align-items", "justify-items"],
        "place-content" => &["align-content", "justify-content"],
        "place-self" => &["align-self", "justify-self"],
        "flex-flow" => &["flex-direction", "flex-wrap"],
        "flex" => &["flex-grow", "flex-shrink", "flex-basis"],
        "list-style" => &["list-style-type", "list-style-position"],
        _ => &[],
    };
    if !longhands.is_empty() {
        if let Some(fields) = shorthand::expand(name, value) {
            for (&longhand, field) in longhands.iter().zip(&fields) {
                let field = if field.is_empty() {
                    match longhand {
                        "flex-direction" => "row",
                        "flex-wrap" => "nowrap",
                        _ => "0",
                    }
                } else {
                    field
                };
                normalize(longhand, field, out);
            }
        }
        return;
    }

    let fields = match name {
        "overflow" => shorthand::expand(name, value).and_then(|words| {
            words
                .iter()
                .map(|word| keywords::code("overflow", word, true).map(|code| code.to_string()))
                .collect()
        }),
        "gap"
        | "grid-gap"
        | "margin"
        | "padding"
        | "inset"
        | "aspect-ratio"
        | "mask"
        | "-webkit-mask"
        | "mask-border"
        | "-webkit-mask-box-image"
        | "font-family"
        | "font-style"
        | "font-weight"
        | "font-stretch"
        | "font-variant-numeric"
        | "line-clamp"
        | "-webkit-line-clamp"
        | "text-decoration"
        | "text-decoration-line"
        | "text-decoration-color"
        | "text-decoration-style"
        | "text-decoration-thickness" => shorthand::expand(name, value),
        "color" | "background-color" => shorthand::expand("color-value", value),
        "border" => shorthand::expand("border-components", value),
        "border-top" | "border-right" | "border-bottom" | "border-left" => {
            shorthand::expand("border-side-components", value)
        }
        "flex-grow" | "flex-shrink" => match token(value) {
            Some(Token::Number { value, .. }) if value.is_finite() => Some(vec![value.to_string()]),
            _ => None,
        },
        "z-index" => value
            .parse::<i32>()
            .ok()
            .map(|value| vec![value.to_string()]),
        _ => keywords::code(name, value, true).map(|code| vec![code.to_string()]),
    }
    .unwrap_or_default();
    out.push(Declaration {
        name: name.to_owned(),
        value: value.to_owned(),
        fields,
    });
}

fn pack(declarations: Vec<Declaration>) -> Vec<String> {
    let mut out = Vec::new();
    pack_into(&mut out, declarations);
    out
}

fn pack_into(out: &mut Vec<String>, declarations: Vec<Declaration>) {
    for Declaration {
        name,
        value,
        fields,
    } in declarations
    {
        let mut header = [const { String::new() }; Header::STRIDE];
        header[Header::NAME] = name;
        header[Header::VALUE] = value;
        header[Header::FIELD_COUNT] = fields.len().to_string();
        out.extend(header);
        out.extend(fields);
    }
}

fn resolve_fields(entry: &mut Declaration, context: LengthContext) {
    let value = entry.value.as_str();
    let kind = match entry.name.as_str() {
        "line-height" => CssParseKind::LineHeight,
        "letter-spacing" => CssParseKind::LetterSpacing,
        "word-spacing" => CssParseKind::WordSpacing,
        "text-indent" => CssParseKind::TextIndent,
        "vertical-align" => {
            entry.fields = text::resolve_vertical_align(value, context)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "transform-origin" => {
            entry.fields = position::resolve_position(value, context, true)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "border-radius" => {
            entry.fields = border::resolve_radii(value, context, false)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "border" | "border-top" | "border-right" | "border-bottom" | "border-left" => {
            let width_count = match entry.name.as_str() {
                "border" => super::BorderComponentsRecord::STYLE,
                _ => super::BorderSideComponentsRecord::STYLE,
            };
            if entry.fields.len() < width_count {
                return;
            }
            let mut resolved = Vec::new();
            for width in entry.fields.drain(..width_count) {
                if width.is_empty() {
                    resolved.extend([String::new(), String::new()]);
                } else if let Some(pair) = box_length(&width, context, true) {
                    resolved.extend(numeric_fields(pair));
                } else {
                    resolved.clear();
                    break;
                }
            }
            if !resolved.is_empty() {
                resolved.append(&mut entry.fields);
            }
            entry.fields = resolved;
            return;
        }
        "text-decoration" | "text-decoration-thickness" => {
            let index = if entry.name == "text-decoration" {
                super::TextDecorationRecord::THICKNESS
            } else {
                0
            };
            if let Some(value) = entry.fields.get_mut(index) {
                let thickness = if value.is_empty() {
                    Some(0.)
                } else {
                    box_length(value, context, false).and_then(|[kind, value]| match kind {
                        1. => Some(value),
                        2. => Some(0.),
                        _ => None,
                    })
                };
                if let Some(thickness) = thickness {
                    *value = thickness.to_string();
                } else {
                    entry.fields.clear();
                }
            }
            return;
        }
        "gap" | "grid-gap" | "padding" | "margin" | "inset" => {
            let clamp = matches!(entry.name.as_str(), "gap" | "grid-gap" | "padding");
            let gap = matches!(entry.name.as_str(), "gap" | "grid-gap");
            let fields = entry
                .fields
                .iter()
                .map(|field| box_length(if gap { gap_value(field) } else { field }, context, clamp))
                .collect::<Option<Vec<_>>>();
            entry.fields = fields
                .map(|fields| numeric_fields(fields.into_iter().flatten()))
                .unwrap_or_default();
            return;
        }
        "width" | "height" | "min-width" | "min-height" | "max-width" | "max-height" | "flex-basis" => {
            let intrinsic = matches!(entry.name.as_str(), "width" | "height" | "flex-basis");
            entry.fields = length::resolve_dimension(value, context, intrinsic)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "margin-left" | "margin-right" | "margin-top" | "margin-bottom" | "top" | "right" | "bottom" | "left" => {
            entry.fields = box_length(value, context, false)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "row-gap" | "column-gap" => {
            entry.fields = box_length(gap_value(value), context, true)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        "padding-left" | "padding-right" | "padding-top" | "padding-bottom" => {
            entry.fields = box_length(value, context, true)
                .map(numeric_fields)
                .unwrap_or_default();
            return;
        }
        _ => return,
    };
    entry.fields = text::resolve_length(value, context, kind)
        .map(numeric_fields)
        .unwrap_or_default();
}

fn coalesce_masks(declarations: &mut Vec<Declaration>) {
    use super::{
        mask_style_slot, CssMaskWriteRecord as Entry, MaskInputRecord as Mask, MASK_CLIP_PATH_SLOT,
    };

    let mut values: [Option<String>; MASK_CLIP_PATH_SLOT + 1] = [const { None }; MASK_CLIP_PATH_SLOT + 1];
    declarations.retain_mut(|entry| {
        let slot = match entry.name.as_str() {
            "mask" | "-webkit-mask" | "mask-border" | "-webkit-mask-box-image" => {
                let range = if matches!(entry.name.as_str(), "mask" | "-webkit-mask") {
                    0..Mask::STRIDE
                } else {
                    Mask::STRIDE..MASK_CLIP_PATH_SLOT
                };
                if entry.fields.len() == range.len() {
                    for (slot, value) in values[range].iter_mut().zip(entry.fields.drain(..)) {
                        *slot = Some(value);
                    }
                }
                return false;
            }
            name => match mask_style_slot(name) {
                Some(slot) => slot,
                None => return true,
            },
        };
        values[slot] = Some(std::mem::take(&mut entry.value));
        false
    });
    let fields: Vec<String> = values
        .into_iter()
        .enumerate()
        .filter_map(|(slot, value)| {
            let mut field = [const { String::new() }; Entry::STRIDE];
            field[Entry::SLOT] = slot.to_string();
            field[Entry::VALUE] = value?;
            Some(field)
        })
        .flatten()
        .collect();
    if !fields.is_empty() {
        // Installation uses the final element color and font.
        declarations.push(Declaration {
            name: "mask-values".into(),
            value: String::new(),
            fields,
        });
    }
}

fn is_background_layer_property(name: &str) -> bool {
    matches!(
        name,
        "background" | "background-image" | "background-repeat" | "background-position"
            | "background-position-x" | "background-position-y" | "background-size"
            | "background-clip" | "background-origin" | "background-attachment"
            | "background-blend-mode"
    )
}

fn coalesce_background(declarations: &mut Vec<Declaration>, font_size: f32) {
    use super::CssBackgroundWriteRecord as Write;

    if !declarations.iter().any(|entry| is_background_layer_property(&entry.name)) {
        return;
    }
    let mut fields = Vec::new();
    let mut current_color = None;
    declarations.retain_mut(|entry| {
        let value = match entry.name.as_str() {
            "color" => {
                if let Some(color) = entry.fields.first() {
                    current_color = Some(color.clone());
                }
                return true;
            }
            "background-color" => match entry.fields.pop() {
                Some(color) => color,
                None => return false,
            },
            name if is_background_layer_property(name) => std::mem::take(&mut entry.value),
            _ => return true,
        };
        let mut row = [const { String::new() }; Write::STRIDE];
        row[Write::PROPERTY] = std::mem::take(&mut entry.name);
        // NUL separates fields in the bridge; CSS preprocesses a literal NUL to U+FFFD.
        row[Write::VALUE] = if value.contains('\0') {
            value.replace('\0', "\u{fffd}")
        } else {
            value
        };
        if matches!(row[Write::PROPERTY].as_str(), "background" | "background-image") {
            row[Write::CURRENT_COLOR] = current_color.clone().unwrap_or_default();
        }
        fields.extend(row);
        false
    });
    if !fields.is_empty() {
        declarations.push(Declaration {
            name: "background-values".into(),
            value: font_size.to_string(),
            fields,
        });
    }
}

fn coalesce_effects(declarations: &mut Vec<Declaration>, font_size: f32) {
    use super::{CssEffectWriteRecord as Write, StyleRecordKind};

    let mut fields = Vec::new();
    let mut current_color = None;
    declarations.retain_mut(|entry| {
        if entry.name == "color" {
            if let Some(color) = entry.fields.first() {
                current_color = Some(color.clone());
            }
        }
        if StyleRecordKind::from_property(&entry.name).is_none() {
            return true;
        }
        let mut row = [const { String::new() }; Write::STRIDE];
        row[Write::PROPERTY] = std::mem::take(&mut entry.name);
        row[Write::VALUE] = if entry.value.contains('\0') {
            entry.value.replace('\0', "\u{fffd}")
        } else {
            std::mem::take(&mut entry.value)
        };
        row[Write::CURRENT_COLOR] = current_color.clone().unwrap_or_default();
        fields.extend(row);
        false
    });
    if !fields.is_empty() {
        declarations.push(Declaration { name: "effect-values".into(), value: font_size.to_string(), fields });
    }
}

fn gap_value(value: &str) -> &str {
    if value.eq_ignore_ascii_case("normal") {
        "0"
    } else {
        value
    }
}

fn property_group(name: &str) -> &str {
    for prefix in [
        "mask-border",
        "border-image",
        "margin",
        "padding",
        "background",
        "mask",
        "border",
        "text-decoration",
        "overflow",
    ] {
        if name == prefix
            || name
                .strip_prefix(prefix)
                .is_some_and(|tail| tail.starts_with('-'))
        {
            return prefix;
        }
    }
    match name {
        "top" | "right" | "bottom" | "left" => "inset",
        "row-gap" | "column-gap" | "grid-gap" => "gap",
        "-webkit-mask" => "mask",
        "-webkit-mask-box-image" => "mask-border",
        _ => name,
    }
}

#[derive(Default)]
struct UnitDependencies {
    viewport: bool,
    font: bool,
}

pub(super) fn uses_viewport_units(value: &str) -> bool {
    value_dependencies(value, false).viewport
}

fn declaration_dependencies(entry: &Declaration) -> UnitDependencies {
    value_dependencies(&entry.value, matches!(entry.name.as_str(), "font-size" | "line-height"))
}

fn value_dependencies(value: &str, font_percentage: bool) -> UnitDependencies {
    let mut input = ParserInput::new(value);
    let mut uses = UnitDependencies::default();
    scan_units(&mut Parser::new(&mut input), font_percentage, &mut uses, 0);
    uses
}

fn scan_units(parser: &mut Parser<'_, '_>, font_percentage: bool, uses: &mut UnitDependencies, depth: usize) {
    while let Ok(token) = parser.next() {
        match token {
            Token::Dimension { unit, .. } => {
                uses.font |= unit.eq_ignore_ascii_case("em");
                uses.viewport |= ["vw", "vh", "vmin", "vmax"].iter().any(|known| unit.eq_ignore_ascii_case(known));
            }
            Token::Percentage { .. } => uses.font |= font_percentage,
            Token::Function(_) | Token::ParenthesisBlock | Token::SquareBracketBlock | Token::CurlyBracketBlock
                if depth < 32 =>
            {
                let _: Result<(), cssparser::ParseError<'_, ()>> = parser.parse_nested_block(|inner| {
                    scan_units(inner, font_percentage, uses, depth + 1);
                    Ok(())
                });
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn units() -> LengthContext {
        LengthContext {
            scale: 2.,
            font_size: 16.,
            root_font_size: 16.,
            viewport_width: 400.,
            viewport_height: 800.,
        }
    }

    fn resolved(input: &str, refresh: bool) -> Vec<(String, Vec<String>)> {
        let packed = compile_inline_style(input, units(), 20., refresh);
        let mut rest = packed.as_slice();
        let mut declarations = Vec::new();
        while !rest.is_empty() {
            let count = rest[Header::FIELD_COUNT].parse::<usize>().unwrap();
            declarations.push((
                rest[Header::NAME].clone(),
                rest[Header::STRIDE..Header::STRIDE + count].to_vec(),
            ));
            rest = &rest[Header::STRIDE + count..];
        }
        declarations
    }

    #[test]
    fn effect_batch_preserves_clear_untouched_and_color_snapshots() {
        use super::super::{EffectBatch, FilterRecord, ShadowRecord, StyleRecordKind};

        let entries = resolved(
            "box-shadow: 1px 2px red; box-shadow: none;
             filter: drop-shadow(2px 3px currentColor); color: blue;
             text-shadow: 1px 2px currentColor; color: green",
            false,
        );
        let (_, fields) = entries.iter().find(|entry| entry.0 == "effect-values").unwrap();
        let initial_color = 0xff123456;
        let batch = EffectBatch::parse(&fields.join("\0"), units(), initial_color).unwrap();
        let box_shadow = batch.get(StyleRecordKind::BoxShadow).unwrap();
        assert_eq!(box_shadow.value, "none");
        assert!(box_shadow.records.is_empty());
        assert!(batch.get(StyleRecordKind::BackdropFilter).is_none());

        let text_shadow = batch.get(StyleRecordKind::TextShadow).unwrap();
        assert_eq!(text_shadow.records[ShadowRecord::COLOR], f64::from(0xff0000ffu32));
        let filter = batch.get(StyleRecordKind::Filter).unwrap();
        assert_eq!(filter.records[FilterRecord::COLOR], f64::from(initial_color));
        let updated_color = 0xff00ff00u32;
        let updated = filter.filter.as_ref().unwrap().records(units(), updated_color);
        assert_eq!(updated[FilterRecord::COLOR], f64::from(updated_color));
    }

    #[test]
    fn batches_lengths_using_the_last_valid_font_size_and_the_parent_basis() {
        let entries = resolved(
            "letter-spacing: .5em; margin: 2em auto; font-size: 12px; font-size: calc(125% + 5px);
             font-size: bogus; line-height: 150%; transform-origin: 1em 50%; text-decoration-thickness: .1em",
            false,
        );
        for (i, expected) in [
            (0, vec!["1", "30"]),
            (1, vec!["1", "120", "3", "0", "1", "120", "3", "0"]),
            (2, vec!["0", "12"]),
            (3, vec!["0", "30"]),
            (4, vec![]),
            (5, vec!["1", "45"]),
            (6, vec!["0", "60", "1", "50"]),
            (7, vec!["6"]),
        ] {
            assert_eq!(entries[i].1, expected, "{}", entries[i].0);
        }
    }

    #[test]
    fn viewport_replay_uses_the_inherited_font_and_keeps_fixed_groups() {
        let css = "font-size: calc(50% + 5px); padding-left: 2em; line-height: 150%; height: 30px";
        let initial = compile_inline_style_replay(css, units(), 20., None);
        assert_eq!(initial[..3], ["0", "1", "15"]);
        let replay = compile_inline_style_replay(css, units(), 40., Some(15.));
        assert_eq!(replay[..3], ["0", "1", "25"]);
        assert!(replay[3..].contains(&"padding-left".to_owned()));
        assert!(replay[3..].contains(&"line-height".to_owned()));
        assert!(!replay[3..].contains(&"height".to_owned()));
        let unchanged = compile_inline_style_replay(css, units(), 40., Some(25.));
        assert_eq!(unchanged, ["0", "1", "25"]);

        assert!(uses_viewport_units(r"calc(.5VW + 1v\77)"));
        assert!(!uses_viewport_units(r#"url("photo50vw.png"), "25vh" /* 1vmax */"#));
    }

    #[test]
    fn viewport_replay_keeps_paint_color_context_without_rewriting_color() {
        let css = "color: red; box-shadow: 1em 2px currentColor; color: blue";
        let mut context = units();
        context.font_size = 24.;
        let fields = compile_inline_style_replay(css, context, 24., Some(16.));
        assert_eq!(fields, [
            "0", "1", "24", "effect-values", "24", "3", "box-shadow", "1em 2px currentColor", "4294901760",
        ]);
    }

    #[test]
    fn viewport_replay_includes_later_overrides_and_font_dependents() {
        let entries = resolved(
            "width: 10vw; width: 30px; height: 50px; font-size: 5vw; letter-spacing: .5em;
             margin-left: 3vw; margin: 2px; color: red",
            true,
        );
        let names: Vec<_> = entries.iter().map(|(name, _)| name.as_str()).collect();
        assert_eq!(
            names,
            [
                "width",
                "width",
                "font-size",
                "letter-spacing",
                "margin-left",
                "margin"
            ]
        );
        assert_eq!(entries[0].1, ["1", "80"]);
        assert_eq!(entries[1].1, ["1", "60"]);
        assert_eq!(entries[3].1, ["1", "20"]);
    }

    #[test]
    fn compiles_paint_groups_using_the_element_context_and_cascade_order() {
        use super::super::{CssBorderResultRecord as Border, CssMaskWriteRecord as MaskWrite};
        let entries = resolved(
            "border: .25em solid red; border-left: 4% dashed blue; border-radius: .5em / 20%;
             -webkit-mask: url(a.svg) center / contain padding xor; mask-repeat: no-repeat;
             mask: url(b.svg) invalid; mask-border: none; mask-border-width: 4px;
             clip-path: inset(1px); font-size: 20px",
            false,
        );
        assert_eq!(entries[0].1.len(), Border::STRIDE);
        assert_eq!(entries[0].1[Border::TOP_VALUE], "10");
        assert_eq!(entries[0].1[Border::STYLE], "4");
        assert_eq!(entries[1].1, ["2", "0.04", "3", "4278190335"]);
        assert_eq!(&entries[2].1[..2], ["1", "20"]);
        assert_eq!(&entries[2].1[8..10], ["2", "0.2"]);
        let (name, fields) = entries.last().unwrap();
        assert_eq!(name, "mask-values");
        let pairs: Vec<_> = fields
            .chunks_exact(MaskWrite::STRIDE)
            .map(|entry| {
                (
                    entry[MaskWrite::SLOT].as_str(),
                    entry[MaskWrite::VALUE].as_str(),
                )
            })
            .collect();
        assert!(pairs.contains(&("0", "url(a.svg)")));
        assert!(pairs.contains(&("3", "no-repeat")));
        assert!(pairs.contains(&("7", "exclude")));
        assert!(pairs.contains(&("10", "4px")));
        assert!(pairs.contains(&("14", "inset(1px)")));
    }

    #[test]
    fn compiles_background_writes_and_preserves_color_and_layer_order() {
        use super::super::{
            background::{BackgroundProgram, Image, Repeat, Size},
            CssBackgroundResultRecord as Result,
        };
        let entries = resolved(
            "background-repeat: round; color: red; background: url(a.svg) lime;
             color: blue; background-size: 2em auto; background-image: linear-gradient(currentColor, white);
             color: black; background-repeat: space; background-color: #123456; background: invalid",
            false,
        );
        assert_eq!(
            entries.iter().map(|(name, _)| name.as_str()).collect::<Vec<_>>(),
            ["color", "color", "color", "background-values"]
        );
        let fields = &entries[3].1;
        let mut program = BackgroundProgram::default();
        let result = program.apply_mobile_batch(&fields.join("\0"), 0xff998877).unwrap();
        assert_eq!(result[Result::LAYERS_CHANGED], 1);
        assert_eq!(result[Result::IMAGES_REPLACED], 1);
        assert_eq!(result[Result::COLOR], 0xff123456);
        assert_eq!(result[Result::COLOR_FROM_SHORTHAND], 0);
        assert_eq!(fields[result[Result::SHORTHAND_VALUE] as usize], "url(a.svg) lime");
        let layer = &program.layers()[0];
        assert_eq!(layer.repeat, [Repeat::Space; 2]);
        assert!(matches!(layer.size, Some(Size::Explicit([Some(_), None]))));
        let Some(Image::Gradient(Some(gradient))) = &layer.image else {
            panic!("Expected the later image to replace the shorthand");
        };
        assert_eq!(gradient.stops[0].color, 0xff0000ff);
        assert_eq!(resolved("background-color: red", false)[0].0, "background-color");
    }

    #[test]
    fn compiles_ordered_css_and_preserves_nested_and_escaped_data() {
        let input = r#"/* comment:; */ DISPLAY: INLINE-GRID; bad;
            background-image: url(data:image/svg+xml;<svg style="a:b;c:d">[</svg>);
            font-family: "A\";B:C", serif; overflow: hidden auto;
            display: block; width: calc(2px + 1vw); ignored: {a:b;c:d};"#;
        assert_eq!(
            compile(input),
            [
                "display",
                "INLINE-GRID",
                "1",
                "7",
                "background-image",
                r#"url(data:image/svg+xml;<svg style="a:b;c:d">[</svg>)"#,
                "0",
                "font-family",
                r#""A\";B:C", serif"#,
                "2",
                r#"A";B:C"#,
                "serif",
                "overflow",
                "hidden auto",
                "2",
                "1",
                "4",
                "display",
                "block",
                "1",
                "3",
                "width",
                "calc(2px + 1vw)",
                "0",
                "ignored",
                "{a:b;c:d}",
                "0",
            ]
        );
        assert_eq!(
            compile("display:block; color:rgb("),
            ["display", "block", "1", "3"]
        );
    }

    #[test]
    fn replays_context_free_layout_shorthands_with_native_keyword_codes() {
        assert_eq!(
            compile("place-items:flex-end stretch; flex-flow:wrap; list-style:square inside"),
            [
                "align-items",
                "flex-end",
                "1",
                "1",
                "justify-items",
                "stretch",
                "1",
                "4",
                "flex-direction",
                "row",
                "1",
                "0",
                "flex-wrap",
                "wrap",
                "1",
                "1",
                "list-style-type",
                "square",
                "1",
                "4",
                "list-style-position",
                "inside",
                "1",
                "1",
            ]
        );
    }
}
