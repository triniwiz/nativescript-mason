import { describe, expect, it } from 'vitest';
import { frameworkRegistry, type MasonFrameworkAdapter } from './framework-registry';

describe('frameworkRegistry', () => {
  it('finds the DOM-shim adapter for a view with childNodes', () => {
    const view = { childNodes: [{ nodeType: 'text', text: 'hi' }] };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).toBe('dom-shim');
  });

  it('finds the DOM-shim adapter for a linked-list DOM element', () => {
    const text = { nodeType: 3, data: 'hi' };
    const view = { firstChild: text, nextSibling: null };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).toBe('dom-shim');
  });

  it('finds the DOM-shim adapter for Svelte via __SvelteNativeElement__', () => {
    const el = { childNodes: [{ nodeType: 'element' }] };
    const view = { __SvelteNativeElement__: el };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).toBe('dom-shim');
    expect(frameworkRegistry.getElement(view)).toBe(el);
  });

  it('does not match Angular shapes with the DOM-shim adapter', () => {
    // Angular nodes all have nodeType 1, including TextNode anchors.
    const view = { firstChild: { nodeType: 1, nodeName: 'TextNode' }, meta: { skipAddToDom: true } };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).not.toBe('dom-shim');
  });

  it('falls back to the nativescript-core adapter for core TextNode shapes', () => {
    const view = { firstChild: { nodeName: 'TextNode', text: 'hi' } };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).toBe('nativescript-core');
  });

  it('caches the resolved adapter', () => {
    const view = { childNodes: [] };
    const first = frameworkRegistry.find(view);
    const second = frameworkRegistry.find(view);
    expect(first).toBe(second);
  });

  it('checks a later-registered adapter before the defaults', () => {
    const custom: MasonFrameworkAdapter = {
      name: 'custom',
      getElement: (view) => (view as any).customElement ?? null,
      getChildren: () => [],
      classify: () => 'none',
    };
    frameworkRegistry.register(custom);

    const view = { customElement: { childNodes: [] }, childNodes: [] };
    const adapter = frameworkRegistry.find(view);
    expect(adapter?.name).toBe('custom');
    expect(frameworkRegistry.getElement(view)).toBe(view.customElement);
  });
});

describe('dom-shim adapter', () => {
  const adapter = frameworkRegistry.find({ childNodes: [] })!;

  it('classifies standard DOM nodes', () => {
    expect(adapter.classify({ nodeType: 'text', text: 'a' })).toBe('text');
    expect(adapter.classify({ nodeType: 3, data: 'a' })).toBe('text');
    expect(adapter.classify({ nodeType: 'element' })).toBe('element');
    expect(adapter.classify({ nodeType: 1 })).toBe('element');
    expect(adapter.classify({ nodeType: 'comment' })).toBe('none');
    expect(adapter.classify({ nodeType: 8 })).toBe('none');
  });

  it('deduplicates childNodes that also appear in nextSibling', () => {
    const node = { nodeType: 'text', text: 'a' };
    const el = { childNodes: [node, node, { nodeType: 'text', text: 'b' }] };
    const children = adapter.getChildren(el);
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(node);
  });
});

describe('nativescript-core adapter', () => {
  const coreAdapter = frameworkRegistry.find({ firstChild: { nodeName: 'TextNode' } })!;

  it('classifies core TextNode shapes', () => {
    expect(coreAdapter.classify({ nodeName: 'TextNode' })).toBe('text');
    expect(coreAdapter.classify({ constructor: { name: 'TextNode' } })).toBe('text');
    expect(coreAdapter.classify({ nodeName: 'br' })).toBe('break');
    expect(coreAdapter.classify({ nodeName: 'Label' })).toBe('element');
  });

  it('walks firstChild/nextSibling', () => {
    const c = { nodeName: 'TextNode' };
    const b = { nodeName: 'br', nextSibling: c };
    const a = { nodeName: 'TextNode', nextSibling: b };
    const el = { firstChild: a };
    expect(coreAdapter.getChildren(el)).toEqual([a, b, c]);
  });
});
