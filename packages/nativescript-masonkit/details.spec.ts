import { describe, expect, it, vi } from 'vitest';
import { Details, Div, Summary } from './web';

// NativeScript's WeakRef has .get(), which core's Style calls; the platform's only has .deref().
const weakRef = WeakRef.prototype as any;
weakRef.get ??= function (this: WeakRef<object>) {
  return this.deref();
};

function details(...children: any[]) {
  const element = new Details() as any;
  for (const child of children) element.addChild(child);
  return element;
}

const hidden = (view: any) => view.style.display === 'none';

describe('<details>', () => {
  it('shows only its first summary while closed', () => {
    const summary = new Summary();
    const body = new Div();
    const element = details(summary, body);

    expect(hidden(summary)).toBe(false);
    expect(hidden(body)).toBe(true);

    element.open = true;
    expect(hidden(body)).toBe(false);
    expect(body.style.display).not.toBe('none');

    element.open = false;
    expect(hidden(body)).toBe(true);
  });

  it('hides content added while closed and shows it once removed', () => {
    const element = details(new Summary());
    const late = new Div();
    element.insertChild(late, 1);
    expect(hidden(late)).toBe(true);

    element.removeChild(late);
    expect(hidden(late)).toBe(false);
  });

  it('is absent while closed, so [open] only matches an open one', () => {
    const element = details(new Summary());
    expect(element.open).toBeUndefined();
    element.open = true;
    element.open = false;
    expect(element.open).toBeUndefined();
  });

  it('treats open as a boolean attribute and notifies, so [open] restyles', () => {
    const element = details(new Summary(), new Div());
    const changed = vi.fn();
    element.on('openChange', changed);

    element.open = '';
    expect(element.open).toBe(true);
    element.open = 'false';
    expect(element.open).toBeUndefined();
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('matches :open and fires toggle with the old and new state', () => {
    const element = details(new Summary());
    const toggled = vi.fn();
    element.on('toggle', toggled);

    element.open = true;
    expect(element.cssPseudoClasses.has('open')).toBe(true);
    expect(toggled.mock.calls[0][0]).toMatchObject({ oldState: 'closed', newState: 'open' });

    element.open = false;
    expect(element.cssPseudoClasses.has('open')).toBe(false);
  });

  it('toggles when its summary is tapped', () => {
    const summary = new Summary() as any;
    const element = details(summary, new Div());
    summary._activate();
    expect(element.open).toBe(true);
    summary._activate();
    expect(element.open).toBeUndefined();
  });

  it('closes the others sharing its name when it opens', () => {
    const a = details(new Summary());
    const b = details(new Summary());
    for (const element of [a, b]) {
      element.name = 'faq';
      element.onLoaded();
    }

    a.open = true;
    b.open = true;
    expect(a.open).toBeUndefined();
    expect(b.open).toBe(true);

    b.onUnloaded();
    a.open = true;
    expect(b.open).toBe(true);
  });
});
