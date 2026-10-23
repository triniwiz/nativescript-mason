import { describe, expect, it, vi } from 'vitest';
import { _expandCssShorthand } from '@nativescript/core/ui/core/properties';
import { translateXProperty } from '@nativescript/core/ui/styling/style-properties';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { ViewBase } from './common';
import './properties';

function applyStylesheetTransform(style: any, value: string) {
  for (const [name, longhand] of _expandCssShorthand('transform', value) ?? []) {
    style[`css:${name}`] = longhand;
  }
}

describe('a stylesheet transform', () => {
  it('reaches a mason view as written, percentages included', () => {
    const { style } = masonHost();
    applyStylesheetTransform(style, 'translateX(-35%)');
    expect(style.transform).toBe('translateX(-35%)');
  });

  it('still gives a core view its longhands', () => {
    const { style } = coreHost();
    applyStylesheetTransform(style, 'translateX(12px) scale(2)');
    expect((style as any).translateX).toBe(12);
    expect((style as any).scaleX).toBe(2);
  });

  it("keeps core's longhands off a mason view while it is set", () => {
    // Core's Android handler writes through this widget helper.
    const setTranslateX = vi.fn();
    vi.stubGlobal('org', { nativescript: { widgets: { ViewHelper: { setTranslateX } } } });
    try {
      const setNative = (ViewBase.prototype as any)[translateXProperty.setNative];
      const view: any = { style: { masonTransformDeclaration: 'translateX(-35%)' }, nativeViewProtected: {} };
      setNative.call(view, -35);
      expect(setTranslateX).not.toHaveBeenCalled();

      view.style.masonTransformDeclaration = undefined;
      setNative.call(view, 10);
      expect(setTranslateX).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
