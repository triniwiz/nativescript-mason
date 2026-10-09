#pragma once

#include <algorithm>
#include <cstring>
#include <unordered_map>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Windows.UI.h>
#include <winrt/Windows.Storage.Streams.h>
#include <winrt/NativeScript.Mason.h>
#include "BufferUtil.h"
#include "Decoration.h"
#include "RoundedMask.h"
#include "BoxShadow.h"
#include "FilterEffects.h"
#include "RootScale.h"
#include "VisualState.h"
#include "Node.h"

namespace mason_visual
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    namespace muxm = winrt::Microsoft::UI::Xaml::Media;
    namespace mucomp = winrt::Microsoft::UI::Composition;

    enum : uint32_t
    {
        OVERFLOW_X = 5,                         // i8 (0=visible,1=hidden,2=scroll,3=clip,4=auto)
        OVERFLOW_Y = 6,                         // i8
        BORDER_LEFT_VALUE = 77,                 // f32 width px
        BORDER_RIGHT_VALUE = 81,                // f32
        BORDER_TOP_VALUE = 85,                  // f32
        BORDER_BOTTOM_VALUE = 89,               // f32
        BORDER_LEFT_STYLE = 198,                // i8 (0=none,1=hidden,2=dotted,3=dashed,4=solid,...)
        BORDER_RIGHT_STYLE = 199,               // i8
        BORDER_TOP_STYLE = 200,                 // i8
        BORDER_BOTTOM_STYLE = 201,              // i8
        BORDER_LEFT_COLOR = 202,                // u32 ARGB
        BORDER_RIGHT_COLOR = 206,               // u32 ARGB
        BORDER_TOP_COLOR = 210,                 // u32 ARGB
        BORDER_BOTTOM_COLOR = 214,              // u32 ARGB
        FONT_COLOR = 324,                       // u32 ARGB
        FONT_SIZE = 329,                        // i32 px
        BACKGROUND_COLOR = 348,                 // u32 ARGB
        BORDER_RADIUS_TOP_LEFT_X_TYPE = 218,    // i8 (0=length, 1=percent as a 0-1 fraction)
        BORDER_RADIUS_TOP_LEFT_X_VALUE = 226,   // f32
    };

    inline bool SubtreeOverflows(nsm::Layout const& lay, float offX, float offY, float w, float h, bool vx, bool vy)
    {
        auto kids = lay.Children();
        const uint32_t n = kids.Size();
        for (uint32_t i = 0; i < n; ++i)
        {
            auto cl = kids.GetAt(i);
            const float cx = offX + cl.X();
            const float cy = offY + cl.Y();
            if (vx && (cx < -0.5f || cx + cl.Width() > w + 0.5f)) return true;
            if (vy && (cy < -0.5f || cy + cl.Height() > h + 0.5f)) return true;
            if (cl.HasChildren() && SubtreeOverflows(cl, cx, cy, w, h, vx, vy)) return true;
        }
        return false;
    }

    inline winrt::Windows::UI::Color ColorFromArgb(uint32_t argb)
    {
        return winrt::Windows::UI::Color{
            static_cast<uint8_t>((argb >> 24) & 0xFF),
            static_cast<uint8_t>((argb >> 16) & 0xFF),
            static_cast<uint8_t>((argb >> 8) & 0xFF),
            static_cast<uint8_t>(argb & 0xFF) };
    }

    inline uint8_t AlphaOf(uint32_t argb) { return static_cast<uint8_t>((argb >> 24) & 0xFF); }

    // Round a background by masking `source` with a rounded rect and setting it as Panel.Background.
    // A rounded Visual.Clip isn't anti-aliased and renders the subtree offscreen, where text loses
    // ClearType. False (nothing changed) without a compositor.
    inline bool ApplyRoundedBackground(muxc::Panel const& panel, mucomp::CompositionBrush const& source, float w, float h,
        mason_shape::Radii const& radii, float scale)
    {
        auto comp = mason_deco::CompositorFor(panel);
        if (!comp || !source || w <= 0.0f || h <= 0.0f) return false;
        const float pw = w * scale;
        const float ph = h * scale;

        mucomp::CompositionBrush maskBrush = mason_mask::RoundedRect(comp, radii, scale);
        if (!maskBrush)
        {
            // No Direct2D device: Composition's own (aliased) rendering of the shape.
            auto geo = mason_shape::Geometry(comp, pw, ph, radii.Scaled(scale));
            if (!geo) return false;
            auto shape = comp.CreateSpriteShape(geo);
            shape.FillBrush(comp.CreateColorBrush(winrt::Windows::UI::Colors::White()));
            auto shapeVisual = comp.CreateShapeVisual();
            shapeVisual.Size({ pw, ph });
            shapeVisual.Shapes().Append(shape);
            auto surface = comp.CreateVisualSurface();
            surface.SourceVisual(shapeVisual);
            surface.SourceSize({ pw, ph });
            auto surfaceBrush = comp.CreateSurfaceBrush(surface);
            surfaceBrush.Stretch(mucomp::CompositionStretch::Fill);
            maskBrush = surfaceBrush;
        }

        auto mask = comp.CreateMaskBrush();
        mask.Source(source);
        mask.Mask(maskBrush);

        // Always a new brush: the panel's current one may be shared with other elements.
        nsm::RoundedColorBrush rcb;
        rcb.SetCompositionBrush(mask);
        panel.Background(rcb);
        return true;
    }

    // Backgrounds repeat across elements (list rows, tiles, avatars) and XAML brushes can be shared,
    // so each colour, and each rounded colour at a radius and scale, is built once. Never destroyed:
    // releasing XAML objects after the thread's XAML shuts down crashes.
    inline muxm::Brush SharedSolid(uint32_t argb)
    {
        thread_local auto* brushes = new std::unordered_map<uint32_t, muxm::Brush>();
        auto it = brushes->find(argb);
        if (it != brushes->end()) return it->second;
        if (brushes->size() > 512) brushes->clear();
        return brushes->emplace(argb, muxm::SolidColorBrush(ColorFromArgb(argb))).first->second;
    }

    // Null without a Direct2D device, whose fallback mask is sized to one element.
    inline muxm::Brush SharedRounded(mucomp::Compositor const& comp, uint32_t argb, mason_shape::Radii const& radii, float scale)
    {
        thread_local auto* brushes = new std::unordered_map<std::string, muxm::Brush>();
        struct Key { uint32_t argb; mason_shape::Radii radii; float scale; } k{ argb, radii, scale };
        const std::string key = mason_mask::KeyOf('s', k);
        auto it = brushes->find(key);
        if (it != brushes->end()) return it->second;
        auto maskBrush = mason_mask::RoundedRect(comp, radii, scale);
        if (!maskBrush) return nullptr;
        auto mask = comp.CreateMaskBrush();
        mask.Source(comp.CreateColorBrush(ColorFromArgb(argb)));
        mask.Mask(maskBrush);
        nsm::RoundedColorBrush rcb;
        rcb.SetCompositionBrush(mask);
        if (brushes->size() > 512) brushes->clear();
        return brushes->emplace(key, rcb).first->second;
    }

    inline mucomp::CompositionBrush ToCompositionBrush(mucomp::Compositor const& comp, muxm::LinearGradientBrush const& xaml)
    {
        auto brush = comp.CreateLinearGradientBrush();
        const auto start = xaml.StartPoint();
        const auto end = xaml.EndPoint();
        brush.StartPoint({ static_cast<float>(start.X), static_cast<float>(start.Y) });
        brush.EndPoint({ static_cast<float>(end.X), static_cast<float>(end.Y) });
        for (auto const& stop : xaml.GradientStops())
        {
            brush.ColorStops().Append(comp.CreateColorGradientStop(static_cast<float>(stop.Offset()), stop.Color()));
        }
        return brush;
    }

    // Draw the element's CSS border as a tagged composition layer. Uniform borders draw as one
    // rounded-rect stroke (following border-radius); mixed per-side borders fall back to squared fills.
    inline void DrawBorderShapes(mux::UIElement const& element,
        float lW, float rW, float tW, float bW,
        uint32_t lC, uint32_t rC, uint32_t tC, uint32_t bC,
        int8_t lS, int8_t rS, int8_t tS, int8_t bS,
        float width, float height, float radius, AppliedState& state)
    {
        const bool drawL = lW > 0.0f && AlphaOf(lC) > 0 && lS != 1;
        const bool drawR = rW > 0.0f && AlphaOf(rC) > 0 && rS != 1;
        const bool drawT = tW > 0.0f && AlphaOf(tC) > 0 && tS != 1;
        const bool drawB = bW > 0.0f && AlphaOf(bC) > 0 && bS != 1;

        if ((!drawL && !drawR && !drawT && !drawB) || width <= 0.0f || height <= 0.0f)
        {
            mason_deco::SetLayer(element, L"mason-border", nullptr);
            state.borderVisual = nullptr;
            state.borderGeometry = nullptr;
            return;
        }

        const bool uniform = drawL && drawR && drawT && drawB &&
            lW == rW && rW == tW && tW == bW &&
            lC == rC && rC == tC && tC == bC;

        const float sw = lW;
        float r = radius;
        const float maxR = (width < height ? width : height) * 0.5f;
        if (r > maxR) r = maxR;
        const float innerR = (std::max)(0.0f, r - sw * 0.5f);
        const winrt::Windows::Foundation::Numerics::float2 inner{ (std::max)(0.0f, width - sw), (std::max)(0.0f, height - sw) };
        if (uniform && state.borderGeometry && state.borderStroke == sw && state.borderColor == lC)
        {
            state.borderVisual.Size({ width, height });
            state.borderGeometry.Size(inner);
            if (state.borderRadius != innerR)
            {
                state.borderGeometry.CornerRadius({ innerR, innerR });
                state.borderRadius = innerR;
            }
            return;
        }

        auto comp = mason_deco::CompositorFor(element);
        if (!comp) return;

        auto shapeVisual = comp.CreateShapeVisual();
        shapeVisual.Size({ width, height });
        state.borderVisual = nullptr;
        state.borderGeometry = nullptr;

        if (uniform)
        {
            // CSS borders sit inside the box; inset by half the stroke width so the outer edge lands on it.
            auto geo = comp.CreateRoundedRectangleGeometry();
            geo.Offset({ sw * 0.5f, sw * 0.5f });
            geo.Size(inner);
            geo.CornerRadius({ innerR, innerR });
            auto shape = comp.CreateSpriteShape(geo);
            shape.StrokeThickness(sw);
            shape.StrokeBrush(comp.CreateColorBrush(ColorFromArgb(lC)));
            shapeVisual.Shapes().Append(shape);
            state.borderVisual = shapeVisual;
            state.borderGeometry = geo;
            state.borderStroke = sw;
            state.borderColor = lC;
            state.borderRadius = innerR;
        }
        else
        {
            // Per-side fills (squared corners).
            auto addRect = [&](float x, float y, float w, float h, uint32_t color)
            {
                if (w <= 0.0f || h <= 0.0f) return;
                auto geo = comp.CreateRectangleGeometry();
                geo.Offset({ x, y });
                geo.Size({ w, h });
                auto shape = comp.CreateSpriteShape(geo);
                shape.FillBrush(comp.CreateColorBrush(ColorFromArgb(color)));
                shapeVisual.Shapes().Append(shape);
            };
            if (drawT) addRect(0.0f, 0.0f, width, tW, tC);
            if (drawB) addRect(0.0f, height - bW, width, bW, bC);
            if (drawL) addRect(0.0f, 0.0f, lW, height, lC);
            if (drawR) addRect(width - rW, 0.0f, rW, height, rC);
        }

        mason_deco::SetLayer(element, L"mason-border", shapeVisual);
    }

    inline void DrawBorder(mux::UIElement const& element, mason_mask::Border const& border, float width, float height, float scale,
        AppliedState& state)
    {
        if (!border.Any() || width <= 0.0f || height <= 0.0f)
        {
            mason_deco::SetLayer(element, L"mason-border", nullptr);
            state.borderSprite = nullptr;
            state.borderVisual = nullptr;
            state.borderGeometry = nullptr;
            state.borderKey.clear();
            return;
        }
        auto comp = mason_deco::CompositorFor(element);
        if (!comp) return;
        const bool sized = border.Patterned();
        struct Key { mason_mask::Border border; float scale; float w; float h; } k{ border, scale, sized ? width : 0.0f, sized ? height : 0.0f };
        const std::string key = mason_mask::KeyOf('k', k);
        if (state.borderSprite && state.borderKey == key)
        {
            state.borderSprite.Size({ width, height });
            return;
        }
        auto brush = mason_mask::BorderBrush(comp, border, width, height, scale);
        if (!brush)
        {
            state.borderSprite = nullptr;
            state.borderKey.clear();
            DrawBorderShapes(element, border.width[0], border.width[2], border.width[1], border.width[3], border.color[0], border.color[2],
                border.color[1], border.color[3], border.style[0], border.style[2], border.style[1], border.style[3], width, height,
                border.radii.x[0], state);
            return;
        }
        if (!state.borderSprite)
        {
            state.borderSprite = comp.CreateSpriteVisual();
            state.borderVisual = nullptr;
            state.borderGeometry = nullptr;
            mason_deco::SetLayer(element, L"mason-border", state.borderSprite);
        }
        state.borderSprite.Brush(brush);
        state.borderSprite.Size({ width, height });
        state.borderKey = key;
    }

    inline uint32_t Bits(float f)
    {
        uint32_t b;
        std::memcpy(&b, &f, sizeof(b));
        return b;
    }

    inline uint32_t RadiiBits(mason_shape::Radii const& r)
    {
        uint32_t h = 2166136261u;
        for (int i = 0; i < 4; ++i)
        {
            h = (h ^ Bits(r.x[i])) * 16777619u;
            h = (h ^ Bits(r.y[i])) * 16777619u;
        }
        return h;
    }

    // The node's style bytes for reading, without the Style and IBuffer projections, which allocate
    // and run a copy-on-write check on every call.
    inline const uint8_t* StyleBytes(nsm::Node const& node, uint32_t& size)
    {
        return winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->StyleData(size);
    }

    inline void Apply(mux::UIElement const& element, nsm::Node const& node, float width, float height, AppliedState& state)
    {
        if (!element || !node) return;
        // Reading the style buffer costs a dozen WinRT calls, and only SyncStyle, a resize, a scale
        // change or another writer of the brush or clip can change what Apply installs.
        const uint64_t shadowVersion = mason_shadow::Version(element);
        const uint64_t filterVersion = mason_filter::Version(element);
        if (state.valid && !state.styleDirty && !state.subtreeDependent && state.width == width
            && state.height == height && state.scaleEpoch == g_scaleEpoch && state.shadowVersion == shadowVersion
            && state.filterVersion == filterVersion)
        {
            auto panel = element.try_as<muxc::Panel>();
            if ((!panel || panel.Background() == state.background) && (!state.visual || state.visual.Clip() == state.clip)) return;
        }
        uint32_t size = 0;
        const uint8_t* data = StyleBytes(node, size);
        if (!data) return;

        auto readU32 = [&](uint32_t off) -> uint32_t {
            uint32_t v = 0;
            if (off + 4 <= size) std::memcpy(&v, data + off, 4);
            return v;
        };
        auto readF32 = [&](uint32_t off) -> float {
            float v = 0.0f;
            if (off + 4 <= size) std::memcpy(&v, data + off, 4);
            return v;
        };
        auto readI8 = [&](uint32_t off) -> int8_t {
            return (off < size) ? static_cast<int8_t>(data[off]) : 0;
        };

        const mason_shape::Radii radii = mason_shape::Read(data, size, width, height);
        const bool rounded = radii.Any();
        const uint32_t bg = readU32(BACKGROUND_COLOR);
        const int8_t ovX = readI8(OVERFLOW_X);
        const int8_t ovY = readI8(OVERFLOW_Y);
        const bool visibleX = (ovX == 0);
        const bool visibleY = (ovY == 0);
        const float bLW = readF32(BORDER_LEFT_VALUE), bRW = readF32(BORDER_RIGHT_VALUE);
        const float bTW = readF32(BORDER_TOP_VALUE), bBW = readF32(BORDER_BOTTOM_VALUE);
        const uint32_t bLC = readU32(BORDER_LEFT_COLOR), bRC = readU32(BORDER_RIGHT_COLOR);
        const uint32_t bTC = readU32(BORDER_TOP_COLOR), bBC = readU32(BORDER_BOTTOM_COLOR);
        const int8_t bLS = readI8(BORDER_LEFT_STYLE), bRS = readI8(BORDER_RIGHT_STYLE);
        const int8_t bTS = readI8(BORDER_TOP_STYLE), bBS = readI8(BORDER_BOTTOM_STYLE);

        auto panel = element.try_as<muxc::Panel>();
        if (panel && !state.watchingBackground)
        {
            state.watchingBackground = true;
            panel.RegisterPropertyChangedCallback(muxc::Panel::BackgroundProperty(), [](mux::DependencyObject const& sender, mux::DependencyProperty const&)
            {
                if (auto changed = sender.try_as<mux::UIElement>()) changed.InvalidateArrange();
            });
        }
        const auto comp = mason_deco::ThreadCompositor();
        const bool sized = width > 0.0f && height > 0.0f;
        const auto current = panel ? panel.Background() : nullptr;
        // Something else replaced the brush: a gradient from Css, which paints over background-color
        // as a CSS background-image does, or the tap handler's transparent brush.
        if (current != state.installed) state.gradient = current ? current.try_as<muxm::LinearGradientBrush>() : nullptr;
        const bool external = current && current != state.installed && !current.try_as<muxm::SolidColorBrush>();
        const bool gradient = current && (current == state.installed ? state.gradient != nullptr : external);
        const bool round = panel && comp != nullptr && rounded && sized;
        const bool roundGradient = round && gradient && state.gradient;
        const bool roundSolid = round && !gradient && AlphaOf(bg) > 0;
        const bool hasBackground = panel && (gradient || AlphaOf(bg) > 0);
        // Masked backgrounds are already rounded; anything else rounds with a clip.
        const bool needsClip = hasBackground && rounded && sized && !roundGradient && !roundSolid;
        int32_t zIndex = 0;
        if (size >= 314) std::memcpy(&zIndex, data + 310, 4);
        mux::FrameworkElement fe{ nullptr };
        bool scrolled = false;
        if (zIndex != state.zIndex || (sized && (!visibleX || !visibleY)))
        {
            fe = element.try_as<mux::FrameworkElement>();
            scrolled = fe && fe.Parent().try_as<muxc::ScrollViewer>();
        }
        const bool overflowClip = sized && !scrolled && (!visibleX || !visibleY);

        if (zIndex != state.zIndex)
        {
            auto host = scrolled ? fe.Parent().as<mux::UIElement>() : element;
            muxc::Canvas::SetZIndex(host, zIndex);
            state.zIndex = zIndex;
        }
        // The element's own visual only to set or clear a clip: fetching it gives the element a
        // hand-off visual.
        auto visual = state.visual;
        if (!visual && (needsClip || overflowClip || state.clip)) visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);

        bool childOverflows = false;
        if ((visibleX || visibleY) && needsClip && !overflowClip)
        {
            if (auto layout = node.GetLayout())
            {
                childOverflows = SubtreeOverflows(layout, 0.0f, 0.0f, width, height, visibleX, visibleY);
            }
        }

        // Masks are drawn in device pixels, so a monitor move must redraw them.
        const float scale = RasterScale(element);
        const std::array<uint32_t, AppliedState::kInputs> inputs{
            bg, RadiiBits(radii), Bits(width), Bits(height), Bits(scale),
            static_cast<uint32_t>(static_cast<uint8_t>(ovX)) | (static_cast<uint32_t>(static_cast<uint8_t>(ovY)) << 8)
                | (childOverflows ? 1u << 16 : 0u),
            Bits(bLW), Bits(bRW), Bits(bTW), Bits(bBW),
            bLC, bRC, bTC, bBC,
            static_cast<uint32_t>(static_cast<uint8_t>(bLS)) | (static_cast<uint32_t>(static_cast<uint8_t>(bRS)) << 8)
                | (static_cast<uint32_t>(static_cast<uint8_t>(bTS)) << 16) | (static_cast<uint32_t>(static_cast<uint8_t>(bBS)) << 24),
        };
        auto remember = [&]()
        {
            state.visual = visual;
            state.width = width;
            state.height = height;
            state.scaleEpoch = g_scaleEpoch;
            state.styleDirty = false;
            state.subtreeDependent = (visibleX || visibleY) && needsClip && !overflowClip;
        };
        if (state.valid && state.inputs == inputs && state.shadowVersion == shadowVersion && state.filterVersion == filterVersion
            && (!panel || panel.Background() == state.background)
            && (!visual || visual.Clip() == state.clip))
        {
            remember();
            return;
        }

        auto* filters = mason_filter::Find(element);
        const bool backdrop = panel && comp && sized && filters && !filters->backdrop.empty();
        if (backdrop)
        {
            auto over = AlphaOf(bg) > 0 ? comp.CreateColorBrush(ColorFromArgb(bg)) : nullptr;
            if (auto brush = mason_filter::Brush(comp, filters->backdrop, true, comp.CreateBackdropBrush(), over))
            {
                if (rounded) ApplyRoundedBackground(panel, brush, width, height, radii, scale);
                else
                {
                    nsm::RoundedColorBrush rcb;
                    rcb.SetCompositionBrush(brush);
                    panel.Background(rcb);
                }
                state.installed = panel.Background();
            }
        }
        else if (roundGradient)
        {
            ApplyRoundedBackground(panel, ToCompositionBrush(comp, state.gradient), width, height, radii, scale);
            state.installed = panel.Background();
        }
        else if (gradient && state.gradient && current == state.installed)
        {
            // No longer rounded: hand the plain gradient back.
            panel.Background(state.gradient);
        }
        else if (roundSolid)
        {
            if (auto shared = SharedRounded(comp, bg, radii, scale))
            {
                if (current != shared) panel.Background(shared);
                state.installed = shared;
            }
            else
            {
                ApplyRoundedBackground(panel, comp.CreateColorBrush(ColorFromArgb(bg)), width, height, radii, scale);
                state.installed = panel.Background();
            }
        }
        else if (panel && !gradient && AlphaOf(bg) > 0)
        {
            auto shared = SharedSolid(bg);
            if (current != shared) panel.Background(shared);
            state.installed = shared;
        }
        else if (panel && current && current == state.installed)
        {
            // Transparent rather than null keeps the element hit-testable for tap handlers.
            auto shared = SharedSolid(0);
            if (current != shared) panel.Background(shared);
            state.installed = shared;
        }

        if (visual)
        {
            if (overflowClip && comp)
            {
                constexpr float kOpen = 1.0e5f;
                mucomp::CompositionGeometry geo{ nullptr };
                if (!visibleX && !visibleY)
                {
                    geo = mason_shape::Geometry(comp, width, height, radii);
                }
                else
                {
                    auto rect = comp.CreateRectangleGeometry();
                    rect.Offset({ visibleX ? -kOpen : 0.0f, visibleY ? -kOpen : 0.0f });
                    rect.Size({ visibleX ? width + 2.0f * kOpen : width, visibleY ? height + 2.0f * kOpen : height });
                    geo = rect;
                }
                if (geo) visual.Clip(comp.CreateGeometricClip(geo));
            }
            else if (needsClip && !childOverflows)
            {
                auto geo = mason_shape::Geometry(comp, width, height, radii);
                if (geo) visual.Clip(comp.CreateGeometricClip(geo));
            }
            else if (visual.Clip())
            {
                visual.Clip(nullptr);
            }
        }

        mason_mask::Border border;
        border.width = { bLW, bTW, bRW, bBW };
        border.color = { bLC, bTC, bRC, bBC };
        border.style = { bLS, bTS, bRS, bBS };
        border.radii = radii;
        const bool anyBorder = sized && border.Any();
        if (anyBorder || state.border)
        {
            DrawBorder(element, border, width, height, scale, state);
        }
        state.border = anyBorder;

        if (shadowVersion || state.shadow)
        {
            if (!state.shadow) state.shadow = std::make_shared<mason_shadow::State>();
            mason_shadow::Sync(element, width, height, radii, scale, *state.shadow);
        }
        state.shadowVersion = shadowVersion;

        if (filterVersion) mason_filter::Sync(element, width, height);
        state.filterVersion = filterVersion;

        state.inputs = inputs;
        state.background = panel ? panel.Background() : nullptr;
        state.clip = visual ? visual.Clip() : nullptr;
        state.valid = true;
        remember();
    }
}
