#pragma once

#include <algorithm>
#include <cstring>
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
#include "VisualState.h"

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

    // Paint a solid rounded-rectangle background as the element's Panel.Background, using a Composition
    // mask-brush (a solid color masked by a rounded rect) wrapped in a RoundedColorBrush. This rounds
    // the corners WITHOUT a rounded Visual.Clip, so the element's subtree is not pushed into an
    // offscreen surface and TextBlocks inside keep ClearType (crisp white text) instead of falling back
    // to grayscale antialiasing. Returns false (and leaves a plain rectangular SolidColorBrush) if no
    // compositor is available, so the element always has a visible background. The caller skips the
    // geometric clip only when this returns true.
    inline bool ApplyRoundedSolidBackground(muxc::Panel const& panel, uint32_t argb, float w, float h, float radius)
    {
        auto comp = mason_deco::CompositorFor(panel);
        if (!comp || w <= 0.0f || h <= 0.0f)
        {
            panel.Background(muxm::SolidColorBrush(ColorFromArgb(argb)));
            return false;
        }

        float r = radius;
        const float maxR = (w < h ? w : h) * 0.5f;
        if (r > maxR) r = maxR;
        if (r < 0.0f) r = 0.0f;

        auto geo = comp.CreateRoundedRectangleGeometry();
        geo.Size({ w, h });
        geo.CornerRadius({ r, r });
        auto shape = comp.CreateSpriteShape(geo);
        shape.FillBrush(comp.CreateColorBrush(winrt::Windows::UI::Colors::White()));
        auto shapeVisual = comp.CreateShapeVisual();
        shapeVisual.Size({ w, h });
        shapeVisual.Shapes().Append(shape);
        auto surface = comp.CreateVisualSurface();
        surface.SourceVisual(shapeVisual);
        surface.SourceSize({ w, h });
        auto maskSurface = comp.CreateSurfaceBrush(surface);
        maskSurface.Stretch(mucomp::CompositionStretch::Fill);

        auto mask = comp.CreateMaskBrush();
        mask.Source(comp.CreateColorBrush(ColorFromArgb(argb)));
        mask.Mask(maskSurface);

        // Reuse an existing RoundedColorBrush on re-arrange so we only swap its inner Composition brush.
        nsm::RoundedColorBrush rcb{ nullptr };
        if (auto existing = panel.Background().try_as<nsm::RoundedColorBrush>())
        {
            rcb = existing;
        }
        else
        {
            rcb = nsm::RoundedColorBrush();
            panel.Background(rcb);
        }
        rcb.SetCompositionBrush(mask);
        return true;
    }

    // Draw the element's CSS border as a tagged composition layer. Uniform borders draw as one
    // rounded-rect stroke (following border-radius); mixed per-side borders fall back to squared fills.
    inline void DrawBorder(mux::UIElement const& element,
        float lW, float rW, float tW, float bW,
        uint32_t lC, uint32_t rC, uint32_t tC, uint32_t bC,
        int8_t lS, int8_t rS, int8_t tS, int8_t bS,
        float width, float height, float radius)
    {
        const bool drawL = lW > 0.0f && AlphaOf(lC) > 0 && lS != 1;
        const bool drawR = rW > 0.0f && AlphaOf(rC) > 0 && rS != 1;
        const bool drawT = tW > 0.0f && AlphaOf(tC) > 0 && tS != 1;
        const bool drawB = bW > 0.0f && AlphaOf(bC) > 0 && bS != 1;

        if ((!drawL && !drawR && !drawT && !drawB) || width <= 0.0f || height <= 0.0f)
        {
            mason_deco::SetLayer(element, L"mason-border", nullptr);
            return;
        }

        auto comp = mason_deco::CompositorFor(element);
        if (!comp) return;

        auto shapeVisual = comp.CreateShapeVisual();
        shapeVisual.Size({ width, height });

        const bool uniform = drawL && drawR && drawT && drawB &&
            lW == rW && rW == tW && tW == bW &&
            lC == rC && rC == tC && tC == bC;

        if (uniform)
        {
            const float sw = lW;
            float r = radius;
            const float maxR = (width < height ? width : height) * 0.5f;
            if (r > maxR) r = maxR;
            // CSS borders sit inside the box; inset by half the stroke width so the outer edge lands on it.
            auto geo = comp.CreateRoundedRectangleGeometry();
            geo.Offset({ sw * 0.5f, sw * 0.5f });
            geo.Size({ (std::max)(0.0f, width - sw), (std::max)(0.0f, height - sw) });
            const float innerR = (std::max)(0.0f, r - sw * 0.5f);
            geo.CornerRadius({ innerR, innerR });
            auto shape = comp.CreateSpriteShape(geo);
            shape.StrokeThickness(sw);
            shape.StrokeBrush(comp.CreateColorBrush(ColorFromArgb(lC)));
            shapeVisual.Shapes().Append(shape);
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

    inline uint32_t Bits(float f)
    {
        uint32_t b;
        std::memcpy(&b, &f, sizeof(b));
        return b;
    }

    inline void Apply(mux::UIElement const& element, nsm::Node const& node, float width, float height, AppliedState& state)
    {
        if (!element || !node) return;
        auto style = node.Style();
        if (!style) return;
        auto buf = style.Values();
        if (!buf) return;
        auto access = buf.try_as<mason_buf::IBufferByteAccess>();
        uint8_t* data = nullptr;
        if (!access || FAILED(access->Buffer(&data)) || data == nullptr) return;
        const uint32_t size = buf.Length();

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

        const float radius = readF32(BORDER_RADIUS_TOP_LEFT_X_VALUE);
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
        auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);
        const bool sized = width > 0.0f && height > 0.0f;
        const bool roundSolid = panel && bg != 0 && AlphaOf(bg) > 0 && radius > 0.0f && sized;
        // A background set outside Apply (e.g. a gradient from Css) counts when the buffer has none.
        const bool hasBackground = panel && (bg != 0 || panel.Background() != nullptr);
        // Rounded by the mask-brush (no clip, so text keeps ClearType) when a compositor exists.
        const bool roundedSolidBg = roundSolid && visual != nullptr;

        bool childOverflows = false;
        if ((visibleX || visibleY) && radius > 0.0f && sized && hasBackground && !roundedSolidBg)
        {
            if (auto layout = node.GetLayout())
            {
                childOverflows = SubtreeOverflows(layout, 0.0f, 0.0f, width, height, visibleX, visibleY);
            }
        }

        const std::array<uint32_t, AppliedState::kInputs> inputs{
            bg, Bits(radius), Bits(width), Bits(height),
            static_cast<uint32_t>(static_cast<uint8_t>(ovX)) | (static_cast<uint32_t>(static_cast<uint8_t>(ovY)) << 8)
                | (childOverflows ? 1u << 16 : 0u),
            Bits(bLW), Bits(bRW), Bits(bTW), Bits(bBW),
            bLC, bRC, bTC, bBC,
            static_cast<uint32_t>(static_cast<uint8_t>(bLS)) | (static_cast<uint32_t>(static_cast<uint8_t>(bRS)) << 8)
                | (static_cast<uint32_t>(static_cast<uint8_t>(bTS)) << 16) | (static_cast<uint32_t>(static_cast<uint8_t>(bBS)) << 24),
        };
        if (state.valid && state.inputs == inputs
            && (!panel || panel.Background() == state.background)
            && (!visual || visual.Clip() == state.clip))
        {
            return;
        }

        if (roundSolid)
        {
            // Round the solid background via a Composition mask-brush instead of a Visual.Clip so
            // the subtree isn't rendered offscreen (which would gray out text). Falls back to a
            // plain solid brush + clip if no compositor is available.
            ApplyRoundedSolidBackground(panel, bg, width, height, radius);
        }
        else if (panel && bg != 0)
        {
            panel.Background(muxm::SolidColorBrush(ColorFromArgb(bg)));
        }

        float r = radius;
        if (visual)
        {
            // Solid rounded backgrounds are already rounded by the mask-brush (no clip) so text stays
            // crisp; only non-solid (e.g. gradient) rounded fills still need the geometric clip.
            if (r > 0.0f && width > 0.0f && height > 0.0f && hasBackground && !childOverflows && !roundedSolidBg)
            {
                const float maxR = (width < height ? width : height) * 0.5f;
                if (r > maxR) r = maxR;
                auto comp = visual.Compositor();
                auto geo = comp.CreateRoundedRectangleGeometry();
                geo.Size({ width, height });
                geo.CornerRadius({ r, r });
                visual.Clip(comp.CreateGeometricClip(geo));
            }
            else
            {
                visual.Clip(nullptr);
            }
        }

        DrawBorder(element, bLW, bRW, bTW, bBW, bLC, bRC, bTC, bBC, bLS, bRS, bTS, bBS, width, height, radius);

        state.inputs = inputs;
        state.background = panel ? panel.Background() : nullptr;
        state.clip = visual ? visual.Clip() : nullptr;
        state.valid = true;
    }
}
