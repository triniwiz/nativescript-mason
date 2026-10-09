/**
 * NativeScript-Vue's patchProp maps `modelValue` / `onUpdate:modelValue` through the
 * element's `meta.model`: one prop and one event per tag. An `<input>` binds by type,
 * so its model prop is an accessor rather than `checked` or `value`.
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

// A checkbox binds its checked state. A radio binds the picked radio's value, as in Vue
// on the web: every radio sharing the model re-renders, so no native group is needed.
function read(target: Bindable): unknown {
  switch (target.type) {
    case 'checkbox':
      return target.checked;
    default:
      return target.value;
  }
}

function write(target: Bindable, model: unknown): void {
  switch (target.type) {
    case 'checkbox':
      target.checked = !!model;
      break;
    case 'radio':
      target.checked = model != null && String(model) === target.value;
      break;
    default:
      target.value = model as string;
  }
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
      return read(this);
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
      write(this, this.#model);
    }
  };
}
