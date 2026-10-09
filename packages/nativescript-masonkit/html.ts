export interface HtmlElement {
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

export type HtmlNode = HtmlElement | string;

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['style', 'script', 'textarea', 'title']);
const DROPPED = new Set(['style', 'script', 'title', 'head', 'meta', 'link', 'base']);
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'ul']);
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', hellip: '…', mdash: '—', ndash: '–', bull: '•', middot: '·', laquo: '«', raquo: '»', times: '×', trade: '™' };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED[body.toLowerCase()] ?? match;
  });
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function collapse(text: string): string {
  return text.replace(/[ \t\n\r\f]+/g, ' ');
}

export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = { tag: '#root', attrs: {}, children: [] };
  const stack: HtmlElement[] = [root];
  const top = () => stack[stack.length - 1];
  const inPre = () => stack.some((e) => e.tag === 'pre' || e.tag === 'textarea');
  const close = (tag: string) => {
    for (let i = stack.length - 1; i > 0; i--) {
      if (stack[i].tag === tag) {
        stack.length = i;
        return;
      }
    }
  };
  const addText = (raw: string) => {
    if (!raw) return;
    const text = inPre() ? decodeEntities(raw) : collapse(decodeEntities(raw));
    if (!text) return;
    const children = top().children;
    const last = children[children.length - 1];
    if (typeof last === 'string') children[children.length - 1] = last + text;
    else children.push(text);
  };

  const src = html ?? '';
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      addText(src.slice(i));
      break;
    }
    if (lt > i) addText(src.slice(i, lt));
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      i = end === -1 ? src.length : end + 3;
      continue;
    }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') {
      const end = src.indexOf('>', lt);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    const closing = src[lt + 1] === '/';
    const nameMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(src.slice(lt + (closing ? 2 : 1)));
    if (!nameMatch) {
      addText('<');
      i = lt + 1;
      continue;
    }
    const tag = nameMatch[0].toLowerCase();
    let end = lt + (closing ? 2 : 1) + nameMatch[0].length;
    let quote = '';
    for (; end < src.length; end++) {
      const ch = src[end];
      if (quote) {
        if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
    }
    const inner = src.slice(lt + (closing ? 2 : 1) + nameMatch[0].length, end);
    i = end + 1;

    if (closing) {
      if (tag === 'br') {
        top().children.push({ tag: 'br', attrs: {}, children: [] });
        continue;
      }
      close(tag);
      continue;
    }

    if (CLOSES_P.has(tag) && stack.some((e) => e.tag === 'p')) close('p');
    if (tag === 'li') {
      const list = stack.findLastIndex((e) => e.tag === 'ul' || e.tag === 'ol');
      const li = stack.findLastIndex((e) => e.tag === 'li');
      if (li > list) stack.length = li;
    }
    if ((tag === 'dt' || tag === 'dd') && (top().tag === 'dt' || top().tag === 'dd')) stack.pop();

    const element: HtmlElement = { tag, attrs: parseAttributes(inner), children: [] };
    if (RAW_TEXT.has(tag)) {
      const closeAt = src.toLowerCase().indexOf(`</${tag}`, i);
      const body = src.slice(i, closeAt === -1 ? src.length : closeAt);
      i = closeAt === -1 ? src.length : src.indexOf('>', closeAt) + 1 || src.length;
      if (DROPPED.has(tag)) continue;
      if (body) element.children.push(decodeEntities(body));
      top().children.push(element);
      continue;
    }
    if (DROPPED.has(tag)) continue;
    top().children.push(element);
    if (!VOID.has(tag) && !/\/\s*$/.test(inner)) stack.push(element);
  }
  return root.children;
}
