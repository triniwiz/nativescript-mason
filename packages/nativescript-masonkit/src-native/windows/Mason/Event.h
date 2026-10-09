#pragma once
#include "Event.g.h"
#include <windows.h>

namespace winrt::NativeScript::Mason::implementation
{
    struct Event : EventT<Event>
    {
        Event(hstring type, bool cancelable) : type(std::move(type)), cancelable(cancelable), timeStamp(static_cast<double>(GetTickCount64())) {}

        hstring Type() const { return type; }
        bool Bubbles() const noexcept { return bubbles; }
        bool Cancelable() const noexcept { return cancelable; }
        bool IsComposing() const noexcept { return isComposing; }
        double TimeStamp() const noexcept { return timeStamp; }
        bool DefaultPrevented() const noexcept { return defaultPrevented; }
        bool PropagationStopped() const noexcept { return propagationStopped; }
        bool ImmediatePropagationStopped() const noexcept { return immediatePropagationStopped; }
        hstring Data() const { return data; }
        hstring InputType() const { return inputType; }
        winrt::Windows::Foundation::Collections::IVectorView<hstring> Files() const
        {
            return files.empty() ? nullptr : winrt::single_threaded_vector<hstring>(std::vector<hstring>(files)).GetView();
        }
        hstring Key() const { return key; }
        bool Repeat() const noexcept { return repeat; }
        bool CtrlKey() const noexcept { return ctrlKey; }
        bool ShiftKey() const noexcept { return shiftKey; }
        bool AltKey() const noexcept { return altKey; }
        bool MetaKey() const noexcept { return metaKey; }
        winrt::Windows::Foundation::IInspectable Target() const { return target; }

        void PreventDefault() noexcept { if (cancelable) defaultPrevented = true; }
        void StopPropagation() noexcept { propagationStopped = true; }
        void StopImmediatePropagation() noexcept { immediatePropagationStopped = propagationStopped = true; }

        hstring type;
        bool bubbles{ true };
        bool cancelable{ false };
        bool isComposing{ false };
        double timeStamp{ 0.0 };
        bool defaultPrevented{ false };
        bool propagationStopped{ false };
        bool immediatePropagationStopped{ false };
        hstring data;
        hstring inputType;
        std::vector<hstring> files;
        hstring key;
        bool repeat{ false };
        bool ctrlKey{ false };
        bool shiftKey{ false };
        bool altKey{ false };
        bool metaKey{ false };
        winrt::Windows::Foundation::IInspectable target{ nullptr };
    };
}
