import { describe, expect, it } from 'vitest';
import { _expandCssShorthand } from '@nativescript/core/ui/core/properties';
import { borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty } from '@nativescript/core/ui/styling/style-properties';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { styleKey } from '../../tools/testing/mason-test-kit/style-keys';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { splitBorder, splitBorderSide, splitBorderStyle } from './css-shorthands';
import { borderTopStyleProperty, borderRightStyleProperty, borderBottomStyleProperty, borderLeftStyleProperty } from './properties';
import { Div } from './web';

const SOLID = 4;
const DOTTED = 2;
const DASHED = 3;
const NONE = 0;

describe('border shorthands split into longhands', () => {
  it.each([
    ['1px solid red', ['1px', 'solid', 'red']],
    ['red 2rem dashed', ['2rem', 'dashed', 'red']],
    ['thin dotted', ['1', 'dotted', 'black']],
    ['rgb(0, 0, 255) thick', ['5', 'solid', 'rgb(0, 0, 255)']],
    ['calc(1px + 0.1rem) solid #fff', ['calc(1px + 0.1rem)', 'solid', '#fff']],
    ['0', ['0', 'solid', 'black']],
    ['none', ['0', 'none', 'black']],
    ['2px hidden blue', ['0', 'hidden', 'blue']],
    ['1px solid currentcolor', ['1px', 'solid', 'black']],
  ])('border-<side>: %s', (value, parts) => {
    expect(splitBorderSide(value)).toEqual(parts);
  });

  it.each(['', '1px 2px solid', 'solid dashed', 'red blue', '1px / 2px'])('border-<side> rejects "%s"', (value) => {
    expect(() => splitBorderSide(value)).toThrow();
  });

  it('border gives every side the same parts', () => {
    expect(splitBorder('1px solid red')).toEqual(['1px', '1px', '1px', '1px', 'solid', 'solid', 'solid', 'solid', 'red', 'red', 'red', 'red']);
  });

  it('border still takes up to four widths, as the native parsers did', () => {
    expect(splitBorder('1px 2px solid').slice(0, 4)).toEqual(['1px', '2px', '1px', '2px']);
    expect(() => splitBorder('1px 2px 3px 4px 5px')).toThrow();
  });

  it('border-style takes one to four styles', () => {
    expect(splitBorderStyle('solid')).toEqual(['solid', 'solid', 'solid', 'solid']);
    expect(splitBorderStyle('solid none dashed')).toEqual(['solid', 'none', 'dashed', 'none']);
    expect(() => splitBorderStyle('solid 1px')).toThrow();
  });

  it('core expands them at parse time, so the cascade sees longhands', () => {
    expect(_expandCssShorthand('border', '1px solid red')).toEqual([
      ['border-top-width', '1px'],
      ['border-right-width', '1px'],
      ['border-bottom-width', '1px'],
      ['border-left-width', '1px'],
      ['border-top-style', 'solid'],
      ['border-right-style', 'solid'],
      ['border-bottom-style', 'solid'],
      ['border-left-style', 'solid'],
      ['border-top-color', 'red'],
      ['border-right-color', 'red'],
      ['border-bottom-color', 'red'],
      ['border-left-color', 'red'],
    ]);
    expect(_expandCssShorthand('border-left', '2px dashed')).toEqual([
      ['border-left-width', '2px'],
      ['border-left-style', 'dashed'],
      ['border-left-color', 'black'],
    ]);
    expect(_expandCssShorthand('border-style', 'dashed')?.map(([name]) => name)).toEqual(['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style']);
  });
});

/**
 * A Mason view whose border longhands reach the style buffer through the same
 * setNative handlers a real element has.
 */
function borderHost() {
  const longhands = [borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty, borderTopStyleProperty, borderRightStyleProperty, borderBottomStyleProperty, borderLeftStyleProperty];
  const members: Record<PropertyKey, unknown> = {};
  for (const property of longhands) {
    members[property.setNative] = (Div.prototype as any)[property.setNative];
  }
  return masonHost(members);
}

/** Applies declarations the way core 9.1's cascade does: shorthands as their longhands, in order. */
function applyRules(style: any, declarations: [string, string][]) {
  for (const [name, value] of declarations) {
    for (const [longhand, part] of _expandCssShorthand(name, value) ?? [[name, value]]) {
      style[`css:${longhand}`] = part;
    }
  }
}

describe('border and the longhands cascade together', () => {
  it('a later border-width overrides border', () => {
    setScreenScale(2);
    const { under, style } = borderHost();
    applyRules(style, [
      ['border', '1px solid red'],
      ['border-width', '0 0 1px'],
    ]);
    expect(under.getFloat32(styleKey('BORDER_TOP_VALUE'))).toBe(0);
    expect(under.getFloat32(styleKey('BORDER_LEFT_VALUE'))).toBe(0);
    expect(under.getFloat32(styleKey('BORDER_BOTTOM_VALUE'))).toBe(2);
    expect(under.getInt8(styleKey('BORDER_BOTTOM_STYLE'))).toBe(SOLID);
    expect((style as any).borderBottomColor.hex).toBe('#FF0000');
  });

  it('a later border-<side> and border-style override border', () => {
    setScreenScale(1);
    const { under, style } = borderHost();
    applyRules(style, [
      ['border', '1px solid red'],
      ['border-top', '3px dashed blue'],
      ['border-left-style', 'none'],
    ]);
    expect(under.getFloat32(styleKey('BORDER_TOP_VALUE'))).toBe(3);
    expect(under.getInt8(styleKey('BORDER_TOP_STYLE'))).toBe(DASHED);
    expect(under.getInt8(styleKey('BORDER_RIGHT_STYLE'))).toBe(SOLID);
    expect(under.getInt8(styleKey('BORDER_LEFT_STYLE'))).toBe(NONE);
    expect((style as any).borderTopColor.hex).toBe('#0000FF');
    expect((style as any).borderRightColor.hex).toBe('#FF0000');
  });

  it('border overrides earlier longhands', () => {
    setScreenScale(1);
    const { under, style } = borderHost();
    applyRules(style, [
      ['border-style', 'dashed'],
      ['border-width', '4px'],
      ['border', '1rem solid'],
    ]);
    expect(under.getFloat32(styleKey('BORDER_RIGHT_VALUE'))).toBe(16);
    expect(under.getInt8(styleKey('BORDER_RIGHT_STYLE'))).toBe(SOLID);
  });

  it('border: none takes no room', () => {
    setScreenScale(1);
    const { under, style } = borderHost();
    applyRules(style, [['border', 'none']]);
    expect(under.getFloat32(styleKey('BORDER_TOP_VALUE'))).toBe(0);
    expect(under.getInt8(styleKey('BORDER_TOP_STYLE'))).toBe(NONE);
  });

  it('assigning the shorthand from code sets the longhands', () => {
    setScreenScale(1);
    const { under, style } = borderHost();
    (style as any).border = '2px dashed green';
    expect(under.getFloat32(styleKey('BORDER_LEFT_VALUE'))).toBe(2);
    expect(under.getInt8(styleKey('BORDER_LEFT_STYLE'))).toBe(DASHED);
    expect((style as any).border).toBe('2px dashed #008000');
    (style as any).borderStyle = 'solid dashed';
    expect((style as any).borderStyle).toBe('solid dashed solid dashed');
  });

  it('pseudo-class styles, which assign longhands by name, reach the buffer', () => {
    setScreenScale(1);
    const { under } = masonHost();
    const mason = under.style as any;
    for (const [name, value] of _expandCssShorthand('border-bottom', '2px dotted #00ff00') ?? []) {
      mason[name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())] = value;
    }
    expect(under.getFloat32(styleKey('BORDER_BOTTOM_VALUE'))).toBe(2);
    expect(under.getInt8(styleKey('BORDER_BOTTOM_STYLE'))).toBe(DOTTED);
    expect(mason.borderBottomColor).toBe('#00FF00');
  });

  it('a plain NativeScript view gets the widths and colors core knows', () => {
    const { style } = coreHost();
    applyRules(style, [['border', '2px solid red']]);
    // Core's own reading of px, a device pixel.
    expect((style as any).borderTopWidth).toEqual({ unit: 'px', value: 2 });
    expect((style as any).borderLeftColor.hex).toBe('#FF0000');
  });
});
