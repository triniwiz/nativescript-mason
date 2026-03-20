use mason_core::MeasureOutput;

#[test]
fn measure_output_tags_roundtrip() {
    let min_bits = MeasureOutput::MIN_BITS;
    let max_bits = MeasureOutput::MAX_BITS;

    let w = f32::from_bits(min_bits);
    let h = f32::from_bits(max_bits);

    let packed = MeasureOutput::make(w, h);

    let out_w = MeasureOutput::get_width(packed);
    let out_h = MeasureOutput::get_height(packed);

    assert_eq!(out_w.to_bits(), min_bits);
    assert_eq!(out_h.to_bits(), max_bits);
}
