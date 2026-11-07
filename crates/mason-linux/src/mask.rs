//! clip-path, mask-* and mask-border / border-image from the JSON mask-spec.ts builds.

use crate::css::{self, Image, Layer, LayerSize, Len};
use crate::element::Element;
use crate::paint::{self, BoxGeometry};
use gtk::prelude::*;
use gtk::{cairo, gdk, glib, graphene, gsk};
use serde_json::Value;
use std::cell::Cell;

pub enum Shape {
    Box(u8),
    Inset {
        b: u8,
        sides: [Len; 4],
        radii: [(Len, Len); 4],
    },
    /// Circle (one radius) or ellipse; radius kind 0 length, 1 closest-side, 2 farthest-side.
    Ellipse {
        b: u8,
        cx: Len,
        cy: Len,
        radii: Vec<(u8, Len)>,
    },
    Polygon {
        b: u8,
        points: Vec<(Len, Len)>,
        even_odd: bool,
    },
    Path {
        b: u8,
        commands: Vec<f32>,
        even_odd: bool,
    },
}

pub struct MaskLayer {
    pub layer: Layer,
    /// 0 match-source, 1 alpha, 2 luminance.
    pub mode: u8,
    /// 0 add, 1 subtract, 2 intersect, 3 exclude.
    pub composite: u8,
}

pub struct NineSlice {
    pub image: Image,
    /// Slice per side (top, right, bottom, left): value and whether it's a percentage.
    pub slice: [(f32, bool); 4],
    pub fill: bool,
    /// Width per side: (kind, a, b), kind 0 multiple of the border width, 1 px + %, 2 auto.
    pub widths: [(u8, f32, f32); 4],
    /// Outset per side: (kind, value), kind 0 multiple of the border width, 1 px.
    pub outset: [(u8, f32); 4],
    /// 0 repeat, 2 space, 3 round, 4 stretch, per axis.
    pub repeat: (u8, u8),
    pub luminance: bool,
}

#[derive(Default)]
pub struct MaskSpec {
    pub layers: Vec<MaskLayer>,
    pub clip: Option<Shape>,
    pub border: Option<NineSlice>,
}

impl MaskSpec {
    pub fn is_empty(&self) -> bool {
        self.layers.iter().all(|l| l.layer.image.is_none())
            && self.clip.is_none()
            && self.border.is_none()
    }
}

fn f(v: &Value) -> f32 {
    v.as_f64().unwrap_or(0.0) as f32
}

fn lens(v: &[Value]) -> Vec<Len> {
    v.chunks(2)
        .map(|c| Len {
            px: f(&c[0]),
            pct: c.get(1).map_or(0.0, f),
        })
        .collect()
}

fn shape_of(v: &Value) -> Option<Shape> {
    let b = v.get("b").and_then(Value::as_u64).unwrap_or(0) as u8;
    let values = v
        .get("v")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let even_odd = v.get("e").and_then(Value::as_bool).unwrap_or(false);
    match v.get("s").and_then(Value::as_u64)? {
        0 => Some(Shape::Box(b)),
        1 if values.len() >= 24 => {
            let l = lens(&values);
            let radii = [(l[4], l[5]), (l[6], l[7]), (l[8], l[9]), (l[10], l[11])];
            Some(Shape::Inset {
                b,
                sides: [l[0], l[1], l[2], l[3]],
                radii,
            })
        }
        2 | 3 if values.len() >= 6 => {
            let l = lens(&values);
            let kinds: Vec<u8> = v
                .get("k")
                .and_then(Value::as_array)
                .map(|k| k.iter().map(|x| x.as_u64().unwrap_or(0) as u8).collect())
                .unwrap_or_default();
            let radii = l[2..]
                .iter()
                .enumerate()
                .map(|(i, r)| (kinds.get(i).copied().unwrap_or(1), *r))
                .collect();
            Some(Shape::Ellipse {
                b,
                cx: l[0],
                cy: l[1],
                radii,
            })
        }
        4 => {
            let l = lens(&values);
            Some(Shape::Polygon {
                b,
                points: l
                    .chunks(2)
                    .filter(|c| c.len() == 2)
                    .map(|c| (c[0], c[1]))
                    .collect(),
                even_odd,
            })
        }
        5 => {
            let commands = v
                .get("pc")
                .and_then(Value::as_array)
                .map(|a| a.iter().map(f).collect())
                .unwrap_or_default();
            Some(Shape::Path {
                b,
                commands,
                even_odd,
            })
        }
        _ => None,
    }
}

fn nine_slice_of(v: &Value) -> Option<NineSlice> {
    let image = css::image_of(v.get("i")?)?;
    let nums = |key: &str| {
        v.get(key)
            .and_then(Value::as_array)
            .map(|a| a.iter().map(f).collect::<Vec<f32>>())
            .unwrap_or_default()
    };
    let sl = nums("sl");
    let w = nums("w");
    let o = nums("o");
    let at = |a: &[f32], i: usize| a.get(i).copied().unwrap_or(0.0);
    let repeat = v.get("r").and_then(Value::as_array).map_or((4, 4), |r| {
        (
            r.first().and_then(Value::as_u64).unwrap_or(4) as u8,
            r.get(1).and_then(Value::as_u64).unwrap_or(4) as u8,
        )
    });
    Some(NineSlice {
        image,
        slice: std::array::from_fn(|i| (at(&sl, i * 2), at(&sl, i * 2 + 1) != 0.0)),
        fill: v.get("f").and_then(Value::as_bool).unwrap_or(false),
        widths: std::array::from_fn(|i| {
            (at(&w, i * 3) as u8, at(&w, i * 3 + 1), at(&w, i * 3 + 2))
        }),
        outset: std::array::from_fn(|i| (at(&o, i * 2) as u8, at(&o, i * 2 + 1))),
        repeat,
        luminance: v.get("lum").and_then(Value::as_bool).unwrap_or(false),
    })
}

/// `{ l?: [layer + m, k], cp?: shape, mb?: nine-slice }`; '' clears.
pub fn parse_mask(spec: &str) -> Option<MaskSpec> {
    let root: Value = serde_json::from_str(spec).ok()?;
    let layers = root
        .get("l")
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .map(|l| MaskLayer {
                    layer: css::layer_of(l),
                    mode: l.get("m").and_then(Value::as_u64).unwrap_or(0) as u8,
                    composite: l.get("k").and_then(Value::as_u64).unwrap_or(0) as u8,
                })
                .collect()
        })
        .unwrap_or_default();
    let spec = MaskSpec {
        layers,
        clip: root.get("cp").and_then(shape_of),
        border: root.get("mb").and_then(nine_slice_of),
    };
    (!spec.is_empty()).then_some(spec)
}

/// border-image: `{ mb: nine-slice }`.
pub fn parse_border_image(spec: &str) -> Option<NineSlice> {
    let root: Value = serde_json::from_str(spec).ok()?;
    nine_slice_of(root.get("mb")?)
}

pub enum PathOp {
    Move(f32, f32),
    Line(f32, f32),
    Cubic(f32, f32, f32, f32, f32, f32),
    Close,
}

pub enum Geometry {
    Rounded(gsk::RoundedRect),
    Path(Vec<PathOp>, bool),
}

fn reference(g: &BoxGeometry, b: u8) -> graphene::Rect {
    *g.area(if b > 2 { 0 } else { b }).bounds()
}

pub fn geometry(shape: &Shape, g: &BoxGeometry) -> Geometry {
    match shape {
        Shape::Box(b) => Geometry::Rounded(g.area(if *b > 2 { 0 } else { *b })),
        Shape::Inset { b, sides, radii } => {
            let r = reference(g, *b);
            let (w, h) = (r.width(), r.height());
            let (t, rt, bt, l) = (
                sides[0].resolve(h),
                sides[1].resolve(w),
                sides[2].resolve(h),
                sides[3].resolve(w),
            );
            let rect = graphene::Rect::new(
                r.x() + l,
                r.y() + t,
                (w - l - rt).max(0.0),
                (h - t - bt).max(0.0),
            );
            let corner = |c: &(Len, Len)| (c.0.resolve(w).max(0.0), c.1.resolve(h).max(0.0));
            Geometry::Rounded(paint::rounded(
                rect,
                &[
                    corner(&radii[0]),
                    corner(&radii[1]),
                    corner(&radii[2]),
                    corner(&radii[3]),
                ],
            ))
        }
        Shape::Ellipse { b, cx, cy, radii } => {
            let r = reference(g, *b);
            let (w, h) = (r.width(), r.height());
            let (x, y) = (r.x() + cx.resolve(w), r.y() + cy.resolve(h));
            let (dl, dr, dt, db) = (x - r.x(), r.x() + w - x, y - r.y(), r.y() + h - y);
            let resolve = |(kind, len): (u8, Len), axis: Option<bool>| -> f32 {
                match (kind, axis) {
                    (1, None) => dl.min(dr).min(dt).min(db),
                    (2, None) => dl.max(dr).max(dt).max(db),
                    (1, Some(true)) => dl.min(dr),
                    (2, Some(true)) => dl.max(dr),
                    (1, Some(false)) => dt.min(db),
                    (2, Some(false)) => dt.max(db),
                    (_, None) => len.resolve((w * w + h * h).sqrt() / std::f32::consts::SQRT_2),
                    (_, Some(true)) => len.resolve(w),
                    (_, Some(false)) => len.resolve(h),
                }
                .max(0.0)
            };
            let (rx, ry) = if radii.len() >= 2 {
                (
                    resolve(radii[0], Some(true)),
                    resolve(radii[1], Some(false)),
                )
            } else {
                let r = resolve(radii.first().copied().unwrap_or((1, Len::default())), None);
                (r, r)
            };
            let rect = graphene::Rect::new(x - rx, y - ry, rx * 2.0, ry * 2.0);
            Geometry::Rounded(paint::rounded(rect, &[(rx, ry); 4]))
        }
        Shape::Polygon {
            b,
            points,
            even_odd,
        } => {
            let r = reference(g, *b);
            let mut ops: Vec<PathOp> = points
                .iter()
                .enumerate()
                .map(|(i, (px, py))| {
                    let (x, y) = (
                        r.x() + px.resolve(r.width()),
                        r.y() + py.resolve(r.height()),
                    );
                    if i == 0 {
                        PathOp::Move(x, y)
                    } else {
                        PathOp::Line(x, y)
                    }
                })
                .collect();
            ops.push(PathOp::Close);
            Geometry::Path(ops, *even_odd)
        }
        Shape::Path {
            b,
            commands,
            even_odd,
        } => {
            let r = reference(g, *b);
            let (ox, oy) = (r.x(), r.y());
            let mut ops = Vec::new();
            let mut i = 0;
            let (mut cx, mut cy) = (0.0, 0.0);
            while i < commands.len() {
                let op = commands[i] as i32;
                let a = |k: usize| commands.get(i + k).copied().unwrap_or(0.0);
                match op {
                    0 => {
                        ops.push(PathOp::Move(ox + a(1), oy + a(2)));
                        (cx, cy) = (a(1), a(2));
                        i += 3;
                    }
                    1 => {
                        ops.push(PathOp::Line(ox + a(1), oy + a(2)));
                        (cx, cy) = (a(1), a(2));
                        i += 3;
                    }
                    2 => {
                        ops.push(PathOp::Cubic(
                            ox + a(1),
                            oy + a(2),
                            ox + a(3),
                            oy + a(4),
                            ox + a(5),
                            oy + a(6),
                        ));
                        (cx, cy) = (a(5), a(6));
                        i += 7;
                    }
                    3 => {
                        // quadratic as cubic
                        let (qx, qy, x, y) = (a(1), a(2), a(3), a(4));
                        let c1 = (cx + 2.0 / 3.0 * (qx - cx), cy + 2.0 / 3.0 * (qy - cy));
                        let c2 = (x + 2.0 / 3.0 * (qx - x), y + 2.0 / 3.0 * (qy - y));
                        ops.push(PathOp::Cubic(
                            ox + c1.0,
                            oy + c1.1,
                            ox + c2.0,
                            oy + c2.1,
                            ox + x,
                            oy + y,
                        ));
                        (cx, cy) = (x, y);
                        i += 5;
                    }
                    _ => {
                        ops.push(PathOp::Close);
                        i += 1;
                    }
                }
            }
            Geometry::Path(ops, *even_odd)
        }
    }
}

/// A rounded rect as a cairo path (elliptical corners as cubics).
pub fn rounded_path(cr: &cairo::Context, rr: &gsk::RoundedRect) {
    const K: f64 = 0.552_284_75;
    let b = rr.bounds();
    let (x, y, w, h) = (
        b.x() as f64,
        b.y() as f64,
        b.width() as f64,
        b.height() as f64,
    );
    let c = rr.corner();
    let (tl, tr, br, bl) = (&c[0], &c[1], &c[2], &c[3]);
    let s = |z: &graphene::Size| (z.width() as f64, z.height() as f64);
    let ((tlx, tly), (trx, try_), (brx, bry), (blx, bly)) = (s(tl), s(tr), s(br), s(bl));
    cr.new_sub_path();
    cr.move_to(x + tlx, y);
    cr.line_to(x + w - trx, y);
    cr.curve_to(
        x + w - trx + trx * K,
        y,
        x + w,
        y + try_ - try_ * K,
        x + w,
        y + try_,
    );
    cr.line_to(x + w, y + h - bry);
    cr.curve_to(
        x + w,
        y + h - bry + bry * K,
        x + w - brx + brx * K,
        y + h,
        x + w - brx,
        y + h,
    );
    cr.line_to(x + blx, y + h);
    cr.curve_to(
        x + blx - blx * K,
        y + h,
        x,
        y + h - bly + bly * K,
        x,
        y + h - bly,
    );
    cr.line_to(x, y + tly);
    cr.curve_to(x, y + tly - tly * K, x + tlx - tlx * K, y, x + tlx, y);
    cr.close_path();
}

pub fn geometry_path(cr: &cairo::Context, geom: &Geometry) {
    match geom {
        Geometry::Rounded(rr) => {
            cr.set_fill_rule(cairo::FillRule::Winding);
            rounded_path(cr, rr);
        }
        Geometry::Path(ops, even_odd) => {
            cr.set_fill_rule(if *even_odd {
                cairo::FillRule::EvenOdd
            } else {
                cairo::FillRule::Winding
            });
            for op in ops {
                match *op {
                    PathOp::Move(x, y) => cr.move_to(x as f64, y as f64),
                    PathOp::Line(x, y) => cr.line_to(x as f64, y as f64),
                    PathOp::Cubic(a, b, c, d, e, g) => {
                        cr.curve_to(a as f64, b as f64, c as f64, d as f64, e as f64, g as f64)
                    }
                    PathOp::Close => cr.close_path(),
                }
            }
        }
    }
}

/// Whether a point (element coordinates) is inside the clip-path: taps outside go through.
pub fn clip_contains(el: &Element, x: f64, y: f64) -> bool {
    let css = el.css_ref();
    let Some(shape) = css.mask.as_ref().and_then(|m| m.clip.as_ref()) else {
        return true;
    };
    let g = BoxGeometry::of(el);
    match geometry(shape, &g) {
        Geometry::Rounded(rr) => rr.contains_point(graphene::Point::new(x as f32, y as f32)),
        geom => {
            let Ok(surface) = cairo::ImageSurface::create(cairo::Format::A8, 1, 1) else {
                return true;
            };
            let Ok(cr) = cairo::Context::new(&surface) else {
                return true;
            };
            geometry_path(&cr, &geom);
            cr.in_fill(x, y).unwrap_or(true)
        }
    }
}

// Drawing images with cairo, for masks.

fn set_rgba(cr: &cairo::Context, argb: u32) {
    let c = paint::rgba(argb);
    cr.set_source_rgba(
        c.red() as f64,
        c.green() as f64,
        c.blue() as f64,
        c.alpha() as f64,
    );
}

fn add_stops(pattern: &cairo::Gradient, stops: &[css::Stop]) {
    for st in stops {
        let c = paint::rgba(st.argb);
        pattern.add_color_stop_rgba(
            st.offset as f64,
            c.red() as f64,
            c.green() as f64,
            c.blue() as f64,
            c.alpha() as f64,
        );
    }
}

pub fn texture_surface(texture: &gdk::Texture) -> Option<cairo::ImageSurface> {
    let (w, h) = (texture.width(), texture.height());
    let stride = cairo::Format::ARgb32.stride_for_width(w as u32).ok()? as usize;
    let mut data = vec![0u8; stride * h as usize];
    texture.download(&mut data, stride);
    cairo::ImageSurface::create_for_data(data, cairo::Format::ARgb32, w, h, stride as i32).ok()
}

fn draw_image_cairo(el: &Element, cr: &cairo::Context, image: &Image, rect: &graphene::Rect) {
    let (x, y, w, h) = (
        rect.x() as f64,
        rect.y() as f64,
        rect.width() as f64,
        rect.height() as f64,
    );
    if w <= 0.0 || h <= 0.0 {
        return;
    }
    cr.save().ok();
    cr.rectangle(x, y, w, h);
    cr.clip();
    match image {
        Image::Url { src } => {
            if let Some(surface) = crate::image::texture_for(src, el.upcast_ref())
                .as_ref()
                .and_then(texture_surface)
            {
                cr.translate(x, y);
                cr.scale(w / surface.width() as f64, h / surface.height() as f64);
                cr.set_source_surface(&surface, 0.0, 0.0).ok();
                cr.paint().ok();
            }
        }
        Image::Linear {
            angle,
            corner,
            stops,
            repeating,
        } => {
            let (start, end) = paint::linear_points(*angle, *corner, rect);
            let pattern = cairo::LinearGradient::new(
                start.x() as f64,
                start.y() as f64,
                end.x() as f64,
                end.y() as f64,
            );
            add_stops(&pattern, stops);
            pattern.set_extend(if *repeating {
                cairo::Extend::Repeat
            } else {
                cairo::Extend::Pad
            });
            cr.set_source(&pattern).ok();
            cr.paint().ok();
        }
        Image::Radial {
            center,
            radius,
            stops,
            repeating,
        } => {
            let (rx, ry) = (
                (radius.0 as f64 * w).max(0.01),
                (radius.1 as f64 * h).max(0.01),
            );
            cr.translate(x + center.0 as f64 * w, y + center.1 as f64 * h);
            cr.scale(rx, ry);
            let pattern = cairo::RadialGradient::new(0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
            add_stops(&pattern, stops);
            pattern.set_extend(if *repeating {
                cairo::Extend::Repeat
            } else {
                cairo::Extend::Pad
            });
            cr.set_source(&pattern).ok();
            cr.paint().ok();
        }
        Image::Conic {
            angle,
            center,
            stops,
        } => {
            // wedges, each filled with the stop color at its angle
            let (cx, cy) = (x + center.0 as f64 * w, y + center.1 as f64 * h);
            let r = (w * w + h * h).sqrt() * 2.0;
            const STEPS: usize = 360;
            for i in 0..STEPS {
                let t0 = i as f64 / STEPS as f64;
                let t1 = (i + 1) as f64 / STEPS as f64;
                let a0 = (*angle as f64 - 90.0).to_radians() + t0 * std::f64::consts::TAU;
                let a1 = (*angle as f64 - 90.0).to_radians() + t1 * std::f64::consts::TAU + 0.002;
                set_rgba(cr, sample_stops(stops, t0 as f32));
                cr.move_to(cx, cy);
                cr.arc(cx, cy, r, a0, a1);
                cr.close_path();
                cr.fill().ok();
            }
        }
    }
    cr.restore().ok();
}

pub fn sample_stops(stops: &[css::Stop], t: f32) -> u32 {
    let Some(first) = stops.first() else { return 0 };
    if t <= first.offset {
        return first.argb;
    }
    for pair in stops.windows(2) {
        let (a, b) = (&pair[0], &pair[1]);
        if t <= b.offset {
            let k = if b.offset > a.offset {
                (t - a.offset) / (b.offset - a.offset)
            } else {
                1.0
            };
            let lerp = |s: u32| {
                let ca = ((a.argb >> s) & 0xff) as f32;
                let cb = ((b.argb >> s) & 0xff) as f32;
                ((ca + (cb - ca) * k).round() as u32) << s
            };
            return lerp(24) | lerp(16) | lerp(8) | lerp(0);
        }
    }
    stops.last().map_or(0, |s| s.argb)
}

/// Luminance into alpha (mask-mode: luminance), on premultiplied ARGB32.
fn luminance_to_alpha(surface: &mut cairo::ImageSurface) {
    surface.flush();
    let stride = surface.stride() as usize;
    let (w, h) = (surface.width() as usize, surface.height() as usize);
    if let Ok(mut data) = surface.data() {
        for row in 0..h {
            for px in data[row * stride..row * stride + w * 4].chunks_exact_mut(4) {
                // premultiplied: luminance of the color times its alpha is the weighted sum itself
                let l = 0.2126 * px[2] as f32 + 0.7152 * px[1] as f32 + 0.0722 * px[0] as f32;
                let a = l.round().clamp(0.0, 255.0) as u8;
                px.copy_from_slice(&[a, a, a, a]);
            }
        }
    }
    surface.mark_dirty();
}

fn new_surface(w: i32, h: i32) -> Option<cairo::ImageSurface> {
    cairo::ImageSurface::create(cairo::Format::ARgb32, w.max(1), h.max(1)).ok()
}

/// A surface for `area` (element coordinates) at `scale`, with a context mapped to it.
fn layer_canvas(
    area: &graphene::Rect,
    scale: f64,
) -> Option<(cairo::ImageSurface, cairo::Context)> {
    let surface = new_surface(
        (area.width() as f64 * scale).ceil() as i32,
        (area.height() as f64 * scale).ceil() as i32,
    )?;
    let cr = cairo::Context::new(&surface).ok()?;
    cr.scale(scale, scale);
    cr.translate(-area.x() as f64, -area.y() as f64);
    Some((surface, cr))
}

fn tile_layer(el: &Element, cr: &cairo::Context, layer: &Layer, g: &BoxGeometry) {
    let Some(image) = &layer.image else { return };
    let origin = *g.area(layer.origin.min(2)).bounds();
    let (ow, oh) = (origin.width(), origin.height());
    let intrinsic = match image {
        Image::Url { src } => crate::image::texture_for(src, el.upcast_ref())
            .map(|t| (t.width() as f32, t.height() as f32)),
        _ => None,
    };
    let (tw, th) = match &layer.size {
        LayerSize::Cover | LayerSize::Contain => match intrinsic {
            Some((iw, ih)) if iw > 0.0 && ih > 0.0 => {
                let s = if matches!(layer.size, LayerSize::Cover) {
                    (ow / iw).max(oh / ih)
                } else {
                    (ow / iw).min(oh / ih)
                };
                (iw * s, ih * s)
            }
            _ => (ow, oh),
        },
        LayerSize::Explicit(lw, lh) => match (lw, lh) {
            (Some(a), Some(b)) => (a.resolve(ow), b.resolve(oh)),
            (Some(a), None) => {
                let w = a.resolve(ow);
                (w, intrinsic.map_or(oh, |(iw, ih)| w * ih / iw.max(1.0)))
            }
            (None, Some(b)) => {
                let h = b.resolve(oh);
                (intrinsic.map_or(ow, |(iw, ih)| h * iw / ih.max(1.0)), h)
            }
            _ => intrinsic.unwrap_or((ow, oh)),
        },
        LayerSize::Auto => intrinsic.unwrap_or((ow, oh)),
    };
    if tw <= 0.0 || th <= 0.0 {
        return;
    }
    let px = origin.x() + layer.position.0.px + layer.position.0.pct / 100.0 * (ow - tw);
    let py = origin.y() + layer.position.1.px + layer.position.1.pct / 100.0 * (oh - th);
    let clip = g.area(layer.clip.min(2));
    cr.save().ok();
    rounded_path(cr, &clip);
    cr.clip();
    let b = clip.bounds();
    let tiles = |start: f32, size: f32, lo: f32, hi: f32, repeat: u8| -> Vec<f32> {
        if repeat == 1 {
            return vec![start];
        }
        let mut first = start - ((start - lo) / size).ceil() * size;
        let mut out = Vec::new();
        while first < hi && out.len() < 4096 {
            out.push(first);
            first += size;
        }
        out
    };
    for ty in tiles(py, th, b.y(), b.y() + b.height(), layer.repeat.1) {
        for tx in tiles(px, tw, b.x(), b.x() + b.width(), layer.repeat.0) {
            draw_image_cairo(el, cr, image, &graphene::Rect::new(tx, ty, tw, th));
        }
    }
    cr.restore().ok();
}

/// The region a mask covers: the border box grown by mask-border outsets.
pub fn mask_area(spec: &MaskSpec, g: &BoxGeometry) -> graphene::Rect {
    match &spec.border {
        Some(ns) => nine_area(ns, g),
        None => graphene::Rect::new(0.0, 0.0, g.w, g.h),
    }
}

/// The mask's coverage over `area` at `scale` (alpha in an ARGB32 surface).
fn mask_surface(
    el: &Element,
    spec: &MaskSpec,
    g: &BoxGeometry,
    area: &graphene::Rect,
    scale: f64,
) -> Option<cairo::ImageSurface> {
    let mut acc: Option<cairo::ImageSurface> = None;
    let layered = spec.layers.iter().any(|l| l.layer.image.is_some());
    if layered {
        let (surface, cr) = layer_canvas(area, scale)?;
        for (i, ml) in spec.layers.iter().enumerate().rev() {
            let (mut layer_surface, lcr) = layer_canvas(area, scale)?;
            tile_layer(el, &lcr, &ml.layer, g);
            drop(lcr);
            if ml.mode == 2 {
                luminance_to_alpha(&mut layer_surface);
            }
            cr.save().ok();
            cr.identity_matrix();
            let bottom = i == spec.layers.len() - 1;
            cr.set_operator(if bottom {
                cairo::Operator::Over
            } else {
                match ml.composite {
                    1 => cairo::Operator::Out,
                    2 => cairo::Operator::In,
                    3 => cairo::Operator::Xor,
                    _ => cairo::Operator::Over,
                }
            });
            cr.set_source_surface(&layer_surface, 0.0, 0.0).ok();
            cr.paint().ok();
            cr.restore().ok();
        }
        drop(cr);
        acc = Some(surface);
    }
    if let Some(shape) = &spec.clip {
        let (surface, cr) = layer_canvas(area, scale)?;
        geometry_path(&cr, &geometry(shape, g));
        match &acc {
            Some(prev) => {
                cr.clip();
                cr.save().ok();
                cr.identity_matrix();
                cr.set_source_surface(prev, 0.0, 0.0).ok();
                cr.paint().ok();
                cr.restore().ok();
            }
            None => {
                cr.set_source_rgba(0.0, 0.0, 0.0, 1.0);
                cr.fill().ok();
            }
        }
        drop(cr);
        acc = Some(surface);
    }
    if let Some(ns) = &spec.border {
        let (mut border, cr) = layer_canvas(area, scale)?;
        draw_nine_slice(el, ns, g, &mut CairoPainter { el, cr: &cr });
        drop(cr);
        if ns.luminance {
            luminance_to_alpha(&mut border);
        }
        acc = Some(match acc {
            Some(prev) => {
                let cr = cairo::Context::new(&prev).ok()?;
                cr.set_operator(cairo::Operator::In);
                cr.set_source_surface(&border, 0.0, 0.0).ok();
                cr.paint().ok();
                drop(cr);
                prev
            }
            None => border,
        });
    }
    acc
}

fn surface_texture(mut surface: cairo::ImageSurface) -> Option<gdk::Texture> {
    surface.flush();
    let (w, h, stride) = (surface.width(), surface.height(), surface.stride() as usize);
    let bytes = {
        let data = surface.data().ok()?;
        glib::Bytes::from(&data[..])
    };
    Some(
        gdk::MemoryTexture::new(
            w,
            h,
            gdk::MemoryFormat::B8g8r8a8Premultiplied,
            &bytes,
            stride,
        )
        .upcast(),
    )
}

type PushMask = unsafe extern "C" fn(*mut gtk::ffi::GtkSnapshot, i32);

thread_local! {
    static PUSH_MASK: Cell<Option<Option<PushMask>>> = const { Cell::new(None) };
}

/// GTK 4.10's gtk_snapshot_push_mask, when the running GTK has it.
fn push_mask_fn() -> Option<PushMask> {
    PUSH_MASK.with(|c| {
        if let Some(found) = c.get() {
            return found;
        }
        let found = unsafe {
            let sym = libc::dlsym(libc::RTLD_DEFAULT, c"gtk_snapshot_push_mask".as_ptr());
            (!sym.is_null()).then(|| std::mem::transmute::<*mut libc::c_void, PushMask>(sym))
        };
        c.set(Some(found));
        found
    })
}

/// Whether painting needs a mask (a clip that GSK can't express as a rounded rect, mask layers or
/// a mask border); otherwise the rounded clip to push, if any.
pub enum Plan {
    None,
    Clip(gsk::RoundedRect),
    Mask,
}

pub fn plan(el: &Element, g: &BoxGeometry) -> Plan {
    let css = el.css_ref();
    let Some(spec) = css.mask.as_ref() else {
        return Plan::None;
    };
    let layered = spec.layers.iter().any(|l| l.layer.image.is_some());
    if !layered && spec.border.is_none() {
        if let Some(shape) = &spec.clip {
            if let Geometry::Rounded(rr) = geometry(shape, g) {
                return Plan::Clip(rr);
            }
        }
    }
    Plan::Mask
}

/// Paints `contents` through the element's mask.
pub fn masked(
    el: &Element,
    s: &gtk::Snapshot,
    g: &BoxGeometry,
    contents: impl FnOnce(&gtk::Snapshot),
) {
    let css = el.css_ref();
    let Some(spec) = css.mask.as_ref() else {
        drop(css);
        contents(s);
        return;
    };
    let area = mask_area(spec, g);
    let scale = el.scale_factor().max(1) as f64;
    let mask = mask_surface(el, spec, g, &area, scale);
    drop(css);
    let Some(mask) = mask else {
        contents(s);
        return;
    };
    if let Some(push) = push_mask_fn() {
        let Some(texture) = surface_texture(mask) else {
            return;
        };
        unsafe { push(s.as_ptr(), 0) };
        s.append_texture(&texture, &area);
        s.pop();
        contents(s);
        s.pop();
        return;
    }
    // GTK < 4.10: render the contents and composite in software
    let recorded = gtk::Snapshot::new();
    contents(&recorded);
    let Some(node) = recorded.to_node() else {
        return;
    };
    let Some(renderer) = el.native().and_then(|n| n.renderer()) else {
        return;
    };
    let scaled = gtk::Snapshot::new();
    scaled.scale(scale as f32, scale as f32);
    scaled.append_node(&node);
    let Some(scaled) = scaled.to_node() else {
        return;
    };
    let viewport = graphene::Rect::new(
        area.x() * scale as f32,
        area.y() * scale as f32,
        (area.width() as f64 * scale).ceil() as f32,
        (area.height() as f64 * scale).ceil() as f32,
    );
    let rendered = renderer.render_texture(&scaled, Some(&viewport));
    let Some(content) = texture_surface(&rendered) else {
        return;
    };
    {
        let Ok(cr) = cairo::Context::new(&content) else {
            return;
        };
        cr.set_operator(cairo::Operator::DestIn);
        cr.set_source_surface(&mask, 0.0, 0.0).ok();
        cr.paint().ok();
    }
    if let Some(texture) = surface_texture(content) {
        s.append_texture(
            &texture,
            &graphene::Rect::new(
                area.x(),
                area.y(),
                viewport.width() / scale as f32,
                viewport.height() / scale as f32,
            ),
        );
    }
}

// Nine-slice (border-image, mask-border).

pub trait Painter {
    fn image(&mut self, image: &Image, rect: graphene::Rect, clip: graphene::Rect);
}

pub struct GskPainter<'a> {
    pub el: &'a Element,
    pub s: &'a gtk::Snapshot,
}

impl Painter for GskPainter<'_> {
    fn image(&mut self, image: &Image, rect: graphene::Rect, clip: graphene::Rect) {
        self.s.push_clip(&clip);
        paint::draw_image(self.el, self.s, image, rect, 2, (1, 1));
        self.s.pop();
    }
}

struct CairoPainter<'a> {
    el: &'a Element,
    cr: &'a cairo::Context,
}

impl Painter for CairoPainter<'_> {
    fn image(&mut self, image: &Image, rect: graphene::Rect, clip: graphene::Rect) {
        self.cr.save().ok();
        self.cr.rectangle(
            clip.x() as f64,
            clip.y() as f64,
            clip.width() as f64,
            clip.height() as f64,
        );
        self.cr.clip();
        draw_image_cairo(self.el, self.cr, image, &rect);
        self.cr.restore().ok();
    }
}

/// The border image area: the border box grown by the outsets.
pub fn nine_area(ns: &NineSlice, g: &BoxGeometry) -> graphene::Rect {
    let [bt, br, bb, bl] = g.border;
    let out = |i: usize, bw: f32| match ns.outset[i] {
        (0, v) => v * bw,
        (_, v) => v,
    };
    let (t, r, b, l) = (out(0, bt), out(1, br), out(2, bb), out(3, bl));
    graphene::Rect::new(-l, -t, g.w + l + r, g.h + t + b)
}

/// Tiles of `size` along [start, start + len) for a repeat mode, as (position, length).
fn tiles_along(start: f32, len: f32, size: f32, mode: u8) -> Vec<(f32, f32)> {
    if len <= 0.0 || size <= 0.0 || mode == 4 {
        return vec![(start, len)];
    }
    match mode {
        3 => {
            let n = (len / size).round().max(1.0);
            let s = len / n;
            (0..n as usize).map(|i| (start + i as f32 * s, s)).collect()
        }
        2 => {
            let n = (len / size).floor();
            if n < 1.0 {
                return Vec::new();
            }
            let gap = (len - n * size) / (n + 1.0);
            (0..n as usize)
                .map(|i| (start + gap + i as f32 * (size + gap), size))
                .collect()
        }
        _ => {
            // centered
            let n = (len / size).ceil() as i32 + 1;
            let first = start + (len - size) / 2.0 - (n / 2) as f32 * size;
            (0..=n)
                .map(|i| (first + i as f32 * size, size))
                .filter(|(p, s)| p + s > start && *p < start + len)
                .collect()
        }
    }
}

pub fn draw_nine_slice(el: &Element, ns: &NineSlice, g: &BoxGeometry, painter: &mut dyn Painter) {
    let area = nine_area(ns, g);
    let (aw, ah) = (area.width(), area.height());
    let (iw, ih) = match &ns.image {
        Image::Url { src } => match crate::image::texture_for(src, el.upcast_ref()) {
            Some(t) => (t.width() as f32, t.height() as f32),
            None => return,
        },
        _ => (aw, ah),
    };
    let slice = |i: usize, size: f32| {
        let (v, pct) = ns.slice[i];
        (if pct { v / 100.0 * size } else { v }).clamp(0.0, size)
    };
    let (st, sr, sb, sl) = (slice(0, ih), slice(1, iw), slice(2, ih), slice(3, iw));
    let width = |i: usize, bw: f32, sv: f32, basis: f32| match ns.widths[i] {
        (0, n, _) => n * bw,
        (1, px, pct) => px + pct / 100.0 * basis,
        _ => sv,
    };
    let [bt, br, bb, bl] = g.border;
    let (mut wt, mut wr, mut wb, mut wl) = (
        width(0, bt, st, ah),
        width(1, br, sr, aw),
        width(2, bb, sb, ah),
        width(3, bl, sl, aw),
    );
    // widths that overlap scale down together
    let f = (aw / (wl + wr).max(f32::EPSILON))
        .min(ah / (wt + wb).max(f32::EPSILON))
        .min(1.0);
    (wt, wr, wb, wl) = (wt * f, wr * f, wb * f, wl * f);
    let (x0, y0) = (area.x(), area.y());
    let (x1, x2, x3) = (x0 + wl, x0 + aw - wr, x0 + aw);
    let (y1, y2, y3) = (y0 + wt, y0 + ah - wb, y0 + ah);
    let (sx1, sx2) = (sl, iw - sr);
    let (sy1, sy2) = (st, ih - sb);
    // destination region, source region (in image px), repeat per axis
    let mut regions: Vec<([f32; 4], [f32; 4], (u8, u8))> = vec![
        ([x0, y0, x1, y1], [0.0, 0.0, sx1, sy1], (4, 4)),
        ([x2, y0, x3, y1], [sx2, 0.0, iw, sy1], (4, 4)),
        ([x2, y2, x3, y3], [sx2, sy2, iw, ih], (4, 4)),
        ([x0, y2, x1, y3], [0.0, sy2, sx1, ih], (4, 4)),
        ([x1, y0, x2, y1], [sx1, 0.0, sx2, sy1], (ns.repeat.0, 4)),
        ([x1, y2, x2, y3], [sx1, sy2, sx2, ih], (ns.repeat.0, 4)),
        ([x0, y1, x1, y2], [0.0, sy1, sx1, sy2], (4, ns.repeat.1)),
        ([x2, y1, x3, y2], [sx2, sy1, iw, sy2], (4, ns.repeat.1)),
    ];
    if ns.fill {
        regions.push((
            [x1, y1, x2, y2],
            [sx1, sy1, sx2, sy2],
            (ns.repeat.0, ns.repeat.1),
        ));
    }
    for (dst, src, (rx, ry)) in regions {
        let (dw, dh) = (dst[2] - dst[0], dst[3] - dst[1]);
        let (sw, sh) = (src[2] - src[0], src[3] - src[1]);
        if dw <= 0.0 || dh <= 0.0 || sw <= 0.0 || sh <= 0.0 {
            continue;
        }
        // tile size: stretched along an axis, else scaled by the other axis
        let (scale_x, scale_y) = (dw / sw, dh / sh);
        let tile_w = if rx == 4 {
            dw
        } else {
            sw * if ry == 4 {
                scale_y
            } else {
                scale_y.min(scale_x)
            }
        };
        let tile_h = if ry == 4 {
            dh
        } else {
            sh * if rx == 4 {
                scale_x
            } else {
                scale_x.min(scale_y)
            }
        };
        for (tx, tw) in tiles_along(dst[0], dw, tile_w, rx) {
            for (ty, th) in tiles_along(dst[1], dh, tile_h, ry) {
                let (kx, ky) = (tw / sw, th / sh);
                let image_rect =
                    graphene::Rect::new(tx - src[0] * kx, ty - src[1] * ky, iw * kx, ih * ky);
                let clip = graphene::Rect::new(tx, ty, tw, th)
                    .intersection(&graphene::Rect::new(dst[0], dst[1], dw, dh));
                if let Some(clip) = clip {
                    painter.image(&ns.image, image_rect, clip);
                }
            }
        }
    }
}
