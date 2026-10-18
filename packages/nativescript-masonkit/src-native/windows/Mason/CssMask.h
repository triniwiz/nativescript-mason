#pragma once
// CSS masking on Windows: mask-* layers, clip-path, mask-border and border-image.
//
// The .windows.ts layer resolves units, colours and gradients into a JSON spec (see windows-mask.ts)
// and Css::SetMask / Css::SetBorderImage decode its images. Everything is drawn with Direct2D in
// device pixels:
//   - The mask (layers, then clip-path and mask-border intersected with them) is an alpha surface.
//     FilterEffects shows the element through a CompositionMaskBrush over it, on the same sprite
//     that carries `filter`.
//   - border-image is a painted surface in the element's decoration layer, in place of its border.
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cctype>
#include <cstdio>
#include <cstring>
#include <string_view>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>
#include <d2d1_3.h>
#include <d2d1svg.h>
#include <d2d1effects.h>
#include <shlwapi.h>
#include <winrt/Windows.Data.Json.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Composition.h>
#include "RoundedMask.h"
#include "Decoration.h"

namespace mason_cssmask
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace mucomp = winrt::Microsoft::UI::Composition;
    namespace wf = winrt::Windows::Foundation;
    namespace json = winrt::Windows::Data::Json;

    // px plus a percentage of whatever the value is resolved against.
    struct Len
    {
        float px{ 0.0f };
        float pct{ 0.0f };
        float Of(float reference) const { return px + pct / 100.0f * reference; }
    };

    // A mask or border image. SVG and gradients draw at any size; rasters are premultiplied BGRA.
    struct Image
    {
        enum class Kind { None, Svg, Raster, Linear, Radial, Conic } kind{ Kind::None };
        std::string svg;
        std::vector<uint8_t> pixels;
        uint32_t pixelWidth{ 0 }, pixelHeight{ 0 };
        // Linear: CSS angle. Conic: start angle. Radial/conic centre and radial radii are fractions
        // of the box the gradient fills.
        float angle{ 180.0f };
        // Linear: a `to <corner>` keyword as -1/1 per axis, or 0 for an angle.
        float cornerX{ 0.0f }, cornerY{ 0.0f };
        float cx{ 0.5f }, cy{ 0.5f }, rx{ 0.5f }, ry{ 0.5f };
        std::vector<std::pair<float, uint32_t>> stops;
        // The SVG uses currentColor, kept as kCurrentColor until it's drawn.
        bool currentColor{ false };
        bool Drawable() const { return kind != Kind::None; }
    };

    enum Box { BorderBox = 0, PaddingBox = 1, ContentBox = 2, NoClip = 3, MarginBox = 3 };
    enum Repeat { RepeatTile = 0, NoRepeat = 1, Space = 2, Round = 3, Stretch = 4 };

    struct Layer
    {
        Image image;
        int sizeKind{ 0 }; // 0 lengths, 1 cover, 2 contain
        std::optional<Len> width, height;
        Len x, y;
        int repeatX{ RepeatTile }, repeatY{ RepeatTile };
        int origin{ PaddingBox }, clip{ BorderBox };
        int mode{ 0 };      // 0 match-source, 1 alpha, 2 luminance
        int composite{ 0 }; // 0 add, 1 subtract, 2 intersect, 3 exclude
    };

    struct ClipShape
    {
        int box{ BorderBox };
        int shape{ 0 }; // 0 box only, 1 inset, 2 circle, 3 ellipse, 4 polygon, 5 path
        std::vector<Len> values;
        std::vector<int> kinds; // circle/ellipse radii: 0 length, 1 closest-side, 2 farthest-side
        bool evenOdd{ false };
        std::string path;
    };

    struct NineSlice
    {
        Image image;
        float slice[4]{};       // top, right, bottom, left
        bool slicePct[4]{};
        bool fill{ false };
        int widthKind[4]{};     // 0 multiple of the border width, 1 length, 2 auto
        Len width[4]{};
        int outsetKind[4]{};    // 0 multiple of the border width, 1 length
        float outset[4]{};
        int repeatX{ Stretch }, repeatY{ Stretch };
        bool luminance{ false };
    };

    struct Spec
    {
        std::vector<Layer> layers;
        std::optional<ClipShape> clip;
        std::optional<NineSlice> border;
        bool HasLayers() const
        {
            return std::any_of(layers.begin(), layers.end(), [](Layer const& l) { return l.image.Drawable(); });
        }
        bool Any() const { return HasLayers() || clip.has_value() || (border && border->image.Drawable()); }
    };

    // The boxes masks and clips are drawn against, in DIPs from the border box's top-left.
    struct Boxes
    {
        float width{ 0.0f }, height{ 0.0f };
        float border[4]{};  // top, right, bottom, left
        float padding[4]{};
        float margin[4]{};
        D2D1_RECT_F Get(int box) const
        {
            D2D1_RECT_F r{ 0.0f, 0.0f, width, height };
            if (box == PaddingBox || box == ContentBox)
            {
                r.top += border[0]; r.right -= border[1]; r.bottom -= border[2]; r.left += border[3];
            }
            if (box == ContentBox)
            {
                r.top += padding[0]; r.right -= padding[1]; r.bottom -= padding[2]; r.left += padding[3];
            }
            r.right = (std::max)(r.right, r.left);
            r.bottom = (std::max)(r.bottom, r.top);
            return r;
        }
        bool operator==(Boxes const& o) const { return std::memcmp(this, &o, sizeof(Boxes)) == 0; }
    };

    // currentColor in an SVG, as a placeholder that's swapped for the element's colour at paint
    // time (the SVG is parsed again for every paint anyway).
    inline constexpr std::string_view kCurrentColor = "#c0c0c1";

    inline std::string MarkCurrentColor(std::string svg, bool& used)
    {
        constexpr std::string_view keyword = "currentcolor";
        std::string out;
        out.reserve(svg.size());
        for (size_t i = 0; i < svg.size();)
        {
            bool match = i + keyword.size() <= svg.size();
            for (size_t k = 0; match && k < keyword.size(); ++k)
            {
                match = std::tolower(static_cast<unsigned char>(svg[i + k])) == keyword[k];
            }
            if (match)
            {
                out += kCurrentColor;
                i += keyword.size();
                used = true;
            }
            else
            {
                out.push_back(svg[i++]);
            }
        }
        return out;
    }

    // Direct2D's SVG renderer doesn't pass paint set on the root <svg> (Bootstrap Icons'
    // fill="currentColor") down to the shapes, so it moves to a <g> around them.
    inline std::string HoistRootPaint(std::string svg)
    {
        const size_t open = svg.find("<svg");
        if (open == std::string::npos) return svg;
        const size_t end = svg.find('>', open);
        const size_t close = svg.rfind("</svg>");
        if (end == std::string::npos || close == std::string::npos || close < end || svg[end - 1] == '/') return svg;
        std::string attrs;
        for (std::string_view name : { "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity" })
        {
            const std::string tag = svg.substr(open, end - open);
            for (size_t at = tag.find(name); at != std::string::npos; at = tag.find(name, at + 1))
            {
                const bool startOk = at > 0 && std::isspace(static_cast<unsigned char>(tag[at - 1]));
                size_t eq = at + name.size();
                while (eq < tag.size() && tag[eq] == ' ') ++eq;
                if (!startOk || eq >= tag.size() || tag[eq] != '=') continue;
                size_t q = eq + 1;
                while (q < tag.size() && tag[q] == ' ') ++q;
                if (q >= tag.size() || (tag[q] != '"' && tag[q] != '\'')) break;
                const size_t qe = tag.find(tag[q], q + 1);
                if (qe == std::string::npos) break;
                attrs += " " + std::string(name) + "=" + tag.substr(q, qe - q + 1);
                break;
            }
        }
        if (attrs.empty()) return svg;
        svg.insert(close, "</g>");
        svg.insert(end + 1, "<g" + attrs + ">");
        return svg;
    }

    inline std::string WithCurrentColor(std::string const& svg, uint32_t argb)
    {
        char hex[8];
        std::snprintf(hex, sizeof(hex), "#%02x%02x%02x", (argb >> 16) & 0xFF, (argb >> 8) & 0xFF, argb & 0xFF);
        std::string out = svg;
        for (size_t at = out.find(kCurrentColor); at != std::string::npos; at = out.find(kCurrentColor, at + 7)) out.replace(at, kCurrentColor.size(), hex);
        return out;
    }

    // ---- JSON spec -----------------------------------------------------------------------------

    using Loader = std::function<Image(std::wstring const& source)>;

    inline float Num(json::JsonArray const& a, uint32_t i, float fallback = 0.0f)
    {
        if (!a || i >= a.Size()) return fallback;
        auto v = a.GetAt(i);
        return v.ValueType() == json::JsonValueType::Number ? static_cast<float>(v.GetNumber()) : fallback;
    }

    inline json::JsonArray Arr(json::JsonObject const& o, wchar_t const* key)
    {
        if (!o || !o.HasKey(key)) return nullptr;
        auto v = o.GetNamedValue(key);
        return v.ValueType() == json::JsonValueType::Array ? v.GetArray() : nullptr;
    }

    inline Len LenAt(json::JsonArray const& a, uint32_t i)
    {
        return Len{ Num(a, i), Num(a, i + 1) };
    }

    inline Image ParseImage(json::IJsonValue const& value, Loader const& load)
    {
        Image image;
        if (!value || value.ValueType() != json::JsonValueType::Object) return image;
        auto o = value.GetObject();
        const auto type = o.GetNamedString(L"t", L"");
        if (type == L"img")
        {
            if (load) image = load(std::wstring{ o.GetNamedString(L"src", L"") });
            return image;
        }
        if (auto s = Arr(o, L"s"))
        {
            for (uint32_t i = 0; i + 1 < s.Size(); i += 2)
            {
                // A float can't hold a 32-bit colour, so it's read as the double JSON gives.
                auto argb = s.GetAt(i + 1);
                const double color = argb.ValueType() == json::JsonValueType::Number ? argb.GetNumber() : 0.0;
                image.stops.emplace_back(Num(s, i), static_cast<uint32_t>(static_cast<int64_t>(color)));
            }
        }
        if (image.stops.empty()) return image;
        if (auto c = Arr(o, L"c")) { image.cx = Num(c, 0, 0.5f); image.cy = Num(c, 1, 0.5f); }
        if (auto r = Arr(o, L"r")) { image.rx = Num(r, 0, 0.5f); image.ry = Num(r, 1, 0.5f); }
        image.angle = static_cast<float>(o.GetNamedNumber(L"a", 180.0));
        if (auto k = Arr(o, L"k")) { image.cornerX = Num(k, 0, 0.0f); image.cornerY = Num(k, 1, 0.0f); }
        if (type == L"lin") image.kind = Image::Kind::Linear;
        else if (type == L"rad") image.kind = Image::Kind::Radial;
        else if (type == L"con") image.kind = Image::Kind::Conic;
        return image;
    }

    // Stops arrive as [offset, argb] with exact argb integers, which JSON numbers hold.
    inline Spec Parse(std::wstring_view text, Loader const& load)
    {
        Spec spec;
        json::JsonObject root{ nullptr };
        if (text.empty() || !json::JsonObject::TryParse(winrt::hstring{ text }, root)) return spec;
        if (auto layers = Arr(root, L"l"))
        {
            for (auto const& v : layers)
            {
                if (v.ValueType() != json::JsonValueType::Object) continue;
                auto o = v.GetObject();
                Layer layer;
                if (o.HasKey(L"i")) layer.image = ParseImage(o.GetNamedValue(L"i"), load);
                if (auto sz = Arr(o, L"sz"))
                {
                    layer.sizeKind = static_cast<int>(Num(sz, 0));
                    if (layer.sizeKind == 0)
                    {
                        if (Num(sz, 1) != 0.0f) layer.width = LenAt(sz, 2);
                        if (Num(sz, 4) != 0.0f) layer.height = LenAt(sz, 5);
                    }
                }
                if (auto p = Arr(o, L"p")) { layer.x = LenAt(p, 0); layer.y = LenAt(p, 2); }
                if (auto r = Arr(o, L"r")) { layer.repeatX = static_cast<int>(Num(r, 0)); layer.repeatY = static_cast<int>(Num(r, 1)); }
                layer.origin = static_cast<int>(o.GetNamedNumber(L"o", PaddingBox));
                layer.clip = static_cast<int>(o.GetNamedNumber(L"c", BorderBox));
                layer.mode = static_cast<int>(o.GetNamedNumber(L"m", 0));
                layer.composite = static_cast<int>(o.GetNamedNumber(L"k", 0));
                spec.layers.push_back(std::move(layer));
            }
        }
        if (root.HasKey(L"cp") && root.GetNamedValue(L"cp").ValueType() == json::JsonValueType::Object)
        {
            auto o = root.GetNamedObject(L"cp");
            ClipShape clip;
            clip.box = static_cast<int>(o.GetNamedNumber(L"b", BorderBox));
            clip.shape = static_cast<int>(o.GetNamedNumber(L"s", 0));
            if (auto v = Arr(o, L"v")) for (uint32_t i = 0; i + 1 < v.Size(); i += 2) clip.values.push_back(LenAt(v, i));
            if (auto k = Arr(o, L"k")) for (uint32_t i = 0; i < k.Size(); ++i) clip.kinds.push_back(static_cast<int>(Num(k, i)));
            clip.evenOdd = o.GetNamedBoolean(L"e", false);
            clip.path = winrt::to_string(o.GetNamedString(L"d", L""));
            spec.clip = std::move(clip);
        }
        if (root.HasKey(L"mb") && root.GetNamedValue(L"mb").ValueType() == json::JsonValueType::Object)
        {
            auto o = root.GetNamedObject(L"mb");
            NineSlice nine;
            if (o.HasKey(L"i")) nine.image = ParseImage(o.GetNamedValue(L"i"), load);
            auto sl = Arr(o, L"sl");
            auto w = Arr(o, L"w");
            auto out = Arr(o, L"o");
            auto r = Arr(o, L"r");
            for (int i = 0; i < 4; ++i)
            {
                nine.slice[i] = Num(sl, i * 2);
                nine.slicePct[i] = Num(sl, i * 2 + 1) != 0.0f;
                nine.widthKind[i] = static_cast<int>(Num(w, i * 3));
                nine.width[i] = LenAt(w, i * 3 + 1);
                nine.outsetKind[i] = static_cast<int>(Num(out, i * 2));
                nine.outset[i] = Num(out, i * 2 + 1);
            }
            nine.fill = o.GetNamedBoolean(L"f", false);
            nine.repeatX = static_cast<int>(Num(r, 0, Stretch));
            nine.repeatY = static_cast<int>(Num(r, 1, Stretch));
            nine.luminance = o.GetNamedBoolean(L"lum", false);
            spec.border = std::move(nine);
        }
        return spec;
    }

    // ---- Drawing -------------------------------------------------------------------------------

    inline D2D1_COLOR_F ColorOf(uint32_t argb)
    {
        return D2D1::ColorF(((argb >> 16) & 0xFF) / 255.0f, ((argb >> 8) & 0xFF) / 255.0f, (argb & 0xFF) / 255.0f, ((argb >> 24) & 0xFF) / 255.0f);
    }

    inline winrt::com_ptr<ID2D1Bitmap1> TargetBitmap(ID2D1DeviceContext* ctx, uint32_t width, uint32_t height)
    {
        winrt::com_ptr<ID2D1Bitmap1> bitmap;
        const auto props = D2D1::BitmapProperties1(D2D1_BITMAP_OPTIONS_TARGET,
            D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED));
        ctx->CreateBitmap(D2D1::SizeU((std::max)(width, 1u), (std::max)(height, 1u)), nullptr, 0, props, bitmap.put());
        return bitmap;
    }

    inline winrt::com_ptr<ID2D1DeviceContext5> Svg5(ID2D1DeviceContext* ctx)
    {
        winrt::com_ptr<ID2D1DeviceContext5> ctx5;
        ctx->QueryInterface(IID_PPV_ARGS(ctx5.put()));
        return ctx5;
    }

    inline winrt::com_ptr<ID2D1SvgDocument> SvgDocument(ID2D1DeviceContext* ctx, std::string const& svg, D2D1_SIZE_F viewport)
    {
        auto ctx5 = Svg5(ctx);
        if (!ctx5 || svg.empty()) return nullptr;
        winrt::com_ptr<IStream> stream;
        stream.attach(SHCreateMemStream(reinterpret_cast<const BYTE*>(svg.data()), static_cast<UINT>(svg.size())));
        if (!stream) return nullptr;
        winrt::com_ptr<ID2D1SvgDocument> doc;
        if (FAILED(ctx5->CreateSvgDocument(stream.get(), viewport, doc.put()))) return nullptr;
        return doc;
    }

    // The SVG's own size in CSS px: its width/height, else its viewBox. 0 when it has neither.
    inline D2D1_SIZE_F SvgSize(ID2D1SvgDocument* doc)
    {
        winrt::com_ptr<ID2D1SvgElement> root;
        doc->GetRoot(root.put());
        if (!root) return {};
        D2D1_SVG_LENGTH w{}, h{};
        const bool hasW = root->IsAttributeSpecified(L"width") && SUCCEEDED(root->GetAttributeValue(L"width", &w)) && w.units == D2D1_SVG_LENGTH_UNITS_NUMBER;
        const bool hasH = root->IsAttributeSpecified(L"height") && SUCCEEDED(root->GetAttributeValue(L"height", &h)) && h.units == D2D1_SVG_LENGTH_UNITS_NUMBER;
        D2D1_SVG_VIEWBOX box{};
        const bool hasBox = root->IsAttributeSpecified(L"viewBox") && SUCCEEDED(root->GetAttributeValue(L"viewBox", D2D1_SVG_ATTRIBUTE_POD_TYPE_VIEWBOX, &box, sizeof(box)));
        D2D1_SIZE_F size{ hasW ? w.value : 0.0f, hasH ? h.value : 0.0f };
        if (hasBox && box.width > 0.0f && box.height > 0.0f)
        {
            if (!hasW && !hasH) size = { box.width, box.height };
            else if (!hasW) size.width = size.height * box.width / box.height;
            else if (!hasH) size.height = size.width * box.height / box.width;
        }
        return size;
    }

    // Draws an SVG to fill `size` (its viewBox maps onto it as the SVG asks).
    inline void DrawSvg(ID2D1DeviceContext* ctx, ID2D1SvgDocument* doc, D2D1_SIZE_F size)
    {
        winrt::com_ptr<ID2D1SvgElement> root;
        doc->GetRoot(root.put());
        if (!root) return;
        // Without a viewBox the content wouldn't scale to the tile; give it one from its own size.
        if (!root->IsAttributeSpecified(L"viewBox"))
        {
            const D2D1_SIZE_F own = SvgSize(doc);
            if (own.width > 0.0f && own.height > 0.0f)
            {
                const D2D1_SVG_VIEWBOX box{ 0.0f, 0.0f, own.width, own.height };
                root->SetAttributeValue(L"viewBox", D2D1_SVG_ATTRIBUTE_POD_TYPE_VIEWBOX, &box, sizeof(box));
            }
        }
        const D2D1_SVG_LENGTH full{ 100.0f, D2D1_SVG_LENGTH_UNITS_PERCENTAGE };
        root->SetAttributeValue(L"width", full);
        root->SetAttributeValue(L"height", full);
        doc->SetViewportSize(size);
        if (auto ctx5 = Svg5(ctx)) ctx5->DrawSvgDocument(doc);
    }

    // An image's natural size in CSS px, 0 on an axis it lacks. Gradients have none.
    inline D2D1_SIZE_F NaturalSize(ID2D1DeviceContext* ctx, Image const& image)
    {
        if (image.kind == Image::Kind::Raster) return { static_cast<float>(image.pixelWidth), static_cast<float>(image.pixelHeight) };
        if (image.kind == Image::Kind::Svg)
        {
            if (auto doc = SvgDocument(ctx, image.svg, { 1.0f, 1.0f })) return SvgSize(doc.get());
        }
        return {};
    }

    inline winrt::com_ptr<ID2D1GradientStopCollection> Stops(ID2D1DeviceContext* ctx, Image const& image, D2D1_EXTEND_MODE extend)
    {
        std::vector<D2D1_GRADIENT_STOP> stops;
        for (auto const& [offset, argb] : image.stops) stops.push_back({ offset, ColorOf(argb) });
        if (stops.size() == 1) stops.push_back({ 1.0f, stops[0].color });
        winrt::com_ptr<ID2D1GradientStopCollection> collection;
        ctx->CreateGradientStopCollection(stops.data(), static_cast<UINT32>(stops.size()), D2D1_GAMMA_2_2, extend, collection.put());
        return collection;
    }

    inline D2D1_COLOR_F StopColorAt(Image const& image, float t)
    {
        auto const& s = image.stops;
        if (t <= s.front().first) return ColorOf(s.front().second);
        for (size_t i = 1; i < s.size(); ++i)
        {
            if (t <= s[i].first)
            {
                const float span = s[i].first - s[i - 1].first;
                const float f = span > 0.0f ? (t - s[i - 1].first) / span : 1.0f;
                const auto a = ColorOf(s[i - 1].second), b = ColorOf(s[i].second);
                return D2D1::ColorF(a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f, a.a + (b.a - a.a) * f);
            }
        }
        return ColorOf(s.back().second);
    }

    // Draws `image` to fill the rect (0, 0, w, h) in the current transform.
    inline void DrawImage(ID2D1DeviceContext* ctx, Image const& image, float w, float h, uint32_t color = 0xFF000000)
    {
        if (w <= 0.0f || h <= 0.0f) return;
        const auto rect = D2D1::RectF(0.0f, 0.0f, w, h);
        switch (image.kind)
        {
        case Image::Kind::Svg:
        {
            D2D1_MATRIX_3X2_F transform;
            ctx->GetTransform(&transform);
            if (auto doc = SvgDocument(ctx, image.currentColor ? WithCurrentColor(image.svg, color) : image.svg, { w, h })) DrawSvg(ctx, doc.get(), { w, h });
            ctx->SetTransform(transform);
            break;
        }
        case Image::Kind::Raster:
        {
            winrt::com_ptr<ID2D1Bitmap> bitmap;
            const auto props = D2D1::BitmapProperties(D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED));
            if (SUCCEEDED(ctx->CreateBitmap(D2D1::SizeU(image.pixelWidth, image.pixelHeight), image.pixels.data(), image.pixelWidth * 4, props, bitmap.put())))
            {
                ctx->DrawBitmap(bitmap.get(), rect, 1.0f, D2D1_INTERPOLATION_MODE_LINEAR);
            }
            break;
        }
        case Image::Kind::Linear:
        {
            // CSS: 0deg points up, angles turn clockwise, and the line is just long enough for the
            // corners to get the end colours.
            const float a = image.angle * 3.14159265f / 180.0f;
            const float diagonal = std::hypot(w, h);
            const bool corner = image.cornerX != 0.0f && image.cornerY != 0.0f && diagonal > 0.0f;
            const float dx = corner ? image.cornerX * h / diagonal : std::sin(a);
            const float dy = corner ? image.cornerY * w / diagonal : -std::cos(a);
            const float half = (std::abs(w * dx) + std::abs(h * dy)) / 2.0f;
            const D2D1_POINT_2F c{ w / 2.0f, h / 2.0f };
            auto stops = Stops(ctx, image, D2D1_EXTEND_MODE_CLAMP);
            winrt::com_ptr<ID2D1LinearGradientBrush> brush;
            if (stops && SUCCEEDED(ctx->CreateLinearGradientBrush(
                D2D1::LinearGradientBrushProperties({ c.x - dx * half, c.y - dy * half }, { c.x + dx * half, c.y + dy * half }), stops.get(), brush.put())))
            {
                ctx->FillRectangle(rect, brush.get());
            }
            break;
        }
        case Image::Kind::Radial:
        {
            auto stops = Stops(ctx, image, D2D1_EXTEND_MODE_CLAMP);
            winrt::com_ptr<ID2D1RadialGradientBrush> brush;
            if (stops && SUCCEEDED(ctx->CreateRadialGradientBrush(
                D2D1::RadialGradientBrushProperties({ image.cx * w, image.cy * h }, {}, image.rx * w, image.ry * h), stops.get(), brush.put())))
            {
                ctx->FillRectangle(rect, brush.get());
            }
            break;
        }
        case Image::Kind::Conic:
        {
            // Direct2D has no conic gradient: one solid wedge per degree, drawn aliased so they meet.
            winrt::com_ptr<ID2D1Factory> factory;
            ctx->GetFactory(factory.put());
            const D2D1_POINT_2F c{ image.cx * w, image.cy * h };
            const float reach = std::hypot((std::max)(c.x, w - c.x), (std::max)(c.y, h - c.y)) + 2.0f;
            const auto aa = ctx->GetAntialiasMode();
            ctx->SetAntialiasMode(D2D1_ANTIALIAS_MODE_ALIASED);
            ctx->PushAxisAlignedClip(rect, D2D1_ANTIALIAS_MODE_ALIASED);
            constexpr int kWedges = 360;
            for (int i = 0; i < kWedges; ++i)
            {
                const float t0 = static_cast<float>(i) / kWedges, t1 = static_cast<float>(i + 1) / kWedges;
                const float a0 = (image.angle + t0 * 360.0f) * 3.14159265f / 180.0f - 0.002f;
                const float a1 = (image.angle + t1 * 360.0f) * 3.14159265f / 180.0f + 0.002f;
                winrt::com_ptr<ID2D1PathGeometry> wedge;
                winrt::com_ptr<ID2D1GeometrySink> sink;
                if (FAILED(factory->CreatePathGeometry(wedge.put())) || FAILED(wedge->Open(sink.put()))) break;
                sink->BeginFigure(c, D2D1_FIGURE_BEGIN_FILLED);
                sink->AddLine({ c.x + reach * std::sin(a0), c.y - reach * std::cos(a0) });
                sink->AddLine({ c.x + reach * std::sin(a1), c.y - reach * std::cos(a1) });
                sink->EndFigure(D2D1_FIGURE_END_CLOSED);
                sink->Close();
                winrt::com_ptr<ID2D1SolidColorBrush> brush;
                ctx->CreateSolidColorBrush(StopColorAt(image, (t0 + t1) / 2.0f), brush.put());
                ctx->FillGeometry(wedge.get(), brush.get());
            }
            ctx->PopAxisAlignedClip();
            ctx->SetAntialiasMode(aa);
            break;
        }
        default:
            break;
        }
    }

    // Positions along one axis where a layer's tiles start, in DIPs.
    inline std::vector<float> TileStarts(int repeat, float areaStart, float areaLength, float clipStart, float clipEnd, float tile, float offset, float& step)
    {
        std::vector<float> starts;
        step = tile;
        if (tile <= 0.0f) return starts;
        if (repeat == NoRepeat)
        {
            starts.push_back(areaStart + offset);
            return starts;
        }
        if (repeat == Space)
        {
            const int n = static_cast<int>(std::floor(areaLength / tile + 1e-4f));
            if (n <= 1)
            {
                starts.push_back(areaStart + offset);
                return starts;
            }
            step = tile + (areaLength - n * tile) / (n - 1);
            for (float s = areaStart; s > clipStart; s -= step) starts.insert(starts.begin(), s - step);
            for (float s = areaStart; s < clipEnd; s += step) starts.push_back(s);
            return starts;
        }
        float first = areaStart + offset;
        first -= std::ceil((first - clipStart) / tile) * tile;
        for (float s = first; s < clipEnd && starts.size() < 4096; s += tile) starts.push_back(s);
        return starts;
    }

    // One mask layer, tiled over its origin box and clipped to its clip box. Coordinates in DIPs.
    inline void DrawLayer(ID2D1DeviceContext* ctx, Layer const& layer, Boxes const& boxes, float scale, uint32_t color = 0xFF000000)
    {
        const D2D1_RECT_F area = boxes.Get(layer.origin);
        D2D1_RECT_F clip = layer.clip == NoClip ? D2D1::RectF(-1e5f, -1e5f, 1e5f, 1e5f) : boxes.Get(layer.clip);
        const float aw = area.right - area.left, ah = area.bottom - area.top;
        const D2D1_SIZE_F natural = NaturalSize(ctx, layer.image);
        const bool hasRatio = natural.width > 0.0f && natural.height > 0.0f;
        float tw = 0.0f, th = 0.0f;
        if (layer.sizeKind == 1 || layer.sizeKind == 2)
        {
            if (hasRatio)
            {
                const float sx = aw / natural.width, sy = ah / natural.height;
                const float s = layer.sizeKind == 1 ? (std::max)(sx, sy) : (std::min)(sx, sy);
                tw = natural.width * s;
                th = natural.height * s;
            }
            else
            {
                tw = aw;
                th = ah;
            }
        }
        else
        {
            const bool autoW = !layer.width, autoH = !layer.height;
            if (!autoW) tw = layer.width->Of(aw);
            if (!autoH) th = layer.height->Of(ah);
            if (autoW && autoH)
            {
                tw = natural.width > 0.0f ? natural.width : aw;
                th = natural.height > 0.0f ? natural.height : ah;
            }
            else if (autoW)
            {
                tw = hasRatio ? th * natural.width / natural.height : (natural.width > 0.0f ? natural.width : aw);
            }
            else if (autoH)
            {
                th = hasRatio ? tw * natural.height / natural.width : (natural.height > 0.0f ? natural.height : ah);
            }
        }
        if (layer.repeatX == Round && tw > 0.0f)
        {
            const float n = (std::max)(1.0f, std::round(aw / tw));
            const float old = tw;
            tw = aw / n;
            if (!layer.height && layer.repeatY != Round && old > 0.0f) th *= tw / old;
        }
        if (layer.repeatY == Round && th > 0.0f)
        {
            const float n = (std::max)(1.0f, std::round(ah / th));
            const float old = th;
            th = ah / n;
            if (!layer.width && layer.repeatX != Round && old > 0.0f) tw *= th / old;
        }
        if (tw <= 0.0f || th <= 0.0f) return;

        // The tile, drawn once at device resolution.
        const uint32_t pw = static_cast<uint32_t>(std::ceil(tw * scale)), ph = static_cast<uint32_t>(std::ceil(th * scale));
        if (pw > 8192 || ph > 8192) return;
        winrt::com_ptr<ID2D1Image> target;
        ctx->GetTarget(target.put());
        D2D1_MATRIX_3X2_F transform;
        ctx->GetTransform(&transform);
        auto tile = TargetBitmap(ctx, pw, ph);
        if (!tile) return;
        ctx->SetTarget(tile.get());
        ctx->SetTransform(D2D1::Matrix3x2F::Identity());
        ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
        DrawImage(ctx, layer.image, static_cast<float>(pw), static_cast<float>(ph), color);
        ctx->SetTarget(target.get());
        ctx->SetTransform(transform);

        float stepX = tw, stepY = th;
        const auto xs = TileStarts(layer.repeatX, area.left, aw, clip.left, clip.right, tw, layer.x.Of(aw - tw), stepX);
        const auto ys = TileStarts(layer.repeatY, area.top, ah, clip.top, clip.bottom, th, layer.y.Of(ah - th), stepY);
        ctx->PushAxisAlignedClip(clip, D2D1_ANTIALIAS_MODE_ALIASED);
        for (float y : ys)
        {
            for (float x : xs) ctx->DrawBitmap(tile.get(), D2D1::RectF(x, y, x + tw, y + th), 1.0f, D2D1_INTERPOLATION_MODE_LINEAR, nullptr);
        }
        ctx->PopAxisAlignedClip();
    }

    inline winrt::com_ptr<ID2D1Image> Luminance(ID2D1DeviceContext* ctx, ID2D1Image* input)
    {
        winrt::com_ptr<ID2D1Effect> effect;
        if (FAILED(ctx->CreateEffect(CLSID_D2D1LuminanceToAlpha, effect.put()))) return nullptr;
        effect->SetInput(0, input);
        winrt::com_ptr<ID2D1Image> output;
        effect->GetOutput(output.put());
        return output;
    }

    inline void AddRoundedRect(ID2D1GeometrySink* sink, D2D1_RECT_F r, float const (&rad)[8])
    {
        // rad: top-left x/y, top-right x/y, bottom-right x/y, bottom-left x/y.
        auto arc = [&](D2D1_POINT_2F to, float rx, float ry)
        {
            if (rx > 0.0f && ry > 0.0f) sink->AddArc(D2D1::ArcSegment(to, { rx, ry }, 0.0f, D2D1_SWEEP_DIRECTION_CLOCKWISE, D2D1_ARC_SIZE_SMALL));
            else sink->AddLine(to);
        };
        sink->BeginFigure({ r.left + rad[0], r.top }, D2D1_FIGURE_BEGIN_FILLED);
        sink->AddLine({ r.right - rad[2], r.top });
        arc({ r.right, r.top + rad[3] }, rad[2], rad[3]);
        sink->AddLine({ r.right, r.bottom - rad[5] });
        arc({ r.right - rad[4], r.bottom }, rad[4], rad[5]);
        sink->AddLine({ r.left + rad[6], r.bottom });
        arc({ r.left, r.bottom - rad[7] }, rad[6], rad[7]);
        sink->AddLine({ r.left, r.top + rad[1] });
        arc({ r.left + rad[0], r.top }, rad[0], rad[1]);
        sink->EndFigure(D2D1_FIGURE_END_CLOSED);
    }

    inline D2D1_RECT_F ClipReference(ClipShape const& clip, Boxes const& boxes)
    {
        D2D1_RECT_F ref = boxes.Get(clip.box == MarginBox ? BorderBox : clip.box);
        if (clip.box == MarginBox)
        {
            ref.top -= boxes.margin[0]; ref.right += boxes.margin[1]; ref.bottom += boxes.margin[2]; ref.left -= boxes.margin[3];
        }
        return ref;
    }

    // The clip-path shape as a geometry in DIPs, for every shape but path() (which only the SVG
    // renderer parses). Null for an empty shape.
    inline winrt::com_ptr<ID2D1Geometry> ClipGeometry(ID2D1Factory* factory, ClipShape const& clip, Boxes const& boxes)
    {
        const D2D1_RECT_F ref = ClipReference(clip, boxes);
        const float w = ref.right - ref.left, h = ref.bottom - ref.top;
        auto v = [&](size_t i) { return i < clip.values.size() ? clip.values[i] : Len{}; };
        auto kind = [&](size_t i) { return i < clip.kinds.size() ? clip.kinds[i] : 0; };
        winrt::com_ptr<ID2D1PathGeometry> path;
        winrt::com_ptr<ID2D1GeometrySink> sink;
        auto open = [&]() { return SUCCEEDED(factory->CreatePathGeometry(path.put())) && SUCCEEDED(path->Open(sink.put())); };
        auto close = [&]() -> winrt::com_ptr<ID2D1Geometry> { return SUCCEEDED(sink->Close()) ? path.as<ID2D1Geometry>() : nullptr; };

        switch (clip.shape)
        {
        case 0:
        {
            winrt::com_ptr<ID2D1RectangleGeometry> rect;
            factory->CreateRectangleGeometry(ref, rect.put());
            return rect ? rect.as<ID2D1Geometry>() : nullptr;
        }
        case 1:
        {
            D2D1_RECT_F r{ ref.left + v(3).Of(w), ref.top + v(0).Of(h), ref.right - v(1).Of(w), ref.bottom - v(2).Of(h) };
            if (r.right <= r.left || r.bottom <= r.top) return nullptr;
            const float rw = r.right - r.left, rh = r.bottom - r.top;
            float rad[8];
            for (int i = 0; i < 8; ++i) rad[i] = (std::max)(0.0f, v(4 + i).Of(i % 2 == 0 ? rw : rh));
            // Overlapping radii shrink together, as border-radius does.
            float f = 1.0f;
            auto fit = [&](float a, float b, float side) { if (a + b > side && a + b > 0.0f) f = (std::min)(f, side / (a + b)); };
            fit(rad[0], rad[2], rw); fit(rad[6], rad[4], rw); fit(rad[1], rad[7], rh); fit(rad[3], rad[5], rh);
            for (auto& x : rad) x *= f;
            if (!open()) return nullptr;
            sink->SetFillMode(D2D1_FILL_MODE_WINDING);
            AddRoundedRect(sink.get(), r, rad);
            return close();
        }
        case 2:
        case 3:
        {
            const float cx = ref.left + v(0).Of(w), cy = ref.top + v(1).Of(h);
            const float sides[4] = { std::abs(cx - ref.left), std::abs(ref.right - cx), std::abs(cy - ref.top), std::abs(ref.bottom - cy) };
            auto extent = [&](int k, Len len, float closeA, float closeB, float reference)
            {
                if (k == 1) return (std::min)(closeA, closeB);
                if (k == 2) return (std::max)(closeA, closeB);
                return len.Of(reference);
            };
            float rx, ry;
            if (clip.shape == 2)
            {
                const int k = kind(0);
                const float closest = (std::min)({ sides[0], sides[1], sides[2], sides[3] });
                const float farthest = (std::max)({ sides[0], sides[1], sides[2], sides[3] });
                rx = ry = k == 1 ? closest : k == 2 ? farthest : v(2).Of(std::sqrt(w * w + h * h) / std::sqrt(2.0f));
            }
            else
            {
                rx = extent(kind(0), v(2), sides[0], sides[1], w);
                ry = extent(kind(1), v(3), sides[2], sides[3], h);
            }
            if (rx <= 0.0f || ry <= 0.0f) return nullptr;
            winrt::com_ptr<ID2D1EllipseGeometry> ellipse;
            factory->CreateEllipseGeometry(D2D1::Ellipse({ cx, cy }, rx, ry), ellipse.put());
            return ellipse ? ellipse.as<ID2D1Geometry>() : nullptr;
        }
        case 4:
        {
            if (clip.values.size() < 3 || !open()) return nullptr;
            sink->SetFillMode(clip.evenOdd ? D2D1_FILL_MODE_ALTERNATE : D2D1_FILL_MODE_WINDING);
            sink->BeginFigure({ ref.left + v(0).Of(w), ref.top + v(1).Of(h) }, D2D1_FIGURE_BEGIN_FILLED);
            for (size_t i = 2; i + 1 < clip.values.size(); i += 2) sink->AddLine({ ref.left + v(i).Of(w), ref.top + v(i + 1).Of(h) });
            sink->EndFigure(D2D1_FIGURE_END_CLOSED);
            return close();
        }
        default:
            return nullptr;
        }
    }

    // The clip-path shape, filled opaque. Coordinates in DIPs.
    inline void DrawClip(ID2D1DeviceContext* ctx, ClipShape const& clip, Boxes const& boxes)
    {
        winrt::com_ptr<ID2D1SolidColorBrush> white;
        ctx->CreateSolidColorBrush(D2D1::ColorF(1, 1, 1, 1), white.put());
        if (clip.shape == 5)
        {
            // path(): Direct2D's SVG renderer parses the path data.
            const D2D1_RECT_F ref = ClipReference(clip, boxes);
            const float w = ref.right - ref.left, h = ref.bottom - ref.top;
            std::string d;
            for (char c : clip.path) if (c != '"' && c != '<' && c != '>' && c != '&') d.push_back(c);
            const std::string svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + std::to_string(w) + "' height='" + std::to_string(h)
                + "'><path fill='#fff' fill-rule='" + (clip.evenOdd ? "evenodd" : "nonzero") + "' d=\"" + d + "\"/></svg>";
            D2D1_MATRIX_3X2_F transform;
            ctx->GetTransform(&transform);
            ctx->SetTransform(D2D1::Matrix3x2F::Translation(ref.left, ref.top) * transform);
            if (auto doc = SvgDocument(ctx, svg, { w, h }))
            {
                if (auto ctx5 = Svg5(ctx)) ctx5->DrawSvgDocument(doc.get());
            }
            ctx->SetTransform(transform);
            return;
        }
        winrt::com_ptr<ID2D1Factory> factory;
        ctx->GetFactory(factory.put());
        if (auto geometry = ClipGeometry(factory.get(), clip, boxes)) ctx->FillGeometry(geometry.get(), white.get());
    }

    // Whether a point (DIPs from the border box's top-left) is inside the clip-path; true for
    // path(), whose shape only the SVG renderer knows.
    inline bool ClipContains(ClipShape const& clip, Boxes const& boxes, float x, float y)
    {
        if (clip.shape == 5) return true;
        thread_local winrt::com_ptr<ID2D1Factory> factory;
        if (!factory && FAILED(D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, __uuidof(ID2D1Factory), factory.put_void()))) return true;
        auto geometry = ClipGeometry(factory.get(), clip, boxes);
        if (!geometry) return false;
        BOOL contains = FALSE;
        if (FAILED(geometry->FillContainsPoint({ x, y }, D2D1::Matrix3x2F::Identity(), D2D1_DEFAULT_FLATTENING_TOLERANCE, &contains))) return true;
        return contains != FALSE;
    }

    // ---- 9-slice (mask-border, border-image) ---------------------------------------------------

    struct NineLayout
    {
        D2D1_RECT_F area{};  // the border image area, in DIPs from the border box's top-left
        float widths[4]{};   // top, right, bottom, left, in DIPs
    };

    inline NineLayout LayoutNine(NineSlice const& nine, Boxes const& boxes, D2D1_SIZE_F imageSize, float const (&slices)[4])
    {
        NineLayout out;
        float outset[4];
        for (int i = 0; i < 4; ++i) outset[i] = nine.outsetKind[i] == 0 ? nine.outset[i] * boxes.border[i] : nine.outset[i];
        out.area = D2D1::RectF(-outset[3], -outset[0], boxes.width + outset[1], boxes.height + outset[2]);
        const float aw = out.area.right - out.area.left, ah = out.area.bottom - out.area.top;
        for (int i = 0; i < 4; ++i)
        {
            const float reference = (i % 2 == 0) ? ah : aw;
            switch (nine.widthKind[i])
            {
            case 0: out.widths[i] = nine.width[i].px * boxes.border[i]; break;
            case 1: out.widths[i] = nine.width[i].Of(reference); break;
            default: out.widths[i] = slices[i]; break;
            }
            out.widths[i] = (std::max)(0.0f, out.widths[i]);
        }
        (void)imageSize;
        float f = 1.0f;
        if (out.widths[1] + out.widths[3] > aw && aw > 0.0f) f = (std::min)(f, aw / (out.widths[1] + out.widths[3]));
        if (out.widths[0] + out.widths[2] > ah && ah > 0.0f) f = (std::min)(f, ah / (out.widths[0] + out.widths[2]));
        for (auto& w : out.widths) w *= f;
        return out;
    }

    // Tile rects along one axis of a region, in device pixels.
    inline std::vector<std::pair<float, float>> NineTiles(int repeat, float start, float end, float tile)
    {
        std::vector<std::pair<float, float>> tiles;
        const float length = end - start;
        if (length <= 0.0f) return tiles;
        if (repeat == Stretch || tile <= 0.0f)
        {
            tiles.emplace_back(start, end);
            return tiles;
        }
        if (repeat == Round)
        {
            const int n = (std::max)(1, static_cast<int>(std::round(length / tile)));
            for (int i = 0; i < n; ++i) tiles.emplace_back(start + length * i / n, start + length * (i + 1) / n);
            return tiles;
        }
        if (repeat == Space)
        {
            const int n = static_cast<int>(std::floor(length / tile + 1e-4f));
            if (n <= 0) return tiles;
            const float gap = (length - n * tile) / (n + 1);
            for (int i = 0; i < n; ++i)
            {
                const float s = start + gap + i * (tile + gap);
                tiles.emplace_back(s, s + tile);
            }
            return tiles;
        }
        // repeat: centred on the region, partial tiles at both ends.
        const float centre = (start + end) / 2.0f;
        float first = centre - tile / 2.0f;
        first -= std::ceil((first - start) / tile) * tile;
        for (float s = first; s < end && tiles.size() < 4096; s += tile) tiles.emplace_back(s, s + tile);
        return tiles;
    }

    // Paints a 9-slice into the current target, whose pixel (0, 0) is DIP `origin` of the element.
    inline void DrawNine(ID2D1DeviceContext* ctx, NineSlice const& nine, Boxes const& boxes, D2D1_POINT_2F origin, float scale, uint32_t color = 0xFF000000)
    {
        if (!nine.image.Drawable()) return;
        D2D1_SIZE_F natural = NaturalSize(ctx, nine.image);
        float slices[4];
        // Images without a size of their own (gradients) take the border image area's.
        NineLayout probe = LayoutNine(nine, boxes, natural, { 0, 0, 0, 0 });
        if (natural.width <= 0.0f) natural.width = probe.area.right - probe.area.left;
        if (natural.height <= 0.0f) natural.height = probe.area.bottom - probe.area.top;
        if (natural.width <= 0.0f || natural.height <= 0.0f) return;
        for (int i = 0; i < 4; ++i)
        {
            const float reference = (i % 2 == 0) ? natural.height : natural.width;
            slices[i] = (std::min)(reference, (std::max)(0.0f, nine.slicePct[i] ? nine.slice[i] / 100.0f * reference : nine.slice[i]));
        }
        const NineLayout layout = LayoutNine(nine, boxes, natural, slices);

        // The source, rasterised finely enough for its most magnified slice.
        float k = scale;
        for (int i = 0; i < 4; ++i) if (slices[i] > 0.0f) k = (std::max)(k, layout.widths[i] / slices[i] * scale);
        k = (std::min)(k, scale * 8.0f);
        const uint32_t sw = static_cast<uint32_t>(std::ceil(natural.width * k)), sh = static_cast<uint32_t>(std::ceil(natural.height * k));
        if (sw > 8192 || sh > 8192) return;
        winrt::com_ptr<ID2D1Image> target;
        ctx->GetTarget(target.put());
        D2D1_MATRIX_3X2_F transform;
        ctx->GetTransform(&transform);
        auto source = TargetBitmap(ctx, sw, sh);
        if (!source) return;
        ctx->SetTarget(source.get());
        ctx->SetTransform(D2D1::Matrix3x2F::Identity());
        ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
        DrawImage(ctx, nine.image, static_cast<float>(sw), static_cast<float>(sh), color);
        // CopyFromBitmap below reads pixels directly, ahead of any drawing still batched.
        ctx->Flush();
        ctx->SetTarget(target.get());

        // Region edges in device pixels, snapped so neighbouring tiles share an edge.
        auto px = [&](float dip, float o) { return std::round((dip - o) * scale); };
        const float x[4] = { px(layout.area.left, origin.x), px(layout.area.left + layout.widths[3], origin.x),
            px(layout.area.right - layout.widths[1], origin.x), px(layout.area.right, origin.x) };
        const float y[4] = { px(layout.area.top, origin.y), px(layout.area.top + layout.widths[0], origin.y),
            px(layout.area.bottom - layout.widths[2], origin.y), px(layout.area.bottom, origin.y) };
        const float sx[4] = { 0.0f, slices[3] * k, (natural.width - slices[1]) * k, natural.width * k };
        const float sy[4] = { 0.0f, slices[0] * k, (natural.height - slices[2]) * k, natural.height * k };

        ctx->SetTransform(transform);
        const auto aa = ctx->GetAntialiasMode();
        ctx->SetAntialiasMode(D2D1_ANTIALIAS_MODE_ALIASED);
        // Scale of the top/bottom edges (by their height) and left/right edges (by their width);
        // the middle uses the top and left factors.
        auto factor = [](float dest, float src) { return src > 0.0f ? dest / src : 0.0f; };
        const float topF = factor(y[1] - y[0], sy[1] - sy[0]), bottomF = factor(y[3] - y[2], sy[3] - sy[2]);
        const float leftF = factor(x[1] - x[0], sx[1] - sx[0]), rightF = factor(x[3] - x[2], sx[3] - sx[2]);
        for (int row = 0; row < 3; ++row)
        {
            for (int col = 0; col < 3; ++col)
            {
                if (row == 1 && col == 1 && !nine.fill) continue;
                const D2D1_RECT_F dest{ x[col], y[row], x[col + 1], y[row + 1] };
                const D2D1_RECT_F src{ sx[col], sy[row], sx[col + 1], sy[row + 1] };
                if (dest.right <= dest.left || dest.bottom <= dest.top || src.right <= src.left || src.bottom <= src.top) continue;
                // How big one tile is along each axis: corners stretch, edges keep the slice's
                // aspect ratio scaled to the border width.
                float tileW = dest.right - dest.left, tileH = dest.bottom - dest.top;
                int repX = Stretch, repY = Stretch;
                if (col == 1)
                {
                    repX = nine.repeatX;
                    const float f = row == 0 ? topF : row == 2 ? bottomF : (topF > 0.0f ? topF : bottomF);
                    tileW = (src.right - src.left) * (f > 0.0f ? f : 1.0f);
                }
                if (row == 1)
                {
                    repY = nine.repeatY;
                    const float f = col == 0 ? leftF : col == 2 ? rightF : (leftF > 0.0f ? leftF : rightF);
                    tileH = (src.bottom - src.top) * (f > 0.0f ? f : 1.0f);
                }
                const auto cols = NineTiles(repX, dest.left, dest.right, tileW);
                const auto rows = NineTiles(repY, dest.top, dest.bottom, tileH);
                // The slice in a bitmap of its own, so clamping stops at its edges and its pixel
                // (0, 0) is the brush's origin.
                const D2D1_RECT_U cut{ static_cast<UINT32>(std::round(src.left)), static_cast<UINT32>(std::round(src.top)),
                    static_cast<UINT32>(std::round(src.right)), static_cast<UINT32>(std::round(src.bottom)) };
                if (cut.right <= cut.left || cut.bottom <= cut.top) continue;
                const float cw = static_cast<float>(cut.right - cut.left), ch = static_cast<float>(cut.bottom - cut.top);
                winrt::com_ptr<ID2D1Bitmap1> slice;
                if (FAILED(ctx->CreateBitmap(D2D1::SizeU(cut.right - cut.left, cut.bottom - cut.top), nullptr, 0,
                    D2D1::BitmapProperties1(D2D1_BITMAP_OPTIONS_NONE, D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED)),
                    slice.put()))) continue;
                const D2D1_POINT_2U zero{ 0, 0 };
                if (FAILED(slice->CopyFromBitmap(&zero, source.get(), &cut))) continue;
                winrt::com_ptr<ID2D1ImageBrush> brush;
                if (FAILED(ctx->CreateImageBrush(slice.get(),
                    D2D1::ImageBrushProperties(D2D1::RectF(0.0f, 0.0f, cw, ch), D2D1_EXTEND_MODE_CLAMP, D2D1_EXTEND_MODE_CLAMP, D2D1_INTERPOLATION_MODE_LINEAR),
                    brush.put()))) continue;
                ctx->PushAxisAlignedClip(dest, D2D1_ANTIALIAS_MODE_ALIASED);
                for (auto const& [ty0, ty1] : rows)
                {
                    for (auto const& [tx0, tx1] : cols)
                    {
                        const float l = std::round(tx0), t = std::round(ty0), r = std::round(tx1), b = std::round(ty1);
                        if (r <= l || b <= t) continue;
                        brush->SetTransform(D2D1::Matrix3x2F::Scale((r - l) / cw, (b - t) / ch) * D2D1::Matrix3x2F::Translation(l, t));
                        ctx->FillRectangle(D2D1::RectF(l, t, r, b), brush.get());
                    }
                }
                ctx->PopAxisAlignedClip();
            }
        }
        ctx->SetAntialiasMode(aa);
    }

    // ---- The mask surface ----------------------------------------------------------------------

    // Paints the whole mask: layers composited bottom-up, then clip-path and mask-border kept only
    // where they're opaque. The target is `size` device pixels; DIP (0, 0) sits at `pad` DIPs in.
    inline void PaintMask(ID2D1DeviceContext* ctx, Spec const& spec, Boxes const& boxes, float pad, float scale)
    {
        winrt::com_ptr<ID2D1Image> surface;
        ctx->GetTarget(surface.put());
        D2D1_MATRIX_3X2_F surfaceTransform;
        ctx->GetTransform(&surfaceTransform);
        const uint32_t pw = static_cast<uint32_t>(std::ceil((boxes.width + 2.0f * pad) * scale));
        const uint32_t ph = static_cast<uint32_t>(std::ceil((boxes.height + 2.0f * pad) * scale));
        const auto toPx = D2D1::Matrix3x2F::Translation(pad, pad) * D2D1::Matrix3x2F::Scale(scale, scale);
        auto mask = TargetBitmap(ctx, pw, ph);
        if (!mask) return;

        auto offscreen = [&](auto&& draw) -> winrt::com_ptr<ID2D1Bitmap1>
        {
            auto bitmap = TargetBitmap(ctx, pw, ph);
            if (!bitmap) return nullptr;
            ctx->SetTarget(bitmap.get());
            ctx->SetTransform(toPx);
            ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
            draw();
            return bitmap;
        };
        auto composite = [&](ID2D1Image* image, D2D1_COMPOSITE_MODE mode)
        {
            ctx->SetTarget(mask.get());
            ctx->SetTransform(D2D1::Matrix3x2F::Identity());
            ctx->DrawImage(image, nullptr, nullptr, D2D1_INTERPOLATION_MODE_LINEAR, mode);
        };

        ctx->SetTarget(mask.get());
        ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
        if (spec.HasLayers())
        {
            // The first layer is on top: each composites onto the result of the layers below it.
            for (size_t n = spec.layers.size(); n-- > 0;)
            {
                Layer const& layer = spec.layers[n];
                auto bitmap = offscreen([&] { if (layer.image.Drawable()) DrawLayer(ctx, layer, boxes, scale); });
                if (!bitmap) continue;
                winrt::com_ptr<ID2D1Image> image = bitmap;
                // match-source is alpha for images; luminance only when asked.
                if (layer.mode == 2) if (auto lum = Luminance(ctx, bitmap.get())) image = lum;
                D2D1_COMPOSITE_MODE mode = D2D1_COMPOSITE_MODE_SOURCE_OVER;
                if (n + 1 < spec.layers.size())
                {
                    switch (layer.composite)
                    {
                    case 1: mode = D2D1_COMPOSITE_MODE_SOURCE_OUT; break;
                    case 2: mode = D2D1_COMPOSITE_MODE_SOURCE_IN; break;
                    case 3: mode = D2D1_COMPOSITE_MODE_XOR; break;
                    default: break;
                    }
                }
                composite(image.get(), mode);
            }
        }
        else
        {
            ctx->Clear(D2D1::ColorF(1, 1, 1, 1));
        }
        if (spec.clip)
        {
            if (auto bitmap = offscreen([&] { DrawClip(ctx, *spec.clip, boxes); })) composite(bitmap.get(), D2D1_COMPOSITE_MODE_DESTINATION_IN);
        }
        if (spec.border && spec.border->image.Drawable())
        {
            auto bitmap = TargetBitmap(ctx, pw, ph);
            if (bitmap)
            {
                ctx->SetTarget(bitmap.get());
                ctx->SetTransform(D2D1::Matrix3x2F::Identity());
                ctx->Clear(D2D1::ColorF(0, 0, 0, 0));
                DrawNine(ctx, *spec.border, boxes, { -pad, -pad }, scale);
                winrt::com_ptr<ID2D1Image> image = bitmap;
                if (spec.border->luminance) if (auto lum = Luminance(ctx, bitmap.get())) image = lum;
                composite(image.get(), D2D1_COMPOSITE_MODE_DESTINATION_IN);
            }
        }
        ctx->SetTarget(surface.get());
        ctx->SetTransform(surfaceTransform);
        ctx->DrawImage(mask.get(), D2D1_INTERPOLATION_MODE_NEAREST_NEIGHBOR, D2D1_COMPOSITE_MODE_SOURCE_COPY);
    }

    // ---- Per-element state ---------------------------------------------------------------------

    // An image background: background-color under the image layers, which a XAML Panel can't do
    // with its single Background brush. `layers` reuses the mask layer spec.
    inline void PaintBackground(ID2D1DeviceContext* ctx, Spec const& spec, uint32_t color, uint32_t textColor, Boxes const& boxes, float scale)
    {
        D2D1_MATRIX_3X2_F transform;
        ctx->GetTransform(&transform);
        ctx->SetTransform(D2D1::Matrix3x2F::Scale(scale, scale) * transform);
        if ((color >> 24) != 0)
        {
            winrt::com_ptr<ID2D1SolidColorBrush> brush;
            ctx->CreateSolidColorBrush(ColorOf(color), brush.put());
            ctx->FillRectangle(boxes.Get(spec.layers.empty() ? BorderBox : spec.layers.back().clip), brush.get());
        }
        for (size_t n = spec.layers.size(); n-- > 0;)
        {
            if (spec.layers[n].image.Drawable()) DrawLayer(ctx, spec.layers[n], boxes, scale, textColor);
        }
        ctx->SetTransform(transform);
    }

    struct Entry
    {
        winrt::weak_ref<mux::UIElement> element;
        std::shared_ptr<Spec> background;
        mucomp::CompositionSurfaceBrush backgroundBrush{ nullptr };
        std::string backgroundKey;
        Boxes backgroundBoxes;
        uint32_t backgroundColor{ 0 };
        uint32_t backgroundTextColor{ 0 };
        float backgroundScale{ 0.0f };
        std::shared_ptr<Spec> mask;
        std::shared_ptr<NineSlice> borderImage;
        // The mask surface, its brush and what it was last drawn for.
        mucomp::CompositionSurfaceBrush maskBrush{ nullptr };
        std::string maskKey;
        Boxes maskBoxes;
        float maskPad{ -1.0f }, maskScale{ 0.0f };
        // The border-image layer.
        mucomp::SpriteVisual borderSprite{ nullptr };
        std::string borderKey;
        Boxes borderBoxes;
        float borderScale{ 0.0f };
        uint32_t borderTextColor{ 0 };
    };

    inline std::unordered_map<void*, Entry>& Registry()
    {
        thread_local auto* registry = new std::unordered_map<void*, Entry>();
        return *registry;
    }

    inline void* KeyOf(mux::UIElement const& element)
    {
        return winrt::get_abi(element.as<wf::IUnknown>());
    }

    inline Entry* Find(mux::UIElement const& element)
    {
        auto& registry = Registry();
        if (registry.empty() || !element) return nullptr;
        auto it = registry.find(KeyOf(element));
        if (it == registry.end()) return nullptr;
        if (it->second.element.get() != element)
        {
            registry.erase(it);
            return nullptr;
        }
        return &it->second;
    }

    inline Entry& Ensure(mux::UIElement const& element)
    {
        if (auto* entry = Find(element)) return *entry;
        auto& entry = Registry()[KeyOf(element)];
        entry.element = winrt::make_weak(element);
        return entry;
    }

    inline bool HasMask(mux::UIElement const& element)
    {
        auto* entry = Find(element);
        return entry && entry->mask && entry->mask->Any();
    }

    inline bool HasBorderImage(mux::UIElement const& element)
    {
        auto* entry = Find(element);
        return entry && entry->borderImage && entry->borderImage->image.Drawable();
    }

    inline float ScaleOf(mux::UIElement const& element)
    {
        auto root = element.XamlRoot();
        const float scale = root ? static_cast<float>(root.RasterizationScale()) : 1.0f;
        return scale > 0.0f ? scale : 1.0f;
    }

    // The element's border and padding from its Mason layout.
    template <typename Node>
    inline Boxes BoxesOf(Node const& node, float width, float height)
    {
        Boxes boxes;
        boxes.width = width;
        boxes.height = height;
        if (!node) return boxes;
        if (auto layout = node.GetLayout())
        {
            boxes.border[0] = layout.BorderTop(); boxes.border[1] = layout.BorderRight();
            boxes.border[2] = layout.BorderBottom(); boxes.border[3] = layout.BorderLeft();
            boxes.padding[0] = layout.PaddingTop(); boxes.padding[1] = layout.PaddingRight();
            boxes.padding[2] = layout.PaddingBottom(); boxes.padding[3] = layout.PaddingLeft();
            boxes.margin[0] = layout.MarginTop(); boxes.margin[1] = layout.MarginRight();
            boxes.margin[2] = layout.MarginBottom(); boxes.margin[3] = layout.MarginLeft();
        }
        return boxes;
    }

    // A per-element painted surface in the device's registry (so a device loss redraws it),
    // created, resized and drawn as needed. Null if it couldn't be drawn.
    inline mucomp::CompositionSurfaceBrush PaintSurface(std::string const& key, float w, float h,
        std::function<void(ID2D1DeviceContext*, float, float)> paint)
    {
        auto comp = mason_deco::ThreadCompositor();
        auto* device = comp ? mason_mask::DeviceFor(comp) : nullptr;
        if (!device || w <= 0.0f || h <= 0.0f || w > 16384.0f || h > 16384.0f) return nullptr;
        auto& painted = device->painted[key];
        painted.paint = std::move(paint);
        if (!painted.surface)
        {
            painted.surface = device->graphics.CreateDrawingSurface({ w, h },
                winrt::Microsoft::Graphics::DirectX::DirectXPixelFormat::B8G8R8A8UIntNormalized,
                winrt::Microsoft::Graphics::DirectX::DirectXAlphaMode::Premultiplied);
        }
        else if (painted.surface.Size().Width != w || painted.surface.Size().Height != h)
        {
            painted.surface.Resize({ static_cast<int32_t>(w), static_cast<int32_t>(h) });
        }
        if (!mason_mask::Draw(painted) && !(mason_mask::ReplaceRenderingDevice(*device) && mason_mask::Draw(painted))) return nullptr;
        if (!painted.brush)
        {
            painted.brush = device->compositor.CreateSurfaceBrush(painted.surface);
            painted.brush.Stretch(mucomp::CompositionStretch::Fill);
        }
        return painted.brush;
    }

    inline void ReleaseSurface(std::string const& key)
    {
        if (key.empty()) return;
        if (auto comp = mason_deco::ThreadCompositor())
        {
            if (auto* device = mason_mask::DeviceFor(comp)) device->painted.erase(key);
        }
    }

    inline std::string SurfaceKey(char const* kind, Entry const& entry)
    {
        auto element = entry.element.get();
        return std::string(kind) + ":" + std::to_string(reinterpret_cast<uintptr_t>(element ? KeyOf(element) : nullptr));
    }

    // (Re)paints the entry's mask surface for the given geometry; false if it couldn't.
    inline bool Repaint(Entry& entry, Boxes const& boxes, float pad, float scale)
    {
        if (!entry.mask) return false;
        auto spec = entry.mask;
        const std::string key = SurfaceKey("cssmask", entry);
        auto brush = PaintSurface(key, std::ceil((boxes.width + 2.0f * pad) * scale), std::ceil((boxes.height + 2.0f * pad) * scale),
            [spec, boxes, pad, scale](ID2D1DeviceContext* ctx, float, float) { PaintMask(ctx, *spec, boxes, pad, scale); });
        if (!brush) return false;
        entry.maskBrush = brush;
        entry.maskKey = key;
        entry.maskBoxes = boxes;
        entry.maskPad = pad;
        entry.maskScale = scale;
        return true;
    }

    // The brush FilterEffects masks the element with, sized (width + 2 pad) x (height + 2 pad).
    template <typename Node>
    inline mucomp::CompositionBrush MaskBrush(mux::UIElement const& element, Node const& node, float width, float height, float pad)
    {
        auto* entry = Find(element);
        if (!entry || !entry->mask || !entry->mask->Any()) return nullptr;
        const Boxes boxes = BoxesOf(node, width, height);
        const float scale = ScaleOf(element);
        if (!entry->maskBrush || !(entry->maskBoxes == boxes) || entry->maskPad != pad || entry->maskScale != scale)
        {
            if (!Repaint(*entry, boxes, pad, scale)) return nullptr;
        }
        return entry->maskBrush;
    }

    inline void Release(Entry& entry)
    {
        if (entry.maskKey.empty()) return;
        ReleaseSurface(entry.maskKey);
        entry.maskBrush = nullptr;
        entry.maskKey.clear();
        entry.maskPad = -1.0f;
    }

    // Returns true when the element needs its effect sprite rebuilt (the mask came or went, or has
    // never been drawn); otherwise the new mask was painted in place.
    inline bool SetMask(mux::UIElement const& element, std::shared_ptr<Spec> spec)
    {
        if (!element) return false;
        const bool any = spec && spec->Any();
        auto* existing = Find(element);
        if (!any)
        {
            if (!existing || !existing->mask) return false;
            existing->mask = nullptr;
            Release(*existing);
            return true;
        }
        auto& entry = Ensure(element);
        const bool had = entry.mask != nullptr;
        entry.mask = std::move(spec);
        if (!had || !entry.maskBrush || entry.maskPad < 0.0f) return true;
        const auto brush = entry.maskBrush;
        return !Repaint(entry, entry.maskBoxes, entry.maskPad, entry.maskScale) || entry.maskBrush != brush;
    }

    inline void SetBorderImage(mux::UIElement const& element, std::shared_ptr<NineSlice> nine)
    {
        if (!element) return;
        if (!nine || !nine->image.Drawable())
        {
            if (auto* entry = Find(element)) entry->borderImage = nullptr;
            return;
        }
        auto& entry = Ensure(element);
        entry.borderImage = std::move(nine);
        entry.borderKey.clear();
    }

    // Draws (or removes) the border-image layer for the element's current size.
    template <typename Node>
    inline void SyncBorderImage(mux::UIElement const& element, Node const& node, float width, float height, uint32_t textColor)
    {
        auto* entry = Find(element);
        if (!entry) return;
        static const winrt::hstring tag{ L"mason-border-image" };
        if (!entry->borderImage || width <= 0.0f || height <= 0.0f)
        {
            if (entry->borderSprite) mason_deco::SetLayer(element, tag, nullptr);
            entry->borderSprite = nullptr;
            entry->borderKey.clear();
            return;
        }
        const Boxes boxes = BoxesOf(node, width, height);
        const float scale = ScaleOf(element);
        if (entry->borderSprite && !entry->borderKey.empty() && entry->borderBoxes == boxes && entry->borderScale == scale
            && entry->borderTextColor == textColor) return;
        auto comp = mason_deco::ThreadCompositor();
        if (!comp) return;
        auto nine = entry->borderImage;
        float none[4]{};
        const NineLayout layout = LayoutNine(*nine, boxes, {}, none);
        const D2D1_RECT_F area = layout.area;
        const std::string key = SurfaceKey("cssborderimage", *entry);
        auto brush = PaintSurface(key, std::ceil((area.right - area.left) * scale), std::ceil((area.bottom - area.top) * scale),
            [nine, boxes, area, scale, textColor](ID2D1DeviceContext* ctx, float, float) { DrawNine(ctx, *nine, boxes, { area.left, area.top }, scale, textColor); });
        if (!brush) return;
        if (!entry->borderSprite)
        {
            entry->borderSprite = comp.CreateSpriteVisual();
            mason_deco::SetLayer(element, tag, entry->borderSprite);
        }
        entry->borderSprite.Brush(brush);
        entry->borderSprite.Offset({ area.left, area.top, 0.0f });
        entry->borderSprite.Size({ area.right - area.left, area.bottom - area.top });
        entry->borderKey = key;
        entry->borderBoxes = boxes;
        entry->borderScale = scale;
        entry->borderTextColor = textColor;
    }

    inline bool HasBackground(mux::UIElement const& element)
    {
        auto* entry = Find(element);
        return entry && entry->background && entry->background->HasLayers();
    }

    inline void SetBackground(mux::UIElement const& element, std::shared_ptr<Spec> spec)
    {
        if (!element) return;
        if (!spec || !spec->HasLayers())
        {
            auto* entry = Find(element);
            if (!entry || !entry->background) return;
            entry->background = nullptr;
            ReleaseSurface(entry->backgroundKey);
            entry->backgroundBrush = nullptr;
            entry->backgroundKey.clear();
            return;
        }
        auto& entry = Ensure(element);
        entry.background = std::move(spec);
        entry.backgroundBrush = nullptr;
    }

    // The painted background (colour under the image layers) for the element's current size.
    template <typename Node>
    inline mucomp::CompositionBrush BackgroundBrush(mux::UIElement const& element, Node const& node, float width, float height, uint32_t color, uint32_t textColor, float scale)
    {
        auto* entry = Find(element);
        if (!entry || !entry->background || width <= 0.0f || height <= 0.0f) return nullptr;
        const Boxes boxes = BoxesOf(node, width, height);
        if (entry->backgroundBrush && entry->backgroundBoxes == boxes && entry->backgroundColor == color && entry->backgroundTextColor == textColor
            && entry->backgroundScale == scale)
        {
            return entry->backgroundBrush;
        }
        auto spec = entry->background;
        const std::string key = SurfaceKey("cssbackground", *entry);
        auto brush = PaintSurface(key, std::ceil(width * scale), std::ceil(height * scale),
            [spec, color, textColor, boxes, scale](ID2D1DeviceContext* ctx, float, float) { PaintBackground(ctx, *spec, color, textColor, boxes, scale); });
        if (!brush) return nullptr;
        entry->backgroundBrush = brush;
        entry->backgroundKey = key;
        entry->backgroundBoxes = boxes;
        entry->backgroundColor = color;
        entry->backgroundTextColor = textColor;
        entry->backgroundScale = scale;
        return brush;
    }

    // Whether the element's clip-path leaves out a point (DIPs in the element), so a tap there
    // goes to whatever is under it.
    template <typename Node>
    inline bool ClipExcludes(mux::UIElement const& element, Node const& node, float width, float height, float x, float y)
    {
        auto* entry = Find(element);
        if (!entry || !entry->mask || !entry->mask->clip) return false;
        return !ClipContains(*entry->mask->clip, BoxesOf(node, width, height), x, y);
    }

    // Whether the element paints an SVG that uses currentColor (a background or border-image).
    inline bool UsesCurrentColor(mux::UIElement const& element)
    {
        auto* entry = Find(element);
        if (!entry) return false;
        if (entry->borderImage && entry->borderImage->image.currentColor) return true;
        return entry->background && std::any_of(entry->background->layers.begin(), entry->background->layers.end(),
            [](Layer const& l) { return l.image.currentColor; });
    }
}
