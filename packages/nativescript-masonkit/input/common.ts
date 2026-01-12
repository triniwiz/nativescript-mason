import { booleanConverter, Property } from '@nativescript/core';
import { ViewBase } from '../common';
import { InputType } from '..';
import { native_ } from '../symbols';

export const defaultValueProperty = Symbol('input:default:value');
export const getValueProperty = Symbol('input:get:value');
export const setValueProperty = Symbol('input:set:value');
export const pendingValue = Symbol('input:pending:value');

export class InputBase extends ViewBase {
  [pendingValue] = null;

  [defaultValueProperty]() {
    return undefined;
  }

  [getValueProperty]() {
    return undefined;
  }

  [setValueProperty](value: string) {}

  get value() {
    if (!this[native_]) {
      const defaultValue = this[defaultValueProperty];
      return defaultValue !== undefined || defaultValue !== null ? defaultValue() : undefined;
    }

    return this[getValueProperty]();
  }

  set value(value: string) {
    if (!this[native_]) {
      this[pendingValue] = value;
      return;
    }
    this[setValueProperty](value);
  }

  initNativeView() {
    super.initNativeView();
    if (this[pendingValue] !== null) {
      this[setValueProperty](this[pendingValue]);
      this[pendingValue] = null;
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
