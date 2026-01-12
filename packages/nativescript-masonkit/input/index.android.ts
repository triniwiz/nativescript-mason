import { CSSType, Utils } from '@nativescript/core';
import { defaultValueProperty, getValueProperty, InputBase, multipleProperty, setValueProperty, placeholderProperty, typeProperty } from './common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';
import { InputType } from '..';

@CSSType('input')
export class Input extends InputBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  private _type: InputType = 'text';

  private getType(): org.nativescript.mason.masonkit.Input.Type {
    switch (this._type) {
      case 'text':
        return org.nativescript.mason.masonkit.Input.Type.Text;
      case 'button':
        return org.nativescript.mason.masonkit.Input.Type.Button;
      case 'checkbox':
        return org.nativescript.mason.masonkit.Input.Type.Checkbox;
      case 'email':
        return org.nativescript.mason.masonkit.Input.Type.Email;
      case 'password':
        return org.nativescript.mason.masonkit.Input.Type.Password;
      case 'date':
        return org.nativescript.mason.masonkit.Input.Type.Date;
      case 'radio':
        return org.nativescript.mason.masonkit.Input.Type.Radio;
      case 'number':
        return org.nativescript.mason.masonkit.Input.Type.Number;
      case 'range':
        return org.nativescript.mason.masonkit.Input.Type.Range;
      case 'tel':
        return org.nativescript.mason.masonkit.Input.Type.Tel;
      case 'url':
        return org.nativescript.mason.masonkit.Input.Type.Url;
      case 'color':
        return org.nativescript.mason.masonkit.Input.Type.Color;
      case 'file':
        return org.nativescript.mason.masonkit.Input.Type.File;
      case 'submit':
        return org.nativescript.mason.masonkit.Input.Type.Submit;
    }
    return org.nativescript.mason.masonkit.Input.Type.Text;
  }

  [multipleProperty.setNative](value) {
    this._type = value;
    if (this._view) {
      //@ts-ignore
      this._view.setMultiple(value);
    }
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

  [typeProperty.setNative](value: InputType) {
    this._type = value;
    if (this._view) {
      this._view.setType(this.getType());
    }
  }

  [placeholderProperty.setNative](value: string) {
    if (this._view) {
      this._view.setPlaceholder(value);
    }
  }

  set valueAsNumber(value: number) {
    if (this._view) {
      this._view.setValueAsNumber(value);
    }
  }

  get valueAsNumber(): number {
    return this._view ? this._view.getValueAsNumber() : NaN;
  }

  set valueAsDate(value: Date | null) {
    if (this._view) {
      this._view.setValueAsDate(Utils.dataSerialize(value));
    }
  }

  get valueAsDate(): Date | null {
    return this._view ? Utils.dataDeserialize(this._view.getValueAsDate()) : null;
  }

  get _view() {
    if (!this[native_]) {
      const context = Utils.android.getCurrentActivity() || Utils.android.getApplicationContext();
      const view = Tree.instance.createInputView(context, this._type) as never;
      this[native_] = view;
      return view;
    }
    return this[native_] as never as org.nativescript.mason.masonkit.Input;
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
    return this._view as org.nativescript.mason.masonkit.Input;
  }
}
