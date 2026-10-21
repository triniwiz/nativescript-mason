import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  // Only List's delegate class is defined here; no UIKit objects are created.
  vi.stubGlobal('NSObject', class {});
  vi.stubGlobal('MasonListDelegate', {});
  vi.stubGlobal('NativeClass', (target?: unknown) => target ?? ((type: unknown) => type));
});

vi.mock('@nativescript/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@nativescript/core')>();
  const { layout } = await import('@nativescript/core/utils/layout-helper/index.ios');
  const { booleanConverter } = await import('@nativescript/core/ui/core/view-base');
  return { ...core, booleanConverter, Utils: { ...core.Utils, layout } };
});

import { Utils } from '@nativescript/core';
import { Button } from './button/index.ios';
import { Img } from './img/index.ios';
import { Input } from './input/index.ios';
import { List } from './list/index.ios';
import { TextArea } from './textarea/index.ios';
import { isMasonView_ } from './symbols';

afterEach(() => vi.restoreAllMocks());
afterAll(() => vi.unstubAllGlobals());

function fixture(Host: { prototype: object }, parent?: object) {
  const native = {
    node: { computedLayout: { width: 0, height: 0 } },
    mason_computeWithSize: vi.fn(),
    mason_computeWithMaxContent: vi.fn(),
    mason_markRootComputeAppliedWithSize: vi.fn(),
  };
  native.mason_computeWithSize.mockImplementation(() => {
    native.node.computedLayout = { width: 123, height: 45 };
  });
  const view = Object.create(Host.prototype) as Button;
  view[isMasonView_] = true; // Each control's constructor sets this flag.
  (view as any)._children = [];
  Object.defineProperties(view, {
    _view: { value: native },
    ios: { value: native },
    parent: { value: parent },
    width: { value: 'auto' },
    height: { value: 'auto' },
  });
  const measured = vi.spyOn(view, 'setMeasuredDimension').mockImplementation(() => {});
  return { view, native, measured };
}

const { EXACTLY, AT_MOST, UNSPECIFIED, makeMeasureSpec } = Utils.layout;

describe.each([['Button', Button], ['Img', Img], ['Input', Input], ['List', List], ['TextArea', TextArea]] as const)('%s root measurement on iOS', (_name, Host) => {
  it.each([
    [300, EXACTLY, 600, EXACTLY, 300, 600],
    [300, EXACTLY, 0, UNSPECIFIED, 300, -2],
    [0, UNSPECIFIED, 600, AT_MOST, -2, 600],
    [0, AT_MOST, 600, EXACTLY, 0, 600],
    [300, EXACTLY, 0, AT_MOST, 300, 0],
    [0, AT_MOST, 0, AT_MOST, 0, 0],
  ])('computes standalone roots from bounds (%s, %s), (%s, %s)', (width, widthMode, height, heightMode, expectedWidth, expectedHeight) => {
    const { view, native, measured } = fixture(Host, {});
    view.onMeasure(makeMeasureSpec(width, widthMode), makeMeasureSpec(height, heightMode));
    expect(native.mason_computeWithSize).toHaveBeenCalledWith(expectedWidth, expectedHeight);
    expect(native.mason_markRootComputeAppliedWithSize).toHaveBeenCalledWith(expectedWidth, expectedHeight);
    expect(measured).toHaveBeenCalledWith(makeMeasureSpec(123, EXACTLY), makeMeasureSpec(45, EXACTLY));
  });

  it('computes before attachment when it has no parent', () => {
    const { view, native } = fixture(Host, undefined);
    view.onMeasure(makeMeasureSpec(300, EXACTLY), makeMeasureSpec(600, EXACTLY));
    expect(native.mason_computeWithSize).toHaveBeenCalledWith(300, 600);
  });

  it('uses the outer tree placement when the parent is Mason', () => {
    const { view, native, measured } = fixture(Host, { [isMasonView_]: true });
    native.node.computedLayout = { width: 123, height: 45 };
    view.onMeasure(makeMeasureSpec(300, EXACTLY), makeMeasureSpec(600, EXACTLY));
    expect(native.mason_computeWithSize).not.toHaveBeenCalled();
    expect(native.mason_computeWithMaxContent).not.toHaveBeenCalled();
    expect(measured).toHaveBeenCalledWith(makeMeasureSpec(123, EXACTLY), makeMeasureSpec(45, EXACTLY));
  });
});
