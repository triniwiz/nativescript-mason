import { describe, expect, it } from 'vitest';
import { masonMeta } from './mason-meta';

type Node = { nodeType: 'element' | 'text' | 'comment'; text?: string; nativeView?: unknown };

function parentWith(childNodes: Node[]) {
  const calls: Array<['add' | 'insert', unknown, number?]> = [];
  const nativeView = {
    _children: [] as unknown[],
    addChild(v: unknown) {
      calls.push(['add', v]);
      this._children.push(v);
    },
    insertChild(v: unknown, i: number) {
      calls.push(['insert', v, i]);
      this._children.splice(i, 0, v);
    },
    removeChild() {},
  };
  return { parent: { childNodes, nativeView } as any, calls };
}

const insert = masonMeta.nodeOps!.insert;

describe('masonMeta.insert', () => {
  it("skips Vue's empty keyed-fragment text anchors when mapping the raw index", () => {
    // <div style="display: grid"><article v-for /></div> arrives as
    //   '' (fragment start), article, '' (fragment end)
    // The plugin gives empty text nodes no native run, so the article must
    // land at raw index 0, not 1 - otherwise grid cell 1 stays empty.
    const start: Node = { nodeType: 'text', text: '' };
    const article: Node = { nodeType: 'element', nativeView: { id: 'article' } };
    const end: Node = { nodeType: 'text', text: '' };
    const { parent, calls } = parentWith([start, article, end]);
    parent.nativeView._children = [{ id: 'existing' }];

    insert(article as any, parent, 0);

    expect(calls).toEqual([['insert', { id: 'article' }, 0]]);
  });

  it('still counts non-empty text runs as raw slots', () => {
    const label: Node = { nodeType: 'text', text: 'Hello ' };
    const b: Node = { nodeType: 'element', nativeView: { id: 'b' } };
    const { parent, calls } = parentWith([label, b]);
    parent.nativeView._children = [{ id: 'label-run' }, { id: 'existing' }];

    insert(b as any, parent, 0);

    expect(calls).toEqual([['insert', { id: 'b' }, 1]]);
  });

  it('ignores comment anchors', () => {
    const c: Node = { nodeType: 'comment' };
    const el: Node = { nodeType: 'element', nativeView: { id: 'el' } };
    const { parent, calls } = parentWith([c, el]);
    parent.nativeView._children = [{ id: 'existing' }];

    insert(el as any, parent, 0);

    expect(calls).toEqual([['insert', { id: 'el' }, 0]]);
  });
});
