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
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <winrt/Microsoft.UI.Input.h>
#include <winrt/Windows.System.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/NativeScript.FontManager.h>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <winrt/Windows.UI.ViewManagement.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <vector>
#include <cwctype>
#include "Invalidation.h"
#include "VisualApply.h"
#include "BufferUtil.h"
#include "TextAtlas.h"
#include "TextAutomationPeer.h"
#include "Css.h"
#include "Events.h"
#include "Node.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxd = winrt::Microsoft::UI::Xaml::Documents;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;
    namespace muxi = winrt::Microsoft::UI::Xaml::Input;

    
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

    bool HasBreakOpportunity(std::vector<winrt::NativeScript::Mason::implementation::MinContentRun> const& runs)
    {
        for (auto const& run : runs)
        {
            if (run.isBreak) return true;
            for (wchar_t c : std::wstring_view{ run.text })
            {
                if (IsBreakOpportunity(c) || c == L'-') return true;
            }
        }
        return false;
    }

    bool g_directWrite = true;

    winrt::NativeScript::Mason::Node NodeOfBox(mux::UIElement const& box)
    {
        if (auto element = box.try_as<winrt::NativeScript::Mason::IMasonElement>()) return element.Node();
        if (auto scroller = box.try_as<muxc::ScrollViewer>())
        {
            if (auto content = scroller.Content().try_as<winrt::NativeScript::Mason::IMasonElement>()) return content.Node();
        }
        return nullptr;
    }

    bool DisplayNone(winrt::NativeScript::Mason::Node const& node)
    {
        if (!node) return false;
        uint32_t len = 0;
        const uint8_t* d = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->StyleData(len);
        return d && len > 0 && d[0] == 0;
    }

    float BoxBaseline(uint8_t align, float offset, bool percent, float height, float ascent, float descent, float lineHeight)
    {
        switch (align)
        {
        case 1:
        case 2: return ascent;
        case 3: return height * 0.5f + ascent * 0.25f;
        case 4:
        case 5:
        case 6: return height - descent;
        case 7: return height + ascent * 0.5f;
        default: return height + (percent ? lineHeight * offset / 100.0f : offset);
        }
    }

    // Taffy asks one leaf for several widths per pass, so answers are kept until the text changes.
    // `layout(width)` lays the text out at a width, infinity for max-content; `minWidth` gives
    // min-content, with max-content to fall back on.
    template <typename Cache, typename LayOutAt, typename MinWidth>
    Size AnswerMeasure(Cache& c, float kw, float aw, LayOutAt const& layout, MinWidth const& minWidth)
    {
        const float inf = std::numeric_limits<float>::infinity();
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
                c.minWidth = minWidth(maxContent);
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
        return { (std::min)(d.Width, width), d.Height };
    }

    // A line may be up to half a device pixel wider than the rounded width the layout gives it, so
    // text is laid out a pixel wider than that.
    float SlackFor(float scale)
    {
        return scale > 0.0f ? 1.0f / scale : 1.0f;
    }

    DWRITE_FONT_WEIGHT WeightOf(int32_t weight)
    {
        return static_cast<DWRITE_FONT_WEIGHT>(weight > 0 ? weight : 400);
    }

    DWRITE_FONT_STYLE StyleOf(uint8_t style)
    {
        return style == 1 ? DWRITE_FONT_STYLE_ITALIC : style == 2 ? DWRITE_FONT_STYLE_OBLIQUE : DWRITE_FONT_STYLE_NORMAL;
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
    float MinContentWidth(muxc::TextBlock const& text, std::vector<winrt::NativeScript::Mason::implementation::MinContentRun> const& runs)
    {
        thread_local std::unordered_map<std::wstring, float> widths;
        thread_local std::wstring probeFormat;
        thread_local std::wstring key;
        if (widths.size() > 8192) widths.clear();

        bool openSegment = false;
        for (auto const& run : runs)
        {
            if (run.isBreak)
            {
                openSegment = false;
                continue;
            }
            const std::wstring_view chars{ run.text };
            if (chars.empty()) continue;
            if (openSegment && !IsBreakOpportunity(chars.front()))
            {
                probeFormat.clear();
                return LaidOutMinContentWidth(text);
            }
            openSegment = !IsBreakOpportunity(chars.back());
        }

        muxc::TextBlock* probe = ProbeBlock();
        const float inf = std::numeric_limits<float>::infinity();
        float widest = 0.0f;
        for (auto const& piece : runs)
        {
            if (piece.isBreak) continue;
            const std::wstring_view chars{ piece.text };
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
                    key.assign(piece.format);
                    key += L'\x1f';
                    key.append(chars.substr(start, stop - start));
                    auto it = widths.find(key);
                    if (it == widths.end())
                    {
                        if (probeFormat != piece.format)
                        {
                            using winrt::Windows::UI::Text::FontStyle;
                            probe->FontFamily(muxm::FontFamily(piece.family));
                            probe->FontSize(piece.fontSize);
                            probe->FontWeight(winrt::Windows::UI::Text::FontWeight{ piece.fontWeight });
                            probe->FontStyle(piece.fontStyle == 1 ? FontStyle::Italic : piece.fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
                            probe->CharacterSpacing(piece.characterSpacing);
                            probeFormat = piece.format;
                        }
                        probe->Text(winrt::hstring{ chars.substr(start, stop - start) });
                        probe->Measure(Size{ inf, inf });
                        it = widths.emplace(key, probe->DesiredSize().Width).first;
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

    // Every live Text: a window's scale, the system text size and a newly loaded font reach them all,
    // on screen or not.
    std::unordered_set<winrt::NativeScript::Mason::implementation::Text*>& LiveTexts()
    {
        static auto* texts = new std::unordered_set<winrt::NativeScript::Mason::implementation::Text*>();
        return *texts;
    }

    void RefreshTexts(winrt::NativeScript::Mason::implementation::Text::Change change)
    {
        std::vector<winrt::NativeScript::Mason::implementation::Text*> texts(LiveTexts().begin(), LiveTexts().end());
        for (auto* text : texts) text->Refresh(change);
    }

    // FontManager's loaded faces as (lower-case family, FontUri). It registers nothing with the
    // system, so a face is only reachable through its URI.
    uint64_t g_fontGeneration = 0;

    std::vector<std::pair<std::wstring, std::wstring>> const& LoadedFaces()
    {
        struct Cache
        {
            uint64_t generation{ ~0ull };
            uint32_t size{ ~0u };
            std::vector<std::pair<std::wstring, std::wstring>> faces;
        };
        static auto* cache = new Cache();
        try
        {
            auto set = winrt::NativeScript::FontManager::FontFaceSet::Instance();
            const uint32_t size = set ? set.Size() : 0;
            if (cache->generation == g_fontGeneration && cache->size == size) return cache->faces;
            cache->generation = g_fontGeneration;
            cache->size = size;
            cache->faces.clear();
            if (!set) return cache->faces;
            for (auto const& face : set.GetArray())
            {
                if (!face) continue;
                std::wstring uri{ face.FontUri() };
                if (!uri.empty()) cache->faces.emplace_back(ToLower(std::wstring_view(face.Family())), std::move(uri));
            }
        }
        catch (...)
        {
            cache->faces.clear();
        }
        return cache->faces;
    }

    // The faces texts were last resolved against.
    size_t g_resolvedFaces = 0;

    size_t FacesFingerprint()
    {
        size_t hash = 0;
        for (auto const& [family, uri] : LoadedFaces()) hash = hash * 31 + std::hash<std::wstring>{}(family + L"|" + uri);
        return hash;
    }

    void RefreshFonts()
    {
        ++g_fontGeneration;
        const size_t now = FacesFingerprint();
        if (now == g_resolvedFaces) return;
        g_resolvedFaces = now;
        RefreshTexts(winrt::NativeScript::Mason::implementation::Text::Change::Fonts);
    }

    void WatchFontLoads()
    {
        static bool watching = false;
        if (watching) return;
        watching = true;
        try
        {
            auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
            auto set = winrt::NativeScript::FontManager::FontFaceSet::Instance();
            if (!queue || !set) return;
            // A face added or removed, or one finishing its load; raised on the thread that did it.
            set.Changed([queue](auto&&, auto&&)
            {
                queue.TryEnqueue([] { RefreshFonts(); });
            });
        }
        catch (...) {}
    }

    bool IsGenericFamily(std::wstring const& lower)
    {
        static const wchar_t* generic[] = { L"serif", L"sans-serif", L"monospace", L"cursive", L"fantasy", L"system-ui", L"ui-serif",
            L"ui-sans-serif", L"ui-monospace", L"ui-rounded", L"-apple-system", L"emoji", L"math", L"fangsong" };
        return std::any_of(std::begin(generic), std::end(generic), [&](const wchar_t* g) { return lower == g; });
    }

    // A CSS font-family list as one XAML font source: the first family that exists, a FontManager
    // family becoming the URIs of its loaded faces. Empty input yields "".
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

        WatchFontLoads();
        auto const& loaded = LoadedFaces();
        for (auto const& tok : tokens)
        {
            const std::wstring lower = ToLower(tok);
            std::wstring sources;
            for (auto const& [family, uri] : loaded)
            {
                if (family != lower) continue;
                if (!sources.empty()) sources += L", ";
                sources += uri;
            }
            if (!sources.empty()) return sources;
            if (IsGenericFamily(lower)) return MapGenericFamily(tok);
            if (tok.find(L':') != std::wstring::npos || mason_dwrite::SystemHasFamily(tok)) return tok;
        }
        return MapGenericFamily(tokens.front());
    }

    // UISettings.TextScaleFactor, the Windows "Text size" setting.
    double g_textScale = 1.0;
    bool g_textScaleEnabled = true;

    void WatchTextScale()
    {
        static bool watching = false;
        if (watching) return;
        watching = true;
        try
        {
            // Kept for the process: the event only fires while it lives.
            struct Holder { winrt::Windows::UI::ViewManagement::UISettings settings; };
            static auto* held = new Holder();
            auto& settings = held->settings;
            g_textScale = settings.TextScaleFactor();
            auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
            if (!queue) return;
            // Raised off the UI thread.
            settings.TextScaleFactorChanged([queue](winrt::Windows::UI::ViewManagement::UISettings const& sender, auto&&)
            {
                const double factor = sender.TextScaleFactor();
                queue.TryEnqueue([factor]
                {
                    if (factor == g_textScale) return;
                    g_textScale = factor;
                    RefreshTexts(winrt::NativeScript::Mason::implementation::Text::Change::TextSize);
                });
            });
        }
        catch (...) {}
    }

    // WinUI's TextFormatting::GetScaledFontSize: larger text grows less.
    float ScaledFontSize(double size)
    {
        if (!g_textScaleEnabled || g_textScale == 1.0 || size <= 0.0) return static_cast<float>(size);
        const double s = (std::max)(size, 1.0);
        return static_cast<float>(s + (std::max)(18.0 - std::exp(1.0) * std::log(s), 0.0) * (g_textScale - 1.0));
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    bool Text::DirectWrite() { return g_directWrite; }
    void Text::DirectWrite(bool value) { g_directWrite = value; }

    bool Text::IsTextScaleFactorEnabled() { return g_textScaleEnabled; }
    void Text::IsTextScaleFactorEnabled(bool value)
    {
        if (value == g_textScaleEnabled) return;
        g_textScaleEnabled = value;
        RefreshTexts(Change::TextSize);
    }

    Text::Text()
    {
        Init(nsm::Mason::Instance().CreateTextNode(false));
    }

    Text::Text(ButtonTag) : m_isButton(true)
    {
        Init(nsm::Mason::Instance().CreateButtonNode());
        IsTabStop(true);
        UseSystemFocusVisuals(true);

        // Handled events too: a gesture handler may claim the pointer.
        auto pressed = muxi::PointerEventHandler([this](auto&&, auto&&) { AnimatePress(true); });
        auto released = muxi::PointerEventHandler([this](auto&&, auto&&) { AnimatePress(false); });
        AddHandler(mux::UIElement::PointerPressedEvent(), winrt::box_value(pressed), true);
        AddHandler(mux::UIElement::PointerReleasedEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerCanceledEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerCaptureLostEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerExitedEvent(), winrt::box_value(released), true);

        // As XAML buttons: Enter activates on key down, Space on release.
        KeyDown([this](auto&&, muxi::KeyRoutedEventArgs const& e)
        {
            if (e.Key() == winrt::Windows::System::VirtualKey::Enter)
            {
                e.Handled(true);
                RaiseInvoked();
            }
            else if (e.Key() == winrt::Windows::System::VirtualKey::Space)
            {
                e.Handled(true);
                AnimatePress(true);
            }
        });
        KeyUp([this](auto&&, muxi::KeyRoutedEventArgs const& e)
        {
            if (e.Key() != winrt::Windows::System::VirtualKey::Space || !m_pressed) return;
            e.Handled(true);
            AnimatePress(false);
            RaiseInvoked();
        });
        LostFocus([this](auto&&, auto&&) { AnimatePress(false); });
    }

    void Text::RaiseInvoked()
    {
        m_invoked(*this, mux::RoutedEventArgs());
        nsm::Text self = *this;
        mason_events::Dispatch(self, L"click", true);
    }

    // 0.98 while held, as on iOS; dimmed unless :active is styled.
    void Text::AnimatePress(bool pressed)
    {
        if (pressed == m_pressed) return;
        m_pressed = pressed;
        auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(*this);
        auto compositor = visual.Compositor();
        auto size = ActualSize();
        visual.CenterPoint({ size.x / 2.0f, size.y / 2.0f, 0.0f });

        const float scale = pressed ? 0.98f : 1.0f;
        auto scaleAnimation = compositor.CreateVector3KeyFrameAnimation();
        scaleAnimation.InsertKeyFrame(1.0f, { scale, scale, 1.0f });
        scaleAnimation.Duration(std::chrono::milliseconds(80));
        visual.StartAnimation(L"Scale", scaleAnimation);

        auto opacityAnimation = compositor.CreateScalarKeyFrameAnimation();
        opacityAnimation.InsertKeyFrame(1.0f, pressed && m_dimsWhenPressed ? 0.85f : 1.0f);
        opacityAnimation.Duration(std::chrono::milliseconds(80));
        visual.StartAnimation(L"Opacity", opacityAnimation);
    }

    nsm::Text Text::CreateButton()
    {
        return winrt::make<Text>(ButtonTag{});
    }

    void Text::Init(nsm::Node const& node)
    {
        m_engine = nsm::Mason::Instance();
        m_node = node;
        m_direct = g_directWrite && mason_atlas::Available();
        if (m_direct) InitDirect();
        else InitTextBlock();
        m_measureCache->node = winrt::make_weak(m_node);
        WatchTextScale();
        if (!mason_visual::g_onScaleChanged) mason_visual::g_onScaleChanged = [] { RefreshTexts(Change::Scale); };
        LiveTexts().insert(this);
    }

    void Text::Refresh(Change change)
    {
        switch (change)
        {
        case Change::Scale:
            InvalidateText();
            break;
        case Change::TextSize:
            if (m_text) m_text.IsTextScaleFactorEnabled(g_textScaleEnabled);
            m_paragraphDirty = true;
            RequestRebuild();
            break;
        case Change::Fonts:
            if (!m_requestedFamily.empty()) ApplyFontFamily();
            break;
        }
    }

    void Text::InitDirect()
    {
        // The TextBlock made the text hit-testable; a transparent background does it now.
        Background(mason_visual::SharedSolid(0));
        auto cache = m_measureCache;
        nsm::MeasureFunc cb = [cache](float kw, float, float aw, float) -> int64_t
        {
            auto& c = *cache;
            RefreshBoxes(c);
            IDWriteTextLayout* layout = c.Layout();
            if (!layout) return mason_leaf::PackMeasure(0.0f, 0.0f);
            const float slack = SlackFor(mason_visual::g_computeScale);
            const Size d = AnswerMeasure(c, kw, aw,
                [layout, slack, &c](float width) -> Size
                {
                    // At the width it's drawn at, with the slack ArrangeDirect gives it.
                    const bool wrap = std::isfinite(width) && !c.noWrap;
                    const auto m = mason_dwrite::LayOut(layout, wrap ? width + slack : std::numeric_limits<float>::infinity());
                    return { m.width, m.height };
                },
                [layout, &c](auto const& maxContent) { return c.noWrap ? maxContent().Width : mason_dwrite::MinContentWidth(layout); });
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    void Text::InitTextBlock()
    {
        m_text = muxc::TextBlock();
        m_text.Foreground(muxm::SolidColorBrush(winrt::Windows::UI::Color{ 255, 0, 0, 0 }));
        m_text.FontFamily(muxm::FontFamily(L"Segoe UI"));
        m_text.FontSize(14.0);
        m_text.TextWrapping(mux::TextWrapping::NoWrap);
        m_text.IsTextScaleFactorEnabled(g_textScaleEnabled);
        Children().Append(m_text);

        auto weak = winrt::make_weak(m_text);
        auto cache = m_measureCache;
        nsm::MeasureFunc cb = [weak, cache](float kw, float, float aw, float) -> int64_t
        {
            auto t = weak.get();
            if (!t) return mason_leaf::PackMeasure(0.0f, 0.0f);
            auto& c = *cache;
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
                    LayOut(block, *cache, width);
                });
            }
            // Height is the result, never a constraint: a TextBlock measured shorter than a line drops
            // the line. Taffy applies a known height itself.
            const Size d = AnswerMeasure(c, kw, aw,
                [&](float width) -> Size
                {
                    LayOut(t, c, c.noWrap ? std::numeric_limits<float>::infinity() : width);
                    return t.DesiredSize();
                },
                [&](auto const& maxContent) -> float
                {
                    if (c.breaks < 0) c.breaks = !c.noWrap && HasBreakOpportunity(c.runs) ? 1 : 0;
                    return c.breaks ? MinContentWidth(t, c.runs) : maxContent().Width;
                });
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    void Text::SetWrap(muxc::TextBlock const& block, MeasureCache& cache, bool wrap)
    {
        // An unwrapped line doesn't depend on the width, so a max-content layout is arranged at any
        // wider width as is, where a wrapping TextBlock is formatted again. CSS breaks only at break
        // opportunities and lets a longer word overflow, which is WrapWholeWords, not Wrap.
        if (cache.wrap == wrap) return;
        block.TextWrapping(wrap ? mux::TextWrapping::WrapWholeWords : mux::TextWrapping::NoWrap);
        cache.wrap = wrap;
    }

    void Text::LayOut(muxc::TextBlock const& block, MeasureCache& cache, float width)
    {
        SetWrap(block, cache, std::isfinite(width) && !cache.noWrap);
        block.Measure(Size{ width + OnePixel(block), std::numeric_limits<float>::infinity() });
        cache.laidOutWidth = width;
    }

    Text::~Text()
    {
        LiveTexts().erase(this);
        for (auto const& entry : m_runs) Detach(entry);
        if (m_sprite) mason_atlas::Forget(m_sprite.get());
    }

    void Text::SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
    {
        m_visual.styleDirty = true;
        const auto dirty = mason_leaf::DirtyWords(d0, d1, d2, d3);
        if (m_listItem && mason_leaf::AnyDirty(dirty, mason_leaf::StateFlags({ { 47, 48 } })))
        {
            m_paragraphDirty = true;
            QueueRebuild();
        }
        if (!m_inlineOwner && !mason_leaf::AnyDirty(dirty, mason_leaf::kTextKeys))
        {
            mason_leaf::StyleSynced(get_strong().as<mux::UIElement>(), m_node, dirty);
            return;
        }
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

    hstring Text::ResolveFontFamily(hstring const& families)
    {
        return hstring{ ResolveFamily(std::wstring_view(families)) };
    }

    void Text::SetFontFamily(hstring const& families)
    {
        m_requestedFamily = families;
        ApplyFontFamily();
    }

    void Text::ApplyFontFamily()
    {
        const winrt::hstring resolved{ ResolveFamily(std::wstring_view(m_requestedFamily)) };
        if (resolved == m_fontFamily && m_builtValid) return;
        m_fontFamily = resolved;
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
        if (index >= 0 && index < static_cast<int32_t>(m_runs.size()) && m_runs[index].run == run) return;
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
        for (auto const& entry : m_runs)
        {
            if (entry.text)
            {
                auto impl = winrt::get_self<implementation::Text>(entry.text);
                impl->AdoptBoxes(TopHost(), impl);
            }
            if (entry.box) ReleaseBox(entry.box);
            Detach(entry);
        }
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
        auto* host = TopHost();
        impl->AdoptBoxes(impl, host);
        host->HookInput();
        RequestRebuild();
    }

    void Text::RemoveInlineText(nsm::Text const& child)
    {
        if (!child) return;
        auto impl = winrt::get_self<implementation::Text>(child);
        impl->AdoptBoxes(TopHost(), impl);
        impl->m_inlineOwner = nullptr;
        std::erase_if(m_runs, [&](Entry const& e) { return e.text == child; });
        RequestRebuild();
    }

    void Text::SetInlineBox(mux::UIElement const& child, int32_t index)
    {
        if (!child) return;
        std::erase_if(m_runs, [&](Entry const& e) { return e.box == child; });
        m_runs.insert(m_runs.begin() + ClampIndex(index), Entry{ nullptr, nullptr, child });
        auto* host = TopHost();
        host->HostBox(child);
        host->HookInput();
        RequestRebuild();
    }

    void Text::RemoveInlineBox(mux::UIElement const& child)
    {
        if (!child) return;
        std::erase_if(m_runs, [&](Entry const& e) { return e.box == child; });
        ReleaseBox(child);
        RequestRebuild();
    }

    Text* Text::TopHost()
    {
        Text* host = this;
        while (host->m_inlineOwner) host = host->m_inlineOwner;
        return host;
    }

    void Text::AdoptBoxes(Text* from, Text* to)
    {
        if (from == to) return;
        nsm::Text source = *from;
        for (auto const& entry : m_runs)
        {
            if (entry.box)
            {
                implementation::Css::RemoveChild(source, entry.box);
                to->HostBox(entry.box);
            }
            else if (entry.text)
            {
                winrt::get_self<implementation::Text>(entry.text)->AdoptBoxes(from, to);
            }
        }
    }

    void Text::HostBox(mux::UIElement const& box)
    {
        if (!m_direct && mason_atlas::Available())
        {
            uint32_t index = 0;
            if (m_text && Children().IndexOf(m_text, index)) Children().RemoveAt(index);
            m_text = nullptr;
            m_direct = true;
            m_builtValid = false;
            m_paragraphDirty = true;
            m_measureCache->Reset();
            InitDirect();
        }
        m_hostsBoxes = true;
        nsm::Text self = *this;
        implementation::Css::ReparentChild(self, box, -1);
    }

    void Text::ReleaseBox(mux::UIElement const& box)
    {
        nsm::Text host = *TopHost();
        implementation::Css::RemoveChild(host, box);
    }

    bool Text::IsHidden() const
    {
        return DisplayNone(m_node);
    }

    std::vector<mux::UIElement> Text::InlineBoxes() const
    {
        std::vector<mux::UIElement> boxes;
        for (auto const& piece : m_pieces)
        {
            if (piece.isBox) boxes.push_back(piece.element.as<mux::UIElement>());
        }
        return boxes;
    }

    void Text::OnRunChanged() { RequestRebuild(); }

    void Text::ApplyStyleFromBuffer()
    {
        if (!m_node) return;
        uint32_t len = 0;
        const uint8_t* d = winrt::get_self<implementation::Node>(m_node)->StyleData(len);
        if (!d) return;

        auto u8 = [&](uint32_t o) -> uint8_t { return o < len ? d[o] : 0; };
        auto i32 = [&](uint32_t o) -> int32_t { int32_t v = 0; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        auto u32 = [&](uint32_t o) -> uint32_t { uint32_t v = 0; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        auto f32 = [&](uint32_t o) -> float { float v = 0.0f; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };

        // Each prop: value at its offset, applied only if its *_STATE byte is set. Offsets per style.ts.
        m_hasColor = u8(328) != 0;                                           // FONT_COLOR / state 328
        if (m_hasColor) m_color = u32(324);
        if (u8(334)) { int32_t fs = i32(329); if (fs > 0) m_fontSize = static_cast<double>(fs); } // FONT_SIZE (dip) / 334
        if (u8(339)) { int32_t fw = i32(335); if (fw > 0) m_fontWeight = fw; } // FONT_WEIGHT / 339
        if (u8(345)) { m_fontStyle = u8(344); m_hasFontStyle = true; }        // FONT_STYLE_TYPE (0 normal, 1 italic, 2 oblique) / 345
        if (u8(367)) { m_letterSpacingPx = static_cast<double>(f32(363)); }  // LETTER_SPACING (px) / 367
        m_fontStretch = u8(592) ? i32(588) : 0;                              // FONT_STRETCH (% x 100) / 592
        m_hasWordSpacing = u8(587) && u8(586) != 1;                           // WORD_SPACING 582, type 586 (0 px, 2 normal) / 587
        m_wordSpacing = m_hasWordSpacing && u8(586) == 0 ? f32(582) : 0.0f;
        {
            auto* node = winrt::get_self<implementation::Node>(m_node);
            m_rtl = mason_node_get_direction(node->MasonPtr(), node->NodePtr()) != 0;
        }
        if (u8(388))                                                         // LINE_HEIGHT / state 388, type 389
        {
            const float lh = f32(384);
            m_lineHeightMultiplier = (u8(389) == 0) ? static_cast<double>(lh) : 0.0; // 0 = unitless multiplier, 1 = px
            m_lineHeightPx = (u8(389) != 0) ? static_cast<double>(lh) : 0.0;
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
            m_decoration = line < 8 ? line : 0;
            m_decorationStyle = u8(362) ? u8(361) : 0;
            m_hasDecorationColor = u8(360) != 0;
            m_decorationColor = m_hasDecorationColor ? u32(356) : 0;
            m_decorationThickness = u8(394) ? f32(390) : 0.0f;
            m_hasTransform = u8(373) != 0;
            m_transform = m_hasTransform ? u8(372) : 0;
            m_background = u32(348);
        }
        // TEXT_ALIGN value byte at 374. (The JS TEXT_ALIGN_STATE offset overlaps this int32, so the
        // value byte alone is the reliable source.)
        m_textAlign = u8(374);
        m_measureCache->startAligned = !m_rtl && m_textAlign != 2 && m_textAlign != 3 && m_textAlign != 4 && m_textAlign != 6;
        // WHITE_SPACE byte at 370 (1 pre, 4 nowrap) / 371, TEXT_WRAP at 368 (1 nowrap) / 369,
        // TEXT_OVERFLOW at 396 (1 ellipsis) / 397.
        m_measureCache->noWrap = (u8(371) && (u8(370) == 1 || u8(370) == 4)) || (u8(369) && u8(368) == 1);
        m_whiteSpace = u8(371) ? u8(370) : 0;
        m_ellipsis = u8(397) && u8(396) == 1;

        if (m_direct)
        {
            m_paragraphDirty = true;
            QueueRebuild();
            return;
        }
        if (!m_text) return;
        if (m_lineHeightPx > 0.0)
        {
            m_text.LineHeight(m_lineHeightPx);
            m_text.LineStackingStrategy(mux::LineStackingStrategy::BlockLineHeight);
        }
        if (m_fontSize > 0.0) m_text.FontSize(m_fontSize);
        if (m_fontWeight > 0) m_text.FontWeight(winrt::Windows::UI::Text::FontWeight{ static_cast<uint16_t>(m_fontWeight) });
        {
            using winrt::Windows::UI::Text::FontStyle;
            m_text.FontStyle(m_fontStyle == 1 ? FontStyle::Italic : m_fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
        }
        m_text.TextDecorations(m_decorations);
        m_text.TextTrimming(m_ellipsis && m_measureCache->noWrap ? mux::TextTrimming::CharacterEllipsis : mux::TextTrimming::None);
        if (m_lineHeightMultiplier > 0.0)
        {
            m_text.LineHeight(m_lineHeightMultiplier * m_text.FontSize());
            m_text.LineStackingStrategy(mux::LineStackingStrategy::BlockLineHeight);
        }
        {
            const double fs = m_text.FontSize();
            m_text.CharacterSpacing(fs > 0.0 ? static_cast<int32_t>(std::lround(m_letterSpacingPx / fs * 1000.0)) : 0);
        }
        m_text.FontStretch(static_cast<winrt::Windows::UI::Text::FontStretch>(mason_dwrite::StretchOf(m_fontStretch)));
        m_text.FlowDirection(m_rtl ? mux::FlowDirection::RightToLeft : mux::FlowDirection::LeftToRight);
        {
            mux::TextAlignment a = mux::TextAlignment::Left;
            switch (m_textAlign)
            {
            case 1: a = m_rtl ? mux::TextAlignment::Right : mux::TextAlignment::Left; break;
            case 2: a = m_rtl ? mux::TextAlignment::Left : mux::TextAlignment::Right; break;
            case 6: a = mux::TextAlignment::End; break;
            case 3: a = mux::TextAlignment::Center; break;
            case 4: a = mux::TextAlignment::Justify; break;
            default: a = mux::TextAlignment::Start; break;
            }
            m_text.TextAlignment(a);
        }

        QueueRebuild();
    }

    hstring Text::Transformed(hstring const& text, uint8_t transform)
    {
        if (transform == 0 || text.empty()) return text;
        std::wstring out(text);
        auto map = [](std::wstring& s, DWORD flags)
        {
            const int n = LCMapStringEx(LOCALE_NAME_USER_DEFAULT, flags, s.c_str(), static_cast<int>(s.size()), nullptr, 0, nullptr, nullptr, 0);
            if (n <= 0) return;
            std::wstring mapped(static_cast<size_t>(n), L'\0');
            LCMapStringEx(LOCALE_NAME_USER_DEFAULT, flags, s.c_str(), static_cast<int>(s.size()), mapped.data(), n, nullptr, nullptr, 0);
            s = std::move(mapped);
        };
        if (transform == 2) map(out, LCMAP_UPPERCASE | LCMAP_LINGUISTIC_CASING);
        else if (transform == 3) map(out, LCMAP_LOWERCASE | LCMAP_LINGUISTIC_CASING);
        else
        {
            bool start = true;
            for (auto& ch : out)
            {
                if (iswspace(ch)) start = true;
                else if (start)
                {
                    ch = towupper(ch);
                    start = false;
                }
            }
        }
        return hstring{ out };
    }

    void Text::SetTextShadow(hstring const& shadows)
    {
        std::vector<mason_dwrite::Shadow> parsed;
        const std::wstring_view spec = shadows;
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t end = spec.find(L';', pos);
            if (end == std::wstring_view::npos) end = spec.size();
            const std::wstring part(spec.substr(pos, end - pos));
            float inset = 0.0f, spread = 0.0f;
            double argb = 0.0;
            mason_dwrite::Shadow s;
            if (swscanf_s(part.c_str(), L"%f,%f,%f,%f,%f,%lf", &inset, &s.x, &s.y, &s.blur, &spread, &argb) == 6)
            {
                s.color = static_cast<uint32_t>(argb);
                if ((s.color >> 24) != 0) parsed.push_back(s);
            }
            pos = end + 1;
        }
        if (parsed == m_shadows) return;
        m_shadows = std::move(parsed);
        m_paragraphDirty = true;
        RequestRebuild();
    }

    void Text::SetFontFeatureSettings(hstring const& value)
    {
        const bool has = !value.empty() && value != L"normal";
        if (has == m_hasFeatures && value == m_features) return;
        m_hasFeatures = has;
        m_features = has ? value : hstring{};
        m_paragraphDirty = true;
        RequestRebuild();
    }

    Text::Resolved Text::Resolve(Resolved parent) const
    {
        if (m_hasColor) parent.color = m_color;
        if (m_fontSize > 0.0) parent.fontSize = m_fontSize;
        if (m_fontWeight > 0) parent.fontWeight = m_fontWeight;
        if (m_hasFontStyle) parent.fontStyle = m_fontStyle;
        if (m_letterSpacingPx != 0.0) parent.letterSpacing = m_letterSpacingPx;
        if (m_fontStretch > 0) parent.fontStretch = m_fontStretch;
        if (m_hasWordSpacing) parent.wordSpacing = m_wordSpacing;
        if (m_hasFeatures) parent.features = m_features;
        // Not inherited in CSS, but an ancestor's line is drawn through its descendants' text.
        parent.decorations = parent.decorations | m_decorations;
        if (m_decoration)
        {
            parent.decoration |= m_decoration;
            parent.decorationStyle = m_decorationStyle;
            parent.hasDecorationColor = m_hasDecorationColor;
            parent.decorationColor = m_decorationColor;
            parent.decorationThickness = m_decorationThickness;
        }
        if (m_hasTransform) parent.transform = m_transform;
        if (!m_fontFamily.empty()) parent.family = m_fontFamily;
        return parent;
    }

    void Text::AppendRuns(Resolved const& format, Text const* owner, std::vector<BuiltRun>& out) const
    {
        for (auto const& entry : m_runs)
        {
            if (entry.text)
            {
                auto child = winrt::get_self<implementation::Text>(entry.text);
                if (child->IsHidden()) continue;
                auto childFormat = child->Resolve(format);
                if ((child->m_background >> 24) != 0) childFormat.background = child->m_background;
                child->AppendRuns(childFormat, child, out);
                continue;
            }
            if (entry.box)
            {
                if (DisplayNone(NodeOfBox(entry.box))) continue;
                BuiltRun b;
                b.owner = owner;
                b.box = entry.box;
                out.push_back(std::move(b));
                continue;
            }
            if (!entry.run) continue;
            auto impl = winrt::get_self<implementation::TextNode>(entry.run);
            BuiltRun b;
            b.owner = owner;
            b.isBreak = impl->IsBreak();
            if (!b.isBreak)
            {
                b.text = Transformed(impl->RunText(), format.transform);
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
        if (!m_text && !m_direct) return false;
        Resolved defaults;
        defaults.fontSize = m_fontSize > 0.0 ? m_fontSize : 14.0;
        const Resolved container = Resolve(defaults);
        std::vector<BuiltRun> next;
        next.reserve(m_runs.size());
        AppendRuns(container, nullptr, next);
        if (!m_inlineOwner)
        {
            CollapseFlowSpaces(next);
            SyncBoxNodes(next);
        }
        m_insideMarker = m_listItem && !m_inlineOwner ? InsideMarker() : std::wstring{};
        if (!m_insideMarker.empty())
        {
            BuiltRun marker;
            marker.text = winrt::hstring{ m_insideMarker };
            marker.format = container;
            marker.format.decorations = winrt::Windows::UI::Text::TextDecorations::None;
            marker.format.decoration = 0;
            marker.format.background = 0;
            next.insert(next.begin(), std::move(marker));
        }
        if (m_direct)
        {
            if (m_builtValid && next == m_builtRuns && !m_paragraphDirty) return false;
            m_paragraphDirty = false;
            BuildParagraph(container, next);
            m_builtRuns = std::move(next);
            m_builtValid = true;
            return true;
        }
        if (m_builtValid && next == m_builtRuns) return false;
        StoreMinContentRuns(next);

        // One run in the element's own formatting is plain text, set as TextBlock.Text the way core's
        // Label does: the TextBlock already carries that formatting, bar the colour.
        if (next.size() == 1 && !next.front().isBreak && !next.front().box && next.front().format == container)
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
            if (b.box) continue;
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

    void Text::BuildParagraph(Resolved const& container, std::vector<BuiltRun> const& runs)
    {
        mason_dwrite::Paragraph p;
        p.font = mason_dwrite::ResolveFont(m_fontFamily.empty() ? std::wstring_view(L"Segoe UI") : std::wstring_view(m_fontFamily));
        p.fontSize = ScaledFontSize(container.fontSize);
        p.weight = WeightOf(container.fontWeight);
        p.style = StyleOf(container.fontStyle);
        p.color = container.color;
        p.stretch = mason_dwrite::StretchOf(container.fontStretch);
        p.rtl = m_rtl;
        switch (m_textAlign)
        {
        case 1: p.alignment = m_rtl ? DWRITE_TEXT_ALIGNMENT_TRAILING : DWRITE_TEXT_ALIGNMENT_LEADING; break;
        case 2: p.alignment = m_rtl ? DWRITE_TEXT_ALIGNMENT_LEADING : DWRITE_TEXT_ALIGNMENT_TRAILING; break;
        case 6: p.alignment = DWRITE_TEXT_ALIGNMENT_TRAILING; break;
        case 3: p.alignment = DWRITE_TEXT_ALIGNMENT_CENTER; break;
        case 4: p.alignment = DWRITE_TEXT_ALIGNMENT_JUSTIFIED; break;
        default: p.alignment = DWRITE_TEXT_ALIGNMENT_LEADING; break;
        }
        // A length line-height stays as it is, as XAML leaves LineHeight unscaled.
        p.lineHeight = static_cast<float>(m_lineHeightPx > 0.0 ? m_lineHeightPx : m_lineHeightMultiplier * p.fontSize);
        p.ellipsis = m_ellipsis && m_measureCache->noWrap;
        p.shadows = m_shadows;

        using winrt::Windows::UI::Text::TextDecorations;
        auto& c = *m_measureCache;
        std::vector<nsm::Node> boxNodes;
        std::vector<winrt::weak_ref<nsm::Text>> boxTexts;
        m_pieces.clear();
        for (auto const& b : runs)
        {
            if (b.box)
            {
                mason_dwrite::Box box;
                auto node = NodeOfBox(b.box);
                for (size_t i = 0; i < c.boxNodes.size() && i < c.paragraph.boxes.size(); ++i)
                {
                    if (node && c.boxNodes[i] == node)
                    {
                        box = c.paragraph.boxes[i];
                        break;
                    }
                }
                box.position = static_cast<uint32_t>(p.text.size());
                p.text += L'\uFFFC';
                p.boxes.push_back(box);
                boxNodes.push_back(node);
                auto boxText = b.box.try_as<nsm::Text>();
                boxTexts.push_back(boxText ? winrt::make_weak(boxText) : winrt::weak_ref<nsm::Text>{});
                m_pieces.push_back({ box.position, 1, b.box, true });
                continue;
            }
            if (b.isBreak)
            {
                p.text += L'\n';
                continue;
            }
            auto const& f = b.format;
            mason_dwrite::Span span;
            span.start = static_cast<uint32_t>(p.text.size());
            span.length = static_cast<uint32_t>(b.text.size());
            p.text += std::wstring_view(b.text);
            span.font = f.family.empty() ? p.font : mason_dwrite::ResolveFont(std::wstring_view(f.family));
            span.fontSize = f.fontSize > 0.0 ? ScaledFontSize(f.fontSize) : p.fontSize;
            span.weight = WeightOf(f.fontWeight);
            span.style = StyleOf(f.fontStyle);
            span.letterSpacing = static_cast<float>(f.letterSpacing);
            span.stretch = mason_dwrite::StretchOf(f.fontStretch);
            span.wordSpacing = f.wordSpacing;
            span.features = std::wstring(std::wstring_view(f.features));
            span.color = f.color;
            span.background = f.background;
            const bool plain = !(f.decoration & 2) && f.decorationStyle == 0 && !f.hasDecorationColor && f.decorationThickness <= 0.0f;
            if (plain)
            {
                span.underline = (f.decorations & TextDecorations::Underline) != TextDecorations::None;
                span.strikethrough = (f.decorations & TextDecorations::Strikethrough) != TextDecorations::None;
            }
            else
            {
                span.decoration = f.decoration;
                span.decorationStyle = f.decorationStyle;
                span.decorationColor = f.hasDecorationColor ? f.decorationColor : f.color;
                span.decorationThickness = f.decorationThickness;
            }
            if (b.owner && span.length > 0)
            {
                nsm::Text element = *const_cast<Text*>(b.owner);
                if (!m_pieces.empty() && !m_pieces.back().isBox && m_pieces.back().element == element
                    && m_pieces.back().start + m_pieces.back().length == span.start)
                {
                    m_pieces.back().length += span.length;
                }
                else
                {
                    m_pieces.push_back({ span.start, span.length, element, false });
                }
            }
            p.spans.push_back(std::move(span));
        }

        if (!boxNodes.empty())
        {
            const auto metrics = mason_dwrite::MetricsOf(p.font, mason_dwrite::MatchWeight(p.font, p.weight, p.style), p.style);
            c.ascent = metrics.ascent * p.fontSize;
            c.descent = metrics.descent * p.fontSize;
            c.lineHeight = p.lineHeight > 0.0f ? p.lineHeight : (metrics.ascent + metrics.descent + metrics.lineGap) * p.fontSize;
        }
        c.boxNodes = std::move(boxNodes);
        c.boxTexts = std::move(boxTexts);
        if (c.layout && c.paragraph == p) return;
        c.paragraph = std::move(p);
        c.layout = nullptr;
        ++c.version;
    }

    void Text::StoreMinContentRuns(std::vector<BuiltRun> const& runs)
    {
        const winrt::hstring containerFamily = m_fontFamily.empty() ? winrt::hstring{ L"Segoe UI" } : m_fontFamily;
        auto& out = m_measureCache->runs;
        out.clear();
        out.reserve(runs.size());
        for (auto const& b : runs)
        {
            if (b.box) continue;
            MinContentRun r;
            r.isBreak = b.isBreak;
            if (!b.isBreak)
            {
                auto const& f = b.format;
                r.text = b.text;
                r.family = f.family.empty() ? containerFamily : f.family;
                r.fontSize = f.fontSize > 0.0 ? f.fontSize : m_text.FontSize();
                r.fontWeight = static_cast<uint16_t>(f.fontWeight > 0 ? f.fontWeight : 400);
                r.fontStyle = f.fontStyle;
                r.characterSpacing = f.letterSpacing != 0.0 && r.fontSize > 0.0 ? static_cast<int32_t>(std::lround(f.letterSpacing / r.fontSize * 1000.0)) : 0;
                r.format = std::wstring(std::wstring_view(r.family)) + L'|' + std::to_wstring(r.fontSize) + L'|' + std::to_wstring(r.fontWeight) + L'|'
                    + std::to_wstring(r.fontStyle) + L'|' + std::to_wstring(r.characterSpacing);
            }
            out.push_back(std::move(r));
        }
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
        mason_leaf::StyleChanged(get_strong().as<mux::UIElement>(), m_node);
    }

    Size Text::MeasureOverride(Size const& available)
    {
        if (m_hostsBoxes)
        {
            for (auto const& child : Children())
            {
                if (!m_text || child != m_text) child.Measure(available);
            }
        }
        if (!m_text && !m_direct) return Size{ 0, 0 };
        auto parent = Parent();
        if (parent && parent.try_as<nsm::IMasonElement>())
        {
            // The layout sizes this. Reporting XAML's wider measure would get it arranged wider than
            // its slot and clipped to it, dropping every line after the first.
            return Size{ 0, 0 };
        }
        FlushRebuild();
        if (m_direct)
        {
            IDWriteTextLayout* layout = m_measureCache->Layout();
            if (!layout) return Size{ 0, 0 };
            const auto m = mason_dwrite::LayOut(layout, m_measureCache->noWrap ? std::numeric_limits<float>::infinity() : available.Width);
            return Size{ m.width, m.height };
        }
        SetWrap(m_text, *m_measureCache, std::isfinite(available.Width) && !m_measureCache->noWrap);
        m_text.Measure(available);
        return m_text.DesiredSize();
    }

    void Text::HideSprite()
    {
        if (!m_sprite) return;
        mason_atlas::Forget(m_sprite.get());
        m_drawnValid = false;
        if (m_spriteVisible && m_sprite->visual) m_sprite->visual.IsVisible(false);
        m_spriteVisible = false;
    }

    void Text::ArrangeDirect(Size const& finalSize)
    {
        FlushRebuild();
        auto& c = *m_measureCache;
        IDWriteTextLayout* layout = c.Layout();
        if (!layout || c.paragraph.text.empty())
        {
            HideSprite();
            return;
        }

        float left = 0.0f, top = 0.0f, right = 0.0f, bottom = 0.0f;
        auto* self = winrt::get_self<implementation::Node>(m_node);
        self->ContentInsets(left, top, right, bottom);
        const uint8_t vertical = mason_node_get_writing_mode(self->MasonPtr(), self->NodePtr());
        m_frame = { left, top, finalSize.Width - right, vertical };
        const float width = (std::max)(0.0f, vertical ? finalSize.Height - top - bottom : finalSize.Width - left - right);
        const float scale = mason_visual::RasterScale(get_strong().as<mux::UIElement>());
        const float slack = SlackFor(scale);
        const float inf = std::numeric_limits<float>::infinity();
        if (!c.maxValid)
        {
            const auto m = mason_dwrite::LayOut(layout, inf);
            c.max = { m.width, m.height };
            c.maxValid = true;
        }

        // An unwrapped line that fits needs no breaking, and a start-aligned one no box either, so it
        // keeps the unbounded width it was measured at. A line that can't wrap overflows, or is
        // trimmed at the box.
        const bool overflows = width + slack < c.max.Width;
        const bool wrap = overflows && !c.noWrap;
        const bool leading = c.paragraph.alignment == DWRITE_TEXT_ALIGNMENT_LEADING && !c.paragraph.rtl;
        const float maxWidth = wrap || (overflows && c.paragraph.ellipsis) ? width + slack : leading ? mason_dwrite::kUnbounded : width;
        mason_dwrite::Configure(layout, wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, maxWidth);
        DWRITE_TEXT_METRICS metrics{};
        DWRITE_OVERHANG_METRICS overhang{};
        layout->GetMetrics(&metrics);
        layout->GetOverhangMetrics(&overhang);

        // The ink in device pixels around the content box, a pixel of margin for antialiasing. The
        // element sits on whole pixels, so the slot does, and the layout keeps its fraction.
        // Along the lines (u) and across them (v), in the layout's frame:
        const float u0 = -overhang.left, u1 = maxWidth + overhang.right;
        const float v0 = -overhang.top, v1 = mason_dwrite::kUnbounded + overhang.bottom;
        float inkLeft = left + u0, inkTop = top + v0, inkRight = left + u1, inkBottom = top + v1;
        float layoutX = left;
        if (vertical == 1)
        {
            layoutX = m_frame.right;
            inkLeft = layoutX - v1;
            inkRight = layoutX - v0;
            inkTop = top + u0;
            inkBottom = top + u1;
        }
        else if (vertical == 2)
        {
            const float spill = (std::max)(0.0f, -v0);
            inkLeft = left - spill;
            inkRight = left + v1 + spill;
            inkTop = top + u0;
            inkBottom = top + u1;
        }
        if (!vertical)
        {
            const float l = inkLeft, t = inkTop, r = inkRight, b = inkBottom;
            for (auto const& s : c.paragraph.shadows)
            {
                const float grow = s.blur * 1.5f;
                inkLeft = (std::min)(inkLeft, l + s.x - grow);
                inkTop = (std::min)(inkTop, t + s.y - grow);
                inkRight = (std::max)(inkRight, r + s.x + grow);
                inkBottom = (std::max)(inkBottom, b + s.y + grow);
            }
            float decoration = 0.0f;
            for (auto const& span : c.paragraph.spans)
            {
                if (span.decoration) decoration = (std::max)(decoration, span.fontSize * 0.3f + span.decorationThickness * 2.0f);
            }
            inkTop -= decoration;
            inkBottom += decoration;
        }
        if (inkRight <= inkLeft || inkBottom <= inkTop || metrics.lineCount == 0)
        {
            HideSprite();
            return;
        }
        const int pxLeft = static_cast<int>(std::floor(inkLeft * scale)) - 1;
        const int pxTop = static_cast<int>(std::floor(inkTop * scale)) - 1;
        const int pxRight = static_cast<int>(std::ceil(inkRight * scale)) + 1;
        const int pxBottom = static_cast<int>(std::ceil(inkBottom * scale)) + 1;

        Drawn next;
        next.version = c.version;
        next.maxWidth = maxWidth;
        next.wrap = wrap;
        next.scale = scale;
        next.originX = layoutX - pxLeft / scale;
        next.originY = top - pxTop / scale;
        next.width = pxRight - pxLeft;
        next.height = pxBottom - pxTop;
        next.vertical = vertical;

        if (!m_sprite) m_sprite = std::make_unique<mason_atlas::Sprite>();
        auto& sprite = *m_sprite;
        if (!sprite.visual)
        {
            sprite.visual = mason_deco::ThreadCompositor().CreateSpriteVisual();
            mason_deco::SetLayer(get_strong().as<mux::UIElement>(), L"mason-text", sprite.visual);
            m_spriteVisible = true;
        }
        if (!m_spriteVisible)
        {
            sprite.visual.IsVisible(true);
            m_spriteVisible = true;
        }
        const winrt::Windows::Foundation::Numerics::float3 offset{ pxLeft / scale, pxTop / scale, 0.0f };
        const winrt::Windows::Foundation::Numerics::float2 size{ next.width / scale, next.height / scale };
        if (offset != m_spriteOffset)
        {
            sprite.visual.Offset(offset);
            m_spriteOffset = offset;
        }
        if (size != m_spriteSize)
        {
            sprite.visual.Size(size);
            m_spriteSize = size;
        }

        if (m_drawnValid && m_drawn == next && (sprite.page || sprite.queued)) return;
        m_drawn = next;
        m_drawnValid = true;
        sprite.layout = c.layout;
        sprite.wrapping = wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP;
        sprite.maxWidth = maxWidth;
        sprite.color = c.paragraph.color;
        sprite.colors.clear();
        for (auto const& span : c.paragraph.spans) sprite.colors.push_back({ DWRITE_TEXT_RANGE{ span.start, span.length }, span.color });
        sprite.extras.clear();
        for (auto const& span : c.paragraph.spans)
        {
            if ((span.background >> 24) != 0 || span.decoration) sprite.extras.push_back(span);
        }
        sprite.shadows = vertical ? std::vector<mason_dwrite::Shadow>{} : c.paragraph.shadows;
        sprite.originX = next.originX;
        sprite.originY = next.originY;
        sprite.vertical = vertical;
        sprite.width = next.width;
        sprite.height = next.height;
        sprite.scale = scale;
        mason_atlas::Queue(&sprite);
    }

    winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationPeer Text::OnCreateAutomationPeer()
    {
        // A TextBlock child speaks for itself, but not as a button.
        if (!m_direct && !m_isButton) return base_type::OnCreateAutomationPeer();
        return winrt::make<implementation::TextAutomationPeer>(get_strong().as<nsm::Text>());
    }

    winrt::hstring Text::AccessibleText() const
    {
        std::wstring text = m_measureCache->paragraph.text;
        std::erase(text, L'\uFFFC');
        return winrt::hstring{ text };
    }

    void Text::IsListItem(bool value)
    {
        if (m_listItem == value) return;
        m_listItem = value;
        m_paragraphDirty = true;
        RequestRebuild();
        InvalidateArrange();
    }

    bool Text::MarkerOf(uint8_t& type, int32_t& index, bool& inside) const
    {
        type = 0;
        index = 1;
        inside = false;
        auto parent = m_listItem ? Parent().try_as<muxc::Panel>() : nullptr;
        if (!parent) return false;
        for (auto const& child : parent.Children())
        {
            auto text = child.try_as<nsm::Text>();
            if (text && winrt::get_self<Text>(text) == this) break;
            if (text && winrt::get_self<Text>(text)->m_listItem) ++index;
        }
        auto byteOf = [](nsm::Node const& node, uint32_t value, uint32_t state, bool& set) -> uint8_t
        {
            uint32_t size = 0;
            const uint8_t* d = node ? winrt::get_self<implementation::Node>(node)->StyleData(size) : nullptr;
            set = d && size > state && d[state] != 0;
            return set ? d[value] : 0;
        };
        auto list = parent.try_as<nsm::IMasonElement>();
        auto listNode = list ? list.Node() : nullptr;
        bool set = false;
        type = byteOf(listNode, 317, 319, set);
        if (!set) type = byteOf(m_node, 317, 319, set);
        if (!set) type = mason_get_preflight() ? 0 : 2;
        uint8_t position = byteOf(m_node, 316, 318, set);
        if (!set) position = byteOf(listNode, 316, 318, set);
        inside = position == 1;
        return true;
    }

    std::wstring Text::InsideMarker() const
    {
        uint8_t type = 0;
        int32_t index = 1;
        bool inside = false;
        if (!MarkerOf(type, index, inside) || !inside) return {};
        switch (type)
        {
        case 2: return L"\u2022 ";
        case 3: return L"\u25E6 ";
        case 4: return L"\u25AA ";
        case 5: return std::to_wstring(index) + L". ";
        default: return {};
        }
    }

    void Text::SyncMarker(Size const& finalSize)
    {
        auto self = get_strong().as<mux::UIElement>();
        auto clear = [&]
        {
            if (m_marker) mason_deco::SetLayer(self, L"mason-marker", nullptr);
            m_marker = nullptr;
            m_markerKey.clear();
        };
        uint8_t type = 0;
        int32_t index = 1;
        bool inside = false;
        const bool listed = MarkerOf(type, index, inside);
        if (InsideMarker() != m_insideMarker && !m_markerRebuildQueued)
        {
            if (auto dispatcher = DispatcherQueue())
            {
                m_markerRebuildQueued = dispatcher.TryEnqueue([weak = get_weak()]
                {
                    if (auto strong = weak.get())
                    {
                        strong->m_markerRebuildQueued = false;
                        strong->m_paragraphDirty = true;
                        strong->RequestRebuild();
                    }
                });
            }
        }
        if (!listed || inside || type == 0 || finalSize.Width <= 0.0f)
        {
            clear();
            return;
        }

        const float fontSize = static_cast<float>(ScaledFontSize(m_fontSize > 0.0 ? m_fontSize : 14.0));
        const float line = m_lineHeightPx > 0.0 ? static_cast<float>(m_lineHeightPx)
            : m_lineHeightMultiplier > 0.0 ? static_cast<float>(m_lineHeightMultiplier) * fontSize : fontSize * 1.33f;
        float left = 0.0f, top = 0.0f, right = 0.0f, bottom = 0.0f;
        winrt::get_self<implementation::Node>(m_node)->ContentInsets(left, top, right, bottom);
        const float boxW = fontSize * 3.0f;
        const float boxH = (std::max)(line, fontSize * 1.4f);
        const float gap = fontSize * 0.5f;
        const uint32_t color = m_hasColor ? m_color : 0xFF000000;
        const float scale = mason_visual::RasterScale(self);
        auto comp = mason_deco::ThreadCompositor();
        auto* device = comp ? mason_mask::DeviceFor(comp) : nullptr;
        if (!device)
        {
            clear();
            return;
        }
        struct Key { uint8_t type; int32_t index; uint32_t color; float fontSize; float boxH; float scale; } key{ type, type == 5 ? index : 0, color, fontSize, boxH, scale };
        const std::string k = mason_mask::KeyOf('L', key);
        if (k != m_markerKey)
        {
            const float pxW = std::ceil(boxW * scale), pxH = std::ceil(boxH * scale), pxFont = fontSize * scale;
            auto brush = mason_mask::PaintedBrush(*device, k, pxW, pxH,
                [type, index, color, pxFont](ID2D1DeviceContext* context, float w, float h)
                {
                    winrt::com_ptr<ID2D1SolidColorBrush> paint;
                    context->CreateSolidColorBrush(mason_mask::Color(color), paint.put());
                    const float size = pxFont * 0.35f;
                    const float cy = h * 0.5f;
                    const float cx = w - size * 0.5f;
                    if (type == 2) context->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), size * 0.5f, size * 0.5f), paint.get());
                    else if (type == 3) context->DrawEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), size * 0.5f, size * 0.5f), paint.get(), (std::max)(1.0f, pxFont * 0.08f));
                    else if (type == 4) context->FillRectangle(D2D1::RectF(cx - size * 0.5f, cy - size * 0.5f, cx + size * 0.5f, cy + size * 0.5f), paint.get());
                    else
                    {
                        auto* factory = mason_dwrite::Factory();
                        winrt::com_ptr<IDWriteTextFormat> format;
                        if (!factory || FAILED(factory->CreateTextFormat(L"Segoe UI", nullptr, DWRITE_FONT_WEIGHT_NORMAL, DWRITE_FONT_STYLE_NORMAL,
                            DWRITE_FONT_STRETCH_NORMAL, pxFont, L"en-us", format.put()))) return;
                        format->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_TRAILING);
                        format->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
                        const std::wstring text = type == 5 ? std::to_wstring(index) + L"." : std::wstring(L"\u2022");
                        context->DrawText(text.c_str(), static_cast<UINT32>(text.size()), format.get(), D2D1::RectF(0, 0, w, h), paint.get());
                    }
                });
            if (!brush)
            {
                clear();
                return;
            }
            if (!m_marker)
            {
                m_marker = comp.CreateSpriteVisual();
                mason_deco::SetLayer(self, L"mason-marker", m_marker);
            }
            m_marker.Brush(brush);
            m_markerKey = k;
        }
        m_marker.Size({ boxW, boxH });
        m_marker.Offset({ -gap - boxW, top + line * 0.5f - boxH * 0.5f, 0.0f });
    }

    Size Text::ArrangeOverride(Size const& finalSize)
    {
        if (m_direct)
        {
            ArrangeDirect(finalSize);
        }
        else if (m_text)
        {
            // The layout's cache can answer the final size without calling measure, leaving the
            // TextBlock laid out for whichever probe ran last (often min-content), so lay it out for
            // the final width here, with the same pixel of slack.
            auto* self = winrt::get_self<implementation::Node>(m_node);
            const bool vertical = mason_node_get_writing_mode(self->MasonPtr(), self->NodePtr()) != 0;
            const float lineLength = vertical ? finalSize.Height : finalSize.Width;
            if (!m_measureCache->SingleLineFits(lineLength)) LayOut(m_text, *m_measureCache, lineLength);
            m_text.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, lineLength + OnePixel(m_text), vertical ? finalSize.Width : finalSize.Height });
            if (vertical || m_textTurned)
            {
                // Turned 90° clockwise, its first line on the right.
                muxm::MatrixTransform turn;
                if (vertical) turn.Matrix(muxm::Matrix{ 0.0, 1.0, -1.0, 0.0, finalSize.Width, 0.0 });
                m_text.RenderTransform(vertical ? turn : nullptr);
                m_textTurned = vertical;
            }
        }
        ArrangeBoxes();
        mason_visual::Apply(get_strong().as<mux::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        if (m_listItem || m_marker) SyncMarker(finalSize);
        return finalSize;
    }

    void Text::SyncBoxNodes(std::vector<BuiltRun> const& runs)
    {
        std::vector<nsm::Node> nodes;
        for (auto const& b : runs)
        {
            if (!b.box) continue;
            if (auto node = NodeOfBox(b.box)) nodes.push_back(node);
        }
        if (nodes == m_boxNodes) return;
        m_boxNodes = nodes;
        m_node.SetChildren(nodes);
    }

    void Text::CollapseFlowSpaces(std::vector<BuiltRun>& runs) const
    {
        if (m_whiteSpace != 0 && m_whiteSpace != 3 && m_whiteSpace != 4) return;
        bool afterSpace = true;
        for (auto& b : runs)
        {
            if (b.box)
            {
                afterSpace = false;
                continue;
            }
            if (b.isBreak)
            {
                afterSpace = true;
                continue;
            }
            const std::wstring_view chars{ b.text };
            bool state = afterSpace;
            bool drop = false;
            for (wchar_t ch : chars)
            {
                if (ch == L' ' && state)
                {
                    drop = true;
                    break;
                }
                state = ch == L' ' || ch == L'\n';
            }
            if (!drop)
            {
                afterSpace = state;
                continue;
            }
            std::wstring kept;
            kept.reserve(chars.size());
            for (wchar_t ch : chars)
            {
                if (ch == L' ' && afterSpace) continue;
                kept += ch;
                afterSpace = ch == L' ' || ch == L'\n';
            }
            b.text = winrt::hstring{ kept };
        }
    }

    bool Text::RefreshBoxes(MeasureCache& c)
    {
        if (c.boxNodes.empty()) return false;
        if (auto node = c.node.get())
        {
            auto* impl = winrt::get_self<implementation::Node>(node);
            c.writingMode = mason_node_get_writing_mode(impl->MasonPtr(), impl->NodePtr());
        }
        bool changed = false;
        const size_t count = (std::min)(c.boxNodes.size(), c.paragraph.boxes.size());
        for (size_t i = 0; i < count; ++i)
        {
            auto const& node = c.boxNodes[i];
            if (!node) continue;
            auto* impl = winrt::get_self<implementation::Node>(node);
            float width = 0.0f, height = 0.0f;
            mason_node_get_unrounded_size(impl->MasonPtr(), impl->NodePtr(), &width, &height);
            // VERTICAL_ALIGN: offset float at 297, is-percent byte at 301, keyword byte at 302.
            uint32_t len = 0;
            const uint8_t* d = impl->StyleData(len);
            uint8_t align = 0;
            float offset = 0.0f;
            bool percent = false;
            if (d && len > 302)
            {
                align = d[302];
                std::memcpy(&offset, d + 297, sizeof(float));
                percent = d[301] != 0;
            }
            if (c.writingMode) std::swap(width, height);
            float own = height;
            if (!c.writingMode && i < c.boxTexts.size())
            {
                if (auto text = c.boxTexts[i].get())
                {
                    float last = 0.0f;
                    if (winrt::get_self<implementation::Text>(text)->LastBaseline(last)) own = last;
                }
            }
            const float baseline = c.writingMode ? height * 0.5f + (c.ascent - c.descent) * 0.5f
                                                 : BoxBaseline(align, offset, percent, align == 0 ? own : height, c.ascent, c.descent, c.lineHeight);
            auto& box = c.paragraph.boxes[i];
            if (box.width == width && box.height == height && box.baseline == baseline) continue;
            box.width = width;
            box.height = height;
            box.baseline = baseline;
            changed = true;
        }
        if (changed)
        {
            c.layout = nullptr;
            c.Reset();
            ++c.version;
        }
        return changed;
    }

    void Text::ArrangeBoxes()
    {
        if (!m_hostsBoxes) return;
        auto children = Children();
        const uint32_t count = children.Size();
        if (count == 0 || (m_text && count == 1)) return;
        auto boxes = InlineBoxes();
        std::vector<mason_dwrite::BoxRect> rects;
        auto& c = *m_measureCache;
        auto* self = winrt::get_self<implementation::Node>(m_node);
        if (m_direct && c.layout && m_drawnValid && !boxes.empty())
        {
            mason_dwrite::Configure(c.layout.get(), m_drawn.wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, m_drawn.maxWidth);
            mason_dwrite::BoxRects(c.layout.get(), c.paragraph.boxes, rects);
        }
        const float scale = mason_visual::RasterScale(get_strong().as<mux::UIElement>());
        auto snap = [scale](float absolute, float origin)
        {
            return scale > 0.0f ? (std::round(absolute * scale) - std::round(origin * scale)) / scale : absolute - origin;
        };
        for (auto const& child : children)
        {
            if (m_text && child == m_text) continue;
            auto it = std::find(boxes.begin(), boxes.end(), child);
            const size_t index = static_cast<size_t>(it - boxes.begin());
            if (it == boxes.end() || index >= rects.size())
            {
                child.Arrange({ 0.0f, 0.0f, 0.0f, 0.0f });
                continue;
            }
            const auto r = FromLayout(rects[index].x, rects[index].y, rects[index].width, rects[index].height);
            const float absX = self->ArrangeX + r.X;
            const float absY = self->ArrangeY + r.Y;
            Size size{ r.Width, r.Height };
            if (auto node = NodeOfBox(child))
            {
                auto* impl = winrt::get_self<implementation::Node>(node);
                impl->ArrangeX = absX;
                impl->ArrangeY = absY;
                size = impl->LayoutSize();
            }
            child.Arrange({ snap(absX, self->ArrangeX), snap(absY, self->ArrangeY), size.Width, size.Height });
        }
    }

    winrt::Windows::Foundation::IInspectable Text::InlineElementAt(Point const& point)
    {
        if (!m_direct || m_pieces.empty() || !m_drawnValid) return nullptr;
        auto& c = *m_measureCache;
        IDWriteTextLayout* layout = c.layout.get();
        if (!layout) return nullptr;
        mason_dwrite::Configure(layout, m_drawn.wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, m_drawn.maxWidth);
        float x = 0.0f, y = 0.0f;
        if (!ToLayout(point, x, y)) return nullptr;
        std::vector<mason_dwrite::BoxRect> rects;
        mason_dwrite::BoxRects(layout, c.paragraph.boxes, rects);
        size_t box = 0;
        for (auto const& piece : m_pieces)
        {
            if (!piece.isBox) continue;
            if (box < rects.size())
            {
                auto const& r = rects[box];
                if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) return piece.element;
            }
            ++box;
        }
        const int32_t position = mason_dwrite::PositionAt(layout, x, y);
        if (position < 0) return nullptr;
        for (auto const& piece : m_pieces)
        {
            if (!piece.isBox && static_cast<uint32_t>(position) >= piece.start && static_cast<uint32_t>(position) < piece.start + piece.length) return piece.element;
        }
        return nullptr;
    }

    std::vector<Text::InlineItem> Text::InlineItems()
    {
        std::vector<InlineItem> items;
        if (!m_direct || m_pieces.empty() || !m_drawnValid) return items;
        auto& c = *m_measureCache;
        IDWriteTextLayout* layout = c.layout.get();
        if (!layout) return items;
        mason_dwrite::Configure(layout, m_drawn.wrap ? DWRITE_WORD_WRAPPING_WHOLE_WORD : DWRITE_WORD_WRAPPING_NO_WRAP, m_drawn.maxWidth);
        std::vector<mason_dwrite::BoxRect> rects;
        mason_dwrite::BoxRects(layout, c.paragraph.boxes, rects);
        std::wstring_view chars{ c.paragraph.text };
        size_t box = 0;
        uint32_t lastEnd = 0;
        for (auto const& piece : m_pieces)
        {
            if (piece.isBox)
            {
                InlineItem item;
                item.element = piece.element;
                item.isBox = true;
                if (box < rects.size()) item.bounds = FromLayout(rects[box].x, rects[box].y, rects[box].width, rects[box].height);
                ++box;
                items.push_back(std::move(item));
                continue;
            }
            winrt::Windows::Foundation::IInspectable target{ nullptr };
            bool isLink = false;
            for (auto text = piece.element.try_as<nsm::Text>(); text;)
            {
                auto* impl = winrt::get_self<implementation::Text>(text);
                if (impl == this) break;
                if (impl->m_isLink || mason_events::HasListener(text, L"click"))
                {
                    target = text;
                    isLink = impl->m_isLink;
                    break;
                }
                auto* owner = impl->m_inlineOwner;
                if (!owner || owner == this) break;
                text = *owner;
            }
            if (!target || piece.start + piece.length > chars.size()) continue;
            const std::wstring_view label = chars.substr(piece.start, piece.length);
            if (!items.empty() && !items.back().isBox && items.back().element == target && lastEnd == piece.start)
            {
                items.back().label = winrt::hstring{ std::wstring(items.back().label) + std::wstring(label) };
                lastEnd = piece.start + piece.length;
                continue;
            }
            UINT32 count = 0;
            layout->HitTestTextRange(piece.start, piece.length, 0.0f, 0.0f, nullptr, 0, &count);
            std::vector<DWRITE_HIT_TEST_METRICS> hits(count);
            if (count == 0 || FAILED(layout->HitTestTextRange(piece.start, piece.length, 0.0f, 0.0f, hits.data(), count, &count))) continue;
            InlineItem item;
            item.element = target;
            item.bounds = FromLayout(hits[0].left, hits[0].top, hits[0].width, hits[0].height);
            item.label = winrt::hstring{ label };
            item.isLink = isLink;
            items.push_back(std::move(item));
            lastEnd = piece.start + piece.length;
        }
        return items;
    }

    void Text::HookInput()
    {
        if (m_inputHooked) return;
        m_inputHooked = true;
        nsm::Text self = *this;
        mason_events::HookTaps(self);
        auto pressed = muxi::PointerEventHandler([this](auto&&, muxi::PointerRoutedEventArgs const& e)
        {
            nsm::Text me = *this;
            SetPressed(InlineElementAt(e.GetCurrentPoint(me).Position()));
        });
        auto released = muxi::PointerEventHandler([this](auto&&, auto&&) { SetPressed(nullptr); });
        AddHandler(mux::UIElement::PointerPressedEvent(), winrt::box_value(pressed), true);
        AddHandler(mux::UIElement::PointerReleasedEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerCanceledEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerCaptureLostEvent(), winrt::box_value(released), true);
        AddHandler(mux::UIElement::PointerExitedEvent(), winrt::box_value(released), true);
    }

    void Text::SetPressed(winrt::Windows::Foundation::IInspectable const& target)
    {
        std::vector<winrt::Windows::Foundation::IInspectable> chain;
        for (auto cur = target; cur;)
        {
            chain.push_back(cur);
            auto text = cur.try_as<nsm::Text>();
            auto* owner = text ? winrt::get_self<implementation::Text>(text)->m_inlineOwner : nullptr;
            if (!owner || owner == this) break;
            nsm::Text next = *owner;
            cur = next;
        }
        auto contains = [](std::vector<winrt::Windows::Foundation::IInspectable> const& list, winrt::Windows::Foundation::IInspectable const& item)
        {
            return std::find(list.begin(), list.end(), item) != list.end();
        };
        auto previous = std::move(m_pressedChain);
        m_pressedChain = chain;
        for (auto const& element : previous)
        {
            if (!contains(chain, element)) mason_events::Dispatch(element, L"mason:active", false, L"0");
        }
        for (auto const& element : chain)
        {
            if (!contains(previous, element)) mason_events::Dispatch(element, L"mason:active", false, L"1");
        }
    }

    bool Text::ToLayout(Point const& point, float& u, float& v) const
    {
        switch (m_frame.vertical)
        {
        case 1:
            u = point.Y - m_frame.top;
            v = m_frame.right - point.X;
            return true;
        case 2:
        {
            auto* layout = m_measureCache->layout.get();
            if (!layout) return false;
            const float across = point.X - m_frame.left;
            for (auto const& line : mason_dwrite::LineBands(layout))
            {
                if (across < line.top || across >= line.bottom) continue;
                u = point.Y - m_frame.top;
                v = line.top + line.bottom - across;
                return true;
            }
            return false;
        }
        default:
            u = point.X - m_frame.left;
            v = point.Y - m_frame.top;
            return true;
        }
    }

    Rect Text::FromLayout(float u, float v, float width, float height) const
    {
        switch (m_frame.vertical)
        {
        case 1:
            return { m_frame.right - v - height, m_frame.top + u, height, width };
        case 2:
        {
            float sum = 2.0f * v + height;
            if (auto* layout = m_measureCache->layout.get())
            {
                const float middle = v + height * 0.5f;
                for (auto const& line : mason_dwrite::LineBands(layout))
                {
                    if (middle >= line.top && middle < line.bottom) sum = line.top + line.bottom;
                }
            }
            return { m_frame.left + sum - v - height, m_frame.top + u, height, width };
        }
        default:
            return { m_frame.left + u, m_frame.top + v, width, height };
        }
    }

    bool Text::LastBaseline(float& baseline)
    {
        if (!m_direct || m_measureCache->paragraph.text.empty()) return false;
        auto* layout = m_measureCache->Layout();
        if (!layout) return false;
        const auto lines = mason_dwrite::LineBands(layout);
        if (lines.empty()) return false;
        float left = 0.0f, top = 0.0f, right = 0.0f, bottom = 0.0f;
        winrt::get_self<implementation::Node>(m_node)->ContentInsets(left, top, right, bottom);
        baseline = top + lines.back().baseline;
        return true;
    }
}
