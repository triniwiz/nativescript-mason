#pragma once
#include "Node.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    // A node in the layout tree: wraps a mason-c CMasonNode and the borrowed engine CMason*, and
    // keeps the owning Mason alive via an opaque IInspectable. Created only by Mason.Create* /
    // by methods that return child nodes; never activated from JS.
    struct Node : NodeT<Node>
    {
        Node(winrt::Windows::Foundation::IInspectable const& engineKeepAlive, ::CMason* mason, ::CMasonNode* node)
            : m_engine(engineKeepAlive), m_mason(mason), m_node(node) {}
        ~Node();

        // tree mutation
        void AddChild(winrt::NativeScript::Mason::Node const& child);
        void Prepend(winrt::NativeScript::Mason::Node const& child);
        void AddChildAt(winrt::NativeScript::Mason::Node const& child, uint32_t index);
        void InsertChildBefore(winrt::NativeScript::Mason::Node const& child, winrt::NativeScript::Mason::Node const& reference);
        void InsertChildAfter(winrt::NativeScript::Mason::Node const& child, winrt::NativeScript::Mason::Node const& reference);
        winrt::NativeScript::Mason::Node ReplaceChildAt(winrt::NativeScript::Mason::Node const& child, uint32_t index);
        winrt::NativeScript::Mason::Node RemoveChild(winrt::NativeScript::Mason::Node const& child);
        winrt::NativeScript::Mason::Node RemoveChildAt(uint32_t index);
        void RemoveChildren();
        winrt::NativeScript::Mason::Node GetChildAt(uint32_t index);
        void SetChildren(array_view<winrt::NativeScript::Mason::Node const> children);
        void AddChildren(array_view<winrt::NativeScript::Mason::Node const> children);
        void PrependChildren(array_view<winrt::NativeScript::Mason::Node const> children);
        bool IsChildrenSame(array_view<winrt::NativeScript::Mason::Node const> children);

        // dirty / equality
        bool IsDirty();
        void MarkDirty();
        bool IsEqual(winrt::NativeScript::Mason::Node const& other);

        // pseudo-class state
        uint32_t PseudoStates();
        void PseudoStates(uint32_t value);
        bool HasPseudoState(uint32_t flag);
        winrt::Windows::Storage::Streams::IBuffer PreparePseudoBuffer(uint32_t flags);

        // style
        winrt::NativeScript::Mason::Style Style();

        // measure
        void SetMeasure(winrt::NativeScript::Mason::MeasureFunc const& callback);
        void RemoveMeasure();

        // compute
        void Compute();
        void ComputeWH(float width, float height);
        void ComputeSize(winrt::NativeScript::Mason::AvailableSpaceType widthType, float widthValue,
                         winrt::NativeScript::Mason::AvailableSpaceType heightType, float heightValue);
        void ComputeMaxContent();
        void ComputeMinContent();

        // compute + layout
        winrt::NativeScript::Mason::Layout GetLayout();
        winrt::NativeScript::Mason::Layout GetShallowLayout();
        winrt::NativeScript::Mason::Layout ComputeAndLayout();
        winrt::NativeScript::Mason::Layout ComputeWHAndLayout(float width, float height);
        winrt::NativeScript::Mason::Layout ComputeMaxContentAndLayout();
        winrt::NativeScript::Mason::Layout ComputeMinContentAndLayout();

        void PrintTree();
        void Destroy();

        // Internal accessors (not projected).
        ::CMasonNode* NodePtr() const noexcept { return m_node; }
        ::CMason* MasonPtr() const noexcept { return m_mason; }

        // This node's laid-out width, without building a Layout.
        float LayoutWidth();

        // Position relative to the layout root in DIPs, set by the parent panel's arrange.
        float ArrangeX{ 0.0f };
        float ArrangeY{ 0.0f };

    private:
        // C trampoline registered with mason_node_set_context; recovers `this` from measure_data
        // and invokes m_measure.
        static long long MeasureTrampoline(const void* data, float knownWidth, float knownHeight,
                                           float availableWidth, float availableHeight) noexcept;

        winrt::Windows::Foundation::IInspectable m_engine{ nullptr };
        ::CMason* m_mason{ nullptr };
        ::CMasonNode* m_node{ nullptr };
        winrt::NativeScript::Mason::MeasureFunc m_measure{ nullptr };
        bool m_destroyed{ false };
    };
}
