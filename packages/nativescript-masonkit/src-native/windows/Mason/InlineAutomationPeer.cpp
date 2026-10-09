#include "pch.h"
#include "InlineAutomationPeer.h"
#include "InlineAutomationPeer.g.cpp"
#include "Events.h"
#include <winrt/Microsoft.UI.Xaml.Automation.h>

namespace winrt::NativeScript::Mason::implementation
{
    namespace peers = winrt::Microsoft::UI::Xaml::Automation::Peers;

    InlineAutomationPeer::InlineAutomationPeer(winrt::NativeScript::Mason::Text const& host, winrt::Windows::Foundation::IInspectable const& element)
        : m_host(host), m_element(element)
    {
    }

    void InlineAutomationPeer::Update(winrt::Windows::Foundation::Rect const& bounds, winrt::hstring const& label, bool isLink)
    {
        m_bounds = bounds;
        m_label = label;
        m_isLink = isLink;
    }

    winrt::hstring InlineAutomationPeer::GetClassNameCore() const { return m_isLink ? L"Hyperlink" : L"TextBlock"; }

    peers::AutomationControlType InlineAutomationPeer::GetAutomationControlTypeCore() const
    {
        return m_isLink ? peers::AutomationControlType::Hyperlink : peers::AutomationControlType::Text;
    }

    winrt::hstring InlineAutomationPeer::GetNameCore() const { return m_label; }

    winrt::Windows::Foundation::Rect InlineAutomationPeer::GetBoundingRectangleCore() const
    {
        auto host = m_host.get();
        if (!host) return {};
        auto hostPeer = peers::FrameworkElementAutomationPeer::FromElement(host);
        if (!hostPeer) return {};
        const auto origin = hostPeer.GetBoundingRectangle();
        auto root = host.XamlRoot();
        const float scale = root ? static_cast<float>(root.RasterizationScale()) : 1.0f;
        return { origin.X + m_bounds.X * scale, origin.Y + m_bounds.Y * scale, m_bounds.Width * scale, m_bounds.Height * scale };
    }

    winrt::Windows::Foundation::IInspectable InlineAutomationPeer::GetPatternCore(peers::PatternInterface const& pattern) const
    {
        if (pattern == peers::PatternInterface::Invoke) return *this;
        return InlineAutomationPeerT<InlineAutomationPeer>::GetPatternCore(pattern);
    }

    void InlineAutomationPeer::Invoke()
    {
        mason_events::Dispatch(m_element, L"click", true);
    }
}
