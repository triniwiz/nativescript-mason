//! The unit contract for grid track sizes.
//!
//! `px` is a CSS pixel — the same size as a dip — so a track size scales with
//! the device, exactly as on the web. `dppx` is the escape hatch for a literal
//! device pixel. Every other layer (style.ts, Border.kt, BorderParser.swift)
//! agrees; this pins the Rust end of it.

use mason_core::utils::parse_grid_auto_tracks;
use taffy::TrackSizingFunction;

fn track(input: &str, scale: f32) -> TrackSizingFunction {
    let tracks = parse_grid_auto_tracks(input, scale).expect("should parse");
    assert_eq!(tracks.len(), 1, "expected one track from {input:?}");
    tracks[0]
}

/// A track written in device pixels, as the reference for what a scaled CSS
/// length should equal.
fn device_px(n: f32) -> TrackSizingFunction {
    track(&format!("{n}dppx"), 1.0)
}

#[test]
fn px_is_a_css_pixel_and_scales_with_the_device() {
    assert_eq!(track("200px", 1.0), device_px(200.0));
    assert_eq!(track("200px", 2.0), device_px(400.0));
    assert_eq!(track("200px", 3.0), device_px(600.0));
}

#[test]
fn dip_and_a_bare_number_mean_the_same_as_px() {
    for scale in [1.0, 2.0, 3.0] {
        let px = track("200px", scale);
        assert_eq!(track("200dip", scale), px, "dip at scale {scale}");
        assert_eq!(track("200", scale), px, "bare number at scale {scale}");
    }
}

#[test]
fn dppx_is_a_literal_device_pixel_and_never_scales() {
    for scale in [1.0, 2.0, 3.0] {
        assert_eq!(track("200dppx", scale), device_px(200.0), "scale {scale}");
    }
}

#[test]
fn minmax_scales_both_ends() {
    assert_eq!(track("minmax(10px, 20px)", 3.0), track("minmax(30dppx, 60dppx)", 1.0));
}
