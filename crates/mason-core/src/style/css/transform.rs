use super::{
    angle_factor,
    length::{self, Component, LengthPercentage as Offset},
    number, CssLengthResultRecord, LengthContext,
};
use cssparser::{Parser, ParserInput, Token};
use std::sync::Arc;

#[derive(Debug, PartialEq)]
struct Matrix {
    values: [f32; 16],
    math: Vec<(usize, Arc<length::Expression>)>,
}

#[derive(Debug, PartialEq)]
enum Transform {
    Translate([Offset; 3]),
    Scale([f32; 3]),
    Rotate([f32; 3], f32),
    Skew(f32, f32),
    Matrix(Matrix),
    Perspective(Option<Offset>),
}

const IDENTITY: [f32; 16] = [
    1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1.,
];

pub(super) type Affine = [f64; 6];
pub(super) const AFFINE_IDENTITY: Affine = [1., 0., 0., 1., 0., 0.];

pub(super) fn multiply_affine(a: Affine, b: Affine) -> Affine {
    [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5],
    ]
}

pub(super) fn rotate_affine(angle: f64) -> Affine {
    let (sin, cos) = angle.sin_cos();
    [cos, sin, -sin, cos, 0., 0.]
}

#[derive(Debug, PartialEq)]
pub struct TransformProgram {
    source: Box<str>,
    ops: Box<[Transform]>,
    uses_box_size: bool,
}

impl TransformProgram {
    pub fn parse(value: &str) -> Option<Self> {
        let ops = parse_transforms(value, false, Transform::from_syntax)?;
        let uses_box_size = ops.iter().any(|op| {
            matches!(op, Transform::Translate([x, y, _]) if x.uses_percentage() || y.uses_percentage())
        });
        Some(Self {
            source: value.into(),
            ops: ops.into_boxed_slice(),
            uses_box_size,
        })
    }

    pub fn source(&self) -> &str {
        &self.source
    }

    pub fn is_empty(&self) -> bool {
        self.ops.is_empty()
    }

    pub fn uses_box_size(&self) -> bool {
        self.uses_box_size
    }

    pub fn matrix(&self, context: LengthContext, width: f32, height: f32) -> [f32; 16] {
        compose_transforms(&self.ops, context, width, height)
    }

    pub fn affine(&self, context: LengthContext, width: f32, height: f32) -> [f32; 6] {
        let m = self.matrix(context, width, height);
        let w = if m[15] == 0. { 1. } else { m[15] };
        [m[0] / w, m[1] / w, m[4] / w, m[5] / w, m[12] / w, m[13] / w]
    }
}

fn raw_number(token: &Token<'_>) -> Option<f32> {
    match token {
        Token::Number { .. } => number(token),
        _ => None,
    }
}

fn finite(value: f64) -> Option<f32> {
    let value = value as f32;
    value.is_finite().then_some(value)
}

impl Component<'_> {
    fn absolute_offset(&self) -> Option<Offset> {
        let offset = Offset::parse(self)?;
        (!offset.uses_percentage()).then_some(offset)
    }

    fn ratio(&self) -> Option<f32> {
        match self {
            Self::Literal(token) => number(token),
            Self::Math(expression, _) => {
                finite(expression.resolve_ratio(LengthContext::for_scale(1.))?)
            }
        }
    }

    fn scalar(&self) -> Option<f32> {
        match self {
            Self::Literal(token) => raw_number(token),
            Self::Math(expression, _) => {
                let fields = expression.resolve(LengthContext::for_scale(1.))?;
                if fields[CssLengthResultRecord::KIND] != 0. {
                    return None;
                }
                finite(fields[CssLengthResultRecord::VALUE])
            }
        }
    }
}

fn matrix<'a>(args: impl IntoIterator<Item = (usize, &'a Component<'a>)>) -> Option<Matrix> {
    let mut values = IDENTITY;
    let mut math = Vec::new();
    for (index, arg) in args {
        match arg {
            Component::Literal(Token::Dimension { value, unit, .. })
                if unit.eq_ignore_ascii_case("px") && value.is_finite() =>
            {
                values[index] = *value;
            }
            Component::Literal(token) => values[index] = raw_number(token)?,
            Component::Math(expression, _) if !expression.uses_percentage() => {
                expression.resolve_length_at(LengthContext::for_scale(1.), 0.)?;
                math.push((index, Arc::clone(expression)));
            }
            Component::Math(..) => return None,
        }
    }
    Some(Matrix { values, math })
}

struct Argument<'i> {
    component: Component<'i>,
    source: &'i str,
}

type Axes<'a, 'i> = [Option<&'a Argument<'i>>; 3];

enum RotationAxis<'a, 'i> {
    X,
    Y,
    Z,
    Custom([&'a Argument<'i>; 3]),
}

enum Syntax<'a, 'i> {
    Translate(Axes<'a, 'i>),
    Scale(Axes<'a, 'i>),
    Rotate(RotationAxis<'a, 'i>, &'a Argument<'i>),
    Skew(Option<&'a Argument<'i>>, Option<&'a Argument<'i>>),
    Matrix(&'a [Argument<'i>]),
    Perspective(Option<&'a Argument<'i>>),
}

const AFFINE_INDICES: [usize; 6] = [0, 1, 4, 5, 12, 13];

fn matrix_arguments<'a, 'i>(
    args: &'a [Argument<'i>],
) -> impl Iterator<Item = (usize, &'a Argument<'i>)> {
    args.iter().enumerate().map(|(index, arg)| {
        let slot = if args.len() == AFFINE_INDICES.len() {
            AFFINE_INDICES[index]
        } else {
            index
        };
        (slot, arg)
    })
}

fn operation<'a, 'i>(name: &str, args: &'a [Argument<'i>]) -> Option<Syntax<'a, 'i>> {
    Some(match (name, args) {
        ("translate" | "translatex", [x]) => Syntax::Translate([Some(x), None, None]),
        ("translate", [x, y]) => Syntax::Translate([Some(x), Some(y), None]),
        ("translatey", [y]) => Syntax::Translate([None, Some(y), None]),
        ("translatez", [z]) => Syntax::Translate([None, None, Some(z)]),
        ("translate3d", [x, y, z]) => Syntax::Translate([Some(x), Some(y), Some(z)]),
        ("scale", [x]) => Syntax::Scale([Some(x), Some(x), None]),
        ("scale", [x, y]) => Syntax::Scale([Some(x), Some(y), None]),
        ("scalex", [x]) => Syntax::Scale([Some(x), None, None]),
        ("scaley", [y]) => Syntax::Scale([None, Some(y), None]),
        ("scalez", [z]) => Syntax::Scale([None, None, Some(z)]),
        ("scale3d", [x, y, z]) => Syntax::Scale([Some(x), Some(y), Some(z)]),
        ("rotate" | "rotatez", [a]) => Syntax::Rotate(RotationAxis::Z, a),
        ("rotatex", [a]) => Syntax::Rotate(RotationAxis::X, a),
        ("rotatey", [a]) => Syntax::Rotate(RotationAxis::Y, a),
        ("rotate3d", [x, y, z, a]) => Syntax::Rotate(RotationAxis::Custom([x, y, z]), a),
        ("skew" | "skewx", [x]) => Syntax::Skew(Some(x), None),
        ("skew", [x, y]) => Syntax::Skew(Some(x), Some(y)),
        ("skewy", [y]) => Syntax::Skew(None, Some(y)),
        ("matrix", [_, _, _, _, _, _]) => Syntax::Matrix(args),
        ("matrix3d", args) if args.len() == 16 => Syntax::Matrix(args),
        ("perspective", [length]) => match &length.component {
            Component::Literal(Token::Ident(name)) if name.eq_ignore_ascii_case("none") => {
                Syntax::Perspective(None)
            }
            _ => Syntax::Perspective(Some(length)),
        },
        _ => return None,
    })
}

fn parse_transforms<'i, T>(
    value: &'i str,
    skip_invalid: bool,
    mut project: impl FnMut(Syntax<'_, 'i>) -> Option<T>,
) -> Option<Vec<T>> {
    let mut input = ParserInput::new(value);
    let mut parser = Parser::new(&mut input);
    if parser.is_exhausted()
        || parser
            .try_parse(|p| {
                p.parse_entirely(|p| {
                    p.expect_ident_matching("none")
                        .map_err(Into::<cssparser::ParseError<'_, ()>>::into)
                })
            })
            .is_ok()
    {
        return Some(Vec::new());
    }

    let mut transforms = Vec::new();
    while !parser.is_exhausted() {
        let token = parser.next().ok()?;
        let Token::Function(name) = token else {
            if skip_invalid {
                continue;
            }
            return None;
        };
        let name = name.to_ascii_lowercase();
        let args = parser.parse_nested_block(|body| {
            let mut args = Vec::new();
            while !body.is_exhausted() {
                body.skip_whitespace();
                let start = body.position();
                let component = Component::read(body)?;
                if matches!(component, Component::Literal(Token::Comma)) {
                    continue;
                }
                args.push(Argument {
                    component,
                    source: body.slice_from(start),
                });
                if args.len() > 16 {
                    return Err(body.new_custom_error::<(), ()>(()));
                }
            }
            Ok(args)
        });
        let parsed = args
            .ok()
            .and_then(|args| operation(&name, &args).and_then(&mut project));
        match parsed {
            Some(transform) => transforms.push(transform),
            None if skip_invalid => {}
            None => return None,
        }
    }
    Some(transforms)
}

fn optional_arg<T>(
    arg: Option<&Argument<'_>>,
    default: T,
    read: impl FnOnce(&Argument<'_>) -> Option<T>,
) -> Option<T> {
    arg.map_or(Some(default), read)
}

impl Transform {
    fn from_syntax(value: Syntax<'_, '_>) -> Option<Self> {
        Some(match value {
            Syntax::Translate([x, y, z]) => Self::Translate([
                optional_arg(x, Offset::ZERO, |arg| Offset::parse(&arg.component))?,
                optional_arg(y, Offset::ZERO, |arg| Offset::parse(&arg.component))?,
                optional_arg(z, Offset::ZERO, |arg| arg.component.absolute_offset())?,
            ]),
            Syntax::Scale([x, y, z]) => Self::Scale([
                optional_arg(x, 1., |arg| arg.component.ratio())?,
                optional_arg(y, 1., |arg| arg.component.ratio())?,
                optional_arg(z, 1., |arg| arg.component.ratio())?,
            ]),
            Syntax::Rotate(axis, angle) => {
                let axis = match axis {
                    RotationAxis::X => [1., 0., 0.],
                    RotationAxis::Y => [0., 1., 0.],
                    RotationAxis::Z => [0., 0., 1.],
                    RotationAxis::Custom([x, y, z]) => [
                        x.component.scalar()?,
                        y.component.scalar()?,
                        z.component.scalar()?,
                    ],
                };
                Self::Rotate(axis, angle.component.angle()?)
            }
            Syntax::Skew(x, y) => Self::Skew(
                optional_arg(x, 0., |arg| arg.component.angle())?,
                optional_arg(y, 0., |arg| arg.component.angle())?,
            ),
            Syntax::Matrix(args) => Self::Matrix(matrix(
                matrix_arguments(args).map(|(index, arg)| (index, &arg.component)),
            )?),
            Syntax::Perspective(length) => Self::Perspective(optional_arg(length, None, |arg| {
                arg.component.absolute_offset().map(Some)
            })?),
        })
    }
}

/// Resolve an angle in radians for the portable helper.
pub fn portable_angle(input: &str) -> Option<f64> {
    let input = input.trim();
    angle_in_radians(&Component::parse(input)?, input)
}

fn angle_in_radians(component: &Component<'_>, source: &str) -> Option<f64> {
    match component {
        Component::Literal(token) => {
            let (value, unit) = length::token_value(token.clone(), source)?;
            if unit == "rad" {
                return Some(value);
            }
            Some((value * angle_factor(&unit).unwrap_or(1.)).to_radians())
        }
        Component::Math(expression, _) => expression
            .resolve_angle(LengthContext::for_scale(1.))
            .map(f64::to_radians),
    }
}

fn portable_offset(
    arg: &Argument<'_>,
    basis: f64,
    resolve_length: &impl Fn(&str) -> Option<f64>,
) -> Option<f64> {
    match &arg.component {
        Component::Literal(token) => {
            let (value, unit) = length::token_value(token.clone(), arg.source)?;
            if unit == "%" {
                Some(value / 100. * basis)
            } else {
                Some(resolve_length(arg.source).unwrap_or(value))
            }
        }
        Component::Math(expression, _) => expression.resolve_portable_length(basis, resolve_length),
    }
}

fn portable_ratio(arg: &Argument<'_>) -> Option<f64> {
    match &arg.component {
        Component::Literal(token) => {
            let (value, unit) = length::token_value(token.clone(), arg.source)?;
            Some(if unit == "%" { value / 100. } else { value })
        }
        Component::Math(expression, _) => expression.resolve_ratio(LengthContext::for_scale(1.)),
    }
}

/// Preserve the portable helper's planar projection of the shared transform grammar.
pub fn portable_affine(
    input: &str,
    width: f64,
    height: f64,
    resolve_length: impl Fn(&str) -> Option<f64>,
) -> Option<[f64; 6]> {
    let matrices = parse_transforms(input, true, |syntax| {
        Some(match syntax {
            Syntax::Translate([x, y, _]) if x.is_some() || y.is_some() => {
                let x = optional_arg(x, 0., |arg| portable_offset(arg, width, &resolve_length))?;
                let y = optional_arg(y, 0., |arg| portable_offset(arg, height, &resolve_length))?;
                [1., 0., 0., 1., x, y]
            }
            Syntax::Scale([x, y, _]) if x.is_some() || y.is_some() => [
                optional_arg(x, 1., portable_ratio)?,
                0.,
                0.,
                optional_arg(y, 1., portable_ratio)?,
                0.,
                0.,
            ],
            Syntax::Rotate(RotationAxis::Z, arg) => {
                rotate_affine(angle_in_radians(&arg.component, arg.source)?)
            }
            Syntax::Skew(x, y) => {
                let skew =
                    |arg: &Argument<'_>| angle_in_radians(&arg.component, arg.source).map(f64::tan);
                [
                    1.,
                    optional_arg(y, 0., skew)?,
                    optional_arg(x, 0., skew)?,
                    1.,
                    0.,
                    0.,
                ]
            }
            Syntax::Matrix(args) => {
                let mut affine = AFFINE_IDENTITY;
                for (index, arg) in matrix_arguments(args) {
                    let Some(slot) = AFFINE_INDICES.iter().position(|&slot| slot == index) else {
                        continue;
                    };
                    affine[slot] = match &arg.component {
                        Component::Literal(token) => {
                            length::token_value(token.clone(), arg.source).map(|(value, _)| value)
                        }
                        Component::Math(expression, _) => {
                            expression.resolve_portable_length(0., &resolve_length)
                        }
                    }
                    .unwrap_or(0.);
                }
                affine
            }
            _ => return None,
        })
    })?;
    (!matrices.is_empty()).then(|| matrices.into_iter().fold(AFFINE_IDENTITY, multiply_affine))
}

impl Transform {
    fn matrix(&self, context: LengthContext, width: f32, height: f32) -> Option<[f32; 16]> {
        let mut m = IDENTITY;
        match self {
            Self::Translate([x, y, z]) => {
                m[12] = x.resolve(context, width)?;
                m[13] = y.resolve(context, height)?;
                m[14] = z.resolve(context, 0.)?;
            }
            Self::Scale([x, y, z]) => {
                m[0] = *x;
                m[5] = *y;
                m[10] = *z;
            }
            Self::Rotate([x, y, z], angle) => {
                let norm = x.hypot(*y).hypot(*z);
                if norm == 0. {
                    return Some(m);
                }
                let (x, y, z) = (x / norm, y / norm, z / norm);
                let (s, c) = angle.to_radians().sin_cos();
                if x == 0. && y == 0. {
                    m[0] = c;
                    m[1] = s * z;
                    m[4] = -s * z;
                    m[5] = c;
                    return Some(m);
                }
                let t = 1. - c;
                m[..12].copy_from_slice(&[
                    c + x * x * t,
                    y * x * t + z * s,
                    z * x * t - y * s,
                    0.,
                    x * y * t - z * s,
                    c + y * y * t,
                    z * y * t + x * s,
                    0.,
                    x * z * t + y * s,
                    y * z * t - x * s,
                    c + z * z * t,
                    0.,
                ]);
            }
            Self::Skew(x, y) => {
                m[4] = x.to_radians().tan();
                m[1] = y.to_radians().tan();
            }
            Self::Matrix(matrix) => {
                m = matrix.values;
                for value in &mut m[12..15] {
                    *value *= context.scale;
                }
                let unit_context = LengthContext {
                    scale: 1.,
                    ..context
                };
                for (index, expression) in &matrix.math {
                    let units = if (12..15).contains(index) {
                        context
                    } else {
                        unit_context
                    };
                    m[*index] = expression.resolve_length_at(units, 0.)?;
                }
            }
            Self::Perspective(length) => {
                if let Some(length) = length {
                    let distance = length.resolve(context, 0.)?;
                    if distance > 0. {
                        m[11] = -1. / distance;
                    }
                }
            }
        }
        Some(m)
    }
}

fn compose_transforms(
    ops: &[Transform],
    context: LengthContext,
    width: f32,
    height: f32,
) -> [f32; 16] {
    ops.iter()
        .filter_map(|op| op.matrix(context, width, height))
        .fold(IDENTITY, |left, right| {
            std::array::from_fn(|index| {
                let (column, row) = (index / 4, index % 4);
                (0..4)
                    .map(|k| left[k * 4 + row] * right[column * 4 + k])
                    .sum()
            })
        })
}
