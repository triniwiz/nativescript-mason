#pragma once
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/NativeScript.Mason.h>
#include "LeafCommon.h"

namespace mason_leaf
{
    // Only the layout root's measure does work: its compute lays out the whole tree, and a nested
    // panel reads that layout in Arrange. So every Mason ancestor is arranged again but only the root
    // measured; a panel whose children change is measured where they change, to sync them. The engine
    // marks the node's ancestors dirty itself.
    inline void InvalidateLayoutRoot(winrt::Microsoft::UI::Xaml::UIElement const& element)
    {
        winrt::Microsoft::UI::Xaml::FrameworkElement top{ nullptr };
        auto cur = element.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>();
        while (cur)
        {
            if (cur.try_as<winrt::NativeScript::Mason::IMasonElement>())
            {
                // An earlier walk since the last compute went on from here to the root.
                if (!MarkInvalidated(winrt::get_abi(cur))) return;
                cur.InvalidateArrange();
                top = cur;
            }
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<winrt::Microsoft::UI::Xaml::FrameworkElement>() : nullptr;
        }
        if (top) top.InvalidateMeasure();
    }

    inline void StyleChanged(winrt::Microsoft::UI::Xaml::UIElement const& element, winrt::NativeScript::Mason::Node const& node)
    {
        if (node) node.MarkDirty();
        InvalidateLayoutRoot(element);
    }
}
