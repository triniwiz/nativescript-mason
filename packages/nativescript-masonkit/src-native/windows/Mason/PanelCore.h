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
#include <cmath>
#include <unordered_map>
#include <vector>
#include <winrt/NativeScript.Mason.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include "LeafCommon.h"
#include "Positioning.h"

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

    inline void InvalidateLayoutRoot(mux::UIElement const& element)
    {
        auto cur = element.try_as<mux::FrameworkElement>();
        while (cur)
        {
            if (auto el = cur.try_as<nsm::IMasonElement>())
            {
                if (auto node = el.Node()) node.MarkDirty();
                cur.InvalidateMeasure();
                cur.InvalidateArrange();
            }
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<mux::FrameworkElement>() : nullptr;
        }
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
                    float w = std::isnan(kw) ? aw : kw;
                    float h = std::isnan(kh) ? ah : kh;
                    c.Measure(winrt::Windows::Foundation::Size{ w, h });
                    auto d = c.DesiredSize();
                    return mason_leaf::PackMeasure(d.Width, d.Height);
                };
                leaf.SetMeasure(cb);
            }
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
    
        mux::UIElement layer{ nullptr };
        auto visible = SyncChildren(engine, node, children, leaves, layer);
        for (auto const& c : visible) c.Measure(available);

        const bool isRoot = !HasMasonAncestor(self);
        if (isRoot)
        {
            const bool wf = std::isfinite(available.Width);
            const bool hf = std::isfinite(available.Height);
            node.ComputeSize(
                wf ? nsm::AvailableSpaceType::Definite : nsm::AvailableSpaceType::MaxContent, available.Width,
                hf ? nsm::AvailableSpaceType::Definite : nsm::AvailableSpaceType::MaxContent, available.Height);
            if (layer) mason_position::MeasureLayer(layer, available);
        }

        auto layout = node.GetLayout();
        return { layout.Width(), layout.Height() };
    }

    inline winrt::Windows::Foundation::Size Arrange(
        mux::UIElement const& self,
        nsm::Node const& node, muxc::UIElementCollection const& children,
        winrt::Windows::Foundation::Size const& finalSize)
    {
        auto layout = node.GetLayout();
        auto childLayouts = layout.Children();
        uint32_t count = childLayouts.Size();

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
            auto cl = childLayouts.GetAt(i++);
            if (el) mason_position::SyncChild(self, child, el.Node());
            child.Arrange(winrt::Windows::Foundation::Rect{ cl.X(), cl.Y(), cl.Width(), cl.Height() });
        }

        if (layer && !layerLast) mason_position::KeepLayerLastLater(self.as<muxc::Panel>());
        if (layer || !mason_position::Links().empty())
        {
            mason_position::AfterArrange(self, layer, finalSize, !HasMasonAncestor(self));
        }
        return finalSize;
    }
}
