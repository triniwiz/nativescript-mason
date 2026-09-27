#include "pch.h"
#include "List.h"
#include "List.g.cpp"
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
    List::List(bool ordered)
    {
        m_engine = nsm::Mason::Instance();
        m_node = m_engine.CreateNode(false);
        m_ordered = ordered;
    }

    void List::Invalidate()
    {
        InvalidateMeasure();
        InvalidateArrange();
    }

    Size List::MeasureOverride(Size const& availableSize)
    {
        if (!m_node) return Size{ 0, 0 };
        return mason_panel::Measure(m_engine, m_node, get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), Children(), m_leaves, availableSize);
    }

    Size List::ArrangeOverride(Size const& finalSize)
    {
        if (!m_node) return finalSize;
        auto result = mason_panel::Arrange(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, Children(), finalSize);
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return result;
    }
}
