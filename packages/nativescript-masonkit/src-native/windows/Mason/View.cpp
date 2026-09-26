#include "pch.h"
#include "View.h"
#include "View.g.cpp"
#include <winrt/NativeScript.Mason.h>
#include "PanelCore.h"
#include "VisualApply.h"
#include "BufferUtil.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;

    nsm::Node CreateNodeForKind(nsm::Mason const& engine, int32_t kind)
    {
        switch (kind)
        {
        case 1: return engine.CreateTextNode(false);
        case 2: return engine.CreateImageNode();
        case 3: return engine.CreateButtonNode();
        case 4: return engine.CreateListItemNode();
        default: return engine.CreateNode(false);
        }
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    View::View(int32_t nodeKind)
    {
        m_engine = nsm::Mason::Instance();
        m_nodeKind = nodeKind;
        m_node = CreateNodeForKind(m_engine, nodeKind);

        auto node = m_node;
        Loaded([node](winrt::Windows::Foundation::IInspectable const& sender, winrt::Microsoft::UI::Xaml::RoutedEventArgs const&)
        {
            if (node) node.MarkDirty();
            if (auto el = sender.try_as<winrt::Microsoft::UI::Xaml::UIElement>())
            {
                el.InvalidateMeasure();
                el.InvalidateArrange();
            }
        });
    }

    void View::Invalidate()
    {
        InvalidateMeasure();
        InvalidateArrange();
    }

    void View::SyncStyle(winrt::hstring const&, winrt::hstring const&)
    {
        m_visual.styleDirty = true;
        if (m_node) m_node.MarkDirty();
        InvalidateMeasure();
        mason_panel::InvalidateLayoutRoot(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>());
    }

    Size View::MeasureOverride(Size const& availableSize)
    {
        if (!m_node) return Size{ 0, 0 };
        return mason_panel::Measure(m_engine, m_node, get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), Children(), m_leaves, availableSize);
    }

    Size View::ArrangeOverride(Size const& finalSize)
    {
        if (!m_node) return finalSize;
        auto result = mason_panel::Arrange(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, Children(), finalSize);
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return result;
    }
}
