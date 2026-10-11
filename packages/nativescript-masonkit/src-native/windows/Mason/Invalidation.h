#pragma once
#include <array>
#include <cstdint>
#include <initializer_list>
#include <utility>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/NativeScript.Mason.h>
#include "LeafCommon.h"
#include "Node.h"
#include <unordered_set>

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

    // `display: none` takes the element out of layout, but its XAML content (text above all) would
    // still draw past its empty box, so it's collapsed too. Only elements collapsed here are shown
    // again, which leaves core's `visibility` alone.
    inline void SyncDisplay(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node)
    {
        namespace mux = winrt::Microsoft::UI::Xaml;
        thread_local std::unordered_set<void*> collapsed;
        if (!element || !node) return;
        uint32_t size = 0;
        const uint8_t* data = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->StyleData(size);
        if (!data || size < 4) return;
        int32_t display = 0;
        std::memcpy(&display, data, 4); // DISPLAY: 0 is none
        // A scrolling element is the content of a ScrollViewer, which is what its parent lays out.
        mux::UIElement target = element;
        if (auto fe = element.try_as<mux::FrameworkElement>())
        {
            if (auto host = fe.Parent().try_as<winrt::Microsoft::UI::Xaml::Controls::ScrollViewer>()) target = host;
        }
        void* key = winrt::get_abi(element.as<winrt::Windows::Foundation::IUnknown>());
        bool changed = false;
        if (display == 0)
        {
            if (target.Visibility() == mux::Visibility::Visible)
            {
                target.Visibility(mux::Visibility::Collapsed);
                collapsed.insert(key);
                changed = true;
            }
        }
        else if (collapsed.erase(key))
        {
            target.Visibility(mux::Visibility::Visible);
            if (target != element) element.Visibility(mux::Visibility::Visible);
            changed = true;
        }
        // Collapsed children are left out of their panel's Mason children: the panel re-syncs
        // them when it measures, and the layout root computes again.
        if (!changed) return;
        if (auto parent = mux::Media::VisualTreeHelper::GetParent(target).try_as<mux::UIElement>())
        {
            parent.InvalidateMeasure();
            if (auto owner = parent.try_as<winrt::NativeScript::Mason::IMasonElement>())
            {
                if (auto parentNode = owner.Node()) parentNode.MarkDirty();
            }
            InvalidateLayoutRoot(parent);
        }
    }

    inline void StyleSynced(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node, StyleDirty const& dirty)
    {
        SyncDisplay(element, node);
        if (AnyDirty(dirty, kLayoutKeys)) StyleChanged(element, node);
        else element.InvalidateArrange();
    }
}
