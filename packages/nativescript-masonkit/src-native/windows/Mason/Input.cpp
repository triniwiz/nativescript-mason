#include "pch.h"
#include "Input.h"
#include "Input.g.cpp"
#include "Event.h"
#include "Events.h"
#include "LeafCommon.h"
#include "Node.h"
#include "Text.h"
#include <winrt/NativeScript.Mason.h>
// Slider (IRangeBase.Value) and CheckBox/RadioButton (IToggleButton.IsChecked) resolve their
// accessors through the Controls.Primitives projection.
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include "VisualApply.h"
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <ctime>
#include <optional>
#include <cwchar>
#include <string>

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxi = winrt::Microsoft::UI::Xaml::Input;

    enum : int32_t
    {
        kText = 0, kButton = 1, kCheckbox = 2, kEmail = 3, kPassword = 4, kDate = 5, kRadio = 6, kNumber = 7,
        kRange = 8, kTel = 9, kUrl = 10, kColor = 11, kFile = 12, kSubmit = 13, kSearch = 14, kTime = 15,
        kDateTimeLocal = 16, kMonth = 17, kWeek = 18, kReset = 19,
    };

    double ParseDouble(winrt::hstring const& s)
    {
        try { return s.empty() ? 0.0 : std::stod(std::wstring(s)); }
        catch (...) { return 0.0; }
    }

    std::optional<DateTime> ParseDate(winrt::hstring const& s)
    {
        int y = 0, m = 0, d = 0;
        if (swscanf_s(s.c_str(), L"%d-%d-%d", &y, &m, &d) != 3 || m < 1 || m > 12 || d < 1 || d > 31) return std::nullopt;
        std::tm tm{};
        tm.tm_year = y - 1900;
        tm.tm_mon = m - 1;
        tm.tm_mday = d;
        tm.tm_isdst = -1;
        const std::time_t t = std::mktime(&tm);
        if (t == -1) return std::nullopt;
        return winrt::clock::from_sys(std::chrono::system_clock::from_time_t(t));
    }

    winrt::hstring FormatDate(DateTime const& value)
    {
        const std::time_t t = std::chrono::system_clock::to_time_t(winrt::clock::to_sys(value));
        std::tm tm{};
        if (localtime_s(&tm, &t) != 0) return {};
        wchar_t buf[16]{};
        swprintf_s(buf, L"%04d-%02d-%02d", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);
        return buf;
    }

    std::optional<TimeSpan> ParseTime(winrt::hstring const& s)
    {
        int h = 0, m = 0;
        if (swscanf_s(s.c_str(), L"%d:%d", &h, &m) != 2 || h < 0 || h > 23 || m < 0 || m > 59) return std::nullopt;
        return std::chrono::hours(h) + std::chrono::minutes(m);
    }

    winrt::hstring FormatTime(TimeSpan const& value)
    {
        const int minutes = static_cast<int>(std::chrono::duration_cast<std::chrono::minutes>(value).count());
        wchar_t buf[8]{};
        swprintf_s(buf, L"%02d:%02d", (minutes / 60) % 24, minutes % 60);
        return buf;
    }

    muxi::InputScope ScopeFor(int32_t type)
    {
        muxi::InputScopeNameValue value;
        switch (type)
        {
        case kEmail: value = muxi::InputScopeNameValue::EmailNameOrAddress; break;
        case kTel: value = muxi::InputScopeNameValue::TelephoneNumber; break;
        case kUrl: value = muxi::InputScopeNameValue::Url; break;
        case kSearch: value = muxi::InputScopeNameValue::Search; break;
        default: return nullptr;
        }
        muxi::InputScope scope;
        scope.Names().Append(muxi::InputScopeName(value));
        return scope;
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Input::Input()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
        m_events = std::make_shared<mason_form::Events>();
        m_events->value = [this]() -> hstring { return Value(); };
        Rebuild();

        nsm::MeasureFunc cb = [this](float kw, float kh, float aw, float ah) -> int64_t
        {
            if (!m_control) return mason_leaf::PackMeasure(0.0f, 0.0f);
            SyncOrientation();
            auto slider = m_control.try_as<muxc::Slider>();
            if (!slider) return mason_leaf::MeasureXaml(m_control, kw, kh, aw, ah);
            constexpr float kRangeLength = 129.0f;
            m_control.Measure(Size{ mason_leaf::XamlConstraint(kw, aw), mason_leaf::XamlConstraint(kh, ah) });
            const auto d = m_control.DesiredSize();
            if (slider.Orientation() == muxc::Orientation::Vertical)
            {
                return mason_leaf::PackMeasure(std::isnan(kw) ? d.Width : kw, std::isnan(kh) ? kRangeLength : kh);
            }
            return mason_leaf::PackMeasure(std::isnan(kw) ? kRangeLength : kw, std::isnan(kh) ? d.Height : kh);
        };
        m_node.SetMeasure(cb);
    }

    void Input::Rebuild()
    {
        Children().Clear();
        mux::FrameworkElement control{ nullptr };
        switch (m_type)
        {
        case kPassword: control = muxc::PasswordBox(); break;
        case kNumber: control = muxc::NumberBox(); break;
        case kRange: control = muxc::Slider(); break;
        case kCheckbox: control = muxc::CheckBox(); break;
        case kRadio: control = muxc::RadioButton(); break;
        case kButton: case kSubmit: case kReset: control = muxc::Button(); break;
        case kDate: control = muxc::CalendarDatePicker(); break;
        case kTime: control = muxc::TimePicker(); break;
        default:
        {
            muxc::TextBox box;
            if (auto scope = ScopeFor(m_type)) box.InputScope(scope);
            control = box;
            break;
        }
        }
        m_control = control;
        Children().Append(m_control);
        ApplyValue(m_value);
        ApplyPlaceholder(m_placeholder);
        SyncOrientation();
        SyncTextStyle(true);
        m_events->Wire(m_control);
    }

    // A range follows the writing mode: vertical runs from the top as in browsers, and rtl flips it.
    void Input::SyncOrientation()
    {
        auto slider = m_control ? m_control.try_as<muxc::Slider>() : nullptr;
        if (!slider) return;
        auto* node = winrt::get_self<implementation::Node>(m_node);
        const bool vertical = mason_node_get_writing_mode(node->MasonPtr(), node->NodePtr()) != 0;
        const bool rtl = mason_node_get_direction(node->MasonPtr(), node->NodePtr()) != 0;
        const auto orientation = vertical ? muxc::Orientation::Vertical : muxc::Orientation::Horizontal;
        if (slider.Orientation() != orientation) slider.Orientation(orientation);
        if (slider.IsDirectionReversed() != (vertical != rtl)) slider.IsDirectionReversed(vertical != rtl);
    }

    void Input::SyncTextStyle(bool force)
    {
        auto control = m_control ? m_control.try_as<muxc::Control>() : nullptr;
        if (!control) return;
        mason_form::TextStyle style;
        mason_form::ReadTextStyle(m_node, style);
        style.fontFamily = m_fontFamily;
        mason_form::ApplyTextStyle(control, style, m_textApplied, force);
    }

    void Input::SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
    {
        m_visual.styleDirty = true;
        const auto dirty = mason_leaf::DirtyWords(d0, d1, d2, d3);
        if (mason_leaf::AnyDirty(dirty, mason_leaf::kControlKeys)) SyncTextStyle(false);
        mason_leaf::StyleSynced(get_strong().as<mux::UIElement>(), m_node, dirty);
    }

    void Input::SetFontFamily(hstring const& families)
    {
        m_fontFamily = Text::ResolveFontFamily(families);
        SyncTextStyle(false);
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    int64_t Input::AddEventListener(hstring const& type, nsm::EventListener const& listener)
    {
        return mason_events::Add(get_strong().as<mux::UIElement>(), type, listener);
    }

    bool Input::RemoveEventListener(hstring const& type, int64_t id)
    {
        mason_events::Remove(get_strong().as<mux::UIElement>(), type, id);
        return true;
    }

    void Input::ApplyValue(hstring const& value)
    {
        if (!m_control) return;
        m_events->applying = true;
        struct Done { mason_form::Events& events; ~Done() { events.applying = false; events.Settled(); } } done{ *m_events };
        // Writing the text it already has would move the caret.
        if (auto tb = m_control.try_as<muxc::TextBox>()) { if (tb.Text() != value) tb.Text(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.Password(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.Value(value.empty() ? std::nan("") : ParseDouble(value)); }
        else if (auto sl = m_control.try_as<muxc::Slider>()) { sl.Value(ParseDouble(value)); }
        else if (auto btn = m_control.try_as<muxc::Button>())
        {
            const hstring label = !value.empty() ? value : m_type == kSubmit ? hstring{ L"Submit" } : m_type == kReset ? hstring{ L"Reset" } : hstring{};
            btn.Content(winrt::box_value(label));
        }
        else if (auto cb = m_control.try_as<muxc::CheckBox>()) { cb.IsChecked(value == L"true"); }
        else if (auto rb = m_control.try_as<muxc::RadioButton>()) { rb.IsChecked(value == L"true"); }
        else if (auto date = m_control.try_as<muxc::CalendarDatePicker>())
        {
            if (auto parsed = ParseDate(value)) date.Date(*parsed);
            else date.Date(nullptr);
        }
        else if (auto time = m_control.try_as<muxc::TimePicker>())
        {
            if (auto parsed = ParseTime(value)) time.SelectedTime(*parsed);
            else time.SelectedTime(nullptr);
        }
    }

    void Input::ApplyPlaceholder(hstring const& value)
    {
        if (!m_control) return;
        if (auto tb = m_control.try_as<muxc::TextBox>()) { tb.PlaceholderText(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.PlaceholderText(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.PlaceholderText(value); }
        else if (auto date = m_control.try_as<muxc::CalendarDatePicker>()) { if (!value.empty()) date.PlaceholderText(value); }
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
        if (auto nb = m_control.try_as<muxc::NumberBox>()) { const double v = nb.Value(); return std::isnan(v) ? hstring{} : winrt::to_hstring(v); }
        if (auto sl = m_control.try_as<muxc::Slider>()) return winrt::to_hstring(sl.Value());
        if (auto cb = m_control.try_as<muxc::CheckBox>()) { auto v = cb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        if (auto rb = m_control.try_as<muxc::RadioButton>()) { auto v = rb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        if (auto date = m_control.try_as<muxc::CalendarDatePicker>()) { auto v = date.Date(); return v ? FormatDate(v.Value()) : hstring{}; }
        if (auto time = m_control.try_as<muxc::TimePicker>()) { auto v = time.SelectedTime(); return v ? FormatTime(v.Value()) : hstring{}; }
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
