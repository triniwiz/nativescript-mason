#pragma once
#include "Button.g.h"
#include "VisualState.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Button : ButtonT<Button>
    {
        Button();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&)
        {
            m_visual.styleDirty = true;
            if (m_node) m_node.MarkDirty();
            InvalidateMeasure();
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
