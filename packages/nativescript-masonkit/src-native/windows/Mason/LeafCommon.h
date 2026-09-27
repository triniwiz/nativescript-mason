#pragma once
#include <cstdint>
#include <cstring>
#include <functional>
#include <unordered_set>
#include <vector>

// Shared helpers for the leaf element controls (Text/Image/Button). A leaf is a
// Microsoft.UI.Xaml.Controls.Panel that hosts a single content control (Children[0]) and owns a
// typed Mason leaf node; the node's measure callback measures the hosted content, and the leaf's
// Measure/ArrangeOverride size/position that content.
namespace mason_leaf
{
    // Leaves laid out at a probe width during compute, to lay out again at their final width before
    // the measure pass ends: a layout during arrange makes XAML schedule another pass.
    inline thread_local std::vector<std::function<void()>> t_afterCompute;

    // Mason elements whose measure and arrange were invalidated since the last root compute. Their
    // ancestors were invalidated with them, so a later walk can stop there.
    inline thread_local std::unordered_set<void*> t_invalidated;

    inline bool MarkInvalidated(void* element) { return t_invalidated.insert(element).second; }

    // Texts whose runs changed since the last compute. A paragraph's runs usually change together,
    // so each is rebuilt once, just before compute measures it.
    inline thread_local std::vector<std::function<void()>> t_beforeCompute;

    inline void FlushBeforeCompute()
    {
        auto pending = std::move(t_beforeCompute);
        t_beforeCompute.clear();
        for (auto& fn : pending) fn();
    }

    inline void FlushAfterCompute()
    {
        auto pending = std::move(t_afterCompute);
        t_afterCompute.clear();
        for (auto& fn : pending) fn();
    }

    // Pack a measured size as the engine expects from a measure callback (see
    // mason_core::MeasureOutput): (widthBits << 32) | heightBits.
    inline int64_t PackMeasure(float w, float h)
    {
        uint32_t wb, hb;
        std::memcpy(&wb, &w, sizeof(uint32_t));
        std::memcpy(&hb, &h, sizeof(uint32_t));
        return static_cast<int64_t>((static_cast<uint64_t>(wb) << 32) | static_cast<uint64_t>(hb));
    }
}
