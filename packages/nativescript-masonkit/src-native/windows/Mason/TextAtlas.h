#pragma once
// Text drawn by Direct2D into shared atlas surfaces. The texts changed in a layout pass are packed
// into one new surface and drawn in a single BeginDraw; each text shows its slot through its own
// surface brush. A surface is drawn once, whole: a BeginDraw on part of one already on screen costs
// ~300 µs, ten times a draw that covers a new one.
#include <algorithm>
#include <cmath>
#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <d2d1_1.h>
#include <d2d1effects.h>
#include <dwrite_3.h>
#include <winrt/Microsoft.Graphics.DirectX.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Microsoft.UI.Composition.Interop.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include "Decoration.h"
#include "RoundedMask.h"
#include "DWriteText.h"

namespace mason_atlas
{
    namespace mucomp = winrt::Microsoft::UI::Composition;

    // Widest row of slots; a wider text gets a row of its own.
    constexpr int kPage = 2048;
    // Around each slot, so filtering at its edge never reaches a neighbour.
    constexpr int kGutter = 1;
    // A surface at least this large whose live slots cover under a quarter of it is redrawn away.
    constexpr int64_t kCompactArea = 256 * 1024;

    struct Sprite;

    struct Page
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        int width{ 0 };
        int height{ 0 };
        std::unordered_set<Sprite*> sprites;
    };

    struct Sprite
    {
        // Set by the text before it's queued. The layout is shared with measuring, so the wrapping
        // and box it's drawn with are kept to reapply.
        winrt::com_ptr<IDWriteTextLayout> layout;
        DWRITE_WORD_WRAPPING wrapping{ DWRITE_WORD_WRAPPING_NO_WRAP };
        float maxWidth{ 0.0f };
        std::vector<std::pair<DWRITE_TEXT_RANGE, uint32_t>> colors;
        uint32_t color{ 0xFF000000 };
        std::vector<mason_dwrite::Span> extras;
        std::vector<mason_dwrite::Shadow> shadows;
        // DIPs from the slot's top-left to the layout's origin. Vertical text (1 vertical-rl, 2
        // vertical-lr) is turned 90° clockwise: the origin is where its first line starts, for
        // vertical-lr the left of the line stack.
        float originX{ 0.0f };
        float originY{ 0.0f };
        uint8_t vertical{ 0 };
        int width{ 0 };
        int height{ 0 };
        float scale{ 1.0f };
        mucomp::SpriteVisual visual{ nullptr };

        // Owned by the atlas.
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        Page* page{ nullptr };
        Page* shown{ nullptr };
        int x{ 0 };
        int y{ 0 };
        bool queued{ false };
    };

    struct Atlas
    {
        mucomp::CompositionGraphicsDevice graphics{ nullptr };
        std::vector<std::unique_ptr<Page>> pages;
        std::vector<Sprite*> pending;
        std::unordered_map<uint32_t, winrt::com_ptr<ID2D1SolidColorBrush>> brushes;
        winrt::event_token rendering{};
        bool hooked{ false };
    };

    // Never destroyed: Composition objects must outlive the thread's compositor.
    inline Atlas& State()
    {
        thread_local auto* atlas = new Atlas();
        return *atlas;
    }

    inline mason_mask::Device* DeviceNow()
    {
        auto compositor = mason_deco::ThreadCompositor();
        return compositor ? mason_mask::DeviceFor(compositor) : nullptr;
    }

    inline bool Available() { return DeviceNow() != nullptr; }

    inline Page* NewPage(Atlas& a, mason_mask::Device& device, int width, int height)
    {
        auto page = std::make_unique<Page>();
        page->width = width;
        page->height = height;
        page->surface = device.graphics.CreateDrawingSurface2({ width, height },
            winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
            winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
        Page* raw = page.get();
        a.pages.push_back(std::move(page));
        return raw;
    }

    inline void ReleasePageIfUnused(Atlas& a, Page* page)
    {
        if (!page || !page->sprites.empty()) return;
        std::erase_if(a.pages, [page](auto const& p) { return p.get() == page; });
    }

    inline void Detach(Atlas& a, Sprite* s)
    {
        if (!s->page) return;
        Page* old = s->page;
        old->sprites.erase(s);
        s->page = nullptr;
        ReleasePageIfUnused(a, old);
    }

    // Before the sprite is destroyed.
    inline void Forget(Sprite* s)
    {
        auto& a = State();
        if (s->queued) std::erase(a.pending, s);
        s->queued = false;
        Detach(a, s);
    }

    inline void Flush();

    inline void Enqueue(Atlas& a, Sprite* s)
    {
        if (s->queued) return;
        s->queued = true;
        a.pending.push_back(s);
    }

    // The root arrange flushes; this covers texts arranged without one.
    inline void FlushNextFrame(Atlas& a)
    {
        if (a.hooked || a.pending.empty()) return;
        a.hooked = true;
        a.rendering = winrt::Microsoft::UI::Xaml::Media::CompositionTarget::Rendering([](auto&&, auto&&) { Flush(); });
    }

    inline void Queue(Sprite* s)
    {
        auto& a = State();
        Enqueue(a, s);
        FlushNextFrame(a);
    }

    // Every placed text drawn again: the device changed or lost its pixels.
    inline void RequeueAll(Atlas& a)
    {
        std::vector<Sprite*> placed;
        for (auto const& page : a.pages)
        {
            for (auto* s : page->sprites) placed.push_back(s);
        }
        for (auto* s : placed)
        {
            s->page = nullptr;
            s->shown = nullptr;
            Enqueue(a, s);
        }
        a.pages.clear();
        a.brushes.clear();
    }

    inline ID2D1SolidColorBrush* BrushFor(Atlas& a, ID2D1DeviceContext* context, uint32_t argb)
    {
        auto& slot = a.brushes[argb];
        if (!slot)
        {
            context->CreateSolidColorBrush(D2D1::ColorF(((argb >> 16) & 0xFF) / 255.0f, ((argb >> 8) & 0xFF) / 255.0f, (argb & 0xFF) / 255.0f,
                ((argb >> 24) & 0xFF) / 255.0f), slot.put());
        }
        return slot.get();
    }

    struct Placed
    {
        Sprite* sprite;
        int x;
        int y;
    };

    struct Region
    {
        Page* page;
        RECT rect;
        std::vector<Placed> items;
    };

    // Packs the batch into new surfaces sized to what they hold, in rows up to kPage wide.
    inline std::vector<Region> Pack(Atlas& a, mason_mask::Device& device, std::vector<Sprite*> batch)
    {
        // Tallest first keeps rows tight.
        std::stable_sort(batch.begin(), batch.end(), [](Sprite* l, Sprite* r) { return l->height > r->height; });
        std::vector<Region> regions;
        size_t i = 0;
        while (i < batch.size())
        {
            std::vector<Placed> items;
            int x = 0, y = 0, rowHeight = 0, right = 0;
            while (i < batch.size())
            {
                const int w = batch[i]->width + 2 * kGutter;
                const int h = batch[i]->height + 2 * kGutter;
                if (x > 0 && x + w > kPage)
                {
                    y += rowHeight;
                    x = 0;
                    rowHeight = 0;
                }
                if (y > 0 && y + h > kPage) break;
                items.push_back({ batch[i], x + kGutter, y + kGutter });
                x += w;
                rowHeight = (std::max)(rowHeight, h);
                right = (std::max)(right, x);
                ++i;
            }
            const int height = y + rowHeight;
            regions.push_back({ NewPage(a, device, right, height), RECT{ 0, 0, right, height }, std::move(items) });
        }
        return regions;
    }

    // Surfaces are never updated, so a slot stays taken after its text moves on. A large surface
    // left mostly empty gives its texts to this batch and goes.
    inline void CompactInto(Atlas& a)
    {
        for (auto const& page : a.pages)
        {
            const int64_t area = static_cast<int64_t>(page->width) * page->height;
            if (area < kCompactArea) continue;
            int64_t live = 0;
            for (auto* s : page->sprites) live += static_cast<int64_t>(s->width + 2 * kGutter) * (s->height + 2 * kGutter);
            if (live * 4 >= area) continue;
            for (auto* s : page->sprites) Enqueue(a, s);
        }
    }

    inline void Show(Atlas& a, Sprite* s, Page* page, int x, int y)
    {
        if (s->page != page) Detach(a, s);
        s->page = page;
        page->sprites.insert(s);
        s->x = x;
        s->y = y;
        if (!s->visual) return;
        if (!s->brush)
        {
            s->brush = mason_deco::ThreadCompositor().CreateSurfaceBrush();
            s->brush.Stretch(mucomp::CompositionStretch::None);
            s->brush.HorizontalAlignmentRatio(0.0f);
            s->brush.VerticalAlignmentRatio(0.0f);
            // Slots land on whole device pixels, so nearest keeps the glyphs exactly as drawn.
            s->brush.BitmapInterpolationMode(mucomp::CompositionBitmapInterpolationMode::NearestNeighbor);
            s->visual.Brush(s->brush);
        }
        if (s->shown != page)
        {
            s->brush.Surface(page->surface);
            s->shown = page;
        }
        // Page pixels map to device pixels; the visual's space is in DIPs.
        s->brush.Scale({ 1.0f / s->scale, 1.0f / s->scale });
        s->brush.Offset({ -x / s->scale, -y / s->scale });
    }


    inline std::vector<DWRITE_HIT_TEST_METRICS> RangeRects(IDWriteTextLayout* layout, uint32_t start, uint32_t length)
    {
        UINT32 count = 0;
        layout->HitTestTextRange(start, length, 0.0f, 0.0f, nullptr, 0, &count);
        std::vector<DWRITE_HIT_TEST_METRICS> rects(count);
        if (count == 0 || FAILED(layout->HitTestTextRange(start, length, 0.0f, 0.0f, rects.data(), count, &count))) return {};
        rects.resize(count);
        return rects;
    }

    inline std::vector<std::pair<float, float>> Baselines(IDWriteTextLayout* layout)
    {
        UINT32 count = 0;
        layout->GetLineMetrics(nullptr, 0, &count);
        std::vector<DWRITE_LINE_METRICS> lines(count);
        if (count == 0 || FAILED(layout->GetLineMetrics(lines.data(), count, &count))) return {};
        std::vector<std::pair<float, float>> out;
        float top = 0.0f;
        for (UINT32 i = 0; i < count; ++i)
        {
            out.emplace_back(top, top + lines[i].baseline);
            top += lines[i].height;
        }
        return out;
    }

    inline float BaselineAt(std::vector<std::pair<float, float>> const& lines, float top)
    {
        float baseline = lines.empty() ? top : lines.front().second;
        for (auto const& [lineTop, lineBaseline] : lines)
        {
            if (lineTop <= top + 0.5f) baseline = lineBaseline;
        }
        return baseline;
    }

    inline void DrawBackgrounds(Atlas& a, ID2D1DeviceContext* context, IDWriteTextLayout* layout, float ox, float oy, std::vector<mason_dwrite::Span> const& spans)
    {
        for (auto const& span : spans)
        {
            if ((span.background >> 24) == 0) continue;
            auto* brush = BrushFor(a, context, span.background);
            for (auto const& r : RangeRects(layout, span.start, span.length))
            {
                context->FillRectangle(D2D1::RectF(ox + r.left, oy + r.top, ox + r.left + r.width, oy + r.top + r.height), brush);
            }
        }
    }

    inline void DrawDecorations(Atlas& a, ID2D1DeviceContext* context, IDWriteTextLayout* layout, float ox, float oy, float scale,
        std::vector<mason_dwrite::Span> const& spans)
    {
        winrt::com_ptr<ID2D1Factory> factory;
        context->GetFactory(factory.put());
        const auto lines = Baselines(layout);
        for (auto const& span : spans)
        {
            if (!span.decoration) continue;
            auto* brush = BrushFor(a, context, span.decorationColor);
            const float t = span.decorationThickness > 0.0f ? span.decorationThickness : (std::max)(1.0f / scale, span.fontSize / 15.0f);
            winrt::com_ptr<ID2D1StrokeStyle> stroke;
            if (span.decorationStyle == 2 || span.decorationStyle == 3)
            {
                const bool dotted = span.decorationStyle == 2;
                const D2D1_CAP_STYLE cap = dotted ? D2D1_CAP_STYLE_ROUND : D2D1_CAP_STYLE_FLAT;
                const float dashes[] = { 3.0f, 2.0f };
                factory->CreateStrokeStyle(D2D1::StrokeStyleProperties(cap, cap, cap, D2D1_LINE_JOIN_MITER, 10.0f,
                    dotted ? D2D1_DASH_STYLE_DOT : D2D1_DASH_STYLE_CUSTOM, 0.0f), dotted ? nullptr : dashes, dotted ? 0 : 2, stroke.put());
            }
            for (auto const& r : RangeRects(layout, span.start, span.length))
            {
                const float baseline = oy + BaselineAt(lines, r.top);
                const float x0 = ox + r.left, x1 = ox + r.left + r.width;
                for (uint8_t flag : { uint8_t{ 1 }, uint8_t{ 2 }, uint8_t{ 4 } })
                {
                    if (!(span.decoration & flag)) continue;
                    const float y = flag == 1 ? baseline + (std::max)(t, span.fontSize * 0.1f)
                        : flag == 2 ? baseline - span.fontSize * 0.92f
                        : baseline - span.fontSize * 0.28f;
                    switch (span.decorationStyle)
                    {
                    case 1:
                        context->FillRectangle(D2D1::RectF(x0, y - t * 1.5f, x1, y - t * 0.5f), brush);
                        context->FillRectangle(D2D1::RectF(x0, y + t * 0.5f, x1, y + t * 1.5f), brush);
                        break;
                    case 2:
                    case 3:
                        context->DrawLine(D2D1::Point2F(x0, y), D2D1::Point2F(x1, y), brush, t, stroke.get());
                        break;
                    case 4:
                    {
                        winrt::com_ptr<ID2D1PathGeometry> wave;
                        winrt::com_ptr<ID2D1GeometrySink> sink;
                        if (FAILED(factory->CreatePathGeometry(wave.put())) || FAILED(wave->Open(sink.put()))) break;
                        const float half = (std::max)(t * 3.0f, 2.0f / scale);
                        const float amplitude = t * 1.5f;
                        sink->BeginFigure(D2D1::Point2F(x0, y), D2D1_FIGURE_BEGIN_HOLLOW);
                        bool up = true;
                        for (float x = x0; x < x1; x += half)
                        {
                            const float end = (std::min)(x + half, x1);
                            sink->AddQuadraticBezier(D2D1::QuadraticBezierSegment(D2D1::Point2F((x + end) * 0.5f, up ? y - amplitude * 2.0f : y + amplitude * 2.0f),
                                D2D1::Point2F(end, y)));
                            up = !up;
                        }
                        sink->EndFigure(D2D1_FIGURE_END_OPEN);
                        if (SUCCEEDED(sink->Close())) context->DrawGeometry(wave.get(), brush, t);
                        break;
                    }
                    default:
                        context->FillRectangle(D2D1::RectF(x0, y - t * 0.5f, x1, y + t * 0.5f), brush);
                        break;
                    }
                }
            }
        }
    }

    inline constexpr GUID kTextShadowBlur = { 0x1feb6d69, 0x2fe6, 0x4ac9, { 0x8c, 0x58, 0x1d, 0x7f, 0x93, 0xe7, 0xa6, 0xa5 } };

    inline void DrawShadows(Atlas& a, ID2D1DeviceContext* context, IDWriteTextLayout* layout, float ox, float oy, std::vector<mason_dwrite::Shadow> const& shadows)
    {
        for (auto it = shadows.rbegin(); it != shadows.rend(); ++it)
        {
            auto* brush = BrushFor(a, context, it->color);
            layout->SetDrawingEffect(brush, DWRITE_TEXT_RANGE{ 0, UINT32_MAX });
            if (it->blur <= 0.0f)
            {
                context->DrawTextLayout(D2D1::Point2F(ox + it->x, oy + it->y), layout, brush);
                continue;
            }
            winrt::com_ptr<ID2D1Device> device;
            context->GetDevice(device.put());
            winrt::com_ptr<ID2D1DeviceContext> recorder;
            winrt::com_ptr<ID2D1CommandList> list;
            if (!device || FAILED(device->CreateDeviceContext(D2D1_DEVICE_CONTEXT_OPTIONS_NONE, recorder.put()))
                || FAILED(recorder->CreateCommandList(list.put()))) continue;
            float dpiX = 96.0f, dpiY = 96.0f;
            context->GetDpi(&dpiX, &dpiY);
            recorder->SetDpi(dpiX, dpiY);
            recorder->SetTarget(list.get());
            recorder->BeginDraw();
            recorder->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE);
            recorder->DrawTextLayout(D2D1::Point2F(ox + it->x, oy + it->y), layout, brush);
            if (FAILED(recorder->EndDraw()) || FAILED(list->Close())) continue;
            winrt::com_ptr<ID2D1Effect> blur;
            if (FAILED(context->CreateEffect(kTextShadowBlur, blur.put()))) continue;
            blur->SetInput(0, list.get());
            blur->SetValue(D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION, it->blur * 0.5f);
            blur->SetValue(D2D1_GAUSSIANBLUR_PROP_BORDER_MODE, D2D1_BORDER_MODE_SOFT);
            context->DrawImage(blur.get());
        }
    }

    inline HRESULT Draw(Atlas& a, Region const& region)
    {
        auto interop = region.page->surface.as<mucomp::ICompositionDrawingSurfaceInterop>();
        winrt::com_ptr<ID2D1DeviceContext> context;
        POINT offset{};
        const HRESULT begun = interop->BeginDraw(&region.rect, __uuidof(ID2D1DeviceContext), context.put_void(), &offset);
        if (FAILED(begun)) return begun;
        const float w = static_cast<float>(region.rect.right - region.rect.left);
        const float h = static_cast<float>(region.rect.bottom - region.rect.top);
        context->SetDpi(96.0f, 96.0f);
        context->SetTransform(D2D1::Matrix3x2F::Identity());
        context->PushAxisAlignedClip(D2D1::RectF(static_cast<float>(offset.x), static_cast<float>(offset.y), offset.x + w, offset.y + h),
            D2D1_ANTIALIAS_MODE_ALIASED);
        context->Clear(D2D1::ColorF(0, 0, 0, 0));
        // WinUI draws text grayscale; ClearType can't blend over a transparent surface anyway.
        context->SetTextAntialiasMode(D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE);
        for (auto const& item : region.items)
        {
            Sprite* s = item.sprite;
            const float scale = s->scale;
            context->SetDpi(96.0f * scale, 96.0f * scale);
            const auto slot = D2D1::Matrix3x2F::Translation((offset.x + item.x - region.rect.left) / scale, (offset.y + item.y - region.rect.top) / scale);
            context->SetTransform(slot);
            IDWriteTextLayout* layout = s->layout.get();
            mason_dwrite::Configure(layout, s->wrapping, s->maxWidth);
            ID2D1SolidColorBrush* fill = BrushFor(a, context.get(), s->color);
            layout->SetDrawingEffect(fill, DWRITE_TEXT_RANGE{ 0, UINT32_MAX });
            for (auto const& [range, argb] : s->colors)
            {
                if (argb != s->color) layout->SetDrawingEffect(BrushFor(a, context.get(), argb), range);
            }
            if (s->vertical == 1)
            {
                context->SetTransform(D2D1::Matrix3x2F::Rotation(90.0f) * D2D1::Matrix3x2F::Translation(s->originX, s->originY) * slot);
                context->DrawTextLayout(D2D1::Point2F(0.0f, 0.0f), layout, fill, D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT);
            }
            else if (s->vertical == 2)
            {
                // Lines stack from the left with their glyphs still turned clockwise, so each is drawn on its own.
                for (auto const& line : mason_dwrite::LineBands(layout))
                {
                    context->SetTransform(slot);
                    context->PushAxisAlignedClip(D2D1::RectF(s->originX + line.top, -mason_dwrite::kUnbounded, s->originX + line.bottom, mason_dwrite::kUnbounded),
                        D2D1_ANTIALIAS_MODE_ALIASED);
                    context->SetTransform(D2D1::Matrix3x2F::Rotation(90.0f) * D2D1::Matrix3x2F::Translation(s->originX + line.top + line.bottom, s->originY) * slot);
                    context->DrawTextLayout(D2D1::Point2F(0.0f, 0.0f), layout, fill, D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT);
                    context->PopAxisAlignedClip();
                }
            }
            else
            {
                DrawBackgrounds(a, context.get(), layout, s->originX, s->originY, s->extras);
                if (!s->shadows.empty())
                {
                    DrawShadows(a, context.get(), layout, s->originX, s->originY, s->shadows);
                    layout->SetDrawingEffect(fill, DWRITE_TEXT_RANGE{ 0, UINT32_MAX });
                    for (auto const& [range, argb] : s->colors)
                    {
                        if (argb != s->color) layout->SetDrawingEffect(BrushFor(a, context.get(), argb), range);
                    }
                }
                context->DrawTextLayout(D2D1::Point2F(s->originX, s->originY), layout, fill, D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT);
                DrawDecorations(a, context.get(), layout, s->originX, s->originY, scale, s->extras);
            }
        }
        context->SetDpi(96.0f, 96.0f);
        context->SetTransform(D2D1::Matrix3x2F::Identity());
        context->PopAxisAlignedClip();
        return interop->EndDraw();
    }

    inline bool DeviceLost(HRESULT hr)
    {
        return hr == DXGI_ERROR_DEVICE_REMOVED || hr == DXGI_ERROR_DEVICE_RESET || hr == D2DERR_RECREATE_TARGET;
    }

    inline void Flush()
    {
        auto& a = State();
        if (a.hooked)
        {
            winrt::Microsoft::UI::Xaml::Media::CompositionTarget::Rendering(a.rendering);
            a.hooked = false;
        }
        if (a.pending.empty()) return;
        auto* device = DeviceNow();
        if (!device)
        {
            for (auto* s : a.pending) s->queued = false;
            a.pending.clear();
            return;
        }
        if (a.graphics != device->graphics)
        {
            if (a.graphics) RequeueAll(a);
            a.graphics = device->graphics;
            a.graphics.RenderingDeviceReplaced([](auto&&, auto&&)
            {
                auto& atlas = State();
                RequeueAll(atlas);
                FlushNextFrame(atlas);
            });
        }

        CompactInto(a);

        std::vector<Sprite*> batch = std::move(a.pending);
        a.pending.clear();
        for (auto* s : batch) s->queued = false;
        std::erase_if(batch, [&](Sprite* s)
        {
            if (s->layout && s->width > 0 && s->height > 0) return false;
            Detach(a, s);
            return true;
        });
        if (batch.empty()) return;

        auto regions = Pack(a, *device, batch);
        for (size_t r = 0; r < regions.size(); ++r)
        {
            const HRESULT hr = Draw(a, regions[r]);
            if (SUCCEEDED(hr))
            {
                for (auto const& item : regions[r].items) Show(a, item.sprite, regions[r].page, item.x, item.y);
                continue;
            }
            if (!DeviceLost(hr)) continue;
            // Everything is drawn again on the replacement device next frame.
            for (size_t k = r; k < regions.size(); ++k)
            {
                for (auto const& item : regions[k].items) Enqueue(a, item.sprite);
            }
            if (mason_mask::ReplaceRenderingDevice(*device)) RequeueAll(a);
            FlushNextFrame(a);
            return;
        }
    }
}
