#pragma once
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Composition.h>

namespace mason_shadow
{
    struct State;
}

namespace mason_visual
{
    // Bumped when a window's rasterization scale changes, so masks drawn in device pixels redraw.
    inline uint32_t g_scaleEpoch = 1;

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
        winrt::Microsoft::UI::Composition::ShapeVisual borderVisual{ nullptr };
        winrt::Microsoft::UI::Composition::CompositionRoundedRectangleGeometry borderGeometry{ nullptr };
        float borderStroke{ 0.0f };
        uint32_t borderColor{ 0 };
        float borderRadius{ 0.0f };
        winrt::Microsoft::UI::Composition::SpriteVisual borderSprite{ nullptr };
        std::string borderKey;
        std::shared_ptr<mason_shadow::State> shadow;
        uint64_t shadowVersion{ 0 };
        uint64_t filterVersion{ 0 };
        int32_t zIndex{ 0 };
        bool watchingBackground{ false };
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
