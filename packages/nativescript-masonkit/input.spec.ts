import { describe, expect, it, vi } from 'vitest';
import { native_ } from './symbols';
import { masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { Input } from './input';
import { TextArea } from './textarea';
import { acceptProperty, appearanceProperty, multipleProperty, parseAppearance, syncCheckedPseudoClass } from './input/common';

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

describe('CSS appearance', () => {
  it.each([
    ['none', 'none'],
    [' NONE ', 'none'],
    ['auto', 'auto'],
    // Every keyword but none renders the native control.
    ['menulist-button', 'auto'],
    ['textfield', 'auto'],
    ['initial', 'auto'],
    ['', 'auto'],
    [undefined, 'auto'],
    [42, 'auto'],
  ])('%j parses to %s', (value, expected) => {
    expect(parseAppearance(value)).toBe(expected);
  });

  it('is a CSS property a stylesheet reaches by its CSS name', () => {
    // How core's CssState assigns a declaration.
    const { style } = masonHost();
    expect(appearanceProperty.cssLocalName).toBe('appearance');
    expect((style as any).appearance).toBe('auto');

    (style as any)['css:appearance'] = 'none';
    expect((style as any).appearance).toBe('none');

    (style as any)['css:appearance'] = 'menulist-button';
    expect((style as any).appearance).toBe('auto');
  });

  it('forwards to the native control', () => {
    const native = { setAppearance: vi.fn() };
    const input = inputWithNative(native);

    input[appearanceProperty.setNative]('none');
    input[appearanceProperty.setNative]('auto');

    expect(native.setAppearance.mock.calls.map(([value]) => value.toString())).toEqual(['org.nativescript.mason.masonkit.Input.Appearance.None', 'org.nativescript.mason.masonkit.Input.Appearance.Auto']);
  });
});

describe(':checked', () => {
  function checkableWithNative(type: string) {
    let state = false;
    const native = {
      getChecked: vi.fn(() => state),
      setChecked: vi.fn((v: boolean) => (state = v)),
      setType: vi.fn(),
      setOnCheckedChange: vi.fn(),
      // A tap: the native control changes its own state.
      tap(value: boolean) {
        state = value;
      },
    };
    const input = inputWithNative(native);
    input.type = type;
    return { input, native };
  }

  it('follows checked from code before the native view exists', () => {
    const input = new Input() as any;
    input.type = 'checkbox';

    input.checked = true;
    expect(input.cssPseudoClasses.has('checked')).toBe(true);

    input.checked = false;
    expect(input.cssPseudoClasses.has('checked')).toBe(false);
  });

  it('follows checked from code on the native view', () => {
    const { input, native } = checkableWithNative('radio');

    input.checked = true;
    expect(native.setChecked).toHaveBeenCalledWith(true);
    expect(input.cssPseudoClasses.has('checked')).toBe(true);

    input.checked = false;
    expect(input.cssPseudoClasses.has('checked')).toBe(false);
  });

  it('only matches a checkbox or radio, as on the web', () => {
    const input = new Input() as any;
    input.checked = true;
    expect(input.cssPseudoClasses.has('checked')).toBe(false);

    input.type = 'checkbox';
    expect(input.cssPseudoClasses.has('checked')).toBe(true);

    input.type = 'text';
    expect(input.cssPseudoClasses.has('checked')).toBe(false);
  });

  it('notifies the selector engine only when the state changes', () => {
    const input = new Input() as any;
    input.type = 'checkbox';
    const changed = vi.fn();
    input.on(':checked', changed);

    input.checked = true;
    input.checked = true;
    input.checked = false;
    input.checked = false;

    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('follows a tap the native view reports', () => {
    const { input, native } = checkableWithNative('checkbox');

    native.tap(true);
    input[syncCheckedPseudoClass]();
    expect(input.cssPseudoClasses.has('checked')).toBe(true);

    native.tap(false);
    input[syncCheckedPseudoClass]();
    expect(input.cssPseudoClasses.has('checked')).toBe(false);
  });

  it('listens for native changes once the native view exists, and applies a pending checked', () => {
    const g = globalThis as any;
    const previous = g.kotlin;
    g.kotlin = {
      jvm: {
        functions: {
          Function1: class {
            constructor(impl: object) {
              Object.assign(this, impl);
            }
          },
        },
      },
    };
    try {
      const input = new Input() as any;
      input.type = 'checkbox';
      input.checked = true;

      const { native } = checkableWithNative('checkbox');
      input[native_] = native;
      input.initNativeView();

      expect(native.setChecked).toHaveBeenCalledWith(true);
      expect(input.cssPseudoClasses.has('checked')).toBe(true);
      expect(native.setOnCheckedChange).toHaveBeenCalledTimes(1);

      const listener = native.setOnCheckedChange.mock.calls[0][0];
      native.tap(false);
      listener.invoke(false);
      expect(input.cssPseudoClasses.has('checked')).toBe(false);
    } finally {
      g.kotlin = previous;
    }
  });
});
