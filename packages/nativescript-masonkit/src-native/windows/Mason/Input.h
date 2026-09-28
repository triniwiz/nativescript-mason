#pragma once
#include "Input.g.h"
#include "Invalidation.h"
#include "VisualState.h"
#include <vector>

namespace winrt::NativeScript::Mason::implementation
{
    struct Input : InputT<Input>
    {
        Input();

        winrt::NativeScript::Mason::Node Node() const { return m_node; }
        winrt::NativeScript::Mason::Style Style() const { return m_node.Style(); }

        void SyncStyle(winrt::hstring const&, winrt::hstring const&)
        {
            m_visual.styleDirty = true;
            mason_leaf::StyleChanged(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node);
        }

        int32_t Type() const noexcept { return m_type; }
        void Type(int32_t value);
        hstring Value() const;
        void Value(hstring const& value);
        hstring Placeholder() const { return m_placeholder; }
        void Placeholder(hstring const& value);
        bool Multiple() const noexcept { return m_multiple; }
        void Multiple(bool value) { m_multiple = value; }
        hstring Accept() const { return m_accept; }
        void Accept(hstring const& value) { m_accept = value; }

        int64_t AddEventListener(hstring const& type, winrt::NativeScript::Mason::EventListener const& listener);
        bool RemoveEventListener(hstring const& type, int64_t id);

        winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size const& available);
        winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size const& finalSize);

    private:
        void Rebuild();
        void ApplyValue(hstring const& value);
        void ApplyPlaceholder(hstring const& value);
        void Listen();
        bool Dispatch(winrt::NativeScript::Mason::Event const& e);
        void Commit();

        winrt::NativeScript::Mason::Node m_node{ nullptr };
        mason_visual::AppliedState m_visual;
        winrt::Microsoft::UI::Xaml::FrameworkElement m_control{ nullptr };
        int32_t m_type{ 0 };
        hstring m_value;
        hstring m_placeholder;
        bool m_multiple{ false };
        hstring m_accept;

        struct Listener { hstring type; int64_t id; winrt::NativeScript::Mason::EventListener fn; };
        std::vector<Listener> m_listeners;
        int64_t m_nextId{ 1 };
        // Set while code writes the value, whose changes aren't user input.
        bool m_applying{ false };
        // The value `input` last reported, and the one `change` last committed.
        hstring m_reported;
        hstring m_committed;
        // What the pending edit inserts, from beforeinput.
        hstring m_pendingData;
        hstring m_pendingType;
    };
}

namespace winrt::NativeScript::Mason::factory_implementation
{
    struct Input : InputT<Input, implementation::Input>
    {
    };
}
