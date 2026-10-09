#pragma once
#include "List.g.h"
#include "Invalidation.h"
#include "VisualState.h"
#include <unordered_map>

namespace winrt::NativeScript::Mason::implementation
{
    struct List : ListT<List>
    {
        List() : List(false) {}
        explicit List(bool ordered);

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }
        bool Ordered() const noexcept { return m_ordered; }

        void SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
        {
            m_visual.styleDirty = true;
            mason_leaf::StyleSynced(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, mason_leaf::DirtyWords(d0, d1, d2, d3));
        }

        void Invalidate();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        bool m_ordered{ false };
        std::unordered_map<void*, winrt::NativeScript::Mason::Node> m_leaves;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct List : ListT<List, implementation::List>
    {
    };
}
