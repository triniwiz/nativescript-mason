use mason_core::*;

fn block(mason: &mut Mason, height: Option<f32>) -> NodeRef {
    let node = mason.create_node();
    mason.with_style_mut(node.id(), |s| {
        s.set_display(Display::Block);
        if let Some(height) = height {
            s.set_size(Size {
                width: Dimension::auto(),
                height: Dimension::length(height),
            });
        }
    });
    node
}

struct Tree {
    mason: Mason,
    root: NodeRef,
    details: NodeRef,
    summary: NodeRef,
    body: NodeRef,
}

fn tree() -> Tree {
    let mut mason = Mason::new();
    let root = block(&mut mason, None);
    let details = block(&mut mason, None);
    let summary = block(&mut mason, Some(20.0));
    let body = block(&mut mason, Some(30.0));
    mason.append_node(details.id(), &[summary.id(), body.id()]);
    mason.append_node(root.id(), &[details.id()]);
    mason.set_details(details.id(), DETAILS_ROLE_DETAILS, false);
    mason.set_details(summary.id(), DETAILS_ROLE_SUMMARY, false);
    Tree {
        mason,
        root,
        details,
        summary,
        body,
    }
}

impl Tree {
    fn height(&mut self, node: &NodeRef) -> f32 {
        self.mason.compute_wh(self.root.id(), 100.0, 500.0);
        self.mason.layout_raw(node.id()).size.height
    }
}

#[test]
fn closed_details_lays_out_only_its_summary() {
    let mut t = tree();
    let details = t.details.clone();
    let body = t.body.clone();
    assert_eq!(t.height(&details), 20.0);
    assert_eq!(t.height(&body), 0.0);
    assert!(t.mason.is_hidden(body.id()));
    assert!(!t.mason.is_hidden(t.summary.id()));

    t.mason
        .set_details(details.id(), DETAILS_ROLE_DETAILS, true);
    assert_eq!(t.height(&details), 50.0);
    assert!(!t.mason.is_hidden(body.id()));

    t.mason
        .set_details(details.id(), DETAILS_ROLE_DETAILS, false);
    assert_eq!(t.height(&details), 20.0);
}

#[test]
fn content_added_while_closed_is_hidden_and_shown_once_moved_out() {
    let mut t = tree();
    let details = t.details.clone();
    let root = t.root.clone();
    let late = block(&mut t.mason, Some(10.0));
    t.mason.append(details.id(), late.id());
    assert_eq!(t.height(&details), 20.0);
    assert!(t.mason.is_hidden(late.id()));

    t.mason.remove_child(details.id(), late.id());
    t.mason.append(root.id(), late.id());
    assert_eq!(t.height(&late), 10.0);
    assert!(!t.mason.is_hidden(late.id()));
}

#[test]
fn no_longer_a_details_shows_everything() {
    let mut t = tree();
    let details = t.details.clone();
    assert_eq!(t.height(&details), 20.0);
    t.mason.set_details(details.id(), DETAILS_ROLE_NONE, false);
    assert_eq!(t.height(&details), 50.0);
}

#[test]
fn hiding_leaves_the_authors_display_alone() {
    let mut t = tree();
    let details = t.details.clone();
    let body = t.body.clone();
    t.mason
        .with_style_mut(body.id(), |s| s.set_display(Display::Flex));
    assert_eq!(t.height(&details), 20.0);
    t.mason
        .set_details(details.id(), DETAILS_ROLE_DETAILS, true);
    assert_eq!(t.height(&details), 50.0);
    t.mason
        .with_style(body.id(), |s| assert_eq!(s.get_display(), Display::Flex));
}
