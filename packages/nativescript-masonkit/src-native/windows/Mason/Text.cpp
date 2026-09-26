#include "pch.h"
#include "Text.h"
#include "Text.g.cpp"
#include "TextNode.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <limits>
#include <winrt/NativeScript.Mason.h>
#include <winrt/Windows.UI.Text.h>
#include <winrt/Microsoft.UI.Xaml.Documents.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/NativeScript.FontManager.h>
#include <string>
#include <vector>
#include <cwctype>
#include "LeafCommon.h"
#include "VisualApply.h"
#include "BufferUtil.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxd = winrt::Microsoft::UI::Xaml::Documents;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;

    
    // Width for a Taffy measure request: definite known width, else 0 for MinContent (-1), else infinity.
    inline float ResolveWidth(float known, float available)
    {
        if (known > 0.0f && std::isfinite(known)) return known;
        if (available < 0.0f && available > -1.5f) return 0.0f; // MinContent
        return std::numeric_limits<float>::infinity();
    }

    bool IsBreakOpportunity(wchar_t c)
    {
        return c == L' ' || c == L'\t' || c == L'\n' || c == L'\r' || c == 0x200B;
    }

    // CSS min-content is the widest unbreakable segment. XAML clamps DesiredSize to the offered width,
    // so each segment is measured unconstrained on a detached probe, with its runs' formatting.
    float MinContentWidth(muxc::TextBlock const& text)
    {
        // Never destroyed: releasing a XAML object after the thread's XAML shuts down crashes.
        struct Probe { muxc::TextBlock block; };
        thread_local Probe* holder = nullptr;
        if (!holder)
        {
            holder = new Probe{ muxc::TextBlock() };
            holder->block.TextWrapping(mux::TextWrapping::NoWrap);
        }
        muxc::TextBlock* probe = &holder->block;
        probe->FontFamily(text.FontFamily());
        probe->FontSize(text.FontSize());
        probe->FontWeight(text.FontWeight());
        probe->FontStyle(text.FontStyle());
        probe->CharacterSpacing(text.CharacterSpacing());
        auto pieces = probe->Inlines();
        pieces.Clear();

        const float inf = std::numeric_limits<float>::infinity();
        float widest = 0.0f;
        auto flush = [&]()
        {
            if (pieces.Size() == 0) return;
            probe->Measure(Size{ inf, inf });
            widest = (std::max)(widest, probe->DesiredSize().Width);
            pieces.Clear();
        };

        for (auto const& inl : text.Inlines())
        {
            auto run = inl.try_as<muxd::Run>();
            if (!run)
            {
                flush();
                continue;
            }
            const winrt::hstring content = run.Text();
            const std::wstring_view chars{ content };
            size_t start = 0;
            for (size_t i = 0; i <= chars.size(); ++i)
            {
                const bool end = i == chars.size();
                const bool space = !end && IsBreakOpportunity(chars[i]);
                const bool hyphen = !end && chars[i] == L'-';
                if (!end && !space && !hyphen) continue;
                const size_t stop = hyphen ? i + 1 : i;
                if (stop > start)
                {
                    muxd::Run piece;
                    piece.Text(winrt::hstring{ chars.substr(start, stop - start) });
                    piece.FontFamily(run.FontFamily());
                    piece.FontSize(run.FontSize());
                    piece.FontWeight(run.FontWeight());
                    piece.FontStyle(run.FontStyle());
                    piece.CharacterSpacing(run.CharacterSpacing());
                    pieces.Append(piece);
                }
                if (!end) flush();
                start = i + 1;
            }
        }
        flush();
        return widest;
    }

    winrt::Windows::UI::Color ColorFromArgb(uint32_t argb)
    {
        return winrt::Windows::UI::Color{
            static_cast<uint8_t>((argb >> 24) & 0xFF),
            static_cast<uint8_t>((argb >> 16) & 0xFF),
            static_cast<uint8_t>((argb >> 8) & 0xFF),
            static_cast<uint8_t>(argb & 0xFF) };
    }

    std::wstring ToLower(std::wstring_view s)
    {
        std::wstring out;
        out.reserve(s.size());
        for (wchar_t c : s) out += static_cast<wchar_t>(std::towlower(c));
        return out;
    }

    // Trim whitespace and surrounding quotes from a CSS font-family token.
    std::wstring CleanToken(std::wstring_view t)
    {
        size_t b = 0, e = t.size();
        while (b < e && iswspace(t[b])) ++b;
        while (e > b && iswspace(t[e - 1])) --e;
        if (e - b >= 2 && (t[b] == L'\'' || t[b] == L'"') && t[e - 1] == t[b]) { ++b; --e; }
        return std::wstring(t.substr(b, e - b));
    }

    // Map a CSS generic family to a concrete Windows font; named families pass through unchanged.
    std::wstring MapGenericFamily(std::wstring const& family)
    {
        const std::wstring lower = ToLower(family);
        if (lower == L"monospace" || lower == L"ui-monospace") return L"Consolas";
        if (lower == L"serif" || lower == L"ui-serif") return L"Georgia";
        if (lower == L"sans-serif" || lower == L"system-ui" || lower == L"ui-sans-serif" || lower == L"-apple-system") return L"Segoe UI";
        if (lower == L"cursive") return L"Segoe Script";
        if (lower == L"fantasy") return L"Impact";
        return family;
    }

    // Family names of fonts loaded in FontManager's FontFaceSet; empty if FontManager isn't available.
    std::vector<std::wstring> LoadedFontFamilies()
    {
        std::vector<std::wstring> out;
        try
        {
            auto set = winrt::NativeScript::FontManager::FontFaceSet::Instance();
            if (!set) return out;
            auto faces = set.GetArray();
            if (!faces) return out;
            for (auto const& face : faces)
            {
                if (face) out.push_back(ToLower(std::wstring_view(face.Family())));
            }
        }
        catch (...) {}
        return out;
    }

    // Resolve a CSS font-family list to one Windows family name: a loaded custom font wins, else the
    // first token mapped through MapGenericFamily. Empty input yields "".
    std::wstring ResolveFamily(std::wstring_view list)
    {
        std::vector<std::wstring> tokens;
        size_t pos = 0;
        while (pos <= list.size())
        {
            size_t comma = list.find(L',', pos);
            std::wstring_view raw = list.substr(pos, comma == std::wstring_view::npos ? std::wstring_view::npos : comma - pos);
            std::wstring tok = CleanToken(raw);
            if (!tok.empty()) tokens.push_back(tok);
            if (comma == std::wstring_view::npos) break;
            pos = comma + 1;
        }
        if (tokens.empty()) return L"";

        const auto loaded = LoadedFontFamilies();
        if (!loaded.empty())
        {
            for (auto const& tok : tokens)
            {
                const std::wstring lower = ToLower(tok);
                for (auto const& fam : loaded)
                {
                    if (fam == lower) return tok;
                }
            }
        }
        return MapGenericFamily(tokens.front());
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Text::Text()
    {
        m_engine = nsm::Mason::Instance();
        
        m_node = m_engine.CreateNode(false);
        m_text = muxc::TextBlock();
        m_text.Foreground(muxm::SolidColorBrush(winrt::Windows::UI::Color{ 255, 0, 0, 0 }));
        m_text.FontFamily(muxm::FontFamily(L"Segoe UI"));
        m_text.FontSize(14.0);
        // CSS breaks only at break opportunities and lets a longer word overflow; Wrap breaks inside it.
        m_text.TextWrapping(mux::TextWrapping::WrapWholeWords);
        Children().Append(m_text);

        auto weak = winrt::make_weak(m_text);
        auto minContent = m_minContent;
        nsm::MeasureFunc cb = [weak, minContent](float kw, float, float aw, float) -> int64_t
        {
            auto t = weak.get();
            if (!t) return mason_leaf::PackMeasure(0.0f, 0.0f);
            float width = ResolveWidth(kw, aw);
            if (width == 0.0f)
            {
                if (!minContent->valid)
                {
                    minContent->width = MinContentWidth(t);
                    minContent->valid = true;
                }
                width = minContent->width;
            }
            // Height is the result, never a constraint: a TextBlock measured shorter than a line drops
            // the line. Taffy applies a known height itself.
            t.Measure(Size{ width, std::numeric_limits<float>::infinity() });
            auto d = t.DesiredSize();
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    void Text::SyncStyle(winrt::hstring const&, winrt::hstring const&)
    {
        ApplyStyleFromBuffer();
        InvalidateText();
    }

    hstring Text::Content() const
    {
        return m_contentNode ? m_contentNode.Data() : hstring{};
    }

    void Text::Content(hstring const& value)
    {
        if (!m_contentNode)
        {
            m_contentNode = nsm::TextNode();
            SetRun(m_contentNode, 0);
        }
        m_contentNode.Data(value);
    }

    double Text::FontSize() const { return m_fontSize; }
    void Text::FontSize(double value) { if (value > 0.0) { m_fontSize = value; if (m_text) m_text.FontSize(value); RebuildInlines(); InvalidateText(); } }

    void Text::SetFontFamily(hstring const& families)
    {
        const std::wstring resolved = ResolveFamily(std::wstring_view(families));
        m_fontFamily = winrt::hstring{ resolved };
        if (m_text)
        {
            m_text.FontFamily(muxm::FontFamily(resolved.empty() ? winrt::hstring{ L"Segoe UI" } : m_fontFamily));
        }
        RebuildInlines();
        InvalidateText();
    }

    void Text::SetRun(nsm::TextNode const& run, int32_t index)
    {
        if (!run) return;
        for (auto it = m_runs.begin(); it != m_runs.end(); ++it)
        {
            if (*it == run) { m_runs.erase(it); break; }
        }
        if (index < 0 || index > static_cast<int32_t>(m_runs.size())) index = static_cast<int32_t>(m_runs.size());
        m_runs.insert(m_runs.begin() + index, run);
        winrt::get_self<implementation::TextNode>(run)->SetOwner(this);
        if (RebuildInlines()) InvalidateText();
    }

    void Text::RemoveRun(nsm::TextNode const& run)
    {
        if (!run) return;
        for (auto it = m_runs.begin(); it != m_runs.end(); ++it)
        {
            if (*it == run)
            {
                winrt::get_self<implementation::TextNode>(run)->SetOwner(nullptr);
                m_runs.erase(it);
                break;
            }
        }
        if (RebuildInlines()) InvalidateText();
    }

    void Text::ClearRuns()
    {
        for (auto const& r : m_runs)
        {
            if (r) winrt::get_self<implementation::TextNode>(r)->SetOwner(nullptr);
        }
        m_runs.clear();
        if (RebuildInlines()) InvalidateText();
    }

    void Text::OnRunChanged() { if (RebuildInlines()) InvalidateText(); }

    void Text::ApplyStyleFromBuffer()
    {
        if (!m_text || !m_node) return;
        auto st = m_node.Style();
        if (!st) return;
        auto buf = st.Values();
        if (!buf) return;
        auto acc = buf.try_as<mason_buf::IBufferByteAccess>();
        uint8_t* d = nullptr;
        if (!acc || FAILED(acc->Buffer(&d)) || !d) return;
        const uint32_t len = buf.Length();

        auto u8 = [&](uint32_t o) -> uint8_t { return o < len ? d[o] : 0; };
        auto i32 = [&](uint32_t o) -> int32_t { int32_t v = 0; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        auto u32 = [&](uint32_t o) -> uint32_t { uint32_t v = 0; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        auto f32 = [&](uint32_t o) -> float { float v = 0.0f; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };

        // Each prop: value at its offset, applied only if its *_STATE byte is set. Offsets per style.ts.
        if (u8(328)) { m_color = u32(324); m_hasColor = true; }            // FONT_COLOR / state 328
        if (u8(334)) { int32_t fs = i32(329); if (fs > 0) m_fontSize = static_cast<double>(fs); } // FONT_SIZE (dip) / 334
        if (u8(339)) { int32_t fw = i32(335); if (fw > 0) m_fontWeight = fw; } // FONT_WEIGHT / 339
        if (u8(367)) { m_letterSpacingPx = static_cast<double>(f32(363)); }  // LETTER_SPACING (px) / 367
        if (u8(388))                                                         // LINE_HEIGHT / state 388, type 389
        {
            const float lh = f32(384);
            m_lineHeightMultiplier = (u8(389) == 0) ? static_cast<double>(lh) : 0.0; // 0 = unitless multiplier, 1 = px
            if (u8(389) != 0) { m_text.LineHeight(static_cast<double>(lh)); m_text.LineStackingStrategy(mux::LineStackingStrategy::BlockLineHeight); }
        }

        if (m_fontSize > 0.0) m_text.FontSize(m_fontSize);
        if (m_fontWeight > 0) m_text.FontWeight(winrt::Windows::UI::Text::FontWeight{ static_cast<uint16_t>(m_fontWeight) });
        {
            // FONT_STYLE_TYPE byte at 344 (0 normal, 1 italic, 2 oblique) / state 345. Runs inherit it.
            using winrt::Windows::UI::Text::FontStyle;
            const uint8_t fontStyle = u8(345) ? u8(344) : 0;
            m_text.FontStyle(fontStyle == 1 ? FontStyle::Italic : fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
        }
        {
            // DECORATION_LINE bit set at 354 (1 underline, 2 overline, 4 line-through) / state 355.
            // WinUI has no overline, and draws every line solid in the text color.
            using winrt::Windows::UI::Text::TextDecorations;
            const uint8_t line = u8(355) ? u8(354) : 0;
            m_decorations = TextDecorations::None;
            if (line < 8)
            {
                if (line & 1) m_decorations = m_decorations | TextDecorations::Underline;
                if (line & 4) m_decorations = m_decorations | TextDecorations::Strikethrough;
            }
            m_text.TextDecorations(m_decorations);
        }
        if (m_lineHeightMultiplier > 0.0)
        {
            m_text.LineHeight(m_lineHeightMultiplier * m_text.FontSize());
            m_text.LineStackingStrategy(mux::LineStackingStrategy::BlockLineHeight);
        }
        {
            const double fs = m_text.FontSize();
            m_text.CharacterSpacing(fs > 0.0 ? static_cast<int32_t>(std::lround(m_letterSpacingPx / fs * 1000.0)) : 0);
        }
        // TEXT_ALIGN value byte at 374: 1=left,2=right,3=center,4=justify,5=start,6=end. (The JS
        // TEXT_ALIGN_STATE offset overlaps this int32, so the value byte alone is the reliable source.)
        {
            mux::TextAlignment a = mux::TextAlignment::Left;
            switch (u8(374))
            {
            case 2: case 6: a = mux::TextAlignment::Right; break;
            case 3: a = mux::TextAlignment::Center; break;
            case 4: a = mux::TextAlignment::Justify; break;
            default: break;
            }
            m_text.TextAlignment(a);
        }

        RebuildInlines();
    }

    bool Text::RebuildInlines()
    {
        if (!m_text) return false;
        const double containerFs = m_fontSize > 0.0 ? m_fontSize : m_text.FontSize();
        const uint32_t containerColor = m_hasColor ? m_color : 0xFF000000;
        const auto family = m_text.FontFamily();
        const winrt::hstring familyName = family ? family.Source() : winrt::hstring{};

        std::vector<BuiltRun> next;
        next.reserve(m_runs.size());
        for (auto const& r : m_runs)
        {
            if (!r) continue;
            auto impl = winrt::get_self<implementation::TextNode>(r);
            BuiltRun b;
            b.isBreak = impl->IsBreak();
            if (!b.isBreak)
            {
                b.text = impl->RunText();
                b.color = impl->HasColor() ? impl->RunColor() : containerColor;
                b.fontSize = impl->HasFontSize() ? impl->RunFontSize() : containerFs;
                b.fontWeight = impl->HasFontWeight() ? impl->RunFontWeight() : m_fontWeight;
                b.letterSpacing = impl->RunLetterSpacing() != 0.0 ? impl->RunLetterSpacing() : m_letterSpacingPx;
                b.decorations = m_decorations;
            }
            next.push_back(std::move(b));
        }
        if (m_builtValid && next == m_builtRuns && familyName == m_builtFamily) return false;

        auto inlines = m_text.Inlines();
        inlines.Clear();
        for (auto const& b : next)
        {
            if (b.isBreak)
            {
                inlines.Append(muxd::LineBreak());
                continue;
            }
            muxd::Run run;
            run.Text(b.text);
            run.FontFamily(family);
            run.Foreground(muxm::SolidColorBrush(ColorFromArgb(b.color)));
            if (b.fontSize > 0.0) run.FontSize(b.fontSize);
            if (b.fontWeight > 0) run.FontWeight(winrt::Windows::UI::Text::FontWeight{ static_cast<uint16_t>(b.fontWeight) });
            if (b.letterSpacing != 0.0 && b.fontSize > 0.0) run.CharacterSpacing(static_cast<int32_t>(std::lround(b.letterSpacing / b.fontSize * 1000.0)));
            run.TextDecorations(b.decorations);
            inlines.Append(run);
        }
        m_builtRuns = std::move(next);
        m_builtFamily = familyName;
        m_builtValid = true;
        return true;
    }

    void Text::InvalidateText()
    {
        m_minContent->valid = false;
        if (m_node) m_node.MarkDirty();
        InvalidateMeasure();
        InvalidateLayoutRootFromHere();
    }

    void Text::InvalidateLayoutRootFromHere()
    {
        auto cur = get_strong().try_as<mux::FrameworkElement>();
        while (cur)
        {
            if (auto el = cur.try_as<nsm::IMasonElement>())
            {
                if (auto node = el.Node()) node.MarkDirty();
                cur.InvalidateMeasure();
                cur.InvalidateArrange();
            }
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<mux::FrameworkElement>() : nullptr;
        }
    }

    Size Text::MeasureOverride(Size const& available)
    {
        if (!m_text) return Size{ 0, 0 };
        m_text.Measure(available);
        return m_text.DesiredSize();
    }

    Size Text::ArrangeOverride(Size const& finalSize)
    {
       
        if (m_text) m_text.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        mason_visual::Apply(get_strong().as<mux::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
