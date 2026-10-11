import { describe, expect, it } from 'vitest';
import { encodeClipPath, encodePosition, encodeWindowsBackground, encodeWindowsBorderImage, encodeWindowsMask, urlOf, type WindowsMaskContext } from './windows-mask';

const ctx: WindowsMaskContext = {
  length: (token) => (token.endsWith('px') ? parseFloat(token) : token.endsWith('rem') ? parseFloat(token) * 16 : undefined),
  color: (value) => (value === 'black' ? 0xff000000 : value === 'transparent' ? 0 : null),
  linear: () => ({ angle: 180, offsets: [0.4, 1], colors: [0xff000000, 0] }),
  radial: () => null,
  source: (url) => url.replace('~/', '/app/'),
};

const mask = (entries: Record<string, string>) => JSON.parse(encodeWindowsMask(new Map(Object.entries(entries)), ctx) || 'null');

describe('urlOf', () => {
  it('unquotes and keeps parentheses inside the quotes', () => {
    expect(urlOf(`url("data:image/svg+xml,<svg><path transform='scale(2)'/></svg>")`)).toBe("data:image/svg+xml,<svg><path transform='scale(2)'/></svg>");
    expect(urlOf('url(~/icon.png)')).toBe('~/icon.png');
  });
});

describe('encodePosition', () => {
  it('reads keywords, lengths and edge offsets', () => {
    expect(encodePosition('center', ctx)).toEqual([
      [0, 50],
      [0, 50],
    ]);
    expect(encodePosition('top', ctx)).toEqual([
      [0, 50],
      [0, 0],
    ]);
    expect(encodePosition('10px 20%', ctx)).toEqual([
      [10, 0],
      [0, 20],
    ]);
    expect(encodePosition('right 10px bottom', ctx)).toEqual([
      [-10, 100],
      [0, 100],
    ]);
  });
});

describe('encodeWindowsMask', () => {
  it('is empty without a drawable image, clip or border', () => {
    expect(encodeWindowsMask(new Map([['mask-image', 'none']]), ctx)).toBe('');
  });

  it('cycles shorter lists over the image layers', () => {
    const spec = mask({ 'mask-image': 'url(~/a.svg), linear-gradient(black 40%, transparent)', 'mask-repeat': 'no-repeat', 'mask-size': 'contain, 100% auto', 'mask-composite': 'add, subtract' });
    expect(spec.l).toHaveLength(2);
    expect(spec.l[0].i).toEqual({ t: 'img', src: '/app/a.svg' });
    expect(spec.l[0].sz).toEqual([2]);
    expect(spec.l[1].sz).toEqual([0, 1, 0, 100, 0, 0, 0]);
    expect(spec.l[1].r).toEqual([1, 1]);
    expect(spec.l[1].k).toBe(1);
    expect(spec.l[1].i).toEqual({ t: 'lin', a: 180, s: [0.4, 0xff000000, 1, 0] });
  });

  it('carries clip-path and mask-border', () => {
    const spec = mask({ 'clip-path': 'circle(50%)', 'mask-border-source': 'url(a.svg)', 'mask-border-slice': '6 fill', 'mask-border-width': '12px', 'mask-border-repeat': 'round' });
    expect(spec.l).toBeUndefined();
    expect(spec.cp).toEqual({ b: 0, s: 2, v: [0, 50, 0, 50, 0, 50], k: [0] });
    expect(spec.mb.f).toBe(true);
    expect(spec.mb.sl).toEqual([6, 0, 6, 0, 6, 0, 6, 0]);
    expect(spec.mb.w).toEqual([1, 12, 0, 1, 12, 0, 1, 12, 0, 1, 12, 0]);
    expect(spec.mb.r).toEqual([3, 3]);
  });
});

describe('encodeClipPath', () => {
  it('reads inset with per-corner radii', () => {
    const clip = encodeClipPath('inset(4px round 12px 0)', ctx) as { v: number[] };
    expect(clip.v.slice(0, 8)).toEqual([4, 0, 4, 0, 4, 0, 4, 0]);
    // top-left 12/12, top-right 0/0, bottom-right 12/12, bottom-left 0/0
    expect(clip.v.slice(8)).toEqual([12, 0, 12, 0, 0, 0, 0, 0, 12, 0, 12, 0, 0, 0, 0, 0]);
  });

  it('turns rect() and xywh() into insets', () => {
    expect((encodeClipPath('rect(10px 90px 50px 0)', ctx) as { v: number[] }).v.slice(0, 8)).toEqual([10, 0, -90, 100, -50, 100, 0, 0]);
    expect((encodeClipPath('xywh(0 0 50% 25%)', ctx) as { v: number[] }).v.slice(0, 8)).toEqual([0, 0, 0, 50, 0, 75, 0, 0]);
  });

  it('reads polygons, paths and a reference box', () => {
    expect(encodeClipPath('polygon(evenodd, 0 0, 100% 0, 50% 100%) content-box', ctx)).toEqual({ b: 2, s: 4, v: [0, 0, 0, 0, 0, 100, 0, 0, 0, 50, 0, 100], e: true });
    expect(encodeClipPath('path("M0 0 L10 0 L5 10 Z")', ctx)).toEqual({ b: 0, s: 5, d: 'M0 0 L10 0 L5 10 Z', e: false });
    expect(encodeClipPath('none', ctx)).toBeNull();
  });
});

describe('encodeWindowsBorderImage', () => {
  it('defaults the slice to 100% and the width to the border widths', () => {
    const spec = JSON.parse(encodeWindowsBorderImage('linear-gradient(black, transparent) 1', ctx));
    expect(spec.mb.sl).toEqual([1, 0, 1, 0, 1, 0, 1, 0]);
    expect(spec.mb.w).toEqual([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
    expect(JSON.parse(encodeWindowsBorderImage('url(a.png)', ctx)).mb.sl).toEqual([100, 1, 100, 1, 100, 1, 100, 1]);
    expect(encodeWindowsBorderImage('none', ctx)).toBe('');
  });
});

describe('encodeWindowsBackground', () => {
  it('positions in the padding box and paints to the border box', () => {
    const spec = JSON.parse(encodeWindowsBackground('~/knob.svg', 'contain', 'right center', 'no-repeat', ctx));
    expect(spec.l[0]).toEqual({ i: { t: 'img', src: '/app/knob.svg' }, sz: [2], p: [0, 100, 0, 50], r: [1, 1], o: 1, c: 0, m: 0, k: 0 });
    expect(encodeWindowsBackground('', '', '', '', ctx)).toBe('');
  });
});
