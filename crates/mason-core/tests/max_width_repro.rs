use mason_core::*;

#[test]
fn max_width_overrides_width_root() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_size(Size {
            width: Dimension::length(200.0),
            height: Dimension::auto(),
        });
        s.set_max_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::auto(),
        });
    });

    mason.compute_wh(rid, f32::NAN, f32::NAN);
    let l = mason.layout_raw(rid);
    println!("width={} height={}", l.size.width, l.size.height);
    assert!((l.size.width - 100.0).abs() < 0.5, "expected clamped width 100, got {}", l.size.width);
}
