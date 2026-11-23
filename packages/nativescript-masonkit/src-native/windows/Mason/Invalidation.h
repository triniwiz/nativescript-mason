#pragma once
#include <array>
#include <cstdint>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/NativeScript.Mason.h>
#include "LeafCommon.h"
#include "Node.h"
#include "StyleKeys.h"
#include <unordered_map>

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

    inline constexpr auto kLayoutKeys = mason_state_groups::kWindowsLayout;
    inline constexpr auto kTextKeys = mason_state_groups::kWindowsText;
    inline constexpr auto kControlKeys = mason_state_groups::kWindowsControls;

    constexpr bool AnyDirty(StyleDirty const& dirty, StyleDirty const& mask)
    {
        return ((dirty[0] & mask[0]) | (dirty[1] & mask[1]) | (dirty[2] & mask[2]) | (dirty[3] & mask[3])) != 0;
    }

    constexpr StyleDirty DirtyWords(int32_t w0, int32_t w1, int32_t w2, int32_t w3)
    {
        return { static_cast<uint32_t>(w0), static_cast<uint32_t>(w1), static_cast<uint32_t>(w2), static_cast<uint32_t>(w3) };
    }

    constexpr StyleDirty UpdatePaintStyle(bool& paintDirty, int32_t w0, int32_t w1, int32_t w2, int32_t w3)
    {
        const auto dirty = DirtyWords(w0, w1, w2, w3);
        paintDirty = paintDirty || AnyDirty(dirty, mason_state_groups::kWindowsPaint);
        return dirty;
    }

    // Why an element is hidden. Each reason collapses it on its own; it shows again once none is
    // left, and only if it was collapsed here, which leaves core's `visibility` alone.
    enum HiddenReason : uint8_t
    {
        HiddenByDisplay = 1, // display: none
        HiddenByDetails = 2, // content of a closed <details>
    };

    struct HiddenState
    {
        winrt::weak_ref<winrt::Microsoft::UI::Xaml::UIElement> element;
        uint8_t reasons{ 0 };
        bool collapsedHere{ false };
    };

    inline std::unordered_map<void*, HiddenState>& HiddenRegistry()
    {
        thread_local auto* registry = new std::unordered_map<void*, HiddenState>();
        return *registry;
    }

    // Sets or clears one reason to hide [target]. With [resync] its parent re-syncs its Mason
    // children (collapsed children are left out of them) and the layout root computes again;
    // a parent changing its own children during its measure passes false.
    inline void SetHidden(winrt::Microsoft::UI::Xaml::UIElement const& target, uint8_t reason, bool hidden, bool resync = true)
    {
        namespace mux = winrt::Microsoft::UI::Xaml;
        if (!target) return;
        auto& registry = HiddenRegistry();
        void* key = winrt::get_abi(target.as<winrt::Windows::Foundation::IUnknown>());
        auto it = registry.find(key);
        if (it != registry.end() && it->second.element.get() != target)
        {
            registry.erase(it);
            it = registry.end();
        }
        if (it == registry.end())
        {
            if (!hidden) return;
            if (registry.size() >= 1024) std::erase_if(registry, [](auto const& e) { return !e.second.element.get(); });
            it = registry.emplace(key, HiddenState{ winrt::make_weak(target) }).first;
        }
        auto& state = it->second;
        const uint8_t before = state.reasons;
        state.reasons = hidden ? (before | reason) : (before & ~reason);
        bool changed = false;
        if (before == 0 && state.reasons != 0)
        {
            if (target.Visibility() == mux::Visibility::Visible)
            {
                target.Visibility(mux::Visibility::Collapsed);
                state.collapsedHere = true;
                changed = true;
            }
        }
        else if (before != 0 && state.reasons == 0)
        {
            if (state.collapsedHere)
            {
                target.Visibility(mux::Visibility::Visible);
                changed = true;
            }
            registry.erase(it);
        }
        if (!changed || !resync) return;
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

    // What a parent panel lays out for [element]: a scrolling element is the content of a
    // ScrollViewer, which is the child.
    inline winrt::Microsoft::UI::Xaml::UIElement LayoutChildOf(winrt::Microsoft::UI::Xaml::UIElement const& element)
    {
        if (auto fe = element.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>())
        {
            if (auto host = fe.Parent().try_as<winrt::Microsoft::UI::Xaml::Controls::ScrollViewer>()) return host;
        }
        return element;
    }

    // `display: none` takes the element out of layout, but its XAML content (text above all)
    // would still draw past its empty box, so it's collapsed too.
    inline void SyncDisplay(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node)
    {
        if (!element || !node) return;
        uint32_t size = 0;
        const uint8_t* data = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->StyleData(size);
        constexpr auto offset = mason_style_keys::kDisplay;
        if (!data || size < offset + sizeof(int32_t)) return;
        int32_t display = 0;
        std::memcpy(&display, data + offset, sizeof(display));
        SetHidden(LayoutChildOf(element), HiddenByDisplay, display == 0);
    }

    inline void StyleSynced(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node, StyleDirty const& dirty)
    {
        if (AnyDirty(dirty, mason_state_groups::kWindowsDisplay)) SyncDisplay(element, node);
        if (AnyDirty(dirty, kLayoutKeys)) StyleChanged(element, node);
        else element.InvalidateArrange();
    }
}
