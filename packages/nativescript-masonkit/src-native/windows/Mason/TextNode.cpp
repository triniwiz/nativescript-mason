#include "pch.h"
#include "TextNode.h"
#include "TextNode.g.cpp"
#include "Text.h"
#include <winrt/NativeScript.Mason.h>

using namespace winrt;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;
}

namespace winrt::NativeScript::Mason::implementation
{
    TextNode::TextNode()
    {
        m_node = nsm::Mason::Instance().CreateNode(false);
    }

    hstring TextNode::Data() const { return m_data; }

    void TextNode::Data(hstring const& value)
    {
        if (m_data == value) return;
        m_data = value;
        NotifyOwner();
    }

    void TextNode::SetColor(uint32_t argb)
    {
        m_color = argb;
        m_hasColor = true;
        NotifyOwner();
    }

    void TextNode::SetFontSize(double px)
    {
        if (px <= 0.0) return;
        m_fontSize = px;
        NotifyOwner();
    }

    void TextNode::SetFontWeight(int32_t weight)
    {
        if (weight <= 0) return;
        m_fontWeight = weight;
        NotifyOwner();
    }

    void TextNode::SetLineHeight(double multiplier)
    {
        m_lineHeightMultiplier = multiplier > 0.0 ? multiplier : 0.0;
        NotifyOwner();
    }

    void TextNode::SetLetterSpacing(double px)
    {
        m_letterSpacingPx = px;
        NotifyOwner();
    }

    void TextNode::SetBreak(bool isBreak)
    {
        if (m_isBreak == isBreak) return;
        m_isBreak = isBreak;
        NotifyOwner();
    }

    void TextNode::NotifyOwner()
    {
        if (m_owner) m_owner->OnRunChanged();
    }
}
