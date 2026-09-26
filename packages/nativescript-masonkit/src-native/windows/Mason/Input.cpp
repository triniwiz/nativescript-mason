#include "pch.h"
#include "Input.h"
#include "Input.g.cpp"
#include "LeafCommon.h"
#include <winrt/NativeScript.Mason.h>
// Slider (IRangeBase.Value) and CheckBox/RadioButton (IToggleButton.IsChecked) resolve their
// accessors through the Controls.Primitives projection.
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include "VisualApply.h"
#include <cwchar>
#include <string>

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;

    double ParseDouble(winrt::hstring const& s)
    {
        try { return s.empty() ? 0.0 : std::stod(std::wstring(s)); }
        catch (...) { return 0.0; }
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Input::Input()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
        Rebuild();

        nsm::MeasureFunc cb = [this](float kw, float kh, float aw, float ah) -> int64_t
        {
            if (!m_control) return mason_leaf::PackMeasure(0.0f, 0.0f);
            float w = std::isnan(kw) ? aw : kw;
            float h = std::isnan(kh) ? ah : kh;
            m_control.Measure(Size{ w, h });
            auto d = m_control.DesiredSize();
            return mason_leaf::PackMeasure(d.Width, d.Height);
        };
        m_node.SetMeasure(cb);
    }

    void Input::Rebuild()
    {
        Children().Clear();
        mux::FrameworkElement control{ nullptr };
        switch (m_type)
        {
        case 4: control = muxc::PasswordBox(); break;                 // password
        case 7: control = muxc::NumberBox(); break;                  // number
        case 8: control = muxc::Slider(); break;                     // range
        case 2: control = muxc::CheckBox(); break;                   // checkbox
        case 6: control = muxc::RadioButton(); break;                // radio
        case 1: case 13: control = muxc::Button(); break;            // button / submit
        case 5: control = muxc::CalendarDatePicker(); break;         // date
        default: control = muxc::TextBox(); break;                   // text/email/tel/url/color/file
        }
        m_control = control;
        Children().Append(m_control);
        ApplyValue(m_value);
        ApplyPlaceholder(m_placeholder);
    }

    void Input::ApplyValue(hstring const& value)
    {
        if (!m_control) return;
        if (auto tb = m_control.try_as<muxc::TextBox>()) { tb.Text(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.Password(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.Value(ParseDouble(value)); }
        else if (auto sl = m_control.try_as<muxc::Slider>()) { sl.Value(ParseDouble(value)); }
        else if (auto btn = m_control.try_as<muxc::Button>()) { btn.Content(winrt::box_value(value)); }
        else if (auto cb = m_control.try_as<muxc::CheckBox>()) { cb.IsChecked(value == L"true"); }
        else if (auto rb = m_control.try_as<muxc::RadioButton>()) { rb.IsChecked(value == L"true"); }
    }

    void Input::ApplyPlaceholder(hstring const& value)
    {
        if (!m_control) return;
        if (auto tb = m_control.try_as<muxc::TextBox>()) { tb.PlaceholderText(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.PlaceholderText(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.PlaceholderText(value); }
    }

    void Input::Type(int32_t value)
    {
        if (m_type == value && m_control) return;
        m_type = value;
        Rebuild();
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    hstring Input::Value() const
    {
        if (!m_control) return m_value;
        if (auto tb = m_control.try_as<muxc::TextBox>()) return tb.Text();
        if (auto pb = m_control.try_as<muxc::PasswordBox>()) return pb.Password();
        if (auto nb = m_control.try_as<muxc::NumberBox>()) return winrt::to_hstring(nb.Value());
        if (auto sl = m_control.try_as<muxc::Slider>()) return winrt::to_hstring(sl.Value());
        if (auto cb = m_control.try_as<muxc::CheckBox>()) { auto v = cb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        if (auto rb = m_control.try_as<muxc::RadioButton>()) { auto v = rb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        return m_value;
    }

    void Input::Value(hstring const& value)
    {
        m_value = value;
        ApplyValue(value);
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    void Input::Placeholder(hstring const& value)
    {
        m_placeholder = value;
        ApplyPlaceholder(value);
    }

    Size Input::MeasureOverride(Size const& available)
    {
        if (!m_control) return Size{ 0, 0 };
        m_control.Measure(available);
        return m_control.DesiredSize();
    }

    Size Input::ArrangeOverride(Size const& finalSize)
    {
        if (m_control)
        {
            m_control.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        }
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
