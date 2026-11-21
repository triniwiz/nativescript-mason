#include "pch.h"
#include "Events.h"
#include "Event.h"
#include "Text.h"
#include "CssMask.h"
#include "ScrollHost.h"
#include <algorithm>
#include <cmath>
#include <limits>
#include <unordered_map>
#include <vector>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Input.h>
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <winrt/Windows.System.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxi = winrt::Microsoft::UI::Xaml::Input;
    using winrt::Windows::Foundation::IInspectable;

    struct Listener
    {
        int64_t id;
        winrt::hstring type;
        nsm::EventListener fn;
    };

    struct Entry
    {
        winrt::weak_ref<mux::UIElement> element;
        std::vector<Listener> listeners;
        bool hooked{ false };
        bool pointerHooked{ false };
    };

    std::unordered_map<void*, Entry>& Registry()
    {
        static auto* registry = new std::unordered_map<void*, Entry>();
        return *registry;
    }

    int64_t g_nextId = 1;

    void* KeyOf(IInspectable const& element)
    {
        return element ? winrt::get_abi(element.as<winrt::Windows::Foundation::IUnknown>()) : nullptr;
    }

    // An entry whose element died is dropped: a new element can reuse its address.
    Entry* Find(IInspectable const& element)
    {
        auto& registry = Registry();
        auto it = registry.find(KeyOf(element));
        if (it == registry.end()) return nullptr;
        if (!it->second.element.get())
        {
            registry.erase(it);
            return nullptr;
        }
        return &it->second;
    }

    Entry& EnsureEntry(mux::UIElement const& element)
    {
        if (auto* entry = Find(element)) return *entry;
        auto& entry = Registry()[KeyOf(element)];
        entry.element = winrt::make_weak(element);
        return entry;
    }

    IInspectable ParentOf(IInspectable const& element)
    {
        if (auto text = element.try_as<nsm::Text>())
        {
            if (auto* owner = winrt::get_self<nsm::implementation::Text>(text)->InlineOwner())
            {
                nsm::Text host = *owner;
                return host;
            }
        }
        auto object = element.try_as<mux::DependencyObject>();
        if (!object) return nullptr;
        if (auto fe = object.try_as<mux::FrameworkElement>())
        {
            if (auto parent = fe.Parent()) return parent;
        }
        return mux::Media::VisualTreeHelper::GetParent(object);
    }

    // Elements set to pointer-events: none, and those whose XAML hit testing that turned off.
    std::unordered_map<void*, winrt::weak_ref<IInspectable>>& PointerNone()
    {
        static auto* set = new std::unordered_map<void*, winrt::weak_ref<IInspectable>>();
        return *set;
    }

    std::unordered_map<void*, winrt::weak_ref<mux::UIElement>>& HitTestOff()
    {
        static auto* set = new std::unordered_map<void*, winrt::weak_ref<mux::UIElement>>();
        return *set;
    }

    bool IsNone(IInspectable const& element)
    {
        if (!element) return false;
        auto& set = PointerNone();
        auto it = set.find(KeyOf(element));
        if (it == set.end()) return false;
        if (!it->second.get())
        {
            set.erase(it);
            return false;
        }
        return true;
    }

    void Fire(IInspectable const& target, winrt::com_ptr<nsm::implementation::Event> const& event, bool bubbles)
    {
        // Mason has bubbled it already; a framework re-dispatching it must not bubble it again.
        event->bubbles = false;
        event->target = target;
        const winrt::hstring type = event->type;
        nsm::Event projected = *event;
        for (IInspectable cur = target; cur; cur = bubbles ? ParentOf(cur) : nullptr)
        {
            if (auto* entry = Find(cur))
            {
                std::vector<nsm::EventListener> fns;
                for (auto const& l : entry->listeners)
                {
                    if (l.type == type) fns.push_back(l.fn);
                }
                for (auto const& fn : fns)
                {
                    try
                    {
                        fn(projected);
                    }
                    catch (...)
                    {
                    }
                    if (event->immediatePropagationStopped) break;
                }
            }
            if (event->propagationStopped) break;
        }
    }

    winrt::com_ptr<nsm::implementation::Event> Fire(IInspectable const& target, winrt::hstring const& type, bool bubbles, winrt::hstring const& data)
    {
        auto event = winrt::make_self<nsm::implementation::Event>(type, type == L"click");
        event->data = data;
        Fire(target, event, bubbles);
        return event;
    }

    IInspectable OriginOf(muxi::TappedRoutedEventArgs const& e)
    {
        auto source = e.OriginalSource();
        for (auto cur = source; cur; cur = ParentOf(cur))
        {
            if (auto text = cur.try_as<nsm::Text>())
            {
                auto* impl = winrt::get_self<nsm::implementation::Text>(text);
                if (auto hit = impl->InlineElementAt(e.GetPosition(text))) return hit;
                if (!impl->IsAnonymous()) return text;
            }
            else if (cur.try_as<nsm::IMasonElement>())
            {
                return cur;
            }
        }
        return source;
    }

    // Whether a clip-path on the element or an ancestor leaves out a point in window coordinates.
    bool ClippedOut(mux::UIElement const& element, winrt::Windows::Foundation::Point host)
    {
        for (auto cur = element; cur; cur = mux::Media::VisualTreeHelper::GetParent(cur).try_as<mux::UIElement>())
        {
            if (!mason_cssmask::Find(cur)) continue;
            auto el = cur.try_as<nsm::IMasonElement>();
            auto fe = cur.try_as<mux::FrameworkElement>();
            if (!el || !fe) continue;
            try
            {
                const auto local = cur.TransformToVisual(nullptr).Inverse().TransformPoint(host);
                if (mason_cssmask::ClipExcludes(cur, el.Node(), static_cast<float>(fe.ActualWidth()), static_cast<float>(fe.ActualHeight()), local.X, local.Y)) return true;
            }
            catch (...)
            {
            }
        }
        return false;
    }

    // The topmost Mason element under a point in window coordinates, within `scope`.
    IInspectable ElementAtHost(mux::UIElement const& scope, winrt::Windows::Foundation::Point point)
    {
        for (auto const& hit : mux::Media::VisualTreeHelper::FindElementsInHostCoordinates(point, scope, true))
        {
            const bool text = hit.try_as<nsm::Text>() != nullptr;
            if (!text && !hit.try_as<nsm::IMasonElement>()) continue;
            if (ClippedOut(hit, point)) continue;
            if (text)
            {
                auto* impl = winrt::get_self<nsm::implementation::Text>(hit.as<nsm::Text>());
                auto inl = impl->InlineElementAt(hit.TransformToVisual(nullptr).Inverse().TransformPoint(point));
                if (inl && !IsNone(inl)) return inl;
                if (!impl->IsAnonymous() && !IsNone(hit)) return hit;
                continue;
            }
            // pointer-events: none: what's beneath takes it (its children came first).
            if (IsNone(hit)) continue;
            return hit;
        }
        return nullptr;
    }

    // Every hooked element on the way up sees the same tap; the first one dispatches it.
    thread_local muxi::TappedRoutedEventArgs t_routing{ nullptr };

    void OnTapped(IInspectable const&, muxi::TappedRoutedEventArgs const& e)
    {
        if (t_routing == e) return;
        t_routing = e;
        if (auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread())
        {
            queue.TryEnqueue([] { t_routing = nullptr; });
        }
        auto origin = OriginOf(e);
        // A tap outside an element's clip-path, or on a pointer-events: none element, goes to what's under it.
        const auto point = e.GetPosition(nullptr);
        auto element = origin.try_as<mux::UIElement>();
        if (IsNone(origin) || (element && ClippedOut(element, point)))
        {
            auto source = element ? element : e.OriginalSource().try_as<mux::UIElement>();
            auto root = source ? source.XamlRoot() : nullptr;
            auto content = root ? root.Content() : nullptr;
            origin = content ? ElementAtHost(content, point) : nullptr;
            if (!origin) return;
        }
        auto event = Fire(origin, L"click", true, {});
        if (event->propagationStopped) e.Handled(true);
    }
    // MARK: Pointer events
    // Raised from XAML's pointer routed events. A press on an element with pointer listeners hooks
    // its window content, so the pointer is followed wherever it goes until it's released.

    struct PointerState
    {
        int32_t id{ 0 };
        winrt::hstring type;
        bool primary{ false };
        winrt::weak_ref<IInspectable> target;
        winrt::weak_ref<IInspectable> capture;
        winrt::weak_ref<IInspectable> pending;
        bool hasPending{ false };
        double clientX{ std::numeric_limits<double>::quiet_NaN() };
        double clientY{ std::numeric_limits<double>::quiet_NaN() };
        int32_t buttons{ 0 };
        bool cancelled{ false };
        muxi::Pointer pointer{ nullptr };
        winrt::weak_ref<mux::UIElement> xamlCapture;
    };

    std::unordered_map<int32_t, PointerState>& Pointers()
    {
        static auto* pointers = new std::unordered_map<int32_t, PointerState>();
        return *pointers;
    }

    struct Sample
    {
        double x{ 0 }, y{ 0 };
        int32_t button{ -1 };
        int32_t buttons{ 0 };
        double pressure{ 0 }, width{ 1 }, height{ 1 }, tiltX{ 0 }, tiltY{ 0 }, twist{ 0 };
        bool ctrl{ false }, shift{ false }, alt{ false }, meta{ false };
    };

    template <typename T>
    IInspectable Strong(winrt::weak_ref<T> const& ref)
    {
        if (auto value = ref.get()) return value;
        return nullptr;
    }

    winrt::hstring TypeOf(muxi::Pointer const& pointer)
    {
        switch (pointer.PointerDeviceType())
        {
        case winrt::Microsoft::UI::Input::PointerDeviceType::Touch: return L"touch";
        case winrt::Microsoft::UI::Input::PointerDeviceType::Pen: return L"pen";
        default: return L"mouse";
        }
    }

    int32_t ButtonsOf(winrt::Microsoft::UI::Input::PointerPointProperties const& p)
    {
        return (p.IsLeftButtonPressed() ? 1 : 0) | (p.IsRightButtonPressed() ? 2 : 0) | (p.IsMiddleButtonPressed() ? 4 : 0) |
            (p.IsXButton1Pressed() ? 8 : 0) | (p.IsXButton2Pressed() ? 16 : 0);
    }

    int32_t ButtonChanged(winrt::Microsoft::UI::Input::PointerUpdateKind kind)
    {
        using K = winrt::Microsoft::UI::Input::PointerUpdateKind;
        switch (kind)
        {
        case K::LeftButtonPressed: case K::LeftButtonReleased: return 0;
        case K::MiddleButtonPressed: case K::MiddleButtonReleased: return 1;
        case K::RightButtonPressed: case K::RightButtonReleased: return 2;
        case K::XButton1Pressed: case K::XButton1Released: return 3;
        case K::XButton2Pressed: case K::XButton2Released: return 4;
        default: return -1;
        }
    }

    Sample SampleOf(muxi::PointerRoutedEventArgs const& e)
    {
        Sample s;
        auto point = e.GetCurrentPoint(nullptr);
        s.x = point.Position().X;
        s.y = point.Position().Y;
        auto props = point.Properties();
        s.buttons = ButtonsOf(props);
        s.button = ButtonChanged(props.PointerUpdateKind());
        const bool touch = e.Pointer().PointerDeviceType() == winrt::Microsoft::UI::Input::PointerDeviceType::Touch;
        if (touch)
        {
            s.buttons = e.Pointer().IsInContact() ? 1 : 0;
            auto rect = props.ContactRect();
            s.width = (std::max)(1.0, static_cast<double>(rect.Width));
            s.height = (std::max)(1.0, static_cast<double>(rect.Height));
        }
        s.pressure = s.buttons == 0 ? 0.0 : static_cast<double>(props.Pressure());
        s.tiltX = props.XTilt();
        s.tiltY = props.YTilt();
        s.twist = props.Twist();
        const auto mods = static_cast<uint32_t>(e.KeyModifiers());
        s.ctrl = (mods & static_cast<uint32_t>(winrt::Windows::System::VirtualKeyModifiers::Control)) != 0;
        s.alt = (mods & static_cast<uint32_t>(winrt::Windows::System::VirtualKeyModifiers::Menu)) != 0;
        s.shift = (mods & static_cast<uint32_t>(winrt::Windows::System::VirtualKeyModifiers::Shift)) != 0;
        s.meta = (mods & static_cast<uint32_t>(winrt::Windows::System::VirtualKeyModifiers::Windows)) != 0;
        return s;
    }

    mux::UIElement ContentOf(IInspectable const& source)
    {
        auto element = source.try_as<mux::UIElement>();
        auto root = element ? element.XamlRoot() : nullptr;
        return root ? root.Content() : nullptr;
    }

    // The element under the pointer: the innermost Mason element (or inline element) at it, with
    // clipped-out and pointer-events: none elements leaving it to what's beneath.
    IInspectable PointerTarget(muxi::PointerRoutedEventArgs const& e)
    {
        IInspectable origin{ nullptr };
        for (auto cur = e.OriginalSource(); cur; cur = ParentOf(cur))
        {
            if (auto text = cur.try_as<nsm::Text>())
            {
                auto* impl = winrt::get_self<nsm::implementation::Text>(text);
                if (auto hit = impl->InlineElementAt(e.GetCurrentPoint(text).Position())) { origin = hit; break; }
                if (!impl->IsAnonymous()) { origin = text; break; }
            }
            else if (cur.try_as<nsm::IMasonElement>())
            {
                origin = cur;
                break;
            }
        }
        if (!origin) return nullptr;
        const auto point = e.GetCurrentPoint(nullptr).Position();
        auto element = origin.try_as<mux::UIElement>();
        if (IsNone(origin) || (element && ClippedOut(element, point)))
        {
            auto content = ContentOf(element ? IInspectable(element) : e.OriginalSource());
            return content ? ElementAtHost(content, point) : nullptr;
        }
        return origin;
    }

    void SetOffset(nsm::implementation::Event& event, IInspectable const& target)
    {
        IInspectable cur = target;
        while (cur && !cur.try_as<mux::UIElement>()) cur = ParentOf(cur);
        auto element = cur ? cur.try_as<mux::UIElement>() : nullptr;
        if (!element || !element.XamlRoot()) return;
        try
        {
            const auto local = element.TransformToVisual(nullptr).Inverse().TransformPoint({ static_cast<float>(event.clientX), static_cast<float>(event.clientY) });
            event.offsetX = local.X;
            event.offsetY = local.Y;
        }
        catch (...)
        {
        }
    }

    winrt::com_ptr<nsm::implementation::Event> Build(PointerState& p, winrt::hstring const& type, Sample const& s)
    {
        const bool cancelable = type == L"pointerdown" || type == L"pointermove" || type == L"pointerup" || type == L"pointerover" || type == L"pointerout";
        auto event = winrt::make_self<nsm::implementation::Event>(type, cancelable);
        event->pointerId = p.id;
        event->pointerType = p.type;
        event->isPrimary = p.primary;
        event->clientX = s.x;
        event->clientY = s.y;
        event->button = s.button;
        event->buttons = s.buttons;
        event->pressure = s.pressure;
        event->width = s.width;
        event->height = s.height;
        event->tiltX = s.tiltX;
        event->tiltY = s.tiltY;
        event->twist = s.twist;
        event->ctrlKey = s.ctrl;
        event->shiftKey = s.shift;
        event->altKey = s.alt;
        event->metaKey = s.meta;
        if (!std::isnan(p.clientX))
        {
            event->movementX = s.x - p.clientX;
            event->movementY = s.y - p.clientY;
        }
        p.clientX = s.x;
        p.clientY = s.y;
        p.buttons = s.buttons;
        return event;
    }

    winrt::com_ptr<nsm::implementation::Event> Copy(winrt::hstring const& type, nsm::implementation::Event const& from, IInspectable const& related)
    {
        const bool cancelable = type == L"pointerover" || type == L"pointerout";
        auto event = winrt::make_self<nsm::implementation::Event>(type, cancelable);
        event->pointerId = from.pointerId;
        event->pointerType = from.pointerType;
        event->isPrimary = from.isPrimary;
        event->clientX = from.clientX;
        event->clientY = from.clientY;
        event->button = from.button;
        event->buttons = from.buttons;
        event->pressure = from.pressure;
        event->width = from.width;
        event->height = from.height;
        event->ctrlKey = from.ctrlKey;
        event->shiftKey = from.shiftKey;
        event->altKey = from.altKey;
        event->metaKey = from.metaKey;
        event->relatedTarget = related;
        return event;
    }

    void FirePointer(IInspectable const& target, winrt::com_ptr<nsm::implementation::Event> const& event, bool bubbles = true)
    {
        if (!target) return;
        SetOffset(*event, target);
        Fire(target, event, bubbles);
    }

    std::vector<IInspectable> Chain(IInspectable const& element)
    {
        std::vector<IInspectable> out;
        for (auto cur = element; cur; cur = ParentOf(cur))
        {
            if (cur.try_as<nsm::IMasonElement>() || cur.try_as<nsm::Text>()) out.push_back(cur);
        }
        return out;
    }

    void Retarget(PointerState& p, IInspectable const& target, nsm::implementation::Event const& from)
    {
        auto old = Strong(p.target);
        if (old == target) return;
        p.target = target ? winrt::make_weak(target) : winrt::weak_ref<IInspectable>{};
        const auto oldChain = Chain(old);
        const auto newChain = Chain(target);
        auto contains = [](std::vector<IInspectable> const& list, IInspectable const& item) { return std::find(list.begin(), list.end(), item) != list.end(); };
        if (old)
        {
            FirePointer(old, Copy(L"pointerout", from, target));
            for (auto const& el : oldChain)
            {
                if (contains(newChain, el)) break;
                if (mason_events::HasListener(el, L"pointerleave")) FirePointer(el, Copy(L"pointerleave", from, target), false);
            }
        }
        if (target)
        {
            FirePointer(target, Copy(L"pointerover", from, old));
            for (auto it = newChain.rbegin(); it != newChain.rend(); ++it)
            {
                if (contains(oldChain, *it) || !mason_events::HasListener(*it, L"pointerenter")) continue;
                FirePointer(*it, Copy(L"pointerenter", from, old), false);
            }
        }
    }

    void ProcessPending(PointerState& p, nsm::implementation::Event const& from)
    {
        if (!p.hasPending) return;
        p.hasPending = false;
        auto next = Strong(p.pending);
        auto previous = Strong(p.capture);
        if (next == previous) return;
        p.capture = next ? winrt::make_weak(next) : winrt::weak_ref<IInspectable>{};
        if (previous) FirePointer(previous, Copy(L"lostpointercapture", from, nullptr));
        if (next)
        {
            FirePointer(next, Copy(L"gotpointercapture", from, nullptr));
            Retarget(p, next, from);
        }
    }

    void Release(PointerState& p, nsm::implementation::Event const& from)
    {
        p.pending = {};
        p.hasPending = false;
        if (auto xaml = p.xamlCapture.get(); xaml && p.pointer)
        {
            try { xaml.ReleasePointerCapture(p.pointer); } catch (...) {}
        }
        p.xamlCapture = {};
        auto previous = Strong(p.capture);
        p.capture = {};
        if (previous) FirePointer(previous, Copy(L"lostpointercapture", from, nullptr));
    }

    IInspectable Current(PointerState const& p)
    {
        if (auto capture = Strong(p.capture)) return capture;
        return Strong(p.target);
    }

    void CancelPointer(PointerState& p)
    {
        if (p.cancelled) return;
        p.cancelled = true;
        Sample s;
        s.x = p.clientX;
        s.y = p.clientY;
        auto event = Build(p, L"pointercancel", s);
        FirePointer(Current(p), event);
        Release(p, *event);
        Retarget(p, nullptr, *event);
    }

    // The same routed event reaches every hooked element on its way up, then the window content.
    thread_local muxi::PointerRoutedEventArgs t_pointerRouting{ nullptr };

    bool FirstSight(muxi::PointerRoutedEventArgs const& e)
    {
        if (t_pointerRouting == e) return false;
        t_pointerRouting = e;
        if (auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread())
        {
            queue.TryEnqueue([] { t_pointerRouting = nullptr; });
        }
        return true;
    }

    void HookContent(IInspectable const& source);

    void OnPointerPressed(IInspectable const& sender, muxi::PointerRoutedEventArgs const& e)
    {
        HookContent(sender);
        if (!FirstSight(e)) return;
        const auto id = static_cast<int32_t>(e.Pointer().PointerId());
        const auto type = TypeOf(e.Pointer());
        auto& pointers = Pointers();
        auto it = pointers.find(id);
        const int32_t before = it != pointers.end() ? it->second.buttons : 0;
        if (it == pointers.end() || (type != L"mouse" && before == 0))
        {
            bool primary = type == L"mouse";
            if (!primary)
            {
                primary = true;
                for (auto const& [_, other] : pointers) if (other.type == type && other.id != id) primary = false;
            }
            PointerState state;
            state.id = id;
            state.type = type;
            state.primary = primary;
            it = pointers.insert_or_assign(id, std::move(state)).first;
        }
        auto& p = it->second;
        p.pointer = e.Pointer();
        p.cancelled = false;
        auto s = SampleOf(e);
        auto target = PointerTarget(e);
        if (before != 0)
        {
            // Another button on a pointer already down: a pointermove, as in the DOM.
            auto event = Build(p, L"pointermove", s);
            ProcessPending(p, *event);
            FirePointer(Current(p), event);
            return;
        }
        auto event = Build(p, L"pointerdown", s);
        Retarget(p, target, *event);
        // Touch and pen are captured to their target, as if setPointerCapture ran before pointerdown.
        if (type != L"mouse" && target)
        {
            p.pending = winrt::make_weak(target);
            p.hasPending = true;
        }
        FirePointer(target, event);
        if (event->propagationStopped) e.Handled(true);
    }

    void OnPointerMoved(IInspectable const& sender, muxi::PointerRoutedEventArgs const& e)
    {
        HookContent(sender);
        if (!FirstSight(e)) return;
        const auto id = static_cast<int32_t>(e.Pointer().PointerId());
        auto& pointers = Pointers();
        auto it = pointers.find(id);
        if (it == pointers.end())
        {
            // Only a hovering mouse or pen starts a pointer by moving.
            if (e.Pointer().IsInContact() || e.Pointer().PointerDeviceType() == winrt::Microsoft::UI::Input::PointerDeviceType::Touch) return;
            PointerState state;
            state.id = id;
            state.type = TypeOf(e.Pointer());
            state.primary = true;
            it = pointers.insert_or_assign(id, std::move(state)).first;
        }
        auto& p = it->second;
        if (p.cancelled) return;
        auto s = SampleOf(e);
        if (s.x == p.clientX && s.y == p.clientY) return;
        auto event = Build(p, L"pointermove", s);
        ProcessPending(p, *event);
        if (!Strong(p.capture) && p.type == L"mouse") Retarget(p, PointerTarget(e), *event);
        FirePointer(Current(p), event);
    }

    void OnPointerReleased(IInspectable const&, muxi::PointerRoutedEventArgs const& e)
    {
        if (!FirstSight(e)) return;
        const auto id = static_cast<int32_t>(e.Pointer().PointerId());
        auto& pointers = Pointers();
        auto it = pointers.find(id);
        if (it == pointers.end()) return;
        auto& p = it->second;
        auto s = SampleOf(e);
        if (p.cancelled)
        {
            if (p.type == L"mouse") p.cancelled = false;
            else pointers.erase(it);
            return;
        }
        if (s.buttons != 0 && p.type != L"touch")
        {
            auto event = Build(p, L"pointermove", s);
            FirePointer(Current(p), event);
            return;
        }
        auto event = Build(p, L"pointerup", s);
        ProcessPending(p, *event);
        if (!Strong(p.capture) && p.type == L"mouse") Retarget(p, PointerTarget(e), *event);
        FirePointer(Current(p), event);
        Release(p, *event);
        if (p.type != L"mouse")
        {
            Retarget(p, nullptr, *event);
            pointers.erase(id);
        }
    }

    void OnPointerCanceled(IInspectable const&, muxi::PointerRoutedEventArgs const& e)
    {
        if (!FirstSight(e)) return;
        const auto id = static_cast<int32_t>(e.Pointer().PointerId());
        auto& pointers = Pointers();
        auto it = pointers.find(id);
        if (it == pointers.end() || it->second.buttons == 0) return;
        CancelPointer(it->second);
        if (it->second.type != L"mouse") pointers.erase(it);
        else it->second.cancelled = false;
    }

    // A capture lost while the pointer is still down: a ScrollViewer's manipulation took it over.
    // A control releasing its own capture as the pointer lifts is not a cancel.
    void OnPointerCaptureLost(IInspectable const& sender, muxi::PointerRoutedEventArgs const& e)
    {
        auto pointer = e.Pointer();
        const bool down = pointer.PointerDeviceType() == winrt::Microsoft::UI::Input::PointerDeviceType::Mouse
            ? ButtonsOf(e.GetCurrentPoint(nullptr).Properties()) != 0
            : pointer.IsInContact();
        if (down) OnPointerCanceled(sender, e);
    }

    void OnPointerExited(IInspectable const& sender, muxi::PointerRoutedEventArgs const& e)
    {
        // Only the window content's exit means the pointer left everything.
        if (sender != IInspectable(ContentOf(sender)) || !FirstSight(e)) return;
        const auto id = static_cast<int32_t>(e.Pointer().PointerId());
        auto& pointers = Pointers();
        auto it = pointers.find(id);
        if (it == pointers.end() || it->second.buttons != 0) return;
        auto event = Build(it->second, L"pointerout", SampleOf(e));
        Retarget(it->second, nullptr, *event);
        if (it->second.type != L"touch") pointers.erase(it);
    }

    std::unordered_map<void*, winrt::weak_ref<mux::UIElement>>& HookedContents()
    {
        static auto* hooked = new std::unordered_map<void*, winrt::weak_ref<mux::UIElement>>();
        return *hooked;
    }

    // Follows pointers anywhere in the window: routed pointer events all bubble up to its content.
    void HookContent(IInspectable const& source)
    {
        auto content = ContentOf(source);
        if (!content) return;
        auto& hooked = HookedContents();
        auto key = KeyOf(content);
        if (auto it = hooked.find(key); it != hooked.end() && it->second.get()) return;
        hooked[key] = winrt::make_weak(content);
        content.AddHandler(mux::UIElement::PointerMovedEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerMoved)), true);
        content.AddHandler(mux::UIElement::PointerReleasedEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerReleased)), true);
        content.AddHandler(mux::UIElement::PointerCanceledEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerCanceled)), true);
        content.AddHandler(mux::UIElement::PointerCaptureLostEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerCaptureLost)), true);
        content.AddHandler(mux::UIElement::PointerExitedEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerExited)), true);
    }

    bool IsPointerType(winrt::hstring const& type)
    {
        static const std::array<std::wstring_view, 10> types{ L"pointerdown", L"pointermove", L"pointerup", L"pointercancel", L"pointerover",
            L"pointerout", L"pointerenter", L"pointerleave", L"gotpointercapture", L"lostpointercapture" };
        return std::find(types.begin(), types.end(), std::wstring_view(type)) != types.end();
    }

    bool HasAutoDescendant(mux::DependencyObject const& element)
    {
        const int32_t count = mux::Media::VisualTreeHelper::GetChildrenCount(element);
        for (int32_t i = 0; i < count; ++i)
        {
            auto child = mux::Media::VisualTreeHelper::GetChild(element, i);
            const bool mason = child.try_as<nsm::IMasonElement>() || child.try_as<nsm::Text>();
            if (mason && !IsNone(child)) return true;
            if (HasAutoDescendant(child)) return true;
        }
        return false;
    }

    // A none element with no auto descendant is left out of XAML hit testing, so input really
    // reaches what's beneath; with one, Mason retargets its own events instead.
    void RefreshHitTest(mux::UIElement const& element)
    {
        auto& off = HitTestOff();
        const auto key = KeyOf(element);
        const bool disable = IsNone(element) && !HasAutoDescendant(element);
        if (disable)
        {
            if (element.IsHitTestVisible())
            {
                element.IsHitTestVisible(false);
                off[key] = winrt::make_weak(element);
            }
        }
        else if (auto it = off.find(key); it != off.end())
        {
            off.erase(it);
            element.IsHitTestVisible(true);
        }
    }

    // A panel only hit-tests its own area with a brush. Tappable elements get a transparent one;
    // a none element gets none, so input there reaches native controls beneath while its
    // children stay tappable. A painted background still covers them.
    void SyncHitBrush(mux::UIElement const& element)
    {
        auto panel = element.try_as<muxc::Panel>();
        if (!panel) return;
        auto current = panel.Background();
        if (IsNone(element))
        {
            auto solid = current ? current.try_as<mux::Media::SolidColorBrush>() : nullptr;
            if (solid && solid.Color().A == 0) panel.Background(nullptr);
            return;
        }
        if (current) return;
        auto* entry = Find(element);
        if ((entry && (entry->hooked || entry->pointerHooked)) || element.try_as<nsm::Text>())
        {
            panel.Background(mux::Media::SolidColorBrush(winrt::Windows::UI::Color{ 0, 0, 0, 0 }));
        }
    }

}

namespace mason_events
{
    using winrt::Windows::Foundation::IInspectable;

    int64_t Add(mux::UIElement const& element, winrt::hstring const& type, nsm::EventListener const& listener)
    {
        if (!element || !listener) return 0;
        auto& entry = EnsureEntry(element);
        const int64_t id = g_nextId++;
        entry.listeners.push_back({ id, type, listener });
        if (type == L"click") HookTaps(element);
        else if (type == L"scroll" || type == L"scrollend") mason_scroll::Listen(element);
        else if (IsPointerType(type)) HookPointers(element);
        return id;
    }

    void Remove(mux::UIElement const& element, winrt::hstring const& type, int64_t id)
    {
        if (!element) return;
        if (auto* entry = Find(element))
        {
            std::erase_if(entry->listeners, [&](Listener const& l) { return l.id == id && l.type == type; });
        }
    }

    bool HasListener(IInspectable const& element, std::wstring_view type)
    {
        auto* entry = element ? Find(element) : nullptr;
        if (!entry) return false;
        for (auto const& l : entry->listeners)
        {
            if (l.type == type) return true;
        }
        return false;
    }

    IInspectable ElementAt(mux::UIElement const& element, float x, float y)
    {
        if (!element) return nullptr;
        return ElementAtHost(element, element.TransformToVisual(nullptr).TransformPoint({ x, y }));
    }

    void HookTaps(mux::UIElement const& element)
    {
        auto& entry = EnsureEntry(element);
        if (entry.hooked) return;
        entry.hooked = true;
        element.AddHandler(mux::UIElement::TappedEvent(), winrt::box_value(muxi::TappedEventHandler(&OnTapped)), true);
        SyncHitBrush(element);
    }

    void HookPointers(mux::UIElement const& element)
    {
        auto& entry = EnsureEntry(element);
        if (entry.pointerHooked) return;
        entry.pointerHooked = true;
        element.AddHandler(mux::UIElement::PointerPressedEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerPressed)), true);
        // Hovering raises pointer events too; the first move hooks the window content.
        element.AddHandler(mux::UIElement::PointerMovedEvent(), winrt::box_value(muxi::PointerEventHandler(&OnPointerMoved)), true);
        SyncHitBrush(element);
    }

    void SetPointerEvents(mux::UIElement const& element, int32_t value)
    {
        if (!element) return;
        auto& set = PointerNone();
        if (value == 1) set[KeyOf(element)] = winrt::make_weak(IInspectable(element));
        else set.erase(KeyOf(element));
        SyncHitBrush(element);
        RefreshHitTest(element);
        // An ancestor set to none may now have (or have lost) an auto descendant.
        if (auto parent = mux::Media::VisualTreeHelper::GetParent(element)) SubtreeChanged(parent);
    }

    void SubtreeChanged(mux::DependencyObject const& parent)
    {
        if (PointerNone().empty()) return;
        for (auto cur = parent; cur; cur = mux::Media::VisualTreeHelper::GetParent(cur))
        {
            if (auto ui = cur.try_as<mux::UIElement>(); ui && IsNone(ui)) RefreshHitTest(ui);
        }
    }

    bool IsPointerNone(IInspectable const& element)
    {
        return IsNone(element);
    }

    bool SetPointerCapture(mux::UIElement const& element, int32_t pointerId)
    {
        auto& pointers = Pointers();
        auto it = pointers.find(pointerId);
        if (!element || it == pointers.end() || (it->second.type == L"mouse" && it->second.buttons == 0)) return false;
        auto& p = it->second;
        p.pending = winrt::make_weak(IInspectable(element));
        p.hasPending = true;
        // XAML routes the pointer to it too, so it's followed outside the window.
        if (p.pointer)
        {
            try
            {
                if (element.CapturePointer(p.pointer)) p.xamlCapture = winrt::make_weak(element);
            }
            catch (...)
            {
            }
        }
        return true;
    }

    void ReleasePointerCapture(mux::UIElement const& element, int32_t pointerId)
    {
        if (!HasPointerCapture(element, pointerId)) return;
        auto& p = Pointers()[pointerId];
        p.pending = {};
        p.hasPending = true;
        if (auto xaml = p.xamlCapture.get(); xaml && p.pointer)
        {
            try { xaml.ReleasePointerCapture(p.pointer); } catch (...) {}
            p.xamlCapture = {};
        }
    }

    bool HasPointerCapture(mux::UIElement const& element, int32_t pointerId)
    {
        auto& pointers = Pointers();
        auto it = pointers.find(pointerId);
        if (!element || it == pointers.end()) return false;
        auto current = it->second.hasPending ? Strong(it->second.pending) : Strong(it->second.capture);
        return current == IInspectable(element);
    }

    bool Dispatch(IInspectable const& target, winrt::hstring const& type, bool bubbles, winrt::hstring const& data)
    {
        if (!target) return true;
        return !Fire(target, type, bubbles, data)->defaultPrevented;
    }

    bool DispatchEvent(IInspectable const& target, winrt::com_ptr<nsm::implementation::Event> const& event, bool bubbles)
    {
        if (!target || !event) return true;
        Fire(target, event, bubbles);
        return !event->defaultPrevented;
    }
}
