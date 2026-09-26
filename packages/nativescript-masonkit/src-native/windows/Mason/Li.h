#pragma once
#include "Li.g.h"
#include "VisualState.h"
#include <unordered_map>

namespace winrt::NativeScript::Mason::implementation
{
    struct Li : LiT<Li>
    {
        Li();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&)
        {
            m_visual.styleDirty = true;
            if (m_node) m_node.MarkDirty();
            InvalidateMeasure();
        }

        void Invalidate();

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        winrt::NativeScript::Mason::Mason m_engine{ nullptr };
        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        std::unordered_map<void*, winrt::NativeScript::Mason::Node> m_leaves;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Li : LiT<Li, implementation::Li>
    {
    };
}
