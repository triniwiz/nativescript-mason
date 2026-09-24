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
        // A root that is a ScrollViewer's content is as big as its content, so Taffy anchors
        // bottom/right insets to the content's far edge rather than the viewport's.
        float shiftX = 0.0f, shiftY = 0.0f;
        if (auto owner = Parent().try_as<mux::FrameworkElement>())
        {
            if (auto sv = mason_position::ScrollerHosting(owner))
            {
                shiftX = (std::max)(0.0f, finalSize.Width - static_cast<float>(sv.ViewportWidth()));
                shiftY = (std::max)(0.0f, finalSize.Height - static_cast<float>(sv.ViewportHeight()));
            }
        }

        for (auto const& child : Children())
        {
            auto el = child.try_as<nsm::IMasonElement>();
            if (!el) continue;
            auto node = el.Node();
            auto l = node.GetLayout();
            float x = l.X(), y = l.Y();
            if (shiftX > 0.0f || shiftY > 0.0f)
            {
                mason_position::StyleBytes style(node);
                if (style.I8(mason_position::INSET_LEFT_TYPE) == 0 && style.I8(mason_position::INSET_RIGHT_TYPE) != 0) x -= shiftX;
                if (style.I8(mason_position::INSET_TOP_TYPE) == 0 && style.I8(mason_position::INSET_BOTTOM_TYPE) != 0) y -= shiftY;
            }
            child.Arrange({ x, y, l.Width(), l.Height() });
        }
        return finalSize;
    }
}
