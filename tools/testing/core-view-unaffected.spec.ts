import { describe, expect, it } from 'vitest';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { styleUnderTest } from './mason-test-kit/style-under-test';
import { isMasonView_ } from '../../packages/nativescript-masonkit/symbols';

// Importing masonkit's properties registers ~80 CSS names onto core's Style and
// mutates 13 of core's own properties — process-wide, for every view in the app.
import '../../packages/nativescript-masonkit/properties';

function nsWeakRef(view: unknown) {
  return { get: () => view, deref: () => view, clear() {} } as any;
}

function host(mason: boolean) {
  const under = mason ? styleUnderTest() : null;
  const view: any = { eachChild: () => {}, _batchUpdate: (cb: () => void) => cb(), getEffectivePaddingShorthand: () => 0, getEffectiveMarginShorthand: () => 0 };
  if (mason) {
    view[isMasonView_] = true;
    view._styleHelper = under!.style;
  }
  const style: any = new CoreStyle(nsWeakRef(view));
  view.style = style;
  return { style, under };
}

// Every CSS name mason registers that core already owned. Before
// registerAlongsideCore(), mason's accessor replaced core's outright and these
// silently did nothing on a plain NativeScript view.
const SHARED_WITH_CORE: Array<{ cssName: string; value: string; longhand: string; expected: unknown }> = [
  { cssName: 'margin', value: '10', longhand: 'marginTop', expected: 10 },
  { cssName: 'padding', value: '10', longhand: 'paddingTop', expected: 10 },
  { cssName: 'border-radius', value: '4', longhand: 'borderTopLeftRadius', expected: 4 },
  { cssName: 'vertical-align', value: 'top', longhand: 'verticalAlignment', expected: 'top' },
];

describe('a plain NativeScript view keeps core behaviour', () => {
  it.each(SHARED_WITH_CORE)('$cssName still reaches core longhands', ({ cssName, value, longhand, expected }) => {
    const { style } = host(false);
    style[`css:${cssName}`] = value;
    expect(style[longhand]).toEqual(expected);
  });

  it('background still resolves to a Color', () => {
    const { style } = host(false);
    style['css:background'] = 'red';
    expect(style.backgroundColor).toBeDefined();
    expect(String(style.backgroundColor)).not.toBe('undefined');
  });

  it('flex: 1 1 auto does not throw', () => {
    // The converter tested `value.length` (the string's length) instead of
    // `values.length`, then pushed an object where core destructures a
    // [property, value] tuple — so any three-part flex threw "not iterable".
    const { style } = host(false);
    expect(() => {
      style['css:flex'] = '1 1 auto';
    }).not.toThrow();
    expect(Number(style.flexGrow)).toBe(1);
  });
});

describe('a mason view gets mason behaviour for the same names', () => {
  it('margin reaches the mason style buffer, not core longhands', () => {
    const { style, under } = host(true);
    style['css:margin'] = '10px';
    // marginCss goes to the native parser, so what's observable here is that
    // core's longhand expansion did NOT happen for a mason view.
    expect(style.marginTop).toEqual({ value: 0, unit: 'px' });
    expect(under).not.toBeNull();
  });

  it('flex: 1 1 auto reaches mason flex-basis', () => {
    const { style, under } = host(true);
    style['css:flex'] = '1 1 auto';
    expect(under).not.toBeNull();
    expect(Number(style.flexGrow)).toBe(1);
  });
});
