import { setWindowsInnerHTML } from './common';
import { parseHtml, type HtmlElement, type HtmlNode } from './html';
import { textNode_ } from './symbols';
import * as web from './web';
import { Br } from './br';
import { Button } from './button';
import { Img } from './img';
import { Input } from './input';
import { Scroll } from './scroll';
import { Text } from './text';
import { TextArea } from './textarea';

const CLASSES: Record<string, new () => any> = {
  div: web.Div,
  section: web.Section,
  header: web.Header,
  footer: web.Footer,
  article: web.Article,
  main: web.Main,
  nav: web.Nav,
  aside: web.Aside,
  figure: web.Figure,
  figcaption: web.Figcaption,
  address: web.Address,
  details: web.Details,
  summary: web.Summary,
  hgroup: web.Hgroup,
  dl: web.Dl,
  dt: web.Dt,
  dd: web.Dd,
  form: web.Form,
  fieldset: web.Fieldset,
  legend: web.Legend,
  picture: web.Picture,
  hr: web.Hr,
  ul: web.Ul,
  ol: web.Ol,
  li: web.Li,
  p: web.P,
  span: web.Span,
  code: web.Code,
  pre: web.Pre,
  blockquote: web.Blockquote,
  a: web.A,
  h1: web.H1,
  h2: web.H2,
  h3: web.H3,
  h4: web.H4,
  h5: web.H5,
  h6: web.H6,
  b: web.B,
  strong: web.Strong,
  em: web.Em,
  i: web.I,
  small: web.Small,
  mark: web.Mark,
  sub: web.Sub,
  sup: web.Sup,
  u: web.U,
  ins: web.Ins,
  s: web.S,
  strike: web.S,
  del: web.Del,
  abbr: web.Abbr,
  cite: web.Cite,
  dfn: web.Dfn,
  q: web.Q,
  kbd: web.Kbd,
  samp: web.Samp,
  var: web.Var,
  time: web.Time,
  label: web.Label,
  output: web.Output,
  bdi: web.Bdi,
  scroll: Scroll,
  button: Button,
};

const PHRASING = new Set(['data', 'bdo', 'big', 'tt', 'ruby', 'rt', 'rp', 'wbr', 'font']);

function textOf(nodes: HtmlNode[]): string {
  return nodes.map((n) => (typeof n === 'string' ? n : textOf(n.children))).join('');
}

function create(el: HtmlElement): any {
  const a = el.attrs;
  switch (el.tag) {
    case 'img': {
      const img = new Img();
      if (a.src) img.src = a.src;
      return img;
    }
    case 'input': {
      const input = new Input() as any;
      if (a.type) input.type = a.type;
      if ('value' in a) input.value = a.value;
      if (a.placeholder) input.placeholder = a.placeholder;
      return input;
    }
    case 'textarea': {
      const area = new TextArea() as any;
      area.value = textOf(el.children).replace(/^\n/, '');
      if (a.placeholder) area.placeholder = a.placeholder;
      return area;
    }
    case 'br':
      return new Br();
  }
  const Cls = CLASSES[el.tag] ?? (PHRASING.has(el.tag) ? web.Span : web.Div);
  return new Cls();
}

function applyAttributes(view: any, el: HtmlElement) {
  const a = el.attrs;
  if (a.id) view.id = a.id;
  if (a.class) view.className = a.class;
  if (a.href && 'href' in view) view.href = a.href;
  if (a.width && /^\d+(\.\d+)?$/.test(a.width)) view.style.width = Number(a.width);
  if (a.height && /^\d+(\.\d+)?$/.test(a.height)) view.style.height = Number(a.height);
  if (a.style) view.setInlineStyle(a.style);
}

function append(parent: any, nodes: HtmlNode[]) {
  const inline = parent instanceof Text;
  for (const node of nodes) {
    if (typeof node === 'string') {
      if (!inline && !node.trim()) continue;
      parent.insertBefore({ nodeType: 3, nodeName: '#text', data: node }, null);
      continue;
    }
    if (node.tag === 'br' && inline) {
      parent.insertBefore({ nodeType: 3, nodeName: 'br', data: '' }, null);
      continue;
    }
    const child = create(node);
    applyAttributes(child, node);
    parent.addChild(child);
    if (node.tag !== 'img' && node.tag !== 'input' && node.tag !== 'textarea' && node.tag !== 'br') append(child, node.children);
  }
}

function clear(view: any) {
  const children = [...((view._children as any[]) ?? [])].reverse();
  for (const c of children) {
    if (!c) continue;
    if (c[textNode_]) view.removeChild({ [textNode_]: c[textNode_] });
    else view.removeChild(c);
  }
}

setWindowsInnerHTML((view, html) => {
  clear(view);
  append(view, parseHtml(html));
});
