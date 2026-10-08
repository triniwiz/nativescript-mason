#include "pch.h"
#include "Events.h"
#include "Event.h"
#include "Text.h"
#include <unordered_map>
#include <vector>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Xaml.Input.h>
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

    winrt::com_ptr<nsm::implementation::Event> Fire(IInspectable const& target, winrt::hstring const& type, bool bubbles, winrt::hstring const& data)
    {
        auto event = winrt::make_self<nsm::implementation::Event>(type, type == L"click");
        // Mason has bubbled it already; a framework re-dispatching it must not bubble it again.
        event->bubbles = false;
        event->target = target;
        event->data = data;
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
        auto event = Fire(OriginOf(e), L"click", true, {});
        if (event->propagationStopped) e.Handled(true);
    }
}

namespace mason_events
{
    int64_t Add(mux::UIElement const& element, winrt::hstring const& type, nsm::EventListener const& listener)
    {
        if (!element || !listener) return 0;
        auto& entry = EnsureEntry(element);
        const int64_t id = g_nextId++;
        entry.listeners.push_back({ id, type, listener });
        if (type == L"click") HookTaps(element);
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

    void HookTaps(mux::UIElement const& element)
    {
        auto& entry = EnsureEntry(element);
        if (entry.hooked) return;
        entry.hooked = true;
        element.AddHandler(mux::UIElement::TappedEvent(), winrt::box_value(muxi::TappedEventHandler(&OnTapped)), true);
        // A panel without a background isn't hit-testable.
        if (auto panel = element.try_as<muxc::Panel>(); panel && !panel.Background())
        {
            panel.Background(mux::Media::SolidColorBrush(winrt::Windows::UI::Color{ 0, 0, 0, 0 }));
        }
    }

    bool Dispatch(IInspectable const& target, winrt::hstring const& type, bool bubbles, winrt::hstring const& data)
    {
        if (!target) return true;
        return !Fire(target, type, bubbles, data)->defaultPrevented;
    }
}
