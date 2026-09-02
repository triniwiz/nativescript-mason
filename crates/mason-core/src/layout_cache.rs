//! Per-node layout cache.
//!
//! Drop-in replacement for `taffy::Cache`, which stores measure results in 9
//! fixed slots chosen by `compute_cache_slot`. That mapping puts `MaxContent`
//! and *every* `Definite(_)` value in the same slot:
//!
//! ```text
//! (MaxContent | Definite(_), MaxContent | Definite(_)) => 5,
//! ```
//!
//! Lookups scan all nine entries, but stores overwrite the computed slot — so a
//! node probed alternately at max-content and at a definite width evicts its own
//! entry on every store and misses on every lookup. Each miss makes the parent
//! re-lay-out the subtree, so the waste compounds per nesting level.
//!
//! Measured on a depth-8 comment thread: 47,387 measure callbacks for 84 text
//! nodes, with single nodes measured 6,835 times for **3** distinct constraints
//! (3 probe kinds ^ 8 levels = 6,561).
//!
//! This keeps taffy's matching semantics exactly — including the near-match
//! rules that let a probe hit an entry recorded under different-but-compatible
//! inputs — and only changes the storage: entries are keyed on their own
//! inputs and coexist up to [`MEASURE_CAPACITY`], so distinct constraints stop
//! evicting each other.

use taffy::{AvailableSpace, ClearState, LayoutInput, LayoutOutput, RunMode, Size};

/// Maximum distinct measure results held per node.
///
/// Bounded so a node whose constraints genuinely churn (an animation driving a
/// width, say) cannot grow without limit. The worst node observed on a real
/// screen used 20; beyond the cap the cache degrades to round-robin eviction,
/// which is still never worse than taffy's 9 slots.
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

    /// Taffy's cache-hit predicate, preserved verbatim: an entry matches when
    /// each known dimension either equals the entry's, or equals the size the
    /// entry produced; and, for axes with no known dimension, the available
    /// space is roughly equal.
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

                // Overwrite the entry for these exact inputs if we already have
                // one, so re-measuring the same constraint refreshes rather
                // than accumulates.
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
