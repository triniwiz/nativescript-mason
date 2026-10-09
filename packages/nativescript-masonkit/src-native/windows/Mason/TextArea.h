#pragma once
#include "TextArea.g.h"
#include "FormEvents.h"
#include "FormStyle.h"
#include "Invalidation.h"
#include "VisualState.h"
#include <memory>

namespace winrt::NativeScript::Mason::implementation
{
    struct TextArea : TextAreaT<TextArea>
    {
        TextArea();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3);
        void SetFontFamily(hstring const& families);

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

        int64_t AddEventListener(hstring const& type, winrt::NativeScript::Mason::EventListener const& listener);
        bool RemoveEventListener(hstring const& type, int64_t id);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        void SyncTextStyle(bool force);
        void SyncSize();

        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::TextBox m_box{ nullptr };
        int32_t m_rows{ 0 };
        int32_t m_cols{ 0 };
        hstring m_fontFamily;
        std::shared_ptr<mason_form::Events> m_events;
        mason_form::TextStyle m_textApplied;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct TextArea : TextAreaT<TextArea, implementation::TextArea>
    {
    };
}
