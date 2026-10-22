import { describe, expect, it } from 'vitest';
import { _expandCssShorthand, unsetValue } from '@nativescript/core/ui/core/properties';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { installMasonSizeUnits, logicalLonghands } from './properties';
import { setCssUnitContext } from './units';

const expand = (name: string, value: string) => _expandCssShorthand(name, value);

/** Applies declarations the way core 9.1's cascade does: shorthands as their longhands, in order. */
function applyRules(style: any, declarations: [string, string][]) {
  for (const [name, value] of declarations) {
    for (const [longhand, part] of expand(name, value) ?? [[name, value]]) {
      style[`css:${longhand}`] = part;
    }
  }
}

describe('logical shorthands', () => {
  it.each([
    [
      'margin-inline',
      '1rem 2rem',
      [
        ['margin-inline-start', '1rem'],
        ['margin-inline-end', '2rem'],
      ],
    ],
    [
      'margin-inline',
      'auto',
      [
        ['margin-inline-start', 'auto'],
        ['margin-inline-end', 'auto'],
      ],
    ],
    [
      'margin-block',
      '4px',
      [
        ['margin-block-start', '4px'],
        ['margin-block-end', '4px'],
      ],
    ],
    [
      'padding-inline',
      '1rem 0',
      [
        ['padding-inline-start', '1rem'],
        ['padding-inline-end', '0'],
      ],
    ],
    [
      'inset-inline',
      '0',
      [
        ['inset-inline-start', '0'],
        ['inset-inline-end', '0'],
      ],
    ],
    // Borders and corners stay shorthands over the physical sides for horizontal left-to-right text.
    [
      'border-inline-width',
      'thin 2px',
      [
        ['border-left-width', 'thin'],
        ['border-right-width', '2px'],
      ],
    ],
    ['border-block-start-width', '3px', [['border-top-width', '3px']]],
    [
      'border-inline-style',
      'dashed',
      [
        ['border-left-style', 'dashed'],
        ['border-right-style', 'dashed'],
      ],
    ],
    ['border-block-end-style', 'solid', [['border-bottom-style', 'solid']]],
    [
      'border-inline-color',
      'red blue',
      [
        ['border-left-color', 'red'],
        ['border-right-color', 'blue'],
      ],
    ],
    ['border-inline-start-color', 'red', [['border-left-color', 'red']]],
    [
      'border-block-end',
      '1px solid red',
      [
        ['border-bottom-width', '1px'],
        ['border-bottom-style', 'solid'],
        ['border-bottom-color', 'red'],
      ],
    ],
    ['border-start-start-radius', '4px', [['border-top-left-radius', '4px']]],
    ['border-start-end-radius', '4px', [['border-top-right-radius', '4px']]],
    ['border-end-end-radius', '4px', [['border-bottom-right-radius', '4px']]],
    ['border-end-start-radius', '4px', [['border-bottom-left-radius', '4px']]],
    ['overflow-inline', 'hidden', [['overflow-x', 'hidden']]],
    ['overflow-block', 'auto', [['overflow-y', 'auto']]],
  ] as Array<[string, string, [string, string][]]>)('%s: %s', (name, value, longhands) => {
    expect(expand(name, value)).toEqual(longhands);
  });

  it.each(['margin-inline-start', 'padding-block-end', 'inset-block-start', 'inline-size', 'max-block-size'])('%s is a longhand of its own', (name) => {
    expect(expand(name, '1px')).toBeUndefined();
  });

  it('border-inline gives both inline sides the same border', () => {
    expect(expand('border-inline', '2px dotted green')).toEqual([
      ['border-left-width', '2px'],
      ['border-left-style', 'dotted'],
      ['border-left-color', 'green'],
      ['border-right-width', '2px'],
      ['border-right-style', 'dotted'],
      ['border-right-color', 'green'],
    ]);
  });

  it.each([
    ['margin-inline', '1px 2px 3px'],
    ['padding-block', 'auto'],
    ['border-inline-style', 'solid 1px'],
  ])('%s rejects "%s"', (name, value) => {
    expect(expand(name, value)).toBeUndefined();
  });
});

// Stamps: physical top, right, bottom, left, then logical block-start, inline-end, block-end, inline-start.
const stamps = (under: { getUint8(offset: number): number }, group: string) => Array.from({ length: 8 }, (_, i) => under.getUint8(styleKey(`${group}_ORDER`) + i));

/** A Mason view host whose native view exists, so core runs the logical longhands' setNative. */
function nativeHost() {
  const handlers: Record<PropertyKey, unknown> = { nativeViewProtected: {} };
  const host = masonHost(handlers);
  for (const { property, group, slot } of logicalLonghands) {
    handlers[property.setNative] = (value: unknown) => host.under.style.setLogical(group, slot, value);
    host.view[property.setNative] = handlers[property.setNative];
  }
  return host;
}

describe('logical sides on a Mason view', () => {
  it('store their value in the logical slot, stamped', () => {
    setScreenScale(2);
    const { under, style } = nativeHost();
    applyRules(style, [['margin-block-start', '6px']]);
    expect(under.getFloat32(styleKey('MARGIN_BLOCK_START_VALUE'))).toBeCloseTo(12, 3);
    expect(stamps(under, 'MARGIN')[4]).toBeGreaterThan(0);
    // The physical top margin is untouched.
    expect(under.getFloat32(styleKey('MARGIN_TOP_VALUE'))).toBe(0);
  });

  it('a physical write after a logical one is stamped later, and the reverse', () => {
    const { under, style } = nativeHost();
    applyRules(style, [
      ['inset-inline-start', '4px'],
      ['left', '9px'],
    ]);
    let order = stamps(under, 'INSET');
    expect(order[3]).toBeGreaterThan(order[7]);
    applyRules(style, [['inset-inline-start', '5px']]);
    order = stamps(under, 'INSET');
    expect(order[7]).toBeGreaterThan(order[3]);
  });

  it('physical writes stay unstamped while a group has no logical sides', () => {
    const { under, style } = nativeHost();
    applyRules(style, [['inset', '1px 2px']]);
    expect(stamps(under, 'INSET')).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('removing a logical declaration clears its stamp', () => {
    const { under, style } = nativeHost();
    applyRules(style, [['padding-inline-end', '3px']]);
    expect(stamps(under, 'PADDING')[5]).toBeGreaterThan(0);
    (style as any)['css:padding-inline-end'] = unsetValue;
    expect(stamps(under, 'PADDING')[5]).toBe(0);
  });

  it('inline-size resolves Mason units', () => {
    setScreenScale(1);
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { under, style } = nativeHost();
    installMasonSizeUnits(style as never);
    applyRules(style, [['inline-size', '10rem']]);
    expect(under.getFloat32(styleKey('INLINE_SIZE_VALUE'))).toBeCloseTo(160, 3);
  });

  it('inset-inline-start reaches the buffer', () => {
    setScreenScale(2);
    const { under, style } = nativeHost();
    applyRules(style, [['inset-inline-start', '6px']]);
    expect(under.getFloat32(styleKey('INSET_INLINE_START_VALUE'))).toBeCloseTo(12, 3);
  });

  it('stamps keep their order past the counter', () => {
    const { under, style } = nativeHost();
    for (let i = 0; i < 300; i++) {
      applyRules(style, [i % 2 ? ['left', `${i}px`] : ['inset-inline-start', `${i}px`]]);
    }
    const order = stamps(under, 'INSET');
    expect(order[3]).toBeGreaterThan(order[7]);
    expect(under.getUint8(styleKey('LOGICAL_SEQ'))).toBeLessThan(255);
  });

  it('assigning a shorthand from code sets the logical longhands', () => {
    const { style } = nativeHost();
    (style as any).marginBlock = '1px 2px';
    expect((style as any).marginBlockStart).toBe('1px');
    expect((style as any).marginBlockEnd).toBe('2px');
    expect((style as any).marginBlock).toBe('1px 2px');
  });
});

describe('logical sides on a plain NativeScript view', () => {
  it('set the physical properties core knows, for horizontal left-to-right text', () => {
    const { style } = coreHost();
    applyRules(style, [['margin-inline-start', '12']]);
    expect((style as any).marginLeft).toBe(12);
  });
});
