use mason_core::{style::utils::dimension_from_type_value, *};

fn assert_dimension(value: Dimension, expected_type: i8, expected_value: f32) {
    let mut mason = Mason::new();
    let node = mason.create_node();
    let id = node.id();

    mason.with_style_mut(id, |style| {
        style.set_width(value);
        style.set_height(value);
        style.set_flex_basis(value);
    });

    mason.with_style(id, |style| {
        assert_eq!(style.width().tag(), value.tag());
        assert_eq!(style.height().tag(), value.tag());
        assert_eq!(style.get_flex_basis().tag(), value.tag());
    });

    let round_tripped = dimension_from_type_value(expected_type, expected_value);
    assert_eq!(round_tripped.tag(), value.tag());
    assert_eq!(round_tripped.value(), expected_value);
}

#[test]
fn dimension_sizing_keywords_roundtrip_through_style_buffer() {
    assert_dimension(Dimension::min_content(), 3, 0.0);
    assert_dimension(Dimension::max_content(), 4, 0.0);
    assert_dimension(Dimension::fit_content(), 5, 0.0);
    assert_dimension(Dimension::fit_content_px(42.0), 6, 42.0);
    assert_dimension(Dimension::fit_content_percent(0.5), 7, 0.5);
    assert_dimension(Dimension::stretch(), 8, 0.0);
    assert_dimension(Dimension::content(), 9, 0.0);
}
