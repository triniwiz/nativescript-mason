#pragma once
#include "TextAutomationPeer.g.h"
#include <winrt/Microsoft.UI.Xaml.Automation.Peers.h>
#include <winrt/Microsoft.UI.Xaml.Automation.Provider.h>
#include <vector>

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
        winrt::Windows::Foundation::IInspectable GetPatternCore(winrt::Microsoft::UI::Xaml::Automation::Peers::PatternInterface const& pattern) const;
        winrt::Windows::Foundation::Collections::IVector<winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationPeer> GetChildrenCore() const;

        void Invoke();

    private:
        bool IsButton() const;

        winrt::weak_ref<winrt::NativeScript::Mason::Text> m_owner;
        mutable std::vector<winrt::NativeScript::Mason::InlineAutomationPeer> m_inline;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct TextAutomationPeer : TextAutomationPeerT<TextAutomationPeer, implementation::TextAutomationPeer>
    {
    };
}
