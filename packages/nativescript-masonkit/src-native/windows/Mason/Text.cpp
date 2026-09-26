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
#include <unordered_map>
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

    
    // Width for a Taffy measure request: the known width, else 0 for MinContent (-1), else the definite
    // available width (text wraps to fit it, as CSS fit-content does), else infinity for MaxContent.
    inline float ResolveWidth(float known, float available)
    {
        if (known > 0.0f && std::isfinite(known)) return known;
        if (available < 0.0f && available > -1.5f) return 0.0f; // MinContent
        if (available > 0.0f && std::isfinite(available)) return available;
        return std::numeric_limits<float>::infinity();
    }

    // XAML rounds DesiredSize to the nearest device pixel, so a line can be up to half a pixel wider
    // than the width it reports, and laying it out at that width breaks its last word.
    float OnePixel(mux::UIElement const& element)
    {
        const float scale = mason_visual::RasterScale(element);
        return scale > 0.0f ? 1.0f / scale : 1.0f;
    }

    bool IsBreakOpportunity(wchar_t c)
    {
        return c == L' ' || c == L'\t' || c == L'\n' || c == L'\r' || c == 0x200B;
    }

    bool HasBreakOpportunity(muxc::TextBlock const& text)
    {
        for (auto const& inl : text.Inlines())
        {
            auto run = inl.try_as<muxd::Run>();
            if (!run) return true;
            for (wchar_t c : std::wstring_view{ run.Text() })
            {
                if (IsBreakOpportunity(c) || c == L'-') return true;
            }
        }
        return false;
    }

    muxc::TextBlock* ProbeBlock()
    {
        // Never destroyed: releasing a XAML object after the thread's XAML shuts down crashes.
        struct Probe { muxc::TextBlock block; };
        thread_local Probe* holder = nullptr;
        if (!holder)
        {
            holder = new Probe{ muxc::TextBlock() };
            holder->block.TextWrapping(mux::TextWrapping::NoWrap);
        }
        return &holder->block;
    }

    // CSS min-content is the widest unbreakable segment. XAML clamps DesiredSize to the offered width,
    // so the segments go on their own lines of a detached, unwrapped probe, measured once.
    float LaidOutMinContentWidth(muxc::TextBlock const& text)
    {
        muxc::TextBlock* probe = ProbeBlock();
        probe->FontFamily(text.FontFamily());
        probe->FontSize(text.FontSize());
        probe->FontWeight(text.FontWeight());
        probe->FontStyle(text.FontStyle());
        probe->CharacterSpacing(text.CharacterSpacing());
        auto pieces = probe->Inlines();
        pieces.Clear();

        const float inf = std::numeric_limits<float>::infinity();
        bool lineHasText = false;
        auto flush = [&]()
        {
            if (!lineHasText) return;
            pieces.Append(muxd::LineBreak());
            lineHasText = false;
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
                    lineHasText = true;
                }
                if (!end) flush();
                start = i + 1;
            }
        }
        if (pieces.Size() == 0) return 0.0f;
        probe->Measure(Size{ inf, inf });
        const float widest = probe->DesiredSize().Width;
        pieces.Clear();
        return widest;
    }

    // Words repeat across texts and updates (labels, counters), so segment widths are kept per run
    // formatting and only unseen segments are laid out. Text whose segments cross runs is laid out.
    float MinContentWidth(muxc::TextBlock const& text)
    {
        thread_local std::unordered_map<std::wstring, float> widths;
        thread_local std::wstring probeFormat;
        if (widths.size() > 8192) widths.clear();

        struct Piece { std::wstring format; muxd::Run run; };
        std::vector<Piece> runs;
        bool openSegment = false;
        for (auto const& inl : text.Inlines())
        {
            auto run = inl.try_as<muxd::Run>();
            if (!run)
            {
                openSegment = false;
                continue;
            }
            const std::wstring_view chars{ run.Text() };
            if (chars.empty()) continue;
            if (openSegment && !IsBreakOpportunity(chars.front()))
            {
                probeFormat.clear();
                return LaidOutMinContentWidth(text);
            }
            openSegment = !IsBreakOpportunity(chars.back());
            const auto family = run.FontFamily();
            runs.push_back({ std::wstring(family ? std::wstring_view(family.Source()) : std::wstring_view{}) + L'|'
                + std::to_wstring(run.FontSize()) + L'|' + std::to_wstring(run.FontWeight().Weight) + L'|'
                + std::to_wstring(static_cast<int>(run.FontStyle())) + L'|' + std::to_wstring(run.CharacterSpacing()), run });
        }

        muxc::TextBlock* probe = ProbeBlock();
        const float inf = std::numeric_limits<float>::infinity();
        float widest = 0.0f;
        for (auto const& piece : runs)
        {
            const winrt::hstring content = piece.run.Text();
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
                    std::wstring key = piece.format;
                    key += L'\x1f';
                    key.append(chars.substr(start, stop - start));
                    auto it = widths.find(key);
                    if (it == widths.end())
                    {
                        if (probeFormat != piece.format)
                        {
                            probe->FontFamily(piece.run.FontFamily());
                            probe->FontSize(piece.run.FontSize());
                            probe->FontWeight(piece.run.FontWeight());
                            probe->FontStyle(piece.run.FontStyle());
                            probe->CharacterSpacing(piece.run.CharacterSpacing());
                            probeFormat = piece.format;
                        }
                        probe->Text(winrt::hstring{ chars.substr(start, stop - start) });
                        probe->Measure(Size{ inf, inf });
                        it = widths.emplace(std::move(key), probe->DesiredSize().Width).first;
                    }
                    widest = (std::max)(widest, it->second);
                }
                start = i + 1;
            }
        }
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
        
        m_node = m_engine.CreateTextNode(false);
        m_text = muxc::TextBlock();
        m_text.Foreground(muxm::SolidColorBrush(winrt::Windows::UI::Color{ 255, 0, 0, 0 }));
        m_text.FontFamily(muxm::FontFamily(L"Segoe UI"));
        m_text.FontSize(14.0);
        // CSS breaks only at break opportunities and lets a longer word overflow; Wrap breaks inside it.
        m_text.TextWrapping(mux::TextWrapping::WrapWholeWords);
        Children().Append(m_text);

        auto weak = winrt::make_weak(m_text);
        auto cache = m_measureCache;
        nsm::MeasureFunc cb = [weak, cache](float kw, float, float aw, float) -> int64_t
        {
            auto t = weak.get();
            if (!t) return mason_leaf::PackMeasure(0.0f, 0.0f);
            auto& c = *cache;
            const float inf = std::numeric_limits<float>::infinity();
            if (!c.queued)
            {
                c.queued = true;
                mason_leaf::t_afterCompute.push_back([cache, weak]()
                {
                    cache->queued = false;
                    auto block = weak.get();
                    auto node = cache->node.get();
                    if (!block || !node) return;
                    // Same constraint ArrangeOverride uses, so its measure is a no-op.
                    const float width = winrt::get_self<implementation::Node>(node)->LayoutWidth();
                    if (cache->SingleLineFits(width)) return;
                    block.Measure(Size{ width + OnePixel(block), std::numeric_limits<float>::infinity() });
                    cache->laidOutWidth = width;
                });
            }
            // Height is the result, never a constraint: a TextBlock measured shorter than a line drops
            // the line. Taffy applies a known height itself.
            auto layout = [&](float width) -> Size
            {
                t.Measure(Size{ width + OnePixel(t), inf });
                c.laidOutWidth = width;
                return t.DesiredSize();
            };
            auto maxContent = [&]() -> Size
            {
                if (!c.maxValid)
                {
                    c.max = layout(inf);
                    c.maxValid = true;
                }
                return c.max;
            };

            float width = ResolveWidth(kw, aw);
            const bool minContentRequest = width == 0.0f;
            if (minContentRequest)
            {
                if (!c.minValid)
                {
                    if (c.breaks < 0) c.breaks = HasBreakOpportunity(t) ? 1 : 0;
                    if (c.breaks)
                    {
                        c.minWidth = MinContentWidth(t);
                    }
                    else
                    {
                        c.minWidth = maxContent().Width;
                    }
                    c.minValid = true;
                }
                width = c.minWidth;
            }

            Size d{ 0.0f, 0.0f };
            if (minContentRequest)
            {
                // Taffy takes the width for automatic minimums and measures again with the width
                // known if the text is placed at it, so whatever height is known stands in.
                d = { width, c.maxValid ? c.max.Height : (c.count ? c.entries[0].size.Height : 0.0f) };
            }
            else if (!std::isfinite(width) || (c.maxValid && width >= c.max.Width))
            {
                // Lines break greedily, so any width the single max-content line fits gives that line.
                d = maxContent();
            }
            else
            {
                // Laid out at the width itself, which is usually the width it's arranged at.
                bool hit = false;
                for (uint8_t k = 0; k < c.count; ++k)
                {
                    if (c.entries[k].width == width) { d = c.entries[k].size; hit = true; break; }
                }
                if (!hit)
                {
                    d = layout(width);
                    c.entries[c.next] = { width, d };
                    c.next = static_cast<uint8_t>((c.next + 1) % c.entries.size());
                    if (c.count < c.entries.size()) ++c.count;
                }
            }
            return mason_leaf::PackMeasure((std::min)(d.Width, width), d.Height);
        };
        m_node.SetMeasure(cb);
        m_measureCache->node = winrt::make_weak(m_node);
    }

    Text::~Text()
    {
        for (auto const& entry : m_runs) Detach(entry);
    }

    void Text::SyncStyle(winrt::hstring const&, winrt::hstring const&)
    {
        m_visual.styleDirty = true;
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
    void Text::FontSize(double value) { if (value > 0.0) { m_fontSize = value; if (m_text) m_text.FontSize(value); RequestRebuild(); } }

    void Text::SetFontFamily(hstring const& families)
    {
        const std::wstring resolved = ResolveFamily(std::wstring_view(families));
        m_fontFamily = winrt::hstring{ resolved };
        if (m_text)
        {
            m_text.FontFamily(muxm::FontFamily(resolved.empty() ? winrt::hstring{ L"Segoe UI" } : m_fontFamily));
        }
        RequestRebuild();
    }

    int32_t Text::ClampIndex(int32_t index) const
    {
        const auto size = static_cast<int32_t>(m_runs.size());
        return index < 0 || index > size ? size : index;
    }

    void Text::Detach(Entry const& entry)
    {
        if (entry.run) winrt::get_self<implementation::TextNode>(entry.run)->SetOwner(nullptr);
        if (entry.text) winrt::get_self<implementation::Text>(entry.text)->m_inlineOwner = nullptr;
    }

    void Text::SetRun(nsm::TextNode const& run, int32_t index)
    {
        if (!run) return;
        std::erase_if(m_runs, [&](Entry const& e) { return e.run == run; });
        m_runs.insert(m_runs.begin() + ClampIndex(index), Entry{ run, nullptr });
        winrt::get_self<implementation::TextNode>(run)->SetOwner(this);
        RequestRebuild();
    }

    void Text::RemoveRun(nsm::TextNode const& run)
    {
        if (!run) return;
        winrt::get_self<implementation::TextNode>(run)->SetOwner(nullptr);
        std::erase_if(m_runs, [&](Entry const& e) { return e.run == run; });
        RequestRebuild();
    }

    void Text::ClearRuns()
    {
        for (auto const& entry : m_runs) Detach(entry);
        m_runs.clear();
        RequestRebuild();
    }

    void Text::SetInlineText(nsm::Text const& child, int32_t index)
    {
        if (!child) return;
        auto impl = winrt::get_self<implementation::Text>(child);
        if (impl == this) return;
        std::erase_if(m_runs, [&](Entry const& e) { return e.text == child; });
        m_runs.insert(m_runs.begin() + ClampIndex(index), Entry{ nullptr, child });
        impl->m_inlineOwner = this;
        RequestRebuild();
    }

    void Text::RemoveInlineText(nsm::Text const& child)
    {
        if (!child) return;
        winrt::get_self<implementation::Text>(child)->m_inlineOwner = nullptr;
        std::erase_if(m_runs, [&](Entry const& e) { return e.text == child; });
        RequestRebuild();
    }

    void Text::OnRunChanged() { RequestRebuild(); }

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
        if (u8(345)) { m_fontStyle = u8(344); m_hasFontStyle = true; }        // FONT_STYLE_TYPE (0 normal, 1 italic, 2 oblique) / 345
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
            using winrt::Windows::UI::Text::FontStyle;
            m_text.FontStyle(m_fontStyle == 1 ? FontStyle::Italic : m_fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
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
            m_measureCache->startAligned = a == mux::TextAlignment::Left;
        }

        QueueRebuild();
    }

    Text::Resolved Text::Resolve(Resolved parent) const
    {
        if (m_hasColor) parent.color = m_color;
        if (m_fontSize > 0.0) parent.fontSize = m_fontSize;
        if (m_fontWeight > 0) parent.fontWeight = m_fontWeight;
        if (m_hasFontStyle) parent.fontStyle = m_fontStyle;
        if (m_letterSpacingPx != 0.0) parent.letterSpacing = m_letterSpacingPx;
        // Not inherited in CSS, but an ancestor's line is drawn through its descendants' text.
        parent.decorations = parent.decorations | m_decorations;
        if (!m_fontFamily.empty()) parent.family = m_fontFamily;
        return parent;
    }

    void Text::AppendRuns(Resolved const& format, std::vector<BuiltRun>& out) const
    {
        for (auto const& entry : m_runs)
        {
            if (entry.text)
            {
                auto child = winrt::get_self<implementation::Text>(entry.text);
                child->AppendRuns(child->Resolve(format), out);
                continue;
            }
            if (!entry.run) continue;
            auto impl = winrt::get_self<implementation::TextNode>(entry.run);
            BuiltRun b;
            b.isBreak = impl->IsBreak();
            if (!b.isBreak)
            {
                b.text = impl->RunText();
                b.format = format;
                if (impl->HasColor()) b.format.color = impl->RunColor();
                if (impl->HasFontSize()) b.format.fontSize = impl->RunFontSize();
                if (impl->HasFontWeight()) b.format.fontWeight = impl->RunFontWeight();
                if (impl->RunLetterSpacing() != 0.0) b.format.letterSpacing = impl->RunLetterSpacing();
            }
            out.push_back(std::move(b));
        }
    }

    bool Text::RebuildInlines()
    {
        if (!m_text) return false;
        Resolved defaults;
        defaults.fontSize = m_text.FontSize();
        const Resolved container = Resolve(defaults);
        std::vector<BuiltRun> next;
        next.reserve(m_runs.size());
        AppendRuns(container, next);
        if (m_builtValid && next == m_builtRuns) return false;

        // One run in the element's own formatting is plain text, set as TextBlock.Text the way core's
        // Label does: the TextBlock already carries that formatting, bar the colour.
        if (next.size() == 1 && !next.front().isBreak && next.front().format == container)
        {
            if (m_textForeground != container.color)
            {
                m_text.Foreground(mason_visual::SharedSolid(container.color));
                m_textForeground = container.color;
            }
            m_text.Text(next.front().text);
            m_builtRuns = std::move(next);
            m_builtValid = true;
            return true;
        }

        const auto containerFamily = m_text.FontFamily();
        std::vector<std::pair<winrt::hstring, muxm::FontFamily>> families;
        auto familyFor = [&](winrt::hstring const& name) -> muxm::FontFamily
        {
            if (name.empty()) return containerFamily;
            for (auto const& [key, value] : families)
            {
                if (key == name) return value;
            }
            return families.emplace_back(name, muxm::FontFamily(name)).second;
        };

        using winrt::Windows::UI::Text::FontStyle;
        auto inlines = m_text.Inlines();
        inlines.Clear();
        for (auto const& b : next)
        {
            if (b.isBreak)
            {
                inlines.Append(muxd::LineBreak());
                continue;
            }
            auto const& f = b.format;
            muxd::Run run;
            run.Text(b.text);
            run.FontFamily(familyFor(f.family));
            run.Foreground(mason_visual::SharedSolid(f.color));
            if (f.fontSize > 0.0) run.FontSize(f.fontSize);
            if (f.fontWeight > 0) run.FontWeight(winrt::Windows::UI::Text::FontWeight{ static_cast<uint16_t>(f.fontWeight) });
            run.FontStyle(f.fontStyle == 1 ? FontStyle::Italic : f.fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
            if (f.letterSpacing != 0.0 && f.fontSize > 0.0) run.CharacterSpacing(static_cast<int32_t>(std::lround(f.letterSpacing / f.fontSize * 1000.0)));
            run.TextDecorations(f.decorations);
            inlines.Append(run);
        }
        m_builtRuns = std::move(next);
        m_builtValid = true;
        return true;
    }

    void Text::QueueRebuild()
    {
        if (m_inlinesDirty) return;
        m_inlinesDirty = true;
        mason_leaf::t_beforeCompute.push_back([weak = get_weak()]()
        {
            if (auto self = weak.get()) self->FlushRebuild();
        });
    }

    void Text::RequestRebuild()
    {
        QueueRebuild();
        InvalidateText();
    }

    void Text::FlushRebuild()
    {
        if (!m_inlinesDirty) return;
        m_inlinesDirty = false;
        RebuildInlines();
    }

    void Text::InvalidateText()
    {
        m_measureCache->Reset();
        if (m_inlineOwner)
        {
            m_inlineOwner->RequestRebuild();
            return;
        }
        if (m_node) m_node.MarkDirty();
        InvalidateMeasure();
        InvalidateLayoutRootFromHere();
    }

    void Text::InvalidateLayoutRootFromHere()
    {
        // The engine marks the node's ancestors dirty itself; XAML needs every Mason ancestor
        // invalidated so the layout root re-runs compute and each level re-arranges.
        auto cur = get_strong().try_as<mux::FrameworkElement>();
        while (cur)
        {
            if (cur.try_as<nsm::IMasonElement>())
            {
                if (!mason_leaf::MarkInvalidated(winrt::get_abi(cur))) break;
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
        auto parent = Parent();
        if (parent && parent.try_as<nsm::IMasonElement>())
        {
            // The layout sizes this. Reporting XAML's wider measure would get it arranged wider than
            // its slot and clipped to it, dropping every line after the first.
            return Size{ 0, 0 };
        }
        FlushRebuild();
        m_text.Measure(available);
        return m_text.DesiredSize();
    }

    Size Text::ArrangeOverride(Size const& finalSize)
    {
        if (m_text)
        {
            // The layout's cache can answer the final size without calling measure, leaving the
            // TextBlock laid out for whichever probe ran last (often min-content), so lay it out for
            // the final width here, with the same pixel of slack.
            const float width = finalSize.Width + OnePixel(m_text);
            if (!m_measureCache->SingleLineFits(finalSize.Width))
            {
                m_text.Measure(Size{ width, std::numeric_limits<float>::infinity() });
                m_measureCache->laidOutWidth = finalSize.Width;
            }
            m_text.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, width, finalSize.Height });
        }
        mason_visual::Apply(get_strong().as<mux::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
