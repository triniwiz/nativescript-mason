import { backgroundColorProperty, Color, colorProperty, Utils } from '@nativescript/core';
import { TextBase, ViewBase, style_, textProperty, MasonChild, textWrapProperty } from './common';
import { Style } from './style';

export class Tree {
  _base: org.nativescript.mason.masonkit.Mason;
  private static _tree: Tree;
  constructor() {
    this._base = org.nativescript.mason.masonkit.Mason.getShared();
  }

  static {
    this._tree = new Tree();
  }

  static get instance() {
    return Tree._tree;
  }

  get native() {
    return this._base;
  }

  createView(context) {
    return this.native.createView(context);
  }

  createTextView(context) {
    return this.native.createTextView(context);
  }
}

export class View extends ViewBase {
  [style_];
  private _view: org.nativescript.mason.masonkit.View;
  _hasNativeView = false;
  _inBatch = false;
  constructor() {
    super();
    const view = Tree.instance.createView(Utils.android.getCurrentActivity() || Utils.android.getApplicationContext()) as never;
    this._hasNativeView = true;
    this._view = view;
  }
  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.View;
  }

  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.View;

    child._masonParent = this;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      nativeView.addView(child.nativeViewProtected, (atIndex ?? -1) as never);
      return true;
    }

    return false;
  }

  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view._masonParent = undefined;
    view._isMasonView = false;
    view._isMasonChild = false;
    super._removeViewFromNativeVisualTree(view);
  }
}

const enum TextWrap {
  NoWrap = 0,

  Wrap = 1,

  Balance = 2,
}

export class Text extends TextBase {
  [style_];
  _hasNativeView = false;
  _inBatch = false;
  private _view: org.nativescript.mason.masonkit.TextView;
  constructor() {
    super();
    const view = Tree.instance.createTextView(Utils.android.getCurrentActivity() || Utils.android.getApplicationContext()) as org.nativescript.mason.masonkit.TextView;
    this._view = view;
    this._hasNativeView = true;
    this[style_] = Style.fromView(this as never, view, true);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view;
  }

  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  [textProperty.setNative](value) {
    const nativeView = this._view as org.nativescript.mason.masonkit.TextView;
    if (nativeView) {
      nativeView.updateText(value);
    }
  }

  [colorProperty.setNative](value) {
    if (value instanceof Color) {
      this[style_].color = value.android;
    }
  }

  [backgroundColorProperty.setNative](value) {
    if (typeof value === 'number') {
      this[style_].backgroundColor = value;
    } else if (value instanceof Color) {
      this[style_].backgroundColor = value.android;
    }
  }

  [textWrapProperty.setNative](value) {
    switch (value) {
      case 'false':
      case 'nowrap':
        this[style_].textWrap = TextWrap.NoWrap;
        break;
      case 'true':
      case 'wrap':
        this[style_].textWrap = TextWrap.Wrap;
        break;
      case 'balance':
        this[style_].textWrap = TextWrap.Balance;
        break;
    }
  }

  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.TextView;

    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      nativeView.addView(child.nativeViewProtected, atIndex ?? -1);
      return true;
    }

    return false;
  }
}
