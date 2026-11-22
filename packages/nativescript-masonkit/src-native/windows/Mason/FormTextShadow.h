#pragma once
// CSS text-shadow on a form field's text. A TextBox (or PasswordBox, NumberBox) draws its text
// itself, so Text's DirectWrite shadows can't reach it. Instead each template text part (the editor,
// "ContentElement", and the placeholder) is copied through a CompositionVisualSurface, tinted to the
// shadow colour, blurred and offset once per shadow, the way FilterEffects paints drop-shadow(). The
// copies sit in the template's "BorderElement", which XAML draws above the field's box and below
// its text.
//
// The editor copy is everything the editor draws: the caret, the selection highlight and spelling
// marks cast the shadow too while the field is being edited.

#include <algorithm>
#include <array>
#include <cmath>
#include <string>
#include <vector>
#include <winrt/Windows.Foundation.Numerics.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Composition.h>
#include "Decoration.h"
#include "DWriteText.h"
#include "FilterEffects.h"

namespace mason_form
{
    class TextShadows
    {
    public:
        TextShadows() = default;
        TextShadows(TextShadows const&) = delete;
        TextShadows& operator=(TextShadows const&) = delete;
        ~TextShadows() { Unwatch(); }

        // True when the list changed; Sync shows it.
        bool Set(std::vector<mason_dwrite::Shadow> shadows)
        {
            if (shadows == m_shadows) return false;
            m_shadows = std::move(shadows);
            m_key = Key(m_shadows);
            return true;
        }

        bool Empty() const noexcept { return m_shadows.empty(); }

        // The control was replaced: its template, and the copies in it, went with it.
        void Reset()
        {
            Unwatch();
            // The old root may still hang in the old template; the next Sync makes a new one.
            m_root = nullptr;
            m_rootShown = false;
            m_control = nullptr;
            m_border = nullptr;
            m_parts = {};
        }

        // After the control is arranged: finds its text parts once the template is applied, and
        // matches the copies to their size and place.
        void Sync(winrt::Microsoft::UI::Xaml::FrameworkElement const& control)
        {
            if (!control) return;
            if (m_control.get() != control) Reset();
            auto border = m_border.get();
            if (m_shadows.empty())
            {
                if (border && m_rootShown) mason_deco::SetLayer(border, kTag, nullptr);
                m_rootShown = false;
                if (m_root) m_root.Children().RemoveAll();
                for (auto& part : m_parts)
                {
                    part.sprite = nullptr;
                    part.drawn = {};
                }
                return;
            }
            if (!border)
            {
                if (!FindParts(control)) return;
                border = m_border.get();
                if (!border) return;
            }
            auto comp = mason_deco::ThreadCompositor();
            if (!comp) return;
            if (!m_root) m_root = comp.CreateContainerVisual();
            if (!m_rootShown)
            {
                mason_deco::SetLayer(border, kTag, m_root);
                m_rootShown = true;
            }
            for (auto& part : m_parts) SyncPart(comp, border, part);
        }

    private:
        static constexpr wchar_t kTag[] = L"mason-text-shadow";

        struct Drawn
        {
            std::wstring key;
            float width{ 0.0f };
            float height{ 0.0f };
            float x{ 0.0f };
            float y{ 0.0f };
            bool operator==(Drawn const&) const = default;
        };

        struct Part
        {
            winrt::weak_ref<winrt::Microsoft::UI::Xaml::FrameworkElement> element;
            winrt::Microsoft::UI::Composition::SpriteVisual sprite{ nullptr };
            Drawn drawn;
            int64_t visibilityToken{ 0 };
        };

        static std::wstring Key(std::vector<mason_dwrite::Shadow> const& shadows)
        {
            std::wstring key = L"text-shadow";
            for (auto const& s : shadows)
            {
                key += L'|' + std::to_wstring(s.x) + L',' + std::to_wstring(s.y) + L',' + std::to_wstring(s.blur) + L',' + std::to_wstring(s.color);
            }
            return key;
        }

        static winrt::Microsoft::UI::Xaml::FrameworkElement Named(winrt::Microsoft::UI::Xaml::DependencyObject const& root, std::wstring_view name, int depth = 0)
        {
            namespace mux = winrt::Microsoft::UI::Xaml;
            if (!root || depth > 12) return nullptr;
            const int count = mux::Media::VisualTreeHelper::GetChildrenCount(root);
            for (int i = 0; i < count; ++i)
            {
                auto child = mux::Media::VisualTreeHelper::GetChild(root, i);
                if (auto fe = child.try_as<mux::FrameworkElement>(); fe && fe.Name() == name) return fe;
                if (auto found = Named(child, name, depth + 1)) return found;
            }
            return nullptr;
        }

        static bool Shown(winrt::Microsoft::UI::Xaml::FrameworkElement const& element)
        {
            return element.Visibility() == winrt::Microsoft::UI::Xaml::Visibility::Visible;
        }

        // The editor and its siblings in the same template (a NumberBox holds a TextBox).
        bool FindParts(winrt::Microsoft::UI::Xaml::FrameworkElement const& control)
        {
            namespace mux = winrt::Microsoft::UI::Xaml;
            auto content = Named(control, L"ContentElement");
            if (!content) return false;
            auto grid = mux::Media::VisualTreeHelper::GetParent(content);
            auto border = Named(grid, L"BorderElement");
            if (!border) return false;
            m_control = winrt::make_weak(control);
            m_border = winrt::make_weak(border.as<mux::UIElement>());
            m_rootShown = false;
            m_parts[0].element = winrt::make_weak(content);
            if (auto placeholder = Named(grid, L"PlaceholderTextContentPresenter"))
            {
                m_parts[1].element = winrt::make_weak(placeholder);
                // The field hides its placeholder once it has text, without being arranged again.
                m_parts[1].visibilityToken = placeholder.RegisterPropertyChangedCallback(mux::UIElement::VisibilityProperty(),
                    [this](mux::DependencyObject const& sender, mux::DependencyProperty const&)
                    {
                        auto& part = m_parts[1];
                        if (part.sprite) part.sprite.IsVisible(Shown(sender.as<mux::FrameworkElement>()));
                    });
            }
            return true;
        }

        void Unwatch()
        {
            namespace mux = winrt::Microsoft::UI::Xaml;
            for (auto& part : m_parts)
            {
                if (!part.visibilityToken) continue;
                if (auto element = part.element.get()) element.UnregisterPropertyChangedCallback(mux::UIElement::VisibilityProperty(), part.visibilityToken);
                part.visibilityToken = 0;
            }
        }

        // How far the shadows reach past the text on any side.
        float Bleed() const
        {
            float bleed = 0.0f;
            for (auto const& s : m_shadows)
            {
                bleed = (std::max)(bleed, (std::max)(std::abs(s.x), std::abs(s.y)) + 3.0f * s.blur * 0.5f);
            }
            return std::ceil(bleed);
        }

        // The shadows of whatever `source` draws, last shadow first so the first paints on top.
        winrt::Microsoft::UI::Composition::CompositionBrush Brush(winrt::Microsoft::UI::Composition::Compositor const& comp,
            winrt::Microsoft::UI::Composition::CompositionBrush const& source) const
        {
            namespace mucomp = winrt::Microsoft::UI::Composition;
            namespace wge = winrt::Windows::Graphics::Effects;
            wge::IGraphicsEffectSource input = mucomp::CompositionEffectSourceParameter(L"source");
            std::vector<wge::IGraphicsEffectSource> layers;
            for (auto it = m_shadows.rbegin(); it != m_shadows.rend(); ++it)
            {
                const float a = ((it->color >> 24) & 0xFF) / 255.0f, r = ((it->color >> 16) & 0xFF) / 255.0f;
                const float g = ((it->color >> 8) & 0xFF) / 255.0f, b = (it->color & 0xFF) / 255.0f;
                std::array<float, 20> tint{ 0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, a, 0 };
                auto layer = mason_filter::Matrix(input, tint);
                // A CSS blur radius is twice the Gaussian's standard deviation, as Text draws it.
                if (it->blur > 0.0f) layer = mason_filter::Blur(layer, it->blur * 0.5f, false);
                layers.push_back(mason_filter::Translate(layer, it->x, it->y));
            }
            if (layers.empty()) return nullptr;
            auto graph = layers.size() == 1 ? layers.front() : mason_filter::Over(std::move(layers));
            auto factory = mason_filter::Factory(comp, m_key, graph.as<wge::IGraphicsEffect>());
            if (!factory) return nullptr;
            auto brush = factory.CreateBrush();
            brush.SetSourceParameter(L"source", source);
            return brush;
        }

        void SyncPart(winrt::Microsoft::UI::Composition::Compositor const& comp, winrt::Microsoft::UI::Xaml::UIElement const& border, Part& part)
        {
            namespace mux = winrt::Microsoft::UI::Xaml;
            auto element = part.element.get();
            if (!element) return;
            const auto size = element.ActualSize();
            winrt::Windows::Foundation::Point at{ 0.0f, 0.0f };
            try
            {
                at = element.TransformToVisual(border).TransformPoint(at);
            }
            catch (winrt::hresult_error const&)
            {
                return;
            }
            const Drawn drawn{ m_key, size.x, size.y, at.X, at.Y };
            if (part.sprite && drawn == part.drawn)
            {
                part.sprite.IsVisible(Shown(element));
                return;
            }
            if (size.x <= 0.0f || size.y <= 0.0f)
            {
                if (part.sprite) part.sprite.IsVisible(false);
                part.drawn = drawn;
                return;
            }
            const float pad = Bleed();
            const winrt::Windows::Foundation::Numerics::float2 extent{ size.x + 2.0f * pad, size.y + 2.0f * pad };
            if (!part.sprite || drawn.key != part.drawn.key || drawn.width != part.drawn.width || drawn.height != part.drawn.height)
            {
                auto source = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);
                if (!source) return;
                auto surface = comp.CreateVisualSurface();
                surface.SourceVisual(source);
                surface.SourceOffset({ -pad, -pad });
                surface.SourceSize(extent);
                auto surfaceBrush = comp.CreateSurfaceBrush(surface);
                surfaceBrush.Stretch(winrt::Microsoft::UI::Composition::CompositionStretch::None);
                auto brush = Brush(comp, surfaceBrush);
                if (!brush) return;
                if (!part.sprite)
                {
                    part.sprite = comp.CreateSpriteVisual();
                    m_root.Children().InsertAtTop(part.sprite);
                }
                part.sprite.Brush(brush);
                part.sprite.Size(extent);
            }
            part.sprite.Offset({ at.X - pad, at.Y - pad, 0.0f });
            part.sprite.IsVisible(Shown(element));
            part.drawn = drawn;
        }

        std::vector<mason_dwrite::Shadow> m_shadows;
        std::wstring m_key;
        winrt::weak_ref<winrt::Microsoft::UI::Xaml::FrameworkElement> m_control;
        winrt::weak_ref<winrt::Microsoft::UI::Xaml::UIElement> m_border;
        winrt::Microsoft::UI::Composition::ContainerVisual m_root{ nullptr };
        bool m_rootShown{ false };
        std::array<Part, 2> m_parts;
    };
}
