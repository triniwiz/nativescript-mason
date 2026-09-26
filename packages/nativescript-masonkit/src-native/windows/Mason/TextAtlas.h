#pragma once
// Text drawn by Direct2D into shared atlas pages. BeginDraw and EndDraw alone cost ~16 µs per
// surface, so the texts changed in a layout pass are packed into one fresh region of a page and
// drawn in a single BeginDraw; each text shows its slot through its own surface brush.
#include <algorithm>
#include <cmath>
#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <d2d1_1.h>
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

    constexpr int kPage = 2048;
    // Around each slot, so filtering at its edge never reaches a neighbour.
    constexpr int kGutter = 1;
    // Beyond this many pages the emptiest older one is redrawn into the newest and released.
    constexpr size_t kMaxPages = 3;

    struct Sprite;

    struct Page
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        int width{ kPage };
        int height{ kPage };
        // Rows fill downwards; the last one stays open for later batches that fit beside it.
        int bottom{ 0 };
        int rowTop{ 0 };
        int rowHeight{ 0 };
        int rowX{ kPage };
        // Holds one oversized text.
        bool dedicated{ false };
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
        // DIPs from the slot's top-left to the layout's origin.
        float originX{ 0.0f };
        float originY{ 0.0f };
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

    inline Page* CurrentPage(Atlas& a)
    {
        for (auto it = a.pages.rbegin(); it != a.pages.rend(); ++it)
        {
            if (!(*it)->dedicated) return it->get();
        }
        return nullptr;
    }

    inline Page* NewPage(Atlas& a, mason_mask::Device& device, int width, int height, bool dedicated)
    {
        auto page = std::make_unique<Page>();
        page->width = width;
        page->height = height;
        page->dedicated = dedicated;
        page->surface = device.graphics.CreateDrawingSurface2({ width, height },
            winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
            winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
        // A surface's first draw has to cover all of it; later ones can update a region.
        {
            auto interop = page->surface.as<mucomp::ICompositionDrawingSurfaceInterop>();
            winrt::com_ptr<ID2D1DeviceContext> context;
            POINT offset{};
            if (SUCCEEDED(interop->BeginDraw(nullptr, __uuidof(ID2D1DeviceContext), context.put_void(), &offset)))
            {
                context->Clear(D2D1::ColorF(0, 0, 0, 0));
                interop->EndDraw();
            }
        }
        Page* raw = page.get();
        // Dedicated pages go first so the newest shared page stays last.
        if (dedicated) a.pages.insert(a.pages.begin(), std::move(page));
        else a.pages.push_back(std::move(page));
        return raw;
    }

    inline void ReleasePageIfUnused(Atlas& a, Page* page)
    {
        if (!page || !page->sprites.empty() || (!page->dedicated && page == CurrentPage(a))) return;
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

    // Packs the batch into fresh space: the open row when all of it fits there, otherwise new rows
    // below every existing one, then new pages.
    inline std::vector<Region> Pack(Atlas& a, mason_mask::Device& device, std::vector<Sprite*> const& batch)
    {
        std::vector<Region> regions;
        std::vector<Sprite*> shared;
        for (auto* s : batch)
        {
            const int w = s->width + 2 * kGutter;
            const int h = s->height + 2 * kGutter;
            if (w <= kPage && h <= kPage)
            {
                shared.push_back(s);
                continue;
            }
            Page* page = NewPage(a, device, w, h, true);
            regions.push_back({ page, RECT{ 0, 0, w, h }, { { s, kGutter, kGutter } } });
        }
        // Tallest first keeps rows tight.
        std::stable_sort(shared.begin(), shared.end(), [](Sprite* l, Sprite* r) { return l->height > r->height; });

        size_t i = 0;
        while (i < shared.size())
        {
            Page* page = CurrentPage(a);
            if (!page) page = NewPage(a, device, kPage, kPage, false);

            int rowWidth = 0;
            int rowHeight = 0;
            for (size_t k = i; k < shared.size(); ++k)
            {
                rowWidth += shared[k]->width + 2 * kGutter;
                rowHeight = (std::max)(rowHeight, shared[k]->height + 2 * kGutter);
            }
            if (rowHeight <= page->rowHeight && page->rowX + rowWidth <= page->width)
            {
                Region region{ page, RECT{ page->rowX, page->rowTop, page->rowX + rowWidth, page->rowTop + rowHeight }, {} };
                int x = page->rowX;
                for (; i < shared.size(); ++i)
                {
                    region.items.push_back({ shared[i], x + kGutter, page->rowTop + kGutter });
                    x += shared[i]->width + 2 * kGutter;
                }
                page->rowX = x;
                regions.push_back(std::move(region));
                break;
            }

            const int top = page->bottom;
            int x = 0;
            int y = top;
            int height = 0;
            int right = 0;
            Region region{ page, RECT{}, {} };
            while (i < shared.size())
            {
                const int w = shared[i]->width + 2 * kGutter;
                const int h = shared[i]->height + 2 * kGutter;
                if (x + w > page->width)
                {
                    y += height;
                    x = 0;
                    height = 0;
                }
                if (y + h > page->height) break;
                region.items.push_back({ shared[i], x + kGutter, y + kGutter });
                x += w;
                height = (std::max)(height, h);
                right = (std::max)(right, x);
                ++i;
            }
            if (!region.items.empty())
            {
                region.rect = RECT{ 0, top, right, y + height };
                page->bottom = y + height;
                page->rowTop = y;
                page->rowHeight = height;
                page->rowX = x;
                regions.push_back(std::move(region));
            }
            if (i < shared.size()) NewPage(a, device, kPage, kPage, false);
        }
        return regions;
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
            context->SetTransform(D2D1::Matrix3x2F::Translation((offset.x + item.x - region.rect.left) / scale, (offset.y + item.y - region.rect.top) / scale));
            IDWriteTextLayout* layout = s->layout.get();
            mason_dwrite::Configure(layout, s->wrapping, s->maxWidth);
            ID2D1SolidColorBrush* fill = BrushFor(a, context.get(), s->color);
            layout->SetDrawingEffect(fill, DWRITE_TEXT_RANGE{ 0, UINT32_MAX });
            for (auto const& [range, argb] : s->colors)
            {
                if (argb != s->color) layout->SetDrawingEffect(BrushFor(a, context.get(), argb), range);
            }
            context->DrawTextLayout(D2D1::Point2F(s->originX, s->originY), layout, fill, D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT);
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

        if (a.pages.size() > kMaxPages)
        {
            // The emptiest older page's texts move into this batch; the page goes once they have.
            Page* current = CurrentPage(a);
            Page* emptiest = nullptr;
            for (auto const& page : a.pages)
            {
                if (page.get() != current && (!emptiest || page->sprites.size() < emptiest->sprites.size())) emptiest = page.get();
            }
            if (emptiest)
            {
                std::vector<Sprite*> moving(emptiest->sprites.begin(), emptiest->sprites.end());
                for (auto* s : moving) Enqueue(a, s);
            }
        }

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
