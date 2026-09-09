//! Per-node layout cache.
//!
//! Taffy's cache stores nine measurements per node. This replacement preserves
//! its cache-key semantics while allowing more distinct constraints to coexist,
//! which prevents intrinsic and definite-width probes from evicting each other.

use taffy::{
    AvailableSpace, ClearState, CollapsibleMarginSet, LayoutInput, LayoutOutput, RequestedAxis,
    RunMode, Size,
};

/// Maximum distinct measure results held per node. Entries beyond this limit
/// replace the oldest slot in round-robin order.
const MEASURE_CAPACITY: usize = 32;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum AvailableSpaceKey {
    Definite(u32),
    MinContent,
    MaxContent,
}

impl From<AvailableSpace> for AvailableSpaceKey {
    fn from(value: AvailableSpace) -> Self {
        match value {
            AvailableSpace::Definite(value) => Self::Definite(value.to_bits()),
            AvailableSpace::MinContent => Self::MinContent,
            AvailableSpace::MaxContent => Self::MaxContent,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DimensionKey {
    Known(u32),
    Available(AvailableSpaceKey),
}

impl DimensionKey {
    fn new(known: Option<f32>, available: AvailableSpace) -> Self {
        known
            .map(|value| Self::Known(value.to_bits()))
            .unwrap_or_else(|| Self::Available(available.into()))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct CacheKey {
    dimensions: Size<DimensionKey>,
    parent_size: Size<Option<u32>>,
    known_dimensions_are_definite: Size<bool>,
    axis: RequestedAxis,
}

impl CacheKey {
    fn matches_measure(self, requested: Self) -> bool {
        self.dimensions == requested.dimensions
            && self.parent_size.width == requested.parent_size.width
            && self.known_dimensions_are_definite == requested.known_dimensions_are_definite
            && (self.axis == RequestedAxis::Both || self.axis == requested.axis)
    }
}

impl From<&LayoutInput> for CacheKey {
    fn from(input: &LayoutInput) -> Self {
        Self {
            dimensions: Size {
                width: DimensionKey::new(input.known_dimensions.width, input.available_space.width),
                height: DimensionKey::new(
                    input.known_dimensions.height,
                    input.available_space.height,
                ),
            },
            parent_size: input.parent_size.map(|value| value.map(f32::to_bits)),
            known_dimensions_are_definite: input
                .known_dimensions_are_definite
                .zip_map(input.known_dimensions, |is_definite, known| {
                    is_definite || known.is_none()
                }),
            axis: input.axis,
        }
    }
}

#[derive(Debug, Clone, Copy)]
struct CacheEntry<T> {
    key: CacheKey,
    content: T,
}

#[derive(Debug, Clone, Default)]
pub struct LayoutCache {
    final_layout_entry: Option<CacheEntry<LayoutOutput>>,
    measure_entries: Vec<CacheEntry<Size<f32>>>,
    next_evict: usize,
}

impl LayoutCache {
    pub fn get(&self, input: &LayoutInput) -> Option<LayoutOutput> {
        let key = CacheKey::from(input);
        match input.run_mode {
            RunMode::PerformLayout => self
                .final_layout_entry
                .filter(|entry| entry.key == key)
                .map(|entry| entry.content),
            RunMode::ComputeSize => self
                .measure_entries
                .iter()
                .find(|entry| entry.key.matches_measure(key))
                .map(|entry| LayoutOutput::from_outer_size(entry.content)),
            RunMode::PerformHiddenLayout => None,
        }
    }

    pub fn store(&mut self, input: &LayoutInput, layout_output: LayoutOutput) {
        let key = CacheKey::from(input);
        match input.run_mode {
            RunMode::PerformLayout => {
                self.final_layout_entry = Some(CacheEntry {
                    key,
                    content: layout_output,
                });
            }
            RunMode::ComputeSize => {
                // Measure hits are reconstructed from size alone. Caching an
                // output with margin-collapse state would silently lose it.
                if layout_output.margins_can_collapse_through
                    || layout_output.top_margin != CollapsibleMarginSet::ZERO
                    || layout_output.bottom_margin != CollapsibleMarginSet::ZERO
                {
                    return;
                }

                if let Some(existing) = self
                    .measure_entries
                    .iter_mut()
                    .find(|entry| entry.key == key)
                {
                    existing.content = layout_output.size;
                    return;
                }

                let entry = CacheEntry {
                    key,
                    content: layout_output.size,
                };
                if self.measure_entries.len() < MEASURE_CAPACITY {
                    self.measure_entries.push(entry);
                } else {
                    self.measure_entries[self.next_evict] = entry;
                    self.next_evict = (self.next_evict + 1) % MEASURE_CAPACITY;
                }
            }
            RunMode::PerformHiddenLayout => {}
        }
    }

    pub fn clear(&mut self) -> ClearState {
        if self.is_empty() {
            return ClearState::AlreadyEmpty;
        }
        self.final_layout_entry = None;
        self.measure_entries.clear();
        self.next_evict = 0;
        ClearState::Cleared
    }

    pub fn is_empty(&self) -> bool {
        self.final_layout_entry.is_none() && self.measure_entries.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn size_input(width: AvailableSpace) -> LayoutInput {
        LayoutInput {
            run_mode: RunMode::ComputeSize,
            sizing_mode: taffy::SizingMode::InherentSize,
            axis: RequestedAxis::Both,
            known_dimensions: Size::NONE,
            parent_size: Size::NONE,
            available_space: Size {
                width,
                height: AvailableSpace::MaxContent,
            },
            vertical_margins_are_collapsible: taffy::Line::FALSE,
            known_dimensions_are_definite: Size {
                width: false,
                height: false,
            },
        }
    }

    fn out(width: f32) -> LayoutOutput {
        LayoutOutput::from_outer_size(Size {
            width,
            height: 10.0,
        })
    }

    #[test]
    fn distinct_width_probes_do_not_evict_each_other() {
        let mut cache = LayoutCache::default();
        let min = size_input(AvailableSpace::MinContent);
        let max = size_input(AvailableSpace::MaxContent);
        let definite = size_input(AvailableSpace::Definite(640.0));

        cache.store(&min, out(199.0));
        cache.store(&max, out(1300.0));
        cache.store(&definite, out(640.0));

        for _ in 0..100 {
            assert_eq!(cache.get(&min).map(|value| value.size.width), Some(199.0));
            assert_eq!(cache.get(&max).map(|value| value.size.width), Some(1300.0));
            assert_eq!(
                cache.get(&definite).map(|value| value.size.width),
                Some(640.0)
            );
        }
    }

    #[test]
    fn many_definite_widths_coexist() {
        let mut cache = LayoutCache::default();
        for index in 0..20 {
            let width = 100.0 + index as f32 * 10.0;
            cache.store(&size_input(AvailableSpace::Definite(width)), out(width));
        }
        for index in 0..20 {
            let width = 100.0 + index as f32 * 10.0;
            assert_eq!(
                cache
                    .get(&size_input(AvailableSpace::Definite(width)))
                    .map(|value| value.size.width),
                Some(width),
                "definite width {width} was evicted"
            );
        }
    }

    #[test]
    fn same_input_is_updated_in_place() {
        let mut cache = LayoutCache::default();
        let input = size_input(AvailableSpace::Definite(300.0));
        cache.store(&input, out(300.0));
        cache.store(&input, out(305.0));

        assert_eq!(cache.measure_entries.len(), 1);
        assert_eq!(cache.get(&input).map(|value| value.size.width), Some(305.0));
    }

    #[test]
    fn measure_key_includes_parent_width_axis_and_definiteness() {
        let mut cache = LayoutCache::default();
        let mut stored = size_input(AvailableSpace::MaxContent);
        stored.parent_size.width = Some(400.0);
        stored.axis = RequestedAxis::Horizontal;
        cache.store(&stored, out(100.0));

        let mut different_parent = stored;
        different_parent.parent_size.width = Some(500.0);
        assert!(cache.get(&different_parent).is_none());

        let mut different_axis = stored;
        different_axis.axis = RequestedAxis::Vertical;
        assert!(cache.get(&different_axis).is_none());

        let mut different_definiteness = stored;
        different_definiteness.known_dimensions.width = Some(100.0);
        different_definiteness.known_dimensions_are_definite.width = false;
        cache.store(&different_definiteness, out(100.0));
        different_definiteness.known_dimensions_are_definite.width = true;
        assert!(cache.get(&different_definiteness).is_none());
    }

    #[test]
    fn both_axis_measurement_can_answer_single_axis_request() {
        let mut cache = LayoutCache::default();
        let both = size_input(AvailableSpace::MaxContent);
        cache.store(&both, out(100.0));

        let mut horizontal = both;
        horizontal.axis = RequestedAxis::Horizontal;
        assert_eq!(
            cache.get(&horizontal).map(|value| value.size.width),
            Some(100.0)
        );
    }

    #[test]
    fn final_layout_requires_the_full_cache_key() {
        let mut cache = LayoutCache::default();
        let mut stored = size_input(AvailableSpace::MaxContent);
        stored.run_mode = RunMode::PerformLayout;
        stored.parent_size = Size {
            width: Some(400.0),
            height: Some(600.0),
        };
        cache.store(&stored, out(100.0));

        let mut different_parent_height = stored;
        different_parent_height.parent_size.height = Some(700.0);
        assert!(cache.get(&different_parent_height).is_none());

        let mut different_axis = stored;
        different_axis.axis = RequestedAxis::Horizontal;
        assert!(cache.get(&different_axis).is_none());
    }

    #[test]
    fn margin_collapse_outputs_are_not_cached() {
        let input = size_input(AvailableSpace::MaxContent);

        let mut cache = LayoutCache::default();
        let mut collapse_through = out(100.0);
        collapse_through.margins_can_collapse_through = true;
        cache.store(&input, collapse_through);
        assert!(cache.get(&input).is_none());

        let mut carried_margin = out(100.0);
        carried_margin.top_margin = CollapsibleMarginSet::from_margin(10.0);
        cache.store(&input, carried_margin);
        assert!(cache.get(&input).is_none());
    }

    #[test]
    fn capacity_is_bounded_and_clear_reports_state() {
        let mut cache = LayoutCache::default();
        assert!(matches!(cache.clear(), ClearState::AlreadyEmpty));

        for index in 0..(MEASURE_CAPACITY * 2) {
            cache.store(
                &size_input(AvailableSpace::Definite(index as f32)),
                out(index as f32),
            );
        }
        assert_eq!(cache.measure_entries.len(), MEASURE_CAPACITY);
        assert!(!cache.is_empty());

        assert!(matches!(cache.clear(), ClearState::Cleared));
        assert!(cache.is_empty());
        assert!(matches!(cache.clear(), ClearState::AlreadyEmpty));
    }
}
