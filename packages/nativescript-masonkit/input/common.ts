import { booleanConverter, Property } from '@nativescript/core';
import { ViewBase } from '../common';
import { InputType } from '..';

export class InputBase extends ViewBase {}

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

export const valueProperty = new Property<InputBase, string>({
  name: 'value',
});

valueProperty.register(InputBase);

export const multipleProperty = new Property<InputBase, boolean>({
  name: 'multiple',
  defaultValue: false,
  valueConverter: booleanConverter,
});

multipleProperty.register(InputBase);
