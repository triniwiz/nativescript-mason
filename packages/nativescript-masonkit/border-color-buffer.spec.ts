import { describe, expect, it } from 'vitest';
import { Color } from '@nativescript/core';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';

// Android border-*-color longhands write the style buffer directly (one batched
// sync) instead of a JNI string call per property. The side colors must land
// where Border.kt reads them, as ARGB, with the BORDER_COLOR dirty bit set.

const BORDER_COLOR_BIT = 1n << 42n; // StateKeys.BORDER_COLOR = flag(42)

describe('setBorderSideColor', () => {
  it('writes the side color as ARGB at the side offset and marks BORDER_COLOR dirty', () => {
    const t = styleUnderTest();
    t.style.setBorderSideColor('top', new Color('#3B5BDB'));
    t.style.setBorderSideColor('left', '#E03131');
    expect(t.view.getUint32(styleKey('BORDER_TOP_COLOR'), true)).toBe(new Color('#3B5BDB').argb >>> 0);
    expect(t.view.getUint32(styleKey('BORDER_LEFT_COLOR'), true)).toBe(new Color('#E03131').argb >>> 0);
    expect(t.view.getUint32(styleKey('BORDER_RIGHT_COLOR'), true)).toBe(0);
    expect(t.dirty() & BORDER_COLOR_BIT).toBe(BORDER_COLOR_BIT);
  });

  it('ignores values that are not colors', () => {
    const t = styleUnderTest();
    t.style.setBorderSideColor('bottom', 'not-a-color');
    expect(t.view.getUint32(styleKey('BORDER_BOTTOM_COLOR'), true)).toBe(0);
    expect(t.dirty()).toBe(-1n);
  });
});
