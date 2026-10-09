#pragma once
#include <functional>
#include <memory>
#include <string>
#include <string_view>
#include <windows.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <winrt/Windows.System.h>
#include "Event.h"
#include "Events.h"

namespace mason_form
{
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
    using EventPtr = winrt::com_ptr<winrt::NativeScript::Mason::implementation::Event>;

    inline bool Down(int vk) { return (GetKeyState(vk) & 0x8000) != 0; }

    inline winrt::hstring KeyName(int32_t vk, uint32_t scanCode)
    {
        switch (vk)
        {
        case VK_RETURN: return L"Enter";
        case VK_ESCAPE: return L"Escape";
        case VK_TAB: return L"Tab";
        case VK_BACK: return L"Backspace";
        case VK_DELETE: return L"Delete";
        case VK_INSERT: return L"Insert";
        case VK_LEFT: return L"ArrowLeft";
        case VK_RIGHT: return L"ArrowRight";
        case VK_UP: return L"ArrowUp";
        case VK_DOWN: return L"ArrowDown";
        case VK_HOME: return L"Home";
        case VK_END: return L"End";
        case VK_PRIOR: return L"PageUp";
        case VK_NEXT: return L"PageDown";
        case VK_SHIFT: case VK_LSHIFT: case VK_RSHIFT: return L"Shift";
        case VK_CONTROL: case VK_LCONTROL: case VK_RCONTROL: return L"Control";
        case VK_MENU: case VK_LMENU: case VK_RMENU: return L"Alt";
        case VK_LWIN: case VK_RWIN: return L"Meta";
        case VK_CAPITAL: return L"CapsLock";
        case VK_NUMLOCK: return L"NumLock";
        default: break;
        }
        if (vk >= VK_F1 && vk <= VK_F24) return L"F" + winrt::to_hstring(vk - VK_F1 + 1);
        BYTE state[256]{};
        if (!GetKeyboardState(state)) return L"Unidentified";
        if (!(state[VK_MENU] & 0x80)) state[VK_CONTROL] = state[VK_LCONTROL] = state[VK_RCONTROL] = 0;
        wchar_t text[8]{};
        const int n = ToUnicodeEx(static_cast<UINT>(vk), scanCode, state, text, 8, 0x4, GetKeyboardLayout(0));
        if (n < 0) return L"Dead";
        return n > 0 ? winrt::hstring(text, static_cast<uint32_t>(n)) : winrt::hstring(L"Unidentified");
    }

    inline void DescribeEdit(std::wstring_view before, std::wstring_view after, winrt::hstring& data, winrt::hstring& inputType)
    {
        size_t start = 0;
        while (start < before.size() && start < after.size() && before[start] == after[start]) ++start;
        size_t end = 0;
        while (end < before.size() - start && end < after.size() - start && before[before.size() - 1 - end] == after[after.size() - 1 - end]) ++end;
        const auto inserted = after.substr(start, after.size() - start - end);
        data = winrt::hstring(inserted);
        if (inserted.empty() && before.size() > after.size()) inputType = L"deleteContentBackward";
        else if (inserted.find(L'\r') != std::wstring_view::npos || inserted.find(L'\n') != std::wstring_view::npos) inputType = inserted.size() == 1 ? L"insertLineBreak" : L"insertText";
        else inputType = L"insertText";
    }

    struct Events : std::enable_shared_from_this<Events>
    {
        std::function<winrt::hstring()> value;
        winrt::weak_ref<mux::FrameworkElement> control;
        bool applying{ false };
        winrt::hstring reported;
        winrt::hstring committed;
        winrt::hstring pendingData;
        winrt::hstring pendingType;

        winrt::hstring Current() const { return value ? value() : winrt::hstring{}; }

        bool Dispatch(EventPtr const& e, bool bubbles)
        {
            auto hosted = control.get();
            auto target = hosted ? hosted.Parent() : nullptr;
            return target ? mason_events::DispatchEvent(target, e, bubbles) : true;
        }

        void Commit()
        {
            const winrt::hstring current = Current();
            if (current == committed) return;
            committed = current;
            Dispatch(winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"change", false), true);
        }

        void Edited(winrt::hstring const& fallbackType)
        {
            if (applying) return;
            const winrt::hstring current = Current();
            if (current == reported) return;
            reported = current;
            auto e = winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"input", false);
            e->data = pendingData;
            e->inputType = pendingType.empty() ? fallbackType : pendingType;
            pendingData = {};
            pendingType = {};
            Dispatch(e, true);
        }

        void Settled()
        {
            reported = committed = Current();
        }

        void Wire(mux::FrameworkElement const& hosted, bool multiline = false)
        {
            control = winrt::make_weak(hosted);
            std::weak_ptr<Events> weak = weak_from_this();
            hosted.PreviewKeyDown([weak, multiline](auto&&, mux::Input::KeyRoutedEventArgs const& args)
            {
                auto self = weak.lock();
                if (!self) return;
                auto e = winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"keydown", true);
                e->key = KeyName(static_cast<int32_t>(args.Key()), args.KeyStatus().ScanCode);
                e->repeat = args.KeyStatus().WasKeyDown;
                e->ctrlKey = Down(VK_CONTROL);
                e->shiftKey = Down(VK_SHIFT);
                e->altKey = Down(VK_MENU);
                e->metaKey = Down(VK_LWIN) || Down(VK_RWIN);
                if (!self->Dispatch(e, true))
                {
                    args.Handled(true);
                    return;
                }
                if (!multiline && args.Key() == winrt::Windows::System::VirtualKey::Enter) self->Commit();
            });
            hosted.GotFocus([weak](auto&&, auto&&)
            {
                if (auto self = weak.lock()) self->Dispatch(winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"focus", false), false);
            });
            hosted.LostFocus([weak](auto&&, auto&&)
            {
                auto self = weak.lock();
                if (!self) return;
                self->Commit();
                self->Dispatch(winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"blur", false), false);
            });

            auto edited = [weak](winrt::hstring const& type) { if (auto self = weak.lock()) self->Edited(type); };
            auto editedAndCommitted = [weak](winrt::hstring const& type)
            {
                auto self = weak.lock();
                if (!self) return;
                self->Edited(type);
                self->Commit();
            };
            if (auto tb = hosted.try_as<muxc::TextBox>())
            {
                tb.BeforeTextChanging([weak](muxc::TextBox const& box, muxc::TextBoxBeforeTextChangingEventArgs const& args)
                {
                    auto self = weak.lock();
                    if (!self || self->applying) return;
                    auto e = winrt::make_self<winrt::NativeScript::Mason::implementation::Event>(L"beforeinput", true);
                    DescribeEdit(box.Text(), args.NewText(), e->data, e->inputType);
                    self->pendingData = e->data;
                    self->pendingType = e->inputType;
                    if (!self->Dispatch(e, true)) args.Cancel(true);
                });
                tb.TextChanged([edited](auto&&, auto&&) { edited(L"insertText"); });
            }
            else if (auto pb = hosted.try_as<muxc::PasswordBox>())
            {
                pb.PasswordChanged([edited](auto&&, auto&&) { edited(L"insertText"); });
            }
            else if (auto nb = hosted.try_as<muxc::NumberBox>())
            {
                nb.ValueChanged([editedAndCommitted](auto&&, auto&&) { editedAndCommitted(L"insertReplacementText"); });
            }
            else if (auto toggle = hosted.try_as<muxc::Primitives::ToggleButton>())
            {
                auto toggled = [editedAndCommitted](auto&&, auto&&) { editedAndCommitted(L"insertReplacementText"); };
                toggle.Checked(toggled);
                toggle.Unchecked(toggled);
            }
            else if (auto slider = hosted.try_as<muxc::Slider>())
            {
                slider.ValueChanged([edited](auto&&, auto&&) { edited(L"insertReplacementText"); });
                slider.PointerCaptureLost([weak](auto&&, auto&&) { if (auto self = weak.lock()) self->Commit(); });
            }
            else if (auto date = hosted.try_as<muxc::CalendarDatePicker>())
            {
                date.DateChanged([editedAndCommitted](auto&&, auto&&) { editedAndCommitted(L"insertReplacementText"); });
            }
            else if (auto time = hosted.try_as<muxc::TimePicker>())
            {
                time.SelectedTimeChanged([editedAndCommitted](auto&&, auto&&) { editedAndCommitted(L"insertReplacementText"); });
            }
        }
    };
}
