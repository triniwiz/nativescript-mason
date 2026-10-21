#pragma once
#include "View.g.h"
#include "VisualState.h"
#include <vector>

namespace winrt::NativeScript::Mason::implementation
{
    struct View : ViewT<View>
    {
        View() : View(0) {}
        explicit View(int32_t nodeKind);

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }
        int32_t NodeKind() const noexcept { return m_nodeKind; }

        void SyncStyle(int32_t, int32_t, int32_t, int32_t);

        void Invalidate();

        int32_t Role() const noexcept { return m_role; }
        void Role(int32_t value);
        bool Open() const noexcept { return m_open; }
        void Open(bool value);
        winrt::NativeScript::Mason::View Details();
        // Toggles the details this summary heads, as a tap does, and raises "toggle".
        void Activate();
        winrt::Microsoft::UI::Xaml::Automation::Peers::AutomationPeer OnCreateAutomationPeer();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& availableSize);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        int32_t m_nodeKind{ 0 };
        int32_t m_role{ 0 };
        bool m_open{ false };
        bool m_tapHooked{ false };

        void HideClosedContent(bool resync);
        void RefreshSummary();
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct View : ViewT<View, implementation::View>
    {
    };
}
