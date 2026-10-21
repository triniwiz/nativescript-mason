# Text and inline content

Text in MasonKit flows like text on the web. A block's inline children, meaning text, `span`, `b`, `a`, inline-block boxes, buttons, images and inputs, form **one inline flow**: lines wrap across element boundaries, and styles nest.

```html
<p>
  Your order of <b>3 items</b> ships <span class="accent">tomorrow</span>.
  <a href="https://example.com/orders/1042">View order</a>
</p>
```

This works the same on iOS, Android and Windows.

## Where inline flow applies

- **Block containers** (`div`, `p`, `li`, `View`, `Text`, ...) collect consecutive inline children into lines. Block children (`div`, `p`, `h2`) still start their own line, as on the web.
- **Flex and grid containers** treat every child as its own item. A `span` inside a `display: flex` row is a flex item, not part of a line of text.

```html
<!-- one paragraph, wraps as text -->
<div>Hello <b>world</b>, how are you?</div>

<!-- three flex items side by side -->
<div style="display: flex; gap: 8px">Hello <b>world</b> <span>!</span></div>
```

## Text elements

`Text` and every HTML text element (`p`, `span`, `h1`-`h6`, `b`, `em`, `code`, `a`, `li`, `blockquote`, `pre`, ...) hold text directly:

```html
<h2>Settings</h2>
<Text>Plain text in a block</Text>
<span class="tag">inline</span>
```

In code, `textContent` replaces all of an element's content with one string, as in the DOM:

```ts
heading.textContent = 'Updated title';
```

Renderers that create DOM-style text nodes between elements get [`TextNode`](/elements/widgets#textnode)s, which take part in the same inline flow.

## Inline boxes

Non-text elements in a line of text are real native views placed inside the text: they receive touches, show focus and are read by screen readers like any other view.

```html
<p>
  Rate this
  <Img src="~/assets/star.png" style="width: 16px; height: 16px" />
  or <Button class="small">skip</Button>
</p>
```

Give an element `display: inline-block` to keep it on the line while it has its own box, padding and size:

```html
<p>Status: <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: #e0f2f1">active</span></p>
```

`vertical-align` (`baseline`, `middle`, `top`, `bottom`, `text-top`, `text-bottom`, `sub`, `super` or a length) positions an inline box against the line.

## Line breaks

Use `<br>` (the [`Br`](/elements/widgets#br) widget) for a forced break:

```html
<p>1 Main Street<br />Springfield</p>
```

## Whitespace

Whitespace collapses as in HTML: runs of spaces and newlines become one space, there is no doubled space where two elements meet, and none at the start of a line.

`white-space` changes that per element:

| Value | Spaces | Newlines | Wraps |
| --- | --- | --- | --- |
| `normal` | collapse | collapse | yes |
| `nowrap` | collapse | collapse | no |
| `pre` | keep | keep | no |
| `pre-wrap` | keep | keep | yes |
| `pre-line` | collapse | keep | yes |
| `break-spaces` | keep | keep | yes |

`<pre>` defaults to `white-space: pre`. Wrapping, truncation (`text-overflow: ellipsis`, `line-clamp`), `text-wrap: balance` and the other text properties are covered in [Typography](/styling/typography).

## Taps on text

Elements inside a line of text get their own events even when they draw as part of a single text view. Tapping a `span` or `a` dispatches `click` to that element, sets `:active` on it while pressed, and the event bubbles to its ancestors (`stopPropagation()` stops it).

```css
a:active { opacity: 0.6; }
```

## Links

`<a href>` opens its URL on tap with the system handler (browser, mail, phone, ...):

```html
<p>Read the <a href="https://github.com/triniwiz/nativescript-mason" class="link">source</a>.</p>
```

- A fragment link (`href="#section"`) opens nothing; handle `click` yourself to scroll or navigate.
- A URL the platform cannot open is ignored rather than throwing.
- Links have no default colour or underline. Style them:

```css
a { color: #3d5afe; text-decoration: underline; }
```

Screen readers announce links inside text as links.
