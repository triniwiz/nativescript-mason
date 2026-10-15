import { describe, expect, it } from 'vitest';
import { _expandCssShorthand } from '@nativescript/core/ui/core/properties';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { installMasonSizeUnits } from './properties';
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

describe('logical properties map onto physical longhands, left to right', () => {
  it.each([
    [
      'margin-inline',
      '1rem 2rem',
      [
        ['margin-left', '1rem'],
        ['margin-right', '2rem'],
      ],
    ],
    [
      'margin-inline',
      'auto',
      [
        ['margin-left', 'auto'],
        ['margin-right', 'auto'],
      ],
    ],
    [
      'margin-block',
      '4px',
      [
        ['margin-top', '4px'],
        ['margin-bottom', '4px'],
      ],
    ],
    ['margin-inline-start', '1rem', [['margin-left', '1rem']]],
    ['margin-inline-end', '1rem', [['margin-right', '1rem']]],
    ['margin-block-start', '1rem', [['margin-top', '1rem']]],
    ['margin-block-end', '1rem', [['margin-bottom', '1rem']]],
    [
      'padding-inline',
      '1rem 0',
      [
        ['padding-left', '1rem'],
        ['padding-right', '0'],
      ],
    ],
    ['padding-block-end', '0.5rem', [['padding-bottom', '0.5rem']]],
    [
      'inset-inline',
      '0',
      [
        ['left', '0'],
        ['right', '0'],
      ],
    ],
    ['inset-block-start', '10%', [['top', '10%']]],
    ['inset-inline-end', 'auto', [['right', 'auto']]],
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
    ['inline-size', '10rem', [['width', '10rem']]],
    ['block-size', '50%', [['height', '50%']]],
    ['min-inline-size', '0', [['min-width', '0']]],
    ['max-inline-size', '40rem', [['max-width', '40rem']]],
    ['min-block-size', '1rem', [['min-height', '1rem']]],
    ['max-block-size', 'none', [['max-height', 'none']]],
    ['overflow-inline', 'hidden', [['overflow-x', 'hidden']]],
    ['overflow-block', 'auto', [['overflow-y', 'auto']]],
  ] as Array<[string, string, [string, string][]]>)('%s: %s', (name, value, longhands) => {
    expect(expand(name, value)).toEqual(longhands);
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

describe('logical and physical declarations cascade together', () => {
  it('the later declaration wins, whichever kind it is', () => {
    const { style } = masonHost();
    applyRules(style, [
      ['margin-inline', '1rem 2rem'],
      ['margin-left', '3px'],
      ['padding-right', '4px'],
      ['padding-inline-end', '5px'],
    ]);
    expect((style as any).marginLeft.css).toBe('3px');
    expect((style as any).marginRight.css).toBe('2rem');
    expect((style as any).paddingRight.css).toBe('5px');
  });

  it('assigning one from code sets the physical longhands', () => {
    const { style } = masonHost();
    (style as any).marginBlock = '1px 2px';
    expect((style as any).marginTop.css).toBe('1px');
    expect((style as any).marginBottom.css).toBe('2px');
    expect((style as any).marginBlock).toBe('1px 2px');
    (style as any).paddingInline = '7px';
    expect((style as any).paddingInline).toBe('7px');
  });

  it('inline-size resolves Mason units on a Mason view', () => {
    setCssUnitContext({ rootFontSize: 16, viewportWidth: 400, viewportHeight: 800 });
    const { style } = masonHost();
    installMasonSizeUnits(style as never);
    applyRules(style, [['inline-size', '10rem']]);
    expect((style as any).width).toBe(160);
  });

  it('inset-inline-start reaches the buffer', () => {
    setScreenScale(2);
    const { under, style } = masonHost();
    applyRules(style, [['inset-inline-start', '6px']]);
    expect(under.getFloat32(styleKey('INSET_LEFT_VALUE'))).toBeCloseTo(12, 3);
  });

  it('a plain NativeScript view gets the physical properties core knows', () => {
    const { style } = coreHost();
    applyRules(style, [['margin-inline-start', '12']]);
    expect((style as any).marginLeft).toBe(12);
  });
});
