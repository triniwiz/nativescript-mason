use crate::style::css::{length as css_length, LengthContext};
use cssparser::{ParseError, Parser, ParserInput, Token};
use std::collections::HashMap;
use style_atoms::Atom;
use taffy::style_helpers::*;
use taffy::{
    style_helpers::fit_content, style_helpers::fr, style_helpers::length, style_helpers::percent,
    CheapCloneStr, GridPlacement, GridTemplateArea, GridTemplateComponent, GridTemplateRepetition,
    LengthPercentage, MaxTrackSizingFunction, MinMax, MinTrackSizingFunction, RepetitionCount,
    TrackSizingFunction,
};

fn parse_repeat_inner<'i, 't, S: CheapCloneStr>(
    parser: &mut Parser<'i, 't>,
    context: LengthContext,
) -> Result<GridTemplateRepetition<S>, ParseError<'i, ()>> {
    // Parse repetition count (number, string, or ident for auto-fit/auto-fill)
    let count = if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
        RepetitionCount::Count(num as u16)
    } else if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        match ident.as_ref() {
            "auto-fit" => RepetitionCount::AutoFit,
            "auto-fill" => RepetitionCount::AutoFill,
            _ => {
                // Try to parse as number from ident
                if let Ok(num) = ident.parse::<u16>() {
                    RepetitionCount::Count(num)
                } else {
                    return Err(parser.new_custom_error(()));
                }
            }
        }
    } else if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
        // Handle string case like "4"
        if let Ok(num) = string.parse::<u16>() {
            RepetitionCount::Count(num)
        } else {
            match string.as_ref() {
                "auto-fit" => RepetitionCount::AutoFit,
                "auto-fill" => RepetitionCount::AutoFill,
                _ => return Err(parser.new_custom_error(())),
            }
        }
    } else {
        return Err(parser.new_custom_error(()));
    };

    parser.expect_comma()?;

    // Parse tracks inside repeat()
    let mut tracks = vec![];
    let mut line_names = vec![vec![]]; // Start with empty line names before first track

    // The repeat() must contain at least one track
    loop {
        // Try to parse optional line names [name1 name2 ...]
        while let Ok(()) = parser.try_parse(|p| p.expect_square_bracket_block()) {
            parser.parse_nested_block(|p| {
                let mut names = vec![];
                while let Ok(name) = p.try_parse(|p| p.expect_ident_cloned()) {
                    names.push(name.as_ref().into());
                }
                // Add names to the last line_names entry
                if let Some(last) = line_names.last_mut() {
                    last.extend(names);
                }
                Ok(())
            })?;
        }

        // Try to parse a track sizing function
        if let Ok(track) = parser.try_parse(|p| parse_track_size_with_context(p, context)) {
            tracks.push(track);
            // Add new empty vec for line names after this track
            line_names.push(vec![]);
        } else {
            // No more tracks to parse
            break;
        }
    }

    // Must have parsed at least one track
    if tracks.is_empty() {
        return Err(parser.new_custom_error(()));
    }

    Ok(GridTemplateRepetition {
        count,
        tracks,
        line_names,
    })
}

pub fn parse_track_size<'i, 't>(
    parser: &mut Parser<'i, 't>,
    device_scale: f32,
) -> Result<TrackSizingFunction, ParseError<'i, ()>> {
    parse_track_size_with_context(parser, LengthContext::for_scale(device_scale))
}

fn parse_track_size_with_context<'i>(
    parser: &mut Parser<'i, '_>,
    context: LengthContext,
) -> Result<TrackSizingFunction, ParseError<'i, ()>> {
    if parser
        .try_parse(|p| p.expect_function_matching("minmax"))
        .is_ok()
    {
        return parser.parse_nested_block(|parser| {
            let min = parse_min_track_size(parser, context)?;
            parser.expect_comma()?;
            let max = parse_max_track_size(parser, context)?;
            Ok(minmax(min, max))
        });
    }
    if parser
        .try_parse(|p| p.expect_function_matching("fit-content"))
        .is_ok()
    {
        return parser.parse_nested_block(|parser| {
            let (percentage, value) = track_length(parser, context)?;
            Ok(fit_content(if percentage {
                LengthPercentage::percent(value)
            } else {
                LengthPercentage::length(value)
            }))
        });
    }
    if let Ok(keyword) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match keyword.to_ascii_lowercase().as_str() {
            "auto" => Ok(MinMax::AUTO),
            "min-content" => Ok(MinMax::MIN_CONTENT),
            "max-content" => Ok(MinMax::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }
    if let Ok(value) = parser.try_parse(fraction) {
        return Ok(fr(value));
    }
    let (percentage, value) = track_length(parser, context)?;
    Ok(if percentage {
        percent(value)
    } else {
        length(value)
    })
}

fn track_length<'i>(
    parser: &mut Parser<'i, '_>,
    context: LengthContext,
) -> Result<(bool, f32), ParseError<'i, ()>> {
    let [kind, value] = css_length::resolve_component(parser, context)?;
    let amount = if kind == 0. {
        value * f64::from(context.scale)
    } else {
        value
    } as f32;
    amount
        .is_finite()
        .then_some((kind == 2., amount))
        .ok_or_else(|| parser.new_custom_error(()))
}

fn fraction<'i>(parser: &mut Parser<'i, '_>) -> Result<f32, ParseError<'i, ()>> {
    match parser.next()? {
        Token::Dimension { value, unit, .. }
            if unit.eq_ignore_ascii_case("fr") && value.is_finite() =>
        {
            Ok(*value)
        }
        _ => Err(parser.new_custom_error(())),
    }
}

fn parse_min_track_size<'i>(
    parser: &mut Parser<'i, '_>,
    context: LengthContext,
) -> Result<MinTrackSizingFunction, ParseError<'i, ()>> {
    if let Ok(keyword) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match keyword.to_ascii_lowercase().as_str() {
            "auto" => Ok(MinTrackSizingFunction::AUTO),
            "min-content" => Ok(MinTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MinTrackSizingFunction::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }
    let (percentage, value) = track_length(parser, context)?;
    Ok(if percentage {
        MinTrackSizingFunction::percent(value)
    } else {
        MinTrackSizingFunction::length(value)
    })
}

fn parse_max_track_size<'i>(
    parser: &mut Parser<'i, '_>,
    context: LengthContext,
) -> Result<MaxTrackSizingFunction, ParseError<'i, ()>> {
    if let Ok(keyword) = parser.try_parse(|p| p.expect_ident_cloned()) {
        return match keyword.to_ascii_lowercase().as_str() {
            "auto" => Ok(MaxTrackSizingFunction::AUTO),
            "min-content" => Ok(MaxTrackSizingFunction::MIN_CONTENT),
            "max-content" => Ok(MaxTrackSizingFunction::MAX_CONTENT),
            _ => Err(parser.new_custom_error(())),
        };
    }
    if let Ok(value) = parser.try_parse(fraction) {
        return Ok(MaxTrackSizingFunction::fr(value));
    }
    let (percentage, value) = track_length(parser, context)?;
    Ok(if percentage {
        MaxTrackSizingFunction::percent(value)
    } else {
        MaxTrackSizingFunction::length(value)
    })
}

/// Parses a full grid-template string (rows or columns)
pub fn parse_grid_template<S: CheapCloneStr>(
    input: &str,
    device_scale: f32,
) -> Result<(Vec<GridTemplateComponent<S>>, Vec<Vec<S>>), ParseError<'_, ()>> {
    parse_grid_template_with_context(input, LengthContext::for_scale(device_scale))
}

pub(crate) fn parse_grid_template_with_context<S: CheapCloneStr>(
    input: &str,
    context: LengthContext,
) -> Result<(Vec<GridTemplateComponent<S>>, Vec<Vec<S>>), ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut components: Vec<GridTemplateComponent<S>> = Vec::new();
    let mut all_line_names: Vec<Vec<S>> = Vec::new(); // NEW: Track all line names

    // One line name set per line between components, plus the final line; the repeat()
    // and single-track components carry no names of their own outside repeat().
    loop {
        parser.skip_whitespace();
        let mut names = Vec::<S>::new();
        while parser
            .try_parse(|p| p.expect_square_bracket_block())
            .is_ok()
        {
            let parsed_names = parser.parse_nested_block(|p| {
                let mut inner = Vec::new();
                while let Ok(name) = p.expect_ident_cloned() {
                    inner.push(name.as_ref().into());
                }
                Ok(inner)
            })?;
            names.extend(parsed_names);
            parser.skip_whitespace();
        }

        if parser.is_exhausted() {
            all_line_names.push(names);
            break;
        }

        if parser
            .try_parse(|p| p.expect_function_matching("repeat"))
            .is_ok()
        {
            let repetition = parser.parse_nested_block(|p| parse_repeat_inner(p, context))?;
            all_line_names.push(names);
            components.push(GridTemplateComponent::Repeat(repetition));
            continue;
        }

        let track = parse_track_size_with_context(&mut parser, context)?;
        all_line_names.push(names);
        // A repeat of one keeps every component the same shape.
        components.push(GridTemplateComponent::Repeat(GridTemplateRepetition {
            count: RepetitionCount::Count(1),
            tracks: vec![track],
            line_names: Vec::new(),
        }));
    }

    Ok((components, all_line_names))
}

#[derive(Debug, Clone, PartialEq)]
pub struct GridTemplateAreasParseResult<S: CheapCloneStr> {
    pub areas: Vec<GridTemplateArea<S>>,
    pub row_count: u16,
    pub column_count: u16,
}

pub fn parse_grid_template_areas<S: CheapCloneStr>(
    input: &str,
) -> Result<GridTemplateAreasParseResult<S>, ParseError<'_, ()>>
where
    S: std::hash::Hash,
{
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut areas: Vec<GridTemplateArea<S>> = Vec::new();
    let mut map: HashMap<S, (u16, u16, u16, u16)> = HashMap::new();

    let mut row_index: u16 = 0;
    let mut column_count: u16 = 0;

    while let Ok(token) = parser.next_including_whitespace() {
        match token {
            Token::Ident(ref ident) if ident.eq_ignore_ascii_case("none") => {
                return Ok(GridTemplateAreasParseResult {
                    areas: vec![],
                    row_count: 0,
                    column_count: 0,
                });
            }

            Token::QuotedString(row) => {
                let cols: Vec<&str> = row.split_whitespace().collect();
                if cols.is_empty() {
                    continue;
                }

                let cols_len = cols.len() as u16;
                if column_count == 0 {
                    column_count = cols_len;
                } else if column_count != cols_len {
                    return Err(parser.new_custom_error(()));
                }

                for (col_index, &name) in cols.iter().enumerate() {
                    if name == "." {
                        continue;
                    }

                    let key: S = name.into();
                    let row_start = row_index + 1;
                    let row_end = row_start + 1;
                    let col_start = col_index as u16 + 1;
                    let col_end = col_start + 1;

                    map.entry(key.clone())
                        .and_modify(|e| {
                            e.0 = e.0.min(row_start);
                            e.1 = e.1.max(row_end);
                            e.2 = e.2.min(col_start);
                            e.3 = e.3.max(col_end);
                        })
                        .or_insert((row_start, row_end, col_start, col_end));
                }

                row_index += 1;
            }

            Token::WhiteSpace(_) => {}

            Token::Semicolon => break, // declaration ends here (correct!)

            _ => return Err(parser.new_custom_error(())),
        }
    }

    for (name, (row_start, row_end, col_start, col_end)) in map {
        areas.push(GridTemplateArea {
            name,
            row_start,
            row_end,
            column_start: col_start,
            column_end: col_end,
        });
    }

    Ok(GridTemplateAreasParseResult {
        areas,
        row_count: row_index,
        column_count,
    })
}

/// Parses `grid-auto-columns` or `grid-auto-rows`: a whitespace-separated track list,
/// e.g. "100px 1fr minmax(50px, 200px)". Commas between tracks are accepted too.
pub fn parse_grid_auto_tracks(
    input: &str,
    device_scale: f32,
) -> Result<Vec<TrackSizingFunction>, ParseError<'_, ()>> {
    parse_grid_auto_tracks_with_context(input, LengthContext::for_scale(device_scale))
}

pub(crate) fn parse_grid_auto_tracks_with_context(
    input: &str,
    context: LengthContext,
) -> Result<Vec<TrackSizingFunction>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut tracks = Vec::new();

    loop {
        parser.skip_whitespace();
        if parser.is_exhausted() {
            break;
        }
        tracks.push(parse_track_size_with_context(&mut parser, context)?);
        parser.skip_whitespace();
        let _ = parser.try_parse(|p| p.expect_comma());
    }

    if tracks.is_empty() {
        return Err(parser.new_custom_error(()));
    }
    Ok(tracks)
}

// Parse a single `grid-placement` value (used for grid-column-start, etc.)
// Names are kept as written: taffy matches the exact line name first, then the
// implicit `<name>-start` / `<name>-end` lines of a grid area.
fn parse_grid_placement_with_parser<'i, 't, S: CheapCloneStr>(
    parser: &mut Parser<'i, 't>,
) -> Result<GridPlacement<S>, ParseError<'i, ()>> {
    parser.skip_whitespace();

    // auto
    if parser
        .try_parse(|p| p.expect_ident_matching("auto"))
        .is_ok()
    {
        return Ok(GridPlacement::Auto);
    }

    // span <integer>? | span <ident> <integer>?
    if parser
        .try_parse(|p| p.expect_ident_matching("span"))
        .is_ok()
    {
        parser.skip_whitespace();

        // span 3
        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::Span(num as u16));
        }

        // span <name> [<integer>]?
        if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
            let name = ident.as_ref().into();

            if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
                return Ok(GridPlacement::NamedSpan(name, num as u16));
            }

            // default = 0
            return Ok(GridPlacement::NamedSpan(name, 0));
        }

        // span "string" [<integer>]?
        if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
            let name = string.as_ref().into();

            if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
                return Ok(GridPlacement::NamedSpan(name, num as u16));
            }

            return Ok(GridPlacement::NamedSpan(name, 0));
        }

        return Ok(GridPlacement::Span(1));
    }

    // <integer>
    if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
        return Ok(GridPlacement::from_line_index(num as i16));
    }

    // <ident> [<integer>]?
    if let Ok(ident) = parser.try_parse(|p| p.expect_ident_cloned()) {
        let name = ident.as_ref().into();

        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::NamedLine(name, num as i16));
        }

        // default = 0 (correct)
        return Ok(GridPlacement::NamedLine(name, 0));
    }

    // "string" [<integer>]?
    if let Ok(string) = parser.try_parse(|p| p.expect_string_cloned()) {
        let name = string.as_ref().into();

        if let Ok(num) = parser.try_parse(|p| p.expect_integer()) {
            return Ok(GridPlacement::NamedLine(name, num as i16));
        }

        // default = 0 (correct)
        return Ok(GridPlacement::NamedLine(name, 0));
    }

    Ok(GridPlacement::Auto)
}

pub fn parse_grid_placement<S: CheapCloneStr>(
    input: &str,
) -> Result<GridPlacement<S>, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    parse_grid_placement_with_parser(&mut parser)
}

/// The value an omitted end takes: a lone `<custom-ident>` start repeats, anything else is `auto`.
fn omitted_end<S: CheapCloneStr>(start: &GridPlacement<S>) -> GridPlacement<S> {
    if copies_start(start) {
        start.clone()
    } else {
        GridPlacement::Auto
    }
}

fn copies_start<S: CheapCloneStr>(start: &GridPlacement<S>) -> bool {
    matches!(start, GridPlacement::NamedLine(_, 0))
}

/// Preserve each authored component for the longhand cascade and use the same
/// omitted-end rules as the typed grid parser.
pub(crate) fn expand_grid_placement(input: &str, count: usize) -> Option<Vec<String>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut parts = Vec::with_capacity(count);
    loop {
        parser.skip_whitespace();
        let start = parser.position();
        let placement = parse_grid_placement_with_parser::<Atom>(&mut parser).ok()?;
        let text = parser.slice_from(start).trim_end();
        if text.is_empty() {
            return None;
        }
        parts.push((text, copies_start(&placement)));
        if parser.is_exhausted() {
            break;
        }
        if parts.len() == count || parser.expect_delim('/').is_err() {
            return None;
        }
    }
    while parts.len() < count {
        let offset = if count == 4 { 2 } else { 1 };
        let (text, copy) = parts[parts.len().saturating_sub(offset)];
        parts.push(if copy { (text, true) } else { ("auto", false) });
    }
    Some(parts.into_iter().map(|(text, _)| text.to_owned()).collect())
}

/// Parse `grid-column` or `grid-row` shorthand
pub fn parse_grid_placement_shorthand<S: CheapCloneStr>(
    input: &str,
) -> Result<(GridPlacement<S>, GridPlacement<S>), ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let start = parse_grid_placement_with_parser(&mut parser)?;
    parser.skip_whitespace();
    let end = if parser.try_parse(|p| p.expect_delim('/')).is_ok() {
        parser.skip_whitespace();
        parse_grid_placement_with_parser(&mut parser)?
    } else {
        omitted_end(&start)
    };
    Ok((start, end))
}

#[derive(Debug, Clone, PartialEq)]
pub struct GridAreaPosition {
    pub row_start: GridPlacement<Atom>,
    pub column_start: GridPlacement<Atom>,
    pub row_end: GridPlacement<Atom>,
    pub column_end: GridPlacement<Atom>,
}

/// Parse `grid-area` shorthand (row-start / column-start / row-end / column-end)
pub fn parse_grid_area(input: &str) -> Result<GridAreaPosition, ParseError<'_, ()>> {
    let mut input = ParserInput::new(input);
    let mut parser = Parser::new(&mut input);
    let mut parts: Vec<GridPlacement<Atom>> = Vec::new();

    loop {
        parser.skip_whitespace();
        if parser.is_exhausted() {
            break;
        }

        parts.push(parse_grid_placement_with_parser(&mut parser)?);
        parser.skip_whitespace();

        // placements are separated by '/', stop if there's no more separator
        if parser.try_parse(|p| p.expect_delim('/')).is_ok() {
            continue;
        } else {
            break;
        }
    }

    if parts.is_empty() || parts.len() > 4 {
        return Ok(GridAreaPosition {
            row_start: GridPlacement::Auto,
            column_start: GridPlacement::Auto,
            row_end: GridPlacement::Auto,
            column_end: GridPlacement::Auto,
        });
    }
    // Omitted values copy their start counterpart (row-end from row-start, ...).
    let row_start = parts[0].clone();
    let column_start = parts
        .get(1)
        .cloned()
        .unwrap_or_else(|| omitted_end(&row_start));
    let row_end = parts
        .get(2)
        .cloned()
        .unwrap_or_else(|| omitted_end(&row_start));
    let column_end = parts
        .get(3)
        .cloned()
        .unwrap_or_else(|| omitted_end(&column_start));
    Ok(GridAreaPosition {
        row_start,
        column_start,
        row_end,
        column_end,
    })
}
