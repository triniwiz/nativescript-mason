#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <d2d1_1.h>
#include <windows.graphics.interop.h>
#include <winrt/Windows.Graphics.h>
#include <winrt/Microsoft.UI.Composition.h>

namespace mason_shape
{
    namespace mucomp = winrt::Microsoft::UI::Composition;

    enum Corner : int { TopLeft = 0, TopRight = 1, BottomRight = 2, BottomLeft = 3 };

    struct Radii
    {
        std::array<float, 4> x{};
        std::array<float, 4> y{};
        std::array<float, 4> k{ 1.0f, 1.0f, 1.0f, 1.0f };

        bool Any() const
        {
            for (int i = 0; i < 4; ++i) if (x[i] > 0.0f && y[i] > 0.0f) return true;
            return false;
        }

        bool Same() const
        {
            for (int i = 1; i < 4; ++i) if (x[i] != x[0] || y[i] != y[0]) return false;
            return Round();
        }

        bool Round() const
        {
            for (float v : k) if (v != 1.0f) return false;
            return true;
        }

        bool Circular() const { return Same() && x[0] == y[0]; }

        Radii Scaled(float s) const
        {
            Radii r = *this;
            for (int i = 0; i < 4; ++i) { r.x[i] *= s; r.y[i] *= s; }
            return r;
        }

        Radii Inset(float left, float top, float right, float bottom) const
        {
            Radii r;
            r.k = k;
            r.x[TopLeft] = (std::max)(0.0f, x[TopLeft] - left);
            r.y[TopLeft] = (std::max)(0.0f, y[TopLeft] - top);
            r.x[TopRight] = (std::max)(0.0f, x[TopRight] - right);
            r.y[TopRight] = (std::max)(0.0f, y[TopRight] - top);
            r.x[BottomRight] = (std::max)(0.0f, x[BottomRight] - right);
            r.y[BottomRight] = (std::max)(0.0f, y[BottomRight] - bottom);
            r.x[BottomLeft] = (std::max)(0.0f, x[BottomLeft] - left);
            r.y[BottomLeft] = (std::max)(0.0f, y[BottomLeft] - bottom);
            return r;
        }

        bool operator==(Radii const&) const = default;
    };

    inline Radii Read(const uint8_t* data, uint32_t size, float width, float height)
    {
        Radii r;
        if (!data || size < 258) return r;
        for (int i = 0; i < 4; ++i)
        {
            float vx = 0.0f, vy = 0.0f;
            std::memcpy(&vx, data + 226 + i * 8, 4);
            std::memcpy(&vy, data + 230 + i * 8, 4);
            const bool px = data[218 + i * 2] == 1;
            const bool py = data[219 + i * 2] == 1;
            r.x[i] = (std::max)(0.0f, px ? vx * width : vx);
            r.y[i] = (std::max)(0.0f, py ? vy * height : vy);
            if (size >= 274)
            {
                float k = 1.0f;
                std::memcpy(&k, data + 258 + i * 4, 4);
                if (!std::isnan(k)) r.k[i] = k;
            }
        }
        float f = 1.0f;
        auto limit = [&](float a, float b, float side)
        {
            if (a + b > side && a + b > 0.0f) f = (std::min)(f, side / (a + b));
        };
        limit(r.x[TopLeft], r.x[TopRight], width);
        limit(r.x[BottomLeft], r.x[BottomRight], width);
        limit(r.y[TopLeft], r.y[BottomLeft], height);
        limit(r.y[TopRight], r.y[BottomRight], height);
        return f < 1.0f ? r.Scaled(f) : r;
    }

    inline winrt::com_ptr<ID2D1PathGeometry> Path(ID2D1Factory* factory, D2D1_RECT_F rect, Radii const& r)
    {
        winrt::com_ptr<ID2D1PathGeometry> path;
        if (!factory || FAILED(factory->CreatePathGeometry(path.put()))) return nullptr;
        winrt::com_ptr<ID2D1GeometrySink> sink;
        if (FAILED(path->Open(sink.put()))) return nullptr;
        const float l = rect.left, t = rect.top, rt = rect.right, b = rect.bottom;
        auto arc = [&](int corner, float x, float y, float rx, float ry)
        {
            if (rx <= 0.0f || ry <= 0.0f)
            {
                sink->AddLine(D2D1::Point2F(x, y));
                return;
            }
            const float k = r.k[corner];
            if (k == 1.0f)
            {
                sink->AddArc(D2D1::ArcSegment(D2D1::Point2F(x, y), D2D1::SizeF(rx, ry), 0.0f, D2D1_SWEEP_DIRECTION_CLOCKWISE, D2D1_ARC_SIZE_SMALL));
                return;
            }
            const float power = std::pow(2.0f, 1.0f - std::abs(k));
            constexpr int kSteps = 32;
            for (int i = 1; i <= kSteps; ++i)
            {
                const float angle = static_cast<float>(i) / kSteps * 1.57079633f;
                const float u = std::pow((std::max)(0.0f, std::cos(angle)), power);
                const float v = std::pow((std::max)(0.0f, std::sin(angle)), power);
                const float cx = k < 0.0f ? 1.0f - v : u;
                const float cy = k < 0.0f ? 1.0f - u : v;
                float px = x, py = y;
                switch (corner)
                {
                case TopRight: px = rt - rx * (1.0f - cy); py = t + ry * (1.0f - cx); break;
                case BottomRight: px = rt - rx * (1.0f - cx); py = b - ry * (1.0f - cy); break;
                case BottomLeft: px = l + rx * (1.0f - cy); py = b - ry * (1.0f - cx); break;
                case TopLeft: px = l + rx * (1.0f - cx); py = t + ry * (1.0f - cy); break;
                }
                sink->AddLine(D2D1::Point2F(i == kSteps ? x : px, i == kSteps ? y : py));
            }
        };
        const bool tl = r.x[TopLeft] > 0.0f && r.y[TopLeft] > 0.0f;
        const bool tr = r.x[TopRight] > 0.0f && r.y[TopRight] > 0.0f;
        const bool br = r.x[BottomRight] > 0.0f && r.y[BottomRight] > 0.0f;
        const bool bl = r.x[BottomLeft] > 0.0f && r.y[BottomLeft] > 0.0f;
        sink->BeginFigure(D2D1::Point2F(l + (tl ? r.x[TopLeft] : 0.0f), t), D2D1_FIGURE_BEGIN_FILLED);
        sink->AddLine(D2D1::Point2F(rt - (tr ? r.x[TopRight] : 0.0f), t));
        if (tr) arc(TopRight, rt, t + r.y[TopRight], r.x[TopRight], r.y[TopRight]);
        sink->AddLine(D2D1::Point2F(rt, b - (br ? r.y[BottomRight] : 0.0f)));
        if (br) arc(BottomRight, rt - r.x[BottomRight], b, r.x[BottomRight], r.y[BottomRight]);
        sink->AddLine(D2D1::Point2F(l + (bl ? r.x[BottomLeft] : 0.0f), b));
        if (bl) arc(BottomLeft, l, b - r.y[BottomLeft], r.x[BottomLeft], r.y[BottomLeft]);
        sink->AddLine(D2D1::Point2F(l, t + (tl ? r.y[TopLeft] : 0.0f)));
        if (tl) arc(TopLeft, l + r.x[TopLeft], t, r.x[TopLeft], r.y[TopLeft]);
        sink->EndFigure(D2D1_FIGURE_END_CLOSED);
        if (FAILED(sink->Close())) return nullptr;
        return path;
    }

    inline ID2D1Factory1* Factory()
    {
        static winrt::com_ptr<ID2D1Factory1> factory = []
        {
            winrt::com_ptr<ID2D1Factory1> f;
            D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, __uuidof(ID2D1Factory1), f.put_void());
            return f;
        }();
        return factory.get();
    }

    struct GeometrySource : winrt::implements<GeometrySource, winrt::Windows::Graphics::IGeometrySource2D, ABI::Windows::Graphics::IGeometrySource2DInterop>
    {
        explicit GeometrySource(winrt::com_ptr<ID2D1Geometry> geometry) : m_geometry(std::move(geometry)) {}

        HRESULT __stdcall GetGeometry(ID2D1Geometry** value) override
        {
            m_geometry.copy_to(value);
            return S_OK;
        }

        HRESULT __stdcall TryGetGeometryUsingFactory(ID2D1Factory*, ID2D1Geometry** value) override
        {
            *value = nullptr;
            return E_NOTIMPL;
        }

        winrt::com_ptr<ID2D1Geometry> m_geometry;
    };

    inline mucomp::CompositionGeometry Geometry(mucomp::Compositor const& comp, float width, float height, Radii const& r)
    {
        if (r.Same())
        {
            auto geo = comp.CreateRoundedRectangleGeometry();
            geo.Size({ width, height });
            geo.CornerRadius({ r.x[0], r.y[0] });
            return geo;
        }
        auto path = Path(Factory(), D2D1::RectF(0.0f, 0.0f, width, height), r);
        if (!path) return nullptr;
        auto source = winrt::make<GeometrySource>(path.as<ID2D1Geometry>());
        return comp.CreatePathGeometry(mucomp::CompositionPath(source));
    }
}
