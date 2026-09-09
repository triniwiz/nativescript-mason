import { CSSType, Utils } from '@nativescript/core';
import { TextAreaBase, rowsProperty, colsProperty, maxLengthProperty } from './common';
import { defaultValueProperty, getValueProperty, setValueProperty, placeholderProperty } from '../input/common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { Style } from '../style';

@CSSType('textarea')
export class TextArea extends TextAreaBase {
  [style_];
  _inBatch = false;

  constructor() {
    super();
    this[isMasonView_] = true;
  }

  [defaultValueProperty]() {
    return '';
  }

  [getValueProperty]() {
    return this._view.value;
  }

  [setValueProperty](value) {
    this._view.value = value;
  }

  [placeholderProperty.setNative](value) {
    if (this._view) {
      this._view.placeholder = value;
    }
  }

  [rowsProperty.setNative](value) {
    if (this._view) {
      this._view.rows = value;
    }
  }

  [colsProperty.setNative](value) {
    if (this._view) {
      this._view.cols = value;
    }
  }

  [maxLengthProperty.setNative](value) {
    if (this._view) {
      this._view.maxLength = value;
    }
  }

  get _view() {
    if (!this[native_]) {
      const view = Tree.instance.createTextArea() as never;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as MasonTextArea;
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
  // @ts-ignore
  get ios() {
    return this._view;
  }

  public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
    const nativeView = this._view;
    if (nativeView) {
      const specWidth = Utils.layout.getMeasureSpecSize(widthMeasureSpec);
      const widthMode = Utils.layout.getMeasureSpecMode(widthMeasureSpec);
      const specHeight = Utils.layout.getMeasureSpecSize(heightMeasureSpec);
      const heightMode = Utils.layout.getMeasureSpecMode(heightMeasureSpec);

      if (!this[isMasonView_]) {
        const unconstrained = widthMode === Utils.layout.UNSPECIFIED || heightMode === Utils.layout.UNSPECIFIED || (widthMode === Utils.layout.AT_MOST && specWidth === 0) || (heightMode === Utils.layout.AT_MOST && specHeight === 0);

        // Compute against the parent's bounds whenever the spec gives any; see
        // view/index.ios.ts for why auto/auto doesn't matter here.
        if (!unconstrained) {
          // @ts-ignore
          this.ios.mason_computeWithSize(specWidth, specHeight);
          // Claim this root for the host's spec; see view/index.ios.ts.
          // @ts-ignore
          this.ios.mason_markRootComputeAppliedWithSize(specWidth, specHeight);
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
        let layout = this.ios.node.computedLayout;

        /*
        // If the parent Mason document hasn't run a compute pass yet,
        // computedLayout is still MasonLayout.empty (0×0).  Trigger a compute
        // now so NativeScript never assigns a zero frame to this view, which
        // would make it invisible (UIScrollView.clipsToBounds = true).
        if (layout.width === 0 && layout.height === 0) {
          const unconstrained =
            widthMode === Utils.layout.UNSPECIFIED ||
            heightMode === Utils.layout.UNSPECIFIED ||
            (widthMode === Utils.layout.AT_MOST && specWidth === 0) ||
            (heightMode === Utils.layout.AT_MOST && specHeight === 0);

          if (!unconstrained) {
            // @ts-ignore
            this.ios.mason_computeWithSize(specWidth, specHeight);
          } else {
            // @ts-ignore
            this.ios.mason_computeWithMaxContent();
          }
          // @ts-ignore
          layout = this.ios.node.computedLayout;
        }
        */

        const w = Utils.layout.makeMeasureSpec(layout.width, Utils.layout.EXACTLY);
        const h = Utils.layout.makeMeasureSpec(layout.height, Utils.layout.EXACTLY);
        this.setMeasuredDimension(w, h);
      }
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    // nativeView.frame = frame;
  }
}
