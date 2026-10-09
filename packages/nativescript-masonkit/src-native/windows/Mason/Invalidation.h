#pragma once
#include <array>
#include <cstdint>
#include <initializer_list>
#include <utility>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/NativeScript.Mason.h>
#include "LeafCommon.h"

namespace mason_leaf
{
    // Only the layout root's measure does work: its compute lays out the whole tree, and a nested
    // panel reads that layout in Arrange. So every Mason ancestor is arranged again but only the root
    // measured; a panel whose children change is measured where they change, to sync them. The engine
    // marks the node's ancestors dirty itself.
    inline void InvalidateLayoutRoot(winrt::Microsoft::UI::Xaml::UIElement const& element)
    {
        winrt::Microsoft::UI::Xaml::FrameworkElement top{ nullptr };
        auto cur = element.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>();
        while (cur)
        {
            if (cur.try_as<winrt::NativeScript::Mason::IMasonElement>())
            {
                // An earlier walk since the last compute went on from here to the root.
                if (!MarkInvalidated(winrt::get_abi(cur))) return;
                cur.InvalidateArrange();
                top = cur;
            }
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>() : nullptr;
        }
        if (top) top.InvalidateMeasure();
    }

    inline void StyleChanged(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node)
    {
        if (node) node.MarkDirty();
        InvalidateLayoutRoot(element);
    }

    using StyleDirty = std::array<uint32_t, 4>;

    constexpr StyleDirty StateFlags(std::initializer_list<std::pair<uint32_t, uint32_t>> ranges)
    {
        StyleDirty mask{};
        for (auto [first, last] : ranges)
        {
            for (uint32_t n = first; n <= last; ++n) mask[n >> 5] |= 1u << (n & 31);
        }
        return mask;
    }

    // StateKeys flag numbers from style.ts, as Android's StateKeys.LAYOUT_MASK and TEXT_LAYOUT.
    inline constexpr StyleDirty kLayoutKeys = StateFlags({ { 0, 39 }, { 43, 44 }, { 47, 49 }, { 53, 54 }, { 56, 61 }, { 63, 66 }, { 69, 71 }, { 73, 75 }, { 77, 78 } });
    inline constexpr StyleDirty kTextKeys = StateFlags({ { 2, 2 }, { 49, 54 }, { 56, 71 }, { 73, 75 }, { 77, 78 } });
    inline constexpr StyleDirty kControlKeys = StateFlags({ { 49, 71 }, { 73, 75 }, { 77, 78 } });

    inline bool AnyDirty(StyleDirty const& dirty, StyleDirty const& mask)
    {
        return ((dirty[0] & mask[0]) | (dirty[1] & mask[1]) | (dirty[2] & mask[2]) | (dirty[3] & mask[3])) != 0;
    }

    inline StyleDirty DirtyWords(int32_t w0, int32_t w1, int32_t w2, int32_t w3)
    {
        return { static_cast<uint32_t>(w0), static_cast<uint32_t>(w1), static_cast<uint32_t>(w2), static_cast<uint32_t>(w3) };
    }

    inline void StyleSynced(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node, StyleDirty const& dirty)
    {
        if (AnyDirty(dirty, kLayoutKeys)) StyleChanged(element, node);
        else element.InvalidateArrange();
    }
}
