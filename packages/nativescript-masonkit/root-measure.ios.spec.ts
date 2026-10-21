import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nativescript/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@nativescript/core')>();
  const { layout } = await import('@nativescript/core/utils/layout-helper/index.ios');
  return { ...core, Utils: { ...core.Utils, layout } };
});

import { Utils } from '@nativescript/core';
import { View } from './view/index.ios';
import { Text } from './text/index.ios';
import { Li } from './li/index.ios';
import { Scroll } from './scroll/index.ios';
import { isMasonView_ } from './symbols';

afterEach(() => vi.restoreAllMocks());

function fixture(Host = View, parent: object = {}) {
  const native = {
    node: { computedLayout: { width: 123, height: 456 } },
    mason_computeWithSize: vi.fn(),
    mason_computeWithMaxContent: vi.fn(),
    mason_markRootComputeAppliedWithSize: vi.fn(),
    mason_markRootComputeApplied: vi.fn(),
  };
  const view = Object.create(Host.prototype) as View;
  view[isMasonView_] = true;
  (view as any)._children = [];
  Object.defineProperty(view, '_view', { value: native });
  Object.defineProperty(view, 'ios', { value: native });
  Object.defineProperty(view, 'width', { value: 'auto' });
  Object.defineProperty(view, 'height', { value: 'auto' });
  Object.defineProperty(view, 'parent', { value: parent });
  const measured = vi.spyOn(view, 'setMeasuredDimension').mockImplementation(() => {});
  return { view, native, measured };
}

const { AT_MOST, EXACTLY, UNSPECIFIED, makeMeasureSpec } = Utils.layout;

describe.each([['View', View], ['Text', Text], ['Li', Li], ['Scroll', Scroll]] as const)('%s root measurement constraints on iOS', (_name, Host) => {
  it.each([
    [300, EXACTLY, 600, EXACTLY, 300, 600],
    [300, EXACTLY, 0, UNSPECIFIED, 300, -2],
    [0, UNSPECIFIED, 600, AT_MOST, -2, 600],
    [300, AT_MOST, 0, UNSPECIFIED, 300, -2],
    [0, AT_MOST, 600, EXACTLY, 0, 600],
    [300, EXACTLY, 0, AT_MOST, 300, 0],
    [0, AT_MOST, 0, AT_MOST, 0, 0],
  ])('preserves each bounded axis in (%s, %s), (%s, %s)', (width, widthMode, height, heightMode, expectedWidth, expectedHeight) => {
    const { view, native } = fixture(Host as typeof View);
    view.onMeasure(makeMeasureSpec(width, widthMode), makeMeasureSpec(height, heightMode));
    expect(native.mason_computeWithSize).toHaveBeenCalledWith(expectedWidth, expectedHeight);
    expect(native.mason_markRootComputeAppliedWithSize).toHaveBeenCalledWith(expectedWidth, expectedHeight);
    expect(native.mason_computeWithMaxContent).not.toHaveBeenCalled();
  });

  it('reads the native placement for a nested Mason view without recomputing it', () => {
    const { view, native, measured } = fixture(Host as typeof View, { [isMasonView_]: true });
    view.onMeasure(makeMeasureSpec(300, EXACTLY), makeMeasureSpec(600, EXACTLY));
    expect(native.mason_computeWithSize).not.toHaveBeenCalled();
    expect(native.mason_computeWithMaxContent).not.toHaveBeenCalled();
    expect(measured).toHaveBeenCalledWith(makeMeasureSpec(123, EXACTLY), makeMeasureSpec(456, EXACTLY));
  });
});

describe('iOS root measurement output', () => {
  it('uses max-content when both axes are unspecified', () => {
    const { view, native } = fixture();
    view.onMeasure(makeMeasureSpec(0, UNSPECIFIED), makeMeasureSpec(0, UNSPECIFIED));
    expect(native.mason_computeWithMaxContent).toHaveBeenCalledOnce();
    expect(native.mason_markRootComputeApplied).toHaveBeenCalledOnce();
    expect(native.mason_computeWithSize).not.toHaveBeenCalled();
  });

  it('returns the layout produced by the native compute', () => {
    const { view, measured } = fixture();
    view.onMeasure(makeMeasureSpec(300, EXACTLY), makeMeasureSpec(600, EXACTLY));
    expect(measured).toHaveBeenCalledWith(makeMeasureSpec(123, EXACTLY), makeMeasureSpec(456, EXACTLY));
  });

  it('clamps a scroll viewport only on constrained axes', () => {
    const { view, measured } = fixture(Scroll as typeof View);
    view.onMeasure(makeMeasureSpec(100, EXACTLY), makeMeasureSpec(0, UNSPECIFIED));
    expect(measured).toHaveBeenCalledWith(makeMeasureSpec(100, EXACTLY), makeMeasureSpec(456, EXACTLY));
  });
});
