#include "pch.h"
#include "Node.h"
#include "Node.g.cpp"
#include "Style.h"
#include "Layout.h"
#include <winrt/Windows.Storage.Streams.h>
#include "BufferUtil.h"

using namespace winrt;

namespace
{
    namespace nsm = winrt::NativeScript::Mason;

    // mason_node_layout's callback carries no user-data pointer, so the freshly-produced float
    // buffer is stashed in this thread-local for the duration of the (synchronous) FFI call and
    // read back immediately after. One sink per thread keeps concurrent engines on different
    // threads independent.
    thread_local std::vector<float> g_layoutSink;

    void* LayoutSink(const float* data, size_t len)
    {
        if (data != nullptr && len > 0)
        {
            g_layoutSink.assign(data, data + len);
        }
        else
        {
            g_layoutSink.clear();
        }
        return nullptr;
    }

    ::AvailableSpace MakeAvailable(nsm::AvailableSpaceType type, float value)
    {
        ::AvailableSpace space{};
        // AvailableSpaceType (0/1/2) matches the C AvailableSpace_Tag ordering exactly.
        space.tag = static_cast<::AvailableSpace_Tag>(static_cast<int>(type));
        if (type == nsm::AvailableSpaceType::Definite)
        {
            space.definite = value;
        }
        return space;
    }

    ::CMasonNode* NativeOf(nsm::Node const& node)
    {
        return node ? winrt::get_self<winrt::NativeScript::Mason::implementation::Node>(node)->NodePtr() : nullptr;
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    Node::~Node()
    {
        if (!m_destroyed && m_node != nullptr)
        {
            mason_node_destroy(m_node);
        }
    }

    // --- tree mutation ---

    void Node::AddChild(nsm::Node const& child)
    {
        mason_node_add_child(m_mason, m_node, NativeOf(child));
    }

    void Node::Prepend(nsm::Node const& child)
    {
        mason_node_prepend(m_mason, m_node, NativeOf(child));
    }

    void Node::AddChildAt(nsm::Node const& child, uint32_t index)
    {
        mason_node_add_child_at(m_mason, m_node, NativeOf(child), index);
    }

    void Node::InsertChildBefore(nsm::Node const& child, nsm::Node const& reference)
    {
        mason_node_insert_child_before(m_mason, m_node, NativeOf(child), NativeOf(reference));
    }

    void Node::InsertChildAfter(nsm::Node const& child, nsm::Node const& reference)
    {
        mason_node_insert_child_after(m_mason, m_node, NativeOf(child), NativeOf(reference));
    }

    nsm::Node Node::ReplaceChildAt(nsm::Node const& child, uint32_t index)
    {
        auto* result = mason_node_replace_child_at(m_mason, m_node, NativeOf(child), index);
        if (result == nullptr) return nullptr;
        return winrt::make<Node>(m_engine, m_mason, result);
    }

    nsm::Node Node::RemoveChild(nsm::Node const& child)
    {
        auto* result = mason_node_remove_child(m_mason, m_node, NativeOf(child));
        if (result == nullptr) return nullptr;
        return winrt::make<Node>(m_engine, m_mason, result);
    }

    nsm::Node Node::RemoveChildAt(uint32_t index)
    {
        auto* result = mason_node_remove_child_at(m_mason, m_node, index);
        if (result == nullptr) return nullptr;
        return winrt::make<Node>(m_engine, m_mason, result);
    }

    void Node::RemoveChildren()
    {
        mason_node_remove_children(m_mason, m_node);
    }

    nsm::Node Node::GetChildAt(uint32_t index)
    {
        auto* child = mason_node_get_child_at(m_mason, m_node, index);
        if (child == nullptr) return nullptr;
        return winrt::make<Node>(m_engine, m_mason, child);
    }

    void Node::SetChildren(array_view<nsm::Node const> children)
    {
        std::vector<::CMasonNode*> ptrs;
        ptrs.reserve(children.size());
        for (auto const& c : children) ptrs.push_back(NativeOf(c));
        mason_node_set_children(m_mason, m_node, ptrs.data(), ptrs.size());
    }

    void Node::AddChildren(array_view<nsm::Node const> children)
    {
        std::vector<::CMasonNode*> ptrs;
        ptrs.reserve(children.size());
        for (auto const& c : children) ptrs.push_back(NativeOf(c));
        mason_node_add_children(m_mason, m_node, ptrs.data(), ptrs.size());
    }

    void Node::PrependChildren(array_view<nsm::Node const> children)
    {
        std::vector<::CMasonNode*> ptrs;
        ptrs.reserve(children.size());
        for (auto const& c : children) ptrs.push_back(NativeOf(c));
        mason_node_prepend_children(m_mason, m_node, ptrs.data(), ptrs.size());
    }

    bool Node::IsChildrenSame(array_view<nsm::Node const> children)
    {
        std::vector<::CMasonNode*> ptrs;
        ptrs.reserve(children.size());
        for (auto const& c : children) ptrs.push_back(NativeOf(c));
        return mason_node_is_children_same(m_mason, m_node, ptrs.data(), ptrs.size());
    }

    // --- dirty / equality ---

    bool Node::IsDirty()
    {
        return mason_node_dirty(m_mason, m_node);
    }

    void Node::MarkDirty()
    {
        mason_node_mark_dirty(m_mason, m_node);
    }

    bool Node::IsEqual(nsm::Node const& other)
    {
        return mason_node_is_equal(m_node, NativeOf(other));
    }

    // --- pseudo-class state ---

    uint32_t Node::PseudoStates()
    {
        return mason_node_get_pseudo_states(m_mason, m_node);
    }

    void Node::PseudoStates(uint32_t value)
    {
        mason_node_set_pseudo_states(m_mason, m_node, static_cast<uint16_t>(value));
    }

    bool Node::HasPseudoState(uint32_t flag)
    {
        return mason_node_has_pseudo_state(m_mason, m_node, static_cast<uint16_t>(flag));
    }

    winrt::Windows::Storage::Streams::IBuffer Node::PreparePseudoBuffer(uint32_t flags)
    {
        if (m_mason == nullptr || m_node == nullptr) return nullptr;
        uintptr_t len = 0;
        uint8_t* data = mason_node_prepare_pseudo_style_buffer(m_mason, m_node, static_cast<uint16_t>(flags), &len);
        return mason_buf::Wrap(data, static_cast<uint32_t>(len));
    }

    // --- style ---

    nsm::Style Node::Style()
    {
        return winrt::make<implementation::Style>(m_engine, m_mason, m_node);
    }

    // --- measure ---

    long long Node::MeasureTrampoline(const void* data, float knownWidth, float knownHeight,
                                      float availableWidth, float availableHeight) noexcept
    {
        auto* self = const_cast<Node*>(static_cast<const Node*>(data));
        if (self != nullptr && self->m_measure)
        {
            try
            {
                return self->m_measure(knownWidth, knownHeight, availableWidth, availableHeight);
            }
            catch (...)
            {
                return 0;
            }
        }
        return 0;
    }

    void Node::SetMeasure(nsm::MeasureFunc const& callback)
    {
        m_measure = callback;
        mason_node_set_context(m_mason, m_node, this, &Node::MeasureTrampoline);
    }

    void Node::RemoveMeasure()
    {
        m_measure = nullptr;
        mason_node_remove_context(m_mason, m_node);
    }

    // --- compute ---

    void Node::Compute()
    {
        mason_node_compute(m_mason, m_node);
    }

    void Node::ComputeWH(float width, float height)
    {
        mason_node_compute_wh(m_mason, m_node, width, height);
    }

    void Node::ComputeSize(nsm::AvailableSpaceType widthType, float widthValue,
                           nsm::AvailableSpaceType heightType, float heightValue)
    {
        mason_node_compute_size(m_mason, m_node,
                                MakeAvailable(widthType, widthValue),
                                MakeAvailable(heightType, heightValue));
    }

    void Node::ComputeMaxContent()
    {
        mason_node_compute_max_content(m_mason, m_node);
    }

    void Node::ComputeMinContent()
    {
        mason_node_compute_min_content(m_mason, m_node);
    }

    // --- compute + layout ---

    nsm::Layout Node::GetLayout()
    {
        g_layoutSink.clear();
        mason_node_layout(m_mason, m_node, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    nsm::Layout Node::GetShallowLayout()
    {
        g_layoutSink.clear();
        mason_node_layout_shallow(m_mason, m_node, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    nsm::Layout Node::ComputeAndLayout()
    {
        g_layoutSink.clear();
        mason_node_compute_and_layout(m_mason, m_node, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    nsm::Layout Node::ComputeWHAndLayout(float width, float height)
    {
        g_layoutSink.clear();
        mason_node_compute_wh_and_layout(m_mason, m_node, width, height, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    nsm::Layout Node::ComputeMaxContentAndLayout()
    {
        g_layoutSink.clear();
        mason_node_compute_max_content_and_layout(m_mason, m_node, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    nsm::Layout Node::ComputeMinContentAndLayout()
    {
        g_layoutSink.clear();
        mason_node_compute_min_content_and_layout(m_mason, m_node, &LayoutSink);
        return implementation::Layout::FromFloats(g_layoutSink.data(), g_layoutSink.size());
    }

    void Node::PrintTree()
    {
        mason_print_tree(m_mason, m_node);
    }

    void Node::Destroy()
    {
        if (!m_destroyed && m_node != nullptr)
        {
            mason_node_destroy(m_node);
        }
        m_node = nullptr;
        m_destroyed = true;
    }
}
