import { booleanConverter, CssProperty, Property, Style } from '@nativescript/core';
import { ViewBase } from '../common';
import { InputType } from '..';
import { native_ } from '../symbols';

export const defaultValueProperty = Symbol('input:default:value');
export const getValueProperty = Symbol('input:get:value');
export const setValueProperty = Symbol('input:set:value');
const defaultValueState = Symbol('input:default:state');
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
  [pendingValue]: any = null;

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
      const defaultValue = this[defaultValueProperty] as any;
      return (defaultValue != null ? defaultValue() : undefined) as any;
    }

    return this[getValueProperty]() as any;
  }

  // As on the web, value is always a string, and null clears it.
  set value(value: string) {
    const text = value == null ? '' : String(value);
    if (!this[native_]) {
      this[pendingValue] = text;
      return;
    }
    // Setting the text it already has is a no-op, as in the DOM: writing it
    // back would move the caret, which breaks frameworks that sync `value`
    // after every keystroke (React, Vue v-model, ...).
    if (this[getValueProperty]() === text) {
      return;
    }
    this[setValueProperty](text);
  }

  // `any`: core types setNative keys as plain `symbol`, so ViewBase has a symbol index signature without `string`.
  [defaultValueState]: any = null;

  /**
   * As on the web: the initial value. It sets `value` while the field still
   * holds what `defaultValue` last put there, i.e. until the user or code
   * changes it.
   */
  get defaultValue(): string {
    return this[defaultValueState] ?? '';
  }

  set defaultValue(value: string) {
    const text = value == null ? '' : String(value);
    const current = this.value ?? '';
    const untouched = current === '' || current === (this[defaultValueState] ?? '');
    this[defaultValueState] = text;
    if (untouched) {
      this.value = text;
    }
  }

  initNativeView() {
    super.initNativeView();
    if (this[pendingValue] !== null) {
      this[setValueProperty](this[pendingValue]);
      this[pendingValue] = null;
    }
  }
}

/**
 * Radios sharing a `name`, by name: checking one unchecks the others, as in a
 * document. Only loaded inputs belong, as for `<details name>`.
 */
const radioGroups = new Map<string, Set<InputElementBase>>();

function radioGroup(name: string): Set<InputElementBase> {
  let group = radioGroups.get(name);
  if (!group) {
    group = new Set();
    radioGroups.set(name, group);
  }
  return group;
}

/** HTMLInputElement's state beyond `value`; `<textarea>` has none of it. */
export class InputElementBase extends InputBase {
  /** A radio's group: checking it unchecks the other loaded radios with this name. */
  declare name: string;
  //@ts-ignore
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
    // Code and native taps both come through here.
    if (checked && this.type === 'radio') this._uncheckOtherRadios();
    if (checked === this.cssPseudoClasses.has('checked')) return;
    if (checked) {
      this.addPseudoClass('checked');
    } else {
      this.deletePseudoClass('checked');
    }
  }

  /** As in a document, silently: the others fire no `change`. */
  _uncheckOtherRadios() {
    if (!this.name) return;
    for (const other of radioGroup(this.name)) {
      if (other !== this && other.type === 'radio' && other.checked) other.checked = false;
    }
  }

  _onNameChanged(oldValue: string, newValue: string) {
    if (!this.isLoaded) return;
    if (oldValue) radioGroup(oldValue).delete(this);
    if (newValue) radioGroup(newValue).add(this);
    if (newValue && this.type === 'radio' && this.checked) this._uncheckOtherRadios();
  }

  onLoaded() {
    super.onLoaded();
    if (!this.name) return;
    radioGroup(this.name).add(this);
    // A checked radio that joins a group wins, as one inserted into a document does.
    if (this.type === 'radio' && this.checked) this._uncheckOtherRadios();
  }

  onUnloaded() {
    if (this.name) {
      const group = radioGroup(this.name);
      group.delete(this);
      if (!group.size) radioGroups.delete(this.name);
    }
    super.onUnloaded();
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

export const nameProperty = new Property<InputElementBase, string>({
  name: 'name',
  defaultValue: '',
  valueChanged: (target, oldValue, newValue) => target._onNameChanged(oldValue, newValue),
});

nameProperty.register(InputElementBase);

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
