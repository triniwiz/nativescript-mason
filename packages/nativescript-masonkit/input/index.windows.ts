import { CSSType } from '@nativescript/core';
import { acceptProperty, defaultValueProperty, getValueProperty, InputElementBase, multipleProperty, setValueProperty, placeholderProperty, typeProperty } from './common';
import { style_, isMasonView_, native_ } from '../symbols';
import { Tree } from '../tree';
import { InputType } from '..';
import { Style } from '../style';

function typeToInt(t: InputType): number {
  switch (t) {
    case 'text':
      return 0;
    case 'button':
      return 1;
    case 'checkbox':
      return 2;
    case 'email':
      return 3;
    case 'password':
      return 4;
    case 'date':
      return 5;
    case 'radio':
      return 6;
    case 'number':
      return 7;
    case 'range':
      return 8;
    case 'tel':
      return 9;
    case 'url':
      return 10;
    case 'color':
      return 11;
    case 'file':
      return 12;
    case 'submit':
      return 13;
    default:
      return 0;
  }
}

@CSSType('input')
export class Input extends InputElementBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  get _view(): NativeScript.Mason.Input {
    if (!this[native_]) {
      this[native_] = Tree.instance.createInputView() as never;
    }
    return this[native_] as never as NativeScript.Mason.Input;
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

  [typeProperty.setNative](value: InputType) {
    if (this._view) this._view.Type = typeToInt(value);
  }

  [placeholderProperty.setNative](value) {
    if (this._view) this._view.Placeholder = value ?? '';
  }

  [multipleProperty.setNative](value) {
    if (this._view) this._view.Multiple = !!value;
  }

  [acceptProperty.setNative](value) {
    if (this._view) this._view.Accept = value ?? '';
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
}
