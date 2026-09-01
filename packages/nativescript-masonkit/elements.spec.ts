import { describe, expect, it } from 'vitest';
import { getMasonKitElements } from './elements';

// `getMasonKitElements()` is load-bearing and was untested: Angular builds its
// whole registerElement loop from it, and demo-solid/react/vue each loop over it
// too. Its own doc comment claims the tag list "can never drift from what other
// framework integrations register" — this is what makes that true.
const elements = getMasonKitElements();
const byTag = new Map(elements.map((entry) => [entry.tag.toLowerCase(), entry]));

describe('the element registry', () => {
  it('registers no tag twice', () => {
    const tags = elements.map((entry) => entry.tag.toLowerCase());
    expect(tags.length).toBe(new Set(tags).size);
  });

  it('gives every entry a constructor', () => {
    for (const entry of elements) {
      expect(typeof entry.ctor, entry.tag).toBe('function');
    }
  });

  // The tags a pasted page is most likely to contain.
  const EXPECTED = [
    // structure
    'div',
    'section',
    'header',
    'footer',
    'article',
    'main',
    'nav',
    'aside',
    'figure',
    'figcaption',
    'address',
    'details',
    'summary',
    'hgroup',
    'hr',
    'dl',
    'dt',
    'dd',
    'form',
    'fieldset',
    'legend',
    'picture',
    // headings and text blocks
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'blockquote',
    'pre',
    // lists
    'ul',
    'ol',
    'li',
    // phrasing
    'span',
    'a',
    'b',
    'strong',
    'em',
    'i',
    'code',
    'small',
    'mark',
    'sub',
    'sup',
    'u',
    'ins',
    's',
    'del',
    'abbr',
    'cite',
    'dfn',
    'q',
    'kbd',
    'samp',
    'var',
    'time',
    'label',
    'output',
    'bdi',
    'bdo',
    // widgets and replaced content
    'img',
    'button',
    'input',
    'textarea',
    'br',
    'scroll',
  ];

  it.each(EXPECTED)('registers <%s>', (tag) => {
    expect(byTag.has(tag), `<${tag}> is not registered`).toBe(true);
  });

  it('marks block containers as containers', () => {
    for (const tag of ['div', 'section', 'ul', 'ol', 'figure', 'form', 'scroll']) {
      expect(byTag.get(tag)?.isContainer, tag).toBe(true);
    }
  });

  it("keeps /web's more specific class where it overlaps the base package", () => {
    // The base package exports container Ul/Ol/Li widgets (the data-bound
    // RecyclerView list); /web's inline versions must win, because the marker
    // mechanism only works for those. See MASON_CONTEXT.md item 9.
    const web = getMasonKitElements({ mason: false, web: true });
    for (const tag of ['ul', 'ol', 'li']) {
      const fromWeb = web.find((entry) => entry.tag.toLowerCase() === tag);
      expect(fromWeb, tag).toBeDefined();
      expect(byTag.get(tag)?.ctor, tag).toBe(fromWeb!.ctor);
    }
  });

  it('preserves PascalCase for MasonKit widgets so Angular can derive kebab-case', () => {
    // Lowercasing these up front would silently drop Angular's <text-area>.
    const tags = elements.map((entry) => entry.tag);
    expect(tags).toContain('TextArea');
  });
});
