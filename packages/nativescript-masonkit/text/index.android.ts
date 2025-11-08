import { backgroundColorProperty, Color, colorProperty, CSSType, Utils, ViewBase } from '@nativescript/core';
import { isMasonView_, isTextChild_, style_, TextBase, textContentProperty, textWrapProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

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

const enum TextWrap {
  NoWrap = 0,

  Wrap = 1,

  Balance = 2,
}

@CSSType('Text')
export class Text extends TextBase {
  [style_];
  _inBatch = false;
  private _view: org.nativescript.mason.masonkit.TextView;
  private _type: TextType;
  constructor(type: TextType = 0) {
    super();
    this._type = type;
    const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
    switch (type) {
      case TextType.None:
        this._view = Tree.instance.createTextView(context, TextType.None as number) as never;
        break;
      case TextType.P:
        this._view = Tree.instance.createTextView(context, TextType.P as number) as never;
        break;
      case TextType.Span:
        this._view = Tree.instance.createTextView(context, TextType.Span as number) as never;
        break;
      case TextType.Code:
        this._view = Tree.instance.createTextView(context, TextType.Code as number) as never;
        break;
      case TextType.H1:
        this._view = Tree.instance.createTextView(context, TextType.H1 as number) as never;
        break;
      case TextType.H2:
        this._view = Tree.instance.createTextView(context, TextType.H2 as number) as never;
        break;
      case TextType.H3:
        this._view = Tree.instance.createTextView(context, TextType.H3 as number) as never;
        break;
      case TextType.H4:
        this._view = Tree.instance.createTextView(context, TextType.H4 as number) as never;
        break;
      case TextType.H5:
        this._view = Tree.instance.createTextView(context, TextType.H5 as number) as never;
        break;
      case TextType.H6:
        this._view = Tree.instance.createTextView(context, TextType.H6 as number) as never;
        break;
      case TextType.Li:
        this._view = Tree.instance.createTextView(context, TextType.Li as number) as never;
        break;
      case TextType.Blockquote:
        this._view = Tree.instance.createTextView(context, TextType.Blockquote as number) as never;
        break;
      case TextType.B:
        this._view = Tree.instance.createTextView(context, TextType.B as number) as never;
        break;
    }

    this[isMasonView_] = true;
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

  createNativeView() {
    return this._view;
  }

  [textContentProperty.setNative](value) {
    const nativeView = this._view as org.nativescript.mason.masonkit.TextView;
    if (nativeView) {
      nativeView.setTextContent(value);
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
