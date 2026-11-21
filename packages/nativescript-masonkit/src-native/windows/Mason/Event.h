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
        int32_t PointerId() const noexcept { return pointerId; }
        hstring PointerType() const { return pointerType; }
        bool IsPrimary() const noexcept { return isPrimary; }
        double ClientX() const noexcept { return clientX; }
        double ClientY() const noexcept { return clientY; }
        double OffsetX() const noexcept { return offsetX; }
        double OffsetY() const noexcept { return offsetY; }
        double MovementX() const noexcept { return movementX; }
        double MovementY() const noexcept { return movementY; }
        int32_t Button() const noexcept { return button; }
        int32_t Buttons() const noexcept { return buttons; }
        double Pressure() const noexcept { return pressure; }
        double Width() const noexcept { return width; }
        double Height() const noexcept { return height; }
        double TiltX() const noexcept { return tiltX; }
        double TiltY() const noexcept { return tiltY; }
        double Twist() const noexcept { return twist; }
        winrt::Windows::Foundation::IInspectable RelatedTarget() const { return relatedTarget; }

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
        int32_t pointerId{ 0 };
        hstring pointerType;
        bool isPrimary{ false };
        double clientX{ 0.0 };
        double clientY{ 0.0 };
        double offsetX{ 0.0 };
        double offsetY{ 0.0 };
        double movementX{ 0.0 };
        double movementY{ 0.0 };
        int32_t button{ -1 };
        int32_t buttons{ 0 };
        double pressure{ 0.0 };
        double width{ 1.0 };
        double height{ 1.0 };
        double tiltX{ 0.0 };
        double tiltY{ 0.0 };
        double twist{ 0.0 };
        winrt::Windows::Foundation::IInspectable relatedTarget{ nullptr };
    };
}
