/* C ABI of libmasonkit.so (crates/mason-linux), called from native.linux.ts. Widgets are GtkWidget*,
   runs and events GObject*. */
#ifndef MASON_LINUX_H
#define MASON_LINUX_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef bool (*mason_gtk_foreign_measure_fn)(void *widget, float known_width, float known_height, float available_width, float available_height);
typedef void (*mason_gtk_foreign_layout_fn)(void *widget, float x, float y, float width, float height);
typedef void (*mason_gtk_event_fn)(int32_t listener, void *event);
typedef void (*mason_gtk_url_loader_fn)(const char *url);

bool mason_gtk_init(void);
float *mason_gtk_scratch(void);
int32_t mason_gtk_style_size(void);
bool mason_gtk_get_preflight(void);
void mason_gtk_set_preflight(bool enabled);
void mason_gtk_set_foreign_measure(mason_gtk_foreign_measure_fn callback);
void mason_gtk_set_foreign_layout(mason_gtk_foreign_layout_fn callback);
void mason_gtk_set_event_dispatcher(mason_gtk_event_fn callback);
void mason_gtk_set_url_loader(mason_gtk_url_loader_fn callback);
bool mason_gtk_register_fonts(const char *directory);
void mason_gtk_fonts_changed(void);
void mason_gtk_texture_loaded(const char *url, const void *data, size_t length);

void *mason_gtk_element_new(int32_t kind);
int32_t mason_gtk_element_kind(void *element);
void *mason_gtk_scroll_new(void *content);
uint8_t *mason_gtk_style_values(void *element);
uint8_t *mason_gtk_foreign_style_values(void *widget);
uint8_t *mason_gtk_default_style(void);
void mason_gtk_sync_style(void *element, int32_t d0, int32_t d1, int32_t d2, int32_t d3);
void mason_gtk_sync_foreign_style(void *widget, int32_t d0, int32_t d1, int32_t d2, int32_t d3);
void mason_gtk_reparent_child(void *parent, void *child, int32_t index);
void mason_gtk_remove_child(void *parent, void *child);
void mason_gtk_set_percent_size(void *widget, bool horizontal, float fraction);
void mason_gtk_invalidate(void *element);
void mason_gtk_measure(void *element, int32_t width_spec, int32_t height_spec);
void mason_gtk_layout(void *element);
void mason_gtk_print_tree(void *element);
int32_t mason_gtk_add_event_listener(void *element, const char *type);
bool mason_gtk_remove_event_listener(void *element, const char *type, int32_t id);
void *mason_gtk_element_from_point(void *element, float x, float y);

const char *mason_gtk_event_string(void *event, int32_t which);
double mason_gtk_event_number(void *event, int32_t which);
void *mason_gtk_event_target(void *event, int32_t which);
void mason_gtk_event_call(void *event, int32_t which);

double mason_gtk_scroll_metric(void *element, int32_t which);
void mason_gtk_scroll_to(void *element, double left, double top, bool smooth);
void mason_gtk_scroll_into_view(void *element, int32_t block, int32_t inline_mode, bool smooth);

void mason_gtk_set_role(void *element, int32_t role);
int32_t mason_gtk_role(void *element);
void mason_gtk_set_open(void *element, bool open);
bool mason_gtk_open(void *element);
void *mason_gtk_details(void *element);
void mason_gtk_list_set_ordered(void *element, bool ordered);
bool mason_gtk_list_ordered(void *element);

void mason_gtk_update_grid(void *element, const char *auto_rows, const char *auto_columns, const char *column, const char *column_start, const char *column_end, const char *row, const char *row_start, const char *row_end, const char *template_rows, const char *template_columns, const char *area, const char *template_areas);
const char *mason_gtk_grid_css(void *element, int32_t which);

void mason_gtk_text_set_content(void *element, const char *value);
const char *mason_gtk_text_content(void *element);
void mason_gtk_set_font_family(void *element, const char *family);
void mason_gtk_text_set_run(void *element, void *run, int32_t index);
void mason_gtk_text_remove_run(void *element, void *run);
void mason_gtk_text_clear_runs(void *element);
void mason_gtk_text_set_inline_text(void *element, void *child, int32_t index);
void mason_gtk_text_remove_inline_text(void *element, void *child);
void mason_gtk_text_set_inline_box(void *element, void *child, int32_t index);
void mason_gtk_text_remove_inline_box(void *element, void *child);
void mason_gtk_text_set_flag(void *element, int32_t which, bool value);
bool mason_gtk_text_flag(void *element, int32_t which);
void mason_gtk_text_set_shadow(void *element, const char *spec);
void mason_gtk_text_set_feature_settings(void *element, const char *value);

void *mason_gtk_text_node_new(void);
void mason_gtk_text_node_set_data(void *run, const char *data);
const char *mason_gtk_text_node_data(void *run);
void mason_gtk_text_node_set_break(void *run, bool value);

void mason_gtk_image_set_source(void *element, const char *source);
const char *mason_gtk_image_source(void *element);

void mason_gtk_input_set_type(void *element, int32_t type);
int32_t mason_gtk_input_type(void *element);
void mason_gtk_input_set_value(void *element, const char *value);
const char *mason_gtk_input_value(void *element);
void mason_gtk_input_set_placeholder(void *element, const char *value);
const char *mason_gtk_input_placeholder(void *element);
void mason_gtk_input_set_flag(void *element, int32_t which, bool value);
bool mason_gtk_input_flag(void *element, int32_t which);
void mason_gtk_input_set_accept(void *element, const char *value);
void mason_gtk_input_set_int(void *element, int32_t which, int32_t value);
int32_t mason_gtk_input_int(void *element, int32_t which);
void mason_gtk_input_set_placeholder_color(void *element, uint32_t argb, bool clear);
void mason_gtk_input_focus(void *element);

void mason_gtk_css_clear_background(void *element);
void mason_gtk_css_linear_gradient(void *element, double angle, int32_t corner_x, int32_t corner_y, const char *stops, const char *interpolation);
void mason_gtk_css_radial_gradient(void *element, double center_x, double center_y, double radius_x, double radius_y, const char *stops, const char *interpolation);
void mason_gtk_css_background_image(void *element, const char *source, int32_t fit, int32_t align_x, int32_t align_y);
void mason_gtk_css_set_layers(void *element, const char *spec);
void mason_gtk_css_set_box_shadow(void *element, const char *spec);
void mason_gtk_css_set_filter(void *element, const char *spec, bool backdrop);
void mason_gtk_css_set_mask(void *element, int32_t which, const char *spec);
void mason_gtk_css_set_transforms(void *element, double scale_x, double scale_y, double angle, double translate_x, double translate_y, double origin_x, double origin_y);
void mason_gtk_css_apply_transform(void *element, double m11, double m12, double m21, double m22, double dx, double dy);
void mason_gtk_css_clear_transform(void *element);
void mason_gtk_css_set_transform_origin(void *element, double x, double y);

#endif
