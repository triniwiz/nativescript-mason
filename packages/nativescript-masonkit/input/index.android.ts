import { CSSType, Utils } from '@nativescript/core';
import { InputBase } from './common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';
import { placeholderProperty, typeProperty } from './common';
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
    }
    return org.nativescript.mason.masonkit.Input.Type.Text;
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
