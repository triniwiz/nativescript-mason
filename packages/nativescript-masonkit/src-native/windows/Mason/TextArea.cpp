#include "pch.h"
#include "TextArea.h"
#include "TextArea.g.cpp"
#include "LeafCommon.h"
#include <winrt/NativeScript.Mason.h>
#include "VisualApply.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    constexpr double kLineHeight = 20.0;
}

namespace winrt::NativeScript::Mason::implementation
{
    TextArea::TextArea()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
        m_box = muxc::TextBox();
        m_box.AcceptsReturn(true);
        m_box.TextWrapping(mux::TextWrapping::Wrap);
        Children().Append(m_box);

        auto weak = winrt::make_weak(m_box);
        nsm::MeasureFunc cb = [weak](float kw, float kh, float aw, float ah) -> int64_t
        {
            auto b = weak.get();
            if (!b) return mason_leaf::PackMeasure(0.0f, 0.0f);
            float w = std::isnan(kw) ? aw : kw;
            float h = std::isnan(kh) ? ah : kh;
            b.Measure(Size{ w, h });
            auto d = b.DesiredSize();
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    hstring TextArea::Value() const { return m_box.Text(); }
    void TextArea::Value(hstring const& value) { m_box.Text(value); m_node.MarkDirty(); InvalidateMeasure(); }

    hstring TextArea::Placeholder() const { return m_box.PlaceholderText(); }
    void TextArea::Placeholder(hstring const& value) { m_box.PlaceholderText(value); }

    void TextArea::Rows(int32_t value)
    {
        m_rows = value;
        if (value > 0) m_box.MinHeight(value * kLineHeight);
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    void TextArea::Cols(int32_t value)
    {
        m_cols = value;
        if (value > 0) m_box.MinWidth(value * (kLineHeight * 0.5));
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    int32_t TextArea::MaxLength() const { return m_box.MaxLength(); }
    void TextArea::MaxLength(int32_t value) { m_box.MaxLength(value); }

    Size TextArea::MeasureOverride(Size const& available)
    {
        m_box.Measure(available);
        return m_box.DesiredSize();
    }

    Size TextArea::ArrangeOverride(Size const& finalSize)
    {
        m_box.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
