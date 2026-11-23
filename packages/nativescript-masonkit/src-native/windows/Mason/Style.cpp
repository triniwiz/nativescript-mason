#include "pch.h"
#include "Style.h"
#include "Style.g.cpp"
#include <winrt/Windows.Storage.Streams.h>
#include "BufferUtil.h"

using namespace winrt;
using namespace winrt::Windows::Foundation::Collections;

namespace
{
    // hstring -> NUL-terminated UTF-8, kept alive by the caller's local.
    std::string U8(winrt::hstring const& h) { return winrt::to_string(h); }

    // Take ownership of a Rust-allocated C string: copy to hstring then free via mason-c.
    winrt::hstring TakeCss(char* ptr)
    {
        if (ptr == nullptr) return winrt::hstring{};
        winrt::hstring result = winrt::to_hstring(std::string(ptr));
        mason_util_destroy_string(ptr);
        return result;
    }
}

namespace winrt::NativeScript::Mason::implementation
{
    void Style::SetWithValues(
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
        int32_t boxSizing, hstring const& gridArea, hstring const& gridTemplateAreas)
    {
        if (m_mason == nullptr || m_node == nullptr) return;

        // The grid strings are passed by pointer; keep the UTF-8 buffers alive for the call.
        std::string sGridAutoRows = U8(gridAutoRows);
        std::string sGridAutoColumns = U8(gridAutoColumns);
        std::string sGridColumn = U8(gridColumn);
        std::string sGridColumnStart = U8(gridColumnStart);
        std::string sGridColumnEnd = U8(gridColumnEnd);
        std::string sGridRow = U8(gridRow);
        std::string sGridRowStart = U8(gridRowStart);
        std::string sGridRowEnd = U8(gridRowEnd);
        std::string sGridTemplateRows = U8(gridTemplateRows);
        std::string sGridTemplateColumns = U8(gridTemplateColumns);
        std::string sGridArea = U8(gridArea);
        std::string sGridTemplateAreas = U8(gridTemplateAreas);

        mason_style_set_with_values(
            m_mason, m_node,
            static_cast<signed char>(display),
            static_cast<signed char>(position),
            static_cast<signed char>(direction),
            static_cast<signed char>(flexDirection),
            static_cast<signed char>(flexWrap),
            static_cast<signed char>(overflow),
            static_cast<signed char>(alignItems),
            static_cast<signed char>(alignSelf),
            static_cast<signed char>(alignContent),
            static_cast<signed char>(justifyItems),
            static_cast<signed char>(justifySelf),
            static_cast<signed char>(justifyContent),
            static_cast<signed char>(insetLeftType), insetLeftValue,
            static_cast<signed char>(insetRightType), insetRightValue,
            static_cast<signed char>(insetTopType), insetTopValue,
            static_cast<signed char>(insetBottomType), insetBottomValue,
            static_cast<signed char>(marginLeftType), marginLeftValue,
            static_cast<signed char>(marginRightType), marginRightValue,
            static_cast<signed char>(marginTopType), marginTopValue,
            static_cast<signed char>(marginBottomType), marginBottomValue,
            static_cast<signed char>(paddingLeftType), paddingLeftValue,
            static_cast<signed char>(paddingRightType), paddingRightValue,
            static_cast<signed char>(paddingTopType), paddingTopValue,
            static_cast<signed char>(paddingBottomType), paddingBottomValue,
            static_cast<signed char>(borderLeftType), borderLeftValue,
            static_cast<signed char>(borderRightType), borderRightValue,
            static_cast<signed char>(borderTopType), borderTopValue,
            static_cast<signed char>(borderBottomType), borderBottomValue,
            flexGrow, flexShrink,
            static_cast<signed char>(flexBasisType), flexBasisValue,
            static_cast<signed char>(widthType), widthValue,
            static_cast<signed char>(heightType), heightValue,
            static_cast<signed char>(minWidthType), minWidthValue,
            static_cast<signed char>(minHeightType), minHeightValue,
            static_cast<signed char>(maxWidthType), maxWidthValue,
            static_cast<signed char>(maxHeightType), maxHeightValue,
            static_cast<signed char>(gapRowType), gapRowValue,
            static_cast<signed char>(gapColumnType), gapColumnValue,
            aspectRatio,
            sGridAutoRows.c_str(),
            sGridAutoColumns.c_str(),
            static_cast<signed char>(gridAutoFlow),
            sGridColumn.c_str(),
            sGridColumnStart.c_str(),
            sGridColumnEnd.c_str(),
            sGridRow.c_str(),
            sGridRowStart.c_str(),
            sGridRowEnd.c_str(),
            sGridTemplateRows.c_str(),
            sGridTemplateColumns.c_str(),
            static_cast<signed char>(overflowX),
            static_cast<signed char>(overflowY),
            scrollbarWidth,
            static_cast<signed char>(textAlign),
            static_cast<signed char>(boxSizing),
            sGridArea.c_str(),
            sGridTemplateAreas.c_str());
    }

    void Style::UpdateGrid(
        hstring const& gridAutoRows, hstring const& gridAutoColumns, hstring const& gridColumn,
        hstring const& gridColumnStart, hstring const& gridColumnEnd, hstring const& gridRow,
        hstring const& gridRowStart, hstring const& gridRowEnd, hstring const& gridTemplateRows,
        hstring const& gridTemplateColumns, hstring const& gridArea, hstring const& gridTemplateAreas)
    {
        if (m_mason == nullptr || m_node == nullptr) return;

        std::string sGridAutoRows = U8(gridAutoRows);
        std::string sGridAutoColumns = U8(gridAutoColumns);
        std::string sGridColumn = U8(gridColumn);
        std::string sGridColumnStart = U8(gridColumnStart);
        std::string sGridColumnEnd = U8(gridColumnEnd);
        std::string sGridRow = U8(gridRow);
        std::string sGridRowStart = U8(gridRowStart);
        std::string sGridRowEnd = U8(gridRowEnd);
        std::string sGridTemplateRows = U8(gridTemplateRows);
        std::string sGridTemplateColumns = U8(gridTemplateColumns);
        std::string sGridArea = U8(gridArea);
        std::string sGridTemplateAreas = U8(gridTemplateAreas);

        mason_style_update_non_buffer_data(
            m_mason, m_node,
            sGridAutoRows.c_str(),
            sGridAutoColumns.c_str(),
            sGridColumn.c_str(),
            sGridColumnStart.c_str(),
            sGridColumnEnd.c_str(),
            sGridRow.c_str(),
            sGridRowStart.c_str(),
            sGridRowEnd.c_str(),
            sGridTemplateRows.c_str(),
            sGridTemplateColumns.c_str(),
            sGridArea.c_str(),
            sGridTemplateAreas.c_str());
    }

    void Style::SetGridCss(int32_t property, hstring const& value,
        float fontSize, float rootFontSize, float viewportWidth, float viewportHeight)
    {
        auto input = std::to_string(property);
        input.push_back('\0');
        const auto css = U8(value);
        if (css.find('\0') != std::string::npos) return;
        input.append(css);
        mason_css_apply_grid(m_mason, m_node,
            { reinterpret_cast<const uint8_t*>(input.data()), input.size() },
            fontSize, rootFontSize, viewportWidth, viewportHeight);
    }

    bool Style::ApplyLayoutLength(hstring const& property, hstring const& value,
        float fontSize, float rootFontSize, float viewportWidth, float viewportHeight)
    {
        const auto name = U8(property);
        const auto css = U8(value);
        return mason_css_apply_layout_length(m_mason, m_node, name.c_str(), css.c_str(),
            fontSize, rootFontSize, viewportWidth, viewportHeight);
    }

    hstring Style::LayoutLengthCss(hstring const& property)
    {
        return TakeCss(mason_css_copy_layout_length(m_mason, m_node, U8(property).c_str()));
    }

    bool Style::ApplyLayoutLengthForState(uint32_t flags, hstring const& property, hstring const& value,
        float fontSize, float rootFontSize, float viewportWidth, float viewportHeight)
    {
        const auto name = U8(property);
        const auto css = U8(value);
        return mason_css_apply_layout_length_for_state(m_mason, m_node, static_cast<uint16_t>(flags),
            name.c_str(), css.c_str(), fontSize, rootFontSize, viewportWidth, viewportHeight);
    }

    hstring Style::LayoutLengthCssForState(uint32_t flags, hstring const& property)
    {
        return TakeCss(mason_css_copy_layout_length_for_state(m_mason, m_node,
            static_cast<uint16_t>(flags), U8(property).c_str()));
    }

    void Style::PrepareForMutation()
    {
        if (m_mason == nullptr || m_node == nullptr) return;
        mason_style_prepare_style_for_mut(m_mason, m_node);
    }

    IVectorView<uint8_t> Style::GetStyleBuffer()
    {
        std::vector<uint8_t> out;
        if (m_mason != nullptr && m_node != nullptr)
        {
            ::CMasonBuffer* buf = mason_style_get_style_buffer(m_mason, m_node);
            if (buf != nullptr)
            {
                if (buf->data != nullptr && buf->size > 0)
                {
                    out.assign(buf->data, buf->data + buf->size);
                }
                // The buffer's `data` points into the arena (not owned); this only releases the
                // wrapper box.
                mason_style_release_style_buffer(buf);
            }
        }
        return single_threaded_vector<uint8_t>(std::move(out)).GetView();
    }

    winrt::Windows::Storage::Streams::IBuffer Style::Values()
    {
        if (m_mason == nullptr || m_node == nullptr) return nullptr;
        // Ensure the node has its own (un-shared) style buffer before handing out a writable view.
        mason_style_prepare_style_for_mut(m_mason, m_node);
        ::CMasonBuffer* buf = mason_style_get_style_buffer(m_mason, m_node);
        if (buf == nullptr) return nullptr;
        uint8_t* data = buf->data;
        uint32_t size = static_cast<uint32_t>(buf->size);
        // Releases the wrapper box only; `data` points into the arena (stable after prepare_mut).
        mason_style_release_style_buffer(buf);
        return mason_buf::Wrap(data, size);
    }

    hstring Style::GridAreaCss() { return TakeCss(mason_style_get_grid_area_css(m_mason, m_node)); }
    hstring Style::GridTemplateAreasCss() { return TakeCss(mason_style_get_grid_template_areas_css(m_mason, m_node)); }
    hstring Style::GridAutoRowsCss() { return TakeCss(mason_style_get_grid_auto_rows_css(m_mason, m_node)); }
    hstring Style::GridAutoColumnsCss() { return TakeCss(mason_style_get_grid_auto_columns_css(m_mason, m_node)); }
    hstring Style::GridColumnCss() { return TakeCss(mason_style_get_grid_column_css(m_mason, m_node)); }
    hstring Style::GridColumnStartCss() { return TakeCss(mason_style_get_grid_column_start_css(m_mason, m_node)); }
    hstring Style::GridColumnEndCss() { return TakeCss(mason_style_get_grid_column_end_css(m_mason, m_node)); }
    hstring Style::GridRowCss() { return TakeCss(mason_style_get_grid_row_css(m_mason, m_node)); }
    hstring Style::GridRowStartCss() { return TakeCss(mason_style_get_grid_row_start_css(m_mason, m_node)); }
    hstring Style::GridRowEndCss() { return TakeCss(mason_style_get_grid_row_end_css(m_mason, m_node)); }
    hstring Style::GridTemplateRowsCss() { return TakeCss(mason_style_get_grid_template_rows_css(m_mason, m_node)); }
    hstring Style::GridTemplateColumnsCss() { return TakeCss(mason_style_get_grid_template_columns_css(m_mason, m_node)); }
}
