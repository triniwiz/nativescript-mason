import { describe, expect, it } from 'vitest';
import { defineModelAccessor, MODEL_PROP } from './v-model';

class FakeInput {
  type = 'text';
  value = '';
  checked = false;
}

defineModelAccessor(FakeInput);

describe('v-model accessor', () => {
  it('binds a checkbox or radio to checked, leaving value alone', () => {
    for (const type of ['checkbox', 'radio']) {
      const input = new FakeInput() as any;
      input.type = type;
      input.value = 'on';

      input[MODEL_PROP] = true;

      expect(input.checked).toBe(true);
      expect(input[MODEL_PROP]).toBe(true);
      expect(input.value).toBe('on');
    }
  });

  it('binds every other type to value', () => {
    const input = new FakeInput() as any;
    input.type = 'range';

    input[MODEL_PROP] = '80';

    expect(input.value).toBe('80');
    expect(input.checked).toBe(false);
    expect(input[MODEL_PROP]).toBe('80');
  });

  it('defines the accessor once per class', () => {
    const before = Object.getOwnPropertyDescriptor(FakeInput.prototype, MODEL_PROP)?.get;
    defineModelAccessor(FakeInput);
    expect(Object.getOwnPropertyDescriptor(FakeInput.prototype, MODEL_PROP)?.get).toBe(before);
  });
});
