import { Screen } from '@nativescript/core';

enum TextType {
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
  private _base: org.nativescript.mason.masonkit.Mason;
  private static _tree: Tree;
  constructor(base?: org.nativescript.mason.masonkit.Mason) {
    this._base = base ?? new org.nativescript.mason.masonkit.Mason();
  }

  static {
    this._tree = new Tree(org.nativescript.mason.masonkit.Mason.getShared());
    this._tree._base.setDeviceScale(Screen.mainScreen.scale);
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

  createTextView(context, type?: TextType) {
    switch (type) {
      case TextType.P:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.P);
      case TextType.Span:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.Span);
      case TextType.Code:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.Code);
      case TextType.H1:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H1);
      case TextType.H2:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H2);
      case TextType.H3:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H3);
      case TextType.H4:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H4);
      case TextType.H5:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H5);
      case TextType.H6:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.H6);
      case TextType.Li:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.Li);
      case TextType.Blockquote:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.Blockquote);
      case TextType.B:
        return this.native.createTextView(context, org.nativescript.mason.masonkit.enums.TextType.B);
      default:
        return this.native.createTextView(context);
    }
  }

  createImageView(context) {
    return this.native.createImageView(context);
  }

  createScrollView(context) {
    return this.native.createScrollView(context);
  }
}
