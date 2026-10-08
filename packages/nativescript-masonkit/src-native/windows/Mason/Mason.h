#pragma once
#include "Mason.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Mason : MasonT<Mason>
    {
        Mason();
        ~Mason();

        static winrt::NativeScript::Mason::Mason Instance();

        void Clear();
        void SetDeviceScale(float scale);
        bool Preflight();
        void Preflight(bool value);

        winrt::NativeScript::Mason::Node CreateNode(bool anonymous);
        winrt::NativeScript::Mason::Node CreateTextNode(bool anonymous);
        winrt::NativeScript::Mason::Node CreateImageNode();
        winrt::NativeScript::Mason::Node CreateButtonNode();
        winrt::NativeScript::Mason::Node CreateLineBreakNode();
        winrt::NativeScript::Mason::Node CreateListItemNode();

        void PrintTree(winrt::NativeScript::Mason::Node const& node);

        winrt::Windows::Storage::Streams::IBuffer StyleValues(winrt::NativeScript::Mason::IMasonElement const& element);
        void ReparentChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent, winrt::Microsoft::UI::Xaml::UIElement const& child, int32_t index);
        void RemoveChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent, winrt::Microsoft::UI::Xaml::UIElement const& child);
        void SetPercentWidth(winrt::Microsoft::UI::Xaml::UIElement const& element, float fraction);
        void SetPercentHeight(winrt::Microsoft::UI::Xaml::UIElement const& element, float fraction);
        int64_t AddEventListener(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& type, winrt::NativeScript::Mason::EventListener const& listener);
        void RemoveEventListener(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& type, int64_t id);

        // Not projected; used internally by the factory.
        ::CMason* Ptr() const noexcept { return m_ptr; }

    private:
        ::CMason* m_ptr{ nullptr };
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Mason : MasonT<Mason, implementation::Mason>
    {
    };
}
