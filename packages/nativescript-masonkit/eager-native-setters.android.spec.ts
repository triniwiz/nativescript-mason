import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';

describe('eager native setters opt-in', () => {
  it('lets css values reach a mason view as they apply', () => {
    expect((ViewBase.prototype as any)._eagerNativeSetters).toBe(true);
  });
});
