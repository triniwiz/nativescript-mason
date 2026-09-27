#pragma once
#include "View.g.h"
#include "VisualState.h"
#include <unordered_map>
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

        void SyncStyle(winrt::hstring const&, winrt::hstring const&);

        void Invalidate();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& availableSize);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        int32_t m_nodeKind{ 0 };
        std::unordered_map<void*, winrt::NativeScript::Mason::Node> m_leaves;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct View : ViewT<View, implementation::View>
    {
    };
}
