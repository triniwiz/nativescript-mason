#pragma once

// position: fixed / sticky (counterpart of MasonPositioning.swift / .kt).
//
// Taffy resolves a fixed box against the layout root, so the box is moved into a FixedLayer on the
// root. Panel.Children mirrors the node tree, so a FixedSlot keeps its old place and node order.
//
// Scroll-linked offsets use a TranslateTransform (keeps hit-testing right) plus a composition
// expression that covers the lag between that transform and the compositor-driven scroll.

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <functional>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>
#include <winrt/Windows.Foundation.Numerics.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/NativeScript.Mason.h>
#include "BufferUtil.h"
#include "FixedLayer.h"
#include "FixedSlot.h"

namespace mason_position
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxh = winrt::Microsoft::UI::Xaml::Hosting;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;
    namespace mucomp = winrt::Microsoft::UI::Composition;
    namespace nsm = winrt::NativeScript::Mason;
    namespace wf = winrt::Windows::Foundation;

    enum : uint32_t
    {
        POSITION = 1,           // i8: 0=static,1=relative,2=absolute,3=fixed,4=sticky
        INSET_LEFT_TYPE = 13,   // i8: 0=auto,1=px,2=percent (fraction)
        INSET_RIGHT_TYPE = 14,
        INSET_TOP_TYPE = 15,
        INSET_BOTTOM_TYPE = 16,
        INSET_LEFT_VALUE = 17,  // f32
        INSET_RIGHT_VALUE = 21,
        INSET_TOP_VALUE = 25,
        INSET_BOTTOM_VALUE = 29,
    };

    constexpr int8_t kFixed = 3;
    constexpr int8_t kSticky = 4;
    constexpr int32_t kLayerZIndex = 1000000;

    inline void* KeyOf(wf::IInspectable const& o)
    {
        return o ? winrt::get_abi(o.as<wf::IUnknown>()) : nullptr;
    }

    struct StyleBytes
    {
        const uint8_t* data = nullptr;
        uint32_t size = 0;

        explicit StyleBytes(nsm::Node const& node)
        {
            if (!node) return;
            auto style = node.Style();
            if (!style) return;
            auto buf = style.Values();
            if (!buf) return;
            auto access = buf.try_as<mason_buf::IBufferByteAccess>();
            uint8_t* raw = nullptr;
            if (!access || FAILED(access->Buffer(&raw)) || raw == nullptr) return;
            data = raw;
            size = buf.Length();
        }

        int8_t I8(uint32_t off) const { return off < size ? static_cast<int8_t>(data[off]) : 0; }

        float F32(uint32_t off) const
        {
            float v = 0.0f;
            if (off + sizeof(float) <= size) std::memcpy(&v, data + off, sizeof(float));
            return v;
        }

        std::optional<float> Inset(uint32_t typeOff, uint32_t valueOff, float basis) const
        {
            switch (I8(typeOff))
            {
            case 1: return F32(valueOff);
            case 2: return F32(valueOff) * basis;
            default: return std::nullopt;
            }
        }
    };

    inline int8_t ReadPosition(nsm::Node const& node)
    {
        return StyleBytes(node).I8(POSITION);
    }

    // RenderTransform is the CSS matrix, the positioning offset, or TransformGroup{ css, offset }.
    inline muxm::TransformGroup OwnGroup(muxm::Transform const& t)
    {
        auto group = t.try_as<muxm::TransformGroup>();
        return group && group.Children().Size() == 2 ? group : nullptr;
    }

    inline muxm::MatrixTransform CssPart(muxm::Transform const& t)
    {
        if (auto m = t.try_as<muxm::MatrixTransform>()) return m;
        if (auto group = OwnGroup(t)) return group.Children().GetAt(0).try_as<muxm::MatrixTransform>();
        return nullptr;
    }

    inline muxm::TranslateTransform OffsetPart(muxm::Transform const& t)
    {
        if (auto tt = t.try_as<muxm::TranslateTransform>()) return tt;
        if (auto group = OwnGroup(t)) return group.Children().GetAt(1).try_as<muxm::TranslateTransform>();
        return nullptr;
    }

    inline void ComposeTransform(mux::UIElement const& element, muxm::MatrixTransform const& css, muxm::TranslateTransform const& offset)
    {
        auto group = OwnGroup(element.RenderTransform());
        // A transform can only have one owner: detach both parts before re-seating them.
        if (group) group.Children().Clear();
        else element.RenderTransform(nullptr);

        if (css && offset)
        {
            if (!group) group = muxm::TransformGroup();
            group.Children().Append(css);
            group.Children().Append(offset);
            element.RenderTransform(group);
        }
        else if (css)
        {
            element.RenderTransform(css);
        }
        else if (offset)
        {
            element.RenderTransform(offset);
        }
        else
        {
            element.RenderTransform(nullptr);
        }
    }

    inline void SetCssTransform(mux::UIElement const& element, muxm::MatrixTransform const& css)
    {
        ComposeTransform(element, css, OffsetPart(element.RenderTransform()));
    }

    inline muxm::TranslateTransform EnsureOffset(mux::UIElement const& element)
    {
        auto current = element.RenderTransform();
        if (auto offset = OffsetPart(current)) return offset;
        muxm::TranslateTransform offset;
        ComposeTransform(element, CssPart(current), offset);
        return offset;
    }

    inline void ClearOffset(mux::UIElement const& element)
    {
        auto current = element.RenderTransform();
        if (OffsetPart(current)) ComposeTransform(element, CssPart(current), nullptr);
    }

    enum : uint32_t
    {
        LINK_TOP = 1,
        LINK_BOTTOM = 2,
        LINK_LEFT = 4,
        LINK_RIGHT = 8,
        LINK_LAYER = 16,
    };

    struct ScrollLink
    {
        winrt::weak_ref<mux::UIElement> element;
        winrt::weak_ref<muxc::ScrollViewer> scroller;
        mucomp::CompositionPropertySet props{ nullptr };
        bool sticky = false;
        bool linked = false;
        uint32_t mode = 0; // LINK_* of the running expression; 0 = none
        void* animatedWith = nullptr;

        // Sticky geometry, in scroller-content coordinates.
        float natX = 0.0f, natY = 0.0f, w = 0.0f, h = 0.0f;
        float loX = 0.0f, hiX = 0.0f, loY = 0.0f, hiY = 0.0f;
        std::optional<float> top, bottom, left, right;
    };

    inline std::unordered_map<void*, ScrollLink>& Links()
    {
        thread_local std::unordered_map<void*, ScrollLink> links;
        return links;
    }

    inline ScrollLink* FindLink(mux::UIElement const& element)
    {
        auto& links = Links();
        auto it = links.find(KeyOf(element));
        if (it == links.end()) return nullptr;
        // The key is an object address; a dead entry may alias a newer object.
        if (!it->second.element.get())
        {
            links.erase(it);
            return nullptr;
        }
        return &it->second;
    }

    inline uint32_t StickyMode(ScrollLink const& link)
    {
        uint32_t mode = 0;
        if (link.top) mode |= LINK_TOP;
        else if (link.bottom) mode |= LINK_BOTTOM;
        if (link.left) mode |= LINK_LEFT;
        else if (link.right) mode |= LINK_RIGHT;
        return mode;
    }

    inline wf::Numerics::float2 LinkOffset(ScrollLink const& link, float sx, float sy, float vw, float vh)
    {
        if (!link.sticky) return { sx, sy };
        float dx = 0.0f, dy = 0.0f;
        if (link.top) dy = std::clamp((std::max)(0.0f, sy + *link.top - link.natY), link.loY, link.hiY);
        else if (link.bottom) dy = std::clamp((std::min)(0.0f, sy + vh - *link.bottom - link.h - link.natY), link.loY, link.hiY);
        if (link.left) dx = std::clamp((std::max)(0.0f, sx + *link.left - link.natX), link.loX, link.hiX);
        else if (link.right) dx = std::clamp((std::min)(0.0f, sx + vw - *link.right - link.w - link.natX), link.loX, link.hiX);
        return { dx, dy };
    }

    // s.Translation is the negated scroll offset; p.AX/AY is what the TranslateTransform already applies.
    inline std::wstring LinkExpression(uint32_t mode)
    {
        if (mode & LINK_LAYER) return L"Vector3(-s.Translation.X - p.AX, -s.Translation.Y - p.AY, 0)";
        std::wstring x = L"0";
        std::wstring y = L"0";
        if (mode & LINK_LEFT) x = L"Clamp(Max(0, p.Left - s.Translation.X - p.NatX), p.LoX, p.HiX) - p.AX";
        else if (mode & LINK_RIGHT) x = L"Clamp(Min(0, p.ViewW - p.Right - p.W - s.Translation.X - p.NatX), p.LoX, p.HiX) - p.AX";
        if (mode & LINK_TOP) y = L"Clamp(Max(0, p.Top - s.Translation.Y - p.NatY), p.LoY, p.HiY) - p.AY";
        else if (mode & LINK_BOTTOM) y = L"Clamp(Min(0, p.ViewH - p.Bottom - p.H - s.Translation.Y - p.NatY), p.LoY, p.HiY) - p.AY";
        return L"Vector3(" + x + L", " + y + L", 0)";
    }

    inline void ApplyLink(ScrollLink& link, mux::UIElement const& element, muxc::ScrollViewer const& sv, float sx, float sy)
    {
        const float vw = static_cast<float>(sv.ViewportWidth());
        const float vh = static_cast<float>(sv.ViewportHeight());
        const auto applied = LinkOffset(link, sx, sy, vw, vh);

        if (!link.props)
        {
            link.props = muxh::ElementCompositionPreview::GetElementVisual(element).Compositor().CreatePropertySet();
        }
        auto& p = link.props;
        p.InsertScalar(L"NatX", link.natX);
        p.InsertScalar(L"NatY", link.natY);
        p.InsertScalar(L"W", link.w);
        p.InsertScalar(L"H", link.h);
        p.InsertScalar(L"LoX", link.loX);
        p.InsertScalar(L"HiX", link.hiX);
        p.InsertScalar(L"LoY", link.loY);
        p.InsertScalar(L"HiY", link.hiY);
        p.InsertScalar(L"Top", link.top.value_or(0.0f));
        p.InsertScalar(L"Bottom", link.bottom.value_or(0.0f));
        p.InsertScalar(L"Left", link.left.value_or(0.0f));
        p.InsertScalar(L"Right", link.right.value_or(0.0f));
        p.InsertScalar(L"ViewW", vw);
        p.InsertScalar(L"ViewH", vh);
        p.InsertScalar(L"AX", applied.x);
        p.InsertScalar(L"AY", applied.y);

        auto offset = EnsureOffset(element);
        if (offset.X() != applied.x) offset.X(applied.x);
        if (offset.Y() != applied.y) offset.Y(applied.y);
    }

    // Call after ApplyLink (the expression reads its parameters). Best effort: the TranslateTransform
    // alone still positions the box.
    inline void StartLink(ScrollLink& link, mux::UIElement const& element, muxc::ScrollViewer const& sv, uint32_t mode)
    {
        if (link.mode == mode && link.animatedWith == KeyOf(sv)) return;
        try
        {
            auto visual = muxh::ElementCompositionPreview::GetElementVisual(element);
            muxh::ElementCompositionPreview::SetIsTranslationEnabled(element, true);
            auto expr = visual.Compositor().CreateExpressionAnimation(LinkExpression(mode));
            expr.SetReferenceParameter(L"s", muxh::ElementCompositionPreview::GetScrollViewerManipulationPropertySet(sv));
            expr.SetReferenceParameter(L"p", link.props);
            visual.StartAnimation(L"Translation", expr);
            link.mode = mode;
            link.animatedWith = KeyOf(sv);
        }
        catch (winrt::hresult_error const&)
        {
        }
    }

    inline void StopLink(ScrollLink& link, mux::UIElement const& element)
    {
        if (link.mode != 0)
        {
            try
            {
                auto visual = muxh::ElementCompositionPreview::GetElementVisual(element);
                visual.StopAnimation(L"Translation");
                visual.Properties().InsertVector3(L"Translation", { 0.0f, 0.0f, 0.0f });
            }
            catch (winrt::hresult_error const&)
            {
            }
            link.mode = 0;
            link.animatedWith = nullptr;
        }
        link.linked = false;
        ClearOffset(element);
    }

    inline void Unlink(mux::UIElement const& element)
    {
        auto link = FindLink(element);
        if (!link) return;
        StopLink(*link, element);
        if (link->sticky) muxc::Canvas::SetZIndex(element, 0);
        Links().erase(KeyOf(element));
    }

    inline void UpdateScroller(muxc::ScrollViewer const& sv, float sx, float sy)
    {
        const void* key = KeyOf(sv);
        for (auto& [_, link] : Links())
        {
            if (!link.linked || KeyOf(link.scroller.get()) != key) continue;
            if (auto element = link.element.get()) ApplyLink(link, element, sv, sx, sy);
        }
    }

    inline void UpdateScrollerAtRest(muxc::ScrollViewer const& sv)
    {
        UpdateScroller(sv, static_cast<float>(sv.HorizontalOffset()), static_cast<float>(sv.VerticalOffset()));
    }

    inline void HookScroller(muxc::ScrollViewer const& sv)
    {
        thread_local std::unordered_map<void*, winrt::weak_ref<muxc::ScrollViewer>> hooked;
        void* key = KeyOf(sv);
        if (auto it = hooked.find(key); it != hooked.end() && it->second.get()) return;
        for (auto it = hooked.begin(); it != hooked.end();)
        {
            it = it->second.get() ? std::next(it) : hooked.erase(it);
        }
        hooked[key] = winrt::make_weak(sv);

        sv.ViewChanging([](wf::IInspectable const& sender, muxc::ScrollViewerViewChangingEventArgs const& args)
        {
            auto next = args.NextView();
            UpdateScroller(sender.as<muxc::ScrollViewer>(),
                static_cast<float>(next.HorizontalOffset()), static_cast<float>(next.VerticalOffset()));
        });
        sv.ViewChanged([](wf::IInspectable const& sender, muxc::ScrollViewerViewChangedEventArgs const&)
        {
            UpdateScrollerAtRest(sender.as<muxc::ScrollViewer>());
        });
        sv.SizeChanged([](wf::IInspectable const& sender, mux::SizeChangedEventArgs const&)
        {
            UpdateScrollerAtRest(sender.as<muxc::ScrollViewer>());
        });
    }

    inline void Link(mux::UIElement const& element, muxc::ScrollViewer const& sv, bool sticky, uint32_t mode)
    {
        auto& links = Links();
        auto link = FindLink(element);
        if (!link)
        {
            link = &links[KeyOf(element)];
            link->element = winrt::make_weak(element);
            link->sticky = sticky;
        }
        HookScroller(sv);
        link->scroller = winrt::make_weak(sv);
        link->linked = true;
        ApplyLink(*link, element, sv, static_cast<float>(sv.HorizontalOffset()), static_cast<float>(sv.VerticalOffset()));
        StartLink(*link, element, sv, mode);
    }

    inline muxc::ScrollViewer NearestScroller(mux::UIElement const& element)
    {
        auto cur = muxm::VisualTreeHelper::GetParent(element);
        while (cur)
        {
            if (auto sv = cur.try_as<muxc::ScrollViewer>()) return sv;
            cur = muxm::VisualTreeHelper::GetParent(cur);
        }
        return nullptr;
    }

    // ActualOffset, not TransformToVisual, so the box's own offset and CSS transform don't feed back.
    inline bool MeasureSticky(ScrollLink& link, mux::UIElement const& element, muxc::ScrollViewer const& sv, StyleBytes const& style)
    {
        auto content = sv.Content().try_as<mux::UIElement>();
        auto parent = muxm::VisualTreeHelper::GetParent(element).try_as<mux::UIElement>();
        if (!content || !parent) return false;

        void* contentKey = KeyOf(content);
        float x = 0.0f, y = 0.0f;
        mux::DependencyObject cur = element;
        while (cur && KeyOf(cur) != contentKey)
        {
            if (auto ui = cur.try_as<mux::UIElement>())
            {
                auto o = ui.ActualOffset();
                x += o.x;
                y += o.y;
            }
            cur = muxm::VisualTreeHelper::GetParent(cur);
        }
        if (!cur) return false;

        const auto own = element.ActualOffset();
        const auto size = element.ActualSize();
        const auto cb = parent.ActualSize();
        link.natX = x;
        link.natY = y;
        link.w = size.x;
        link.h = size.y;
        const float minDx = -own.x, maxDx = cb.x - size.x - own.x;
        const float minDy = -own.y, maxDy = cb.y - size.y - own.y;
        link.loX = (std::min)(minDx, maxDx);
        link.hiX = (std::max)(minDx, maxDx);
        link.loY = (std::min)(minDy, maxDy);
        link.hiY = (std::max)(minDy, maxDy);

        const float vw = static_cast<float>(sv.ViewportWidth());
        const float vh = static_cast<float>(sv.ViewportHeight());
        link.top = style.Inset(INSET_TOP_TYPE, INSET_TOP_VALUE, vh);
        link.bottom = style.Inset(INSET_BOTTOM_TYPE, INSET_BOTTOM_VALUE, vh);
        link.left = style.Inset(INSET_LEFT_TYPE, INSET_LEFT_VALUE, vw);
        link.right = style.Inset(INSET_RIGHT_TYPE, INSET_RIGHT_VALUE, vw);
        return true;
    }

    // Geometry is measured in RefreshLinks: ancestor offsets aren't final until the root has arranged.
    inline void MarkSticky(mux::UIElement const& element)
    {
        if (FindLink(element)) return;
        auto& link = Links()[KeyOf(element)];
        link.element = winrt::make_weak(element);
        link.sticky = true;
        // Positioned boxes paint over later in-flow siblings.
        muxc::Canvas::SetZIndex(element, 1);
    }

    inline void RefreshLinks()
    {
        std::vector<mux::UIElement> sticky;
        for (auto it = Links().begin(); it != Links().end();)
        {
            auto element = it->second.element.get();
            if (!element)
            {
                it = Links().erase(it);
                continue;
            }
            if (it->second.sticky) sticky.push_back(element);
            ++it;
        }

        for (auto const& element : sticky)
        {
            auto link = FindLink(element);
            if (!link) continue;
            auto el = element.try_as<nsm::IMasonElement>();
            StyleBytes style(el ? el.Node() : nullptr);
            if (style.I8(POSITION) != kSticky)
            {
                Unlink(element);
                continue;
            }
            auto sv = NearestScroller(element);
            const uint32_t mode = sv && MeasureSticky(*link, element, sv, style) ? StickyMode(*link) : 0;
            if (mode == 0)
            {
                StopLink(*link, element);
                continue;
            }
            Link(element, sv, true, mode);
        }
    }

    // XAML throws if Children changes during measure/arrange; these ops run after the layout pass.
    struct DeferredOps
    {
        std::vector<std::function<void()>> ops;
        bool scheduled = false;
    };

    inline DeferredOps& Deferred()
    {
        thread_local DeferredOps deferred;
        return deferred;
    }

    inline void Defer(mux::UIElement const& anchor, std::function<void()> op)
    {
        auto& deferred = Deferred();
        deferred.ops.push_back(std::move(op));
        if (deferred.scheduled) return;
        auto dispatcher = anchor.DispatcherQueue();
        if (!dispatcher) return;
        deferred.scheduled = dispatcher.TryEnqueue([]
        {
            auto& deferred = Deferred();
            auto ops = std::move(deferred.ops);
            deferred.ops.clear();
            deferred.scheduled = false;
            for (auto& op : ops) op();
        });
    }

    using FixedSlot = winrt::NativeScript::Mason::implementation::FixedSlot;
    using FixedLayer = winrt::NativeScript::Mason::implementation::FixedLayer;

    inline FixedSlot* AsSlot(wf::IInspectable const& e)
    {
        auto slot = e.try_as<nsm::FixedSlot>();
        return slot ? winrt::get_self<FixedSlot>(slot) : nullptr;
    }

    inline FixedLayer* AsLayer(wf::IInspectable const& e)
    {
        auto layer = e.try_as<nsm::FixedLayer>();
        return layer ? winrt::get_self<FixedLayer>(layer) : nullptr;
    }

    inline muxc::Panel LayoutRootPanelOf(mux::FrameworkElement const& element)
    {
        mux::FrameworkElement root{ nullptr };
        auto cur = element;
        while (cur)
        {
            if (cur.try_as<nsm::IMasonElement>()) root = cur;
            auto parent = cur.Parent();
            cur = parent ? parent.try_as<mux::FrameworkElement>() : nullptr;
        }
        // Only containers running mason_panel's Arrange know to arrange a layer.
        if (!root || !(root.try_as<nsm::View>() || root.try_as<nsm::Li>() || root.try_as<nsm::List>())) return nullptr;
        return root.as<muxc::Panel>();
    }

    inline muxc::ScrollViewer ScrollerHosting(mux::FrameworkElement const& element)
    {
        void* key = KeyOf(element);
        if (auto sv = element.Parent().try_as<muxc::ScrollViewer>()) return KeyOf(sv.Content()) == key ? sv : nullptr;
        auto cur = muxm::VisualTreeHelper::GetParent(element);
        for (int depth = 0; cur && depth < 8; ++depth)
        {
            if (auto sv = cur.try_as<muxc::ScrollViewer>()) return KeyOf(sv.Content()) == key ? sv : nullptr;
            cur = muxm::VisualTreeHelper::GetParent(cur);
        }
        return nullptr;
    }

    inline mux::UIElement FindLayer(muxc::UIElementCollection const& children)
    {
        for (auto const& child : children)
        {
            if (AsLayer(child)) return child;
        }
        return nullptr;
    }

    // restore: put the element back in its slot's place; otherwise drop the slot too.
    inline void Unhost(FixedLayer* layer, mux::UIElement const& element, bool restore)
    {
        uint32_t at = 0;
        if (layer->Children().IndexOf(element, at)) layer->Children().RemoveAt(at);

        auto it = layer->m_slots.find(KeyOf(element));
        if (it == layer->m_slots.end()) return;
        auto slot = it->second.get();
        layer->m_slots.erase(it);
        if (!slot) return;
        if (auto impl = AsSlot(slot)) impl->m_target = nullptr;

        auto parent = slot.as<mux::FrameworkElement>().Parent().try_as<muxc::Panel>();
        if (!parent) return;
        uint32_t slotAt = 0;
        if (!parent.Children().IndexOf(slot, slotAt)) return;
        if (restore) parent.Children().SetAt(slotAt, element);
        else parent.Children().RemoveAt(slotAt);
        parent.InvalidateMeasure();
    }

    inline void UnhostLater(mux::UIElement const& layerElement, mux::UIElement const& element, bool restore)
    {
        Defer(layerElement, [layerWeak = winrt::make_weak(layerElement), elementWeak = winrt::make_weak(element), restore]
        {
            auto layerElement = layerWeak.get();
            auto element = elementWeak.get();
            auto layer = AsLayer(layerElement);
            if (layer && element) Unhost(layer, element, restore);
        });
    }

    inline void EvictLater(mux::UIElement const& layerElement)
    {
        Defer(layerElement, [layerWeak = winrt::make_weak(layerElement)]
        {
            auto layerElement = layerWeak.get();
            auto layer = AsLayer(layerElement);
            if (!layer) return;
            std::vector<mux::UIElement> hosted;
            for (auto const& c : layer->Children()) hosted.push_back(c);
            for (auto const& c : hosted) Unhost(layer, c, true);
            Unlink(layerElement);
            if (auto parent = layerElement.as<mux::FrameworkElement>().Parent().try_as<muxc::Panel>())
            {
                uint32_t at = 0;
                if (parent.Children().IndexOf(layerElement, at)) parent.Children().RemoveAt(at);
            }
        });
    }

    // JS/core child indices don't count the layer, so it must stay last.
    inline void KeepLayerLastLater(muxc::Panel const& panel)
    {
        Defer(panel, [panelWeak = winrt::make_weak(panel)]
        {
            auto panel = panelWeak.get();
            if (!panel) return;
            auto children = panel.Children();
            const uint32_t size = children.Size();
            for (uint32_t at = 0; at + 1 < size; ++at)
            {
                if (AsLayer(children.GetAt(at)))
                {
                    children.Move(at, size - 1);
                    return;
                }
            }
        });
    }

    inline void Host(muxc::Panel const& owner, mux::UIElement const& child)
    {
        auto el = child.try_as<nsm::IMasonElement>();
        auto node = el ? el.Node() : nullptr;
        if (ReadPosition(node) != kFixed) return;
        auto children = owner.Children();
        uint32_t index = 0;
        if (!children.IndexOf(child, index)) return;
        auto root = LayoutRootPanelOf(owner);
        if (!root) return;

        auto layerElement = FindLayer(root.Children());
        if (!layerElement)
        {
            layerElement = winrt::make<FixedLayer>().as<mux::UIElement>();
            muxc::Canvas::SetZIndex(layerElement, kLayerZIndex);
            root.Children().Append(layerElement);
        }
        auto layer = AsLayer(layerElement);

        Unlink(child);
        auto slot = winrt::make<FixedSlot>(child, node).as<mux::UIElement>();
        children.SetAt(index, slot);
        layer->Children().Append(child);
        layer->m_slots[KeyOf(child)] = winrt::make_weak(slot);
    }

    inline void HostLater(mux::UIElement const& owner, mux::UIElement const& child)
    {
        Defer(owner, [ownerWeak = winrt::make_weak(owner), childWeak = winrt::make_weak(child)]
        {
            auto owner = ownerWeak.get();
            auto child = childWeak.get();
            auto panel = owner ? owner.try_as<muxc::Panel>() : nullptr;
            if (panel && child) Host(panel, child);
        });
    }

    inline void SyncChild(mux::UIElement const& owner, mux::UIElement const& child, nsm::Node const& node)
    {
        if (auto slot = AsSlot(child))
        {
            auto target = slot->m_target;
            if (!target || ReadPosition(slot->m_node) == kFixed) return;
            auto targetFe = target.try_as<mux::FrameworkElement>();
            auto layer = targetFe ? targetFe.Parent().try_as<mux::UIElement>() : nullptr;
            if (AsLayer(layer)) UnhostLater(layer, target, true);
            return;
        }

        const int8_t position = ReadPosition(node);
        if (position == kFixed)
        {
            HostLater(owner, child);
        }
        else if (position == kSticky)
        {
            MarkSticky(child);
        }
        else if (!Links().empty())
        {
            Unlink(child);
        }
    }

    // XAML can't see that a compute moved the fixed rects, so force the layer's passes. This must run
    // in the measure pass: doing it from arrange makes XAML fail the layout.
    inline void MeasureLayer(mux::UIElement const& layer, wf::Size const& available)
    {
        layer.InvalidateMeasure();
        layer.InvalidateArrange();
        layer.Measure(available);
    }

    inline void AfterArrange(mux::UIElement const& owner, mux::UIElement const& layer, wf::Size const& finalSize, bool isRoot)
    {
        if (layer)
        {
            if (!isRoot)
            {
                // Nested under another Mason tree since.
                EvictLater(layer);
            }
            else
            {
                auto sv = ScrollerHosting(owner.as<mux::FrameworkElement>());
                if (sv) Link(layer, sv, false, LINK_LAYER);
                else Unlink(layer);
                layer.Arrange({ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
            }
        }
        if (isRoot && !Links().empty()) RefreshLinks();
    }

    inline muxc::Panel HostedParentOf(mux::UIElement const& element)
    {
        auto fe = element.try_as<mux::FrameworkElement>();
        auto layer = fe ? AsLayer(fe.Parent()) : nullptr;
        if (!layer) return nullptr;
        auto it = layer->m_slots.find(KeyOf(element));
        auto slot = it != layer->m_slots.end() ? it->second.get().try_as<mux::FrameworkElement>() : nullptr;
        return slot ? slot.Parent().try_as<muxc::Panel>() : nullptr;
    }

    inline void Release(mux::UIElement const& element)
    {
        auto fe = element.try_as<mux::FrameworkElement>();
        if (auto layer = fe ? AsLayer(fe.Parent()) : nullptr) Unhost(layer, element, false);
        Unlink(element);
    }
}
