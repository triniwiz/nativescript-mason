import { CSSType, Utils, View, ViewBase } from '@nativescript/core';
import { TSCViewBase, applyMixins } from './common';
const BigIntZero = BigInt(0);

export { applyMixins };

export class TSCView extends TSCViewBase {
  static {
    org.nativescript.mason.masonkit.Mason.setShared(false);
  }
  __masonStylePtr = BigIntZero;
  get _masonStylePtr() {
    if (this.__masonStylePtr === BigIntZero) {
      this.__masonStylePtr = BigInt((this.android as any)?.getMasonStylePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = BigIntZero;
  get _masonNodePtr() {
    if (this.__masonNodePtr === BigIntZero) {
      this.__masonNodePtr = BigInt((this.android as any)?.getMasonNodePtr?.()?.toString?.() ?? '0');
    }
    return this.__masonNodePtr;
  }

  __masonPtr = BigIntZero;
  get _masonPtr() {
    if (this.__masonPtr === BigIntZero) {
      this.__masonPtr = BigInt(org.nativescript.mason.masonkit.Mason.getInstance().getNativePtr().toString());
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;
  _inBatch = false;

  createNativeView() {
    const view = new org.nativescript.mason.masonkit.View(this._context) as any;
    this._hasNativeView = true;
    return view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  //@ts-ignore
  get android() {
    return this.nativeViewProtected as org.nativescript.mason.masonkit.View;
  }

  public _addViewToNativeVisualTree(child: ViewBase, atIndex: number = Number.MAX_VALUE): boolean {
    // super._addViewToNativeVisualTree(child);
    const nativeView = this.nativeViewProtected as org.nativescript.mason.masonkit.View;

    (child as any)._masonParent = this;

    if (nativeView && child.nativeViewProtected) {
      child['_hasNativeView'] = true;
      child['_isMasonChild'] = true;
      (nativeView as any).addView(child.nativeViewProtected, -1);

      return true;
    }

    return false;
  }

  public _removeViewFromNativeVisualTree(view: ViewBase): void {
    (view as any)._masonParent = undefined;
    (view as any)._isMasonView = false;
    (view as any)._isMasonChild = false;
    super._removeViewFromNativeVisualTree(view);
  }
}

@CSSType('Grid')
export class Grid extends TSCView {
  createNativeView() {
    const view = org.nativescript.mason.masonkit.View.createGridView(this._context) as any;
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Flex')
export class Flex extends TSCView {
  createNativeView() {
    const view = org.nativescript.mason.masonkit.View.createFlexView(this._context) as any;
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Container')
export class Container extends TSCView {}
