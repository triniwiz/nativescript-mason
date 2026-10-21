# HTML elements

`@triniwiz/nativescript-masonkit/web` exports native counterparts of the common HTML elements. They are registered in every flavour by the framework setup, and their tags are lowercase:

```html
<article class="post">
  <header>
    <h1>Release notes</h1>
    <p>Version 1.0 <small>(beta)</small></p>
  </header>
  <section>
    <p>Lists now draw <em>inside</em> markers. Try <code>list-style: inside</code>.</p>
    <blockquote>It just lays out like the web.</blockquote>
  </section>
  <footer><a href="https://github.com/triniwiz/nativescript-mason">Source</a></footer>
</article>
```

In plain NativeScript XML, use a namespace: `xmlns:web="@triniwiz/nativescript-masonkit/web"`, then `<web:div>`, `<web:p>` and so on.

Elements come in two shapes:

- **Block elements** (`div`, `section`, `ul`, `form`, ...) are containers. Each of them can scroll when its `overflow` says so, as any block box can in a browser. With the default `overflow: visible` they neither scroll nor clip.
- **Text elements** (`p`, `h1`, `span`, `a`, `li`, ...) are built on [`Text`](/elements/widgets#text): they hold text and inline content, and their children flow as one paragraph. See [Text and inline content](/elements/text).

## Block containers

`div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `address`, `figcaption`, `hgroup`, `dt`, `form`, `fieldset`, `legend`, `picture`.

All are `display: block` with no default margins or padding: the tag only carries meaning for your stylesheets. `form`, `fieldset` and `legend` are layout containers only; there is no form submission (see [Forms](/elements/forms#form-fieldset-legend-and-label)).

## Headings, paragraphs and preformatted text

`h1`-`h6`, `p`, `blockquote`, `pre`. Block-level text elements with browser margins, see [Default styles](#default-styles).

## Phrasing elements

Inline text elements. They differ only in their default styles:

| Tag | Default style |
| --- | --- |
| `span`, `abbr`, `q`, `time`, `label`, `output`, `bdi`, `bdo` | none (plain inline text) |
| `b`, `strong` | `font-weight: bold` |
| `em`, `i`, `cite`, `dfn`, `var` | `font-style: italic` |
| `code` | monospace font |
| `kbd` | `font-family: monospace; font-size: 0.9em` |
| `samp` | `font-family: monospace` |
| `small` | `font-size: 0.8em` |
| `sub` | `font-size: 0.75em; vertical-align: sub` |
| `sup` | `font-size: 0.75em; vertical-align: super` |
| `u`, `ins` | `text-decoration: underline` |
| `s`, `del` | `text-decoration: line-through` |
| `mark` | yellow background, black text |
| `a` | none; `href` opens the link on tap (see [Links](/elements/text#links)) |

::: warning `<q>`
`<q>` does not add quotation marks.
:::

`code` uses the platform monospace face: `ui-monospace` (Menlo) on iOS, `monospace` on Android.

## Other elements

| Tag | Notes |
| --- | --- |
| `figure` | Block, `margin: 16px 40px`. |
| `dl` | Block, `margin: 16px 0`. |
| `dt` | Block. |
| `dd` | Block, `margin-left: 40px`. |
| `hr` | Block, zero height with a 1px solid top border, `margin: 8px 0` (horizontal margins stay 0). Set `border-top-color` to colour it. |
| `ul`, `ol`, `li` | See [Lists](/elements/lists). |
| `details`, `summary` | See [details and summary](/elements/details). |
| `link` | Metadata only: always `display: none`, never renders. Registered so code that creates one does not fail. |

`img`, `button`, `input`, `textarea` and `br` are the [MasonKit widgets](/elements/widgets) of the same names.

## Default styles

The full list of user-agent defaults. Lengths are CSS pixels (dips).

| Tag | Base | Display | Font | Margin | Other |
| --- | --- | --- | --- | --- | --- |
| block containers above | block | `block` | | | |
| `p` | text | `block` | | `16px 0` | |
| `h1` | text | `block` | 32px bold | `21.44px 0` | |
| `h2` | text | `block` | 24px bold | `19.92px 0` | |
| `h3` | text | `block` | 19px bold | `18.72px 0` | |
| `h4` | text | `block` | 16px bold | `21.28px 0` | |
| `h5` | text | `block` | 13px bold | `22.18px 0` | |
| `h6` | text | `block` | 11px bold | `24.98px 0` | |
| `blockquote` | text | `block` | | `16px 40px` | |
| `pre` | text | `block` | monospace | `16px 0` | `white-space: pre` |
| `ul` | block | `block` | | `16px 0` | `padding-left: 40px`, `list-style-type: disc` |
| `ol` | block | `block` | | `16px 0` | `padding-left: 40px`, `list-style-type: decimal` |
| `li` | text | `block` | | | list marker |
| `figure` | block | `block` | | `16px 40px` | |
| `dl` | block | `block` | | `16px 0` | |
| `dd` | block | `block` | | `0 0 0 40px` | |
| `hr` | block | `block` | | `8px 0` | `height: 0`, 1px solid top border |
| `link` | block | `none` | | | |
| phrasing elements | text | `inline` | see [the table above](#phrasing-elements) | | |

All of these sit below your stylesheets in the cascade: any rule for the same property wins, as it would over a browser's defaults. With [preflight](/elements/#preflight) on, margins and padding start at 0 (heading font sizes stay) and `<ul>` has no markers.
