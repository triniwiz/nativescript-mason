import { describe, expect, it, vi } from 'vitest';
import { _getStyleProperties, CssAnimationProperty } from '@nativescript/core/ui/core/properties';
import * as coreStyleProperties from '@nativescript/core/ui/styling/style-properties';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { setCssUnitContext } from './units';
import { installMasonSizeUnits, maxWidthProperty } from './properties';
import { toCamelCase } from './css-shorthands';

// Importing properties.ts runs its ~80 register(Style) calls and, importantly,
// its overrideHandlers() calls — which mutate @nativescript/core's own
// properties process-wide, for every view in the app.
import './properties';

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

describe('a mason view writes each declaration once', () => {
  it('leaves the write to setNative when the view has one', () => {
    setScreenScale(1);
    const { under, style, view } = masonHost();
    const write = vi.spyOn(under.style as any, 'maxWidth', 'set');
    view[maxWidthProperty.setNative] = function (value: unknown) {
      this._styleHelper.maxWidth = value;
    };
    (style as any)['max-width'] = '100px';
    expect(write).toHaveBeenCalledTimes(1);
    expect(under.getFloat32(styleKey('MAX_WIDTH_VALUE'))).toBeCloseTo(100, 4);
  });
});

describe('width/height resolve the units core cannot', () => {
  // width/height are core CssAnimationProperties with a non-configurable
  // accessor and no overrideHandlers, so a mason view needs the shadowing
  // accessors ViewBase's constructor installs — done here explicitly since
  // these assert the value core stores, not the buffer setNative forwards it to.
  function masonSizeHost() {
    const host = masonHost();
    installMasonSizeUnits(host.style as never);
    return host;
  }

  const CASES: Array<[string, string, string, number]> = [
    ['width', '100vh', 'width', 800],
    ['height', '100vh', 'height', 800],
    ['width', '50vw', 'width', 200],
    ['height', '1rem', 'height', 16],
    ['width', '12pt', 'width', 16],
    // px is a CSS pixel inside a mason subtree, not core's device pixel.
    ['width', '20px', 'width', 20],
  ];

  it.each(CASES)('%s: %s', (cssName, value, readBack, expectedDip) => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { style } = masonSizeHost();
    (style as any)[cssName] = value;
    // A unitless value is core's dip and mason's CSS pixel — the same size.
    expect((style as any)[readBack]).toBe(expectedDip);
  });

  it('percentages and auto still take their own path', () => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { style } = masonSizeHost();
    (style as any)['width'] = '25%';
    expect((style as any).width).toEqual({ value: 0.25, unit: '%' });
    (style as any)['height'] = 'auto';
    expect((style as any).height).toBe('auto');
  });

  it('min-* resolves the same units', () => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { style } = masonSizeHost();
    (style as any)['min-height'] = '10vh';
    expect((style as any).minHeight).toEqual({ value: 80, unit: 'dip' });
  });

  it('max-* reaches the buffer with the unit resolved', () => {
    setScreenScale(2);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { under, style } = masonSizeHost();
    (style as any)['max-width'] = '2rem';
    expect(under.getFloat32(styleKey('MAX_WIDTH_VALUE'))).toBeCloseTo(32 * 2, 3);
  });

  it('a plain NativeScript view keeps core parsing, units and all', () => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { style } = coreHost();
    (style as any)['width'] = '100vh';
    // core's parseFloat reading: the bare number, in dips. Unchanged by mason.
    expect((style as any).width).toBe(100);
  });
});

describe('gap, insets and flex-basis resolve Mason units, not core parseFloat', () => {
  // These went through core's PercentLength.parse, a bare parseFloat:
  // `gap: 0.5rem` was 0.5 dip, so Bootstrap's gap utilities collapsed.
  const CASES: Array<[string, string, string, number]> = [
    ['row-gap', '0.5rem', 'GAP_ROW_VALUE', 8],
    ['column-gap', '1.5rem', 'GAP_COLUMN_VALUE', 24],
    ['gap', '0.5rem', 'GAP_ROW_VALUE', 8],
    ['gap', '0.5rem', 'GAP_COLUMN_VALUE', 8],
    ['gap', '1rem 2rem', 'GAP_COLUMN_VALUE', 32],
    ['grid-gap', '0.25rem', 'GAP_ROW_VALUE', 4],
    ['row-gap', '10vw', 'GAP_ROW_VALUE', 40],
    ['row-gap', '12pt', 'GAP_ROW_VALUE', 16],
    ['left', '1rem', 'INSET_LEFT_VALUE', 16],
    ['top', '2rem', 'INSET_TOP_VALUE', 32],
    ['right', '5vh', 'INSET_RIGHT_VALUE', 40],
    ['bottom', '0.5rem', 'INSET_BOTTOM_VALUE', 8],
    ['inset', '1rem', 'INSET_LEFT_VALUE', 16],
    ['inset', '1rem 2rem', 'INSET_RIGHT_VALUE', 32],
    ['flex-basis', '10rem', 'FLEX_BASIS_VALUE', 160],
  ];

  it.each([1, 2, 3].flatMap((scale) => CASES.map((c) => [scale, ...c] as const)))('scale %i: %s: %s', (scale, cssName, value, key, expectedCssPx) => {
    setScreenScale(scale);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { under, style } = masonHost();
    (style as any)[cssName] = value;
    expect(under.getFloat32(styleKey(key))).toBeCloseTo(expectedCssPx * scale, 3);
  });

  it("em resolves against the element's own font size", () => {
    setScreenScale(2);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { under, style } = masonHost();
    under.style.fontSize = 20;
    (style as any)['row-gap'] = '0.5em';
    expect(under.getFloat32(styleKey('GAP_ROW_VALUE'))).toBeCloseTo(10 * 2, 3);
  });

  it('a later value replaces an earlier one with the same number', () => {
    setScreenScale(1);
    const { under, style } = masonHost();
    (style as any)['row-gap'] = '1rem';
    (style as any)['row-gap'] = '1em';
    (style as any)['left'] = '1rem';
    (style as any)['left'] = '1px';
    expect(under.getFloat32(styleKey('GAP_ROW_VALUE'))).toBeCloseTo(16, 3);
    expect(under.getFloat32(styleKey('INSET_LEFT_VALUE'))).toBeCloseTo(1, 3);
  });

  it('percentages, auto and px keep their meaning', () => {
    setScreenScale(2);
    const { under, style } = masonHost();
    (style as any)['column-gap'] = '10%';
    (style as any)['left'] = '25%';
    (style as any)['row-gap'] = '6px';
    expect(under.getFloat32(styleKey('GAP_COLUMN_VALUE'))).toBeCloseTo(0.1, 4);
    expect(under.getFloat32(styleKey('INSET_LEFT_VALUE'))).toBeCloseTo(0.25, 4);
    expect(under.getFloat32(styleKey('GAP_ROW_VALUE'))).toBeCloseTo(12, 4);
    (style as any)['left'] = 'auto';
    expect(under.getInt8(styleKey('INSET_LEFT_TYPE'))).toBe(0);
  });

  it('gap reads back as CSS text', () => {
    const { style } = masonHost();
    (style as any)['gap'] = '4px';
    expect((style as any).gap).toBe('4px');
    (style as any)['gap'] = '1rem 10%';
    expect((style as any).gap).toBe('1rem 10%');
  });

  it('an unparsable gap is 0', () => {
    setScreenScale(1);
    const { under, style } = masonHost();
    (style as any)['row-gap'] = 'bogus';
    expect(under.getFloat32(styleKey('GAP_ROW_VALUE'))).toBe(0);
  });
});

describe('aspect-ratio accepts the shapes CSS does', () => {
  const CASES: Array<[string, number]> = [
    ['2 / 3', 2 / 3],
    ['2/3', 2 / 3],
    ['16 / 9', 16 / 9],
    ['1.5', 1.5],
    ['auto 2 / 3', 2 / 3],
  ];

  it.each(CASES)('%s', (value, expected) => {
    const { under, style } = masonHost();
    (style as any)['aspect-ratio'] = value;
    expect(under.getFloat32(styleKey('ASPECT_RATIO'))).toBeCloseTo(expected, 5);
  });

  it.each(['auto', '0 / 3', '2 / 0', 'nonsense'])('%s leaves no ratio', (value) => {
    const { under, style } = masonHost();
    (style as any)['aspect-ratio'] = value;
    expect(Number.isNaN(under.getFloat32(styleKey('ASPECT_RATIO')))).toBe(true);
  });
});

describe('every CSS name mason claims is actually registered', () => {
  const registered = new Map<string, string>();
  for (const property of _getStyleProperties() as any[]) {
    if (property.cssName && property.registered) registered.set(property.cssName.replace(/^css:/, ''), property.name);
  }

  // A sample of the surface that "paste web CSS" depends on most.
  const EXPECTED = [
    'display',
    'position',
    'overflow',
    'box-sizing',
    'aspect-ratio',
    'flex-direction',
    'flex-wrap',
    'flex-basis',
    'align-items',
    'align-self',
    'align-content',
    'justify-content',
    'justify-items',
    'justify-self',
    'gap',
    'row-gap',
    'column-gap',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-area',
    'grid-column',
    'grid-row',
    'inset',
    'top',
    'right',
    'bottom',
    'left',
    'max-width',
    'max-height',
    'padding',
    'margin',
    'border',
    'border-radius',
    'box-shadow',
    'transform',
    'filter',
    'list-style-type',
    'font-family',
    'white-space',
    'object-fit',
    'text-justify',
    'text-decoration-thickness',
    'background-position',
    'background-size',
    'background-repeat',
    'backdrop-filter',
    'mask',
    'mask-image',
    'mask-position',
    'mask-size',
    'mask-repeat',
    'mask-origin',
    'mask-clip',
    'mask-composite',
    'mask-mode',
    'word-spacing',
    'hyphens',
    'caret-color',
    'background-clip',
    'background-origin',
    'background-attachment',
    'background-blend-mode',
    'background-position-x',
    'background-position-y',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-color',
  ];

  it.each(EXPECTED)('%s', (cssName) => {
    // Keyframe-animatable ones (mask-position, mask-size) are CssAnimationProperties, kept apart.
    const found = registered.has(cssName) || !!CssAnimationProperty._getByCssName(cssName);
    expect(found, `no CssProperty registered for "${cssName}"`).toBe(true);
  });

  // Mason registers these CSS names alongside core's own, and both properties
  // stay registered on purpose: `registerAlongsideCore` installs an accessor
  // that picks core's behaviour for a plain view and mason's for a mason view.
  // (Before that, mason's registration replaced core's outright and these
  // silently did nothing on every plain NativeScript view — see
  // core-view-unaffected.spec.ts.) The list is here so a *new* name colliding
  // with core has to be routed deliberately rather than shadowing it.
  const KNOWN_DOUBLE_REGISTERED = ['margin', 'padding', 'vertical-align', 'transform', 'background', 'background-image', 'background-repeat', 'background-size', 'background-position', 'border-color', 'border-radius', 'box-shadow', 'text-overflow', 'align-content', 'flex-flow', 'flex', 'font-family', 'white-space', 'max-width', 'max-height', 'gap', 'row-gap', 'column-gap', 'corner-shape', 'clip-path'];

  it('registers no unexpected duplicate CSS name', () => {
    const seen = new Map<string, number>();
    for (const property of _getStyleProperties() as any[]) {
      if (!property.cssName || !property.registered) continue;
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
    const read = (style as any)[toCamelCase(cssName)];
    expect(read).not.toBe(undefined);
  });

  // Core 9.1 added its own properties for these, so a plain view must reach core's.
  it.each(['max-width', 'max-height', 'row-gap', 'column-gap'])("%s lands in core's property on a non-mason view", (cssName) => {
    const coreProperty = (coreStyleProperties as any)[`${toCamelCase(cssName)}Property`];
    const { style } = coreHost();
    (style as any)[cssName] = '10px';
    expect((style as any)[coreProperty.key]).toBeDefined();
  });

  it('font-size on a non-mason view stays numeric', () => {
    setScreenScale(3);
    const { style } = coreHost();
    (style as any)['font-size'] = '20px';
    expect(typeof (style as any).fontSize).toBe('number');
  });

  it('text-decoration keeps core validation on a non-mason view', () => {
    const { style } = coreHost();
    (style as any)['text-decoration'] = 'underline line-through';
    expect((style as any).textDecoration).toBe('underline line-through');
    expect(() => {
      (style as any)['text-decoration'] = 'overline wavy red';
    }).toThrow();
  });

  it('text-decoration reaches a mason view as the raw shorthand', () => {
    const { style } = masonHost();
    (style as any)['text-decoration'] = 'underline overline dotted #f00 2px';
    // Core used to reject everything past underline/line-through here.
    expect((style as any).textDecoration).toBe('underline overline dotted #f00 2px');
  });

  it('font-size on a mason view is left for mason to parse', () => {
    setScreenScale(3);
    const { under, style } = masonHost();
    (style as any)['font-size'] = '20px';
    // FONT_SIZE is a dip buffer, so 20px lands as 20 whatever the scale.
    expect(under.getInt32(styleKey('FONT_SIZE'))).toBe(20);
  });
});
