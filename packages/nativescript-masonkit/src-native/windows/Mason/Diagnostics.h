#pragma once
#include "Diagnostics.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct Diagnostics
    {
        Diagnostics() = default;

        static uint64_t FrameCount();
        static void WatchLayout(winrt::Microsoft::UI::Xaml::FrameworkElement const& element);
        static uint64_t LayoutPassCount();
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Diagnostics : DiagnosticsT<Diagnostics, implementation::Diagnostics>
    {
    };
}
