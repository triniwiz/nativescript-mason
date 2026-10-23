import { CSSType, knownFolders } from '@nativescript/core';
import { ImageBase, srcProperty, setMeasuredFromNative } from '../common';
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
      if (typeof value === 'string' && value.startsWith('~/')) {
        nativeView.src = knownFolders.currentApp().path + '/' + value.slice(2);
      } else {
        nativeView.src = value;
      }
    }
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, !this.parent?.[isMasonView_], false));
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    nativeView.frame = frame;
  }
}
