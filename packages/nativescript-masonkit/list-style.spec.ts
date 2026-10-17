import { beforeAll, describe, expect, it, vi } from 'vitest';
import { _expandCssShorthand, unsetValue } from '@nativescript/core/ui/core/properties';
import { splitListStyle } from './css-shorthands';
import { listStyleShorthand, shorthandConverter } from './properties';
import { View } from '.';
import { Div, Li, Ol, Ul } from './web';

// Core's Style calls NativeScript's WeakRef.get(); Node's only has deref().
const weakRef = WeakRef.prototype as any;
weakRef.get ??= function (this: WeakRef<object>) {
  return this.deref();
};

describe('list-style splits into type and position', () => {
  it.each([
    ['none', ['none', 'outside']],
    ['square', ['square', 'outside']],
    ['inside', ['disc', 'inside']],
    ['decimal inside', ['decimal', 'inside']],
    ['outside circle', ['circle', 'outside']],
    ['none inside', ['none', 'inside']],
    ['url(dot.png)', ['disc', 'outside']],
    ['url(dot.png) none', ['none', 'outside']],
    ['none none', ['none', 'outside']],
    ['square url(dot.png) inside', ['square', 'inside']],
    ['Upper-Roman', ['upper-roman', 'outside']],
  ])('%s', (value, parts) => {
    expect(splitListStyle(value)).toEqual(parts);
  });

  it.each(['', 'inside outside', 'disc square', 'none none none', 'square none none', 'url(a) url(b)', 'disc, square'])('rejects "%s"', (value) => {
    expect(() => splitListStyle(value)).toThrow();
  });

  it('lists both longhands for the unsetValue probe', () => {
    expect(shorthandConverter(listStyleShorthand)(unsetValue)).toEqual([
      [listStyleShorthand.longhands[0], unsetValue],
      [listStyleShorthand.longhands[1], unsetValue],
    ]);
  });

  it('core expands it at parse time', () => {
    expect(_expandCssShorthand('list-style', 'none')).toEqual([
      ['list-style-type', 'none'],
      ['list-style-position', 'outside'],
    ]);
  });
});

function list<T extends Ol | Ul>(element: T, ...children: any[]): T {
  for (const child of children) (element as any).addChild(child);
  return element;
}

describe('list-style is inherited', () => {
  // The tree reads the screen scale, which Node doesn't have.
  beforeAll(() => {
    vi.spyOn(View, 'preflight', 'get').mockReturnValue(false);
  });

  it("an <li> takes its list's type, the UA one included", () => {
    const item = new Li();
    list(new Ol(), item);
    expect((item.style as any).listStyleType).toBe('decimal');
  });

  it('list-style: none on the list reaches its items', () => {
    const item = new Li();
    const ol = list(new Ol(), item);
    (ol.style as any)['css:list-style'] = 'none';
    expect((ol.style as any).listStyleType).toBe('none');
    expect((item.style as any).listStyleType).toBe('none');
    expect((ol.style as any).listStyle).toBe('none outside');
  });

  it("an item's own value overrides the list's", () => {
    const item = new Li();
    const other = new Li();
    list(new Ol(), item, other);
    (item.style as any)['css:list-style'] = 'square inside';
    expect((item.style as any).listStyleType).toBe('square');
    expect((item.style as any).listStylePosition).toBe('inside');
    expect((other.style as any).listStyleType).toBe('decimal');
  });

  it('a <ul> inside an <ol> keeps its discs', () => {
    const inner = new Li();
    const ul = list(new Ul(), inner);
    const outer = new Li();
    list(new Ol(), outer);
    (outer as any).addChild(ul);
    expect((ul.style as any).listStyleType).toBe('disc');
    expect((inner.style as any).listStyleType).toBe('disc');
  });

  it('reaches an item through a wrapper', () => {
    const item = new Li();
    const wrapper = new Div();
    (wrapper as any).addChild(list(new Ul(), item));
    (wrapper.style as any)['css:list-style-position'] = 'inside';
    expect((item.style as any).listStylePosition).toBe('inside');
  });
});

describe('a <ul> under preflight', () => {
  it('has no marker type, matching the native fallback', () => {
    const preflight = vi.spyOn(View, 'preflight', 'get').mockReturnValue(true);
    try {
      expect((new Ul().style as any).listStyleType).toBe('none');
    } finally {
      preflight.mockRestore();
    }
  });
});
