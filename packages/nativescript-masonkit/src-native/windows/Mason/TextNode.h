#pragma once
#include "TextNode.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Text;

    struct TextNode : TextNodeT<TextNode>
    {
        TextNode();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node ? m_node.Style() : nullptr; }

        void SyncStyle(int32_t, int32_t, int32_t, int32_t) {}

        hstring Data() const;
        void Data(hstring const& value);

        void SetColor(uint32_t argb);
        void SetFontSize(double px);
        void SetFontWeight(int32_t weight);
        void SetLineHeight(double multiplier);
        void SetLetterSpacing(double px);
        void SetBreak(bool isBreak);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const&) { return { 0, 0 }; }
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& f) { return f; }

        void SetOwner(implementation::Text* owner) { m_owner = owner; }
        winrt::hstring const& RunText() const { return m_data; }
        bool HasColor() const { return m_hasColor; }
        uint32_t RunColor() const { return m_color; }
        bool HasFontSize() const { return m_fontSize > 0.0; }
        double RunFontSize() const { return m_fontSize; }
        bool HasFontWeight() const { return m_fontWeight > 0; }
        int32_t RunFontWeight() const { return m_fontWeight; }
        double RunLetterSpacing() const { return m_letterSpacingPx; }
        bool IsBreak() const { return m_isBreak; }

    private:
        void NotifyOwner();
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        implementation::Text* m_owner{ nullptr };
        winrt::hstring m_data{};
        uint32_t m_color{ 0 };
        bool m_hasColor{ false };
        double m_fontSize{ 0.0 };
        int32_t m_fontWeight{ 0 };
        double m_lineHeightMultiplier{ 0.0 };
        double m_letterSpacingPx{ 0.0 };
        bool m_isBreak{ false };
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct TextNode : TextNodeT<TextNode, implementation::TextNode>
    {
    };
}
