//! CSS clip-path values. Geometry is evaluated against the renderer's reference box.
use super::{layout_shorthand::four_sides, position::{parse_position_components, Axis}, length::{Component, LiteralLength}, LengthContext};
use super::svg_path::parse_svg_path;
use cssparser::{Parser, ParserInput, Token};

#[derive(Clone, Copy, Debug, Default, PartialEq)]
#[repr(u8)]
pub enum GeometryBox {
    #[default]
    Border,
    Padding,
    Content,
    Margin,
}

impl GeometryBox {
    fn parse(name: &str) -> Option<Self> {
        Some(match name.to_ascii_lowercase().as_str() {
            "border-box" | "fill-box" | "stroke-box" | "view-box" => Self::Border,
            "padding-box" => Self::Padding,
            "content-box" => Self::Content,
            "margin-box" => Self::Margin,
            _ => return None,
        })
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Radius {
    Length(Axis),
    ClosestSide,
    FarthestSide,
    ClosestCorner,
    FarthestCorner,
}

impl Radius {
    fn parse(token: &Component<'_>) -> Option<Self> {
        if let Some(Token::Ident(name)) = token.literal() {
            return Some(match name.to_ascii_lowercase().as_str() {
                "closest-side" => Self::ClosestSide,
                "farthest-side" => Self::FarthestSide,
                "closest-corner" => Self::ClosestCorner,
                "farthest-corner" => Self::FarthestCorner,
                _ => return None,
            });
        }
        nonnegative_length(token).map(Self::Length)
    }

    fn kind(&self) -> f64 {
        match self {
            Self::Length(_) => 0.,
            Self::ClosestSide => 1.,
            Self::FarthestSide => 2.,
            Self::ClosestCorner => 3.,
            Self::FarthestCorner => 4.,
        }
    }

    fn offset(&self) -> Option<&Axis> {
        match self {
            Self::Length(value) => Some(value),
            _ => None,
        }
    }
}

type Corners = Option<[Axis; 8]>;

#[derive(Clone, Debug, PartialEq)]
pub enum Shape {
    Box,
    Inset([Axis; 4], Corners),
    Rect([Option<Axis>; 4], Corners),
    Xywh([Axis; 4], Corners),
    Circle(Radius, Option<[Axis; 2]>),
    Ellipse([Radius; 2], Option<[Axis; 2]>),
    Polygon { even_odd: bool, points: Box<[[Axis; 2]]> },
    Path { even_odd: bool, commands: Box<[f64]> },
}

#[derive(Clone, Debug, PartialEq)]
pub struct ClipPath {
    pub reference: GeometryBox,
    pub shape: Shape,
}

impl ClipPath {
    pub fn parse(value: &str) -> Option<Self> {
        let mut input = ParserInput::new(value);
        let mut parser = Parser::new(&mut input);
        let mut reference = None;
        let mut shape = None;
        while !parser.is_exhausted() {
            let start = parser.position();
            match parser.next().ok()?.clone() {
                Token::Ident(name) if reference.is_none() => {
                    reference = Some(GeometryBox::parse(&name)?);
                }
                Token::Function(name) if shape.is_none() => {
                    shape = parser.parse_nested_block(|body| -> Result<_, cssparser::ParseError<'_, ()>> {
                        let mut tokens = Vec::new();
                        while !body.is_exhausted() {
                            tokens.push(Component::read(body)?);
                        }
                        read_shape(&name, &tokens).ok_or_else(|| body.new_custom_error(()))
                    }).ok();
                    shape.as_ref()?;
                    if !parser.slice_from(start).ends_with(')') {
                        return None;
                    }
                }
                _ => return None,
            }
        }
        if reference.is_none() && shape.is_none() {
            return None;
        }
        Some(Self {
            reference: reference.unwrap_or_default(),
            shape: shape.unwrap_or(Shape::Box),
        })
    }

    /// Index of the length pair in the numeric projection, excluding the header.
    pub fn offset(&self, index: usize) -> Option<&Axis> {
        match &self.shape {
            Shape::Inset(sides, radii) | Shape::Xywh(sides, radii) => {
                sides.get(index).or_else(|| radii.as_ref()?.get(index.checked_sub(4)?))
            }
            Shape::Rect(sides, radii) => {
                sides.get(index).and_then(Option::as_ref)
                    .or_else(|| radii.as_ref()?.get(index.checked_sub(4)?))
            }
            Shape::Circle(radius, center) => {
                if index == 2 { radius.offset() } else { center.as_ref()?.get(index) }
            }
            Shape::Ellipse(radii, center) => {
                if index >= 2 { radii.get(index - 2)?.offset() } else { center.as_ref()?.get(index) }
            }
            Shape::Polygon { points, .. } => points.get(index / 2).map(|p| &p[index % 2]),
            _ => None,
        }
    }

    /// The header identifies the shape and reference box. Length pairs after it
    /// are a fraction of the relevant axis and an absolute value in output units.
    pub fn records(&self, context: LengthContext) -> Vec<f64> {
        use super::ClipPathRecord as Record;
        let mut header = [0.; Record::STRIDE];
        header[Record::BOX] = self.reference as u8 as f64;
        let mut out = Vec::new();
        let mut length_count = 0;
        header[Record::KIND] = match &self.shape {
            Shape::Box => 0.,
            Shape::Inset(_, radii) | Shape::Rect(_, radii) | Shape::Xywh(_, radii) => {
                length_count = if radii.is_some() { 12 } else { 4 };
                match &self.shape {
                    Shape::Inset(..) => 1.,
                    Shape::Rect(..) => 2.,
                    _ => 3.,
                }
            }
            Shape::Circle(radius, center) => {
                header[Record::HAS_POSITION] = u8::from(center.is_some()).into();
                header[Record::RADIUS_X_KIND] = radius.kind();
                length_count = 3;
                4.
            }
            Shape::Ellipse(radii, center) => {
                header[Record::HAS_POSITION] = u8::from(center.is_some()).into();
                header[Record::RADIUS_X_KIND] = radii[0].kind();
                header[Record::RADIUS_Y_KIND] = radii[1].kind();
                length_count = 4;
                5.
            }
            Shape::Polygon { even_odd, points } => {
                header[Record::EVEN_ODD] = u8::from(*even_odd).into();
                length_count = points.len() * 2;
                6.
            }
            Shape::Path { even_odd, commands } => {
                header[Record::EVEN_ODD] = u8::from(*even_odd).into();
                out.extend_from_slice(commands);
                7.
            }
        };
        let kind = header[Record::KIND];
        for index in 0..length_count {
            let components = if let Some(axis) = self.offset(index) {
                if axis.has_math() {
                    header[Record::HAS_MATH] = 1.;
                }
                pair(axis.components(context))
            } else if kind == 2. && index < 4 {
                [f64::NAN, 0.]
            } else if matches!(kind, 4. | 5.) && index < 2 {
                [0.5, 0.]
            } else {
                [0., 0.]
            };
            out.extend(components);
        }
        header.into_iter().chain(out).collect()
    }
}

fn pair((fraction, pixels): (f32, f32)) -> [f64; 2] {
    [fraction.into(), pixels.into()]
}

fn ident(token: &Component<'_>, expected: &str) -> bool {
    matches!(token.literal(), Some(Token::Ident(name)) if name.eq_ignore_ascii_case(expected))
}

fn nonnegative_length(token: &Component<'_>) -> Option<Axis> {
    if token.literal().and_then(LiteralLength::parse).is_some_and(LiteralLength::is_negative) {
        return None;
    }
    Axis::explicit(token)
}

fn split_round<'t, 'i>(tokens: &'t [Component<'i>]) -> Option<(&'t [Component<'i>], Corners)> {
    let Some(index) = tokens.iter().position(|token| ident(token, "round")) else {
        return Some((tokens, None));
    };
    let mut groups = tokens[index + 1..].split(|token| matches!(token.literal(), Some(Token::Delim('/'))));
    let radii = |tokens: &[Component<'_>]| {
        four_sides(&tokens.iter().map(nonnegative_length).collect::<Option<Vec<_>>>()?)
    };
    let h = radii(groups.next()?)?;
    let v = match groups.next() {
        Some(tokens) => radii(tokens)?,
        None => h.clone(),
    };
    if groups.next().is_some() {
        return None;
    }
    let corners = std::array::from_fn(|i| if i % 2 == 0 { h[i / 2].clone() } else { v[i / 2].clone() });
    Some((&tokens[..index], Some(corners)))
}

fn split_at<'t, 'i>(tokens: &'t [Component<'i>]) -> Option<(&'t [Component<'i>], Option<[Axis; 2]>)> {
    let Some(index) = tokens.iter().position(|token| ident(token, "at")) else {
        return Some((tokens, None));
    };
    let position = &tokens[index + 1..];
    if position.is_empty() || position.len() > 4 {
        return None;
    }
    if let [a, b] = position {
        let vertical_first = a.literal().and_then(super::position::edge).is_some_and(|(axis, _)| axis == 1);
        let horizontal_last = b.literal().and_then(super::position::edge).is_some_and(|(axis, _)| axis == 0);
        if (vertical_first && !matches!(b.literal(), Some(Token::Ident(_))))
            || (horizontal_last && !matches!(a.literal(), Some(Token::Ident(_))))
        {
            return None;
        }
    }
    Some((&tokens[..index], Some(parse_position_components(position)?)))
}

fn fill_rule<'t, 'i>(tokens: &'t [Component<'i>]) -> (bool, &'t [Component<'i>]) {
    match tokens {
        [rule, Component::Literal(Token::Comma), rest @ ..] if ident(rule, "evenodd") => (true, rest),
        [rule, Component::Literal(Token::Comma), rest @ ..] if ident(rule, "nonzero") => (false, rest),
        _ => (false, tokens),
    }
}

fn read_shape(name: &str, tokens: &[Component<'_>]) -> Option<Shape> {
    Some(match name.to_ascii_lowercase().as_str() {
        "inset" => {
            let (values, radii) = split_round(tokens)?;
            let values = values.iter().map(Axis::explicit).collect::<Option<Vec<_>>>()?;
            Shape::Inset(four_sides(&values)?, radii)
        }
        "rect" => {
            let (values, radii) = split_round(tokens)?;
            let comma = |token: &Component<'_>| matches!(token.literal(), Some(Token::Comma));
            let values: Vec<_> = if values.iter().any(comma) {
                values.split(comma)
                    .map(|group| match group { [value] => Some(value), _ => None })
                    .collect::<Option<_>>()?
            } else { values.iter().collect() };
            if values.len() != 4 {
                return None;
            }
            let mut sides = [const { None }; 4];
            for (output, token) in sides.iter_mut().zip(values) {
                if !ident(token, "auto") { *output = Some(Axis::explicit(token)?); }
            }
            Shape::Rect(sides, radii)
        }
        "xywh" => {
            let (values, radii) = split_round(tokens)?;
            let [x, y, w, h] = values else { return None; };
            Shape::Xywh([Axis::explicit(x)?, Axis::explicit(y)?, nonnegative_length(w)?, nonnegative_length(h)?], radii)
        }
        "circle" => {
            let (values, center) = split_at(tokens)?;
            let radius = match values { [] => Radius::ClosestSide, [radius] => Radius::parse(radius)?, _ => return None };
            Shape::Circle(radius, center)
        }
        "ellipse" => {
            let (values, center) = split_at(tokens)?;
            let radii = match values {
                [] => [const { Radius::ClosestSide }; 2],
                [x, y] => [Radius::parse(x)?, Radius::parse(y)?],
                _ => return None,
            };
            Shape::Ellipse(radii, center)
        }
        "polygon" => {
            let (even_odd, tokens) = fill_rule(tokens);
            let points = tokens.split(|token| matches!(token.literal(), Some(Token::Comma)))
                .map(|group| match group {
                    [x, y] => Some([Axis::explicit(x)?, Axis::explicit(y)?]),
                    _ => None,
                }).collect::<Option<_>>()?;
            Shape::Polygon { even_odd, points }
        }
        "path" => {
            let (even_odd, tokens) = fill_rule(tokens);
            let [Component::Literal(Token::QuotedString(data))] = tokens else { return None; };
            let commands = parse_svg_path(data);
            if commands.is_empty() {
                return None;
            }
            Shape::Path { even_odd, commands: commands.into_boxed_slice() }
        }
        _ => return None,
    })
}
