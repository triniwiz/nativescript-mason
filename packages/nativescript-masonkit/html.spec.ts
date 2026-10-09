import { describe, expect, it } from 'vitest';
import { decodeEntities, parseHtml } from './html';

describe('parseHtml', () => {
  it('builds nested elements with attributes', () => {
    expect(parseHtml('<div class="a" style="color: red"><p>Hi <b>there</b></p></div>')).toEqual([{ tag: 'div', attrs: { class: 'a', style: 'color: red' }, children: [{ tag: 'p', attrs: {}, children: ['Hi ', { tag: 'b', attrs: {}, children: ['there'] }] }] }]);
  });

  it('collapses whitespace outside pre and keeps it inside', () => {
    expect(parseHtml('<p>a \n\t b</p>')).toEqual([{ tag: 'p', attrs: {}, children: ['a b'] }]);
    expect(parseHtml('<pre>a \n b</pre>')).toEqual([{ tag: 'pre', attrs: {}, children: ['a \n b'] }]);
  });

  it('treats void and self-closed tags as leaves', () => {
    expect(parseHtml('<p>a<br>b<img src="x.png"/>c</p>')).toEqual([{ tag: 'p', attrs: {}, children: ['a', { tag: 'br', attrs: {}, children: [] }, 'b', { tag: 'img', attrs: { src: 'x.png' }, children: [] }, 'c'] }]);
  });

  it('closes an open p and li implicitly', () => {
    expect(parseHtml('<p>one<p>two').map((n) => (n as any).children)).toEqual([['one'], ['two']]);
    const list = parseHtml('<ul><li>a<li>b</ul>')[0] as any;
    expect(list.children.map((li: any) => li.children)).toEqual([['a'], ['b']]);
  });

  it('drops comments, doctypes, scripts and styles', () => {
    expect(parseHtml('<!doctype html><!-- x --><style>p{}</style><script>1<2</script><span>ok</span>')).toEqual([{ tag: 'span', attrs: {}, children: ['ok'] }]);
  });

  it('keeps textarea content raw', () => {
    expect(parseHtml('<textarea><b>x</b></textarea>')).toEqual([{ tag: 'textarea', attrs: {}, children: ['<b>x</b>'] }]);
  });

  it('handles quoted > in attributes, boolean attributes and stray </br>', () => {
    expect(parseHtml('<input title="a>b" disabled></br>')).toEqual([
      { tag: 'input', attrs: { title: 'a>b', disabled: '' }, children: [] },
      { tag: 'br', attrs: {}, children: [] },
    ]);
  });
});

describe('decodeEntities', () => {
  it('decodes named and numeric references', () => {
    expect(decodeEntities('&lt;a&gt; &amp; &#65;&#x42; &nbsp;&unknown;')).toBe('<a> & AB  &unknown;');
  });
});
