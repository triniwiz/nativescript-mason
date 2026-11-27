import { describe, expect, it, vi } from 'vitest';
import { Event } from './common';
import { native_ } from './symbols';

describe('Event.isComposing on Android', () => {
  it('calls native.isComposing() instead of getIsComposing()', () => {
    const isComposing = vi.fn(() => true);
    const getIsComposing = vi.fn(() => {
      throw new Error('getIsComposing does not exist on Kotlin Event');
    });

    const event = new Event() as any;
    event[native_] = { isComposing, getIsComposing };

    expect(event.isComposing).toBe(true);
    expect(isComposing).toHaveBeenCalledTimes(1);
    expect(getIsComposing).not.toHaveBeenCalled();

    isComposing.mockReturnValueOnce(false);
    expect(event.isComposing).toBe(false);
    expect(isComposing).toHaveBeenCalledTimes(2);
    expect(getIsComposing).not.toHaveBeenCalled();
  });
});
