#pragma once
// Paragraphs laid out with DirectWrite for Text. An IDWriteTextLayout costs a fraction of a
// TextBlock layout and answers every width Taffy asks about without XAML; TextAtlas.h draws it.
#include <algorithm>
#include <cmath>
#include <cwchar>
#include <string>
#include <unordered_map>
#include <vector>
#include <dwrite_3.h>
#include <winrt/base.h>
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.Storage.h>

namespace mason_dwrite
{
    // Wide enough for any line, small enough that edges measured against it keep sub-pixel precision.
    constexpr float kUnbounded = 100000.0f;

    // Never released, like the XAML objects the rest of the component keeps for the process.
    inline IDWriteFactory5* Factory()
    {
        static IDWriteFactory5* factory = []() -> IDWriteFactory5*
        {
            IDWriteFactory5* created = nullptr;
            if (FAILED(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(IDWriteFactory5), reinterpret_cast<::IUnknown**>(&created)))) return nullptr;
            return created;
        }();
        return factory;
    }

    inline IDWriteFontCollection* SystemFonts()
    {
        static IDWriteFontCollection* fonts = []() -> IDWriteFontCollection*
        {
            IDWriteFontCollection* collection = nullptr;
            if (auto* factory = Factory()) factory->GetSystemFontCollection(&collection);
            return collection;
        }();
        return fonts;
    }

    // A family in the system collection, or in the collection of the app font file it came from.
    struct Font
    {
        winrt::com_ptr<IDWriteFontCollection> collection;
        std::wstring family;

        IDWriteFontCollection* Collection() const { return collection ? collection.get() : SystemFonts(); }
        bool operator==(Font const& other) const { return collection == other.collection && family == other.family; }
    };

    inline std::wstring FirstFamilyName(IDWriteFontCollection* collection)
    {
        winrt::com_ptr<IDWriteFontFamily> family;
        winrt::com_ptr<IDWriteLocalizedStrings> names;
        if (!collection || collection->GetFontFamilyCount() == 0 || FAILED(collection->GetFontFamily(0, family.put()))
            || FAILED(family->GetFamilyNames(names.put())))
        {
            return {};
        }
        UINT32 length = 0;
        if (FAILED(names->GetStringLength(0, &length))) return {};
        std::wstring name(length + 1, L'\0');
        if (FAILED(names->GetString(0, name.data(), length + 1))) return {};
        name.resize(length);
        return name;
    }

    inline winrt::com_ptr<IDWriteFontCollection> LoadFontFile(std::wstring const& path)
    {
        auto* factory = Factory();
        if (!factory) return nullptr;
        winrt::com_ptr<IDWriteFontSetBuilder1> builder;
        winrt::com_ptr<IDWriteFontFile> file;
        winrt::com_ptr<IDWriteFontSet> set;
        winrt::com_ptr<IDWriteFontCollection1> collection;
        if (FAILED(factory->CreateFontSetBuilder(builder.put())) || FAILED(factory->CreateFontFileReference(path.c_str(), nullptr, file.put()))
            || FAILED(builder->AddFontFile(file.get())) || FAILED(builder->CreateFontSet(set.put()))
            || FAILED(factory->CreateFontCollectionFromFontSet(set.get(), collection.put())))
        {
            return nullptr;
        }
        return collection;
    }

    // Core resolves an app font to "ms-appx:///app/fonts/Name.ttf#Family"; XAML loads that file and
    // DirectWrite needs it loaded the same way. Anything else names a system family.
    inline Font ResolveFont(std::wstring_view source)
    {
        thread_local auto* cache = new std::unordered_map<std::wstring, Font>();
        std::wstring key(source);
        if (auto it = cache->find(key); it != cache->end()) return it->second;

        Font font;
        font.family = key.empty() ? std::wstring(L"Segoe UI") : key;
        constexpr std::wstring_view scheme = L"ms-appx:///";
        if (source.size() > scheme.size() && _wcsnicmp(source.data(), scheme.data(), scheme.size()) == 0)
        {
            const std::wstring_view rest = source.substr(scheme.size());
            const size_t hash = rest.find(L'#');
            std::wstring file(rest.substr(0, hash));
            std::replace(file.begin(), file.end(), L'/', L'\\');
            const std::wstring family = hash == std::wstring_view::npos ? std::wstring() : std::wstring(rest.substr(hash + 1));
            try
            {
                const std::wstring root{ winrt::Windows::ApplicationModel::Package::Current().InstalledLocation().Path() };
                font.collection = LoadFontFile(root + L"\\" + file);
            }
            catch (...)
            {
            }
            font.family = family;
            if (font.collection)
            {
                UINT32 index = 0;
                BOOL exists = FALSE;
                // The file's own name for its family when core's differs (typographic vs legacy).
                if (family.empty() || FAILED(font.collection->FindFamilyName(family.c_str(), &index, &exists)) || !exists)
                {
                    font.family = FirstFamilyName(font.collection.get());
                }
            }
            if (font.family.empty()) font.family = L"Segoe UI";
        }
        return cache->emplace(std::move(key), font).first->second;
    }

    inline winrt::com_ptr<IDWriteFontFamily> FamilyOf(Font const& font)
    {
        IDWriteFontCollection* collection = font.Collection();
        UINT32 index = 0;
        BOOL exists = FALSE;
        winrt::com_ptr<IDWriteFontFamily> family;
        if (collection && SUCCEEDED(collection->FindFamilyName(font.family.c_str(), &index, &exists)) && exists)
        {
            collection->GetFontFamily(index, family.put());
        }
        return family;
    }

    // CSS font matching: DirectWrite's nearest face for 500 in Segoe UI is Semibold, where CSS
    // falls back to Regular. Between 400 and 500 it tries up to 500, then lighter, then heavier;
    // below 400 lighter first; above 500 heavier first.
    inline DWRITE_FONT_WEIGHT MatchWeight(Font const& font, DWRITE_FONT_WEIGHT weight, DWRITE_FONT_STYLE style)
    {
        thread_local auto* cache = new std::unordered_map<std::wstring, DWRITE_FONT_WEIGHT>();
        std::wstring key = font.family + L'|' + std::to_wstring(static_cast<int>(weight)) + L'|' + std::to_wstring(static_cast<int>(style))
            + L'|' + std::to_wstring(reinterpret_cast<uintptr_t>(font.collection.get()));
        if (auto it = cache->find(key); it != cache->end()) return it->second;

        std::vector<int> weights;
        if (auto family = FamilyOf(font))
        {
            for (UINT32 i = 0, n = family->GetFontCount(); i < n; ++i)
            {
                winrt::com_ptr<IDWriteFont> face;
                if (FAILED(family->GetFont(i, face.put())) || face->GetStretch() != DWRITE_FONT_STRETCH_NORMAL) continue;
                const bool italic = face->GetStyle() != DWRITE_FONT_STYLE_NORMAL;
                if (italic != (style != DWRITE_FONT_STYLE_NORMAL) || face->GetSimulations() != DWRITE_FONT_SIMULATIONS_NONE) continue;
                weights.push_back(static_cast<int>(face->GetWeight()));
            }
        }
        const int target = static_cast<int>(weight);
        int chosen = target;
        if (!weights.empty() && std::find(weights.begin(), weights.end(), target) == weights.end())
        {
            std::sort(weights.begin(), weights.end());
            auto lighter = [&](int below) { int best = -1; for (int w : weights) if (w < below) best = w; return best; };
            auto heavier = [&](int above) { for (int w : weights) if (w > above) return w; return -1; };
            int found = -1;
            if (target >= 400 && target <= 500)
            {
                for (int w : weights) if (w > target && w <= 500) { found = w; break; }
                if (found < 0) found = lighter(target);
                if (found < 0) found = heavier(500);
            }
            else if (target < 400)
            {
                found = lighter(target);
                if (found < 0) found = heavier(target);
            }
            else
            {
                found = heavier(target);
                if (found < 0) found = lighter(target);
            }
            if (found > 0) chosen = found;
        }
        return cache->emplace(std::move(key), static_cast<DWRITE_FONT_WEIGHT>(chosen)).first->second;
    }

    struct FontMetrics
    {
        float ascent{ 0.9f };
        float descent{ 0.25f };
        float lineGap{ 0.0f };
    };

    // In ems, for placing the baseline in a CSS line box.
    inline FontMetrics MetricsOf(Font const& font, DWRITE_FONT_WEIGHT weight, DWRITE_FONT_STYLE style)
    {
        thread_local auto* cache = new std::unordered_map<std::wstring, FontMetrics>();
        std::wstring key = font.family + L'|' + std::to_wstring(static_cast<int>(weight)) + L'|' + std::to_wstring(static_cast<int>(style))
            + L'|' + std::to_wstring(reinterpret_cast<uintptr_t>(font.collection.get()));
        if (auto it = cache->find(key); it != cache->end()) return it->second;

        FontMetrics out;
        winrt::com_ptr<IDWriteFont> match;
        if (auto family = FamilyOf(font); family && SUCCEEDED(family->GetFirstMatchingFont(weight, DWRITE_FONT_STRETCH_NORMAL, style, match.put())))
        {
            DWRITE_FONT_METRICS m{};
            match->GetMetrics(&m);
            if (m.designUnitsPerEm > 0)
            {
                out.ascent = static_cast<float>(m.ascent) / m.designUnitsPerEm;
                out.descent = static_cast<float>(m.descent) / m.designUnitsPerEm;
                out.lineGap = static_cast<float>(m.lineGap) / m.designUnitsPerEm;
            }
        }
        return cache->emplace(std::move(key), out).first->second;
    }

    struct Span
    {
        uint32_t start{ 0 };
        uint32_t length{ 0 };
        Font font;
        float fontSize{ 14.0f };
        DWRITE_FONT_WEIGHT weight{ DWRITE_FONT_WEIGHT_NORMAL };
        DWRITE_FONT_STYLE style{ DWRITE_FONT_STYLE_NORMAL };
        // Added after each character, as CSS letter-spacing is.
        float letterSpacing{ 0.0f };
        bool underline{ false };
        bool strikethrough{ false };
        uint32_t color{ 0xFF000000 };
        bool operator==(Span const&) const = default;
    };

    struct Paragraph
    {
        std::wstring text;
        std::vector<Span> spans;
        Font font;
        float fontSize{ 14.0f };
        DWRITE_FONT_WEIGHT weight{ DWRITE_FONT_WEIGHT_NORMAL };
        DWRITE_FONT_STYLE style{ DWRITE_FONT_STYLE_NORMAL };
        DWRITE_TEXT_ALIGNMENT alignment{ DWRITE_TEXT_ALIGNMENT_LEADING };
        // Line box height in DIPs; 0 uses the font's own line spacing.
        float lineHeight{ 0.0f };
        uint32_t color{ 0xFF000000 };
        bool operator==(Paragraph const&) const = default;
    };

    inline winrt::com_ptr<IDWriteTextLayout> Build(Paragraph const& p)
    {
        auto* factory = Factory();
        if (!factory) return nullptr;
        const DWRITE_FONT_WEIGHT weight = MatchWeight(p.font, p.weight, p.style);
        winrt::com_ptr<IDWriteTextFormat> format;
        if (FAILED(factory->CreateTextFormat(p.font.family.c_str(), p.font.Collection(), weight, p.style, DWRITE_FONT_STRETCH_NORMAL,
            (std::max)(p.fontSize, 0.1f), L"en-us", format.put())))
        {
            return nullptr;
        }
        format->SetWordWrapping(DWRITE_WORD_WRAPPING_NO_WRAP);
        format->SetTextAlignment(p.alignment);

        // Blink rounds the font's ascent, descent and gap to whole pixels, so a 14px Segoe UI line
        // is 19px where DirectWrite's own spacing gives 18.6. Uniform spacing can't grow a line for
        // a larger span, so text mixing sizes keeps DirectWrite's.
        bool uniform = p.lineHeight > 0.0f;
        if (!uniform)
        {
            uniform = true;
            for (auto const& s : p.spans)
            {
                if (s.fontSize != p.fontSize || !(s.font == p.font)) uniform = false;
            }
        }
        if (uniform)
        {
            const FontMetrics m = MetricsOf(p.font, weight, p.style);
            const float ascent = std::round(m.ascent * p.fontSize);
            const float descent = std::round(m.descent * p.fontSize);
            const float gap = std::round(m.lineGap * p.fontSize);
            const float line = p.lineHeight > 0.0f ? p.lineHeight : ascent + descent + gap;
            // CSS centres the ascent and descent in the line box, splitting the leading.
            format->SetLineSpacing(DWRITE_LINE_SPACING_METHOD_UNIFORM, line, (line - ascent - descent) * 0.5f + ascent);
        }

        winrt::com_ptr<IDWriteTextLayout> layout;
        if (FAILED(factory->CreateTextLayout(p.text.c_str(), static_cast<UINT32>(p.text.size()), format.get(), kUnbounded, kUnbounded, layout.put())))
        {
            return nullptr;
        }
        auto spacing = layout.try_as<IDWriteTextLayout1>();
        for (auto const& s : p.spans)
        {
            const DWRITE_TEXT_RANGE range{ s.start, s.length };
            if (!(s.font == p.font))
            {
                layout->SetFontCollection(s.font.Collection(), range);
                layout->SetFontFamilyName(s.font.family.c_str(), range);
            }
            if (s.fontSize != p.fontSize) layout->SetFontSize((std::max)(s.fontSize, 0.1f), range);
            if (s.weight != p.weight || !(s.font == p.font)) layout->SetFontWeight(MatchWeight(s.font, s.weight, s.style), range);
            if (s.style != p.style) layout->SetFontStyle(s.style, range);
            if (s.underline) layout->SetUnderline(TRUE, range);
            if (s.strikethrough) layout->SetStrikethrough(TRUE, range);
            if (s.letterSpacing != 0.0f && spacing) spacing->SetCharacterSpacing(0.0f, s.letterSpacing, 0.0f, range);
        }
        return layout;
    }

    // Measuring, arranging and drawing share one layout, and each change of wrapping or width
    // makes it flow its lines again, so only real changes are applied.
    inline void Configure(IDWriteTextLayout* layout, DWRITE_WORD_WRAPPING wrapping, float maxWidth)
    {
        if (layout->GetWordWrapping() != wrapping) layout->SetWordWrapping(wrapping);
        if (layout->GetMaxWidth() != maxWidth) layout->SetMaxWidth(maxWidth);
    }

    // Unwrapped for an infinite width; otherwise broken only between words, a longer word
    // overflowing, as CSS does.
    inline DWRITE_TEXT_METRICS LayOut(IDWriteTextLayout* layout, float width)
    {
        const bool wrap = std::isfinite(width);
        Configure(layout, wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, wrap ? (std::max)(width, 0.0f) : kUnbounded);
        DWRITE_TEXT_METRICS m{};
        layout->GetMetrics(&m);
        return m;
    }

    // CSS min-content: the widest piece between break opportunities.
    inline float MinContentWidth(IDWriteTextLayout* layout)
    {
        FLOAT width = 0.0f;
        return SUCCEEDED(layout->DetermineMinWidth(&width)) ? width : 0.0f;
    }
}
