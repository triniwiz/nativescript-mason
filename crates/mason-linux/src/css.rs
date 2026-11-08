//! Visual CSS resolved in TS (Windows' Css class), painted by paint.rs.

use gtk::{graphene, gsk};
use serde_json::Value;

#[derive(Clone, Debug, Default)]
pub struct Stop {
    pub offset: f32,
    pub argb: u32,
}

#[derive(Clone, Debug)]
pub enum Image {
    /// CSS angle in degrees; `corner` is a `to <corner>` direction (sign per axis).
    Linear {
        angle: f32,
        corner: Option<(f32, f32)>,
        stops: Vec<Stop>,
        repeating: bool,
    },
    /// Center and radii as fractions of the box.
    Radial {
        center: (f32, f32),
        radius: (f32, f32),
        stops: Vec<Stop>,
        repeating: bool,
    },
    Conic {
        angle: f32,
        center: (f32, f32),
        stops: Vec<Stop>,
    },
    Url {
        src: String,
    },
}

/// px plus a percentage of what it resolves against.
#[derive(Clone, Copy, Debug, Default)]
pub struct Len {
    pub px: f32,
    pub pct: f32,
}

impl Len {
    pub fn resolve(self, basis: f32) -> f32 {
        self.px + self.pct / 100.0 * basis
    }
}

#[derive(Clone, Debug, Default)]
pub enum LayerSize {
    #[default]
    Auto,
    Cover,
    Contain,
    Explicit(Option<Len>, Option<Len>),
}

#[derive(Clone, Debug)]
pub struct Layer {
    pub image: Option<Image>,
    pub size: LayerSize,
    pub position: (Len, Len),
    /// 0 repeat, 1 no-repeat, 2 space, 3 round, per axis.
    pub repeat: (u8, u8),
    /// 0 border-box, 1 padding-box, 2 content-box.
    pub origin: u8,
    /// as origin, 4 text.
    pub clip: u8,
}

#[derive(Clone, Copy, Debug)]
pub struct Shadow {
    pub inset: bool,
    pub dx: f32,
    pub dy: f32,
    pub blur: f32,
    pub spread: f32,
    pub argb: u32,
}

#[derive(Clone, Debug)]
pub enum Filter {
    /// 4x5 row-major color matrix (SVG feColorMatrix).
    Matrix([f32; 20]),
    Blur(f32),
    DropShadow {
        dx: f32,
        dy: f32,
        sigma: f32,
        argb: u32,
    },
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Transforms {
    pub scale: (f64, f64),
    pub angle: f64,
    pub translate: (f64, f64),
    /// Origin as fractions of the box.
    pub origin: (f64, f64),
}

#[derive(Default)]
pub struct CssState {
    /// A single brush painted over the background color (ApplyLinearGradient & co).
    pub brush: Option<Image>,
    pub brush_fit: i32,
    pub brush_align: (i32, i32),
    pub layers: Vec<Layer>,
    pub shadows: Vec<Shadow>,
    pub text_shadows: Vec<Shadow>,
    pub filters: Vec<Filter>,
    pub backdrop: Vec<Filter>,
    /// 2D affine matrix [a, b, c, d, tx, ty].
    pub matrix: Option<[f64; 6]>,
    pub matrix_origin: (f64, f64),
    pub transforms: Option<Transforms>,
    pub mask: Option<crate::mask::MaskSpec>,
    pub border_image: Option<crate::mask::NineSlice>,
}

impl CssState {
    /// The transform a parent applies when it allocates this element, around its origin.
    pub fn transform(&self, width: f32, height: f32) -> Option<gsk::Transform> {
        if let Some(m) = self.matrix {
            let (ox, oy) = (
                self.matrix_origin.0 as f32 * width,
                self.matrix_origin.1 as f32 * height,
            );
            let matrix = graphene::Matrix::from_2d(m[0], m[1], m[2], m[3], m[4], m[5]);
            let t = gsk::Transform::new()
                .translate(&graphene::Point::new(ox, oy))
                .matrix(&matrix)
                .translate(&graphene::Point::new(-ox, -oy));
            return Some(t);
        }
        let t = self.transforms?;
        if t.angle == 0.0 && t.scale == (1.0, 1.0) && t.translate == (0.0, 0.0) {
            return None;
        }
        let (ox, oy) = (t.origin.0 as f32 * width, t.origin.1 as f32 * height);
        let mut out = gsk::Transform::new().translate(&graphene::Point::new(
            t.translate.0 as f32 + ox,
            t.translate.1 as f32 + oy,
        ));
        if t.angle != 0.0 {
            out = out.rotate(t.angle as f32);
        }
        if t.scale != (1.0, 1.0) {
            out = out.scale(t.scale.0 as f32, t.scale.1 as f32);
        }
        Some(out.translate(&graphene::Point::new(-ox, -oy)))
    }
}

/// `offset:argb,offset:argb` (offsets 0-1).
pub fn parse_stops(spec: &str) -> Vec<Stop> {
    spec.split(',')
        .filter_map(|pair| {
            let (o, c) = pair.split_once(':')?;
            Some(Stop {
                offset: o.trim().parse().ok()?,
                argb: c.trim().parse::<f64>().ok()? as u32,
            })
        })
        .collect()
}

/// `inset,dx,dy,blur,spread,argb;...`
pub fn parse_shadows(spec: &str) -> Vec<Shadow> {
    spec.split(';')
        .filter_map(|s| {
            let v: Vec<f64> = s.split(',').filter_map(|n| n.trim().parse().ok()).collect();
            (v.len() >= 6).then(|| Shadow {
                inset: v[0] != 0.0,
                dx: v[1] as f32,
                dy: v[2] as f32,
                blur: v[3] as f32,
                spread: v[4] as f32,
                argb: v[5] as u32,
            })
        })
        .collect()
}

/// `m,<20>` / `b,sigma` / `d,x,y,sigma,argb`, `;`-separated.
pub fn parse_filters(spec: &str) -> Vec<Filter> {
    spec.split(';')
        .filter_map(|s| {
            let mut parts = s.split(',');
            let kind = parts.next()?.trim();
            let v: Vec<f64> = parts.filter_map(|n| n.trim().parse().ok()).collect();
            match kind {
                "m" if v.len() >= 20 => {
                    let mut m = [0f32; 20];
                    for (i, x) in v.iter().take(20).enumerate() {
                        m[i] = *x as f32;
                    }
                    Some(Filter::Matrix(m))
                }
                "b" if !v.is_empty() => Some(Filter::Blur(v[0] as f32)),
                "d" if v.len() >= 4 => Some(Filter::DropShadow {
                    dx: v[0] as f32,
                    dy: v[1] as f32,
                    sigma: v[2] as f32,
                    argb: v[3] as u32,
                }),
                _ => None,
            }
        })
        .collect()
}

fn f(v: &Value) -> f32 {
    v.as_f64().unwrap_or(0.0) as f32
}

#[allow(dead_code)]
fn len_of(v: &Value) -> Option<Len> {
    let a = v.as_array()?;
    Some(Len {
        px: f(a.first()?),
        pct: a.get(1).map_or(0.0, f),
    })
}

fn stops_of(v: &Value) -> Vec<Stop> {
    let flat = v
        .get("s")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    flat.chunks(2)
        .filter(|c| c.len() == 2)
        .map(|c| Stop {
            offset: f(&c[0]),
            argb: c[1].as_f64().unwrap_or(0.0) as u32,
        })
        .collect()
}

pub fn image_of(v: &Value) -> Option<Image> {
    let repeating = v.get("rp").is_some();
    match v.get("t")?.as_str()? {
        "img" => Some(Image::Url {
            src: v.get("src")?.as_str()?.to_string(),
        }),
        "lin" => {
            let corner = v
                .get("k")
                .and_then(Value::as_array)
                .map(|k| (k.first().map_or(0.0, f), k.get(1).map_or(0.0, f)));
            Some(Image::Linear {
                angle: v.get("a").map_or(180.0, f),
                corner,
                stops: stops_of(v),
                repeating,
            })
        }
        "rad" => {
            let pair = |key: &str, d: f32| {
                v.get(key)
                    .and_then(Value::as_array)
                    .map_or((d, d), |a| (a.first().map_or(d, f), a.get(1).map_or(d, f)))
            };
            Some(Image::Radial {
                center: pair("c", 0.5),
                radius: pair("r", 0.5),
                stops: stops_of(v),
                repeating,
            })
        }
        "con" => {
            let c = v
                .get("c")
                .and_then(Value::as_array)
                .map_or((0.5, 0.5), |a| {
                    (a.first().map_or(0.5, f), a.get(1).map_or(0.5, f))
                });
            Some(Image::Conic {
                angle: v.get("a").map_or(0.0, f),
                center: c,
                stops: stops_of(v),
            })
        }
        _ => None,
    }
}

/// `[1]` cover, `[2]` contain, `[0, hasW, wPx, wPct, hasH, hPx, hPct]`.
fn size_of(v: Option<&Value>) -> LayerSize {
    let Some(a) = v.and_then(Value::as_array) else {
        return LayerSize::Auto;
    };
    let n = |i: usize| a.get(i).map_or(0.0, f);
    match a.first().and_then(Value::as_u64) {
        Some(1) => LayerSize::Cover,
        Some(2) => LayerSize::Contain,
        _ if a.len() >= 7 => {
            let w = (n(1) != 0.0).then(|| Len {
                px: n(2),
                pct: n(3),
            });
            let h = (n(4) != 0.0).then(|| Len {
                px: n(5),
                pct: n(6),
            });
            if w.is_none() && h.is_none() {
                LayerSize::Auto
            } else {
                LayerSize::Explicit(w, h)
            }
        }
        _ => LayerSize::Auto,
    }
}

/// `{ l: [{ i, sz, p, r, o, c, ... }] }` (mask.windows.ts).
pub fn parse_layers(spec: &str) -> Vec<Layer> {
    let Ok(root) = serde_json::from_str::<Value>(spec) else {
        return Vec::new();
    };
    let Some(list) = root.get("l").and_then(Value::as_array) else {
        return Vec::new();
    };
    list.iter().map(layer_of).collect()
}

/// One `{ i, sz, p, r, o, c }` layer.
pub fn layer_of(l: &Value) -> Layer {
    let p = l
        .get("p")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let at = |i: usize| p.get(i).map_or(0.0, f);
    let repeat = match l.get("r") {
        Some(Value::Array(a)) => (
            a.first().and_then(Value::as_u64).unwrap_or(0) as u8,
            a.get(1).and_then(Value::as_u64).unwrap_or(0) as u8,
        ),
        Some(v) => {
            let r = v.as_u64().unwrap_or(0) as u8;
            (r, r)
        }
        None => (0, 0),
    };
    Layer {
        image: l.get("i").and_then(image_of),
        size: size_of(l.get("sz")),
        position: (
            Len {
                px: at(0),
                pct: at(1),
            },
            Len {
                px: at(2),
                pct: at(3),
            },
        ),
        repeat,
        origin: l.get("o").and_then(Value::as_u64).unwrap_or(1) as u8,
        clip: l.get("c").and_then(Value::as_u64).unwrap_or(0) as u8,
    }
}
