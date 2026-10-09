#pragma once
#include "Image.g.h"
#include "Invalidation.h"
#include "VisualState.h"
#include <memory>
#include <winrt/Microsoft.UI.Xaml.Media.Imaging.h>

namespace winrt::NativeScript::Mason::implementation
{
    struct Image : ImageT<Image>
    {
        Image();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
        {
            m_visual.styleDirty = true;
            mason_leaf::StyleSynced(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, mason_leaf::DirtyWords(d0, d1, d2, d3));
        }

        hstring Source() const { return m_source; }
        void Source(hstring const& value);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        struct Natural
        {
            float width{ 0.0f };
            float height{ 0.0f };
        };

        void Loaded(uint64_t generation, float width, float height);
        static winrt::fire_and_forget LoadData(winrt::Microsoft::UI::Xaml::Media::Imaging::BitmapImage bitmap, hstring uri);
        static winrt::fire_and_forget LoadFile(winrt::Microsoft::UI::Xaml::Media::Imaging::BitmapImage bitmap, hstring path);

        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::Controls::Image m_image{ nullptr };
        hstring m_source;
        std::shared_ptr<Natural> m_natural = std::make_shared<Natural>();
        uint64_t m_generation{ 0 };
        bool m_clipped{ false };
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Image : ImageT<Image, implementation::Image>
    {
    };
}
