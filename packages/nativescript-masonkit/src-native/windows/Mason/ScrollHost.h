#pragma once
#include <cstdint>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/NativeScript.Mason.h>
#include "Node.h"
#include "Positioning.h"

namespace mason_scroll
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace nsm = winrt::NativeScript::Mason;

    inline constexpr wchar_t kTag[] = L"mason-scroll";
    enum : int8_t { kVisible = 0, kHidden = 1, kScroll = 2, kClip = 3, kAuto = 4 };

    struct Axes
    {
        int8_t x{ kVisible };
        int8_t y{ kVisible };
    };

    inline bool Scrolls(int8_t v) { return v == kScroll || v == kAuto; }

    inline Axes ReadAxes(nsm::Node const& node)
    {
        Axes a;
        if (!node) return a;
        uint32_t len = 0;
        const uint8_t* d = winrt::get_self<nsm::implementation::Node>(node)->StyleData(len);
        if (!d || len < 7) return a;
        a.x = static_cast<int8_t>(d[5]);
        a.y = static_cast<int8_t>(d[6]);
        return a;
    }

    inline bool IsHost(winrt::Windows::Foundation::IInspectable const& e)
    {
        auto sv = e ? e.try_as<muxc::ScrollViewer>() : nullptr;
        if (!sv) return false;
        auto tag = sv.Tag();
        return tag && winrt::unbox_value_or<winrt::hstring>(tag, L"") == kTag;
    }

    inline muxc::ScrollViewer HostOf(mux::UIElement const& element)
    {
        auto fe = element ? element.try_as<mux::FrameworkElement>() : nullptr;
        auto parent = fe ? fe.Parent() : nullptr;
        return IsHost(parent) ? parent.as<muxc::ScrollViewer>() : nullptr;
    }

    inline void Configure(muxc::ScrollViewer const& sv, Axes a, bool scrollElement)
    {
        int8_t x = a.x, y = a.y;
        if (scrollElement)
        {
            if (y == kVisible) y = kAuto;
        }
        else
        {
            if (Scrolls(x) && y == kVisible) y = kAuto;
            if (Scrolls(y) && x == kVisible) x = kAuto;
        }
        auto mode = [](int8_t v) { return Scrolls(v) ? muxc::ScrollMode::Enabled : muxc::ScrollMode::Disabled; };
        auto bar = [](int8_t v) { return v == kScroll ? muxc::ScrollBarVisibility::Visible : v == kAuto ? muxc::ScrollBarVisibility::Auto : muxc::ScrollBarVisibility::Disabled; };
        if (sv.HorizontalScrollMode() != mode(x)) sv.HorizontalScrollMode(mode(x));
        if (sv.HorizontalScrollBarVisibility() != bar(x)) sv.HorizontalScrollBarVisibility(bar(x));
        if (sv.VerticalScrollMode() != mode(y)) sv.VerticalScrollMode(mode(y));
        if (sv.VerticalScrollBarVisibility() != bar(y)) sv.VerticalScrollBarVisibility(bar(y));
    }

    inline void Host(muxc::Panel const& owner, mux::UIElement const& child)
    {
        auto el = child.try_as<nsm::IMasonElement>();
        if (!el || HostOf(child)) return;
        const Axes axes = ReadAxes(el.Node());
        if (!Scrolls(axes.x) && !Scrolls(axes.y)) return;
        auto children = owner.Children();
        uint32_t index = 0;
        if (!children.IndexOf(child, index)) return;
        muxc::ScrollViewer sv;
        sv.Tag(winrt::box_value(winrt::hstring{ kTag }));
        sv.HorizontalContentAlignment(mux::HorizontalAlignment::Left);
        sv.VerticalContentAlignment(mux::VerticalAlignment::Top);
        Configure(sv, axes, false);
        children.SetAt(index, sv);
        sv.Content(child);
        owner.InvalidateMeasure();
    }

    inline void Unhost(muxc::ScrollViewer const& sv)
    {
        auto owner = sv.Parent().try_as<muxc::Panel>();
        auto content = sv.Content().try_as<mux::UIElement>();
        sv.Content(nullptr);
        if (!owner) return;
        auto children = owner.Children();
        uint32_t index = 0;
        if (!children.IndexOf(sv, index)) return;
        if (content) children.SetAt(index, content);
        else children.RemoveAt(index);
        owner.InvalidateMeasure();
    }

    inline void Release(mux::UIElement const& element)
    {
        auto sv = HostOf(element);
        if (!sv) return;
        sv.Content(nullptr);
        if (auto owner = sv.Parent().try_as<muxc::Panel>())
        {
            uint32_t index = 0;
            if (owner.Children().IndexOf(sv, index)) owner.Children().RemoveAt(index);
            owner.InvalidateMeasure();
        }
    }

    inline void SyncChild(muxc::Panel const& owner, mux::UIElement const& child, nsm::Node const& node)
    {
        if (!child.try_as<nsm::View>()) return;
        const Axes axes = ReadAxes(node);
        if (!Scrolls(axes.x) && !Scrolls(axes.y)) return;
        mason_position::Defer(owner, [ownerWeak = winrt::make_weak(owner), childWeak = winrt::make_weak(child)]
        {
            auto o = ownerWeak.get();
            auto c = childWeak.get();
            if (o && c) Host(o, c);
        });
    }

    inline void SyncScroller(muxc::ScrollViewer const& sv, nsm::IMasonElement const& content)
    {
        const Axes axes = ReadAxes(content ? content.Node() : nullptr);
        if (!IsHost(sv))
        {
            Configure(sv, axes, true);
            return;
        }
        if (Scrolls(axes.x) || Scrolls(axes.y))
        {
            Configure(sv, axes, false);
            return;
        }
        mason_position::Defer(sv, [weak = winrt::make_weak(sv)]
        {
            auto s = weak.get();
            if (!s || !IsHost(s)) return;
            const Axes now = ReadAxes(s.Content() ? s.Content().as<nsm::IMasonElement>().Node() : nullptr);
            if (!Scrolls(now.x) && !Scrolls(now.y)) Unhost(s);
        });
    }
}
