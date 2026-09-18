import { describe, expect, it } from 'vitest';
import { reconcileTextRuns } from './text-runs';
import { textNode_ } from './symbols';

type Kind = 'text' | 'break' | 'element' | 'none';

/**
 * Drives `reconcileTextRuns` against a fake context that records the native
 * operations, so the slot arithmetic can be checked for each host framework's
 * node shape without a native tree.
 */
function harness(children: any[] = []) {
  const ops: string[] = [];
  const self: any = {
    _children: children,
    _nativeRemoveChildNode(_node: unknown, index: number) {
      ops.push(`remove@${index}`);
    },
    _updateTextNode(node: any, operation: { type: string; index?: number; isBreak?: boolean } | null) {
      if (!operation) {
        ops.push(`update(${node.text ?? node.data})`);
        return;
      }
      ops.push(`${operation.type}(${node.text ?? node.data ?? (operation.isBreak ? 'br' : '')})@${operation.index}`);
      const entry = { [textNode_]: { __raw__: node } };
      self._children.splice(operation.index, 0, entry);
    },
  };
  const run = (nodes: any[], classify: (n: any) => Kind) => reconcileTextRuns(self, nodes, classify);
  return { self, ops, run };
}

const element = (id: string) => ({ id, nodeType: 'element' });
const text = (t: string) => ({ nodeType: 'text', text: t });
const comment = () => ({ nodeType: 'comment' });

const domShim = (n: any): Kind => {
  if (n.nodeType === 'text' || n.nodeType === 3) return 'text';
  if (n.nodeType === 'element' || n.nodeType === 1) return 'element';
  return 'none';
};

describe('reconcileTextRuns', () => {
  it('gives empty text nodes (fragment anchors) no slot', () => {
    // <div style="display: grid"><article v-for /></div> arrives as
    // '' (fragment start), article, '' (fragment end).
    const article = element('article');
    const { self, ops, run } = harness([article]);

    run([text(''), article, text('')], domShim);

    expect(ops).toEqual([]);
    expect(self._children).toEqual([article]);
  });

  it('does not count comment anchors when placing a run', () => {
    // <p><!-- v-if --><b>x</b>{{ label }}</p>: the run belongs in slot 1.
    const b = element('b');
    const { ops, run } = harness([b]);

    run([comment(), b, text('label')], domShim);

    expect(ops).toEqual(['insert(label)@1']);
  });

  it('updates a run in place when its node is still in the same slot', () => {
    const node = text('hello');
    const { ops, run } = harness([{ [textNode_]: { __raw__: node } }]);

    node.text = 'hello again';
    run([node], domShim);

    expect(ops).toEqual(['update(hello again)']);
  });

  it('removes the run of a node that is gone or became empty', () => {
    const gone = text('bye');
    const emptied = text('');
    const { self, ops, run } = harness([{ [textNode_]: { __raw__: gone } }, { [textNode_]: { __raw__: emptied } }]);

    run([emptied], domShim);

    expect(ops).toEqual(['remove@1', 'remove@0']);
    expect(self._children).toEqual([]);
  });

  it('moves a run whose node changed slot', () => {
    const a = element('a');
    const node = text('t');
    // Run currently at slot 0, but an element now precedes it.
    const { ops, run } = harness([{ [textNode_]: { __raw__: node } }, a]);

    run([a, node], domShim);

    expect(ops).toEqual(['remove@0', 'insert(t)@1']);
  });

  describe('Angular node shapes (everything is nodeType 1)', () => {
    const ng = (n: any): Kind => {
      if (n.nodeName === 'TextNode') return 'text';
      if (n.nodeName === 'br') return 'break';
      if (n.nodeName === 'CommentNode' || n.meta?.skipAddToDom) return 'none';
      return 'element';
    };
    const ngText = (t: string) => ({ nodeType: 1, nodeName: 'TextNode', text: t, meta: { skipAddToDom: true } });
    const ngComment = () => ({ nodeType: 1, nodeName: 'CommentNode', meta: { skipAddToDom: true } });
    const ngEl = (name: string) => ({ nodeType: 1, nodeName: name });

    it('skips CommentNode anchors and empty TextNodes', () => {
      const span = ngEl('span');
      const { ops, run } = harness([span]);

      run([ngComment(), ngText(''), span, ngText('after')], ng);

      expect(ops).toEqual(['insert(after)@1']);
    });

    it('treats a <br> the host already inserted as a Br element as a slot, not a run', () => {
      const br = ngEl('br');
      const { ops, run } = harness([br]);

      run([br, ngText('next')], ng);

      expect(ops).toEqual(['insert(next)@1']);
    });

    it('synthesises a break run for a <br> node MasonKit has no child for', () => {
      const br = ngEl('br');
      const { ops, run } = harness([]);

      run([ngText('a'), br, ngText('b')], ng);

      expect(ops).toEqual(['insert(a)@0', 'insert(br)@1', 'insert(b)@2']);
    });
  });
});
