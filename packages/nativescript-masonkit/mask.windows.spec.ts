import { describe, expect, it } from 'vitest';
import { encodeWindowsBorderImage, encodeWindowsMask, type WindowsMaskContext } from './mask';

const ctx: WindowsMaskContext = {
  gradientUnits: () => [18, 16, 400, 800, 0xff123456],
  source: (url) => url.replace('~/', '/app/'),
};

const mask = (entries: Record<string, string>) => JSON.parse(encodeWindowsMask(new Map(Object.entries(entries)), ctx) || 'null');

describe('encodeWindowsMask', () => {
  it('is empty without a drawable image, clip or border', () => {
    expect(encodeWindowsMask(new Map([['mask-image', 'none']]), ctx)).toBe('');
  });

  it('passes the image list and short longhands to Rust in property order', () => {
    const image = 'url(~/a.svg), linear-gradient(black 40%, transparent)';
    const spec = mask({ 'mask-image': image, 'mask-repeat': 'no-repeat', 'mask-size': 'contain, min(100%, 20px) auto', 'mask-composite': 'add, subtract' });
    expect(spec.ml).toEqual({
      css: [image, 'contain, min(100%, 20px) auto', '', 'no-repeat', '', '', '', 'add, subtract'],
      u: [18, 16, 400, 800, 0xff123456],
      appRoot: '/app/',
    });
  });

  it('passes a corner keyword with the linear gradient', () => {
    const value = 'linear-gradient(to bottom right, black, transparent)';
    const spec = mask({ 'mask-image': value });
    expect(spec.ml.css[0]).toBe(value);
  });

  it('carries clip-path and mask-border', () => {
    const spec = mask({ 'clip-path': 'circle(50%)', 'mask-border-source': 'url(a.svg)', 'mask-border-slice': '6 fill', 'mask-border-width': '12px', 'mask-border-repeat': 'round' });
    expect(spec.ml).toBeUndefined();
    expect(spec.cp).toEqual({ css: 'circle(50%)', u: [18, 16, 400, 800, 0xff123456] });
    expect(spec.mb).toEqual({
      css: ['url(a.svg)', '6 fill', '12px', '', 'round', ''],
      u: [18, 16, 400, 800, 0xff123456],
      appRoot: '/app/',
    });
  });

  it('sends path() to the native parser with its unit context', () => {
    const value = 'path(evenodd, "M0 0 q5 10 10 0 t10 0 Z") padding-box';
    expect(mask({ 'clip-path': value })).toEqual({ cp: { css: value, u: [18, 16, 400, 800, 0xff123456] } });
  });
});

describe('encodeWindowsBorderImage', () => {
  it('passes the shorthand and context to Rust', () => {
    const css = 'linear-gradient(black, transparent) max(10%, 25%) / min(25%, 30px) / calc(1em - 10px) round';
    expect(JSON.parse(encodeWindowsBorderImage(css, ctx)).mb).toEqual({
      css,
      u: [18, 16, 400, 800, 0xff123456],
      appRoot: '/app/',
    });
    expect(JSON.parse(encodeWindowsBorderImage('url(a.png)', ctx)).mb.css).toBe('url(a.png)');
    expect(encodeWindowsBorderImage('none', ctx)).toBe('');
  });
});

describe('native gradient declarations', () => {
  it.each([
    'repeating-linear-gradient(black 0 20px, transparent 20px 40px)',
    'radial-gradient(circle closest-side at 20% 30%, currentColor, transparent)',
    'repeating-conic-gradient(black 0deg, transparent 90deg)',
  ])('passes the declaration and units to Rust unchanged for %s', (css) => {
    expect(mask({ 'mask-image': css }).ml.css[0]).toBe(css);
  });

  it('passes the same declaration through masks and borders', () => {
    const css = 'conic-gradient(black, transparent)';
    expect(mask({ 'mask-image': css }).ml.css[0]).toBe(css);
    expect(JSON.parse(encodeWindowsBorderImage(css + ' 1', ctx)).mb.css).toBe(css + ' 1');
  });

  it('passes the mask clip keyword to Rust', () => {
    expect(mask({ 'mask-image': 'url(a.svg)', 'mask-clip': 'text' }).ml.css[5]).toBe('text');
  });
});
