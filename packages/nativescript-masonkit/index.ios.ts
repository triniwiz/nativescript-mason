import { CoreTypes, CSSType, Screen, Utils, View, ViewBase } from '@nativescript/core';
import { BigIntZero, TSCViewBase, style, mason, node } from './common';

function parseLength(length: CoreTypes.LengthDipUnit | CoreTypes.LengthPxUnit | CoreTypes.LengthPercentUnit, parent = 0) {
  switch (length.unit) {
    case '%':
      return length.value * parent;
    case 'dip':
      return Utils.layout.toDevicePixels(length.value);
    case 'px':
      return length.value;
  }
}

export class TSCView extends TSCViewBase {
  // loadPtrs() {
  //   // @ts-ignore
  //   const ptrs = this.ios?.masonPtrs?.split?.(':');
  //   this.__masonPtr = BigInt(ptrs[0]);
  //   this.__masonNodePtr = BigInt(ptrs[1]);
  //   this.__masonStylePtr = BigInt(ptrs[2]);
  // }

  get _masonStylePtr() {
    if (this[style] === BigIntZero) {
      this[style] = BigInt(this._view.masonStylePtr);
    }
    return this[style];
  }
  get _masonNodePtr() {
    if (this[node] === BigIntZero) {
      this[node] = BigInt(this._view.masonNodePtr);
    }
    return this[node];
  }
  get _masonPtr() {
    if (this[mason] === BigIntZero) {
      this[mason] = BigInt(this._view.masonPtr);
    }
    return this[mason];
  }

  _hasNativeView = false;

  _view: UIView;

  constructor() {
    super();
    this._hasNativeView = true;
    const view = UIView.alloc().initWithFrame(CGRectZero);
    view.mason.isEnabled = true;
    this._view = view;
  }

  createNativeView() {
    return this._view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  get ios() {
    return this._view as UIView;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this._isMasonChild) {
        // only call compute on the parent
        if (this.width === 'auto' && this.height === 'auto') {
          const parent = this.parent as any;
          const parentWidth = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0);
          const parentHeight = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0);

          this.ios.setSize(parentWidth, parentHeight);

          this.ios.mason.computeWithMaxContent();

          const layout = this.ios.mason.layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
          return;
        } else {
          let width;
          switch (typeof this.width) {
            case 'object': {
              const parent = this.parent as any;
              const mw = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0);
              width = parseLength(this.width, mw);
              break;
            }
            case 'string':
              width = -2;
              break;
            case 'number':
              width = Utils.layout.toDevicePixels(this.width);
              break;
          }

          let height;
          switch (typeof this.height) {
            case 'object': {
              const parent = this.parent as any;
              const mh = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0);
              height = parseLength(this.height, mh);
              break;
            }

            case 'string':
              height = -2;
              break;
            case 'number':
              height = Utils.layout.toDevicePixels(this.height);
              break;
          }
          this.ios.mason.computeWithSize(width, height);
        }
      }

      this.setMeasuredDimension(specWidth, specHeight);
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    console.log('_setNativeViewFrame', nativeView, frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
  }

  public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
    const nativeView = this.nativeView as UIView;
    (view as any)._masonParent = this;
    super._addViewToNativeVisualTree(view, atIndex);

    if (nativeView && view.nativeViewProtected) {
      view['_hasNativeView'] = true;
      view['_isMasonChild'] = !!(view as any)._masonParent;

      if (typeof atIndex === 'number' && atIndex >= this._children.length) {
        nativeView.insertSubviewAtIndex(view.nativeViewProtected, atIndex);
      } else {
        nativeView.addSubview(view.nativeViewProtected);
      }
    }
    return true;
  }

  public _removeViewFromNativeVisualTree(view: ViewBase): void {
    const nativeView = this.viewController.view;
    (view as any)._masonParent = undefined;
    (view as any)._isMasonView = false;
    (view as any)._isMasonChild = false;
    super._removeViewFromNativeVisualTree(view);
    if (view.nativeViewProtected && (view.nativeViewProtected as UIView).superview === nativeView) {
      (view.nativeViewProtected as UIView).removeFromSuperview();
    }
  }
}

@CSSType('Grid')
export class Grid extends TSCView {
  createNativeView() {
    const view = (UIView as any).createGridView() as any;
    this._view = view;
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Flex')
export class Flex extends TSCView {
  createNativeView() {
    const view = (UIView as any).createFlexView() as any;
    this._hasNativeView = true;
    this._view = view;
    return view;
  }
}

@CSSType('Box')
export class Box extends TSCView {
  createNativeView() {
    const view = (UIView as any).createBlockView() as any;
    this._hasNativeView = true;
    this._view = view;
    return view;
  }
}

@CSSType('Container')
export class Container extends TSCView {}
