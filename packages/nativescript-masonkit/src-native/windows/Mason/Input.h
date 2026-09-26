#pragma once
#include "Input.g.h"
#include "VisualState.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Input : InputT<Input>
    {
        Input();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&)
        {
            m_visual.styleDirty = true;
            if (m_node) m_node.MarkDirty();
            InvalidateMeasure();
        }

        int32_t Type() const noexcept { return m_type; }
        void Type(int32_t value);
        hstring Value() const;
        void Value(hstring const& value);
        hstring Placeholder() const { return m_placeholder; }
        void Placeholder(hstring const& value);
        bool Multiple() const noexcept { return m_multiple; }
        void Multiple(bool value) { m_multiple = value; }
        hstring Accept() const { return m_accept; }
        void Accept(hstring const& value) { m_accept = value; }

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        void Rebuild();
        void ApplyValue(hstring const& value);
        void ApplyPlaceholder(hstring const& value);

        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::FrameworkElement m_control{ nullptr };
        int32_t m_type{ 0 };
        hstring m_value;
        hstring m_placeholder;
        bool m_multiple{ false };
        hstring m_accept;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Input : InputT<Input, implementation::Input>
    {
    };
}
