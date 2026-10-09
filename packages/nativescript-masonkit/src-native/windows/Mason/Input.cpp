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
#include <winrt/Microsoft.UI.Content.h>
#include <winrt/Microsoft.UI.Interop.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Pickers.h>
#include <winrt/Windows.UI.h>
#include <shobjidl_core.h>
#include <shlwapi.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <ctime>
#include <optional>
#include <cwchar>
#include <cwctype>
#include <string>
#include <utility>

#pragma comment(lib, "shlwapi.lib")

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

    std::optional<uint32_t> ParseHexColor(winrt::hstring const& s)
    {
        std::wstring_view v{ s };
        if ((v.size() != 4 && v.size() != 7) || v[0] != L'#') return std::nullopt;
        uint32_t rgb = 0;
        for (size_t i = 1; i < v.size(); ++i)
        {
            const wchar_t c = v[i];
            uint32_t n = 0;
            if (c >= L'0' && c <= L'9') n = c - L'0';
            else if (c >= L'a' && c <= L'f') n = c - L'a' + 10;
            else if (c >= L'A' && c <= L'F') n = c - L'A' + 10;
            else return std::nullopt;
            rgb = (rgb << 4) | n;
            if (v.size() == 4) rgb = (rgb << 4) | n;
        }
        return rgb;
    }

    winrt::hstring HexOf(uint32_t rgb)
    {
        wchar_t buf[8]{};
        swprintf_s(buf, L"#%06x", rgb & 0xFFFFFF);
        return buf;
    }

    std::vector<winrt::hstring> FileTypesFor(winrt::hstring const& accept)
    {
        static const std::pair<const wchar_t*, const wchar_t*> kTypes[] = {
            { L"image/*", L".png .jpg .jpeg .gif .bmp .webp .svg .ico .tif .tiff .heic .avif" },
            { L"video/*", L".mp4 .mov .avi .wmv .mkv .webm .m4v" },
            { L"audio/*", L".mp3 .wav .m4a .aac .flac .ogg .wma .opus" },
            { L"image/png", L".png" }, { L"image/jpeg", L".jpg .jpeg" }, { L"image/gif", L".gif" }, { L"image/webp", L".webp" },
            { L"image/svg+xml", L".svg" }, { L"application/pdf", L".pdf" }, { L"application/json", L".json" },
            { L"application/zip", L".zip" }, { L"text/plain", L".txt" }, { L"text/csv", L".csv" }, { L"text/html", L".html .htm" },
        };
        std::vector<winrt::hstring> out;
        auto add = [&](std::wstring_view ext)
        {
            winrt::hstring h{ ext };
            if (std::find(out.begin(), out.end(), h) == out.end()) out.push_back(h);
        };
        const std::wstring_view all{ accept };
        bool any = false;
        size_t pos = 0;
        while (pos < all.size())
        {
            size_t end = all.find(L',', pos);
            if (end == std::wstring_view::npos) end = all.size();
            std::wstring part{ all.substr(pos, end - pos) };
            pos = end + 1;
            const size_t first = part.find_first_not_of(L" \t");
            if (first == std::wstring::npos) continue;
            part = part.substr(first, part.find_last_not_of(L" \t") - first + 1);
            std::transform(part.begin(), part.end(), part.begin(), [](wchar_t c) { return static_cast<wchar_t>(std::towlower(c)); });
            if (part[0] == L'.')
            {
                add(part);
                continue;
            }
            bool known = false;
            for (auto const& [mime, exts] : kTypes)
            {
                if (part != mime) continue;
                known = true;
                const std::wstring_view list{ exts };
                size_t at = 0;
                while (at < list.size())
                {
                    size_t space = list.find(L' ', at);
                    if (space == std::wstring_view::npos) space = list.size();
                    add(list.substr(at, space - at));
                    at = space + 1;
                }
            }
            if (!known) any = true;
        }
        if (any || out.empty()) return { L"*" };
        return out;
    }

    winrt::hstring FileUri(winrt::hstring const& path)
    {
        wchar_t buf[2084]{};
        DWORD size = ARRAYSIZE(buf);
        if (SUCCEEDED(UrlCreateFromPathW(path.c_str(), buf, &size, 0))) return winrt::hstring{ buf, size };
        return path;
    }

    HWND WindowOf(mux::UIElement const& element)
    {
        try
        {
            if (auto root = element.XamlRoot())
            {
                if (auto env = root.ContentIslandEnvironment())
                {
                    if (HWND hwnd = winrt::Microsoft::UI::GetWindowFromWindowId(env.AppWindowId())) return hwnd;
                }
            }
        }
        catch (...)
        {
        }
        return GetActiveWindow();
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
        m_swatch = nullptr;
        m_fileButton = nullptr;
        m_fileLabel = nullptr;
        m_fileNames.clear();
        mux::FrameworkElement control{ nullptr };
        switch (m_type)
        {
        case kColor: control = BuildColor(); break;
        case kFile: control = BuildFile(); break;
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
        auto control = m_fileButton ? m_fileButton.as<muxc::Control>() : m_control ? m_control.try_as<muxc::Control>() : nullptr;
        if (!control) return;
        mason_form::TextStyle style;
        mason_form::ReadTextStyle(m_node, style);
        style.fontFamily = m_fontFamily;
        if (!force && style == m_textApplied) return;
        mason_form::ApplyTextStyle(control, style, m_textApplied, force);
        if (!m_fileLabel) return;
        if (style.hasColor) m_fileLabel.Foreground(mason_visual::SharedSolid(style.color));
        else m_fileLabel.ClearValue(muxc::TextBlock::ForegroundProperty());
        m_fileLabel.FontSize(control.FontSize());
        m_fileLabel.FontFamily(control.FontFamily());
        m_fileLabel.FontWeight(control.FontWeight());
        m_fileLabel.FontStyle(control.FontStyle());
    }

    mux::FrameworkElement Input::BuildColor()
    {
        muxc::Button button;
        button.Padding(mux::Thickness{ 4, 4, 4, 4 });
        button.MinWidth(0);
        button.MinHeight(0);
        muxc::Border swatch;
        swatch.Width(40);
        swatch.Height(15);
        swatch.CornerRadius(mux::CornerRadius{ 2, 2, 2, 2 });
        swatch.BorderThickness(mux::Thickness{ 1, 1, 1, 1 });
        swatch.BorderBrush(mason_visual::SharedSolid(0x66000000));
        button.Content(swatch);
        m_swatch = swatch;

        muxc::ColorPicker picker;
        picker.IsAlphaEnabled(false);
        picker.IsColorChannelTextInputVisible(false);
        muxc::Button ok;
        ok.Content(winrt::box_value(L"OK"));
        ok.HorizontalAlignment(mux::HorizontalAlignment::Stretch);
        try
        {
            if (auto accent = mux::Application::Current().Resources().TryLookup(winrt::box_value(L"AccentButtonStyle"))) ok.Style(accent.as<mux::Style>());
        }
        catch (...)
        {
        }
        muxc::Button cancel;
        cancel.Content(winrt::box_value(L"Cancel"));
        cancel.HorizontalAlignment(mux::HorizontalAlignment::Stretch);
        muxc::Grid actions;
        actions.ColumnSpacing(8);
        actions.ColumnDefinitions().Append(muxc::ColumnDefinition());
        actions.ColumnDefinitions().Append(muxc::ColumnDefinition());
        muxc::Grid::SetColumn(cancel, 1);
        actions.Children().Append(ok);
        actions.Children().Append(cancel);
        muxc::StackPanel panel;
        panel.Spacing(12);
        panel.Children().Append(picker);
        panel.Children().Append(actions);
        muxc::Flyout flyout;
        flyout.Content(panel);
        flyout.Placement(muxc::Primitives::FlyoutPlacementMode::Bottom);
        button.Flyout(flyout);

        auto accepted = std::make_shared<bool>(false);
        auto weak = get_weak();
        auto weakPicker = winrt::make_weak(picker);
        auto weakFlyout = winrt::make_weak(flyout);
        flyout.Opening([weak, weakPicker, accepted](auto&&, auto&&)
        {
            *accepted = false;
            auto self = weak.get();
            auto p = weakPicker.get();
            if (!self || !p) return;
            const uint32_t rgb = ParseHexColor(self->m_value).value_or(0);
            p.Color(winrt::Windows::UI::Color{ 255, static_cast<uint8_t>(rgb >> 16), static_cast<uint8_t>(rgb >> 8), static_cast<uint8_t>(rgb) });
        });
        ok.Click([weak, weakPicker, weakFlyout, accepted](auto&&, auto&&)
        {
            auto self = weak.get();
            auto p = weakPicker.get();
            if (!self || !p) return;
            *accepted = true;
            const auto c = p.Color();
            const uint32_t rgb = (static_cast<uint32_t>(c.R) << 16) | (static_cast<uint32_t>(c.G) << 8) | c.B;
            self->m_value = HexOf(rgb);
            if (self->m_swatch) self->m_swatch.Background(mason_visual::SharedSolid(0xFF000000 | rgb));
            self->m_events->pendingData = self->m_value;
            self->m_events->pendingType = L"insertReplacementText";
            self->m_events->Edited(L"insertReplacementText");
            self->m_events->Commit();
            if (auto f = weakFlyout.get()) f.Hide();
        });
        cancel.Click([weakFlyout](auto&&, auto&&)
        {
            if (auto f = weakFlyout.get()) f.Hide();
        });
        flyout.Closed([weak, accepted](auto&&, auto&&)
        {
            if (*accepted) return;
            auto self = weak.get();
            if (!self) return;
            auto e = winrt::make_self<Event>(L"cancel", false);
            e->data = self->Value();
            self->m_events->Dispatch(e, true);
        });
        return button;
    }

    mux::FrameworkElement Input::BuildFile()
    {
        muxc::StackPanel panel;
        panel.Orientation(muxc::Orientation::Horizontal);
        panel.Spacing(6);
        muxc::Button button;
        button.Content(winrt::box_value(L"Browse\u2026"));
        muxc::TextBlock label;
        label.Text(L"No file selected");
        label.VerticalAlignment(mux::VerticalAlignment::Center);
        label.TextTrimming(mux::TextTrimming::CharacterEllipsis);
        panel.Children().Append(button);
        panel.Children().Append(label);
        button.Click([weak = get_weak()](auto&&, auto&&)
        {
            if (auto self = weak.get()) self->PickFiles();
        });
        m_fileButton = button;
        m_fileLabel = label;
        return panel;
    }

    winrt::fire_and_forget Input::PickFiles()
    {
        if (m_picking) co_return;
        auto weak = get_weak();
        namespace wsp = winrt::Windows::Storage::Pickers;
        wsp::FileOpenPicker picker;
        picker.ViewMode(wsp::PickerViewMode::List);
        for (auto const& type : FileTypesFor(m_accept)) picker.FileTypeFilter().Append(type);
        if (auto init = picker.try_as<::IInitializeWithWindow>()) init->Initialize(WindowOf(*this));
        const bool multiple = m_multiple;
        m_picking = true;
        std::vector<hstring> names;
        std::vector<hstring> uris;
        try
        {
            if (multiple)
            {
                auto files = co_await picker.PickMultipleFilesAsync();
                for (auto const& file : files)
                {
                    names.push_back(file.Name());
                    uris.push_back(FileUri(file.Path()));
                }
            }
            else if (auto file = co_await picker.PickSingleFileAsync())
            {
                names.push_back(file.Name());
                uris.push_back(FileUri(file.Path()));
            }
        }
        catch (...)
        {
        }
        auto self = weak.get();
        if (!self) co_return;
        self->m_picking = false;
        if (names.empty())
        {
            self->m_events->Dispatch(winrt::make_self<Event>(L"cancel", false), true);
            co_return;
        }
        self->FilesPicked(std::move(names), std::move(uris));
    }

    void Input::FilesPicked(std::vector<hstring> names, std::vector<hstring> uris)
    {
        std::wstring joined;
        for (auto const& name : names)
        {
            if (!joined.empty()) joined += L", ";
            joined += name;
        }
        auto make = [&](wchar_t const* type, bool cancelable, wchar_t const* inputType)
        {
            auto e = winrt::make_self<Event>(type, cancelable);
            e->data = hstring{ joined };
            e->inputType = inputType;
            e->files = uris;
            return e;
        };
        if (!m_events->Dispatch(make(L"beforeinput", true, L"insertFromFile"), true)) return;
        m_fileNames = std::move(names);
        if (m_fileLabel)
        {
            m_fileLabel.Text(m_fileNames.size() == 1 ? m_fileNames.front() : winrt::to_hstring(m_fileNames.size()) + L" files selected");
        }
        m_node.MarkDirty();
        InvalidateMeasure();
        m_events->Settled();
        m_events->Dispatch(make(L"input", false, L"insertFromFile"), true);
        m_events->Dispatch(make(L"change", false, L""), true);
    }

    void Input::ResetFiles()
    {
        m_fileNames.clear();
        if (m_fileLabel) m_fileLabel.Text(L"No file selected");
        m_node.MarkDirty();
        InvalidateMeasure();
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
        if (m_type == kColor)
        {
            if (m_swatch) m_swatch.Background(mason_visual::SharedSolid(0xFF000000 | ParseHexColor(value).value_or(0)));
            return;
        }
        if (m_type == kFile)
        {
            if (value.empty() && !m_fileNames.empty()) ResetFiles();
            return;
        }
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
        if (m_type == kColor) return HexOf(ParseHexColor(m_value).value_or(0));
        if (m_type == kFile) return m_fileNames.empty() || !m_fileLabel ? hstring{} : m_fileLabel.Text();
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
