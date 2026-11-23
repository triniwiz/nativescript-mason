use super::length::{Component, LengthPercentage};
use super::{angle, color, CssLengthResultRecord, GradientInterpolationRecord, LengthContext};
use cssparser::{ParseError, Parser, ParserInput, Token};
use std::ops::Range;

mod geometry;
pub use geometry::GradientLayout;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum GradientKind {
    Linear,
    Radial,
    Conic,
}

#[derive(Clone, Debug, PartialEq)]
enum StopPosition {
    Unspecified,
    Fraction(f32),
    Length(LengthPercentage),
}

impl StopPosition {
    fn unitless(value: f32) -> Self {
        // Mason also accepts unitless fractions and percentages.
        Self::Fraction(if value <= 1. { value } else { value / 100. })
    }

    fn parse(component: &Component<'_>, kind: GradientKind) -> Option<Self> {
        if let Component::Math(expression, _) = component {
            if kind == GradientKind::Conic {
                return Some(Self::Fraction(expression.resolve_angular_position()?));
            }
            if let Some(fields) = expression.resolve(LengthContext::for_scale(1.)) {
                if fields[CssLengthResultRecord::KIND] == 0. {
                    let value = fields[CssLengthResultRecord::VALUE] as f32;
                    return value.is_finite().then(|| Self::unitless(value));
                }
            }
        }
        match component.literal() {
            Some(Token::Percentage { unit_value, .. }) if unit_value.is_finite() => {
                Some(Self::Fraction(*unit_value))
            }
            Some(Token::Number { value, .. }) if value.is_finite() => Some(Self::unitless(*value)),
            Some(token @ Token::Dimension { .. }) if kind == GradientKind::Conic => {
                Some(Self::Fraction(angle(token)? / 360.))
            }
            _ => LengthPercentage::parse(component).map(Self::Length),
        }
    }

    fn resolve(&self, line_length: f32, context: LengthContext) -> Option<f32> {
        match self {
            Self::Unspecified => None,
            Self::Fraction(value) => Some(*value),
            Self::Length(length) if line_length > 0. => {
                Some(length.resolve(context, line_length)? / line_length)
            }
            Self::Length(length) if length.uses_percentage() => {
                let (fraction, pixels) = length.components(context)?;
                (pixels == 0.).then_some(fraction)
            }
            Self::Length(_) => None,
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct GradientStop {
    pub color: u32,
    position: StopPosition,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Interpolation {
    pub space: String,
    pub hue: Option<String>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Gradient {
    pub kind: GradientKind,
    pub repeating: bool,
    /// Coordinates still depend on the renderer's gradient box.
    pub direction: String,
    pub interpolation: Option<Interpolation>,
    pub stops: Box<[GradientStop]>,
    geometry: geometry::Geometry,
    source: Box<str>,
    stop_sources: Box<[(Range<usize>, Option<Range<usize>>)]>,
}

impl Gradient {
    pub fn layout(&self, width: f32, height: f32, context: LengthContext) -> GradientLayout {
        self.geometry.layout(width, height, context)
    }

    /// The author spelling of a stop for clients of the string-based typed API.
    pub fn stop_text(&self, index: usize) -> Option<String> {
        let (color, position) = self.stop_sources.get(index)?;
        let mut text = self.source[color.clone()].to_owned();
        if let Some(position) = position {
            text.push(' ');
            text.push_str(&self.source[position.clone()]);
        }
        Some(text)
    }

    /// Resolve the stops against the gradient line. Values outside 0..1 are
    /// preserved so renderers can tile repeating gradients and clip hard stops.
    pub fn resolve_stops(&self, line_length: f32, context: LengthContext) -> Vec<(u32, f32)> {
        let mut positions: Vec<_> = self
            .stops
            .iter()
            .map(|stop| stop.position.resolve(line_length, context).map(f64::from))
            .collect();
        resolve_stop_positions(&mut positions);
        self.stops
            .iter()
            .zip(positions)
            .map(|(stop, position)| (stop.color, position.unwrap() as f32))
            .collect()
    }
}

pub fn resolve_stop_positions(positions: &mut [Option<f64>]) {
    let Some(first) = positions.first_mut() else {
        return;
    };
    let mut start = *first.get_or_insert(0.);
    positions.last_mut().unwrap().get_or_insert(1.);
    let mut left = 0;
    for right in 1..positions.len() {
        let Some(next) = positions[right] else {
            continue;
        };
        let end = if next.is_nan() || start.is_nan() {
            f64::NAN
        } else {
            next.max(start)
        };
        for (i, position) in positions[left + 1..right].iter_mut().enumerate() {
            *position = Some(start + (end - start) * (i + 1) as f64 / (right - left) as f64);
        }
        positions[right] = Some(end);
        left = right;
        start = end;
    }
}

pub fn double_stop_components(value: &str) -> Option<[&str; 3]> {
    use super::background::{top_level_parts, Part};

    let parts = top_level_parts(value)?;
    if let [Part::Word(color), Part::Word(first), Part::Word(second)] = parts.as_slice() {
        Some([color, first, second])
    } else {
        None
    }
}

pub fn parse_gradient(value: &str, current_color: u32) -> Option<Gradient> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    parser
        .parse_entirely(|parser| {
            let name = parser.expect_function()?.to_ascii_lowercase();
            let (kind, repeating) = match name.as_str() {
                "linear-gradient" => (GradientKind::Linear, false),
                "radial-gradient" => (GradientKind::Radial, false),
                "conic-gradient" => (GradientKind::Conic, false),
                "repeating-linear-gradient" => (GradientKind::Linear, true),
                "repeating-radial-gradient" => (GradientKind::Radial, true),
                "repeating-conic-gradient" => (GradientKind::Conic, true),
                _ => return Err(parser.new_custom_error(())),
            };
            parser.parse_nested_block(|body| {
                let mut direction = String::new();
                let mut interpolation = None;
                let mut geometry = None;
                let mut stops = Vec::new();
                let mut stop_sources = Vec::new();
                let mut first = true;
                body.parse_comma_separated(|part| {
                    if first {
                        first = false;
                        if let Ok((parsed_direction, parsed_interpolation, parsed_geometry)) =
                            part.try_parse(|p| parse_prelude(p, kind))
                        {
                            direction = parsed_direction;
                            interpolation = parsed_interpolation;
                            geometry = Some(parsed_geometry);
                            return Ok(());
                        }
                    }
                    let (color, color_range, positions) = parse_stop(part, kind, current_color)?;
                    if positions.is_empty() {
                        stops.push(GradientStop {
                            color,
                            position: StopPosition::Unspecified,
                        });
                        stop_sources.push((color_range, None));
                    } else {
                        for (position, range) in positions {
                            stops.push(GradientStop { color, position });
                            stop_sources.push((color_range.clone(), Some(range)));
                        }
                    }
                    Ok(())
                })?;
                if stops.is_empty() {
                    return Err(body.new_custom_error(()));
                }
                let geometry = geometry
                    .or_else(|| geometry::parse(&[], kind))
                    .ok_or_else(|| body.new_custom_error(()))?;
                Ok(Gradient {
                    kind,
                    repeating,
                    direction,
                    interpolation,
                    stops: stops.into_boxed_slice(),
                    geometry,
                    source: value.into(),
                    stop_sources: stop_sources.into_boxed_slice(),
                })
            })
        })
        .ok()
}

fn parse_prelude<'i>(
    parser: &mut Parser<'i, '_>,
    kind: GradientKind,
) -> Result<(String, Option<Interpolation>, geometry::Geometry), ParseError<'i, ()>> {
    let prelude = read_prelude(parser)?;
    if prelude.direction.is_empty() && prelude.interpolation.is_none() {
        return Err(parser.new_custom_error(()));
    }
    let geometry = geometry::parse(&prelude.components, kind)
        .ok_or_else(|| parser.new_custom_error(()))?;
    Ok((prelude.direction.join(" "), prelude.interpolation, geometry))
}

struct Prelude<'i> {
    direction: Vec<&'i str>,
    interpolation: Option<Interpolation>,
    components: Vec<Component<'i>>,
}

fn read_prelude<'i>(parser: &mut Parser<'i, '_>) -> Result<Prelude<'i>, ParseError<'i, ()>> {
    let mut prelude = Prelude {
        direction: Vec::new(),
        interpolation: None,
        components: Vec::new(),
    };
    while !parser.is_exhausted() {
        parser.skip_whitespace();
        let start = parser.position();
        let component = Component::read(parser)?;
        if matches!(component.literal(), Some(Token::Ident(name)) if name.eq_ignore_ascii_case("in"))
        {
            if prelude.interpolation.is_some() {
                return Err(parser.new_custom_error(()));
            }
            let space = parser.expect_ident()?.to_ascii_lowercase();
            let hue = parser
                .try_parse(|p| {
                    let method = p.expect_ident()?.to_ascii_lowercase();
                    if !matches!(
                        method.as_str(),
                        "shorter" | "longer" | "increasing" | "decreasing"
                    ) {
                        return Err(p.new_custom_error::<(), ()>(()));
                    }
                    p.expect_ident_matching("hue")?;
                    Ok(method)
                })
                .ok();
            prelude.interpolation = Some(Interpolation { space, hue });
            continue;
        }
        prelude.components.push(component);
        prelude.direction.push(parser.slice_from(start));
    }
    Ok(prelude)
}

pub(super) fn interpolation_fields(value: &str) -> Option<[String; GradientInterpolationRecord::STRIDE]> {
    let mut input = ParserInput::new(value);
    let prelude = read_prelude(&mut Parser::new(&mut input)).ok()?;
    let interpolation = prelude.interpolation?;
    let mut fields = [const { String::new() }; GradientInterpolationRecord::STRIDE];
    fields[GradientInterpolationRecord::DIRECTION] = prelude.direction.join(" ");
    fields[GradientInterpolationRecord::SPACE] = interpolation.space;
    fields[GradientInterpolationRecord::HUE] = interpolation.hue.unwrap_or_default();
    Some(fields)
}

type StopSource = (u32, Range<usize>, Vec<(StopPosition, Range<usize>)>);

fn parse_stop<'i>(
    parser: &mut Parser<'i, '_>,
    kind: GradientKind,
    current_color: u32,
) -> Result<StopSource, ParseError<'i, ()>> {
    parser.skip_whitespace();
    let color_start = parser.position().byte_index();
    let color = color::parse_next(parser, Some(current_color))
        .ok_or_else(|| parser.new_custom_error(()))?;
    let color_end = parser.position().byte_index();
    let mut positions = Vec::new();
    while !parser.is_exhausted() {
        if positions.len() == 2 {
            return Err(parser.new_custom_error(()));
        }
        parser.skip_whitespace();
        let start = parser.position().byte_index();
        let component = Component::read(parser)?;
        let position =
            StopPosition::parse(&component, kind).ok_or_else(|| parser.new_custom_error(()))?;
        positions.push((position, start..parser.position().byte_index()));
    }
    Ok((color, color_start..color_end, positions))
}

#[cfg(test)]
mod tests {
    use super::*;

    const CONTEXT: LengthContext = LengthContext {
        scale: 2.,
        font_size: 20.,
        root_font_size: 16.,
        viewport_width: 400.,
        viewport_height: 800.,
    };

    #[test]
    fn resolves_gradient_math_against_the_current_box() {
        let gradient = parse_gradient(
            "linear-gradient(calc(.5turn - 90deg), red calc(50% - 10px) max(50%, 30px), blue)",
            0,
        )
        .unwrap();
        assert_eq!(gradient.layout(200., 100., CONTEXT).angle, 90.);
        assert_eq!(
            gradient.stop_text(0).as_deref(),
            Some("red calc(50% - 10px)")
        );
        assert_eq!(gradient.stop_text(1).as_deref(), Some("red max(50%, 30px)"));
        assert_eq!(
            gradient.resolve_stops(200., CONTEXT),
            [(0xffff0000, 0.4), (0xffff0000, 0.5), (0xff0000ff, 1.)]
        );
        assert_eq!(
            gradient.resolve_stops(100., CONTEXT),
            [(0xffff0000, 0.3), (0xffff0000, 0.6), (0xff0000ff, 1.)]
        );

        let radial = parse_gradient(
            "radial-gradient(ellipse min(20vw, 50%) calc(25% + 10px) at right calc(10% + 5px) bottom max(2px, 10%), red, blue)",
            0,
        ).unwrap();
        let small = radial.layout(200., 100., CONTEXT);
        let large = radial.layout(400., 200., CONTEXT);
        assert_eq!(small.center, [170., 90.]);
        assert_eq!(small.radii, [100., 45.]);
        assert_eq!(large.center, [350., 180.]);
        assert_eq!(large.radii, [160., 70.]);

        let conic = parse_gradient(
            "conic-gradient(from calc(45deg + .125turn), red calc(90deg + 25%), blue)",
            0,
        )
        .unwrap();
        assert_eq!(conic.layout(200., 100., CONTEXT).angle, 90.);
        assert_eq!(
            conic.resolve_stops(1., CONTEXT),
            [(0xffff0000, 0.5), (0xff0000ff, 1.)]
        );
        assert!(parse_gradient("conic-gradient(red calc(10px + 5%), blue)", 0).is_none());
    }

    #[test]
    fn parses_interpolation_and_nested_colors_with_double_positions() {
        let gradient = parse_gradient(
            "linear-gradient(in oklch longer hue to right, currentColor, rgb(255 0 0 / 50%) 10% 30%, blue)",
            0xff112233,
        ).unwrap();
        assert_eq!(gradient.direction, "to right");
        assert_eq!(
            gradient.stop_text(1).as_deref(),
            Some("rgb(255 0 0 / 50%) 10%")
        );
        assert_eq!(
            gradient.stop_text(2).as_deref(),
            Some("rgb(255 0 0 / 50%) 30%")
        );
        assert_eq!(
            gradient.interpolation.unwrap(),
            Interpolation {
                space: "oklch".into(),
                hue: Some("longer".into())
            }
        );
        assert_eq!(
            gradient.stops.iter().map(|s| s.color).collect::<Vec<_>>(),
            [0xff112233, 0x80ff0000, 0x80ff0000, 0xff0000ff]
        );
    }

    #[test]
    fn resolves_lengths_at_draw_time_and_distributes_missing_stops() {
        let gradient = parse_gradient(
            "radial-gradient(ellipse at 30% 40%, red 1em, green, blue 80%)",
            0,
        )
        .unwrap();
        assert_eq!(gradient.direction, "ellipse at 30% 40%");
        let stops = gradient.resolve_stops(200., CONTEXT);
        assert_eq!(
            stops.iter().map(|stop| stop.1).collect::<Vec<_>>(),
            [0.2, 0.5, 0.8]
        );
        assert_eq!(gradient.resolve_stops(100., CONTEXT)[0].1, 0.4);
    }

    #[test]
    fn repeating_conic_keeps_angles_and_clamps_out_of_order_stops() {
        let gradient = parse_gradient(
            "repeating-conic-gradient(from 90deg at 25% 75%, red -90deg, blue .5turn, green 90deg)",
            0,
        )
        .unwrap();
        assert!(gradient.repeating);
        assert_eq!(gradient.kind, GradientKind::Conic);
        let stops = gradient.resolve_stops(0., CONTEXT);
        assert_eq!(
            stops.iter().map(|stop| stop.1).collect::<Vec<_>>(),
            [-0.25, 0.5, 0.5]
        );
    }
}
