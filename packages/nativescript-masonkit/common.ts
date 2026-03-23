/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AddChildFromBuilder, CustomLayoutView, View as NSView, ViewBase as NSViewBase, getViewById, Property, widthProperty, heightProperty, View, CoreTypes, Length as CoreLength, PercentLength as CorePercentLength, marginLeftProperty, marginRightProperty, marginTopProperty, marginBottomProperty, minWidthProperty, minHeightProperty, fontSizeProperty, fontWeightProperty, fontStyleProperty, colorProperty, Color, lineHeightProperty, letterSpacingProperty, textAlignmentProperty, borderLeftWidthProperty, borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, backgroundColorProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, paddingBottomProperty, zIndexProperty } from '@nativescript/core';
import { Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position, BoxSizing, VerticalAlign, FlexDirection, Float, Clear } from '.';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexShrinkProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { _forceStyleUpdate, _setGridAutoRows } from './utils';
import { Style as MasonStyle } from './style';
import {
  alignContentProperty,
  aspectRatioProperty,
  backgroundProperty,
  borderProperty,
  borderLeftProperty,
  borderTopProperty,
  borderRightProperty,
  borderBottomProperty,
  borderRadiusProperty,
  bottomProperty,
  boxSizingProperty,
  clearProperty,
  columnGapProperty,
  cornerShapeProperty,
  displayProperty,
  filterProperty,
  flexBasisProperty,
  floatProperty,
  gridAreaProperty,
  gridAutoColumnsProperty,
  gridAutoFlowProperty,
  gridAutoRowsProperty,
  gridColumnEndProperty,
  gridColumnProperty,
  gridColumnStartProperty,
  gridRowEndProperty,
  gridRowProperty,
  gridRowStartProperty,
  gridTemplateAreasProperty,
  gridTemplateColumnsProperty,
  gridTemplateRowsProperty,
  justifyItemsProperty,
  justifySelfProperty,
  leftProperty,
  marginProperty,
  maxHeightProperty,
  maxWidthProperty,
  overflowXProperty,
  overflowYProperty,
  paddingProperty,
  positionProperty,
  rightProperty,
  rowGapProperty,
  scrollBarWidthProperty,
  textOverFlowProperty,
  textProperty,
  textWrapProperty,
  topProperty,
  verticalAlignProperty,
  boxShadowProperty,
  transformProperty,
} from './properties';
import { isMasonView_, isTextChild_, isText_, isPlaceholder_, text_, native_, textNode_, textNodeIndex_ } from './symbols';
import { Tree } from './tree';
import { TextNode } from './text-node';

declare const kotlin;

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle {
  const ret: NSViewBase & { _styleHelper: MasonStyle } = (__ANDROID__ ? view.get() : view.deref()) as never;
  return ret._styleHelper as MasonStyle;
}

export interface MasonChild extends ViewBase {}

/**
 * Cached per-view accessor for the framework's virtual DOM element.
 * The accessor is a function that retrieves the element cheaply on subsequent calls.
 * We use `false` as a sentinel to indicate "no framework detected" (avoids re-scanning).
 */
const _frameworkAccessorCache = new WeakMap<object, ((view: any) => any) | false>();

function getFrameworkElement(view: any): any {
  const cached = _frameworkAccessorCache.get(view);
  if (cached === false) return null;
  if (cached) return cached(view);

  // First call: detect framework and cache the accessor
  const symbols = Object.getOwnPropertySymbols(view);

  // Vue 3 (nativescript-vue): stores ELEMENT_REF symbol on native view
  for (const sym of symbols) {
    if (sym.description === 'elementRef' || sym.description === '') {
      const el = view[sym];
      if (el && Array.isArray(el.childNodes)) {
        _frameworkAccessorCache.set(view, (v) => v[sym]);
        return el;
      }
    }
  }

  // React (react-nativescript): stores __reactFiber$ symbol on node
  for (const sym of symbols) {
    if (sym.description?.startsWith('__reactFiber$')) {
      if (Array.isArray(view.childNodes)) {
        _frameworkAccessorCache.set(view, (v) => v);
        return view;
      }
    }
  }

  // Svelte (svelte-native): stores __SvelteNativeElement__ on native view
  if (view.__SvelteNativeElement__) {
    const el = view.__SvelteNativeElement__;
    if (Array.isArray(el.childNodes)) {
      _frameworkAccessorCache.set(view, (v) => v.__SvelteNativeElement__);
      return el;
    }
  }

  // SolidJS (dominative): the element IS the native view, extended with DOM methods
  if (view.__dominative_isNative) {
    _frameworkAccessorCache.set(view, (v) => v);
    return view;
  }

  // Angular (@nativescript/angular): uses firstChild/nextSibling linked list
  if (view.firstChild !== undefined && view.meta?.skipAddToDom !== undefined) {
    _frameworkAccessorCache.set(view, (v) => v);
    return view;
  }

  _frameworkAccessorCache.set(view, false);
  return null;
}

export const textContentProperty = new Property<ViewBase, string>({
  name: 'textContent',
  affectsLayout: true,
  defaultValue: '',
});

declare module '@nativescript/core/ui/styling/style' {
  interface Style {
    filter: string;
    border: string;
    boxSizing: BoxSizing;
    display: Display;
    position: Position;
    flexDirection: FlexDirection;
    flex: string | 'auto' | 'none' | number | 'initial';
    maxWidth: LengthAuto;
    maxHeight: LengthAuto;
    inset: LengthAuto;
    left: LengthAuto;
    right: LengthAuto;
    top: LengthAuto;
    bottom: LengthAuto;
    gridGap: Gap;
    gap: Gap;
    rowGap: Length;
    columnGap: Length;
    aspectRatio: number;
    flexFlow: string;
    justifyItems: JustifyItems;
    justifySelf: JustifySelf;
    gridAutoRows: string;
    gridAutoColumns: string;
    gridAutoFlow: GridAutoFlow;
    gridRowGap: Gap;
    gridColumnGap: Gap;
    gridArea: string;
    gridColumn: string;
    gridColumnStart: string;
    gridColumnEnd: string;
    gridRow: string;
    gridRowStart: string;
    gridRowEnd: string;
    gridTemplateRows: string;
    gridTemplateColumns: string;
    gridTemplateAreas: string;
    overflow: Overflow | `${Overflow} ${Overflow}`;
    overflowX: Overflow;
    overflowY: Overflow;
    scrollBarWidth: Length;
    verticalAlign: VerticalAlign;
    textWrap: 'nowrap' | 'wrap' | 'balance';
    textOverFlow: 'clip' | 'ellipsis' | `${string}`;
    float: Float;
    clear: Clear;
    cornerShape: string;
    transform: string;
  }
}

export class ViewBase extends CustomLayoutView implements AddChildFromBuilder {
  readonly android: org.nativescript.mason.masonkit.View;
  readonly ios: MasonUIView;

  _children: (NSView | { text?: string } | TextNode)[] = [];
  [isMasonView_] = false;

  [isTextChild_] = false;
  [isText_] = false;

  constructor() {
    super();
  }

  get innerHTML() {
    //@ts-ignore
    const nativeView = this._view as any;
    if (__ANDROID__) {
      if (nativeView && nativeView.getInnerHTML) {
        return nativeView.getInnerHTML();
      }
    }
    if (__APPLE__) {
      if (nativeView && nativeView.mason_innerHTML) {
        return nativeView.mason_innerHTML;
      }
    }

    return '';
  }

  set innerHTML(value: string) {
    //@ts-ignore
    const nativeView = this._view as any;
    if (__ANDROID__) {
      if (nativeView && nativeView.setInnerHTML) {
        nativeView.setInnerHTML(value);
      }
    }
    if (__APPLE__) {
      if (nativeView && nativeView.mason_innerHTML) {
        nativeView.mason_innerHTML = value;
      }
    }
  }

  _pendingEventsRegistration: Array<{ arg: string; callback: any; thisArg?: any }> = [];

  _registerNativeEvent(arg: string, callback: any, thisArg?: any) {
    if (!this[native_]) {
      this._pendingEventsRegistration.push({ arg, callback, thisArg });
      return;
    }
    //@ts-ignore
    if (this._view) {
      if (__ANDROID__) {
        const ref = new WeakRef(this);
        const cb = new kotlin.jvm.functions.Function1({
          invoke(event: org.nativescript.mason.masonkit.events.Event) {
            const owner = ref.get();
            if (owner) {
              let ret;
              if (arg === 'input') {
                ret = new InputEvent();
              } else {
                ret = new Event();
              }
              ret[native_] = event;
              ret._target = owner;
              callback.call(thisArg || owner, ret);
            }
          },
        });

        //@ts-ignore
        const id = (this._view as never as org.nativescript.mason.masonkit.Element).addEventListener(arg, cb);

        callback['mason:event:id'] = id;
      }
      if (__APPLE__) {
        //@ts-ignore
        const id = (this._view as NSObject).mason_addEventListener(arg, (event: any) => {
          let ret;
          if (arg === 'input') {
            ret = new InputEvent();
          } else {
            ret = new Event();
          }
          ret[native_] = event;
          ret._target = this;
          callback.call(thisArg || this, ret);
        });

        callback['mason:event:id'] = id;
      }
    }
  }

  _unregisterNativeEvent(arg: string, callback: any, thisArg?: any) {
    const id = callback['mason:event:id'];
    if (!this[native_]) {
      this._pendingEventsRegistration = this._pendingEventsRegistration.filter((registration) => {
        return !(registration.arg === arg && registration.callback === callback && registration.thisArg === thisArg);
      });
      return;
    }
    //@ts-ignore
    if (this._view) {
      if (__ANDROID__) {
        if (!id) {
          //@ts-ignore
          const removed = (this._view as org.nativescript.mason.masonkit.Element).removeEventListener(arg, id);

          callback['mason:event:id'] = undefined;
        }
      }
      if (__APPLE__) {
        if (!id) {
          //@ts-ignore
          const removed = (this._view as NSObject).mason_removeEventListenerId(arg, id);

          callback['mason:event:id'] = undefined;
        }
      }
    }
  }

  initNativeView(): void {
    super.initNativeView();
    if (this._pendingEventsRegistration.length > 0) {
      const pending = this._pendingEventsRegistration.splice(0);
      for (const registration of pending) {
        this._registerNativeEvent(registration.arg, registration.callback, registration.thisArg);
      }
    }
  }

  public addEventListener(arg: string, callback: any, thisArg?: any) {
    if (typeof thisArg === 'boolean') {
      thisArg = {
        capture: thisArg,
      };
    }
    super.addEventListener(arg, callback, thisArg);
    if (typeof arg !== 'string') {
      return;
    }

    switch (arg) {
      case 'input':
      case 'change':
        this._registerNativeEvent(arg, callback, thisArg);
        break;
    }
  }

  public removeEventListener(arg: string, callback: any, thisArg?: any) {
    if (typeof thisArg === 'boolean') {
      thisArg = {
        capture: thisArg,
      };
    }

    super.removeEventListener(arg, callback, thisArg);

    switch (arg) {
      case 'input':
      case 'change':
        this._unregisterNativeEvent(arg, callback, thisArg);
        break;
    }
  }

  forceStyleUpdate() {
    _forceStyleUpdate(this as any);
  }

  get _viewChildren() {
    return this._children.filter((child) => {
      return !child[isPlaceholder_] && child instanceof NSView;
    }) as NSView[];
  }

  public eachLayoutChild(callback: (child: NSView, isLast: boolean) => void): void {
    let lastChild: View = null;

    this.eachChildView((cv) => {
      cv._eachLayoutView((lv) => {
        if (lastChild && !lastChild.isCollapsed) {
          callback(lastChild, false);
        }

        lastChild = lv;
      });

      return true;
    });

    if (lastChild && !lastChild.isCollapsed) {
      callback(lastChild, true);
    }
  }

  public eachChild(callback: (child: NSViewBase) => boolean) {
    for (const child of this._viewChildren) {
      callback(child);
    }
  }

  public eachChildView(callback: (child: NSView) => boolean): void {
    for (const view of this._viewChildren) {
      callback(view);
    }
  }

  _addChildFromBuilder(name: string, value: any): void {
    this.addChild(value);
  }

  getChildrenCount() {
    return this._viewChildren.length;
  }

  get _childrenCount() {
    return this._viewChildren.length;
  }

  getChildAt(index: number) {
    return this._viewChildren[index];
  }

  getChildIndex(child: NSView) {
    return this._viewChildren.indexOf(child);
  }
  getChildById(id: string) {
    return getViewById(this as never, id);
  }

  addChild(child: any) {
    if (child && child[isPlaceholder_] && child._view) {
      if (__ANDROID__) {
        //@ts-ignore
        this._view.append(child._view);
      }

      if (__APPLE__) {
        //@ts-ignore
        this._view.mason_append(child._view);
      }

      if (this[isText_]) {
        child[isTextChild_] = true;
      }

      this._children.push(child);
      return;
    }
    if (child instanceof NSView) {
      this._children.push(child);
      if (this[isText_]) {
        child[isTextChild_] = true;
      }
      this._addView(child);
    } else {
      if (text_ in child) {
        //@ts-ignore
        if (this._view) {
          if (__ANDROID__) {
            //@ts-ignore
            this._view.addChildAt(child[text_] || '', this._children.length);
          }

          if (__APPLE__) {
            //@ts-ignore
            this._view.mason_addChildAtText(child[text_] || '', this._children.length);
          }
        }
        this._children.push(child);
      } else if (child instanceof TextNode) {
        //@ts-ignore
        if (this._view) {
          if (__ANDROID__) {
            //@ts-ignore
            this._view.addChildAt(child[native_], this._children.length);
          }

          if (__APPLE__) {
            //@ts-ignore
            this._view.mason_addChildAtNode(child[native_], this._children.length);
          }
        }
        this._children.push(child);
      }
    }
  }

  insertChild(child: any, atIndex: number) {
    if (child && child[isPlaceholder_] && child._view) {
      this._children[atIndex] = child;
      if (this[isText_]) {
        child[isTextChild_] = true;
      }

      if (__ANDROID__) {
        //@ts-ignore
        this._view.addChildAt(child._view, atIndex);
      }

      if (__APPLE__) {
        //@ts-ignore
        this._view.mason_addChildAtNode(child._view, atIndex);
      }
    } else if (child instanceof NSView) {
      this._children.splice(atIndex, 0, child);
      if (this[isText_]) {
        child[isTextChild_] = true;
      }
      this._addView(child, atIndex);
    }
  }

  replaceChild(child: any, atIndex: number) {
    if (child && child[isPlaceholder_] && child._view) {
      this._children[atIndex] = child;
      if (this[isText_]) {
        child[isTextChild_] = true;
      }

      if (__ANDROID__) {
        //@ts-ignore
        this._view.replaceChildAt(child._view, atIndex);
      }

      if (__APPLE__) {
        //@ts-ignore
        this._view.mason_replaceChildAtNode(child._view, atIndex);
      }
    } else if (child instanceof NSView) {
      this._children[atIndex] = child;
      if (this[isText_]) {
        child[isTextChild_] = true;
      }
      this._addView(child, atIndex);
    } else {
      if (text_ in child) {
        //@ts-ignore
        if (this._view) {
          if (__ANDROID__) {
            //@ts-ignore
            this._view.replaceChildAt(child[text_] || '', atIndex);
          }

          if (__APPLE__) {
            //@ts-ignore
            this._view.mason_replaceChildAtText(child[text_] || '', atIndex);
          }
        }
        if (this._children.length >= atIndex) {
          this._children[atIndex] = { text: child[text_] || '' };
        } else {
          this._children.push({ text: child[text_] || '' });
        }
      }
    }
  }

  removeChild(child: any) {
    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
      this._removeView(child);
    }
  }

  removeChildren() {
    if (this._viewChildren.length === 0) {
      return;
    }
    for (const child of this._viewChildren) {
      // @ts-ignore
      child._isMasonChild = false;
      if (child instanceof NSView) {
        this._removeView(child);
      }
    }
    this._children.splice(0);
  }

  [zIndexProperty.setNative](value: number) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.zIndex = value;
    }
  }

  set verticalAlign(value) {
    this.style.verticalAlign = value;
  }

  get verticalAlign() {
    return this.style.verticalAlign;
  }

  [verticalAlignProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.verticalAlign = value;
    }
  }

  set flex(value) {
    this.style.flex = value;
  }

  get flex() {
    return this.style.flex;
  }

  set textWrap(value) {
    this.style.textWrap = value;
  }

  get textWrap() {
    return this.style.textWrap;
  }

  [textWrapProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.textWrap = value;
    }
  }

  set aspectRatio(value: number) {
    this.style.aspectRatio = value;
  }

  get aspectRatio() {
    return this.style.aspectRatio;
  }

  [aspectRatioProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.aspectRatio = value;
    }
  }

  // -- Platform bridge methods for native text node operations --

  private _createOrUpdateNativeTextNode(node: any, text: string): any {
    if (node[textNode_]) {
      if (__ANDROID__) {
        (node[textNode_] as org.nativescript.mason.masonkit.TextNode).setData(text);
      }
      if (__APPLE__) {
        (node[textNode_] as MasonTextNode).data = text;
      }
      return node[textNode_];
    }

    let textNode;
    if (__ANDROID__) {
      textNode = new org.nativescript.mason.masonkit.TextNode(Tree.instance.native as never, text);
    }
    if (__APPLE__) {
      textNode = MasonTextNode.alloc().initWithMasonDataAttributes(Tree.instance.native as never, text, null);
    }
    node[textNode_] = textNode;
    return textNode;
  }

  private _nativeAddChild(textNode: any, index: number) {
    //@ts-ignore
    if (__ANDROID__) this._view.addChildAt(textNode, index);
    //@ts-ignore
    if (__APPLE__) this._view.mason_addChildAtNode(textNode, index);
  }

  private _nativeReplaceChild(textNode: any, index: number) {
    //@ts-ignore
    if (__ANDROID__) this._view.replaceChildAt(textNode, index);
    //@ts-ignore
    if (__APPLE__) this._view.mason_replaceChildAtNode(textNode, index);
  }

  private _setOrPushChild(index: number, entry: any) {
    if (this._children.length > index) {
      //@ts-ignore
      this._children[index] = entry;
    } else {
      //@ts-ignore
      this._children.push(entry);
    }
  }

  // -- Unified text node update (cross-platform) --

  private _updateTextNode(
    node: any,
    operation: {
      type: 'add' | 'replace' | 'insert';
      index?: number;
      isBreak?: boolean;
    } = null,
  ) {
    const text = node.text ?? node.data ?? '';
    const textNode = this._createOrUpdateNativeTextNode(node, text);

    if (!operation) return;

    const entry = { [text_]: text, [textNode_]: textNode, [textNodeIndex_]: operation.index ?? this._children.length };

    switch (operation.type) {
      case 'add':
        this._nativeAddChild(textNode, this._children.length);
        //@ts-ignore
        this._children.push({ ...entry, [textNodeIndex_]: this._children.length });
        break;
      case 'replace':
        this._nativeReplaceChild(textNode, operation.index);
        this._setOrPushChild(operation.index, entry);
        break;
      case 'insert':
        this._nativeAddChild(textNode, operation.index);
        this._setOrPushChild(operation.index, entry);
        break;
    }
  }

  // -- Text setter with per-view framework detection --

  [textProperty.setNative](value: string) {
    const frameworkEl = getFrameworkElement(this);

    if (frameworkEl) {
      // Frameworks with childNodes array (Vue, React, Svelte, SolidJS)
      if (Array.isArray(frameworkEl.childNodes)) {
        const childNodes = frameworkEl.childNodes as any[];
        if (childNodes.length === 0) {
          this.replaceChild({ [text_]: value }, 0);
          return;
        }

        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];
          const isTextNode = node.nodeType === 'text' || node.nodeType === 3;
          if (isTextNode) {
            const type = i === 0 && childNodes.length === 1 && !this._children.length ? 'add' : 'replace';
            this._updateTextNode(node, { type, index: i, isBreak: node.nodeName === 'br' });
          }
        }
        return;
      }

      // Frameworks with linked-list traversal (Angular)
      if ('firstChild' in frameworkEl) {
        const nodes = [];
        let child = frameworkEl.firstChild;
        while (child) {
          nodes.push(child);
          child = child.nextSibling;
        }

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const isTextNode = node.nodeType === 'text' || node.nodeType === 3 || node.nodeName === 'TextNode' || node.constructor?.name === 'TextNode';
          if (isTextNode || node.nodeName === 'br') {
            this._updateTextNode(node, { type: 'replace', index: i, isBreak: node.nodeName === 'br' });
          }
        }
        return;
      }
    }

    // NativeScript Core: linked-list traversal on the view itself
    if ('firstChild' in this) {
      const nodes = [];
      let child = (this as any).firstChild;
      while (child) {
        nodes.push(child);
        child = child.nextSibling;
      }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isTextNode = node.nodeType === 'text' || node.nodeName === 'TextNode' || node.constructor?.name === 'TextNode';
        if (isTextNode || node.nodeName === 'br') {
          this._updateTextNode(node, { type: 'replace', index: i, isBreak: node.nodeName === 'br' });
        }
      }
      return;
    }

    // Fallback: direct textContent
    if ('textContent' in this) {
      // @ts-ignore
      this.textContent = value;
    }
  }

  get filter() {
    return this.style.filter;
  }

  set filter(value: string) {
    this.style.filter = value;
  }

  [filterProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.filter = value;
    }
  }

  // @ts-ignore
  set borderRadius(value) {
    this.style.borderRadius = value;
  }

  get borderRadius() {
    return this.style.borderRadius;
  }

  [borderRadiusProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderRadius = value;
    }
  }

  set border(value) {
    this.style.border = value;
  }

  get border() {
    return this.style.border;
  }

  [borderProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.border = value;
    }
  }

  [borderLeftProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderLeft = value;
    }
  }

  [borderTopProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderTop = value;
    }
  }

  [borderRightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderRight = value;
    }
  }

  [borderBottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderBottom = value;
    }
  }

  // @ts-ignore
  set background(value) {
    this.style.background = value;
  }

  get background() {
    return this.style.background;
  }

  [backgroundProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.background = value;
    }
  }

  [backgroundColorProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      switch (typeof value) {
        case 'number':
          // @ts-ignore
          style.backgroundColor = value;
          return;
        case 'object':
          if (value instanceof Color) {
            // @ts-ignore
            style.backgroundColor = value.argb;
            return;
          }
          break;
        case 'string':
          try {
            const color = new Color(value);
            // @ts-ignore
            style.backgroundColor = color.argb;
          } catch (error) {}
          return;
      }
    }
  }

  [borderLeftWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderLeftWidth = value;
    }
  }

  [borderTopWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderTopWidth = value;
    }
  }

  [borderRightWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderRightWidth = value;
    }
  }

  [borderBottomWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderBottomWidth = value;
    }
  }

  [lineHeightProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.lineHeight = value;
    }
  }

  [letterSpacingProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.letterSpacing = value;
    }
  }

  [textAlignmentProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.textAlignment = value;
    }
  }

  get boxSizing(): BoxSizing {
    return this.style.boxSizing;
  }

  set boxSizing(value: BoxSizing) {
    this.style.boxSizing = value;
  }

  [boxSizingProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.boxSizing = value;
    }
  }

  get display() {
    return this.style.display;
  }

  set display(value: Display) {
    this.style.display = value;
  }

  [displayProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.display = value;
    }
  }

  get overflow() {
    return this.style.overflow;
  }

  set overflow(value) {
    this.style.overflow = value;
  }

  get overflowX() {
    return this.style.overflowX;
  }

  set overflowX(value: Overflow) {
    this.style.overflowX = value;
  }

  [overflowXProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.overflowX = value;
    }
  }

  get overflowY() {
    return this.style.overflowY;
  }

  set overflowY(value: Overflow) {
    this.style.overflowY = value;
  }

  [overflowYProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.overflowY = value;
    }
  }

  get scrollBarWidth() {
    return this.style.scrollBarWidth;
  }

  set scrollBarWidth(value: Length) {
    this.style.scrollBarWidth = value;
  }

  [scrollBarWidthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.scrollBarWidth = value;
    }
  }

  get position() {
    return this.style.position;
  }

  set position(value: Position) {
    this.style.position = value;
  }

  [positionProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.position = value;
    }
  }

  [colorProperty.setNative](value) {
    if (value instanceof Color) {
      // @ts-ignore
      const style = this._styleHelper;
      if (style) {
        // @ts-ignore
        style.color = value.argb;
      }
    }
  }

  [flexWrapProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.flexWrap = value;
    }
  }

  [flexDirectionProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.flexDirection = value;
    }
  }

  [flexGrowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.flexGrow = value;
    }
  }

  [flexShrinkProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.flexShrink = value;
    }
  }

  [flexBasisProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.flexBasis = value;
    }
  }

  [alignItemsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.alignItems = value;
    }
  }

  [alignSelfProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.alignSelf = value;
    }
  }

  get alignContent() {
    return this.style.alignContent;
  }

  set alignContent(value) {
    this.style.alignContent = value;
  }

  [alignContentProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.alignContent = value;
    }
  }

  get justifyItems() {
    return this.style.justifyItems;
  }

  set justifyItems(value) {
    this.style.justifyItems = value;
  }

  [justifyItemsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.justifyItems = value;
    }
  }

  get justifySelf() {
    return this.style.justifySelf;
  }

  set justifySelf(value) {
    this.style.justifySelf = value;
  }

  [justifySelfProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.justifySelf = value;
    }
  }

  [justifyContentProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.justifyContent = value;
    }
  }

  [leftProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.left = value;
    }
  }

  get right() {
    return this.style.right;
  }

  set right(value: LengthAuto) {
    this.style.right = value;
  }

  [rightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.right = value;
    }
  }

  get bottom() {
    return this.style.bottom;
  }

  set bottom(value: LengthAuto) {
    this.style.bottom = value;
  }

  [bottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.bottom = value;
    }
  }

  [topProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.top = value;
    }
  }

  [minWidthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.minWidth = value;
    }
  }

  [minHeightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.minHeight = value;
    }
  }

  [heightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.height = value;
    }
  }

  [widthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.width = value;
    }
  }

  set maxWidth(value: LengthAuto) {
    this.style.maxWidth = value;
  }

  get maxWidth(): LengthAuto {
    return this.style.maxWidth;
  }

  set maxHeight(value: LengthAuto) {
    this.style.maxHeight = value;
  }

  get maxHeight(): LengthAuto {
    return this.style.maxHeight;
  }

  [maxWidthProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.maxWidth = value;
    }
  }

  [maxHeightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.maxHeight = value;
    }
  }

  _redrawNativeBackground(value: any): void {}

  [marginProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      if (value === 'auto') {
        style.margin = 'auto';
        return;
      }
      try {
        style.margin = CorePercentLength.parse(value);
      } catch (error) {}
    }
  }

  [marginLeftProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginLeft = value;
    }
  }

  [marginRightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginRight = value;
    }
  }

  [marginBottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginBottom = value;
    }
  }

  [marginTopProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginTop = value;
    }
  }

  get padding() {
    return this.style.padding;
  }

  set padding(value) {
    this.style.padding = value;
  }

  [paddingProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      try {
        // @ts-ignore
        style.padding = CoreLength.parse(value);
      } catch (error) {}
    }
  }

  [paddingLeftProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingLeft = value;
    }
  }

  [paddingRightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingRight = value;
    }
  }

  [paddingTopProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingTop = value;
    }
  }

  [paddingBottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingBottom = value;
    }
  }

  set gap(value: Length) {
    this.style.gap = value;
  }

  get gap(): Length {
    return this.style.gap;
  }

  set gridGap(value: Length) {
    this.style.gridGap = value;
  }

  get gridGap(): Length {
    return this.style.gridGap;
  }

  set rowGap(value: Length) {
    this.style.rowGap = value;
  }

  get rowGap(): Length {
    return this.style.rowGap;
  }

  [rowGapProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.rowGap = value;
    }
  }

  set columnGap(value: Length) {
    this.style.columnGap = value;
  }

  get columnGap(): Length {
    return this.style.columnGap;
  }

  [columnGapProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.columnGap = value;
    }
  }

  set gridColumnStart(value: string) {
    this.style.gridColumnStart = value;
  }

  get gridColumnStart(): string {
    return this.style.gridColumnStart;
  }

  [gridColumnStartProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridColumnStart = value;
    }
  }

  set gridColumnEnd(value: string) {
    this.style.gridColumnEnd = value;
  }

  get gridColumnEnd(): string {
    return this.style.gridColumnEnd;
  }

  [gridColumnEndProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridColumnEnd = value;
    }
  }

  get gridColumn(): string {
    return this.style.gridColumn;
  }

  set gridColumn(value: string) {
    this.style.gridColumn = value;
  }

  [gridColumnProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridColumn = value;
    }
  }

  set gridRowStart(value: string) {
    this.style.gridRowStart = value;
  }

  get gridRowStart(): string {
    return this.style.gridRowStart;
  }

  [gridRowStartProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridRowStart = value;
    }
  }

  set gridRowEnd(value: string) {
    this.style.gridRowEnd = value;
  }

  get gridRowEnd(): string {
    return this.style.gridRowEnd;
  }

  [gridRowEndProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridRowEnd = value;
    }
  }

  get gridRow(): string {
    return this.style.gridRow;
  }

  set gridRow(value: string) {
    this.style.gridRow = value;
  }

  [gridRowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridRow = value;
    }
  }

  set gridTemplateRows(value: string) {
    this.style.gridTemplateRows = value;
  }

  get gridTemplateRows(): string {
    return this.style.gridTemplateRows;
  }

  [gridTemplateRowsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridTemplateRows = value;
    }
  }

  set gridTemplateColumns(value: string) {
    this.style.gridTemplateColumns = value;
  }

  get gridTemplateColumns(): string {
    return this.style.gridTemplateColumns;
  }

  [gridTemplateColumnsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridTemplateColumns = value;
    }
  }

  set gridAutoColumns(value: string) {
    this.style.gridAutoColumns = value;
  }

  get gridAutoColumns(): string {
    return this.style.gridAutoColumns;
  }

  [gridAutoColumnsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridAutoColumns = value;
    }
  }

  set gridAutoRows(value: string) {
    this.style.gridAutoRows = value;
  }

  get gridAutoRows(): string {
    return this.style.gridAutoRows;
  }

  [gridAutoRowsProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridAutoRows = value;
    }
  }

  set gridAutoFlow(value: GridAutoFlow) {
    this.style.gridAutoFlow = value;
  }

  get gridAutoFlow(): GridAutoFlow {
    return this.style.gridAutoFlow;
  }

  [gridAutoFlowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridAutoFlow = value;
    }
  }

  set gridArea(value: string) {
    this.style.gridArea = value;
  }

  get gridArea(): string {
    return this.style.gridArea;
  }

  [gridAreaProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridArea = value;
    }
  }

  set gridTemplateAreas(value: string) {
    this.style.gridTemplateAreas = value;
  }

  get gridTemplateAreas(): string {
    return this.style.gridTemplateAreas;
  }

  [gridTemplateAreasProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.gridTemplateAreas = value;
    }
  }

  [fontSizeProperty.setNative](value: Length) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontSize = value;
    }
  }

  [fontWeightProperty.setNative](value) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontWeight = value;
    }
  }

  [fontStyleProperty.setNative](value) {
    // @ts-ignore
    if (this._styleHelper) {
      //@ts-ignore
      this._styleHelper.fontStyle = value;
    }
  }

  set flexFlowProperty(value) {
    this.style.flexFlow = value;
  }

  get flexFlowProperty() {
    return this.style.flexFlow;
  }

  set inset(value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      if (value === 'auto') {
        style.inset = 'auto';
        return;
      }
      try {
        style.inset = CorePercentLength.parse(value as never);
      } catch (error) {}
    }
  }

  get inset() {
    return this.style.inset;
  }

  set textOverFlow(value) {
    this.style.textOverFlow = value;
  }

  get textOverFlow() {
    return this.style.textOverFlow;
  }

  [textOverFlowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.textOverFlow = value;
    }
  }

  [clearProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.clear = value;
    }
  }

  [floatProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.float = value;
    }
  }

  [cornerShapeProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.cornerShape = value;
    }
  }

  [boxShadowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.boxShadow = typeof value === 'string' ? value : `${value}`;
    }
  }

  [transformProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.transform = value;
    }
  }
}

textProperty.register(ViewBase);

export class TextBase extends ViewBase {
  textContent: string;

  [textWrapProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      switch (value) {
        case 'false':
        case false:
        case 'nowrap':
          style.textWrap = MasonTextWrap.NoWrap;
          break;
        case true:
        case 'true':
        case 'wrap':
          style.textWrap = MasonTextWrap.Wrap;
          break;
        case 'balance':
          style.textWrap = MasonTextWrap.Balance;
          break;
      }
    }
  }
}

textContentProperty.register(ViewBase);

export class ButtonBase extends TextBase {}

// @ts-ignore
export const srcProperty = new Property<ImageBase, string>({
  name: 'src',
  defaultValue: '',
});

export class ImageBase extends ViewBase {
  src: string;
}

srcProperty.register(ImageBase);

export class Event {
  [native_];

  get bubbles() {
    if (__ANDROID__) {
      return this[native_]?.getBubbles();
    }

    if (__APPLE__) {
      return this[native_]?.bubbles;
    }

    return false;
  }

  get cancelable() {
    if (__ANDROID__) {
      return this[native_]?.getCancelable();
    }

    if (__APPLE__) {
      return this[native_]?.cancelable;
    }

    return false;
  }

  get isComposing() {
    if (__ANDROID__) {
      return this[native_]?.getIsComposing();
    }

    if (__APPLE__) {
      return this[native_]?.isComposing;
    }

    return false;
  }

  get timeStamp() {
    if (__ANDROID__) {
      return this[native_]?.getTimeStamp();
    }

    if (__APPLE__) {
      return this[native_]?.timeStamp;
    }

    return false;
  }

  get defaultPrevented() {
    if (__ANDROID__) {
      return this[native_]?.getDefaultPrevented();
    }

    if (__APPLE__) {
      return this[native_]?.defaultPrevented;
    }

    return false;
  }

  get propagationStopped() {
    if (__ANDROID__) {
      return this[native_]?.getPropagationStopped();
    }

    if (__APPLE__) {
      return this[native_]?.propagationStopped;
    }

    return false;
  }

  get immediatePropagationStopped() {
    if (__ANDROID__) {
      return this[native_]?.getImmediatePropagationStopped();
    }

    if (__APPLE__) {
      return this[native_]?.immediatePropagationStopped;
    }

    return false;
  }

  get currentTarget() {
    if (__ANDROID__) {
      return this[native_]?.getCurrentTarget();
    }

    if (__APPLE__) {
      return this[native_]?.currentTarget;
    }

    return false;
  }

  stopImmediatePropagation(): void {
    if (__ANDROID__) {
      return this[native_]?.stopImmediatePropagation();
    }

    if (__APPLE__) {
      return this[native_]?.stopImmediatePropagation();
    }
  }

  stopPropagation(): void {
    if (__ANDROID__) {
      return this[native_]?.stopPropagation();
    }

    if (__APPLE__) {
      return this[native_]?.stopPropagation();
    }
  }

  preventDefault(): void {
    if (__ANDROID__) {
      return this[native_]?.preventDefault();
    }

    if (__APPLE__) {
      return this[native_]?.preventDefault();
    }
  }

  get type(): string {
    if (__ANDROID__) {
      return this[native_]?.getType();
    }
    return this[native_]?.type;
  }

  get target(): any {
    return this['_target'];
  }
}

export class InputEvent extends Event {
  get data() {
    if (__ANDROID__) {
      if (this[native_] instanceof org.nativescript.mason.masonkit.events.FileInputEvent) {
        const data = this[native_]?.getRawData();
        if (!data) {
          return null;
        }
        const ret = [];
        const size = data.size();
        for (let i = 0; i < size; i++) {
          ret.push(data.get(i).toString());
        }
        return ret;
      }
      return this[native_]?.getData();
    }

    if (__APPLE__) {
      if (this[native_] instanceof MasonFileInputEvent) {
        const data = this[native_]?.rawData;
        if (!data) {
          return null;
        }
        const ret = [];
        const size = data.count;
        for (let i = 0; i < size; i++) {
          const item = data.objectAtIndex(i) as NSURL;
          ret.push(item.absoluteString);
        }
        return ret;
      }

      return this[native_]?.data;
    }

    return false;
  }

  get inputType() {
    if (__ANDROID__) {
      return this[native_]?.getInputType();
    }

    if (__APPLE__) {
      return this[native_]?.inputType;
    }

    return false;
  }
}
