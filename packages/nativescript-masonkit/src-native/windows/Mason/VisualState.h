#pragma once
#include <array>
#include <cstdint>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Composition.h>

namespace mason_visual
{
    // What mason_visual::Apply last installed. Arrange reaches every ancestor of a changed node, so
    // Apply skips rebuilding brushes, clips and borders unless inputs changed or something else
    // replaced the brush or clip.
    struct AppliedState
    {
        static constexpr size_t kInputs = 14;
        std::array<uint32_t, kInputs> inputs{};
        winrt::Microsoft::UI::Xaml::Media::Brush background{ nullptr };
        // The brush Apply itself painted, to tell it apart from a gradient set through Css.
        winrt::Microsoft::UI::Xaml::Media::Brush installed{ nullptr };
        winrt::Microsoft::UI::Composition::CompositionClip clip{ nullptr };
        bool valid{ false };
    };
}
