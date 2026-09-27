#pragma once
// Anti-aliased rounded-rect masks for Composition brushes. Composition doesn't anti-alias shapes it
// renders into a VisualSurface or a geometric clip, so the corners are drawn with Direct2D instead,
// into a small surface that a nine-grid brush stretches to any size.
#include <cmath>
#include <unordered_map>
#include <d2d1_1.h>
#include <d3d11_4.h>
#include <dxgi.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.Graphics.DirectX.h>
#include <winrt/Microsoft.UI.Composition.h>
#include <winrt/Microsoft.UI.Composition.Interop.h>

namespace mason_mask
{
    namespace mucomp = winrt::Microsoft::UI::Composition;

    struct Corner
    {
        mucomp::CompositionDrawingSurface surface{ nullptr };
        mucomp::CompositionSurfaceBrush brush{ nullptr };
        float radius{ 0.0f };
    };

    struct Device
    {
        mucomp::Compositor compositor{ nullptr };
        mucomp::CompositionGraphicsDevice graphics{ nullptr };
        // Keyed by the radius in quarter device pixels.
        std::unordered_map<int, Corner> corners;
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

    inline void RedrawAll(Device& device)
    {
        for (auto const& [key, corner] : device.corners) Draw(corner);
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
}
