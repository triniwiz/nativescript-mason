#include "pch.h"
#include "Image.h"
#include "Image.g.cpp"
#include "LeafCommon.h"
#include "Node.h"
#include <winrt/NativeScript.Mason.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Xaml.Media.Imaging.h>
#include <winrt/Windows.Security.Cryptography.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Streams.h>
#include "VisualApply.h"
#include "SvgPrepare.h"
#include "SvgSource.h"
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Windows.Web.Http.h>
#include <cmath>
#include <cstring>
#include <cwctype>

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;
    namespace imaging = winrt::Microsoft::UI::Xaml::Media::Imaging;

    struct Fit
    {
        uint8_t fit{ 2 };
        uint8_t xType{ 1 };
        uint8_t yType{ 1 };
        float x{ 50.0f };
        float y{ 50.0f };
    };

    Fit ReadFit(nsm::Node const& node)
    {
        Fit f;
        uint32_t size = 0;
        const uint8_t* d = winrt::get_self<nsm::implementation::Node>(node)->StyleData(size);
        if (!d || size < 571) return f;
        f.fit = d[276];
        if (d[570])
        {
            f.xType = d[560];
            f.yType = d[561];
            std::memcpy(&f.x, d + 562, 4);
            std::memcpy(&f.y, d + 566, 4);
        }
        return f;
    }

    bool IsAbsolutePath(std::wstring_view v)
    {
        const bool drive = v.size() > 2 && v[1] == L':' && (v[2] == L'\\' || v[2] == L'/');
        const bool rooted = !v.empty() && (v[0] == L'/' || v[0] == L'\\');
        return drive || rooted;
    }

    bool StartsWithIgnoreCase(std::wstring_view v, std::wstring_view prefix)
    {
        if (v.size() < prefix.size()) return false;
        for (size_t i = 0; i < prefix.size(); ++i) if (std::towlower(v[i]) != prefix[i]) return false;
        return true;
    }

    // A path or URL whose name (before any query or fragment) ends in .svg.
    bool HasSvgExtension(std::wstring_view v)
    {
        v = v.substr(0, v.find_first_of(L"?#"));
        return v.size() > 4 && StartsWithIgnoreCase(v.substr(v.size() - 4), L".svg");
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Image::Image()
    {
        m_node = nsm::Mason::Instance().CreateImageNode();
        m_image = muxc::Image();
        m_image.Stretch(muxm::Stretch::Fill);
        Children().Append(m_image);

        nsm::MeasureFunc cb = [natural = m_natural](float kw, float kh, float, float) -> int64_t
        {
            const float nw = natural->width, nh = natural->height;
            if (nw <= 0.0f || nh <= 0.0f) return mason_leaf::PackMeasure(std::isnan(kw) ? 0.0f : kw, std::isnan(kh) ? 0.0f : kh);
            if (!std::isnan(kw) && !std::isnan(kh)) return mason_leaf::PackMeasure(kw, kh);
            if (!std::isnan(kw)) return mason_leaf::PackMeasure(kw, kw * nh / nw);
            if (!std::isnan(kh)) return mason_leaf::PackMeasure(kh * nw / nh, kh);
            return mason_leaf::PackMeasure(nw, nh);
        };
        m_node.SetMeasure(cb);
    }

    void Image::Loaded(uint64_t generation, float width, float height)
    {
        if (generation != m_generation) return;
        m_natural->width = width;
        m_natural->height = height;
        m_visual.styleDirty = true;
        mason_leaf::StyleChanged(get_strong().as<mux::UIElement>(), m_node);
    }

    void Image::Source(hstring const& value)
    {
        m_source = value;
        const uint64_t generation = ++m_generation;
        m_natural->width = m_natural->height = 0.0f;
        ClearSvg();
        const std::wstring_view source = value;
        const bool remote = StartsWithIgnoreCase(source, L"http://") || StartsWithIgnoreCase(source, L"https://");
        if (value.empty())
        {
            m_image.Source(nullptr);
        }
        else if (StartsWithIgnoreCase(source, L"data:image/svg") || (HasSvgExtension(source) && (remote || IsAbsolutePath(source))))
        {
            // BitmapImage can't decode SVG; Mason's SVG path draws it.
            m_image.Source(nullptr);
            if (remote) LoadRemoteSvg(get_weak(), generation, value);
            else SvgLoaded(generation, std::make_shared<mason_cssmask::Image>(mason_css::LoadSvgImage(std::wstring(source))));
        }
        else
        {
            imaging::BitmapImage bitmap;
            bitmap.ImageOpened([weak = get_weak(), generation](IInspectable const& sender, auto&&)
            {
                auto self = weak.get();
                auto image = sender.try_as<imaging::BitmapImage>();
                if (self && image) self->Loaded(generation, static_cast<float>(image.PixelWidth()), static_cast<float>(image.PixelHeight()));
            });
            const std::wstring_view v = value;
            if (v.starts_with(L"data:"))
            {
                LoadData(bitmap, value);
            }
            else if (IsAbsolutePath(v))
            {
                LoadFile(bitmap, value);
            }
            else
            {
                try
                {
                    bitmap.UriSource(Uri{ value });
                }
                catch (...)
                {
                }
            }
            m_image.Source(bitmap);
        }
        mason_leaf::StyleChanged(get_strong().as<mux::UIElement>(), m_node);
    }

    winrt::fire_and_forget Image::LoadData(imaging::BitmapImage bitmap, hstring uri)
    {
        using namespace winrt::Windows::Security::Cryptography;
        using namespace winrt::Windows::Storage::Streams;
        try
        {
            winrt::apartment_context ui;
            const std::wstring_view v = uri;
            const size_t comma = v.find(L',');
            if (comma == std::wstring_view::npos) co_return;
            const std::wstring_view header = v.substr(5, comma - 5);
            const hstring payload{ v.substr(comma + 1) };
            const IBuffer bytes = header.ends_with(L";base64")
                ? CryptographicBuffer::DecodeFromBase64String(payload)
                : CryptographicBuffer::ConvertStringToBinary(Uri::UnescapeComponent(payload), BinaryStringEncoding::Utf8);
            InMemoryRandomAccessStream stream;
            co_await stream.WriteAsync(bytes);
            stream.Seek(0);
            co_await ui;
            co_await bitmap.SetSourceAsync(stream);
        }
        catch (...)
        {
        }
    }

    winrt::fire_and_forget Image::LoadFile(imaging::BitmapImage bitmap, hstring path)
    {
        try
        {
            winrt::apartment_context ui;
            auto file = co_await winrt::Windows::Storage::StorageFile::GetFileFromPathAsync(path);
            auto stream = co_await file.OpenReadAsync();
            co_await ui;
            co_await bitmap.SetSourceAsync(stream);
        }
        catch (...)
        {
        }
    }

    winrt::fire_and_forget Image::LoadRemoteSvg(winrt::weak_ref<Image> weak, uint64_t generation, hstring uri)
    {
        try
        {
            winrt::apartment_context ui;
            winrt::Windows::Web::Http::HttpClient client;
            const hstring text = co_await client.GetStringAsync(Uri{ uri });
            auto svg = std::make_shared<mason_cssmask::Image>(mason_css::PrepareSvgImage(winrt::to_string(text)));
            co_await ui;
            if (auto self = weak.get()) self->SvgLoaded(generation, svg);
        }
        catch (...)
        {
        }
    }

    void Image::SvgLoaded(uint64_t generation, std::shared_ptr<mason_cssmask::Image> svg)
    {
        if (generation != m_generation || !svg || svg->kind != mason_cssmask::Image::Kind::Svg) return;
        m_svg = std::move(svg);
        const auto [width, height] = mason_svg::IntrinsicSize(m_svg->svg);
        Loaded(generation, width, height);
    }

    void Image::ClearSvg()
    {
        m_svg = nullptr;
        m_svgPainted.clear();
        if (m_svgVisual)
        {
            mason_deco::SetLayer(get_strong().as<mux::UIElement>(), L"mason-img", nullptr);
            m_svgVisual = nullptr;
        }
        mason_cssmask::ReleaseSurface(m_svgKey);
    }

    // The SVG at its object-fit box, rasterized at the device scale, clipped to the element.
    void Image::PaintSvg(Rect const& content, float width, float height)
    {
        auto comp = mason_deco::ThreadCompositor();
        if (!comp || !m_svg) return;
        if (!m_svgVisual)
        {
            // In the decoration tree as content, over the box's background and border.
            m_svgVisual = comp.CreateSpriteVisual();
            mason_deco::SetLayer(get_strong().as<mux::UIElement>(), L"mason-img", m_svgVisual);
        }
        m_svgVisual.Offset({ content.X, content.Y, 0.0f });
        m_svgVisual.Size({ content.Width, content.Height });
        m_svgVisual.Clip(comp.CreateInsetClip((std::max)(0.0f, -content.X), (std::max)(0.0f, -content.Y),
            (std::max)(0.0f, content.X + content.Width - width), (std::max)(0.0f, content.Y + content.Height - height)));
        const auto self = get_strong().as<mux::UIElement>();
        const float scale = mason_cssmask::ScaleOf(self);
        const uint32_t color = m_svg->currentColor ? mason_visual::CurrentColor(self) : 0xFF000000u;
        const float pw = std::ceil(content.Width * scale), ph = std::ceil(content.Height * scale);
        if (pw < 1.0f || ph < 1.0f || pw > 8192.0f || ph > 8192.0f) return;
        if (m_svgKey.empty()) m_svgKey = "img-svg:" + std::to_string(reinterpret_cast<uintptr_t>(this));
        const std::string painted = std::to_string(pw) + "x" + std::to_string(ph) + ":" + std::to_string(color);
        if (painted == m_svgPainted) return;
        auto svg = m_svg;
        auto brush = mason_cssmask::PaintSurface(m_svgKey, pw, ph, [svg, color](ID2D1DeviceContext* ctx, float w, float h)
        {
            // Drawn on a tile of its own, as backgrounds are, so masks can composite offscreen.
            D2D1_MATRIX_3X2_F transform;
            ctx->GetTransform(&transform);
            winrt::com_ptr<ID2D1Image> target;
            ctx->GetTarget(target.put());
            auto tile = mason_cssmask::TargetBitmap(ctx, static_cast<uint32_t>(w), static_cast<uint32_t>(h));
            if (!tile) return;
            ctx->SetTarget(tile.get());
            ctx->SetTransform(D2D1::Matrix3x2F::Identity());
            ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
            mason_cssmask::DrawImage(ctx, *svg, w, h, color);
            ctx->SetTarget(target.get());
            ctx->SetTransform(transform);
            ctx->DrawBitmap(tile.get(), D2D1::RectF(0.0f, 0.0f, w, h), 1.0f, D2D1_INTERPOLATION_MODE_NEAREST_NEIGHBOR, nullptr);
        });
        if (!brush) return;
        m_svgVisual.Brush(brush);
        m_svgPainted = painted;
    }

    Size Image::MeasureOverride(Size const&)
    {
        m_image.Measure(Size{ 0.0f, 0.0f });
        return Size{ 0.0f, 0.0f };
    }

    Size Image::ArrangeOverride(Size const& finalSize)
    {
        const float w = finalSize.Width, h = finalSize.Height;
        const float nw = m_natural->width, nh = m_natural->height;
        Rect content{ 0.0f, 0.0f, w, h };
        if (nw > 0.0f && nh > 0.0f && w > 0.0f && h > 0.0f)
        {
            const Fit f = ReadFit(m_node);
            const float contain = (std::min)(w / nw, h / nh);
            float cw = w, ch = h;
            switch (f.fit)
            {
            case 0:
                cw = nw * contain;
                ch = nh * contain;
                break;
            case 1:
            {
                const float s = (std::max)(w / nw, h / nh);
                cw = nw * s;
                ch = nh * s;
                break;
            }
            case 3:
                cw = nw;
                ch = nh;
                break;
            case 4:
            {
                const float s = (std::min)(1.0f, contain);
                cw = nw * s;
                ch = nh * s;
                break;
            }
            default:
                break;
            }
            const float x = f.xType == 1 ? (w - cw) * f.x / 100.0f : f.x;
            const float y = f.yType == 1 ? (h - ch) * f.y / 100.0f : f.y;
            content = Rect{ x, y, cw, ch };
        }
        m_image.Arrange(content);
        if (m_svg) PaintSvg(content, w, h);
        uint32_t size = 0;
        const uint8_t* data = winrt::get_self<implementation::Node>(m_node)->StyleData(size);
        const auto radii = mason_shape::Read(data, size, w, h);
        const bool overflows = content.X < 0.0f || content.Y < 0.0f || content.X + content.Width > w || content.Y + content.Height > h;
        if (m_svgVisual && radii.Any())
        {
            // The SVG sprite sits at the content box; clip it to the rounded border box too.
            auto comp = m_svgVisual.Compositor();
            if (auto geo = mason_shape::Geometry(comp, w, h, radii))
            {
                auto clip = comp.CreateGeometricClip(geo);
                clip.Offset({ -content.X, -content.Y });
                m_svgVisual.Clip(clip);
            }
        }
        if (overflows || radii.Any() || m_clipped)
        {
            auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(m_image);
            if (overflows || radii.Any())
            {
                auto comp = visual.Compositor();
                auto geo = mason_shape::Geometry(comp, w, h, radii);
                if (geo)
                {
                    auto clip = comp.CreateGeometricClip(geo);
                    clip.Offset({ -content.X, -content.Y });
                    visual.Clip(clip);
                }
            }
            else
            {
                visual.Clip(nullptr);
            }
            m_clipped = overflows || radii.Any();
        }
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, w, h, m_visual);
        return finalSize;
    }
}
