use mason_core::*;

#[test]
fn abs_align_items_and_justify_content_flex_end() {
    let mut mason = Mason::new();

    let root = mason.create_node();
    let rid = root.id();
    mason.with_style_mut(rid, |s| {
        s.set_display(Display::Flex);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(110.0),
            height: taffy::style::Dimension::length(100.0),
        });
        s.set_align_items(Some(taffy::style::AlignItems::FLEX_END));
        s.set_justify_content(Some(taffy::style::JustifyContent::FLEX_END));
    });

    let child = mason.create_node();
    let cid = child.id();
    mason.with_style_mut(cid, |s| {
        s.set_position(Position::Absolute);
        s.set_size(taffy::geometry::Size {
            width: taffy::style::Dimension::length(60.0),
            height: taffy::style::Dimension::length(40.0),
        });
    });

    mason.append_node(rid, &[cid]);

    mason.compute(rid);

    let layout = mason.layout_raw(cid);
    println!(
        "child location = ({}, {}), size = ({}, {})",
        layout.location.x, layout.location.y, layout.size.width, layout.size.height
    );

    assert!((layout.location.x - 50.0).abs() < 0.5, "x = {}", layout.location.x);
    assert!((layout.location.y - 60.0).abs() < 0.5, "y = {}", layout.location.y);
}
