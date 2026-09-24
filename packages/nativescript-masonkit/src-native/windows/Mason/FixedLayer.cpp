#include "pch.h"
#include "FixedLayer.h"
#include "FixedLayer.g.cpp"
#include "Positioning.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace winrt::NativeScript::Mason::implementation
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace nsm = winrt::NativeScript::Mason;

    Size FixedLayer::MeasureOverride(Size const&)
    {
        auto owner = Parent().try_as<mux::FrameworkElement>();
        void* ownerKey = mason_position::KeyOf(owner);
        mux::UIElement self = *this;

        std::vector<mux::UIElement> hosted;
        for (auto const& c : Children()) hosted.push_back(c);
        for (auto const& child : hosted)
        {
            auto it = m_slots.find(mason_position::KeyOf(child));
            auto slot = it != m_slots.end() ? it->second.get().try_as<mux::FrameworkElement>() : nullptr;
            if (!slot || !slot.Parent())
            {
                mason_position::UnhostLater(self, child, false);
                continue;
            }
            auto el = child.try_as<nsm::IMasonElement>();
            auto node = el ? el.Node() : nullptr;
            // Left this root's tree, or no longer fixed: its tree parent re-hosts it if needed.
            if (mason_position::ReadPosition(node) != mason_position::kFixed
                || mason_position::KeyOf(mason_position::LayoutRootPanelOf(slot)) != ownerKey)
            {
                mason_position::UnhostLater(self, child, true);
                continue;
            }
            auto l = node.GetLayout();
            child.Measure({ l.Width(), l.Height() });
        }
        return { 0.0f, 0.0f };
    }

    Size FixedLayer::ArrangeOverride(Size const& finalSize)
    {
        for (auto const& child : Children())
        {
            auto el = child.try_as<nsm::IMasonElement>();
            if (!el) continue;
            auto l = el.Node().GetLayout();
            child.Arrange({ l.X(), l.Y(), l.Width(), l.Height() });
        }
        return finalSize;
    }
}
