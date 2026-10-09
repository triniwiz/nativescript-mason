#pragma once
// Shared container logic for Mason panels (View, Li). A container mirrors its Mason node's children
// to its visible XAML children — any child implementing IMasonElement contributes its own node;
// any other UIElement is wrapped as a generic Mason leaf measured off its XAML DesiredSize.
//
// Layout is computed ONCE on the topmost Mason view (the "layout root", i.e. a panel with no
// IMasonElement ancestor) — matching the iOS/Android model. Nested panels mirror their node into the
// tree (SyncChildren) and READ their already-computed layout in Arrange; they do NOT run their own
// ComputeSize. Computing each panel independently made every flex container a fresh layout root that
// self-sized to its content (so a block-level flex with fixed-width children shrink-wrapped instead
// of filling the parent's width); the single-root compute gives the parent's block context a chance
// to stretch nested flex containers to full width, exactly as CSS / iOS / Android do.
// Header-only so the thin panel classes can share it without an extra translation unit.
#include <algorithm>
#include <cmath>
#include <limits>
#include <unordered_map>
#include <vector>
#include <winrt/NativeScript.Mason.h>
#include <winrt/Windows.UI.Xaml.Interop.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include "Invalidation.h"
#include "LeafCommon.h"
#include "Node.h"
#include "Positioning.h"
#include "ScrollHost.h"
#include "RootScale.h"
#include "TextAtlas.h"
#include "VisualState.h"

namespace mason_panel
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;

    inline void* IdOf(mux::UIElement const& e)
    {
        auto unk = e.as<winrt::Windows::Foundation::IUnknown>();
        return winrt::get_abi(unk);
    }

    // Percentage width/height of a non-Mason child (Mason.SetPercentWidth/Height): XAML sizes have
    // no percentages. NaN when unset.
    inline mux::DependencyProperty const& PercentProperty(bool horizontal)
    {
        auto make = [](wchar_t const* name)
        {
            return mux::DependencyProperty::RegisterAttached(name, winrt::xaml_typename<double>(), winrt::xaml_typename<nsm::Mason>(),
                mux::PropertyMetadata{ winrt::box_value(std::numeric_limits<double>::quiet_NaN()) });
        };
        static const mux::DependencyProperty width = make(L"PercentWidth");
        static const mux::DependencyProperty height = make(L"PercentHeight");
        return horizontal ? width : height;
    }

    // A non-Mason child's box for its leaf: the size, min/max and margins core writes to the XAML
    // element, and its percentages. The engine skips the invalidation when nothing changed.
    inline void SyncForeignBox(nsm::Node const& leaf, mux::FrameworkElement const& fe)
    {
        struct Length { signed char type; float value; };
        auto size = [&fe](double value, bool horizontal) -> Length
        {
            double percent = winrt::unbox_value<double>(fe.GetValue(PercentProperty(horizontal)));
            if (!std::isnan(percent)) return { 2, static_cast<float>(percent) };
            return std::isfinite(value) ? Length{ 1, static_cast<float>(value) } : Length{ 0, 0.0f };
        };
        // XAML's defaults, 0 and infinity, are no limit.
        auto limit = [](double value, double none) -> Length
        {
            return std::isfinite(value) && value != none ? Length{ 1, static_cast<float>(value) } : Length{ 0, 0.0f };
        };
        auto w = size(fe.Width(), true);
        auto h = size(fe.Height(), false);
        auto minW = limit(fe.MinWidth(), 0.0), minH = limit(fe.MinHeight(), 0.0);
        auto maxW = limit(fe.MaxWidth(), std::numeric_limits<double>::infinity());
        auto maxH = limit(fe.MaxHeight(), std::numeric_limits<double>::infinity());
        auto m = fe.Margin();
        auto* node = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(leaf);
        mason_style_set_box_size(node->MasonPtr(), node->NodePtr(), w.type, w.value, h.type, h.value,
            minW.type, minW.value, minH.type, minH.value, maxW.type, maxW.value, maxH.type, maxH.value,
            static_cast<float>(m.Left), static_cast<float>(m.Top), static_cast<float>(m.Right), static_cast<float>(m.Bottom));
    }

    // The engine measures the border box and adds the margins itself, while XAML measures and
    // arranges them inside the size it is given: add them to the constraint, take them off after.
    inline int64_t MeasureForeign(mux::UIElement const& child, float kw, float kh, float aw, float ah)
    {
        auto fe = child.try_as<mux::FrameworkElement>();
        if (!fe) return mason_leaf::MeasureXaml(child, kw, kh, aw, ah);
        auto m = fe.Margin();
        const float mx = static_cast<float>(m.Left + m.Right);
        const float my = static_cast<float>(m.Top + m.Bottom);
        child.Measure(winrt::Windows::Foundation::Size{ mason_leaf::XamlConstraint(kw, aw) + mx, mason_leaf::XamlConstraint(kh, ah) + my });
        auto d = child.DesiredSize();
        return mason_leaf::PackMeasure((std::max)(0.0f, d.Width - mx), (std::max)(0.0f, d.Height - my));
    }

    inline bool HasMasonAncestor(mux::UIElement const& element)
    {
        auto fe = element.try_as<mux::FrameworkElement>();
        if (!fe) return false;
        auto parent = fe.Parent();
        while (parent)
        {
            if (parent.try_as<nsm::IMasonElement>()) return true;
            auto pfe = parent.try_as<mux::FrameworkElement>();
            if (!pfe) break;
            parent = pfe.Parent();
        }
        return false;
    }

    // A ScrollViewer around a Mason panel (a scroll element): the panel's node carries the element's
    // style, so it stands in for the ScrollViewer in the parent's tree.
    inline nsm::IMasonElement ScrollContentOf(mux::UIElement const& child)
    {
        auto sv = child.try_as<muxc::ScrollViewer>();
        return sv ? sv.Content().try_as<nsm::IMasonElement>() : nullptr;
    }

    inline std::vector<mux::UIElement> SyncChildren(
        nsm::Mason const& engine, nsm::Node const& node,
        muxc::UIElementCollection const& children, std::unordered_map<void*, nsm::Node>& leaves,
        mux::UIElement& layer)
    {
        std::vector<mux::UIElement> visible;
        std::vector<nsm::Node> nodes;
        std::unordered_map<void*, nsm::Node> next;

        for (auto const& child : children)
        {
            if (child.Visibility() == mux::Visibility::Collapsed) continue;

            if (auto el = child.try_as<nsm::IMasonElement>())
            {
                visible.push_back(child);
                nodes.push_back(el.Node());
                continue;
            }
            if (auto content = ScrollContentOf(child))
            {
                visible.push_back(child);
                nodes.push_back(content.Node());
                continue;
            }
            if (mason_position::AsLayer(child))
            {
                layer = child;
                continue;
            }
            visible.push_back(child);

            void* id = IdOf(child);
            auto it = leaves.find(id);
            nsm::Node leaf{ nullptr };
            if (it != leaves.end())
            {
                leaf = it->second;
                leaves.erase(it);
            }
            else
            {
                leaf = engine.CreateNode(false);
                auto weak = winrt::make_weak(child);
                nsm::MeasureFunc cb = [weak](float kw, float kh, float aw, float ah) -> int64_t
                {
                    auto c = weak.get();
                    if (!c) return mason_leaf::PackMeasure(0.0f, 0.0f);
                    return MeasureForeign(c, kw, kh, aw, ah);
                };
                leaf.SetMeasure(cb);
            }
            if (auto fe = child.try_as<mux::FrameworkElement>()) SyncForeignBox(leaf, fe);
            next.emplace(id, leaf);
            nodes.push_back(leaf);
        }

        for (auto& kv : leaves)
        {
            if (kv.second) kv.second.Destroy();
        }
        leaves = std::move(next);
        node.SetChildren(nodes);
        return visible;
    }

    inline winrt::Windows::Foundation::Size Measure(
        nsm::Mason const& engine, nsm::Node const& node, mux::UIElement const& self,
        muxc::UIElementCollection const& children, std::unordered_map<void*, nsm::Node>& leaves,
        winrt::Windows::Foundation::Size const& available)
    {
        const bool isRoot = !HasMasonAncestor(self);
        // Before any child is measured: changing a TextBlock's inlines mid-measure costs far more.
        if (isRoot) mason_leaf::FlushBeforeCompute();
        mux::UIElement layer{ nullptr };
        auto visible = SyncChildren(engine, node, children, leaves, layer);
        for (auto const& c : visible)
        {
            // A scroller is measured at its frame, here and in Arrange: XAML clips an element arranged
            // smaller than it asked for, and a viewport that changes in arrange re-measures it mid-pass.
            auto content = ScrollContentOf(c);
            c.Measure(content ? winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(content.Node())->LayoutSize() : available);
        }

        if (isRoot)
        {
            mason_leaf::t_invalidated.clear();
            mason_visual::g_computeScale = mason_visual::RasterScale(self);
            const bool wf = std::isfinite(available.Width);
            const bool hf = std::isfinite(available.Height);
            node.ComputeSize(
                wf ? nsm::AvailableSpaceType::Definite : nsm::AvailableSpaceType::MaxContent, available.Width,
                hf ? nsm::AvailableSpaceType::Definite : nsm::AvailableSpaceType::MaxContent, available.Height);
            mason_leaf::FlushAfterCompute();
            if (layer) mason_position::MeasureLayer(layer, available);
            return winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->LayoutSize();
        }

        // The root's compute sizes a nested panel, after this measure. Reporting the last layout's size
        // would get a panel that shrank a layout clip, since XAML clips an element arranged smaller than
        // it asked for, and nothing measures it again.
        // A scroller's content is the exception: its size is the scroll extent. Arrange measures it
        // again when a compute changes that.
        if (auto fe = self.try_as<mux::FrameworkElement>(); fe && fe.Parent().try_as<muxc::ScrollViewer>())
        {
            auto* impl = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node);
            impl->MeasuredExtent = impl->ScrollExtent();
            return impl->MeasuredExtent;
        }
        return winrt::Windows::Foundation::Size{ 0.0f, 0.0f };
    }

    inline winrt::Windows::Foundation::Size Arrange(
        mux::UIElement const& self,
        nsm::Node const& node, muxc::UIElementCollection const& children,
        winrt::Windows::Foundation::Size const& finalSize)
    {
        // Copied out: arranging a child re-enters Arrange, which reuses the node's float buffer.
        std::vector<winrt::Windows::Foundation::Rect> frames;
        winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->ShallowFrames(frames);
        const uint32_t count = frames.empty() ? 0 : static_cast<uint32_t>(frames.size() - 1);

        // XAML rounds each offset to device pixels relative to its parent, so a -12.5px box with a
        // +12.5px child lands the child a pixel off. Snap in root coordinates instead, as browsers
        // do: the offset becomes a whole number of pixels, which XAML's rounding leaves alone.
        const bool isRoot = !HasMasonAncestor(self);
        auto* selfNode = node ? winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node) : nullptr;
        const float originX = isRoot || !selfNode ? 0.0f : selfNode->ArrangeX;
        const float originY = isRoot || !selfNode ? 0.0f : selfNode->ArrangeY;
        float scale = 0.0f;
        if (auto root = self.XamlRoot()) scale = mason_visual::ScaleOf(root);
        auto snap = [scale](float absolute, float origin, float fallback)
        {
            return scale > 0.0f ? (std::round(absolute * scale) - std::round(origin * scale)) / scale : fallback;
        };

        mux::UIElement layer{ nullptr };
        bool layerLast = true;
        uint32_t i = 0;
        for (auto const& child : children)
        {
            if (layer) layerLast = false;
            if (child.Visibility() == mux::Visibility::Collapsed) continue;
            auto el = child.try_as<nsm::IMasonElement>();
            if (!el && mason_position::AsLayer(child))
            {
                layer = child;
                continue;
            }
            if (i >= count) continue;
            auto const& cl = frames[1 + i++];
            const float absX = originX + cl.X;
            const float absY = originY + cl.Y;
            if (el)
            {
                auto childNode = el.Node();
                if (childNode)
                {
                    auto* impl = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(childNode);
                    impl->ArrangeX = absX;
                    impl->ArrangeY = absY;
                }
                mason_position::SyncChild(self, child, childNode);
                if (auto panel = self.try_as<muxc::Panel>()) mason_scroll::SyncChild(panel, child, childNode);
            }
            auto scrollContent = el ? nullptr : ScrollContentOf(child);
            if (scrollContent)
            {
                mason_scroll::SyncScroller(child.as<muxc::ScrollViewer>(), scrollContent);
                auto* impl = winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(scrollContent.Node());
                impl->ArrangeX = absX;
                impl->ArrangeY = absY;
                auto extent = impl->ScrollExtent();
                if (extent != impl->MeasuredExtent) scrollContent.as<mux::UIElement>().InvalidateMeasure();
                child.Measure({ cl.Width, cl.Height });
            }
            winrt::Windows::Foundation::Rect rect{ snap(absX, originX, cl.X), snap(absY, originY, cl.Y), cl.Width, cl.Height };
            if (!el && !scrollContent)
            {
                // The frame is the border box; XAML takes the margins off the rect it arranges in.
                if (auto fe = child.try_as<mux::FrameworkElement>())
                {
                    auto m = fe.Margin();
                    rect.X -= static_cast<float>(m.Left);
                    rect.Y -= static_cast<float>(m.Top);
                    rect.Width += static_cast<float>(m.Left + m.Right);
                    rect.Height += static_cast<float>(m.Top + m.Bottom);
                }
            }
            child.Arrange(rect);
        }

        if (layer && !layerLast) mason_position::KeepLayerLastLater(self.as<muxc::Panel>());
        if (layer || !mason_position::Links().empty())
        {
            mason_position::AfterArrange(self, layer, finalSize, isRoot);
        }
        if (isRoot)
        {
            mason_leaf::t_invalidated.clear();
            // Every text arranged in this pass is drawn in one go.
            mason_atlas::Flush();
        }
        return finalSize;
    }
}
