#include "pch.h"
#include "Li.h"
#include "Li.g.cpp"
#include <winrt/NativeScript.Mason.h>
#include "PanelCore.h"
#include "VisualApply.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
}

namespace winrt::NativeScript::Mason::implementation
{
    Li::Li()
    {
        m_engine = nsm::Mason::Instance();
        m_node = m_engine.CreateListItemNode();
    }

    void Li::Invalidate()
    {
        InvalidateMeasure();
        InvalidateArrange();
    }

    Size Li::MeasureOverride(Size const& availableSize)
    {
        if (!m_node) return Size{ 0, 0 };
        return mason_panel::Measure(m_engine, m_node, get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), Children(), availableSize);
    }

    Size Li::ArrangeOverride(Size const& finalSize)
    {
        if (!m_node) return finalSize;
        auto result = mason_panel::Arrange(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, Children(), finalSize);
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        mason_cssmask::RepaintTextClips(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), false);
        return result;
    }
}
