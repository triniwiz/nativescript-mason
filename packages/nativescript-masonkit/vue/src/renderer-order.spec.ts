import { describe, expect, it } from 'vitest';
import { NSVComment, NSVElement, NSVText } from 'nativescript-vue/dist/dom';
import { registerElement } from 'nativescript-vue/dist/registry';
import { ViewBase } from '../../common';
import { masonMeta } from './mason-meta';

// These are the real Vue DOM operations and Mason child APIs. Native views
// have not loaded yet, so framework text exists before it owns a native run.
registerElement('audit-parent', () => ViewBase, masonMeta);
registerElement('audit-child', () => ViewBase, masonMeta);

const child = () => new NSVElement('audit-child');

describe('Vue renderer child order before native load', () => {
  it('inserts before an existing element after a pending text node', () => {
    const parent = new NSVElement('audit-parent');
    const a = child();
    const b = child();
    parent.appendChild(new NSVText('label'));
    parent.appendChild(b);
    parent.insertBefore(a, b);
    expect(parent.nativeView._children).toEqual([a.nativeView, b.nativeView]);
  });

  it('reorders keyed children around text and comment anchors', () => {
    const parent = new NSVElement('audit-parent');
    const a = child();
    const b = child();
    const c = child();
    parent.appendChild(new NSVText('label'));
    parent.appendChild(new NSVComment('fragment'));
    for (const node of [a, b, c]) parent.appendChild(node);
    parent.insertBefore(c, a);
    expect(parent.nativeView._children).toEqual([c.nativeView, a.nativeView, b.nativeView]);
    parent.appendChild(c);
    expect(parent.nativeView._children).toEqual([a.nativeView, b.nativeView, c.nativeView]);
  });

  it('moves a child between parents without leaving a stale slot', () => {
    const first = new NSVElement('audit-parent');
    const second = new NSVElement('audit-parent');
    const a = child();
    const b = child();
    first.appendChild(a);
    second.appendChild(new NSVText('label'));
    second.appendChild(b);
    second.insertBefore(a, b);
    expect(first.nativeView._children).toEqual([]);
    expect(second.nativeView._children).toEqual([a.nativeView, b.nativeView]);
    expect(a.nativeView.parent).toBe(second.nativeView);
    second.removeChild(a);
    expect(second.nativeView._children).toEqual([b.nativeView]);
    expect(a.nativeView.parent).toBeFalsy();
  });
});
