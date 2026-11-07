// NativeScript.Mason on Linux: the Windows component's API over libmasonkit.so, so the shared
// Windows paths run unchanged. Elements extend interop.Pointer: core sees the GtkWidget.

import { View as CoreView, Utils } from '@nativescript/core';
import { viewForWidget } from '@nativescript/core/ui/core/view/gtk-layout';

const enum Kind {
  View = 0,
  Text = 1,
  Image = 2,
  Button = 3,
  Li = 4,
  Br = 5,
  List = 6,
  Input = 7,
  TextArea = 8,
}

const PointerBase = interop.Pointer as unknown as new (address: any) => interop.Pointer;

const scratch = new Float32Array(interop.bufferFromData(mason_gtk_scratch() as interop.Pointer, 64));
const STYLE_SIZE = mason_gtk_style_size();

// Each facade owns one GObject reference, dropped when it is collected.
const released = new FinalizationRegistry<number>((address) => g_object_unref(new interop.Pointer(address) as any));
const elements = new Map<number, WeakRef<Element>>();

function adopt(object: interop.Pointer, owner: object, ref: boolean) {
  const address = object.toNumber();
  if (ref) g_object_ref(object as any);
  released.register(owner, address);
  return address;
}

/** The facade of a native element (made for elements created natively). */
export function elementOf(pointer: any): Element | null {
  if (!pointer) return null;
  const address = typeof pointer === 'number' ? pointer : pointer.toNumber();
  if (!address) return null;
  const existing = elements.get(address)?.deref();
  if (existing) return existing;
  const kind = mason_gtk_element_kind(new interop.Pointer(address) as any);
  if (kind < 0) return null;
  const Class = classForKind(kind);
  return Reflect.construct(Class, [kind, new interop.Pointer(address), true]) as Element;
}

const listeners = new Map<number, (event: Event) => void>();

const dispatch = (id: number, event: interop.Pointer) => {
  const listener = listeners.get(id);
  if (listener) listener(new Event(event));
};

const spec = (known: number, available: number) => {
  if (!isNaN(known)) return Utils.layout.makeMeasureSpec(known, Utils.layout.EXACTLY);
  if (available >= 0) return Utils.layout.makeMeasureSpec(available, Utils.layout.AT_MOST);
  return Utils.layout.makeMeasureSpec(0, Utils.layout.UNSPECIFIED);
};

// Plain NativeScript children of Mason elements measure and lay out through core.
const foreignMeasure = (widget: interop.Pointer, kw: number, kh: number, aw: number, ah: number) => {
  const view = viewForWidget(widget) as any;
  if (!view) return false;
  CoreView.measureChild(view.parent, view, spec(kw, aw), spec(kh, ah));
  scratch[0] = view.getMeasuredWidth();
  scratch[1] = view.getMeasuredHeight();
  return true;
};

const foreignLayout = (widget: interop.Pointer, x: number, y: number, w: number, h: number) => {
  const view = viewForWidget(widget) as any;
  if (!view) return;
  const width = Math.round(w);
  const height = Math.round(h);
  CoreView.measureChild(view.parent, view, Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY), Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY));
  view.layout(Math.round(x), Math.round(y), Math.round(x) + width, Math.round(y) + height, false);
};

// Remote images: the runtime's fetch, bytes back to the texture cache.
const loadUrl = (url: string) => {
  fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : new ArrayBuffer(0)))
    .catch(() => new ArrayBuffer(0))
    .then((data) => mason_gtk_texture_loaded(url, data, data.byteLength));
};

mason_gtk_set_event_dispatcher(dispatch as any);
mason_gtk_set_foreign_measure(foreignMeasure as any);
mason_gtk_set_foreign_layout(foreignLayout as any);
mason_gtk_set_url_loader(loadUrl as any);

const GRID = ['GridAreaCss', 'GridTemplateAreasCss', 'GridAutoRowsCss', 'GridAutoColumnsCss', 'GridColumnCss', 'GridColumnStartCss', 'GridColumnEndCss', 'GridRowCss', 'GridRowStartCss', 'GridRowEndCss', 'GridTemplateRowsCss', 'GridTemplateColumnsCss'];

class Style {
  constructor(private element: Element) {}

  get Values(): ArrayBuffer {
    return this.element.values;
  }

  UpdateGrid(...values: string[]) {
    (mason_gtk_update_grid as any)(this.element, ...values.map((v) => v ?? ''));
  }

  PrepareForMutation() {}
}

for (let i = 0; i < GRID.length; i++) {
  Object.defineProperty(Style.prototype, GRID[i], {
    get(this: any) {
      return mason_gtk_grid_css(this.element, i) ?? '';
    },
  });
}

export class Element extends PointerBase {
  private _style?: Style;
  private _values?: ArrayBuffer;

  constructor(kind: number, existing?: interop.Pointer, ref = false) {
    super(existing ?? (mason_gtk_element_new(kind) as interop.Pointer));
    elements.set(adopt(this, this, ref), new WeakRef(this));
  }

  get Node() {
    return this;
  }

  get Style(): Style {
    return (this._style ??= new Style(this));
  }

  /** Live view of the element's style in the engine (zero-copy). */
  get values(): ArrayBuffer {
    return (this._values ??= interop.bufferFromData(mason_gtk_style_values(this) as interop.Pointer, STYLE_SIZE));
  }

  /** Border box from the last layout, relative to the parent element. */
  Layout(): { x: number; y: number; width: number; height: number } {
    mason_gtk_layout(this);
    return { x: scratch[0], y: scratch[1], width: scratch[2], height: scratch[3] };
  }

  get ActualWidth(): number {
    mason_gtk_layout(this);
    return scratch[2];
  }

  get ActualHeight(): number {
    mason_gtk_layout(this);
    return scratch[3];
  }

  get NodeKind(): number {
    return mason_gtk_element_kind(this);
  }

  SyncStyle(d0: number, d1: number, d2: number, d3: number) {
    mason_gtk_sync_style(this, d0, d1, d2, d3);
  }

  Invalidate() {
    mason_gtk_invalidate(this);
  }

  /** Measures a layout root for NativeScript specs. */
  Measure(widthSpec: number, heightSpec: number): { width: number; height: number } {
    mason_gtk_measure(this, widthSpec, heightSpec);
    return { width: scratch[0], height: scratch[1] };
  }

  PrintTree() {
    mason_gtk_print_tree(this);
  }
}

class Container extends Element {
  /** Truthy for panels: shared code tells containers from text with it. */
  get Children() {
    return this;
  }
}

export class View extends Container {
  constructor(kind = Kind.View, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }

  get Role(): number {
    return mason_gtk_role(this);
  }

  set Role(value: number) {
    mason_gtk_set_role(this, value);
  }

  get Open(): boolean {
    return mason_gtk_open(this);
  }

  set Open(value: boolean) {
    mason_gtk_set_open(this, !!value);
  }

  get Details(): View | null {
    return elementOf(mason_gtk_details(this)) as View | null;
  }
}

export class Li extends Container {
  constructor(kind = Kind.Li, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }
}

export class List extends Container {
  constructor(ordered: any = false, existing?: interop.Pointer, ref = false) {
    super(Kind.List, existing, ref);
    if (!existing) mason_gtk_list_set_ordered(this, !!ordered);
  }

  get Ordered(): boolean {
    return mason_gtk_list_ordered(this);
  }
}

export class Br extends Element {
  constructor(kind = Kind.Br, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }
}

export class Image extends Element {
  constructor(kind = Kind.Image, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }

  get Source(): string {
    return mason_gtk_image_source(this) ?? '';
  }

  set Source(value: string) {
    mason_gtk_image_set_source(this, typeof value === 'string' ? value : '');
  }
}

const TEXT_FLAGS = { IsAnonymous: 0, IsLink: 1, IsListItem: 2, DimsWhenPressed: 3 };

export class Text extends Element {
  declare IsAnonymous: boolean;
  declare IsLink: boolean;
  declare IsListItem: boolean;
  declare DimsWhenPressed: boolean;
  private _invoked?: { id: number; handler: Function };

  constructor(kind: number = Kind.Text, existing?: interop.Pointer, ref = false) {
    super(typeof kind === 'number' ? kind : Kind.Text, existing, ref);
  }

  static CreateButton(): Text {
    return new Text(Kind.Button);
  }

  get IsButton(): boolean {
    return mason_gtk_text_flag(this, 4);
  }

  get Content(): string {
    return mason_gtk_text_content(this) ?? '';
  }

  set Content(value: string) {
    mason_gtk_text_set_content(this, value ?? '');
  }

  SetFontFamily(families: string) {
    mason_gtk_set_font_family(this, families ?? '');
  }

  SetRun(run: TextNode, index: number) {
    mason_gtk_text_set_run(this, run, index);
  }

  RemoveRun(run: TextNode) {
    mason_gtk_text_remove_run(this, run);
  }

  ClearRuns() {
    mason_gtk_text_clear_runs(this);
  }

  SetInlineText(child: Text, index: number) {
    mason_gtk_text_set_inline_text(this, child, index);
  }

  RemoveInlineText(child: Text) {
    mason_gtk_text_remove_inline_text(this, child);
  }

  SetInlineBox(child: any, index: number) {
    mason_gtk_text_set_inline_box(this, child, index);
  }

  RemoveInlineBox(child: any) {
    mason_gtk_text_remove_inline_box(this, child);
  }

  SetTextShadow(shadows: string) {
    mason_gtk_text_set_shadow(this, shadows ?? '');
  }

  SetFontFeatureSettings(value: string) {
    mason_gtk_text_set_feature_settings(this, value ?? '');
  }

  /** The button's activation (RoutedEventHandler on Windows). */
  set Invoked(handler: Function | null) {
    if (this._invoked) {
      listeners.delete(this._invoked.id);
      mason_gtk_remove_event_listener(this, 'mason:invoked', this._invoked.id);
      this._invoked = undefined;
    }
    if (typeof handler === 'function') {
      const id = mason_gtk_add_event_listener(this, 'mason:invoked');
      listeners.set(id, () => handler(this, null));
      this._invoked = { id, handler };
    }
  }
}

for (const [name, which] of Object.entries(TEXT_FLAGS)) {
  Object.defineProperty(Text.prototype, name, {
    get(this: Text) {
      return mason_gtk_text_flag(this, which);
    },
    set(this: Text, value: boolean) {
      mason_gtk_text_set_flag(this, which, !!value);
    },
  });
}

/** A DOM text node's data, drawn by the Text holding it as a run. */
export class TextNode extends PointerBase {
  constructor() {
    super(mason_gtk_text_node_new() as interop.Pointer);
    adopt(this, this, false);
  }

  get Data(): string {
    return mason_gtk_text_node_data(this) ?? '';
  }

  set Data(value: string) {
    mason_gtk_text_node_set_data(this, value ?? '');
  }

  SetBreak(value: boolean) {
    mason_gtk_text_node_set_break(this, !!value);
  }
}

class EditableElement extends Element {
  get Value(): string {
    return mason_gtk_input_value(this) ?? '';
  }

  set Value(value: string) {
    mason_gtk_input_set_value(this, value ?? '');
  }

  get Placeholder(): string {
    return mason_gtk_input_placeholder(this) ?? '';
  }

  set Placeholder(value: string) {
    mason_gtk_input_set_placeholder(this, value ?? '');
  }

  SetFontFamily(families: string) {
    mason_gtk_set_font_family(this, families ?? '');
  }

  SetPlaceholderColor(argb: number) {
    mason_gtk_input_set_placeholder_color(this, argb >>> 0, false);
  }

  ClearPlaceholderColor() {
    mason_gtk_input_set_placeholder_color(this, 0, true);
  }

  AddEventListener(type: string, listener: (event: Event) => void): number {
    return Mason.Instance().AddEventListener(this, type, listener);
  }

  RemoveEventListener(type: string, id: number): boolean {
    return Mason.Instance().RemoveEventListener(this, type, id);
  }

  Focus() {
    mason_gtk_input_focus(this);
  }
}

export class Input extends EditableElement {
  constructor(kind = Kind.Input, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }

  get Type(): number {
    return mason_gtk_input_type(this);
  }

  set Type(value: number) {
    mason_gtk_input_set_type(this, value | 0);
  }

  get Checked(): boolean {
    return mason_gtk_input_flag(this, 0);
  }

  set Checked(value: boolean) {
    mason_gtk_input_set_flag(this, 0, !!value);
  }

  get AppearanceNone(): boolean {
    return mason_gtk_input_flag(this, 1);
  }

  set AppearanceNone(value: boolean) {
    mason_gtk_input_set_flag(this, 1, !!value);
  }

  get Multiple(): boolean {
    return mason_gtk_input_flag(this, 2);
  }

  set Multiple(value: boolean) {
    mason_gtk_input_set_flag(this, 2, !!value);
  }

  set Accept(value: string) {
    mason_gtk_input_set_accept(this, value ?? '');
  }
}

export class TextArea extends EditableElement {
  constructor(kind = Kind.TextArea, existing?: interop.Pointer, ref = false) {
    super(kind, existing, ref);
  }

  get Rows(): number {
    return mason_gtk_input_int(this, 0);
  }

  set Rows(value: number) {
    mason_gtk_input_set_int(this, 0, value | 0);
  }

  get Cols(): number {
    return mason_gtk_input_int(this, 1);
  }

  set Cols(value: number) {
    mason_gtk_input_set_int(this, 1, value | 0);
  }

  get MaxLength(): number {
    return mason_gtk_input_int(this, 2);
  }

  set MaxLength(value: number) {
    mason_gtk_input_set_int(this, 2, value | 0);
  }
}

function classForKind(kind: number): any {
  switch (kind) {
    case Kind.Text:
    case Kind.Button:
      return Text;
    case Kind.Image:
      return Image;
    case Kind.Li:
      return Li;
    case Kind.Br:
      return Br;
    case Kind.List:
      return List;
    case Kind.Input:
      return Input;
    case Kind.TextArea:
      return TextArea;
    default:
      return View;
  }
}

const EVENT_STRINGS = { Type: 0, Data: 1, InputType: 2, Key: 3 };
const EVENT_FLAGS = { Bubbles: 0, Cancelable: 1, DefaultPrevented: 3, PropagationStopped: 4, ImmediatePropagationStopped: 5, Repeat: 6, CtrlKey: 7, ShiftKey: 8, AltKey: 9, MetaKey: 10 };

export class Event extends PointerBase {
  constructor(pointer: interop.Pointer) {
    super(pointer);
    adopt(this, this, true);
  }

  get IsComposing() {
    return false;
  }

  get TimeStamp(): number {
    return mason_gtk_event_number(this, 2);
  }

  get Files(): string[] {
    const files = mason_gtk_event_string(this, 4);
    return files ? files.split('\n') : [];
  }

  get Target(): Element | null {
    return elementOf(mason_gtk_event_target(this, 0));
  }

  get CurrentTarget(): Element | null {
    return elementOf(mason_gtk_event_target(this, 1));
  }

  get X(): number {
    return mason_gtk_event_number(this, 11);
  }

  get Y(): number {
    return mason_gtk_event_number(this, 12);
  }

  get Button(): number {
    return mason_gtk_event_number(this, 13);
  }

  PreventDefault() {
    mason_gtk_event_call(this, 0);
  }

  StopPropagation() {
    mason_gtk_event_call(this, 1);
  }

  StopImmediatePropagation() {
    mason_gtk_event_call(this, 2);
  }
}

for (const [name, which] of Object.entries(EVENT_STRINGS)) {
  Object.defineProperty(Event.prototype, name, {
    get(this: Event) {
      return mason_gtk_event_string(this, which) ?? '';
    },
  });
}

for (const [name, which] of Object.entries(EVENT_FLAGS)) {
  Object.defineProperty(Event.prototype, name, {
    get(this: Event) {
      return mason_gtk_event_number(this, which) !== 0;
    },
  });
}

const isElement = (value: any) => value instanceof Element;

let instance: Mason | undefined;

export class Mason {
  static Instance(): Mason {
    return (instance ??= new Mason());
  }

  get Preflight(): boolean {
    return mason_gtk_get_preflight();
  }

  set Preflight(value: boolean) {
    mason_gtk_set_preflight(!!value);
  }

  StyleValues(element: Element): ArrayBuffer | null {
    return isElement(element) ? element.values : null;
  }

  ForeignStyleValues(widget: any): ArrayBuffer | null {
    if (!widget) return null;
    return interop.bufferFromData(mason_gtk_foreign_style_values(widget) as interop.Pointer, STYLE_SIZE);
  }

  SyncForeignStyle(widget: any, d0: number, d1: number, d2: number, d3: number) {
    if (widget) mason_gtk_sync_foreign_style(widget, d0, d1, d2, d3);
  }

  /** A detached node's style: the shared defaults (read before an element exists). */
  CreateNode(_anonymous: boolean) {
    return { Style: { Values: interop.bufferFromData(mason_gtk_default_style() as interop.Pointer, STYLE_SIZE) } };
  }

  ReparentChild(parent: Element, child: any, index: number) {
    if (isElement(parent) && child) mason_gtk_reparent_child(parent, child, index);
  }

  RemoveChild(parent: Element, child: any) {
    if (isElement(parent) && child) mason_gtk_remove_child(parent, child);
  }

  SetPercentWidth(widget: any, fraction: number) {
    if (widget) mason_gtk_set_percent_size(widget, true, fraction);
  }

  SetPercentHeight(widget: any, fraction: number) {
    if (widget) mason_gtk_set_percent_size(widget, false, fraction);
  }

  AddEventListener(element: Element, type: string, listener: (event: Event) => void): number {
    if (!isElement(element)) return 0;
    const id = mason_gtk_add_event_listener(element, type);
    if (id) listeners.set(id, listener);
    return id;
  }

  RemoveEventListener(element: Element, type: string, id: number): boolean {
    listeners.delete(id);
    return isElement(element) ? mason_gtk_remove_event_listener(element, type, id) : false;
  }

  ElementFromPoint(element: Element, x: number, y: number): Element | null {
    return isElement(element) ? elementOf(mason_gtk_element_from_point(element, x, y)) : null;
  }

  ScrollLeft(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 0) : 0;
  }

  ScrollTop(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 1) : 0;
  }

  ScrollWidth(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 2) : 0;
  }

  ScrollHeight(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 3) : 0;
  }

  ClientWidth(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 4) : 0;
  }

  ClientHeight(element: Element) {
    return isElement(element) ? mason_gtk_scroll_metric(element, 5) : 0;
  }

  ScrollTo(element: Element, left: number, top: number, smooth: boolean) {
    if (isElement(element)) mason_gtk_scroll_to(element, left, top, !!smooth);
  }

  ScrollIntoView(element: Element, block: number, inline: number, smooth: boolean) {
    if (isElement(element)) mason_gtk_scroll_into_view(element, block, inline, !!smooth);
  }
}

const transformed = (element: any) => isElement(element);

export class Css {
  static ClearBackground(element: Element) {
    if (transformed(element)) mason_gtk_css_clear_background(element);
  }

  static ApplyLinearGradient(element: Element, angle: number, cornerX: number, cornerY: number, stops: string, interpolation: string) {
    if (transformed(element)) mason_gtk_css_linear_gradient(element, angle, cornerX | 0, cornerY | 0, stops ?? '', interpolation ?? '');
  }

  static ApplyRadialGradient(element: Element, stops: string, interpolation: string) {
    Css.ApplyRadialGradientAt(element, 0.5, 0.5, 0.5, 0.5, stops, interpolation);
  }

  static ApplyRadialGradientAt(element: Element, cx: number, cy: number, rx: number, ry: number, stops: string, interpolation: string) {
    if (transformed(element)) mason_gtk_css_radial_gradient(element, cx, cy, rx, ry, stops ?? '', interpolation ?? '');
  }

  static ApplyBackgroundImage(element: Element, source: string, fit: number, alignX: number, alignY: number) {
    if (transformed(element)) mason_gtk_css_background_image(element, source ?? '', fit | 0, alignX | 0, alignY | 0);
  }

  static SetBackgroundLayers(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_layers(element, spec ?? '');
  }

  static SetBoxShadow(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_box_shadow(element, spec ?? '');
  }

  static SetFilter(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_filter(element, spec ?? '', false);
  }

  static SetBackdropFilter(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_filter(element, spec ?? '', true);
  }

  static SetMask(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_mask(element, 0, spec ?? '');
  }

  static SetBorderImage(element: Element, spec: string) {
    if (transformed(element)) mason_gtk_css_set_mask(element, 1, spec ?? '');
  }

  static SetTransforms(element: Element, scaleX: number, scaleY: number, angle: number, translateX: number, translateY: number, originX: number, originY: number) {
    if (transformed(element)) mason_gtk_css_set_transforms(element, scaleX, scaleY, angle, translateX, translateY, originX, originY);
  }

  static ApplyTransform(element: Element, m11: number, m12: number, m21: number, m22: number, dx: number, dy: number) {
    if (transformed(element)) mason_gtk_css_apply_transform(element, m11, m12, m21, m22, dx, dy);
  }

  static ClearTransform(element: Element) {
    if (transformed(element)) mason_gtk_css_clear_transform(element);
  }

  static SetTransformOrigin(element: Element, x: number, y: number) {
    if (transformed(element)) mason_gtk_css_set_transform_origin(element, x, y);
  }

  static ReparentChild(parent: Element, child: any, index: number) {
    Mason.Instance().ReparentChild(parent, child, index);
  }

  static RemoveChild(parent: Element, child: any) {
    Mason.Instance().RemoveChild(parent, child);
  }
}

/** A vertical GtkScrolledWindow around `content` (`<scroll>`). */
export function createScroller(content: Element): interop.Pointer {
  const scroller = mason_gtk_scroll_new(content) as interop.Pointer;
  adopt(scroller, scroller, false);
  return scroller;
}

const Namespace = { Mason, View, Text, TextNode, Image, Br, Li, List, Input, TextArea, Css, Event };
const g = globalThis as any;
g.NativeScript = g.NativeScript ?? {};
g.NativeScript.Mason = Namespace;
