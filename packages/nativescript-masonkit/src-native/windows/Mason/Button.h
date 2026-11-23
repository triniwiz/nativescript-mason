#pragma once
#include "Button.g.h"
#include "Invalidation.h"
#include "VisualState.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Button : ButtonT<Button>
    {
        Button();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
        {
            const auto dirty = mason_leaf::UpdatePaintStyle(m_visual.styleDirty, d0, d1, d2, d3);
            mason_leaf::StyleSynced(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, dirty);
        }

        hstring Content() const { return m_content; }
        void Content(hstring const& value);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::Button m_button{ nullptr };
        hstring m_content;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Button : ButtonT<Button, implementation::Button>
    {
    };
}
