#pragma once
#include <array>
#include <cstdint>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Composition.h>

namespace mason_visual
{
    // Bumped when a layout root's rasterization scale changes, so masks drawn in device pixels redraw.
    inline uint32_t g_scaleEpoch = 1;
    inline float g_rootScale = 0.0f;

    // What mason_visual::Apply last installed. Arrange reaches every ancestor of a changed node, so
    // Apply skips rebuilding brushes, clips and borders unless inputs changed or something else
    // replaced the brush or clip.
    struct AppliedState
    {
        static constexpr size_t kInputs = 15;
        std::array<uint32_t, kInputs> inputs{};
        winrt::Microsoft::UI::Xaml::Media::Brush background{ nullptr };
        // The brush Apply itself painted, to tell it apart from a gradient set through Css.
        winrt::Microsoft::UI::Xaml::Media::Brush installed{ nullptr };
        // The Css gradient a masked background rounds, while `installed` is that mask.
        winrt::Microsoft::UI::Xaml::Media::LinearGradientBrush gradient{ nullptr };
        winrt::Microsoft::UI::Composition::CompositionClip clip{ nullptr };
        winrt::Microsoft::UI::Composition::Visual visual{ nullptr };
        bool border{ false };
        float width{ -1.0f };
        float height{ -1.0f };
        uint32_t scaleEpoch{ 0 };
        // Set by SyncStyle: the style buffer may no longer match `inputs`.
        bool styleDirty{ true };
        // A rounded clip that depends on whether descendants overflow can't be skipped on size alone.
        bool subtreeDependent{ false };
        bool valid{ false };
    };
}
