import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointerEvent, ViewBase } from './common';
import { parsePointerEvents } from './properties';
import { native_, pointerEvents_ } from './symbols';

const runtimeKotlin = (globalThis as any).kotlin;
// NativeScript's Android WeakRef reads with get().
const weakRefProto = WeakRef.prototype as any;
if (!weakRefProto.get) {
  weakRefProto.get = function (this: WeakRef<object>) {
    return this.deref();
  };
}

function element(native: any) {
  const view = new ViewBase() as any;
  view[native_] = native;
  view._view = native;
  return view;
}

function nativeElement() {
  const listeners = new Map<string, any>();
  return {
    listeners,
    node: { pointerEvents: 0 },
    addEventListener: vi.fn((type: string, cb: any) => {
      listeners.set(type, cb);
      return `id-${type}`;
    }),
    removeEventListener: vi.fn(),
    setPointerCapture: vi.fn(() => true),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => true),
  };
}

beforeEach(() => {
  (globalThis as any).kotlin = {
    jvm: {
      functions: {
        Function1: class {
          invoke: (event: any) => void;
          constructor(impl: { invoke: (event: any) => void }) {
            this.invoke = impl.invoke;
          }
        },
      },
    },
  };
});

afterEach(() => {
  (globalThis as any).kotlin = runtimeKotlin;
});

describe('pointer-events values', () => {
  it.each([
    ['none', 1],
    [' NONE ', 1],
    ['auto', 0],
    ['visiblePainted', 0],
    ['', 0],
  ])('%j -> %d', (value, expected) => {
    expect(parsePointerEvents(value)).toBe(expected);
  });

  it('hands the value to the native node, before and after the view exists', () => {
    const view = element(null);
    view[pointerEvents_] = 1;
    view._applyPointerEvents();
    const native = nativeElement();
    view[native_] = native;
    view._view = native;
    view.initNativeView();
    expect(native.node.pointerEvents).toBe(1);
  });
});

describe('Android pointer listeners', () => {
  it('registers pointer events natively under their DOM names, in any case', () => {
    const native = nativeElement();
    const view = element(native);
    const onDown = vi.fn();
    view.addEventListener('pointerDown', onDown);
    expect(native.addEventListener).toHaveBeenCalledWith('pointerdown', expect.anything());

    const event = {
      getType: () => 'pointerdown',
      getPointerId: () => 2,
      getPointerType: () => 'touch',
      isPrimary: () => true,
      getClientX: () => 12.5,
      getClientY: () => 40,
      getOffsetX: () => 2.5,
      getOffsetY: () => 4,
      getButton: () => 0,
      getButtons: () => 1,
      getPressure: () => 0.5,
      getWidth: () => 0,
      getCtrlKey: () => false,
      getShiftKey: () => true,
    };
    native.listeners.get('pointerdown').invoke(event);
    const received = onDown.mock.calls[0][0];
    expect(received).toBeInstanceOf(PointerEvent);
    expect(received).toMatchObject({
      type: 'pointerdown',
      pointerId: 2,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 12.5,
      clientY: 40,
      pageX: 12.5,
      x: 12.5,
      offsetX: 2.5,
      offsetY: 4,
      button: 0,
      buttons: 1,
      pressure: 0.5,
      shiftKey: true,
      ctrlKey: false,
    });
    // The DOM's default contact size, when the device reports none.
    expect(received.width).toBe(1);
    expect(received.currentTarget).toBe(view);

    view.removeEventListener('pointerdown', onDown);
    expect(native.removeEventListener).toHaveBeenCalledWith('pointerdown', 'id-pointerdown');
  });

  it('forwards pointer capture and throws NotFoundError for an inactive pointer', () => {
    const native = nativeElement();
    const view = element(native);
    view.setPointerCapture(3);
    expect(native.setPointerCapture).toHaveBeenCalledWith(3);
    expect(view.hasPointerCapture(3)).toBe(true);
    view.releasePointerCapture(3);
    expect(native.releasePointerCapture).toHaveBeenCalledWith(3);

    native.setPointerCapture.mockReturnValueOnce(false);
    expect(() => view.setPointerCapture(9)).toThrowError(expect.objectContaining({ name: 'NotFoundError' }));
  });
});
