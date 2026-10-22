# Typography

Text properties apply to every MasonKit text element (`<p>`, `<span>`, `<h1>`, `Text`, `Button`, ...) and inherit down the Mason tree the way they do in a browser: set `color` or `font-size` on a `<div>` and every text descendant picks it up.

```css
.article {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  color: #1f2937;
}

.article h1 {
  font-size: 2em;
  font-weight: 700;
  letter-spacing: 0.5px;
}
```

::: tip Inheritance stops at plain NativeScript views
Text styles inherit between Mason elements. Font settings on a plain NativeScript ancestor (a `StackLayout`, a `Page`) are not reliably passed into a Mason subtree on iOS and Android; a `font-family` there is dropped. Set fonts on the outermost Mason element instead. See [Mixing with NativeScript views](/guide/mixing-views).
:::

## Fonts

### font-family

`font-family` takes a normal CSS list. Quotes are optional, and MasonKit picks the first family in the list that is either a generic family or actually available on the device, as browser font matching does.

```css
code {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}
```

Generic families: `serif`, `sans-serif`, `monospace`, `cursive`, `fantasy`, `system-ui`, `ui-serif`, `ui-sans-serif`, `ui-monospace`, `ui-rounded`, `emoji`, `math`.

### Custom fonts

Ship the font files (`.ttf`, `.otf`, `.ttc`, `.otc`) in your app's `fonts` folder (`app/fonts` or `src/fonts`), then refer to the family by name:

```
src/
  fonts/
    Inter-Regular.ttf
    Inter-Bold.ttf
  app.css
```

```css
@font-face {
  font-family: 'Inter';
  src: url('~/fonts/Inter-Regular.ttf');
}

.body-text {
  font-family: 'Inter';
}
```

How the name is matched:

| Platform | Lookup |
| --- | --- |
| iOS | The runtime registers every file in the `fonts` folder at startup, so the family resolves by the font's own family name. |
| Android | MasonKit looks in the `fonts` folder for a file whose name matches the family (case and punctuation insensitive), then falls back to the family names stored inside each font file. |
| Windows | NativeScript core resolves `fonts` folder files and installed system fonts. |

The `@font-face` block is optional for MasonKit: the lookup above is what finds the file. Keeping it does no harm and keeps the stylesheet valid for the web.

### font-size

```css
p { font-size: 16px; }
small { font-size: 0.875em; }   /* relative to the parent's font size */
h1 { font-size: 2rem; }          /* relative to the root font size (16px by default) */
.label { font-size: 120%; }
.hero { font-size: clamp(24px, 5vw, 48px); }
```

Accepted: a bare number (CSS px), `px`, `pt`, `em`, `rem`, `%`, `vw`/`vh`/`vmin`/`vmax`, `dppx` and `calc()`/`min()`/`max()`/`clamp()`. `em` and `%` on `font-size` are relative to the parent's font size, exactly as in CSS. See [Units](/styling/units).

### font-weight and font-style

```css
strong { font-weight: bold; }
.light { font-weight: 300; }
em { font-style: italic; }
```

- `font-weight`: `normal` (400), `bold` (700), or `100` to `900`. `bolder` and `lighter` are not supported.
- `font-style`: `normal`, `italic`, `oblique`. An angle (`oblique 10deg`) is not supported.

When a family has no bold face, iOS synthesizes bold for weights of 600 and above.

### font-stretch

`font-stretch` takes the CSS keywords (`ultra-condensed` to `ultra-expanded`) or a percentage.

| Platform | Support |
| --- | --- |
| Android | Applied on Android 12 (API 31) and later, through the font's `wdth` variation axis, so it needs a variable font. |
| Windows | Applied. |
| iOS | Applied through the font's width trait, so the family needs a condensed or expanded face. |

### font-feature-settings

```css
.tabular { font-feature-settings: 'tnum' 1; }
```

Applied on every platform.

## Line height and spacing

### line-height

```css
p { line-height: 1.5; }    /* multiplier of the font size */
h1 { line-height: 40px; }  /* absolute */
```

A unitless value is a multiplier of the element's font size; a length is an absolute line height.

Lengths take any unit (`24px`, `2rem`, `1.5em`), and `normal` restores the font's natural line height.

::: tip Numbers set from code
A bare number assigned from code (`view.style.lineHeight = 24`) has no unit to go by: MasonKit treats values below 4 as multipliers and values of 4 or more as CSS px. Pass a string (`'24px'`, `'1.5'`) to be explicit.
:::

### letter-spacing and word-spacing

```css
.caps { letter-spacing: 1px; text-transform: uppercase; }
.airy { word-spacing: 4px; }
```

- `letter-spacing` takes `normal` or a length in any unit; `0.1em` is relative to the element's own font size.
- `word-spacing` takes `normal`, a length or a percentage. It is applied on iOS, on Android 10 (API 29) and later, and on Windows.

## Alignment

### text-align

`left`, `right`, `center`, `justify`, `start`, `end`.

```css
.price { text-align: end; }
.body { text-align: justify; }
```

### text-justify

`auto`, `none`, `inter-word`, `inter-character`, `distribute`. Controls how `text-align: justify` spaces a line. Applied on iOS and Android; `inter-character` and `distribute` need Android 15 (API 35) and justify between words below it. Windows honours `none` (no justification) and justifies between words otherwise.

### vertical-align

On inline content: `baseline`, `sub`, `super`, `text-top`, `text-bottom`, `middle`, `top`, `bottom`, a length, or a percentage of the line height.

```css
sup { vertical-align: super; font-size: 0.75em; }
.icon { vertical-align: middle; }
```

MasonKit's `<sub>` and `<sup>` elements already apply this. Vertical alignment of a box inside a flex or grid container is `align-self`, not `vertical-align`.

### text-indent

Indents the first line of a block. Takes a length or a percentage of the block's width. The `each-line` and `hanging` keywords are ignored; the length still applies.

```css
p + p { text-indent: 1.5em; }
```

## Decoration and case

### text-decoration

The shorthand and all longhands are supported, with the full CSS value set:

| Property | Values |
| --- | --- |
| `text-decoration-line` | `none`, `underline`, `overline`, `line-through`, `spelling-error`, `grammar-error` (combinable) |
| `text-decoration-style` | `solid`, `double`, `dotted`, `dashed`, `wavy` |
| `text-decoration-color` | any color, default `currentcolor` |
| `text-decoration-thickness` | a length |

```css
a { text-decoration: underline dotted #3b82f6 2px; }
del { text-decoration-line: line-through; }
```

::: tip
NativeScript core only understands `none`, `underline` and `line-through` for its own views. MasonKit elements receive the full declaration, so everything above works on them.
:::

### text-transform

`none`, `capitalize`, `uppercase`, `lowercase`.

### text-shadow

A comma separated list of shadows: `offset-x offset-y blur-radius color`.

```css
.glow { text-shadow: 0 0 8px rgba(59, 130, 246, 0.8); }
```

## Wrapping and overflow

### white-space

`normal`, `pre`, `pre-wrap`, `pre-line`, `nowrap`, `break-spaces`. `<pre>` defaults to `pre`.

```css
.tag { white-space: nowrap; }
.log { white-space: pre-wrap; font-family: monospace; }
```

### text-wrap

`wrap` and `nowrap`, from CSS or the `textWrap` view property (`<p textWrap="nowrap">`). `pretty` and `stable` lay out like `wrap`, and `balance` is accepted but also lays out like `wrap` for now.

### text-overflow

`clip` (default) or `ellipsis`. As in CSS, the ellipsis shows on a line that does not wrap and overflows its box, so pair it with `white-space: nowrap`:

```css
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### line-clamp

Limits a block to a number of lines and ends the last visible line with an ellipsis. `none` removes the limit. Both `line-clamp` and `-webkit-line-clamp` are accepted, and unlike the browser no `display: -webkit-box` is needed.

```css
.summary { line-clamp: 3; }
```

Inline elements are not clamped.

### hyphens

| Value | Behavior |
| --- | --- |
| `manual` (default) | Breaks only at soft hyphens (`&shy;`, U+00AD) in the text. |
| `none` | Never breaks at soft hyphens. |
| `auto` | Also hyphenates automatically. Android uses the text's locale; Windows ships English (US) patterns. |

## Writing direction

| Property | Values |
| --- | --- |
| `direction` | `ltr`, `rtl` |
| `unicode-bidi` | `normal`, `embed`, `bidi-override`, `isolate`, `isolate-override`, `plaintext` |
| `writing-mode` | `horizontal-tb`, `vertical-rl`, `vertical-lr` |
| `text-orientation` | `mixed`, `upright`, `sideways` |
| `text-combine-upright` | `none`, `all`, `digits` (2 to 4) |
| `text-spacing-trim` | `normal`, `space-all`, `space-first`, `trim-start`, `trim-both`, `trim-all`, `auto` |

Vertical writing modes are covered in [Block, inline and float](/styling/flow#writing-modes).

Logical properties (`margin-inline-start`, `padding-block`, ...) follow `direction` and the writing mode. See [Box model and sizing](/styling/box-model#logical-properties).

### text-spacing-trim

Full-width punctuation gives up the blank half of its em in some places, as in browsers. It inherits and applies to horizontal and vertical text.

| Value | Set half-width |
| --- | --- |
| `normal`, `auto` | An opening bracket after another punctuation mark, and a closing mark before a closing mark or a middle dot (`・：；`): `」「` and `。」` take 1.5em instead of 2em. A closing bracket that would end a line if it were half-width, rather than move to the next line. |
| `space-first` | As `normal`, and an opening bracket starting a line, except the first line and lines after a forced break |
| `trim-start` | As `normal`, and an opening bracket starting any line |
| `trim-both` | As `trim-start`, and a closing mark ending any line |
| `trim-all` | Every full-width punctuation mark |
| `space-all` | Nothing |

As in Chrome, a line-end comma or full stop (`、。，．`) isn't set half-width just to fit the line. Chrome doesn't support `trim-both`, `trim-all` and `auto`; MasonKit follows the CSS Text 4 definitions for them.

Mason removes the blank half itself on iOS, so any CJK font works. Windows, as Chrome, trims only marks whose font has half-width forms (`halt`, and `vhal` for upright marks in vertical text): Yu Gothic does; Yu Gothic UI, the Japanese fallback, and MS Gothic don't, so their punctuation keeps its spacing. Android uses the font's half-width forms (`halt`), which Noto CJK has; Android 15 and later also apply the font's `chws` feature, which `space-all` turns off.

## Color

`color` sets the text color and inherits. Any NativeScript color works: names, hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), `rgb()`, `rgba()`, `hsl()`. In string-valued properties (shadows, gradients, borders, filters) MasonKit also resolves `color-mix()`, `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated `rgb(255 0 0 / 50%)` form before handing the value to the platform.

`currentcolor` in `text-decoration-color` and inside inline SVG backgrounds resolves to the element's `color`.

For input carets, `caret-color` takes `auto` or a color.
