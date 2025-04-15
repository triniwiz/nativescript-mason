import { backgroundColorProperty, Color, colorProperty, CoreTypes, CSSType, Screen, TextBase, Utils, ViewBase } from '@nativescript/core';
import { Style } from './style';
import { BigIntZero, style, mason, node, textProperty, MasonChild, style_ } from './common';

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

// export class TSCView extends TSCViewBase {
//   // loadPtrs() {
//   //   // @ts-ignore
//   //   const ptrs = this.ios?.masonPtrs?.split?.(':');
//   //   this.__masonPtr = BigInt(ptrs[0]);
//   //   this.__masonNodePtr = BigInt(ptrs[1]);
//   //   this.__masonStylePtr = BigInt(ptrs[2]);
//   // }

//   get _masonStylePtr() {
//     if (this[style] === BigIntZero) {
//       this[style] = BigInt(this._view.masonStylePtr);
//     }
//     return this[style];
//   }
//   get _masonNodePtr() {
//     if (this[node] === BigIntZero) {
//       this[node] = BigInt(this._view.masonNodePtr);
//     }
//     return this[node];
//   }
//   get _masonPtr() {
//     if (this[mason] === BigIntZero) {
//       this[mason] = BigInt(this._view.masonPtr);
//     }
//     return this[mason];
//   }

//   _hasNativeView = false;

//   _view: UIView;

//   constructor() {
//     super();
//     this._hasNativeView = true;
//     const view = UIView.alloc().initWithFrame(CGRectZero);
//     view.mason.isEnabled = true;
//     this._view = view;
//   }

//   createNativeView() {
//     return this._view;
//   }

//   disposeNativeView(): void {
//     this._hasNativeView = false;
//     super.disposeNativeView();
//   }

//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   //@ts-ignore
//   get ios() {
//     return this._view as UIView;
//   }

//   public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
//     const nativeView = this.nativeView;
//     if (nativeView) {
//       const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
//       const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
//       const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
//       const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

//       if (!this._isMasonChild) {
//         // only call compute on the parent
//         if (this.width === 'auto' && this.height === 'auto') {
//           const parent = this.parent as any;
//           const parentWidth = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0);
//           const parentHeight = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0);

//           this.ios.setSize(parentWidth, parentHeight);

//           this.ios.mason.computeWithMaxContent();

//           const layout = this.ios.mason.layout();

//           const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
//           const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

//           this.setMeasuredDimension(w, h);
//           return;
//         } else {
//           let width;
//           switch (typeof this.width) {
//             case 'object': {
//               const parent = this.parent as any;
//               const mw = parent?.getMeasuredWidth?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.width ?? 0);
//               width = parseLength(this.width, mw);
//               break;
//             }
//             case 'string':
//               width = -2;
//               break;
//             case 'number':
//               width = Utils.layout.toDevicePixels(this.width);
//               break;
//           }

//           let height;
//           switch (typeof this.height) {
//             case 'object': {
//               const parent = this.parent as any;
//               const mh = parent?.getMeasuredHeight?.() || Utils.layout.toDevicePixels(parent?.nativeView?.frame?.size?.height ?? 0);
//               height = parseLength(this.height, mh);
//               break;
//             }

//             case 'string':
//               height = -2;
//               break;
//             case 'number':
//               height = Utils.layout.toDevicePixels(this.height);
//               break;
//           }
//           this.ios.mason.computeWithSize(width, height);
//         }
//       }

//       this.setMeasuredDimension(specWidth, specHeight);
//     }
//   }

//   _setNativeViewFrame(nativeView: any, frame: CGRect): void {
//     console.log('_setNativeViewFrame', nativeView, frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
//   }

//   public _addViewToNativeVisualTree(view: ViewBase, atIndex?: number): boolean {
//     const nativeView = this.nativeView as UIView;
//     (view as any)._masonParent = this;
//     super._addViewToNativeVisualTree(view, atIndex);

//     if (nativeView && view.nativeViewProtected) {
//       view['_hasNativeView'] = true;
//       view['_isMasonChild'] = !!(view as any)._masonParent;

//       if (typeof atIndex === 'number' && atIndex >= this._children.length) {
//         nativeView.insertSubviewAtIndex(view.nativeViewProtected, atIndex);
//       } else {
//         nativeView.addSubview(view.nativeViewProtected);
//       }
//     }
//     return true;
//   }

//   public _removeViewFromNativeVisualTree(view: ViewBase): void {
//     const nativeView = this.viewController.view;
//     (view as any)._masonParent = undefined;
//     (view as any)._isMasonView = false;
//     (view as any)._isMasonChild = false;
//     super._removeViewFromNativeVisualTree(view);
//     if (view.nativeViewProtected && (view.nativeViewProtected as UIView).superview === nativeView) {
//       (view.nativeViewProtected as UIView).removeFromSuperview();
//     }
//   }
// }

export class Tree {
  _base: NSCMason;
  private static _tree: Tree;
  constructor() {
    this._base = NSCMason.alloc().init();
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

  createView() {
    return this.native.createView();
  }

  createTextView() {
    return this.native.createTextView();
  }
}

export class View extends ViewBase {
  [style_];
  private _view: MasonUIView;
  constructor() {
    super();
    console.time('View');
    const view = Tree.instance.createView();
    console.timeEnd('View');
    this._hasNativeView = true;
    this._view = view;
    //  this.loadPtrs();
  }
  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }
  loadPtrs() {
    const ptrs = this.android?.getMasonPtrs().split(':');
    this[mason] = BigInt(ptrs[0]);
    this[node] = BigInt(ptrs[1]);
  }

  get _masonNodePtr() {
    if (this[node] === BigIntZero) {
      this.loadPtrs();
    }
    return this[node];
  }
  get _masonPtr() {
    if (this[mason] === BigIntZero) {
      this.loadPtrs();
    }
    return this[mason];
  }

  _hasNativeView = false;
  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  disposeNativeView(): void {
    this._hasNativeView = false;
    super.disposeNativeView();
  }

  get ios() {
    return this._view;
  }

  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    // super._addViewToNativeVisualTree(child);
    const nativeView = this._view;

    // @ts-ignore
    child._masonParent = this;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      if (atIndex === -1) {
        nativeView.addSubview(child.nativeViewProtected);
      } else {
        nativeView.addSubviewsAt(Utils.ios.collections.jsArrayToNSArray([child.nativeViewProtected]), atIndex ?? -1);
      }
      return true;
    }
    // console.log('????/');

    return false;
  }

  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    (view as any)._masonParent = undefined;
    (view as any)._isMasonView = false;
    (view as any)._isMasonChild = false;
    super._removeViewFromNativeVisualTree(view);
  }
}

export class Text extends TextBase {
  [style_];
  _hasNativeView = false;
  _inBatch = false;
  private _view: MasonText;
  constructor() {
    super();
    const view = Tree.instance.createTextView();
    this._view = view;
    this._hasNativeView = true;
    this.loadPtrs();
    this[style_] = Style.fromView(this as never, view, true);
  }

  // @ts-ignore
  get ios() {
    return this._view;
  }

  loadPtrs() {
    // const ptrs = this.ios?.getMasonPtrs().split(':');
    // this[mason] = BigInt(ptrs[0]);
    // this[node] = BigInt(ptrs[1]);
  }

  get _masonNodePtr() {
    if (this[node] === BigIntZero) {
      this.loadPtrs();
    }
    return this[node];
  }
  get _masonPtr() {
    if (this[mason] === BigIntZero) {
      this.loadPtrs();
    }
    return this[mason];
  }

  createNativeView() {
    return this._view;
  }

  [textProperty.setNative](value) {
    const nativeView = this._view;
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

  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    // console.log('_addViewToNativeVisualTree');
    // super._addViewToNativeVisualTree(child);
    const nativeView = this._view;

    // child._masonParent = this;

    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;

      nativeView.addView(child.nativeViewProtected, atIndex ?? -1);
      return true;
    }

    return false;
  }
}
