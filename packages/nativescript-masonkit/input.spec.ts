import { describe, expect, it, vi } from 'vitest';
import { native_ } from './symbols';
import { Input } from './input';
import { TextArea } from './textarea';
import { acceptProperty, multipleProperty } from './input/common';

function inputWithNative(nativeView: Record<string, unknown>) {
  const input = new Input() as any;
  input[native_] = nativeView;
  return input;
}

describe('HTML input property bridge', () => {
  it('forwards file accept and multiple to the native control', () => {
    const native = {
      setAccept: vi.fn(),
      setMultiple: vi.fn(),
    };
    const input = inputWithNative(native);

    input[acceptProperty.setNative]('image/*');
    input[multipleProperty.setNative](true);

    expect(native.setAccept).toHaveBeenCalledWith('image/*');
    expect(native.setMultiple).toHaveBeenCalledWith(true);
  });

  it('keeps text input attributes available before native view creation', () => {
    const input = new Input() as any;

    input.value = 'hello';
    input.placeholder = 'Search';
    input.type = 'search';

    expect(input.value).toBe('hello');
    expect(input.placeholder).toBe('Search');
    expect(input.type).toBe('search');
  });
});

describe('Input.checked', () => {
  it('is a boolean held apart from value before the native view exists', () => {
    const input = new Input() as any;
    input.type = 'checkbox';

    expect(input.checked).toBe(false);
    input.value = 'on';
    input.checked = 1;

    expect(input.checked).toBe(true);
    expect(input.value).toBe('on');
  });

  it('reads and writes the native checked state', () => {
    let state = false;
    const native = {
      getChecked: vi.fn(() => state),
      setChecked: vi.fn((v: boolean) => (state = v)),
      getValue: vi.fn(() => 'on'),
      setValue: vi.fn(),
    };
    const input = inputWithNative(native);

    input.checked = true;

    expect(native.setChecked).toHaveBeenCalledWith(true);
    expect(native.setValue).not.toHaveBeenCalled();
    expect(input.checked).toBe(true);
  });
});

describe('Input.value', () => {
  it('never hands the native setter a non-string', () => {
    const native = { setValue: vi.fn(), getValue: vi.fn() };
    const input = inputWithNative(native);

    input.value = true;
    input.value = 42;
    input.value = null;

    expect(native.setValue.mock.calls).toEqual([['true'], ['42'], ['']]);
  });
});

describe('TextArea', () => {
  it('has value but no checked, as on the web', () => {
    const textarea = new TextArea() as any;
    expect('value' in textarea).toBe(true);
    expect('checked' in textarea).toBe(false);
  });
});
