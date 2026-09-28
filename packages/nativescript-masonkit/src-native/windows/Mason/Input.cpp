#include "pch.h"
#include "Input.h"
#include "Input.g.cpp"
#include "Event.h"
#include "LeafCommon.h"
#include <winrt/NativeScript.Mason.h>
// Slider (IRangeBase.Value) and CheckBox/RadioButton (IToggleButton.IsChecked) resolve their
// accessors through the Controls.Primitives projection.
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include "VisualApply.h"
#include <winrt/Microsoft.UI.Xaml.Input.h>
#include <winrt/Windows.System.h>
#include <winrt/Windows.UI.Core.h>
#include <cwchar>
#include <string>

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;

    double ParseDouble(winrt::hstring const& s)
    {
        try { return s.empty() ? 0.0 : std::stod(std::wstring(s)); }
        catch (...) { return 0.0; }
    }

    bool Down(int vk) { return (GetKeyState(vk) & 0x8000) != 0; }

    // The DOM's KeyboardEvent.key: a named key, or the text the key types with the current layout
    // and modifiers (Ctrl alone doesn't change it, AltGr does).
    winrt::hstring KeyName(int32_t vk, uint32_t scanCode)
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
        // 0x4 leaves the keyboard state, dead keys included, as it was.
        const int n = ToUnicodeEx(static_cast<UINT>(vk), scanCode, state, text, 8, 0x4, GetKeyboardLayout(0));
        if (n < 0) return L"Dead";
        return n > 0 ? winrt::hstring(text, static_cast<uint32_t>(n)) : winrt::hstring(L"Unidentified");
    }

    // An edit as InputEvent.data and inputType, from the text before and after it.
    void DescribeEdit(std::wstring_view before, std::wstring_view after, winrt::hstring& data, winrt::hstring& inputType)
    {
        size_t start = 0;
        while (start < before.size() && start < after.size() && before[start] == after[start]) ++start;
        size_t end = 0;
        while (end < before.size() - start && end < after.size() - start && before[before.size() - 1 - end] == after[after.size() - 1 - end]) ++end;
        const auto inserted = after.substr(start, after.size() - start - end);
        data = winrt::hstring(inserted);
        inputType = inserted.empty() && before.size() > after.size() ? L"deleteContentBackward" : L"insertText";
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Input::Input()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
        Rebuild();

        nsm::MeasureFunc cb = [this](float kw, float kh, float aw, float ah) -> int64_t
        {
            if (!m_control) return mason_leaf::PackMeasure(0.0f, 0.0f);
            return mason_leaf::MeasureXaml(m_control, kw, kh, aw, ah);
        };
        m_node.SetMeasure(cb);
    }

    void Input::Rebuild()
    {
        Children().Clear();
        mux::FrameworkElement control{ nullptr };
        switch (m_type)
        {
        case 4: control = muxc::PasswordBox(); break;                 // password
        case 7: control = muxc::NumberBox(); break;                  // number
        case 8: control = muxc::Slider(); break;                     // range
        case 2: control = muxc::CheckBox(); break;                   // checkbox
        case 6: control = muxc::RadioButton(); break;                // radio
        case 1: case 13: control = muxc::Button(); break;            // button / submit
        case 5: control = muxc::CalendarDatePicker(); break;         // date
        default: control = muxc::TextBox(); break;                   // text/email/tel/url/color/file
        }
        m_control = control;
        Children().Append(m_control);
        ApplyValue(m_value);
        ApplyPlaceholder(m_placeholder);
        Listen();
    }

    // The hosted control's events as DOM events. A rebuilt control is wired again, and the old one
    // goes with its handlers.
    void Input::Listen()
    {
        auto weak = get_weak();
        m_control.PreviewKeyDown([weak](auto&&, mux::Input::KeyRoutedEventArgs const& args)
        {
            auto self = weak.get();
            if (!self) return;
            auto e = winrt::make_self<implementation::Event>(L"keydown", true);
            e->key = KeyName(static_cast<int32_t>(args.Key()), args.KeyStatus().ScanCode);
            e->repeat = args.KeyStatus().WasKeyDown;
            e->ctrlKey = Down(VK_CONTROL);
            e->shiftKey = Down(VK_SHIFT);
            e->altKey = Down(VK_MENU);
            e->metaKey = Down(VK_LWIN) || Down(VK_RWIN);
            if (!self->Dispatch(*e))
            {
                args.Handled(true);
                return;
            }
            if (args.Key() == winrt::Windows::System::VirtualKey::Enter) self->Commit();
        });
        m_control.GotFocus([weak](auto&&, auto&&)
        {
            auto self = weak.get();
            if (!self) return;
            auto e = winrt::make_self<implementation::Event>(L"focus", false);
            e->bubbles = false;
            self->Dispatch(*e);
        });
        m_control.LostFocus([weak](auto&&, auto&&)
        {
            auto self = weak.get();
            if (!self) return;
            self->Commit();
            auto e = winrt::make_self<implementation::Event>(L"blur", false);
            e->bubbles = false;
            self->Dispatch(*e);
        });

        auto edited = [weak](hstring const& fallbackType)
        {
            auto self = weak.get();
            if (!self || self->m_applying) return;
            const hstring value = self->Value();
            if (value == self->m_reported) return;
            self->m_reported = value;
            auto e = winrt::make_self<implementation::Event>(L"input", false);
            e->data = self->m_pendingData;
            e->inputType = self->m_pendingType.empty() ? fallbackType : self->m_pendingType;
            self->m_pendingData = {};
            self->m_pendingType = {};
            self->Dispatch(*e);
        };
        if (auto tb = m_control.try_as<muxc::TextBox>())
        {
            tb.BeforeTextChanging([weak](muxc::TextBox const& box, muxc::TextBoxBeforeTextChangingEventArgs const& args)
            {
                auto self = weak.get();
                if (!self || self->m_applying) return;
                auto e = winrt::make_self<implementation::Event>(L"beforeinput", true);
                DescribeEdit(box.Text(), args.NewText(), e->data, e->inputType);
                self->m_pendingData = e->data;
                self->m_pendingType = e->inputType;
                if (!self->Dispatch(*e)) args.Cancel(true);
            });
            // Raised after the change, so a write from code is told apart by its value.
            tb.TextChanged([edited](auto&&, auto&&) { edited(L"insertText"); });
        }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>())
        {
            pb.PasswordChanged([edited](auto&&, auto&&) { edited(L"insertText"); });
        }
        else if (auto toggle = m_control.try_as<muxc::Primitives::ToggleButton>())
        {
            auto toggled = [weak, edited](auto&&, auto&&)
            {
                edited(L"insertReplacementText");
                if (auto self = weak.get()) self->Commit();
            };
            toggle.Checked(toggled);
            toggle.Unchecked(toggled);
        }
        else if (auto slider = m_control.try_as<muxc::Slider>())
        {
            slider.ValueChanged([edited](auto&&, auto&&) { edited(L"insertReplacementText"); });
            slider.PointerCaptureLost([weak](auto&&, auto&&) { if (auto self = weak.get()) self->Commit(); });
        }
    }

    // False when a listener prevented the default.
    bool Input::Dispatch(nsm::Event const& e)
    {
        const auto type = e.Type();
        std::vector<nsm::EventListener> targets;
        for (auto const& l : m_listeners)
        {
            if (l.type == type) targets.push_back(l.fn);
        }
        for (auto const& fn : targets)
        {
            try { fn(e); }
            catch (...) {}
            if (e.ImmediatePropagationStopped()) break;
        }
        return !e.DefaultPrevented();
    }

    // change: the value is committed, by Enter or leaving the control, and differs from the last one.
    void Input::Commit()
    {
        const hstring value = Value();
        if (value == m_committed) return;
        m_committed = value;
        Dispatch(winrt::make<implementation::Event>(L"change", false));
    }

    int64_t Input::AddEventListener(hstring const& type, nsm::EventListener const& listener)
    {
        if (!listener) return 0;
        const int64_t id = m_nextId++;
        m_listeners.push_back({ type, id, listener });
        return id;
    }

    bool Input::RemoveEventListener(hstring const& type, int64_t id)
    {
        return std::erase_if(m_listeners, [&](Listener const& l) { return l.id == id && l.type == type; }) > 0;
    }

    void Input::ApplyValue(hstring const& value)
    {
        if (!m_control) return;
        m_applying = true;
        struct Done { Input* self; ~Done() { self->m_applying = false; self->m_reported = self->m_committed = self->Value(); } } done{ this };
        // Writing the text it already has would move the caret.
        if (auto tb = m_control.try_as<muxc::TextBox>()) { if (tb.Text() != value) tb.Text(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.Password(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.Value(ParseDouble(value)); }
        else if (auto sl = m_control.try_as<muxc::Slider>()) { sl.Value(ParseDouble(value)); }
        else if (auto btn = m_control.try_as<muxc::Button>()) { btn.Content(winrt::box_value(value)); }
        else if (auto cb = m_control.try_as<muxc::CheckBox>()) { cb.IsChecked(value == L"true"); }
        else if (auto rb = m_control.try_as<muxc::RadioButton>()) { rb.IsChecked(value == L"true"); }
    }

    void Input::ApplyPlaceholder(hstring const& value)
    {
        if (!m_control) return;
        if (auto tb = m_control.try_as<muxc::TextBox>()) { tb.PlaceholderText(value); }
        else if (auto pb = m_control.try_as<muxc::PasswordBox>()) { pb.PlaceholderText(value); }
        else if (auto nb = m_control.try_as<muxc::NumberBox>()) { nb.PlaceholderText(value); }
    }

    void Input::Type(int32_t value)
    {
        if (m_type == value && m_control) return;
        m_type = value;
        Rebuild();
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    hstring Input::Value() const
    {
        if (!m_control) return m_value;
        if (auto tb = m_control.try_as<muxc::TextBox>()) return tb.Text();
        if (auto pb = m_control.try_as<muxc::PasswordBox>()) return pb.Password();
        if (auto nb = m_control.try_as<muxc::NumberBox>()) return winrt::to_hstring(nb.Value());
        if (auto sl = m_control.try_as<muxc::Slider>()) return winrt::to_hstring(sl.Value());
        if (auto cb = m_control.try_as<muxc::CheckBox>()) { auto v = cb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        if (auto rb = m_control.try_as<muxc::RadioButton>()) { auto v = rb.IsChecked(); return (v && v.Value()) ? L"true" : L"false"; }
        return m_value;
    }

    void Input::Value(hstring const& value)
    {
        m_value = value;
        ApplyValue(value);
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    void Input::Placeholder(hstring const& value)
    {
        m_placeholder = value;
        ApplyPlaceholder(value);
    }

    Size Input::MeasureOverride(Size const& available)
    {
        if (!m_control) return Size{ 0, 0 };
        m_control.Measure(available);
        return m_control.DesiredSize();
    }

    Size Input::ArrangeOverride(Size const& finalSize)
    {
        if (m_control)
        {
            m_control.Arrange(winrt::Windows::Foundation::Rect{ 0.0f, 0.0f, finalSize.Width, finalSize.Height });
        }
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
