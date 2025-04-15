use mason_core::{
    AvailableSpace, Dimension, Display, LengthPercentage, LengthPercentageAuto,
    Mason, MeasureOutput, NodeContext, Position, Rect, Size, Style,
};
use rand::Rng;
use std::ffi::{c_longlong, c_void};

fn main() {
    // flex_example();
    //percent_example()
    // t();
    //absolute();
    // leafTest();
    textText()
}
#[derive(Debug)]
struct NodeData {
    id: i32,
    text: Option<String>,
}

fn textText() {
    let mut mason = Mason::new();
    let mut root_style = Style::default();
    root_style.display = Display::Block;
    root_style.size.width = Dimension::length(600.);
    let root = mason.create_node(None);

    extern "C" fn measure_text(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let data = unsafe { &*(data as *const NodeData) };
        println!(
            "{:?} {:?} x {:?}  ....  {:?} x {:?}",
            data, width, height, available_space_width, available_space_height
        );
        let width = data.text.as_ref().and_then(|value| Some(value.len() * 10)).unwrap_or_default();
        MeasureOutput::make(width as f32, 1.)
    }

    let text_root = mason.create_node(None);
    let mut text_style = Style::default();
    text_style.display = Display::Flex;

    mason.set_style(&text_root, text_style);

    let first_data = NodeData {
        id: 0,
        text: Some("This".to_string()),
    };

    let first_context =
        NodeContext::new(Box::into_raw(Box::new(first_data)) as _, Some(measure_text));
    let first_text_actual_node = mason.create_node(Some(first_context));

    mason.add_child(&text_root, &first_text_actual_node);

    let second_data = NodeData {
        id: 1,
        text: Some(" is".to_string()),
    };

    let second_context =
        NodeContext::new(Box::into_raw(Box::new(second_data)) as _, Some(measure_text));
    let second_text_actual_node = mason.create_node(Some(second_context));

    mason.add_child(&text_root, &second_text_actual_node);





    mason.add_child(&root, &text_root);
    mason.compute_wh(&root, 1000., 1000.);
    let layout = mason.layout(&root);
    println!("layout: {:?}", layout);
  //  mason.print_tree(&root);
}
fn leafTest() {
    let mut mason = Mason::new();

    extern "C" fn measure_(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let data = unsafe { &*(data as *const NodeData) };
        println!(
            "{:?} {:?} x {:?}  ....  {:?} x {:?}",
            data, width, height, available_space_width, available_space_height
        );
        MeasureOutput::make(100., 200.)
    }

    let root_data = NodeData { id: 0, text: None };
    let ctx = NodeContext::new(Box::into_raw(Box::new(root_data)) as _, Some(measure_));
    let root = mason.create_node(None);

    let mut root_style = Style::default();
    root_style.display = Display::Block;
    // root_style.flex_direction = FlexDirection::Column;
    mason.set_style(&root, root_style);

    let leaf_a_data = NodeData { id: 1, text: None };
    let leaf_a_ctx = NodeContext::new(Box::into_raw(Box::new(leaf_a_data)) as _, Some(measure_));
    let leaf_a = mason.create_node(Some(leaf_a_ctx));

    let mut leaf_a_style = Style::default();
    leaf_a_style.display = Display::Flex;
    leaf_a_style.min_size = Size {
        width: Dimension::length(100.),
        height: Dimension::length(100.),
    };

    leaf_a_style.size = Size {
        width: Dimension::length(100.),
        height: Dimension::length(100.),
    };

    mason.set_style(&leaf_a, leaf_a_style);

    mason.add_child(&root, &leaf_a);

    mason.compute_wh(&root, 1206.0, 2622.0);

    //  mason.compute(&root);
    mason.print_tree(&root);
}

#[derive(Debug)]
struct Data {
    kind: i32,
}

fn absolute() -> Option<()> {
    let mut mason = Mason::new();

    extern "C" fn measure_f(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        MeasureOutput::make(100., 200.)
    }

    let child = mason.create_node(None);

    {
        let mut style = Style::default();
        style.display = Display::Block;
        style.position = Position::Absolute;

        style.inset = Rect {
            right: LengthPercentageAuto::length(0.),
            top: LengthPercentageAuto::auto(),
            left: LengthPercentageAuto::auto(),
            bottom: LengthPercentageAuto::percent(0.5),
        };

        style.max_size = Size {
            width: Dimension::length(12.),
            height: Dimension::length(12.),
        };

        /*
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
        */

        mason.set_style(&child, style);
    }

    let root_id = mason.create_node(None);

    let mut style = Style::default();
    style.display = Display::Block;
    style.size = Size {
        width: Dimension::length(1080.0),
        height: Dimension::length(1984.0),
    };

    mason.set_style(&root_id, style);

    mason.add_children(&root_id, &[child.id()]);

    mason.compute_layout(
        &root_id,
        Size {
            width: AvailableSpace::Definite(1080.0),
            height: AvailableSpace::Definite(1984.0),
        },
    );

    let layout = mason.layout(&root_id);

    mason.print_tree(&root_id);

    Some(())
}

fn t() -> Option<()> {
    let mut mason = Mason::new();
    let mut root_style = Style::default();
    root_style.display = Display::Block;

    let mut style = Style::default();
    style.display = Display::Block;

    extern "C" fn measure_f(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        MeasureOutput::make(100., 200.)
    }

    let child = mason.create_node(None);

    /*

        TREE
    └──  BLOCK [x: 0    y: 0    w: 100  h: 26   content_w: 12   content_h: 26   border: l:0 r:0 t:0 b:0, padding: l:0 r:0 t:0 b:0] (NodeId(4294967298))
        └──  LEAF [x: 0    y: 0    w: 12   h: 26   content_w: 8    content_h: 0    border: l:1 r:3 t:5 b:7, padding: l:2 r:4 t:6 b:8] (NodeId(4294967297))

         */

    {
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

        mason.set_style(&child, style);
    }

    let root_id = mason.create_node(None);

    mason.add_children(&root_id, &[child.id()]);

    mason.compute_layout(
        &root_id,
        Size {
            width: AvailableSpace::Definite(1080.0),
            height: AvailableSpace::Definite(1984.0),
        },
    );

    mason.print_tree(&root_id);

    Some(())
}

fn percent_example() {
    let mut mason = Mason::new();
    let root_id = mason.create_node(None);

    let mut rng = rand::rng();
    let random_size = vec![(0f32, 0f32); 1000]
        .into_iter()
        .map(|size| {
            let width: f32 = rng.random_range(0.0..1.);

            let height: f32 = rng.random_range(0.0..1.);

            (width, height)
        })
        .collect::<Vec<_>>();

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
        println!("??");
        MeasureOutput::make(100., 200.)
    }

    let data = Box::into_raw(Box::new(Data {
        ptr: random_size.as_ptr(),
        len: random_size.len(),
    }));

    for i in 0..1000 {
        let ctx = NodeContext::new(data as _, Some(measure));
        let child_id = mason.create_node(Some(ctx));

        {
            //  let child = mason.get_node_mut(child_id).unwrap();
            let size = random_size[i];
            let width = size.0;
            let height = size.1;

            let mut buffer = [0u8; 310];

            let size = Size {
                width: Dimension::percent(width),
                height: Dimension::percent(height),
            };

            // child.style_mut().size = size;
        }

        mason.add_child(&root_id, &child_id);
    }

    {
        //  let mut root = mason.get_node_mut(root_id).unwrap();
        // root.set_rounded(true);
        //  root.style_mut().size = Size {
        //      width: Dimension::percent(1.),
        //      height: Dimension::percent(1.),
        //  };
    }

    let child_a_id = mason.create_node(None);

    {
        //   let child_a = mason.get_node_mut(child_a_id).unwrap();

        let size = Size {
            width: Dimension::percent(0.25),
            height: Dimension::percent(1.),
        };

        // child_a.style_mut().size = size;
    }

    mason.add_child(&root_id, &child_a_id);

    let child_b_id = mason.create_node(None);

    {
        //  let child_b = mason.get_node_mut(child_b_id).unwrap();

        let ctx = NodeContext::new(data as _, Some(measure));
        mason.set_node_context(&child_b_id, ctx)
    }

    mason.add_child(&root_id, &child_a_id);

    mason.add_child(&root_id, &child_b_id);

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

    mason.compute(&root_id);
    // mason.compute_size(root, root_size);
    //mason.compute_wh(root_id, 1179.0, 2556.0);

    // let layout = root.layout();
    //  println!(
    //      "layout {:?} {}",
    //      mason.layout(root_id),
    //      mason.child_count(root_id)
    //  );

    mason.print_tree(&root_id);
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
