#include "pch.h"
#include "View.h"
#include "View.g.cpp"
#include <winrt/NativeScript.Mason.h>
#include "PanelCore.h"
#include "VisualApply.h"
#include "BufferUtil.h"
#include "Events.h"
#include "Text.h"
#include "SummaryAutomationPeer.h"
#include <winrt/Microsoft.UI.Xaml.Automation.h>
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <winrt/Microsoft.UI.Xaml.Automation.Peers.h>

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

    void View::SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
    {
        m_visual.styleDirty = true;
        mason_leaf::StyleSynced(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, mason_leaf::DirtyWords(d0, d1, d2, d3));
    }

    Size View::MeasureOverride(Size const& availableSize)
    {
        if (!m_node) return Size{ 0, 0 };
        // Children added to a closed details since the last pass are hidden before they're synced.
        if (m_role == 1) HideClosedContent(false);
        return mason_panel::Measure(m_engine, m_node, get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), Children(), m_leaves, availableSize);
    }

    Size View::ArrangeOverride(Size const& finalSize)
    {
        if (!m_node) return finalSize;
        auto result = mason_panel::Arrange(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, Children(), finalSize);
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return result;
    }

    // ---- <details> / <summary> ---------------------------------------------------------------

    namespace
    {
        constexpr int32_t kDetails = 1;
        constexpr int32_t kSummary = 2;

        // A summary's marker is drawn by its text.
        void RefreshMarkers(nsm::View const& summary)
        {
            for (auto const& child : summary.Children())
            {
                if (auto text = child.try_as<nsm::Text>()) winrt::get_self<winrt::NativeScript::Mason::implementation::Text>(text)->RefreshMarker();
            }
        }

        // The View a panel child stands for: itself, or the content of its ScrollViewer host.
        nsm::View ViewOf(winrt::Microsoft::UI::Xaml::UIElement const& child)
        {
            if (auto view = child.try_as<nsm::View>()) return view;
            if (auto host = child.try_as<winrt::Microsoft::UI::Xaml::Controls::ScrollViewer>()) return host.Content().try_as<nsm::View>();
            return nullptr;
        }
    }

    void View::Role(int32_t value)
    {
        if (m_role == value) return;
        const bool wasDetails = m_role == kDetails;
        m_role = value;
        if (m_role == kSummary && !m_tapHooked)
        {
            m_tapHooked = true;
            Tapped([weak = get_weak()](auto&&, auto&&)
            {
                if (auto self = weak.get()) self->Activate();
            });
        }
        if (wasDetails || m_role == kDetails) HideClosedContent(true);
        // Its text was built before it was a summary: the marker goes in now.
        RefreshMarkers(*this);
    }

    void View::Open(bool value)
    {
        if (m_open == value) return;
        m_open = value;
        HideClosedContent(true);
        RefreshSummary();
    }

    nsm::View View::Details()
    {
        if (m_role != kSummary) return nullptr;
        auto fe = get_strong().as<winrt::Microsoft::UI::Xaml::FrameworkElement>();
        auto parent = fe.Parent();
        if (auto host = parent.try_as<winrt::Microsoft::UI::Xaml::Controls::ScrollViewer>()) parent = host.Parent();
        auto details = parent.try_as<nsm::View>();
        return details && winrt::get_self<View>(details)->m_role == kDetails ? details : nullptr;
    }

    void View::Activate()
    {
        auto details = Details();
        if (!details) return;
        auto* impl = winrt::get_self<View>(details);
        impl->Open(!impl->m_open);
        mason_events::Dispatch(details, L"toggle", false, impl->m_open ? L"open" : L"closed");
    }

    // A closed details lays out only its first summary: the rest is collapsed (and so left out of
    // its Mason children) for as long as it's closed.
    void View::HideClosedContent(bool resync)
    {
        winrt::Microsoft::UI::Xaml::UIElement summary{ nullptr };
        if (m_role == kDetails)
        {
            for (auto const& child : Children())
            {
                auto view = ViewOf(child);
                if (view && winrt::get_self<View>(view)->m_role == kSummary)
                {
                    summary = child;
                    break;
                }
            }
        }
        const bool closed = m_role == kDetails && !m_open;
        for (auto const& child : Children())
        {
            mason_leaf::SetHidden(child, mason_leaf::HiddenByDetails, closed && child != summary, resync);
        }
    }

    // The summary's marker and its expanded state follow the details.
    void View::RefreshSummary()
    {
        for (auto const& child : Children())
        {
            auto view = ViewOf(child);
            if (!view || winrt::get_self<View>(view)->m_role != kSummary) continue;
            RefreshMarkers(view);
            namespace peers = winrt::Microsoft::UI::Xaml::Automation::Peers;
            if (auto peer = peers::FrameworkElementAutomationPeer::FromElement(view))
            {
                using winrt::Microsoft::UI::Xaml::Automation::ExpandCollapseState;
                peer.RaisePropertyChangedEvent(winrt::Microsoft::UI::Xaml::Automation::ExpandCollapsePatternIdentifiers::ExpandCollapseStateProperty(),
                    winrt::box_value(m_open ? ExpandCollapseState::Collapsed : ExpandCollapseState::Expanded),
                    winrt::box_value(m_open ? ExpandCollapseState::Expanded : ExpandCollapseState::Collapsed));
            }
            break;
        }
    }

    winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationPeer View::OnCreateAutomationPeer()
    {
        if (m_role == kSummary) return winrt::make<SummaryAutomationPeer>(*this);
        return base_type::OnCreateAutomationPeer();
    }
}
