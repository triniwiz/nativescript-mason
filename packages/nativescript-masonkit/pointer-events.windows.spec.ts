import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PointerEvent, ViewBase } from './common';
import { native_, pointerEvents_ } from './symbols';

const listeners = new Map<string, (event: any) => void>();
const engine = {
  AddEventListener: vi.fn((_el: any, type: string, listener: (event: any) => void) => {
    listeners.set(type, listener);
    return 7;
  }),
  RemoveEventListener: vi.fn(),
  SetPointerEvents: vi.fn(),
  SetPointerCapture: vi.fn(() => true),
  ReleasePointerCapture: vi.fn(),
  HasPointerCapture: vi.fn(() => false),
};

(globalThis as any).NativeScript = { Mason: { Mason: { Instance: () => engine }, EventListener: class {} } };
(globalThis as any).NSWinRT = { asDelegate: (_name: string, fn: any) => fn };

function element(native: any = { id: 'native' }) {
  const view = new ViewBase() as any;
  view[native_] = native;
  view._view = native;
  return view;
}

beforeEach(() => {
  listeners.clear();
  for (const fn of Object.values(engine)) fn.mockClear();
});

describe('Windows pointer events', () => {
  it('registers with the engine and reads the WinRT fields', () => {
    const view = element();
    const onMove = vi.fn();
    view.addEventListener('pointermove', onMove);
    expect(engine.AddEventListener).toHaveBeenCalledWith(view[native_], 'pointermove', expect.anything());

    listeners.get('pointermove')!({ Type: 'pointermove', PointerId: 1, PointerType: 'mouse', IsPrimary: true, ClientX: 10, ClientY: 20, OffsetX: 3, OffsetY: 4, Buttons: 0, Button: -1, Width: 1, Pressure: 0 });
    const event = onMove.mock.calls[0][0];
    expect(event).toBeInstanceOf(PointerEvent);
    expect(event).toMatchObject({ pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: 10, clientY: 20, offsetX: 3, offsetY: 4, buttons: 0, button: -1 });
  });

  it('hands pointer-events and capture to the engine', () => {
    const view = element();
    view[pointerEvents_] = 1;
    view._applyPointerEvents();
    expect(engine.SetPointerEvents).toHaveBeenCalledWith(view[native_], 1);

    view.setPointerCapture(1);
    expect(engine.SetPointerCapture).toHaveBeenCalledWith(view[native_], 1);
    expect(view.hasPointerCapture(1)).toBe(false);
    view.releasePointerCapture(1);
    expect(engine.ReleasePointerCapture).toHaveBeenCalledWith(view[native_], 1);
  });
});
