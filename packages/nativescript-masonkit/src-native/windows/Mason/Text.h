#pragma once
#include "Text.g.h"
#include "VisualState.h"
#include "DWriteText.h"
#include <winrt/Windows.UI.Text.h>
#include <limits>
#include <memory>
#include <vector>

namespace mason_atlas
{
    struct Sprite;
}

namespace winrt::NativeScript::Mason::implementation
{
    // A built run in the formatting the TextBlock gives it, so min-content is found without reading
    // the runs back from XAML.
    struct MinContentRun
    {
        winrt::hstring text;
        // Keys the word widths: family, size, weight, style and spacing.
        std::wstring format;
        winrt::hstring family;
        double fontSize{ 14.0 };
        uint16_t fontWeight{ 400 };
        uint8_t fontStyle{ 0 };
        int32_t characterSpacing{ 0 };
        bool isBreak{ false };
    };

    struct Text : TextT<Text>
    {
        Text();
        ~Text();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&);

        static bool DirectWrite();
        static void DirectWrite(bool value);

        hstring Content() const;
        void Content(hstring const& value);
        double FontSize() const;
        void FontSize(double value);
        void SetFontFamily(hstring const& families);

        void SetRun(winrt::NativeScript::Mason::TextNode const& run, int32_t index);
        void RemoveRun(winrt::NativeScript::Mason::TextNode const& run);
        void ClearRuns();
        void SetInlineText(winrt::NativeScript::Mason::Text const& child, int32_t index);
        void RemoveInlineText(winrt::NativeScript::Mason::Text const& child);

        void OnRunChanged();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);
        winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationPeer OnCreateAutomationPeer();

        // The text a screen reader reads when this Text draws its own glyphs.
        winrt::hstring AccessibleText() const;

    private:
        // Formatting after inheritance; a nested element resolves its own against its parent's.
        struct Resolved
        {
            uint32_t color{ 0xFF000000 };
            double fontSize{ 0.0 };
            int32_t fontWeight{ 0 };
            uint8_t fontStyle{ 0 };
            double letterSpacing{ 0.0 };
            winrt::Windows::UI::Text::TextDecorations decorations{ winrt::Windows::UI::Text::TextDecorations::None };
            winrt::hstring family{};
            bool operator==(Resolved const&) const = default;
        };

        struct BuiltRun
        {
            winrt::hstring text;
            Resolved format;
            bool isBreak{ false };
            bool operator==(BuiltRun const&) const = default;
        };

        // One of the two is set.
        struct Entry
        {
            winrt::NativeScript::Mason::TextNode run{ nullptr };
            winrt::NativeScript::Mason::Text text{ nullptr };
        };

        Resolved Resolve(Resolved parent) const;
        void AppendRuns(Resolved const& format, std::vector<BuiltRun>& out) const;
        void Detach(Entry const& entry);
        int32_t ClampIndex(int32_t index) const;

        void ApplyStyleFromBuffer();
        // False, with nothing touched, when the Runs would come out unchanged.
        bool RebuildInlines();
        void QueueRebuild();
        void RequestRebuild();
        void FlushRebuild();
        void InvalidateText();
        void InvalidateLayoutRootFromHere();

        // TextBlock layouts cost far more than the lookups, and Taffy asks one leaf for several widths
        // per pass, so results are kept until the text or its formatting changes.
        struct MeasureCache
        {
            bool minValid{ false };
            float minWidth{ 0.0f };
            bool maxValid{ false };
            winrt::Windows::Foundation::Size max{ 0.0f, 0.0f };
            int8_t breaks{ -1 }; // -1 unknown, 0 no break opportunity, 1 has one
            struct Entry { float width; winrt::Windows::Foundation::Size size; };
            std::array<Entry, 4> entries{};
            uint8_t count{ 0 };
            uint8_t next{ 0 };
            bool queued{ false };
            winrt::weak_ref<winrt::NativeScript::Mason::Node> node;
            // Width the TextBlock was last laid out at (infinity for max-content), and whether its
            // lines start at the left edge, so a max-content layout can stand for any wider width.
            float laidOutWidth{ -1.0f };
            bool startAligned{ true };
            // The TextBlock's TextWrapping, which follows the width it's laid out at.
            bool wrap{ false };
            std::vector<MinContentRun> runs;

            // DirectWrite: the paragraph, and its layout built on first use. The version changes with
            // the paragraph so a drawing knows it's stale.
            mason_dwrite::Paragraph paragraph;
            winrt::com_ptr<IDWriteTextLayout> layout;
            uint64_t version{ 0 };

            IDWriteTextLayout* Layout()
            {
                if (!layout) layout = mason_dwrite::Build(paragraph);
                return layout.get();
            }

            bool SingleLineFits(float width) const
            {
                return maxValid && startAligned && laidOutWidth == std::numeric_limits<float>::infinity() && width >= max.Width;
            }

            void Reset() { minValid = false; maxValid = false; breaks = -1; count = 0; next = 0; laidOutWidth = -1.0f; }
        };

        // Lays the TextBlock out for a line width, infinity for max-content.
        static void LayOut(winrt::Microsoft::UI::Xaml::Controls::TextBlock const& block, MeasureCache& cache, float width);
        static void SetWrap(winrt::Microsoft::UI::Xaml::Controls::TextBlock const& block, MeasureCache& cache, bool wrap);
        void StoreMinContentRuns(std::vector<BuiltRun> const& runs);

        void InitTextBlock();
        void InitDirect();
        void BuildParagraph(Resolved const& container, std::vector<BuiltRun> const& runs);
        void ArrangeDirect(winrt::Windows::Foundation::Size const& finalSize);
        void HideSprite();

        std::vector<BuiltRun> m_builtRuns;
        bool m_direct{ false };
        // Paragraph formatting changed without the runs changing.
        bool m_paragraphDirty{ false };
        std::unique_ptr<mason_atlas::Sprite> m_sprite;
        bool m_spriteVisible{ false };
        winrt::Windows::Foundation::Numerics::float3 m_spriteOffset{ -1.0f, -1.0f, 0.0f };
        winrt::Windows::Foundation::Numerics::float2 m_spriteSize{ -1.0f, -1.0f };
        // What the sprite was last queued with, so an unchanged text isn't drawn again.
        struct Drawn
        {
            uint64_t version{ 0 };
            float maxWidth{ 0.0f };
            bool wrap{ false };
            float scale{ 0.0f };
            float originX{ 0.0f };
            float originY{ 0.0f };
            int width{ 0 };
            int height{ 0 };
            bool operator==(Drawn const&) const = default;
        };
        Drawn m_drawn;
        bool m_drawnValid{ false };
        // Shared with the measure callback, which only holds weak references.
        std::shared_ptr<MeasureCache> m_measureCache{ std::make_shared<MeasureCache>() };
        bool m_builtValid{ false };
        bool m_inlinesDirty{ false };
        uint32_t m_textForeground{ 0xFF000000 };
        Text* m_inlineOwner{ nullptr };

        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::TextBlock m_text{ nullptr };
        winrt::NativeScript::Mason::TextNode m_contentNode{ nullptr };
        std::vector<Entry> m_runs;
        
        double m_fontSize{ 0.0 };
        uint32_t m_color{ 0xFF000000 };
        bool m_hasColor{ false };
        int32_t m_fontWeight{ 0 };
        uint8_t m_fontStyle{ 0 };
        bool m_hasFontStyle{ false };
        double m_lineHeightMultiplier{ 0.0 };
        double m_lineHeightPx{ 0.0 };
        // TEXT_ALIGN byte: 1 left, 2 right, 3 center, 4 justify, 5 start, 6 end.
        uint8_t m_textAlign{ 0 };
        double m_letterSpacingPx{ 0.0 };
        winrt::Windows::UI::Text::TextDecorations m_decorations{ winrt::Windows::UI::Text::TextDecorations::None };
        winrt::hstring m_fontFamily{};
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Text : TextT<Text, implementation::Text>
    {
    };
}
