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
  margin-block: 0 16px; /* the left side in vertical-rl: the space before the next column */
}
```

Logical properties follow the writing mode, and so do the default margins of `<p>` and headings, which space vertical paragraphs left and right. See [Logical properties](/styling/box-model#logical-properties).

A box whose writing mode is orthogonal to its container's (a vertical box in a horizontal page, or a `horizontal-tb` box inside a vertical one) sizes its inline axis to fit its content, up to the space it has. That space is its containing block's definite size in that axis, else the viewport height, as in CSS.

### text-orientation

Sets how glyphs sit in vertical text. It inherits.

| Value | Glyphs |
| --- | --- |
| `mixed` (default) | CJK, kana, Hangul and other characters Unicode marks upright stay upright; Latin and other scripts are turned sideways. |
| `upright` | Every character stays upright, Latin and spaces included. |
| `sideways` | Every character is turned sideways. `sideways-right` is accepted as the same value. |

A full-width character's cell along the line is the font's vertical advance where the font has vertical metrics, else that font's height, as in Chrome. Full-width characters use the font's vertical forms: the ideographic comma and full stop (`、` `。`) and small kana sit in the corner of their cell, and brackets, the long vowel mark `ー` and wave dashes take their turned shapes. A bracket or dash the font has no vertical form for is turned with the line instead.

`text-orientation` can be set on an inline element: `<span>` inside a `mixed` paragraph can keep its Latin letters upright.

### text-combine-upright

Sets a run of characters horizontally in a single upright cell of 1em, squeezed to fit when it's wider, as for dates and numbers in vertical Japanese. It inherits.

| Value | Combines |
| --- | --- |
| `none` (default) | nothing |
| `all` | all of the element's text |
| `digits`, `digits 2` to `digits 4` | each run of up to that many ASCII digits (2 when no number is given); longer runs stay sideways |

```html
<p class="page">令和<span class="tcy">6</span>年<span class="tcy">12</span>月</p>
```

```css
.tcy {
  text-combine-upright: all;
}
```

### Scrolling and floats

A `vertical-rl` box that scrolls (`overflow-x: scroll` or `auto`) starts at its right edge, where its first column is, and scrolls left towards the rest, keeping its distance from the right edge when its content changes. Its `scrollLeft` is 0 at the start and negative to the left, as in browsers. `scrollIntoView()` aligns along the scroller's own block and inline axes, so `block: 'start'` brings an element to the right edge of a `vertical-rl` scroller, as the CSSOM View spec says. Chrome instead turns `block` and `inline` into sides once, from the element's own writing mode, so a horizontal scroller around vertical text aligns differently there.

Floats in a vertical box sit at the ends of its lines: `float: left` at the top (line-left) and `float: right` at the bottom, against its block-start side. The text beside them shortens its lines around them.

Inline boxes (images, buttons) in vertical text move along their lines around floats as the text does.

Buttons set their label in the writing mode. Text fields (`<input>`, `<textarea>`) are native controls without vertical text layout: in vertical text they are placed like any inline box, and their text doesn't follow `writing-mode`.
