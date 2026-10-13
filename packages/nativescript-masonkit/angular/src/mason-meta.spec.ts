import { describe, expect, it, vi } from 'vitest';

const registered = vi.hoisted(() => [] as any[]);

vi.mock('@triniwiz/nativescript-masonkit', () => ({
  frameworkRegistry: { register: (adapter: unknown) => registered.push(adapter) },
  readLinkedList: () => [],
}));

// Mirrors @nativescript/angular's invisible nodes as they look in a bundle:
// MasonKit has its own `TextNode`, so the bundler renames this one, and
// `nodeName` (derived from the class name) follows.
vi.mock('@nativescript/angular', () => {
  class InvisibleNode {
    nodeType = 1;
    meta = { skipAddToDom: true };
    nodeName = this.constructor.name;
  }
  return {
    TextNode: class TextNode$1 extends InvisibleNode {},
    CommentNode: class CommentNode$1 extends InvisibleNode {},
  };
});

import { CommentNode, TextNode } from '@nativescript/angular';
import { masonMeta } from './mason-meta';

const adapter = registered.find((a) => a.name === 'angular-nativescript');

describe('angular-nativescript adapter', () => {
  it('claims views registered with masonMeta', () => {
    const view = { firstChild: null, meta: masonMeta };
    expect(adapter.getElement(view)).toBe(view);
  });

  it('classifies text nodes whose class the bundler renamed', () => {
    expect(adapter.classify(new (TextNode as any)())).toBe('text');
  });

  it('classifies comment nodes whose class the bundler renamed', () => {
    expect(adapter.classify(new (CommentNode as any)())).toBe('none');
  });

  it('classifies other views as elements', () => {
    expect(adapter.classify({ nodeType: 1, nodeName: 'div', meta: masonMeta })).toBe('element');
  });
});
