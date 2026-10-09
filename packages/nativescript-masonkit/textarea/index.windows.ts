import { CSSType, fontInternalProperty } from '@nativescript/core';
import { windowsFontSource } from '../common';
import { TextAreaBase, rowsProperty, colsProperty, maxLengthProperty } from './common';
import { defaultValueProperty, getValueProperty, setValueProperty, placeholderProperty } from '../input/common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { Style } from '../style';

@CSSType('textarea')
export class TextArea extends TextAreaBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.TextArea {
    if (!this[native_]) {
      this[native_] = Tree.instance.createTextArea() as never;
    }
    return this[native_] as never as NativeScript.Mason.TextArea;
  }

  // @ts-ignore
  get windows() {
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

  [defaultValueProperty]() {
    return '';
  }

  [getValueProperty]() {
    return this._view?.Value ?? '';
  }

  [setValueProperty](value) {
    if (this._view) this._view.Value = value ?? '';
  }

  [placeholderProperty.setNative](value) {
    if (this._view) this._view.Placeholder = value ?? '';
  }

  [rowsProperty.setNative](value) {
    if (this._view) this._view.Rows = value | 0;
  }

  [colsProperty.setNative](value) {
    if (this._view) this._view.Cols = value | 0;
  }

  [maxLengthProperty.setNative](value) {
    if (this._view) this._view.MaxLength = value | 0;
  }

  [fontInternalProperty.setNative](value: any) {
    this._view?.SetFontFamily(windowsFontSource(value));
  }
}
