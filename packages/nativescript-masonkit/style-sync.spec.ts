import { describe, expect, it, vi } from 'vitest';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';

function tracked() {
  const t = styleUnderTest();
  const style = t.style as any;
  const send = vi.spyOn(style, '_sendSync').mockImplementation(() => {});
  return { t, style, send };
}

describe('style sync', () => {
  it('always sends the first sync, even when the bytes did not change', () => {
    const { style, send } = tracked();
    style.batch(() => {
      style.width = 0 as never;
    });
    style.batch(() => {
      style.width = 0 as never;
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('skips a later sync whose writes leave the bytes unchanged', () => {
    const { style, send } = tracked();
    style.batch(() => {
      style.width = 100 as never;
    });
    style.batch(() => {
      style.width = 50 as never;
      style.width = 100 as never;
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends a later sync that changes the bytes', () => {
    const { style, send } = tracked();
    style.batch(() => {
      style.width = 100 as never;
    });
    style.batch(() => {
      style.width = 120 as never;
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not copy the buffer for a style that never synced', () => {
    const { style } = tracked();
    const slice = vi.spyOn(style.u8View, 'slice');
    style.batch(() => {
      style.width = 10 as never;
    });
    expect(slice).not.toHaveBeenCalled();
    style.batch(() => {
      style.width = 20 as never;
    });
    expect(slice).toHaveBeenCalledTimes(1);
  });
});
