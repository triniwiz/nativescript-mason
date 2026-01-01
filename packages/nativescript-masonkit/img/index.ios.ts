import { CSSType, Utils } from '@nativescript/core';
import { ImageBase, srcProperty } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, isTextChild_, native_ } from '../symbols';

@CSSType('img')
export class Img extends ImageBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createImageView() as never as MasonImg;
      view.onStateChange = (state) => {
        this.requestLayout();
      };
      view.didLayout = () => {
        this.requestLayout();
      };
      this[native_] = view;
      return view;
    }
    return this[native_] as MasonImg;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get ios() {
    return this._view;
  }

  requestLayout(): void {
    if (this[isTextChild_] && '_view' in this.parent && this.parent[isMasonView_]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.parent._view.mason_requestLayout();
    }
    super.requestLayout();
  }

  get _styleHelper() {
    if (this[style_] === undefined) {
      this[style_] = Style.fromView(this as never, this._view);
    }
    return this[style_];
  }

  createNativeView() {
    return this._view;
  }

  [srcProperty.setNative](value) {
    const nativeView = this._view as MasonImg;
    if (nativeView) {
      nativeView.src = value;
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

          // @ts-ignore
          const layout = this.ios.mason_layout();

          const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
          const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

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
        }
      } else {
        // @ts-ignore
        const layout = this.ios.node.computedLayout;
        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);

        this.setMeasuredDimension(w, h);
      }
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }
}
