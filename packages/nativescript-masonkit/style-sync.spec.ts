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

describe('dirty mask words', () => {
  it('sends the 128-bit mask as four int32 words, low to high', () => {
    const { style, send } = tracked();
    let words: number[] = [];
    send.mockImplementation(function (this: any) {
      words = [this._d0, this._d1, this._d2, this._d3];
    });
    style.batch(() => {
      style.display = 'flex'; // bits 0 and 34
      style.whiteSpace = 'nowrap'; // bit 63, the sign bit of word 1
      style.fontWeight = 'bold'; // bit 64
    });
    expect(words).toEqual([1, (1 << 2) | (1 << 31), 1, 0]);
    expect(style.isDirty).toBe(-1n);
  });

  it('reads back as one unsigned value', () => {
    const { style } = tracked();
    style.inBatch = true;
    style.whiteSpace = 'nowrap';
    style.fontWeight = 'bold';
    expect(style.isDirty).toBe((1n << 63n) | (1n << 64n));
  });
});
