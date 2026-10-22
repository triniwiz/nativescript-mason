#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/NativeScript.Mason.h>
#include "Node.h"
#include "Positioning.h"
#include "Events.h"

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

    inline void HookEvents(muxc::ScrollViewer const& sv);
    inline void ApplyPendingSeek(mux::UIElement const& element);

    inline void* IdentityOf(winrt::Windows::Foundation::IInspectable const& object)
    {
        return object ? winrt::get_abi(object.as<winrt::Windows::Foundation::IUnknown>()) : nullptr;
    }

    inline std::unordered_map<void*, winrt::weak_ref<muxc::ScrollViewer>>& Hosts()
    {
        thread_local std::unordered_map<void*, winrt::weak_ref<muxc::ScrollViewer>> hosts;
        return hosts;
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
        std::erase_if(Hosts(), [](auto const& entry) { return !entry.second.get(); });
        Hosts()[IdentityOf(child)] = winrt::make_weak(sv);
        if (mason_events::HasListener(child, L"scroll") || mason_events::HasListener(child, L"scrollend")) HookEvents(sv);
        ApplyPendingSeek(child);
        owner.InvalidateMeasure();
    }

    inline void Unhost(muxc::ScrollViewer const& sv)
    {
        auto owner = sv.Parent().try_as<muxc::Panel>();
        auto content = sv.Content().try_as<mux::UIElement>();
        if (content) Hosts().erase(IdentityOf(content));
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
        Hosts().erase(IdentityOf(element));
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

    // vertical-rl content starts at the right (mason-core moves its left overflow into the content
    // box): a right-to-left ScrollViewer starts at its right end and stays anchored there, and its
    // content is set back to left-to-right so it isn't mirrored.
    inline void SyncScrollOrigin(muxc::ScrollViewer const& sv, nsm::IMasonElement const& content)
    {
        auto node = content ? content.Node() : nullptr;
        bool rl = false;
        if (node)
        {
            auto* impl = winrt::get_self<nsm::implementation::Node>(node);
            rl = mason_node_get_writing_mode(impl->MasonPtr(), impl->NodePtr()) == 1;
        }
        const auto flow = rl ? mux::FlowDirection::RightToLeft : mux::FlowDirection::LeftToRight;
        if (sv.FlowDirection() != flow) sv.FlowDirection(flow);
        if (auto fe = content.try_as<mux::FrameworkElement>(); fe && fe.FlowDirection() != mux::FlowDirection::LeftToRight)
        {
            fe.FlowDirection(mux::FlowDirection::LeftToRight);
        }
    }

    inline void SyncScroller(muxc::ScrollViewer const& sv, nsm::IMasonElement const& content)
    {
        const Axes axes = ReadAxes(content ? content.Node() : nullptr);
        if (content) SyncScrollOrigin(sv, content);
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

    // Scroll offsets and sizes, in DIPs, via the ScrollViewer whose Content the element is.

    inline muxc::ScrollViewer ScrollerOf(mux::UIElement const& element)
    {
        auto fe = element ? element.try_as<mux::FrameworkElement>() : nullptr;
        auto sv = fe ? fe.Parent().try_as<muxc::ScrollViewer>() : nullptr;
        if (!sv)
        {
            if (auto it = Hosts().find(IdentityOf(element)); it != Hosts().end()) sv = it->second.get();
        }
        return sv && sv.Content() == element ? sv : nullptr;
    }

    // The target of an instant scrollTo, reported until the ScrollViewer has applied it.
    inline std::unordered_map<void*, std::pair<double, double>>& RequestedOffsets()
    {
        thread_local std::unordered_map<void*, std::pair<double, double>> requested;
        return requested;
    }

    inline std::unordered_set<void*>& QueuedOffsets()
    {
        thread_local std::unordered_set<void*> queued;
        return queued;
    }

    // Raises "scroll"/"scrollend" on the content; hooked once it has such a listener or is scrolled from code.
    inline void HookEvents(muxc::ScrollViewer const& sv)
    {
        thread_local std::unordered_map<void*, winrt::weak_ref<muxc::ScrollViewer>> hooked;
        void* key = winrt::get_abi(sv);
        if (auto it = hooked.find(key); it != hooked.end() && it->second.get()) return;
        std::erase_if(hooked, [](auto const& entry) { return !entry.second.get(); });
        hooked[key] = winrt::make_weak(sv);
        struct Queued
        {
            bool queued{ false };
            bool ended{ false };
        };
        auto state = std::make_shared<Queued>();
        sv.ViewChanged([state](winrt::Windows::Foundation::IInspectable const& sender, muxc::ScrollViewerViewChangedEventArgs const& args)
        {
            if (!args.IsIntermediate())
            {
                if (!QueuedOffsets().contains(IdentityOf(sender))) RequestedOffsets().erase(IdentityOf(sender));
                state->ended = true;
            }
            if (state->queued) return;
            auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
            if (!queue) return;
            state->queued = true;
            queue.TryEnqueue([state, weak = winrt::make_weak(sender.as<muxc::ScrollViewer>())]
            {
                state->queued = false;
                const bool ended = std::exchange(state->ended, false);
                auto sv = weak.get();
                auto content = sv ? sv.Content() : nullptr;
                if (!content) return;
                if (mason_events::HasListener(content, L"scroll")) mason_events::Dispatch(content, L"scroll", false);
                if (ended && mason_events::HasListener(content, L"scrollend")) mason_events::Dispatch(content, L"scrollend", false);
            });
        });
    }

    // Runs `fn` now if `fe` is loaded, else once it loads.
    template <typename F>
    inline void WhenLoaded(mux::FrameworkElement const& fe, F fn)
    {
        if (fe.IsLoaded())
        {
            fn();
            return;
        }
        auto token = std::make_shared<winrt::event_token>();
        *token = fe.Loaded([token, fn](winrt::Windows::Foundation::IInspectable const& sender, mux::RoutedEventArgs const&)
        {
            sender.as<mux::FrameworkElement>().Loaded(*token);
            fn();
        });
    }

    inline void Listen(mux::UIElement const& element)
    {
        if (auto sv = ScrollerOf(element))
        {
            HookEvents(sv);
            return;
        }
        // <scroll> may get its ScrollViewer after the listener; hosted ones hook themselves in Host.
        auto fe = element.try_as<mux::FrameworkElement>();
        if (!fe || fe.IsLoaded()) return;
        WhenLoaded(fe, [weak = winrt::make_weak(element)]
        {
            if (auto e = weak.get())
            {
                if (auto sv = ScrollerOf(e)) HookEvents(sv);
            }
        });
    }

    // A right-to-left ScrollViewer (vertical-rl) measures its horizontal offset from the right,
    // growing to the left; the web's scrollLeft is 0 there and negative to the left.
    inline double WebLeft(muxc::ScrollViewer const& sv, double left)
    {
        return !std::isnan(left) && sv.FlowDirection() == mux::FlowDirection::RightToLeft ? -left : left;
    }

    inline double Offset(mux::UIElement const& element, bool vertical)
    {
        auto sv = ScrollerOf(element);
        if (!sv) return 0;
        if (auto it = RequestedOffsets().find(IdentityOf(sv)); it != RequestedOffsets().end())
        {
            return vertical ? it->second.second : WebLeft(sv, it->second.first);
        }
        return vertical ? sv.VerticalOffset() : WebLeft(sv, sv.HorizontalOffset());
    }

    // Size reads run a pending layout pass first, as on the web.
    inline double ClientSize(mux::UIElement const& element, bool vertical)
    {
        if (!element) return 0;
        element.UpdateLayout();
        if (auto sv = ScrollerOf(element)) return vertical ? sv.ViewportHeight() : sv.ViewportWidth();
        auto fe = element.try_as<mux::FrameworkElement>();
        return fe ? (vertical ? fe.ActualHeight() : fe.ActualWidth()) : 0;
    }

    inline double ScrollSize(mux::UIElement const& element, bool vertical)
    {
        if (!element) return 0;
        element.UpdateLayout();
        if (auto sv = ScrollerOf(element))
        {
            return vertical ? (std::max)(sv.ViewportHeight(), sv.ExtentHeight()) : (std::max)(sv.ViewportWidth(), sv.ExtentWidth());
        }
        auto fe = element.try_as<mux::FrameworkElement>();
        return fe ? (vertical ? fe.ActualHeight() : fe.ActualWidth()) : 0;
    }

    // NaN keeps an axis. Called once `sv` is loaded.
    inline void ChangeTo(muxc::ScrollViewer const& sv, double left, double top, bool smooth)
    {
        auto& requested = RequestedOffsets();
        void* key = IdentityOf(sv);
        auto it = requested.find(key);
        if (smooth)
        {
            if (it != requested.end())
            {
                if (std::isnan(left)) left = it->second.first;
                if (std::isnan(top)) top = it->second.second;
                requested.erase(it);
            }
            QueuedOffsets().erase(key);
            winrt::Windows::Foundation::IReference<double> h{ nullptr };
            winrt::Windows::Foundation::IReference<double> v{ nullptr };
            if (!std::isnan(left)) h = winrt::Windows::Foundation::IReference<double>{ left };
            if (!std::isnan(top)) v = winrt::Windows::Foundation::IReference<double>{ top };
            sv.ChangeView(h, v, nullptr, false);
            return;
        }
        // An instant change lands on a later layout tick; report the clamped target until then.
        HookEvents(sv);
        auto clamp = [](double value, double max) { return (std::min)((std::max)(value, 0.0), (std::max)(max, 0.0)); };
        const double x = it != requested.end() ? it->second.first : sv.HorizontalOffset();
        const double y = it != requested.end() ? it->second.second : sv.VerticalOffset();
        requested[key] = { std::isnan(left) ? x : clamp(left, sv.ScrollableWidth()), std::isnan(top) ? y : clamp(top, sv.ScrollableHeight()) };
        if (!QueuedOffsets().insert(key).second) return;
        auto apply = [key, weak = winrt::make_weak(sv)]
        {
            if (!QueuedOffsets().erase(key)) return;
            auto sv = weak.get();
            auto& requested = RequestedOffsets();
            auto it = requested.find(key);
            if (!sv || it == requested.end()) return;
            const winrt::Windows::Foundation::IReference<double> h{ it->second.first };
            const winrt::Windows::Foundation::IReference<double> v{ it->second.second };
            if (!sv.ChangeView(h, v, nullptr, true)) requested.erase(it);
        };
        auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
        if (!queue || !queue.TryEnqueue(apply)) apply();
    }

    struct Seek
    {
        winrt::weak_ref<mux::UIElement> element;
        double left{ std::numeric_limits<double>::quiet_NaN() };
        double top{ std::numeric_limits<double>::quiet_NaN() };
        bool smooth{ false };
    };

    // scrollTo made before the element's ScrollViewer loaded, by element.
    inline std::unordered_map<void*, Seek>& PendingSeeks()
    {
        thread_local std::unordered_map<void*, Seek> pending;
        return pending;
    }

    inline void ApplyPendingSeek(mux::UIElement const& element)
    {
        auto& pending = PendingSeeks();
        auto it = pending.find(IdentityOf(element));
        if (it == pending.end()) return;
        // Not hosted yet: Host applies it once it wraps the element.
        auto sv = ScrollerOf(element);
        if (!sv) return;
        if (!sv.IsLoaded())
        {
            WhenLoaded(sv, [weak = winrt::make_weak(element)]
            {
                if (auto e = weak.get()) ApplyPendingSeek(e);
            });
            return;
        }
        const Seek seek = it->second;
        pending.erase(it);
        sv.UpdateLayout();
        ChangeTo(sv, WebLeft(sv, seek.left), seek.top, seek.smooth);
    }

    // NaN keeps an axis. Before the element has a loaded ScrollViewer, the request waits for one;
    // a later request replaces it per axis.
    inline void ScrollTo(mux::UIElement const& element, double left, double top, bool smooth)
    {
        if (!element) return;
        element.UpdateLayout();
        auto& pending = PendingSeeks();
        const bool waiting = pending.contains(IdentityOf(element));
        auto sv = ScrollerOf(element);
        if (sv && sv.IsLoaded() && !waiting)
        {
            ChangeTo(sv, WebLeft(sv, left), top, smooth);
            return;
        }
        std::erase_if(pending, [](auto const& entry) { return !entry.second.element.get(); });
        Seek& seek = pending[IdentityOf(element)];
        seek.element = winrt::make_weak(element);
        if (!std::isnan(left)) seek.left = left;
        if (!std::isnan(top)) seek.top = top;
        seek.smooth = smooth;
        ApplyPendingSeek(element);
    }

    inline std::pair<int32_t, int32_t> PhysicalModes(int32_t block, int32_t inlineMode, uint8_t writingMode, bool rtl)
    {
        auto flipped = [](int32_t mode) { return mode == 0 ? 2 : mode == 2 ? 0 : mode; };
        const int32_t along = rtl ? flipped(inlineMode) : inlineMode;
        if (writingMode == 1) return { flipped(block), along };
        if (writingMode == 2) return { block, along };
        return { along, block };
    }

    inline double Align(double start, double size, double at, double port, int32_t mode)
    {
        const double end = start + size;
        switch (mode)
        {
        case 0: return start;
        case 1: return start + size / 2 - port / 2;
        case 2: return end - port;
        default:
            // CSSOM "nearest".
            if (start < at && end > at + port) return at;
            if ((start < at && size <= port) || (end > at + port && size > port)) return start;
            if ((start < at && size > port) || (end > at + port && size <= port)) return end - port;
            return at;
        }
    }

    // block/inline: 0 start, 1 center, 2 end, 3 nearest, along each Mason scroller's own axes.
    inline void ScrollIntoView(mux::UIElement const& element, int32_t block, int32_t inlineMode, bool smooth)
    {
        if (!element) return;
        element.UpdateLayout();
        // A scroll container is aligned as its ScrollViewer's box, not its content.
        mux::UIElement target = element;
        if (auto own = ScrollerOf(element)) target = own;
        auto fe = target.try_as<mux::FrameworkElement>();
        if (!fe) return;
        const winrt::Windows::Foundation::Rect bounds{ 0.0f, 0.0f, static_cast<float>(fe.ActualWidth()), static_cast<float>(fe.ActualHeight()) };
        // ChangeTo lands later, so outer scrollers see the target where it will be.
        double shiftX = 0, shiftY = 0;
        for (auto parent = mux::Media::VisualTreeHelper::GetParent(target); parent; parent = mux::Media::VisualTreeHelper::GetParent(parent))
        {
            auto sv = parent.try_as<muxc::ScrollViewer>();
            auto content = sv ? sv.Content().try_as<mux::UIElement>() : nullptr;
            if (!content) continue;
            auto rect = target.TransformToVisual(content).TransformBounds(bounds);
            rect.X -= static_cast<float>(shiftX);
            rect.Y -= static_cast<float>(shiftY);
            auto mason = content.try_as<nsm::IMasonElement>();
            auto node = mason ? mason.Node() : nullptr;
            if (!node)
            {
                auto ratio = [](int32_t mode)
                {
                    return mode == 0 ? 0.0 : mode == 1 ? 0.5 : mode == 2 ? 1.0 : std::numeric_limits<double>::quiet_NaN();
                };
                mux::BringIntoViewOptions options;
                options.AnimationDesired(smooth);
                options.VerticalAlignmentRatio(ratio(block));
                options.HorizontalAlignmentRatio(ratio(inlineMode));
                options.TargetRect(rect);
                content.StartBringIntoView(options);
                return;
            }
            if (!sv.IsLoaded()) continue;
            auto* impl = winrt::get_self<nsm::implementation::Node>(node);
            const auto [modeX, modeY] = PhysicalModes(block, inlineMode, mason_node_get_writing_mode(impl->MasonPtr(), impl->NodePtr()),
                mason_node_get_direction(impl->MasonPtr(), impl->NodePtr()) != 0);
            double h = sv.HorizontalOffset(), v = sv.VerticalOffset();
            if (auto it = RequestedOffsets().find(IdentityOf(sv)); it != RequestedOffsets().end()) std::tie(h, v) = it->second;
            const double maxX = sv.ScrollableWidth(), maxY = sv.ScrollableHeight();
            // A right-to-left ScrollViewer counts its offset from the right.
            const bool rl = sv.FlowDirection() == mux::FlowDirection::RightToLeft;
            const double left = rl ? maxX - h : h;
            auto clamp = [](double value, double max) { return (std::min)((std::max)(value, 0.0), (std::max)(max, 0.0)); };
            const double x = clamp(Align(rect.X, rect.Width, left, sv.ViewportWidth(), modeX), maxX);
            const double y = clamp(Align(rect.Y, rect.Height, v, sv.ViewportHeight(), modeY), maxY);
            if (x == left && y == v) continue;
            ChangeTo(sv, rl ? maxX - x : x, y, smooth);
            shiftX += x - left;
            shiftY += y - v;
        }
    }
}
