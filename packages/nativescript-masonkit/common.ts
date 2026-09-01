/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AddChildFromBuilder, CustomLayoutView, View as NSView, ViewBase as NSViewBase, getViewById, Property, widthProperty, heightProperty, View, CoreTypes, Length as CoreLength, PercentLength as CorePercentLength, marginLeftProperty, marginRightProperty, marginTopProperty, marginBottomProperty, minWidthProperty, minHeightProperty, fontSizeProperty, fontWeightProperty, fontStyleProperty, colorProperty, Color, lineHeightProperty, letterSpacingProperty, textAlignmentProperty, textDecorationProperty, borderLeftWidthProperty, borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, backgroundColorProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, paddingBottomProperty, zIndexProperty, PseudoClassHandler } from '@nativescript/core';
import { Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position, BoxSizing, VerticalAlign, FlexDirection, Float, Clear } from '.';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexShrinkProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
import { fontInternalProperty } from '@nativescript/core/ui/styling/style-properties';
import { _forceStyleUpdate, _setGridAutoRows } from './utils';
import { Style as MasonStyle, Style } from './style';
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
  borderColorProperty,
  borderStyleProperty,
  backgroundImageProperty,
  listStyleTypeProperty,
  listStylePositionProperty,
} from './properties';
import { isMasonView_, isTextChild_, isText_, isPlaceholder_, text_, native_, textNode_, textNodeIndex_, textNodeProxied_, pseudoStyles_ } from './symbols';
import { Tree } from './tree';
import { TextNode } from './text-node';
import { compile } from './pseudo';

declare const kotlin: any;

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle {
  const ret: NSViewBase & { _styleHelper: MasonStyle } = (__ANDROID__ ? view.get() : view.deref()) as never;
  return ret._styleHelper as MasonStyle;
}

export interface MasonChild extends ViewBase {}

// move to cpp
function parseCssTransformToMatrix(s: string): { m11: number; m12: number; m21: number; m22: number; tx: number; ty: number } | null {
  if (!s || s === 'none') return null;
  let tx = 0,
    ty = 0,
    rad = 0,
    sx = 1,
    sy = 1;
  let found = false;
  const re = /(\w+)\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    found = true;
    const args = m[2].split(',').map((a) => parseFloat(a.trim()));
    switch (m[1]) {
      case 'translate':
        tx += args[0] || 0;
        ty += args[1] || 0;
        break;
      case 'translateX':
        tx += args[0] || 0;
        break;
      case 'translateY':
        ty += args[0] || 0;
        break;
      case 'rotate':
      case 'rotateZ':
        rad += ((args[0] || 0) * Math.PI) / 180;
        break;
      case 'scale':
        sx *= args[0] != null ? args[0] : 1;
        sy *= args[1] != null ? args[1] : args[0] != null ? args[0] : 1;
        break;
      case 'scaleX':
        sx *= args[0] != null ? args[0] : 1;
        break;
      case 'scaleY':
        sy *= args[0] != null ? args[0] : 1;
        break;
    }
  }
  if (!found) return null;
  const cos = Math.cos(rad),
    sin = Math.sin(rad);
  // CSS matrix(a,b,c,d,e,f) of rotate*scale → WinUI Matrix(M11,M12,M21,M22,OffsetX,OffsetY).
  return { m11: sx * cos, m12: sx * sin, m21: -sy * sin, m22: sy * cos, tx, ty };
}

// move to cpp
function parseBoxShadow(s: string): { ox: number; oy: number; blur: number; argb: number } | null {
  if (!s || s === 'none') return null;
  let color = 'rgba(0,0,0,0.2)';
  let rest = s;
  const m = s.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/);
  if (m) {
    color = m[0];
    rest = s.replace(m[0], ' ');
  }
  const nums = (rest.match(/-?\d*\.?\d+/g) || []).map((n) => parseFloat(n));
  const ox = nums[0] || 0,
    oy = nums[1] || 0,
    blur = nums[2] || 0;
  let argb = 0x33000000;
  try {
    argb = new Color(color as never).argb >>> 0;
  } catch (_) {
    /* keep default */
  }
  return { ox, oy, blur, argb };
}

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

function getWeakRefValue<T extends object>(value: WeakRef<T> | T | null | undefined): T | null {
  if (!value) return null;
  const maybeWeakRef = value as any;
  if (typeof maybeWeakRef.get === 'function') return maybeWeakRef.get();
  if (typeof maybeWeakRef.deref === 'function') return maybeWeakRef.deref();
  return value as T;
}

function nativeOwnerFor(nativeView: any): ViewBase | NSViewBase | null {
  if (!nativeView) return null;
  const owner = getWeakRefValue<ViewBase | NSViewBase>(nativeView.__masonOwner);
  if (owner) return owner;
  return getFrameworkElement(nativeView);
}

function nativeViewFor(owner: any): any {
  return owner?.nativeViewProtected ?? owner?.[native_];
}

function findOwnerForNativeView(owner: any, nativeView: any): ViewBase | NSViewBase | null {
  if (!owner || !nativeView) return null;

  const ownNativeView = nativeViewFor(owner);
  if (ownNativeView === nativeView) return owner;

  const children = owner._children ?? owner._viewChildren;
  if (!children) return null;

  for (const child of children) {
    const match = findOwnerForNativeView(child, nativeView);
    if (match) return match;
  }

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
    // @ts-ignore
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
    // @ts-ignore
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

/** "background-color" -> "backgroundColor". */
function toCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export class ViewBase extends CustomLayoutView implements AddChildFromBuilder {
  _children: (NSView | { text?: string } | TextNode)[] = [];
  [isMasonView_] = false;

  /**
   * Enable or disable CSS Preflight (web-normalised / Tailwind-like) defaults
   * for the entire Mason tree.
   *
   * When `true` every element starts from a clean, browser-normalised slate:
   *  - `box-sizing: border-box`
   *  - `margin: 0`, `padding: 0`, `border-width: 0`
   *  - `background: transparent`
   *  - `list-style: none` on `<ul>` / `<ol>`
   *  - `display: block` on `<img>` (replaced elements)
   *
   * This is a **tree-global** flag; it should ideally be set **before** views are
   * created so that all new nodes inherit the preflight baseline.  Changing it
   * after views have been created re-seeds the arena defaults but does not
   * retroactively restyle individually modified nodes.
   *
   * @example
   * ```ts
   * import { ViewBase } from '@triniwiz/nativescript-masonkit';
   * ViewBase.preflight = true; // enable at app startup
   * ```
   */
  static get preflight(): boolean {
    return Tree.instance.preflight;
  }

  static set preflight(value: boolean) {
    Tree.instance.preflight = value;
  }

  [isTextChild_] = false;
  [isText_] = false;

  [pseudoStyles_]: {
    active?: Style;
    focus?: Style;
    blur?: Style;
    hover?: Style;
    disabled?: Style;
  } = {};

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

  private _rememberNativeOwner(nativeView = nativeViewFor(this)) {
    if (!nativeView) return;
    try {
      nativeView.__masonOwner = new WeakRef(this);
    } catch (_) {
      // Some host objects do not accept expandos; fallback tree matching still works.
    }
  }

  /**
   * Returns the top-most Mason/NativeScript element at a point in this view's
   * visible local coordinate space, similar to the browser's elementFromPoint().
   */
  public elementFromPoint(x: number, y: number): ViewBase | NSViewBase | null {
    const nativeView = nativeViewFor(this) ?? (this as any)._view;
    if (!nativeView) return null;

    this._rememberNativeOwner(nativeView);

    let nativeHit: any = null;
    if (__ANDROID__ && typeof nativeView.elementFromPoint === 'function') {
      nativeHit = nativeView.elementFromPoint(x, y);
    } else if (__APPLE__) {
      const hitTest = nativeView.mason_elementFromPointY ?? nativeView.mason_elementFromPoint ?? nativeView.elementFromPoint;
      if (typeof hitTest === 'function') {
        nativeHit = hitTest.call(nativeView, x, y);
      }
    }

    if (!nativeHit) return null;
    return nativeOwnerFor(nativeHit) ?? findOwnerForNativeView(this, nativeHit);
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
      if (__WINDOWS__) {
        if (arg === 'click' || arg === 'tap') {
          try {
            const NSWinRT_: any = (globalThis as any).NSWinRT;
            const MUX: any = (globalThis as any).Microsoft;
            const owner = this;
            const view: any = (this as any)._view;
            const delegate = NSWinRT_.asDelegate('Microsoft.UI.Xaml.Input.TappedEventHandler', (_sender: any, _e: any) => {
              const ret: any = {};
              ret[native_] = _e;
              ret._target = owner;
              callback.call(thisArg || owner, ret);
            });
            if (view.Background == null && MUX?.UI?.Xaml?.Media?.SolidColorBrush) {
              view.Background = new MUX.UI.Xaml.Media.SolidColorBrush(MUX.UI.Colors.Transparent);
            }

            const tappedEvent = MUX?.UI?.Xaml?.UIElement?.TappedEvent ?? view.TappedEvent;
            let attached = false;
            if (tappedEvent && typeof view.AddHandler === 'function') {
              try {
                view.AddHandler(tappedEvent, delegate, true);
                callback['mason:event:tapped'] = tappedEvent;
                attached = true;
              } catch (_e) {}
            }
            if (!attached) {
              view.Tapped = delegate;
            }
            callback['mason:event:id'] = delegate;
          } catch (_) {}
        }
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
      if (__WINDOWS__) {
        if (id && (arg === 'click' || arg === 'tap')) {
          try {
            const view: any = (this as any)._view;
            const tappedEvent = callback['mason:event:tapped'];
            if (tappedEvent && typeof view.RemoveHandler === 'function') {
              view.RemoveHandler(tappedEvent, id);
            } else if (view) {
              view.Tapped = null;
            }
          } catch (_) {}
          callback['mason:event:id'] = undefined;
          callback['mason:event:tapped'] = undefined;
        }
      }
    }
  }

  initNativeView(): void {
    super.initNativeView();
    this._rememberNativeOwner();
    if (this._pendingEventsRegistration.length > 0) {
      const pending = this._pendingEventsRegistration.splice(0);
      for (const registration of pending) {
        this._registerNativeEvent(registration.arg, registration.callback, registration.thisArg);
      }
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    // nativeView.frame = frame;
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
      case 'click':
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
      case 'click':
        this._unregisterNativeEvent(arg, callback, thisArg);
        break;
    }
  }

  private _applyPseudoClassStyles(pseudoClass: string, view, styles: Record<string, any>) {
    if (pseudoClass && styles && pseudoClass in styles) {
      const current = styles[pseudoClass];
      //@ts-ignore
      const existing = this[pseudoStyles_]?.[pseudoClass];

      const style = existing ?? Style.fromPseudo(pseudoClass, this as never, view);

      if (style) {
        for (const prop in current) {
          // ruleset props are kebab-case; Style only has camelCase accessors.
          style[toCamelCase(prop)] = current[prop];
        }
        this[pseudoStyles_][pseudoClass] = style;
      }
    }
  }

  @PseudoClassHandler('hover')
  _hoverHandler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('hover', this._view, styles);
  }

  @PseudoClassHandler('highlighted', 'pressed', 'active')
  _handler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('active', this._view, styles);
  }

  @PseudoClassHandler('disabled')
  _disableHandler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('disabled', this._view, styles);
  }

  @PseudoClassHandler('focus')
  _focusHandler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('focus', this._view, styles);
  }

  @PseudoClassHandler('blur')
  _blurHandler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('blur', this._view, styles);
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

  insertBefore(child: any, reference: any) {
    if (reference === null || reference === undefined) {
      if (child && child.nodeType === 3) {
        this._updateTextNode(child, { type: 'add', index: -1, isBreak: child.nodeName === 'br' });
        return;
      }
      this.addChild(child);
      return;
    }
    let atIndex = this._children.indexOf(reference);
    if (atIndex === -1) {
      // reference may be a DOM text node; look it up via its native text-node back-link
      const nativeTextNode = reference[textNode_];
      if (nativeTextNode) {
        atIndex = (this._children as any[]).findIndex((c: any) => c && c[textNode_] === nativeTextNode);
      }
      if (atIndex === -1) {
        throw new Error('NotFoundError');
      }
    }

    if (child && child.nodeType === 3) {
      this._updateTextNode(child, { type: 'insert', index: atIndex, isBreak: child.nodeName === 'br' });
      return;
    }

    this.insertChild(child, atIndex);
  }

  // Native child index for an insertion at `atIndex`: counts only the
  // preceding siblings that already exist in the native tree. Text nodes and
  // placeholders attach natively right away, but NativeScript views attach
  // lazily (on `loaded`), so a raw `_children` index can run ahead of the
  // native children list and push the insert past the end.
  private _nativeIndexFor(atIndex: number) {
    let index = 0;
    const max = Math.min(atIndex, this._children.length);
    for (let i = 0; i < max; i++) {
      const c: any = this._children[i];
      if (!c) {
        continue;
      }
      if (c[textNode_] || c instanceof TextNode || text_ in c || (c[isPlaceholder_] && c[native_]) || c._isMasonChild) {
        index++;
      }
    }
    return index;
  }

  insertChild(child: any, atIndex: number) {
    if (child && child[isPlaceholder_] && child._view) {
      const nativeIndex = this._nativeIndexFor(atIndex);
      this._children.splice(atIndex, 0, child);
      if (this[isText_]) {
        child[isTextChild_] = true;
      }

      if (__ANDROID__) {
        //@ts-ignore
        this._view.addChildAt(child._view, nativeIndex);
      }

      if (__APPLE__) {
        //@ts-ignore
        this._view.mason_addChildAtElement(child._view, nativeIndex);
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
        this._view.mason_replaceChildAtElement(child._view, atIndex);
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
    // Placeholder (e.g. Br): it was attached straight to the mason tree via the
    // native element APIs (never `_addView`-ed), so `_removeView` would throw.
    // Remove the native node directly instead.
    if (child && child[isPlaceholder_] && child._view) {
      const index = this._children.indexOf(child);
      if (index > -1) {
        this._children.splice(index, 1);
        if (__ANDROID__) {
          //@ts-ignore
          this._view.removeChild(child._view.node);
        }
        if (__APPLE__) {
          //@ts-ignore
          this._view.mason_removeChildNode(child._view.node);
        }
        child[isTextChild_] = false;
        (this as any).requestLayout?.();
      }
      return;
    }
    // Framework text node: it isn't stored in `_children` directly — its native
    // `MasonTextNode` is stamped on it as `child[textNode_]`. Use that to locate
    // and remove the matching native node from the mason tree. NativeScript has
    // no real text nodes (frameworks just set `.text`), so this is what lets a
    // framework's `removeChild(textNode)` actually drop the mason node.
    if (child && child[textNode_]) {
      const native = child[textNode_];
      const tnIndex = this._children.findIndex((c: any) => c && c[textNode_] === native);
      if (tnIndex > -1) {
        this._nativeRemoveChildNode(native, tnIndex);
        this._children.splice(tnIndex, 1);
        // Drop the proxy binding so a later re-adopt re-installs cleanly.
        child[textNodeProxied_] = false;
        child[textNode_] = undefined;
        this._syncTextRunLayout();
        (this as any).requestLayout?.();
        return;
      }
    }

    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
      this._removeView(child);
    }
  }

  // Remove the native node directly when supported (no index drift), falling
  // back to index-based removal on native builds that predate the by-node API.
  private _nativeRemoveChildNode(node: any, index: number) {
    //@ts-ignore
    const view = this._view;
    if (!view) return;
    if (__ANDROID__) {
      //@ts-ignore
      if (typeof view.removeChild === 'function') view.removeChild(node);
      //@ts-ignore
      else view.removeChildAt(index);
    }
    if (__APPLE__) {
      //@ts-ignore
      if (view.mason_removeChildNode) view.mason_removeChildNode(node);
      //@ts-ignore
      else view.mason_removeChildAt?.(index);
    }
    if (__WINDOWS__) {
      //@ts-ignore
      if (typeof view.RemoveRun === 'function') view.RemoveRun(node);
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

  // @ts-ignore
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
      if (__WINDOWS__) {
        (node[textNode_] as NativeScript.Mason.TextNode).Data = text;
      }
      this._installTextNodeProxy(node);
      return node[textNode_];
    }

    let textNode;
    if (__ANDROID__) {
      textNode = new org.nativescript.mason.masonkit.TextNode(Tree.instance.native as never, text);
    }
    if (__APPLE__) {
      textNode = MasonTextNode.alloc().initWithMasonDataAttributes(Tree.instance.native as never, text, null);
    }
    if (__WINDOWS__) {
      const tn = new NativeScript.Mason.TextNode();
      tn.Data = text;
      textNode = tn;
    }
    node[textNode_] = textNode;
    // Back-reference from the native node to the framework text node.
    textNode['__raw__'] = node;
    this._installTextNodeProxy(node);
    return textNode;
  }

  /**
   * Bind a framework text node directly to its backing native `MasonTextNode`.
   *
   * Once mason adopts a text node (any framework — dominative/undom, Vue, React,
   * Angular) we redefine its `data` accessor so future in-place writes
   * (`node.data = …`, `node.nodeValue = …`, `node.textContent = …`, all of which
   * funnel through `data` on a CharacterData node) flow straight through to the
   * native node and trigger a relayout. The original accessor is still invoked so
   * the framework's own bookkeeping (undom's `__undom_data`, change callbacks)
   * stays intact. This is the framework-agnostic counterpart to the structural
   * reconcile in `textProperty.setNative` — structure is handled there, granular
   * text edits are handled here, with no per-framework glue.
   */
  private _installTextNodeProxy(node: any) {
    if (!node || node[textNodeProxied_]) return;

    // Locate the inherited `data` accessor (undom CharacterData and friends define
    // it on a prototype). If the node isn't CharacterData-like there's nothing to
    // proxy — the structural path already covers it.
    let proto = Object.getPrototypeOf(node);
    let dataDesc: PropertyDescriptor | undefined;
    while (proto && !dataDesc) {
      dataDesc = Object.getOwnPropertyDescriptor(proto, 'data');
      proto = Object.getPrototypeOf(proto);
    }
    if (!dataDesc || !dataDesc.set) return;

    node[textNodeProxied_] = true;
    const owner = this;

    Object.defineProperty(node, 'data', {
      configurable: true,
      enumerable: false,
      get() {
        return dataDesc.get ? dataDesc.get.call(this) : this.__undom_data;
      },
      set(value: any) {
        // Preserve the framework's own bookkeeping first.
        dataDesc.set.call(this, value);

        // Push through to the native node (read `textNode_` lazily so we always
        // target the current backing node even if it was re-created).
        const nativeTextNode = this[textNode_];
        if (nativeTextNode) {
          const data = value == null ? '' : `${value}`;
          if (__ANDROID__) (nativeTextNode as org.nativescript.mason.masonkit.TextNode).setData(data);
          if (__APPLE__) (nativeTextNode as MasonTextNode).data = data;
          if (__WINDOWS__) (nativeTextNode as NativeScript.Mason.TextNode).Data = data;
          // Re-measure/layout so the new text is reflected on screen.
          (owner as any).requestLayout?.();
        }
      },
    });
  }

  private _nativeAddChild(textNode: any, index: number) {
    //@ts-ignore
    if (__ANDROID__) this._view.addChildAt(textNode, index);
    //@ts-ignore
    if (__APPLE__) this._view.mason_addChildAtNode(textNode, index);
    if (__WINDOWS__) {
      const view = (this as any)._view;
      if (!view) return;
      if (typeof view.SetRun === 'function') view.SetRun(textNode, index);
      else NativeScript.Mason.Css.ReparentChild(view, textNode, index);
    }
  }

  private _nativeReplaceChild(textNode: any, index: number) {
    //@ts-ignore
    if (__ANDROID__) this._view.replaceChildAt(textNode, index);
    //@ts-ignore
    if (__APPLE__) this._view.mason_replaceChildAtNode(textNode, index);
    if (__WINDOWS__) {
      const view = (this as any)._view;
      if (!view) return;
      if (typeof view.SetRun === 'function') view.SetRun(textNode, index);
      else NativeScript.Mason.Css.ReparentChild(view, textNode, index);
    }
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

  // Splices a text-node entry in at `index`, shifting existing children right.
  private _spliceOrPushChild(index: number, entry: any) {
    if (this._children.length > index) {
      //@ts-ignore
      this._children.splice(index, 0, entry);
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
    } | null = null,
  ) {
    const text = node.text ?? node.data ?? '';
    const textNode = this._createOrUpdateNativeTextNode(node, text);

    if (__WINDOWS__ && textNode && typeof (textNode as any).SetBreak === 'function') {
      (textNode as any).SetBreak(!!operation?.isBreak);
    }

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
        this._spliceOrPushChild(operation.index, entry);
        break;
    }
    this._syncTextRunLayout();
  }

  private _syncTextRunLayout() {
    if (!__WINDOWS__) return;
    // @ts-ignore
    const sh = this._styleHelper;
    if (!sh) return;
    try {
      sh.display = 'block';
    } catch (_) {
      // empty
    }
  }

  // -- Text setter with per-view framework detection --

  [textProperty.setNative](value: string) {
    const frameworkEl = getFrameworkElement(this);

    if (frameworkEl) {
      // Frameworks with childNodes array (Vue, React, Svelte, SolidJS)
      if (Array.isArray(frameworkEl.childNodes)) {
        const rawChildNodes = frameworkEl.childNodes as any[];
        if (rawChildNodes.length === 0) {
          this.replaceChild({ [text_]: value }, 0);
          return;
        }

        // Deduplicate nodes (some frameworks expose the same nodes via both
        // `childNodes` array and linked `nextSibling` references). Preserve
        // original order while skipping duplicate references.
        const nodes: any[] = [];
        const seen = new Set<any>();
        for (let n of rawChildNodes) {
          if (!seen.has(n)) {
            seen.add(n);
            nodes.push(n);
          }
        }

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const isTextNode = node.nodeType === 'text' || node.nodeType === 3;
          if (isTextNode) {
            let type: 'add' | 'replace' | 'insert' = i === 0 && nodes.length === 1 && !this._children.length ? 'add' : 'replace';

            if (type === 'replace') {
              const toReplace = this._children[i] as any;
              // Replace in place only if this slot already holds THIS framework
              // node (its native node back-references it via '__raw__'); otherwise
              // a different node lives here, so shift via insert instead of
              // overwriting it.
              if (!toReplace || toReplace[textNode_]?.['__raw__'] !== node) {
                type = 'insert';
              }
            }

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
      // Pass the raw value straight through — the style setter's normalizeColorValue handles
      // number / string / Color / {argb} via duck-typing, which is robust even when a `Color`
      // instance comes from a different @nativescript/core copy (cross-copy `instanceof` fails).
      // @ts-ignore
      style.backgroundColor = value;
      return;
      // eslint-disable-next-line no-unreachable
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
    // @ts-ignore
    if (style) style.lineHeight = value;
  }

  [letterSpacingProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    // @ts-ignore
    if (style) style.letterSpacing = value;
  }

  [textAlignmentProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    // @ts-ignore
    if (style) style.textAlignment = value;
  }

  [textDecorationProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.textDecoration = String(value);
    }
  }

  // @ts-ignore
  [borderColorProperty.setNative](value: any) {
    if (__ANDROID__) {
      // @ts-ignore
      org.nativescript.mason.masonkit.NodeHelper.getShared().setBorderColor(this.nativeView, String(value));
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any).style.setBorderColor(String(value));
    } else if (__WINDOWS__) {
      // @ts-ignore
      const style = this._styleHelper;
      // @ts-ignore
      if (style) style.setBorderColor(String(value));
    }
  }

  // @ts-ignore
  [borderStyleProperty.setNative](value: any) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderStyle = String(value ?? '');
    }
  }

  // @ts-ignore
  [backgroundImageProperty.setNative](value: any) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.backgroundImage = String(value);
    }
  }

  // @ts-ignore
  [listStyleTypeProperty.setNative](value: any) {
    if (__ANDROID__) {
      // @ts-ignore
      org.nativescript.mason.masonkit.NodeHelper.getShared().setListStyleType(this.nativeView, String(value));
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any).style.applyListStyleType(String(value));
    }
  }

  // @ts-ignore
  [listStylePositionProperty.setNative](value: any) {
    if (__ANDROID__) {
      // @ts-ignore
      org.nativescript.mason.masonkit.NodeHelper.getShared().setListStylePosition(this.nativeView, String(value));
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any).style.applyListStylePosition(String(value));
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

  // Font props only land in the style buffer, which the TextBlock-backed text doesn't read, so they
  // must be forwarded to the native Text control to take visual effect. No-op off a Text container.
  private _applyTextRunProp(method: string, arg: number) {
    if (!__WINDOWS__) return;
    try {
      const view = (this as any)._view;
      if (view && typeof view[method] === 'function') view[method](arg);
    } catch (_) {}
  }

  [colorProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // Duck-typed via normalizeColorValue (robust to cross-core Color instances).
      // @ts-ignore
      style.color = value;
      if (__WINDOWS__) {
        // Push the resolved color to the Text container's TextBlock (the default for all runs).
        // Imperative — not during layout.
        try {
          const argb = (style as any).color >>> 0 || 0;
          const view = (this as any)._view;
          if (view && argb && typeof view.SetColor === 'function') view.SetColor(argb);
        } catch (_) {}
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
      style.marginCss = value;
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
      // @ts-ignore
      style.paddingCss = value;
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
      style.insetCss = value;
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
      style.boxShadow = value;
      if (__WINDOWS__) {
        // box-shadow isn't a Mason buffer prop — render it as a Composition DropShadow on the element
        // (masked to its rounded-rect shape, re-applied on resize). The corner radius is read natively.
        const nv: any = (this as any).nativeViewProtected ?? (this as any)._view;
        try {
          const sh = parseBoxShadow(typeof value === 'string' ? value : '');
          if (!sh) NativeScript.Mason.Css.ClearShadow(nv);
          else NativeScript.Mason.Css.ApplyShadow(nv, sh.ox, sh.oy, sh.blur, sh.argb, 0);
        } catch (_) {}
      }
    }
  }

  [transformProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.transform = value;
      if (__WINDOWS__) {
        // transform isn't a Mason buffer prop — apply it to the FrameworkElement via Composition,
        // like @nativescript/core does on its own panels (the plugin's View is a custom Panel core
        // doesn't drive transforms on). Parse the CSS string to a matrix and set RenderTransform.
        const nv: any = (this as any).nativeViewProtected ?? (this as any)._view;
        try {
          const mtx = parseCssTransformToMatrix(typeof value === 'string' ? value : '');
          if (!mtx) NativeScript.Mason.Css.ClearTransform(nv);
          else NativeScript.Mason.Css.ApplyTransform(nv, mtx.m11, mtx.m12, mtx.m21, mtx.m22, mtx.tx, mtx.ty);
        } catch (_) {}
      }
    }
  }
}

textProperty.register(ViewBase);

export class TextBase extends ViewBase {
  textContent: string;

  [fontInternalProperty.setNative](value: any) {
    if (!__WINDOWS__) return;
    // @ts-ignore
    const view = (this as any)._view;
    if (!view || typeof view.SetFontFamily !== 'function') return;
    const family = value && typeof value === 'object' ? (value.fontFamily ?? '') : '';
    try {
      view.SetFontFamily(String(family ?? ''));
    } catch (_) {}
  }

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

    return 0;
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

  set type(_: string) {}

  get target(): any {
    return this['_target'];
  }

  set target(_: any) {}
  set currentTarget(_: any) {}
  set bubbles(_: boolean) {}
  set cancelable(_: boolean) {}
  set timeStamp(_: number) {}
  set defaultPrevented(_: boolean) {}
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
