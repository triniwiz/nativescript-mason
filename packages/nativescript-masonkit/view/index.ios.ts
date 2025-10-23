import { CSSType, Utils } from '@nativescript/core';
import { isMasonView_, style_, ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

@CSSType('View')
export class View extends ViewBase {
  [style_];
  private _view: MasonUIView;
  constructor() {
    super();
    const view = Tree.instance.createView();
    this._view = view;
    this[isMasonView_] = true;
  }
  get _styleHelper(): Style {
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

  set text(value: string) {
    const nativeView = this._view;
    if (nativeView) {
      // hacking vue3 to handle text nodes
      if (global.VUE3_ELEMENT_REF) {
        const view_ref = this[global.VUE3_ELEMENT_REF] as any;
        if (Array.isArray(view_ref.childNodes)) {
          if (view_ref.childNodes.length === 0) {
            // @ts-ignore
            nativeView.mason_addChildAtText(value || '', -1);
            return;
          }
          (view_ref.childNodes as any[]).forEach((node, index) => {
            if (node.nodeType === 'text') {
              // using replace to avoid accumulating text nodes
              // @ts-ignore
              //  nativeView.mason_replaceChildAtText(node.text || '', index);
              nativeView.mason_replaceChildAtText(node.text || '', index);
            }
          });
        }
      } else {
        // will replace all nodes with a new text node
        // nativeView.text = value;
      }
    }
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

    for (const child of this._children) {
      layout = children.objectAtIndex(i);
      const x = layout.x;
      const y = layout.y;
      const width = x + layout.width;
      const height = y + layout.height;
      View.layoutChild(this as never, child, x, y, width, height);
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
          // @ts-ignore
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

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view;
    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      if (atIndex <= -1) {
        nativeView.addView(child.nativeViewProtected);
      } else {
        nativeView.addViewAt(child.nativeViewProtected, atIndex);
      }
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
