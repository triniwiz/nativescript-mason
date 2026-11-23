use super::{GradientKind, LengthContext};
use crate::style::css::{
    length::{Component, LengthPercentage},
    position::{edge, parse_position_components, Axis},
};
use cssparser::Token;

#[derive(Clone, Copy, Debug, PartialEq)]
pub(super) enum Extent {
    ClosestSide,
    FarthestSide,
    ClosestCorner,
    FarthestCorner,
}

#[derive(Clone, Debug, PartialEq)]
pub(super) enum Geometry {
    Linear {
        angle: f32,
        corner: [f32; 2],
    },
    Radial {
        center: [Axis; 2],
        extent: Extent,
        circle: bool,
        radii: [Option<LengthPercentage>; 2],
    },
    Conic {
        center: [Axis; 2],
        angle: f32,
    },
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct GradientLayout {
    pub angle: f32,
    pub corner: [f32; 2],
    pub center: [f32; 2],
    pub radii: [f32; 2],
}

impl GradientLayout {
    /// Endpoints and length of the CSS gradient line, in the box's output units.
    pub fn linear_line(self, width: f32, height: f32) -> ([f32; 4], f32) {
        let [x, y] = self.corner;
        let diagonal = width.hypot(height);
        let (dx, dy) = if x != 0. && y != 0. && diagonal > 0. {
            (x * height / diagonal, y * width / diagonal)
        } else {
            match self.angle.rem_euclid(360.) {
                0. => (0., -1.),
                90. => (1., 0.),
                180. => (0., 1.),
                270. => (-1., 0.),
                angle => {
                    let (sin, cos) = angle.to_radians().sin_cos();
                    (sin, -cos)
                }
            }
        };
        let length = (width * dx).abs() + (height * dy).abs();
        let half_x = dx * length / 2.;
        let half_y = dy * length / 2.;
        let (cx, cy) = (width / 2., height / 2.);
        ([cx - half_x, cy - half_y, cx + half_x, cy + half_y], length)
    }
}

impl Geometry {
    pub(super) fn layout(&self, width: f32, height: f32, context: LengthContext) -> GradientLayout {
        let mut output = GradientLayout {
            angle: 0.,
            corner: [0.; 2],
            center: [width / 2., height / 2.],
            radii: [0.; 2],
        };
        match self {
            Self::Linear { angle, corner } => {
                output.angle = *angle;
                output.corner = *corner;
            }
            Self::Conic { center, angle } => {
                output.center = [
                    center[0].resolve(width, context),
                    center[1].resolve(height, context),
                ];
                output.angle = *angle;
            }
            Self::Radial {
                center,
                extent,
                circle,
                radii,
            } => {
                let [x, y] = [
                    center[0].resolve(width, context),
                    center[1].resolve(height, context),
                ];
                output.center = [x, y];
                let edges = [[x.abs(), (width - x).abs()], [y.abs(), (height - y).abs()]];
                let closest = matches!(extent, Extent::ClosestSide | Extent::ClosestCorner);
                let [sx, sy] = edges.map(|[a, b]| if closest { a.min(b) } else { a.max(b) });
                let corner = matches!(extent, Extent::ClosestCorner | Extent::FarthestCorner);
                output.radii = if *circle {
                    let radius = radii[0]
                        .as_ref()
                        .and_then(|value| value.resolve(context, width))
                        .unwrap_or_else(|| {
                            if corner {
                                sx.hypot(sy)
                            } else if closest {
                                sx.min(sy)
                            } else {
                                sx.max(sy)
                            }
                        });
                    [radius.max(0.001); 2]
                } else {
                    let factor = if corner { std::f32::consts::SQRT_2 } else { 1. };
                    [
                        radii[0]
                            .as_ref()
                            .and_then(|v| v.resolve(context, width))
                            .unwrap_or(sx * factor)
                            .max(0.001),
                        radii[1]
                            .as_ref()
                            .and_then(|v| v.resolve(context, height))
                            .unwrap_or(sy * factor)
                            .max(0.001),
                    ]
                };
            }
        }
        output
    }
}

fn is_ident(component: &Component<'_>, expected: &str) -> bool {
    matches!(component.literal(), Some(Token::Ident(name)) if name.eq_ignore_ascii_case(expected))
}

pub(super) fn parse(tokens: &[Component<'_>], kind: GradientKind) -> Option<Geometry> {
    Some(match kind {
        GradientKind::Linear => {
            let mut corner = [0.; 2];
            let angle = match tokens {
                [] => 180.,
                [value @ (Component::Literal(Token::Dimension { .. }) | Component::Math(..))] => {
                    value.angle()?
                }
                [to, sides @ ..] if is_ident(to, "to") && (1..=2).contains(&sides.len()) => {
                    for side in sides {
                        let (axis, edge) = edge(side.literal()?)?;
                        if corner[axis] != 0. {
                            return None;
                        }
                        corner[axis] = edge.fraction * 2. - 1.;
                    }
                    let [x, y] = corner;
                    let angle = x.atan2(-y).to_degrees().rem_euclid(360.);
                    if x == 0. || y == 0. {
                        corner = [0.; 2];
                    }
                    angle
                }
                _ => return None,
            };
            Geometry::Linear { angle, corner }
        }
        GradientKind::Radial => {
            let at = tokens
                .iter()
                .position(|token| is_ident(token, "at"))
                .unwrap_or(tokens.len());
            let center = parse_position_components(tokens.get(at + 1..).unwrap_or(&[]))?;
            let mut circle = None;
            let mut extent = None;
            let mut radii = [None, None];
            let mut count = 0;
            for token in &tokens[..at] {
                if let Some(length) = LengthPercentage::parse(token) {
                    *radii.get_mut(count)? = Some(length);
                    count += 1;
                    continue;
                }
                let Some(Token::Ident(name)) = token.literal() else {
                    return None;
                };
                let keyword = name.to_ascii_lowercase();
                if matches!(keyword.as_str(), "circle" | "ellipse") && circle.is_none() {
                    circle = Some(keyword == "circle");
                    continue;
                }
                if extent.is_some() {
                    return None;
                }
                extent = Some(match keyword.as_str() {
                    "closest-side" => Extent::ClosestSide,
                    "farthest-side" => Extent::FarthestSide,
                    "closest-corner" => Extent::ClosestCorner,
                    "farthest-corner" => Extent::FarthestCorner,
                    _ => return None,
                });
            }
            if at < tokens.len() && at + 1 == tokens.len() {
                return None;
            }
            let circle = circle.unwrap_or(count == 1);
            if (circle && count == 2) || (extent.is_some() && count != 0) {
                return None;
            }
            // Legacy declarations with a single ellipse radius use it on both axes.
            if !circle && count == 1 {
                radii[1] = radii[0].clone();
            }
            Geometry::Radial {
                center,
                extent: extent.unwrap_or(Extent::FarthestCorner),
                circle,
                radii,
            }
        }
        GradientKind::Conic => {
            let at = tokens.iter().position(|token| is_ident(token, "at"));
            let from = tokens.iter().position(|token| is_ident(token, "from"));
            let mut angle_value = 0.;
            if let Some(from) = from {
                angle_value = tokens.get(from + 1)?.angle()?;
                if from + 2 != at.unwrap_or(tokens.len()) && from + 2 != tokens.len() {
                    return None;
                }
            }
            let center = if let Some(at) = at {
                let end = from.filter(|&start| start > at).unwrap_or(tokens.len());
                if at + 1 == end {
                    return None;
                }
                parse_position_components(&tokens[at + 1..end])?
            } else {
                [const { Axis::CENTER }; 2]
            };
            if !tokens.is_empty() && at.or(from).is_none() {
                return None;
            }
            Geometry::Conic {
                center,
                angle: angle_value,
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::style::css::gradient::parse_gradient;

    const CONTEXT: LengthContext = LengthContext {
        scale: 2.,
        font_size: 20.,
        root_font_size: 16.,
        viewport_width: 400.,
        viewport_height: 800.,
    };

    fn layout(css: &str) -> GradientLayout {
        parse_gradient(css, 0).unwrap().layout(200., 100., CONTEXT)
    }

    #[test]
    fn linear_corners_and_angles_are_distinct() {
        for (prelude, angle, corner) in [
            ("to bottom right", 135., [1., 1.]),
            ("to left top in oklab", 315., [-1., -1.]),
            ("in oklch to right", 90., [0., 0.]),
            ("135deg", 135., [0., 0.]),
            ("in oklab", 180., [0., 0.]),
            ("100grad", 90., [0., 0.]),
        ] {
            let value = layout(&format!("linear-gradient({prelude}, red, blue)"));
            assert!((value.angle - angle).abs() < 1e-4, "{prelude}: {value:?}");
            assert_eq!(value.corner, corner, "{prelude}");
        }
    }

    #[test]
    fn radial_uses_the_box_and_resolves_css_to_device_lengths() {
        let closest = layout("radial-gradient(circle closest-side at 20% 30%, red, blue)");
        assert!((closest.center[0] - 40.).abs() < 1e-4);
        assert!((closest.center[1] - 30.).abs() < 1e-4);
        assert!((closest.radii[0] - 30.).abs() < 1e-4);
        assert_eq!(closest.radii[0], closest.radii[1]);

        let explicit =
            layout("radial-gradient(ellipse 20px 25% at right 10px bottom 20%, red, blue)");
        assert_eq!(explicit.radii, [40., 25.]);
        assert_eq!(explicit.center, [180., 80.]);

        let default = layout("radial-gradient(red, blue)");
        assert_eq!(
            default.radii,
            [
                100. * std::f32::consts::SQRT_2,
                50. * std::f32::consts::SQRT_2
            ]
        );
    }

    #[test]
    fn conic_resolves_position_before_or_after_start_angle() {
        let one = layout("conic-gradient(from .25turn at left 10px top 20px, red, blue)");
        let two = layout("conic-gradient(at left 10px top 20px from 90deg, red, blue)");
        assert_eq!(one, two);
        assert_eq!(one.angle, 90.);
        assert_eq!(one.center, [20., 40.]);
    }
}
