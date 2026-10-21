import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nativescript/core/ui/gestures/touch-manager', () => ({ TouchManager: class {} }));

// Use core's real iOS measure-spec encoding, without a live UIKit screen.
vi.mock('@nativescript/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@nativescript/core')>();
  const { layout } = await import('@nativescript/core/utils/layout-helper/index.ios');
  return { ...core, Utils: { ...core.Utils, layout } };
});

import { Utils, View } from '@nativescript/core';
import { ViewBase } from './common';
import { isMasonView_ } from './symbols';

type Measure = (knownWidth: number, knownHeight: number, availableWidth: number, availableHeight: number) => CGSize;

beforeEach(() => vi.stubGlobal('CGSizeMake', (width: number, height: number) => ({ width, height })));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fixture(textParent = false) {
  const register = vi.fn();
  const mason = { setMeasureForViewBlock: register };
  const parent = Object.create(ViewBase.prototype) as ViewBase;
  Object.defineProperty(parent, 'nativeViewProtected', { value: textParent ? { node: { mason } } : { mason } });
  const child = {
    nativeViewProtected: {},
    getMeasuredWidth: () => 93,
    getMeasuredHeight: () => 54,
  };
  const measureChild = vi.spyOn(View, 'measureChild').mockReturnValue({ measuredWidth: 93, measuredHeight: 54 });
  parent._masonMeasureForeign(child);
  expect(register).toHaveBeenCalledWith(child.nativeViewProtected, expect.any(Function));
  return { parent, child, measureChild, measure: register.mock.calls[0][1] as Measure };
}

function spec(size: number, mode: number) {
  return Utils.layout.makeMeasureSpec(size, mode);
}

describe('foreign NativeScript child measurement on iOS', () => {
  it('keeps known sizes exact, including zero, ahead of the available space', () => {
    const { parent, child, measureChild, measure } = fixture();
    measure(0, 54, 300, 600);
    expect(measureChild).toHaveBeenCalledWith(parent, child, spec(0, Utils.layout.EXACTLY), spec(54, Utils.layout.EXACTLY));
  });

  it.each([
    [150, 300],
    [0, 150],
    [150, 0],
    [0, 0],
  ])('keeps definite available space (%s, %s) bounded', (width, height) => {
    const { parent, child, measureChild, measure } = fixture();
    measure(NaN, NaN, width, height);
    expect(measureChild).toHaveBeenCalledWith(parent, child, spec(width, Utils.layout.AT_MOST), spec(height, Utils.layout.AT_MOST));
  });

  it('uses unconstrained specs for intrinsic sizing sentinels', () => {
    const { parent, child, measureChild, measure } = fixture();
    measure(NaN, NaN, -1, -2);
    expect(measureChild).toHaveBeenCalledWith(parent, child, spec(0, Utils.layout.UNSPECIFIED), spec(0, Utils.layout.UNSPECIFIED));
  });

  it.each([false, true])('returns measured device pixels unchanged under a text parent: %s', (textParent) => {
    const { measure } = fixture(textParent);
    expect(measure(NaN, NaN, 300, 600)).toEqual({ width: 93, height: 54 });
  });

  it('does not replace the measurement of Mason children or views without a native instance', () => {
    const register = vi.fn();
    const parent = Object.create(ViewBase.prototype) as ViewBase;
    Object.defineProperty(parent, 'nativeViewProtected', { value: { mason: { setMeasureForViewBlock: register } } });
    parent._masonMeasureForeign({ nativeViewProtected: {}, [isMasonView_]: true });
    parent._masonMeasureForeign({});
    expect(register).not.toHaveBeenCalled();
  });
});
