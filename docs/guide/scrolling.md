# Scrolling

MasonKit draws its own scroll containers instead of wrapping the system scroll view, so any block element can scroll and scroll containers nest freely.

## Which elements scroll

| Element | Default `overflow` (`visible`) | With `overflow: auto` / `scroll` |
|---|---|---|
| `<scroll>` (`Scroll`) | Scrolls vertically when content is taller than the box | Scrolls on the axes you set |
| Block HTML elements: `div`, `section`, `header`, `footer`, `article`, `main`, `nav`, `aside`, `ul`, `ol` and the other block containers | Neither scrolls nor clips, as on the web | Scrolls on the axes you set |

On `<scroll>`, the default only applies to the vertical axis. Horizontal scrolling always needs an explicit `overflow-x: auto` or `overflow-x: scroll`, so a wide flex row does not make the whole screen scroll sideways.

```css
.feed {
  height: 100%;
  overflow-y: auto;
}

.carousel {
  display: flex;
  overflow-x: auto;
  gap: 12px;
}
```

The overflow values behave as in CSS:

| Value | Behaviour |
|---|---|
| `visible` | No scrolling (except the `<scroll>` default above) |
| `hidden`, `clip` | Clips, no user scrolling |
| `auto` | Scrolls only when the content is larger than the box |
| `scroll` | Always scrollable on that axis |

`overflow` takes one or two values (`overflow: hidden auto` sets x, then y), or use `overflow-x` / `overflow-y`.

::: tip Give the container a height
A scroll container needs a bounded size on the scrolling axis. A `height: auto` box grows to fit its content and so never overflows. Use a fixed height, a percentage of a sized parent, `flex: 1` inside a sized flex column, or `max-height`.
:::

## Nested scroll containers

Scroll containers can be nested to any depth, on both axes. A common pattern is a vertical page with horizontal carousels inside it:

```html
<scroll class="page">
  <h2>Featured</h2>
  <div class="carousel">
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
</scroll>
```

### Controlling gestures with `touch-action`

`touch-action` decides which drags a scroll container may start, as in browsers. A scroll view only starts a drag along an axis that every element from the touched one up to the scroll container allows.

```css
/* A slider inside a vertical list: let it own horizontal drags. */
.slider {
  touch-action: pan-y;
}
```

Supported values: `auto`, `none`, `manipulation`, `pan-x`, `pan-left`, `pan-right`, `pan-y`, `pan-up`, `pan-down`, `pinch-zoom`, and combinations such as `pan-x pinch-zoom`.

## Reading and setting the scroll position

Every MasonKit element has the DOM scrolling API. All values are CSS pixels.

| Member | Description |
|---|---|
| `scrollTop`, `scrollLeft` | Current offset. Setting either scrolls, clamped to the scroll range. |
| `scrollWidth`, `scrollHeight` | Content size, never smaller than the client size. Read-only. |
| `clientWidth`, `clientHeight` | Padding box size. Read-only. |
| `scrollTo(x, y)` / `scrollTo(options)` | Scroll to an absolute position. `scroll()` is an alias. |
| `scrollBy(dx, dy)` / `scrollBy(options)` | Scroll by a relative amount. |
| `scrollIntoView(arg?)` | Scroll every scroll container above this element so it is visible. |

Size reads run a pending layout first, so `scrollHeight` is correct right after you add content. Sizes are rounded to whole pixels, as on the web.

```ts
const feed = page.getViewById('feed');

feed.scrollTop = 0;
feed.scrollTo({ top: 200, behavior: 'smooth' });
feed.scrollBy(0, feed.clientHeight); // one page down

const atBottom = feed.scrollTop + feed.clientHeight >= feed.scrollHeight;
```

`ScrollToOptions` takes `left`, `top` and `behavior` (`'auto'`, `'instant'` or `'smooth'`). A missing `left` or `top` leaves that axis where it is. You can call `scrollTo` before the view is created; the request is applied once it exists.

`scrollIntoView` accepts:

- nothing or `true`: align the element to the start of the scroll container
- `false`: align it to the end
- `{ block, inline, behavior }`, where `block` and `inline` are `'start'`, `'center'`, `'end'` or `'nearest'`. `block` defaults to `'start'`, `inline` to `'nearest'`.

```ts
item.scrollIntoView({ block: 'center', behavior: 'smooth' });
```

## Scroll events

Listen for `scroll` while the position changes and `scrollend` once it settles. Neither event bubbles, so add the listener to the scroll container itself. They are only raised for elements that have a listener.

```ts
feed.addEventListener('scroll', () => {
  header.className = feed.scrollTop > 0 ? 'header raised' : 'header';
});

feed.addEventListener('scrollend', () => {
  if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 200) loadMore();
});
```

See [Events](/guide/events) for listener syntax in each framework.

## Reserving space for a scrollbar

`scrollbar-width` reserves layout space for a scrollbar on an `overflow: scroll` axis. It takes a number; the web keywords (`auto`, `thin`, `none`) are not supported.

```css
.panel {
  overflow-y: scroll;
  scrollbar-width: 8;
}
```

## Sticky headers

`position: sticky` works inside MasonKit scroll containers. See [Positioning](/styling/positioning).
