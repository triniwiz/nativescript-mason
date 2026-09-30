import { describe, expect, it, vi } from 'vitest';
import { ListBase } from './common';

function list() {
  const l = Object.create(ListBase.prototype) as any;
  l._defaultTemplate = { key: 'default', createView: () => null };
  l._itemTemplatesInternal = [l._defaultTemplate];
  l.refresh = vi.fn();
  l._registerItemTemplates = vi.fn();
  return l;
}

const tpl = (key: string) => ({ key, createView: () => ({ key }) as any });

describe('Ul keyed templates', () => {
  it('keeps the default template first and appends the keyed ones', () => {
    const l = list();
    l._onItemTemplatesChanged([tpl('a'), tpl('b')]);
    expect(l._itemTemplatesInternal.map((t: any) => t.key)).toEqual(['default', 'a', 'b']);
    expect(l._registerItemTemplates).toHaveBeenCalledOnce();
    expect(l.refresh).toHaveBeenCalledOnce();
  });

  it('lets the selector pick a keyed template', () => {
    const l = list();
    l._onItemTemplatesChanged([tpl('a'), tpl('b')]);
    const items = [{ type: 'b' }, { type: 'a' }];
    l._getDataItem = (i: number) => items[i];
    l.itemTemplateSelector = (item: any) => item.type;
    expect(l._getItemTemplate(0).key).toBe('b');
    expect(l._getItemTemplate(1).key).toBe('a');
  });

  it('resets to the default template alone when templates are cleared', () => {
    const l = list();
    l._onItemTemplatesChanged([tpl('a')]);
    l._onItemTemplatesChanged(null);
    expect(l._itemTemplatesInternal.map((t: any) => t.key)).toEqual(['default']);
  });
});
