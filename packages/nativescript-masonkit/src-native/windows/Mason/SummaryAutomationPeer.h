#pragma once
#include "SummaryAutomationPeer.g.h"
#include <winrt/Microsoft.UI.Xaml.Automation.h>
#include <winrt/Microsoft.UI.Xaml.Automation.Peers.h>
#include <winrt/Microsoft.UI.Xaml.Automation.Provider.h>

namespace winrt::NativeScript::Mason::implementation
{
    struct SummaryAutomationPeer : SummaryAutomationPeerT<SummaryAutomationPeer>
    {
        SummaryAutomationPeer(winrt::NativeScript::Mason::View const& owner);

        winrt::hstring GetClassNameCore() const;
        winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationControlType GetAutomationControlTypeCore() const;
        winrt::hstring GetNameCore() const;
        winrt::Windows::Foundation::IInspectable GetPatternCore(winrt::Microsoft::UI::Xaml::Automation::Peers::PatternInterface const& pattern) const;

        winrt::Microsoft::UI::Xaml::Automation::ExpandCollapseState ExpandCollapseState() const;
        void Expand();
        void Collapse();
        void Invoke();

    private:
        bool IsOpen() const;
        winrt::weak_ref<winrt::NativeScript::Mason::View> m_owner;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct SummaryAutomationPeer : SummaryAutomationPeerT<SummaryAutomationPeer, implementation::SummaryAutomationPeer>
    {
    };
}
