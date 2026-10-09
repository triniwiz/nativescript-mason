#pragma once
#include <string_view>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/NativeScript.Mason.h>
#include "Event.h"

namespace mason_events
{
    int64_t Add(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::hstring const& type, winrt::NativeScript::Mason::EventListener const& listener);
    void Remove(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::hstring const& type, int64_t id);
    bool HasListener(winrt::Windows::Foundation::IInspectable const& element, std::wstring_view type);
    winrt::Windows::Foundation::IInspectable ElementAt(winrt::Microsoft::UI::Xaml::UIElement const& element, float x, float y);

    void HookTaps(winrt::Microsoft::UI::Xaml::UIElement const& element);

    bool Dispatch(winrt::Windows::Foundation::IInspectable const& target, winrt::hstring const& type, bool bubbles, winrt::hstring const& data = {});
    bool DispatchEvent(winrt::Windows::Foundation::IInspectable const& target, winrt::com_ptr<winrt::NativeScript::Mason::implementation::Event> const& event, bool bubbles);
}
