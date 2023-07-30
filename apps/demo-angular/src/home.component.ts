import { Component } from '@angular/core';

@Component({
  selector: 'demo-home',
  templateUrl: 'home.component.html',
})
export class HomeComponent {
  demos = [
    {
      name: 'absolute_layout_align_items_and_justify_content_center',
    },
    {
      name: 'absolute_layout_align_items_and_justify_content_center_and_bottom_position',
    },
    {
      name: 'absolute_layout_align_items_and_justify_content_center_and_left_position',
    },
    {
      name: 'absolute_layout_align_items_and_justify_content_center_and_right_position',
    },
    {
      name: 'absolute_layout_align_items_and_justify_content_center_and_top_position',
    },
    {
      name: 'absolute_layout_align_items_and_justify_content_flex_end',
    },
    {
      name: 'absolute_layout_align_items_center',
    },
    {
      name: 'absolute_layout_align_items_center_on_child_only',
    },
    {
      name: 'absolute_layout_child_order',
    },
    {
      name: 'absolute_layout_in_wrap_reverse_column_container',
    },
    {
      name: 'absolute_layout_in_wrap_reverse_column_container_flex_end',
    },
    {
      name: 'absolute_layout_in_wrap_reverse_row_container',
    },
    {
      name: 'absolute_layout_in_wrap_reverse_row_container_flex_end',
    },
    {
      name: 'absolute_layout_justify_content_center',
    },
    {
      name: 'absolute_layout_no_size',
    },
    {
      name: 'absolute_layout_percentage_bottom_based_on_parent_height',
    },
    {
      name: 'absolute_layout_start_top_end_bottom',
    },
    {
      name: 'absolute_layout_width_height_end_bottom',
    },
    {
      name: 'absolute_layout_width_height_start_top',
    },
    {
      name: 'absolute_layout_width_height_start_top_end_bottom',
    },
    {
      name: 'absolute_layout_within_border',
    },
    {
      name: 'align_baseline',
    },
    {
      name: 'align_baseline_child_multiline',
    },
    {
      name: 'align_baseline_nested_child',
    },
    {
      name: 'align_center_should_size_based_on_content',
    },
    {
      name: 'align_content_space_around_single_line',
    },
    {
      name: 'align_content_space_around_wrapped',
    },
    {
      name: 'align_content_space_between_single_line',
    },
    {
      name: 'align_content_space_between_wrapped',
    },
    {
      name: 'align_content_space_evenly_single_line',
    },
    {
      name: 'align_content_space_evenly_wrapped',
    },
    {
      name: 'align_flex_start_with_shrinking_children',
    },
    {
      name: 'align_flex_start_with_shrinking_children_with_stretch',
    },
    {
      name: 'align_flex_start_with_stretching_children',
    },
    {
      name: 'align_items_center',
    },
    {
      name: 'align_items_center_child_with_margin_bigger_than_parent',
    },
    {
      name: 'align_items_center_child_without_margin_bigger_than_parent',
    },
    {
      name: 'align_items_center_with_child_margin',
    },
    {
      name: 'align_items_center_with_child_top',
    },
    {
      name: 'align_items_flex_end',
    },
    {
      name: 'align_items_flex_end_child_with_margin_bigger_than_parent',
    },
    {
      name: 'align_items_flex_end_child_without_margin_bigger_than_parent',
    },
    {
      name: 'align_items_flex_start',
    },
    {
      name: 'align_items_min_max',
    },
    {
      name: 'align_items_stretch',
    },
    {
      name: 'align_self_baseline',
    },
    {
      name: 'align_self_center',
    },
    {
      name: 'align_self_flex_end',
    },
    {
      name: 'align_self_flex_end_override_flex_start',
    },
    {
      name: 'align_self_flex_start',
    },
    {
      name: 'align_stretch_should_size_based_on_parent',
    },
    {
      name: 'border_center_child',
    },
    {
      name: 'border_flex_child',
    },
    {
      name: 'border_no_child',
    },
    {
      name: 'border_stretch_child',
    },
    {
      name: 'child_min_max_width_flexing',
    },
    {
      name: 'container_with_unsized_child',
    },
    {
      name: 'display_none',
    },
    {
      name: 'display_none_fixed_size',
    },
    {
      name: 'display_none_with_child',
    },
    {
      name: 'display_none_with_margin',
    },
    {
      name: 'display_none_with_position',
    },
    {
      name: 'flex_basis_and_main_dimen_set_when_flexing',
    },
    {
      name: 'flex_basis_flex_grow_column',
    },
    {
      name: 'flex_basis_flex_grow_row',
    },
    {
      name: 'flex_basis_flex_shrink_column',
    },
    {
      name: 'flex_basis_flex_shrink_row',
    },
    {
      name: 'flex_basis_larger_than_content_column',
    },
    {
      name: 'flex_basis_larger_than_content_row',
    },
    {
      name: 'flex_basis_overrides_main_size',
    },
    {
      name: 'flex_basis_slightly_smaller_then_content_with_flex_grow_large_size',
    },
    {
      name: 'flex_basis_smaller_than_content_column',
    },
    {
      name: 'flex_basis_smaller_than_content_row',
    },
    {
      name: 'flex_basis_smaller_than_main_dimen_column',
    },
    {
      name: 'flex_basis_smaller_than_main_dimen_row',
    },
    {
      name: 'flex_basis_smaller_then_content_with_flex_grow_large_size',
    },
    {
      name: 'flex_basis_smaller_then_content_with_flex_grow_small_size',
    },
    {
      name: 'flex_basis_smaller_then_content_with_flex_grow_unconstraint_size',
    },
    {
      name: 'flex_basis_smaller_then_content_with_flex_grow_very_large_size',
    },
    {
      name: 'flex_basis_unconstraint_column',
    },
    {
      name: 'flex_basis_unconstraint_row',
    },
    {
      name: 'flex_direction_column',
    },
    {
      name: 'flex_direction_column_no_height',
    },
    {
      name: 'flex_direction_column_reverse',
    },
    {
      name: 'flex_direction_row',
    },
    {
      name: 'flex_direction_row_no_width',
    },
    {
      name: 'flex_direction_row_reverse',
    },
    {
      name: 'flex_grow_child',
    },
    {
      name: 'flex_grow_flex_basis_percent_min_max',
    },
    {
      name: 'flex_grow_height_maximized',
    },
    {
      name: 'flex_grow_in_at_most_container',
    },
    {
      name: 'flex_grow_less_than_factor_one',
    },
    {
      name: 'flex_grow_root_minimized',
    },
    {
      name: 'flex_grow_shrink_at_most',
    },
    {
      name: 'flex_grow_to_min',
    },
    {
      name: 'flex_grow_within_constrained_max_column',
    },
    {
      name: 'flex_grow_within_constrained_max_row',
    },
    {
      name: 'flex_grow_within_constrained_max_width',
    },
    {
      name: 'flex_grow_within_constrained_min_column',
    },
    {
      name: 'flex_grow_within_constrained_min_max_column',
    },
    {
      name: 'flex_grow_within_constrained_min_row',
    },
    {
      name: 'flex_grow_within_max_width',
    },
    {
      name: 'flex_root_ignored',
    },
    {
      name: 'flex_shrink_by_outer_margin_with_max_size',
    },
    {
      name: 'flex_shrink_flex_grow_child_flex_shrink_other_child',
    },
    {
      name: 'flex_shrink_flex_grow_row',
    },
    {
      name: 'flex_shrink_to_zero',
    },
    {
      name: 'flex_wrap_align_stretch_fits_one_row',
    },
    {
      name: 'flex_wrap_children_with_min_main_overriding_flex_basis',
    },
    {
      name: 'flex_wrap_wrap_to_child_height',
    },
    {
      name: 'gap_column_gap_child_margins',
    },
    {
      name: 'gap_column_gap_determines_parent_width',
    },
    {
      name: 'gap_column_gap_flexible',
    },
    {
      name: 'gap_column_gap_flexible_undefined_parent',
    },
    {
      name: 'gap_column_gap_inflexible',
    },
    {
      name: 'gap_column_gap_inflexible_undefined_parent',
    },
    {
      name: 'gap_column_gap_justify_center',
    },
    {
      name: 'gap_column_gap_justify_flex_end',
    },
    {
      name: 'gap_column_gap_justify_flex_start',
    },
    {
      name: 'gap_column_gap_justify_space_around',
    },
    {
      name: 'gap_column_gap_justify_space_between',
    },
    {
      name: 'gap_column_gap_justify_space_evenly',
    },
    {
      name: 'gap_column_gap_mixed_flexible',
    },
    {
      name: 'gap_column_gap_percentage_cyclic_partially_shrinkable',
    },
    {
      name: 'gap_column_gap_percentage_cyclic_shrinkable',
    },
    {
      name: 'gap_column_gap_percentage_cyclic_unshrinkable',
    },
    {
      name: 'gap_column_gap_percentage_flexible',
    },
    {
      name: 'gap_column_gap_percentage_flexible_with_padding',
    },
    {
      name: 'gap_column_gap_percentage_inflexible',
    },
    {
      name: 'gap_column_gap_wrap_align_center',
    },
    {
      name: 'gap_column_gap_wrap_align_flex_end',
    },
    {
      name: 'gap_column_gap_wrap_align_flex_start',
    },
    {
      name: 'gap_column_gap_wrap_align_space_around',
    },
    {
      name: 'gap_column_gap_wrap_align_space_between',
    },
    {
      name: 'gap_column_gap_wrap_align_stretch',
    },
    {
      name: 'gap_column_row_gap_wrapping',
    },
    {
      name: 'gap_percentage_row_gap_wrapping',
    },
    {
      name: 'gap_row_gap_align_items_end',
    },
    {
      name: 'gap_row_gap_align_items_stretch',
    },
    {
      name: 'gap_row_gap_column_child_margins',
    },
    {
      name: 'gap_row_gap_determines_parent_height',
    },
    {
      name: 'gap_row_gap_row_wrap_child_margins',
    },
    {
      name: 'grid_absolute_align_self_sized_all',
    },
    {
      name: 'grid_absolute_column_end',
    },
    {
      name: 'grid_absolute_column_start',
    },
    {
      name: 'grid_absolute_container_bottom_left',
    },
    {
      name: 'grid_absolute_container_bottom_left_margin',
    },
    {
      name: 'grid_absolute_container_left_overrides_right',
    },
    {
      name: 'grid_absolute_container_left_right',
    },
    {
      name: 'grid_absolute_container_left_right_margin',
    },
    {
      name: 'grid_absolute_container_negative_position',
    },
    {
      name: 'grid_absolute_container_negative_position_margin',
    },
    {
      name: 'grid_absolute_container_top_bottom',
    },
    {
      name: 'grid_absolute_container_top_bottom_margin',
    },
    {
      name: 'grid_absolute_container_top_right',
    },
    {
      name: 'grid_absolute_container_top_right_margin',
    },
    {
      name: 'grid_absolute_justify_self_sized_all',
    },
    {
      name: 'grid_absolute_row_end',
    },
    {
      name: 'grid_absolute_row_start',
    },
    {
      name: 'grid_absolute_top_overrides_bottom',
    },
    {
      name: 'grid_absolute_with_padding',
    },
    {
      name: 'grid_absolute_with_padding_and_margin',
    },
    {
      name: 'grid_align_content_center',
    },
    {
      name: 'grid_align_content_end',
    },
    {
      name: 'grid_align_content_end_with_padding_border',
    },
    {
      name: 'grid_align_content_space_around',
    },
    {
      name: 'grid_align_content_space_around_with_padding_border',
    },
    {
      name: 'grid_align_content_space_between',
    },
    {
      name: 'grid_align_content_space_between_with_padding_border',
    },
    {
      name: 'grid_align_content_space_evenly',
    },
    {
      name: 'grid_align_content_space_evenly_with_padding_border',
    },
    {
      name: 'grid_align_content_start',
    },
    {
      name: 'grid_align_content_start_with_padding_border',
    },
    {
      name: 'grid_align_items_sized_center',
    },
    {
      name: 'grid_align_items_sized_end',
    },
    {
      name: 'grid_align_items_sized_start',
    },
    {
      name: 'grid_align_items_sized_stretch',
    },
    {
      name: 'grid_align_self_sized_all',
    },
    {
      name: 'grid_auto_columns_fixed_width',
    },
    {
      name: 'grid_auto_fill_fixed_size',
    },
    {
      name: 'grid_auto_fill_with_empty_auto_track',
    },
    {
      name: 'grid_auto_fit_with_empty_auto_track',
    },
    {
      name: 'grid_auto_single_item',
    },
    {
      name: 'grid_auto_single_item_fixed_width',
    },
    {
      name: 'grid_auto_single_item_fixed_width_with_definite_width',
    },
    {
      name: 'grid_basic',
    },
    {
      name: 'grid_basic_implicit_tracks',
    },
    {
      name: 'grid_basic_with_overflow',
    },
    {
      name: 'grid_basic_with_padding',
    },
    {
      name: 'grid_fit_content_points_argument',
    },
    {
      name: 'grid_fit_content_points_max_content',
    },
    {
      name: 'grid_fit_content_points_min_content',
    },
    {
      name: 'grid_fr_auto_no_sized_items',
    },
    {
      name: 'grid_fr_auto_single_item',
    },
    {
      name: 'grid_fr_fixed_size_no_content',
    },
    {
      name: 'grid_fr_fixed_size_single_item',
    },
    {
      name: 'grid_gap',
    },
    {
      name: 'grid_hidden',
    },
    {
      name: 'grid_justify_content_center',
    },
    {
      name: 'grid_justify_content_center_with_padding_border',
    },
    {
      name: 'grid_justify_content_end',
    },
    {
      name: 'grid_justify_content_end_with_padding_border',
    },
    {
      name: 'grid_justify_content_space_around',
    },
    {
      name: 'grid_justify_content_space_around_with_padding_border',
    },
    {
      name: 'grid_justify_content_space_between',
    },
    {
      name: 'grid_justify_content_space_between_with_padding_border',
    },
    {
      name: 'grid_justify_content_space_evenly',
    },
    {
      name: 'grid_justify_content_space_evenly_with_padding_border',
    },
    {
      name: 'grid_justify_content_start',
    },
    {
      name: 'grid_justify_content_start_with_padding_border',
    },
    {
      name: 'grid_justify_items_sized_center',
    },
    {
      name: 'grid_justify_items_sized_end',
    },
    {
      name: 'grid_justify_items_sized_start',
    },
    {
      name: 'grid_justify_items_sized_stretch',
    },
    {
      name: 'grid_justify_self_sized_all',
    },
    {
      name: 'grid_margins_auto_margins',
    },
    {
      name: 'grid_margins_auto_margins_override_stretch',
    },
    {
      name: 'grid_margins_fixed_center',
    },
    {
      name: 'grid_margins_fixed_end',
    },
    {
      name: 'grid_margins_fixed_start',
    },
    {
      name: 'grid_margins_fixed_stretch',
    },
    {
      name: 'grid_margins_percent_center',
    },
    {
      name: 'grid_margins_percent_end',
    },
    {
      name: 'grid_margins_percent_start',
    },
    {
      name: 'grid_margins_percent_stretch',
    },
    {
      name: 'grid_max_content_maximum_single_item',
    },
    {
      name: 'grid_max_content_single_item',
    },
    {
      name: 'grid_max_content_single_item_margin_auto',
    },
    {
      name: 'grid_max_content_single_item_margin_fixed',
    },
    {
      name: 'grid_max_content_single_item_margin_percent',
    },
    {
      name: 'grid_min_content_flex_column',
    },
    {
      name: 'grid_min_content_flex_row',
    },
    {
      name: 'grid_min_content_flex_single_item',
    },
    {
      name: 'grid_min_content_flex_single_item_margin_auto',
    },
    {
      name: 'grid_min_content_flex_single_item_margin_fixed',
    },
    {
      name: 'grid_min_content_flex_single_item_margin_percent',
    },
    {
      name: 'grid_min_content_maximum_single_item',
    },
    {
      name: 'grid_min_content_single_item',
    },
    {
      name: 'grid_min_max_column_auto',
    },
    {
      name: 'grid_min_max_column_fixed_width_above_range',
    },
    {
      name: 'grid_min_max_column_fixed_width_below_range',
    },
    {
      name: 'grid_min_max_column_fixed_width_within_range',
    },
    {
      name: 'grid_out_of_order_items',
    },
    {
      name: 'grid_percent_items_nested_moderate',
    },
    {
      name: 'grid_percent_items_nested_with_padding_margin',
    },
    {
      name: 'grid_percent_items_width_and_margin',
    },
    {
      name: 'grid_percent_items_width_and_padding',
    },
    {
      name: 'grid_percent_tracks_definite_overflow',
    },
    {
      name: 'grid_percent_tracks_definite_underflow',
    },
    {
      name: 'grid_percent_tracks_indefinite_only',
    },
    {
      name: 'grid_percent_tracks_indefinite_with_content_overflow',
    },
    {
      name: 'grid_percent_tracks_indefinite_with_content_underflow',
    },
    {
      name: 'grid_placement_auto_negative',
    },
    {
      name: 'grid_placement_definite_in_secondary_axis_with_fully_definite_negative',
    },
    {
      name: 'grid_relayout_vertical_text',
    },
    {
      name: 'grid_size_child_fixed_tracks',
    },
    {
      name: 'justify_content_column_center',
    },
    {
      name: 'justify_content_column_flex_end',
    },
    {
      name: 'justify_content_column_flex_start',
    },
    {
      name: 'justify_content_column_min_height_and_margin_bottom',
    },
    {
      name: 'justify_content_column_min_height_and_margin_top',
    },
    {
      name: 'justify_content_column_space_around',
    },
    {
      name: 'justify_content_column_space_between',
    },
    {
      name: 'justify_content_column_space_evenly',
    },
    {
      name: 'justify_content_min_max',
    },
    {
      name: 'justify_content_min_width_with_padding_child_width_greater_than_parent',
    },
    {
      name: 'justify_content_min_width_with_padding_child_width_lower_than_parent',
    },
    {
      name: 'justify_content_overflow_min_max',
    },
    {
      name: 'justify_content_row_center',
    },
    {
      name: 'justify_content_row_flex_end',
    },
    {
      name: 'justify_content_row_flex_start',
    },
    {
      name: 'justify_content_row_max_width_and_margin',
    },
    {
      name: 'justify_content_row_min_width_and_margin',
    },
    {
      name: 'justify_content_row_space_around',
    },
    {
      name: 'justify_content_row_space_between',
    },
    {
      name: 'justify_content_row_space_evenly',
    },
    {
      name: 'margin_and_flex_column',
    },
    {
      name: 'margin_and_flex_row',
    },
    {
      name: 'margin_and_stretch_column',
    },
    {
      name: 'margin_and_stretch_row',
    },
    {
      name: 'margin_auto_bottom',
    },
    {
      name: 'margin_auto_bottom_and_top',
    },
    {
      name: 'margin_auto_bottom_and_top_justify_center',
    },
    {
      name: 'margin_auto_left',
    },
    {
      name: 'margin_auto_left_and_right',
    },
    {
      name: 'margin_auto_left_and_right_column',
    },
    {
      name: 'margin_auto_left_and_right_column_and_center',
    },
    {
      name: 'margin_auto_left_and_right_stretch',
    },
    {
      name: 'margin_auto_left_child_bigger_than_parent',
    },
    {
      name: 'margin_auto_left_fix_right_child_bigger_than_parent',
    },
    {
      name: 'margin_auto_left_right_child_bigger_than_parent',
    },
    {
      name: 'margin_auto_left_stretching_child',
    },
    {
      name: 'margin_auto_mutiple_children_column',
    },
    {
      name: 'margin_auto_mutiple_children_row',
    },
    {
      name: 'margin_auto_right',
    },
    {
      name: 'margin_auto_top',
    },
    {
      name: 'margin_auto_top_and_bottom_stretch',
    },
    {
      name: 'margin_auto_top_stretching_child',
    },
    {
      name: 'margin_bottom',
    },
    {
      name: 'margin_fix_left_auto_right_child_bigger_than_parent',
    },
    {
      name: 'margin_left',
    },
    {
      name: 'margin_right',
    },
    {
      name: 'margin_should_not_be_part_of_max_height',
    },
    {
      name: 'margin_should_not_be_part_of_max_width',
    },
    {
      name: 'margin_top',
    },
    {
      name: 'margin_with_sibling_column',
    },
    {
      name: 'margin_with_sibling_row',
    },
    {
      name: 'max_height',
    },
    {
      name: 'max_height_overrides_height',
    },
    {
      name: 'max_height_overrides_height_on_root',
    },
    {
      name: 'max_width',
    },
    {
      name: 'max_width_overrides_width',
    },
    {
      name: 'max_width_overrides_width_on_root',
    },
    {
      name: 'measure_child',
    },
    {
      name: 'measure_child_absolute',
    },
    {
      name: 'measure_child_constraint',
    },
    {
      name: 'measure_child_constraint_padding_parent',
    },
    {
      name: 'measure_child_with_flex_grow',
    },
    {
      name: 'measure_child_with_flex_shrink',
    },
    {
      name: 'measure_flex_basis_overrides_measure',
    },
    {
      name: 'measure_height_overrides_measure',
    },
    {
      name: 'measure_remeasure_child_after_growing',
    },
    {
      name: 'measure_remeasure_child_after_shrinking',
    },
    {
      name: 'measure_remeasure_child_after_stretching',
    },
    {
      name: 'measure_root',
    },
    {
      name: 'measure_stretch_overrides_measure',
    },
    {
      name: 'measure_width_overrides_measure',
    },
    {
      name: 'min_height',
    },
    {
      name: 'min_height_overrides_height',
    },
    {
      name: 'min_height_overrides_height_on_root',
    },
    {
      name: 'min_height_overrides_max_height',
    },
    {
      name: 'min_max_percent_no_width_height',
    },
    {
      name: 'min_width',
    },
    {
      name: 'min_width_overrides_max_width',
    },
    {
      name: 'min_width_overrides_width',
    },
    {
      name: 'min_width_overrides_width_on_root',
    },
    {
      name: 'nested_overflowing_child',
    },
    {
      name: 'nested_overflowing_child_in_constraint_parent',
    },
    {
      name: 'overflow_cross_axis',
    },
    {
      name: 'overflow_main_axis',
    },
    {
      name: 'padding_align_end_child',
    },
    {
      name: 'padding_center_child',
    },
    {
      name: 'padding_flex_child',
    },
    {
      name: 'padding_no_child',
    },
    {
      name: 'padding_stretch_child',
    },
    {
      name: 'parent_wrap_child_size_overflowing_parent',
    },
    {
      name: 'percent_absolute_position',
    },
    {
      name: 'percent_within_flex_grow',
    },
    {
      name: 'percentage_absolute_position',
    },
    {
      name: 'percentage_container_in_wrapping_container',
    },
    {
      name: 'percentage_flex_basis',
    },
    {
      name: 'percentage_flex_basis_cross',
    },
    {
      name: 'percentage_flex_basis_cross_max_height',
    },
    {
      name: 'percentage_flex_basis_cross_max_width',
    },
    {
      name: 'percentage_flex_basis_cross_min_height',
    },
    {
      name: 'percentage_flex_basis_cross_min_width',
    },
    {
      name: 'percentage_flex_basis_main_max_height',
    },
    {
      name: 'percentage_flex_basis_main_max_width',
    },
    {
      name: 'percentage_flex_basis_main_min_width',
    },
    {
      name: 'percentage_margin_should_calculate_based_only_on_width',
    },
    {
      name: 'percentage_moderate_complexity',
    },
    {
      name: 'percentage_multiple_nested_with_padding_margin_and_percentage_values',
    },
    {
      name: 'percentage_padding_should_calculate_based_only_on_width',
    },
    {
      name: 'percentage_position_bottom_right',
    },
    {
      name: 'percentage_position_left_top',
    },
    {
      name: 'percentage_size_based_on_parent_inner_size',
    },
    {
      name: 'percentage_size_of_flex_basis',
    },
    {
      name: 'percentage_width_height',
    },
    {
      name: 'percentage_width_height_undefined_parent_size',
    },
    {
      name: 'relative_position_should_not_nudge_siblings',
    },
    {
      name: 'rounding_flex_basis_flex_grow_row_prime_number_width',
    },
    {
      name: 'rounding_flex_basis_flex_grow_row_width_of_100',
    },
    {
      name: 'rounding_flex_basis_flex_shrink_row',
    },
    {
      name: 'rounding_flex_basis_overrides_main_size',
    },
    {
      name: 'rounding_fractial_input_1',
    },
    {
      name: 'rounding_fractial_input_2',
    },
    {
      name: 'rounding_fractial_input_3',
    },
    {
      name: 'rounding_fractial_input_4',
    },
    {
      name: 'rounding_total_fractial',
    },
    {
      name: 'rounding_total_fractial_nested',
    },
    {
      name: 'size_defined_by_child',
    },
    {
      name: 'size_defined_by_child_with_border',
    },
    {
      name: 'size_defined_by_child_with_padding',
    },
    {
      name: 'size_defined_by_grand_child',
    },
    {
      name: 'width_smaller_then_content_with_flex_grow_large_size',
    },
    {
      name: 'width_smaller_then_content_with_flex_grow_small_size',
    },
    {
      name: 'width_smaller_then_content_with_flex_grow_unconstraint_size',
    },
    {
      name: 'width_smaller_then_content_with_flex_grow_very_large_size',
    },
    {
      name: 'wrap_column',
    },
    {
      name: 'wrap_nodes_with_content_sizing_margin_cross',
    },
    {
      name: 'wrap_nodes_with_content_sizing_overflowing_margin',
    },
    {
      name: 'wrap_reverse_column',
    },
    {
      name: 'wrap_reverse_column_fixed_size',
    },
    {
      name: 'wrap_reverse_row',
    },
    {
      name: 'wrap_reverse_row_align_content_center',
    },
    {
      name: 'wrap_reverse_row_align_content_flex_start',
    },
    {
      name: 'wrap_reverse_row_align_content_space_around',
    },
    {
      name: 'wrap_reverse_row_align_content_stretch',
    },
    {
      name: 'wrap_reverse_row_single_line_different_size',
    },
    {
      name: 'wrap_row',
    },
    {
      name: 'wrap_row_align_items_center',
    },
    {
      name: 'wrap_row_align_items_flex_end',
    },
    {
      name: 'wrapped_column_max_height',
    },
    {
      name: 'wrapped_column_max_height_flex',
    },
    {
      name: 'wrapped_row_within_align_items_center',
    },
    {
      name: 'wrapped_row_within_align_items_flex_end',
    },
    {
      name: 'wrapped_row_within_align_items_flex_start',
    },
  ];
}
