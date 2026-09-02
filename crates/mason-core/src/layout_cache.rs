//! Per-node layout cache.
//!
//! Drop-in replacement for `taffy::Cache`. Taffy stores measure results in 9 fixed
//! slots; `MaxContent` and every `Definite(_)` width share one slot, so
//! alternating probes evict each other and misses compound per nesting level.
//! This cache keeps taffy's matching semantics but stores entries by their own
//! inputs, letting distinct constraints coexist up to [`MEASURE_CAPACITY`].

use taffy::{AvailableSpace, ClearState, LayoutInput, LayoutOutput, RunMode, Size};

/// Maximum distinct measure results held per node. Beyond this, entries are
/// evicted round-robin. The cap prevents unbounded growth for nodes whose
/// constraints churn, while still exceeding the ~20-entry high water mark seen
/// in practice.
const MEASURE_CAPACITY: usize = 32;

#[derive(Debug, Clone, Copy)]
struct CacheEntry<T> {
    known_dimensions: Size<Option<f32>>,
    available_space: Size<AvailableSpace>,
    content: T,
}

#[derive(Debug, Clone)]
pub struct LayoutCache {
    final_layout_entry: Option<CacheEntry<LayoutOutput>>,
    measure_entries: Vec<CacheEntry<Size<f32>>>,
    /// Round-robin eviction cursor, used only once at capacity.
    next_evict: usize,
    is_empty: bool,
}

impl Default for LayoutCache {
    fn default() -> Self {
        Self::new()
    }
}

impl LayoutCache {
    pub const fn new() -> Self {
        Self {
            final_layout_entry: None,
            measure_entries: Vec::new(),
            next_evict: 0,
            is_empty: true,
        }
    }

    /// Taffy's cache-hit predicate: an entry matches when each known dimension
    /// equals the entry's or the cached size, and unspecified axes have roughly
    /// equal available space.
    #[inline]
    fn matches<T>(
        entry: &CacheEntry<T>,
        cached_size: Size<f32>,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> bool {
        (known_dimensions.width == entry.known_dimensions.width
            || known_dimensions.width == Some(cached_size.width))
            && (known_dimensions.height == entry.known_dimensions.height
                || known_dimensions.height == Some(cached_size.height))
            && (known_dimensions.width.is_some()
                || entry
                    .available_space
                    .width
                    .is_roughly_equal(available_space.width))
            && (known_dimensions.height.is_some()
                || entry
                    .available_space
                    .height
                    .is_roughly_equal(available_space.height))
    }

    /// Exact key match, used to overwrite in place on store.
    #[inline]
    fn same_inputs<T>(
        entry: &CacheEntry<T>,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
    ) -> bool {
        entry.known_dimensions == known_dimensions
            && entry
                .available_space
                .width
                .is_roughly_equal(available_space.width)
            && entry
                .available_space
                .height
                .is_roughly_equal(available_space.height)
    }

    pub fn get(&self, input: &LayoutInput) -> Option<LayoutOutput> {
        let known_dimensions = input.known_dimensions;
        let available_space = input.available_space;

        match input.run_mode {
            RunMode::PerformLayout => self
                .final_layout_entry
                .filter(|entry| {
                    Self::matches(entry, entry.content.size, known_dimensions, available_space)
                })
                .map(|e| e.content),
            RunMode::ComputeSize => {
                for entry in self.measure_entries.iter() {
                    if Self::matches(entry, entry.content, known_dimensions, available_space) {
                        return Some(LayoutOutput::from_outer_size(entry.content));
                    }
                }
                None
            }
            RunMode::PerformHiddenLayout => None,
        }
    }

    pub fn store(&mut self, input: &LayoutInput, layout_output: LayoutOutput) {
        let known_dimensions = input.known_dimensions;
        let available_space = input.available_space;

        match input.run_mode {
            RunMode::PerformLayout => {
                self.is_empty = false;
                self.final_layout_entry = Some(CacheEntry {
                    known_dimensions,
                    available_space,
                    content: layout_output,
                });
            }
            RunMode::ComputeSize => {
                self.is_empty = false;
                let entry = CacheEntry {
                    known_dimensions,
                    available_space,
                    content: layout_output.size,
                };

                // Overwrite an existing entry for the same inputs instead of
                // growing the cache.
                if let Some(existing) = self
                    .measure_entries
                    .iter_mut()
                    .find(|e| Self::same_inputs(e, known_dimensions, available_space))
                {
                    *existing = entry;
                    return;
                }

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
        if self.is_empty {
            return ClearState::AlreadyEmpty;
        }
        self.is_empty = true;
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
            axis: taffy::RequestedAxis::Both,
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

    fn out(w: f32) -> LayoutOutput {
        LayoutOutput::from_outer_size(Size {
            width: w,
            height: 10.0,
        })
    }

    /// The regression this cache exists for: max-content and a definite width
    /// land in the same taffy slot and evict each other. Both must stay cached.
    #[test]
    fn max_content_and_definite_do_not_evict_each_other() {
        let mut cache = LayoutCache::new();

        let max = size_input(AvailableSpace::MaxContent);
        let def = size_input(AvailableSpace::Definite(500.0));

        cache.store(&max, out(1300.0));
        cache.store(&def, out(500.0));

        assert_eq!(cache.get(&max).map(|o| o.size.width), Some(1300.0));
        assert_eq!(cache.get(&def).map(|o| o.size.width), Some(500.0));
    }

    /// Alternating probes must not thrash — this is what compounded to 3^depth.
    #[test]
    fn alternating_probes_stay_cached() {
        let mut cache = LayoutCache::new();
        let min = size_input(AvailableSpace::MinContent);
        let max = size_input(AvailableSpace::MaxContent);
        let def = size_input(AvailableSpace::Definite(640.0));

        cache.store(&min, out(199.0));
        cache.store(&max, out(1300.0));
        cache.store(&def, out(640.0));

        for _ in 0..100 {
            assert!(cache.get(&min).is_some());
            assert!(cache.get(&max).is_some());
            assert!(cache.get(&def).is_some());
        }
    }

    /// Many distinct definite widths coexist rather than fighting over a slot.
    #[test]
    fn many_distinct_definite_widths_coexist() {
        let mut cache = LayoutCache::new();
        for i in 0..20 {
            let w = 100.0 + i as f32 * 10.0;
            cache.store(&size_input(AvailableSpace::Definite(w)), out(w));
        }
        for i in 0..20 {
            let w = 100.0 + i as f32 * 10.0;
            assert_eq!(
                cache.get(&size_input(AvailableSpace::Definite(w))).map(|o| o.size.width),
                Some(w),
                "definite width {w} was evicted"
            );
        }
    }

    /// Re-storing the same constraint refreshes in place, it does not grow.
    #[test]
    fn restoring_same_input_overwrites() {
        let mut cache = LayoutCache::new();
        let def = size_input(AvailableSpace::Definite(300.0));
        cache.store(&def, out(300.0));
        cache.store(&def, out(305.0));
        assert_eq!(cache.measure_entries.len(), 1);
        assert_eq!(cache.get(&def).map(|o| o.size.width), Some(305.0));
    }

    /// Capacity is bounded, and clear() reports the same states taffy did.
    #[test]
    fn capacity_is_bounded_and_clear_reports_state() {
        let mut cache = LayoutCache::new();
        assert!(matches!(cache.clear(), ClearState::AlreadyEmpty));

        for i in 0..(MEASURE_CAPACITY * 2) {
            cache.store(&size_input(AvailableSpace::Definite(i as f32)), out(i as f32));
        }
        assert_eq!(cache.measure_entries.len(), MEASURE_CAPACITY);
        assert!(!cache.is_empty());

        assert!(matches!(cache.clear(), ClearState::Cleared));
        assert!(cache.is_empty());
        assert!(matches!(cache.clear(), ClearState::AlreadyEmpty));
    }
}
