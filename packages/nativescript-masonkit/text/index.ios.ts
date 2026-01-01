import { Utils, View, ViewBase } from '@nativescript/core';
import { TextBase, textContentProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { parseLength } from '../utils';
import { isMasonView_, isPlaceholder_, isText_, isTextChild_, native_, style_ } from '../symbols';

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
}

export class Text extends TextBase {
  [style_];
  _inBatch = false;
  private _type: TextType = TextType.None;
  constructor(type: TextType = 0) {
    super();
    this._type = type;
    this[isText_] = true;
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      let view;
      switch (this._type) {
        case TextType.None:
          view = Tree.instance.createTextView(null, MasonTextType.None as number) as never;
          break;
        case TextType.P:
          view = Tree.instance.createTextView(null, MasonTextType.P as number) as never;
          break;
        case TextType.Span:
          view = Tree.instance.createTextView(null, MasonTextType.Span as number) as never;
          break;
        case TextType.Code:
          view = Tree.instance.createTextView(null, MasonTextType.Code as number) as never;
          break;
        case TextType.H1:
          view = Tree.instance.createTextView(null, MasonTextType.H1 as number) as never;
          break;
        case TextType.H2:
          view = Tree.instance.createTextView(null, MasonTextType.H2 as number) as never;
          break;
        case TextType.H3:
          view = Tree.instance.createTextView(null, MasonTextType.H3 as number) as never;
          break;
        case TextType.H4:
          view = Tree.instance.createTextView(null, MasonTextType.H4 as number) as never;
          break;
        case TextType.H5:
          view = Tree.instance.createTextView(null, MasonTextType.H5 as number) as never;
          break;
        case TextType.H6:
          view = Tree.instance.createTextView(null, MasonTextType.H6 as number) as never;
          break;
        case TextType.Li:
          view = Tree.instance.createTextView(null, MasonTextType.Li as number) as never;
          break;
        case TextType.Blockquote:
          view = Tree.instance.createTextView(null, MasonTextType.Blockquote as number) as never;
          break;
        case TextType.B:
          view = Tree.instance.createTextView(null, MasonTextType.B as number) as never;
          break;
      }

      this[native_] = view;
      return view;
    }
    return this[native_] as never as MasonText;
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

      const parentIsMason = this.parent && this.parent[isMasonView_];

      if (!parentIsMason) {
        // only call compute on the parent
        if (this.width === 'auto' && this.height === 'auto') {
          // todo
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          //this.ios.computeWithMaxContent();

          // todo
          // @ts-ignore
          const layout = this.ios.mason_layout();

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

export class Br extends TextBase {
  [style_];
  _inBatch = false;
  private _view;
  constructor() {
    super();
    this._view = Tree.instance.createBr(null) as never;
    this[isMasonView_] = true;
    this[isPlaceholder_] = true;
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

  [textContentProperty.setNative](value) {}
}
