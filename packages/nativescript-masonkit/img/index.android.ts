import { CSSType, knownFolders, PropertyChangeData, Utils } from '@nativescript/core';
import { ImageBase, srcProperty } from '../common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';

declare const kotlin: any;

const enum LoadingState {
  Loading = 0,
  Loaded = 1,
}

@CSSType('img')
export class Img extends ImageBase {
  [style_];
  _inBatch = false;
  private _nativeSrc: string;
  constructor() {
    super();
    this[isMasonView_] = true;
    this.on('srcChange', this._loadSrcWhileDetached, this);
  }

  private _loadSrcWhileDetached(args: PropertyChangeData) {
    if (!this.nativeViewProtected) this[srcProperty.setNative](args.value);
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createImageView(context) as org.nativescript.mason.masonkit.Img;
      const owner = new WeakRef(this);
      view.setOnStateChange(
        new kotlin.jvm.functions.Function1({
          invoke(state: org.nativescript.mason.masonkit.LoadingState) {
            const img = owner.get();
            const value = state.getValue();
            if (img && value !== LoadingState.Loading) img.notify({ eventName: value === LoadingState.Loaded ? 'load' : 'error', object: img });
            return null;
          },
        }),
      );
      this[native_] = view;
      return view;
    }
    return this[native_] as org.nativescript.mason.masonkit.Img;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view;
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
    if (value === this._nativeSrc) return;
    const nativeView = this._view as org.nativescript.mason.masonkit.Img;
    if (nativeView) {
      this._nativeSrc = value;
      if (typeof value === 'string' && value.startsWith('~/')) {
        nativeView.setSrc(knownFolders.currentApp().path + '/' + value.slice(2));
      } else {
        nativeView.setSrc(value);
      }
    }
  }
}
