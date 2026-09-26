#pragma once
#include "Text.g.h"
#include "VisualState.h"
#include <vector>

namespace winrt::NativeScript::Mason::implementation
{
    
    struct Text : TextT<Text>
    {
        Text();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&);

        hstring Content() const;
        void Content(hstring const& value);
        double FontSize() const;
        void FontSize(double value);
        void SetFontFamily(hstring const& families);

        void SetRun(winrt::NativeScript::Mason::TextNode const& run, int32_t index);
        void RemoveRun(winrt::NativeScript::Mason::TextNode const& run);
        void ClearRuns();

        void OnRunChanged();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        struct BuiltRun
        {
            winrt::hstring text;
            uint32_t color{ 0 };
            double fontSize{ 0.0 };
            int32_t fontWeight{ 0 };
            double letterSpacing{ 0.0 };
            bool isBreak{ false };
            bool operator==(BuiltRun const&) const = default;
        };

        void ApplyStyleFromBuffer();
        // False, with nothing touched, when the Runs would come out unchanged.
        bool RebuildInlines();
        void InvalidateText();
        void InvalidateLayoutRootFromHere();

        std::vector<BuiltRun> m_builtRuns;
        winrt::hstring m_builtFamily{};
        bool m_builtValid{ false };

        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::TextBlock m_text{ nullptr };
        winrt::NativeScript::Mason::TextNode m_contentNode{ nullptr };
        std::vector<winrt::NativeScript::Mason::TextNode> m_runs;
        
        double m_fontSize{ 0.0 };
        uint32_t m_color{ 0xFF000000 };
        bool m_hasColor{ false };
        int32_t m_fontWeight{ 0 };
        double m_lineHeightMultiplier{ 0.0 };
        double m_letterSpacingPx{ 0.0 };
        winrt::hstring m_fontFamily{};
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Text : TextT<Text, implementation::Text>
    {
    };
}
