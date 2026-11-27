import { describe, expect, it } from 'vitest';
import { Div } from './web';

const structural = (view: any) => ['first-child', 'last-child', 'only-child'].filter((name) => view.cssPseudoClasses.has(name));

function parentWith(count: number) {
  const parent = new Div() as any;
  const children = Array.from({ length: count }, () => new Div() as any);
  for (const child of children) parent.addChild(child);
  return { parent, children };
}

describe('structural pseudo-classes', () => {
  it('marks the first and last of several children', () => {
    const { children } = parentWith(3);
    expect(children.map(structural)).toEqual([['first-child'], [], ['last-child']]);
  });

  it('marks an only child as first, last and only', () => {
    const { children } = parentWith(1);
    expect(structural(children[0])).toEqual(['first-child', 'last-child', 'only-child']);
  });

  it('moves :first-child to a child inserted at the front', () => {
    const { parent, children } = parentWith(2);
    const front = new Div() as any;
    parent.insertChild(front, 0);
    expect([front, ...children].map(structural)).toEqual([['first-child'], [], ['last-child']]);
  });

  it('moves :last-child back when the last child is removed, and clears the removed child', () => {
    const { parent, children } = parentWith(3);
    parent.removeChild(children[2]);
    expect(children.map(structural)).toEqual([['first-child'], ['last-child'], []]);
  });

  it('makes the survivor an only child', () => {
    const { parent, children } = parentWith(2);
    parent.removeChild(children[0]);
    expect(children.map(structural)).toEqual([[], ['first-child', 'last-child', 'only-child']]);
  });

  it('gives a replacement the position of the child it replaces', () => {
    const { parent, children } = parentWith(2);
    const replacement = new Div() as any;
    parent.replaceChild(replacement, 1);
    expect([children[0], replacement, children[1]].map(structural)).toEqual([['first-child'], ['last-child'], []]);
  });

  it('clears every child on removeChildren', () => {
    const { parent, children } = parentWith(3);
    parent.removeChildren();
    expect(children.map(structural)).toEqual([[], [], []]);
  });
});
