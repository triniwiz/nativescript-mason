import { CoreTypes, CSSType, Screen, Utils, View, ViewBase } from '@nativescript/core';
import { TSCViewBase } from './common';

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
  __masonStylePtr = 0;
  get _masonStylePtr() {
    if (this.__masonStylePtr === 0) {
      this.__masonStylePtr = String(this.ios?.masonStylePtr ?? 0) as any; // cast as string for now
    }
    return this.__masonStylePtr;
  }

  __masonNodePtr = 0;
  get _masonNodePtr() {
    if (this.__masonNodePtr === 0) {
      this.__masonNodePtr = String(this.ios?.masonNodePtr ?? 0) as any; // cast as string for now
    }
    return this.__masonNodePtr;
  }

  __masonPtr = 0;
  get _masonPtr() {
    if (this.__masonPtr === 0) {
      this.__masonPtr = String((UIView as any).masonPtr ?? 0) as any; // cast as string for now
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

  //@ts-ignore
  get ios() {
    return this.nativeViewProtected as UIView;
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    const nativeView = this.nativeView;
    if (nativeView) {
      this.eachLayoutChild((child) => {
        const layout = child.ios.mason.layout();

        child.setMeasuredDimension(layout.width, layout.height);

        View.layoutChild(this as any, child, layout.x, layout.y, layout.width, layout.height);
        return true;
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
            case 'object':
              const parent = this.parent as any;
              const mw = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0) || specWidth;
              width = parseLength(this.width, mw);
              break;
            case 'string':
              width = -2;
              break;
            case 'number':
              width = Utils.layout.toDevicePixels(this.width);
              break;
          }

          let height;
          switch (typeof this.height) {
            case 'object':
              const parent = this.parent as any;
              const mh = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0) || specHeight;
              height = parseLength(this.height, mh);
              break;
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
      this.setMeasuredDimension(layout.width, layout.height);
    }
  }

  public layoutNativeView(): void {
    // noop
  }

  public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
    const nativeView = this.nativeView as UIView;
    (view as any)._masonParent = this;
    super._addViewToNativeVisualTree(view, atIndex);

    // if (nativeView && view.nativeViewProtected) {
    //   console.log(view.nativeViewProtected);
    //   nativeView.addSubview(view.nativeViewProtected);
    // }

    const index = atIndex ?? Infinity;
    if (nativeView && view.nativeViewProtected) {
      view['_hasNativeView'] = true;
      view['_isMasonChild'] = true;

      if (index >= nativeView.subviews.count) {
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
    if (view.nativeViewProtected) {
      if ((view.nativeViewProtected as UIView).superview === nativeView) {
        (view.nativeViewProtected as UIView).removeFromSuperview();
      }
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

@CSSType('Container')
export class Container extends TSCView {}
