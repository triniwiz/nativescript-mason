use mason_core::*;
use mason_core::style::DisplayMode;
use std::ffi::{c_float, c_longlong, c_void};

// Measure function: returns 30x10
extern "C" fn measure_child(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(30.0, 10.0)
}

// Simulates a paragraph text measure: returns 300x20 (single line of text)
extern "C" fn measure_paragraph(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(300.0, 20.0)
}

// Simulates an inline code element: returns 50x16
extern "C" fn measure_code(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(50.0, 16.0)
}

// Measure that returns width=150, height=12
extern "C" fn measure_text_150x12(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(150.0, 12.0)
}

// Measure that returns width=50, height=20 (multiline text)
extern "C" fn measure_multiline(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(50.0, 20.0)
}

#[test]
fn empty_inline_text_zero_size() {
    let mut mason = Mason::new();
    let node = mason.create_text_node();
    let id = node.id();

    // No segments, no children, no measure => 0x0 size
    mason.compute(id);
    let out = mason.layout(id);

    let width = out[3];
    let height = out[4];

    assert!((width - 0.0).abs() < 0.001, "expected zero width, got {}", width);
    assert!((height - 0.0).abs() < 0.001, "expected zero height, got {}", height);
}

#[test]
fn multiline_segments_height_with_measure() {
    let mut mason = Mason::new();
    let node = mason.create_text_node();
    let id = node.id();

    // Text container with measure function (as in real platforms)
    mason.set_measure(id, Some(measure_multiline), std::ptr::null_mut());

    mason.set_segments(
        id,
        vec![
            InlineSegment::Text { flags: 0, width: 50.0, ascent: 8.0, descent: 2.0 },
            InlineSegment::LineBreak,
            InlineSegment::Text { flags: 0, width: 30.0, ascent: 7.0, descent: 3.0 },
        ],
    );

    mason.compute(id);
    let out = mason.layout(id);

    let width = out[3];
    let height = out[4];

    // Text container with measure: size comes from native measure (50x20)
    assert!((width - 50.0).abs() < 0.001, "unexpected width: {}", width);
    assert!((height - 20.0).abs() < 0.001, "unexpected height: {}", height);
}

#[test]
fn replaced_element_measurement_affects_parent() {
    let mut mason = Mason::new();
    let parent = mason.create_text_node();
    let child = mason.create_image_node();

    let pid = parent.id();
    let cid = child.id();

    mason.set_segments(pid, vec![InlineSegment::InlineChild { id: Some(cid), baseline: 0.0 }]);
    mason.append_node(pid, &[cid]);

    // Child provides a measure function (simulating native measured child)
    mason.set_measure(cid, Some(measure_child), std::ptr::null_mut());
    // Parent also has a measure (as real text containers do)
    mason.set_measure(pid, Some(measure_child), std::ptr::null_mut());

    mason.compute(pid);
    let pout = mason.layout(pid);
    let cout = mason.layout(cid);

    let parent_width = pout[3];
    let parent_height = pout[4];

    let child_width = cout[3];
    let child_height = cout[4];

    assert!((child_width - 30.0).abs() < 0.001, "child width: {}", child_width);
    assert!((child_height - 10.0).abs() < 0.001, "child height: {}", child_height);

    assert!(parent_width >= child_width - 0.001, "parent width {}, child width {}", parent_width, child_width);
    assert!(parent_height >= child_height - 0.001, "parent height {}, child height {}", parent_height, child_height);
}

/// Test: Text container parent with multiple flattened inline children.
///
/// Simulates: <p>Supports <code>flexbox</code>, <code>grid</code></p>
/// where <code> children are "flattened" into the parent's text.
///
/// Expected: parent height = paragraph measure height (20.0), NOT inflated
/// by children's individual measurements.
#[test]
fn text_container_with_flattened_children_no_height_inflation() {
    let mut mason = Mason::new();

    // Create parent <p> (text container with measure)
    let parent = mason.create_text_node();
    let pid = parent.id();

    // Create two <code> children (text containers with measure)
    let code1 = mason.create_text_node();
    let code2 = mason.create_text_node();
    let c1id = code1.id();
    let c2id = code2.id();

    // Append children to parent in Rust tree
    mason.append_node(pid, &[c1id, c2id]);

    // Each code child has its own measure (simulating native TextEngine)
    mason.set_measure(c1id, Some(measure_code), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_code), std::ptr::null_mut());

    // Parent has its own measure (returns the full paragraph text measurement)
    mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

    // Segments: all Text (children are flattened into parent's text)
    mason.set_segments(
        pid,
        vec![
            InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },
            InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },
            InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },
            InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
        ],
    );

    // Also set segments on children (their own text)
    mason.set_segments(c1id, vec![InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 }]);
    mason.set_segments(c2id, vec![InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 }]);

    mason.compute(pid);
    let pout = mason.layout(pid);

    let parent_width = pout[3];
    let parent_height = pout[4];

    // Parent height should be from its measure function (20.0), NOT inflated
    assert!(
        (parent_height - 20.0).abs() < 0.001,
        "Parent height should be 20.0 (from paragraph measure), got {}. \
         Children's heights should NOT inflate the parent.",
        parent_height
    );

    assert!(
        (parent_width - 300.0).abs() < 0.001,
        "Parent width should be 300.0, got {}",
        parent_width
    );
}

/// Test: Adding more flattened children should NOT increase parent height.
///
/// This directly tests the user's observation: "When that second code is
/// appended it seems to create a new line"
#[test]
fn adding_more_flattened_children_does_not_inflate_height() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

    // --- With 1 child ---
    let child1 = mason.create_text_node();
    let c1id = child1.id();
    mason.set_measure(c1id, Some(measure_code), std::ptr::null_mut());
    mason.append_node(pid, &[c1id]);
    mason.set_segments(c1id, vec![
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },
    ]);
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
    ]);

    mason.compute(pid);
    let out1 = mason.layout(pid);
    let h_with_1_child = out1[4];

    // --- With 2 children ---
    let child2 = mason.create_text_node();
    let c2id = child2.id();
    mason.set_measure(c2id, Some(measure_code), std::ptr::null_mut());
    mason.append_node(pid, &[c2id]);
    mason.set_segments(c2id, vec![
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
    ]);
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
    ]);

    mason.compute(pid);
    let out2 = mason.layout(pid);
    let h_with_2_children = out2[4];

    // Height should NOT increase when adding more flattened children
    assert!(
        (h_with_1_child - h_with_2_children).abs() < 0.001,
        "Height with 1 child ({}) should equal height with 2 children ({}). \
         Adding flattened children should not inflate height.",
        h_with_1_child, h_with_2_children
    );

    assert!(
        (h_with_1_child - 20.0).abs() < 0.001,
        "Expected height 20.0, got {}",
        h_with_1_child
    );
}

/// Test: Multiple flattened children should each have their measured size
/// but not inflate the parent.
#[test]
fn flattened_children_have_measured_sizes() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

    // Create 3 flattened code children - keep NodeRefs alive
    let c1 = mason.create_text_node();
    let c2 = mason.create_text_node();
    let c3 = mason.create_text_node();
    let c1id = c1.id();
    let c2id = c2.id();
    let c3id = c3.id();

    mason.set_measure(c1id, Some(measure_code), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_code), std::ptr::null_mut());
    mason.set_measure(c3id, Some(measure_code), std::ptr::null_mut());

    mason.set_segments(c1id, vec![
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
    ]);
    mason.set_segments(c2id, vec![
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
    ]);
    mason.set_segments(c3id, vec![
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
    ]);

    mason.append_node(pid, &[c1id, c2id, c3id]);

    // All flattened - parent segments are all Text
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 60.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 10.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 10.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 },
    ]);

    mason.compute(pid);

    // Each child should have its own measured size (50x16 from measure_code)
    for &cid in &[c1id, c2id, c3id] {
        let out = mason.layout(cid);
        let w = out[3];
        let h = out[4];
        assert!(
            (w - 50.0).abs() < 0.001 && (h - 16.0).abs() < 0.001,
            "Child should be 50x16 from measure_code, got {}x{}",
            w, h
        );
    }

    // Parent height should be 20.0 from its own measure, NOT inflated
    let parent_height = mason.layout(pid)[4];
    assert!(
        (parent_height - 20.0).abs() < 0.001,
        "Parent height should be 20.0, got {}. Children should not inflate parent.",
        parent_height
    );
}

/// Test: Non-flattened children (InlineChild segments) should be positioned
/// correctly on the same line.
#[test]
fn non_flattened_inline_children_same_line() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

    let code1 = mason.create_text_node();
    let code2 = mason.create_text_node();
    let c1id = code1.id();
    let c2id = code2.id();
    mason.append_node(pid, &[c1id, c2id]);

    mason.set_measure(c1id, Some(measure_code), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_code), std::ptr::null_mut());
    mason.set_segments(c1id, vec![InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 }]);
    mason.set_segments(c2id, vec![InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 }]);

    // Parent's segments include InlineChild entries (non-flattened)
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::InlineChild { id: Some(c1id), baseline: 0.0 },
        InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::InlineChild { id: Some(c2id), baseline: 0.0 },
    ]);

    mason.compute_wh(pid, 500.0, f32::NAN);

    let c1out = mason.layout(c1id);
    let c2out = mason.layout(c2id);

    let c1_x = c1out[1];
    let c1_y = c1out[2];
    let c2_x = c2out[1];
    let c2_y = c2out[2];

    // Both children should be on the same line (same y position)
    assert!(
        (c1_y - c2_y).abs() < 1.0,
        "Both codes should be on the same line: code1 y={}, code2 y={}",
        c1_y, c2_y
    );

    // code2 should be to the right of code1
    assert!(
        c2_x > c1_x,
        "code2 (x={}) should be to the right of code1 (x={})",
        c2_x, c1_x
    );
}

/// Test: Child positions for flattened children should be (0,0) since IFC
/// doesn't process them.
#[test]
fn flattened_children_positions_are_zero() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let pid = parent.id();
    mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

    let code1 = mason.create_text_node();
    let code2 = mason.create_text_node();
    let c1id = code1.id();
    let c2id = code2.id();
    mason.append_node(pid, &[c1id, c2id]);

    mason.set_measure(c1id, Some(measure_code), std::ptr::null_mut());
    mason.set_measure(c2id, Some(measure_code), std::ptr::null_mut());
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },  // "Supports "
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },  // "flexbox"
        InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },  // ", "
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },  // "grid"
    ]);

    // Segments are all Text (flattened) - no InlineChild entries
    mason.set_segments(pid, vec![
        InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },
        InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },
    ]);

    mason.compute_wh(pid, 500.0, f32::NAN);

    // Children should still have their measured sizes
    let c1out = mason.layout(c1id);
    let c2out = mason.layout(c2id);

    let c1_w = c1out[3];
    let c1_h = c1out[4];
    let c2_w = c2out[3];
    let c2_h = c2out[4];

    // Children should have their individual measure sizes
    assert!(
        (c1_w - 50.0).abs() < 0.001,
        "code1 width should be 50.0, got {}",
        c1_w
    );
    assert!(
        (c1_h - 16.0).abs() < 0.001,
        "code1 height should be 16.0, got {}",
        c1_h
    );
    assert!(
        (c2_w - 50.0).abs() < 0.001,
        "code2 width should be 50.0 (from measure_code), got {}",
        c2_w
    );
    assert!(
        (c2_h - 16.0).abs() < 0.001,
        "code2 height should be 16.0, got {}",
        c2_h
    );

    // Parent height should be from measure, not from children
    let parent_height = mason.layout(pid)[4];
    assert!(
        (parent_height - 20.0).abs() < 0.001,
        "Parent height should be 20.0 (from paragraph measure), got {}",
        parent_height
    );
}

/// Critical test: Full block container hierarchy with text container <p>
/// containing inline code children. This matches the real app structure:
///   root (block) → h2 (text) → p (text, children=[code1, code2]) → h3 (text)
/// The <p>'s height should come from the <p>'s measure function (single-line),
/// NOT be inflated by the code children's individual heights.
#[test]
fn full_hierarchy_p_with_code_children_height_not_inflated() {
    let mut mason = Mason::new();

    // Root: a block container (like a ScrollView's inner View)
    let root = mason.create_node();
    let root_id = root.id();
    mason.with_style_mut(root_id, |style| {
        style.set_display(Display::Block);
    });

    // h2: a text container with measure
    let h2 = mason.create_text_node();
    let h2_id = h2.id();
    mason.set_measure(h2_id, Some(measure_text_150x12), std::ptr::null_mut());
    mason.with_style_mut(h2_id, |style| {
        style.set_display(Display::Block);
    });

    // p: a text container with code children
    let p = mason.create_text_node();
    let p_id = p.id();
    mason.set_measure(p_id, Some(measure_paragraph), std::ptr::null_mut()); // returns 300x20
    mason.with_style_mut(p_id, |style| {
        style.set_display(Display::Block);
    });

    // code1 and code2: inline text containers with measures
    let code1 = mason.create_text_node();
    let code2 = mason.create_text_node();
    let c1_id = code1.id();
    let c2_id = code2.id();

    mason.set_measure(c1_id, Some(measure_code), std::ptr::null_mut()); // returns 50x16
    mason.set_measure(c2_id, Some(measure_code), std::ptr::null_mut()); // returns 50x16

    // Set display mode to Inline for code children (like the platform does)
    mason.with_style_mut(c1_id, |style| {
        style.set_display_mode(DisplayMode::Inline);
    });
    mason.with_style_mut(c2_id, |style| {
        style.set_display_mode(DisplayMode::Inline);
    });

    // Give code children their own text segments
    mason.set_segments(c1_id, vec![InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 }]);
    mason.set_segments(c2_id, vec![InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 }]);

    // Append code children to <p>
    mason.append_node(p_id, &[c1_id, c2_id]);

    // Parent segments (flattened: all Text, no InlineChild)
    mason.set_segments(p_id, vec![
        InlineSegment::Text { flags: 0, width: 80.0, ascent: 14.0, descent: 4.0 },  // "Supports "
        InlineSegment::Text { flags: 0, width: 50.0, ascent: 12.0, descent: 3.0 },  // "flexbox"
        InlineSegment::Text { flags: 0, width: 20.0, ascent: 14.0, descent: 4.0 },  // ", "
        InlineSegment::Text { flags: 0, width: 35.0, ascent: 12.0, descent: 3.0 },  // "grid"
    ]);

    // h3: another text container
    let h3 = mason.create_text_node();
    let h3_id = h3.id();
    mason.set_measure(h3_id, Some(measure_text_150x12), std::ptr::null_mut());
    mason.with_style_mut(h3_id, |style| {
        style.set_display(Display::Block);
    });

    // Build tree: root → [h2, p, h3]
    mason.append_node(root_id, &[h2_id, p_id, h3_id]);

    // Compute layout with a definite width (simulating screen width)
    mason.compute_wh(root_id, 400.0, 800.0);

    // Get layouts
    let root_out = mason.layout(root_id);
    let p_out = mason.layout(p_id);
    let h2_out = mason.layout(h2_id);
    let h3_out = mason.layout(h3_id);
    let c1_out = mason.layout(c1_id);
    let c2_out = mason.layout(c2_id);

    let root_h = root_out[4];
    let h2_h = h2_out[4];
    let p_h = p_out[4];
    let h3_h = h3_out[4];
    let c1_h = c1_out[4];
    let c2_h = c2_out[4];

    let p_y = p_out[2];
    let h3_y = h3_out[2];

    let p_content_h = p_out[18]; // content_size.height at index 18

    eprintln!("=== Full hierarchy layout ===");
    eprintln!("root:  h={}", root_h);
    eprintln!("h2:    h={}", h2_h);
    eprintln!("p:     y={} h={} content_h={}", p_y, p_h, p_content_h);
    eprintln!("code1: h={}", c1_h);
    eprintln!("code2: h={}", c2_h);
    eprintln!("h3:    y={} h={}", h3_y, h3_h);
    eprintln!("sum(h2+p+h3) = {}", h2_h + p_h + h3_h);

    // CRITICAL: The <p> height should be 20.0 (from its measure function)
    // NOT 20 + 16 + 16 = 52 (which would happen if code children inflated it)
    assert!(
        (p_h - 20.0).abs() < 1.0,
        "P height should be ~20.0 (from measure), got {}. Code children ({}, {}) should NOT inflate it.",
        p_h, c1_h, c2_h
    );

    // The <h3> should start right after <p> (p_y + p_h)
    assert!(
        (h3_y - (p_y + p_h)).abs() < 1.0,
        "h3 should start at p_y({}) + p_h({}) = {}, got {}. Wasted space = {}",
        p_y, p_h, p_y + p_h, h3_y, h3_y - (p_y + p_h)
    );

    // The root height should be approximately h2_h + p_h + h3_h (block stacking)
    let expected_total = h2_h + p_h + h3_h;
    assert!(
        (root_h - expected_total).abs() < 2.0,
        "Root height should be ~{} (h2+p+h3), got {}. Extra space = {}",
        expected_total, root_h, root_h - expected_total
    );
}

/// Test: Scaling children count from 1 to 6 should NOT progressively
/// inflate the parent height.
#[test]
fn scaling_children_count_does_not_inflate_height() {
    // Keep all NodeRefs alive for the entire test
    let mut all_refs: Vec<NodeRef> = Vec::new();

    let heights: Vec<f32> = (1..=6)
        .map(|n| {
            let mut mason = Mason::new();
            let parent = mason.create_text_node();
            let pid = parent.id();
            mason.set_measure(pid, Some(measure_paragraph), std::ptr::null_mut());

            let mut cids = vec![];
            let mut segments = vec![InlineSegment::Text { flags: 0, width: 60.0, ascent: 14.0, descent: 4.0 }];

            let mut child_refs = Vec::new();
            for _ in 0..n {
                let child = mason.create_text_node();
                let cid = child.id();
                mason.set_measure(cid, Some(measure_code), std::ptr::null_mut());
                mason.set_segments(
                    cid,
                    vec![InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 }],
                );
                cids.push(cid);
                child_refs.push(child);
                segments.push(InlineSegment::Text { flags: 0, width: 40.0, ascent: 12.0, descent: 3.0 });
                segments.push(InlineSegment::Text { flags: 0, width: 10.0, ascent: 14.0, descent: 4.0 });
            }

            mason.append_node(pid, &cids);
            mason.set_segments(pid, segments);
            mason.compute(pid);

            let h = mason.layout(pid)[4];
            // Keep refs alive
            all_refs.push(parent);
            all_refs.extend(child_refs);
            h
        })
        .collect();

    // All heights should be the same (20.0 from measure_paragraph)
    for (i, h) in heights.iter().enumerate() {
        assert!(
            (*h - 20.0).abs() < 0.001,
            "With {} children, height is {} (expected 20.0). \
             Heights across 1-6 children: {:?}",
            i + 1,
            h,
            heights
        );
    }
}
