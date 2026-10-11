import { booleanConverter, CssProperty, Property, Style } from '@nativescript/core';
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
export const syncCheckedPseudoClass = Symbol('input:sync:checked');
const checkedState = Symbol('input:checked');

export type InputAppearance = 'auto' | 'none';

/**
 * CSS `appearance`. Only `none` turns the native control off; `menulist-button`, `textfield`
 * and every other keyword render the control as `auto` does.
 */
export function parseAppearance(value: unknown): InputAppearance {
  return typeof value === 'string' && value.trim().toLowerCase() === 'none' ? 'none' : 'auto';
}

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

  [getCheckedProperty](): boolean {
    return this[checkedState];
  }

  //@ts-ignore
  [setCheckedProperty](checked: boolean) {
    this[checkedState] = checked;
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
    } else {
      this[setCheckedProperty](value);
    }
    this[syncCheckedPseudoClass]();
  }

  /**
   * `:checked` matches a checked checkbox or radio, as on the web. The native view reports a
   * tap through this too, so stylesheet rules like `.check:checked` follow the user.
   */
  [syncCheckedPseudoClass]() {
    const checked = isCheckable(this.type) && this.checked;
    if (checked === this.cssPseudoClasses.has('checked')) return;
    if (checked) {
      this.addPseudoClass('checked');
    } else {
      this.deletePseudoClass('checked');
    }
  }

  initNativeView() {
    super.initNativeView();
    if (this[pendingChecked] !== null) {
      this[setCheckedProperty](this[pendingChecked]);
      this[pendingChecked] = null;
    }
    this[syncCheckedPseudoClass]();
  }
}

export const typeProperty = new Property<InputBase, InputType>({
  name: 'type',
  defaultValue: 'text',
  // `:checked` only matches a checkbox or radio.
  valueChanged(target) {
    (target as InputElementBase)[syncCheckedPseudoClass]?.();
  },
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

/**
 * `appearance: none` drops a checkbox's or radio's native control, so the element draws as its
 * CSS box (background, border, border-radius) and its CSS size alone decides how big it is.
 */
export const appearanceProperty = new CssProperty<Style, InputAppearance>({
  name: 'appearance',
  cssName: 'appearance',
  defaultValue: 'auto',
  valueConverter: parseAppearance,
});

appearanceProperty.register(Style);
