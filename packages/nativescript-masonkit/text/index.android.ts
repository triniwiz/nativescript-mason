import { CSSType, Utils, ViewBase } from '@nativescript/core';
import { TextBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, isTextChild_, isPlaceholder_, native_ } from '../symbols';

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

  Pre = 13,
  Strong = 14,
  Em = 15,
  I = 16,
  A = 17,
}

@CSSType('Text')
export class Text extends TextBase {
  [style_];
  _inBatch = false;
  private _type: TextType;
  constructor(type: TextType = 0) {
    super();
    this._type = type;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      let view;
      switch (this._type) {
        case TextType.None:
          view = Tree.instance.createTextView(context, TextType.None as number) as never;
          break;
        case TextType.P:
          view = Tree.instance.createTextView(context, TextType.P as number) as never;
          break;
        case TextType.Span:
          view = Tree.instance.createTextView(context, TextType.Span as number) as never;
          break;
        case TextType.Code:
          view = Tree.instance.createTextView(context, TextType.Code as number) as never;
          break;
        case TextType.H1:
          view = Tree.instance.createTextView(context, TextType.H1 as number) as never;
          break;
        case TextType.H2:
          view = Tree.instance.createTextView(context, TextType.H2 as number) as never;
          break;
        case TextType.H3:
          view = Tree.instance.createTextView(context, TextType.H3 as number) as never;
          break;
        case TextType.H4:
          view = Tree.instance.createTextView(context, TextType.H4 as number) as never;
          break;
        case TextType.H5:
          view = Tree.instance.createTextView(context, TextType.H5 as number) as never;
          break;
        case TextType.H6:
          view = Tree.instance.createTextView(context, TextType.H6 as number) as never;
          break;
        case TextType.Li:
          view = Tree.instance.createTextView(context, TextType.Li as number) as never;
          break;
        case TextType.Blockquote:
          view = Tree.instance.createTextView(context, TextType.Blockquote as number) as never;
          break;
        case TextType.B:
          view = Tree.instance.createTextView(context, TextType.B as number) as never;
          break;

        case TextType.Pre:
          view = Tree.instance.createTextView(context, TextType.Pre as number) as never;
          break;
        case TextType.Strong:
          view = Tree.instance.createTextView(context, TextType.Strong as number) as never;
          break;
        case TextType.Em:
          view = Tree.instance.createTextView(context, TextType.Em as number) as never;
          break;
        case TextType.I:
          view = Tree.instance.createTextView(context, TextType.I as number) as never;
          break;
        case TextType.A:
          view = Tree.instance.createTextView(context, TextType.A as number) as never;
          break;
        default:
          view = Tree.instance.createTextView(context, TextType.None as number) as never;
          break;
      }

      this[native_] = view;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.TextView;
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

  [textContentProperty.setNative](value) {
    const nativeView = this._view as org.nativescript.mason.masonkit.TextView;
    if (nativeView) {
      nativeView.setTextContent(value);
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.TextView;
    if (nativeView && child.nativeViewProtected) {
      child[isTextChild_] = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addChildAt(child.nativeViewProtected, index as never);
    }

    return false;
  }

  _removeViewFromNativeVisualTree(view: ViewBase): void {
    view[isTextChild_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}

export class Br extends TextBase {
  [style_];
  _inBatch = false;
  private _view;
  constructor() {
    super();
    this._view = Tree.instance.createBr() as never;
    this[isMasonView_] = true;
    this[isPlaceholder_] = true;
    this[style_] = Style.fromView(this as never, this._view);
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

  [textContentProperty.setNative](value) {}

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && child.nativeViewProtected) {
      child[isTextChild_] = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addChildAt(child.nativeViewProtected, index as never);
    }

    return false;
  }

  _removeViewFromNativeVisualTree(view: ViewBase): void {
    view[isTextChild_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
