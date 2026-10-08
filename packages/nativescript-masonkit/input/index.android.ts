import { Color, CSSType, Utils } from '@nativescript/core';
import { placeholderColorProperty } from '@nativescript/core/ui/editable-text-base';
import { acceptProperty, defaultValueProperty, getCheckedProperty, getValueProperty, InputElementBase, multipleProperty, setCheckedProperty, setValueProperty, placeholderProperty, typeProperty } from './common';
import { Tree } from '../tree';
import { Style } from '../style';
import { style_, isMasonView_, native_ } from '../symbols';
import { InputType } from '..';

@CSSType('input')
export class Input extends InputElementBase {
  [style_];
  _inBatch = false;
  constructor() {
    super();
    this[isMasonView_] = true;
  }

  private getType(): org.nativescript.mason.masonkit.Input.Type {
    switch (this.type) {
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
      case 'search':
        return org.nativescript.mason.masonkit.Input.Type.Search;
      case 'time':
        return org.nativescript.mason.masonkit.Input.Type.Time;
      case 'datetime-local':
        return org.nativescript.mason.masonkit.Input.Type.DatetimeLocal;
      case 'month':
        return org.nativescript.mason.masonkit.Input.Type.Month;
      case 'week':
        return org.nativescript.mason.masonkit.Input.Type.Week;
      case 'color':
        return org.nativescript.mason.masonkit.Input.Type.Color;
      case 'file':
        return org.nativescript.mason.masonkit.Input.Type.File;
      case 'submit':
        return org.nativescript.mason.masonkit.Input.Type.Submit;
      case 'reset':
        return org.nativescript.mason.masonkit.Input.Type.Reset;
    }
    return org.nativescript.mason.masonkit.Input.Type.Text;
  }

  [multipleProperty.setNative](value) {
    if (this._view) {
      //@ts-ignore
      this._view.setMultiple(value);
    }
  }

  [acceptProperty.setNative](value: string) {
    if (this._view) {
      this._view.setAccept(value);
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

  [getCheckedProperty]() {
    return this._view.getChecked();
  }

  [setCheckedProperty](checked: boolean) {
    this._view.setChecked(checked);
  }

  [typeProperty.setNative](value: InputType) {
    if (this._view) {
      this._view.setType(this.getType());
    }
  }

  [placeholderProperty.setNative](value: string) {
    if (this._view) {
      this._view.setPlaceholder(value);
    }
  }

  // Core's placeholder-color (also what ::placeholder { color } compiles to), as on TextField.
  [placeholderColorProperty.getDefault]() {
    return this._view.getPlaceholderTextColors();
  }

  [placeholderColorProperty.setNative](value: Color | android.content.res.ColorStateList) {
    if (value instanceof Color) {
      this._view.setPlaceholderTextColor(value.android);
    } else {
      this._view.setPlaceholderTextColor(value);
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
      const view = Tree.instance.createInputView(context, this.type) as never;
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
