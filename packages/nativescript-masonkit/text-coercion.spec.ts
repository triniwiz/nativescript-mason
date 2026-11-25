import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';
import { native_ } from './symbols';
import { Li, Span } from './web';

function withNative(Element: new () => unknown) {
  const element = new Element() as any;
  const setTextContent = vi.fn();
  element[native_] = { setTextContent };
  const load = () => element._resumeNativeUpdates(element._suspendNativeUpdatesCount);
  return { element, setTextContent, load };
}

describe.each([
  ['span', Span],
  ['li', Li],
  ['button', Button],
])('%s text', (_tag, Element) => {
  const coercions: [unknown, string][] = [
    [5, '5'],
    [0, '0'],
    [false, 'false'],
    [null, ''],
    [undefined, ''],
  ];

  it.each(coercions)('reads %j back from textContent as %j, as in the DOM', (value, text) => {
    const { element, setTextContent, load } = withNative(Element);
    load();
    element.textContent = 'before';
    element.textContent = value;

    expect(setTextContent.mock.calls).toEqual([['before'], [text]]);
    expect(element.textContent).toBe(text);
  });

  it.each(coercions)('shows %j set as text as %j, as core Label does', (value, text) => {
    const { element, setTextContent, load } = withNative(Element);
    load();
    element.text = 'before';
    element.text = value;

    expect(setTextContent.mock.calls).toEqual([['before'], [text]]);
  });

  it('coerces text set before it loads', () => {
    const { element, setTextContent, load } = withNative(Element);
    element.text = 5;
    load();

    expect(setTextContent).toHaveBeenLastCalledWith('5');
  });
});
