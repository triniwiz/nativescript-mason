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
    return this._view.getValue();
  }

  [setValueProperty](value) {
    this._view.setValue(value);
  }

  [placeholderProperty.setNative](value) {
    if (this._view) {
      this._view.setPlaceholder(value ?? '');
    }
  }

  [rowsProperty.setNative](value) {
    if (this._view) {
      this._view.setRows(value);
    }
  }

  [colsProperty.setNative](value) {
    if (this._view) {
      this._view.setCols(value);
    }
  }

  [maxLengthProperty.setNative](value) {
    if (this._view) {
      this._view.setMaxLength(value);
    }
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createTextArea(context) as never;
      this[native_] = view;
      return view;
    }
    return this[native_];
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get android() {
    return this._view;
  }
}
