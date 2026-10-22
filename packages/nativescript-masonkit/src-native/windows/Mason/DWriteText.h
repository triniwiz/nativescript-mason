#pragma once
// Paragraphs laid out with DirectWrite for Text. An IDWriteTextLayout costs a fraction of a
// TextBlock layout and answers every width Taffy asks about without XAML; TextAtlas.h draws it.
#include <algorithm>
#include <cmath>
#include <cwchar>
#include <cwctype>
#include <limits>
#include <memory>
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

    // All of a family's files in one collection, so its weights and styles match against each other.
    inline winrt::com_ptr<IDWriteFontCollection> LoadFontFiles(std::vector<std::wstring> const& paths)
    {
        auto* factory = Factory();
        if (!factory) return nullptr;
        winrt::com_ptr<IDWriteFontSetBuilder1> builder;
        if (FAILED(factory->CreateFontSetBuilder(builder.put()))) return nullptr;
        bool any = false;
        for (auto const& path : paths)
        {
            winrt::com_ptr<IDWriteFontFile> file;
            if (SUCCEEDED(factory->CreateFontFileReference(path.c_str(), nullptr, file.put())) && SUCCEEDED(builder->AddFontFile(file.get()))) any = true;
        }
        winrt::com_ptr<IDWriteFontSet> set;
        winrt::com_ptr<IDWriteFontCollection1> collection;
        if (!any || FAILED(builder->CreateFontSet(set.put())) || FAILED(factory->CreateFontCollectionFromFontSet(set.get(), collection.put())))
        {
            return nullptr;
        }
        return collection;
    }

    // The file behind a XAML font source: core's "ms-appx:///app/fonts/A.ttf", FontManager's
    // "ms-appdata:///local/ns_fonts/B.ttf" (it registers nothing with the system), a file URI or a path.
    inline std::wstring FontFilePath(std::wstring_view uri)
    {
        auto after = [&](std::wstring_view prefix) -> bool
        {
            return uri.size() > prefix.size() && _wcsnicmp(uri.data(), prefix.data(), prefix.size()) == 0;
        };
        std::wstring root;
        std::wstring_view rest = uri;
        try
        {
            using winrt::Windows::Storage::ApplicationData;
            if (after(L"ms-appx:///"))
            {
                root = winrt::Windows::ApplicationModel::Package::Current().InstalledLocation().Path();
                rest = uri.substr(11);
            }
            else if (after(L"ms-appdata:///local/"))
            {
                root = ApplicationData::Current().LocalFolder().Path();
                rest = uri.substr(20);
            }
            else if (after(L"ms-appdata:///temp/"))
            {
                root = ApplicationData::Current().TemporaryFolder().Path();
                rest = uri.substr(19);
            }
            else if (after(L"ms-appdata:///roaming/"))
            {
                root = ApplicationData::Current().RoamingFolder().Path();
                rest = uri.substr(22);
            }
            else if (after(L"file:///"))
            {
                rest = uri.substr(8);
            }
        }
        catch (...)
        {
            return {};
        }
        std::wstring path = root.empty() ? std::wstring(rest) : root + L"\\" + std::wstring(rest);
        std::replace(path.begin(), path.end(), L'/', L'\\');
        return path;
    }

    // A XAML font source, a comma-separated list: file entries ("<uri or path>#Family") are loaded
    // into one collection, as XAML does; otherwise the first entry names a system family.
    inline Font ResolveFont(std::wstring_view source)
    {
        thread_local auto* cache = new std::unordered_map<std::wstring, Font>();
        std::wstring key(source);
        if (auto it = cache->find(key); it != cache->end()) return it->second;

        std::vector<std::wstring> files;
        std::wstring fileFamily;
        std::wstring firstName;
        size_t pos = 0;
        while (pos <= source.size())
        {
            const size_t comma = source.find(L',', pos);
            std::wstring_view entry = source.substr(pos, comma == std::wstring_view::npos ? std::wstring_view::npos : comma - pos);
            while (!entry.empty() && iswspace(entry.front())) entry.remove_prefix(1);
            while (!entry.empty() && iswspace(entry.back())) entry.remove_suffix(1);
            // Family names can't hold a colon; every URI and absolute path does.
            if (entry.find(L':') != std::wstring_view::npos)
            {
                const size_t hash = entry.find(L'#');
                auto path = FontFilePath(entry.substr(0, hash));
                if (!path.empty()) files.push_back(std::move(path));
                if (fileFamily.empty() && hash != std::wstring_view::npos) fileFamily = std::wstring(entry.substr(hash + 1));
            }
            else if (firstName.empty() && !entry.empty())
            {
                firstName = std::wstring(entry);
            }
            if (comma == std::wstring_view::npos) break;
            pos = comma + 1;
        }

        Font font;
        font.family = firstName.empty() ? std::wstring(L"Segoe UI") : firstName;
        if (!files.empty())
        {
            font.collection = LoadFontFiles(files);
            font.family = fileFamily;
            if (font.collection)
            {
                UINT32 index = 0;
                BOOL exists = FALSE;
                // The file's own name for its family when the source's differs (typographic vs legacy).
                if (fileFamily.empty() || FAILED(font.collection->FindFamilyName(fileFamily.c_str(), &index, &exists)) || !exists)
                {
                    font.family = FirstFamilyName(font.collection.get());
                }
            }
            if (font.family.empty()) font.family = L"Segoe UI";
        }
        return cache->emplace(std::move(key), font).first->second;
    }

    inline bool SystemHasFamily(std::wstring const& family)
    {
        UINT32 index = 0;
        BOOL exists = FALSE;
        auto* fonts = SystemFonts();
        return fonts && SUCCEEDED(fonts->FindFamilyName(family.c_str(), &index, &exists)) && exists;
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
        uint32_t background{ 0 };
        uint8_t decoration{ 0 };
        uint8_t decorationStyle{ 0 };
        uint32_t decorationColor{ 0 };
        float decorationThickness{ 0.0f };
        DWRITE_FONT_STRETCH stretch{ DWRITE_FONT_STRETCH_NORMAL };
        float wordSpacing{ 0.0f };
        std::wstring features;
        bool operator==(Span const&) const = default;
    };

    struct Shadow
    {
        float x{ 0.0f };
        float y{ 0.0f };
        float blur{ 0.0f };
        uint32_t color{ 0 };
        bool operator==(Shadow const&) const = default;
    };

    struct Box
    {
        uint32_t position{ 0 };
        float width{ 0.0f };
        float height{ 0.0f };
        float baseline{ 0.0f };
        bool operator==(Box const&) const = default;
    };

    struct InlineBox : winrt::implements<InlineBox, IDWriteInlineObject>
    {
        explicit InlineBox(Box const& box)
        {
            metrics.width = box.width;
            metrics.height = box.height;
            metrics.baseline = box.baseline;
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

        HRESULT __stdcall GetBreakConditions(DWRITE_BREAK_CONDITION* before, DWRITE_BREAK_CONDITION* after) noexcept override
        {
            *before = DWRITE_BREAK_CONDITION_CAN_BREAK;
            *after = DWRITE_BREAK_CONDITION_CAN_BREAK;
            return S_OK;
        }

        DWRITE_INLINE_OBJECT_METRICS metrics{};
    };

    inline constexpr wchar_t kSoftHyphen = 0x00AD;

    struct Hyphens
    {
        std::vector<uint32_t> positions;
        std::vector<float> widths;
        std::vector<bool> disabled;
        float fittedWidth{ -1.0f };
        float lineWidth{ 0.0f };
    };

    struct SoftHyphen : winrt::implements<SoftHyphen, IDWriteInlineObject>
    {
        SoftHyphen(std::shared_ptr<Hyphens> owner, size_t index) : owner(std::move(owner)), index(index) {}

        HRESULT __stdcall Draw(void*, IDWriteTextRenderer*, FLOAT, FLOAT, BOOL, BOOL, ::IUnknown*) noexcept override { return S_OK; }

        HRESULT __stdcall GetMetrics(DWRITE_INLINE_OBJECT_METRICS* out) noexcept override
        {
            *out = {};
            return S_OK;
        }

        HRESULT __stdcall GetOverhangMetrics(DWRITE_OVERHANG_METRICS* out) noexcept override
        {
            *out = {};
            return S_OK;
        }

        HRESULT __stdcall GetBreakConditions(DWRITE_BREAK_CONDITION* before, DWRITE_BREAK_CONDITION* after) noexcept override
        {
            *before = DWRITE_BREAK_CONDITION_MAY_NOT_BREAK;
            *after = owner->disabled[index] ? DWRITE_BREAK_CONDITION_MAY_NOT_BREAK : DWRITE_BREAK_CONDITION_CAN_BREAK;
            return S_OK;
        }

        std::shared_ptr<Hyphens> owner;
        size_t index{ 0 };
    };

    inline std::unordered_map<IDWriteTextLayout*, std::weak_ptr<Hyphens>>& HyphenRegistry()
    {
        thread_local std::unordered_map<IDWriteTextLayout*, std::weak_ptr<Hyphens>> registry;
        return registry;
    }

    inline std::shared_ptr<Hyphens> HyphensOf(IDWriteTextLayout* layout)
    {
        auto& registry = HyphenRegistry();
        auto it = registry.find(layout);
        if (it == registry.end()) return nullptr;
        if (auto hyphens = it->second.lock()) return hyphens;
        registry.erase(it);
        return nullptr;
    }

    inline void SetHyphenEnabled(IDWriteTextLayout* layout, Hyphens& hyphens, size_t index, bool enabled)
    {
        if (hyphens.disabled[index] == !enabled) return;
        hyphens.disabled[index] = !enabled;
        winrt::com_ptr<IDWriteInlineObject> object;
        const DWRITE_TEXT_RANGE range{ hyphens.positions[index], 1 };
        if (SUCCEEDED(layout->GetInlineObject(range.startPosition, object.put(), nullptr)) && object) layout->SetInlineObject(object.get(), range);
    }

    inline void FitHyphens(IDWriteTextLayout* layout, Hyphens& hyphens, float maxWidth)
    {
        if (hyphens.fittedWidth == maxWidth) return;
        hyphens.fittedWidth = maxWidth;
        for (size_t i = 0; i < hyphens.positions.size(); ++i) SetHyphenEnabled(layout, hyphens, i, true);
        std::vector<DWRITE_LINE_METRICS> lines;
        for (int pass = 0; pass < 64; ++pass)
        {
            UINT32 count = 0;
            layout->GetLineMetrics(nullptr, 0, &count);
            lines.resize(count);
            if (count == 0 || FAILED(layout->GetLineMetrics(lines.data(), count, &count))) return;
            hyphens.lineWidth = 0.0f;
            bool changed = false;
            UINT32 start = 0;
            for (UINT32 i = 0; i + 1 < count && !changed; ++i)
            {
                const UINT32 visible = lines[i].length - lines[i].trailingWhitespaceLength;
                const UINT32 last = start + visible - 1;
                auto it = visible > 0 ? std::lower_bound(hyphens.positions.begin(), hyphens.positions.end(), last) : hyphens.positions.end();
                if (it != hyphens.positions.end() && *it == last)
                {
                    const size_t index = static_cast<size_t>(it - hyphens.positions.begin());
                    FLOAT x0 = 0.0f, x1 = 0.0f, y = 0.0f;
                    DWRITE_HIT_TEST_METRICS hit{};
                    layout->HitTestTextPosition(start, FALSE, &x0, &y, &hit);
                    layout->HitTestTextPosition(last, FALSE, &x1, &y, &hit);
                    const float width = std::fabs(x1 - x0) + hyphens.widths[index];
                    if (width > maxWidth + 0.01f)
                    {
                        SetHyphenEnabled(layout, hyphens, index, false);
                        changed = true;
                    }
                    else
                    {
                        hyphens.lineWidth = (std::max)(hyphens.lineWidth, width);
                    }
                }
                start += lines[i].length;
            }
            if (!changed) return;
        }
    }

    // First-line text-indent (DIPs) and line-clamp (0 none).
    struct Flow
    {
        bool indents{ false };
        float indent{ 0.0f };
        uint32_t lineClamp{ 0 };
        bool operator==(Flow const&) const = default;
    };

    struct Paragraph
    {
        std::wstring text;
        std::vector<Span> spans;
        std::vector<Box> boxes;
        Font font;
        float fontSize{ 14.0f };
        DWRITE_FONT_WEIGHT weight{ DWRITE_FONT_WEIGHT_NORMAL };
        DWRITE_FONT_STYLE style{ DWRITE_FONT_STYLE_NORMAL };
        DWRITE_TEXT_ALIGNMENT alignment{ DWRITE_TEXT_ALIGNMENT_LEADING };
        DWRITE_FONT_STRETCH stretch{ DWRITE_FONT_STRETCH_NORMAL };
        bool rtl{ false };
        // Line box height in DIPs; 0 uses the font's own line spacing.
        float lineHeight{ 0.0f };
        uint32_t color{ 0xFF000000 };
        // An unwrapped line wider than its box ends in an ellipsis.
        bool ellipsis{ false };
        std::vector<Shadow> shadows;
        // With indentPercent, a % of the line width (0 when intrinsic).
        float indent{ 0.0f };
        bool indentPercent{ false };
        uint32_t lineClamp{ 0 };
        bool operator==(Paragraph const&) const = default;

        Flow FlowAt(float lineWidth) const
        {
            Flow flow{ indent != 0.0f, indent, lineClamp };
            if (indentPercent) flow.indent = std::isfinite(lineWidth) ? lineWidth * indent / 100.0f : 0.0f;
            return flow;
        }
    };

    inline DWRITE_FONT_STRETCH StretchOf(int32_t value)
    {
        if (value <= 0) return DWRITE_FONT_STRETCH_NORMAL;
        const float pct = value / 100.0f;
        if (pct <= 56.25f) return DWRITE_FONT_STRETCH_ULTRA_CONDENSED;
        if (pct <= 68.75f) return DWRITE_FONT_STRETCH_EXTRA_CONDENSED;
        if (pct <= 81.25f) return DWRITE_FONT_STRETCH_CONDENSED;
        if (pct <= 93.75f) return DWRITE_FONT_STRETCH_SEMI_CONDENSED;
        if (pct < 106.25f) return DWRITE_FONT_STRETCH_NORMAL;
        if (pct <= 118.75f) return DWRITE_FONT_STRETCH_SEMI_EXPANDED;
        if (pct <= 137.5f) return DWRITE_FONT_STRETCH_EXPANDED;
        if (pct <= 175.0f) return DWRITE_FONT_STRETCH_EXTRA_EXPANDED;
        return DWRITE_FONT_STRETCH_ULTRA_EXPANDED;
    }

    inline std::vector<DWRITE_FONT_FEATURE> FeaturesOf(std::wstring_view spec)
    {
        std::vector<DWRITE_FONT_FEATURE> out;
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t end = spec.find(L',', pos);
            if (end == std::wstring_view::npos) end = spec.size();
            std::wstring_view part = spec.substr(pos, end - pos);
            pos = end + 1;
            const size_t open = part.find_first_of(L"\"'");
            if (open == std::wstring_view::npos) continue;
            const size_t close = part.find(part[open], open + 1);
            if (close == std::wstring_view::npos || close - open != 5) continue;
            const std::wstring_view tag = part.substr(open + 1, 4);
            std::wstring rest(part.substr(close + 1));
            rest.erase(0, rest.find_first_not_of(L" \t"));
            rest.erase(rest.find_last_not_of(L" \t") + 1);
            UINT32 value = 1;
            if (rest == L"off") value = 0;
            else if (!rest.empty() && rest != L"on")
            {
                wchar_t* stop = nullptr;
                const long n = std::wcstol(rest.c_str(), &stop, 10);
                if (stop == rest.c_str() || *stop != L'\0' || n < 0) continue;
                value = static_cast<UINT32>(n);
            }
            const auto name = static_cast<DWRITE_FONT_FEATURE_TAG>(DWRITE_MAKE_OPENTYPE_TAG(tag[0], tag[1], tag[2], tag[3]));
            out.push_back({ name, value });
        }
        return out;
    }

    inline bool IsWordSeparator(wchar_t ch)
    {
        return ch == L' ' || ch == L'\u00A0' || ch == L'\u1361' || ch == L'\u3000';
    }

    inline winrt::com_ptr<IDWriteTextLayout> Build(Paragraph const& p)
    {
        auto* factory = Factory();
        if (!factory) return nullptr;
        const DWRITE_FONT_WEIGHT weight = MatchWeight(p.font, p.weight, p.style);
        winrt::com_ptr<IDWriteTextFormat> format;
        if (FAILED(factory->CreateTextFormat(p.font.family.c_str(), p.font.Collection(), weight, p.style, p.stretch,
            (std::max)(p.fontSize, 0.1f), L"en-us", format.put())))
        {
            return nullptr;
        }
        format->SetWordWrapping(DWRITE_WORD_WRAPPING_NO_WRAP);
        format->SetTextAlignment(p.alignment);
        if (p.rtl) format->SetReadingDirection(DWRITE_READING_DIRECTION_RIGHT_TO_LEFT);
        if (p.ellipsis || p.lineClamp > 0)
        {
            winrt::com_ptr<IDWriteInlineObject> sign;
            if (SUCCEEDED(factory->CreateEllipsisTrimmingSign(format.get(), sign.put())))
            {
                const DWRITE_TRIMMING trimming{ DWRITE_TRIMMING_GRANULARITY_CHARACTER, 0, 0 };
                format->SetTrimming(&trimming, sign.get());
            }
        }

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
            const float baseline = (line - ascent - descent) * 0.5f + ascent;
            // Uniform lines don't grow, so a box taller than the line needs DirectWrite's own spacing.
            for (auto const& b : p.boxes)
            {
                if (b.baseline > baseline || b.height - b.baseline > line - baseline) uniform = false;
            }
            if (uniform) format->SetLineSpacing(DWRITE_LINE_SPACING_METHOD_UNIFORM, line, baseline);
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
            if (s.stretch != p.stretch) layout->SetFontStretch(s.stretch, range);
            if (s.letterSpacing != 0.0f && spacing) spacing->SetCharacterSpacing(0.0f, s.letterSpacing, 0.0f, range);
            if (s.wordSpacing != 0.0f && spacing)
            {
                for (uint32_t i = s.start; i < s.start + s.length && i < p.text.size(); ++i)
                {
                    if (IsWordSeparator(p.text[i])) spacing->SetCharacterSpacing(0.0f, s.letterSpacing + s.wordSpacing, 0.0f, DWRITE_TEXT_RANGE{ i, 1 });
                }
            }
            if (!s.features.empty())
            {
                const auto features = FeaturesOf(s.features);
                winrt::com_ptr<IDWriteTypography> typography;
                if (!features.empty() && SUCCEEDED(factory->CreateTypography(typography.put())))
                {
                    for (auto const& f : features) typography->AddFontFeature(f);
                    layout->SetTypography(typography.get(), range);
                }
            }
        }
        for (auto const& b : p.boxes)
        {
            auto box = winrt::make_self<InlineBox>(b);
            layout->SetInlineObject(box.get(), DWRITE_TEXT_RANGE{ b.position, 1 });
        }
        if (p.text.find(kSoftHyphen) != std::wstring::npos)
        {
            auto hyphens = std::make_shared<Hyphens>();
            std::unordered_map<size_t, float> widthBySpan;
            auto widthAt = [&](uint32_t position) -> float
            {
                size_t span = p.spans.size();
                for (size_t i = 0; i < p.spans.size(); ++i)
                {
                    if (position >= p.spans[i].start && position < p.spans[i].start + p.spans[i].length) span = i;
                }
                if (auto it = widthBySpan.find(span); it != widthBySpan.end()) return it->second;
                const bool own = span < p.spans.size();
                const Font& font = own ? p.spans[span].font : p.font;
                const float size = own ? p.spans[span].fontSize : p.fontSize;
                const DWRITE_FONT_STYLE style = own ? p.spans[span].style : p.style;
                const DWRITE_FONT_WEIGHT fontWeight = MatchWeight(font, own ? p.spans[span].weight : p.weight, style);
                float width = size * 0.33f;
                winrt::com_ptr<IDWriteTextFormat> hyphenFormat;
                winrt::com_ptr<IDWriteTextLayout> hyphen;
                if (SUCCEEDED(factory->CreateTextFormat(font.family.c_str(), font.Collection(), fontWeight, style, own ? p.spans[span].stretch : p.stretch,
                        (std::max)(size, 0.1f), L"en-us", hyphenFormat.put()))
                    && SUCCEEDED(factory->CreateTextLayout(L"-", 1, hyphenFormat.get(), kUnbounded, kUnbounded, hyphen.put())))
                {
                    DWRITE_TEXT_METRICS m{};
                    if (SUCCEEDED(hyphen->GetMetrics(&m))) width = m.widthIncludingTrailingWhitespace;
                }
                widthBySpan.emplace(span, width);
                return width;
            };
            for (uint32_t i = 0; i < p.text.size(); ++i)
            {
                if (p.text[i] != kSoftHyphen) continue;
                hyphens->positions.push_back(i);
                hyphens->widths.push_back(widthAt(i));
                hyphens->disabled.push_back(false);
            }
            for (size_t i = 0; i < hyphens->positions.size(); ++i)
            {
                auto object = winrt::make_self<SoftHyphen>(hyphens, i);
                layout->SetInlineObject(object.get(), DWRITE_TEXT_RANGE{ hyphens->positions[i], 1 });
            }
            HyphenRegistry()[layout.get()] = hyphens;
        }
        return layout;
    }

    // Where each line sits across the line stack, from the layout's top.
    struct LineBand
    {
        float top{ 0.0f };
        float bottom{ 0.0f };
        float baseline{ 0.0f };
        uint32_t start{ 0 };
        uint32_t length{ 0 };
    };

    inline std::vector<LineBand> LineBands(IDWriteTextLayout* layout)
    {
        std::vector<LineBand> bands;
        UINT32 count = 0;
        layout->GetLineMetrics(nullptr, 0, &count);
        std::vector<DWRITE_LINE_METRICS> lines(count);
        if (count == 0 || FAILED(layout->GetLineMetrics(lines.data(), count, &count))) return bands;
        float top = 0.0f;
        uint32_t start = 0;
        for (auto const& line : lines)
        {
            bands.push_back({ top, top + line.height, top + line.baseline, start, line.length });
            top += line.height;
            start += line.length;
        }
        return bands;
    }

    struct BoxRect
    {
        float x{ 0.0f };
        float y{ 0.0f };
        float width{ 0.0f };
        float height{ 0.0f };
    };

    inline void BoxRects(IDWriteTextLayout* layout, std::vector<Box> const& boxes, std::vector<BoxRect>& out)
    {
        out.clear();
        if (boxes.empty()) return;
        UINT32 count = 0;
        layout->GetLineMetrics(nullptr, 0, &count);
        std::vector<DWRITE_LINE_METRICS> lines(count);
        if (count == 0 || FAILED(layout->GetLineMetrics(lines.data(), count, &count))) return;
        for (auto const& b : boxes)
        {
            FLOAT x = 0.0f, y = 0.0f;
            DWRITE_HIT_TEST_METRICS hit{};
            layout->HitTestTextPosition(b.position, FALSE, &x, &y, &hit);
            float top = 0.0f;
            uint32_t start = 0;
            float baseline = 0.0f;
            for (auto const& line : lines)
            {
                baseline = top + line.baseline;
                if (b.position < start + line.length) break;
                start += line.length;
                top += line.height;
            }
            out.push_back({ hit.left, baseline - b.baseline, b.width, b.height });
        }
    }

    inline int32_t PositionAt(IDWriteTextLayout* layout, float x, float y)
    {
        BOOL trailing = FALSE, inside = FALSE;
        DWRITE_HIT_TEST_METRICS hit{};
        if (FAILED(layout->HitTestPoint(x, y, &trailing, &inside, &hit)) || !inside) return -1;
        return static_cast<int32_t>(hit.textPosition);
    }

    // Leading space on the first character; a negative one hangs the first line.
    inline void SetIndent(IDWriteTextLayout* layout, float indent)
    {
        winrt::com_ptr<IDWriteTextLayout1> spacing;
        FLOAT leading = 0.0f, trailing = 0.0f, minimum = 0.0f;
        if (FAILED(layout->QueryInterface(IID_PPV_ARGS(spacing.put())))
            || FAILED(spacing->GetCharacterSpacing(0, &leading, &trailing, &minimum)) || leading == indent) return;
        spacing->SetCharacterSpacing(indent, trailing, minimum, DWRITE_TEXT_RANGE{ 0, 1 });
    }

    // Ends the box after `lines`; the trimming sign ellipsizes the last one.
    inline void Clamp(IDWriteTextLayout* layout, uint32_t lines)
    {
        thread_local std::vector<DWRITE_LINE_METRICS> metrics;
        UINT32 count = 0;
        layout->GetLineMetrics(nullptr, 0, &count);
        float height = kUnbounded;
        if (count > lines)
        {
            metrics.resize(count);
            if (FAILED(layout->GetLineMetrics(metrics.data(), count, &count))) return;
            height = 0.01f;
            for (uint32_t i = 0; i < lines; ++i) height += metrics[i].height;
        }
        if (layout->GetMaxHeight() != height) layout->SetMaxHeight(height);
    }

    // Measuring, arranging and drawing share one layout, and each change of wrapping or width
    // makes it flow its lines again, so only real changes are applied.
    inline void Configure(IDWriteTextLayout* layout, DWRITE_WORD_WRAPPING wrapping, float maxWidth, Flow const& flow = {})
    {
        if (flow.indents) SetIndent(layout, flow.indent);
        if (layout->GetWordWrapping() != wrapping) layout->SetWordWrapping(wrapping);
        if (layout->GetMaxWidth() != maxWidth) layout->SetMaxWidth(maxWidth);
        if (wrapping != DWRITE_WORD_WRAPPING_NO_WRAP)
        {
            if (auto hyphens = HyphensOf(layout)) FitHyphens(layout, *hyphens, maxWidth);
        }
        if (flow.lineClamp > 0) Clamp(layout, flow.lineClamp);
    }

    // Unwrapped for an infinite width; otherwise broken only between words, a longer word
    // overflowing, as CSS does.
    inline DWRITE_TEXT_METRICS LayOut(IDWriteTextLayout* layout, float width, Flow const& flow = {})
    {
        const bool wrap = std::isfinite(width);
        Configure(layout, wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, wrap ? (std::max)(width, 0.0f) : kUnbounded, flow);
        DWRITE_TEXT_METRICS m{};
        layout->GetMetrics(&m);
        if (wrap)
        {
            if (auto hyphens = HyphensOf(layout)) m.width = (std::max)(m.width, hyphens->lineWidth);
        }
        return m;
    }

    // CSS min-content: the widest piece between break opportunities.
    inline float MinContentWidth(IDWriteTextLayout* layout, Flow const& flow = {})
    {
        if (flow.indents) SetIndent(layout, flow.indent);
        FLOAT width = 0.0f;
        return SUCCEEDED(layout->DetermineMinWidth(&width)) ? width : 0.0f;
    }

    // A float's margin box beside a paragraph, in DIPs from its origin; side 1 left, 2 right.
    struct Exclusion
    {
        float left{ 0.0f };
        float top{ 0.0f };
        float right{ 0.0f };
        float bottom{ 0.0f };
        uint8_t side{ 0 };
        bool operator==(Exclusion const&) const = default;
    };

    // Lines laid out on their own, placed at x, y from the paragraph's origin. Never reconfigured.
    struct FloatLine
    {
        winrt::com_ptr<IDWriteTextLayout> layout;
        std::vector<Span> spans;
        float x{ 0.0f };
        float y{ 0.0f };
    };

    // A paragraph wrapped around floats: a layout per line beside them, then one for the rest.
    struct FloatLayout
    {
        std::vector<FloatLine> lines;
        // The ink's right edge from the origin, and the height of every line.
        float width{ 0.0f };
        float height{ 0.0f };
    };

    // Characters [start, start + length) with the spans clipped to them; inline boxes are dropped
    // and only a slice from the start keeps the first-line indent.
    inline Paragraph Slice(Paragraph const& p, uint32_t start, uint32_t length)
    {
        Paragraph out = p;
        out.text.assign(p.text, start, length);
        out.spans.clear();
        for (auto const& s : p.spans)
        {
            const uint32_t from = (std::max)(s.start, start);
            const uint32_t to = (std::min)(s.start + s.length, start + length);
            if (to <= from) continue;
            Span clipped = s;
            clipped.start = from - start;
            clipped.length = to - from;
            out.spans.push_back(std::move(clipped));
        }
        out.boxes.clear();
        if (start > 0)
        {
            out.indent = 0.0f;
            out.indentPercent = false;
        }
        return out;
    }

    // Where a line from top to bottom is clear of the floats in a box `width` wide, and the nearest
    // bottom of a float beside it (infinity with none).
    inline void ClearSpan(std::vector<Exclusion> const& floats, float width, float top, float bottom, float& start, float& end, float& below)
    {
        start = 0.0f;
        end = width;
        below = std::numeric_limits<float>::infinity();
        for (auto const& f : floats)
        {
            if (bottom <= f.top || top >= f.bottom || f.right <= f.left) continue;
            if (f.side == 1) start = (std::max)(start, f.right);
            else if (f.side == 2) end = (std::min)(end, f.left);
            else continue;
            below = (std::min)(below, f.bottom);
        }
        start = (std::clamp)(start, 0.0f, width);
        end = (std::clamp)(end, start, width);
    }

    inline bool IsLineBreak(wchar_t ch)
    {
        return ch == L'\n' || ch == L'\r' || ch == 0x2028 || ch == 0x2029;
    }

    // The paragraph at `width` with each line beside a float kept clear of it, as CSS shortens line
    // boxes; a line too narrow for its first word moves below the float. Lines past the floats
    // share one layout. Inline boxes aren't placed: callers skip paragraphs that have them.
    inline FloatLayout FloatWrap(Paragraph const& p, float width, float slack, std::vector<Exclusion> const& floats)
    {
        FloatLayout out;
        float floatsBottom = 0.0f;
        for (auto const& f : floats) floatsBottom = (std::max)(floatsBottom, f.bottom);
        const Flow first = p.FlowAt(width);
        const uint32_t size = static_cast<uint32_t>(p.text.size());
        uint32_t start = 0;
        uint32_t count = 0;
        float y = 0.0f;
        std::vector<DWRITE_LINE_METRICS> metrics;
        auto firstLine = [&](IDWriteTextLayout* layout, DWRITE_LINE_METRICS& line) -> bool
        {
            UINT32 n = 0;
            layout->GetLineMetrics(nullptr, 0, &n);
            metrics.resize(n);
            if (n == 0 || FAILED(layout->GetLineMetrics(metrics.data(), n, &n))) return false;
            line = metrics[0];
            return true;
        };
        while (start < size && out.lines.size() < 1000)
        {
            Paragraph rest = Slice(p, start, size - start);
            Flow flow;
            if (start == 0 && first.indents)
            {
                // Resolved once: a percentage is of the whole line, not the part beside a float.
                rest.indent = first.indent;
                rest.indentPercent = false;
                flow = Flow{ true, first.indent, 0 };
            }
            auto layout = Build(rest);
            if (!layout) break;
            if (y >= floatsBottom)
            {
                flow.lineClamp = p.lineClamp > 0 ? p.lineClamp - count : 0;
                const auto m = LayOut(layout.get(), width + slack, flow);
                out.width = (std::max)(out.width, m.left + m.width);
                out.lines.push_back({ layout, std::move(rest.spans), 0.0f, y });
                y += m.height;
                break;
            }

            // Which floats a line is beside depends on its height, first taken at the full width.
            DWRITE_LINE_METRICS line{};
            LayOut(layout.get(), width + slack, flow);
            if (!firstLine(layout.get(), line)) break;
            float left = 0.0f, right = width, below = 0.0f;
            ClearSpan(floats, width, y, y + line.height, left, right, below);
            if (right - left < width)
            {
                LayOut(layout.get(), right - left + slack, flow);
                if (!firstLine(layout.get(), line)) break;
                // A taller line can reach another float.
                float l = 0.0f, r = 0.0f, b = 0.0f;
                ClearSpan(floats, width, y, y + line.height, l, r, b);
                if (l != left || r != right)
                {
                    left = l;
                    right = r;
                    below = b;
                    LayOut(layout.get(), right - left + slack, flow);
                    if (!firstLine(layout.get(), line)) break;
                }
            }
            if (line.length == 0) break;
            const uint32_t length = (std::min)(line.length, size - start);
            uint32_t visible = length;
            while (visible > 0 && IsLineBreak(rest.text[visible - 1])) --visible;
            const bool beside = right - left < width;
            if (visible == 0)
            {
                // An empty line between hard breaks.
                y += line.height;
                start += length;
                ++count;
                if (p.lineClamp > 0 && count >= p.lineClamp) break;
                continue;
            }
            // The line on its own, unwrapped so it stays one line, aligned in its part of the box.
            Paragraph text = Slice(rest, 0, visible);
            auto own = Build(text);
            if (!own) break;
            Configure(own.get(), DWRITE_WORD_WRAPPING_NO_WRAP, (std::max)(right - left, 0.0f) + slack, flow);
            DWRITE_TEXT_METRICS m{};
            own->GetMetrics(&m);
            // Too narrow for its first word: CSS moves the line down past the float.
            if (beside && (right - left <= 0.0f || m.width > right - left + slack) && std::isfinite(below) && below > y)
            {
                y = below;
                continue;
            }
            out.width = (std::max)(out.width, left + m.left + m.width);
            out.lines.push_back({ own, std::move(text.spans), left, y });
            y += line.height;
            start += length;
            ++count;
            if (p.lineClamp > 0 && count >= p.lineClamp) break;
        }
        out.height = y;
        return out;
    }
}
