use mason_core::{AvailableSpace, Dimension, Display, LengthPercentage, Mason, MeasureOutput, NodeContext, NodeKind, Rect, Size, Style, TaffyTree};
use rand::Rng;
use std::ffi::{c_longlong, c_void};

fn main() {
    // flex_example();
    //percent_example()
    t();
}
#[derive(Debug)]
struct Data {
    kind: i32
}
fn t() -> Option<()> {
    let mut mason: TaffyTree<Data> = TaffyTree::new();
    let mut root_style = Style::default();
    root_style.display = Display::Block;

    let mut style = Style::default();
    style.display = Display::Block;


    style.max_size = Size {
        width: Dimension::length(12.),
        height: Dimension::length(12.),
    };
    style.padding = Rect {
        left: LengthPercentage::length(2.),
        right: LengthPercentage::length(4.),
        top: LengthPercentage::length(6.),
        bottom: LengthPercentage::length(8.),
    };

    style.border = Rect {
        left: LengthPercentage::length(1.),
        right: LengthPercentage::length(3.),
        top: LengthPercentage::length(5.),
        bottom: LengthPercentage::length(7.),
    };

    let child = mason.new_leaf(style).unwrap();

    let style = Style::default();

    let data =  Data {kind: 0};
    let text = mason.new_leaf_with_context(style, data).unwrap();

    let root_id = mason.new_with_children(root_style, &[child, text]).unwrap();

    mason.compute_layout_with_measure(root_id,Size{width: AvailableSpace::Definite(100.), height: AvailableSpace::Definite(100.)},|known_dimensions, available_space, _node_id, node_context, _style|{
        if let Size { width: Some(width), height: Some(height) } = known_dimensions {
            return Size { width, height };
        }

      match node_context {
          None => Size::zero(),
          Some(data) => {
              println!("data {:?}", data);
              Size::new(69., 420.).unwrap_or(Size::zero())
          }
      }
    }).unwrap();

   // mason.compute_layout(root_id, Size{width: AvailableSpace::Definite(100.), height: AvailableSpace::Definite(100.)}).unwrap();

    mason.print_tree(root_id);

    Some(())
}

fn percent_example() {
    let mut mason = Mason::new();
    let root_id = mason.create_node(NodeKind::Element);

    let mut rng = rand::rng();
    let random_size = vec![(0f32, 0f32); 1000]
        .into_iter()
        .map(|size| {
            let width: f32 = rng.random_range(0.0..1.);

            let height: f32 = rng.random_range(0.0..1.);

            (width, height)
        })
        .collect::<Vec<_>>();

    for i in 0..1000 {
        let child_id = mason.create_node(NodeKind::Element);

        {
            let child = mason.get_node_mut(child_id).unwrap();
            let size = random_size[i];
            let width = size.0;
            let height = size.1;

            let mut buffer = [0u8; 310];

            let size = Size {
                width: Dimension::percent(width),
                height: Dimension::percent(height),
            };

            child.style_mut().size = size;
        }

        mason.add_child(root_id, child_id);
    }

    {
        let mut root = mason.get_node_mut(root_id).unwrap();
        root.set_rounded(true);
        root.style_mut().size = Size {
            width: Dimension::percent(1.),
            height: Dimension::percent(1.),
        };
    }

    let child_a_id = mason.create_node(NodeKind::Element);

    {
        let child_a = mason.get_node_mut(child_a_id).unwrap();

        let size = Size {
            width: Dimension::percent(0.25),
            height: Dimension::percent(1.),
        };

        child_a.style_mut().size = size;
    }

    mason.add_child(root_id, child_a_id);

    let child_b_id = mason.create_node(NodeKind::Text);

    {
        let child_b = mason.get_node_mut(child_b_id).unwrap();

        struct Data {
            ptr: *const (f32, f32),
            len: usize,
        }

        extern "C" fn measure(
            data: *const c_void,
            width: f32,
            height: f32,
            available_space_width: f32,
            available_space_height: f32,
        ) -> c_longlong {
            MeasureOutput::make(100., 200.)
        }

        let data = Box::into_raw(Box::new(Data {
            ptr: random_size.as_ptr(),
            len: random_size.len(),
        }));

        let ctx = NodeContext::new(data as _, Some(measure));
        child_b.set_node_context(Some(ctx))
    }

    mason.add_child(root_id, child_a_id);

    mason.add_child(root_id, child_b_id);

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

    mason.compute(root_id);
    // mason.compute_size(root, root_size);
    //mason.compute_wh(root_id, 1179.0, 2556.0);

    // let layout = root.layout();
    //  println!(
    //      "layout {:?} {}",
    //      mason.layout(root_id),
    //      mason.child_count(root_id)
    //  );
}

fn flex_example() {
    // let mut mason = Mason::default();
    //
    // let mut style = Style::default();
    //
    // let root_size =
    //     Size::<Dimension>::new_with_dim(Dimension::length(1179.0), Dimension::length(2556.0));
    //
    // // style.set_size(root_size);
    //
    // style.set_flex_direction(FlexDirection::Column);
    //
    // let root = mason.new_node(style).unwrap();
    //
    // let mut child_a_style = Style::default();
    //
    // let size = Size::<Dimension>::new_with_dim(Dimension::length(1500.), Dimension::length(3000.));
    //
    // child_a_style.set_size(size);
    //
    // extern "C" fn func(
    //     data: *const c_void,
    //     width: f32,
    //     height: f32,
    //     available_space_width: f32,
    //     available_space_height: f32,
    // ) -> c_longlong {
    //     println!(
    //         "{:?} {:?} {} {}",
    //         width, height, available_space_width, available_space_width
    //     );
    //
    //     MeasureOutput::make(width, height)
    // };
    //
    // let context = NodeContext::new(0 as _, Some(func));
    //
    // let child_a = mason.new_node_with_context(child_a_style, context).unwrap();
    //
    // let mut child_b_style = Style::default();
    //
    // child_b_style.set_size(size);
    //
    // let context2 = NodeContext::new(0 as _, Some(func));
    //
    // let child_b = mason
    //     .new_node_with_context(child_b_style, context2)
    //     .unwrap();
    //
    // // mason.add_children(root, &[child_a, child_b]);
    //
    // mason.add_child(root, child_a);
    //
    // mason.add_child(root, child_b);
    //
    // mason.compute_size(root, Size::<AvailableSpace>::max_content());
    // // mason.compute_wh(root, 1000., 1000.);
    //
    // println!("layout {:?}", mason.layout(root))
}
