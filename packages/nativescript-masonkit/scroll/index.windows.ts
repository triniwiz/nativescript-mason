import { ScrollBase } from './common';
export type { ScrollEventData } from './common';
import { CSSType } from '@nativescript/core';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild } from '../windows-panel-helpers';

declare const Microsoft: any;

@CSSType('Scroll')
export class Scroll extends ScrollBase {
  [style_];
  //@ts-ignore
  private _scroller: Microsoft.UI.Xaml.Controls.ScrollViewer;

  private _scrollTokens?: [number, number];
  private _scrollDelegates?: [unknown, unknown];
  private _pendingOffset?: [number, number, boolean];

  protected _scrollMetrics(): [number, number, number, number] {
    const view = this._scroller;
    return view ? [view.HorizontalOffset, view.VerticalOffset, view.ScrollableWidth, view.ScrollableHeight] : [0, 0, 0, 0];
  }

  protected _seek(x: number, y: number, animated: boolean): void {
    const view = this._scroller;
    if (!view) return;
    this._stopScrolling();
    if (view.ActualWidth <= 0 || view.ActualHeight <= 0) {
      this._pendingOffset = [x, y, animated];
      return;
    }
    view.ChangeView(Math.max(0, Math.min(x, view.ScrollableWidth)), Math.max(0, Math.min(y, view.ScrollableHeight)), null, !animated);
  }

  protected _stopScrolling(): void {
    this._pendingOffset = undefined;
    const view = this._scroller;
    if (view) view.ChangeView(view.HorizontalOffset, view.VerticalOffset, null, true);
  }

  protected _observeScroll(observe: boolean): void {
    const view = this._scroller;
    if (!view) return;
    const engine = NativeScript.Mason.Mason.Instance();
    if (this._scrollTokens) {
      engine.RemoveScrollListener(view, this._scrollTokens[0], false);
      engine.RemoveScrollListener(view, this._scrollTokens[1], true);
      this._scrollTokens = undefined;
      this._scrollDelegates = undefined;
    }
    if (!observe) return;
    const ref = new WeakRef(this);
    // Subscribe to WinUI events in native code: generic XAML event delegates do not
    // reliably cross the Windows JS bridge. These use a projected Mason delegate.
    const changed = NSWinRT.asDelegate('NativeScript.Mason.ScrollListener', () => ref.deref()?._notifyScroll());
    const layout = NSWinRT.asDelegate('NativeScript.Mason.ScrollListener', () => {
      const owner = ref.deref();
      const pending = owner?._pendingOffset;
      if (pending && view.ActualWidth > 0 && view.ActualHeight > 0) owner._seek(...pending);
    });
    this._scrollDelegates = [changed, layout];
    this._scrollTokens = [engine.AddScrollListener(view, changed, false), engine.AddScrollListener(view, layout, true)];
  }

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  /** `<scroll>` treats default `visible` Y overflow as `auto`; HTML block elements opt out. */
  get _visibleOverflowScrolls(): boolean {
    return true;
  }

  get _view(): NativeScript.Mason.View {
    if (!this[native_]) {
      this[native_] = Tree.instance.createScrollView() as never;
    }
    return this[native_] as never as NativeScript.Mason.View;
  }

  // @ts-ignore
  get windows() {
    return this._view;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    // Plain block elements (div/section/etc.) keep default `visible` overflow neither
    // scrolling nor clipping, like a browser: skip the ScrollViewer (which always clips
    // its viewport) and hand back the Mason content view directly.
    if (!this._visibleOverflowScrolls) {
      return this._view as any;
    }
    // ScrollViewer is the element in the parent's visual tree; the Mason content view is its Content.
    this._scroller = new Microsoft.UI.Xaml.Controls.ScrollViewer();
    // Vertical scroll only (matches the common `overflowY: 'scroll'`). Horizontal scrolling would
    // hand the content an INFINITE available width, collapsing `1fr`/flex/percent widths to 0 (blank
    // render). Disabling it constrains the content to the viewport width so Mason can resolve widths.
    this._scroller.HorizontalScrollMode = Microsoft.UI.Xaml.Controls.ScrollMode.Disabled;
    this._scroller.HorizontalScrollBarVisibility = Microsoft.UI.Xaml.Controls.ScrollBarVisibility.Disabled;
    this._scroller.VerticalScrollMode = Microsoft.UI.Xaml.Controls.ScrollMode.Auto;
    this._scroller.VerticalScrollBarVisibility = Microsoft.UI.Xaml.Controls.ScrollBarVisibility.Auto;
    // Stretch the Mason content view to the full viewport width (default is Left = sized-to-content).
    this._scroller.HorizontalContentAlignment = Microsoft.UI.Xaml.HorizontalAlignment.Stretch;
    this._scroller.Content = this._view as any;
    return this._scroller as any;
  }

  // Children go into the inner Mason content view, not the ScrollViewer.
  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    if (this._windowsAttach(child)) return true;
    const index = this._windowsNativeIndexOf(child, atIndex);
    super._addViewToNativeVisualTree(child, index);
    return appendNativeChild(this._view, child, index);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    this._windowsDetachChild(child);
    child._isMasonChild = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}
