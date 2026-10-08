import { CSSType, GestureTypes } from '@nativescript/core';
import { ButtonBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isText_, isMasonView_, native_ } from '../symbols';
import { removeNativeChild } from '../windows-panel-helpers';

@CSSType('Button')
export class Button extends ButtonBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isText_] = true;
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.Text {
    if (!this[native_]) {
      this[native_] = Tree.instance.createButtonView() as never;
    }
    return this[native_] as never as NativeScript.Mason.Text;
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
    return this._view;
  }

  private _invoked: unknown;

  initNativeView() {
    super.initNativeView();
    const ref = new WeakRef(this);
    this._invoked = NSWinRT.asDelegate('Microsoft.UI.Xaml.RoutedEventHandler', () => ref.deref()?._dispatchTap());
    // @ts-ignore
    this._view.Invoked = this._invoked;
  }

  disposeNativeView() {
    if (this._invoked) {
      // @ts-ignore
      this._view.Invoked = null;
      this._invoked = null;
    }
    super.disposeNativeView();
  }

  // Enter, Space and a screen reader's Invoke reach tap listeners as a pointer tap does.
  private _dispatchTap() {
    const args = {
      type: GestureTypes.tap,
      view: this,
      ios: undefined,
      android: undefined,
      object: this,
      eventName: 'tap',
      getPointerCount: () => 1,
      getX: () => 0,
      getY: () => 0,
    };
    for (const observer of this.getGestureObservers(GestureTypes.tap) ?? []) {
      observer.callback?.call(observer.context, args);
    }
  }

  // Like Text, nested text elements render inside the label's runs.
  // @ts-ignore
  public _addViewToNativeVisualTree(child: any, atIndex = -1): boolean {
    if (child?.[isText_] && child._view && !child._view.IsButton) {
      this._view.SetInlineText(child._view, this._windowsNativeIndexOf(child, atIndex));
      child._isMasonChild = true;
      return true;
    }
    return super._addViewToNativeVisualTree(child, atIndex);
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(child: any): void {
    if (child?.[isText_] && child._view && !child._view.IsButton) {
      this._view.RemoveInlineText(child._view);
      child._isMasonChild = false;
    } else {
      removeNativeChild(this._view, child);
    }
    super._removeViewFromNativeVisualTree(child);
  }

  [textContentProperty.setNative](value) {
    const nativeView = this._view;
    if (nativeView) {
      nativeView.Content = value ?? '';
    }
  }
}
