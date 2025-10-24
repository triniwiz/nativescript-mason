import { Utils } from '@nativescript/core';
import { isMasonView_, style_, textProperty, ViewBase } from '../common';
import { Style } from '../style';
import { Tree } from '../tree';

export class Scroll extends ViewBase {
  [style_];
  private _view: org.nativescript.mason.masonkit.Scroll;
  _inBatch = false;
  constructor() {
    super();
    this._view = Tree.instance.createView(Utils.android.getCurrentActivity() || Utils.android.getApplicationContext()) as never;
    this[isMasonView_] = true;
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

  set text(value) {
    const nativeView = this._view;
    if (nativeView) {
      // hacking vue3 to handle text nodes
      if (global.VUE3_ELEMENT_REF) {
        const view_ref = this[global.VUE3_ELEMENT_REF] as any;
        if (Array.isArray(view_ref.childNodes)) {
          if (view_ref.childNodes.length === 0) {
            nativeView.replaceChildAt(value || '', -1);
            return;
          }

          (view_ref.childNodes as any[]).forEach((node, index) => {
            if (node.nodeType === 'text') {
              nativeView.replaceChildAt(node.text || '', index);
            }
          });
        }
      } else {
        // will replace all nodes with a new text node
        // nativeView.setTextContent(value);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view as org.nativescript.mason.masonkit.Scroll;
  }

  // @ts-ignore
  public _addViewToNativeVisualTree(child: MasonChild, atIndex = -1): boolean {
    const nativeView = this._view as org.nativescript.mason.masonkit.Scroll;

    if (nativeView && child.nativeViewProtected) {
      child._hasNativeView = true;
      child._isMasonChild = true;
      nativeView.addView(child.nativeViewProtected, (atIndex ?? -1) as never);
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
