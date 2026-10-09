#pragma once
#include "Css.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Css
    {
        Css() = default;

        static void ApplyBackground(winrt::Microsoft::UI::Xaml::UIElement const& element, uint32_t argb);
        static void ClearBackground(winrt::Microsoft::UI::Xaml::UIElement const& element);

        static void ApplyOpacity(winrt::Microsoft::UI::Xaml::UIElement const& element, double opacity);

        static void ApplyTransform(winrt::Microsoft::UI::Xaml::UIElement const& element,
            double m11, double m12, double m21, double m22, double offsetX, double offsetY);
        static void ClearTransform(winrt::Microsoft::UI::Xaml::UIElement const& element);

        static void ApplyCornerRadius(winrt::Microsoft::UI::Xaml::UIElement const& element,
            double offsetX, double offsetY, double width, double height, double radiusX, double radiusY);
        static void ClearClip(winrt::Microsoft::UI::Xaml::UIElement const& element);

        static winrt::NativeScript::Mason::CssImageResult CreateShadow(
            double width, double height, double blurRadius, double spread, double cornerRadius,
            double offsetX, double offsetY, uint32_t argb);

        static winrt::NativeScript::Mason::CssImageResult CreateBorder(
            double width, double height,
            double topWidth, double rightWidth, double bottomWidth, double leftWidth,
            uint32_t topArgb, uint32_t rightArgb, uint32_t bottomArgb, uint32_t leftArgb,
            double cornerRadius);

        static void ApplyLinearGradient(winrt::Microsoft::UI::Xaml::UIElement const& element,
            double angleDegrees, winrt::hstring const& stops, winrt::hstring const& interpolation);
        static void ApplyRadialGradientAt(winrt::Microsoft::UI::Xaml::UIElement const& element, double centerX, double centerY, double radiusX,
            double radiusY, hstring const& stops, hstring const& interpolation);
        static void ApplyBackgroundImage(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& source, int32_t fit, int32_t alignX,
            int32_t alignY);
        static void ApplyRadialGradient(winrt::Microsoft::UI::Xaml::UIElement const& element,
            winrt::hstring const& stops, winrt::hstring const& interpolation);

        static void ReparentChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent,
            winrt::Microsoft::UI::Xaml::UIElement const& child, int32_t index);

        static void RemoveChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent,
            winrt::Microsoft::UI::Xaml::UIElement const& child);

        static void ApplyShadow(winrt::Microsoft::UI::Xaml::UIElement const& element,
            double offsetX, double offsetY, double blurRadius, uint32_t argb, double cornerRadius);
        static void SetBoxShadow(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& shadows);
        static void SetFilter(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& filter);
        static void SetBackdropFilter(winrt::Microsoft::UI::Xaml::UIElement const& element, hstring const& filter);
        static void ClearShadow(winrt::Microsoft::UI::Xaml::UIElement const& element);
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Css : CssT<Css, implementation::Css>
    {
    };
}
