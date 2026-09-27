#include "pch.h"
#include "Image.h"
#include "Image.g.cpp"
#include "LeafCommon.h"
#include <winrt/NativeScript.Mason.h>
#include <winrt/Microsoft.UI.Xaml.Media.Imaging.h>
#include "VisualApply.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace imaging = winrt::Microsoft::UI::Xaml::Media::Imaging;
}

namespace winrt::NativeScript::Mason::implementation
{
    Image::Image()
    {
        m_node = nsm::Mason::Instance().CreateImageNode();
        m_image = muxc::Image();
        Children().Append(m_image);

        auto weak = winrt::make_weak(m_image);
        nsm::MeasureFunc cb = [weak](float kw, float kh, float aw, float ah) -> int64_t
        {
            auto img = weak.get();
            if (!img) return mason_leaf::PackMeasure(0.0f, 0.0f);
            float w = std::isnan(kw) ? aw : kw;
            float h = std::isnan(kh) ? ah : kh;
            img.Measure(Size{ w, h });
            auto d = img.DesiredSize();
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    void Image::Source(hstring const& value)
    {
        m_source = value;
        if (value.empty())
        {
            m_image.Source(nullptr);
        }
        else
        {
            winrt::Windows::Foundation::Uri uri{ value };
            m_image.Source(imaging::BitmapImage{ uri });
        }
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    Size Image::MeasureOverride(Size const& available)
    {
        m_image.Measure(available);
        return m_image.DesiredSize();
    }

    Size Image::ArrangeOverride(Size const& finalSize)
    {
        m_image.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
