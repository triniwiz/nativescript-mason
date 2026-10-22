# Property reference

Every CSS property MasonKit elements understand, in alphabetical order. Shorthands share a row with their longhands. "Inherited" means a value set on a Mason element reaches its Mason descendants, as in CSS; inheritance does not cross into or out of plain NativeScript views (see [Mixing with NativeScript views](/guide/mixing-views)).

Values are summarized; follow the link in the last column for details and examples. Unless a note says otherwise, a property works on iOS, Android and Windows.

Lengths accept a bare number (CSS px), `px`, `dip`, `dppx` (device pixel), `pt`, `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax` and `calc()`/`min()`/`max()`/`clamp()`, unless noted. See [Units](/styling/units).

| Property | Values | Inherited | Notes | See |
| --- | --- | --- | --- | --- |
| `align-content` | `normal`, `start`, `end`, `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around`, `space-evenly` | no | | [Flexbox](/styling/flexbox), [Grid](/styling/grid) |
| `align-items` | `normal`, `start`, `end`, `flex-start`, `flex-end`, `center`, `baseline`, `stretch` | no | | [Flexbox](/styling/flexbox) |
| `align-self` | as `align-items` | no | | [Flexbox](/styling/flexbox) |
| `aspect-ratio` | a number or `<w> / <h>` | no | | [Box model](/styling/box-model) |
| `backdrop-filter` | filter functions, as `filter` | no | `drop-shadow()` has no effect | [Effects](/styling/effects#backdrop-filter) |
| `background`, `background-color`, `background-image`, `background-position` (`-x`, `-y`), `background-size`, `background-repeat` | CSS background syntax, multiple layers; `background-repeat` includes `space` and `round` | no | | [Backgrounds](/styling/backgrounds-borders#backgrounds) |
| `background-origin`, `background-clip`, `background-attachment`, `background-blend-mode` | box keywords, plus `text` for the clip; `scroll`/`fixed`/`local`; blend modes | no | Blend modes need Android 10 (API 29) | [Backgrounds](/styling/backgrounds-borders#background-shorthand-and-layers) |
| `block-size`, `min-block-size`, `max-block-size` | as `height`, `min-height`, `max-height` | no | Logical, maps to the vertical axis | [Box model](/styling/box-model) |
| `border`, `border-top`, `border-right`, `border-bottom`, `border-left` | `<width> <style> <color>` | no | | [Borders](/styling/backgrounds-borders#borders) |
| `border-block`, `border-inline`, `border-block-start`, `border-block-end`, `border-inline-start`, `border-inline-end` (and `-width`, `-style`, `-color`) | as the physical forms | no | Logical, mapped for horizontal left-to-right text | [Borders](/styling/backgrounds-borders#borders) |
| `border-color`, `border-top-color`, `border-right-color`, `border-bottom-color`, `border-left-color` | colors, 1 to 4 values | no | | [Borders](/styling/backgrounds-borders#borders) |
| `border-image` | source, slice, width, outset, repeat | no | | [Borders](/styling/backgrounds-borders#border-image) |
| `border-radius`, `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius` | lengths, percentages, `/` for elliptical corners | no | | [Borders](/styling/backgrounds-borders#border-radius) |
| `border-start-start-radius`, `border-start-end-radius`, `border-end-end-radius`, `border-end-start-radius` | as the physical corners | no | Logical corners | [Borders](/styling/backgrounds-borders#border-radius) |
| `border-style`, `border-top-style`, `border-right-style`, `border-bottom-style`, `border-left-style` | `none`, `hidden`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset` | no | | [Borders](/styling/backgrounds-borders#borders) |
| `border-width`, `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width` | lengths, `thin`, `medium`, `thick` | no | | [Borders](/styling/backgrounds-borders#borders) |
| `bottom`, `left`, `right`, `top` | length, percentage, `auto` | no | | [Positioning](/styling/positioning) |
| `box-shadow` | `[inset] <x> <y> [blur] [spread] [color]`, comma separated | no | | [Box shadows](/styling/backgrounds-borders#box-shadows) |
| `box-sizing` | `border-box`, `content-box` | no | Defaults to `border-box`, unlike browsers | [Box model](/styling/box-model) |
| `caret-color` | `auto`, a color | yes | Inputs | [Typography](/styling/typography#color) |
| `clear` | `none`, `left`, `right`, `both` | no | | [Flow](/styling/flow) |
| `clip-path` | basic shapes, reference boxes, `none` | no | | [Effects](/styling/effects#clip-path) |
| `color` | a color | yes | | [Typography](/styling/typography#color) |
| `column-gap`, `row-gap`, `gap` | lengths, percentages; `gap` takes 1 or 2 values | no | `grid-gap`, `grid-row-gap` and `grid-column-gap` are accepted as legacy aliases | [Flexbox](/styling/flexbox), [Grid](/styling/grid) |
| `corner-shape`, `corner-shape-top-left`, `corner-shape-top-right`, `corner-shape-bottom-right`, `corner-shape-bottom-left` | `round`, `squircle`, `square`, `bevel`, `scoop`, `notch`, `superellipse(<number>)` | no | | [Borders](/styling/backgrounds-borders#corner-shape) |
| `direction` | `ltr`, `rtl` | yes | | [Typography](/styling/typography#writing-direction) |
| `display` | `none`, `block`, `inline`, `inline-block`, `flex`, `inline-flex`, `grid`, `inline-grid` | no | | [Flow](/styling/flow) |
| `filter` | `blur()`, `brightness()`, `contrast()`, `drop-shadow()`, `grayscale()`, `hue-rotate()`, `invert()`, `opacity()`, `saturate()`, `sepia()` | no | | [Effects](/styling/effects#filter) |
| `flex` | `none`, `auto`, `<grow> [<shrink>] [<basis>]` | no | Shorthand for `flex-grow`, `flex-shrink`, `flex-basis` | [Flexbox](/styling/flexbox) |
| `flex-basis` | `auto`, length, percentage, `content`, `min-content`, `max-content`, `fit-content` | no | | [Flexbox](/styling/flexbox) |
| `flex-direction` | `row`, `row-reverse`, `column`, `column-reverse` | no | | [Flexbox](/styling/flexbox) |
| `flex-flow` | `<direction> <wrap>` | no | Shorthand | [Flexbox](/styling/flexbox) |
| `flex-grow`, `flex-shrink` | numbers | no | | [Flexbox](/styling/flexbox) |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` | no | | [Flexbox](/styling/flexbox) |
| `float` | `none`, `left`, `right` | no | | [Flow](/styling/flow) |
| `font-family` | a family list | yes | | [Typography](/styling/typography#font-family) |
| `font-feature-settings` | `normal`, OpenType feature tags | no | Set it on the text element itself | [Typography](/styling/typography#font-feature-settings) |
| `font-size` | length, percentage, `em`, `rem` | yes | | [Typography](/styling/typography#font-size) |
| `font-stretch` | keywords, percentage | yes | Android 12 (API 31) with a variable font; iOS needs a condensed or expanded face | [Typography](/styling/typography#font-stretch) |
| `font-style` | `normal`, `italic`, `oblique` | yes | | [Typography](/styling/typography#font-weight-and-font-style) |
| `font-weight` | `normal`, `bold`, `100` to `900` | yes | | [Typography](/styling/typography#font-weight-and-font-style) |
| `grid-area`, `grid-row`, `grid-row-start`, `grid-row-end`, `grid-column`, `grid-column-start`, `grid-column-end` | line numbers, line names, `span <n>`, area names, `auto` | no | | [Grid](/styling/grid) |
| `grid-auto-columns`, `grid-auto-rows` | track size list | no | | [Grid](/styling/grid) |
| `grid-auto-flow` | `row`, `column`, `dense`, `row dense`, `column dense` | no | | [Grid](/styling/grid) |
| `grid-template-areas` | quoted area strings | no | | [Grid](/styling/grid) |
| `grid-template-columns`, `grid-template-rows` | track lists, `repeat()`, `minmax()`, `fr`, `auto-fill`, `auto-fit` | no | | [Grid](/styling/grid) |
| `height`, `width` | `auto`, length, percentage, `min-content`, `max-content`, `fit-content`, `fit-content(<length>)`, `stretch` | no | | [Box model](/styling/box-model) |
| `hyphens` | `none`, `manual`, `auto` | yes | | [Typography](/styling/typography#hyphens) |
| `inline-size`, `min-inline-size`, `max-inline-size` | as `width`, `min-width`, `max-width` | no | Logical, maps to the horizontal axis | [Box model](/styling/box-model) |
| `inset` | 1 to 4 values of `top`, `right`, `bottom`, `left` | no | Shorthand | [Positioning](/styling/positioning) |
| `inset-block`, `inset-inline`, `inset-block-start`, `inset-block-end`, `inset-inline-start`, `inset-inline-end` | as `inset` | no | Logical | [Positioning](/styling/positioning) |
| `justify-content` | as `align-content` | no | | [Flexbox](/styling/flexbox) |
| `justify-items` | as `align-items` | no | | [Grid](/styling/grid) |
| `justify-self` | as `align-self` | no | | [Grid](/styling/grid) |
| `letter-spacing` | `normal`, length | yes | | [Typography](/styling/typography#letter-spacing-and-word-spacing) |
| `line-clamp`, `-webkit-line-clamp` | `none`, a number of lines | no | | [Typography](/styling/typography#line-clamp) |
| `line-height` | `normal`, number (multiplier), length | yes | A bare number set from code below 4 is a multiplier, otherwise CSS px | [Typography](/styling/typography#line-height) |
| `list-style`, `list-style-type`, `list-style-position` | `none`, `disc`, `circle`, `square`, `decimal`; `inside`, `outside` | yes | | [Lists](/elements/lists) |
| `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left` | length, percentage, `auto` | no | | [Box model](/styling/box-model) |
| `margin-block`, `margin-inline`, `margin-block-start`, `margin-block-end`, `margin-inline-start`, `margin-inline-end` | as `margin` | no | Logical | [Box model](/styling/box-model) |
| `mask`, `mask-image`, `mask-mode`, `mask-position`, `mask-size`, `mask-repeat`, `mask-origin`, `mask-clip`, `mask-composite` | CSS masking syntax | no | `-webkit-mask*` forms accepted | [Effects](/styling/effects#masks) |
| `mask-border`, `mask-border-source`, `mask-border-slice`, `mask-border-width`, `mask-border-outset`, `mask-border-repeat`, `mask-border-mode` | 9-slice mask syntax | no | `-webkit-mask-box-image` accepted | [Effects](/styling/effects#mask-border) |
| `max-height`, `max-width`, `min-height`, `min-width` | length, percentage, `auto` | no | Sizing keywords (`min-content`, ...) are not accepted | [Box model](/styling/box-model) |
| `object-fit` | `fill`, `contain`, `cover`, `none`, `scale-down` | no | Images | [Effects](/styling/effects#object-fit-and-object-position) |
| `object-position` | keywords, lengths, percentages | no | Images | [Effects](/styling/effects#object-fit-and-object-position) |
| `opacity` | 0 to 1 | no | | [Effects](/styling/effects#opacity-and-visibility) |
| `overflow`, `overflow-x`, `overflow-y` | `visible`, `hidden`, `clip`, `scroll`, `auto` | no | `overflow-inline` and `overflow-block` are logical aliases | [Scrolling](/guide/scrolling) |
| `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left` | length, percentage | no | | [Box model](/styling/box-model) |
| `padding-block`, `padding-inline`, `padding-block-start`, `padding-block-end`, `padding-inline-start`, `padding-inline-end` | as `padding` | no | Logical | [Box model](/styling/box-model) |
| `place-content`, `place-items`, `place-self` | `<align> [<justify>]` | no | Shorthands | [Grid](/styling/grid) |
| `position` | `static`, `relative`, `absolute`, `fixed`, `sticky` | no | | [Positioning](/styling/positioning) |
| `scrollbar-width` | a number | no | A width, not the CSS `auto`/`thin`/`none` keywords | [Scrolling](/guide/scrolling) |
| `text-align` | `left`, `right`, `center`, `justify`, `start`, `end` | yes | | [Typography](/styling/typography#text-align) |
| `text-decoration`, `text-decoration-line`, `text-decoration-style`, `text-decoration-color`, `text-decoration-thickness` | full CSS values, including `overline` and `wavy` | no | | [Typography](/styling/typography#text-decoration) |
| `text-indent` | length, percentage | yes | | [Typography](/styling/typography#text-indent) |
| `text-justify` | `auto`, `none`, `inter-word`, `inter-character`, `distribute` | yes | Windows honours `none` only | [Typography](/styling/typography#text-justify) |
| `text-orientation` | `mixed`, `upright`, `sideways` | yes | Per paragraph, not per inline element | [Flow](/styling/flow#text-orientation) |
| `text-overflow` | `clip`, `ellipsis` | no | | [Typography](/styling/typography#text-overflow) |
| `text-shadow` | `<x> <y> [blur] [color]`, comma separated | yes | | [Typography](/styling/typography#text-shadow) |
| `text-transform` | `none`, `capitalize`, `uppercase`, `lowercase` | yes | | [Typography](/styling/typography#text-transform) |
| `text-wrap` | `wrap`, `nowrap`, `balance`, `pretty`, `stable` | yes | `balance`, `pretty` and `stable` lay out as `wrap` | [Typography](/styling/typography#text-wrap) |
| `touch-action` | `auto`, `none`, `manipulation`, `pan-x`, `pan-y`, `pinch-zoom` | no | | [Events](/guide/events) |
| `transform` | transform functions | no | 3D functions are flattened to 2D; platform differences in the linked table | [Effects](/styling/effects#transform) |
| `transform-origin` | keywords, lengths, percentages | no | | [Effects](/styling/effects#transform-origin) |
| `unicode-bidi` | `normal`, `embed`, `bidi-override`, `isolate`, `isolate-override`, `plaintext` | no | | [Typography](/styling/typography#writing-direction) |
| `vertical-align` | `baseline`, `sub`, `super`, `text-top`, `text-bottom`, `middle`, `top`, `bottom`, length, percentage | no | Inline content | [Typography](/styling/typography#vertical-align) |
| `visibility` | `visible`, `hidden` | no | Handled by NativeScript core; keeps the element's space | [Effects](/styling/effects#opacity-and-visibility) |
| `white-space` | `normal`, `pre`, `pre-wrap`, `pre-line`, `nowrap`, `break-spaces` | yes | | [Typography](/styling/typography#white-space) |
| `word-spacing` | `normal`, length, percentage | yes | Android needs Android 10 (API 29) | [Typography](/styling/typography#letter-spacing-and-word-spacing) |
| `writing-mode` | `horizontal-tb`, `vertical-rl`, `vertical-lr` | yes | Vertical containers lay out their children vertically | [Flow](/styling/flow#writing-modes) |
| `z-index` | an integer | no | | [Positioning](/styling/positioning) |

## Not supported

These have no effect on MasonKit elements today:

- `order`
- `outline` and its longhands (use a spread `box-shadow` for focus rings)
- `font-weight: bolder` / `lighter`, `font-style: oblique <angle>`
- `perspective` and 3D rendering (3D transform functions are flattened to 2D, and iOS ignores most of them)
- `display: contents`, `grid-template` and `grid` shorthands
- `transition`
- `url()` references to SVG filters, masks and paint servers

## Stylesheet features

Selectors, classes, `@media`, `@keyframes`, `var()` custom properties, specificity and pseudo-classes come from NativeScript's CSS engine; MasonKit registers its properties into it, so all of the above work in `.css` and `.scss` files and in inline `style` attributes. See [How CSS applies](/styling/).
