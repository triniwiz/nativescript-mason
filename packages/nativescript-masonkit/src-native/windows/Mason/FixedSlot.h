#pragma once
#include "FixedSlot.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    struct FixedSlot : FixedSlotT<FixedSlot>
    {
        FixedSlot(winrt::Microsoft::UI::Xaml::UIElement const& target, winrt::NativeScript::Mason::Node const& node)
            : m_target(target), m_node(node)
        {
        }

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node ? m_node.Style() : nullptr; }

        void SyncStyle(winrt::hstring const& dirtyLow, winrt::hstring const& dirtyHigh)
        {
            if (auto el = m_target.try_as<winrt::NativeScript::Mason::IMasonElement>()) el.SyncStyle(dirtyLow, dirtyHigh);
        }

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const&) { return { 0.0f, 0.0f }; }
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize) { return finalSize; }

        winrt::Microsoft::UI::Xaml::UIElement m_target{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
    };
}
