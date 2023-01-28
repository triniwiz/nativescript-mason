#![feature(test)]

extern crate test;

use mason_core::{AvailableSpace, Dimension, FlexDirection, FromPercent, FromPoints, LengthPercentage, Mason, MaxTrackSizingFunction, MeasureFunc, MinTrackSizingFunction, NonRepeatedTrackSizingFunction, Size, TaffyFitContent};
use mason_core::style::Style;

pub fn flex_example() -> Vec<f32> {
    let mut mason = Mason::new();

    let mut style = Style::default();

    style.set_flex_direction(FlexDirection::Column);

    let root = mason.new_node(style).unwrap();

    let mut child_a_style = Style::default();

    let size = Size::<Dimension>::new_with_dim(Dimension::Points(1500.), Dimension::Points(3000.));

    child_a_style.set_size(size);

    let child_a = mason.new_node_with_measure_func(child_a_style, MeasureFunc::Boxed(Box::new(|known,available|{
        known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
    }))).unwrap();

    let mut child_b_style = Style::default();

    child_b_style.set_size(size);

    let child_b = mason.new_node_with_measure_func(child_b_style, MeasureFunc::Boxed(Box::new(|known,available|{
        known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
    }))).unwrap();

     mason.add_children(root, &[child_a, child_b]);

    mason.compute_size(root, Size::<AvailableSpace>::max_content());

    mason.layout(root)
}

pub fn parse_non_repeated_track_sizing_function_value(){
    mason_core::ffi::parse_non_repeated_track_sizing_function_value(
        NonRepeatedTrackSizingFunction {
            min: MinTrackSizingFunction::from_percent(0.1),
            max: MaxTrackSizingFunction::from_points(100.),
        }
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::{Bencher, black_box};

    #[test]
    fn it_works() {
        assert_eq!(2, flex_example().len());
    }

    #[bench]
    fn bench_flex_example(b: &mut Bencher) {
        b.iter(|| {
            flex_example();
        });
    }

    #[bench]
    fn bench_parse_non_repeated_track_sizing_function_value(b: &mut Bencher) {
        b.iter(|| {
            parse_non_repeated_track_sizing_function_value();
        });
    }
}

fn main() {

}