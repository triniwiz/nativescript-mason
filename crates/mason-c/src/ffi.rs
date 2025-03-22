use mason_core::{
    AvailableSpace, CompactLength, GridTrackRepetition, NonRepeatedTrackSizingFunction, Size,
    TrackSizingFunction,
};
use std::borrow::Cow;

use crate::{CMason, CMasonNode};

pub fn node_compute(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        mason.compute(node);
    }
}

pub fn node_compute_min_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::<AvailableSpace>::min_content();
        mason.compute_size(node, size);
    }
}

pub fn node_compute_max_content(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;
        let node = &(*node).0;
        let size = Size::max_content();
        mason.compute_size(node, size);
    }
}

pub fn node_compute_wh(mason: *mut CMason, node: *const CMasonNode, width: f32, height: f32) {
    unsafe {
        let mason = &mut (*mason);
        let node = &(*node).0;
        mason.with_mut(|mason| {
            mason.compute_wh(node, width, height);
        })
    }
}

pub fn node_mark_dirty(mason: *mut CMason, node: *const CMasonNode) {
    unsafe {
        let mason = &mut (*mason).0;

        let node_id = &(*node).0;

        mason.mark_dirty(node_id);
    }
}

pub fn node_dirty(mason: *const CMason, node: *const CMasonNode) -> bool {
    unsafe {
        let mason = &(*mason).0;

        let node_id = &(*node).0;

        mason.dirty(node_id)
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

pub fn parse_non_repeated_track_sizing_function_value<'a>(
    value: NonRepeatedTrackSizingFunction,
) -> Cow<'a, str> {
    if value.min.is_auto() && value.max.is_auto() {
        AUTO.into()
    } else if value.min.is_min_content() && value.max.is_min_content() {
        MIN_CONTENT.into()
    } else if value.min.is_max_content() && value.max.is_max_content() {
        MAX_CONTENT.into()
    } else if value.min.is_auto() && value.max.is_fit_content() {
        let raw = value.max.into_raw();
        match raw.tag() {
            CompactLength::FIT_CONTENT_PX_TAG => {
                format!("fit-content({:.0}px)", raw.value()).into()
            }
            CompactLength::FIT_CONTENT_PERCENT_TAG => {
                format!("fit-content({:.3}%)", raw.value()).into()
            }
            _ => unreachable!(),
        }
    } else if value.min.is_auto() && value.max.is_fr() {
        let raw = value.max.into_raw();
        (raw.value().to_string() + FLEX_UNIT).into()
    } else {
        let min_raw = value.min.into_raw();
        let max_raw = value.max.into_raw();

        let min = match min_raw.tag() {
            CompactLength::AUTO_TAG => Cow::from(AUTO),
            CompactLength::MIN_CONTENT_TAG => Cow::from(MIN_CONTENT),
            CompactLength::MAX_CONTENT_TAG => Cow::from(MAX_CONTENT),
            CompactLength::LENGTH_TAG => format!("{}px", min_raw.value()).into(),
            CompactLength::PERCENT_TAG => format!("{}%", min_raw.value()).into(),
            _ => unreachable!(),
        };
        let max = match max_raw.tag() {
            CompactLength::AUTO_TAG => Cow::from(AUTO),
            CompactLength::LENGTH_TAG => format!("{}px", max_raw.value()).into(),
            CompactLength::PERCENT_TAG => format!("{}%", max_raw.value()).into(),
            CompactLength::MIN_CONTENT_TAG => Cow::from(MIN_CONTENT),
            CompactLength::MAX_CONTENT_TAG => Cow::from(MAX_CONTENT),
            CompactLength::FR_TAG => format!("{:?}fr", max_raw.value()).into(),
            _ => unreachable!(),
        };
        format!("minmax({}, {})", min, max).into()
    }
}

pub fn parse_track_sizing_function_value(value: &TrackSizingFunction) -> String {
    let mut ret = String::new();
    match value {
        TrackSizingFunction::Single(value) => {
            let parsed = parse_non_repeated_track_sizing_function_value(*value);
            ret.push_str(parsed.as_ref())
        }
        TrackSizingFunction::Repeat(grid_track_repetition, values) => {
            ret.push_str("repeat(");
            match *grid_track_repetition {
                GridTrackRepetition::AutoFill => {
                    ret.push_str("auto-fill");
                }
                GridTrackRepetition::AutoFit => {
                    ret.push_str("auto-fit");
                }
                GridTrackRepetition::Count(count) => ret.push_str(&format!("{count}")),
            }

            for (j, inner_val) in values.iter().enumerate() {
                let parsed = parse_non_repeated_track_sizing_function_value(*inner_val);

                if j != 0 {
                    ret.push(' ');
                }

                ret.push_str(parsed.as_ref())
            }

            ret.push(')');
        }
    }

    ret
}
