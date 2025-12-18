import { backgroundColorProperty, Color, colorProperty, CSSType, Utils, View, ViewBase } from '@nativescript/core';
import { isMasonView_, isText_, isTextChild_, style_, text_, ButtonBase, textContentProperty, textWrapProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { parseLength } from '../utils';

@CSSType('Button')
export class Button extends ButtonBase {
  [style_];
  _inBatch = false;
  private _view: MasonButton;
  constructor() {
    super();
    this[isText_] = true;
    this._view = Tree.instance.createButtonView(null) as never;
    this[isMasonView_] = true;
    this[style_] = Style.fromView(this as never, this._view);
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

  [colorProperty.setNative](value) {
    switch (typeof value) {
      case 'number':
        this._styleHelper.color = value;
        break;
      case 'string':
        {
          this._styleHelper.color = new Color(value).argb;
        }
        break;
      case 'object':
        {
          this._styleHelper.color = value.argb;
        }
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  set backgroundColor(value: Color | number) {
    switch (typeof value) {
      case 'number':
        this._styleHelper.backgroundColor = value;
        break;
      case 'string':
        this._styleHelper.backgroundColor = new Color(value).argb;
        break;
      case 'object':
        this._styleHelper.backgroundColor = value.argb;
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get backgroundColor() {
    return new Color(this[style_].backgroundColor);
  }

  [backgroundColorProperty.setNative](value) {
    if (typeof value === 'number') {
      this[style_].backgroundColor = value;
    } else if (value instanceof Color) {
      this[style_].backgroundColor = value.argb;
    }
  }

  [textWrapProperty.setNative](value) {
    switch (value) {
      case 'false':
      case false:
      case 'nowrap':
        this._styleHelper.textWrap = MasonTextWrap.NoWrap;
        break;
      case true:
      case 'true':
      case 'wrap':
        this._styleHelper.textWrap = MasonTextWrap.Wrap;
        break;
      case 'balance':
        this._styleHelper.textWrap = MasonTextWrap.Balance;
        break;
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
      const width = layout.width;
      const height = layout.height;
      View.layoutChild(this as never, child as never, x, y, width, height);
      i++;
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;

    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this[isMasonView_]) {
        // only call compute on the parent
        if (this.width === 'auto' && this.height === 'auto') {
          // todo
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          //this.ios.computeWithMaxContent();

          // todo
          // @ts-ignore
          const layout = this.ios.node.computedLayout;

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

          // todo
          // @ts-ignore
          this.ios.mason_computeWithSize(width, height);

          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);
        }
      } else {
        // todo
        // @ts-ignore
        const layout = nativeView.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.eachLayoutChild((child) => {
          View.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
        });

        this.setMeasuredDimension(w, h);
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
