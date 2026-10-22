import { CSSType } from '@nativescript/core';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { TextAreaBase, rowsProperty, colsProperty, maxLengthProperty } from './common';
import { defaultValueProperty, getValueProperty, setValueProperty, placeholderProperty } from '../input/common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { setMeasuredFromNative } from '../common';
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

  // Core only disables a UIControl, and MasonTextArea is a text view.
  [isEnabledProperty.setNative](value: boolean) {
    if (this._view) {
      this._view.disabled = !value;
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
      // @ts-ignore
      setMeasuredFromNative(this, nativeView.mason_measure(widthMeasureSpec, heightMeasureSpec, !this.parent?.[isMasonView_], false));
    }
  }

  _setNativeViewFrame(nativeView: any, frame: CGRect): void {
    // nativeView.frame = frame;
  }
}
