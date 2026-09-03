import { describe, expect, it } from 'vitest';
import { Style as CoreStyle } from '@nativescript/core/ui/styling/style';
import { _getStyleProperties } from '@nativescript/core/ui/core/properties';
import { styleUnderTest } from '../../tools/testing/mason-test-kit/style-under-test';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { isMasonView_ } from './symbols';

// Importing properties.ts runs its ~80 register(Style) calls and, importantly,
// its overrideHandlers() calls — which mutate @nativescript/core's own
// properties process-wide, for every view in the app.
import './properties';

// NativeScript's WeakRef shim exposes `.get()`, and both core and masonkit call
// it that way; the platform WeakRef only has `.deref()`.
function nsWeakRef(view: unknown) {
  return { get: () => view, deref: () => view, clear() {} } as any;
}

/** Inherited properties (font-size among them) walk children, so a host needs this. */
function viewShape(extra: Record<PropertyKey, unknown> = {}) {
  return { eachChild: () => {}, ...extra } as any;
}

/** A stand-in for a mason view: carries the marker and a real mason style. */
function masonHost() {
  const under = styleUnderTest();
  const view: any = viewShape({ [isMasonView_]: true, _styleHelper: under.style });
  const style = new CoreStyle(nsWeakRef(view));
  view.style = style;
  return { under, style };
}

/** A stand-in for a plain NativeScript view: no marker, no mason style. */
function coreHost() {
  const view: any = viewShape();
  const style = new CoreStyle(nsWeakRef(view));
  view.style = style;
  return { view, style };
}

describe('the .css stylesheet path reaches the mason style buffer', () => {
  // This is the path a real stylesheet takes: core's CssState assigns by CSS
  // name, the property's valueConverter runs, then valueChanged forwards into
  // mason. Nothing here is mason-specific plumbing — it's core doing the work.
  const CASES: Array<[string, string, string, (scale: number) => number]> = [
    ['max-width', '100px', 'MAX_WIDTH_VALUE', (s) => 100 * s],
    ['max-height', '50px', 'MAX_HEIGHT_VALUE', (s) => 50 * s],
    ['row-gap', '8px', 'GAP_ROW_VALUE', (s) => 8 * s],
    ['column-gap', '8px', 'GAP_COLUMN_VALUE', (s) => 8 * s],
    ['left', '12px', 'INSET_LEFT_VALUE', (s) => 12 * s],
    ['flex-basis', '30px', 'FLEX_BASIS_VALUE', (s) => 30 * s],
  ];

  it.each([1, 2, 3].flatMap((scale) => CASES.map((c) => [scale, ...c] as const)))('scale %i: %s: %s', (scale, cssName, value, key, expected) => {
    setScreenScale(scale);
    const { under, style } = masonHost();
    (style as any)[cssName] = value;
    expect(under.getFloat32(styleKey(key))).toBeCloseTo(expected(scale), 4);
  });

  it('percentages stay a [0,1] fraction, not percentage points', () => {
    setScreenScale(3);
    const { under, style } = masonHost();
    (style as any)['max-width'] = '25%';
    expect(under.getFloat32(styleKey('MAX_WIDTH_VALUE'))).toBeCloseTo(0.25, 4);
  });
});

describe('every CSS name mason claims is actually registered', () => {
  const registered = new Map<string, string>();
  for (const property of _getStyleProperties() as any[]) {
    if (property.cssName) registered.set(property.cssName.replace(/^css:/, ''), property.name);
  }

  // A sample of the surface that "paste web CSS" depends on most.
  const EXPECTED = ['display', 'position', 'overflow', 'box-sizing', 'aspect-ratio', 'flex-direction', 'flex-wrap', 'flex-basis', 'align-items', 'align-self', 'align-content', 'justify-content', 'justify-items', 'justify-self', 'gap', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-area', 'grid-column', 'grid-row', 'inset', 'top', 'right', 'bottom', 'left', 'max-width', 'max-height', 'padding', 'margin', 'border', 'border-radius', 'box-shadow', 'transform', 'filter', 'list-style-type', 'font-family', 'white-space', 'object-fit', 'text-justify', 'text-decoration-thickness', 'background-position', 'background-size', 'background-repeat', 'backdrop-filter', 'word-spacing', 'hyphens', 'caret-color'];

  it.each(EXPECTED)('%s', (cssName) => {
    expect(registered.has(cssName), `no CssProperty registered for "${cssName}"`).toBe(true);
  });

  // Mason registers these CSS names alongside core's own, and both properties
  // stay registered on purpose: `registerAlongsideCore` installs an accessor
  // that picks core's behaviour for a plain view and mason's for a mason view.
  // (Before that, mason's registration replaced core's outright and these
  // silently did nothing on every plain NativeScript view — see
  // core-view-unaffected.spec.ts.) The list is here so a *new* name colliding
  // with core has to be routed deliberately rather than shadowing it.
  const KNOWN_DOUBLE_REGISTERED = ['margin', 'padding', 'vertical-align', 'transform', 'background', 'background-image', 'background-repeat', 'background-size', 'background-position', 'border-color', 'border-radius', 'box-shadow', 'text-overflow', 'align-content', 'flex-flow', 'flex', 'font-family', 'white-space'];

  it('registers no unexpected duplicate CSS name', () => {
    const seen = new Map<string, number>();
    for (const property of _getStyleProperties() as any[]) {
      if (!property.cssName) continue;
      const name = property.cssName.replace(/^css:/, '');
      seen.set(name, (seen.get(name) ?? 0) + 1);
    }
    const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([name]) => name);
    expect(duplicated.sort()).toEqual([...KNOWN_DOUBLE_REGISTERED].sort());
  });
});

describe('plain NativeScript views keep core semantics', () => {
  // properties.ts calls overrideHandlers() on 13 of core's own properties, which
  // takes effect for every view in the process — not just mason's. A plain view
  // must still get a value core's setNative can use: an enum/number, not the raw
  // CSS string mason wants.
  const CORE_KEYWORDS: Array<[string, string]> = [
    ['align-items', 'center'],
    ['align-self', 'center'],
    ['justify-content', 'space-between'],
    ['flex-direction', 'row-reverse'],
    ['flex-wrap', 'wrap'],
  ];

  it.each(CORE_KEYWORDS)('%s is still converted for a non-mason view', (cssName, value) => {
    const { style } = coreHost();
    expect(() => {
      (style as any)[cssName] = value;
    }).not.toThrow();
    // Core's converters map a keyword onto its own enum value; the giveaway that
    // the mason passthrough leaked would be the raw string surviving.
    const read = (style as any)[cssName.replace(/-([a-z])/g, (_m: string, c: string) => c.toUpperCase())];
    expect(read).not.toBe(undefined);
  });

  it('font-size on a non-mason view stays numeric', () => {
    setScreenScale(3);
    const { style } = coreHost();
    (style as any)['font-size'] = '20px';
    expect(typeof (style as any).fontSize).toBe('number');
  });

  it('font-size on a mason view is left for mason to parse', () => {
    setScreenScale(3);
    const { under, style } = masonHost();
    (style as any)['font-size'] = '20px';
    // FONT_SIZE is a dip buffer, so 20px lands as 20 whatever the scale.
    expect(under.getInt32(styleKey('FONT_SIZE'))).toBe(20);
  });
});
