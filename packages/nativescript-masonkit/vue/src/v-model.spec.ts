import { describe, expect, it } from 'vitest';
import { MODEL_PROP, withVueModel } from './v-model';

class FakeInput {
  value = '';
  checked = false;
  nativeViewProtected: unknown = undefined;
  #type = 'text';
  #listeners: Record<string, Array<() => void>> = {};

  get type() {
    return this.#type;
  }

  set type(type: string) {
    this.#type = type;
    for (const listener of this.#listeners.typeChange ?? []) listener();
  }

  on(eventName: string, callback: () => void) {
    (this.#listeners[eventName] ??= []).push(callback);
  }
}

const VueInput = withVueModel(FakeInput);
const settle = () => Promise.resolve();

describe('withVueModel', () => {
  it('routes a model set before type once the mount pass sets type', async () => {
    const input = new VueInput() as any;

    input[MODEL_PROP] = true;
    input.type = 'checkbox';
    await settle();

    expect(input.checked).toBe(true);
    expect(input.value).toBe('');
    expect(input[MODEL_PROP]).toBe(true);
  });

  it('binds every other type to value', async () => {
    const input = new VueInput() as any;
    input.type = 'range';

    input[MODEL_PROP] = '80';
    await settle();

    expect(input.value).toBe('80');
    expect(input.checked).toBe(false);
  });

  it('routes immediately once the native view exists', () => {
    const input = new VueInput() as any;
    input.nativeViewProtected = {};
    input.type = 'checkbox';

    input[MODEL_PROP] = 1;

    expect(input.checked).toBe(true);
  });

  it('re-routes the model when type changes later', async () => {
    const input = new VueInput() as any;
    input.nativeViewProtected = {};

    input[MODEL_PROP] = 'yes';
    expect(input.value).toBe('yes');

    input.type = 'checkbox';

    expect(input.checked).toBe(true);
  });

  it('binds a radio to the picked value, as in Vue on the web', () => {
    const a = new VueInput() as any;
    const b = new VueInput() as any;
    for (const [radio, value] of [
      [a, 'a'],
      [b, 'b'],
    ]) {
      radio.nativeViewProtected = {};
      radio.type = 'radio';
      radio.value = value;
      radio[MODEL_PROP] = 'b';
    }

    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);

    a.checked = true;
    expect(a[MODEL_PROP]).toBe('a');
  });
});
