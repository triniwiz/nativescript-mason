import { backgroundColorProperty, Color, colorProperty, Utils, View, ViewBase } from '@nativescript/core';
import { isMasonView_, isText_, isTextChild_, style_, text_, TextBase, textWrapProperty } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';
import { parseLength } from '../utils';

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
  private _view: MasonText;
  constructor(type: TextType = 0) {
    super();
    this[isText_] = true;
    switch (type) {
      case TextType.None:
        this._view = Tree.instance.createTextView(null, MasonTextType.None as number) as never;
        break;
      case TextType.P:
        this._view = Tree.instance.createTextView(null, MasonTextType.P as number) as never;
        break;
      case TextType.Span:
        this._view = Tree.instance.createTextView(null, MasonTextType.Span as number) as never;
        break;
      case TextType.Code:
        this._view = Tree.instance.createTextView(null, MasonTextType.Code as number) as never;
        break;
      case TextType.H1:
        this._view = Tree.instance.createTextView(null, MasonTextType.H1 as number) as never;
        break;
      case TextType.H2:
        this._view = Tree.instance.createTextView(null, MasonTextType.H2 as number) as never;
        break;
      case TextType.H3:
        this._view = Tree.instance.createTextView(null, MasonTextType.H3 as number) as never;
        break;
      case TextType.H4:
        this._view = Tree.instance.createTextView(null, MasonTextType.H4 as number) as never;
        break;
      case TextType.H5:
        this._view = Tree.instance.createTextView(null, MasonTextType.H5 as number) as never;
        break;
      case TextType.H6:
        this._view = Tree.instance.createTextView(null, MasonTextType.H6 as number) as never;
        break;
      case TextType.Li:
        this._view = Tree.instance.createTextView(null, MasonTextType.Li as number) as never;
        break;
      case TextType.Blockquote:
        this._view = Tree.instance.createTextView(null, MasonTextType.Blockquote as number) as never;
        break;
      case TextType.B:
        this._view = Tree.instance.createTextView(null, MasonTextType.B as number) as never;
        break;
    }
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  get text() {
    return this._view.text;
  }

  set text(value: string) {
    const nativeView = this._view;
    if (nativeView) {
      // hacking vue3 to handle text nodes
      // hacking vue3 to handle text nodes
      if (global.VUE3_ELEMENT_REF) {
        const view_ref = this[global.VUE3_ELEMENT_REF] as any;
        if (Array.isArray(view_ref.childNodes)) {
          if (view_ref.childNodes.length === 0) {
            this.addChild({ [text_]: value });
            return;
          }
          if (view_ref.childNodes.length === 1) {
            const node = view_ref.childNodes[0];
            if (node && node.nodeType === 'text') {
              this.addChild({ [text_]: node.text });
            }
            return;
          }

          (view_ref.childNodes as any[]).forEach((node, index) => {
            if (node.nodeType === 'text') {
              this.replaceChild({ [text_]: node.text }, index);
            }
          });
        }
      } else {
        // will replace all nodes with a new text node
        nativeView.text = value;
      }
    }
  }

  // [textProperty.setNative](value) {
  //   const nativeView = this._view;
  //   console.log('text:setNative', value);
  //   if (nativeView) {
  //     nativeView.updateText(value);
  //   }
  // }

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

      const index = atIndex ?? -1;
      if (index >= 0) {
        nativeView.addViewAt(child.nativeViewProtected, index);
      } else {
        nativeView.addView(child.nativeViewProtected);
      }
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
