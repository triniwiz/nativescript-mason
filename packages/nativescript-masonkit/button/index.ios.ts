import { CSSType, Utils, View, ViewBase } from '@nativescript/core';
import { ButtonBase, textContentProperty, setMeasuredFromNative } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { style_, isText_, isMasonView_, isTextChild_, native_ } from '../symbols';

@CSSType('Button')
export class Button extends ButtonBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isText_] = true;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      this[native_] = Tree.instance.createButtonView(null) as never;
    }
    return this[native_] as never as MasonButton;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  get _styleHelper(): Style {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  [textContentProperty.setNative](value) {
    const nativeView = this._view;
    if (nativeView) {
      nativeView.textContent = value;
    }
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);

    // todo
    // @ts-ignore
    let layout = this._view.node.computedLayout;
    const children = layout.children;
    let i = 0;
    if (children.count === 0) {
      return;
    }
    for (const child of this._viewChildren) {
      layout = children.objectAtIndex(i);
      const x = layout.x;
      const y = layout.y;
      const w = layout.width;
      const h = layout.height;

      const wSpec = Utils.layout.makeMeasureSpec(w, Utils.layout.EXACTLY);
      const hSpec = Utils.layout.makeMeasureSpec(h, Utils.layout.EXACTLY);
      View.measureChild(this as never, child as never, wSpec, hSpec);

      (child as any).layout(x, y, x + w, y + h);
      i++;
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      const root = !this.parent?.[isMasonView_];
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, root, false));
      if (!root) {
        this.eachLayoutChild((child) => {
          View.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
        });
      }
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild & { text?: string }, atIndex = -1): boolean {
    const nativeView = this._view;

    if (nativeView && child.nativeViewProtected) {
      child[isTextChild_] = true;

      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addViewAt(child.nativeViewProtected, index);
      this._masonAdoptForeign(child);
      return true;
    }

    return false;
  }

  _removeViewFromNativeVisualTree(view: ViewBase): void {
    view[isTextChild_] = false;
    super._removeViewFromNativeVisualTree(view);
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }
}
