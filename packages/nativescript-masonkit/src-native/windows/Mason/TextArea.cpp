#include "pch.h"
#include "TextArea.h"
#include "TextArea.g.cpp"
#include "Events.h"
#include "LeafCommon.h"
#include "Node.h"
#include "Text.h"
#include <winrt/NativeScript.Mason.h>
#include "VisualApply.h"

using namespace winrt;
using namespace winrt::Windows::Foundation;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
    namespace mux = winrt::Microsoft::UI::Xaml;
    namespace muxc = winrt::Microsoft::UI::Xaml::Controls;
}

namespace winrt::NativeScript::Mason::implementation
{
    TextArea::TextArea()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
        RequestedTheme(mux::ElementTheme::Light);
        m_box = muxc::TextBox();
        m_box.AcceptsReturn(true);
        m_box.TextWrapping(mux::TextWrapping::Wrap);
        m_box.HorizontalAlignment(mux::HorizontalAlignment::Stretch);
        m_box.VerticalAlignment(mux::VerticalAlignment::Stretch);
        mason_form::StripFieldChrome(m_box);
        Children().Append(m_box);
        m_events = std::make_shared<mason_form::Events>();
        m_events->value = [this]() -> hstring { return m_box.Text(); };
        m_events->Wire(m_box, true);
        m_events->Settled();

        auto weak = winrt::make_weak(m_box);
        nsm::MeasureFunc cb = [weak](float kw, float kh, float aw, float ah) -> int64_t
        {
            auto b = weak.get();
            if (!b) return mason_leaf::PackMeasure(0.0f, 0.0f);
            return mason_leaf::MeasureXaml(b, kw, kh, aw, ah);
        };
        m_node.SetMeasure(cb);
    }

    hstring TextArea::Value() const { return m_box.Text(); }

    void TextArea::Value(hstring const& value)
    {
        m_events->applying = true;
        if (m_box.Text() != value) m_box.Text(value);
        m_events->applying = false;
        m_events->Settled();
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    hstring TextArea::Placeholder() const { return m_box.PlaceholderText(); }
    void TextArea::Placeholder(hstring const& value) { m_box.PlaceholderText(value); }

    void TextArea::SyncSize()
    {
        const double size = m_box.FontSize();
        m_box.MinHeight(m_rows > 0 ? m_rows * size * 1.36 : 0.0);
        m_box.MinWidth(m_cols > 0 ? m_cols * size * 0.5 : 0.0);
    }

    void TextArea::Rows(int32_t value)
    {
        m_rows = value;
        SyncSize();
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    void TextArea::Cols(int32_t value)
    {
        m_cols = value;
        SyncSize();
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    int32_t TextArea::MaxLength() const { return m_box.MaxLength() > 0 ? m_box.MaxLength() : -1; }
    void TextArea::MaxLength(int32_t value) { m_box.MaxLength(value > 0 ? value : 0); }

    void TextArea::SyncTextStyle(bool force)
    {
        mason_form::TextStyle style;
        mason_form::ReadTextStyle(m_node, style);
        style.fontFamily = m_fontFamily;
        const double before = m_box.FontSize();
        mason_form::ApplyTextStyle(m_box, style, m_textApplied, force);
        if (m_box.FontSize() != before) SyncSize();
    }

    void TextArea::SyncStyle(int32_t d0, int32_t d1, int32_t d2, int32_t d3)
    {
        m_visual.styleDirty = true;
        const auto dirty = mason_leaf::DirtyWords(d0, d1, d2, d3);
        if (mason_leaf::AnyDirty(dirty, mason_leaf::kControlKeys)) SyncTextStyle(false);
        mason_leaf::StyleSynced(get_strong().as<mux::UIElement>(), m_node, dirty);
    }

    void TextArea::SetFontFamily(hstring const& families)
    {
        m_fontFamily = Text::ResolveFontFamily(families);
        SyncTextStyle(false);
        m_node.MarkDirty();
        InvalidateMeasure();
    }

    int64_t TextArea::AddEventListener(hstring const& type, nsm::EventListener const& listener)
    {
        return mason_events::Add(get_strong().as<mux::UIElement>(), type, listener);
    }

    bool TextArea::RemoveEventListener(hstring const& type, int64_t id)
    {
        mason_events::Remove(get_strong().as<mux::UIElement>(), type, id);
        return true;
    }

    Size TextArea::MeasureOverride(Size const& available)
    {
        float left = 0.0f, top = 0.0f, right = 0.0f, bottom = 0.0f;
        winrt::get_self<implementation::Node>(m_node)->ContentInsets(left, top, right, bottom);
        m_box.Measure(Size{ (std::max)(0.0f, available.Width - left - right), (std::max)(0.0f, available.Height - top - bottom) });
        return Size{ 0.0f, 0.0f };
    }

    Size TextArea::ArrangeOverride(Size const& finalSize)
    {
        float left = 0.0f, top = 0.0f, right = 0.0f, bottom = 0.0f;
        winrt::get_self<implementation::Node>(m_node)->ContentInsets(left, top, right, bottom);
        m_box.Arrange(winrt::Windows::Foundation::Rect{ left, top, (std::max)(0.0f, finalSize.Width - left - right), (std::max)(0.0f, finalSize.Height - top - bottom) });
        mason_visual::Apply(get_strong().as<winrt::Microsoft::UI::Xaml::UIElement>(), m_node, finalSize.Width, finalSize.Height, m_visual);
        return finalSize;
    }
}
