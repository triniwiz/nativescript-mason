import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';

describe('eager native setters opt-in', () => {
  it('stays off on Windows, where setters still go through core painting', () => {
    expect((ViewBase.prototype as any)._eagerNativeSetters).toBeUndefined();
  });
});
