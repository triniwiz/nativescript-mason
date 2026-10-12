#include "pch.h"
#include "SummaryAutomationPeer.h"
#include "SummaryAutomationPeer.g.cpp"
#include "View.h"
#include "Text.h"

namespace winrt::NativeScript::Mason::implementation
{
    namespace peers = winrt::Microsoft::UI::Xaml::Automation::Peers;
    namespace automation = winrt::Microsoft::UI::Xaml::Automation;

    SummaryAutomationPeer::SummaryAutomationPeer(winrt::NativeScript::Mason::View const& owner)
        : SummaryAutomationPeerT<SummaryAutomationPeer>(owner), m_owner(owner)
    {
    }

    bool SummaryAutomationPeer::IsOpen() const
    {
        auto owner = m_owner.get();
        auto details = owner ? owner.Details() : nullptr;
        return details && details.Open();
    }

    winrt::hstring SummaryAutomationPeer::GetClassNameCore() const { return L"Button"; }

    peers::AutomationControlType SummaryAutomationPeer::GetAutomationControlTypeCore() const { return peers::AutomationControlType::Button; }

    // An explicit accessible name wins; otherwise its text, as a summary's label is.
    winrt::hstring SummaryAutomationPeer::GetNameCore() const
    {
        auto owner = m_owner.get();
        if (!owner) return {};
        auto name = automation::AutomationProperties::GetName(owner);
        if (!name.empty()) return name;
        std::wstring text;
        for (auto const& child : owner.Children())
        {
            if (auto t = child.try_as<winrt::NativeScript::Mason::Text>())
            {
                if (!text.empty()) text += L' ';
                text += winrt::get_self<implementation::Text>(t)->AccessibleText();
            }
        }
        const auto first = text.find_first_not_of(L" \t\r\n");
        if (first == std::wstring::npos) return {};
        return winrt::hstring{ text.substr(first, text.find_last_not_of(L" \t\r\n") - first + 1) };
    }

    winrt::Windows::Foundation::IInspectable SummaryAutomationPeer::GetPatternCore(peers::PatternInterface const& pattern) const
    {
        if (pattern == peers::PatternInterface::ExpandCollapse || pattern == peers::PatternInterface::Invoke) return *this;
        return SummaryAutomationPeerT<SummaryAutomationPeer>::GetPatternCore(pattern);
    }

    automation::ExpandCollapseState SummaryAutomationPeer::ExpandCollapseState() const
    {
        return IsOpen() ? automation::ExpandCollapseState::Expanded : automation::ExpandCollapseState::Collapsed;
    }

    void SummaryAutomationPeer::Expand()
    {
        if (auto owner = m_owner.get(); owner && !IsOpen()) winrt::get_self<implementation::View>(owner)->Activate();
    }

    void SummaryAutomationPeer::Collapse()
    {
        if (auto owner = m_owner.get(); owner && IsOpen()) winrt::get_self<implementation::View>(owner)->Activate();
    }

    void SummaryAutomationPeer::Invoke()
    {
        if (auto owner = m_owner.get()) winrt::get_self<implementation::View>(owner)->Activate();
    }
}
