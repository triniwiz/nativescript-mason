use taffy::prelude::*;

// Three `width: 33.3333333333%` columns in a wrapping row must share one line at any width,
// as in a browser. 1/3 rounds up in f32, so their sum can land just past the row's width.
#[test]
fn thirds_share_one_line() {
    let mut wrapped = Vec::new();
    for tenth in 3000..14000 {
        let width = tenth as f32 / 10.0;
        let mut tree: TaffyTree<()> = TaffyTree::new();
        let child = || Style {
            flex_shrink: 0.0,
            size: Size {
                width: Dimension::percent(0.333333333333),
                height: Dimension::length(10.0),
            },
            ..Default::default()
        };
        let kids: Vec<_> = (0..3).map(|_| tree.new_leaf(child()).unwrap()).collect();
        let row = tree
            .new_with_children(
                Style {
                    display: Display::Flex,
                    flex_wrap: FlexWrap::Wrap,
                    size: Size {
                        width: Dimension::length(width),
                        height: Dimension::auto(),
                    },
                    ..Default::default()
                },
                &kids,
            )
            .unwrap();
        tree.compute_layout(row, Size::MAX_CONTENT).unwrap();
        if tree.layout(kids[2]).unwrap().location.y != 0.0 {
            wrapped.push(width);
        }
    }
    assert!(
        wrapped.is_empty(),
        "{} widths wrap, e.g. {:?}",
        wrapped.len(),
        &wrapped[..wrapped.len().min(8)]
    );
}
