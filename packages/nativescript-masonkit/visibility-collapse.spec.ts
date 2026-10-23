import { describe, expect, it } from 'vitest';
import { visibilityProperty } from '@nativescript/core/ui/styling/style-properties';
import { masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { ViewBase } from './common';
import { displayProperty } from './properties';

const setVisibility = (ViewBase.prototype as any)[visibilityProperty.setNative];
const setDisplay = (ViewBase.prototype as any)[displayProperty.setNative];

describe('visibility: collapse', () => {
  it('takes the view out of layout and gives its display back', () => {
    const { under, view } = masonHost({ nativeViewProtected: { setVisibility() {} } });
    under.style.display = 'flex';

    setVisibility.call(view, 'collapse');
    expect(under.style.display).toBe('none');

    setVisibility.call(view, 'visible');
    expect(under.style.display).toBe('flex');
  });

  it('keeps a display set while collapsed for when it is shown', () => {
    const { under, view } = masonHost({ nativeViewProtected: { setVisibility() {} } });
    under.style.display = 'block';

    setVisibility.call(view, 'collapse');
    setDisplay.call(view, 'grid');
    expect(under.style.display).toBe('none');

    setVisibility.call(view, 'hidden');
    expect(under.style.display).toBe('grid');
  });

  it('leaves display alone for hidden', () => {
    const { under, view } = masonHost({ nativeViewProtected: { setVisibility() {} } });
    under.style.display = 'inline-block';

    setVisibility.call(view, 'hidden');
    expect(under.style.display).toBe('inline-block');
  });
});
