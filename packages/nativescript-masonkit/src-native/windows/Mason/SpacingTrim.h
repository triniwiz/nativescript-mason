#pragma once

// text-spacing-trim: full-width punctuation gives up its blank half next to other punctuation
// (every value but space-all), at the start and end of each paragraph (trim-start and
// trim-both, trim-both) or everywhere (trim-all). A mark's ink sits in one part of its em: a
// closing mark's at its start, an opening mark's at its end, a middle mark's in its centre. So the
// blank part goes by negative character spacing, and an upright cell in vertical text is halved
// instead (see VerticalText.h). As in Chrome, only marks whose font has half-width forms (halt,
// vhal for upright glyphs) are trimmed. The same classes and rules are in
// iOS SpacingTrim.swift and Android SpacingTrim.kt, which also trim at soft line breaks.
// Included by DWriteText.h after Paragraph and Span.

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

    // text-spacing-trim as stored: 0 normal, 1 space-all, 2 space-first, 3 trim-start,
    // 4 trim-both, 5 trim-all, 6 auto (as normal).
    inline constexpr uint8_t kSpacingTrimSpaceAll = 1;
    inline constexpr uint8_t kSpacingTrimStart = 3;
    inline constexpr uint8_t kSpacingTrimBoth = 4;
    inline constexpr uint8_t kSpacingTrimAll = 5;

    inline bool IsForcedBreak(wchar_t c) { return c == L'\n' || c == L'\r' || c == 0x2028 || c == 0x2029; }

    // Whether the font's GPOS table lists the feature `tag` (halt, vhal), for any script.
    inline bool HasPositioningFeature(IDWriteFontFace* face, UINT32 tag)
    {
        thread_local std::vector<std::tuple<winrt::com_ptr<IDWriteFontFace>, UINT32, bool>> known;
        for (auto const& [font, feature, has] : known)
        {
            if (font.get() == face && feature == tag) return has;
        }
        const void* data = nullptr;
        UINT32 size = 0;
        void* context = nullptr;
        BOOL exists = FALSE;
        bool has = false;
        if (SUCCEEDED(face->TryGetFontTable(DWRITE_MAKE_OPENTYPE_TAG('G', 'P', 'O', 'S'), &data, &size, &context, &exists)) && exists)
        {
            auto const* bytes = static_cast<uint8_t const*>(data);
            auto u16 = [&](size_t at) -> size_t { return at + 2 <= size ? static_cast<size_t>(bytes[at] << 8 | bytes[at + 1]) : 0; };
            const size_t list = u16(6);
            const size_t count = list ? u16(list) : 0;
            for (size_t i = 0; i < count && !has; ++i)
            {
                const size_t record = list + 2 + i * 6;
                if (record + 4 > size) break;
                has = DWRITE_MAKE_OPENTYPE_TAG(bytes[record], bytes[record + 1], bytes[record + 2], bytes[record + 3]) == tag;
            }
            face->ReleaseFontTable(context);
        }
        winrt::com_ptr<IDWriteFontFace> font;
        font.copy_from(face);
        known.emplace_back(std::move(font), tag, has);
        return has;
    }

    // The font each marked position is drawn in, fallback included.
    struct MarkFonts : winrt::implements<MarkFonts, IDWriteTextRenderer>
    {
        explicit MarkFonts(std::vector<uint8_t> const& marks) : marks(marks), faces(marks.size()) {}

        HRESULT __stdcall IsPixelSnappingDisabled(void*, BOOL* disabled) noexcept override
        {
            *disabled = TRUE;
            return S_OK;
        }

        HRESULT __stdcall GetCurrentTransform(void*, DWRITE_MATRIX* transform) noexcept override
        {
            *transform = DWRITE_MATRIX{ 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f };
            return S_OK;
        }

        HRESULT __stdcall GetPixelsPerDip(void*, FLOAT* pixels) noexcept override
        {
            *pixels = 1.0f;
            return S_OK;
        }

        HRESULT __stdcall DrawGlyphRun(void*, FLOAT, FLOAT, DWRITE_MEASURING_MODE, DWRITE_GLYPH_RUN const* run,
            DWRITE_GLYPH_RUN_DESCRIPTION const* description, ::IUnknown*) noexcept override
        {
            if (!run || !run->fontFace || !description) return S_OK;
            const size_t end = (std::min)(static_cast<size_t>(description->textPosition) + description->stringLength, marks.size());
            for (size_t i = description->textPosition; i < end; ++i)
            {
                if (marks[i]) faces[i].copy_from(run->fontFace);
            }
            return S_OK;
        }

        HRESULT __stdcall DrawUnderline(void*, FLOAT, FLOAT, DWRITE_UNDERLINE const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawStrikethrough(void*, FLOAT, FLOAT, DWRITE_STRIKETHROUGH const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawInlineObject(void*, FLOAT, FLOAT, IDWriteInlineObject*, BOOL, BOOL, ::IUnknown*) noexcept override { return S_OK; }

        std::vector<uint8_t> const& marks;
        std::vector<winrt::com_ptr<IDWriteFontFace>> faces;
    };

    // The marks set half-width, by position, as their class: next to other punctuation (an
    // opening mark after a mark, a closing mark before a closing or middle one), an opening mark
    // starting a paragraph (trim-start, trim-both), a closing one ending it (trim-both), and every
    // mark for trim-all. Empty when nothing is trimmed.
    inline std::vector<uint8_t> HalfWidthMarks(Paragraph const& p)
    {
        std::vector<uint8_t> marks;
        const size_t len = p.text.size();
        for (size_t i = 0; i < len; ++i)
        {
            const uint8_t kind = FullWidthPunctuation(p.text[i]);
            if (kind == 0) continue;
            uint8_t trim = p.spacingTrim;
            for (auto const& s : p.spans)
            {
                if (i >= s.start && i < s.start + s.length && s.spacingTrim != kParagraphUpright) trim = s.spacingTrim;
            }
            if (trim == kSpacingTrimSpaceAll) continue;
            bool trimmed = trim == kSpacingTrimAll;
            if (kind == kPunctuationOpening)
            {
                trimmed = trimmed || (i > 0 && FullWidthPunctuation(p.text[i - 1]) != 0)
                    || ((trim == kSpacingTrimStart || trim == kSpacingTrimBoth) && (i == 0 || IsForcedBreak(p.text[i - 1])));
            }
            else if (kind == kPunctuationClosing)
            {
                const uint8_t next = i + 1 < len ? FullWidthPunctuation(p.text[i + 1]) : 0;
                trimmed = trimmed || next == kPunctuationClosing || next == kPunctuationMiddle
                    || (trim == kSpacingTrimBoth && (i + 1 == len || IsForcedBreak(p.text[i + 1])));
            }
            if (!trimmed) continue;
            if (marks.empty()) marks.assign(len, 0);
            marks[i] = kind;
        }
        return marks;
    }

    // Sets each marked mark half-width by character spacing, dropping the blank part of its
    // advance past half an em: trailing space after a closing mark, leading space before an
    // opening one, half of it each side of a middle one. `marks` left by ApplyUprights.
    inline void ApplySpacingTrim(IDWriteTextLayout* layout, Paragraph const& p, std::vector<uint8_t> const& marks)
    {
        if (marks.empty()) return;
        winrt::com_ptr<IDWriteTextLayout1> spacing;
        if (FAILED(layout->QueryInterface(IID_PPV_ARGS(spacing.put())))) return;
        auto fonts = winrt::make_self<MarkFonts>(marks);
        if (FAILED(layout->Draw(nullptr, fonts.get(), 0.0f, 0.0f))) return;
        UINT32 count = 0;
        layout->GetClusterMetrics(nullptr, 0, &count);
        std::vector<DWRITE_CLUSTER_METRICS> clusters(count);
        if (count == 0 || FAILED(layout->GetClusterMetrics(clusters.data(), count, &count))) return;
        std::vector<float> advances(marks.size(), 0.0f);
        size_t at = 0;
        for (auto const& cluster : clusters)
        {
            if (at < advances.size()) advances[at] = cluster.width;
            at += cluster.length;
        }
        for (size_t i = 0; i < marks.size(); ++i)
        {
            if (!marks[i] || !fonts->faces[i] || !HasPositioningFeature(fonts->faces[i].get(), DWRITE_MAKE_OPENTYPE_TAG('h', 'a', 'l', 't'))) continue;
            const auto position = static_cast<UINT32>(i);
            FLOAT size = 0.0f, leading = 0.0f, trailing = 0.0f, minimum = 0.0f;
            if (FAILED(layout->GetFontSize(position, &size)) || FAILED(spacing->GetCharacterSpacing(position, &leading, &trailing, &minimum))) continue;
            const float blank = advances[i] - leading - trailing - size / 2.0f;
            if (blank <= 0.0f) continue;
            if (marks[i] == kPunctuationOpening) leading -= blank;
            else if (marks[i] == kPunctuationMiddle)
            {
                leading -= blank / 2.0f;
                trailing -= blank / 2.0f;
            }
            else trailing -= blank;
            spacing->SetCharacterSpacing(leading, trailing, minimum, DWRITE_TEXT_RANGE{ position, 1 });
        }
    }
}
