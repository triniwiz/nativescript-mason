#include "pch.h"
#include "Button.h"
#include "Button.g.cpp"
#include "LeafCommon.h"
#include <winrt/NativeScript.Mason.h>
#include "VisualApply.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
}

namespace winrt::NativeScript::Mason::implementation
{
    Button::Button()
    {
        m_node = nsm::Mason::Instance().CreateButtonNode();
        m_button = muxc::Button();
        Children().Append(m_button);

        auto weak = winrt::make_weak(m_button);
        nsm::MeasureFunc cb = [weak](float kw, float kh, float aw, float ah) -> int64_t
        {
            auto b = weak.get();
            if (!b) return mason_leaf::PackMeasure(0.0f, 0.0f);
            return mason_leaf::MeasureXaml(b, kw, kh, aw, ah);
        };
        m_node.SetMeasure(cb);
    }

    void Button::Content(hstring const& value)
    {
        m_content = value;
        m_button.Content(winrt::box_value(value));
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    Size Button::MeasureOverride(Size const& available)
    {
        m_button.Measure(available);
        return m_button.DesiredSize();
    }

    Size Button::ArrangeOverride(Size const& finalSize)
    {
        m_button.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
