#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cwchar>
#include <string>
#include <unordered_map>
#include <vector>
#include <windows.graphics.effects.interop.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Graphics.Effects.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Composition.h>
#include "Decoration.h"

namespace mason_filter
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace mucomp = winrt::Microsoft::UI::Composition;
    namespace wf = winrt::Windows::Foundation;
    namespace wge = winrt::Windows::Graphics::Effects;
    namespace abi = ABI::Windows::Graphics::Effects;

    inline constexpr GUID kGaussianBlur = { 0x1feb6d69, 0x2fe6, 0x4ac9, { 0x8c, 0x58, 0x1d, 0x7f, 0x93, 0xe7, 0xa6, 0xa5 } };
    inline constexpr GUID kColorMatrix = { 0x921f03d6, 0x641c, 0x47df, { 0x85, 0x2d, 0xb4, 0xbb, 0x61, 0x53, 0xae, 0x11 } };
    inline constexpr GUID kComposite = { 0x48fc9f51, 0xf6ac, 0x48f1, { 0x8b, 0x58, 0x3b, 0x28, 0xac, 0x46, 0xf7, 0x6d } };
    inline constexpr GUID kAffineTransform = { 0x6aa97485, 0x6354, 0x4cfc, { 0x90, 0x8c, 0xe4, 0xa7, 0x4f, 0x62, 0xc9, 0x6c } };

    struct Effect : winrt::implements<Effect, wge::IGraphicsEffect, wge::IGraphicsEffectSource, abi::IGraphicsEffectD2D1Interop>
    {
        GUID id{};
        std::vector<wf::IPropertyValue> properties;
        std::vector<wge::IGraphicsEffectSource> sources;
        winrt::hstring name;

        winrt::hstring Name() const { return name; }
        void Name(winrt::hstring const& value) { name = value; }

        HRESULT __stdcall GetEffectId(GUID* out) noexcept override
        {
            *out = id;
            return S_OK;
        }

        HRESULT __stdcall GetNamedPropertyMapping(LPCWSTR, UINT*, abi::GRAPHICS_EFFECT_PROPERTY_MAPPING*) noexcept override
        {
            return E_INVALIDARG;
        }

        HRESULT __stdcall GetPropertyCount(UINT* count) noexcept override
        {
            *count = static_cast<UINT>(properties.size());
            return S_OK;
        }

        HRESULT __stdcall GetProperty(UINT index, ABI::Windows::Foundation::IPropertyValue** value) noexcept override
        {
            if (index >= properties.size()) return E_INVALIDARG;
            wf::IPropertyValue copy = properties[index];
            *value = static_cast<ABI::Windows::Foundation::IPropertyValue*>(winrt::detach_abi(copy));
            return S_OK;
        }

        HRESULT __stdcall GetSource(UINT index, abi::IGraphicsEffectSource** source) noexcept override
        {
            if (index >= sources.size()) return E_INVALIDARG;
            wge::IGraphicsEffectSource copy = sources[index];
            *source = static_cast<abi::IGraphicsEffectSource*>(winrt::detach_abi(copy));
            return S_OK;
        }

        HRESULT __stdcall GetSourceCount(UINT* count) noexcept override
        {
            *count = static_cast<UINT>(sources.size());
            return S_OK;
        }
    };

    inline wf::IPropertyValue Float(float v) { return wf::PropertyValue::CreateSingle(v).as<wf::IPropertyValue>(); }
    inline wf::IPropertyValue UInt(uint32_t v) { return wf::PropertyValue::CreateUInt32(v).as<wf::IPropertyValue>(); }
    inline wf::IPropertyValue Bool(bool v) { return wf::PropertyValue::CreateBoolean(v).as<wf::IPropertyValue>(); }
    inline wf::IPropertyValue Floats(std::vector<float> const& v) { return wf::PropertyValue::CreateSingleArray(v).as<wf::IPropertyValue>(); }

    inline wge::IGraphicsEffectSource Make(GUID const& id, std::vector<wf::IPropertyValue> properties, std::vector<wge::IGraphicsEffectSource> sources)
    {
        auto effect = winrt::make_self<Effect>();
        effect->id = id;
        effect->properties = std::move(properties);
        effect->sources = std::move(sources);
        return effect.as<wge::IGraphicsEffectSource>();
    }

    inline wge::IGraphicsEffectSource Blur(wge::IGraphicsEffectSource const& input, float sigma, bool hard)
    {
        return Make(kGaussianBlur, { Float(sigma), UInt(1), UInt(hard ? 1 : 0) }, { input });
    }

    inline wge::IGraphicsEffectSource Matrix(wge::IGraphicsEffectSource const& input, std::array<float, 20> const& rows)
    {
        std::vector<float> d2d(20);
        for (int i = 0; i < 5; ++i)
        {
            for (int j = 0; j < 4; ++j) d2d[i * 4 + j] = rows[j * 5 + i];
        }
        return Make(kColorMatrix, { Floats(d2d), UInt(1), Bool(false) }, { input });
    }

    inline wge::IGraphicsEffectSource Over(std::vector<wge::IGraphicsEffectSource> layers)
    {
        return Make(kComposite, { UInt(0) }, std::move(layers));
    }

    inline wge::IGraphicsEffectSource Translate(wge::IGraphicsEffectSource const& input, float x, float y)
    {
        return Make(kAffineTransform, { UInt(1), UInt(0), Floats({ 1.0f, 0.0f, 0.0f, 1.0f, x, y }), Float(1.0f) }, { input });
    }

    inline std::vector<float> Numbers(std::wstring_view part)
    {
        std::vector<float> out;
        std::wstring text(part);
        const wchar_t* cursor = text.c_str();
        while (*cursor)
        {
            wchar_t* end = nullptr;
            const float v = std::wcstof(cursor, &end);
            if (end == cursor) break;
            out.push_back(v);
            cursor = end;
            if (*cursor == L',') ++cursor;
        }
        return out;
    }

    inline float Bleed(std::wstring_view spec)
    {
        float bleed = 0.0f;
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t end = spec.find(L';', pos);
            if (end == std::wstring_view::npos) end = spec.size();
            const auto part = spec.substr(pos, end - pos);
            pos = end + 1;
            if (part.size() < 2) continue;
            const auto n = Numbers(part.substr(2));
            if (part[0] == L'b' && n.size() == 1) bleed += 3.0f * n[0];
            else if (part[0] == L'd' && n.size() == 4) bleed += 3.0f * n[2] + (std::max)(std::abs(n[0]), std::abs(n[1]));
        }
        return bleed;
    }

    inline wge::IGraphicsEffectSource Chain(wge::IGraphicsEffectSource input, std::wstring_view spec, bool hard)
    {
        size_t pos = 0;
        while (pos < spec.size())
        {
            size_t end = spec.find(L';', pos);
            if (end == std::wstring_view::npos) end = spec.size();
            const auto part = spec.substr(pos, end - pos);
            pos = end + 1;
            if (part.size() < 2) continue;
            const auto n = Numbers(part.substr(2));
            if (part[0] == L'm' && n.size() == 20)
            {
                std::array<float, 20> rows{};
                std::copy(n.begin(), n.end(), rows.begin());
                input = Matrix(input, rows);
            }
            else if (part[0] == L'b' && n.size() == 1 && n[0] > 0.0f)
            {
                input = Blur(input, n[0], hard);
            }
            else if (part[0] == L'd' && n.size() == 4)
            {
                const uint32_t argb = static_cast<uint32_t>(static_cast<double>(n[3]));
                const float a = ((argb >> 24) & 0xFF) / 255.0f, r = ((argb >> 16) & 0xFF) / 255.0f;
                const float g = ((argb >> 8) & 0xFF) / 255.0f, b = (argb & 0xFF) / 255.0f;
                std::array<float, 20> tint{ 0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, a, 0 };
                auto shadow = Matrix(input, tint);
                if (n[2] > 0.0f) shadow = Blur(shadow, n[2], false);
                shadow = Translate(shadow, n[0], n[1]);
                input = Over({ shadow, input });
            }
        }
        return input;
    }

    inline mucomp::CompositionEffectFactory Factory(mucomp::Compositor const& comp, std::wstring const& key, wge::IGraphicsEffect const& graph)
    {
        thread_local auto* factories = new std::unordered_map<std::wstring, mucomp::CompositionEffectFactory>();
        auto it = factories->find(key);
        if (it != factories->end()) return it->second;
        if (factories->size() > 256) factories->clear();
        mucomp::CompositionEffectFactory factory{ nullptr };
        try
        {
            factory = comp.CreateEffectFactory(graph);
        }
        catch (winrt::hresult_error const&)
        {
        }
        factories->emplace(key, factory);
        return factory;
    }

    inline mucomp::CompositionBrush Brush(mucomp::Compositor const& comp, std::wstring_view spec, bool hard, mucomp::CompositionBrush const& source,
        mucomp::CompositionBrush const& over)
    {
        if (!comp || !source) return nullptr;
        auto graph = Chain(mucomp::CompositionEffectSourceParameter(L"source"), spec, hard);
        if (over) graph = Over({ graph, mucomp::CompositionEffectSourceParameter(L"over") });
        std::wstring key(spec);
        key += hard ? L"|h" : L"|s";
        if (over) key += L"|o";
        auto factory = Factory(comp, key, graph.as<wge::IGraphicsEffect>());
        if (!factory) return nullptr;
        auto brush = factory.CreateBrush();
        brush.SetSourceParameter(L"source", source);
        if (over) brush.SetSourceParameter(L"over", over);
        return brush;
    }

    struct Entry
    {
        winrt::weak_ref<mux::UIElement> element;
        std::wstring filter;
        std::wstring backdrop;
        uint64_t version{ 0 };
        winrt::weak_ref<mux::UIElement> host;
        bool hidden{ false };
        bool hooked{ false };
    };

    inline uint64_t NextVersion()
    {
        static uint64_t next = 1;
        return next++;
    }

    inline std::unordered_map<void*, Entry>& Registry()
    {
        thread_local auto* registry = new std::unordered_map<void*, Entry>();
        return *registry;
    }

    inline Entry* Find(mux::UIElement const& element)
    {
        auto& registry = Registry();
        if (registry.empty() || !element) return nullptr;
        auto it = registry.find(winrt::get_abi(element.as<wf::IUnknown>()));
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
        auto* entry = Find(element);
        return entry ? entry->version : 0;
    }

    inline void Set(mux::UIElement const& element, bool backdrop, std::wstring_view spec)
    {
        if (!element) return;
        auto* entry = Find(element);
        if (!entry)
        {
            if (spec.empty()) return;
            auto& registry = Registry();
            entry = &registry[winrt::get_abi(element.as<wf::IUnknown>())];
            entry->element = winrt::make_weak(element);
        }
        auto& target = backdrop ? entry->backdrop : entry->filter;
        if (target == spec) return;
        target = spec;
        entry->version = NextVersion();
    }

    inline winrt::hstring TagOf(mux::UIElement const& element)
    {
        return winrt::hstring{ L"mason-filter-" + std::to_wstring(reinterpret_cast<uintptr_t>(winrt::get_abi(element.as<wf::IUnknown>()))) };
    }

    inline void Unshow(Entry& entry, mux::UIElement const& element)
    {
        if (auto host = entry.host.get()) mason_deco::SetLayer(host, TagOf(element), nullptr);
        entry.host = nullptr;
        if (!entry.hidden) return;
        entry.hidden = false;
        if (auto visual = mux::Hosting::ElementCompositionPreview::GetElementVisual(element)) visual.Opacity(1.0f);
    }

    inline void Sync(mux::UIElement const& element, float width, float height)
    {
        auto* entry = Find(element);
        if (!entry) return;
        if (entry->filter.empty() || width <= 0.0f || height <= 0.0f)
        {
            Unshow(*entry, element);
            return;
        }
        auto parent = mux::Media::VisualTreeHelper::GetParent(element).try_as<mux::UIElement>();
        auto comp = mason_deco::ThreadCompositor();
        auto source = mux::Hosting::ElementCompositionPreview::GetElementVisual(element);
        if (!parent || !comp || !source) return;
        const auto tag = TagOf(element);
        if (auto host = entry->host.get(); host && host != parent) mason_deco::SetLayer(host, tag, nullptr);
        if (!entry->hooked)
        {
            if (auto fe = element.try_as<mux::FrameworkElement>())
            {
                entry->hooked = true;
                fe.Unloaded([](wf::IInspectable const& sender, mux::RoutedEventArgs const&)
                {
                    auto unloaded = sender.try_as<mux::UIElement>();
                    if (auto* e = Find(unloaded))
                    {
                        Unshow(*e, unloaded);
                        e->version = NextVersion();
                    }
                });
            }
        }

        const float pad = std::ceil(Bleed(entry->filter));
        const winrt::Windows::Foundation::Numerics::float2 size{ width + 2.0f * pad, height + 2.0f * pad };
        auto surface = comp.CreateVisualSurface();
        surface.SourceVisual(source);
        surface.SourceOffset({ -pad, -pad });
        surface.SourceSize(size);
        auto surfaceBrush = comp.CreateSurfaceBrush(surface);
        surfaceBrush.Stretch(mucomp::CompositionStretch::None);
        auto brush = Brush(comp, entry->filter, false, surfaceBrush, nullptr);
        if (!brush) return;

        auto sprite = comp.CreateSpriteVisual();
        sprite.Size(size);
        sprite.Brush(brush);
        auto follow = comp.CreateExpressionAnimation(L"src.Offset + Vector3(-pad, -pad, 0)");
        follow.SetReferenceParameter(L"src", source);
        follow.SetScalarParameter(L"pad", pad);
        sprite.StartAnimation(L"Offset", follow);
        mason_deco::SetLayer(parent, tag, sprite);
        source.Opacity(0.0f);
        entry->hidden = true;
        entry->host = winrt::make_weak(parent);
    }
}
