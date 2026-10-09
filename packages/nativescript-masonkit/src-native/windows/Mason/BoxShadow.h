#pragma once
#include <cmath>
#include <cstdint>
#include <cwchar>
#include <string>
#include <unordered_map>
#include <vector>
#include <d2d1_1.h>
#include <d2d1effects.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Composition.h>
#include "BoxShape.h"
#include "Decoration.h"
#include "RoundedMask.h"

namespace mason_shadow
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace mucomp = winrt::Microsoft::UI::Composition;

    struct Shadow
    {
        float inset{ 0.0f };
        float x{ 0.0f };
        float y{ 0.0f };
        float blur{ 0.0f };
        float spread{ 0.0f };
        uint32_t argb{ 0 };
        bool operator==(Shadow const&) const = default;
    };

    struct Entry
    {
        winrt::weak_ref<mux::UIElement> element;
        std::vector<Shadow> shadows;
        uint64_t version{ 0 };
    };

    inline std::unordered_map<void*, Entry>& Registry()
    {
        thread_local auto* registry = new std::unordered_map<void*, Entry>();
        return *registry;
    }

    inline void* KeyOf(mux::UIElement const& element)
    {
        return element ? winrt::get_abi(element.as<winrt::Windows::Foundation::IUnknown>()) : nullptr;
    }

    inline Entry* Find(mux::UIElement const& element)
    {
        auto& registry = Registry();
        auto it = registry.find(KeyOf(element));
        if (it == registry.end()) return nullptr;
        if (it->second.element.get() != element)
        {
            registry.erase(it);
            return nullptr;
        }
        return &it->second;
    }

    inline uint64_t Version(mux::UIElement const& element)
    {
        auto* entry = Registry().empty() ? nullptr : Find(element);
        return entry ? entry->version : 0;
    }

    inline void Set(mux::UIElement const& element, std::wstring_view spec)
    {
        static uint64_t next = 1;
        std::vector<Shadow> shadows;
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t end = spec.find(L';', pos);
            if (end == std::wstring_view::npos) end = spec.size();
            const std::wstring part(spec.substr(pos, end - pos));
            Shadow s;
            double argb = 0.0;
            if (swscanf_s(part.c_str(), L"%f,%f,%f,%f,%f,%lf", &s.inset, &s.x, &s.y, &s.blur, &s.spread, &argb) == 6)
            {
                s.argb = static_cast<uint32_t>(argb);
                if ((s.argb >> 24) != 0) shadows.push_back(s);
            }
            pos = end + 1;
        }
        auto& registry = Registry();
        if (shadows.empty())
        {
            if (auto* entry = Find(element)) entry->shadows.clear(), entry->version = next++;
            return;
        }
        auto& entry = registry[KeyOf(element)];
        entry.element = winrt::make_weak(element);
        entry.shadows = std::move(shadows);
        entry.version = next++;
        if (registry.size() > 2048)
        {
            std::erase_if(registry, [](auto const& kv) { return !kv.second.element.get(); });
        }
    }

    inline constexpr GUID kGaussianBlur = { 0x1feb6d69, 0x2fe6, 0x4ac9, { 0x8c, 0x58, 0x1d, 0x7f, 0x93, 0xe7, 0xa6, 0xa5 } };

    struct Painted
    {
        mucomp::CompositionBrush brush{ nullptr };
        float left{ 0.0f }, top{ 0.0f }, right{ 0.0f }, bottom{ 0.0f };
        bool sized{ false };
    };

    inline Painted Paint(mucomp::Compositor const& compositor, Shadow const& dips, mason_shape::Radii const& boxRadii, float scale,
        float boxWidth, float boxHeight)
    {
        Painted out;
        auto* device = mason_mask::DeviceFor(compositor);
        if (!device) return out;
        Shadow s = dips;
        s.x = std::round(dips.x * scale);
        s.y = std::round(dips.y * scale);
        s.blur = std::round(dips.blur * scale);
        s.spread = std::round(dips.spread * scale);
        const auto r = mason_mask::DevicePixels(boxRadii, scale);
        float rmax = 0.0f;
        for (int i = 0; i < 4; ++i) rmax = (std::max)({ rmax, r.x[i], r.y[i] });
        const float reach = std::ceil(s.blur * 1.5f);
        const float spread = std::abs(s.spread);
        float w = 2.0f * (rmax + spread + reach + std::abs(s.x)) + 1.0f;
        float h = 2.0f * (rmax + spread + reach + std::abs(s.y)) + 1.0f;
        const float boxW = std::round(boxWidth * scale);
        const float boxH = std::round(boxHeight * scale);
        const bool sized = boxW < w || boxH < h;
        if (sized)
        {
            w = boxW;
            h = boxH;
        }
        const bool inset = s.inset != 0.0f;
        float minX = 0.0f, minY = 0.0f, maxX = w, maxY = h;
        if (!inset)
        {
            minX = (std::min)(0.0f, s.x - s.spread - reach);
            minY = (std::min)(0.0f, s.y - s.spread - reach);
            maxX = (std::max)(w, w + s.x + s.spread + reach);
            maxY = (std::max)(h, h + s.y + s.spread + reach);
        }
        auto grown = [&](float by)
        {
            mason_shape::Radii g;
            for (int i = 0; i < 4; ++i)
            {
                g.x[i] = r.x[i] > 0.0f ? (std::max)(0.0f, r.x[i] + by) : 0.0f;
                g.y[i] = r.y[i] > 0.0f ? (std::max)(0.0f, r.y[i] + by) : 0.0f;
            }
            return g;
        };
        struct Key { Shadow s; mason_shape::Radii r; float w; float h; } key{ s, r, sized ? w : 0.0f, sized ? h : 0.0f };
        const float sigma = s.blur * 0.5f;
        auto brush = mason_mask::PaintedBrush(*device, mason_mask::KeyOf('h', key), maxX - minX, maxY - minY,
            [s, r, w, h, minX, minY, inset, sigma, grown](ID2D1DeviceContext* context, float sw, float sh)
            {
                winrt::com_ptr<ID2D1Factory> factory;
                context->GetFactory(factory.put());
                D2D1_MATRIX_3X2_F base{};
                context->GetTransform(&base);
                const auto origin = D2D1::Matrix3x2F::Translation(-minX, -minY) * base;
                const float by = inset ? -s.spread : s.spread;
                const auto caster = mason_shape::Path(factory.get(),
                    D2D1::RectF(s.x - by, s.y - by, w + s.x + by, h + s.y + by), grown(by));
                const auto box = mason_shape::Path(factory.get(), D2D1::RectF(0, 0, w, h), r);
                if (!caster || !box) return;

                winrt::com_ptr<ID2D1Device> device;
                context->GetDevice(device.put());
                winrt::com_ptr<ID2D1DeviceContext> offscreen;
                if (!device || FAILED(device->CreateDeviceContext(D2D1_DEVICE_CONTEXT_OPTIONS_NONE, offscreen.put()))) return;
                winrt::com_ptr<ID2D1Bitmap1> bitmap;
                const auto props = D2D1::BitmapProperties1(D2D1_BITMAP_OPTIONS_TARGET,
                    D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED));
                if (FAILED(offscreen->CreateBitmap(D2D1::SizeU(static_cast<UINT32>(sw), static_cast<UINT32>(sh)), nullptr, 0, props, bitmap.put()))) return;
                offscreen->SetTarget(bitmap.get());
                offscreen->BeginDraw();
                offscreen->SetTransform(D2D1::Matrix3x2F::Translation(-minX, -minY));
                offscreen->Clear(D2D1::ColorF(0, 0, 0, 0));
                winrt::com_ptr<ID2D1SolidColorBrush> paint;
                offscreen->CreateSolidColorBrush(inset ? D2D1::ColorF(0, 0, 0, 1) : mason_mask::Color(s.argb), paint.put());
                offscreen->FillGeometry(caster.get(), paint.get());
                if (FAILED(offscreen->EndDraw())) return;
                offscreen->SetTarget(nullptr);

                winrt::com_ptr<ID2D1Effect> blur;
                if (FAILED(context->CreateEffect(kGaussianBlur, blur.put()))) return;
                blur->SetInput(0, bitmap.get());
                blur->SetValue(D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION, (std::max)(sigma, 0.0f));
                blur->SetValue(D2D1_GAUSSIANBLUR_PROP_BORDER_MODE, D2D1_BORDER_MODE_SOFT);

                context->SetTransform(base);
                if (inset)
                {
                    context->SetTransform(origin);
                    context->PushLayer(D2D1::LayerParameters(D2D1::InfiniteRect(), box.get()), nullptr);
                    winrt::com_ptr<ID2D1SolidColorBrush> color;
                    context->CreateSolidColorBrush(mason_mask::Color(s.argb), color.put());
                    context->FillRectangle(D2D1::RectF(0, 0, w, h), color.get());
                    context->SetTransform(base);
                    context->DrawImage(blur.get(), D2D1_INTERPOLATION_MODE_LINEAR, D2D1_COMPOSITE_MODE_DESTINATION_OUT);
                    context->SetTransform(origin);
                    context->PopLayer();
                    context->SetTransform(base);
                    return;
                }
                context->DrawImage(blur.get());
                context->SetTransform(origin);
                context->SetPrimitiveBlend(D2D1_PRIMITIVE_BLEND_COPY);
                winrt::com_ptr<ID2D1SolidColorBrush> clear;
                context->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 0), clear.put());
                context->FillGeometry(box.get(), clear.get());
                context->SetPrimitiveBlend(D2D1_PRIMITIVE_BLEND_SOURCE_OVER);
                context->SetTransform(base);
            });
        if (!brush) return out;
        out.left = -minX / scale;
        out.top = -minY / scale;
        out.right = (maxX - w) / scale;
        out.bottom = (maxY - h) / scale;
        out.sized = sized;
        if (sized)
        {
            out.brush = brush;
            return out;
        }
        const float midX = std::floor(w / 2.0f), midY = std::floor(h / 2.0f);
        mason_mask::Insets in;
        in.left = midX - minX;
        in.top = midY - minY;
        in.right = maxX - (midX + 1.0f);
        in.bottom = maxY - (midY + 1.0f);
        out.brush = mason_mask::NineGrid(compositor, brush, in, scale);
        return out;
    }

    struct State
    {
        mucomp::ContainerVisual layer{ nullptr };
        std::vector<std::pair<mucomp::SpriteVisual, Painted>> sprites;
        std::string key;
        bool sized{ false };
    };

    inline void Sync(mux::UIElement const& element, float width, float height, mason_shape::Radii const& radii, float scale, State& state)
    {
        auto* entry = Registry().empty() ? nullptr : Find(element);
        if (!entry || entry->shadows.empty() || width <= 0.0f || height <= 0.0f)
        {
            if (state.layer) mason_deco::SetLayer(element, L"mason-shadow", nullptr);
            state = {};
            return;
        }
        auto comp = mason_deco::CompositorFor(element);
        if (!comp) return;
        struct Key { mason_shape::Radii r; float scale; } k{ radii, scale };
        std::string key = mason_mask::KeyOf('S', k);
        if (state.sized)
        {
            struct Size { float w; float h; } size{ width, height };
            key += mason_mask::KeyOf('z', size);
        }
        for (auto const& s : entry->shadows) key += mason_mask::KeyOf('s', s);
        if (key != state.key)
        {
            state.sprites.clear();
            if (!state.layer)
            {
                state.layer = comp.CreateContainerVisual();
                mason_deco::SetLayer(element, L"mason-shadow", state.layer);
            }
            state.layer.Children().RemoveAll();
            state.sized = false;
            for (auto const& s : entry->shadows)
            {
                Painted p = Paint(comp, s, radii, scale, width, height);
                if (!p.brush) continue;
                state.sized = state.sized || p.sized;
                auto sprite = comp.CreateSpriteVisual();
                sprite.Brush(p.brush);
                state.layer.Children().InsertAtBottom(sprite);
                state.sprites.emplace_back(sprite, p);
            }
            if (state.sized)
            {
                struct Size { float w; float h; } size{ width, height };
                key += mason_mask::KeyOf('z', size);
            }
            state.key = std::move(key);
        }
        for (auto& [sprite, p] : state.sprites)
        {
            sprite.Offset({ -p.left, -p.top, 0.0f });
            sprite.Size({ width + p.left + p.right, height + p.top + p.bottom });
        }
    }
}
