#include "pch.h"
#include "Mason.h"
#include "Mason.g.cpp"
#include "Node.h"
#include "Css.h"
#include "PanelCore.h"
#include <winrt/Windows.Storage.Streams.h>

using namespace winrt;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
}

namespace winrt::NativeScript::Mason::implementation
{
    Mason::Mason()
    {
        m_ptr = mason_init();
    }

    Mason::~Mason()
    {
        if (m_ptr != nullptr)
        {
            mason_release(m_ptr);
            m_ptr = nullptr;
        }
    }

    nsm::Mason Mason::Instance()
    {
        static nsm::Mason s_instance = winrt::make<Mason>();
        return s_instance;
    }

    void Mason::Clear()
    {
        mason_clear(m_ptr);
    }

    void Mason::SetDeviceScale(float scale)
    {
        mason_set_device_scale(m_ptr, scale);
    }

    bool Mason::Preflight()
    {
        return mason_get_preflight();
    }

    void Mason::Preflight(bool value)
    {
        // Sets the global flag and re-seeds this engine's arena defaults.
        mason_set_preflight(m_ptr, value);
    }

    nsm::Node Mason::CreateNode(bool anonymous)
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_node(m_ptr, anonymous));
    }

    nsm::Node Mason::CreateTextNode(bool anonymous)
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_text_node(m_ptr, anonymous));
    }

    nsm::Node Mason::CreateImageNode()
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_image_node(m_ptr));
    }

    nsm::Node Mason::CreateButtonNode()
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_button_node(m_ptr));
    }

    nsm::Node Mason::CreateLineBreakNode()
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_line_break_node(m_ptr));
    }

    nsm::Node Mason::CreateListItemNode()
    {
        auto keepAlive = get_strong().as<winrt::Windows::Foundation::IInspectable>();
        return winrt::make<implementation::Node>(keepAlive, m_ptr, mason_node_new_list_item_node(m_ptr));
    }

    void Mason::PrintTree(nsm::Node const& node)
    {
        if (!node) return;
        mason_print_tree(m_ptr, winrt::get_self<implementation::Node>(node)->NodePtr());
    }

    winrt::Windows::Storage::Streams::IBuffer Mason::StyleValues(nsm::IMasonElement const& element)
    {
        if (!element) return nullptr;
        auto node = element.Node();
        return node ? node.Style().Values() : nullptr;
    }

    void Mason::ReparentChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent, winrt::Microsoft::UI::Xaml::UIElement const& child, int32_t index)
    {
        Css::ReparentChild(parent, child, index);
    }

    void Mason::RemoveChild(winrt::Microsoft::UI::Xaml::Controls::Panel const& parent, winrt::Microsoft::UI::Xaml::UIElement const& child)
    {
        Css::RemoveChild(parent, child);
    }

    static void SetPercent(winrt::Microsoft::UI::Xaml::UIElement const& element, bool horizontal, float fraction)
    {
        auto fe = element.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>();
        if (!fe) return;
        fe.SetValue(mason_panel::PercentProperty(horizontal), winrt::box_value(static_cast<double>(fraction)));
        // The parent syncs its children's boxes when it measures.
        if (auto parent = fe.Parent().try_as<winrt::Microsoft::UI::Xaml::UIElement>()) parent.InvalidateMeasure();
        mason_leaf::InvalidateLayoutRoot(element);
    }

    void Mason::SetPercentWidth(winrt::Microsoft::UI::Xaml::UIElement const& element, float fraction)
    {
        SetPercent(element, true, fraction);
    }

    void Mason::SetPercentHeight(winrt::Microsoft::UI::Xaml::UIElement const& element, float fraction)
    {
        SetPercent(element, false, fraction);
    }
}
