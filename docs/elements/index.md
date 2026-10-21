# Elements

MasonKit ships two families of elements. Both are real native views laid out by the same engine, and both take the same CSS.

| Family | Where it comes from | Examples |
| --- | --- | --- |
| **MasonKit widgets** | `@triniwiz/nativescript-masonkit` | `View`, `Text`, `Scroll`, `Img`, `Button`, `Input`, `TextArea`, `Br` |
| **HTML elements** | `@triniwiz/nativescript-masonkit/web` | `div`, `section`, `p`, `span`, `h1`-`h6`, `a`, `ul`, `li`, `details`, ... |

```html
<div class="card">
  <h2>Order #1042</h2>
  <p>Shipped <b>today</b>. <a href="https://example.com/track">Track it</a></p>
  <Img src="~/assets/box.png" class="thumb" />
  <Button>Open</Button>
</div>
```

The tags work the same way in every flavour: Angular, Vue, Svelte Native, React and Solid templates, and plain NativeScript XML (through a namespace). See [Frameworks](/frameworks/) for the one-line setup each flavour needs.

- [MasonKit widgets](/elements/widgets): the general-purpose building blocks.
- [HTML elements](/elements/html): every tag from `/web`, with its default display and user-agent styles.
- [Text and inline content](/elements/text): how text, spans, links and inline boxes flow.
- [Lists](/elements/lists), [Forms and inputs](/elements/forms), [details and summary](/elements/details).

## The element registry

Every framework integration registers its tags from one list, `getMasonKitElements()`. If you wire up a renderer yourself, build from it too, so you pick up new tags automatically:

```ts
import { getMasonKitElements } from '@triniwiz/nativescript-masonkit/elements';

for (const { tag, ctor, isContainer } of getMasonKitElements()) {
  // register `tag` with your renderer, using container-aware wiring when isContainer is true
}
```

Each entry has:

| Field | Meaning |
| --- | --- |
| `tag` | Canonical spelling: lowercase for HTML elements (`'div'`, `'h1'`), PascalCase for widgets (`'View'`, `'TextArea'`). |
| `ctor` | The view class. |
| `isContainer` | `true` when the element hosts children through MasonKit's own child list. `false` for leaf elements: `Img`, `Br`, `Input` and `TextArea`. |

Pass `{ mason: false }` or `{ web: false }` to leave one family out. The `installMasonKit()` helpers for Angular, Vue and Svelte accept the same options.

### When both families define a tag

Tags are de-duplicated case-insensitively, HTML elements first. So:

- `<ul>`, `<ol>` and `<li>` are the HTML elements from `/web`: a block list container and a text-based list item.
- `<view>`, `<img>`, `<button>`, `<input>`, `<textarea>` and `<br>` resolve to the widgets, since `/web` has no element of those names.

The base package also exports `Ul`, `Ol` and `Li` classes that are a data-bound, templated list. They lose the tag in the registry, so framework templates never get them. See [Lists](/elements/lists#data-bound-list) if you want that widget.

## Containers and leaves

Container elements (`View`, `Scroll`, `Text`, every HTML element) accept children: other MasonKit elements, text, and plain NativeScript views such as a `Label` or a `StackLayout`. A plain view inside a MasonKit container takes part in flex, grid or block layout as one box. See [Mixing with NativeScript views](/guide/mixing-views).

Leaf elements (`Img`, `Br`, `Input`, `TextArea`) have no children.

## Default styles

Like a browser, MasonKit gives elements user-agent defaults:

- Every element is `display: block` unless its type says otherwise. Spans, links and the other phrasing elements are `inline`; `Button`, `Input` and `TextArea` are `inline-block`; `Img` is inline.
- Headings, paragraphs, `blockquote`, `pre`, lists, `figure` and `dl` get the familiar browser margins. Headings get their browser font sizes and bold weight.
- Lists show markers: discs for `<ul>`, numbers for `<ol>`.

These defaults sit at the lowest priority, so any stylesheet rule for the same property replaces them. `ul { margin: 0 }` or a utility class such as `list-none` works as it does on the web.

The full table of defaults is in [HTML elements](/elements/html#default-styles).

### Preflight

`preflight` switches the whole tree to a normalised starting point, the one utility-first CSS frameworks assume:

```ts
import { View } from '@triniwiz/nativescript-masonkit';

View.preflight = true; // at app startup, before any view is created
```

With preflight on:

- `box-sizing: border-box` everywhere.
- Margins, padding and border widths start at 0, so headings, paragraphs and lists lose their browser spacing. Heading font sizes stay.
- Backgrounds are transparent.
- `<ul>` and `<ol>` have `list-style-type: none`.
- `Img` is `display: block`.

It is a global flag. Set it before you create views: changing it later does not restyle nodes that already exist.
