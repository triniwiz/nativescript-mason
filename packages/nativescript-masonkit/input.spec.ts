import { describe, expect, it, vi } from 'vitest';
import { native_ } from './symbols';
import { Input } from './input';
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
