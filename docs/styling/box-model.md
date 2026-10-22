# Box model and sizing

Every Mason element is a CSS box: content, padding, border and margin, sized by the usual properties.

```css
.card {
  width: 50%;
  min-width: 240px;
  max-width: 480px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  margin: 0 auto 24px;
}
```

## `box-sizing`

| Value | `width` / `height` measure |
| --- | --- |
| `border-box` (default) | the border box: padding and border are inside the size |
| `content-box` | the content box: padding and border are added on top |

::: warning Default differs from browsers
Mason elements default to `border-box`. Browsers default to `content-box`, and most CSS resets switch to `border-box` anyway, so this usually matches what web CSS expects. If a box from a non-reset stylesheet comes out smaller than in a browser, set `box-sizing: content-box` on it.
:::

## Width and height

`width`, `height`, `min-width`, `min-height`, `max-width` and `max-height` accept:

- a length in any [supported unit](/styling/units): `120px`, `10rem`, `50vh`, `calc(2rem + 4px)`
- a percentage of the containing block: `50%`
- `auto` (the initial value; on `max-*` it means no limit)

```css
.avatar {
  width: 48px;
  height: 48px;
}

.sidebar {
  width: 30%;
  min-width: 200px;
}
```

A percentage `height` needs a containing block with a definite height, as on the web. Inside an auto-height parent it behaves like `auto`.

### Intrinsic sizing keywords

`width`, `height` and `flex-basis` also take `min-content`, `max-content`, `fit-content`, `fit-content(<length-percentage>)` and `stretch`:

```css
.tag { width: max-content; }
.panel { width: fit-content(320px); }
```

`min-width`, `max-width`, `min-height` and `max-height` don't take them; the declaration is dropped. Grid track sizes accept them too; see [Grid](/styling/grid).

When a Mason root sits inside a plain NativeScript layout, the NativeScript parent measures a keyword width or height as `auto`.

## `aspect-ratio`

Takes a number or a `<ratio>`:

```css
.thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.square {
  width: 64px;
  aspect-ratio: 1;
}
```

When one dimension is known the other is derived from the ratio. The ratio is ignored when both are set.

## Margin

`margin` and its longhands accept lengths, percentages (of the containing block's width, as in CSS) and `auto`. Negative margins work.

```css
.centered {
  width: 320px;
  margin: 0 auto;      /* horizontally centered in block flow */
}

.pull-up {
  margin-top: -8px;
}
```

In block flow, vertical margins between adjacent block siblings collapse, as in a browser. In flex and grid containers margins never collapse, and `margin: auto` absorbs free space (for example `margin-left: auto` pushes a flex item to the end of the row).

## Padding

`padding` and its longhands accept lengths and percentages (of the containing block's width). Negative values and `auto` are invalid, as in CSS.

```css
.button {
  padding: 8px 16px;
}
```

## Border widths

Border widths take part in layout like padding. `border-width` accepts lengths and the keywords `thin` (1px), `medium` (3px) and `thick` (5px). A border is only drawn when it has a style other than `none`, so write `border: 1px solid` or set `border-style`. (With [preflight](/styling/#preflight) enabled every element defaults to `border-style: solid`, so a width alone draws a border.)

```css
.box {
  border: 2px solid #111;
  border-top-width: 4px;
}
```

Colors, styles, radii and images are covered in [Backgrounds and borders](/styling/backgrounds-borders).

## Overflow

`overflow`, `overflow-x` and `overflow-y` take `visible`, `hidden`, `clip`, `scroll` and `auto`. `overflow` accepts one or two values (`overflow: hidden auto` sets x then y).

Every block container (`<div>`, `<section>`, `<ul>`, ...) can become a scroll container when its overflow says so, as in a browser. See [Scrolling](/guide/scrolling).

## Logical properties

Logical properties name sides by the flow of the text: *block* is the direction blocks stack in, *inline* the direction a line runs. They follow the box's `writing-mode` and `direction`:

| Side | `horizontal-tb` | `vertical-rl` | `vertical-lr` |
| --- | --- | --- | --- |
| block-start / block-end | top / bottom | right / left | left / right |
| inline-start / inline-end | left / right (right / left in `rtl`) | top / bottom (bottom / top in `rtl`) | top / bottom (bottom / top in `rtl`) |

`inline-size` is the width in horizontal text and the height in vertical text, and `block-size` the other way round.

| Logical | Maps by writing mode |
| --- | --- |
| `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `min-block-size`, `max-block-size` | yes |
| `margin-inline`, `margin-block`, `margin-inline-start`, `margin-inline-end`, `margin-block-start`, `margin-block-end` | yes |
| `padding-inline*`, `padding-block*` | yes |
| `inset-inline*`, `inset-block*` | yes |
| `border-inline*`, `border-block*` (also `-width`, `-style`, `-color`) | yes |
| `border-start-start-radius`, `border-start-end-radius`, `border-end-end-radius`, `border-end-start-radius` | yes: the corner where the block side meets the inline side |
| `overflow-inline`, `overflow-block` | yes: `overflow-x` and `overflow-y` in horizontal text, the other way round in vertical text |

```css
.item {
  padding-inline: 16px;      /* left and right in horizontal text, top and bottom in vertical text */
  margin-block-end: 8px;     /* bottom in horizontal text, left in vertical-rl */
}
```

A logical and a physical property can set the same side (`margin-left` and `margin-inline-start` in left-to-right text). The one declared later wins, as in CSS. Code that sets margins, padding or insets through the native iOS or Android API sets the physical sides, and those win over the default margins of `<p>`, headings and lists.

The default margins of `<p>`, headings, `<blockquote>`, `<pre>`, lists and `<figure>` are logical (`margin-block`, `margin-inline`), so in vertical text they space paragraphs left and right. They are fixed lengths for a 16px font rather than `em`s, as before.
