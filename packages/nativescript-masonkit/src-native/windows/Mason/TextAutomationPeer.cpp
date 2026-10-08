#include "pch.h"
#include "TextAutomationPeer.h"
#include "TextAutomationPeer.g.cpp"
#include "Text.h"
#include "InlineAutomationPeer.h"
#include <winrt/Microsoft.UI.Xaml.Automation.h>

namespace winrt::NativeScript::Mason::implementation
{
    namespace peers = winrt::Microsoft::UI::Xaml::Automation::Peers;

    TextAutomationPeer::TextAutomationPeer(winrt::NativeScript::Mason::Text const& owner)
        : TextAutomationPeerT<TextAutomationPeer>(owner), m_owner(owner)
    {
    }

    bool TextAutomationPeer::IsButton() const
    {
        auto owner = m_owner.get();
        return owner && winrt::get_self<implementation::Text>(owner)->IsButton();
    }

    winrt::hstring TextAutomationPeer::GetClassNameCore() const { return IsButton() ? L"Button" : L"TextBlock"; }

    peers::AutomationControlType TextAutomationPeer::GetAutomationControlTypeCore() const
    {
        return IsButton() ? peers::AutomationControlType::Button : peers::AutomationControlType::Text;
    }

    winrt::hstring TextAutomationPeer::GetNameCore() const
    {
        auto owner = m_owner.get();
        if (!owner) return {};
        // An explicit accessible name wins, as it does for a TextBlock.
        auto name = winrt::Microsoft::UI::Xaml::Automation::AutomationProperties::GetName(owner);
        if (!name.empty()) return name;
        // Markup whitespace around the text isn't part of the name.
        std::wstring_view text = winrt::get_self<implementation::Text>(owner)->AccessibleText();
        const auto first = text.find_first_not_of(L" \t\r\n");
        if (first == std::wstring_view::npos) return {};
        return winrt::hstring{ text.substr(first, text.find_last_not_of(L" \t\r\n") - first + 1) };
    }

    bool TextAutomationPeer::IsControlElementCore() const { return true; }

    bool TextAutomationPeer::IsContentElementCore() const { return true; }

    winrt::Windows::Foundation::IInspectable TextAutomationPeer::GetPatternCore(peers::PatternInterface const& pattern) const
    {
        if (pattern == peers::PatternInterface::Invoke && IsButton()) return *this;
        return TextAutomationPeerT<TextAutomationPeer>::GetPatternCore(pattern);
    }

    void TextAutomationPeer::Invoke()
    {
        if (auto owner = m_owner.get(); owner && IsButton())
        {
            winrt::get_self<implementation::Text>(owner)->RaiseInvoked();
        }
    }

    winrt::Windows::Foundation::Collections::IVector<peers::AutomationPeer> TextAutomationPeer::GetChildrenCore() const
    {
        auto owner = m_owner.get();
        if (!owner) return TextAutomationPeerT<TextAutomationPeer>::GetChildrenCore();
        auto items = winrt::get_self<implementation::Text>(owner)->InlineItems();
        if (items.empty())
        {
            m_inline.clear();
            return TextAutomationPeerT<TextAutomationPeer>::GetChildrenCore();
        }
        auto children = winrt::single_threaded_vector<peers::AutomationPeer>();
        std::vector<winrt::NativeScript::Mason::InlineAutomationPeer> kept;
        for (auto const& item : items)
        {
            if (item.isBox)
            {
                if (auto peer = peers::FrameworkElementAutomationPeer::CreatePeerForElement(item.element.as<winrt::Microsoft::UI::Xaml::UIElement>())) children.Append(peer);
                continue;
            }
            winrt::NativeScript::Mason::InlineAutomationPeer peer{ nullptr };
            for (auto const& existing : m_inline)
            {
                if (winrt::get_self<InlineAutomationPeer>(existing)->Element() == item.element) peer = existing;
            }
            if (!peer) peer = winrt::make<InlineAutomationPeer>(owner, item.element);
            winrt::get_self<InlineAutomationPeer>(peer)->Update(item.bounds, item.label, item.isLink);
            kept.push_back(peer);
            children.Append(peer);
        }
        m_inline = std::move(kept);
        return children;
    }
}
