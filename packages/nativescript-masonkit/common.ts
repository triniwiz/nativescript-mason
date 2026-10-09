/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AddChildFromBuilder,
  CustomLayoutView,
  Utils,
  View as NSView,
  ViewBase as NSViewBase,
  getViewById,
  Property,
  widthProperty,
  heightProperty,
  View,
  CoreTypes,
  Length as CoreLength,
  PercentLength as CorePercentLength,
  marginLeftProperty,
  marginRightProperty,
  marginTopProperty,
  marginBottomProperty,
  minWidthProperty,
  minHeightProperty,
  fontSizeProperty,
  fontWeightProperty,
  fontStyleProperty,
  colorProperty,
  Color,
  lineHeightProperty,
  letterSpacingProperty,
  textAlignmentProperty,
  textDecorationProperty,
  borderLeftWidthProperty,
  borderTopWidthProperty,
  borderRightWidthProperty,
  borderBottomWidthProperty,
  backgroundColorProperty,
  paddingLeftProperty,
  paddingRightProperty,
  paddingTopProperty,
  paddingBottomProperty,
  zIndexProperty,
  directionProperty,
  PseudoClassHandler,
} from '@nativescript/core';
import { Display, Gap, GridAutoFlow, JustifyItems, JustifySelf, Length, LengthAuto, Overflow, Position, BoxSizing, VerticalAlign, FlexDirection, Float, Clear } from '.';
import { alignItemsProperty, alignSelfProperty, flexDirectionProperty, flexGrowProperty, flexShrinkProperty, flexWrapProperty, justifyContentProperty } from '@nativescript/core/ui/layouts/flexbox-layout';
// The per-corner radius and per-side colour longhands core's `border-radius`
// / `border-color` shorthands expand into. They live in the styling module
// rather than core's root export, unlike the border *width* longhands above.
import { fontInternalProperty, backgroundInternalProperty, borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty, borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty } from '@nativescript/core/ui/styling/style-properties';
import { _forceStyleUpdate, _setGridAutoRows } from './utils';
import { borderRadiusCorners, composeBorderRadius, isCssLength, parseCornerRadius, toCamelCase } from './css-shorthands';
import type { CornerIndex, CornerRadius } from './css-shorthands';
import type { EventData, TouchGestureEventData } from '@nativescript/core';
import { Style as MasonStyle, Style, nodeHelper, cssLengthToDip } from './style';
import { encodeBoxShadows, parseBoxShadows } from './box-shadow';
import { parseCssTransform } from './css-transform';
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
  installMasonSizeUnits,
} from './properties';
import { isMasonView_, isTextChild_, isText_, isPlaceholder_, text_, native_, textNode_, textNodeIndex_, textNodeProxied_, pseudoStyles_, emptyTextNode_, breakRun_, anonymousText_, windowsFontSource_, hostsRuns_, needsAnonymousText_, borderRadiusCorners_, borderSideColors_, eventType_, runMember_, runsInline_, runsSettled_, blockified_ } from './symbols';
import { Tree } from './tree';
import { masonEngine, removeNativeChild } from './windows-panel-helpers';
import { TextNode } from './text-node';
import { compile } from './pseudo';
import { frameworkRegistry } from './framework-registry';
import { reconcileTextRuns } from './text-runs';

declare const kotlin: any;

function getViewStyle(view: WeakRef<NSViewBase> | WeakRef<TextBase>): MasonStyle {
  const ret: NSViewBase & { _styleHelper: MasonStyle } = (__ANDROID__ ? view.get() : view.deref()) as never;
  return ret._styleHelper as MasonStyle;
}

export interface MasonChild extends ViewBase {}

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
  return frameworkRegistry.getElement(nativeView);
}

function nativeViewFor(owner: any): any {
  return owner?.nativeViewProtected ?? owner?.[native_];
}

function masonNativeEventName(eventName: string): string | null {
  switch (eventName) {
    case 'tap':
    case 'click':
      return 'click';
    case 'beforeinput':
    case 'input':
    case 'change':
    case 'cancel':
    case 'compositionstart':
    case 'compositionupdate':
    case 'compositionend':
    case 'focus':
    case 'blur':
    case 'keydown':
      return eventName;
    default:
      return null;
  }
}

function findOwnerForNativeView(owner: any, nativeView: any): ViewBase | NSViewBase | null {
  if (!owner || !nativeView) return null;

  const ownNativeView = nativeViewFor(owner);
  if (ownNativeView === nativeView || owner?.[native_] === nativeView) return owner;

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
    // @ts-ignore
    maxWidth: LengthAuto;
    // @ts-ignore
    maxHeight: LengthAuto;
    inset: LengthAuto;
    left: LengthAuto;
    right: LengthAuto;
    top: LengthAuto;
    bottom: LengthAuto;
    gridGap: Gap;
    gap: Gap;
    // @ts-ignore
    rowGap: Length;
    // @ts-ignore
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
    // @ts-ignore
    cornerShape: string;
    transform: string;
  }
}

function masonLength<T>(value: T): T | string {
  return isCssLength(value) ? value.css : value;
}

/** A core `Length` (number of dip, or `{ value, unit }`) as a CSS string. */
function lengthToCssString(value: CoreTypes.LengthType | string | undefined | null): string {
  if (value == null) {
    return '0';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  const unit = (value as { unit?: string }).unit;
  const amount = (value as { value?: number }).value ?? 0;
  return unit === '%' ? `${amount * 100}%` : `${amount}px`;
}

/**
 * A core colour value as a CSS string. Duck-typed rather than
 * `instanceof Color` on purpose: a `Color` can arrive from a different
 * `@nativescript/core` copy, where `instanceof` fails.
 */
function colorToCssString(value: unknown): string {
  if (value == null) {
    return 'transparent';
  }
  if (typeof value === 'string') {
    return value;
  }
  const hex = (value as { hex?: string }).hex;
  if (typeof hex === 'string') {
    return hex;
  }
  return String(value);
}

function backgroundImageToCssString(value: unknown): string {
  const gradient = value as { angle?: number; colorStops?: { color: unknown; offset?: { value: number } }[] };
  if (value && typeof value === 'object' && typeof gradient.angle === 'number' && Array.isArray(gradient.colorStops)) {
    const stops = gradient.colorStops.map((stop) => (stop.offset ? `${colorToCssString(stop.color)} ${stop.offset.value * 100}%` : colorToCssString(stop.color)));
    return `linear-gradient(${gradient.angle}rad, ${stops.join(', ')})`;
  }
  return value == null ? 'none' : String(value);
}

// Windows raises no pressed state natively, so :active follows the pointer, as core's Button does.
const WINDOWS_ACTIVE_STATES = ['active', 'highlighted'];

function onWindowsActiveTouch(args: TouchGestureEventData) {
  if (args.action === 'down') {
    for (const state of WINDOWS_ACTIVE_STATES) (args.object as any)._addVisualState(state);
  } else if (args.action === 'up' || args.action === 'cancel') {
    clearWindowsActive(args.object);
  }
}

// Core's touch gesture reports no cancel, and a release outside the view isn't delivered to it.
function onWindowsActiveLeave(args: EventData) {
  clearWindowsActive(args.object);
}

function clearWindowsActive(view: any) {
  for (const state of WINDOWS_ACTIVE_STATES) view._removeVisualState(state);
}

function onWindowsHoverEnter(args: EventData) {
  (args.object as any)._addVisualState('hover');
}

function onWindowsHoverLeave(args: EventData) {
  (args.object as any)._removeVisualState('hover');
}

function onWindowsFocus(this: any) {
  this._addVisualState('focus');
}

function onWindowsBlur(this: any) {
  this._removeVisualState('focus');
}

const windowsRunCounts = new WeakMap<object, number>();

function windowsNativeOf(child: any) {
  return child?.nativeViewProtected ?? child?._view;
}

function windowsBreakRun(child: any) {
  let run = child[breakRun_];
  if (!run) {
    run = new NativeScript.Mason.TextNode();
    run.SetBreak(true);
    child[breakRun_] = run;
  }
  return run;
}

export function windowsMemberKind(child: any): 'run' | 'break' | 'text' | 'box' {
  if (child[textNode_]) return 'run';
  if (child[isPlaceholder_]) return 'break';
  if (child[isText_] && !(child instanceof ButtonBase)) {
    const style = child._styleHelper;
    const display = style?.display;
    if ((display === 'inline' || display === 'none') && !style.hasBoxStyle) return 'text';
  }
  return 'box';
}

const TEARDOWN_SLICE_MS = 8;
// Reading the clock costs more than a teardown on some devices.
const TEARDOWNS_PER_CLOCK_READ = 16;

// Mason roots whose requestLayout already climbed to the page in this turn.
let climbedRoots: Set<any> | null = null;

function markClimbed(root: any) {
  if (!climbedRoots) {
    climbedRoots = new Set();
    queueMicrotask(() => (climbedRoots = null));
  }
  climbedRoots.add(root);
}

// A layout in between clears core's flag, so the next request climbs again.
function climbedThisTurn(root: any): boolean {
  return !!climbedRoots?.has(root) && !!root.isLayoutRequested;
}

let windowsInnerHTML: ((view: any, html: string) => void) | undefined;

export function setWindowsInnerHTML(build: (view: any, html: string) => void) {
  windowsInnerHTML = build;
}

export class ViewBase extends CustomLayoutView implements AddChildFromBuilder {
  _children: (NSView | { text?: string } | TextNode)[] = [];
  [isMasonView_] = false;

  _masonPendingTeardown = false;
  private static _pendingTeardowns: ViewBase[] = [];
  private static _teardownScheduled = false;

  public _tearDownUI(force?: boolean): void {
    if ((__ANDROID__ || __APPLE__ || __WINDOWS__) && !force && !this.reusable && this._context && this.nativeViewProtected) {
      // A keyed move tears down and re-adds within one patch. Detach only this
      // element and defer the recursive teardown; _setupUI cancels it on re-attach.
      if (this.parent) {
        this.parent._removeViewFromNativeVisualTree(this);
      }
      this._masonPendingTeardown = true;
      ViewBase._pendingTeardowns.push(this);
      if (!ViewBase._teardownScheduled) {
        ViewBase._teardownScheduled = true;
        setTimeout(() => ViewBase._drainTeardowns(), 0);
      }
      return;
    }
    super._tearDownUI(force);
  }

  public _setupUI(context?: any, atIndex?: number, parentIsLoaded?: boolean): void {
    if ((__ANDROID__ || __APPLE__ || __WINDOWS__) && this._masonPendingTeardown) {
      this._masonPendingTeardown = false;
      if (this._context === context) {
        // core 9.1 renamed mIsRootView to the private _isRootView
        const isRootView = (this as any)._isRootView ?? (this as any).mIsRootView;
        if (!isRootView && this.parent && !this._isAddedToNativeVisualTree) {
          const nativeIndex = this.parent._childIndexToNativeChildIndex(atIndex ?? -1);
          this._isAddedToNativeVisualTree = this.parent._addViewToNativeVisualTree(this, nativeIndex);
        }
        return;
      }
    }
    super._setupUI(context, atIndex, parentIsLoaded);
  }

  // Core's CustomLayoutView finds the child with a WinRT call per sibling. Mason's containers remove
  // their children natively themselves, so only core's bookkeeping is kept.
  public _removeViewFromNativeVisualTree(child: any): void {
    if (__WINDOWS__) {
      child._isAddedToNativeVisualTree = false;
      return;
    }
    super._removeViewFromNativeVisualTree(child);
  }

  private _masonFinishTeardown() {
    if (!this._masonPendingTeardown) {
      return;
    }
    this._masonPendingTeardown = false;
    super._tearDownUI(true);
  }

  private static _drainTeardowns() {
    ViewBase._teardownScheduled = false;
    const deadline = Date.now() + TEARDOWN_SLICE_MS;
    let done = 0;
    while (ViewBase._pendingTeardowns.length > 0) {
      const view = ViewBase._pendingTeardowns.shift();
      view._masonFinishTeardown();
      if (++done % TEARDOWNS_PER_CLOCK_READ === 0 && Date.now() >= deadline) {
        break;
      }
    }
    if (ViewBase._pendingTeardowns.length > 0) {
      ViewBase._teardownScheduled = true;
      setTimeout(() => ViewBase._drainTeardowns(), 0);
    }
  }

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
    // `width`/`height` are core CssAnimationProperties whose stylesheet accessor
    // is non-configurable, so units Mason understands but core does not (`vh`,
    // `rem`, `pt`, …) have to be resolved on this view's own Style object.
    installMasonSizeUnits(this.style);
    if (__ANDROID__) {
      (this as any)._isPaddingRelative = false;
    }
  }

  get innerHTML() {
    if (__WINDOWS__) return (this as any)._windowsInnerHTML ?? '';
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
    if (__WINDOWS__) {
      (this as any)._windowsInnerHTML = value ?? '';
      windowsInnerHTML?.(this, value ?? '');
      return;
    }
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
    } else if (__WINDOWS__ && typeof masonEngine().ElementFromPoint === 'function') {
      nativeHit = masonEngine().ElementFromPoint(nativeView, x, y);
    }

    if (!nativeHit) return null;
    const known = nativeOwnerFor(nativeHit);
    if (known) return known;
    // Owners are remembered on first hit rather than for every view at init.
    const found = findOwnerForNativeView(this, nativeHit);
    (found as any)?._rememberNativeOwner?.(nativeHit);
    return found;
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
              const ret: any = wrapNativeEvent(arg);
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
          const ret: any = wrapNativeEvent(arg);
          ret[native_] = event;
          ret._target = this;
          callback.call(thisArg || this, ret);
        });

        callback['mason:event:id'] = id;
      }
      if (__WINDOWS__) {
        if (typeof masonEngine().AddEventListener === 'function') {
          const ref = new WeakRef(this);
          const listener = (globalThis as any).NSWinRT.asDelegate('NativeScript.Mason.EventListener', (event: any) => {
            const owner = ref.deref();
            if (!owner) return;
            const ret: any = wrapNativeEvent(arg);
            ret[native_] = event;
            ret._target = owner;
            callback.call(thisArg || owner, ret);
          });
          callback['mason:event:id'] = masonEngine().AddEventListener((this as any)._view, arg, listener);
          callback['mason:event:listener'] = listener;
        } else if (arg === 'click' || arg === 'tap') {
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
        } else if (typeof (this as any)._view.AddEventListener === 'function') {
          const ref = new WeakRef(this);
          const listener = (globalThis as any).NSWinRT.asDelegate('NativeScript.Mason.EventListener', (event: any) => {
            const owner = ref.deref();
            if (!owner) return;
            const ret: any = wrapNativeEvent(arg);
            ret[native_] = event;
            ret._target = owner;
            callback.call(thisArg || owner, ret);
          });
          callback['mason:event:id'] = (this as any)._view.AddEventListener(arg, listener);
          // Held so the delegate isn't collected.
          callback['mason:event:listener'] = listener;
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
        if (id) {
          //@ts-ignore
          const removed = (this._view as org.nativescript.mason.masonkit.Element).removeEventListener(arg, id);

          callback['mason:event:id'] = undefined;
        }
      }
      if (__APPLE__) {
        if (id) {
          //@ts-ignore
          const removed = (this._view as NSObject).mason_removeEventListenerId(arg, id);

          callback['mason:event:id'] = undefined;
        }
      }
      if (__WINDOWS__) {
        if (id && callback['mason:event:listener'] && !callback['mason:event:tapped']) {
          masonEngine().RemoveEventListener((this as any)._view, arg, id);
          callback['mason:event:id'] = undefined;
          callback['mason:event:listener'] = undefined;
        } else if (id && (arg === 'click' || arg === 'tap')) {
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
        } else if (id && typeof (this as any)._view.RemoveEventListener === 'function') {
          (this as any)._view.RemoveEventListener(arg, id);
          callback['mason:event:id'] = undefined;
          callback['mason:event:listener'] = undefined;
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

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    // nativeView.frame = frame;
  }

  /**
   * iOS: the views in this subtree a root's layout pass must visit (non-Mason children, which core
   * lays out, and Mason views listening to layoutChanged). The pass skips subtrees where it's 0.
   */
  _masonLayoutWork = 0;

  private _masonAddLayoutWork(delta: number) {
    // Up to the root: a non-Mason parent is laid out by core and its Mason roots keep their own count.
    let view: any = this;
    while (view?.[isMasonView_]) {
      view._masonLayoutWork += delta;
      view = view.parent;
    }
  }

  private _masonListensToLayout(): boolean {
    return this.hasListeners(NSView.layoutChangedEvent);
  }

  public _addViewCore(view: any, atIndex?: number) {
    // Before setup: listeners the child gains while loading add themselves through `parent`.
    if (__APPLE__) {
      const work = view?.[isMasonView_] ? view._masonLayoutWork : 1;
      if (work) this._masonAddLayoutWork(work);
    }
    // @ts-ignore
    super._addViewCore(view, atIndex);
  }

  public _removeViewCore(view: any) {
    // @ts-ignore
    super._removeViewCore(view);
    // After teardown: listeners removed while unloading already subtracted themselves.
    if (__APPLE__) {
      const work = view?.[isMasonView_] ? view._masonLayoutWork : 1;
      if (work) this._masonAddLayoutWork(-work);
    }
  }

  public addEventListener(arg: string, callback: any, thisArg?: any) {
    const listened = __APPLE__ && this._masonListensToLayout();
    this._addEventListener(arg, callback, thisArg);
    if (__APPLE__ && !listened && this._masonListensToLayout()) this._masonAddLayoutWork(1);
  }

  public removeEventListener(arg: string, callback: any, thisArg?: any) {
    const listened = __APPLE__ && this._masonListensToLayout();
    this._removeEventListener(arg, callback, thisArg);
    if (__APPLE__ && listened && !this._masonListensToLayout()) this._masonAddLayoutWork(-1);
  }

  private _addEventListener(arg: string, callback: any, thisArg?: any) {
    if (typeof thisArg === 'boolean') {
      thisArg = {
        capture: thisArg,
      };
    }
    if (typeof arg !== 'string') {
      super.addEventListener(arg, callback, thisArg);
      return;
    }

    const nativeEventName = masonNativeEventName(arg);
    if (nativeEventName) {
      super.addEventListener(nativeEventName, callback, thisArg);
      this._registerNativeEvent(nativeEventName, callback, thisArg);
      return;
    }

    super.addEventListener(arg, callback, thisArg);
  }

  private _removeEventListener(arg: string, callback: any, thisArg?: any) {
    if (typeof thisArg === 'boolean') {
      thisArg = {
        capture: thisArg,
      };
    }

    if (typeof arg === 'string') {
      const nativeEventName = masonNativeEventName(arg);
      if (nativeEventName) {
        super.removeEventListener(nativeEventName, callback, thisArg);
        this._unregisterNativeEvent(nativeEventName, callback, thisArg);
        return;
      }
    }

    super.removeEventListener(arg, callback, thisArg);
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
    if (__WINDOWS__) {
      if (subscribe) {
        this.on('mouseEnter', onWindowsHoverEnter);
        this.on('mouseLeave', onWindowsHoverLeave);
      } else {
        this.off('mouseEnter', onWindowsHoverEnter);
        this.off('mouseLeave', onWindowsHoverLeave);
        (this as any)._removeVisualState('hover');
      }
    }
  }

  @PseudoClassHandler('highlighted', 'pressed', 'active')
  _handler(subscribe: boolean) {
    const styles = compile(this);
    //@ts-ignore
    this._applyPseudoClassStyles('active', this._view, styles);

    if (__WINDOWS__) {
      if (subscribe) {
        this.on('touch', onWindowsActiveTouch);
        this.on('mouseLeave', onWindowsActiveLeave);
      } else {
        this.off('touch', onWindowsActiveTouch);
        this.off('mouseLeave', onWindowsActiveLeave);
        clearWindowsActive(this);
      }
      this._windowsListenActive(subscribe);
      // A button dims while held only when it has no :active style of its own.
      // @ts-ignore
      const view = this._view;
      if (view?.IsButton) view.DimsWhenPressed = !subscribe;
    }
  }

  private _windowsActiveListener: any;
  private _windowsActiveId = 0;

  // Inline elements a Text draws get no pointer events of their own; the Text reports their presses.
  private _windowsListenActive(on: boolean) {
    const view = (this as any)._view;
    if (!view || typeof masonEngine().AddEventListener !== 'function') return;
    if (on && !this._windowsActiveId) {
      const ref = new WeakRef(this);
      this._windowsActiveListener = (globalThis as any).NSWinRT.asDelegate('NativeScript.Mason.EventListener', (event: any) => {
        const owner: any = ref.deref();
        if (!owner) return;
        if (event.Data === '1') {
          for (const state of WINDOWS_ACTIVE_STATES) owner._addVisualState(state);
        } else {
          clearWindowsActive(owner);
        }
      });
      this._windowsActiveId = masonEngine().AddEventListener(view, 'mason:active', this._windowsActiveListener);
    } else if (!on && this._windowsActiveId) {
      masonEngine().RemoveEventListener(view, 'mason:active', this._windowsActiveId);
      this._windowsActiveId = 0;
      this._windowsActiveListener = undefined;
    }
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
    if (__WINDOWS__) {
      if (subscribe) {
        this.on('focus', onWindowsFocus, this);
        this.on('blur', onWindowsBlur, this);
      } else {
        this.off('focus', onWindowsFocus, this);
        this.off('blur', onWindowsBlur, this);
        (this as any)._removeVisualState('focus');
      }
    }
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
    this._eachViewChild(callback as never);
  }

  // Live and allocation-free, like core's LayoutBase.eachChildView (walks run per view).
  private _eachViewChild(callback: (child: NSView) => unknown) {
    const children = this._children;
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i];
      if (child && !child[isPlaceholder_] && child instanceof NSView) {
        callback(child);
      }
    }
  }

  // Core's iOS requestLayout climbs to the Page and re-measures the whole tree in JS.
  // A Mason root's native compute already places every Mason descendant, so it skips
  // them and only runs core's layout for non-Mason views inside its subtree.

  /** True for a Mason view whose frame the Mason tree sets natively (iOS). */
  get _masonPlacedNatively(): boolean {
    return __APPLE__ && !!this[isMasonView_] && !!(this.parent as any)?.[isMasonView_];
  }

  /** Size a non-Mason child with core's measure: its native view rarely implements sizeThatFits. */
  _masonMeasureForeign(child: any): void {
    if (!__APPLE__ || child[isMasonView_] || !child.nativeViewProtected) return;
    const mason = (this.nativeViewProtected as any)?.mason;
    if (typeof mason?.setMeasureForViewBlock !== 'function') return;
    const parentRef = new WeakRef(this);
    const childRef = new WeakRef(child);
    const spec = (known: number, available: number) => {
      if (!isNaN(known)) return Utils.layout.makeMeasureSpec(known, Utils.layout.EXACTLY);
      if (available > 0) return Utils.layout.makeMeasureSpec(available, Utils.layout.AT_MOST);
      return Utils.layout.makeMeasureSpec(0, Utils.layout.UNSPECIFIED);
    };
    mason.setMeasureForViewBlock(child.nativeViewProtected, (knownW: number, knownH: number, availW: number, availH: number) => {
      const parent = parentRef.deref();
      const view = childRef.deref();
      if (!parent || !view) return CGSizeMake(0, 0);
      NSView.measureChild(parent as never, view, spec(knownW, availW), spec(knownH, availH));
      return CGSizeMake(view.getMeasuredWidth(), view.getMeasuredHeight());
    });
  }

  /**
   * Sets a non-Mason child's percentage width/height (`null` clears it), resolved against the
   * containing block. Windows core calls this for every percentage; on Android and iOS a view calls
   * it when its native sizing can't express one. `false` when core should handle it.
   */
  _setChildPercentSize(child: any, horizontal: boolean, fraction: number | null): boolean {
    const nativeChild = child?.nativeViewProtected;
    if (!nativeChild || child[isMasonView_]) return false;
    const value = fraction ?? NaN;
    if (__WINDOWS__) {
      if (horizontal) masonEngine().SetPercentWidth(nativeChild, value);
      else masonEngine().SetPercentHeight(nativeChild, value);
    } else if (__ANDROID__) {
      const mason = org.nativescript.mason.masonkit.Mason.getShared();
      if (horizontal) mason.setPercentWidth(nativeChild, value);
      else mason.setPercentHeight(nativeChild, value);
    } else if (__APPLE__) {
      if (horizontal) NSCMason.shared.setPercentWidth(nativeChild, value);
      else NSCMason.shared.setPercentHeight(nativeChild, value);
    } else {
      return false;
    }
    return true;
  }

  /**
   * A native removal relays out natively but runs no core layout pass, so `layoutChanged`
   * and non-Mason descendants miss it. Ask for one; a subtree being torn down is unloaded.
   */
  _masonRequestLayoutAfterRemoval(): void {
    if (__APPLE__ && this.isLoaded) this.requestLayout();
  }

  /** Lay out the non-Mason views in this root's subtree from the frames Mason set. */
  _masonLayoutForeignDescendants(): void {
    if (!__APPLE__) return;
    const visit = (view: any) => {
      view.eachChildView((child: any) => {
        if (child[isMasonView_]) {
          if (!(child._masonLayoutWork > 0)) return true;
          // Keep `layoutChanged` working for the few views that listen to it.
          if (child.hasListeners?.(NSView.layoutChangedEvent)) {
            const b = child._getCurrentLayoutBounds();
            if (child._setCurrentLayoutBounds(b.left, b.top, b.right, b.bottom).boundsChanged) {
              child._raiseLayoutChangedEvent();
            }
          }
          visit(child);
        } else if (child.nativeViewProtected) {
          const b = child._getCurrentLayoutBounds();
          const w = Utils.layout.makeMeasureSpec(b.right - b.left, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(b.bottom - b.top, Utils.layout.EXACTLY);
          NSView.measureChild(view, child, w, h);
          child.layout(b.left, b.top, b.right, b.bottom);
        }
        return true;
      });
    };
    visit(this);
  }

  private _masonClimbRoot: any;
  private _masonClimbTurn: Set<any> | null = null;

  requestLayout(): void {
    // A natively placed view only needs its Mason root re-measured: skip the
    // per-ancestor hops (each a JS call plus a native setNeedsLayout).
    if (this._masonPlacedNatively) {
      // CSS asks once per layout property; reuse this turn's root while it is still flagged.
      if (climbedRoots && this._masonClimbTurn === climbedRoots && climbedThisTurn(this._masonClimbRoot)) return;
      let root: any = this.parent;
      while (root?.parent?.[isMasonView_]) root = root.parent;
      if (root && !climbedThisTurn(root)) root.requestLayout();
      this._masonClimbRoot = root;
      this._masonClimbTurn = climbedRoots;
      return;
    }
    // Core climbs on every call, once per changed property; once per turn is enough.
    if (__APPLE__ && climbedThisTurn(this)) return;
    super.requestLayout();
    if (__APPLE__) markClimbed(this);
  }

  _parentChanged(oldParent: any): void {
    climbedRoots?.delete(this);
    this._masonClimbTurn = null;
    super._parentChanged(oldParent);
  }

  getMeasuredWidth(): number {
    if (this._masonPlacedNatively && this.nativeViewProtected) {
      return Math.round(Utils.layout.toDevicePixels(this.nativeViewProtected.frame.size.width));
    }
    return super.getMeasuredWidth();
  }

  getMeasuredHeight(): number {
    if (this._masonPlacedNatively && this.nativeViewProtected) {
      return Math.round(Utils.layout.toDevicePixels(this.nativeViewProtected.frame.size.height));
    }
    return super.getMeasuredHeight();
  }

  public eachChildView(callback: (child: NSView) => boolean): void {
    this._eachViewChild(callback);
  }

  _addChildFromBuilder(name: string, value: any): void {
    this.addChild(value);
  }

  getChildrenCount() {
    let count = 0;
    this._eachViewChild(() => count++);
    return count;
  }

  get _childrenCount() {
    return this.getChildrenCount();
  }

  getChildAt(index: number) {
    let found: NSView;
    let i = 0;
    this._eachViewChild((child) => {
      if (i++ === index) found = child;
    });
    return found;
  }

  getChildIndex(child: NSView) {
    let index = -1;
    let i = 0;
    this._eachViewChild((c) => {
      if (c === child && index === -1) index = i;
      i++;
    });
    return index;
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

      if (__WINDOWS__) {
        this._windowsAttachPlaceholder(child, -1);
      }
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
    let group;
    const max = Math.min(atIndex, this._children.length);
    for (let i = 0; i < max; i++) {
      const c: any = this._children[i];
      if (!c) {
        continue;
      }
      const anonymous = c[anonymousText_];
      if (anonymous) {
        if (anonymous !== group) index++;
        group = anonymous;
        continue;
      }
      if (c[textNode_] || c instanceof TextNode || text_ in c || (c[isPlaceholder_] && c[native_]) || c._isMasonChild) {
        index++;
        group = undefined;
      }
    }
    return index;
  }

  private _attachCursor: { child: any; jsIndex: number; nativeIndex: number } | undefined;

  _nativeAttachIndex(child: any, atIndex: number): { jsIndex: number; nativeIndex: number } {
    const cur = this._attachCursor;
    let jsIndex: number;
    let nativeIndex: number;
    if (atIndex <= -1 && cur && this._children[cur.jsIndex] === cur.child && this._children[cur.jsIndex + 1] === child) {
      jsIndex = cur.jsIndex + 1;
      nativeIndex = cur.nativeIndex + 1;
    } else {
      jsIndex = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeIndex = jsIndex <= -1 ? jsIndex : this._nativeIndexFor(jsIndex);
    }
    this._attachCursor = jsIndex >= 0 && nativeIndex >= 0 ? { child, jsIndex, nativeIndex } : undefined;
    return { jsIndex, nativeIndex };
  }

  _invalidateAttachCursor() {
    this._attachCursor = undefined;
  }

  // Windows attaches element children on load with no index, after text runs that attached
  // straight away, so an append would land them after text that comes later.
  _windowsNativeIndexOf(child: any, atIndex: number): number {
    if (atIndex >= 0) return atIndex;
    const slot = this._children.indexOf(child);
    return slot >= 0 ? this._nativeIndexFor(slot) : atIndex;
  }

  _childIndexToNativeChildIndex(index?: number): number {
    if (__WINDOWS__ && typeof index === 'number' && index >= 0) {
      return this._nativeIndexFor(index);
    }
    return super._childIndexToNativeChildIndex(index);
  }

  insertChild(child: any, atIndex: number) {
    this._invalidateAttachCursor();
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

      if (__WINDOWS__) {
        this._windowsAttachPlaceholder(child, nativeIndex);
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
    this._invalidateAttachCursor();
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

      if (__WINDOWS__) {
        this._windowsAttachPlaceholder(child, atIndex);
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
    this._invalidateAttachCursor();
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
        if (__WINDOWS__) {
          this._windowsDetachPlaceholder(child);
          this._windowsMergeAt(index);
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
        (this as any).requestLayout?.();
        return;
      }
    }

    const index = this._children.indexOf(child);
    if (index > -1) {
      this._children.splice(index, 1);
      this._removeView(child);
      if (__WINDOWS__) {
        this._windowsMergeAt(index);
      }
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
      else this._windowsRemoveMember(this._children[index]);
    }
  }

  // Windows text lays out TextNode runs, not child panels, so a placeholder inside one, or inside a
  // block's inline run, becomes a break run; any other parent hosts its native panel.
  private _windowsAttachPlaceholder(child: any, index: number) {
    const view = (this as any)._view;
    if (!view) return;
    if (this._windowsHostsRuns()) {
      view.SetRun(windowsBreakRun(child), index);
    } else if (!this._windowsAttach(child)) {
      const slot = this._children.indexOf(child);
      masonEngine().ReparentChild(view, child._view, slot > -1 ? this._nativeIndexFor(slot) : index);
    }
  }

  private _windowsDetachPlaceholder(child: any) {
    const view = (this as any)._view;
    if (!view) return;
    if (child[anonymousText_]) {
      this._windowsRemoveMember(child);
    } else if (child[breakRun_] && typeof view.RemoveRun === 'function') {
      view.RemoveRun(child[breakRun_]);
    } else {
      masonEngine().RemoveChild(view, child._view);
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
    if (__WINDOWS__) {
      this._forEachAnonymousText((anonymous) => masonEngine().RemoveChild((this as any)._view, anonymous));
      for (const c of this._children as any[]) {
        if (!c) continue;
        c[anonymousText_] = undefined;
        c[runMember_] = undefined;
      }
    }
    this._children.splice(0);
    this._invalidateAttachCursor();
  }

  [zIndexProperty.setNative](value: number) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.zIndex = value;
    }
  }

  [directionProperty.setNative](value: CoreTypes.LayoutDirectionType) {
    // @ts-ignore
    super[directionProperty.setNative]?.(value);
    const style = (this as any)._styleHelper;
    if (style) style.direction = value === 'rtl' || value === 'ltr' ? value : 'inherit';
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
    // Frameworks may hand over raw values (Svelte's `{n}` makes a text node from a number).
    text = text == null ? '' : String(text);
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
      if (this._windowsHostsRuns()) view.SetRun(textNode, index);
      else masonEngine().ReparentChild(view, textNode, index);
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
      if (this._windowsHostsRuns()) view.SetRun(textNode, index);
      else masonEngine().ReparentChild(view, textNode, index);
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
    this._invalidateAttachCursor();
    const text = String(node.text ?? node.data ?? '');
    const textNode = this._createOrUpdateNativeTextNode(node, text);

    if (!operation) return;

    // Native runs start as text; an in-place update keeps the run's kind.
    if (__WINDOWS__ && textNode && !!operation.isBreak !== !!textNode.__masonBreak) {
      textNode.SetBreak(!!operation.isBreak);
      textNode.__masonBreak = !!operation.isBreak;
    }

    const entry = { [text_]: text, [textNode_]: textNode, [textNodeIndex_]: operation.index ?? this._children.length };

    const anonymous = this._windowsNeedsAnonymousText();

    switch (operation.type) {
      case 'add':
        if (anonymous) {
          //@ts-ignore
          this._children.push({ ...entry, [textNodeIndex_]: this._children.length });
          this._windowsInsertMember(this._children.length - 1, this._windowsRunsInline());
          break;
        }
        this._nativeAddChild(textNode, this._children.length);
        //@ts-ignore
        this._children.push({ ...entry, [textNodeIndex_]: this._children.length });
        break;
      case 'replace':
        if (anonymous) {
          this._windowsReplaceRun(operation.index, entry);
          break;
        }
        if (!__WINDOWS__ || (this._children[operation.index] as any)?.[textNode_] !== textNode) this._nativeReplaceChild(textNode, operation.index);
        this._setOrPushChild(operation.index, entry);
        break;
      case 'insert': {
        // `operation.index` is a `_children` slot; the native child list can
        // lag behind it (elements attach lazily on `loaded`), so map it the
        // same way `insertChild` does or the run lands past the end.
        const index = Math.max(0, Math.min(operation.index ?? this._children.length, this._children.length));
        if (anonymous) {
          this._spliceOrPushChild(index, entry);
          this._windowsInsertMember(index, this._windowsRunsInline());
          break;
        }
        this._nativeAddChild(textNode, this._nativeIndexFor(index));
        this._spliceOrPushChild(index, entry);
        break;
      }
    }
  }

  // Only Text lays out runs on Windows, so any other container puts consecutive runs in one
  // anonymous Text, as Android's getOrCreateAnonymousTextContainer does.
  private _windowsNeedsAnonymousText(): boolean {
    if (!__WINDOWS__) return false;
    let needs = (this as any)[needsAnonymousText_];
    if (needs === undefined) {
      const view = (this as any)._view;
      if (!view) return false;
      needs = (this as any)[needsAnonymousText_] = !this._windowsHostsRuns() && !!view.Children;
    }
    return needs;
  }

  // Each WinRT member lookup crosses into the runtime, and this is asked on every text change.
  private _windowsHostsRuns(): boolean {
    let hosts = (this as any)[hostsRuns_];
    if (hosts === undefined) {
      const view = (this as any)._view;
      if (!view) return false;
      hosts = (this as any)[hostsRuns_] = typeof view.SetRun === 'function';
    }
    return hosts;
  }

  // A block container's consecutive inline-level children share one anonymous Text, CSS's anonymous
  // block box; a flex or grid container groups only consecutive text.
  _windowsRunsInline(): boolean {
    if ((this as any)[runsSettled_] !== true) return false;
    const display = (this as any)._styleHelper?.display;
    return display === 'block' || display === 'inline-block';
  }

  // A container's display arrives with its CSS, after its children attach, so runs are grouped once the turn ends.
  private _windowsScheduleSettle() {
    if ((this as any)[runsSettled_] !== undefined) return;
    (this as any)[runsSettled_] = false;
    queueMicrotask(() => this._windowsSettleRuns());
  }

  _windowsSettleRuns() {
    (this as any)[runsSettled_] = true;
    const inline = this._windowsRunsInline();
    const children = this._children as any[];
    for (const c of children) if (c?._isMasonChild) this._windowsBlockify(c, inline);
    const regroup = children.some((c, i) => c && !c[textNode_] && (c[anonymousText_] || c[runMember_] === 'solo' || ((c._isMasonChild || c[isPlaceholder_]) && this._windowsJoinsAt(i, inline))));
    if (regroup) this._windowsReflow(0, true);
    (this as any)[runsInline_] = inline;
  }

  // Undefined for display: none, which stays in an open run.
  private _windowsJoins(c: any, inline: boolean): boolean | undefined {
    if (!c) return false;
    if (c[textNode_]) return true;
    if (!inline) return false;
    if (c[isPlaceholder_]) return true;
    if (!c[isMasonView_]) return false;
    const style = c._styleHelper;
    if (!style) return false;
    const display = style.display;
    if (display === 'none') return undefined;
    if (display !== 'inline' && display !== 'inline-block' && display !== 'inline-flex' && display !== 'inline-grid') return false;
    const position = style.position;
    if (position === 'absolute' || position === 'fixed') return false;
    return style.float === 'none';
  }

  private _windowsJoinsAt(slot: number, inline: boolean): boolean {
    const joins = this._windowsJoins((this._children as any[])[slot], inline);
    return joins === undefined ? slot > 0 && this._windowsJoinsAt(slot - 1, inline) : joins;
  }

  // The anonymous Text or lone element holding the run on each side of `slot`, and whether either is lone.
  private _windowsRunsAround(slot: number, inline: boolean): [any, any, boolean] {
    const children = this._children as any[];
    let left: any;
    let right: any;
    let solo = false;
    for (let i = slot - 1; i >= 0; i--) {
      const c = children[i];
      left = c?.[anonymousText_] ?? (c?.[runMember_] === 'solo' ? c : undefined);
      if (left) {
        solo = left === c && !c[anonymousText_];
        break;
      }
      if (!this._windowsJoinsAt(i, inline)) break;
    }
    for (let i = slot + 1; i < children.length; i++) {
      const c = children[i];
      right = c?.[anonymousText_] ?? (c?.[runMember_] === 'solo' ? c : undefined);
      if (right) {
        solo = solo || (right === c && !c[anonymousText_]);
        break;
      }
      if (!this._windowsJoinsAt(i, inline)) break;
    }
    return [left, right, solo];
  }

  _windowsAttach(child: any): boolean {
    if (!__WINDOWS__ || !this._windowsNeedsAnonymousText()) return false;
    const slot = this._children.indexOf(child);
    if (slot < 0) return false;
    const settled = (this as any)[runsSettled_] === true;
    if (!settled) this._windowsScheduleSettle();
    const inline = this._windowsRunsInline();
    if (settled) this._windowsBlockify(child, inline);
    if (this._windowsJoinsAt(slot, inline)) {
      this._windowsInsertMember(slot, inline, child);
      if (!child[anonymousText_]) return false;
      child._isMasonChild = true;
      return true;
    }
    const [left, right] = this._windowsRunsAround(slot, inline);
    if (left && left === right) this._windowsReflow(slot);
    return false;
  }

  // A run of one element needs no anonymous Text: the element is laid out as it is.
  private _windowsInsertMember(slot: number, inline: boolean, attaching?: any) {
    this._windowsScheduleSettle();
    const children = this._children as any[];
    const c = children[slot];
    const [left, right, solo] = this._windowsRunsAround(slot, inline);
    if (solo || (left && right && left !== right)) {
      this._windowsReflow(slot, false, attaching);
      return;
    }
    let anonymous = left ?? right;
    if (!anonymous) {
      if (c[isMasonView_] && !c[isPlaceholder_]) {
        c[runMember_] = 'solo';
        return;
      }
      anonymous = this._windowsCreateAnonymousText();
      this._windowsPlaceAnonymous(anonymous, slot);
    }
    const index = right ? this._windowsMemberIndex(slot, anonymous, inline) : (windowsRunCounts.get(anonymous) ?? 0);
    this._windowsAddMember(anonymous, c, index);
  }

  private _windowsMemberIndex(slot: number, anonymous: any, inline: boolean): number {
    const children = this._children as any[];
    let index = 0;
    for (let i = slot - 1; i >= 0; i--) {
      const owner = children[i]?.[anonymousText_];
      if (owner === anonymous) index++;
      else if (owner || !this._windowsJoinsAt(i, inline)) break;
    }
    return index;
  }

  private _windowsAddMember(anonymous: any, c: any, index: number) {
    const kind = windowsMemberKind(c);
    switch (kind) {
      case 'run':
        anonymous.SetRun(c[textNode_], index);
        break;
      case 'break':
        anonymous.SetRun(windowsBreakRun(c), index);
        break;
      case 'text':
        if (c._isMasonChild) masonEngine().RemoveChild((this as any)._view, c._view);
        anonymous.SetInlineText(c._view, index);
        break;
      default:
        if (c._isMasonChild) masonEngine().RemoveChild((this as any)._view, windowsNativeOf(c));
        anonymous.SetInlineBox(windowsNativeOf(c), index);
        break;
    }
    c[anonymousText_] = anonymous;
    c[runMember_] = kind;
    windowsRunCounts.set(anonymous, (windowsRunCounts.get(anonymous) ?? 0) + 1);
  }

  _windowsRemoveMember(c: any) {
    const anonymous = c?.[anonymousText_];
    if (!anonymous) return;
    switch (c[runMember_]) {
      case 'run':
        anonymous.RemoveRun(c[textNode_]);
        break;
      case 'break':
        anonymous.RemoveRun(c[breakRun_]);
        break;
      case 'text':
        anonymous.RemoveInlineText(c._view);
        break;
      default:
        anonymous.RemoveInlineBox(windowsNativeOf(c));
        break;
    }
    c[anonymousText_] = undefined;
    c[runMember_] = undefined;
    const count = (windowsRunCounts.get(anonymous) ?? 1) - 1;
    windowsRunCounts.set(anonymous, count);
    if (count <= 0) masonEngine().RemoveChild((this as any)._view, anonymous);
  }

  private _windowsReplaceRun(slot: number, entry: any) {
    const old = (this._children as any[])[slot];
    const anonymous = old?.[anonymousText_];
    if (anonymous && old[runMember_] === 'run') {
      if (old[textNode_] !== entry[textNode_]) {
        const index = this._windowsMemberIndex(slot, anonymous, this._windowsRunsInline());
        anonymous.RemoveRun(old[textNode_]);
        anonymous.SetRun(entry[textNode_], index);
      }
      entry[anonymousText_] = anonymous;
      entry[runMember_] = 'run';
      this._setOrPushChild(slot, entry);
      return;
    }
    if (old) this._windowsRemoveMember(old);
    this._setOrPushChild(slot, entry);
    this._windowsInsertMember(Math.min(slot, this._children.length - 1), this._windowsRunsInline());
  }

  private _windowsCreateAnonymousText(): NativeScript.Mason.Text {
    const anonymous = new NativeScript.Mason.Text();
    anonymous.IsAnonymous = true;
    // @ts-ignore
    this._styleHelper?.copyTextStyleTo(anonymous, -1, -1, -1, -1, true);
    const font = (this as any)[windowsFontSource_];
    if (font) anonymous.SetFontFamily(font);
    return anonymous;
  }

  private _windowsPlaceAnonymous(anonymous: any, slot: number) {
    masonEngine().ReparentChild((this as any)._view, anonymous, this._nativeIndexFor(slot));
  }

  // `attaching` counts as attached; the caller adds it to the panel if it stays a direct child.
  private _windowsReflow(slot: number, all = false, attaching?: any) {
    const children = this._children as any[];
    const view = (this as any)._view;
    if (!view || children.length === 0) return;
    const inline = this._windowsRunsInline();
    let a = Math.max(0, Math.min(slot, children.length - 1));
    let b = a;
    if (all) {
      a = 0;
      b = children.length - 1;
      for (const c of children) if (c?._isMasonChild) this._windowsBlockify(c, inline);
    } else {
      const inRegion = (i: number) => !!children[i]?.[anonymousText_] || this._windowsJoinsAt(i, inline);
      while (a > 0 && inRegion(a - 1)) a--;
      while (b < children.length - 1 && inRegion(b + 1)) b++;
    }
    // Every member of an anonymous Text being regrouped is regrouped with it.
    const pool: any[] = [];
    for (let grew = true; grew; ) {
      grew = false;
      for (let i = a; i <= b; i++) {
        const anonymous = children[i]?.[anonymousText_];
        if (anonymous && pool.indexOf(anonymous) < 0) pool.push(anonymous);
      }
      for (let i = 0; i < children.length; i++) {
        if ((i < a || i > b) && pool.indexOf(children[i]?.[anonymousText_]) > -1) {
          a = Math.min(a, i);
          b = Math.max(b, i);
          grew = true;
        }
      }
    }
    const members = new Set<any>();
    for (let i = a; i <= b; i++) if (children[i]?.[anonymousText_]) members.add(children[i]);
    for (const anonymous of pool) {
      anonymous.ClearRuns();
      windowsRunCounts.set(anonymous, 0);
    }
    for (let i = a; i <= b; i++) {
      const c = children[i];
      if (!c) continue;
      c[anonymousText_] = undefined;
      c[runMember_] = undefined;
    }
    const isElement = (c: any) => !!c[isMasonView_] && !c[isPlaceholder_];
    const groups: number[][] = [];
    let run: number[] | null = null;
    for (let i = a; i <= b; i++) {
      const c = children[i];
      if (!c) continue;
      if (this._windowsJoinsAt(i, inline)) {
        if (isElement(c) && c !== attaching && !c._isMasonChild) continue;
        if (!run) groups.push((run = []));
        run.push(i);
      } else {
        run = null;
        groups.push([-1 - i]);
      }
    }
    for (const group of groups) {
      const first = group[0] < 0 ? -1 - group[0] : group[0];
      const c = children[first];
      if (group[0] < 0 || (group.length === 1 && isElement(c))) {
        if (group[0] >= 0) c[runMember_] = 'solo';
        if (c === attaching || !members.has(c)) continue;
        if (isElement(c) && c._isMasonChild) masonEngine().ReparentChild(view, windowsNativeOf(c), this._nativeIndexFor(first));
        else if (c[isPlaceholder_] && c._view) masonEngine().ReparentChild(view, c._view, this._nativeIndexFor(first));
        continue;
      }
      const anonymous = pool.shift() ?? this._windowsCreateAnonymousText();
      this._windowsPlaceAnonymous(anonymous, first);
      group.forEach((i, k) => this._windowsAddMember(anonymous, children[i], k));
    }
    for (const anonymous of pool) masonEngine().RemoveChild(view, anonymous);
    (this as any)[runsInline_] = inline;
  }

  private _windowsMergeAt(slot: number) {
    if (!this._windowsNeedsAnonymousText() || this._children.length === 0) return;
    const inline = this._windowsRunsInline();
    const [left] = this._windowsRunsAround(slot, inline);
    const [, right] = this._windowsRunsAround(slot - 1, inline);
    if (left && right && left !== right) this._windowsReflow(Math.max(0, slot - 1));
  }

  _windowsFlowTypeChanged() {
    if ((this as any)[runsSettled_] === true && this._windowsNeedsAnonymousText() && this._windowsRunsInline() !== (this as any)[runsInline_]) {
      this._windowsSettleRuns();
    }
    (this.parent as any)?._windowsChildFlowChanged?.(this);
  }

  _windowsChildFlowChanged(child: any) {
    if (!child?._isMasonChild) return;
    if (!this._windowsHostsRuns() && (this as any)[runsSettled_] !== true) return;
    if (this._windowsHostsRuns()) {
      if (child[runMember_] && child[runMember_] !== windowsMemberKind(child)) (this as any)._windowsRehost?.(child);
      return;
    }
    if (!this._windowsNeedsAnonymousText()) return;
    const inline = this._windowsRunsInline();
    if (child[blockified_] && child._styleHelper?.display !== 'block') child[blockified_] = false;
    this._windowsBlockify(child, inline);
    const member = child[runMember_];
    let joins = this._windowsJoins(child, inline);
    let slot = -1;
    if (joins === undefined) {
      slot = this._children.indexOf(child);
      joins = slot > 0 && this._windowsJoinsAt(slot - 1, inline);
    }
    if (member === 'solo') {
      if (!joins) child[runMember_] = undefined;
      return;
    }
    if (joins === !!member && (!member || member === windowsMemberKind(child))) return;
    if (slot < 0) slot = this._children.indexOf(child);
    if (slot > -1) this._windowsReflow(slot);
  }

  // CSS blockifies flex and grid items.
  private _windowsBlockify(child: any, inline: boolean) {
    if (!child?.[isText_] || child instanceof ButtonBase) return;
    const style = child._styleHelper;
    if (!style) return;
    if (!inline && !child[blockified_] && style.display === 'inline') {
      child[blockified_] = true;
      style.display = 'block';
    } else if (inline && child[blockified_]) {
      child[blockified_] = false;
      if (style.display === 'block') style.display = 'inline';
    }
  }

  _windowsDetachChild(child: any) {
    if (child?.[anonymousText_]) this._windowsRemoveMember(child);
    else removeNativeChild((this as any)._view, child);
    if (child) child[runMember_] = undefined;
  }

  private _forEachAnonymousText(fn: (anonymous: NativeScript.Mason.Text) => void) {
    let last;
    for (const c of this._children as any[]) {
      const anonymous = c?.[anonymousText_];
      if (anonymous && anonymous !== last) fn(anonymous);
      last = anonymous;
    }
  }

  _windowsSyncAnonymousText(d0: number, d1: number, d2: number, d3: number) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) this._forEachAnonymousText((anonymous) => style.copyTextStyleTo(anonymous, d0, d1, d2, d3));
  }

  [fontInternalProperty.setNative](value: any) {
    if (!__WINDOWS__) return;
    const source = windowsFontSource(value);
    (this as any)[windowsFontSource_] = source;
    this._forEachAnonymousText((anonymous) => anonymous.SetFontFamily(source));
  }

  // -- Text setter: framework adapter driven --

  [textProperty.setNative](value: string) {
    const adapter = frameworkRegistry.find(this);
    if (adapter) {
      const frameworkEl = frameworkRegistry.getElement(this);
      const nodes = frameworkEl ? adapter.getChildren(frameworkEl) : [];

      if (nodes.length === 0) {
        // DOM-shim frameworks with no framework-tracked child (e.g. a Label-like
        // element with plain `.text` set directly) need a stable synthetic node
        // to key the reuse cache on. Without it every write falls through to the
        // "always new" replace path and orphans native TextNodes.
        if (adapter.syntheticTextOnEmpty) {
          let node = (this as any)[emptyTextNode_];
          if (!node) {
            node = {};
            (this as any)[emptyTextNode_] = node;
          }
          node.text = value;
          this._updateTextNode(node, { type: this._children.length === 0 ? 'add' : 'replace', index: 0, isBreak: false });
        }
        return;
      }

      reconcileTextRuns(this as any, nodes, (n) => adapter.classify(n));
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
      (this as any)[borderRadiusCorners_] = undefined;
    }
  }

  [borderRadiusProperty.getDefault]() {
    // @ts-ignore
    return this._styleHelper?.borderRadius;
  }

  // `border-radius` / `border-color` arriving as core's longhands.

  private _nativeBorderRadiusCorners(): CornerRadius[] {
    // @ts-ignore
    const style = this._styleHelper as MasonStyle | undefined;
    if ((__ANDROID__ || __APPLE__) && style && !style.hasBorderRadius()) {
      return borderRadiusCorners('0');
    }
    const native = String(style?.borderRadius ?? '').trim();
    try {
      return borderRadiusCorners(native || '0');
    } catch {
      return borderRadiusCorners('0');
    }
  }

  private _borderRadiusCorner(corner: CornerIndex, value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (!style) {
      return;
    }
    let corners: CornerRadius[] = (this as any)[borderRadiusCorners_];
    if (!corners) {
      corners = (this as any)[borderRadiusCorners_] = this._nativeBorderRadiusCorners();
    }
    const css = lengthToCssString(masonLength(value));
    const radius = (corners[corner] = /\s/.test(css) ? parseCornerRadius(css) : [css, css]);
    const shorthand = composeBorderRadius(corners);
    if ((__ANDROID__ || __APPLE__) && (style as MasonStyle)._writeCornerRadius(corner, radius, shorthand)) {
      return;
    }
    // @ts-ignore
    style.borderRadius = shorthand;
  }

  private _nativeCornerRadius(corner: CornerIndex): string {
    // @ts-ignore
    const style = this._styleHelper as MasonStyle | undefined;
    if ((__ANDROID__ || __APPLE__) && style && !style.hasBorderRadius()) {
      return '0';
    }
    const [h, v] = this._nativeBorderRadiusCorners()[corner];
    return h === v ? h : `${h} ${v}`;
  }

  [borderTopLeftRadiusProperty.getDefault]() {
    return this._nativeCornerRadius(0);
  }

  [borderTopRightRadiusProperty.getDefault]() {
    return this._nativeCornerRadius(1);
  }

  [borderBottomRightRadiusProperty.getDefault]() {
    return this._nativeCornerRadius(2);
  }

  [borderBottomLeftRadiusProperty.getDefault]() {
    return this._nativeCornerRadius(3);
  }

  [borderTopLeftRadiusProperty.setNative](value: CoreTypes.LengthType) {
    this._borderRadiusCorner(0, value);
  }

  [borderTopRightRadiusProperty.setNative](value: CoreTypes.LengthType) {
    this._borderRadiusCorner(1, value);
  }

  [borderBottomRightRadiusProperty.setNative](value: CoreTypes.LengthType) {
    this._borderRadiusCorner(2, value);
  }

  [borderBottomLeftRadiusProperty.setNative](value: CoreTypes.LengthType) {
    this._borderRadiusCorner(3, value);
  }

  private _borderSideColor(side: 't' | 'r' | 'b' | 'l', value: any) {
    if (__ANDROID__ || __APPLE__) {
      const s = (this as any)._styleHelper as MasonStyle | undefined;
      if (s) {
        s.setBorderSideColor(side === 't' ? 'top' : side === 'r' ? 'right' : side === 'b' ? 'bottom' : 'left', value);
        return;
      }
    }
    let sides = (this as any)[borderSideColors_];
    if (!sides) {
      sides = (this as any)[borderSideColors_] = { t: 'transparent', r: 'transparent', b: 'transparent', l: 'transparent' };
    }
    sides[side] = colorToCssString(value);
    const shorthand = `${sides.t} ${sides.r} ${sides.b} ${sides.l}`;
    if (__ANDROID__) {
      // @ts-ignore
      nodeHelper().setBorderColor(this.nativeView, shorthand);
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any)?.style?.setBorderColor(shorthand);
    } else if (__WINDOWS__) {
      // @ts-ignore
      this._styleHelper?.setBorderColor(shorthand);
    }
  }

  [borderTopColorProperty.setNative](value: any) {
    this._borderSideColor('t', value);
  }

  [borderRightColorProperty.setNative](value: any) {
    this._borderSideColor('r', value);
  }

  [borderBottomColorProperty.setNative](value: any) {
    this._borderSideColor('b', value);
  }

  [borderLeftColorProperty.setNative](value: any) {
    this._borderSideColor('l', value);
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
      style.borderLeftWidth = masonLength(value);
    }
  }

  [borderTopWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderTopWidth = masonLength(value);
    }
  }

  [borderRightWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderRightWidth = masonLength(value);
    }
  }

  [borderBottomWidthProperty.setNative](value: CoreTypes.LengthType) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      // @ts-ignore
      style.borderBottomWidth = masonLength(value);
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
      // The shorthand resets every longhand natively, but core tracks each as its own
      // property and won't reapply one it already holds. Put the explicit ones back.
      const cssStyle = this.style as any;
      for (const name of ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor', 'textDecorationThickness']) {
        const longhand = cssStyle[name];
        if (longhand !== undefined && longhand !== null && longhand !== '') {
          style[name] = longhand;
        }
      }
    }
  }

  // @ts-ignore
  [borderColorProperty.setNative](value: any) {
    if (__ANDROID__) {
      const s = (this as any)._styleHelper as MasonStyle | undefined;
      if (s) s.setBorderColor(String(value));
      // @ts-ignore
      else nodeHelper().setBorderColor(this.nativeView, String(value));
    } else if (__APPLE__) {
      const s = (this as any)._styleHelper as MasonStyle | undefined;
      if (s) s.setBorderColor(String(value));
      // @ts-ignore
      else (this.nativeView as any).style.setBorderColor(String(value));
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
      style.backgroundImage = backgroundImageToCssString(value);
    }
  }

  // @ts-ignore
  [listStyleTypeProperty.setNative](value: any) {
    if (__ANDROID__) {
      // @ts-ignore
      nodeHelper().setListStyleType(this.nativeView, String(value));
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any).style.applyListStyleType(String(value));
    } else if (__WINDOWS__) {
      const style = (this as any)._styleHelper;
      const type = String(value).trim().toLowerCase();
      if (style && (type === 'none' || type === 'disc' || type === 'circle' || type === 'square' || type === 'decimal')) style.listStyleType = type;
    }
  }

  // @ts-ignore
  [listStylePositionProperty.setNative](value: any) {
    if (__ANDROID__) {
      // @ts-ignore
      nodeHelper().setListStylePosition(this.nativeView, String(value));
    } else if (__APPLE__) {
      // @ts-ignore
      (this.nativeView as any).style.applyListStylePosition(String(value));
    } else if (__WINDOWS__) {
      const style = (this as any)._styleHelper;
      const position = String(value).trim().toLowerCase();
      if (style && (position === 'inside' || position === 'outside')) style.listStylePosition = position;
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

  // @ts-ignore core declares maxWidth as a field on View
  set maxWidth(value: LengthAuto | CoreTypes.PercentLengthType) {
    this.style.maxWidth = value as CoreTypes.PercentLengthType;
  }

  // @ts-ignore
  get maxWidth(): CoreTypes.PercentLengthType {
    return this.style.maxWidth;
  }

  // @ts-ignore core declares maxHeight as a field on View
  set maxHeight(value: LengthAuto | CoreTypes.PercentLengthType) {
    this.style.maxHeight = value as CoreTypes.PercentLengthType;
  }

  // @ts-ignore
  get maxHeight(): CoreTypes.PercentLengthType {
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

  [backgroundInternalProperty.getDefault](): any {
    if (__ANDROID__ || __APPLE__) return null;
    // @ts-ignore
    return super[backgroundInternalProperty.getDefault]?.();
  }

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
      style.marginLeft = masonLength(value);
    }
  }

  [marginRightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginRight = masonLength(value);
    }
  }

  [marginBottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginBottom = masonLength(value);
    }
  }

  [marginTopProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.marginTop = masonLength(value);
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
      style.paddingLeft = masonLength(value);
    }
  }

  [paddingRightProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingRight = masonLength(value);
    }
  }

  [paddingTopProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingTop = masonLength(value);
    }
  }

  [paddingBottomProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.paddingBottom = masonLength(value);
    }
  }

  set gap(value: Length) {
    this.style.gap = value as never;
  }

  get gap(): Length {
    return this.style.gap as Length;
  }

  set gridGap(value: Length) {
    this.style.gridGap = value;
  }

  get gridGap(): Length {
    return this.style.gridGap;
  }

  set rowGap(value: Length) {
    this.style.rowGap = value as never;
  }

  get rowGap(): Length {
    return this.style.rowGap as Length;
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
    this.style.columnGap = value as never;
  }

  get columnGap(): Length {
    return this.style.columnGap as Length;
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
    this.style.textOverflow = value;
  }

  get textOverFlow() {
    return this.style.textOverflow;
  }

  [textOverFlowProperty.setNative](value) {
    // @ts-ignore
    const style = this._styleHelper;
    if (style) {
      style.textOverflow = value;
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
        const nv: any = (this as any).nativeViewProtected ?? (this as any)._view;
        try {
          const shadows = parseBoxShadows(typeof value === 'string' ? value : '', (token) => cssLengthToDip(token, style.emBasis()));
          const current = (style as any).color >>> 0 || 0xff000000;
          const spec = encodeBoxShadows(shadows, (color) => {
            if (!color || color.toLowerCase() === 'currentcolor') return current;
            try {
              return new Color(color as never).argb >>> 0;
            } catch (_) {
              return current;
            }
          });
          NativeScript.Mason.Css.SetBoxShadow(nv, spec);
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
          const size = { width: nv?.ActualWidth ?? 0, height: nv?.ActualHeight ?? 0 };
          const m = parseCssTransform(typeof value === 'string' ? value : '', (token) => cssLengthToDip(token, style.emBasis()), size);
          if (!m) NativeScript.Mason.Css.ClearTransform(nv);
          else {
            NativeScript.Mason.Css.ApplyTransform(nv, m[0], m[1], m[2], m[3], m[4], m[5]);
            nv.RenderTransformOrigin = { X: (this as any).originX ?? 0.5, Y: (this as any).originY ?? 0.5 };
          }
        } catch (_) {}
      }
    }
  }
}

textProperty.register(ViewBase);

// Core's Windows Font resolves app/fonts files to an ms-appx URI (and generics to system fonts);
// the bare family name only finds installed fonts.
export function windowsFontSource(font: any): string {
  try {
    const source = font?.getWindowsFontDescriptor?.()?.fontFamilyNative?.Source;
    if (source) return String(source);
  } catch (_) {}
  return String((font && typeof font === 'object' ? font.fontFamily : '') ?? '');
}

export class TextBase extends ViewBase {
  textContent: string;

  [fontInternalProperty.setNative](value: any) {
    if (!__WINDOWS__) return;
    // @ts-ignore
    const view = (this as any)._view;
    if (!view || typeof view.SetFontFamily !== 'function') return;
    try {
      view.SetFontFamily(windowsFontSource(value));
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
  [eventType_]: string | undefined;

  get bubbles() {
    if (__ANDROID__) {
      return this[native_]?.getBubbles();
    }

    if (__APPLE__) {
      return this[native_]?.bubbles;
    }

    if (__WINDOWS__) {
      return this[native_]?.Bubbles ?? false;
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

    if (__WINDOWS__) {
      return this[native_]?.Cancelable ?? false;
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

    if (__WINDOWS__) {
      return this[native_]?.IsComposing ?? false;
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

    if (__WINDOWS__) {
      return this[native_]?.TimeStamp ?? 0;
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

    if (__WINDOWS__) {
      return this[native_]?.DefaultPrevented ?? false;
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

    if (__WINDOWS__) {
      return this[native_]?.PropagationStopped ?? false;
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

    if (__WINDOWS__) {
      return this[native_]?.ImmediatePropagationStopped ?? false;
    }

    return false;
  }

  get currentTarget() {
    // DOM semantics: the element the listener is attached to, not the raw
    // native view. `_target` is set to that same owner at every dispatch
    // site (_registerNativeEvent), so reuse it here.
    return this['_target'];
  }

  stopImmediatePropagation(): void {
    if (__ANDROID__) {
      return this[native_]?.stopImmediatePropagation();
    }

    if (__APPLE__) {
      return this[native_]?.stopImmediatePropagation();
    }

    if (__WINDOWS__) {
      return this[native_]?.StopImmediatePropagation();
    }
  }

  stopPropagation(): void {
    if (__ANDROID__) {
      return this[native_]?.stopPropagation();
    }

    if (__APPLE__) {
      return this[native_]?.stopPropagation();
    }

    if (__WINDOWS__) {
      return this[native_]?.StopPropagation();
    }
  }

  preventDefault(): void {
    if (__ANDROID__) {
      return this[native_]?.preventDefault();
    }

    if (__APPLE__) {
      return this[native_]?.preventDefault();
    }

    if (__WINDOWS__) {
      return this[native_]?.PreventDefault();
    }
  }

  // Writable on purpose, unlike the DOM's read-only `Event.type`. Aliases
  // (e.g. 'tap') are folded onto the native name ('click') before the event
  // reaches JS; a host framework's DOM shim relabels it back to the name the
  // listener was registered under and re-dispatches, which needs a working
  // setter or the relabel is silently dropped and the listener never fires.
  get type(): string {
    const override = this[eventType_];
    if (override !== undefined) {
      return override;
    }
    if (__ANDROID__) {
      return this[native_]?.getType();
    }
    if (__WINDOWS__) {
      return this[native_]?.Type;
    }
    return this[native_]?.type;
  }

  set type(value: string) {
    this[eventType_] = value;
  }

  // DOM MouseEvent.button: 0 = primary button. Mason's touch-originated
  // click has no native concept of mouse buttons, but callers checking
  // `e.button === 0` (e.g. a router's <Link> onClick guard) expect this.
  get button(): number {
    return 0;
  }

  set button(_: number) {}

  get target(): any {
    // The element the event started at, which differs from currentTarget once it bubbles.
    const nativeEvent = this[native_];
    const nativeTarget = __ANDROID__ ? nativeEvent?.getTarget?.() : __APPLE__ ? nativeEvent?.target : __WINDOWS__ ? nativeEvent?.Target : null;
    const current = this['_target'];
    if (nativeTarget && nativeTarget !== nativeViewFor(current)) {
      const found = nativeOwnerFor(nativeTarget) ?? findOwnerForNativeView(current, nativeTarget);
      if (found) return found;
    }
    return current;
  }

  set target(_: any) {}

  get object(): any {
    return this['_target'];
  }

  get eventName(): string {
    return this.type;
  }
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

    if (__WINDOWS__) {
      const files = this[native_]?.Files;
      if (files) {
        const ret = [];
        const size = files.Size;
        for (let i = 0; i < size; i++) {
          ret.push(files.GetAt(i));
        }
        return ret;
      }
      return this[native_]?.Data ?? null;
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

    if (__WINDOWS__) {
      return this[native_]?.InputType ?? '';
    }

    return false;
  }
}

export class CompositionEvent extends Event {
  get data(): string {
    return this[native_]?.Data ?? '';
  }
}

/** DOM KeyboardEvent: dispatched on Windows. */
export class KeyboardEvent extends Event {
  get key(): string {
    return this[native_]?.Key ?? '';
  }

  get repeat(): boolean {
    return this[native_]?.Repeat ?? false;
  }

  get ctrlKey(): boolean {
    return this[native_]?.CtrlKey ?? false;
  }

  get shiftKey(): boolean {
    return this[native_]?.ShiftKey ?? false;
  }

  get altKey(): boolean {
    return this[native_]?.AltKey ?? false;
  }

  get metaKey(): boolean {
    return this[native_]?.MetaKey ?? false;
  }
}

function wrapNativeEvent(type: string): Event {
  switch (type) {
    case 'beforeinput':
    case 'input':
      return new InputEvent();
    case 'keydown':
      return new KeyboardEvent();
    case 'compositionstart':
    case 'compositionupdate':
    case 'compositionend':
      return new CompositionEvent();
    default:
      return new Event();
  }
}
