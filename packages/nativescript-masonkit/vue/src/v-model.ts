/**
 * NativeScript-Vue's patchProp maps `modelValue` / `onUpdate:modelValue` through the
 * element's `meta.model`: one prop and one event per tag. An `<input>` binds `checked`
 * or `value` depending on its type, so its model prop is an accessor that picks one.
 */
export const MODEL_PROP = 'vueModelValue';

/** Model metadata per normalized tag name. */
export const modelMeta: Record<string, { prop: string; event: string }> = {
  input: { prop: MODEL_PROP, event: 'input' },
  textarea: { prop: 'value', event: 'input' },
};

export interface Bindable {
  type?: string;
  value: string;
  checked: boolean;
  nativeViewProtected?: unknown;
  on(eventName: string, callback: () => void): void;
}

type BindableClass = new (...args: any[]) => Bindable;

function isCheckable(target: Bindable): boolean {
  return target.type === 'checkbox' || target.type === 'radio';
}

/**
 * Vue patches props in template order, so `v-model` can arrive before `type`. The
 * model is held and routed once the mount pass has set `type`, and again whenever
 * `type` changes.
 */
export function withVueModel<T extends BindableClass>(Base: T): T {
  return class extends Base {
    #model: unknown;
    #watchingType = false;

    get [MODEL_PROP](): unknown {
      return isCheckable(this) ? this.checked : this.value;
    }

    set [MODEL_PROP](model: unknown) {
      this.#model = model;
      if (!this.#watchingType) {
        this.#watchingType = true;
        this.on('typeChange', () => this.#route());
      }
      if (this.nativeViewProtected) {
        this.#route();
      } else {
        Promise.resolve().then(() => this.#route());
      }
    }

    #route() {
      if (isCheckable(this)) {
        this.checked = !!this.#model;
      } else {
        this.value = this.#model as string;
      }
    }
  };
}
