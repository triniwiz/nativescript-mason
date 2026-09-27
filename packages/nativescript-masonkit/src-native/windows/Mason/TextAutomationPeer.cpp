#include "pch.h"
#include "TextAutomationPeer.h"
#include "TextAutomationPeer.g.cpp"
#include "Text.h"
#include <winrt/Microsoft.UI.Xaml.Automation.h>

namespace winrt::NativeScript::Mason::implementation
{
    namespace peers = winrt::Microsoft::UI::Xaml::Automation::Peers;

    TextAutomationPeer::TextAutomationPeer(winrt::NativeScript::Mason::Text const& owner)
        : TextAutomationPeerT<TextAutomationPeer>(owner), m_owner(owner)
    {
    }

    winrt::hstring TextAutomationPeer::GetClassNameCore() const { return L"TextBlock"; }

    peers::AutomationControlType TextAutomationPeer::GetAutomationControlTypeCore() const { return peers::AutomationControlType::Text; }

    winrt::hstring TextAutomationPeer::GetNameCore() const
    {
        auto owner = m_owner.get();
        if (!owner) return {};
        // An explicit accessible name wins, as it does for a TextBlock.
        auto name = winrt::Microsoft::UI::Xaml::Automation::AutomationProperties::GetName(owner);
        if (!name.empty()) return name;
        return winrt::get_self<implementation::Text>(owner)->AccessibleText();
    }

    bool TextAutomationPeer::IsControlElementCore() const { return true; }

    bool TextAutomationPeer::IsContentElementCore() const { return true; }
}
