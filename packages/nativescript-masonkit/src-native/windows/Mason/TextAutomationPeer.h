#pragma once
#include "TextAutomationPeer.g.h"
#include <winrt/Microsoft.UI.Xaml.Automation.Peers.h>

namespace winrt::NativeScript::Mason::implementation
{
    struct TextAutomationPeer : TextAutomationPeerT<TextAutomationPeer>
    {
        TextAutomationPeer(winrt::NativeScript::Mason::Text const& owner);

        winrt::hstring GetClassNameCore() const;
        winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationControlType GetAutomationControlTypeCore() const;
        winrt::hstring GetNameCore() const;
        bool IsControlElementCore() const;
        bool IsContentElementCore() const;

    private:
        winrt::weak_ref<winrt::NativeScript::Mason::Text> m_owner;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct TextAutomationPeer : TextAutomationPeerT<TextAutomationPeer, implementation::TextAutomationPeer>
    {
    };
}
