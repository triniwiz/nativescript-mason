#pragma once

// text-spacing-trim: full-width punctuation next to other punctuation gives up its blank half
// (CSS Text 4's trim-adjacent, part of `normal`). A mark's ink sits in one half of its em: a
// closing mark's at its start, an opening mark's at its end. So the blank half goes by negative
// character spacing, which needs no font support, and an upright cell in vertical text is halved
// instead (see VerticalText.h). The same classes and rules are in iOS SpacingTrim.swift and
// Android SpacingTrim.kt. Included by DWriteText.h after Paragraph and Span.

namespace mason_dwrite
{
    inline constexpr uint8_t kPunctuationOpening = 1;
    inline constexpr uint8_t kPunctuationClosing = 2;
    inline constexpr uint8_t kPunctuationMiddle = 3;

    // The full-width punctuation class of a UTF-16 unit, or 0.
    inline uint8_t FullWidthPunctuation(wchar_t c)
    {
        switch (c)
        {
        case 0x3008: case 0x300A: case 0x300C: case 0x300E: case 0x3010: case 0x3014: case 0x3016: case 0x3018:
        case 0x301A: case 0x301D: case 0xFF08: case 0xFF3B: case 0xFF5B: case 0xFF5F:
            return kPunctuationOpening;
        case 0x3001: case 0x3002: case 0x3009: case 0x300B: case 0x300D: case 0x300F: case 0x3011: case 0x3015:
        case 0x3017: case 0x3019: case 0x301B: case 0x301E: case 0x301F: case 0xFF09: case 0xFF0C: case 0xFF0E:
        case 0xFF3D: case 0xFF5D: case 0xFF60:
            return kPunctuationClosing;
        case 0x30FB: case 0xFF1A: case 0xFF1B:
            return kPunctuationMiddle;
        default:
            return 0;
        }
    }

    // Vertical text that may hold upright glyphs (or combined runs), whose marks they take first;
    // other text is trimmed as it's built.
    inline bool TrimsAfterUprights(Paragraph const& p)
    {
        return p.upright != 0 || p.combine != 0
            || std::any_of(p.spans.begin(), p.spans.end(), [](Span const& s)
                {
                    return (s.upright != 0 && s.upright != kParagraphUpright) || (s.combine != 0 && s.combine != kParagraphUpright);
                });
    }

    // The marks trim-adjacent sets half-width, by position: kPunctuationOpening drops a mark's
    // start half (an opening mark after an opening, closing or middle mark), kPunctuationClosing
    // its end half (a closing mark before a closing or middle mark). Spans with
    // `text-spacing-trim: space-all` (1) are left alone. Empty when nothing is trimmed.
    inline std::vector<uint8_t> HalfWidthMarks(Paragraph const& p)
    {
        std::vector<uint8_t> marks;
        const size_t len = p.text.size();
        for (size_t i = 0; i < len; ++i)
        {
            const uint8_t kind = FullWidthPunctuation(p.text[i]);
            if (kind != kPunctuationOpening && kind != kPunctuationClosing) continue;
            bool trimmed = false;
            if (kind == kPunctuationOpening) trimmed = i > 0 && FullWidthPunctuation(p.text[i - 1]) != 0;
            else if (i + 1 < len)
            {
                const uint8_t next = FullWidthPunctuation(p.text[i + 1]);
                trimmed = next == kPunctuationClosing || next == kPunctuationMiddle;
            }
            if (!trimmed) continue;
            uint8_t trim = p.spacingTrim;
            for (auto const& s : p.spans)
            {
                if (i >= s.start && i < s.start + s.length && s.spacingTrim != kParagraphUpright) trim = s.spacingTrim;
            }
            if (trim == 1) continue;
            if (marks.empty()) marks.assign(len, 0);
            marks[i] = kind;
        }
        return marks;
    }

    // Drops each marked mark's blank half by character spacing: trailing space after a closing
    // mark, leading space before an opening one. `marks` left by ApplyUprights.
    inline void ApplySpacingTrim(IDWriteTextLayout* layout, Paragraph const& p, std::vector<uint8_t> const& marks)
    {
        if (marks.empty()) return;
        winrt::com_ptr<IDWriteTextLayout1> spacing;
        if (FAILED(layout->QueryInterface(IID_PPV_ARGS(spacing.put())))) return;
        for (size_t i = 0; i < marks.size(); ++i)
        {
            if (!marks[i]) continue;
            const auto position = static_cast<UINT32>(i);
            FLOAT size = 0.0f, leading = 0.0f, trailing = 0.0f, minimum = 0.0f;
            if (FAILED(layout->GetFontSize(position, &size)) || FAILED(spacing->GetCharacterSpacing(position, &leading, &trailing, &minimum))) continue;
            if (marks[i] == kPunctuationOpening) leading -= size / 2.0f;
            else trailing -= size / 2.0f;
            spacing->SetCharacterSpacing(leading, trailing, minimum, DWRITE_TEXT_RANGE{ position, 1 });
        }
    }
}
