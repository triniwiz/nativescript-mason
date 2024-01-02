import { CoreTypes, CSSType, Screen, Utils, View, ViewBase } from '@nativescript/core';
import { TSCViewBase } from './common';

const BigIntZero = BigInt(0);

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
  __masonStylePtr = BigIntZero;
  __masonNodePtr = BigIntZero;
  __masonPtr = BigIntZero;
  get _masonStylePtr() {
    if (this.__masonStylePtr === BigIntZero) {
      this.__masonStylePtr = BigInt(String(this.ios?.masonStylePtr ?? 0));
    }
    return this.__masonStylePtr;
  }

  get _masonNodePtr() {
    if (this.__masonNodePtr === BigIntZero) {
      this.__masonNodePtr = BigInt(this.ios?.masonNodePtr ?? 0);
    }
    return this.__masonNodePtr;
  }

  get _masonPtr() {
    if (this.__masonPtr === BigIntZero) {
      this.__masonPtr = BigInt((UIView as any).masonPtr ?? 0);
    }
    return this.__masonPtr;
  }

  _hasNativeView = false;

  createNativeView() {
    this._hasNativeView = true;
    const view = UIView.alloc().initWithFrame(CGRectZero);
    view.mason.isEnabled = true;
    return view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);

    const nativeView = this.nativeView;

    if (nativeView) {
      const insets = this.getSafeAreaInsets();
      this.eachLayoutChild((child) => {
        const layout = child.ios.mason.layout();

        // child.setMeasuredDimension(layout.width, layout.height);

        const left = layout.x + insets.left;
        const top = layout.y + insets.top;
        View.layoutChild(this as any, child, left, top, layout.width + left, layout.height + top);
        //    return true;
      });
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this.nativeView;
    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      // if (!(this as any)._masonParent) {
      //   const widthAuto = this.width !== 'auto';
      //   const heightAuto = this.height !== 'auto';
      //   // if (width && ) {
      //   //   this.ios.setSizeWidth()
      //   //   this.ios.setSize(width, height);
      //   // }
      // }

      if (!this._isMasonChild) {
        // only call compute on the parent

        if (this.width === 'auto' && this.height === 'auto') {
          this.ios.mason.computeWithMaxContent();
        } else {
          let width;
          switch (typeof this.width) {
            case 'object': {
              const parent = this.parent as any;
              const mw = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0) || specWidth;
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
              const mh = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0) || specHeight;
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

      const layout = this.ios.mason.layout();
      const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
      const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

      this.setMeasuredDimension(w, h);
    }
  }

  public layoutNativeView(): void {
    // noop
  }

  public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
    const nativeView = this.nativeView as UIView;
    (view as any)._masonParent = this;
    super._addViewToNativeVisualTree(view, atIndex);

    const index = atIndex ?? Infinity;
    if (nativeView && view.nativeViewProtected) {
      view['_hasNativeView'] = true;
      view['_isMasonChild'] = !!(view as any)._masonParent;

      if (index >= this._children.length) {
        nativeView.addSubview(view.nativeViewProtected);
      } else {
        nativeView.insertSubviewAtIndex(view.nativeViewProtected, index);
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
