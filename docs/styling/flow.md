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

A vertical box inside a horizontal layout works: text runs top to bottom with sideways glyphs, lines stack right to left (`vertical-rl`) or left to right (`vertical-lr`), and inline boxes inside the text are turned with it. Its line length comes from its own height, a definite containing-block height, or failing those the viewport height, as in CSS.

Not supported yet:

- upright CJK glyphs (`text-orientation: upright`)
- vertical containers whose block children flow vertically (only the text inside a vertical box is vertical)
- float exclusions in vertical text
- turning the label of a button or other widget inside vertical text
