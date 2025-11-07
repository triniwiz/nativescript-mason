import { CSSType, Utils, View } from '@nativescript/core';
import { isMasonView_, style_, text_, ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

@CSSType('Scroll')
export class Scroll extends ViewBase {
  [style_];
  private _view: MasonScroll;
  constructor() {
    super();
    this._view = Tree.instance.createScrollView() as never;
    this[isMasonView_] = true;
  }
  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }
  _inBatch = false;

  createNativeView() {
    return this._view;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
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
      const width = x + layout.width;
      const height = y + layout.height;
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
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // this.ios.computeWithSize(specWidth, specHeight);
          // @ts-ignore
          const layout = this.ios.mason_layout();
          //const layout = this.ios.layout();
          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });

          this.setMeasuredDimension(w, h);
          return;
        } else {
          // @ts-ignore
          this.ios.mason_computeWithMaxContent();
          // // @ts-ignore
          // this.ios.computeWithMaxContent();
          const layout = this.ios.node.computedLayout;

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

          this.setMeasuredDimension(w, h);

          this.eachLayoutChild((child) => {
            ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
          });
        }
      } else {
        // @ts-ignore
        const layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.setMeasuredDimension(w, h);

        this.eachLayoutChild((child) => {
          ViewBase.measureChild(this as never, child, child._currentWidthMeasureSpec, child._currentHeightMeasureSpec);
        });
      }
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }

  set text(value: string) {
    const nativeView = this._view;
    if (nativeView) {
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
        // nativeView.setTextContent(value);
      }
    }
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    // @ts-ignore
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      const index = atIndex <= -1 ? this._children.indexOf(child) : atIndex;
      nativeView.addViewAt(child.nativeViewProtected, index);
      return true;
    }

    return false;
  }

  // @ts-ignore
  public _removeViewFromNativeVisualTree(view: MasonChild): void {
    view[isMasonView_] = false;
    // @ts-ignore
    super._removeViewFromNativeVisualTree(view);
  }
}
