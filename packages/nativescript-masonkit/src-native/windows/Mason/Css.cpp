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

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <string>
#include <string_view>
#include <vector>
#include "BufferUtil.h"
#include "Decoration.h"
#include "Positioning.h"
#include "LeafCommon.h"

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
        // The panel re-syncs its children in its next measure; the engine marks the node's ancestors
        // dirty itself, and XAML needs every Mason ancestor invalidated so the layout root recomputes.
        panel.InvalidateMeasure();
        panel.InvalidateArrange();
        if (auto el = panel.try_as<nsm::IMasonElement>())
        {
            if (auto node = el.Node()) node.MarkDirty();
        }
        winrt::Microsoft::UI::Xaml::FrameworkElement cur = panel;
        while (cur)
        {
            if (cur.try_as<nsm::IMasonElement>())
            {
                if (!mason_leaf::MarkInvalidated(winrt::get_abi(cur))) break;
                cur.InvalidateMeasure();
                cur.InvalidateArrange();
            }
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>() : nullptr;
        }
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

namespace winrt::NativeScript::Mason::implementation
{
    namespace
    {
        namespace mucomp = winrt::Microsoft::UI::Composition;
        namespace hosting = winrt::Microsoft::UI::Xaml::Hosting;

        // Build a Composition DropShadow masked to a rounded rectangle of the element's size and attach
        // it as the element's child visual. The shadow's blur halo extends past the element's opaque
        // body, reading as a drop shadow / colored glow. Called now (if already sized) and on every
        // SizeChanged so it tracks layout + window resize.
        void BuildShadow(mux::UIElement const& element, double ox, double oy, double blur, uint32_t argb, double cr)
        {
            auto fe = element.try_as<mux::FrameworkElement>();
            if (!fe) return;
            const float w = static_cast<float>(fe.ActualWidth());
            const float h = static_cast<float>(fe.ActualHeight());
            if (w <= 0.0f || h <= 0.0f) return;

            // Match the element's border-radius (StyleKeys BORDER_RADIUS_TOP_LEFT_X_VALUE = 226, f32;
            // type byte 218 is 1 for a percent), clamped to half the smaller side — same as VisualApply's
            // clip — so the shadow matches the painted rounded corner. Falls back to the passed cr if the
            // node/buffer isn't available.
            if (auto el = element.try_as<nsm::IMasonElement>())
            {
                if (auto style = el.Node() ? el.Node().Style() : nullptr)
                {
                    if (auto buf = style.Values())
                    {
                        if (auto access = buf.try_as<mason_buf::IBufferByteAccess>())
                        {
                            uint8_t* data = nullptr;
                            if (SUCCEEDED(access->Buffer(&data)) && data && buf.Length() >= 230)
                            {
                                float r = 0.0f; std::memcpy(&r, data + 226, 4);
                                if (data[218] == 1) r *= (w < h ? w : h);
                                if (r > 0.0f) cr = r;
                            }
                        }
                    }
                }
            }
            const float maxR = (w < h ? w : h) * 0.5f;
            if (cr > maxR) cr = maxR;

            auto visual = hosting::ElementCompositionPreview::GetElementVisual(element);
            if (!visual) return;
            auto comp = visual.Compositor();

            auto shadow = comp.CreateDropShadow();
            shadow.Color(ColorFromArgb(argb));
            shadow.BlurRadius(static_cast<float>(blur));
            shadow.Offset({ static_cast<float>(ox), static_cast<float>(oy), 0.0f });

            // Mask the shadow to the rounded-rect shape so it matches border-radius.
            auto geo = comp.CreateRoundedRectangleGeometry();
            geo.Size({ w, h });
            geo.CornerRadius({ static_cast<float>(cr), static_cast<float>(cr) });
            auto shape = comp.CreateSpriteShape(geo);
            shape.FillBrush(comp.CreateColorBrush(winrt::Windows::UI::Colors::White()));
            auto shapeVisual = comp.CreateShapeVisual();
            shapeVisual.Size({ w, h });
            shapeVisual.Shapes().Append(shape);
            auto surface = comp.CreateVisualSurface();
            surface.SourceVisual(shapeVisual);
            surface.SourceSize({ w, h });
            shadow.Mask(comp.CreateSurfaceBrush(surface));

            auto sprite = comp.CreateSpriteVisual();
            sprite.Size({ w, h });
            sprite.Shadow(shadow);
            mason_deco::SetLayer(element, L"mason-shadow", sprite);
        }
    }

    void Css::ApplyShadow(mux::UIElement const& element, double ox, double oy, double blur, uint32_t argb, double cr)
    {
        if (!element) return;
        auto fe = element.try_as<mux::FrameworkElement>();
        if (!fe) return;
        BuildShadow(element, ox, oy, blur, argb, cr); // apply now if already laid out
        // Re-apply once a real size is known + on every resize (box-shadow is set before layout).
        fe.SizeChanged([ox, oy, blur, argb, cr](winrt::Windows::Foundation::IInspectable const& sender, mux::SizeChangedEventArgs const&)
        {
            if (auto el = sender.try_as<mux::UIElement>()) BuildShadow(el, ox, oy, blur, argb, cr);
        });
    }

    void Css::ClearShadow(mux::UIElement const& element)
    {
        if (!element) return;
        mason_deco::SetLayer(element, L"mason-shadow", nullptr);
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
    // GradientStops to `stops`. `Type x{}` (not `Type x;`) is required to construct projected objects.
    static void AppendGradientStops(winrt::Windows::Foundation::Collections::IVector<muxm::GradientStop> const& dst, std::wstring_view spec)
    {
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
                    float off = std::stof(offStr);
                    uint32_t argb = static_cast<uint32_t>(std::stoul(argbStr));
                    muxm::GradientStop stop{};
                    stop.Color(ColorFromArgb(argb));
                    stop.Offset(off);
                    dst.Append(stop);
                }
                catch (...) {}
            }
            if (comma == std::wstring_view::npos) break;
            pos = comma + 1;
        }
    }

    void Css::ApplyLinearGradient(mux::UIElement const& element, double angleDegrees, winrt::hstring const& stops)
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
        AppendGradientStops(brush.GradientStops(), std::wstring_view(stops));
        panel.Background(brush);
    }

    void Css::ApplyRadialGradient(mux::UIElement const& element, winrt::hstring const& stops)
    {
        auto panel = element ? element.try_as<muxc::Panel>() : nullptr;
        if (!panel) return;

        muxm::RadialGradientBrush brush{};
        AppendGradientStops(brush.GradientStops(), std::wstring_view(stops));
        panel.Background(brush);
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
