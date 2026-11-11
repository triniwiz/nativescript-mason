import { CSSType, Utils, ViewBase } from '@nativescript/core';
import { TextBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isMasonView_, isTextChild_, isPlaceholder_, native_, slot_ } from '../symbols';

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
  /** The text native was created holding, until the first textContent setNative. */
  private _nativeHoldsText: string | undefined;
  constructor(type: TextType = 0) {
    super();
    this._type = type;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      // textContent set before mount travels with the create call; its deferred setNative then has nothing to send.
      const text = this.textContent;
      const withText = typeof text === 'string' && text !== '' ? text : undefined;
      const view = Tree.instance.createTextView(context, this._type as number, withText) as never;
      this._nativeHoldsText = withText;
      this[native_] = view;
      this[slot_] = Tree.instance.lastSlot;
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
    const held = this._nativeHoldsText;
    this._nativeHoldsText = undefined;
    // Children attached since creation may have changed the native content, so only skip while there are none.
    if (held !== undefined && value === held && this._children.length === 0) return;
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
      const { jsIndex, nativeIndex } = (this as any)._nativeAttachIndex(child, atIndex);
      // Fall back to addView (append) only when the child is genuinely not
      // tracked yet; otherwise map the JS index onto the native children list
      // (views attach lazily, so the raw index can run ahead of native state).
      if (jsIndex <= -1) {
        child._isMasonChild = true;
        nativeView.addView(child.nativeViewProtected as never);
        this._masonAdoptForeign(child);
        return true;
      }
      child._isMasonChild = true;
      if (child[isPlaceholder_]) {
        nativeView.addChildAt(child.android, nativeIndex as never);
      } else {
        // `addView` takes any view, Mason or foreign (an SVG, a canvas);
        // `addChildAt` only has overloads for text, elements and nodes.
        nativeView.addView(child.nativeViewProtected, nativeIndex as never);
        this._masonAdoptForeign(child);
      }
      return true;
    }

    return false;
  }

  _removeViewFromNativeVisualTree(view: ViewBase): void {
    (this as any)._invalidateAttachCursor();
    view[isTextChild_] = false;
    (view as any)._isMasonChild = false;
    // Detach the Mason node and its view; inline children render as text runs,
    // so the parent's segments must be rebuilt too (TextView.removeView does both).
    const nativeView = this._view as any;
    const child = (view as any).nativeViewProtected;
    if (nativeView && child) {
      nativeView.removeView(child);
    }
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
    // super._removeViewFromNativeVisualTree(view);
  }
}
