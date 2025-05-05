import { backgroundColorProperty, Color, colorProperty, Utils } from '@nativescript/core';
import { TextBase, ViewBase, style_, textProperty, MasonChild, textWrapProperty } from './common';
import { Style } from './style';

const enum TextType {
  None = 0,

  P = 1,

  Span = 2,

  Code = 3,

  H1 = 4,

  H2 = 5,

  H3 = 6,

  H4 = 7,

  H5 = 8,

  H6 = 9,

  Li = 10,

  Blockquote = 11,

  B = 12,
}

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

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.View;

    // @ts-ignore
    child._masonParent = this;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      nativeView.addView(child.nativeViewProtected, (atIndex ?? -1) as never);
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view._masonParent = undefined;
    view._isMasonView = false;
    view._isMasonChild = false;
    // @ts-ignore
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
  constructor(type: TextType = 0) {
    super();
    const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
    switch (type) {
      case TextType.None:
        this._view = Tree.instance.createTextView(context);
        break;
      case TextType.P:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.P);
        break;
      case TextType.Span:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.Span);
        break;
      case TextType.Code:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.Code);
        break;
      case TextType.H1:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H1);
        break;
      case TextType.H2:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H2);
        break;
      case TextType.H3:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H3);
        break;
      case TextType.H4:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H4);
        break;
      case TextType.H5:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H5);
        break;
      case TextType.H6:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.H6);
        break;
      case TextType.Li:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.Li);
        break;
      case TextType.Blockquote:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.Blockquote);
        break;
      case TextType.B:
        this._view = Tree.instance.native.createTextView(context, org.nativescript.mason.masonkit.TextType.B);
        break;
    }

    this._hasNativeView = true;
    this[style_] = Style.fromView(this as never, this._view, true);
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

  // @ts-ignore
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
