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
#include <cmath>
#include <cstring>

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
        if (value.empty())
        {
            m_image.Source(nullptr);
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
        uint32_t size = 0;
        const uint8_t* data = winrt::get_self<implementation::Node>(m_node)->StyleData(size);
        const auto radii = mason_shape::Read(data, size, w, h);
        const bool overflows = content.X < 0.0f || content.Y < 0.0f || content.X + content.Width > w || content.Y + content.Height > h;
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
