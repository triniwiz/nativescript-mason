import { CSSType } from '@nativescript/core';
import { ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { isMasonView_, native_, style_ } from '../symbols';
import { appendNativeChild, removeNativeChild } from '../windows-panel-helpers';

declare const Microsoft: any;

@CSSType('Scroll')
export class Scroll extends ViewBase {
  [style_];
  //@ts-ignore
  private _scroller: Microsoft.UI.Xaml.Controls.ScrollViewer;

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
    super._addViewToNativeVisualTree(child, atIndex);
    return appendNativeChild(this._view, child, atIndex);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    child._isMasonChild = false;
    removeNativeChild(this._view, child);
    // @ts-ignore
    super._removeViewFromNativeVisualTree(child);
  }
}
