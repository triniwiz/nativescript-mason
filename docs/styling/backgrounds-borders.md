# Backgrounds and borders

MasonKit draws backgrounds, borders, radii and shadows itself, on every element, from the same CSS you would write for a browser.

```css
.card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}
```

## Backgrounds

### background-color

Any color. Also settable from code as `view.style.backgroundColor`.

### background shorthand and layers

`background` accepts the full CSS shorthand, including several comma separated layers. The first layer is painted on top, and `background-color` (only allowed in the last layer) is painted underneath all of them.

```css
.hero {
  background:
    linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.7)),
    url('https://example.com/cover.jpg') center / cover no-repeat,
    #111827;
}
```

The shorthand expands into longhands, so a later longhand overrides one part, as in CSS:

| Longhand | Values |
| --- | --- |
| `background-image` | `none`, `url(...)`, a gradient, or a comma separated list of them |
| `background-position` | keywords (`top`, `left`, `center`, ...), lengths, percentages; also `background-position-x` and `background-position-y` |
| `background-size` | `auto`, `cover`, `contain`, one or two lengths or percentages |
| `background-repeat` | `repeat`, `repeat-x`, `repeat-y`, `no-repeat`, `space`, `round`, or one keyword per axis (`space round`) |
| `background-origin` | `border-box`, `padding-box`, `content-box` |
| `background-clip` | `border-box`, `padding-box`, `content-box` |
| `background-attachment` | `scroll`, `fixed`, `local` |
| `background-blend-mode` | `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity` |

Per-layer lists repeat cyclically when they are shorter than the layer list, as CSS specifies.

::: warning
`background-clip: text` (also spelled `-webkit-background-clip: text`, or `text` in the `background` shorthand) paints the background only inside the glyphs. Pair it with a transparent `color` to show the background through the text:

```css
.headline {
  background: linear-gradient(90deg, #e91e63, #3f51b5);
  background-clip: text;
  color: transparent;
}
```

It applies to text elements (`p`, `span`, headings and the like) on iOS and Android, including inline text merged into them. A container does not yet clip its background to the text of its child elements, and Windows paints the background as with `border-box`.
:::

`background-blend-mode` needs Android 10 (API 29) or later.

### Images

`url()` takes:

- a remote `http://` or `https://` URL,
- a `data:` URL (PNG, JPEG and other raster formats),
- an inline SVG as `data:image/svg+xml,...` (see below),
- an app-relative path such as `url('~/images/bg.png')`, resolved against the app folder.

### SVG backgrounds

Inline SVG is drawn as vectors, so it stays sharp at any size and is a convenient way to ship icons:

```css
.check {
  width: 24px;
  height: 24px;
  color: #16a34a;
  background: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M5 13l4 4L19 7' fill='none' stroke='currentColor' stroke-width='2'/></svg>") center / contain no-repeat;
}
```

- `currentColor` inside the SVG is the element's CSS `color`, so the icon follows theme changes.
- Supported: paths (including arcs), basic shapes, `<g>` with inherited attributes, `transform`, inline `style=""`, fill and stroke paint, `fill-rule`, opacity, line caps, joins, miter limit, dashes, `preserveAspectRatio`, linear and radial gradients (`gradientUnits`, `gradientTransform`, `spreadMethod`, `href` inheritance), `<use>` and `<symbol>`, `<clipPath>`, and `<image>` with a raster data URL.
- `<style>` sheets with simple selectors (type, `.class`, `#id`).
- Not supported: `<text>`, patterns (a `url(#id)` paint uses its fallback color), masks, filters and markers.

The data URL does not need to be percent encoded: quotes, parentheses and commas inside it are handled.

### Gradients

```css
.a { background: linear-gradient(to right, #f97316, #ec4899); }
.b { background: linear-gradient(45deg, red 0%, red 50%, blue 50%); }
.c { background: radial-gradient(circle at center, rgba(0, 0, 255, 0.3), transparent 70%); }
.d { background: linear-gradient(to right in oklab, red, blue); }
```

Color stops follow CSS Images: missing positions are spread evenly, the first and last default to 0% and 100%, a stop placed before an earlier one moves up to it, and a stop with two positions (`red 10% 30%`) is two stops of the same color. Positions can be lengths (`red 0 20px`), so `repeating-` gradients repeat every few pixels. A radial gradient takes a shape (`circle` or the default `ellipse`) and a size: `closest-side`, `closest-corner`, `farthest-side`, `farthest-corner` (the default) or explicit radii (`circle 40px`, `ellipse 60px 30%`). An interpolation color space (`in oklab`, `in oklch`, `in srgb-linear`, ...) can follow the direction.

| Gradient | iOS | Android | Windows |
| --- | --- | --- | --- |
| `linear-gradient` | yes | yes | yes |
| `radial-gradient` | yes | yes | yes |
| `conic-gradient` | yes | yes | yes |
| `repeating-*-gradient` | yes | yes | yes |

## Borders

### Shorthands and longhands

Every CSS border shorthand is supported and expands into width, style and color longhands, so the cascade resolves each one separately:

```css
.box {
  border: 2px solid #e5e7eb;
  border-bottom: 4px double #111827;
  border-left-color: #6366f1;
}
```

| Group | Properties |
| --- | --- |
| Shorthands | `border`, `border-top`, `border-right`, `border-bottom`, `border-left` |
| Width | `border-width` (1 to 4 values), `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width` |
| Style | `border-style` (1 to 4 values), `border-top-style`, `border-right-style`, `border-bottom-style`, `border-left-style` |
| Color | `border-color` (1 to 4 values), `border-top-color`, `border-right-color`, `border-bottom-color`, `border-left-color` |
| Logical | `border-inline`, `border-block`, `border-inline-start`, `border-inline-end`, `border-block-start`, `border-block-end`, and their `-width`, `-style`, `-color` forms |

Logical borders map for horizontal left-to-right text: inline is left and right, block is top and bottom.

Border styles: `none`, `hidden`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`. Border widths take lengths and the `thin`, `medium` and `thick` keywords.

::: tip px means a CSS pixel
`border: 1px` is one CSS pixel on every platform, the same size as on the web. Use `1dppx` for a hairline that is exactly one device pixel. See [Units](/styling/units).
:::

### border-radius

```css
.pill { border-radius: 9999px; }
.avatar { border-radius: 50%; }
.ticket { border-radius: 16px 16px 4px 4px; }
.blob { border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; }
```

The 1 to 4 value shorthand, the elliptical `/` form, and the per-corner longhands (`border-top-left-radius`, ...) are supported, with lengths or percentages. The logical corners `border-start-start-radius`, `border-start-end-radius`, `border-end-end-radius` and `border-end-start-radius` map to top-left, top-right, bottom-right and bottom-left.

A radius rounds the element's own background and border. As in CSS, children are clipped to the rounded shape only when `overflow` is not `visible`.

### corner-shape

`corner-shape` changes the curve a `border-radius` draws. It needs a non-zero radius.

```css
.squircle {
  border-radius: 24px;
  corner-shape: squircle;
}
```

Values follow the [CSS Borders 4 draft](https://drafts.csswg.org/css-borders-4/#corner-shape-property): `round` (default), `squircle`, `square`, `bevel`, `scoop`, `notch`, or `superellipse(<number> | infinity | -infinity)`. Each keyword is a `superellipse()` value: `round` is 1, `squircle` 2, `square` infinity, `bevel` 0, `scoop` -1 and `notch` -infinity. Values above 1 are squarer than a circle, values between 0 and 1 are flatter, and negative values curve inwards. Like `border-radius`, the shorthand takes 1 to 4 values in corner order (top-left, top-right, bottom-right, bottom-left), and each corner has a longhand: `corner-shape-top-left`, `corner-shape-top-right`, `corner-shape-bottom-right`, `corner-shape-bottom-left`.

### border-image

```css
.frame {
  border: 12px solid transparent;
  border-image: url("data:image/svg+xml,...") 30 round;
}

.gradient-border {
  border: 4px solid;
  border-image: linear-gradient(to right, #f97316, #ec4899) 1;
}
```

The shorthand takes a source (an image URL, an SVG data URL or a gradient), slice values (with optional `fill`), widths, outset and repeat (`stretch`, `repeat`, `round`, `space`). While the source is loading, or if it fails, the normal border is drawn instead, as in CSS. Supported on iOS, Android and Windows.

### Outlines

`outline` is not supported. Use a `box-shadow` with spread (`0 0 0 2px #3b82f6`) for a focus ring.

## Box shadows

```css
.raised {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.pressed {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ring {
  box-shadow: 0 0 0 3px #93c5fd;
}
```

Each layer is `[inset] offset-x offset-y [blur-radius] [spread-radius] [color]`. Multiple layers, `inset` shadows and spread are supported on all platforms. The shadow follows the element's `border-radius`.

### Android shadow backend

On Android, MasonKit renders shadows with `RenderNode` on Android 12 (API 31) and later when the canvas is hardware accelerated, and with bitmaps otherwise. Two functions override this for the whole process, including views already on screen:

```ts
import { setBoxShadowRenderMode, setBoxShadowSoftwareRasterScale } from '@triniwiz/nativescript-masonkit';

if (__ANDROID__) {
  // 'auto' (default), 'render-node' or 'software'
  setBoxShadowRenderMode('software');

  // Software raster scale in (0, 1]; null restores the default downsampling.
  setBoxShadowSoftwareRasterScale(1);
}
```

These are mostly useful for comparing the two backends. They are no-ops on iOS and Windows.
