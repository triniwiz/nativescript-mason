import { CSSType, fontInternalProperty } from '@nativescript/core';
import { windowsFontSource } from '../common';
import { acceptProperty, defaultValueProperty, getValueProperty, InputElementBase, syncCheckedProperty, multipleProperty, setValueProperty, placeholderProperty, typeProperty } from './common';
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
    case 'search':
      return 14;
    case 'time':
      return 15;
    case 'datetime-local':
      return 16;
    case 'month':
      return 17;
    case 'week':
      return 18;
    case 'reset':
      return 19;
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
    if (this._view) {
      this._view.Type = typeToInt(value);
      this[syncCheckedProperty]();
    }
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

  [fontInternalProperty.setNative](value: any) {
    this._view?.SetFontFamily(windowsFontSource(value));
  }

  get valueAsNumber(): number {
    const value = this.value ?? '';
    switch ((this as any).type as InputType) {
      case 'number':
      case 'range':
        return value === '' ? NaN : Number(value);
      case 'date':
        return value ? Date.parse(`${value}T00:00:00Z`) : NaN;
      case 'time': {
        const m = /^(\d{2}):(\d{2})/.exec(value);
        return m ? (Number(m[1]) * 60 + Number(m[2])) * 60000 : NaN;
      }
      default:
        return NaN;
    }
  }

  set valueAsNumber(value: number) {
    const valid = typeof value === 'number' && Number.isFinite(value);
    switch ((this as any).type as InputType) {
      case 'number':
      case 'range':
        this.value = valid ? String(value) : '';
        break;
      case 'date':
        this.value = valid ? new Date(value).toISOString().slice(0, 10) : '';
        break;
      case 'time': {
        if (!valid) {
          this.value = '';
          break;
        }
        const minutes = Math.floor(value / 60000) % 1440;
        this.value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
        break;
      }
    }
  }

  get valueAsDate(): Date | null {
    const type = (this as any).type as InputType;
    if (type !== 'date' && type !== 'time') return null;
    const n = this.valueAsNumber;
    return Number.isNaN(n) ? null : new Date(n);
  }

  set valueAsDate(value: Date | null) {
    this.valueAsNumber = value ? value.getTime() : NaN;
  }
}
