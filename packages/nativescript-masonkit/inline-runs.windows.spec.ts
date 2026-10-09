import { describe, expect, it } from 'vitest';
import { ViewBase } from './common';
import { anonymousText_, isMasonView_, isText_, runMember_, runsInline_, runsSettled_ } from './symbols';

class FakeTextNode {
  Data = '';
  isBreak = false;
  SetBreak(value: boolean) {
    this.isBreak = value;
  }
}

type Member = { kind: 'run' | 'text' | 'box'; item: any };

const parents = new Map<any, any>();

class FakeText {
  members: Member[] = [];
  IsAnonymous = false;
  IsButton = false;
  display = '';

  private put(kind: Member['kind'], item: any, index: number) {
    this.members = this.members.filter((m) => m.item !== item);
    this.members.splice(index < 0 || index > this.members.length ? this.members.length : index, 0, { kind, item });
  }
  private drop(item: any) {
    this.members = this.members.filter((m) => m.item !== item);
  }
  SetRun(run: any, index: number) {
    this.put('run', run, index);
  }
  RemoveRun(run: any) {
    this.drop(run);
  }
  SetInlineText(text: any, index: number) {
    this.put('text', text, index);
  }
  RemoveInlineText(text: any) {
    this.drop(text);
  }
  SetInlineBox(box: any, index: number) {
    engine.detach(box);
    this.put('box', box, index);
  }
  RemoveInlineBox(box: any) {
    this.drop(box);
  }
  ClearRuns() {
    this.members = [];
  }
  SetFontFamily() {}
}

class FakePanel {
  Children = {};
  items: any[] = [];
}

const engine = {
  detach(child: any) {
    const panel = parents.get(child);
    if (panel) panel.items = panel.items.filter((c: any) => c !== child);
    parents.delete(child);
  },
  ReparentChild(panel: FakePanel, child: any, index: number) {
    if (parents.get(child) === panel) return;
    engine.detach(child);
    panel.items.splice(index < 0 || index > panel.items.length ? panel.items.length : index, 0, child);
    parents.set(child, panel);
  },
  RemoveChild(panel: FakePanel, child: any) {
    if (parents.get(child) === panel) engine.detach(child);
  },
};

(globalThis as any).NativeScript = { Mason: { Text: FakeText, TextNode: FakeTextNode, Mason: { Instance: () => engine } } };

function container(display = 'block', settled = true) {
  const host = Object.create(ViewBase.prototype) as any;
  if (settled) host[runsSettled_] = true;
  host._children = [];
  host._view = new FakePanel();
  host._styleHelper = {
    display,
    copyTextStyleTo(text: FakeText, _d0: number, _d1: number, _d2: number, _d3: number, block: boolean) {
      if (block) text.display = 'block';
    },
  };
  return host;
}

function element(id: string, display: string, text = false) {
  const view = { id, IsButton: false };
  return {
    id,
    [isMasonView_]: true,
    [isText_]: text,
    _view: view,
    nativeViewProtected: view,
    _isMasonChild: false,
    _styleHelper: { display, position: 'static', float: 'none', hasBoxStyle: false },
  } as any;
}

function text(host: any, value: string) {
  host._updateTextNode({ text: value }, { type: 'add', index: -1 });
}

// As View's _addViewToNativeVisualTree does when the element loads.
function attach(host: any, child: any) {
  if (host._windowsAttach(child)) return;
  engine.ReparentChild(host._view, child.nativeViewProtected, host._nativeIndexFor(host._children.indexOf(child)));
  child._isMasonChild = true;
}

function add(host: any, child: any, load = true) {
  host._children.push(child);
  if (load) attach(host, child);
  return child;
}

// As removeChild does for an element.
function remove(host: any, child: any) {
  const index = host._children.indexOf(child);
  host._children.splice(index, 1);
  if (child[anonymousText_]) host._windowsRemoveMember(child);
  else engine.RemoveChild(host._view, child.nativeViewProtected);
  child._isMasonChild = false;
  host._windowsMergeAt(index);
}

function layout(host: any): string[] {
  return host._view.items.map((item: any) => (item instanceof FakeText ? '[' + item.members.map((m) => (m.kind === 'run' ? m.item.Data : m.item.id)).join('|') + ']' : item.id));
}

describe('Windows inline runs', () => {
  it('puts a block container inline children in one anonymous Text', () => {
    const host = container();
    text(host, 'a ');
    const b = add(host, element('b', 'inline', true));
    text(host, ' c ');
    const box = add(host, element('ib', 'inline-block'));
    text(host, ' d');
    expect(layout(host)).toEqual(['[a |b| c |ib| d]']);
    expect(b[runMember_]).toBe('text');
    expect(box[runMember_]).toBe('box');
    expect(host._view.items[0].IsAnonymous).toBe(true);
    expect(host._view.items[0].display).toBe('block');
  });

  it('keeps document order when elements load after later text', () => {
    const host = container();
    text(host, 'a');
    const span = add(host, element('span', 'inline', true), false);
    text(host, 'c');
    expect(layout(host)).toEqual(['[a|c]']);
    attach(host, span);
    expect(layout(host)).toEqual(['[a|span|c]']);
  });

  it('splits a run around a block child and merges it when the block goes', () => {
    const host = container();
    text(host, 'a');
    const block = add(host, element('block', 'block'));
    text(host, 'b');
    expect(layout(host)).toEqual(['[a]', 'block', '[b]']);
    remove(host, block);
    expect(layout(host)).toEqual(['[a|b]']);
  });

  it('splits a run when a block loads inside it', () => {
    const host = container();
    text(host, 'a');
    text(host, 'b');
    expect(layout(host)).toEqual(['[a|b]']);
    const block = element('block', 'block');
    host._children.splice(1, 0, block);
    attach(host, block);
    expect(layout(host)).toEqual(['[a]', 'block', '[b]']);
  });

  it('regroups every member of a run it splits', () => {
    const host = container();
    text(host, 'a');
    text(host, 'b');
    text(host, 'c');
    expect(layout(host)).toEqual(['[a|b|c]']);
    // Blocks inserted between texts that went in first; the later one hasn't loaded yet.
    const first = element('first', 'block');
    host._children.splice(1, 0, first);
    host._children.splice(3, 0, element('later', 'block'));
    attach(host, first);
    expect(layout(host)).toEqual(['[a]', 'first', '[b]', '[c]']);
  });

  it('rebuilds runs when a child display changes', () => {
    const host = container();
    text(host, 'a');
    const span = add(host, element('span', 'inline', true));
    text(host, 'c');
    span._styleHelper.display = 'block';
    host._windowsChildFlowChanged(span);
    expect(layout(host)).toEqual(['[a]', 'span', '[c]']);
    span._styleHelper.display = 'inline';
    host._windowsChildFlowChanged(span);
    expect(layout(host)).toEqual(['[a|span|c]']);
    span._styleHelper.display = 'inline-block';
    host._windowsChildFlowChanged(span);
    expect(span[runMember_]).toBe('box');
  });

  it('keeps a display: none child in its run', () => {
    const host = container();
    text(host, 'a');
    add(host, element('gone', 'none', true));
    text(host, 'b');
    expect(layout(host)).toEqual(['[a|gone|b]']);
  });

  it('makes an inline text element with a box style a box', () => {
    const host = container();
    text(host, 'a');
    const span = element('padded', 'inline', true);
    span._styleHelper.hasBoxStyle = true;
    add(host, span);
    expect(span[runMember_]).toBe('box');
  });

  it('groups only text in a flex container', () => {
    const host = container('flex');
    text(host, 'a');
    add(host, element('span', 'inline', true));
    text(host, 'b');
    expect(layout(host)).toEqual(['[a]', 'span', '[b]']);
    expect(host._view.items[0].display).toBe('block');
  });

  it('blockifies an inline text element in a flex container, and restores it in a block one', () => {
    const host = container('flex');
    text(host, 'a');
    const span = add(host, element('span', 'inline', true));
    expect(span._styleHelper.display).toBe('block');
    host._styleHelper.display = 'block';
    host[runsInline_] = false;
    host._windowsFlowTypeChanged();
    expect(span._styleHelper.display).toBe('inline');
    expect(layout(host)).toEqual(['[a|span]']);
  });

  it('regroups every child when the container display changes', () => {
    const host = container();
    text(host, 'a');
    const span = add(host, element('span', 'inline', true));
    text(host, 'b');
    expect(layout(host)).toEqual(['[a|span|b]']);
    host._styleHelper.display = 'flex';
    host._windowsFlowTypeChanged();
    expect(layout(host)).toEqual(['[a]', 'span', '[b]']);
    expect(host[runsInline_]).toBe(false);
    host._styleHelper.display = 'block';
    host._windowsFlowTypeChanged();
    expect(layout(host)).toEqual(['[a|span|b]']);
    expect(span[anonymousText_]).toBe(host._view.items[0]);
  });

  it('lays out a lone inline element as a direct child', () => {
    const host = container();
    const span = add(host, element('span', 'inline', true));
    expect(layout(host)).toEqual(['span']);
    expect(span[runMember_]).toBe('solo');
    remove(host, span);
    expect(layout(host)).toEqual([]);
  });

  it('moves a lone element into a run when text joins it', () => {
    const host = container();
    add(host, element('span', 'inline', true));
    text(host, 'b');
    expect(layout(host)).toEqual(['[span|b]']);
  });

  it('joins a lone element and text once the block between them goes', () => {
    const host = container();
    add(host, element('span', 'inline', true));
    const block = add(host, element('block', 'block'));
    text(host, 't');
    expect(layout(host)).toEqual(['span', 'block', '[t]']);
    remove(host, block);
    expect(layout(host)).toEqual(['[span|t]']);
  });

  it('groups runs once the container style is known', () => {
    const host = container('block', false);
    text(host, 'a');
    add(host, element('span', 'inline', true));
    text(host, 'b');
    expect(layout(host)).toEqual(['[a]', 'span', '[b]']);
    host._windowsSettleRuns();
    expect(layout(host)).toEqual(['[a|span|b]']);
  });

  it('blockifies children of a flex container once its style is known', () => {
    const host = container('flex', false);
    text(host, 'a');
    const span = add(host, element('span', 'inline', true));
    expect(span._styleHelper.display).toBe('inline');
    host._windowsSettleRuns();
    expect(span._styleHelper.display).toBe('block');
    expect(layout(host)).toEqual(['[a]', 'span']);
  });

  it('removes an anonymous Text left empty', () => {
    const host = container();
    text(host, 'a');
    const span = add(host, element('span', 'inline', true));
    host._windowsRemoveMember(host._children[0]);
    host._children.splice(0, 1);
    remove(host, span);
    expect(layout(host)).toEqual([]);
  });
});
