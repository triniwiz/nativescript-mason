//! GSK painting: shadows, backgrounds, borders, clip, children in z-order.

use crate::css::{Filter, Image, Layer, LayerSize, Stop};
use crate::element::{Element, Kind};
use crate::engine::StyleView;
use gtk::prelude::*;
use gtk::{gdk, graphene, gsk};
use mason_core::style::StyleKeys;

pub fn rgba(argb: u32) -> gdk::RGBA {
    gdk::RGBA::new(
        ((argb >> 16) & 0xff) as f32 / 255.0,
        ((argb >> 8) & 0xff) as f32 / 255.0,
        (argb & 0xff) as f32 / 255.0,
        ((argb >> 24) & 0xff) as f32 / 255.0,
    )
}

/// Corner radii (x, y) as tl, tr, br, bl, resolved against the box.
pub fn radii(style: &StyleView, w: f32, h: f32) -> [(f32, f32); 4] {
    use StyleKeys::*;
    let corner = |xt, xv, yt, yv| {
        let x = if style.u8(xt) == 1 {
            style.f32(xv) * w
        } else {
            style.f32(xv)
        };
        let y = if style.u8(yt) == 1 {
            style.f32(yv) * h
        } else {
            style.f32(yv)
        };
        (x.max(0.0), y.max(0.0))
    };
    let mut r = [
        corner(
            BORDER_RADIUS_TOP_LEFT_X_TYPE,
            BORDER_RADIUS_TOP_LEFT_X_VALUE,
            BORDER_RADIUS_TOP_LEFT_Y_TYPE,
            BORDER_RADIUS_TOP_LEFT_Y_VALUE,
        ),
        corner(
            BORDER_RADIUS_TOP_RIGHT_X_TYPE,
            BORDER_RADIUS_TOP_RIGHT_X_VALUE,
            BORDER_RADIUS_TOP_RIGHT_Y_TYPE,
            BORDER_RADIUS_TOP_RIGHT_Y_VALUE,
        ),
        corner(
            BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE,
            BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE,
            BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE,
            BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE,
        ),
        corner(
            BORDER_RADIUS_BOTTOM_LEFT_X_TYPE,
            BORDER_RADIUS_BOTTOM_LEFT_X_VALUE,
            BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE,
            BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE,
        ),
    ];
    // CSS scales all radii down together when adjacent ones overlap.
    let sum_scale = |a: f32, b: f32, side: f32| {
        if a + b > side && a + b > 0.0 {
            side / (a + b)
        } else {
            1.0
        }
    };
    let s = sum_scale(r[0].0, r[1].0, w)
        .min(sum_scale(r[3].0, r[2].0, w))
        .min(sum_scale(r[0].1, r[3].1, h))
        .min(sum_scale(r[1].1, r[2].1, h));
    if s < 1.0 {
        for c in r.iter_mut() {
            c.0 *= s;
            c.1 *= s;
        }
    }
    r
}

pub fn rounded(rect: graphene::Rect, r: &[(f32, f32); 4]) -> gsk::RoundedRect {
    let size = |c: (f32, f32)| graphene::Size::new(c.0, c.1);
    gsk::RoundedRect::new(rect, size(r[0]), size(r[1]), size(r[2]), size(r[3]))
}

fn has_radius(r: &[(f32, f32); 4]) -> bool {
    r.iter().any(|c| c.0 > 0.0 || c.1 > 0.0)
}

/// Radii of a box inset by (top, right, bottom, left).
pub fn inset_radii(r: &[(f32, f32); 4], t: f32, rt: f32, b: f32, l: f32) -> [(f32, f32); 4] {
    [
        ((r[0].0 - l).max(0.0), (r[0].1 - t).max(0.0)),
        ((r[1].0 - rt).max(0.0), (r[1].1 - t).max(0.0)),
        ((r[2].0 - rt).max(0.0), (r[2].1 - b).max(0.0)),
        ((r[3].0 - l).max(0.0), (r[3].1 - b).max(0.0)),
    ]
}

pub struct BoxGeometry {
    pub w: f32,
    pub h: f32,
    pub radii: [(f32, f32); 4],
    pub border: [f32; 4],
    pub padding: [f32; 4],
}

impl BoxGeometry {
    pub fn of(el: &Element) -> BoxGeometry {
        let node = el.node();
        let l = crate::engine::layout(node.id());
        let style = el.style();
        let (mut w, mut h) = (l.size.width, l.size.height);
        if el.is_layout_root() {
            // a root fills the frame its host gives it, as the iOS and Android views do
            w = w.max(el.width() as f32);
            h = h.max(el.height() as f32);
        }
        BoxGeometry {
            w,
            h,
            radii: radii(&style, w, h),
            border: [l.border.top, l.border.right, l.border.bottom, l.border.left],
            padding: [
                l.padding.top,
                l.padding.right,
                l.padding.bottom,
                l.padding.left,
            ],
        }
    }

    pub fn border_box(&self) -> gsk::RoundedRect {
        rounded(graphene::Rect::new(0.0, 0.0, self.w, self.h), &self.radii)
    }

    pub fn padding_box(&self) -> gsk::RoundedRect {
        let [t, r, b, l] = self.border;
        let rect = graphene::Rect::new(l, t, (self.w - l - r).max(0.0), (self.h - t - b).max(0.0));
        rounded(rect, &inset_radii(&self.radii, t, r, b, l))
    }

    pub fn content_box(&self) -> gsk::RoundedRect {
        let [t, r, b, l] = self.border;
        let [pt, pr, pb, pl] = self.padding;
        let rect = graphene::Rect::new(
            l + pl,
            t + pt,
            (self.w - l - r - pl - pr).max(0.0),
            (self.h - t - b - pt - pb).max(0.0),
        );
        rounded(
            rect,
            &inset_radii(&self.radii, t + pt, r + pr, b + pb, l + pl),
        )
    }

    /// 0 border-box, 1 padding-box, 2 content-box.
    pub fn area(&self, which: u8) -> gsk::RoundedRect {
        match which {
            1 => self.padding_box(),
            2 => self.content_box(),
            _ => self.border_box(),
        }
    }

    pub fn is_rounded(&self) -> bool {
        has_radius(&self.radii)
    }
}

fn push_clip(s: &gtk::Snapshot, rect: &gsk::RoundedRect, rounded_clip: bool) {
    if rounded_clip {
        s.push_rounded_clip(rect);
    } else {
        s.push_clip(rect.bounds());
    }
}

pub fn snapshot_element(el: &Element, s: &gtk::Snapshot) {
    let Some(_) = el.try_node() else { return };
    let style = el.style();
    // display: none takes no space, and draws nothing
    if style.u8(StyleKeys::DISPLAY) == 0 {
        return;
    }
    if style.u8(StyleKeys::VISIBILITY) != 0 {
        // visibility: hidden still lays out and lets visible children draw
        snapshot_children(el, s);
        return;
    }
    let g = BoxGeometry::of(el);
    if el.is_layout_root() {
        crate::backdrop::record(el, &g);
    }
    match crate::mask::plan(el, &g) {
        crate::mask::Plan::None => paint_box(el, s, &g),
        crate::mask::Plan::Clip(rr) => {
            s.push_rounded_clip(&rr);
            paint_box(el, s, &g);
            s.pop();
        }
        crate::mask::Plan::Mask => crate::mask::masked(el, s, &g, |s| paint_box(el, s, &g)),
    }
}

pub fn push_filters(s: &gtk::Snapshot, filters: &[Filter]) -> usize {
    for filter in filters {
        match filter {
            Filter::Blur(sigma) => s.push_blur((*sigma * 2.0) as f64),
            Filter::Matrix(m) => {
                // feColorMatrix rows: out = M[0..4] . (r,g,b,a) + M[4]
                let matrix = graphene::Matrix::from_float([
                    m[0], m[5], m[10], m[15], m[1], m[6], m[11], m[16], m[2], m[7], m[12], m[17],
                    m[3], m[8], m[13], m[18],
                ]);
                s.push_color_matrix(&matrix, &graphene::Vec4::new(m[4], m[9], m[14], m[19]));
            }
            Filter::DropShadow {
                dx,
                dy,
                sigma,
                argb,
            } => s.push_shadow(&[gsk::Shadow::new(rgba(*argb), *dx, *dy, *sigma * 2.0)]),
        }
    }
    filters.len()
}

/// Everything an element draws: its box, its content and its children.
pub fn paint_box(el: &Element, s: &gtk::Snapshot, g: &BoxGeometry) {
    if crate::backdrop::skip(el) {
        return;
    }
    let style = el.style();
    let css = el.css_ref();
    let pushes = push_filters(s, &css.filters);

    let outline = g.border_box();
    for shadow in css.shadows.iter().filter(|sh| !sh.inset) {
        s.append_outset_shadow(
            &outline,
            &rgba(shadow.argb),
            shadow.dx,
            shadow.dy,
            shadow.spread,
            shadow.blur,
        );
    }
    if !css.backdrop.is_empty() {
        crate::backdrop::paint(el, s, g, &css.backdrop);
    }

    let bg = style.u32(StyleKeys::BACKGROUND_COLOR);
    let color_clip = css.layers.last().map_or(0, |l| l.clip.min(2));
    if bg >> 24 != 0 && el.kind() != Kind::Input && el.kind() != Kind::TextArea {
        let area = g.area(color_clip);
        push_clip(s, &area, g.is_rounded());
        s.append_color(&rgba(bg), area.bounds());
        s.pop();
    }
    if let Some(brush) = &css.brush {
        push_clip(s, &outline, g.is_rounded());
        draw_image(
            el,
            s,
            brush,
            *outline.bounds(),
            css.brush_fit,
            css.brush_align,
        );
        s.pop();
    }
    // the first layer is on top
    for layer in css.layers.iter().rev() {
        paint_layer(el, s, layer, g);
    }

    for shadow in css.shadows.iter().filter(|sh| sh.inset) {
        s.append_inset_shadow(
            &g.padding_box(),
            &rgba(shadow.argb),
            shadow.dx,
            shadow.dy,
            shadow.spread,
            shadow.blur,
        );
    }
    match &css.border_image {
        Some(ns) => crate::mask::draw_nine_slice(el, ns, g, &mut crate::mask::GskPainter { el, s }),
        None => paint_border(s, &style, g),
    }
    drop(css);

    let clips = el.overflow_clips();
    if clips {
        push_clip(s, &g.padding_box(), g.is_rounded());
    }
    match el.kind() {
        Kind::Text | Kind::Button => crate::text::snapshot(el, s, g),
        Kind::Image => crate::image::snapshot(el, s, g),
        Kind::Li => crate::text::snapshot_marker(el, s, g),
        _ => {}
    }
    snapshot_children(el, s);
    if clips {
        s.pop();
    }
    crate::scroll::snapshot_indicators(el, s, g);
    for _ in 0..pushes {
        s.pop();
    }
}

fn snapshot_children(el: &Element, s: &gtk::Snapshot) {
    let mut children: Vec<(i32, gtk::Widget)> = Vec::new();
    let mut child = el.first_child();
    let mut ordered = true;
    while let Some(c) = child {
        let z = c
            .downcast_ref::<Element>()
            .map_or(0, |e| e.style().i32(StyleKeys::Z_INDEX));
        if z != 0 {
            ordered = false;
        }
        children.push((z, c.clone()));
        child = c.next_sibling();
    }
    if !ordered {
        children.sort_by_key(|(z, _)| *z);
    }
    for (_, c) in children {
        if !c.is_visible() || !c.is_child_visible() {
            continue;
        }
        // GTK caches a widget's node; one that draws a backdrop has to paint fresh every frame
        match c.downcast_ref::<Element>() {
            Some(child) if crate::backdrop::involved(child) => {
                let Some(m) = c.compute_transform(el) else {
                    continue;
                };
                s.save();
                s.transform_matrix(&m);
                let opacity = c.opacity();
                if opacity < 1.0 {
                    s.push_opacity(opacity);
                }
                snapshot_element(child, s);
                if opacity < 1.0 {
                    s.pop();
                }
                s.restore();
            }
            _ => el.snapshot_child(&c, s),
        }
    }
}

fn shade(argb: u32, k: f32) -> u32 {
    let c = |s: u32| ((((argb >> s) & 0xff) as f32 * k).round().min(255.0) as u32) << s;
    (argb & 0xff00_0000) | c(16) | c(8) | c(0)
}

/// The border box inset by fractions (0 outer edge, 1 inner edge) of each side's width.
fn border_ring_edge(g: &BoxGeometry, f: f32) -> gsk::RoundedRect {
    let [t, r, b, l] = g.border.map(|w| w * f);
    let rect = graphene::Rect::new(l, t, (g.w - l - r).max(0.0), (g.h - t - b).max(0.0));
    rounded(rect, &inset_radii(&g.radii, t, r, b, l))
}

fn fill_ring(cr: &gtk::cairo::Context, g: &BoxGeometry, from: f32, to: f32, argb: u32) {
    let c = rgba(argb);
    cr.set_source_rgba(
        c.red() as f64,
        c.green() as f64,
        c.blue() as f64,
        c.alpha() as f64,
    );
    cr.set_fill_rule(gtk::cairo::FillRule::EvenOdd);
    crate::mask::rounded_path(cr, &border_ring_edge(g, from));
    crate::mask::rounded_path(cr, &border_ring_edge(g, to));
    cr.fill().ok();
}

fn paint_border(s: &gtk::Snapshot, style: &StyleView, g: &BoxGeometry) {
    use StyleKeys::*;
    let [t, r, b, l] = g.border;
    if t <= 0.0 && r <= 0.0 && b <= 0.0 && l <= 0.0 {
        return;
    }
    // per side (top, right, bottom, left): style and color; none / hidden draw nothing
    let sides = [
        (style.u8(BORDER_TOP_STYLE), style.u32(BORDER_TOP_COLOR), t),
        (
            style.u8(BORDER_RIGHT_STYLE),
            style.u32(BORDER_RIGHT_COLOR),
            r,
        ),
        (
            style.u8(BORDER_BOTTOM_STYLE),
            style.u32(BORDER_BOTTOM_COLOR),
            b,
        ),
        (style.u8(BORDER_LEFT_STYLE), style.u32(BORDER_LEFT_COLOR), l),
    ];
    let drawn = |(st, _, w): (u8, u32, f32)| st > 1 && w > 0.0;
    if sides.iter().all(|&side| !drawn(side) || side.0 == 4) {
        let width = |side: (u8, u32, f32)| if drawn(side) { side.2 } else { 0.0 };
        let color = |side: (u8, u32, f32)| {
            if drawn(side) {
                rgba(side.1)
            } else {
                gdk::RGBA::TRANSPARENT
            }
        };
        s.append_border(&g.border_box(), &sides.map(width), &sides.map(color));
        return;
    }
    // other styles with cairo, each side clipped to its wedge of the ring
    let cr = s.append_cairo(&graphene::Rect::new(0.0, 0.0, g.w, g.h));
    let (w, h) = (g.w as f64, g.h as f64);
    let (t, r, b, l) = (t as f64, r as f64, b as f64, l as f64);
    let wedges: [[(f64, f64); 4]; 4] = [
        [(0.0, 0.0), (w, 0.0), (w - r, t), (l, t)],
        [(w, 0.0), (w, h), (w - r, h - b), (w - r, t)],
        [(w, h), (0.0, h), (l, h - b), (w - r, h - b)],
        [(0.0, h), (0.0, 0.0), (l, t), (l, h - b)],
    ];
    for (i, &(st, color, width)) in sides.iter().enumerate() {
        if !drawn((st, color, width)) {
            continue;
        }
        cr.save().ok();
        let wedge = wedges[i];
        cr.move_to(wedge[0].0, wedge[0].1);
        for p in &wedge[1..] {
            cr.line_to(p.0, p.1);
        }
        cr.close_path();
        cr.clip();
        // top and left are the lit edges of groove, ridge, inset and outset
        let lit = i == 0 || i == 3;
        let dark = shade(color, 0.6);
        match st {
            2 | 3 => {
                let c = rgba(color);
                cr.set_source_rgba(
                    c.red() as f64,
                    c.green() as f64,
                    c.blue() as f64,
                    c.alpha() as f64,
                );
                crate::mask::rounded_path(&cr, &border_ring_edge(g, 0.5));
                let wd = width as f64;
                cr.set_line_width(wd);
                if st == 2 {
                    cr.set_line_cap(gtk::cairo::LineCap::Round);
                    cr.set_dash(&[0.0, wd * 2.0], 0.0);
                } else {
                    cr.set_dash(&[wd * 3.0, wd * 3.0], 0.0);
                }
                cr.stroke().ok();
            }
            5 => {
                fill_ring(&cr, g, 0.0, 1.0 / 3.0, color);
                fill_ring(&cr, g, 2.0 / 3.0, 1.0, color);
            }
            6 | 7 => {
                // groove: dark outside, light inside on the lit edges; ridge the reverse
                let outer_dark = (st == 6) == lit;
                fill_ring(&cr, g, 0.0, 0.5, if outer_dark { dark } else { color });
                fill_ring(&cr, g, 0.5, 1.0, if outer_dark { color } else { dark });
            }
            8 | 9 => {
                // inset darkens the lit edges, outset the others
                let darken = (st == 8) == lit;
                fill_ring(&cr, g, 0.0, 1.0, if darken { dark } else { color });
            }
            _ => fill_ring(&cr, g, 0.0, 1.0, color),
        }
        cr.restore().ok();
    }
}

fn color_stops(stops: &[Stop]) -> Vec<gsk::ColorStop> {
    let mut last = 0.0f32;
    stops
        .iter()
        .map(|st| {
            // GSK wants non-decreasing offsets in 0..1
            last = st.offset.clamp(last, 1.0);
            gsk::ColorStop::new(last, rgba(st.argb))
        })
        .collect()
}

/// The CSS gradient line through `rect`'s center, long enough that the corners hit 0 and 1.
pub fn linear_points(
    angle: f32,
    corner: Option<(f32, f32)>,
    rect: &graphene::Rect,
) -> (graphene::Point, graphene::Point) {
    let (x, y, w, h) = (rect.x(), rect.y(), rect.width(), rect.height());
    let deg = match corner {
        Some((cx, cy)) if cx != 0.0 || cy != 0.0 => {
            // "to <corner>": perpendicular to the diagonal through the other two corners
            let a = (h / w).atan().to_degrees();
            match (cx.signum() as i32, cy.signum() as i32) {
                (1, -1) => 90.0 - a,
                (1, 1) => 90.0 + a,
                (-1, 1) => 270.0 - a,
                (-1, -1) => 270.0 + a,
                (1, 0) => 90.0,
                (-1, 0) => 270.0,
                (0, 1) => 180.0,
                _ => 0.0,
            }
        }
        _ => angle,
    };
    let rad = deg.to_radians();
    let (dx, dy) = (rad.sin(), -rad.cos());
    let half = (w * dx.abs() + h * dy.abs()) / 2.0;
    let (cx, cy) = (x + w / 2.0, y + h / 2.0);
    (
        graphene::Point::new(cx - dx * half, cy - dy * half),
        graphene::Point::new(cx + dx * half, cy + dy * half),
    )
}

/// Draws one image (gradient or url) to fill `rect`.
pub fn draw_image(
    el: &Element,
    s: &gtk::Snapshot,
    image: &Image,
    rect: graphene::Rect,
    fit: i32,
    align: (i32, i32),
) {
    let (x, y, w, h) = (rect.x(), rect.y(), rect.width(), rect.height());
    if w <= 0.0 || h <= 0.0 {
        return;
    }
    match image {
        Image::Linear {
            angle,
            corner,
            stops,
            repeating,
        } => {
            if stops.len() < 2 {
                if let Some(st) = stops.first() {
                    s.append_color(&rgba(st.argb), &rect);
                }
                return;
            }
            let (start, end) = linear_points(*angle, *corner, &rect);
            let stops = color_stops(stops);
            if *repeating {
                s.append_repeating_linear_gradient(&rect, &start, &end, &stops);
            } else {
                s.append_linear_gradient(&rect, &start, &end, &stops);
            }
        }
        Image::Radial {
            center,
            radius,
            stops,
            repeating,
        } => {
            if stops.len() < 2 {
                return;
            }
            let c = graphene::Point::new(x + center.0 * w, y + center.1 * h);
            let (rx, ry) = ((radius.0 * w).max(0.01), (radius.1 * h).max(0.01));
            let stops = color_stops(stops);
            if *repeating {
                s.append_repeating_radial_gradient(&rect, &c, rx, ry, 0.0, 1.0, &stops);
            } else {
                s.append_radial_gradient(&rect, &c, rx, ry, 0.0, 1.0, &stops);
            }
        }
        Image::Conic {
            angle,
            center,
            stops,
        } => {
            if stops.len() < 2 {
                return;
            }
            let c = graphene::Point::new(x + center.0 * w, y + center.1 * h);
            s.append_conic_gradient(&rect, &c, *angle, &color_stops(stops));
        }
        Image::Url { src } => {
            if let Some(texture) = crate::image::texture_for(src, el.upcast_ref()) {
                let (tw, th) = (texture.width() as f32, texture.height() as f32);
                let dest = fit_rect(fit, align, tw, th, rect);
                s.push_clip(&rect);
                s.append_texture(&texture, &dest);
                s.pop();
            }
        }
    }
}

/// object-fit / background-size placement: 0 contain, 1 cover, 2 fill, 3 none, 4 scale-down.
pub fn fit_rect(
    fit: i32,
    align: (i32, i32),
    iw: f32,
    ih: f32,
    rect: graphene::Rect,
) -> graphene::Rect {
    let (w, h) = (rect.width(), rect.height());
    if iw <= 0.0 || ih <= 0.0 {
        return rect;
    }
    let (dw, dh) = match fit {
        0 | 4 => {
            let scale = (w / iw).min(h / ih);
            let scale = if fit == 4 { scale.min(1.0) } else { scale };
            (iw * scale, ih * scale)
        }
        1 => {
            let scale = (w / iw).max(h / ih);
            (iw * scale, ih * scale)
        }
        3 => (iw, ih),
        _ => (w, h),
    };
    let place = |a: i32, space: f32| match a {
        0 => 0.0,
        2 => space,
        _ => space / 2.0,
    };
    graphene::Rect::new(
        rect.x() + place(align.0, w - dw),
        rect.y() + place(align.1, h - dh),
        dw,
        dh,
    )
}

fn paint_layer(el: &Element, s: &gtk::Snapshot, layer: &Layer, g: &BoxGeometry) {
    let Some(image) = &layer.image else { return };
    let origin = g.area(layer.origin.min(2)).bounds().clone();
    let clip = g.area(layer.clip.min(2));
    let (ow, oh) = (origin.width(), origin.height());
    let intrinsic = match image {
        Image::Url { src } => crate::image::texture_for(src, el.upcast_ref())
            .map(|t| (t.width() as f32, t.height() as f32)),
        _ => None,
    };
    let (tw, th) = match &layer.size {
        LayerSize::Cover | LayerSize::Contain => match intrinsic {
            Some((iw, ih)) if iw > 0.0 && ih > 0.0 => {
                let scale = if matches!(layer.size, LayerSize::Cover) {
                    (ow / iw).max(oh / ih)
                } else {
                    (ow / iw).min(oh / ih)
                };
                (iw * scale, ih * scale)
            }
            _ => (ow, oh),
        },
        LayerSize::Explicit(lw, lh) => {
            let ratio = intrinsic.map_or(1.0, |(iw, ih)| if ih > 0.0 { iw / ih } else { 1.0 });
            match (lw, lh) {
                (Some(lw), Some(lh)) => (lw.resolve(ow), lh.resolve(oh)),
                (Some(lw), None) => {
                    let w = lw.resolve(ow);
                    (w, if intrinsic.is_some() { w / ratio } else { oh })
                }
                (None, Some(lh)) => {
                    let h = lh.resolve(oh);
                    (if intrinsic.is_some() { h * ratio } else { ow }, h)
                }
                _ => intrinsic.unwrap_or((ow, oh)),
            }
        }
        LayerSize::Auto => intrinsic.unwrap_or((ow, oh)),
    };
    if tw <= 0.0 || th <= 0.0 {
        return;
    }
    let px = origin.x() + layer.position.0.px + layer.position.0.pct / 100.0 * (ow - tw);
    let py = origin.y() + layer.position.1.px + layer.position.1.pct / 100.0 * (oh - th);
    push_clip(s, &clip, g.is_rounded());
    let bounds = clip.bounds();
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
    for ty in tiles(
        py,
        th,
        bounds.y(),
        bounds.y() + bounds.height(),
        layer.repeat.1,
    ) {
        for tx in tiles(
            px,
            tw,
            bounds.x(),
            bounds.x() + bounds.width(),
            layer.repeat.0,
        ) {
            draw_image(el, s, image, graphene::Rect::new(tx, ty, tw, th), 2, (1, 1));
        }
    }
    s.pop();
}
