#pragma once
#include "FixedLayer.g.h"
#include <unordered_map>

namespace winrt::NativeScript::Mason::implementation
{
    struct FixedLayer : FixedLayerT<FixedLayer>
    {
        FixedLayer() = default;

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

        // hosted element -> its slot
        std::unordered_map<void*, winrt::weak_ref<winrt::Microsoft::UI::Xaml::UIElement>> m_slots;
    };
}
