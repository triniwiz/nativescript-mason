# Flexbox

`display: flex` (or `inline-flex`) makes an element a flex container, with the CSS Flexible Box algorithm from the [Taffy](https://github.com/DioxusLabs/taffy) layout engine.

```html
<div class="toolbar">
  <span class="title">Inbox</span>
  <button>Edit</button>
</div>
```

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
}

.title {
  flex: 1;
}
```

## Container properties

| Property | Values |
| --- | --- |
| `flex-direction` | `row` (default), `row-reverse`, `column`, `column-reverse` |
| `flex-wrap` | `wrap`, `wrap-reverse`, `balance`, `balance-reverse`; no wrapping by default |
| `flex-flow` | shorthand: `<direction> <wrap>` in either order |
| `justify-content` | `normal`, `flex-start`, `flex-end`, `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`, `stretch` |
| `align-items` | `normal`, `flex-start`, `flex-end`, `start`, `end`, `center`, `baseline`, `stretch` |
| `align-content` | `normal`, `flex-start`, `flex-end`, `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`, `stretch` |
| `gap`, `row-gap`, `column-gap` | lengths or percentages; `gap` takes `<row> <column>` |
| `place-content` | shorthand: `<align-content> <justify-content>` |
| `place-items` | shorthand: `<align-items> <justify-items>` |

`align-items: normal` (the initial value) behaves as `stretch`, as in CSS.

### Balanced wrapping

`flex-wrap: balance` wraps like `wrap`, then spreads the items so the longest line is as short as possible, rather than filling each line greedily. `balance-reverse` does the same with lines in reverse order. These come from the CSS Flexbox Level 2 draft and aren't in browsers yet.

```css
.tags {
  display: flex;
  flex-wrap: balance;
  gap: 6px;
}
```

## Item properties

| Property | Values |
| --- | --- |
| `flex-grow` | number, default `0` |
| `flex-shrink` | number, default `1` |
| `flex-basis` | `auto` (default), a length or a percentage |
| `flex` | shorthand, see below |
| `align-self` | `normal`, `flex-start`, `flex-end`, `start`, `end`, `center`, `baseline`, `stretch` |
| `place-self` | shorthand: `<align-self> <justify-self>` |

`order` isn't supported: items lay out in document order. Reorder the children instead.

### The `flex` shorthand

The shorthand follows the CSS rules:

| Written | Means |
| --- | --- |
| `flex: 1` | `1 1 0%` |
| `flex: 2 1` | `2 1 0%` |
| `flex: 1 1 auto` | `1 1 auto` |
| `flex: 200px` | `1 1 200px` |
| `flex: auto` | `1 1 auto` |
| `flex: none` | `0 0 auto` |

Note that `flex: 1` sets `flex-basis` to `0%`, not `auto`, so items with `flex: 1` share space equally regardless of content.

## Examples

### Sticky footer column

```css
.screen {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.screen > .content {
  flex: 1;
  overflow-y: auto;
}
```

### Push the last item to the end

```css
.nav {
  display: flex;
  gap: 12px;
}

.nav > .profile {
  margin-left: auto;
}
```

### Wrapping cards

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.cards > .card {
  flex: 1 1 160px;   /* at least 160px, grow to fill the line */
}
```

### Centering

```css
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Inline content in flex containers

Each child of a flex container is its own flex item, as in CSS. Text placed directly in a flex container becomes an anonymous item. To have text and inline elements flow together on one line, wrap them in a block such as `<p>` or `<span>`. See [Block, inline and float](/styling/flow).
