#pragma once
#include <cmath>
#include <cstdint>
#include <cstring>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Windows.UI.Text.h>
#include "Node.h"
#include "VisualApply.h"

namespace mason_form
{
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;

    struct TextStyle
    {
        bool hasColor{ false };
        uint32_t color{ 0 };
        double fontSize{ 0.0 };
        int32_t fontWeight{ 0 };
        bool hasFontStyle{ false };
        uint8_t fontStyle{ 0 };
        double letterSpacing{ 0.0 };
        uint8_t textAlign{ 0 };
        bool hasBackground{ false };
        winrt::hstring fontFamily;
        bool operator==(TextStyle const&) const = default;
    };

    inline void ReadTextStyle(winrt::NativeScript::Mason::Node const& node, TextStyle& s)
    {
        if (!node) return;
        uint32_t len = 0;
        const uint8_t* d = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->StyleData(len);
        if (!d) return;
        auto u8 = [&](uint32_t o) -> uint8_t { return o < len ? d[o] : 0; };
        auto i32 = [&](uint32_t o) -> int32_t { int32_t v = 0; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        auto f32 = [&](uint32_t o) -> float { float v = 0.0f; if (o + 4 <= len) std::memcpy(&v, d + o, 4); return v; };
        s.hasColor = u8(328) != 0;
        s.color = s.hasColor ? static_cast<uint32_t>(i32(324)) : 0;
        s.fontSize = u8(334) && i32(329) > 0 ? static_cast<double>(i32(329)) : 0.0;
        s.fontWeight = u8(339) && i32(335) > 0 ? i32(335) : 0;
        s.hasFontStyle = u8(345) != 0;
        s.fontStyle = s.hasFontStyle ? u8(344) : 0;
        s.letterSpacing = u8(367) ? static_cast<double>(f32(363)) : 0.0;
        s.textAlign = u8(374);
        uint32_t bg = 0;
        if (352 <= len) std::memcpy(&bg, d + 348, 4);
        s.hasBackground = (bg >> 24) != 0;
    }

    inline void OverrideTheme(muxc::Control const& control, std::initializer_list<const wchar_t*> keys, winrt::Microsoft::UI::Xaml::Media::Brush const& brush)
    {
        auto resources = control.Resources();
        for (auto key : keys)
        {
            auto boxed = winrt::box_value(winrt::hstring{ key });
            if (brush) resources.Insert(boxed, brush);
            else if (resources.HasKey(boxed)) resources.Remove(boxed);
        }
    }

    inline void RefreshTheme(muxc::Control const& control)
    {
        namespace mux = winrt::Microsoft::UI::Xaml;
        const auto theme = control.RequestedTheme();
        control.RequestedTheme(theme == mux::ElementTheme::Light ? mux::ElementTheme::Dark : mux::ElementTheme::Light);
        control.RequestedTheme(theme);
    }

    inline void ApplyBackground(muxc::Control const& control, bool transparent)
    {
        OverrideTheme(control, {
            L"TextControlBackground", L"TextControlBackgroundPointerOver", L"TextControlBackgroundFocused", L"TextControlBackgroundDisabled",
            L"ButtonBackground", L"ButtonBackgroundPointerOver", L"ButtonBackgroundPressed", L"ButtonBackgroundDisabled",
        }, transparent ? mason_visual::SharedSolid(0) : nullptr);
        if (transparent) control.Background(mason_visual::SharedSolid(0));
        else control.ClearValue(muxc::Control::BackgroundProperty());
    }

    inline void ApplyForeground(muxc::Control const& control, bool hasColor, uint32_t color)
    {
        OverrideTheme(control, {
            L"TextControlForeground", L"TextControlForegroundPointerOver", L"TextControlForegroundFocused",
            L"ButtonForeground", L"ButtonForegroundPointerOver", L"ButtonForegroundPressed",
        }, hasColor ? mason_visual::SharedSolid(color) : nullptr);
    }

    inline void ApplyTextStyle(muxc::Control const& control, TextStyle const& s, TextStyle& applied, bool force)
    {
        if (!control || (!force && s == applied)) return;
        using winrt::Windows::UI::Text::FontStyle;
        const bool background = force || s.hasBackground != applied.hasBackground;
        const bool foreground = force || s.hasColor != applied.hasColor || s.color != applied.color;
        if (background) ApplyBackground(control, s.hasBackground);
        if (foreground) ApplyForeground(control, s.hasColor, s.color);
        if (background || foreground) RefreshTheme(control);
        if (s.hasColor) control.Foreground(mason_visual::SharedSolid(s.color));
        else control.ClearValue(muxc::Control::ForegroundProperty());
        if (s.fontSize > 0.0) control.FontSize(s.fontSize);
        else control.ClearValue(muxc::Control::FontSizeProperty());
        if (s.fontWeight > 0) control.FontWeight(winrt::Windows::UI::Text::FontWeight{ static_cast<uint16_t>(s.fontWeight) });
        else control.ClearValue(muxc::Control::FontWeightProperty());
        if (s.hasFontStyle) control.FontStyle(s.fontStyle == 1 ? FontStyle::Italic : s.fontStyle == 2 ? FontStyle::Oblique : FontStyle::Normal);
        else control.ClearValue(muxc::Control::FontStyleProperty());
        if (!s.fontFamily.empty()) control.FontFamily(muxm::FontFamily(s.fontFamily));
        else control.ClearValue(muxc::Control::FontFamilyProperty());
        const double size = control.FontSize();
        if (s.letterSpacing != 0.0 && size > 0.0) control.CharacterSpacing(static_cast<int32_t>(std::lround(s.letterSpacing / size * 1000.0)));
        else control.ClearValue(muxc::Control::CharacterSpacingProperty());
        if (auto tb = control.try_as<muxc::TextBox>())
        {
            namespace mux = winrt::Microsoft::UI::Xaml;
            mux::TextAlignment a = mux::TextAlignment::Left;
            switch (s.textAlign)
            {
            case 2: case 6: a = mux::TextAlignment::Right; break;
            case 3: a = mux::TextAlignment::Center; break;
            case 4: a = mux::TextAlignment::Justify; break;
            default: break;
            }
            tb.TextAlignment(a);
        }
        applied = s;
    }
}
