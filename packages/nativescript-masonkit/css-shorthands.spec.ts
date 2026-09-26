import { describe, expect, it, vi } from 'vitest';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty, borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, paddingLeftProperty, borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty } from '@nativescript/core/ui/styling/style-properties';
import { PercentLength as CorePercentLength } from '@nativescript/core/ui/styling/length-shared';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { borderRadiusCorners, composeBorderRadius, splitBackground, splitBorderColor, splitBorderRadius, splitBorderWidth, splitFlex, splitFlexFlow, splitGap, splitMargin, splitOverflow, splitPadding, tokenizeCss } from './css-shorthands';
import { backgroundAttachmentProperty, backgroundClipProperty, backgroundOriginProperty, backgroundImageProperty, backgroundPositionProperty, backgroundRepeatProperty, backgroundSizeProperty, masonShorthands, shorthandConverter } from './properties';

function entry(cssName: string) {
  const found = masonShorthands.find((shorthand) => shorthand.cssName === cssName);
  if (!found) {
    throw new Error(`no MasonKit shorthand for ${cssName}`);
  }
  return found;
}

function applyAsCore91Stylesheet(style: any, cssName: string, value: string) {
  for (const [property, part] of shorthandConverter(entry(cssName))(value)) {
    style[property.cssName] = part;
  }
}

function setNativeSpies(longhands: { cssLocalName: string; setNative: symbol }[]) {
  const spies: Record<string, ReturnType<typeof vi.fn>> = {};
  const members: Record<PropertyKey, unknown> = {};
  for (const property of longhands) {
    spies[property.cssLocalName] = members[property.setNative] = vi.fn();
  }
  return { spies, members };
}

describe('tokenizeCss', () => {
  it('splits at top-level whitespace and keeps , and / as tokens', () => {
    expect(tokenizeCss(' 10px\t20px/5px , red ')).toEqual(['10px', '20px', '/', '5px', ',', 'red']);
  });

  it('keeps functions and quoted strings whole', () => {
    expect(tokenizeCss('rgb(0, 0, 0) url("a b/c.png") linear-gradient(to right, rgba(0,0,0,.5), red)')).toEqual(['rgb(0, 0, 0)', 'url("a b/c.png")', 'linear-gradient(to right, rgba(0,0,0,.5), red)']);
    expect(tokenizeCss("url('a)b') x")).toEqual(["url('a)b')", 'x']);
  });

  it.each(['rgb(0, 0', 'a)', '"open'])('rejects unbalanced input %s', (value) => {
    expect(() => tokenizeCss(value)).toThrow();
  });
});

describe('every shorthand converter lists all its longhands for the unsetValue probe', () => {
  it.each(masonShorthands.map((shorthand) => [shorthand.cssName, shorthand] as const))('%s', (_cssName, shorthand) => {
    const probed = shorthandConverter(shorthand)(unsetValue);
    expect(probed.map(([property]) => property.cssLocalName)).toEqual(shorthand.longhands.map((property) => property.cssLocalName));
    expect(probed.every(([, value]) => value === unsetValue)).toBe(true);
  });

  it('gives a CSS-wide keyword to every longhand', () => {
    expect(shorthandConverter(entry('border-radius'))('inherit').map(([, value]) => value)).toEqual(['inherit', 'inherit', 'inherit', 'inherit']);
  });
});

describe('border-radius', () => {
  it.each([
    ['10px', ['10px', '10px', '10px', '10px']],
    ['1px 2px', ['1px', '2px', '1px', '2px']],
    ['1px 2px 3px', ['1px', '2px', '3px', '2px']],
    ['1px 2px 3px 4px', ['1px', '2px', '3px', '4px']],
    ['50%', ['50%', '50%', '50%', '50%']],
    ['10px / 5px', ['10px 5px', '10px 5px', '10px 5px', '10px 5px']],
    ['10px 20px/5%', ['10px 5%', '20px 5%', '10px 5%', '20px 5%']],
    ['1px 2px 3px 4px / 5px 6px 7px', ['1px 5px', '2px 6px', '3px 7px', '4px 6px']],
    ['1rem', ['1rem', '1rem', '1rem', '1rem']],
  ])('%s', (value, corners) => {
    expect(splitBorderRadius(value)).toEqual(corners);
  });

  it.each(['', '1px 2px 3px 4px 5px', '10px /', '/ 10px', '1px / 2px / 3px', 'red'])('rejects "%s"', (value) => {
    expect(() => splitBorderRadius(value)).toThrow();
  });

  it('composes corners back into one value, with a / part only when a corner is elliptical', () => {
    expect(composeBorderRadius(borderRadiusCorners('4px'))).toBe('4px 4px 4px 4px');
    expect(composeBorderRadius(borderRadiusCorners('1px 2px / 3px'))).toBe('1px 2px 1px 2px / 3px 3px 3px 3px');
  });

  const radii = [borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty];

  it("reaches a Mason view as core's parse carrying the CSS text, through core's valueChanged", () => {
    setScreenScale(2);
    const { spies, members } = setNativeSpies(radii);
    const { style } = masonHost(members);
    applyAsCore91Stylesheet(style, 'border-radius', '50% 1rem / 2px');
    expect(spies['border-top-left-radius']).toHaveBeenLastCalledWith({ value: 50, unit: 'px', css: '50% 2px' });
    expect(spies['border-top-right-radius']).toHaveBeenLastCalledWith({ value: 1, unit: 'px', css: '1rem 2px' });
    applyAsCore91Stylesheet(style, 'border-radius', '50%');
    expect(spies['border-bottom-left-radius']).toHaveBeenLastCalledWith({ value: 50, unit: 'dip', css: '50%' });
    expect((style as any).backgroundInternal.borderTopLeftRadius).toBe(100);
  });

  it('reaches a Mason view again when only the CSS text changes', () => {
    const { spies, members } = setNativeSpies(radii);
    const { style } = masonHost(members);
    (style as any)['css:border-top-left-radius'] = '10%';
    (style as any)['css:border-top-left-radius'] = '10';
    expect(spies['border-top-left-radius'].mock.calls.map(([value]) => value.css)).toEqual(['10%', '10']);
  });

  it('gives core a finite 0 for CSS text its parser rejects', () => {
    const { spies, members } = setNativeSpies(radii);
    const { style } = masonHost(members);
    (style as any)['css:border-top-left-radius'] = 'calc(1px + 2%)';
    expect(spies['border-top-left-radius']).toHaveBeenLastCalledWith({ value: 0, unit: 'dip', css: 'calc(1px + 2%)' });
  });

  it("reaches a core view parsed by core's Length.parse, with core's background radius", () => {
    setScreenScale(2);
    const { spies, members } = setNativeSpies(radii);
    const { style } = coreHost(members);
    applyAsCore91Stylesheet(style, 'border-radius', '10 4px');
    expect(spies['border-top-left-radius']).toHaveBeenLastCalledWith(10);
    expect(spies['border-top-right-radius']).toHaveBeenLastCalledWith({ unit: 'px', value: 4 });
    expect((style as any).backgroundInternal.borderTopLeftRadius).toBe(20);
    expect((style as any).backgroundInternal.borderTopRightRadius).toBe(4);
  });
});

describe('margin, padding, border-width and border-color', () => {
  it.each([
    ['10px', ['10px', '10px', '10px', '10px']],
    ['1px 2px', ['1px', '2px', '1px', '2px']],
    ['1px 2px 3px', ['1px', '2px', '3px', '2px']],
    ['1px 2px 3px 4px', ['1px', '2px', '3px', '4px']],
    ['auto 10%', ['auto', '10%', 'auto', '10%']],
    ['10, 20', ['10', '20', '10', '20']],
    ['-1rem calc(2px + 1%)', ['-1rem', 'calc(2px + 1%)', '-1rem', 'calc(2px + 1%)']],
  ])('margin: %s', (value, sides) => {
    expect(splitMargin(value)).toEqual(sides);
  });

  it.each(['', '1px 2px 3px 4px 5px', '1px / 2px', 'wide'])('margin rejects "%s"', (value) => {
    expect(() => splitMargin(value)).toThrow();
  });

  it('padding rejects auto', () => {
    expect(() => splitPadding('auto')).toThrow();
    expect(splitPadding('5% 1em')).toEqual(['5%', '1em', '5%', '1em']);
  });

  it('border-width takes the width keywords', () => {
    expect(splitBorderWidth('thin 2px medium')).toEqual(['thin', '2px', 'medium', '2px']);
    expect(() => splitBorderWidth('toString')).toThrow();
  });

  it('border-color splits only at top-level separators', () => {
    expect(splitBorderColor('rgb(0, 0, 0) red')).toEqual(['rgb(0, 0, 0)', 'red', 'rgb(0, 0, 0)', 'red']);
    expect(splitBorderColor('#fff hsl(0 0% 0% / 50%) blue')).toEqual(['#fff', 'hsl(0 0% 0% / 50%)', 'blue', 'hsl(0 0% 0% / 50%)']);
    expect(() => splitBorderColor('red / blue')).toThrow();
  });

  const margins = [marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty];
  const paddings = [paddingTopProperty, paddingRightProperty, paddingBottomProperty, paddingLeftProperty];
  const widths = [borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty];
  const colors = [borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty];

  it("margin reaches a Mason view as core's parse carrying the CSS text, and a core view parsed", () => {
    const mason = setNativeSpies(margins);
    applyAsCore91Stylesheet(masonHost(mason.members).style, 'margin', '10% 2rem');
    expect(mason.spies['margin-top']).toHaveBeenLastCalledWith({ value: 0.1, unit: '%', css: '10%' });
    expect(mason.spies['margin-right']).toHaveBeenLastCalledWith({ value: 2, unit: 'dip', css: '2rem' });

    const core = setNativeSpies(margins);
    applyAsCore91Stylesheet(coreHost(core.members).style, 'margin', '10% 20');
    expect(core.spies['margin-top']).toHaveBeenLastCalledWith({ unit: '%', value: 0.1 });
    expect(core.spies['margin-right']).toHaveBeenLastCalledWith(20);
  });

  it('a Mason view inside a core layout reads a finite margin', () => {
    setScreenScale(1);
    const { style } = masonHost();
    applyAsCore91Stylesheet(style, 'margin', '10% 2rem');
    expect(CorePercentLength.toDevicePixels((style as any).marginTop, 0, 400)).toBe(40);
    expect(CorePercentLength.toDevicePixels((style as any).marginLeft, 0, 400)).toBe(2);
  });

  it("padding reaches a Mason view carrying the CSS text, through core's valueChanged", () => {
    setScreenScale(2);
    const mason = setNativeSpies(paddings);
    const { view, style } = masonHost(mason.members);
    applyAsCore91Stylesheet(style, 'padding', '5% 2rem');
    expect(mason.spies['padding-top'].mock.lastCall?.[0].css).toBe('5%');
    expect(mason.spies['padding-left'].mock.lastCall?.[0].css).toBe('2rem');
    expect(view.effectivePaddingTop).toBe(10);
    expect(view.effectivePaddingLeft).toBe(4);
  });

  it("padding reaches a core view parsed, with core's effective padding", () => {
    setScreenScale(2);
    const core = setNativeSpies(paddings);
    const { view, style } = coreHost({ ...core.members, getEffectivePaddingShorthand: () => 'shorthand' });
    applyAsCore91Stylesheet(style, 'padding', '10 4px');
    expect(core.spies['padding-top']).toHaveBeenLastCalledWith(10);
    expect(core.spies['padding-right']).toHaveBeenLastCalledWith({ unit: 'px', value: 4 });
    expect(view.effectivePaddingTop).toBe(20);
    expect(view.effectivePaddingRight).toBe(4);
    expect((style as any).paddingInternal).toBe('shorthand');
  });

  it('border-width maps thin, medium and thick for both kinds of view', () => {
    setScreenScale(2);
    const mason = setNativeSpies(widths);
    const { style: masonStyle } = masonHost(mason.members);
    applyAsCore91Stylesheet(masonStyle, 'border-width', 'thin 2rem medium thick');
    expect(Object.values(mason.spies).map((spy) => spy.mock.lastCall?.[0].css)).toEqual(['1', '2rem', '3', '5']);
    expect((masonStyle as any).backgroundInternal.borderTopWidth).toBe(2);

    const core = setNativeSpies(widths);
    const { view, style } = coreHost(core.members);
    applyAsCore91Stylesheet(style, 'border-width', 'thick 1');
    expect(core.spies['border-top-width']).toHaveBeenLastCalledWith(5);
    expect(view.effectiveBorderTopWidth).toBe(10);
    expect((style as any).backgroundInternal.borderRightWidth).toBe(2);
  });

  it('border-color reaches both kinds of view as one Color per side', () => {
    const mason = setNativeSpies(colors);
    applyAsCore91Stylesheet(masonHost(mason.members).style, 'border-color', 'red rgb(0, 0, 255)');
    expect(mason.spies['border-top-color'].mock.lastCall?.[0].hex).toBe('#FF0000');
    expect(mason.spies['border-right-color'].mock.lastCall?.[0].hex).toBe('#0000FF');
    expect(mason.spies['border-left-color'].mock.lastCall?.[0].hex).toBe('#0000FF');

    const core = setNativeSpies(colors);
    const { style } = coreHost(core.members);
    applyAsCore91Stylesheet(style, 'border-color', 'red rgb(0, 0, 255)');
    expect(core.spies['border-right-color'].mock.lastCall?.[0].hex).toBe('#0000FF');
    expect((style as any).backgroundInternal.borderTopColor.hex).toBe('#FF0000');
  });
});

describe('background', () => {
  const U = unsetValue;

  it.each([
    ['red', ['red', U, U, U, U, U, U, U]],
    ['rgb(0, 0, 0)', ['rgb(0, 0, 0)', U, U, U, U, U, U, U]],
    ['none', [U, 'none', U, U, U, U, U, U]],
    ['url(a.png)', [U, 'url(a.png)', U, U, U, U, U, U]],
    ['url(a.png) no-repeat center / cover padding-box #fff', ['#fff', 'url(a.png)', 'no-repeat', 'center', 'cover', 'padding-box', 'padding-box', U]],
    ['#fff url(a.png) 10px 20px/5px auto fixed content-box border-box', ['#fff', 'url(a.png)', U, '10px 20px', '5px auto', 'border-box', 'content-box', 'fixed']],
    ['repeat space radial-gradient(circle at 50% 50%, red, blue)', [U, 'radial-gradient(circle at 50% 50%, red, blue)', 'repeat space', U, U, U, U, U]],
    ['linear-gradient(red, blue), url(b.png) repeat-x left top / 50% blue', ['blue', 'linear-gradient(red, blue), url(b.png)', 'repeat, repeat-x', '0% 0%, left top', 'auto, 50%', U, U, U]],
    ['url(a.png) padding-box, url(b.png)', [U, 'url(a.png), url(b.png)', U, U, U, 'padding-box, border-box', 'padding-box, padding-box', U]],
  ])('%s', (value, parts) => {
    expect(splitBackground(value)).toEqual(parts);
  });

  it.each(['red, url(a.png)', 'url(a) url(b)', 'red blue', 'url(a) / cover', 'center /', 'center / cover contain', 'url(a),', 'no-repeat repeat-x'])('rejects "%s"', (value) => {
    expect(() => splitBackground(value)).toThrow();
  });

  const layerLonghands = [backgroundImageProperty, backgroundRepeatProperty, backgroundPositionProperty, backgroundSizeProperty, backgroundClipProperty, backgroundOriginProperty, backgroundAttachmentProperty];

  it("reaches a Mason view's own layer properties as CSS strings", () => {
    const { spies, members } = setNativeSpies(layerLonghands);
    const { style } = masonHost(members);
    applyAsCore91Stylesheet(style, 'background', 'url(a.png) no-repeat center / cover padding-box #fff');
    expect(spies['background-image']).toHaveBeenLastCalledWith('url(a.png)');
    expect(spies['background-repeat']).toHaveBeenLastCalledWith('no-repeat');
    expect(spies['background-position']).toHaveBeenLastCalledWith('center');
    expect(spies['background-size']).toHaveBeenLastCalledWith('cover');
    expect(spies['background-clip']).toHaveBeenLastCalledWith('padding-box');
    expect(spies['background-origin']).toHaveBeenLastCalledWith('padding-box');
    expect((style as any).backgroundColor.hex).toBe('#FFFFFF');
  });

  it("reaches a core view through core's own background longhands", () => {
    const { style } = coreHost();
    applyAsCore91Stylesheet(style, 'background', 'url(a.png) no-repeat center / cover #fff');
    const background = (style as any).backgroundInternal;
    expect(background.image).toBe('url(a.png)');
    expect(background.repeat).toBe('no-repeat');
    expect(background.position).toBe('center');
    expect(background.size).toBe('cover');
    expect(background.color.hex).toBe('#FFFFFF');
  });

  it('resets the parts a later declaration leaves out', () => {
    const { spies, members } = setNativeSpies(layerLonghands);
    const { style } = masonHost(members);
    applyAsCore91Stylesheet(style, 'background', 'url(a.png) no-repeat');
    applyAsCore91Stylesheet(style, 'background', 'red');
    expect(spies['background-image']).toHaveBeenLastCalledWith(undefined);
    expect((style as any).backgroundRepeat).toBe(undefined);
    expect((style as any).backgroundColor.hex).toBe('#FF0000');
  });
});

describe('MasonKit-owned shorthands', () => {
  it.each([
    ['hidden', ['hidden', 'hidden']],
    ['hidden scroll', ['hidden', 'scroll']],
    ['auto clip', ['auto', 'clip']],
  ])('overflow: %s', (value, parts) => {
    expect(splitOverflow(value)).toEqual(parts);
  });

  it.each(['sideways', 'hidden scroll auto', 'hidden, scroll'])('overflow rejects "%s"', (value) => {
    expect(() => splitOverflow(value)).toThrow();
  });

  it('overflow sets each axis on a Mason view, auto included', () => {
    const { style } = masonHost();
    (style as any).overflow = 'hidden scroll';
    expect([(style as any).overflowX, (style as any).overflowY]).toEqual(['hidden', 'scroll']);
    (style as any).overflow = 'auto';
    expect([(style as any).overflowX, (style as any).overflowY]).toEqual(['auto', 'auto']);
  });

  it.each([
    ['row', ['row', unsetValue]],
    ['wrap', [unsetValue, 'wrap']],
    ['column wrap-reverse', ['column', 'wrap-reverse']],
    ['nowrap row-reverse', ['row-reverse', 'nowrap']],
  ])('flex-flow: %s', (value, parts) => {
    expect(splitFlexFlow(value)).toEqual(parts);
  });

  it.each(['row column', 'wrap nowrap', 'diagonal', 'row wrap column'])('flex-flow rejects "%s"', (value) => {
    expect(() => splitFlexFlow(value)).toThrow();
  });

  it.each([
    ['none', ['0', '0', 'auto']],
    ['auto', ['1', '1', 'auto']],
    ['2', ['2', '1', '0%']],
    ['0', ['0', '1', '0%']],
    ['2 3', ['2', '3', '0%']],
    ['10px', ['1', '1', '10px']],
    ['content', ['1', '1', 'content']],
    ['2 10%', ['2', '1', '10%']],
    ['2 3 4rem', ['2', '3', '4rem']],
    ['1 1 0', ['1', '1', '0']],
    ['10px 2 3', ['2', '3', '10px']],
  ])('flex: %s', (value, parts) => {
    expect(splitFlex(value)).toEqual(parts);
  });

  it.each(['1 2 3 4', '10px 20px', 'grow', '-1', '1 10px 2', '1 auto auto'])('flex rejects "%s"', (value) => {
    expect(() => splitFlex(value)).toThrow();
  });

  it('flex with only a basis sets the basis on a Mason view', () => {
    const { style } = masonHost();
    (style as any).flex = '10px';
    expect([(style as any).flexGrow, (style as any).flexShrink, (style as any).flexBasis]).toEqual([1, 1, { unit: 'px', value: 10 }]);
  });

  it.each([
    ['10px', ['10px', '10px']],
    ['1rem 5%', ['1rem', '5%']],
    ['normal 2', ['normal', '2']],
  ])('gap: %s', (value, parts) => {
    expect(splitGap(value)).toEqual(parts);
  });

  it.each(['1px 2px 3px', 'wide', '1px / 2px'])('gap rejects "%s"', (value) => {
    expect(() => splitGap(value)).toThrow();
  });

  it.each(['gap', 'grid-gap'])('%s splits into row-gap and column-gap', (cssName) => {
    const parts = shorthandConverter(entry(cssName))('4px 8px');
    expect(parts.map(([property, value]) => [property.cssLocalName, value])).toEqual([
      ['row-gap', '4px'],
      ['column-gap', '8px'],
    ]);
  });
});
