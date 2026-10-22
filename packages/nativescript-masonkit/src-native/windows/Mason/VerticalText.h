#pragma once

// text-orientation for vertical text. Lines are laid out sideways and turned 90° clockwise; a
// grapheme kept upright takes a cell of its own along the line (an inline object) and is drawn
// turned back. The same table and rules are in Android VerticalText.kt and iOS VerticalText.swift.
// Included by DWriteText.h after Paragraph and Span.

#include <d2d1_1.h>

namespace mason_dwrite
{
    // Code points whose Unicode Vertical_Orientation is U, Tu or Tr (UAX #50): upright under
    // `text-orientation: mixed`. Sorted start/end pairs.
    inline constexpr uint32_t kUprightRanges[] = {
        0x00A7, 0x00A7, 0x00A9, 0x00A9, 0x00AE, 0x00AE, 0x00B1, 0x00B1, 0x00BC, 0x00BE,
        0x00D7, 0x00D7, 0x00F7, 0x00F7, 0x02EA, 0x02EB, 0x1100, 0x11FF, 0x1401, 0x167F,
        0x18B0, 0x18FF, 0x2016, 0x2016, 0x2020, 0x2021, 0x2030, 0x2031, 0x203B, 0x203C,
        0x2042, 0x2042, 0x2047, 0x2049, 0x2051, 0x2051, 0x2065, 0x2065, 0x20DD, 0x20E0,
        0x20E2, 0x20E4, 0x2100, 0x2101, 0x2103, 0x2109, 0x210F, 0x210F, 0x2113, 0x2114,
        0x2116, 0x2117, 0x211E, 0x2123, 0x2125, 0x2125, 0x2127, 0x2127, 0x2129, 0x2129,
        0x212E, 0x212E, 0x2135, 0x213F, 0x2145, 0x214A, 0x214C, 0x214D, 0x214F, 0x2189,
        0x218C, 0x218F, 0x221E, 0x221E, 0x2234, 0x2235, 0x2300, 0x2307, 0x230C, 0x231F,
        0x2324, 0x232B, 0x237D, 0x239A, 0x23BE, 0x23CD, 0x23CF, 0x23CF, 0x23D1, 0x23DB,
        0x23E2, 0x2422, 0x2424, 0x24FF, 0x25A0, 0x2619, 0x2620, 0x2767, 0x2776, 0x2793,
        0x2B12, 0x2B2F, 0x2B50, 0x2B59, 0x2BB8, 0x2BFF, 0x2E50, 0x2E51, 0x2E80, 0xA4CF,
        0xA960, 0xA97F, 0xAC00, 0xD7FF, 0xE000, 0xFAFF, 0xFE10, 0xFE1F, 0xFE30, 0xFE6F,
        0xFF01, 0xFF60, 0xFFE0, 0xFFE7, 0xFFF0, 0xFFF8, 0xFFFC, 0xFFFD, 0x13000, 0x1345F,
        0x14400, 0x1467F, 0x16FE0, 0x18AFF, 0x1B000, 0x1B2FF, 0x1D000, 0x1D1FF, 0x1D2E0, 0x1D37F,
        0x1F000, 0x1F2FF, 0x1F300, 0x1F64F, 0x1F680, 0x1F77F, 0x1F900, 0x1FAFF, 0x20000, 0x3FFFD,
    };

    // The Tr ones among them (brackets, the long vowel mark, wave dashes): upright only as the
    // font's vertical form, else drawn sideways, which turns them the way that form does.
    inline constexpr uint32_t kRotatedRanges[] = {
        0x2329, 0x232A, 0x3008, 0x3011, 0x3014, 0x301F, 0x3030, 0x3030, 0x30A0, 0x30A0,
        0x30FC, 0x30FC, 0xFE59, 0xFE5E, 0xFF08, 0xFF09, 0xFF0D, 0xFF0D, 0xFF1A, 0xFF1E,
        0xFF3B, 0xFF3B, 0xFF3D, 0xFF3D, 0xFF3F, 0xFF3F, 0xFF5B, 0xFF60, 0xFFE3, 0xFFE3,
    };

    template <size_t N>
    inline bool InRanges(uint32_t const (&ranges)[N], uint32_t cp)
    {
        int lo = 0;
        int hi = static_cast<int>(N / 2) - 1;
        while (lo <= hi)
        {
            const int mid = (lo + hi) / 2;
            if (cp < ranges[mid * 2]) hi = mid - 1;
            else if (cp > ranges[mid * 2 + 1]) lo = mid + 1;
            else return true;
        }
        return false;
    }

    // Full-width characters: drawn as their vertical forms, centred on the ideographic em box.
    inline bool IsWideUpright(uint32_t cp) { return cp >= 0x2E80 || (cp >= 0x1100 && cp <= 0x11FF); }

    // Controls, line breaks and format characters (zero-width spaces among them) keep their
    // sideways advance. Spaces are upright too under `upright`, as in browsers.
    inline bool StaysSideways(uint32_t cp)
    {
        if (cp < 0x20 || (cp >= 0x7F && cp <= 0x9F) || cp == 0x00AD) return true;
        if ((cp >= 0x200B && cp <= 0x200F) || (cp >= 0x2028 && cp <= 0x202E) || (cp >= 0x2060 && cp <= 0x206F)) return true;
        return cp == 0xFEFF;
    }

    inline bool IsSpace(uint32_t cp) { return cp == 0x20 || cp == 0xA0 || cp == 0x1680 || (cp >= 0x2000 && cp <= 0x200A) || cp == 0x202F || cp == 0x205F || cp == 0x3000; }

    // Code points that stay part of the grapheme before them.
    inline bool ExtendsCluster(uint32_t cp)
    {
        return (cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x1AB0 && cp <= 0x1AFF) || (cp >= 0x1DC0 && cp <= 0x1DFF)
            || (cp >= 0x20D0 && cp <= 0x20FF) || (cp >= 0x3099 && cp <= 0x309A) || (cp >= 0xFE00 && cp <= 0xFE0F)
            || (cp >= 0xFE20 && cp <= 0xFE2F) || cp == 0x200D || (cp >= 0x1F3FB && cp <= 0x1F3FF)
            || (cp >= 0xE0020 && cp <= 0xE007F) || (cp >= 0xE0100 && cp <= 0xE01EF);
    }

    inline uint32_t CodePointAt(std::wstring const& text, size_t i, size_t& units)
    {
        const wchar_t c = text[i];
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < text.size() && text[i + 1] >= 0xDC00 && text[i + 1] <= 0xDFFF)
        {
            units = 2;
            return 0x10000 + ((static_cast<uint32_t>(c) - 0xD800) << 10) + (static_cast<uint32_t>(text[i + 1]) - 0xDC00);
        }
        units = 1;
        return c;
    }

    // A grapheme kept upright: its cell along the line, and the glyph to draw in it.
    struct Upright
    {
        uint32_t position{ 0 };
        uint32_t length{ 0 };
        float cell{ 0.0f };
        uint32_t color{ 0xFF000000 };
        // Full width: centred on the ideographic em box, as CSS's central baseline does.
        bool wide{ false };
        float size{ 0.0f };
        // The baseline's distance below the cell's top edge from the font's vertical origin
        // (VORG), or negative to centre the glyph.
        float baseline{ -1.0f };
        // text-combine-upright: the run's text set horizontally in the cell, squeezed to fit.
        bool combined{ false };
        // text-spacing-trim: kPunctuationOpening, kPunctuationClosing or kPunctuationMiddle keeps
        // that part of the cell, 0 all of it. `trimmed` is the blank length dropped.
        uint8_t half{ 0 };
        float trimmed{ 0.0f };
        winrt::com_ptr<IDWriteTextLayout> glyph;
    };

    // Records the first glyph a layout draws and the font it comes from (fallback included).
    struct GlyphProbe : winrt::implements<GlyphProbe, IDWriteTextRenderer>
    {
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
            DWRITE_GLYPH_RUN_DESCRIPTION const*, ::IUnknown*) noexcept override
        {
            if (!run) return S_OK;
            if (!face && run->fontFace && run->glyphCount > 0)
            {
                face.copy_from(run->fontFace);
                glyph = run->glyphIndices[0];
            }
            glyphs += run->glyphCount;
            return S_OK;
        }

        HRESULT __stdcall DrawUnderline(void*, FLOAT, FLOAT, DWRITE_UNDERLINE const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawStrikethrough(void*, FLOAT, FLOAT, DWRITE_STRIKETHROUGH const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawInlineObject(void*, FLOAT, FLOAT, IDWriteInlineObject*, BOOL, BOOL, ::IUnknown*) noexcept override { return S_OK; }

        winrt::com_ptr<IDWriteFontFace> face;
        UINT16 glyph{ 0 };
        uint32_t glyphs{ 0 };
    };

    inline bool HasFontTable(IDWriteFontFace* face, UINT32 tag)
    {
        const void* data = nullptr;
        UINT32 size = 0;
        void* context = nullptr;
        BOOL exists = FALSE;
        if (FAILED(face->TryGetFontTable(tag, &data, &size, &context, &exists))) return false;
        if (exists) face->ReleaseFontTable(context);
        return exists != FALSE;
    }

    // What the font a grapheme is drawn in says about it set upright, in ems. `advance` is the
    // vertical advance (vmtx) or 0, `height` the font's ascent plus descent, `origin` the
    // vertical origin (VORG) or negative, `form` whether the glyph drawn is a vertical form.
    struct VerticalGlyph
    {
        bool single{ false };
        bool form{ false };
        float advance{ 0.0f };
        float height{ 0.0f };
        float origin{ -1.0f };
    };

    inline VerticalGlyph ProbeVertical(IDWriteTextLayout* layout, uint32_t cp)
    {
        VerticalGlyph v;
        auto probe = winrt::make_self<GlyphProbe>();
        if (!layout || FAILED(layout->Draw(nullptr, probe.get(), 0.0f, 0.0f)) || !probe->face || probe->glyphs != 1) return v;
        v.single = true;
        auto* face = probe->face.get();
        UINT16 nominal = 0;
        const UINT32 point = cp;
        if (SUCCEEDED(face->GetGlyphIndices(&point, 1, &nominal))) v.form = nominal != 0 && nominal != probe->glyph;
        DWRITE_FONT_METRICS metrics{};
        face->GetMetrics(&metrics);
        if (metrics.designUnitsPerEm == 0) return v;
        const float unit = 1.0f / metrics.designUnitsPerEm;
        v.height = (metrics.ascent + metrics.descent) * unit;
        DWRITE_GLYPH_METRICS glyph{};
        if (FAILED(face->GetDesignGlyphMetrics(&probe->glyph, 1, &glyph, TRUE))) return v;
        if (HasFontTable(face, DWRITE_MAKE_OPENTYPE_TAG('v', 'm', 't', 'x'))) v.advance = glyph.advanceHeight * unit;
        if (HasFontTable(face, DWRITE_MAKE_OPENTYPE_TAG('V', 'O', 'R', 'G'))) v.origin = glyph.verticalOriginY * unit;
        return v;
    }

    // The layout's cells share its list of uprights, so the list lives as long as the layout.
    struct UprightCell : winrt::implements<UprightCell, IDWriteInlineObject>
    {
        UprightCell(std::shared_ptr<std::vector<Upright>> owner, float width, float ascent, float descent, bool breakable)
            : owner(std::move(owner)), breakable(breakable)
        {
            metrics.width = width;
            metrics.height = ascent + descent;
            metrics.baseline = ascent;
        }

        HRESULT __stdcall Draw(void*, IDWriteTextRenderer*, FLOAT, FLOAT, BOOL, BOOL, ::IUnknown*) noexcept override { return S_OK; }

        HRESULT __stdcall GetMetrics(DWRITE_INLINE_OBJECT_METRICS* out) noexcept override
        {
            *out = metrics;
            return S_OK;
        }

        HRESULT __stdcall GetOverhangMetrics(DWRITE_OVERHANG_METRICS* out) noexcept override
        {
            *out = {};
            return S_OK;
        }

        // Ideographs break anywhere; other upright letters keep their word together.
        HRESULT __stdcall GetBreakConditions(DWRITE_BREAK_CONDITION* before, DWRITE_BREAK_CONDITION* after) noexcept override
        {
            *before = breakable ? DWRITE_BREAK_CONDITION_CAN_BREAK : DWRITE_BREAK_CONDITION_NEUTRAL;
            *after = breakable ? DWRITE_BREAK_CONDITION_CAN_BREAK : DWRITE_BREAK_CONDITION_NEUTRAL;
            return S_OK;
        }

        std::shared_ptr<std::vector<Upright>> owner;
        DWRITE_INLINE_OBJECT_METRICS metrics{};
        bool breakable{ false };
    };

    inline std::unordered_map<IDWriteTextLayout*, std::weak_ptr<std::vector<Upright>>>& UprightRegistry()
    {
        thread_local std::unordered_map<IDWriteTextLayout*, std::weak_ptr<std::vector<Upright>>> registry;
        return registry;
    }

    inline std::shared_ptr<std::vector<Upright>> UprightsOf(IDWriteTextLayout* layout)
    {
        auto& registry = UprightRegistry();
        auto it = registry.find(layout);
        if (it == registry.end()) return nullptr;
        if (auto uprights = it->second.lock()) return uprights;
        registry.erase(it);
        return nullptr;
    }

    // Gives the graphemes their text-orientation keeps upright (1 mixed, 2 upright) a cell: a
    // span's own, else `p.upright`. Full-width graphemes are drawn as the font's vertical form,
    // and a bracket or other Tr character without one stays sideways. Cells are the font's
    // vertical advance (vmtx), else the height of the font the glyph comes from. Inline boxes
    // and soft hyphens keep their own inline objects.
    // `marks` (see HalfWidthMarks): an upright mark set half-width keeps at most half an em of its
    // cell, and its mark is cleared so ApplySpacingTrim leaves it alone.
    inline void ApplyUprights(IDWriteTextLayout* layout, Paragraph const& p, std::vector<uint8_t>& marks)
    {
        UprightRegistry().erase(layout);
        if (p.text.empty()) return;
        auto spanAt = [&](size_t i) -> const Span*
        {
            const Span* found = nullptr;
            for (auto const& s : p.spans)
            {
                if (i >= s.start && i < s.start + s.length) found = &s;
            }
            return found;
        };
        auto combineAt = [&](size_t i) -> uint8_t
        {
            const Span* span = spanAt(i);
            return span && span->combine != kParagraphUpright ? span->combine : p.combine;
        };
        const bool combines = p.combine != 0
            || std::any_of(p.spans.begin(), p.spans.end(), [](Span const& s) { return s.combine != 0 && s.combine != kParagraphUpright; });
        if (p.upright == 0 && !combines
            && std::none_of(p.spans.begin(), p.spans.end(), [](Span const& s) { return s.upright == 1 || s.upright == 2; }))
        {
            return;
        }
        auto* factory = Factory();
        if (!factory) return;
        auto uprights = std::make_shared<std::vector<Upright>>();
        winrt::com_ptr<IDWriteTextLayout1> spacing;
        layout->QueryInterface(IID_PPV_ARGS(spacing.put()));

        // text-combine-upright: each run to combine (all of an element's text, or each run of up
        // to N ASCII digits) becomes one upright 1em cell, its text set horizontally and squeezed.
        std::vector<bool> covered(combines ? p.text.size() : 0, false);
        auto combine = [&](size_t start, size_t end)
        {
            if (end <= start) return;
            for (auto const& b : p.boxes)
            {
                if (b.position >= start && b.position < end) return;
            }
            const Span* span = spanAt(start);
            const Font& font = span ? span->font : p.font;
            const float size = (std::max)(span ? span->fontSize : p.fontSize, 0.1f);
            const DWRITE_FONT_STYLE style = span ? span->style : p.style;
            const DWRITE_FONT_WEIGHT weight = MatchWeight(font, span ? span->weight : p.weight, style);
            const FontMetrics m = MetricsOf(font, weight, style);
            Upright u;
            u.position = static_cast<uint32_t>(start);
            u.length = static_cast<uint32_t>(end - start);
            u.wide = true;
            u.combined = true;
            u.size = size;
            u.cell = size;
            u.color = span ? span->color : p.color;
            winrt::com_ptr<IDWriteTextFormat> format;
            if (SUCCEEDED(factory->CreateTextFormat(font.family.c_str(), font.Collection(), weight, style,
                    span ? span->stretch : p.stretch, size, L"en-us", format.put())))
            {
                factory->CreateTextLayout(p.text.c_str() + start, u.length, format.get(), kUnbounded, kUnbounded, u.glyph.put());
            }
            auto cell = winrt::make_self<UprightCell>(uprights, size + (span ? span->letterSpacing : 0.0f), m.ascent * size, m.descent * size, true);
            layout->SetInlineObject(cell.get(), DWRITE_TEXT_RANGE{ u.position, u.length });
            uprights->push_back(std::move(u));
            for (size_t k = start; k < end; ++k) covered[k] = true;
        };
        if (combines)
        {
            for (size_t i = 0; i < p.text.size();)
            {
                const uint8_t mode = combineAt(i);
                size_t end = i + 1;
                while (end < p.text.size() && combineAt(end) == mode) ++end;
                if (mode == 1)
                {
                    // Line breaks end a run.
                    size_t start = i;
                    for (size_t j = i; j < end; ++j)
                    {
                        if (p.text[j] != L'\n') continue;
                        combine(start, j);
                        start = j + 1;
                    }
                    combine(start, end);
                }
                else if (mode >= 2)
                {
                    for (size_t j = i; j < end;)
                    {
                        if (p.text[j] < L'0' || p.text[j] > L'9')
                        {
                            ++j;
                            continue;
                        }
                        size_t k = j;
                        while (k < end && p.text[k] >= L'0' && p.text[k] <= L'9') ++k;
                        if (k - j <= mode) combine(j, k);
                        j = k;
                    }
                }
                i = end;
            }
        }

        size_t box = 0;
        for (size_t i = 0; i < p.text.size();)
        {
            if (!covered.empty() && covered[i])
            {
                ++i;
                continue;
            }
            size_t units = 1;
            const uint32_t cp = CodePointAt(p.text, i, units);
            size_t end = i + units;
            while (end < p.text.size())
            {
                size_t next = 1;
                const uint32_t ext = CodePointAt(p.text, end, next);
                if (!ExtendsCluster(ext) && p.text[end - 1] != 0x200D) break;
                end += next;
            }
            while (box < p.boxes.size() && p.boxes[box].position < i) ++box;
            const bool isBox = box < p.boxes.size() && p.boxes[box].position < end;
            const Span* span = spanAt(i);
            const uint8_t mode = span && span->upright != kParagraphUpright ? span->upright : p.upright;
            const bool upright = mode == 2 ? !StaysSideways(cp) : mode == 1 && InRanges(kUprightRanges, cp);
            if (upright && !isBox && cp != kSoftHyphen)
            {
                const Font& font = span ? span->font : p.font;
                const float size = (std::max)(span ? span->fontSize : p.fontSize, 0.1f);
                const DWRITE_FONT_STYLE style = span ? span->style : p.style;
                const DWRITE_FONT_WEIGHT weight = MatchWeight(font, span ? span->weight : p.weight, style);
                const FontMetrics m = MetricsOf(font, weight, style);
                const float ascent = m.ascent * size;
                const float descent = m.descent * size;
                const float letterSpacing = span ? span->letterSpacing : 0.0f;
                if (IsSpace(cp))
                {
                    // A space draws nothing: a minimum advance makes its cell and it stays a space,
                    // breaking and hanging at a line's end as one.
                    if (spacing) spacing->SetCharacterSpacing(0.0f, letterSpacing, ascent + descent, DWRITE_TEXT_RANGE{ static_cast<UINT32>(i), static_cast<UINT32>(end - i) });
                    i = end;
                    continue;
                }
                const bool rotated = InRanges(kRotatedRanges, cp);
                Upright u;
                u.position = static_cast<uint32_t>(i);
                u.length = static_cast<uint32_t>(end - i);
                u.wide = rotated || IsWideUpright(cp);
                u.size = size;
                u.cell = u.wide ? size : ascent + descent;
                u.color = span ? span->color : p.color;
                winrt::com_ptr<IDWriteTextFormat> format;
                if (SUCCEEDED(factory->CreateTextFormat(font.family.c_str(), font.Collection(), weight, style,
                        span ? span->stretch : p.stretch, size, L"en-us", format.put()))
                    && SUCCEEDED(factory->CreateTextLayout(p.text.c_str() + i, u.length, format.get(), kUnbounded, kUnbounded, u.glyph.put())))
                {
                    winrt::com_ptr<IDWriteTypography> typography;
                    if (u.wide && SUCCEEDED(factory->CreateTypography(typography.put())))
                    {
                        typography->AddFontFeature({ DWRITE_FONT_FEATURE_TAG_VERTICAL_WRITING, 1 });
                        u.glyph->SetTypography(typography.get(), DWRITE_TEXT_RANGE{ 0, u.length });
                    }
                }
                const VerticalGlyph vertical = ProbeVertical(u.glyph.get(), cp);
                if (rotated && !vertical.form)
                {
                    i = end;
                    continue;
                }
                if (vertical.single)
                {
                    u.cell = (vertical.advance > 0.0f ? vertical.advance : vertical.height) * size;
                    if (vertical.origin >= 0.0f) u.baseline = vertical.origin * size;
                }
                if (i < marks.size() && marks[i])
                {
                    u.half = marks[i];
                    u.trimmed = (std::max)(u.cell - size / 2.0f, 0.0f);
                    u.cell -= u.trimmed;
                    marks[i] = 0;
                }
                auto cell = winrt::make_self<UprightCell>(uprights, u.cell + letterSpacing, ascent, descent, IsWideUpright(cp));
                layout->SetInlineObject(cell.get(), DWRITE_TEXT_RANGE{ u.position, u.length });
                uprights->push_back(std::move(u));
            }
            i = end;
        }
        if (uprights->empty()) return;
        auto& registry = UprightRegistry();
        if (registry.size() > 64) std::erase_if(registry, [](auto const& entry) { return entry.second.expired(); });
        registry[layout] = uprights;
    }

    // Draws `layout`'s upright graphemes turned back, centred in their cells on the line's central
    // baseline. `transform` is the sideways transform the layout was drawn with; `band` limits the
    // draw to one line (vertical-lr draws line by line), or -1 for all.
    template <typename BrushFor>
    inline void DrawUprights(ID2D1DeviceContext* context, IDWriteTextLayout* layout, D2D1::Matrix3x2F const& transform,
        BrushFor&& brushFor, int band = -1)
    {
        auto uprights = UprightsOf(layout);
        if (!uprights || uprights->empty()) return;
        const auto bands = LineBands(layout);
        for (auto const& u : *uprights)
        {
            if (!u.glyph) continue;
            int line = -1;
            for (size_t b = 0; b < bands.size(); ++b)
            {
                if (u.position >= bands[b].start && u.position < bands[b].start + bands[b].length) line = static_cast<int>(b);
            }
            if (line < 0 || (band >= 0 && line != band)) continue;
            FLOAT x = 0.0f, y = 0.0f;
            DWRITE_HIT_TEST_METRICS hit{};
            if (FAILED(layout->HitTestTextPosition(u.position, FALSE, &x, &y, &hit))) continue;
            DWRITE_TEXT_METRICS glyph{};
            u.glyph->GetMetrics(&glyph);
            DWRITE_LINE_METRICS glyphLine{};
            UINT32 count = 0;
            u.glyph->GetLineMetrics(&glyphLine, 1, &count);
            const auto& lineBand = bands[static_cast<size_t>(line)];
            // A half-width mark's glyph is centred on its full cell, of which it keeps one part.
            const float full = u.cell + u.trimmed;
            const float along = u.half == kPunctuationOpening ? full / 2.0f - u.trimmed
                : u.half == kPunctuationMiddle ? full / 2.0f - u.trimmed / 2.0f : full / 2.0f;
            const D2D1_POINT_2F centre{ x + along, lineBand.top + (lineBand.bottom - lineBand.top) / 2.0f };
            // The font's vertical origin, else full-width glyphs centre their em box (0.12em below
            // the baseline to 0.88em above it) and others their own box.
            const float top = u.baseline >= 0.0f ? centre.y - full / 2.0f + u.baseline - glyphLine.baseline
                : u.wide ? centre.y + 0.38f * u.size - glyphLine.baseline : centre.y - glyph.height / 2.0f;
            // A combined run is squeezed across its cell to fit.
            const float squeeze = u.combined && glyph.widthIncludingTrailingWhitespace > u.cell
                ? u.cell / glyph.widthIncludingTrailingWhitespace : 1.0f;
            context->SetTransform(D2D1::Matrix3x2F::Scale(squeeze, 1.0f, centre) * D2D1::Matrix3x2F::Rotation(-90.0f, centre) * transform);
            context->DrawTextLayout(D2D1::Point2F(centre.x - glyph.widthIncludingTrailingWhitespace / 2.0f, top),
                u.glyph.get(), brushFor(u.color), D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT);
        }
        context->SetTransform(transform);
    }
}
