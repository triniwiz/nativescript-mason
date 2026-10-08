/**
 * NativeScript-Vue's patchProp maps `modelValue` / `onUpdate:modelValue` through the
 * element's `meta.model`: one prop and one event per tag. An `<input>` binds `checked`
 * or `value` depending on its type, so its model prop is this accessor instead.
 */
export const MODEL_PROP = 'vueModelValue';

const inputModel = { prop: MODEL_PROP, event: 'input' };

/** Model metadata per normalized tag name. */
export const modelMeta: Record<string, { prop: string; event: string }> = {
  input: inputModel,
  textarea: { prop: 'value', event: 'input' },
};

interface Bindable {
  type?: string;
  value: string;
  checked: boolean;
}

function isCheckable(target: Bindable): boolean {
  return target.type === 'checkbox' || target.type === 'radio';
}

export function defineModelAccessor(ctor: { prototype: object }): void {
  if (Object.prototype.hasOwnProperty.call(ctor.prototype, MODEL_PROP)) {
    return;
  }
  Object.defineProperty(ctor.prototype, MODEL_PROP, {
    configurable: true,
    get(this: Bindable) {
      return isCheckable(this) ? this.checked : this.value;
    },
    set(this: Bindable, value: unknown) {
      if (isCheckable(this)) {
        this.checked = !!value;
      } else {
        this.value = value as string;
      }
    },
  });
}
