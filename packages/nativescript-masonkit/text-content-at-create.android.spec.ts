import { describe, expect, it } from 'vitest';
import { Text } from './text';
import { Tree } from './tree';
import { textContentProperty } from './common';

type Call = [target: string, method: string, args: unknown[]];

function recorder(name: string, calls: Call[], make?: (method: string) => ((...args: any[]) => unknown) | undefined) {
  const fields: Record<PropertyKey, unknown> = {};
  return new Proxy(fields, {
    get(_t, prop) {
      if (prop in fields) return fields[prop];
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      return (...args: unknown[]) => {
        calls.push([name, prop, args]);
        return make?.(prop)?.(...args);
      };
    },
    set(_t, prop, value) {
      fields[prop] = value;
      return true;
    },
  });
}

function fakeTree() {
  const calls: Call[] = [];
  const native = recorder('Mason', calls, (method) => (method.startsWith('createTextView') ? () => recorder('TextView', calls) : undefined));
  const tree: any = new Tree(native as never);
  tree._slotMailbox = new Int32Array([-1]);
  (Tree as any)._tree = tree;
  return calls;
}

function mount(textContent: string) {
  const calls = fakeTree();
  const text: any = new Text();
  text.textContent = textContent;
  text._setupUI({});
  text.callLoaded();
  return { text, calls };
}

const names = (calls: Call[]) => calls.map(([target, method]) => `${target}.${method}`);

describe('Text mounted with textContent', () => {
  it('creates the native text view holding its text in one call', () => {
    const { calls } = mount('hello');
    const textCalls = calls.filter(([, method]) => method.startsWith('createTextView') || method === 'setTextContent');
    expect(names(textCalls)).toEqual(['Mason.createTextViewWithSlot']);
    expect(textCalls[0][2][2]).toBe('hello');
  });

  it('sends a later change to native once', () => {
    const { text, calls } = mount('hello');
    calls.length = 0;
    text.textContent = 'world';
    expect(calls.filter(([, method]) => method === 'setTextContent')).toEqual([['TextView', 'setTextContent', ['world']]]);
  });

  it('creates an empty text view when no textContent was set', () => {
    const { calls } = mount('');
    const create = calls.find(([, method]) => method === 'createTextViewWithSlot')!;
    expect(create[2]).toHaveLength(2);
  });

  it('still sends the text when children joined the view before the deferred setter ran', () => {
    const calls = fakeTree();
    const text: any = new Text();
    text.textContent = 'hello';
    void text.android;
    text._children.push({ text: 'child' });
    text[textContentProperty.setNative]('hello');
    expect(calls.filter(([, method]) => method === 'setTextContent')).toEqual([['TextView', 'setTextContent', ['hello']]]);
  });
});
