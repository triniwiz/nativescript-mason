#pragma once
#include "Style.g.h"

namespace winrt::NativeScript::Mason::implementation
{
    // Writer over one node's style buffer. Holds a strong ref to the owning engine (an opaque
    // keep-alive, so the CMason outlives this Style) plus the borrowed raw CMason*/CMasonNode*.
    // Created by Node.Style.
    struct Style : StyleT<Style>
    {
        Style(winrt::Windows::Foundation::IInspectable const& engineKeepAlive, ::CMason* mason, ::CMasonNode* node)
            : m_engine(engineKeepAlive), m_mason(mason), m_node(node) {}

        void SetWithValues(
            int32_t display, int32_t position, int32_t direction, int32_t flexDirection,
            int32_t flexWrap, int32_t overflow, int32_t alignItems, int32_t alignSelf,
            int32_t alignContent, int32_t justifyItems, int32_t justifySelf, int32_t justifyContent,
            int32_t insetLeftType, float insetLeftValue, int32_t insetRightType, float insetRightValue,
            int32_t insetTopType, float insetTopValue, int32_t insetBottomType, float insetBottomValue,
            int32_t marginLeftType, float marginLeftValue, int32_t marginRightType, float marginRightValue,
            int32_t marginTopType, float marginTopValue, int32_t marginBottomType, float marginBottomValue,
            int32_t paddingLeftType, float paddingLeftValue, int32_t paddingRightType, float paddingRightValue,
            int32_t paddingTopType, float paddingTopValue, int32_t paddingBottomType, float paddingBottomValue,
            int32_t borderLeftType, float borderLeftValue, int32_t borderRightType, float borderRightValue,
            int32_t borderTopType, float borderTopValue, int32_t borderBottomType, float borderBottomValue,
            float flexGrow, float flexShrink, int32_t flexBasisType, float flexBasisValue,
            int32_t widthType, float widthValue, int32_t heightType, float heightValue,
            int32_t minWidthType, float minWidthValue, int32_t minHeightType, float minHeightValue,
            int32_t maxWidthType, float maxWidthValue, int32_t maxHeightType, float maxHeightValue,
            int32_t gapRowType, float gapRowValue, int32_t gapColumnType, float gapColumnValue,
            float aspectRatio,
            hstring const& gridAutoRows, hstring const& gridAutoColumns, int32_t gridAutoFlow,
            hstring const& gridColumn, hstring const& gridColumnStart, hstring const& gridColumnEnd,
            hstring const& gridRow, hstring const& gridRowStart, hstring const& gridRowEnd,
            hstring const& gridTemplateRows, hstring const& gridTemplateColumns,
            int32_t overflowX, int32_t overflowY, float scrollbarWidth, int32_t textAlign,
            int32_t boxSizing, hstring const& gridArea, hstring const& gridTemplateAreas);

        void UpdateGrid(
            hstring const& gridAutoRows, hstring const& gridAutoColumns, hstring const& gridColumn,
            hstring const& gridColumnStart, hstring const& gridColumnEnd, hstring const& gridRow,
            hstring const& gridRowStart, hstring const& gridRowEnd, hstring const& gridTemplateRows,
            hstring const& gridTemplateColumns, hstring const& gridArea, hstring const& gridTemplateAreas);

        void SetGridCss(int32_t property, winrt::hstring const& value,
            float fontSize, float rootFontSize, float viewportWidth, float viewportHeight);
        bool ApplyLayoutLength(winrt::hstring const& property, winrt::hstring const& value,
            float fontSize, float rootFontSize, float viewportWidth, float viewportHeight);
        hstring LayoutLengthCss(winrt::hstring const& property);
        bool ApplyLayoutLengthForState(uint32_t flags, winrt::hstring const& property, winrt::hstring const& value,
            float fontSize, float rootFontSize, float viewportWidth, float viewportHeight);
        hstring LayoutLengthCssForState(uint32_t flags, winrt::hstring const& property);

        void PrepareForMutation();

        winrt::Windows::Foundation::Collections::IVectorView<uint8_t> GetStyleBuffer();
        winrt::Windows::Storage::Streams::IBuffer Values();

        hstring GridAreaCss();
        hstring GridTemplateAreasCss();
        hstring GridAutoRowsCss();
        hstring GridAutoColumnsCss();
        hstring GridColumnCss();
        hstring GridColumnStartCss();
        hstring GridColumnEndCss();
        hstring GridRowCss();
        hstring GridRowStartCss();
        hstring GridRowEndCss();
        hstring GridTemplateRowsCss();
        hstring GridTemplateColumnsCss();

    private:
        winrt::Windows::Foundation::IInspectable m_engine{ nullptr };
        ::CMason* m_mason{ nullptr };
        ::CMasonNode* m_node{ nullptr };
    };
}
