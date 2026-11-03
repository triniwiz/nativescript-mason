import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';

describe('box style opt-in', () => {
  it('stays off on Windows, where core still paints the background', () => {
    expect((ViewBase.prototype as any)._appliesOwnBoxStyle).toBeUndefined();
  });
});
