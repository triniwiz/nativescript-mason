use mason_core::style::Style;
use mason_core::{
    percent, AvailableSpace, Dimension, Display, FlexDirection, LengthPercentage, Mason,
    MeasureOutput, NodeContext, Size,
};
use std::ffi::{c_longlong, c_void};

fn main() {
    // flex_example();
    percent_example()
}

fn percent_example() {
    let mut mason = Mason::default();

    let mut style = Style::default();

    let root_size = Size::<AvailableSpace>::new_available_space(1179.0, 2556.0);

    style.set_size(Size::<Dimension>::new_with_dim(
        Dimension::Percent(1.),
        Dimension::Percent(1.),
    ));

    style.set_display(Display::Block);

    let root = mason.new_node(style).unwrap();

    let mut child_a_style = Style::default();

    child_a_style.set_display(Display::Block);

    let size = Size::<Dimension>::new_with_dim(Dimension::Percent(0.5), Dimension::Percent(0.5));

    child_a_style.set_size(size);

    let child_a = mason.new_node(child_a_style).unwrap();

    mason.add_child(root, child_a);
    /* let mut child_a_style = Style::default();

    let size = Size::<Dimension>::new_with_dim(Dimension::Points(1500.), Dimension::Points(3000.));

    child_a_style.set_size(size);

    let child_a = mason.new_node_with_measure_func(child_a_style, MeasureFunc::Boxed(Box::new(|known,available|{

        println!("{:?} {:?}", &known, &available);

        known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
    }))).unwrap();

    let mut child_b_style = Style::default();

    child_b_style.set_size(size);

    let child_b = mason.new_node_with_measure_func(child_b_style, MeasureFunc::Boxed(Box::new(|known,available|{

        println!("{:?} {:?}", &known, &available);

        known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
    }))).unwrap();

    // mason.add_children(root, &[child_a, child_b]);

    mason.add_child(root, child_a);

    mason.add_child(root, child_b);

    */

    // mason.compute(root);
    mason.compute_size(root, root_size);

    println!(
        "layout {:?} {}",
        mason.layout(root),
        mason.child_count(root)
    );
}

fn flex_example() {
    let mut mason = Mason::default();

    let mut style = Style::default();

    let root_size =
        Size::<Dimension>::new_with_dim(Dimension::Length(1179.0), Dimension::Length(2556.0));

    // style.set_size(root_size);

    style.set_flex_direction(FlexDirection::Column);

    let root = mason.new_node(style).unwrap();

    let mut child_a_style = Style::default();

    let size = Size::<Dimension>::new_with_dim(Dimension::Length(1500.), Dimension::Length(3000.));

    child_a_style.set_size(size);

    extern "C" fn func(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        println!(
            "{:?} {:?} {} {}",
            width, height, available_space_width, available_space_width
        );

        MeasureOutput::make(width, height)
    };

    let context = NodeContext::new(0 as _, Some(func));

    let child_a = mason.new_node_with_context(child_a_style, context).unwrap();

    let mut child_b_style = Style::default();

    child_b_style.set_size(size);

    let context2 = NodeContext::new(0 as _, Some(func));

    let child_b = mason
        .new_node_with_context(child_b_style, context2)
        .unwrap();

    // mason.add_children(root, &[child_a, child_b]);

    mason.add_child(root, child_a);

    mason.add_child(root, child_b);

    mason.compute_size(root, Size::<AvailableSpace>::max_content());
    // mason.compute_wh(root, 1000., 1000.);

    println!("layout {:?}", mason.layout(root))
}
