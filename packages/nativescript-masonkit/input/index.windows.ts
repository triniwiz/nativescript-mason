import { Color, CSSType, fontInternalProperty } from '@nativescript/core';
import { placeholderColorProperty } from '@nativescript/core/ui/editable-text-base/editable-text-base-common';
import { ViewBase, windowsFontSource } from '../common';
import { acceptProperty, defaultValueProperty, getCheckedProperty, getValueProperty, InputElementBase, multipleProperty, setCheckedProperty, setValueProperty, placeholderProperty, typeProperty } from './common';
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

type UaKind = 'field' | 'button' | 'swatch' | 'bare';

function uaKind(type: InputType): UaKind {
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'tel':
    case 'url':
    case 'number':
    case 'search':
    case 'datetime-local':
    case 'month':
    case 'week':
      return 'field';
    case 'button':
    case 'submit':
    case 'reset':
      return 'button';
    case 'color':
      return 'swatch';
    default:
      return 'bare';
  }
}

function ua(top: number, right: number, border: string, radius: number, background: string, align: string): Record<string, unknown> {
  return {
    'padding-top': top,
    'padding-right': right,
    'padding-bottom': top,
    'padding-left': right,
    border,
    'border-top-left-radius': radius,
    'border-top-right-radius': radius,
    'border-bottom-right-radius': radius,
    'border-bottom-left-radius': radius,
    'background-color': background,
    'text-align': align,
  };
}

const UA_STYLES: Record<UaKind, Record<string, unknown>> = {
  field: ua(1, 2, '1 solid #767676', 4, 'transparent', 'left'),
  button: ua(1, 6, '1 solid #767676', 4, '#efefef', 'center'),
  swatch: ua(5, 4, '1 solid #767676', 4, '#efefef', 'center'),
  bare: ua(0, 0, 'none', 0, 'transparent', 'left'),
};

const PREFLIGHT_RESET = /^padding-/;

@CSSType('input')
export class Input extends InputElementBase {
  [style_];
  constructor() {
    super();
    this[isMasonView_] = true;
    this.applyUaStyle('text');
  }

  get _view(): NativeScript.Mason.Input {
    if (!this[native_]) {
      const view = Tree.instance.createInputView() as never as NativeScript.Mason.Input;
      view.Type = typeToInt(this.type);
      this[native_] = view as never;
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

  private _uaKind: UaKind = null;

  private applyUaStyle(type: InputType) {
    const kind = uaKind(type);
    if (kind === this._uaKind) return;
    this._uaKind = kind;
    const style = this.style as unknown as Record<string, unknown>;
    const declarations = UA_STYLES[kind];
    for (const property in declarations) {
      if (ViewBase.preflight && PREFLIGHT_RESET.test(property)) continue;
      style[`css:${property}`] = declarations[property];
    }
  }

  [typeProperty.setNative](value: InputType) {
    this.applyUaStyle(value);
    if (this._view) this._view.Type = typeToInt(value);
  }

  [getCheckedProperty]() {
    return this._view.Checked;
  }

  [setCheckedProperty](checked: boolean) {
    this._view.Checked = checked;
  }

  [placeholderColorProperty.setNative](value: Color) {
    if (value instanceof Color) this._view.SetPlaceholderColor(value.argb >>> 0);
    else this._view.ClearPlaceholderColor();
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
