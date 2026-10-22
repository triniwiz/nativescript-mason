# Block, inline and float

Outside flex and grid, Mason lays content out in normal flow, as a browser does: block boxes stack vertically, and inline content wraps in lines inside them.

```html
<article>
  <h2>Release notes</h2>
  <p>
    This build fixes <b>three</b> layout bugs and adds
    <a href="https://example.com/changelog">a changelog</a>.
  </p>
</article>
```

The heading and paragraph are blocks. Inside the paragraph, the text, `<b>` and `<a>` form one inline flow, so the sentence wraps across element boundaries like it would on the web.

## `display`

| Value | Box |
| --- | --- |
| `block` | Block-level box in normal flow. The default for `<div>`, `View`, `<p>`, headings, lists, ... |
| `inline` | Inline content that flows in lines. The default for `<span>`, `<b>`, `<strong>`, `<em>`, `<i>`, `<a>`, `<code>`, ... |
| `inline-block` | An atomic inline box: sits in a line like text, sized and padded like a block |
| `flex`, `inline-flex` | [Flex container](/styling/flexbox), block-level or inline-level |
| `grid`, `inline-grid` | [Grid container](/styling/grid), block-level or inline-level |
| `none` | Not laid out or drawn |

`contents`, `flow-root`, `list-item` and `table` values aren't supported. Lists draw their markers without `list-item`; see [Lists](/elements/lists).

## Inline flow

Consecutive inline-level children of a block container (text, inline elements, inline-blocks, buttons, images, inputs) are grouped into one flow. Within it:

- Text wraps across element boundaries.
- Whitespace collapses as in HTML: no doubled spaces where two elements meet, none at the start of a line.
- Inline-blocks and form controls sit on the line as real views, and receive taps, gestures and accessibility like any view.
- `vertical-align` positions inline boxes on the line (`baseline`, `middle`, `top`, `bottom`, `text-top`, `text-bottom`, `sub`, `super`, or a length).
- Taps on a piece of text (an `<a>` inside a `<p>`) are dispatched to that element, and `:active` applies to it while pressed.

```html
<p>
  Press <button class="inline-btn">Save</button> to keep your changes,
  or <a href="#">discard them</a>.
</p>
```

```css
.inline-btn {
  display: inline-block;
  padding: 2px 8px;
  vertical-align: middle;
}
```

Block children of the same container stay blocks: a `<div>` between two runs of text breaks the flow, as in CSS.

In flex and grid containers there is no inline flow: each child is a separate item. Wrap mixed content in a `<p>` or `<span>` to have it flow together.

## Margins in block flow

Vertical margins between adjacent block siblings collapse to the larger of the two, as in CSS. Margins don't collapse in flex or grid containers.

## Floats

`float: left | right | none` takes a box out of the line and places it against the left or right edge of its block. `clear: left | right | both | none` moves a block below earlier floats.

```css
.thumb {
  float: left;
  width: 96px;
  height: 96px;
  margin: 0 12px 8px 0;
}

.after-media {
  clear: both;
}
```

Text beside a float wraps around the float's margin box, and the block grows to fit the wrapped lines.

## Writing modes

`writing-mode` accepts `horizontal-tb` (default), `vertical-rl` and `vertical-lr`.

```css
.spine {
  writing-mode: vertical-rl;
}
```

Text in a vertical box runs top to bottom and its lines stack right to left (`vertical-rl`) or left to right (`vertical-lr`). Inline boxes inside the text are turned with it.

A vertical box is also a vertical container. Its children lay out in its writing mode:

- Block children stack right to left (`vertical-rl`) or left to right (`vertical-lr`), and stretch along the box's height. Margins collapse along that axis.
- In a flex container, `flex-direction: row` runs down the page and `column` runs across it.
- In a grid container, `grid-template-columns` sizes tracks down the page and `grid-template-rows` sizes them across it.
- `gap`, `justify-*` and `align-*` follow the same logical axes. Sizes, padding, margins, borders and insets stay physical, as in CSS.

```html
<div class="page">
  <p>第一段。縦書きの段落は右から左へ並びます。</p>
  <p>第二段。</p>
</div>
```

```css
.page {
  writing-mode: vertical-rl;
  height: 320px;
}

.page p {
  margin: 0 0 0 16px; /* the space before the next column, see below */
}
```

A box whose writing mode is orthogonal to its container's (a vertical box in a horizontal page, or a `horizontal-tb` box inside a vertical one) sizes its inline axis to fit its content, up to the space it has. That space is its containing block's definite size in that axis, else the viewport height, as in CSS.

### text-orientation

Sets how glyphs sit in vertical text. It inherits.

| Value | Glyphs |
| --- | --- |
| `mixed` (default) | CJK, kana, Hangul and other characters Unicode marks upright stay upright; Latin and other scripts are turned sideways. |
| `upright` | Every character stays upright, Latin and spaces included. |
| `sideways` | Every character is turned sideways. `sideways-right` is accepted as the same value. |

Full-width characters take 1em along the line. Other upright characters take the font's height. Brackets, the long vowel mark `ー` and wave dashes are turned with the line, as their vertical forms are. The ideographic comma and full stop (`、` `。`) use the font's vertical forms, which put them in the corner of their cell.

Not supported yet:

- `text-combine-upright`
- float exclusions in vertical text
- turning the label of a button or other widget inside vertical text
- scroll containers in `vertical-rl`: content that overflows to the left can't be scrolled to
- logical properties (`margin-inline`, `inset-block`, ...) still map as for horizontal text
- the default margins of `<p>` and headings stay on their top and bottom in vertical text; set `margin-left`/`margin-right` to space vertical paragraphs
- `text-orientation` set on an inline element inside a paragraph: the paragraph's own value is used for all of its text
- small kana keep their horizontal glyph, so they sit low in their cell instead of in its corner
