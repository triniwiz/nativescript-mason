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

    constexpr StyleDirty StateFlags(std::initializer_list<std::pair<uint32_t, uint32_t>> ranges)
    {
        StyleDirty mask{};
        for (auto [first, last] : ranges)
        {
            for (uint32_t n = first; n <= last; ++n) mask[n >> 5] |= 1u << (n & 31);
        }
        return mask;
    }

    // Inclusive StateKeys bit ranges, as Android's StateKeys.LAYOUT_MASK and TEXT_LAYOUT.
    namespace st = mason_state_keys;
    inline constexpr StyleDirty kLayoutKeys = StateFlags({ { st::kDisplay, st::kMaxContentHeight }, { st::kFloat, st::kClear }, { st::kListStylePosition, st::kInvalidateText }, { st::kTextAlign, st::kTextJustify }, { st::kFontSize, st::kTextOverflow }, { st::kWhiteSpace, st::kVerticalAlign }, { st::kFontFamily, st::kFontVariantNumeric }, { st::kWritingMode, st::kHyphens }, { st::kWordSpacing, st::kFontStretch }, { st::kTextIndent, st::kLineClamp }, { st::kTextOrientation, st::kTextOrientation }, { st::kVisibility, st::kVisibility } });
    inline constexpr StyleDirty kTextKeys = StateFlags({ { st::kDirection, st::kDirection }, { st::kInvalidateText, st::kTextJustify }, { st::kFontSize, st::kFontVariantNumeric }, { st::kWritingMode, st::kHyphens }, { st::kWordSpacing, st::kFontStretch }, { st::kTextIndent, st::kLineClamp }, { st::kTextOrientation, st::kTextOrientation } });
    inline constexpr StyleDirty kControlKeys = StateFlags({ { st::kInvalidateText, st::kFontVariantNumeric }, { st::kWritingMode, st::kHyphens }, { st::kWordSpacing, st::kFontStretch } });

    inline bool AnyDirty(StyleDirty const& dirty, StyleDirty const& mask)
    {
        return ((dirty[0] & mask[0]) | (dirty[1] & mask[1]) | (dirty[2] & mask[2]) | (dirty[3] & mask[3])) != 0;
    }

    inline StyleDirty DirtyWords(int32_t w0, int32_t w1, int32_t w2, int32_t w3)
    {
        return { static_cast<uint32_t>(w0), static_cast<uint32_t>(w1), static_cast<uint32_t>(w2), static_cast<uint32_t>(w3) };
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
        if (!data || size < 4) return;
        int32_t display = 0;
        std::memcpy(&display, data, 4); // DISPLAY: 0 is none
        SetHidden(LayoutChildOf(element), HiddenByDisplay, display == 0);
    }

    inline void StyleSynced(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node, StyleDirty const& dirty)
    {
        SyncDisplay(element, node);
        if (AnyDirty(dirty, kLayoutKeys)) StyleChanged(element, node);
        else element.InvalidateArrange();
    }
}
