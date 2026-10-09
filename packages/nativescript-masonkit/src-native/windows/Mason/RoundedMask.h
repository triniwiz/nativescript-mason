#pragma once
// Anti-aliased rounded-rect masks for Composition brushes. Composition doesn't anti-alias shapes it
// renders into a VisualSurface or a geometric clip, so the corners are drawn with Direct2D instead,
// into a small surface that a nine-grid brush stretches to any size.
#include <array>
#include <cmath>
#include <cstring>
#include <functional>
#include <string>
#include <unordered_map>
#include <vector>
#include <d2d1_1.h>
#include <d3d11_4.h>
#include <dxgi.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.Graphics.DirectX.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Microsoft.UI.Composition.Interop.h>
#include "BoxShape.h"

namespace mason_mask
{
    namespace mucomp = winrt::Microsoft::UI::Composition;

    struct Corner
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        float radius{ 0.0f };
    };

    // Opaque around a rounded hole: what may show of a box's outer shadow.
    struct Hole
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        float frame{ 0.0f };
        float radius{ 0.0f };
    };

    struct Painted
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        std::function<void(ID2D1DeviceContext*, float, float)> paint;
    };

    struct Device
    {
        mucomp::Compositor compositor{ nullptr };
        mucomp::CompositionGraphicsDevice graphics{ nullptr };
        // Keyed by the radius in quarter device pixels.
        std::unordered_map<int, Corner> corners;
        // Keyed by the frame and radius in quarter device pixels.
        std::unordered_map<int64_t, Hole> holes;
        std::unordered_map<std::string, Painted> painted;
        // The D3D device under the rendering device, watched for removal.
        winrt::com_ptr<ID3D11Device4> d3d;
        DWORD removedCookie{ 0 };
        // Owned by the wait on it; set to end that wait early.
        HANDLE removed{ nullptr };
        uint64_t generation{ 0 };
        winrt::Microsoft::UI::Dispatching::DispatcherQueue queue{ nullptr };
    };

    inline winrt::com_ptr<ID2D1Device> CreateD2DDevice(winrt::com_ptr<ID3D11Device>* d3dOut = nullptr)
    {
        winrt::com_ptr<ID3D11Device> d3d;
        const UINT flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
        if (FAILED(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, flags, nullptr, 0, D3D11_SDK_VERSION, d3d.put(), nullptr, nullptr))
            && FAILED(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_WARP, nullptr, flags, nullptr, 0, D3D11_SDK_VERSION, d3d.put(), nullptr, nullptr)))
        {
            return nullptr;
        }
        winrt::com_ptr<ID2D1Factory1> factory;
        if (FAILED(D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, __uuidof(ID2D1Factory1), factory.put_void()))) return nullptr;
        winrt::com_ptr<ID2D1Device> device;
        if (FAILED(factory->CreateDevice(d3d.as<IDXGIDevice>().get(), device.put()))) return nullptr;
        if (d3dOut) *d3dOut = d3d;
        return device;
    }

    // A white square of side 2r + 2 device pixels with anti-aliased corners of radius r.
    inline bool Draw(Corner const& corner)
    {
        auto interop = corner.surface.as<mucomp::ICompositionDrawingSurfaceInterop>();
        winrt::com_ptr<ID2D1DeviceContext> context;
        POINT offset{};
        if (FAILED(interop->BeginDraw(nullptr, __uuidof(ID2D1DeviceContext), context.put_void(), &offset))) return false;
        context->SetTransform(D2D1::Matrix3x2F::Translation(static_cast<float>(offset.x), static_cast<float>(offset.y)));
        context->Clear(D2D1::ColorF(0, 0, 0, 0));
        winrt::com_ptr<ID2D1SolidColorBrush> white;
        context->CreateSolidColorBrush(D2D1::ColorF(1, 1, 1, 1), white.put());
        const float side = corner.surface.Size().Width;
        context->FillRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(0, 0, side, side), corner.radius, corner.radius), white.get());
        return SUCCEEDED(interop->EndDraw());
    }

    inline bool Draw(Hole const& hole)
    {
        auto interop = hole.surface.as<mucomp::ICompositionDrawingSurfaceInterop>();
        winrt::com_ptr<ID2D1DeviceContext> context;
        POINT offset{};
        if (FAILED(interop->BeginDraw(nullptr, __uuidof(ID2D1DeviceContext), context.put_void(), &offset))) return false;
        context->SetTransform(D2D1::Matrix3x2F::Translation(static_cast<float>(offset.x), static_cast<float>(offset.y)));
        context->Clear(D2D1::ColorF(1, 1, 1, 1));
        context->SetPrimitiveBlend(D2D1_PRIMITIVE_BLEND_COPY);
        winrt::com_ptr<ID2D1SolidColorBrush> clear;
        context->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 0), clear.put());
        const float side = hole.surface.Size().Width;
        context->FillRoundedRectangle(
            D2D1::RoundedRect(D2D1::RectF(hole.frame, hole.frame, side - hole.frame, side - hole.frame), hole.radius, hole.radius), clear.get());
        context->SetPrimitiveBlend(D2D1_PRIMITIVE_BLEND_SOURCE_OVER);
        return SUCCEEDED(interop->EndDraw());
    }

    inline bool Draw(Painted const& p)
    {
        auto interop = p.surface.as<mucomp::ICompositionDrawingSurfaceInterop>();
        winrt::com_ptr<ID2D1DeviceContext> context;
        POINT offset{};
        if (FAILED(interop->BeginDraw(nullptr, __uuidof(ID2D1DeviceContext), context.put_void(), &offset))) return false;
        context->SetTransform(D2D1::Matrix3x2F::Translation(static_cast<float>(offset.x), static_cast<float>(offset.y)));
        context->Clear(D2D1::ColorF(0, 0, 0, 0));
        const auto size = p.surface.Size();
        p.paint(context.get(), size.Width, size.Height);
        return SUCCEEDED(interop->EndDraw());
    }

    inline void RedrawAll(Device& device)
    {
        for (auto const& [key, corner] : device.corners) Draw(corner);
        for (auto const& [key, hole] : device.holes) Draw(hole);
        for (auto const& [key, p] : device.painted) Draw(p);
    }

    inline bool ReplaceRenderingDevice(Device& device);

    inline winrt::fire_and_forget AwaitRemoval(Device* device, winrt::handle signal, uint64_t generation)
    {
        co_await winrt::resume_on_signal(signal.get());
        device->queue.TryEnqueue([device, generation]
        {
            if (device->generation == generation) ReplaceRenderingDevice(*device);
        });
    }

    // A TDR or a driver update removes the device while nothing draws; a failed draw would only
    // notice on the next change, leaving a still screen blank until then.
    inline void WatchRemoval(Device& device, winrt::com_ptr<ID3D11Device> const& d3d)
    {
        if (device.d3d)
        {
            device.d3d->UnregisterDeviceRemoved(device.removedCookie);
            SetEvent(device.removed);
        }
        device.d3d = nullptr;
        device.removed = nullptr;
        ++device.generation;
        if (!device.queue) device.queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
        auto d3d4 = d3d ? d3d.try_as<ID3D11Device4>() : nullptr;
        if (!d3d4 || !device.queue) return;
        winrt::handle signal{ CreateEventW(nullptr, TRUE, FALSE, nullptr) };
        if (!signal || FAILED(d3d4->RegisterDeviceRemovedEvent(signal.get(), &device.removedCookie))) return;
        device.d3d = d3d4;
        device.removed = signal.get();
        AwaitRemoval(&device, std::move(signal), device.generation);
    }

    // After a device loss the surfaces keep their identity but lose their pixels.
    inline bool ReplaceRenderingDevice(Device& device)
    {
        winrt::com_ptr<ID3D11Device> d3d;
        auto d2d = CreateD2DDevice(&d3d);
        if (!d2d) return false;
        auto interop = device.graphics.as<mucomp::ICompositionGraphicsDeviceInterop>();
        if (FAILED(interop->SetRenderingDevice(d2d.get()))) return false;
        // RenderingDeviceReplaced redraws the corners.
        WatchRemoval(device, d3d);
        return true;
    }

    inline Device* DeviceFor(mucomp::Compositor const& compositor)
    {
        // Never destroyed: releasing Composition objects after the thread's compositor shuts down crashes.
        thread_local Device* device = nullptr;
        if (device && device->compositor == compositor) return device;
        winrt::com_ptr<ID3D11Device> d3d;
        auto d2d = CreateD2DDevice(&d3d);
        if (!d2d) return nullptr;
        auto interop = compositor.try_as<mucomp::ICompositorInterop>();
        if (!interop) return nullptr;
        mucomp::ICompositionGraphicsDevice created{ nullptr };
        if (FAILED(interop->CreateGraphicsDevice(d2d.get(), &created)) || !created) return nullptr;
        if (!device) device = new Device();
        device->compositor = compositor;
        device->graphics = created.as<mucomp::CompositionGraphicsDevice>();
        device->corners.clear();
        device->holes.clear();
        device->painted.clear();
        Device* current = device;
        device->graphics.RenderingDeviceReplaced([current](auto&&, auto&&) { RedrawAll(*current); });
        WatchRemoval(*device, d3d);
        return device;
    }

    // Radii are drawn in quarter pixels, rounded down so a clamped radius never outgrows its box.
    inline int QuarterPixels(float radiusPx)
    {
        return static_cast<int>(std::floor(radiusPx * 4.0f));
    }

    inline mucomp::CompositionSurfaceBrush Corners(Device& device, float radiusPx)
    {
        const int key = QuarterPixels(radiusPx);
        if (auto it = device.corners.find(key); it != device.corners.end()) return it->second.brush;

        Corner corner;
        corner.radius = key / 4.0f;
        const float side = std::ceil(corner.radius) * 2.0f + 2.0f;
        corner.surface = device.graphics.CreateDrawingSurface({ side, side },
            winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
            winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
        if (!Draw(corner) && !(ReplaceRenderingDevice(device) && Draw(corner))) return nullptr;
        corner.brush = device.compositor.CreateSurfaceBrush(corner.surface);
        // The nine-grid stretches its source; a uniformly scaled source leaves a centered square.
        corner.brush.Stretch(mucomp::CompositionStretch::Fill);
        return device.corners.emplace(key, corner).first->second.brush;
    }

    // Nine-grid mask of radius `radius` DIPs; the corners keep their device pixels at `scale`.
    inline mucomp::CompositionBrush RoundedRect(mucomp::Compositor const& compositor, float radius, float scale)
    {
        auto* device = DeviceFor(compositor);
        if (!device) return nullptr;
        const float radiusPx = radius * scale;
        auto corners = Corners(*device, radiusPx);
        if (!corners) return nullptr;
        auto nine = compositor.CreateNineGridBrush();
        nine.Source(corners);
        // Exactly the drawn radius: any more and a circle's corners overlap and get squeezed.
        nine.SetInsets(QuarterPixels(radiusPx) / 4.0f);
        nine.SetInsetScales(1.0f / scale);
        return nine;
    }

    // Nine-grid mask for a box `frame` DIPs inside the brush's edges: opaque around the box, clear
    // inside it with corners of radius `radius` DIPs.
    inline mucomp::CompositionBrush RoundedHole(mucomp::Compositor const& compositor, float frame, float radius, float scale)
    {
        auto* device = DeviceFor(compositor);
        if (!device) return nullptr;
        const int frameQ = QuarterPixels(frame * scale);
        const int radiusQ = QuarterPixels(radius * scale);
        const int64_t key = (static_cast<int64_t>(frameQ) << 32) | static_cast<uint32_t>(radiusQ);
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        if (auto it = device->holes.find(key); it != device->holes.end())
        {
            brush = it->second.brush;
        }
        else
        {
            Hole hole;
            hole.frame = frameQ / 4.0f;
            hole.radius = radiusQ / 4.0f;
            const float side = (std::ceil(hole.frame) + std::ceil(hole.radius)) * 2.0f + 2.0f;
            hole.surface = device->graphics.CreateDrawingSurface({ side, side },
                winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
                winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
            if (!Draw(hole) && !(ReplaceRenderingDevice(*device) && Draw(hole))) return nullptr;
            hole.brush = compositor.CreateSurfaceBrush(hole.surface);
            hole.brush.Stretch(mucomp::CompositionStretch::Fill);
            brush = hole.brush;
            device->holes.emplace(key, hole);
        }
        auto nine = compositor.CreateNineGridBrush();
        nine.Source(brush);
        nine.SetInsets((frameQ + radiusQ) / 4.0f);
        nine.SetInsetScales(1.0f / scale);
        nine.IsCenterHollow(true);
        return nine;
    }

    template <typename T>
    inline std::string KeyOf(char kind, T const& value)
    {
        std::string key(1 + sizeof(T), '\0');
        key[0] = kind;
        std::memcpy(key.data() + 1, &value, sizeof(T));
        return key;
    }

    inline mucomp::CompositionSurfaceBrush PaintedBrush(Device& device, std::string const& key, float width, float height,
        std::function<void(ID2D1DeviceContext*, float, float)> paint)
    {
        if (auto it = device.painted.find(key); it != device.painted.end()) return it->second.brush;
        if (device.painted.size() > 1024) device.painted.clear();
        Painted p;
        p.paint = std::move(paint);
        p.surface = device.graphics.CreateDrawingSurface({ (std::max)(width, 1.0f), (std::max)(height, 1.0f) },
            winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
            winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
        if (!Draw(p) && !(ReplaceRenderingDevice(device) && Draw(p))) return nullptr;
        p.brush = device.compositor.CreateSurfaceBrush(p.surface);
        p.brush.Stretch(mucomp::CompositionStretch::Fill);
        return device.painted.emplace(key, std::move(p)).first->second.brush;
    }

    inline mason_shape::Radii DevicePixels(mason_shape::Radii const& radii, float scale)
    {
        mason_shape::Radii q;
        for (int i = 0; i < 4; ++i)
        {
            q.x[i] = QuarterPixels(radii.x[i] * scale) / 4.0f;
            q.y[i] = QuarterPixels(radii.y[i] * scale) / 4.0f;
        }
        return q;
    }

    struct Insets
    {
        float left{ 0.0f }, top{ 0.0f }, right{ 0.0f }, bottom{ 0.0f };
    };

    inline Insets InsetsFor(mason_shape::Radii const& q, std::array<float, 4> const& border = {})
    {
        using namespace mason_shape;
        Insets i;
        i.left = std::ceil((std::max)({ q.x[TopLeft], q.x[BottomLeft], border[0] }));
        i.top = std::ceil((std::max)({ q.y[TopLeft], q.y[TopRight], border[1] }));
        i.right = std::ceil((std::max)({ q.x[TopRight], q.x[BottomRight], border[2] }));
        i.bottom = std::ceil((std::max)({ q.y[BottomLeft], q.y[BottomRight], border[3] }));
        return i;
    }

    inline mucomp::CompositionNineGridBrush NineGrid(mucomp::Compositor const& compositor, mucomp::CompositionBrush const& source, Insets const& i, float scale)
    {
        auto nine = compositor.CreateNineGridBrush();
        nine.Source(source);
        nine.SetInsets(i.left, i.top, i.right, i.bottom);
        nine.SetInsetScales(1.0f / scale);
        return nine;
    }

    inline mucomp::CompositionBrush RoundedRect(mucomp::Compositor const& compositor, mason_shape::Radii const& radii, float scale)
    {
        if (radii.Circular()) return RoundedRect(compositor, radii.x[0], scale);
        auto* device = DeviceFor(compositor);
        if (!device) return nullptr;
        const auto q = DevicePixels(radii, scale);
        const Insets in = InsetsFor(q);
        auto brush = PaintedBrush(*device, KeyOf('m', q), in.left + in.right + 2.0f, in.top + in.bottom + 2.0f,
            [q](ID2D1DeviceContext* context, float w, float h)
            {
                winrt::com_ptr<ID2D1Factory> factory;
                context->GetFactory(factory.put());
                auto path = mason_shape::Path(factory.get(), D2D1::RectF(0, 0, w, h), q);
                winrt::com_ptr<ID2D1SolidColorBrush> white;
                context->CreateSolidColorBrush(D2D1::ColorF(1, 1, 1, 1), white.put());
                if (path) context->FillGeometry(path.get(), white.get());
            });
        if (!brush) return nullptr;
        return NineGrid(compositor, brush, in, scale);
    }

    struct Border
    {
        std::array<float, 4> width{};
        std::array<uint32_t, 4> color{};
        std::array<int8_t, 4> style{};
        mason_shape::Radii radii;

        bool Drawn(int side) const { return width[side] > 0.0f && (color[side] >> 24) != 0 && style[side] > 1; }
        bool Any() const { return Drawn(0) || Drawn(1) || Drawn(2) || Drawn(3); }

        bool Patterned() const
        {
            int8_t s = -1;
            for (int i = 0; i < 4; ++i)
            {
                if (!Drawn(i)) return false;
                if (s == -1) s = style[i];
                if (style[i] != s || width[i] != width[0] || color[i] != color[0]) return false;
            }
            return s == 2 || s == 3;
        }

        bool operator==(Border const&) const = default;
    };

    inline D2D1_COLOR_F Color(uint32_t argb, float shade = 1.0f)
    {
        return D2D1::ColorF(((argb >> 16) & 0xFF) / 255.0f * shade, ((argb >> 8) & 0xFF) / 255.0f * shade, (argb & 0xFF) / 255.0f * shade,
            ((argb >> 24) & 0xFF) / 255.0f);
    }

    inline winrt::com_ptr<ID2D1Geometry> Combine(ID2D1Factory* factory, ID2D1Geometry* a, ID2D1Geometry* b, D2D1_COMBINE_MODE mode)
    {
        winrt::com_ptr<ID2D1PathGeometry> out;
        if (!a || !b || FAILED(factory->CreatePathGeometry(out.put()))) return nullptr;
        winrt::com_ptr<ID2D1GeometrySink> sink;
        if (FAILED(out->Open(sink.put()))) return nullptr;
        if (FAILED(a->CombineWithGeometry(b, mode, nullptr, sink.get())) || FAILED(sink->Close())) return nullptr;
        return out.as<ID2D1Geometry>();
    }

    inline winrt::com_ptr<ID2D1Geometry> Polygon(ID2D1Factory* factory, std::initializer_list<D2D1_POINT_2F> points)
    {
        winrt::com_ptr<ID2D1PathGeometry> path;
        if (FAILED(factory->CreatePathGeometry(path.put()))) return nullptr;
        winrt::com_ptr<ID2D1GeometrySink> sink;
        if (FAILED(path->Open(sink.put()))) return nullptr;
        auto it = points.begin();
        sink->BeginFigure(*it, D2D1_FIGURE_BEGIN_FILLED);
        for (++it; it != points.end(); ++it) sink->AddLine(*it);
        sink->EndFigure(D2D1_FIGURE_END_CLOSED);
        if (FAILED(sink->Close())) return nullptr;
        return path.as<ID2D1Geometry>();
    }

    inline void PaintBorder(ID2D1DeviceContext* context, float w, float h, Border const& b)
    {
        winrt::com_ptr<ID2D1Factory> factory;
        context->GetFactory(factory.put());
        const float bl = b.width[0], bt = b.width[1], br = b.width[2], bb = b.width[3];
        auto edge = [&](float f) -> winrt::com_ptr<ID2D1Geometry>
        {
            auto radii = b.radii.Inset(bl * f, bt * f, br * f, bb * f);
            auto path = mason_shape::Path(factory.get(), D2D1::RectF(bl * f, bt * f, w - br * f, h - bb * f), radii);
            return path ? path.as<ID2D1Geometry>() : nullptr;
        };

        if (b.Patterned())
        {
            const bool dotted = b.style[0] == 2;
            winrt::com_ptr<ID2D1StrokeStyle> stroke;
            const D2D1_CAP_STYLE cap = dotted ? D2D1_CAP_STYLE_ROUND : D2D1_CAP_STYLE_FLAT;
            factory->CreateStrokeStyle(D2D1::StrokeStyleProperties(cap, cap, cap, D2D1_LINE_JOIN_ROUND, 10.0f,
                dotted ? D2D1_DASH_STYLE_DOT : D2D1_DASH_STYLE_DASH, 0.0f), nullptr, 0, stroke.put());
            auto middle = edge(0.5f);
            winrt::com_ptr<ID2D1SolidColorBrush> brush;
            context->CreateSolidColorBrush(Color(b.color[0]), brush.put());
            if (middle) context->DrawGeometry(middle.get(), brush.get(), bl, stroke.get());
            return;
        }

        bool allDouble = true;
        for (int i = 0; i < 4; ++i) if (b.Drawn(i) && b.style[i] != 5) allDouble = false;
        const std::vector<std::pair<float, float>> bands = allDouble
            ? std::vector<std::pair<float, float>>{ { 0.0f, 1.0f / 3.0f }, { 2.0f / 3.0f, 1.0f } }
            : std::vector<std::pair<float, float>>{ { 0.0f, 1.0f } };
        auto shade = [&](int side) -> float
        {
            const int8_t s = b.style[side];
            const bool topLeft = side == 0 || side == 1;
            if (s == 8 || s == 6) return topLeft ? 0.6f : 1.0f;
            if (s == 9 || s == 7) return topLeft ? 1.0f : 0.6f;
            return 1.0f;
        };
        bool oneColor = true;
        for (int i = 0; i < 4; ++i)
        {
            if (!b.Drawn(i) || b.color[i] != b.color[0] || shade(i) != 1.0f) oneColor = false;
        }
        const std::array<winrt::com_ptr<ID2D1Geometry>, 4> sides{
            Polygon(factory.get(), { { 0, 0 }, { bl, bt }, { bl, h - bb }, { 0, h } }),
            Polygon(factory.get(), { { 0, 0 }, { w, 0 }, { w - br, bt }, { bl, bt } }),
            Polygon(factory.get(), { { w, 0 }, { w, h }, { w - br, h - bb }, { w - br, bt } }),
            Polygon(factory.get(), { { 0, h }, { bl, h - bb }, { w - br, h - bb }, { w, h } }),
        };
        for (auto const& [from, to] : bands)
        {
            auto outer = edge(from);
            auto inner = edge(to);
            auto ring = Combine(factory.get(), outer.get(), inner.get(), D2D1_COMBINE_MODE_EXCLUDE);
            if (!ring) continue;
            if (oneColor)
            {
                winrt::com_ptr<ID2D1SolidColorBrush> brush;
                context->CreateSolidColorBrush(Color(b.color[0]), brush.put());
                context->FillGeometry(ring.get(), brush.get());
                continue;
            }
            for (int i = 0; i < 4; ++i)
            {
                if (!b.Drawn(i) || !sides[i]) continue;
                auto part = Combine(factory.get(), ring.get(), sides[i].get(), D2D1_COMBINE_MODE_INTERSECT);
                if (!part) continue;
                winrt::com_ptr<ID2D1SolidColorBrush> brush;
                context->CreateSolidColorBrush(Color(b.color[i], shade(i)), brush.put());
                context->FillGeometry(part.get(), brush.get());
            }
        }
    }

    inline mucomp::CompositionBrush BorderBrush(mucomp::Compositor const& compositor, Border const& dips, float width, float height, float scale)
    {
        auto* device = DeviceFor(compositor);
        if (!device) return nullptr;
        Border px = dips;
        for (int i = 0; i < 4; ++i) px.width[i] = QuarterPixels(dips.width[i] * scale) / 4.0f;
        px.radii = DevicePixels(dips.radii, scale);
        if (px.Patterned())
        {
            struct SizedKey { Border border; float w; float h; } key{ px, std::round(width * scale), std::round(height * scale) };
            return PaintedBrush(*device, KeyOf('d', key), key.w, key.h,
                [px](ID2D1DeviceContext* context, float w, float h) { PaintBorder(context, w, h, px); });
        }
        const Insets in = InsetsFor(px.radii, px.width);
        auto brush = PaintedBrush(*device, KeyOf('b', px), in.left + in.right + 2.0f, in.top + in.bottom + 2.0f,
            [px](ID2D1DeviceContext* context, float w, float h) { PaintBorder(context, w, h, px); });
        if (!brush) return nullptr;
        return NineGrid(compositor, brush, in, scale);
    }
}
