# Events

MasonKit elements dispatch DOM-style events: they bubble from the element that was touched up through its Mason ancestors, and listeners receive an `Event` with `target`, `currentTarget`, `stopPropagation()` and `preventDefault()`.

## Listening

`addEventListener` and NativeScript's `on()` are the same thing on a MasonKit element, so use whichever your code already uses.

```ts
import { Event } from '@triniwiz/nativescript-masonkit';

button.addEventListener('click', (event: Event) => {
  console.log('clicked', event.target, event.currentTarget);
});

// Equivalent
button.on('click', onClick);
button.off('click', onClick);
```

`tap` and `click` are the same event. A `tap` listener is registered as a `click` listener, so `(tap)` in Angular, `@tap` in Vue and `on:tap` in Svelte all work on MasonKit elements.

### In each framework

::: code-group

```html [Angular]
<div (tap)="open()">Open</div>
```

```vue [Vue]
<div @tap="open">Open</div>
```

```svelte [Svelte]
<div on:tap={open}>Open</div>
```

```tsx [React]
<div onClick={open}>Open</div>
```

```tsx [Solid]
<div on:click={open}>Open</div>
```

:::

::: warning Solid
In the Solid renderer, use the `on:` namespace (`on:click`, `on:input`, `on:scroll`). `onClick` is not delivered to MasonKit elements.
:::

## Supported events

| Event | Raised by | Bubbles |
|---|---|---|
| `click` (alias `tap`) | Any element with a listener, plus buttons and inputs | Yes |
| `beforeinput`, `input` | `input`, `textarea` | Yes |
| `change` | `input` (text, checkbox, radio, range, date and others) | Yes |
| `focus`, `blur` | Text inputs | Yes |
| `cancel` | Pickers dismissed without a choice (Android color input, Windows) | Yes |
| `scroll`, `scrollend` | Scroll containers | No |
| `keydown`, `compositionstart`, `compositionupdate`, `compositionend` | Text inputs on Windows | Yes |
| `toggle` | `details`, see [details and summary](/elements/details) | No |

Adding a `click` listener is what makes an element tappable, so you do not need a button to make a card clickable:

```html
<div class="card" on:click={select}>...</div>
```

Any other event name (for example `loaded`, `unloaded`, `layoutChanged`) goes through NativeScript's normal event system.

## The `Event` object

| Member | Description |
|---|---|
| `type` | Event name, for example `'click'`. Also available as `eventName`. |
| `target` | The element the event started at. |
| `currentTarget` | The element whose listener is running. Also available as `object`. |
| `bubbles`, `cancelable` | Event flags. `click` and `beforeinput` are always cancelable. |
| `defaultPrevented` | `true` after `preventDefault()` on a cancelable event. |
| `timeStamp` | When the event was created. |
| `isComposing` | `true` during IME composition. |
| `button` | Always `0` (primary), for code that checks `event.button === 0`. |
| `stopPropagation()` | Stop the event reaching ancestors. |
| `stopImmediatePropagation()` | Also skip the remaining listeners on this element. |
| `preventDefault()` | Cancel the default action of a cancelable event. |

### `InputEvent`

`beforeinput` and `input` listeners receive an `InputEvent`, which adds:

| Member | Description |
|---|---|
| `data` | The inserted text, or `null`. For a file input, an array of file URIs. |
| `inputType` | What kind of edit happened, for example `'insertText'`, `'deleteContentBackward'`, `'insertFromPaste'`. |

Calling `preventDefault()` in a `beforeinput` listener rejects the edit:

```ts
import { InputEvent } from '@triniwiz/nativescript-masonkit';

zip.addEventListener('beforeinput', (e: InputEvent) => {
  if (e.data && /\D/.test(e.data)) e.preventDefault();
});
```

On Windows, `keydown` receives a `KeyboardEvent` (`key`, `repeat`, `ctrlKey`, `shiftKey`, `altKey`, `metaKey`) and the composition events receive a `CompositionEvent` (`data`).

## Bubbling

Events travel from the target up through its Mason ancestors, so one listener on a list can handle taps on every row:

```ts
list.addEventListener('click', (e) => {
  const row = e.target;
  if (row !== list) select(row);
});
```

A plain NativeScript view in the middle of the tree is not part of this path. See [Mixing with NativeScript views](/guide/mixing-views).

## Links

An `<a>` with an `href` opens it on click with the platform URL handler. An in-page fragment (`href="#section"`) is not followed; handle it yourself:

```html
<a href="https://nativescript.org">NativeScript</a>
<a href="#faq" on:click={() => faq.scrollIntoView()}>FAQ</a>
```

## Hit testing

`elementFromPoint(x, y)` returns the top-most MasonKit or NativeScript element at a point in the element's own visible coordinate space, or `null`. Coordinates are CSS pixels on every platform, the same unit touch events report.

```ts
const hit = root.elementFromPoint(120, 48);
```
