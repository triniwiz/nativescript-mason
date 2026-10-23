import { describe, expect, it } from 'vitest';
import { visibilityProperty } from '@nativescript/core/ui/styling/style-properties';
import { masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { ViewBase } from './common';
import { displayProperty } from './properties';

const setVisibility = (ViewBase.prototype as any)[visibilityProperty.setNative];
const setDisplay = (ViewBase.prototype as any)[displayProperty.setNative];

describe('visibility: collapse', () => {
  it('reaches the style without touching display', () => {
    const { under, view } = masonHost({ nativeViewProtected: { setVisibility() {} } });
    under.style.display = 'flex';

    setVisibility.call(view, 'collapse');
    expect(under.style.visibility).toBe('collapse');
    expect(under.style.display).toBe('flex');

    setVisibility.call(view, 'visible');
    expect(under.style.visibility).toBe('visible');
  });

  it('keeps a display set while collapsed', () => {
    const { under, view } = masonHost({ nativeViewProtected: { setVisibility() {} } });
    under.style.display = 'block';

    setVisibility.call(view, 'collapse');
    setDisplay.call(view, 'grid');
    setVisibility.call(view, 'hidden');
    expect(under.style.display).toBe('grid');
    expect(under.style.visibility).toBe('hidden');
  });
});
