use mason_core::*;

// Reproduces the WebSpec conformance harness's mount -> compute -> unmount
// cycle: ONE persistent root ("stage"), under which a fresh subtree is
// appended, the root is recomputed (mirroring the app's single outer
// <scroll> owning the whole layout tree), then the subtree is torn down via
// remove_children before the next fixture mounts. On both Android and iOS
// this pattern froze permanently after mounting a fixture using
// `flex-wrap: wrap` + `align-content: space-evenly` — every fixture after
// that point failed for the rest of the run. This test checks whether the
// freeze reproduces in pure Rust (mason-core), independent of either mobile
// bridge.

fn mount_simple_row(mason: &mut Mason, stage: Id, width: f32, height: f32, n_children: usize) -> Id {
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_size(Size {
            width: Dimension::length(width),
            height: Dimension::length(height),
        });
    });

    let mut child_ids = vec![];
    for _ in 0..n_children {
        let child = mason.create_node();
        let cid = child.id();
        mason.with_style_mut(cid, |s| {
            s.set_size(Size {
                width: Dimension::length(10.0),
                height: Dimension::length(10.0),
            });
        });
        child_ids.push(cid);
    }
    mason.append_node(root_id, &child_ids);
    mason.append_node(stage, &[root_id]);
    root_id
}

fn mount_align_content_space_evenly_wrapped(mason: &mut Mason, stage: Id) -> Id {
    // Mirrors fixtures.generated.json fixture #30 exactly:
    // 100x100 flex-wrap:wrap row, align-content:space-evenly, six 50x10 children.
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |s| {
        s.set_display(Display::Flex);
        s.set_flex_direction(FlexDirection::Row);
        s.set_flex_wrap(FlexWrap::Wrap);
        s.set_align_content(Some(AlignContent::SPACE_EVENLY));
        s.set_size(Size {
            width: Dimension::length(100.0),
            height: Dimension::length(100.0),
        });
    });

    let mut child_ids = vec![];
    for _ in 0..6 {
        let child = mason.create_node();
        let cid = child.id();
        mason.with_style_mut(cid, |s| {
            s.set_size(Size {
                width: Dimension::length(50.0),
                height: Dimension::length(10.0),
            });
        });
        child_ids.push(cid);
    }
    mason.append_node(root_id, &child_ids);
    mason.append_node(stage, &[root_id]);
    root_id
}

#[test]
fn webspec_style_mount_unmount_cycle_does_not_freeze() {
    let mut mason = Mason::new();

    let stage = mason.create_node();
    let stage_id = stage.id();
    mason.with_style_mut(stage_id, |s| {
        s.set_size(Size {
            width: Dimension::length(1024.0),
            height: Dimension::auto(),
        });
    });

    // Fixtures 0..30: plain flex rows, mirroring the ~30 "absolute_layout_*"
    // and "align_content_*" fixtures that always pass before the freeze.
    for i in 0..30 {
        let child_root = mount_simple_row(&mut mason, stage_id, 100.0, 100.0, 3);
        mason.compute_wh(stage_id, 1024.0, f32::NAN);
        let layout = mason.layout_raw(child_root);
        assert!(
            layout.size.width > 0.0,
            "fixture {i} (pre-trigger) produced zero width: {layout:?}"
        );
        mason.remove_children(stage_id);
    }

    // Fixture 30: align-content:space-evenly + flex-wrap:wrap — the exact
    // trigger observed on both platforms.
    let trigger_root = mount_align_content_space_evenly_wrapped(&mut mason, stage_id);
    mason.compute_wh(stage_id, 1024.0, f32::NAN);
    let trigger_layout = mason.layout_raw(trigger_root);
    println!("trigger fixture layout: {trigger_layout:?}");
    mason.remove_children(stage_id);

    // Fixtures 31..60: plain flex rows again. On both Android and iOS every
    // one of these failed after the trigger fixture. If this loop panics,
    // hangs, or produces zero-size layouts, the bug reproduces in pure Rust.
    for i in 31..60 {
        let child_root = mount_simple_row(&mut mason, stage_id, 100.0, 100.0, 3);
        mason.compute_wh(stage_id, 1024.0, f32::NAN);
        let layout = mason.layout_raw(child_root);
        assert!(
            layout.size.width > 0.0,
            "fixture {i} (post-trigger) produced zero width: {layout:?} -- BUG REPRODUCED"
        );
        assert!(
            layout.size.height > 0.0,
            "fixture {i} (post-trigger) produced zero height: {layout:?} -- BUG REPRODUCED"
        );
        mason.remove_children(stage_id);
    }
}
