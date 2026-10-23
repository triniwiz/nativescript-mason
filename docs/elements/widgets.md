# MasonKit widgets

The widgets are exported from `@triniwiz/nativescript-masonkit` and registered in every flavour. Tag names are case-insensitive in templates, so `<View>` and `<view>` are the same element.

| Widget | Default display | Purpose |
| --- | --- | --- |
| [`View`](#view) | `block` | General container. |
| [`Text`](#text) | `block` | Text, with inline children. |
| [`Scroll`](#scroll) | `block` | Container that scrolls vertically when its content overflows. |
| [`Img`](#img) | inline | Image. |
| [`Button`](#button) | `inline-block` | Pressable button with a text label. |
| [`Input`](#input) | `inline-block` | Form control; `type` picks text field, checkbox, slider, ... |
| [`TextArea`](#textarea) | `inline-block` | Multi-line text field. |
| [`Br`](#br) | | Line break inside text. |

Every widget accepts the full set of MasonKit CSS properties, from a stylesheet, a `style` attribute, or `view.style` in code. See [Styling](/styling/).

## View

A plain box. It is `display: block`, so set `display: flex` or `display: grid` to switch layout mode.

```html
<View class="row">
  <View class="avatar" />
  <View class="body">
    <Text>Ada Lovelace</Text>
  </View>
</View>
```

```css
.row { display: flex; align-items: center; gap: 12px; padding: 16px; }
.avatar { width: 48px; height: 48px; border-radius: 24px; background-color: #ddd; }
.body { flex: 1; }
```

A `View` can also be the root of a MasonKit tree inside a regular NativeScript layout (a `GridLayout` cell, a `Page`, ...). It measures itself against the space its parent offers.

## Text

Displays text. Text and inline elements inside it (`span`, `b`, `a`, an inline-block `View`, an `Img`, ...) flow together and wrap as one paragraph.

```html
<Text class="note">
  Saved <span class="dim">2 minutes ago</span>
</Text>
```

In code, `textContent` replaces the element's content with a single string:

```ts
import { Text } from '@triniwiz/nativescript-masonkit';

const label = new Text();
label.textContent = 'Hello';
```

The HTML text elements (`p`, `span`, `h1`, `li`, ...) are `Text` subclasses with their own defaults. See [Text and inline content](/elements/text).

## Scroll

A container that scrolls. Unlike `div` and the other HTML block elements, which only scroll when you set `overflow`, `Scroll` treats the default `overflow: visible` as `auto` on the vertical axis: it scrolls vertically as soon as its content is taller than the box. Horizontal scrolling still needs an explicit `overflow-x`.

```html
<Scroll style="height: 100%">
  <div class="row">First</div>
  <div class="row">Second</div>
  <!-- ... -->
</Scroll>
```

The browser scroll APIs (`scrollTop`, `scrollLeft`, `scrollTo()`, `scrollBy()`, `scrollIntoView()`, the `scroll` and `scrollend` events) work on `Scroll` and on any element with scrolling overflow. See [Scrolling](/guide/scrolling).

## Img

Shows an image from `src`: a remote URL or a local file path. A path starting with `~/` resolves against the app folder.

```html
<Img src="https://example.com/cover.jpg" class="cover" />
<Img src="~/assets/logo.png" style="width: 64px; height: 64px; object-fit: contain" />
```

`Img` is an inline replaced element, as in a browser: it sits on the text baseline and takes its intrinsic size until you size it. With [preflight](/elements/#preflight) it is `display: block`.

`object-fit` (`contain`, `cover`, `fill`, `none`, `scale-down`) and `object-position` control how the image fills its box, and the image is clipped to that box. When only `width` or only `height` is set, the other follows the image's aspect ratio.

`src` can also be an SVG: a `data:image/svg+xml,...` URL, a `.svg` file or a remote `.svg` URL. It is drawn as vectors at the size it is shown, with the same features as [SVG backgrounds](/styling/backgrounds-borders#svg-backgrounds). Its intrinsic size comes from the SVG's `width` and `height`, or its `viewBox`, and `currentColor` inside it is the element's CSS `color`.

```html
<Img src="~/assets/logo.svg" style="width: 120px" />
```

## Button

A button that lays out its label like text. The label comes from the button's children, or from `textContent` in code. It is `inline-block` and centres its label, multi-line labels included.

```html
<Button class="primary">Save changes</Button>
```

```css
.primary { padding: 10px 20px; border-radius: 8px; background-color: #3d5afe; color: white; }
.primary:active { opacity: 0.7; }
```

Handle presses with your flavour's usual `tap` binding, or listen for `click`. `:active` rules apply while it is pressed.

## Input

A form control. `type` takes the HTML input types (`text`, `email`, `password`, `number`, `checkbox`, `radio`, `range`, `date`, `color`, `file`, ...), and `value`, `checked`, `placeholder` and `name` behave as on the web.

```html
<Input type="email" placeholder="you@example.com" />
<Input type="checkbox" name="terms" />
```

What each type renders on each platform, and the events it fires, is covered in [Forms and inputs](/elements/forms).

## TextArea

A multi-line text field.

| Property | Default | Meaning |
| --- | --- | --- |
| `value` | `''` | The text. |
| `placeholder` | `''` | Hint shown while empty. |
| `rows` | `2` | Visible lines, used for the intrinsic height. |
| `cols` | `20` | Average character columns, used for the intrinsic width. |
| `maxLength` | `-1` | Maximum length; `-1` means no limit. |
| `name` | `''` | Form name. |

```html
<TextArea rows="4" placeholder="Leave a comment" />
```

## Br

A line break inside text, like `<br>`:

```html
<p>Line one<Br />Line two</p>
```

## TextNode

`TextNode` is not a tag. It is the DOM-style text node renderers use for raw text between elements, and you rarely touch it directly:

```ts
import { TextNode } from '@triniwiz/nativescript-masonkit';

const node = new TextNode();
node.data = 'Hello';
node.appendData(', world');
```

It has `data`, `length`, `appendData()`, `insertData()`, `deleteData()` and `substringData()`, with DOM semantics.
