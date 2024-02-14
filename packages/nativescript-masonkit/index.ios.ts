import { CoreTypes, CSSType, Screen, Utils, View, ViewBase } from '@nativescript/core';
import { BigIntZero, TSCViewBase } from './common';

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

  // get _masonStylePtr() {
  //   if (this.__masonStylePtr === BigIntZero) {
  //     this.loadPtrs();
  //   }
  //   return this.__masonStylePtr;
  // }
  // get _masonNodePtr() {
  //   if (this.__masonNodePtr === BigIntZero) {
  //     this.loadPtrs();
  //   }
  //   return this.__masonNodePtr;
  // }
  // get _masonPtr() {
  //   if (this.__masonPtr === BigIntZero) {
  //     this.loadPtrs();
  //   }
  //   return this.__masonPtr;
  // }

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

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    const nativeView = this.nativeView;
    if (nativeView) {
      const insets = this.getSafeAreaInsets();
      this.eachLayoutChild((child) => {
        const layout = child.ios.mason.layout();
        const left = layout.x + insets.left;
        const top = layout.y + insets.top;
        const width = layout.width + insets.right;
        const height = layout.height + insets.bottom;
        View.measureChild(this as any, child, Utils.layout.makeMeasureSpec(width, Utils.layout.EXACTLY), Utils.layout.makeMeasureSpec(height, Utils.layout.EXACTLY));
        View.layoutChild(this as any, child, left, top, width, height);
      });
    }
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
          /*  let width;
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
          */
        }
      }

      this.setMeasuredDimension(specWidth, specHeight);
    }
  }

  public layoutNativeView(): void {
    // noop
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
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Flex')
export class Flex extends TSCView {
  createNativeView() {
    const view = (UIView as any).createFlexView() as any;
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Box')
export class Box extends TSCView {
  createNativeView() {
    const view = (UIView as any).createBlockView() as any;
    this._hasNativeView = true;
    return view;
  }
}

@CSSType('Container')
export class Container extends TSCView {}
