#pragma once
// Rasterization scale per XamlRoot. Each window has its own, and it changes when the window moves to
// a monitor of another DPI; everything drawn in device pixels is then drawn again, and XAML only
// arranges what it has to, so the change is pushed to every Mason element under that root.
#include <algorithm>
#include <functional>
#include <vector>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/NativeScript.Mason.h>
#include "VisualState.h"

namespace mason_visual
{
    namespace mux = winrt::Microsoft::UI::Xaml;

    struct RootScale
    {
        void* id{ nullptr };
        winrt::weak_ref<mux::XamlRoot> root;
        float scale{ 1.0f };
    };

    // Never destroyed, like the XAML objects the component keeps for the process.
    inline std::vector<RootScale>& RootScales()
    {
        static auto* scales = new std::vector<RootScale>();
        return *scales;
    }

    // The scale of the layout root computing now, for measure callbacks that have no element.
    inline float g_computeScale = 1.0f;

    // Run on a scale change before the elements lay out again; Text drops its measured sizes.
    inline std::function<void()> g_onScaleChanged;

    inline void InvalidateMasonTree(mux::DependencyObject const& from)
    {
        if (auto el = from.try_as<winrt::NativeScript::Mason::IMasonElement>())
        {
            if (auto node = el.Node()) node.MarkDirty();
            if (auto ui = from.try_as<mux::UIElement>())
            {
                ui.InvalidateMeasure();
                ui.InvalidateArrange();
            }
        }
        const int32_t count = mux::Media::VisualTreeHelper::GetChildrenCount(from);
        for (int32_t i = 0; i < count; ++i) InvalidateMasonTree(mux::Media::VisualTreeHelper::GetChild(from, i));
    }

    inline void OnRootChanged(mux::XamlRoot const& root, void* id)
    {
        const float now = static_cast<float>(root.RasterizationScale());
        auto& scales = RootScales();
        auto it = std::find_if(scales.begin(), scales.end(), [id](RootScale const& r) { return r.id == id; });
        if (it == scales.end() || it->scale == now) return;
        it->scale = now;
        ++g_scaleEpoch;
        if (g_onScaleChanged) g_onScaleChanged();
        if (auto content = root.Content()) InvalidateMasonTree(content);
    }

    inline float ScaleOf(mux::XamlRoot const& root)
    {
        void* id = winrt::get_abi(root);
        auto& scales = RootScales();
        for (auto const& r : scales)
        {
            if (r.id == id) return r.scale;
        }
        std::erase_if(scales, [](RootScale const& r) { return !r.root.get(); });
        RootScale entry{ id, winrt::make_weak(root), static_cast<float>(root.RasterizationScale()) };
        root.Changed([id](mux::XamlRoot const& sender, mux::XamlRootChangedEventArgs const&) { OnRootChanged(sender, id); });
        scales.push_back(entry);
        ++g_scaleEpoch;
        return entry.scale;
    }

    inline float RasterScale(mux::UIElement const& element)
    {
        auto root = element.XamlRoot();
        return root ? ScaleOf(root) : 1.0f;
    }
}
