#include "pch.h"
#include "Css.h"
#include "CssImageResult.h"
#include "Css.g.cpp"
#include "CssImageResult.g.cpp"

#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Xaml.Media.Imaging.h>
#include <winrt/Windows.Graphics.Imaging.h>
#include <winrt/Windows.Security.Cryptography.h>
#include <winrt/Windows.UI.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Streams.h>

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <cstdlib>
#include <cwctype>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <string>
#include <string_view>
#include <vector>
#include "BufferUtil.h"
#include "ColorInterpolation.h"
#include "Decoration.h"
#include "VisualApply.h"
#include "Positioning.h"
#include "ScrollHost.h"
#include "Invalidation.h"

using namespace winrt;

namespace
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;
    namespace imaging = winrt::Microsoft::UI::Xaml::Media::Imaging;
    namespace nsm = winrt::NativeScript::Mason;

    // Re-lay-out after an off-pass child mutation under the single-root compute model. TWO things are
    // required: (1) the MUTATED panel must be re-measured so its MeasureOverride re-runs SyncChildren
    // and mirrors the new/removed child into the Mason tree (invalidating only the root does NOT
    // re-run a nested panel's MeasureOverride — XAML treats it as clean, so the child is never synced);
    // (2) the LAYOUT ROOT (topmost Mason element, the only panel that runs ComputeSize) must be marked
    // dirty + invalidated so the single holistic compute reruns from scratch and positions the change
    // this pass (not one mutation late).
    void MarkLayoutRootDirty(muxc::Panel const& panel)
    {
        panel.InvalidateMeasure();
        winrt::NativeScript::Mason::Node node{ nullptr };
        if (auto el = panel.try_as<nsm::IMasonElement>()) node = el.Node();
        mason_leaf::StyleChanged(panel, node);
    }
    using winrt::Windows::Graphics::Imaging::SoftwareBitmap;
    using winrt::Windows::Graphics::Imaging::BitmapPixelFormat;
    using winrt::Windows::Graphics::Imaging::BitmapAlphaMode;

    winrt::Windows::UI::Color ColorFromArgb(uint32_t argb)
    {
        return winrt::Windows::UI::Color{
            static_cast<uint8_t>((argb >> 24) & 0xFF),
            static_cast<uint8_t>((argb >> 16) & 0xFF),
            static_cast<uint8_t>((argb >> 8) & 0xFF),
            static_cast<uint8_t>(argb & 0xFF) };
    }

    inline int iround(double v) { return static_cast<int>(std::lround(v)); }
    inline int iclamp(int v, int lo, int hi) { return v < lo ? lo : (v > hi ? hi : v); }

    bool inside_rounded_rect(float px, float py, float x0, float y0, float x1, float y1, float r)
    {
        if (px < x0 || px > x1 || py < y0 || py > y1) return false;
        if (r <= 0) return true;
        float cx = px < x0 + r ? x0 + r : (px > x1 - r ? x1 - r : px);
        float cy = py < y0 + r ? y0 + r : (py > y1 - r ? y1 - r : py);
        float dx = px - cx, dy = py - cy;
        return dx * dx + dy * dy <= r * r;
    }

    void blur_h(const std::vector<float>& src, std::vector<float>& dst, int w, int h, int radius)
    {
        const float norm = 1.0f / (radius * 2 + 1);
        for (int y = 0; y < h; y++)
        {
            const int row = y * w;
            float acc = 0;
            for (int i = -radius; i <= radius; i++) acc += src[row + iclamp(i, 0, w - 1)];
            for (int x = 0; x < w; x++)
            {
                dst[row + x] = acc * norm;
                acc += src[row + iclamp(x + radius + 1, 0, w - 1)] - src[row + iclamp(x - radius, 0, w - 1)];
            }
        }
    }

    void blur_v(const std::vector<float>& src, std::vector<float>& dst, int w, int h, int radius)
    {
        const float norm = 1.0f / (radius * 2 + 1);
        for (int x = 0; x < w; x++)
        {
            float acc = 0;
            for (int i = -radius; i <= radius; i++) acc += src[iclamp(i, 0, h - 1) * w + x];
            for (int y = 0; y < h; y++)
            {
                dst[y * w + x] = acc * norm;
                acc += src[iclamp(y + radius + 1, 0, h - 1) * w + x] - src[iclamp(y - radius, 0, h - 1) * w + x];
            }
        }
    }

    void box_blur(std::vector<float>& buf, int w, int h, int radius, int passes)
    {
        if (radius < 1) return;
        std::vector<float> tmp(buf.size());
        for (int p = 0; p < passes; p++)
        {
            blur_h(buf, tmp, w, h, radius);
            blur_v(tmp, buf, w, h, radius);
        }
    }

    muxc::Image make_image(const std::vector<uint8_t>& bgra, int w, int h)
    {
        auto buffer = winrt::Windows::Security::Cryptography::CryptographicBuffer::CreateFromByteArray(
            winrt::array_view<uint8_t const>(bgra.data(), bgra.data() + bgra.size()));
        auto sb = SoftwareBitmap::CreateCopyFromBuffer(buffer, BitmapPixelFormat::Bgra8, w, h, BitmapAlphaMode::Premultiplied);

        imaging::SoftwareBitmapSource source;
        muxc::Image img;
        img.Source(source);
        img.Width(static_cast<double>(w));
        img.Height(static_cast<double>(h));
        img.Stretch(muxm::Stretch::Fill);
        img.IsHitTestVisible(false);
        source.SetBitmapAsync(sb);
        return img;
    }
}

namespace
{
    winrt::fire_and_forget LoadBitmap(winrt::Microsoft::UI::Xaml::Media::Imaging::BitmapImage bitmap, winrt::hstring source)
    {
        using namespace winrt::Windows::Security::Cryptography;
        using namespace winrt::Windows::Storage::Streams;
        try
        {
            winrt::apartment_context ui;
            const std::wstring_view v = source;
            if (v.starts_with(L"data:"))
            {
                const size_t comma = v.find(L',');
                if (comma == std::wstring_view::npos) co_return;
                const std::wstring_view header = v.substr(5, comma - 5);
                const winrt::hstring payload{ v.substr(comma + 1) };
                const IBuffer bytes = header.ends_with(L";base64")
                    ? CryptographicBuffer::DecodeFromBase64String(payload)
                    : CryptographicBuffer::ConvertStringToBinary(winrt::Windows::Foundation::Uri::UnescapeComponent(payload), BinaryStringEncoding::Utf8);
                InMemoryRandomAccessStream stream;
                co_await stream.WriteAsync(bytes);
                stream.Seek(0);
                co_await ui;
                co_await bitmap.SetSourceAsync(stream);
                co_return;
            }
            auto file = co_await winrt::Windows::Storage::StorageFile::GetFileFromPathAsync(source);
            auto stream = co_await file.OpenReadAsync();
            co_await ui;
            co_await bitmap.SetSourceAsync(stream);
        }
        catch (...)
        {
        }
    }
}

namespace
{
    // ---- SVG background images -------------------------------------------------------------
    // BitmapImage can't decode SVG, so `data:image/svg+xml` goes to SvgImageSource (Direct2D's
    // SVG renderer: paths incl. arcs, basic shapes, groups, fill-rule, strokes, transforms). Two
    // fix-ups first: `currentColor` becomes the element's CSS color (D2D has no CSS cascade to
    // resolve it from), and an SVG with only a viewBox gets width/height so it has a size.

    bool IsSvgDataUri(std::wstring_view v)
    {
        constexpr std::wstring_view prefix = L"data:image/svg";
        if (v.size() < prefix.size()) return false;
        for (size_t i = 0; i < prefix.size(); ++i)
        {
            if (std::towlower(v[i]) != prefix[i]) return false;
        }
        return true;
    }

    int HexDigit(char c)
    {
        if (c >= '0' && c <= '9') return c - '0';
        if (c >= 'a' && c <= 'f') return c - 'a' + 10;
        if (c >= 'A' && c <= 'F') return c - 'A' + 10;
        return -1;
    }

    // Lenient percent-decoding: a malformed escape stays as written and `+` stays `+`.
    std::string PercentDecode(std::string const& s)
    {
        std::string out;
        out.reserve(s.size());
        for (size_t i = 0; i < s.size(); ++i)
        {
            if (s[i] == '%' && i + 2 < s.size())
            {
                const int hi = HexDigit(s[i + 1]);
                const int lo = HexDigit(s[i + 2]);
                if (hi >= 0 && lo >= 0)
                {
                    out.push_back(static_cast<char>(hi * 16 + lo));
                    i += 2;
                    continue;
                }
            }
            out.push_back(s[i]);
        }
        return out;
    }

    std::string DecodeSvgDataUri(std::wstring_view uri)
    {
        using namespace winrt::Windows::Security::Cryptography;
        const size_t comma = uri.find(L',');
        if (comma == std::wstring_view::npos) return {};
        std::wstring header{ uri.substr(5, comma - 5) };
        for (auto& c : header) c = static_cast<wchar_t>(std::towlower(c));
        const winrt::hstring payload{ uri.substr(comma + 1) };
        if (header.find(L";base64") != std::wstring::npos)
        {
            winrt::com_array<uint8_t> bytes;
            CryptographicBuffer::CopyToByteArray(CryptographicBuffer::DecodeFromBase64String(payload), bytes);
            return std::string(bytes.begin(), bytes.end());
        }
        return PercentDecode(winrt::to_string(payload));
    }

    bool IsAsciiSpace(char c) { return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f'; }

    // Value of attribute `name` inside one start tag, if present.
    bool FindAttribute(std::string const& tag, std::string_view name, std::string& value)
    {
        size_t i = 0;
        while ((i = tag.find(name, i)) != std::string::npos)
        {
            const bool startOk = i > 0 && IsAsciiSpace(tag[i - 1]);
            size_t j = i + name.size();
            while (j < tag.size() && IsAsciiSpace(tag[j])) ++j;
            if (startOk && j < tag.size() && tag[j] == '=')
            {
                ++j;
                while (j < tag.size() && IsAsciiSpace(tag[j])) ++j;
                if (j < tag.size() && (tag[j] == '"' || tag[j] == '\''))
                {
                    const char q = tag[j];
                    const size_t end = tag.find(q, j + 1);
                    value = tag.substr(j + 1, end == std::string::npos ? std::string::npos : end - j - 1);
                }
                else
                {
                    size_t end = j;
                    while (end < tag.size() && !IsAsciiSpace(tag[end]) && tag[end] != '>' && tag[end] != '/') ++end;
                    value = tag.substr(j, end - j);
                }
                return true;
            }
            i += name.size();
        }
        return false;
    }

    std::string PrepareSvg(std::string svg, uint32_t currentColor)
    {
        // currentColor -> #rrggbb (case-insensitive, it is a CSS keyword).
        char hex[8];
        std::snprintf(hex, sizeof(hex), "#%02x%02x%02x", (currentColor >> 16) & 0xFF, (currentColor >> 8) & 0xFF, currentColor & 0xFF);
        constexpr std::string_view keyword = "currentcolor";
        for (size_t i = 0; i + keyword.size() <= svg.size();)
        {
            bool match = true;
            for (size_t k = 0; k < keyword.size(); ++k)
            {
                if (std::tolower(static_cast<unsigned char>(svg[i + k])) != keyword[k]) { match = false; break; }
            }
            if (match)
            {
                svg.replace(i, keyword.size(), hex);
                i += 7;
            }
            else
            {
                ++i;
            }
        }

        // Root <svg> without width/height: size it from its viewBox (CSS px = SVG user units).
        size_t open = svg.find("<svg");
        while (open != std::string::npos && open + 4 < svg.size() && !IsAsciiSpace(svg[open + 4]) && svg[open + 4] != '>')
        {
            open = svg.find("<svg", open + 4);
        }
        if (open == std::string::npos) return svg;
        size_t close = open;
        char quote = 0;
        for (; close < svg.size(); ++close)
        {
            const char c = svg[close];
            if (quote) { if (c == quote) quote = 0; }
            else if (c == '"' || c == '\'') quote = c;
            else if (c == '>') break;
        }
        const std::string tag = svg.substr(open, close - open);
        std::string value;
        // With one of width/height given, D2D derives the other from the viewBox ratio.
        if (FindAttribute(tag, "width", value) || FindAttribute(tag, "height", value)) return svg;
        if (!FindAttribute(tag, "viewBox", value)) return svg;
        for (auto& c : value) if (c == ',') c = ' ';
        double nums[4] = {};
        const char* p = value.c_str();
        for (int k = 0; k < 4; ++k)
        {
            char* end = nullptr;
            nums[k] = std::strtod(p, &end);
            if (end == p) return svg;
            p = end;
        }
        if (nums[2] <= 0 || nums[3] <= 0) return svg;
        char attrs[64];
        std::snprintf(attrs, sizeof(attrs), " width=\"%g\" height=\"%g\"", nums[2], nums[3]);
        svg.insert(open + 4, attrs);
        return svg;
    }

    // The element's resolved CSS `color` (ARGB): its own, else the nearest Mason ancestor's.
    uint32_t ResolveCurrentColor(mux::UIElement const& element)
    {
        constexpr uint32_t FONT_COLOR = 324, FONT_COLOR_STATE = 328;
        mux::DependencyObject node = element;
        for (int depth = 0; node && depth < 128; ++depth)
        {
            if (auto masonElement = node.try_as<nsm::IMasonElement>())
            {
                if (auto n = masonElement.Node())
                {
                    uint32_t size = 0;
                    const uint8_t* d = mason_visual::StyleBytes(n, size);
                    if (d && FONT_COLOR_STATE < size && d[FONT_COLOR_STATE] != 0)
                    {
                        uint32_t v = 0;
                        std::memcpy(&v, d + FONT_COLOR, 4);
                        return v;
                    }
                }
            }
            node = muxm::VisualTreeHelper::GetParent(node);
        }
        return 0xFF000000;
    }

    winrt::fire_and_forget LoadSvg(imaging::SvgImageSource svg, std::string text)
    {
        using namespace winrt::Windows::Security::Cryptography;
        using namespace winrt::Windows::Storage::Streams;
        try
        {
            winrt::apartment_context ui;
            const auto* begin = reinterpret_cast<const uint8_t*>(text.data());
            const IBuffer bytes = CryptographicBuffer::CreateFromByteArray(winrt::array_view<uint8_t const>(begin, begin + text.size()));
            InMemoryRandomAccessStream stream;
            co_await stream.WriteAsync(bytes);
            stream.Seek(0);
            co_await ui;
            co_await svg.SetSourceAsync(stream);
        }
        catch (...)
        {
        }
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    namespace
    {
        namespace mucomp = winrt::Microsoft::UI::Composition;
        namespace hosting = winrt::Microsoft::UI::Xaml::Hosting;

    }

    void Css::SetBoxShadow(mux::UIElement const& element, hstring const& shadows)
    {
        if (!element) return;
        mason_shadow::Set(element, shadows);
        element.InvalidateArrange();
    }

    void Css::SetFilter(mux::UIElement const& element, hstring const& filter)
    {
        if (!element) return;
        mason_filter::Set(element, false, filter);
        element.InvalidateArrange();
    }

    void Css::SetBackdropFilter(mux::UIElement const& element, hstring const& filter)
    {
        if (!element) return;
        mason_filter::Set(element, true, filter);
        element.InvalidateArrange();
    }

    void Css::ApplyShadow(mux::UIElement const& element, double ox, double oy, double blur, uint32_t argb, double)
    {
        wchar_t spec[96]{};
        swprintf_s(spec, L"0,%g,%g,%g,0,%u", ox, oy, blur, argb);
        SetBoxShadow(element, spec);
    }

    void Css::ClearShadow(mux::UIElement const& element)
    {
        SetBoxShadow(element, L"");
    }

    void Css::ApplyBackground(mux::UIElement const& element, uint32_t argb)
    {
        if (!element) return;
        if (auto panel = element.try_as<muxc::Panel>())
        {
            panel.Background(muxm::SolidColorBrush(ColorFromArgb(argb)));
        }
    }

    void Css::ClearBackground(mux::UIElement const& element)
    {
        if (!element) return;
        auto panel = element.try_as<muxc::Panel>();
        if (!panel) return;
        // Solid brushes are background-color, which VisualApply owns; a tap handler's transparent
        // brush must also survive or the element stops hit-testing. A RoundedColorBrush may be a
        // rounded gradient; if it was the color, VisualApply repaints it on the arrange below.
        auto current = panel.Background();
        if (!current || current.try_as<muxm::SolidColorBrush>()) return;
        panel.Background(nullptr);
        panel.InvalidateArrange();
    }

    void Css::ApplyOpacity(mux::UIElement const& element, double opacity)
    {
        if (!element) return;
        element.Opacity(opacity);
    }

    void Css::ApplyTransform(mux::UIElement const& element,
        double m11, double m12, double m21, double m22, double offsetX, double offsetY)
    {
        if (!element) return;
        // CSS transforms rotate/scale about the element CENTER by default; WinUI RenderTransform is
        // anchored at the top-left unless RenderTransformOrigin is set. Anchor at (0.5,0.5) so the JS
        // layer can pass a pure rotate*scale matrix (+ px translate in the offset) and have it match CSS.
        if (auto fe = element.try_as<mux::FrameworkElement>())
        {
            fe.RenderTransformOrigin(winrt::Windows::Foundation::Point{ 0.5f, 0.5f });
        }
        muxm::MatrixTransform mt;
        mt.Matrix(muxm::Matrix{ m11, m12, m21, m22, offsetX, offsetY });
        mason_position::SetCssTransform(element, mt);
    }

    void Css::ClearTransform(mux::UIElement const& element)
    {
        if (!element) return;
        mason_position::SetCssTransform(element, nullptr);
    }

    void Css::ApplyCornerRadius(mux::UIElement const& element,
        double offsetX, double offsetY, double width, double height, double radiusX, double radiusY)
    {
        if (!element) return;
        auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);
        if (!visual) return;

        auto compositor = visual.Compositor();
        auto geometry = compositor.CreateRoundedRectangleGeometry();
        geometry.Offset({ static_cast<float>(offsetX), static_cast<float>(offsetY) });
        geometry.Size({ static_cast<float>(width), static_cast<float>(height) });
        geometry.CornerRadius({ static_cast<float>(radiusX), static_cast<float>(radiusY) });

        auto clip = compositor.CreateGeometricClip(geometry);
        visual.Clip(clip);
    }

    void Css::ClearClip(mux::UIElement const& element)
    {
        if (!element) return;
        auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);
        if (!visual) return;
        visual.Clip(nullptr);
    }

    winrt::NativeScript::Mason::CssImageResult Css::CreateShadow(
        double width, double height, double blurRadius, double spread, double cornerRadius,
        double offsetX, double offsetY, uint32_t argb)
    {
        const int sw = (std::max)(1, iround(width + spread * 2));
        const int sh = (std::max)(1, iround(height + spread * 2));

        const int boxRadius = (std::max)(1, iround(blurRadius * 0.5));
        const int passes = 3;
        const int overhang = boxRadius * passes + 1;

        const int ox = iround(offsetX);
        const int oy = iround(offsetY);
        const int bw = sw + (overhang + std::abs(ox)) * 2;
        const int bh = sh + (overhang + std::abs(oy)) * 2;

        const float radius = static_cast<float>((std::max)(0.0, cornerRadius + spread));

        const uint8_t a = static_cast<uint8_t>((argb >> 24) & 0xFF);
        const uint8_t r = static_cast<uint8_t>((argb >> 16) & 0xFF);
        const uint8_t g = static_cast<uint8_t>((argb >> 8) & 0xFF);
        const uint8_t b = static_cast<uint8_t>(argb & 0xFF);

        const int n = bw * bh;
        std::vector<float> cov(n, 0.0f);
        const float x0 = (bw - sw) / 2.0f + ox, y0 = (bh - sh) / 2.0f + oy, x1 = x0 + sw, y1 = y0 + sh;
        const float rr = (std::min)(radius, (std::min)(sw / 2.0f, sh / 2.0f));

        for (int y = 0; y < bh; y++)
        {
            const int row = y * bw;
            for (int x = 0; x < bw; x++)
                cov[row + x] = inside_rounded_rect(x + 0.5f, y + 0.5f, x0, y0, x1, y1, rr) ? 1.0f : 0.0f;
        }

        box_blur(cov, bw, bh, boxRadius, passes);

        std::vector<uint8_t> bgra(static_cast<size_t>(n) * 4);
        const float ca = a / 255.0f;
        for (int i = 0; i < n; i++)
        {
            float alpha = cov[i] * ca;
            alpha = alpha < 0.0f ? 0.0f : (alpha > 1.0f ? 1.0f : alpha);
            const int o = i * 4;
            bgra[o + 0] = static_cast<uint8_t>(b * alpha);
            bgra[o + 1] = static_cast<uint8_t>(g * alpha);
            bgra[o + 2] = static_cast<uint8_t>(r * alpha);
            bgra[o + 3] = static_cast<uint8_t>(alpha * 255.0f);
        }

        auto img = make_image(bgra, bw, bh);
        return winrt::make<CssImageResult>(img, static_cast<double>(bw), static_cast<double>(bh), static_cast<double>(overhang));
    }

    winrt::NativeScript::Mason::CssImageResult Css::CreateBorder(
        double width, double height,
        double topWidth, double rightWidth, double bottomWidth, double leftWidth,
        uint32_t topArgb, uint32_t rightArgb, uint32_t bottomArgb, uint32_t leftArgb,
        double cornerRadius)
    {
        const int w = (std::max)(1, iround(width));
        const int h = (std::max)(1, iround(height));
        const float tW = static_cast<float>((std::max)(0.0, topWidth));
        const float rW = static_cast<float>((std::max)(0.0, rightWidth));
        const float bW = static_cast<float>((std::max)(0.0, bottomWidth));
        const float lW = static_cast<float>((std::max)(0.0, leftWidth));
        const float r = static_cast<float>((std::max)(0.0, cornerRadius));
        const float innerR = (std::max)(0.0f, r - (std::max)((std::max)(tW, bW), (std::max)(lW, rW)));

        const int n = w * h;
        std::vector<uint8_t> bgra(static_cast<size_t>(n) * 4, 0);

        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                const float px = x + 0.5f, py = y + 0.5f;
                const bool insideOuter = inside_rounded_rect(px, py, 0, 0, static_cast<float>(w), static_cast<float>(h), r);
                const bool insideInner = inside_rounded_rect(px, py, lW, tW, w - rW, h - bW, innerR);
                if (!insideOuter || insideInner) continue;

                const float dT = py, dB = h - py, dL = px, dR = w - px;
                uint32_t c;
                if (dT <= dB && dT <= dL && dT <= dR) c = topArgb;
                else if (dB <= dL && dB <= dR) c = bottomArgb;
                else if (dL <= dR) c = leftArgb;
                else c = rightArgb;

                const uint8_t a = static_cast<uint8_t>((c >> 24) & 0xFF);
                const uint8_t rr = static_cast<uint8_t>((c >> 16) & 0xFF);
                const uint8_t gg = static_cast<uint8_t>((c >> 8) & 0xFF);
                const uint8_t bb = static_cast<uint8_t>(c & 0xFF);
                const float af = a / 255.0f;
                const int o = (y * w + x) * 4;
                bgra[o + 0] = static_cast<uint8_t>(bb * af);
                bgra[o + 1] = static_cast<uint8_t>(gg * af);
                bgra[o + 2] = static_cast<uint8_t>(rr * af);
                bgra[o + 3] = a;
            }
        }

        auto img = make_image(bgra, w, h);
        return winrt::make<CssImageResult>(img, static_cast<double>(w), static_cast<double>(h), 0.0);
    }

    // Parse a "offset:argb,offset:argb,..." stop list (offset 0..1 float, argb decimal u32) and append
    // GradientStops to `stops`, resampled in `interpolation`. `Type x{}` (not `Type x;`) is required
    // to construct projected objects.
    static void AppendGradientStops(winrt::Windows::Foundation::Collections::IVector<muxm::GradientStop> const& dst, std::wstring_view spec, std::wstring_view interpolation)
    {
        std::vector<mason_color::Stop> parsed;
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t comma = spec.find(L',', pos);
            std::wstring_view tok = spec.substr(pos, comma == std::wstring_view::npos ? std::wstring_view::npos : comma - pos);
            size_t colon = tok.find(L':');
            if (colon != std::wstring_view::npos)
            {
                std::wstring offStr(tok.substr(0, colon));
                std::wstring argbStr(tok.substr(colon + 1));
                try
                {
                    parsed.push_back({ std::stof(offStr), static_cast<uint32_t>(std::stoul(argbStr)) });
                }
                catch (...) {}
            }
            if (comma == std::wstring_view::npos) break;
            pos = comma + 1;
        }

        if (auto method = mason_color::ParseInterpolation(interpolation))
        {
            parsed = mason_color::ExpandInterpolatedStops(parsed, *method);
        }
        for (auto const& s : parsed)
        {
            muxm::GradientStop stop{};
            stop.Color(ColorFromArgb(s.argb));
            stop.Offset(s.offset);
            dst.Append(stop);
        }
    }

    void Css::ApplyLinearGradient(mux::UIElement const& element, double angleDegrees, winrt::hstring const& stops, winrt::hstring const& interpolation)
    {
        auto panel = element ? element.try_as<muxc::Panel>() : nullptr;
        if (!panel) return;

        muxm::LinearGradientBrush brush{};
        // CSS angle: 0deg -> to top, 90deg -> to right. Map to a relative start/end across the box.
        const double rad = angleDegrees * 3.14159265358979323846 / 180.0;
        const double dx = std::sin(rad);
        const double dy = -std::cos(rad);
        brush.StartPoint({ static_cast<float>(0.5 - dx * 0.5), static_cast<float>(0.5 - dy * 0.5) });
        brush.EndPoint({ static_cast<float>(0.5 + dx * 0.5), static_cast<float>(0.5 + dy * 0.5) });
        AppendGradientStops(brush.GradientStops(), std::wstring_view(stops), std::wstring_view(interpolation));
        panel.Background(brush);
        if (auto invalidated = element.try_as<mux::UIElement>()) invalidated.InvalidateArrange();
    }

    void Css::ApplyRadialGradient(mux::UIElement const& element, winrt::hstring const& stops, winrt::hstring const& interpolation)
    {
        auto panel = element ? element.try_as<muxc::Panel>() : nullptr;
        if (!panel) return;

        muxm::RadialGradientBrush brush{};
        AppendGradientStops(brush.GradientStops(), std::wstring_view(stops), std::wstring_view(interpolation));
        panel.Background(brush);
        if (auto invalidated = element.try_as<mux::UIElement>()) invalidated.InvalidateArrange();
    }

    void Css::ApplyRadialGradientAt(mux::UIElement const& element, double centerX, double centerY, double radiusX, double radiusY,
        winrt::hstring const& stops, winrt::hstring const& interpolation)
    {
        auto panel = element ? element.try_as<muxc::Panel>() : nullptr;
        if (!panel) return;
        muxm::RadialGradientBrush brush{};
        const winrt::Windows::Foundation::Point center{ static_cast<float>(centerX), static_cast<float>(centerY) };
        brush.Center(center);
        brush.GradientOrigin(center);
        brush.RadiusX(radiusX);
        brush.RadiusY(radiusY);
        AppendGradientStops(brush.GradientStops(), std::wstring_view(stops), std::wstring_view(interpolation));
        panel.Background(brush);
        if (auto invalidated = element.try_as<mux::UIElement>()) invalidated.InvalidateArrange();
    }

    void Css::ApplyBackgroundImage(mux::UIElement const& element, winrt::hstring const& source, int32_t fit, int32_t alignX, int32_t alignY)
    {
        auto panel = element ? element.try_as<muxc::Panel>() : nullptr;
        if (!panel || source.empty()) return;
        namespace imaging = winrt::Microsoft::UI::Xaml::Media::Imaging;
        const std::wstring_view v = source;
        muxm::ImageBrush brush;
        if (IsSvgDataUri(v))
        {
            std::string svg = DecodeSvgDataUri(v);
            if (svg.empty()) return;
            imaging::SvgImageSource svgSource;
            LoadSvg(svgSource, PrepareSvg(std::move(svg), ResolveCurrentColor(element)));
            brush.ImageSource(svgSource);
        }
        else
        {
            imaging::BitmapImage bitmap;
            const bool path = (v.size() > 2 && v[1] == L':') || (!v.empty() && (v[0] == L'/' || v[0] == L'\\'));
            if (v.starts_with(L"data:") || path)
            {
                LoadBitmap(bitmap, source);
            }
            else
            {
                try
                {
                    bitmap.UriSource(winrt::Windows::Foundation::Uri{ source });
                }
                catch (...)
                {
                    return;
                }
            }
            brush.ImageSource(bitmap);
        }
        brush.Stretch(fit == 1 ? muxm::Stretch::Fill : fit == 2 ? muxm::Stretch::Uniform : fit == 3 ? muxm::Stretch::UniformToFill : muxm::Stretch::None);
        brush.AlignmentX(alignX == 0 ? muxm::AlignmentX::Left : alignX == 2 ? muxm::AlignmentX::Right : muxm::AlignmentX::Center);
        brush.AlignmentY(alignY == 0 ? muxm::AlignmentY::Top : alignY == 2 ? muxm::AlignmentY::Bottom : muxm::AlignmentY::Center);
        panel.Background(brush);
        if (auto invalidated = element.try_as<mux::UIElement>()) invalidated.InvalidateArrange();
    }

    void Css::ReparentChild(muxc::Panel const& parent, mux::UIElement const& child, int32_t index)
    {
        if (!parent || !child) return;
        auto target = parent.Children();

        // Already a child of the target? Leave the element in place (avoid churn / spurious re-add) —
        // but STILL invalidate. Core's CustomLayoutView often inserts the new child into this same
        // Children collection BEFORE our appendNativeChild runs, so without this the child sits in the
        // tree un-laid-out (the preview "never budges" on add until an unrelated change forces a
        // relayout). Re-syncing + marking the root dirty positions it this pass.
        uint32_t existing = 0;
        if (target.IndexOf(child, existing)) { MarkLayoutRootDirty(parent); return; }
        if (auto host = mason_scroll::HostOf(child))
        {
            if (target.IndexOf(host, existing)) { MarkLayoutRootDirty(parent); return; }
        }
        mason_scroll::Release(child);

        // A hosted fixed box is represented here by its slot.
        if (auto hostedIn = mason_position::HostedParentOf(child))
        {
            if (mason_position::KeyOf(hostedIn) == mason_position::KeyOf(parent)) { MarkLayoutRootDirty(parent); return; }
        }
        mason_position::Release(child);

        // Detach from its current logical parent panel, if any. FrameworkElement.Parent is set the
        // moment an element is added to a Panel's Children (unlike the visual tree, which is only
        // populated at realization), so this reliably finds the prior owner before layout.
        if (auto fe = child.try_as<mux::FrameworkElement>())
        {
            if (auto oldPanel = fe.Parent().try_as<muxc::Panel>())
            {
                uint32_t oldIdx = 0;
                if (oldPanel.Children().IndexOf(child, oldIdx))
                {
                    oldPanel.Children().RemoveAt(oldIdx);
                    oldPanel.InvalidateMeasure();
                }
            }
        }

        const uint32_t size = target.Size();
        if (index >= 0 && static_cast<uint32_t>(index) < size)
        {
            target.InsertAt(static_cast<uint32_t>(index), child);
        }
        else
        {
            target.Append(child);
        }

        // Force the Mason panel to re-run measure/arrange. A custom Panel doesn't always re-layout
        // promptly on a reactive (off-layout-pass) Children mutation, so newly added children would
        // otherwise keep a stale (0,0) rect and visibly pile up at the origin until some unrelated
        // event flushed a layout pass. Invalidate the LAYOUT ROOT (which owns the single compute) so
        // the new child is positioned this pass.
        MarkLayoutRootDirty(parent);
    }

    void Css::RemoveChild(muxc::Panel const& parent, mux::UIElement const& child)
    {
        if (!parent || !child) return;
        mason_position::Release(child);
        mason_scroll::Release(child);
        auto target = parent.Children();
        uint32_t idx = 0;
        // IndexOf uses COM identity; the projected JS '===' does not, so JS-side removal silently
        // missed the element and left stale children behind on count-down.
        if (target.IndexOf(child, idx))
        {
            target.RemoveAt(idx);
        }
        // Invalidate either way: if core already removed the child from this collection, IndexOf
        // misses it, but the child SET still changed so the panel must re-sync + the root recompute
        // (else the preview "never budges" on count-down until an unrelated change forces relayout).
        MarkLayoutRootDirty(parent);
    }
}
