import { describe, expect, it, vi } from 'vitest';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { borderTopLeftRadiusProperty, borderTopRightRadiusProperty, borderBottomRightRadiusProperty, borderBottomLeftRadiusProperty, borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty, marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty, paddingTopProperty, paddingRightProperty, paddingBottomProperty, paddingLeftProperty, borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty } from '@nativescript/core/ui/styling/style-properties';
import { Length as CoreLength, PercentLength as CorePercentLength } from '@nativescript/core/ui/styling/length-shared';
import { setScreenScale } from '../../tools/testing/mason-test-kit/ns-layout';
import { coreHost, masonHost } from '../../tools/testing/mason-test-kit/style-hosts';
import { toCamelCase, borderRadiusCorners, composeBorderRadius, splitBackground, webkitMaskBox, webkitMaskComposite, splitFlexFlow, tokenizeCss } from './css-shorthands';
import { expandCssShorthand } from './native-css-values';
import { backgroundAttachmentProperty, backgroundClipProperty, backgroundOriginProperty, backgroundImageProperty, backgroundPositionProperty, backgroundRepeatProperty, backgroundSizeProperty, masonShorthands, placeShorthands, shorthandConverter } from './properties';

vi.mock('./native-css-values', async (importOriginal) => {
  const stub = await importOriginal<typeof import('./native-css-values')>();
  return { ...stub, expandCssShorthand: vi.fn(stub.expandCssShorthand) };
});

function entry(cssName: string) {
  const found = [...masonShorthands, ...placeShorthands].find((shorthand) => shorthand.cssName === cssName);
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
  it.each([...masonShorthands, ...placeShorthands].map((shorthand) => [shorthand.cssName, shorthand] as const))('%s', (_cssName, shorthand) => {
    const probed = shorthandConverter(shorthand)(unsetValue);
    expect(probed.map(([property]) => property.cssLocalName)).toEqual(shorthand.longhands.map((property) => property.cssLocalName));
    expect(probed.every(([, value]) => value === unsetValue)).toBe(true);
  });

  it('gives a CSS-wide keyword to every longhand', () => {
    expect(shorthandConverter(entry('border-radius'))('inherit').map(([, value]) => value)).toEqual(['inherit', 'inherit', 'inherit', 'inherit']);
  });
});

describe('border-radius', () => {
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
  const margins = [marginTopProperty, marginRightProperty, marginBottomProperty, marginLeftProperty];
  const paddings = [paddingTopProperty, paddingRightProperty, paddingBottomProperty, paddingLeftProperty];
  const widths = [borderTopWidthProperty, borderRightWidthProperty, borderBottomWidthProperty, borderLeftWidthProperty];
  const colors = [borderTopColorProperty, borderRightColorProperty, borderBottomColorProperty, borderLeftColorProperty];

  it("margin reaches a Mason view as core's parse carrying the CSS text, and a core view parsed", () => {
    const mason = setNativeSpies(margins);
    applyAsCore91Stylesheet(masonHost(mason.members).style, 'margin', '10% 2rem');
    expect(mason.spies['margin-top']).toHaveBeenLastCalledWith({ value: 0.1, unit: '%', css: '10%' });
    expect(mason.spies['margin-right']).toHaveBeenLastCalledWith({ value: 2 * CoreLength.getRootFontSize(), unit: 'dip', css: '2rem' });

    const core = setNativeSpies(margins);
    applyAsCore91Stylesheet(coreHost(core.members).style, 'margin', '10% 20');
    expect(core.spies['margin-top']).toHaveBeenLastCalledWith({ unit: '%', value: 0.1 });
    expect(core.spies['margin-right']).toHaveBeenLastCalledWith(20);
  });

  it('a Mason view inside a core layout exposes the resolved margin', () => {
    setScreenScale(1);
    const { style } = masonHost();
    applyAsCore91Stylesheet(style, 'margin', '10% 2rem');
    expect(CorePercentLength.toDevicePixels((style as any).marginTop, 0, 400)).toBe(40);
    expect(CorePercentLength.toDevicePixels((style as any).marginLeft, 0, 400)).toBe(2 * CoreLength.getRootFontSize());
  });

  it("padding reaches a Mason view carrying the CSS text, through core's valueChanged", () => {
    setScreenScale(2);
    const mason = setNativeSpies(paddings);
    const { view, style } = masonHost(mason.members);
    applyAsCore91Stylesheet(style, 'padding', '5% 2rem');
    expect(mason.spies['padding-top'].mock.lastCall?.[0].css).toBe('5%');
    expect(mason.spies['padding-left'].mock.lastCall?.[0].css).toBe('2rem');
    expect(view.effectivePaddingTop).toBe(10);
    expect(view.effectivePaddingLeft).toBe(2 * CoreLength.getRootFontSize() * 2);
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

describe('background shorthand bridge', () => {
  it('maps omitted Rust fields to the CSS unset value', () => {
    const css = 'url(a.png) no-repeat';
    vi.mocked(expandCssShorthand).mockReturnValueOnce(['', 'url(a.png)', 'no-repeat', '', '', '', '', '']);
    expect(splitBackground(css)).toEqual([unsetValue, 'url(a.png)', 'no-repeat', unsetValue, unsetValue, unsetValue, unsetValue, unsetValue]);
    expect(expandCssShorthand).toHaveBeenLastCalledWith('background', css);
  });

  it('rejects a declaration for which Rust returns no longhands', () => {
    const css = 'url(a.png) / cover';
    vi.mocked(expandCssShorthand).mockReturnValueOnce(null);
    expect(() => splitBackground(css)).toThrow();
    expect(expandCssShorthand).toHaveBeenLastCalledWith('background', css);
  });

  const layerLonghands = [backgroundImageProperty, backgroundRepeatProperty, backgroundPositionProperty, backgroundSizeProperty, backgroundClipProperty, backgroundOriginProperty, backgroundAttachmentProperty];

  it("reaches a Mason view's own layer properties as CSS strings", () => {
    const { spies, members } = setNativeSpies(layerLonghands);
    const { style } = masonHost(members);
    vi.mocked(expandCssShorthand).mockReturnValueOnce(['#fff', 'url(a.png)', 'no-repeat', 'center', 'cover', 'padding-box', 'padding-box', '']);
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
    vi.mocked(expandCssShorthand).mockReturnValueOnce(['#fff', 'url(a.png)', 'no-repeat', 'center', 'cover', '', '', '']);
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
    vi.mocked(expandCssShorthand)
      .mockReturnValueOnce(['', 'url(a.png)', 'no-repeat', '', '', '', '', ''])
      .mockReturnValueOnce(['red', '', '', '', '', '', '', '']);
    applyAsCore91Stylesheet(style, 'background', 'url(a.png) no-repeat');
    applyAsCore91Stylesheet(style, 'background', 'red');
    expect(spies['background-image']).toHaveBeenLastCalledWith(undefined);
    expect((style as any).backgroundRepeat).toBe(undefined);
    expect((style as any).backgroundColor.hex).toBe('#FF0000');
  });
});

describe('Rust mask shorthand bridge', () => {
  const maskLonghands = ['mask-image', 'mask-position', 'mask-size', 'mask-repeat', 'mask-origin', 'mask-clip', 'mask-composite', 'mask-mode'];

  it.each(['mask', '-webkit-mask'])('applies the Rust longhands to a Mason view from %s', (name) => {
    const { under, style } = masonHost();
    const assigned: Record<string, string> = {};
    for (const cssName of maskLonghands) {
      Object.defineProperty(under.style, toCamelCase(cssName), {
        configurable: true,
        set: (value: string) => (assigned[cssName] = value),
      });
    }
    const css = 'url(a.svg) center / contain no-repeat padding-box content-box exclude luminance';
    vi.mocked(expandCssShorthand).mockReturnValueOnce([
      'url(a.svg)', 'contain', 'center', 'no-repeat', 'padding-box', 'content-box', 'luminance', 'exclude',
    ]);
    applyAsCore91Stylesheet(style, name, css);
    expect(expandCssShorthand).toHaveBeenLastCalledWith(name, css);
    expect(assigned).toEqual({
      'mask-image': 'url(a.svg)',
      'mask-position': 'center',
      'mask-size': 'contain',
      'mask-repeat': 'no-repeat',
      'mask-origin': 'padding-box',
      'mask-clip': 'content-box',
      'mask-composite': 'exclude',
      'mask-mode': 'luminance',
    });
  });

  it.each(['mask-border', '-webkit-mask-box-image'])('keeps the longhand order for %s', (name) => {
    const css = 'url(b.svg) 30 fill / 10px 20px / 2px round luminance';
    const values = ['url(b.svg)', '30 fill', '10px 20px', '2px', 'round', 'luminance'];
    vi.mocked(expandCssShorthand).mockReturnValueOnce(values);
    const converted = shorthandConverter(entry(name))(css);
    expect(expandCssShorthand).toHaveBeenLastCalledWith(name, css);
    expect(converted.map(([property, value]) => [property.cssLocalName, value])).toEqual(
      ['source', 'slice', 'width', 'outset', 'repeat', 'mode'].map((suffix, index) => [`mask-border-${suffix}`, values[index]]),
    );
  });

  it('rejects the shorthand when Rust returns no longhands', () => {
    const css = 'url(b.svg) fill 30 fill';
    vi.mocked(expandCssShorthand).mockReturnValueOnce(null);
    expect(() => shorthandConverter(entry('mask-border'))(css)).toThrow();
    expect(expandCssShorthand).toHaveBeenLastCalledWith('mask-border', css);
  });

  it('still maps WebKit keywords on the individual properties', () => {
    expect(webkitMaskComposite('source-over, xor, source-in, source-out, destination-in, copy')).toBe('add, exclude, intersect, subtract, intersect, add');
    expect(webkitMaskBox('padding, content-box')).toBe('padding-box, content-box');
  });
});

describe('Rust layout shorthand bridge', () => {
  it('overflow sets each axis on a Mason view, auto included', () => {
    const { style } = masonHost();
    (style as any).overflow = 'hidden scroll';
    expect(expandCssShorthand).toHaveBeenCalledWith('overflow', 'hidden scroll');
    expect([(style as any).overflowX, (style as any).overflowY]).toEqual(['hidden', 'scroll']);
    (style as any).overflow = 'auto';
    expect([(style as any).overflowX, (style as any).overflowY]).toEqual(['auto', 'auto']);
  });

  it('flex-flow turns an omitted direction into the cascade unset value', () => {
    vi.mocked(expandCssShorthand).mockReturnValueOnce(['', 'wrap']);
    expect(splitFlexFlow('wrap')).toEqual([unsetValue, 'wrap']);
    expect(expandCssShorthand).toHaveBeenLastCalledWith('flex-flow', 'wrap');
  });

  it('the stylesheet flex shorthand keeps its implicit percentage basis', () => {
    vi.mocked(expandCssShorthand).mockReturnValueOnce(['2', '1', '']);
    const parts = shorthandConverter(entry('flex'))('2');
    expect(parts.map(([property, value]) => [property.cssLocalName, value])).toEqual([
      ['flex-grow', '2'],
      ['flex-shrink', '1'],
      ['flex-basis', '0%'],
    ]);
  });

  it('flex with only a basis sets the basis on a Mason view', () => {
    const { style } = masonHost();
    (style as any).flex = '10px';
    expect(expandCssShorthand).toHaveBeenLastCalledWith('flex', '10px');
    expect([(style as any).flexGrow, (style as any).flexShrink, (style as any).flexBasis]).toEqual([1, 1, { unit: 'px', value: 10 }]);
  });

  it.each(['gap', 'grid-gap'])('%s sets row-gap then column-gap', (name) => {
    const parts = shorthandConverter(entry(name))('4px 8px');
    expect(expandCssShorthand).toHaveBeenLastCalledWith(name, '4px 8px');
    expect(parts.map(([property, value]) => [property.cssLocalName, value])).toEqual([
      ['row-gap', '4px'],
      ['column-gap', '8px'],
    ]);
  });

  it('place-items sets align-items then justify-items', () => {
    const pairs = shorthandConverter(entry('place-items'))('center start');
    expect(expandCssShorthand).toHaveBeenLastCalledWith('place-items', 'center start');
    expect(pairs.map(([property, part]) => [property.cssLocalName, part])).toEqual([
      ['align-items', 'center'],
      ['justify-items', 'start'],
    ]);
  });
});
