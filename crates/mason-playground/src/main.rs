use mason_core::style::{DisplayMode, StyleKeys};
use mason_core::{
    AlignContent, AlignItems, Dimension, Display, FlexDirection, JustifyContent, LengthPercentage,
    LengthPercentageAuto, Mason, MeasureOutput, Rect, Size,
};
use std::ffi::{c_longlong, c_void};

#[derive(Debug)]
struct NodeData {
    id: i32,
    text: Option<String>,
}

fn main() {
    // flex_example();
    //percent_example()
    // t();
    //absolute();
    // leafTest();
    // textText()
    // p()
    // p_size();
    //single_child();
    //single_child_percentage();
    // flex_bug();
    //scroll();
    //scroll_horizontal();
    // inline_bug();
    //bug();
    //insert_test()
    //inline_node()
    //  inline_mix_bug()
    // flex_direction_bug()
    //flex_grow_bug()
   // inline_size_bug()
    wrap_bug()
}

fn wrap_bug() {
    let mut mason = Mason::new();

    extern "C" fn inline_mix_bug_measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let id = data as *const i32;
        if unsafe { *(id) } == 2 {
            return MeasureOutput::make(20., 20.);
        }

        MeasureOutput::make(available_space_width, 4000.)
    }

    let root = mason.create_node();

    let inline = mason.create_text_node();

    mason.add_child(root.id(), inline.id());

    mason.set_measure(
        inline.id(),
        Some(inline_mix_bug_measure_inline),
        &2 as *const i32 as _,
    );

    let one = mason.create_text_node();
    mason.with_style_mut(one.id(), |style| {
        style.set_display(Display::Block);
        style.set_display_mode(DisplayMode::None);
    });

    mason.add_child(root.id(), inline.id());
    mason.add_child(root.id(), one.id());

    mason.set_measure(
        one.id(),
        Some(inline_mix_bug_measure_inline),
        &1 as *const i32 as _,
    );

    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(root.id());
}

fn inline_size_bug() {
    let mut mason = Mason::new();

    extern "C" fn inline_mix_bug_measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        MeasureOutput::make(200., 200.)
    }

    let root = mason.create_node();
    let one = mason.create_text_node();
    mason.with_style_mut(one.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(0f32),
            height: Dimension::length(0f32),
        })
    });

    mason.add_child(root.id(), one.id());

    mason.set_measure(
        one.id(),
        Some(inline_mix_bug_measure_inline),
        &1 as *const i32 as _,
    );

    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(root.id());
}

fn flex_grow_bug() {
    extern "C" fn flex_grow_bug_measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let id = data as *const i32;
        if unsafe { *(id) } == 1 {
            return MeasureOutput::make(10., 10.);
        }
        MeasureOutput::make(200., 200.)
    }

    let mut mason = Mason::new();
    let body = mason.create_node();
    let root = mason.create_node();

    mason.add_child(body.id(), root.id());

    let div = mason.create_node();
    mason.with_style_mut(div.id(), |style| {
        style.set_display(Display::Flex);
    });

    let div_a = mason.create_node();

    mason.with_style_mut(div_a.id(), |style| {
        style.set_flex_grow(1.);
    });

    let text_a = mason.create_anonymous_text_node();
    mason.add_child(div_a.id(), text_a.id());

    mason.set_measure(
        text_a.id(),
        Some(flex_grow_bug_measure_inline),
        &1 as *const i32 as _,
    );

    let div_b = mason.create_node();

    mason.with_style_mut(div_b.id(), |style| {
        style.set_flex_grow(1.);
    });

    let text_b = mason.create_anonymous_text_node();
    mason.add_child(div_b.id(), text_b.id());

    mason.set_measure(
        text_b.id(),
        Some(flex_grow_bug_measure_inline),
        &1 as *const i32 as _,
    );

    let div_c = mason.create_node();

    mason.with_style_mut(div_c.id(), |style| {
        style.set_flex_grow(1.);
    });

    let text_c = mason.create_anonymous_text_node();
    mason.add_child(div_c.id(), text_c.id());

    mason.set_measure(
        text_c.id(),
        Some(flex_grow_bug_measure_inline),
        &1 as *const i32 as _,
    );

    let div_d = mason.create_node();
    let text_d = mason.create_anonymous_text_node();
    mason.add_child(div_d.id(), text_d.id());

    mason.set_measure(
        text_d.id(),
        Some(flex_grow_bug_measure_inline),
        &1 as *const i32 as _,
    );

    mason.with_style_mut(div_d.id(), |style| {
        style.set_flex_grow(2.);
    });

    let div_e = mason.create_node();
    let text_e = mason.create_anonymous_text_node();
    mason.add_child(div_e.id(), text_e.id());

    mason.set_measure(
        text_e.id(),
        Some(flex_grow_bug_measure_inline),
        &1 as *const i32 as _,
    );

    mason.with_style_mut(div_e.id(), |style| {
        style.set_flex_grow(2.);
    });

    let div_f = mason.create_node();

    mason.with_style_mut(div_f.id(), |style| {
        style.set_flex_grow(1.);
    });

    let text_f = mason.create_anonymous_text_node();
    mason.add_child(div_f.id(), text_f.id());

    mason.with_style_mut(text_f.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(10.),
            height: Dimension::length(10.),
        })
    });

    mason.add_child(div.id(), div_a.id());
    mason.add_child(div.id(), div_b.id());
    mason.add_child(div.id(), div_c.id());
    mason.add_child(div.id(), div_d.id());
    mason.add_child(div.id(), div_e.id());
    mason.add_child(div.id(), div_f.id());

    mason.add_child(root.id(), div.id());

    mason.compute_wh(body.id(), 2000., 2000.);

    mason.print_tree(body.id());
}
fn flex_direction_bug() {
    let mut mason = Mason::new();
    let body = mason.create_node();
    let root = mason.create_node();

    let h4_1 = mason.create_text_node();
    let div_1 = mason.create_node();

    mason.with_style_mut(div_1.id(), |style| {
        style.set_border(Rect {
            left: LengthPercentage::length(1.),
            right: LengthPercentage::length(1.),
            top: LengthPercentage::length(1.),
            bottom: LengthPercentage::length(1.),
        });
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::ColumnReverse);
        style.set_size(Size {
            width: Dimension::length(200.),
            height: Dimension::length(200.),
        })
    });

    let div_1_box_a = mason.create_node();

    let div_1_box_a_txt = mason.create_text_node();

    mason.add_child(div_1_box_a.id(), div_1_box_a_txt.id());

    mason.with_style_mut(div_1_box_a.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    let div_1_box_b = mason.create_node();

    mason.with_style_mut(div_1_box_b.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    let div_1_box_c = mason.create_node();

    mason.with_style_mut(div_1_box_c.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    mason.add_child(root.id(), h4_1.id());

    mason.add_child(root.id(), div_1.id());

    mason.add_child(div_1.id(), div_1_box_a.id());

    mason.add_child(div_1.id(), div_1_box_b.id());

    mason.add_child(div_1.id(), div_1_box_c.id());

    let h4_2 = mason.create_text_node();
    let div_2 = mason.create_node();

    mason.with_style_mut(div_2.id(), |style| {
        style.set_border(Rect {
            left: LengthPercentage::length(1.),
            right: LengthPercentage::length(1.),
            top: LengthPercentage::length(1.),
            bottom: LengthPercentage::length(1.),
        });
        style.set_display(Display::Flex);
        style.set_flex_direction(FlexDirection::RowReverse);
        style.set_size(Size {
            width: Dimension::length(200.),
            height: Dimension::length(200.),
        })
    });

    let div_2_box_a = mason.create_node();

    let div_2_box_a_txt = mason.create_text_node();

    mason.add_child(div_2_box_a.id(), div_2_box_a_txt.id());

    mason.with_style_mut(div_2_box_a.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    let div_2_box_b = mason.create_node();

    mason.with_style_mut(div_2_box_b.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    let div_2_box_c = mason.create_node();

    mason.with_style_mut(div_2_box_c.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(50.),
            height: Dimension::length(50.),
        })
    });

    mason.add_child(root.id(), h4_2.id());

    mason.add_child(root.id(), div_2.id());

    mason.add_child(div_2.id(), div_2_box_a.id());

    mason.add_child(div_2.id(), div_2_box_b.id());

    mason.add_child(div_2.id(), div_2_box_c.id());

    mason.add_child(body.id(), root.id());

    mason.compute_wh(body.id(), 2000., 2000.);

    mason.print_tree(body.id());
}
fn inline_mix_bug() {
    let mut mason = Mason::new();

    extern "C" fn inline_mix_bug_measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let id = data as *const i32;
        if unsafe { *(id) } == 1 {
            return MeasureOutput::make(10., 20.);
        } else if unsafe { *(id) } == 2 {
            return MeasureOutput::make(20., 20.);
        } else if unsafe { *(id) } == 3 {
            return MeasureOutput::make(0., 0.);
        }

        MeasureOutput::make(200., 200.)
    }

    let root = mason.create_node();
    let one = mason.create_text_node();
    let two = mason.create_text_node();
    let three = mason.create_text_node();

    let div = mason.create_node();
    let second = mason.create_text_node();

    let a = mason.create_text_node();
    let b = mason.create_text_node();
    let c = mason.create_text_node();

    let d = mason.create_text_node();

    mason.add_child(root.id(), one.id());
    mason.add_child(root.id(), two.id());
    mason.add_child(root.id(), three.id());

    mason.add_child(div.id(), second.id());
    mason.add_child(div.id(), a.id());
    mason.add_child(div.id(), b.id());
    mason.add_child(div.id(), c.id());
    mason.add_child(div.id(), d.id());

    mason.add_child(root.id(), div.id());

    mason.set_measure(
        one.id(),
        Some(inline_mix_bug_measure_inline),
        &1 as *const i32 as _,
    );
    mason.set_measure(
        two.id(),
        Some(inline_mix_bug_measure_inline),
        &1 as *const i32 as _,
    );
    mason.set_measure(
        three.id(),
        Some(inline_mix_bug_measure_inline),
        &1 as *const i32 as _,
    );

    mason.set_measure(
        second.id(),
        Some(inline_mix_bug_measure_inline),
        &2 as *const i32 as _,
    );
    mason.set_measure(
        a.id(),
        Some(inline_mix_bug_measure_inline),
        &2 as *const i32 as _,
    );
    mason.set_measure(
        b.id(),
        Some(inline_mix_bug_measure_inline),
        &2 as *const i32 as _,
    );
    mason.set_measure(
        c.id(),
        Some(inline_mix_bug_measure_inline),
        &2 as *const i32 as _,
    );
    mason.set_measure(
        d.id(),
        Some(inline_mix_bug_measure_inline),
        &3 as *const i32 as _,
    );

    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(root.id());
}

fn inline_node() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let first = mason.create_text_node();
    let second = mason.create_text_node();
    mason.with_style_mut(first.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
        style.set_size(Size {
            width: Dimension::length(10.),
            height: Dimension::length(10.),
        });
    });

    mason.with_style_mut(second.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
        style.set_size(Size {
            width: Dimension::length(10.),
            height: Dimension::length(50.),
        });
    });

    mason.add_child(root.id(), first.id());
    mason.add_child(root.id(), second.id());
    mason.compute(root.id());
    mason.print_tree(root.id());
}

fn insert_test() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let node_a = mason.create_node();
    mason.with_style_mut(node_a.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(1f32),
            height: Dimension::length(1f32),
        });
    });
    let node_b = mason.create_node();
    mason.with_style_mut(node_b.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(2f32),
            height: Dimension::length(2f32),
        });
    });

    mason.add_child(root.id(), node_a.id());

    let node_c = mason.create_node();
    mason.with_style_mut(node_c.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(3f32),
            height: Dimension::length(3f32),
        });
    });

    mason.add_child(root.id(), node_c.id());

    mason.insert_child_before(root.id(), node_b.id(), node_c.id());

    let node_d = mason.create_node();
    mason.with_style_mut(node_d.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(4f32),
            height: Dimension::length(4f32),
        });
    });

    mason.insert_child_after(root.id(), node_d.id(), node_c.id());

    mason.compute(root.id());

    mason.print_tree(root.id());
}

fn bug() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let node = mason.create_text_node();

    extern "C" fn bug_measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let id = data as *const i32;
        if unsafe { *(id) } == 1 {
            return MeasureOutput::make(600., 400.);
        }
        MeasureOutput::make(200., 200.)
    }

    mason.set_measure(node.id(), Some(bug_measure_inline), &1 as *const i32 as _);

    let child = mason.create_node();

    mason.with_style_mut(child.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(300.),
            height: Dimension::length(300.),
        });
    });

    mason.add_child(node.id(), child.id());

    mason.add_child(root.id(), node.id());

    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(root.id());
}

fn inline_bug() {
    let mut mason = Mason::new();
    let root = mason.create_node();

    // mason.with_style_mut(root.id(), |style| {
    //     style.set_size(Size {
    //         width: Dimension::length(1000.),
    //         height: Dimension::length(1000.),
    //     });
    // });

    let child = mason.create_node();

    let inline = mason.create_node();
    mason.with_style_mut(inline.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
    });

    extern "C" fn measure_inline(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let id = data as *const i32;
        if unsafe { *(id) } == 1 {
            return MeasureOutput::make(100., 100.);
        }
        MeasureOutput::make(200., 200.)
    }

    mason.set_measure(inline.id(), Some(measure_inline), &1 as *const i32 as _);

    let child2 = mason.create_node();

    let inline2 = mason.create_node();
    mason.with_style_mut(inline2.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
    });

    mason.set_measure(inline2.id(), Some(measure_inline), &2 as *const i32 as _);

    mason.add_child(child2.id(), inline2.id());

    mason.add_child(child.id(), inline.id());

    mason.add_child(child.id(), child2.id());

    mason.add_child(root.id(), child.id());

    mason.compute(root.id());

    mason.print_tree(root.id());
}

fn scroll() {
    let mut mason = Mason::new();
    let container = mason.create_node();
    mason.with_style_mut(container.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(1320.0),
            height: Dimension::length(2868.0),
        })
    });
    let root = mason.create_node();
    let child = mason.create_node();
    mason.with_style_mut(child.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(1320.),
            height: Dimension::length(10203.),
        })
    });

    mason.add_child(container.id(), root.id());
    mason.add_child(root.id(), child.id());

    mason.compute_wh(container.id(), 1320.0, 2868.0);

    mason.print_tree(container.id());
}

fn scroll_horizontal() {
    let mut mason = Mason::new();
    let container = mason.create_node();
    mason.with_style_mut(container.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(1320.0),
            height: Dimension::length(2868.0),
        })
    });
    let root = mason.create_node();

    let child = mason.create_node();
    mason.with_style_mut(child.id(), |style| {
        style.set_max_size(Size {
            width: Dimension::length(1000.),
            height: Dimension::auto(),
        });
        style.set_size(Size {
            width: Dimension::length(8395.0),
            height: Dimension::length(54.0),
        })
    });

    mason.add_child(container.id(), root.id());
    mason.add_child(root.id(), child.id());

    mason.compute_wh(container.id(), 1320.0, 2868.0);

    mason.print_tree(container.id());
}

fn flex_bug() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    let child = mason.create_node();
    let child2 = mason.create_node();

    mason.with_style_mut(root.id(), |style| {
        style.set_size(Size {
            width: Dimension::percent(1.),
            height: Dimension::percent(1.),
        });

        style.set_align_content(Some(AlignContent::Stretch));
        style.set_align_items(Some(AlignItems::Center));
        style.set_flex_direction(FlexDirection::Column);
        style.set_justify_content(Some(JustifyContent::Start));
        style.set_display(Display::Flex);
    });

    mason.with_style_mut(child.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(1.),
            height: Dimension::length(1.),
        })
    });

    mason.with_style_mut(child2.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(100.),
            height: Dimension::length(100.),
        })
    });

    mason.add_child(root.id(), child.id());
    mason.add_child(root.id(), child2.id());
    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(root.id());
}

fn single_child_percentage() {
    let mut mason = Mason::new();
    let root = mason.create_node();

    mason.with_style_mut(root.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(400.),
            height: Dimension::length(400.),
        });
        style.set_padding(Rect {
            left: LengthPercentage::length(0.),
            right: LengthPercentage::length(0.),
            top: LengthPercentage::length(50.),
            bottom: LengthPercentage::length(0.),
        });
    });

    let child = mason.create_node();
    mason.with_style_mut(child.id(), |style| {
        style.set_size(Size {
            width: Dimension::percent(1.),
            height: Dimension::percent(1.),
        });
    });
    mason.add_child(root.id(), child.id());

    mason.compute_wh(root.id(), 400.0, 400.0);
    mason.print_tree(root.id());
    // let layout = mason.layout(root.id());
    // println!("layout: {:?}", layout);
}

fn single_child() {
    let mut mason = Mason::new();
    let root = mason.create_node();

    mason.with_style_mut(root.id(), |style| {
        style.set_padding(Rect {
            left: LengthPercentage::length(0.),
            right: LengthPercentage::length(0.),
            top: LengthPercentage::length(50.),
            bottom: LengthPercentage::length(0.),
        });
    });

    let child = mason.create_node();
    mason.with_style_mut(child.id(), |style| {
        style.set_size(Size {
            width: Dimension::length(100.),
            height: Dimension::length(100.),
        });
    });
    mason.add_child(root.id(), child.id());

    mason.compute_wh(root.id(), 400.0, 400.0);
    mason.print_tree(root.id());
    // let layout = mason.layout(root.id());
    // println!("layout: {:?}", layout);
}
fn p_size() {
    let mut mason = Mason::new();

    let root = mason.create_node();

    mason.with_style_mut(root.id(), |style| {
        style.set_top_inset(LengthPercentageAuto::length(100.));
    });

    let p = mason.create_node();
    mason.with_style_mut(p.id(), |style| {
        style.set_display_mode(DisplayMode::Box);
        style.set_display(Display::Block);
        style.set_size(Size {
            width: Dimension::length(150.0),
            height: Dimension::length(300.0),
        });
    });

    let text = mason.create_node();
    mason.with_style_mut(text.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
        style.set_size(Size {
            width: Dimension::length(50.0),
            height: Dimension::length(50.0),
        });
    });

    mason.add_child(p.id(), text.id());

    mason.add_child(root.id(), p.id());

    mason.compute_wh(root.id(), 400., 400.);

    mason.print_tree(root.id());
}

fn span() {
    let mut mason = Mason::new();

    extern "C" fn measure_text(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        println!(
            "measure_text {:?} {:?} x {:?}  ....  {:?} x {:?}",
            data, width, height, available_space_width, available_space_height
        );
        MeasureOutput::make(300., 100.)
    }

    let root = mason.create_node();

    let p = mason.create_node();
    mason.set_measure(p.id(), Some(measure_text), 0 as _);
    mason.with_style_mut(p.id(), |style| {
        style.set_display_mode(DisplayMode::Box);
        style.set_width(Dimension::length(600.));
    });

    let text = mason.create_node();
    mason.set_measure(text.id(), Some(measure_text), 0 as _);

    mason.with_style_mut(text.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);
        let size = style.data().len();
        let buf = style.data_mut().as_mut_ptr() as *mut f32;
        let style_int = unsafe { std::slice::from_raw_parts_mut(buf, size / 4) };
        style_int[StyleKeys::MIN_CONTENT_WIDTH as usize / 4] = 20.;
        style_int[StyleKeys::MAX_CONTENT_WIDTH as usize / 4] = 300.;
        style_int[StyleKeys::MIN_CONTENT_HEIGHT as usize / 4] = 200.;
        style_int[StyleKeys::MAX_CONTENT_HEIGHT as usize / 4] = 300.;
    });

    mason.add_child(p.id(), text.id());

    mason.add_child(root.id(), p.id());

    mason.compute_wh(root.id(), 1000., 1000.);

    mason.print_tree(p.id());
}

fn textText() {
    let mut mason = Mason::new();
    let root = mason.create_node();
    mason.with_style_mut(root.id(), |style| {
        style.set_width(Dimension::length(600.));
    });

    extern "C" fn measure_text(
        data: *const c_void,
        width: f32,
        height: f32,
        available_space_width: f32,
        available_space_height: f32,
    ) -> c_longlong {
        let data = unsafe { &*(data as *const NodeData) };
        println!(
            "measure_text {:?} {:?} x {:?}  ....  {:?} x {:?}",
            data, width, height, available_space_width, available_space_height
        );
        let width = data
            .text
            .as_ref()
            .and_then(|value| Some(value.len() * 10))
            .unwrap_or_default();
        println!("width {:?}", width);

        if data.id == 1 {
            return MeasureOutput::make(500., 100.);
        }

        MeasureOutput::make(width as f32, 100.)
    }

    let text_root = mason.create_node();

    let first_data = NodeData {
        id: 0,
        text: Some("This".to_string()),
    };

    // let first_context =
    //     NodeContext::new() as _, Some(measure_text));
    let first_text_actual_node = mason.create_node();

    mason.with_style_mut(first_text_actual_node.id(), |style| {
        //  style.set_display(Display::Flex);
        // style.set_display_mode(DisplayMode::Box);
        // int_slice[StyleKeys::FORCE_INLINE as usize / 4] = 1;
    });

    mason.set_measure(
        first_text_actual_node.id(),
        Some(measure_text),
        Box::into_raw(Box::new(first_data)) as _,
    );

    // mason.add_child(&text_root, &first_text_actual_node);

    let second_data = NodeData {
        id: 1,
        text: Some(" is".to_string()),
    };

    // let second_context =
    //     NodeContext::new(Box::into_raw(Box::new(second_data)) as _, Some(measure_text));
    let second_text_actual_node = mason.create_node();

    mason.with_style_mut(second_text_actual_node.id(), |style| {
        style.set_display_mode(DisplayMode::Inline);

        // let buffer = style.data_mut();
        // let int_slice = unsafe {
        //     std::slice::from_raw_parts_mut(buffer.as_mut_ptr() as *mut i32, buffer.len() / 4)
        // };
        //
        //  int_slice[StyleKeys::FORCE_INLINE as usize / 4] = 1;
    });

    mason.set_measure(
        second_text_actual_node.id(),
        Some(measure_text),
        Box::into_raw(Box::new(second_data)) as _,
    );

    mason.add_child(text_root.id(), first_text_actual_node.id());

    mason.add_child(first_text_actual_node.id(), second_text_actual_node.id());

    mason.add_child(root.id(), text_root.id());

    println!(
        "first {:?} ... second {:?}",
        first_text_actual_node.id(),
        second_text_actual_node.id()
    );

    mason.compute_wh(root.id(), 1000., 1000.);
    let mut layout = mason.layout(root.id());
    println!("layout: {:?} {:?}", layout[3], layout[4]);

    layout = mason.layout(text_root.id());

    println!("layout: {:?} {:?}", layout[3], layout[4]);

    layout = mason.layout(first_text_actual_node.id());

    println!("layout: {:?} {:?}", layout[3], layout[4]);

    layout = mason.layout(second_text_actual_node.id());

    println!("layout: {:?} {:?}", layout[3], layout[4]);

    mason.print_tree(root.id());
}
// fn leafTest() {
//     let mut mason = Mason::new();
//
//     extern "C" fn measure_(
//         data: *const c_void,
//         width: f32,
//         height: f32,
//         available_space_width: f32,
//         available_space_height: f32,
//     ) -> c_longlong {
//         let data = unsafe { &*(data as *const NodeData) };
//         println!(
//             "{:?} {:?} x {:?}  ....  {:?} x {:?}",
//             data, width, height, available_space_width, available_space_height
//         );
//         MeasureOutput::make(100., 200.)
//     }
//
//     let root_data = NodeData { id: 0, text: None };
//     let ctx = NodeContext::new(Box::into_raw(Box::new(root_data)) as _, Some(measure_));
//     let root = mason.create_node(None);
//
//     let mut root_style = Style::default();
//     root_style.display = Display::Block;
//     // root_style.flex_direction = FlexDirection::Column;
//     mason.set_style(&root, root_style);
//
//     let leaf_a_data = NodeData { id: 1, text: None };
//     let leaf_a_ctx = NodeContext::new(Box::into_raw(Box::new(leaf_a_data)) as _, Some(measure_));
//     let leaf_a = mason.create_node(Some(leaf_a_ctx));
//
//     let mut leaf_a_style = Style::default();
//     leaf_a_style.display = Display::Flex;
//     leaf_a_style.min_size = Size {
//         width: Dimension::length(100.),
//         height: Dimension::length(100.),
//     };
//
//     leaf_a_style.size = Size {
//         width: Dimension::length(100.),
//         height: Dimension::length(100.),
//     };
//
//     mason.set_style(&leaf_a, leaf_a_style);
//
//     mason.add_child(&root, &leaf_a);
//
//     mason.compute_wh(&root, 1206.0, 2622.0);
//
//     //  mason.compute(&root);
//     mason.print_tree(&root);
// }

#[derive(Debug)]
struct Data {
    kind: i32,
}

// fn absolute() -> Option<()> {
//     let mut mason = Mason::new();
//
//     extern "C" fn measure_f(
//         data: *const c_void,
//         width: f32,
//         height: f32,
//         available_space_width: f32,
//         available_space_height: f32,
//     ) -> c_longlong {
//         MeasureOutput::make(100., 200.)
//     }
//
//     let child = mason.create_node(None);
//
//     {
//         let mut style = Style::default();
//         style.display = Display::Block;
//         style.position = Position::Absolute;
//
//         style.inset = Rect {
//             right: LengthPercentageAuto::length(0.),
//             top: LengthPercentageAuto::auto(),
//             left: LengthPercentageAuto::auto(),
//             bottom: LengthPercentageAuto::percent(0.5),
//         };
//
//         style.max_size = Size {
//             width: Dimension::length(12.),
//             height: Dimension::length(12.),
//         };
//
//         /*
//         style.padding = Rect {
//             left: LengthPercentage::length(2.),
//             right: LengthPercentage::length(4.),
//             top: LengthPercentage::length(6.),
//             bottom: LengthPercentage::length(8.),
//         };
//
//         style.border = Rect {
//             left: LengthPercentage::length(1.),
//             right: LengthPercentage::length(3.),
//             top: LengthPercentage::length(5.),
//             bottom: LengthPercentage::length(7.),
//         };
//         */
//
//         mason.set_style(&child, style);
//     }
//
//     let root_id = mason.create_node(None);
//
//     let mut style = Style::default();
//     style.display = Display::Block;
//     style.size = Size {
//         width: Dimension::length(1080.0),
//         height: Dimension::length(1984.0),
//     };
//
//     mason.set_style(&root_id, style);
//
//     mason.add_children(&root_id, &[child.id()]);
//
//     mason.compute_layout(
//         &root_id,
//         Size {
//             width: AvailableSpace::Definite(1080.0),
//             height: AvailableSpace::Definite(1984.0),
//         },
//     );
//
//     let layout = mason.layout(&root_id);
//
//     mason.print_tree(&root_id);
//
//     Some(())
// }
//
// fn t() -> Option<()> {
//     let mut mason = Mason::new();
//     let mut root_style = Style::default();
//     root_style.display = Display::Block;
//
//     let mut style = Style::default();
//     style.display = Display::Block;
//
//     extern "C" fn measure_f(
//         data: *const c_void,
//         width: f32,
//         height: f32,
//         available_space_width: f32,
//         available_space_height: f32,
//     ) -> c_longlong {
//         MeasureOutput::make(100., 200.)
//     }
//
//     let child = mason.create_node(None);
//
//     /*
//
//         TREE
//     └──  BLOCK [x: 0    y: 0    w: 100  h: 26   content_w: 12   content_h: 26   border: l:0 r:0 t:0 b:0, padding: l:0 r:0 t:0 b:0] (NodeId(4294967298))
//         └──  LEAF [x: 0    y: 0    w: 12   h: 26   content_w: 8    content_h: 0    border: l:1 r:3 t:5 b:7, padding: l:2 r:4 t:6 b:8] (NodeId(4294967297))
//
//          */
//
//     {
//         let mut style = Style::default();
//         style.display = Display::Block;
//
//         style.max_size = Size {
//             width: Dimension::length(12.),
//             height: Dimension::length(12.),
//         };
//         style.padding = Rect {
//             left: LengthPercentage::length(2.),
//             right: LengthPercentage::length(4.),
//             top: LengthPercentage::length(6.),
//             bottom: LengthPercentage::length(8.),
//         };
//
//         style.border = Rect {
//             left: LengthPercentage::length(1.),
//             right: LengthPercentage::length(3.),
//             top: LengthPercentage::length(5.),
//             bottom: LengthPercentage::length(7.),
//         };
//
//         mason.set_style(&child, style);
//     }
//
//     let root_id = mason.create_node(None);
//
//     mason.add_children(&root_id, &[child.id()]);
//
//     mason.compute_layout(
//         &root_id,
//         Size {
//             width: AvailableSpace::Definite(1080.0),
//             height: AvailableSpace::Definite(1984.0),
//         },
//     );
//
//     mason.print_tree(&root_id);
//
//     Some(())
// }
//
// fn percent_example() {
//     let mut mason = Mason::new();
//     let root_id = mason.create_node(None);
//
//     let mut rng = rand::rng();
//     let random_size = vec![(0f32, 0f32); 1000]
//         .into_iter()
//         .map(|size| {
//             let width: f32 = rng.random_range(0.0..1.);
//
//             let height: f32 = rng.random_range(0.0..1.);
//
//             (width, height)
//         })
//         .collect::<Vec<_>>();
//
//     struct Data {
//         ptr: *const (f32, f32),
//         len: usize,
//     }
//
//     extern "C" fn measure(
//         data: *const c_void,
//         width: f32,
//         height: f32,
//         available_space_width: f32,
//         available_space_height: f32,
//     ) -> c_longlong {
//         println!("??");
//         MeasureOutput::make(100., 200.)
//     }
//
//     let data = Box::into_raw(Box::new(Data {
//         ptr: random_size.as_ptr(),
//         len: random_size.len(),
//     }));
//
//     for i in 0..1000 {
//         let ctx = NodeContext::new(data as _, Some(measure));
//         let child_id = mason.create_node(Some(ctx));
//
//         {
//             //  let child = mason.get_node_mut(child_id).unwrap();
//             let size = random_size[i];
//             let width = size.0;
//             let height = size.1;
//
//             let mut buffer = [0u8; 310];
//
//             let size = Size {
//                 width: Dimension::percent(width),
//                 height: Dimension::percent(height),
//             };
//
//             // child.style_mut().size = size;
//         }
//
//         mason.add_child(&root_id, &child_id);
//     }
//
//     {
//         //  let mut root = mason.get_node_mut(root_id).unwrap();
//         // root.set_rounded(true);
//         //  root.style_mut().size = Size {
//         //      width: Dimension::percent(1.),
//         //      height: Dimension::percent(1.),
//         //  };
//     }
//
//     let child_a_id = mason.create_node(None);
//
//     {
//         //   let child_a = mason.get_node_mut(child_a_id).unwrap();
//
//         let size = Size {
//             width: Dimension::percent(0.25),
//             height: Dimension::percent(1.),
//         };
//
//         // child_a.style_mut().size = size;
//     }
//
//     mason.add_child(&root_id, &child_a_id);
//
//     let child_b_id = mason.create_node(None);
//
//     {
//         //  let child_b = mason.get_node_mut(child_b_id).unwrap();
//
//         let ctx = NodeContext::new(data as _, Some(measure));
//         mason.set_node_context(&child_b_id, ctx)
//     }
//
//     mason.add_child(&root_id, &child_a_id);
//
//     mason.add_child(&root_id, &child_b_id);
//
//     /* let mut child_a_style = Style::default();
//
//     let size = Size::<Dimension>::new_with_dim(Dimension::Points(1500.), Dimension::Points(3000.));
//
//     child_a_style.set_size(size);
//
//     let child_a = mason.new_node_with_measure_func(child_a_style, MeasureFunc::Boxed(Box::new(|known,available|{
//
//         println!("{:?} {:?}", &known, &available);
//
//         known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
//     }))).unwrap();
//
//     let mut child_b_style = Style::default();
//
//     child_b_style.set_size(size);
//
//     let child_b = mason.new_node_with_measure_func(child_b_style, MeasureFunc::Boxed(Box::new(|known,available|{
//
//         println!("{:?} {:?}", &known, &available);
//
//         known.unwrap_or(Size::<f32>::new(f32::NAN,f32::NAN).into())
//     }))).unwrap();
//
//     // mason.add_children(root, &[child_a, child_b]);
//
//     mason.add_child(root, child_a);
//
//     mason.add_child(root, child_b);
//
//     */
//
//     mason.compute(&root_id);
//     // mason.compute_size(root, root_size);
//     //mason.compute_wh(root_id, 1179.0, 2556.0);
//
//     // let layout = root.layout();
//     //  println!(
//     //      "layout {:?} {}",
//     //      mason.layout(root_id),
//     //      mason.child_count(root_id)
//     //  );
//
//     mason.print_tree(&root_id);
// }
//
// fn flex_example() {
//     // let mut mason = Mason::default();
//     //
//     // let mut style = Style::default();
//     //
//     // let root_size =
//     //     Size::<Dimension>::new_with_dim(Dimension::length(1179.0), Dimension::length(2556.0));
//     //
//     // // style.set_size(root_size);
//     //
//     // style.set_flex_direction(FlexDirection::Column);
//     //
//     // let root = mason.new_node(style).unwrap();
//     //
//     // let mut child_a_style = Style::default();
//     //
//     // let size = Size::<Dimension>::new_with_dim(Dimension::length(1500.), Dimension::length(3000.));
//     //
//     // child_a_style.set_size(size);
//     //
//     // extern "C" fn func(
//     //     data: *const c_void,
//     //     width: f32,
//     //     height: f32,
//     //     available_space_width: f32,
//     //     available_space_height: f32,
//     // ) -> c_longlong {
//     //     println!(
//     //         "{:?} {:?} {} {}",
//     //         width, height, available_space_width, available_space_width
//     //     );
//     //
//     //     MeasureOutput::make(width, height)
//     // };
//     //
//     // let context = NodeContext::new(0 as _, Some(func));
//     //
//     // let child_a = mason.new_node_with_context(child_a_style, context).unwrap();
//     //
//     // let mut child_b_style = Style::default();
//     //
//     // child_b_style.set_size(size);
//     //
//     // let context2 = NodeContext::new(0 as _, Some(func));
//     //
//     // let child_b = mason
//     //     .new_node_with_context(child_b_style, context2)
//     //     .unwrap();
//     //
//     // // mason.add_children(root, &[child_a, child_b]);
//     //
//     // mason.add_child(root, child_a);
//     //
//     // mason.add_child(root, child_b);
//     //
//     // mason.compute_size(root, Size::<AvailableSpace>::max_content());
//     // // mason.compute_wh(root, 1000., 1000.);
//     //
//     // println!("layout {:?}", mason.layout(root))
// }
