//! Grid placement by name, omitted shorthand ends and auto track lists, as CSS Grid defines them.

use mason_core::utils::{parse_grid_area, parse_grid_auto_tracks, parse_grid_placement_shorthand};
use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use taffy::GridPlacement;

extern "C" fn measure_10x10(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(10.0, 10.0)
}

/// Lays one child out in a 300px wide grid and returns its x and width.
fn place(columns: &str, areas: Option<&str>, child: impl FnOnce(&mut Style)) -> (f32, f32) {
    let mut mason = Mason::new();
    let root_ref = mason.create_node();
    let root = root_ref.id();
    mason.with_style_mut(root, |s| {
        s.set_display(Display::Grid);
        s.set_size(Size {
            width: Dimension::length(300.0),
            height: Dimension::auto(),
        });
        s.set_grid_template_columns_css(columns);
        if let Some(areas) = areas {
            s.set_grid_template_areas_css(areas);
        }
    });
    let item_ref = mason.create_node();
    let item = item_ref.id();
    mason.append_node(root, &[item]);
    mason.set_measure(item, Some(measure_10x10), std::ptr::null_mut());
    mason.with_style_mut(item, child);
    mason.compute_wh(root, 300.0, f32::NAN);
    let layout = mason.layout_raw(item);
    (layout.location.x, layout.size.width)
}

fn assert_close(actual: (f32, f32), expected: (f32, f32), what: &str) {
    assert!(
        (actual.0 - expected.0).abs() < 0.5 && (actual.1 - expected.1).abs() < 0.5,
        "{what}: expected x/width {expected:?}, got {actual:?}"
    );
}

#[test]
fn an_explicit_line_name_resolves_as_written() {
    let columns = "[sidebar] 100px [content] 200px [end]";
    assert_close(
        place(columns, None, |s| s.set_grid_column_start_css("content")),
        (100.0, 200.0),
        "grid-column-start: content",
    );
    assert_close(
        place(columns, None, |s| s.set_grid_column_css("sidebar / end")),
        (0.0, 300.0),
        "grid-column: sidebar / end",
    );
}

#[test]
fn an_explicit_start_end_pair_resolves() {
    let columns = "[content-start] 100px 100px [content-end] 100px";
    assert_close(
        place(columns, None, |s| s.set_grid_column_css("content")),
        (0.0, 200.0),
        "grid-column: content",
    );
    assert_close(
        place(columns, None, |s| {
            s.set_grid_column_start_css("content-start")
        }),
        (0.0, 100.0),
        "grid-column-start: content-start",
    );
}

#[test]
fn area_names_still_place_items() {
    let areas = "\"nav main main\"";
    let columns = "100px 100px 100px";
    assert_close(
        place(columns, Some(areas), |s| s.set_grid_area("main")),
        (100.0, 200.0),
        "grid-area: main",
    );
    assert_close(
        place(columns, Some(areas), |s| s.set_grid_column_css("main")),
        (100.0, 200.0),
        "grid-column: main",
    );
    assert_close(
        place(columns, Some(areas), |s| {
            s.set_grid_column_start_css("main");
            s.set_grid_column_end_css("main");
        }),
        (100.0, 200.0),
        "grid-column-start/end: main",
    );
}

#[test]
fn an_omitted_shorthand_end_repeats_a_lone_ident() {
    let (start, end) = parse_grid_placement_shorthand::<String>("main").unwrap();
    assert_eq!(start, GridPlacement::NamedLine("main".into(), 0));
    assert_eq!(end, start);

    for value in ["2", "main 2", "span 2", "auto"] {
        let (_, end) = parse_grid_placement_shorthand::<String>(value).unwrap();
        assert_eq!(end, GridPlacement::Auto, "{value}");
    }
}

#[test]
fn grid_area_fills_omitted_values_from_their_start() {
    let area = parse_grid_area("a / b").unwrap();
    assert_eq!(area.row_start, GridPlacement::NamedLine("a".into(), 0));
    assert_eq!(area.column_start, GridPlacement::NamedLine("b".into(), 0));
    assert_eq!(area.row_end, area.row_start);
    assert_eq!(area.column_end, area.column_start);

    let area = parse_grid_area("2 / 3").unwrap();
    assert_eq!(area.row_end, GridPlacement::Auto);
    assert_eq!(area.column_end, GridPlacement::Auto);
}

#[test]
fn a_numeric_grid_area_is_a_line_not_a_name() {
    assert_close(
        place("100px 100px 100px", None, |s| s.set_grid_area("1 / 2")),
        (100.0, 100.0),
        "grid-area: 1 / 2",
    );
    // `grid-area: 1` puts the item on row line 1 and auto-places the column.
    assert_close(
        place("100px 100px 100px", None, |s| s.set_grid_area("1")),
        (0.0, 100.0),
        "grid-area: 1",
    );
}

#[test]
fn auto_tracks_are_a_whitespace_separated_list() {
    let tracks = parse_grid_auto_tracks("100px 1fr minmax(10px, 20px) fit-content(50px)", 1.0)
        .expect("should parse");
    assert_eq!(tracks.len(), 4);
    let commas = parse_grid_auto_tracks("100px, 1fr", 1.0).expect("commas still parse");
    assert_eq!(commas, tracks[..2].to_vec());
    assert!(parse_grid_auto_tracks("100px bogus", 1.0).is_err());
}

#[test]
fn trailing_and_repeat_adjacent_line_names_are_kept() {
    // `[c]` follows a repeat(); `[end]` is the final line.
    let columns = "[a] repeat(2, [b] 50px) [c] 100px [end]";
    assert_close(
        place(columns, None, |s| s.set_grid_column_css("c / end")),
        (100.0, 100.0),
        "grid-column: c / end",
    );
    assert_close(
        place(columns, None, |s| s.set_grid_column_css("b 2 / c")),
        (50.0, 50.0),
        "grid-column: b 2 / c",
    );
    assert_close(
        place(columns, None, |s| s.set_grid_column_css("a / b 2")),
        (0.0, 50.0),
        "grid-column: a / b 2",
    );
}

#[test]
fn a_repeated_name_counts_each_line_once() {
    let columns = "[col] 100px [col] 100px [col] 100px";
    assert_close(
        place(columns, None, |s| s.set_grid_column_start_css("col 2")),
        (100.0, 100.0),
        "grid-column-start: col 2",
    );
}

#[test]
fn auto_fill_with_minmax_still_parses() {
    assert_close(
        place("repeat(auto-fill, minmax(100px, 1fr))", None, |s| {
            s.set_grid_column_start_css("2")
        }),
        (100.0, 100.0),
        "auto-fill column 2",
    );
}
