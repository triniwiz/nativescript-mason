//
//  Reexports.swift
//  Mason
//
//  Created by Osei Fortune on 03/12/2022.
//

import Foundation

//private func create_layout(_ floats: UnsafePointer<Float>?) -> UnsafeMutableRawPointer? {
//    let layout = MasonLayout.fromFloatPoint(floats!).1
//    return Unmanaged.passRetained(layout).toOpaque()
//}

@objcMembers
@objc(MasonReexports)
public class MasonReexports: NSObject {
    
    
    public static func node_set_style(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer, _  style: UnsafeMutableRawPointer){
        mason_node_set_style(mason, node, style)
    }
    
    //    @objc public static func computed_layout(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer, _ layout: @escaping ((UnsafePointer<Float>?)-> UnsafeMutableRawPointer?)){
    //        mason_node_layout(mason, node) { ptr in
    //            return layout(ptr)
    //        }
    //
    //        let points = mason_node_layout(TSCMason.instance.nativePtr,
    //                                       nativePtr, create_layout)
    //
    //
    //        let layout: MasonLayout = Unmanaged.fromOpaque(points!).takeUnretainedValue()
    //        return layout
    //    }
    //
    @objc public static func node_compute(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer){
        mason_node_compute(mason, node)
    }
    
    public static func node_compute_wh(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer, width: Float, height: Float){
        mason_node_compute_wh(mason, node, width, height)
    }
    
    public static func node_compute_max_content(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer){
        mason_node_compute_max_content(mason, node)
    }
    
    public static func node_compute_min_content(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer){
        mason_node_compute_min_content(mason, node)
    }
    
    public static func node_dirty(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer) -> Bool {
        return mason_node_dirty(mason, node)
    }
    
    public static func node_mark_dirty(_ mason: UnsafeMutableRawPointer, _ node: UnsafeMutableRawPointer) {
        mason_node_mark_dirty(mason, node)
    }
    
    public static func style_get_display(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_display( style)
    }
    
    public static func style_set_display(_  style: UnsafeMutableRawPointer, _ display: Int32) {
        return mason_style_set_display( style, display)
    }
    
    public static func style_get_position(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_position( style)
    }
    
    public static func style_set_position(_  style: UnsafeMutableRawPointer, _ position: Int32) {
        return mason_style_set_position( style, position)
    }
    
    public static func style_get_direction(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_direction( style)
    }
    
    public static func style_set_direction(_  style: UnsafeMutableRawPointer, _ direction: Int32) {
        return mason_style_set_direction( style, direction)
    }
    
    public static func style_get_flex_direction(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_flex_direction( style)
    }
    
    public static func style_set_flex_direction(_  style: UnsafeMutableRawPointer, _ flex_direction: Int32) {
        return mason_style_set_flex_direction( style, flex_direction)
    }
    
    public static func style_get_flex_wrap(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_flex_wrap( style)
    }
    
    public static func style_set_flex_wrap(_  style: UnsafeMutableRawPointer, _ flex_wrap: Int32) {
        return mason_style_set_flex_wrap( style, flex_wrap)
    }
    
    public static func style_get_overflow(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_overflow( style)
    }
    
    public static func style_set_overflow(_  style: UnsafeMutableRawPointer, _ overflow: Int32) {
        return mason_style_set_overflow( style, overflow)
    }
    
    public static func style_get_align_items(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_align_items( style)
    }
    
    public static func style_set_align_items(_  style: UnsafeMutableRawPointer, _ align_items: Int32) {
        return mason_style_set_align_items( style, align_items)
    }
    
    public static func style_get_align_self(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_align_self( style)
    }
    
    public static func style_set_align_self(_  style: UnsafeMutableRawPointer, _ align_self: Int32) {
        return mason_style_set_align_self( style, align_self)
    }
    
    public static func style_get_align_content(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_align_content( style)
    }
    
    public static func style_set_align_content(_  style: UnsafeMutableRawPointer, _ align_content: Int32) {
        return mason_style_set_align_content( style, align_content)
    }
    
    public static func style_get_justify_items(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_justify_items( style)
    }
    
    public static func style_set_justify_items(_  style: UnsafeMutableRawPointer, _ align_items: Int32) {
        return mason_style_set_justify_items( style, align_items)
    }
    
    public static func style_get_justify_self(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_justify_self( style)
    }
    
    public static func style_set_justify_self(_  style: UnsafeMutableRawPointer, _ align_self: Int32) {
        return mason_style_set_justify_self( style, align_self)
    }
    
    public static func style_get_justify_content(_  style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_justify_content( style)
    }
    
    public static func style_set_justify_content(_  style: UnsafeMutableRawPointer, _ justify_content: Int32) {
        return mason_style_set_justify_content( style, justify_content)
    }
    
    public static func style_set_inset(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_inset(style, value, value_type)
    }
    
    public static func style_get_inset_left(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_inset_left( style)
    }
    
    public static func style_set_inset_left(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_inset_left(style, value, value_type)
    }
    
    public static func style_get_inset_right(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_inset_right( style)
    }
    
    public static func style_set_inset_right(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_inset_right(style, value, value_type)
    }
    
    
    public static func style_get_inset_top(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_inset_top( style)
    }
    
    
    public static func style_set_inset_top(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_inset_top(style, value, value_type)
    }
    
    
    public static func style_get_inset_bottom(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_inset_bottom( style)
    }
    
    public static func style_set_inset_bottom(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_inset_bottom(style, value, value_type)
    }
    
    public static func style_set_margin(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_margin(style, value, value_type,value, value_type,value, value_type,value, value_type)
    }
    
    public static func style_get_margin_left(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_margin_left( style)
    }
    
    public static func style_set_margin_left(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_margin_left(style, value, value_type)
    }
    
    public static func style_get_margin_right(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_margin_right( style)
    }
    
    public static func style_set_margin_right(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_margin_right(style, value, value_type)
    }
    
    public static func style_get_margin_top(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_margin_top( style)
    }
    
    public static func style_set_margin_top(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_margin_top(style, value, value_type)
    }
    
    public static func style_get_margin_bottom(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentageAuto {
        return mason_style_get_margin_bottom( style)
    }
    
    public static func style_set_margin_bottom(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageAutoType) {
        return mason_style_set_margin_bottom(style, value, value_type)
    }
    
    public static func style_set_padding(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_padding(style, value, value_type,value, value_type,value, value_type,value, value_type)
    }
    
    public static func style_get_padding_left(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_padding_left( style)
    }
    
    public static func style_set_padding_left(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_padding_left(style, value, value_type)
    }
    
    public static func style_get_padding_right(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_padding_right( style)
    }
    
    public static func style_set_padding_right(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_padding_right(style, value, value_type)
    }
    
    public static func style_get_padding_top(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_padding_top( style)
    }
    
    public static func style_set_padding_top(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_padding_top(style, value, value_type)
    }
    
    public static func style_get_padding_bottom(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_padding_bottom( style)
    }
    
    public static func style_set_padding_bottom(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_padding_bottom(style, value, value_type)
    }
    
    public static func style_set_border(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_border(style, value, value_type,value, value_type,value, value_type,value, value_type)
    }
    
    public static func style_get_border_left(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_border_left( style)
    }
    
    public static func style_set_border_left(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_border_left(style, value, value_type)
    }
    
    public static func style_get_border_right(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_border_right( style)
    }
    
    public static func style_set_border_right(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_border_right(style, value, value_type)
    }
    
    public static func style_get_border_top(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_border_top( style)
    }
    
    public static func style_set_border_top(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_border_top(style, value, value_type)
    }
    
    public static func style_get_border_bottom(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_border_bottom( style)
    }
    
    public static func style_set_border_bottom(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_border_bottom(style, value, value_type)
    }
    
    public static func style_get_flex_grow(_  style: UnsafeMutableRawPointer) -> Float {
        return mason_style_get_flex_grow(style)
    }
    
    public static func style_set_flex_grow(_  style: UnsafeMutableRawPointer,_ value: Float) {
        return mason_style_set_flex_grow(style, value)
    }
    
    public static func style_set_border_bottom(_  style: UnsafeMutableRawPointer,_ value: Float) {
        return mason_style_set_flex_grow(style, value)
    }
    
    public static func style_get_flex_shrink(_  style: UnsafeMutableRawPointer) -> Float {
        return mason_style_get_flex_shrink( style)
    }
    
    public static func style_set_flex_shrink(_  style: UnsafeMutableRawPointer,_ value: Float) {
        return mason_style_set_flex_shrink(style, value)
    }
    
    public static func style_set_flex_basis(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_flex_basis(style, value, value_type)
    }
    
    public static func style_get_flex_basis(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_flex_basis(style)
    }
    
    public static func style_get_width(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_width( style)
    }
    
    public static func style_set_width(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_width(style, value, value_type)
    }
    
    public static func style_get_height(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_height( style)
    }
    
    public static func style_set_height(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_height(style, value, value_type)
    }
    
    public static func style_get_min_width(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_min_width( style)
    }
    
    public static func style_set_min_width(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_min_width(style, value, value_type)
    }
    
    public static func style_get_min_height(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_min_height( style)
    }
    
    public static func style_set_min_height(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_min_height(style, value, value_type)
    }
    
    public static func style_get_max_width(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_max_width( style)
    }
    
    public static func style_set_max_width(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_max_width(style, value, value_type)
    }
    
    public static func style_get_max_height(_  style: UnsafeMutableRawPointer) -> CMasonDimension {
        return mason_style_get_max_height( style)
    }
    
    public static func style_set_max_height(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonDimensionType) {
        return mason_style_set_max_height(style, value, value_type)
    }
    
    public static func style_get_gap(_ style: UnsafeMutableRawPointer) -> CMasonLengthPercentageSize {
        return mason_style_get_gap( style)
    }
    
    public static func style_set_gap(_  style: UnsafeMutableRawPointer,_ width_value: Float, _ width_type: CMasonLengthPercentageType, _ height_value: Float, _ height_type: CMasonLengthPercentageType) {
        return mason_style_set_gap(style, width_value, width_type, height_value, height_type)
    }
    
    public static func style_get_row_gap(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_row_gap( style)
    }
    
    public static func style_set_row_gap(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_row_gap(style, value, value_type)
    }
    
    public static func style_get_column_gap(_  style: UnsafeMutableRawPointer) -> CMasonLengthPercentage {
        return mason_style_get_column_gap( style)
    }
    
    public static func style_set_column_gap(_  style: UnsafeMutableRawPointer,_ value: Float, _ value_type: CMasonLengthPercentageType) {
        return mason_style_set_column_gap(style, value, value_type)
    }
    
    public static func style_get_aspect_ratio(_  style: UnsafeMutableRawPointer) -> Float {
        return mason_style_get_aspect_ratio( style)
    }
    
    public static func style_set_aspect_ratio(_  style: UnsafeMutableRawPointer,_ value: Float) {
        return mason_style_set_aspect_ratio(style, value)
    }
    
    
    public static func style_get_grid_auto_rows(_  style: UnsafeMutableRawPointer) -> UnsafeMutablePointer<CMasonMinMaxArray> {
        return mason_style_get_grid_auto_rows(style)
    }
    
    public static func style_set_grid_auto_rows(
        _ style: UnsafeMutableRawPointer,
        _ value: UnsafeMutablePointer<CMasonMinMaxArray>
    ) {
        mason_style_set_grid_auto_rows(style, value)
    }
    
    public static func style_get_grid_auto_columns(_ style: UnsafeMutableRawPointer) -> UnsafeMutablePointer<CMasonMinMaxArray>  {
        return mason_style_get_grid_auto_columns(style)
    }
    
    public static func style_set_grid_auto_columns(
        _ style: UnsafeMutableRawPointer,
        _ value: UnsafeMutablePointer<CMasonMinMaxArray>
    ) {
        mason_style_set_grid_auto_columns(style, value)
    }
    
    public static func style_get_grid_auto_flow(_ style: UnsafeMutableRawPointer) -> Int32 {
        return mason_style_get_grid_auto_flow(style)
    }
    
    public static func style_set_grid_auto_flow(_ style: UnsafeMutableRawPointer,_ value: Int32) {
        mason_style_set_grid_auto_flow(style, value)
    }
    
    public static func style_get_grid_column_start(_ style: UnsafeMutableRawPointer) -> CMasonGridPlacement {
        return mason_style_get_grid_column_start(style)
    }
    
    public static func style_set_grid_column_start(
        _ style: UnsafeMutableRawPointer,
        _ value: CMasonGridPlacement
    ) {
        mason_style_set_grid_column_start(style, value)
    }
    
    public static func style_get_grid_column_end(_ style: UnsafeMutableRawPointer) -> CMasonGridPlacement {
        return mason_style_get_grid_column_end(style)
    }
    
    public static func style_set_grid_column_end(_ style: UnsafeMutableRawPointer, _ value: CMasonGridPlacement) {
        mason_style_set_grid_column_end(style, value)
    }
    
    public static func style_get_grid_row_start(_ style: UnsafeMutableRawPointer) -> CMasonGridPlacement {
        return mason_style_get_grid_row_start(style)
    }
    
    public static func style_set_grid_row_start(_ style: UnsafeMutableRawPointer, _ value: CMasonGridPlacement) {
        mason_style_set_grid_row_start(style, value)
    }
    
    public static func style_get_grid_row_end(_ style: UnsafeMutableRawPointer) -> CMasonGridPlacement {
        return mason_style_get_grid_row_end(style)
    }
    
    public static func style_set_grid_row_end(_ style: UnsafeMutableRawPointer, _ value: CMasonGridPlacement) {
        mason_style_set_grid_row_end(style, value)
    }
    
    public static func style_get_grid_template_rows(
        _ style: UnsafeMutableRawPointer
    )-> UnsafeMutablePointer<CMasonTrackSizingFunctionArray> {
        return mason_style_get_grid_template_rows(style)
    }
    
    public static func style_set_grid_template_rows(
        _ style: UnsafeMutableRawPointer,
        _ value: UnsafeMutablePointer<CMasonTrackSizingFunctionArray>
    ) {
        mason_style_set_grid_template_rows(
            style,
            value
        )
    }
    
    public static func style_get_grid_template_columns(
        _ style: UnsafeMutableRawPointer
    ) -> UnsafeMutablePointer<CMasonTrackSizingFunctionArray>{
        return mason_style_get_grid_template_columns(style)
    }
    
    public static func style_set_grid_template_columns(
        _ style: UnsafeMutableRawPointer,
        _ value: UnsafeMutablePointer<CMasonTrackSizingFunctionArray>
    ) {
        mason_style_set_grid_template_columns(
            style,
            value
        )
    }
    
    
    public static func style_update_with_values(_ style: UnsafeMutableRawPointer,
                                                _ display: Int32,
                                                _ position: Int32,
                                                _ direction: Int32,
                                                _ flexDirection: Int32,
                                                _ flexWrap: Int32,
                                                _ overflow: Int32,
                                                _ alignItems: Int32,
                                                _ alignSelf: Int32,
                                                _ alignContent: Int32,
                                                _ justifyItems: Int32,
                                                _ justifySelf: Int32,
                                                _ justifyContent: Int32,
                                                
                                                _ insetLeftType: Int32,
                                                _ insetLeftValue: Float,
                                                _ insetRightType: Int32,
                                                _ insetRightValue: Float,
                                                _ insetTopType: Int32,
                                                _ insetTopValue: Float,
                                                _ insetBottomType: Int32,
                                                _ insetBottomValue: Float,
                                                
                                                _ marginLeftType: Int32,
                                                _ marginLeftValue: Float,
                                                _ marginRightType: Int32,
                                                _ marginRightValue: Float,
                                                _ marginTopType: Int32,
                                                _ marginTopValue: Float,
                                                _ marginBottomType: Int32,
                                                _ marginBottomValue: Float,
                                                
                                                _ paddingLeftType: Int32,
                                                _ paddingLeftValue: Float,
                                                _ paddingRightType: Int32,
                                                _ paddingRightValue: Float,
                                                _ paddingTopType: Int32,
                                                _ paddingTopValue: Float,
                                                _ paddingBottomType: Int32,
                                                _ paddingBottomValue: Float,
                                                
                                                _ borderLeftType: Int32,
                                                _ borderLeftValue: Float,
                                                _ borderRightType: Int32,
                                                _ borderRightValue: Float,
                                                _ borderTopType: Int32,
                                                _ borderTopValue: Float,
                                                _ borderBottomType: Int32,
                                                _ borderBottomValue: Float,
                                                
                                                _ flexGrow: Float,
                                                _ flexShrink: Float,
                                                
                                                _ flexBasisType: Int32,
                                                _ flexBasisValue: Float,
                                                
                                                _ widthType: Int32,
                                                _ widthValue: Float,
                                                _ heightType: Int32,
                                                _ heightValue: Float,
                                                
                                                _ minWidthType: Int32,
                                                _ minWidthValue: Float,
                                                _ minHeightType: Int32,
                                                _ minHeightValue: Float,
                                                
                                                _ maxWidthType: Int32,
                                                _ maxWidthValue: Float,
                                                _ maxHeightType: Int32,
                                                _ maxHeightValue: Float,
                                                
                                                _ gapRowType: Int32,
                                                _ gapRowValue: Float,
                                                _ gapColumnType: Int32,
                                                _ gapColumnValue: Float,
                                                _ aspectRatio: Float,
                                                _ gridAutoRows: UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>,
                                                _ gridAutoColumns: UnsafeMutablePointer<CMasonNonRepeatedTrackSizingFunctionArray>,
                                                _ gridAutoFlow: Int32,
                                                _ gridColumnStartType: Int32,
                                                _ gridColumnStartValue: Int16,
                                                _ gridColumnEndType: Int32,
                                                _ gridColumnEndValue: Int16,
                                                _ gridRowStartType: Int32,
                                                _ gridRowStartValue: Int16,
                                                _ gridRowEndType: Int32,
                                                _ gridRowEndValue: Int16,
                                                _ gridTemplateRows: UnsafeMutablePointer<CMasonTrackSizingFunctionArray>,
                                                gridTemplateColumns: UnsafeMutablePointer<CMasonTrackSizingFunctionArray>
    ){
        mason_style_update_with_values(style, display,
                                       position,
                                       direction,
                                       flexDirection,
                                       flexWrap,
                                       overflow,
                                       alignItems,
                                       alignSelf,
                                       alignContent,
                                       justifyItems,
                                       justifySelf,
                                       justifyContent,
                                       
                                       insetLeftType, insetLeftValue,
                                       insetRightType, insetRightValue,
                                       insetTopType, insetTopValue,
                                       insetBottomType, insetBottomValue,
                                       
                                       marginLeftType, marginLeftValue,
                                       marginRightType, marginRightValue,
                                       marginTopType, marginTopValue,
                                       marginBottomType, marginBottomValue,
                                       
                                       paddingLeftType, paddingLeftValue,
                                       paddingRightType, paddingRightValue,
                                       paddingTopType, paddingTopValue,
                                       paddingBottomType, paddingBottomValue,
                                       
                                       borderLeftType, borderLeftValue,
                                       borderRightType, borderRightValue,
                                       borderTopType, borderTopValue,
                                       borderBottomType, borderBottomValue,
                                       
                                       flexGrow, flexShrink,
                                       flexBasisType, flexBasisValue,
                                       
                                       widthType, widthValue,
                                       heightType, heightValue,
                                       
                                       minWidthType, minWidthValue,
                                       minHeightType, minHeightValue,
                                       
                                       maxWidthType, maxWidthValue,
                                       maxHeightType, maxHeightValue,
                                       
                                       gapRowType, gapRowValue,
                                       gapColumnType, gapColumnValue,
                                       aspectRatio,
                                       gridAutoRows,
                                       gridAutoColumns,
                                       gridAutoFlow,
                                       gridColumnStartType,
                                       gridColumnStartValue,
                                       gridColumnEndType,
                                       gridColumnEndValue,
                                       gridRowStartType,
                                       gridRowStartValue,
                                       gridRowEndType,
                                       gridRowEndValue,
                                       gridTemplateRows,
                                       gridTemplateColumns
                                       
        )
    }
}

