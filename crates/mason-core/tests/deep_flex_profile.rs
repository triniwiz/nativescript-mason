use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

static MEASURES: AtomicUsize = AtomicUsize::new(0);

extern "C" fn measure_text(
    _data: *const c_void,
    known_width: c_float,
    _known_height: c_float,
    available_width: c_float,
    _available_height: c_float,
) -> c_longlong {
    MEASURES.fetch_add(1, Ordering::Relaxed);
    let width = if known_width >= 0.0 {
        known_width
    } else if available_width >= 0.0 {
        available_width.min(300.0)
    } else {
        300.0
    };
    MeasureOutput::make(width, 40.0)
}

fn flex(mason: &mut Mason, direction: FlexDirection) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.with_style_mut(id, |style| {
        style.set_display(Display::Flex);
        style.set_flex_direction(direction);
    });
    id
}

fn text(mason: &mut Mason) -> Id {
    let node = mason.create_node();
    let id = node.id();
    std::mem::forget(node);
    mason.set_measure(id, Some(measure_text), std::ptr::null_mut());
    id
}

fn comment(mason: &mut Mason, child: Option<Id>) -> Id {
    let host = flex(mason, FlexDirection::Column);
    let article = flex(mason, FlexDirection::Column);
    let header = flex(mason, FlexDirection::Row);
    let header_children = [text(mason), text(mason), text(mason), text(mason)];
    mason.append_node(header, &header_children);

    let body = text(mason);
    let mut article_children = vec![header, body];
    if let Some(child) = child {
        let replies = flex(mason, FlexDirection::Column);
        mason.append_node(replies, &[child]);
        article_children.push(replies);
    }
    mason.append_node(article, &article_children);
    mason.append_node(host, &[article]);
    host
}

#[test]
fn profile_deep_nested_comment_flex_layout() {
    for depth in 1..=10 {
        let mut mason = Mason::new();
        let root = flex(&mut mason, FlexDirection::Column);
        let mut nested = None;
        for _ in 0..depth {
            nested = Some(comment(&mut mason, nested));
        }
        mason.append_node(root, &[nested.unwrap()]);

        MEASURES.store(0, Ordering::Relaxed);
        let started = Instant::now();
        mason.compute_wh(root, 1080.0, -2.0);
        eprintln!(
            "depth={depth} elapsed_us={} measure_calls={}",
            started.elapsed().as_micros(),
            MEASURES.load(Ordering::Relaxed)
        );
    }
}
