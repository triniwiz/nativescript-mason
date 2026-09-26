#include "pch.h"
#include "Diagnostics.h"
#include "Diagnostics.g.cpp"
#include <winrt/Microsoft.UI.Xaml.Media.h>

namespace
{
    namespace mux = winrt::Microsoft::UI::Xaml;

    uint64_t frames = 0;
    bool rendering = false;
    uint64_t passes = 0;
    mux::FrameworkElement watched{ nullptr };
    winrt::event_token layoutToken{};
}

namespace winrt::NativeScript::Mason::implementation
{
    uint64_t Diagnostics::FrameCount()
    {
        if (!rendering)
        {
            rendering = true;
            mux::Media::CompositionTarget::Rendering([](auto&&, auto&&) { ++frames; });
        }
        return frames;
    }

    void Diagnostics::WatchLayout(mux::FrameworkElement const& element)
    {
        if (watched) watched.LayoutUpdated(layoutToken);
        watched = element;
        if (element) layoutToken = element.LayoutUpdated([](auto&&, auto&&) { ++passes; });
    }

    uint64_t Diagnostics::LayoutPassCount() { return passes; }
}
