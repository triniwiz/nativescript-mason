import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';

describe('box style opt-in', () => {
  it('tells core a mason view paints its own padding, borders and backgrounds', () => {
    expect((ViewBase.prototype as any)._appliesOwnBoxStyle).toBe(true);
  });
});
