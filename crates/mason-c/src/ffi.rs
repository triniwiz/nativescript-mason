use mason_core::{
    AvailableSpace, CompactLength, Size,
    TrackSizingFunction,
};
use std::borrow::Cow;

use crate::{CMason, CMasonNode};

pub fn node_compute(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute(node.id());
    }
}

pub fn node_compute_min_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(node.id(), size);
    }
}

pub fn node_compute_max_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::max_content();
        mason.compute_size(node.id(), size);
    }
}

pub fn node_compute_wh(mason: *mut CMason, node: *const CMasonNode, width: f32, height: f32) {
    unsafe {
        let mason = &mut (*mason);
        let node = &(*node).0;
        mason.with_mut(|mason| {
            mason.compute_wh(node.id(), width, height);
        })
    }
}

pub fn node_mark_dirty(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = &(*node).0;

        mason.mark_dirty(node_id.id());
    }
}

pub fn node_dirty(mason: *const CMason, node: *const CMasonNode) -> bool {
    unsafe {
        let mason = &(*mason).0;

        let node_id = &(*node).0;

        mason.dirty(node_id.id())
    }
}

const AUTO: &str = "auto";
const AUTO_FILL: &str = "auto-fill";
const AUTO_FIT: &str = "auto-fit";
const MIN_CONTENT: &str = "min-content";
const MAX_CONTENT: &str = "max-content";
const FIT_CONTENT: &str = "fit-content";
const MIN_MAX: &str = "minmax";
const PX_UNIT: &str = "px";
const PERCENT_UNIT: &str = "%";
const FLEX_UNIT: &str = "fr";