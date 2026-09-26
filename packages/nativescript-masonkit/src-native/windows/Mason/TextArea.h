#pragma once
#include "TextArea.g.h"
#include "VisualState.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct TextArea : TextAreaT<TextArea>
    {
        TextArea();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&)
        {
            if (m_node) m_node.MarkDirty();
            InvalidateMeasure();
        }

        hstring Value() const;
        void Value(hstring const& value);
        hstring Placeholder() const;
        void Placeholder(hstring const& value);
        int32_t Rows() const noexcept { return m_rows; }
        void Rows(int32_t value);
        int32_t Cols() const noexcept { return m_cols; }
        void Cols(int32_t value);
        int32_t MaxLength() const;
        void MaxLength(int32_t value);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::TextBox m_box{ nullptr };
        int32_t m_rows{ 0 };
        int32_t m_cols{ 0 };
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct TextArea : TextAreaT<TextArea, implementation::TextArea>
    {
    };
}
