#pragma once
#include "InlineAutomationPeer.g.h"
#include <winrt/Microsoft.UI.Xaml.Automation.Peers.h>
#include <winrt/Microsoft.UI.Xaml.Automation.Provider.h>

namespace winrt::NativeScript::Mason::implementation
{
    struct InlineAutomationPeer : InlineAutomationPeerT<InlineAutomationPeer>
    {
        InlineAutomationPeer(winrt::NativeScript::Mason::Text const& host, winrt::Windows::Foundation::IInspectable const& element);

        void Update(winrt::Windows::Foundation::Rect const& bounds, winrt::hstring const& label, bool isLink);
        winrt::Windows::Foundation::IInspectable Element() const { return m_element; }

        winrt::hstring GetClassNameCore() const;
        winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationControlType GetAutomationControlTypeCore() const;
        winrt::hstring GetNameCore() const;
        winrt::Windows::Foundation::Rect GetBoundingRectangleCore() const;
        bool IsControlElementCore() const { return true; }
        bool IsContentElementCore() const { return true; }
        bool IsKeyboardFocusableCore() const { return false; }
        bool IsOffscreenCore() const { return false; }
        winrt::Windows::Foundation::IInspectable GetPatternCore(winrt::Microsoft::UI::Xaml::Automation::Peers::PatternInterface const& pattern) const;

        void Invoke();

    private:
        winrt::weak_ref<winrt::NativeScript::Mason::Text> m_host;
        winrt::Windows::Foundation::IInspectable m_element;
        winrt::Windows::Foundation::Rect m_bounds{};
        winrt::hstring m_label;
        bool m_isLink{ false };
    };
}
