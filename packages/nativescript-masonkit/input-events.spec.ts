import { describe, expect, it, vi } from 'vitest';
import { native_ } from './symbols';
import { Event } from './common';
import { Input } from './input';

function inputWithNative(nativeView: Record<string, unknown>) {
  const input = new Input() as any;
  input[native_] = nativeView;
  return input;
}

describe('textChange, for renderers that bind onChange to it', () => {
  it('fires with every input event, carrying the value', () => {
    const input = inputWithNative({ getValue: () => 'hello', setValue: vi.fn() });
    const onChange = vi.fn();
    input.on('textChange', onChange);
    input.notify({ eventName: 'input', object: input });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ object: input, value: 'hello', propertyName: 'text' });
  });

  it('adds the value to a Mason event without touching its read-only fields', () => {
    const input = inputWithNative({ getValue: () => 'typed', setValue: vi.fn() });
    const onChange = vi.fn();
    input.on('textChange', onChange);
    // What the native input listener hands over: a Mason Event, whose object is a getter.
    const event = new Event() as any;
    event._target = input;
    const [listener] = (input as any)._textChangeListeners.values();
    listener.call(input, event);
    expect(onChange).toHaveBeenLastCalledWith(event);
    expect(event.value).toBe('typed');
    expect(event.object).toBe(input);
  });

  it('is removed with off(), with or without the callback', () => {
    const input = inputWithNative({ getValue: () => '', setValue: vi.fn() });
    const a = vi.fn();
    const b = vi.fn();
    input.on('textChange', a);
    input.on('textChange', b);
    input.off('textChange', a);
    input.notify({ eventName: 'input', object: input });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    input.off('textChange');
    input.notify({ eventName: 'input', object: input });
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('leaves input listeners alone', () => {
    const input = inputWithNative({ getValue: () => '', setValue: vi.fn() });
    const onInput = vi.fn();
    input.on('input', onInput);
    input.on('textChange', vi.fn());
    input.off('textChange');
    input.notify({ eventName: 'input', object: input });
    expect(onInput).toHaveBeenCalledTimes(1);
  });
});
