import { booleanConverter, Property } from '@nativescript/core';
import { ViewBase } from '../common';
import { InputType } from '..';
import { native_ } from '../symbols';

export const defaultValueProperty = Symbol('input:default:value');
export const getValueProperty = Symbol('input:get:value');
export const setValueProperty = Symbol('input:set:value');
export const pendingValue = Symbol('input:pending:value');
export const getCheckedProperty = Symbol('input:get:checked');
export const setCheckedProperty = Symbol('input:set:checked');
export const pendingChecked = Symbol('input:pending:checked');
export const syncCheckedProperty = Symbol('input:sync:checked');
const checkedState = Symbol('input:checked');

function isCheckable(type: InputType): boolean {
  return type === 'checkbox' || type === 'radio';
}

export class InputBase extends ViewBase {
  declare type: InputType;
  [pendingValue] = null;

  [defaultValueProperty]() {
    return undefined;
  }

  [getValueProperty]() {
    return undefined;
  }

  //@ts-ignore
  [setValueProperty](value: string) {}

  get value() {
    if (!this[native_]) {
      if (this[pendingValue] !== null) {
        return this[pendingValue];
      }
      const defaultValue = this[defaultValueProperty];
      return defaultValue != null ? defaultValue() : undefined;
    }

    return this[getValueProperty]();
  }

  // As on the web, value is always a string, and null clears it.
  set value(value: string) {
    const text = value == null ? '' : String(value);
    if (!this[native_]) {
      this[pendingValue] = text;
      return;
    }
    this[setValueProperty](text);
  }

  initNativeView() {
    super.initNativeView();
    if (this[pendingValue] !== null) {
      this[setValueProperty](this[pendingValue]);
      this[pendingValue] = null;
    }
  }
}

/** HTMLInputElement's state beyond `value`; `<textarea>` has none of it. */
export class InputElementBase extends InputBase {
  [pendingChecked]: boolean | null = null;
  [checkedState]: boolean = false;

  // iOS and Windows have no native checked state. It lives here, and a checkbox or radio
  // mirrors it into the "true"/"false" value those controls store it in.
  [getCheckedProperty](): boolean {
    return isCheckable(this.type) ? this[getValueProperty]() === 'true' : (this[checkedState] as boolean);
  }

  //@ts-ignore
  [setCheckedProperty](checked: boolean) {
    this[checkedState] = checked;
    if (isCheckable(this.type)) {
      this[setValueProperty](String(checked));
    }
  }

  /** For platforms without a native checked state, after the native `type` changes. */
  [syncCheckedProperty]() {
    if (isCheckable(this.type)) {
      this[setValueProperty](String(this[checkedState]));
    }
  }

  get checked(): boolean {
    if (!this[native_]) {
      return this[pendingChecked] ?? false;
    }
    return this[getCheckedProperty]();
  }

  set checked(checked: boolean) {
    const value = !!checked;
    if (!this[native_]) {
      this[pendingChecked] = value;
      return;
    }
    this[setCheckedProperty](value);
  }

  initNativeView() {
    super.initNativeView();
    if (this[pendingChecked] !== null) {
      this[setCheckedProperty](this[pendingChecked]);
      this[pendingChecked] = null;
    }
  }
}

export const typeProperty = new Property<InputBase, InputType>({
  name: 'type',
  defaultValue: 'text',
});

typeProperty.register(InputBase);

export const placeholderProperty = new Property<InputBase, string>({
  name: 'placeholder',
  defaultValue: '',
});

placeholderProperty.register(InputBase);

export const multipleProperty = new Property<InputBase, boolean>({
  name: 'multiple',
  defaultValue: false,
  valueConverter: booleanConverter,
});

multipleProperty.register(InputBase);

export const acceptProperty = new Property<InputBase, string>({
  name: 'accept',
  defaultValue: '*/*',
});

acceptProperty.register(InputBase);
