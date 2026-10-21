# innerHTML

Any MasonKit element can build its content from an HTML string. This is handy for server-rendered snippets, rich text from a CMS, or markup you would rather not translate into components by hand.

```ts
article.innerHTML = `
  <h2>Release notes</h2>
  <p>Plain <b>bold</b>, <i>italic</i> and <span style="color: #e84393">styled</span> text.<br>After a break.</p>
  <ul>
    <li>Faster layout</li>
    <li>New elements</li>
  </ul>
  <div style="display: flex; gap: 8px">
    <div style="width: 40px; height: 24px; background-color: #74b9ff; border-radius: 6px"></div>
    <div style="width: 40px; height: 24px; background-color: #00b894; border-radius: 6px"></div>
  </div>
`;
```

Assigning `innerHTML` replaces the element's existing content. Reading it returns the markup that was last assigned.

::: tip Set it after the view exists
On iOS and Android the markup is parsed by the native view. Assign `innerHTML` once the element is created, for example in a `loaded` handler, a framework `onMount` / `ngAfterViewInit`, or a ref callback.
:::

## Supported tags

| Kind | Tags |
|---|---|
| Block containers | `div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `figure`, `figcaption`, `address`, `hgroup`, `dl`, `dt`, `dd`, `form`, `fieldset`, `picture`, `hr` |
| Text | `p`, `h1` to `h6`, `blockquote`, `pre`, `code` |
| Inline text | `span`, `b`, `strong`, `em`, `i`, `a`, `small`, `mark`, `sub`, `sup`, `u`, `s`, `strike`, `del`, `ins`, `abbr`, `cite`, `q`, `dfn`, `kbd`, `samp`, `var`, `time`, `label`, `output`, `bdi`, `bdo`, `data`, `big`, `tt`, `ruby`, `wbr` |
| Lists | `ul`, `ol`, `li` (with bullets and numbers) |
| Disclosure | `details` (including the `open` attribute), `summary` |
| Media and controls | `img`, `br`, `input`, `textarea`, `button`, `scroll` |

Any other tag becomes a generic block container, so unknown markup still lays out instead of disappearing.

## Attributes

| Attribute | Effect |
|---|---|
| `style` | Inline CSS, parsed with the same units and values as stylesheets |
| `src` | Image source on `img` |
| `width`, `height` | Element size |
| `type` | Input type on `input` |
| `open` | Starts a `details` open |
| `disabled` | Disables a control, whatever its value |
| `value`, `placeholder` | Initial value and placeholder on `input` / `textarea` |
| `class`, `id`, `href`, `alt`, `title` | Recorded on the element; see the limitation below |

Inline `style` supports the layout, box model, flex, grid, positioning, text, background, border, shadow, filter, transform and mask properties. Values containing `;` or `:` inside parentheses or quotes, such as `url(data:image/png;base64,...)` or `font-family: "A;B"`, are kept intact.

## Text and whitespace

The parser follows HTML rules:

- Runs of whitespace collapse to a single space, so indented, pretty-printed markup does not add stray gaps between block children. A space between inline elements (`<b>a</b> <i>b</i>`) is kept.
- Inside `<pre>` (and its descendants), whitespace and line breaks are kept.
- Entities are decoded: `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&apos;`, `&nbsp;`, and numeric entities such as `&#169;` or `&#x2014;`.
- Comments, `<!doctype html>` and `<?xml ...?>` are skipped.
- The content of `<style>`, `<script>`, `<textarea>` and `<title>` is read as raw text rather than markup. `<style>`, `<script>` and `<title>` render nothing: stylesheets are not applied and scripts are not run.

## Limitation: `class` and `id` on iOS and Android

::: warning
On iOS and Android, elements built from `innerHTML` are native views, not NativeScript views. Their `class` and `id` attributes are recorded but do not take part in the CSS cascade, so app stylesheet rules do not match them, and they are not returned by `getViewById`. Use inline `style` for markup you assign this way.

On Windows, `innerHTML` builds regular MasonKit elements, so `class` and `id` work with your stylesheets there.
:::

If you need stylesheet-driven or interactive content, build it with your framework's components instead.
