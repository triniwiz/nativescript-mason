use mason_core::*;
use std::ffi::{c_float, c_longlong, c_void};
use std::sync::{Arc, Mutex};

extern "C" fn measure_zero(
    _data: *const c_void,
    _known_w: c_float,
    _known_h: c_float,
    _avail_w: c_float,
    _avail_h: c_float,
) -> c_longlong {
    MeasureOutput::make(0.0, 0.0)
}

#[test]
fn detect_suspicious_writebacks() {
    let mut mason = Mason::new();

    let parent = mason.create_text_node();
    let child = mason.create_image_node();
    let pid = parent.id();
    let cid = child.id();

    // Parent has one inline child segment
    mason.set_segments(pid, vec![InlineSegment::InlineChild { id: Some(cid), baseline: 0.0 }]);
    mason.append_node(pid, &[cid]);

    // Child measure returns zero (simulate invisible/native measure edgecase)
    mason.set_measure(cid, Some(measure_zero), std::ptr::null_mut());

    // Shared capture vec for callback events
    let events: Arc<Mutex<Vec<(Id, f32, f32)>>> = Arc::new(Mutex::new(Vec::new()));
    let ev_clone = events.clone();

    // Register callback to capture write-backs
    mason_core::test_helpers::set_computed_size_callback(Some(Box::new(move |id, w, h| {
        ev_clone.lock().unwrap().push((id, w, h));
    })));

    // Run layout
    mason.compute(pid);

    // Inspect captured events and compare against engine's computed layout
    let captured = events.lock().unwrap();
    for (id, w, h) in captured.iter() {
        let layout = mason.layout(*id);
        let engine_h = layout[4];
        // Fail if engine computed height is zero but a non-zero write-back was issued
        assert!(!(engine_h == 0.0 && *h > 0.1), "Suspicious writeback for id={:?}: engine_h=0.0 but callback h={} (w={})", id, h, w);
    }

    // Clear callback
    mason_core::test_helpers::set_computed_size_callback(None);
}
