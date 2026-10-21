import { afterEach, describe, expect, it, vi } from 'vitest';
import { Observable } from '@nativescript/core/data/observable';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { Style } from './style';
import { adoptForeignLayout, releaseForeignLayout } from './foreign-layout';
import './properties';

function foreign() {
  const view = new Observable() as any;
  Object.assign(view, {
    nativeViewProtected: {},
    _onCssStateChange() {},
    eachChild() {},
    _batchUpdate: (update: () => void) => update(),
    getEffectivePaddingShorthand: () => 0,
    getEffectiveMarginShorthand: () => 0,
  });
  view.style = new CoreStyle({ get: () => view, deref: () => view, clear() {} } as any);
  return { view, style: view.style as any };
}

function leafTransport() {
  const leaf: Record<string, unknown> = {};
  vi.spyOn(Style, 'fromView').mockImplementation(() => leaf as never);
  return leaf;
}

const adopted: any[] = [];
afterEach(() => {
  for (const view of adopted.splice(0)) releaseForeignLayout(view);
  vi.restoreAllMocks();
});

describe('foreign child layout on Windows', () => {
  it('leaves the XAML box to the panel and mirrors flex, position and grid placement', () => {
    const leaf = leafTransport();
    const { view, style } = foreign();
    Object.assign(style, { width: 31, height: 36, minWidth: 12, maxHeight: 101, marginLeft: 4, flexGrow: 2, flexShrink: 0, alignSelf: 'center', gridRowStart: 2 });
    adoptForeignLayout(view);
    adopted.push(view);
    expect(leaf).toEqual({ flexGrow: 2, flexShrink: 0, alignSelf: 'center', gridArea: '2 / auto / auto / auto' });
    style.width = 54;
    style.marginTop = 3;
    style.flexGrow = unsetValue;
    expect(leaf).toEqual({ flexGrow: 0, flexShrink: 0, alignSelf: 'center', gridArea: '2 / auto / auto / auto' });
  });
});
