#pragma once
#include "Br.g.h"
#include "Invalidation.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Br : BrT<Br>
    {
        Br();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(int32_t, int32_t, int32_t, int32_t)
        {
            mason_leaf::StyleChanged(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node);
        }

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Node m_node{ nullptr };
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Br : BrT<Br, implementation::Br>
    {
    };
}
